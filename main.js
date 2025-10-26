// Alumne: Sorin Chiperi Arnaut
// Codi: u1987503

function initRenderer()
{
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



/*
 * Programa principal...
 */
function main()
{
    let renderer;

    try {
        //renderer = initRenderer();

        const game = new Tetris();
        game.play().catch(console.error);
    }
    catch (error) {
        //console.error(error);
        //alert("Error: " + error);
    }
}

document.addEventListener("DOMContentLoaded", main);