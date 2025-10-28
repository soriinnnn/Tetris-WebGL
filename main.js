// Alumne: Sorin Chiperi Arnaut
// Codi: u1987503

var tetris, renderer;
var isPaused = false;

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

function restartGame() {
    tetris.initGame();
    isPaused = false;
}

function pauseGame() {
    let pauseButton = document.getElementById("pauseButton");

    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
}

function startGame() {
    let startButton = document.getElementById("startButton");
    let pauseButton = document.getElementById("pauseButton");
    let restartButton = document.getElementById("restartButton");

    tetris.initGame();
    isPaused = false;
    startButton.disabled = true;
    pauseButton.disabled = false;
    restartButton.disabled = false;
}

function setupButtons() {
    let startButton = document.getElementById("startButton");
    let pauseButton = document.getElementById("pauseButton");
    let restartButton = document.getElementById("restartButton");

    startButton.addEventListener("click", startGame);
    pauseButton.addEventListener("click", pauseGame);
    restartButton.addEventListener("click", restartGame);
}

/*
 * Programa principal...
 */
function main() {
    tetris = new Tetris();
    renderer = initRenderer();

    setupButtons();
}

document.addEventListener("DOMContentLoaded", main);