
let W1P4 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            uniform float rotation;
            varying vec4 v_Color;
            
            void main(){
                gl_Position.x = -sin(rotation) * a_Position.x + cos(rotation) * a_Position.y;
                gl_Position.y = sin(rotation) * a_Position.y + cos(rotation) * a_Position.x;
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

        W1P4.loadShaders();
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
    },

    hasCanvas: true,
    header: "A rotating square",
    description:
        "With one additional point, a square is achieved with \"TRIANGLE_STRIP\" draw style.\n"+
        "To enable rotation, an additional shader attribute is added to control rotation. The new attribute rotation is then used with the trigonometric functions to create rotation.\n"+
        "```\n"+
        "...\n"+
        "uniform float rotation;\n\n"+
        
        "void main(){\n"+
            "\tgl_Position.x = -sin(rotation) * a_Position.x + cos(rotation) * a_Position.y;\n"+
            "\tgl_Position.y = sin(rotation) * a_Position.y + cos(rotation) * a_Position.x;\n"+
            "\tgl_Position.z = 0.0;\n"+
            "\tgl_Position.w = 1.0;\n"+
            "...\n"+
        "```\n\n"+
        "The rendering is contiunsly done with \"requestAnimFrame\", with a 100 miliseconds delay resulting in 10 frames per second.\n"+
        "```javascript\n"+
        "function render(){\n"+
            "\tsetTimeout(function(){\n"+
                "\t\trequestAnimationFrame(render);\n"+
                "\t\trotationValue += 0.1;\n"+
                "\t\tgl.clear(gl.COLOR_BUFFER_BIT);\n"+
                "\t\tgl.uniform1f(rotation, rotationValue);\n"+
                "\t\tgl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);\n"+
            "\t}, 100)\n"+
        "}\n"+
        "```\n"
} 



