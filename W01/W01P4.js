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

    // Points / Positions
    let vertices = [ vec2(0.0,0.5), vec2(-0.5, 0), vec2(0.5,0), vec2(0.0, -0.5)];

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(vPosition);

    // Colors
    let colors = [vec3(1,0,0), vec3(0,1,0), vec3(0,0,1), vec3(1,1,1)];

    let cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    let cColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(cColor, 3, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(cColor);
    

    // Rotation:
    var rotationValue = 0.0;
    let rotation = gl.getUniformLocation(program, "rotation");
    gl.uniform1f(rotation, rotationValue);


    // rendering
    function render(){
        setTimeout(function(){
            requestAnimationFrame(render);
            rotationValue += 0.1;
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform1f(rotation, rotationValue);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }, 100)
        
    }

    render();
}
