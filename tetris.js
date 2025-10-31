// Alumne: Sorin Chiperi Arnaut
// Codi: u1987503

/**
 * Classe que representa una peça de Tetris.
 *
 * @class
 * @property {number} x - Coordenada horitzontal del punt central de la peça.
 * @property {number} y - Coordenada vertical del punt central de la peça.
 * @property {number} rotation - Rotació en graus (multiples de 90: 0, 90, 180, 270).
 * @property {number} type - Identificador del tipus de peça.
 * @property {number[][] | null} cells - Coordenades de les cel·les de la peça.
 */
class TetrisPiece {
    /**
     * Crea una nova instància de TetrisPiece.
     * @constructor
     */
    constructor() {
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.type = 0;
        this.cells = null;
    }
}

/**
 * Classe que representa l’estat del joc Tetris.
 *
 * @class
 * @property {number[][] | null} grid - Tauler de joc.
 * @property {TetrisPiece | null} nextPiece - Peça següent.
 */
class TetrisSnapshot {
    /**
     * Crea una nova instància de TetrisSnapshot.
     * @constructor
     */
    constructor() {
        this.board = null;
        this.nextPiece = null;
    }
}

/**
 * Classe que gestiona la lògica del joc Tetris.
 *
 * @class Tetris
 */
class Tetris {
    /**
     * Amplada del tauler de Tetris en cel·les.
     * @static
     * @constant {number}
     */
    static BOARD_WIDTH = 10;
    /**
     * Alçada del tauler de Tetris en cel·les.
     * @static
     * @constant {number}
     */
    static BOARD_HEIGHT = 20;
    /**
     * Nombre total de tipus de peces diferents disponibles al joc.
     * @static
     * @constant {number}
     */
    static TOTAL_PIECE_TYPES = 7;
    /**
     * Nom de cada tipus de peça.
     * @static
     * @constant {Object<number, string>}
     */
    static PIECE_TYPES = {
        1: "I",
        2: "O",
        3: "T",
        4: "S",
        5: "Z",
        6: "L",
        7: "J"
    };
    /**
     * Nombre de cel·les que ocupa cada tipus de peça.
     * @static
     * @constant {Object<number, number>}
     */
    static TOTAL_CELLS_PIECE_TYPES = {
        1: 4,
        2: 4,
        3: 4,
        4: 4,
        5: 4,
        6: 4,
        7: 4
    };

    /**
     * Crea una nova instància del joc Tetris.
     * @constructor
     */
    constructor() {
        this.board = null;
        this.currentPiece = null;
        this.nextPiece = null;
        this.gameState = -1;    //Estat del joc (-1: no inicialitzat, 0: en marxa, 1: acabat).
    }

    /**
     * Inicialitza el joc creant un tauler buit i les primeres peçes.
     * @returns {void}
     */
    initGame() {
        this.board = Array(Tetris.BOARD_HEIGHT);
        for (let i = 0; i < Tetris.BOARD_HEIGHT; i++) {
            this.board[i] = Array(Tetris.BOARD_WIDTH);
            for (let j = 0; j < Tetris.BOARD_WIDTH; j++) {
                this.board[i][j] = 0;
            }
        }

        this.currentPiece = this.#createPiece();
        this.nextPiece = this.#createPiece();
        this.gameState = 0;
    }

    /**
     * Mou la peça actual en la direcció especificada si la nova posició és vàlida.
     * Si la peça no es pot moure cap avall, la col·loca al tauler.
     *
     * @param {string} direction - Direcció del moviment: "left", "right" o "down".
     * @returns {void}
     */
    movePiece(direction) {
        if (this.gameState !== 0) {
            return;
        }
        if (!this.#canMove(this.currentPiece, direction)) {
            if (direction === "down") {
                this.#placePiece(this.currentPiece);
                this.currentPiece = this.nextPiece;
                this.nextPiece = this.#createPiece();
                this.#fixPieceCollisions(this.currentPiece);
                this.#checkGameover();
            }
            return;
        }

        switch (direction) {
            case "left":
                this.currentPiece.x--;
                break;
            case "right":
                this.currentPiece.x++;
                break;
            case "down":
                this.currentPiece.y--;
                break;
        }

        this.currentPiece.cells = this.#getPieceCells(this.currentPiece);
    }

    /**
     * Rota la peça actual 90 graus en sentit horari i ajusta la seva posició si és necessari.
     * @returns {void}
     */
    rotatePiece() {
        if (this.gameState !== 0) {
            return;
        }

        const rotation = this.currentPiece.rotation;

        if (rotation < 270) {
            this.currentPiece.rotation += 90;
        }
        else {
            this.currentPiece.rotation = 0;
        }

        this.currentPiece.cells = this.#getPieceCells(this.currentPiece);
        this.#fixPiecePosition(this.currentPiece);
        this.#fixPieceCollisions(this.currentPiece);
    }

    /**
     * Deixa caure la peça actual fins que col·lisioni amb el terra o una altra peça.
     * @returns {void}
     */
    dropPiece() {
        if (this.gameState !== 0) {
            return;
        }

        while (this.#canMove(this.currentPiece, "down")) {
            this.currentPiece.y--;
            this.currentPiece.cells = this.#getPieceCells(this.currentPiece);
        }

        this.#placePiece(this.currentPiece);
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.#createPiece();
        this.#fixPieceCollisions(this.currentPiece);
        this.#checkGameover();
        this.#checkLines();
    }

    /**
     * Comprova si el joc ha acabat.
     * @returns {boolean} true si el joc ha acabat.
     */
    isGameover() {
        return this.gameState === 1;
    }

    /**
     * Retorna una snapshot de l’estat actual del joc.
     *
     * @returns {TetrisSnapshot} l'estat actual del joc.
     */
    gameSnapshot() {
        const currentPieceType = this.currentPiece.type;
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[currentPieceType];
        let snapshot = new TetrisSnapshot();

        snapshot.board = structuredClone(this.board);
        snapshot.nextPiece = structuredClone(this.nextPiece);

        for (let i = 0; i < totalCells; i++) {
            const x = this.currentPiece.cells[i][0];
            const y = this.currentPiece.cells[i][1];

            if (y < Tetris.BOARD_HEIGHT) {
                snapshot.board[y][x] = currentPieceType;
            }
        }

        return snapshot;
    }

    /* ------------------------------ FUNCIONS PRIVADES ------------------------------ */

    /**
     * Comprova si la peça actual ha causat game over.
     * @private
     * @returns {void}
     */
    #checkGameover() {
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[this.currentPiece.type];

        let counter = 0;
        for (let i = 0; i < totalCells; i++) {
            const y = this.currentPiece.cells[i][1];
            if (y >= Tetris.BOARD_HEIGHT) {
                counter++;
            }
        }
        if (counter === totalCells) {
            this.gameState = 1;
        }
    }

    /**
     * Comprova quines files del tauler estan completament plenes i les elimina.
     * @returns {void}
     */
    #checkLines() {
        if (this.gameState !== 0) {
            return;
        }

        let linesCompleted = [];

        for (let i = Tetris.BOARD_HEIGHT-1; i >= 0; i--) {
            let lineCompleted = true;
            let j = 0;
            while (j < Tetris.BOARD_WIDTH && lineCompleted) {
                if (this.board[i][j] === 0) {
                    lineCompleted = false;
                }
                else j++;
            }
            if (lineCompleted) {
                linesCompleted.push(i);
            }
        }

        this.#eraseLines(linesCompleted);
    }

    /**
     * Col·loca una peça al tauler marcant les seves cel·les com ocupades.
     * @private
     * @param {TetrisPiece} piece - Peça a col·locar al tauler.
     * @returns {void}
     */
    #placePiece(piece) {
        const type = piece.type;
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[type];

        for (let i = 0; i < totalCells; i++) {
            const x = piece.cells[i][0];
            const y = piece.cells[i][1];

            if (y < Tetris.BOARD_HEIGHT) {
                this.board[y][x] = type;
            }
        }
    }

    /**
     * Elimina les files indicades del tauler i insereix files buides a la part superior.
     * Manté la mida del tauler constant.
     * @private
     * @param {number[]} lines - Índexs de files a eliminar.
     * @returns {void}
     */
    #eraseLines(lines) {
        for (let i = 0; i < lines.length; i++) {
            const newLine = new Array(Tetris.BOARD_WIDTH).fill(0);

            this.board.splice(lines[i], 1);
            this.board.push(newLine);
        }
    }

    /**
     * Comprova si una peça pot moure's en una direcció específica.
     * @private
     * @param {TetrisPiece} piece - La peça a moure.
     * @param {string} direction - Direcció del moviment: 'left', 'right', 'down'.
     * @returns {boolean} true si el moviment és possible.
     */
    #canMove(piece, direction) {
        switch (direction) {
            case 'left':
                return !this.#hasCollision(piece, -1, 0);
            case 'right':
                return !this.#hasCollision(piece, 1, 0);
            case 'down':
                return !this.#hasCollision(piece, 0, -1);
            default:
                return false;
        }
    }

    /**
     * Ajusta la posició d'una peça per assegurar-se que estigui dins dels límits del tauler.
     *
     * @private
     * @param {TetrisPiece} piece - La peça que s'ha d'ajustar.
     * @returns {void}
     * @description
     * La funció realitza els següents ajustaments en aquest ordre:
     * 1. Si la peça surt pel costat esquerre, la mou cap a la dreta
     * 2. Si la peça surt pel costat dret, la mou cap a l'esquerra
     * 3. Si la peça surt per la part inferior, la mou cap amunt
     *
     * Cada ajustament modifica tant la posició central de la peça
     * com les coordenades absolutes de totes les seves cel·les.
     */
    #fixPiecePosition(piece) {
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[piece.type];

        // Manté la peça dins del límit lateral esquerre.
        while (!this.#isWithinLeftBound(piece)) {
            piece.x += 1;
            for (let i = 0; i < totalCells; i++) {
                piece.cells[i][0] += 1;
            }
        }

        // Manté la peça dins del límit lateral dret.
        while (!this.#isWithinRightBound(piece)) {
            piece.x -= 1;
            for (let i = 0; i < totalCells; i++) {
                piece.cells[i][0] -= 1;
            }
        }

        // Manté la peça dins del límit vertical inferior.
        while (!this.#isWithinBottomBound(piece)) {
            piece.y += 1;
            for (let i = 0; i < totalCells; i++) {
                piece.cells[i][1] += 1;
            }
        }
    }

    /**
     * Ajusta la posició d'una peça per evitar col·lisions amb altres peces.
     * @private
     * @param {TetrisPiece} piece - La peça que s'ha d'ajustar.
     * @returns {void}
     */
    #fixPieceCollisions(piece) {
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[piece.type];

        while (this.#hasCollision(piece, 0, 0)) {
            piece.y += 1;
            for (let i = 0; i < totalCells; i++) {
                piece.cells[i][1] += 1;
            }
        }
    }

    /**
     * Crea una nova peça de tipus aleatori, posicionada a un punt central i amb rotació 0.
     * També calcula les seves cel·les inicials.
     * @private
     * @returns {TetrisPiece} La peça creada.
     */
    #createPiece() {
        let piece = new TetrisPiece();
        const randomType = this.#getRandomNumber(1, Tetris.TOTAL_PIECE_TYPES);

        piece.x = Math.floor((Tetris.BOARD_WIDTH-1)/2);
        piece.y = Tetris.BOARD_HEIGHT-2;
        piece.rotation = 0;
        piece.type = randomType;
        piece.cells = this.#getPieceCells(piece);

        return piece;
    }

    /**
     * Aplica una rotació de 90° en sentit horari a un punt 2D.
     * @private
     * @param {[number, number]} coords - Punt a rotar.
     * @returns {[number, number]} El punt rotat.
     */
    #rotateClockwise([x, y]) {
        return [y, -x];
    }

    /**
     * Aplica una rotació de 90° en sentit antihorari a un punt 2D.
     * @private
     * @param {[number, number]} coords - Punt a rotar.
     * @returns {[number, number]} El punt rotat.
     */
    #rotateCounterClockwise([x, y]) {
        return [-y, x];
    }

    /**
     * Calcula les coordenades de les cel·les que formen la peça, a partir
     * de la seva posició central, tipus i rotació.
     * @private
     * @param {TetrisPiece} piece - Peça d'entrada.
     * @returns {number[][]} Llista de cel·les que ocupa la peça.
     */
    #getPieceCells(piece) {
        const type = piece.type;
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[type];
        const stepsRotation = Math.trunc(piece.rotation / 90);
        let pieceCells = [];
        let offset = [];

        // Inicialitza les cel·les.
        for (let i = 0; i < totalCells; i++) {
            pieceCells.push([piece.x, piece.y]);
        }

        switch (Tetris.PIECE_TYPES[type]) {
            case "I":
                offset = [[ 0, 0],
                          [-1, 0],
                          [ 1, 0],
                          [ 2, 0]];
                break;
            case "O":
                offset = [[ 0, 0],
                          [ 1, 0],
                          [ 1, 1],
                          [ 0, 1]];
                break;
            case "T":
                offset = [[ 0, 0],
                          [-1, 0],
                          [ 1, 0],
                          [ 0, 1]];
                break;
            case "S":
                offset = [[ 0, 0],
                          [-1, 0],
                          [ 0, 1],
                          [ 1, 1]];
                break;
            case "Z":
                offset = [[ 0, 0],
                          [ 1, 0],
                          [ 0, 1],
                          [-1, 1]];
                break;
            case "L":
                offset = [[ 0, 0],
                          [-1, 0],
                          [-1,-1],
                          [ 1, 0]];
                break;
            case "J":
                offset = [[ 0, 0],
                          [-1, 0],
                          [-1, 1],
                          [ 1, 0]];
                break;
        }

        // Aplica la rotació a les cel·les.
        if (Tetris.PIECE_TYPES[type] !== "O") {
            for (let i = 0; i < stepsRotation; i++) {
                for (let j = 0; j < totalCells; j++) {
                    offset[j] = this.#rotateClockwise(offset[j]);
                }
            }
        }

        // Calcula la posició final de les cel·les.
        for (let i = 0; i < totalCells; i++) {
            pieceCells[i][0] += offset[i][0];
            pieceCells[i][1] += offset[i][1];
        }

        return pieceCells;
    }

    /**
     * Genera un enter aleatori en un rang de valors.
     * @private
     * @param {number} min - Valor mínim (inclòs).
     * @param {number} max - Valor màxim (inclòs).
     * @returns {number} Enter generat.
     */
    #getRandomNumber(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
    }

    /**
     * Detecta si una peça col·lisiona amb altres peces o amb els límits del tauler.
     * @private
     * @param {TetrisPiece} piece - La peça per la qual es vol comprovar la col·lisió.
     * @param {number} [offsetX=0] - Desplaçament horitzontal per comprovar (per moviments).
     * @param {number} [offsetY=0] - Desplaçament vertical per comprovar (per moviments).
     * @returns {boolean} true si hi ha col·lisió.
     */
    #hasCollision(piece, offsetX = 0, offsetY = 0) {
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[piece.type];

        for (let i = 0; i < totalCells; i++) {
            const x = piece.cells[i][0] + offsetX;
            const y = piece.cells[i][1] + offsetY;

            // Comprova si la cel·la es troba fora dels límits del tauler.
            if (x < 0 || x >= Tetris.BOARD_WIDTH || y < 0) {
                return true;
            }

            // Comprova si la cel·la està ocupada per una peça ja col·locada.
            if (y < Tetris.BOARD_HEIGHT && this.board[y][x] !== 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Comprova si totes les cel·les de la peça estan dins del límit esquerre.
     * @private
     * @param {TetrisPiece} piece - Peça a comprovar.
     * @returns {boolean} cert si està dins del límit esquerre.
     */
    #isWithinLeftBound(piece) {
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[piece.type];
        for (let i = 0; i < totalCells; i++) {
            const x = piece.cells[i][0];
            if (x < 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Comprova si totes les cel·les de la peça estan dins del límit dret.
     * @private
     * @param {TetrisPiece} piece - Peça a comprovar.
     * @returns {boolean} cert si està dins del límit dret.
     */
    #isWithinRightBound(piece) {
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[piece.type];
        for (let i = 0; i < totalCells; i++) {
            const x = piece.cells[i][0];
            if (x >= Tetris.BOARD_WIDTH) {
                return false;
            }
        }
        return true;
    }

    /**
     * Comprova si totes les cel·les de la peça estan dins del límit inferior.
     * @private
     * @param {TetrisPiece} piece - Peça a comprovar.
     * @returns {boolean} cert si està dins del límit inferior.
     */
    #isWithinBottomBound(piece) {
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[piece.type];
        for (let i = 0; i < totalCells; i++) {
            const y = piece.cells[i][1];
            if (y < 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Comprova si totes les cel·les de la peça estan dins del límit superior.
     * @private
     * @param {TetrisPiece} piece - Peça a comprovar.
     * @returns {boolean} cert si està dins del límit superior.
     */
    #isWithinTopBound(piece) {
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[piece.type];
        for (let i = 0; i < totalCells; i++) {
            const y = piece.cells[i][1];
            if (y >= Tetris.BOARD_HEIGHT) {
                return false;
            }
        }
        return true;
    }

}