// Alumne: Sorin Chiperi Arnaut
// Codi: u1987503

const MAX_FPS = 60;
const FRAME_INTERVAL_MS = 1000 / MAX_FPS;
const GAME_DROP_INTERVAL_MS = 1000;
const GAME_INPUT_INTERVAL_MS = 150;
const CONTROL_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"]);

var lastFrameTimeMs = 0;
var lastDropTimeMs = 0;
var lastInputTimeMs = 0;
var pauseStartTimeMs = 0;
var animationFrameId = null;

var tetris = null;
var renderer = null;
var isPaused = false;
var pressedKeys = new Set();
var pendingInputs = new Set();

/**
 * Inicialitza el renderer WebGL encarregat de dibuixar el joc.
 * @returns {TetrisRenderer} Instància inicialitzada del renderer.
 */
function initRenderer() {
    let renderer;
    let canvas;
    let vertexShader;
    let fragmentShader;

    canvas = document.getElementById("tetrisCanvas");
    renderer = new TetrisRenderer(canvas);

    vertexShader = document.getElementById("vertexShader");
    fragmentShader = document.getElementById("fragmentShader");
    renderer.init(vertexShader.text, fragmentShader.text, Tetris.BOARD_HEIGHT, Tetris.BOARD_WIDTH);

    console.log("WebGL inicialitzat amb èxit.");
    return renderer;
}

/**
 * Reinicia la partida des de zero.
 * @returns {void}
 */
function restartGame() {
    let pauseButton = document.getElementById("pauseButton");
    pauseButton.textContent = "Pause";

    play();
}

/**
 * Pausa o reprèn la partida.
 * @returns {void}
 */
function pauseGame() {
    let pauseButton = document.getElementById("pauseButton");

    isPaused = !isPaused;
    if (isPaused) {
        pauseButton.textContent = "Resume";
        pauseStartTimeMs = performance.now();
    }
    else {
        pauseButton.textContent = "Pause";
        lastDropTimeMs += performance.now() - pauseStartTimeMs;
        lastInputTimeMs += performance.now() - pauseStartTimeMs;
    }
}

/**
 * Inicia una nova partida.
 * @returns {void}
 */
function startGame() {
    let startButton = document.getElementById("startButton");
    let pauseButton = document.getElementById("pauseButton");
    let restartButton = document.getElementById("restartButton");

    startButton.disabled = true;
    pauseButton.disabled = false;
    restartButton.disabled = false;

    play();
}

/**
 * Configura els listeners dels botons Start, Pause i Restart.
 * @returns {void}
 */
function setupButtons() {
    let startButton = document.getElementById("startButton");
    let pauseButton = document.getElementById("pauseButton");
    let restartButton = document.getElementById("restartButton");

    startButton.addEventListener("click", startGame);
    pauseButton.addEventListener("click", pauseGame);
    restartButton.addEventListener("click", restartGame);
}

/**
 * Indica si una tecla concreta està premuda actualment.
 * @param {string} key - Identificador de la tecla.
 * @returns {boolean} cert si la tecla està premuda.
 */
function isKeyDown(key) {
    return pressedKeys.has(key);
}

/**
 * Configura els listeners de teclat per registrar i alliberar tecles premudes.
 * @returns {void}
 */
function setupInput() {
    document.addEventListener("keydown", (e) => {
        if (!CONTROL_KEYS.has(e.code) || isKeyDown(e.code)) {
            return;
        }

        pressedKeys.add(e.code);
        pendingInputs.add(e.code);
    });

    document.addEventListener("keyup", (e) => {
        if (!CONTROL_KEYS.has(e.code)) {
            return;
        }

        pressedKeys.delete(e.code);
        pendingInputs.delete(e.code);
    });
}

/**
 * Executa l’acció corresponent a una tecla de control.
 * @param {string} key - Codi de la tecla premuda.
 * @param {number} currentTimeMs - Temps (ms) del frame actual.
 * @returns {void}
 */
function processInput(key, currentTimeMs) {
    switch (key) {
        case "ArrowLeft":
            tetris.movePiece("left");
            break;
        case "ArrowRight":
            tetris.movePiece("right");
            break;
        case "ArrowDown":
            tetris.movePiece("down");
            lastDropTimeMs = currentTimeMs;
            break;
        case "ArrowUp":
            tetris.rotatePiece();
            break;
        case "Space":
            tetris.dropPiece();
            lastDropTimeMs = currentTimeMs;
            break;
    }
}

/**
 * Gestiona l’entrada de teclat pendent i la repetició automàtica mentre es manté una tecla premuda.
 * @param {number} currentTimeMs - Temps (ms) del frame actual.
 * @returns {void}
 */
function checkInput(currentTimeMs) {
    const deltaTimeMs = currentTimeMs - lastInputTimeMs;
    let processed = new Set();

    // Assegura que una tecla es llegeixi almenys una vegada sense que hagi d'esperar.
    if (pendingInputs.size > 0) {
        pendingInputs.forEach((key) => {
            processInput(key, currentTimeMs);
            processed.add(key);
        });
        pendingInputs.clear();
        lastInputTimeMs = currentTimeMs;
    }

    // Si una tecla es manté polsada durant un cert temps, es llegirà un altre cop.
    if (deltaTimeMs >= GAME_INPUT_INTERVAL_MS) {
        pressedKeys.forEach((key) => {
           if (!processed.has(key)) {
               processInput(key, currentTimeMs);
           }
        });
        lastInputTimeMs = currentTimeMs;
    }
}

/**
 * Atura el bucle d'animació actual cancel·lant el frame pendent, si n'hi ha.
 * @returns {void}
 */
function stopGameLoop() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Dibuixa l’estat actual del joc al canvas.
 * @returns {void}
 */
function render() {
    renderer.draw(tetris.gameSnapshot());
}

/**
 * Actualitza la lògica del joc: fa caure la peça automàticament cada cert temps
 * i comprova l'entrada de teclat, sempre que el joc no estigui pausat.
 * @param {number} currentTimeMs - Temps actual (mil·lisegons).
 * @returns {void}
 */
function update(currentTimeMs) {
    if (isPaused) {
        return;
    }

    const deltaTimeMs = currentTimeMs - lastDropTimeMs;

    if (deltaTimeMs >= GAME_DROP_INTERVAL_MS) {
        tetris.movePiece("down");
        lastDropTimeMs = currentTimeMs;
    }

    checkInput(currentTimeMs);
}

/**
 * Bucle principal del joc: crida update() i dóna pas al següent frame.
 * Es manté en marxa fins que arriba un game over.
 * @returns {void}
 */
function gameLoop() {
    animationFrameId = requestAnimationFrame((currentTimeMs) => {
        const deltaTimeMs = currentTimeMs - lastFrameTimeMs;

        if (deltaTimeMs >= FRAME_INTERVAL_MS) {
            update(currentTimeMs);
            render();

            // Sincronitza el següent frame.
            // Si deltaTimeMs = 20 ms i FRAME_INTERVAL_MS = 17 ms.
            // És resta a currentTime els ms sobrants per evitar problemes en la següent iteració.
            lastFrameTimeMs = currentTimeMs - (deltaTimeMs % FRAME_INTERVAL_MS);
        }
        if (!tetris.isGameover()) {
            gameLoop();
        }
    });
}

/**
 * Reinicia tot l'estat del joc (tauler, temps, pausa) i arrenca el bucle del joc.
 * @returns {void}
 */
function play() {
    stopGameLoop();
    tetris.initGame();
    isPaused = false;
    lastFrameTimeMs = 0;
    lastDropTimeMs = 0;
    lastInputTimeMs = 0;
    pauseStartTimeMs = 0;
    gameLoop();
}

/**
 * Punt d'entrada del joc, crea les instàncies principals i configura els controls.
 * @returns {void}
 */
function main() {
    tetris = new Tetris();
    renderer = initRenderer();

    setupButtons();
    setupInput();
}

document.addEventListener("DOMContentLoaded", main);