// Alumne: Sorin Chiperi Arnaut
// Codi: u1987503

class Tetris {
    static BOARD_WIDTH = 10;
    static BOARD_HEIGHT = 20;
    static TOTAL_PIECE_TYPES = 7;
    static PIECE_TYPES = {
        1: "I",
        2: "S",
        3: "O",
        4: "T",
        5: "L",
        6: "J",
        7: "Z"};

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

    movePiece(direction) {
        let piece = {
            x: this.currentPiece.x,
            y: this.currentPiece.y,
            type: this.currentPiece.type
        };

        if (direction === "R") { // Dreta.
            piece.x++;
            piece.cells = this.#getPieceCells(piece);
        }
        else if (direction === "L") { // Esquerra.
            piece.x--;
            piece.cells = this.#getPieceCells(piece);
        }

        if (this.#isValidPosition(piece)) {
            this.currentPiece = piece;
        }
    }

    rotatePiece() {}

    dropPiece() {
        let piece = {
            x: this.currentPiece.x,
            y: this.currentPiece.y,
            type: this.currentPiece.type
        };

        piece.y--;
        piece.cells = this.#getPieceCells(piece);

        if (this.#isValidPosition(piece)) {
            this.currentPiece = piece;
        }
        else {
            this.#placePiece();
        }
    }

    checkLines() {
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

                // Moviment automàtic per provar
                const randomMove = Math.random();
                if (randomMove < 0.3) {
                    this.movePiece('L');
                } else if (randomMove < 0.6) {
                    this.movePiece('R');
                } else {
                    this.dropPiece();
                }

                setTimeout(gameLoop, 1000);
            }
        };

        gameLoop();
    }

    /* ------------------------------ FUNCIONS PRIVADES ------------------------------ */

    #eraseLines(lines) {
        for (let i = 0; i < lines.length; i++) {
            this.board.splice(lines[i], 1); // Elimina la línia.
            this.board.unshift(Array(Tetris.BOARD_WIDTH).fill(0)); // Afegeix línia buida al principi.
        }
    }

    #placePiece() {
        for (let i = 0; i < this.currentPiece.cells.length; i++) {
            const x = this.currentPiece.cells[i][0];
            const y = this.currentPiece.cells[i][1];

            this.board[y][x] = this.currentPiece.type;
        }

        this.currentPiece = this.nextPiece;
        this.nextPiece = this.#createPiece();
    }

    #isValidPosition(piece) {
        return this.#isWithinBounds(piece) && !this.#hasCollision(piece);
    }

    #isWithinBounds(piece) {
        for (let i = 0; i < piece.cells.length; i++) {
            const x = piece.cells[i][0];
            const y = piece.cells[i][1];

            if (x < 0 || x >= Tetris.BOARD_WIDTH || y < 0) {
                return false;
            }
        }
        return true;
    }

    #hasCollision(piece) {
        for (let i = 0; i < piece.cells.length; i++) {
            const x = piece.cells[i][0];
            const y = piece.cells[i][1];

            if (this.board[y][x] !== 0)
                return true;
        }
        return false;
    }

    #createPiece() {
        let piece = {};
        const randomType = this.#getRandomNumber(1, Tetris.TOTAL_PIECE_TYPES);

        piece.x = Math.floor((Tetris.BOARD_WIDTH-1)/2);
        piece.y = Tetris.BOARD_HEIGHT-2;
		piece.rot = 
        piece.type = randomType;
        piece.cells = this.#getPieceCells(piece);

        return piece;
    }

    #getPieceCells(piece) {
        let pieceCells = Array();

        switch (Tetris.PIECE_TYPES[piece.type]) {
            case "I":
                pieceCells.push([piece.x, piece.y]);
                pieceCells.push([piece.x-1, piece.y]);
                pieceCells.push([piece.x+1, piece.y]);
                pieceCells.push([piece.x+2, piece.y]);
                break;

            case "O":
                pieceCells.push([piece.x, piece.y]);
                pieceCells.push([piece.x+1, piece.y]);
                pieceCells.push([piece.x+1, piece.y+1]);
                pieceCells.push([piece.x, piece.y+1]);
                break;

            case "T":
                pieceCells.push([piece.x, piece.y]);
                pieceCells.push([piece.x-1, piece.y]);
                pieceCells.push([piece.x+1, piece.y]);
                pieceCells.push([piece.x, piece.y+1]);
                break;

            case "S":
                pieceCells.push([piece.x, piece.y]);
                pieceCells.push([piece.x-1, piece.y]);
                pieceCells.push([piece.x, piece.y+1]);
                pieceCells.push([piece.x+1, piece.y+1]);
                break;

            case "Z":
                pieceCells.push([piece.x, piece.y]);
                pieceCells.push([piece.x + Math.cos(piece.rot), 
								 piece.y - Math.sin(piece.rot)]);
                pieceCells.push([piece.x + Math.sin(piece.rot), 
								 piece.y + Math.abs(Math.cos(piece.rot))]);
                pieceCells.push([piece.x + Math.sin(piece.rot) - Math.cos(piece.rot), 
								 piece.y + Math.sin(piece.rot) + Math.cos(piece.rot)]);
                break;

            case "L":
                pieceCells.push([piece.x, piece.y]);
                pieceCells.push([piece.x-1, piece.y]);
                pieceCells.push([piece.x-1, piece.y-1]);
                pieceCells.push([piece.x+1, piece.y]);
                break;

            case "J":
                pieceCells.push([piece.x, piece.y]);
                pieceCells.push([piece.x-1, piece.y]);
                pieceCells.push([piece.x-1, piece.y+1]);
                pieceCells.push([piece.x+1, piece.y]);
                break;
        }
		// FALTA ARRODONIR...
        return pieceCells;
    }

    #getRandomNumber(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
    }

}