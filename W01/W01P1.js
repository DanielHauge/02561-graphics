window.onload = function init(){
    let canvas = document.getElementById("c");
    let gl = canvas.getContext("webgl");
    if (!gl){
        console.error("Yo gl was not found")
    }

    gl.clearColor(0.8,0.9,1.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

}