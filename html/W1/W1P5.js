let W1P5 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            uniform float rotation;
            uniform float v_X;
            uniform float v_Y;
            varying vec4 v_Color;
            
            void main(){
                gl_Position.x = -sin(rotation) * a_Position.x + cos(rotation) * a_Position.y;
                gl_Position.x = gl_Position.x + v_X;
                gl_Position.y = sin(rotation) * a_Position.y + cos(rotation) * a_Position.x;
                gl_Position.y = gl_Position.y + v_Y;
                gl_Position.z = 0.0;
                gl_Position.w = 1.0;
                v_Color = a_Color;
                gl_PointSize = 10.0;
            }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
            precision mediump float;
            varying vec4 v_Color; 
            void main() { 
                gl_FragColor = v_Color;
            } 
        `
    
    },

    init: () => {
    
    
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
        let rotationValue = 0.0;
        let rotation = gl.getUniformLocation(program, "rotation");
        gl.uniform1f(rotation, rotationValue);
    
        // Bounce movement:
        let vX = 0;
        let vY = 0;
        let wX = 0.06;
        let wY = 0.04;
        let vXUni = gl.getUniformLocation(program, "v_X");
        let vYUni = gl.getUniformLocation(program, "v_Y");
        gl.uniform1f(vXUni, vX);
        gl.uniform1f(vYUni, vY);


    
        // rendering
        function render(){
            setTimeout(function(){
                requestAnimationFrame(render);
                rotationValue += 0.1;
                wX = wX = Math.sign(1-radius-(Math.abs(vX)))*wX;
                wY = wY = Math.sign(1-radius-(Math.abs(vY)))*wY;
                vX = vX+wX;
                vY = vY+wY;
                gl.uniform1f(vXUni, vX);
                gl.uniform1f(vYUni, vY);
                gl.uniform1f(rotation, rotationValue);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLE_FAN, 0, n+2);
            }, 25)
            
        }
        render();
    },

    hasCanvas: true,
    header: "A fan of triangles",
    description:
        "A circle can be imitated by lots of triangles. To create a convincing circle, more points is needed than when creating squares, triangles or dots. Position points can be generated with the trigonometric functions by looping around the unit circle in small increments. The following code illustrates how position and color data is generated:\n"+
        "```javascript\n"+
        "let radius = 0.5;\n"+
        "let n = 150;\n"+
        "let vertices = [vec2(0.0,0.0)];\n"+
        "let colors = [vec3(1.0,1.0,1.0)];\n"+
        "for (let i = -1; i < n; i++) {\n"+
            "\tlet angle = 2*Math.PI*i/n\n"+
            "\tvertices.push(vec2(radius*Math.cos(angle), radius*Math.sin(angle)));\n"+
            "\tcolors.push(vec3(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)), Math.abs(Math.cos(angle))));\n"+
        "}\n"+
        "```\n"+

        "To make the circle move in position in addition to rotation, additional translation uniform variables can be passed to the vertex shader. The uniform variables is handled very similar to rotation in part 4. "+
        "A variable for x and y can be updated each frame to facilitate position changes. The position updates in render function is seen below:\n"+
        "```javascript\n"+
            "wX = wX = Math.sign(1-radius-(Math.abs(vX)))*wX;\n"+
            "wY = wY = Math.sign(1-radius-(Math.abs(vY)))*wY;\n"+
            "vX = vX+wX;\n"+
            "vY = vY+wY;\n"+
            "gl.uniform1f(vXUni, vX);\n"+
            "gl.uniform1f(vYUni, vY);\n"+
        "```\n"+
        
        "When the position, colors and translation data is populated, the circle can be drawn with the following call. N.B we need the make sure to include all points for drawing with the ```n+2``` as last argument.\n"+
        "```javascript\n"+
        "gl.drawArrays(gl.TRIANGLE_FAN, 0, n+2);\n"+
        "```\n"

} 
