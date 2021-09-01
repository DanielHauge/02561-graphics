window.onload = function init(){
    let canvas = document.getElementById("c");
    let gl = canvas.getContext("webgl");
    if (!gl){
        console.error("Yo gl was not found")
    }

    gl.clearColor(0.8,0.9,1.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    let vertices = [ vec2(0.0,0.5), vec2(-0.5, -0.5), vec2(0.5,-0.5)];
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.POINTS, 0, 3);

}