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

    // Circle creation:
    let radius = 0.5;
    let n = 150;
    let vertices = [vec2(0.0,0.0)];
    let colors = [vec3(1.0,1.0,1.0)];
    for (let i = -1; i < n; i++) {
        let angle = 2*Math.PI*i/n
        vertices.push(vec2(radius*Math.cos(angle), radius*Math.sin(angle)));
        colors.push(vec3(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)), Math.abs(Math.cos(angle))));
    }

    // Send to shaders
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(vPosition);

    
    

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
            gl.drawArrays(gl.TRIANGLE_FAN, 0, n+2);
        }, 100)
        
    }

    render();
}
