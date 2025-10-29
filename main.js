// Alumne: Sorin Chiperi Arnaut
// Codi: u1987503

const MAX_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / MAX_FPS;
const GAME_DROP_INTERVAL_MS = 1000;

var previousTimeMs = 0;
var previousDropTimeMs = 0;
var pauseStartTimeMs = 0;
var animationFrameId = null;

var tetris, renderer;
var isPaused = false;
var pressedKeys = new Set();

/**
 * Inicialitza el renderer WebGL encarregat de dibuixar el joc.
 * @returns {WebGLRenderer} Instància inicialitzada del renderer.
 */
function initRenderer() {
    let renderer;
    let canvas;
    let vertexShader;
    let fragmentShader;

    canvas = document.getElementById("tetrisCanvas");
    renderer = new WebGLRenderer(canvas);

    vertexShader = document.getElementById("vertexShader");
    fragmentShader = document.getElementById("fragmentShader");
    renderer.init(vertexShader.text, fragmentShader.text);

    console.log("WebGL inicialitzat amb èxit.");
    return renderer;
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
    document.addEventListener("keydown", (e) => pressedKeys.add(e.key));
    document.addEventListener("keyup", (e) => pressedKeys.delete(e.key));
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
 * Reinicia la partida des de zero.
 * @returns {void}
 */
function restartGame() {
    let pauseButton = document.getElementById("pauseButton");
    pauseButton.style.backgroundColor = "#1688dd";
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
        pauseButton.style.backgroundColor = "#33c33a";
        pauseButton.textContent = "Resume";
        pauseStartTimeMs = performance.now();
    }
    else {
        pauseButton.style.backgroundColor = "#1688dd";
        pauseButton.textContent = "Pause";
        previousDropTimeMs += performance.now() - pauseStartTimeMs;
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
    startButton.style.backgroundColor = "#cccccc";
    pauseButton.style.backgroundColor = "#1688dd";
    restartButton.style.backgroundColor = "#df0000";

    play();
}

/**
 * Processa les tecles premudes i mou la peça o llança accions (moure, rotar, drop).
 * @returns {void}
 */
function checkInput() {
    if (isKeyDown("ArrowLeft")) {
        tetris.movePiece("left");
    }
    else if (isKeyDown("ArrowRight")) {
        tetris.movePiece("right");
    }
    else if (isKeyDown("ArrowDown")) {
        tetris.movePiece("down");
    }
    else if (isKeyDown("ArrowUp")) {
        tetris.rotatePiece();
    }
    else if (isKeyDown("Space")) {
        tetris.dropPiece();
    }
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

    if (currentTimeMs - previousDropTimeMs >= GAME_DROP_INTERVAL_MS) {
        tetris.movePiece("down");
        tetris.checkLines();
        previousDropTimeMs = currentTimeMs;

    }

    checkInput();
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
 * Bucle principal del joc: crida update() i dóna pas al següent frame.
 * Es manté en marxa fins que arriba un game over.
 * @returns {void}
 */
function gameLoop() {
    animationFrameId = requestAnimationFrame((currentTimeMs) => {
        const deltaTimeMs = currentTimeMs - previousTimeMs;

        if (deltaTimeMs >= FRAME_INTERVAL_MS) {
            update(currentTimeMs);

            // Sincronitza el següent frame.
            // Si deltaTimeMs = 20 ms i FRAME_INTERVAL_MS = 17 ms.
            // És resta a currentTime els ms sobrants per evitar problemes en la següent iteració.
            previousTimeMs = currentTimeMs - (deltaTimeMs % FRAME_INTERVAL_MS);
        }
        tetris.draw(renderer);
        if (!tetris.isGameover()) {
            gameLoop();
        }
    });
}

/**
 * Reinicia tot l'estat del joc (tauler, temps, pausa) i arrenca el bucle de joc.
 * @returns {void}
 */
function play() {
    stopGameLoop();
    tetris.initGame();
    isPaused = false;
    previousTimeMs = 0;
    previousDropTimeMs = 0;
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