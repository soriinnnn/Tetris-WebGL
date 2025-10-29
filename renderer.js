// Alumne: Sorin Chiperi Arnaut
// Codi: u1987503

/**
 * Renderer WebGL2 d'un sol programa de shaders.
 *
 * @class TetrisRenderer
 */
class TetrisRenderer {

    /**
     * Crea una instància del renderer WebGL2.
     *
     * @param {HTMLCanvasElement} canvas - Element canvas HTML on es renderitzarà.
     */
    constructor(canvas) {
        this.context = null;
        this.program = null;
        this.canvas = canvas;

        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.indexLength = 0;

        this.vertexPosAttribute = null;
        this.fragmentColor = null;
    }

    /**
     * Inicialitza el renderer WebGL2 amb els shaders especificats.
     *
     * @param {string} vertexSrc - Codi font del vertex shader.
     * @param {string} fragmentSrc - Codi font del fragment shader.
     * @throws {string} Error si WebGL2 no està disponible o els shaders no compilen.
     */
    init(vertexSrc, fragmentSrc) {
        this.#getWebGLContext();
        this.#initShaderProgram(vertexSrc, fragmentSrc);
        this.context.useProgram(this.program);

        this.vertexPosAttribute = this.context.getAttribLocation(this.program, "vertexPos");
        this.context.enableVertexAttribArray(this.vertexPosAttribute);
        this.fragmentColor = this.context.getUniformLocation(this.program, "uniformColor");
        this.vertexOffset = this.context.getUniformLocation(this.program, "uniformOffset");

        this.context.uniform2fv(this.vertexOffset, [-1.0, -1.0]);
    }

    initBuffers(model) {
        let vertexArray = new Float32Array(model.vertexs);
        let indexArray = new Uint16Array(model.indexs);

        this.vertexBuffer = this.context.createBuffer();
        this.context.bindBuffer(this.context.ARRAY_BUFFER, this.vertexBuffer);
        this.context.bufferData(this.context.ARRAY_BUFFER, vertexArray, this.context.STATIC_DRAW);

        this.indexBuffer = this.context.createBuffer();
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.context.bufferData(this.context.ELEMENT_ARRAY_BUFFER, indexArray, this.context.STATIC_DRAW);
        this.indexLength = model.indexs.length;
    }

    /**
     * 
     */
    draw() {
        this.context.clear(this.context.COLOR_BUFFER_BIT);
        this.context.bindBuffer(this.context.ARRAY_BUFFER, this.vertexBuffer);
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.context.vertexAttribPointer(this.vertexPosAttribute, 2, this.context.FLOAT, false, 0, 0);

        this.context.uniform4fv(this.fragmentColor, [1.0, 1.0, 1.0, 1.0]);
        this.#drawTriangles();

        this.context.uniform4fv(this.fragmentColor, [0.0, 0.0, 0.0, 1.0]);
        this.#drawLines();
    }

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

    /* ------------------------------ FUNCIONS PRIVADES ------------------------------ */

    #drawLines() {
        this.context.drawElements(this.context.LINES, this.indexLength, this.context.UNSIGNED_SHORT, 0);
    }

    #drawTriangles() {
        let indexCount = 3;
        let indexSize = Uint16Array.BYTES_PER_ELEMENT;

        for (let i = 0; i < this.indexLength; i += indexCount) {
            const offset = i * indexSize;
            this.context.drawElements(this.context.TRIANGLES, indexCount, this.context.UNSIGNED_SHORT, offset);
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
}