// Alumne: Sorin Chiperi Arnaut
// Codi: u1987503

/**
 * Classe que renderitza el joc Tetris.
 *
 * @class TetrisRenderer
 */
class TetrisRenderer {
    /**
     * Mida per defecte dels punts que es dibuixen (en píxels).
     * @static
     * @type {number}
     */
    static POINT_SIZE = 5.0;
    /**
     * Color per defecte de les línies del tauler (WebGL).
     * @static
     * @type {number[]}
     */
    static LINES_COLOR = [1.0, 1.0, 1.0, 1.0];
    /**
     * Colors de cada tipus de peça en format RGB (0-255).
     * @static
     * @constant {Object<number, Array<number>>}
     */
    static PIECE_COLORS = {
        1: [0, 255, 255],    // cyan
        2: [255, 255, 0],    // yellow
        3: [255, 0, 255],    // purple
        4: [0, 255, 0],      // green
        5: [255, 0, 0],      // red
        6: [255, 165, 0],    // orange
        7: [0, 0, 255]       // blue
    };
    /**
     * Color de les cel·les buides del tauler en format RGB (0-255).
     * @static
     * @type {number[]}
     */
    static EMPTY_CELL_COLOR = [60, 70, 80];

    /**
     * Crea una instància del renderer.
     *
     * @param {HTMLCanvasElement} canvas - Element canvas HTML on es renderitzarà.
     */
    constructor(canvas) {
        this.context = null;
        this.program = null;
        this.canvas = canvas;
        this.model = null;
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.vertexPosAttribute = null;

        // Variables uniform...
        this.vertexOffset = null;
        this.pointSize = null;
        this.fragmentColor = null;
    }

    /**
     * Inicialitza el renderer amb el programa WebGL i la geometria del tauler.
     *
     * @param {string} vertexSrc - Codi font del vertex shader.
     * @param {string} fragmentSrc - Codi font del fragment shader.
     * @param {number} rows - Nombre de files del tauler de joc.
     * @param {number} columns - Nombre de columnes del tauler de joc.
     * @throws {string} Si el context WebGL2 no es pot obtenir o si algun shader falla.
     */
    init(vertexSrc, fragmentSrc, rows, columns) {
        this.#getWebGLContext();
        this.#initShaderProgram(vertexSrc, fragmentSrc);
        this.context.useProgram(this.program);

        this.vertexPosAttribute = this.context.getAttribLocation(this.program, "vertexPos");
        this.context.enableVertexAttribArray(this.vertexPosAttribute);
        this.vertexOffset = this.context.getUniformLocation(this.program, "uniformOffset");
        this.pointSize = this.context.getUniformLocation(this.program, "uniformPointSize");
        this.fragmentColor = this.context.getUniformLocation(this.program, "uniformColor");
        this.model = TetrisRenderer.makeBoard(rows, columns);

        this.#initBuffers();
        this.context.uniform1f(this.pointSize, TetrisRenderer.POINT_SIZE);

        // PER CANVIAR
        this.context.uniform2fv(this.vertexOffset, [-1.0, -1.0]);
    }

    /**
     * Dibuixa l’estat actual del joc.
     *
     * @param {TetrisSnapshot} snapshot - Estat del joc.
     * @returns {void}
     */
    draw(snapshot) {
        const colors = this.#getBoardColors(snapshot.board);

        this.context.clear(this.context.COLOR_BUFFER_BIT);
        this.context.bindBuffer(this.context.ARRAY_BUFFER, this.vertexBuffer);
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.context.vertexAttribPointer(this.vertexPosAttribute, 2, this.context.FLOAT, false, 0, 0);

        this.#drawTriangles(colors);
        this.#drawLines();
        this.#drawPoints();
    }

    /**
     * Genera el model geomètric del tauler (vèrtexs i índexs dels quadres).
     *
     * @description
     * L’array d’índexs recorre les cel·les per files (de dalt a baix) i columnes (d’esquerra a dreta).
     * Cada cel·la es descompon en dos triangles en sentit horari, i cada triangle es descriu amb un grup de 3 índexs.
     *
     * @static
     * @param {number} rows - Nombre de files.
     * @param {number} columns - Nombre de columnes.
     * @returns {{vertexs: number[], indexs: number[]}} Arrays de vèrtexs i índexs.
     */
    static makeBoard(rows, columns) {
        if (rows < 2) rows = 2;
        if (columns < 2) columns = 2;

        let vertexs = [];
        let indexs = [];
        let stepX = 2.0 / columns;
        let stepY = 2.0 / rows;

        // Crea els vèrtexs.
        for (let row = 0; row <= rows; row++) {
            const y = row * stepY;
            for (let col = 0; col <= columns; col++) {
                const x = col * stepX;
                vertexs.push(x, y);
            }
        }

        // Crea l'ordre de creació dels triangles en sentit horari.
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const topLeft = row * (columns+1) + col;
                const topRight = topLeft + 1;
                const bottomLeft = (row + 1) * (columns + 1) + col;
                const bottomRight = bottomLeft + 1;

                // Els elements es tracten com si fossin d'una matriu on l'eix Y es troba invertit.
                indexs.push(topLeft,  bottomLeft, topRight,
                            topRight, bottomLeft, bottomRight);
            }
        }

        return {vertexs, indexs};
    }

    /**
     * Normalitza un color en format RGB/RGBA de [0, 255] a [0.0, 1.0].
     *
     * @static
     * @param {number[]} color - Components del color. Es poden ometre components; l’alfa s’assumeix 1.0.
     * @returns {number[]} Components normalitzats en el rang [0.0, 1.0] amb quatre valors (RGBA).
     */
    static normalizeColor(color) {
        let c = [0.0, 0.0, 0.0, 1.0];

        for (let i = 0; i < color.length; i++) {
            c[i] = color[i] / 255.0;
        }

        return c;
    }

    /* ------------------------------ FUNCIONS PRIVADES ------------------------------ */

    /**
     * Construeix la llista de colors per cel·la a partir d’un tauler.
     *
     * @private
     * @param {number[][]} board - Matriu amb els identificadors de peça per cada cel·la.
     * @returns {number[][]} Array de colors en RGB (0-255) per cada cel·la del tauler.
     */
    #getBoardColors(board) {
        let colors = [];

        for (let i = 0; i < Tetris.BOARD_HEIGHT; i++) {
            for (let j = 0; j < Tetris.BOARD_WIDTH; j++) {
                let type = board[i][j];

                if (type > 0) {
                    colors.push(TetrisRenderer.PIECE_COLORS[type]);
                }
                else {
                    colors.push(TetrisRenderer.EMPTY_CELL_COLOR);
                }
            }
        }

        return colors;
    }

    #drawPoints() {
        const vertexLength = this.model.vertexs.length;

        this.context.uniform4fv(this.fragmentColor, TetrisRenderer.LINES_COLOR);
        this.context.drawArrays(this.context.POINTS, 0, vertexLength);
    }

    /**
     * Dibuixa les línies de la quadrícula.
     *
     * @private
     * @returns {void}
     */
    #drawLines() {
        const indexLength = this.model.indexs.length;

        this.context.uniform4fv(this.fragmentColor, TetrisRenderer.LINES_COLOR);
        this.context.drawElements(this.context.LINES, indexLength, this.context.UNSIGNED_SHORT, 0);
    }

    /**
     * Omple cada cel·la amb el color corresponent, dibuixant els triangles que la formen.
     *
     * @private
     * @param {number[][]} cellsColor - Colors en RGB (0-255) per cel·la; es normalitzen abans de pintar.
     * @returns {void}
     */
    #drawTriangles(cellsColor) {
        const indexLength = this.model.indexs.length;
        const indexSize = Uint16Array.BYTES_PER_ELEMENT;
        const indexCount = 6;

        for (let i = 0; i < indexLength; i += indexCount) {
            const offset = i * indexSize;
            const color = TetrisRenderer.normalizeColor(cellsColor[i/indexCount]);

            this.context.uniform4fv(this.fragmentColor, color);
            this.context.drawElements(this.context.TRIANGLES, indexCount, this.context.UNSIGNED_SHORT, offset);
        }
    }

    /**
     * Crea i associa els buffers de vèrtexs i índexs del model.
     *
     * @private
     * @returns {void}
     */
    #initBuffers() {
        let vertexArray = new Float32Array(this.model.vertexs);
        let indexArray = new Uint16Array(this.model.indexs);

        this.vertexBuffer = this.context.createBuffer();
        this.context.bindBuffer(this.context.ARRAY_BUFFER, this.vertexBuffer);
        this.context.bufferData(this.context.ARRAY_BUFFER, vertexArray, this.context.STATIC_DRAW);

        this.indexBuffer = this.context.createBuffer();
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.context.bufferData(this.context.ELEMENT_ARRAY_BUFFER, indexArray, this.context.STATIC_DRAW);
    }

    /**
     * Crea i compila un shader WebGL2.
     *
     * @private
     * @param {number} type - Tipus de shader.
     * @param {string} source - Codi font del shader.
     * @returns {WebGLShader} El shader compilat.
     */
    #initShader(type, source) {
        let shader;

        shader = this.context.createShader(type);
        this.context.shaderSource(shader, source);
        this.context.compileShader(shader);
        if (!this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)) {
            throw this.context.getShaderInfoLog(shader);
        }

        return shader;
    }

    /**
     * Crea el programa WebGL2 combinant vertex i fragment shaders.
     *
     * @private
     * @param {string} vertexSrc - Codi font del vertex shader.
     * @param {string} fragmentSrc - Codi font del fragment shader.
     */
    #initShaderProgram(vertexSrc, fragmentSrc) {
        let vertexShader;
        let fragmentShader;

        vertexShader = this.#initShader(this.context.VERTEX_SHADER, vertexSrc);
        fragmentShader = this.#initShader(this.context.FRAGMENT_SHADER, fragmentSrc);

        this.program = this.context.createProgram();
        this.context.attachShader(this.program, vertexShader);
        this.context.attachShader(this.program, fragmentShader);
        this.context.linkProgram(this.program);
        if (!this.context.getProgramParameter(this.program, this.context.LINK_STATUS)) {
            throw this.context.getProgramInfoLog(this.program);
        }
    }

    /**
     * Obté el context WebGL2 del canvas.
     *
     * @private
     */
    #getWebGLContext() {
        this.context = this.canvas.getContext("webgl2");
        if (!this.context) {
            throw "WebGL 2.0 no està disponible.";
        }
    }
}