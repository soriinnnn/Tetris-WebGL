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
    constructor() {
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.type = 0;
        this.cells = null;
    }
}

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

    constructor() {
        this.board = null;
        this.currentPiece = null;
        this.nextPiece = null;
        this.gameState = -1; // 0 = Partida en marxa, 1 = Partida acabada.
    }

    initGame() {
        this.board = Array(Tetris.BOARD_HEIGHT);
        for (let i = 0; i < Tetris.BOARD_HEIGHT; i++) {
            this.board[i] = Array(Tetris.BOARD_WIDTH).fill(0);
        }

        this.currentPiece = this.#createPiece();
        this.nextPiece = this.#createPiece();
        this.gameState = 0;
    }

    /**
     * Mou la peça actual en la direcció especificada si la nova posició és vàlida.
     *
     * @param {string} direction - direcció del moviment: "R" (dreta) o "L" (esquerra).
     * @returns {void}
     */
    movePiece(direction) {
        if (this.gameState !== 0) {
            return;
        }
        if (direction !== "R" && direction !== "L") {
            return;
        }

        let piece = structuredClone(this.currentPiece);

        if (direction === "R") {
            piece.x++;
            piece.cells = this.#getPieceCells(piece);
        }
        else if (direction === "L") {
            piece.x--;
            piece.cells = this.#getPieceCells(piece);
        }

        if (this.#isValidPosition(piece)) {
            this.currentPiece = piece;
        }
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

        this.#checkWallKicks(this.currentPiece);
        this.#checkFloorKicks(this.currentPiece);
    }

    /**
     * Deixa caure la peça actual una cel·la cap avall i fixa la peça si no es pot fer el moviment.
     * Si després de fixar la peça hi ha col·lisió, marca el joc com a acabat.
     *
     * @returns {void}
     */
    dropPiece() {
        if (this.gameState !== 0) {
            return;
        }

        let piece = structuredClone(this.currentPiece);

        piece.y--;
        piece.cells = this.#getPieceCells(piece);

        if (this.#isValidPosition(piece)) {
            this.currentPiece = piece;
        }
        else {
            this.#placePiece();
            // Comprova si hi ha gameover.
            if (this.#hasCollision(this.currentPiece))
                this.gameState = 1;
        }
    }

    /**
     * Comprova quines files del tauler estan completament plenes i les elimina.
     * @returns {void}
     */
    checkLines() {
        if (this.gameState !== 0) {
            return;
        }

        let linesCompleted = Array();

        for (let i = Tetris.BOARD_HEIGHT-1; i >= 0; i--) {
            let lineComplete = true;

            let j = 0;
            while (j < Tetris.BOARD_WIDTH && lineComplete) {
                if (this.board[i][j] === 0) {
                    lineComplete = false;
                }
                else j++;
            }

            if (lineComplete) {
                linesCompleted.push(i);
            }
        }

        this.#eraseLines(linesCompleted);
    }
	
	// PER TREURE/MODIFICAR
    display() {
        console.clear();
        console.log("=== TETRIS ===");
        console.log(`Current Piece: ${Tetris.PIECE_TYPES[this.currentPiece.type]}`);
        console.log(`Next Piece: ${Tetris.PIECE_TYPES[this.nextPiece.type]}`);
        console.log("");

        // Crea una còpia del board per mostrar.
        let displayBoard = Array(Tetris.BOARD_HEIGHT);
        for (let i = 0; i < Tetris.BOARD_HEIGHT; i++) {
            displayBoard[i] = Array(Tetris.BOARD_WIDTH);

            for (let j = 0; j < Tetris.BOARD_WIDTH; j++) {
                displayBoard[i][j] = this.board[i][j];
            }
        }

        // Afegeix la peça actual al display
        for (let i = 0; i < this.currentPiece.cells.length; i++) {
            const x = this.currentPiece.cells[i][0];
            const y = this.currentPiece.cells[i][1];

            if (x >= 0 && x < Tetris.BOARD_WIDTH && y >= 0 && y < Tetris.BOARD_HEIGHT) {
                displayBoard[y][x] = this.currentPiece.type;
            }
        }

        // Mostra el board.
        for (let i = Tetris.BOARD_HEIGHT-1; i >= 0; i--) {
            let line = "";
            for (let j = 0; j < Tetris.BOARD_WIDTH; j++) {
                    line += `${displayBoard[i][j]} `;
            }
            console.log(line);
        }
        console.log("");
        console.log("Controls: A/D = Left/Right, S = Drop");
    }

	// PER TREURE/MODIFICAR
    play() {
        this.initGame();

        const gameLoop = () => {
            if (this.gameState === 0) {
                this.display();

                // Estratègia de joc més intel·ligent
                const randomMove = Math.random();
/*
                if (randomMove < 0.1) {
                    // 10% de probabilitat de rotar
                    this.rotatePiece();
                } else if (randomMove < 0.3) {
                    // 20% de probabilitat de moure esquerra
                    this.movePiece('L');
                } else if (randomMove < 0.5) {
                    // 20% de probabilitat de moure dreta
                    this.movePiece('R');
                } else {
                    // 50% de probabilitat de deixar caure
                    this.dropPiece();
                }*/

                if (randomMove < 0.5) {
                    // 10% de probabilitat de rotar
                    this.rotatePiece();
                } else {
                    // 50% de probabilitat de deixar caure
                    this.dropPiece();
                }

                // Comprova línies després de cada moviment
                this.checkLines();

                // Si el joc ha acabat, mostra missatge
                if (this.gameState === 1) {
                    console.log("=== GAME OVER ===");
                    return;
                }

                setTimeout(gameLoop, 800); // Velocitat lleugerament més ràpida
            }
        };

        gameLoop();
    }

    /* ------------------------------ FUNCIONS PRIVADES ------------------------------ */

    /**
     * Ajusta la peça lateralment perquè entri dins dels límits esquerre i dret del tauler.
     * @description Desplaça la peça i recalcula les cel·les fins que quedi dins dels límits.
     * @param {TetrisPiece} piece - peça a ajustar.
     * @returns {void}
     */
    #checkWallKicks(piece) {
        while (!this.#isWithinLeftBound(piece)) {
            piece.x += 1;
            piece.cells = this.#getPieceCells(piece);
        }

        while (!this.#isWithinRightBound(piece)) {
            piece.x -= 1;
            piece.cells = this.#getPieceCells(piece);
        }
    }

    /**
     * Ajusta la peça verticalment perquè entri dins dels límits superior i inferior del tauler.
     * @description Desplaça la peça i recalcula les cel·les fins que quedi dins dels límits.
     * @param {TetrisPiece} piece - peça a ajustar.
     * @returns {void}
     */
    #checkFloorKicks(piece) {
        while (!this.#isWithinTopBound(this.currentPiece)) {
            piece.y -= 1;
            piece.cells = this.#getPieceCells(piece);
        }

        while (!this.#isWithinBottomBound(this.currentPiece)) {
            piece.y += 1;
            piece.cells = this.#getPieceCells(piece);
        }
    }

    /**
     * Elimina les files indicades del tauler i insereix files buides a la part superior.
     * Manté la mida del tauler constant.
     * @param {number[]} lines - índexs de files a eliminar.
     * @returns {void}
     */
    #eraseLines(lines) {
        for (let i = 0; i < lines.length; i++) {
            this.board.splice(lines[i], 1);                         // Elimina la línia.
            this.board.unshift(Array(Tetris.BOARD_WIDTH).fill(0));  // Afegeix línia buida al principi.
        }
    }

    /**
     * Col·loca la peça actual al tauler, substituint les cel·les corresponents pel seu tipus.
     * Després, avança a la següent peça.
     * @returns {void}
     */
    #placePiece() {
        const type = this.currentPiece.type;
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[type];

        for (let i = 0; i < totalCells; i++) {
            const x = this.currentPiece.cells[i][0];
            const y = this.currentPiece.cells[i][1];

            this.board[y][x] = type;
        }

        this.currentPiece = this.nextPiece;
        this.nextPiece = this.#createPiece();
    }

    /**
     * Comprova si la posició de la peça és vàlida (dins límits i sense col·lisions).
     * @param {TetrisPiece} piece - peça a validar.
     * @returns {boolean} cert si és vàlida.
     */
    #isValidPosition(piece) {
        return this.#isWithinBounds(piece) && !this.#hasCollision(piece);
    }

    /**
     * Comprova si totes les cel·les de la peça es troben dins dels límits del tauler.
     * @param {TetrisPiece} piece - peça a comprovar.
     * @returns {boolean} cert si totes les cel·les són dins el tauler.
     */
    #isWithinBounds(piece) {
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[piece.type];

        for (let i = 0; i < totalCells; i++) {
            const x = piece.cells[i][0];
            const y = piece.cells[i][1];

            if (x < 0 || x >= Tetris.BOARD_WIDTH || y < 0 || y >= Tetris.BOARD_HEIGHT) {
                return false;
            }
        }

        return true;
    }

    /**
     * Comprova si alguna cel·la de la peça col·lisiona amb una cel·la ocupada del tauler.
     * @param {TetrisPiece} piece - peça a comprovar.
     * @returns {boolean} cert si hi ha col·lisió.
     */
    #hasCollision(piece) {
        const totalCells = Tetris.TOTAL_CELLS_PIECE_TYPES[piece.type];

        for (let i = 0; i < totalCells; i++) {
            const x = piece.cells[i][0];
            const y = piece.cells[i][1];

            if (this.board[y][x] !== 0)
                return true;
        }

        return false;
    }

    /**
     * Crea una nova peça de tipus aleatori, posicionada a un punt central i amb rotació 0.
     * També calcula les seves cel·les inicials.
     * @returns {TetrisPiece} la peça creada.
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
     * @param {[number, number]} coords - punt a rotar.
     * @returns {[number, number]} el punt rotat.
     */
    #rotateClockwise([x, y]) {
        return [y, -x];
    }

    /**
     * Aplica una rotació de 90° en sentit antihorari a un punt 2D.
     * @param {[number, number]} coords - punt a rotar.
     * @returns {[number, number]} el punt rotat.
     */
    #rotateCounterClockwise([x, y]) {
        return [-y, x];
    }

    /**
     * Calcula les coordenades de les cel·les que formen la peça, a partir
     * de la seva posició central, tipus i rotació.
     * @param {TetrisPiece} piece - peça d'entrada.
     * @returns {number[][]} llista de cel·les que ocupa la peça.
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
     * @param {number} min - valor mínim (inclòs).
     * @param {number} max - valor màxim (inclòs).
     * @returns {number} enter generat.
     */
    #getRandomNumber(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
    }

    /**
     * Comprova si totes les cel·les de la peça estan dins del límit esquerre.
     * @param {TetrisPiece} piece - peça a comprovar.
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
     * @param {TetrisPiece} piece - peça a comprovar.
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
     * Comprova si totes les cel·les de la peça estan dins del límit superior.
     * @param {TetrisPiece} piece - peça a comprovar.
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

    /**
     * Comprova si totes les cel·les de la peça estan dins del límit inferior.
     * @param {TetrisPiece} piece - peça a comprovar.
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

}