// Alumne: Sorin Chiperi Arnaut
// Codi: u1987503

/**
 * Renderer WebGL2 d'un sol programa de shaders.
 *
 * @class WebGLRenderer
 */
class WebGLRenderer {

    /**
     * Crea una instància del renderer WebGL2.
     *
     * @param {HTMLCanvasElement} canvas - Element canvas HTML on es renderitzarà.
     */
    constructor(canvas) {
        this.context = null;
        this.program = null;
        this.canvas = canvas;

        this.vertexPosAttribute = null;
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
    }

    /**
     * 
     */
    render() {}

    /* ------------------------------ FUNCIONS PRIVADES ------------------------------ */

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