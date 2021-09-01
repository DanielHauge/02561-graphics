
let W1P2 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            void main(){
                gl_Position = a_Position;
                gl_PointSize = 10.0;
            }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
            precision mediump float; 
            void main() { 
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            } 
        `
    
    },

    init: () => {

        W1P2.loadShaders();
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
    
    },

    hasCanvas: true,
    header: "Shaders and buffers",
    description:
        "This part expands the ```init()``` function to fetch the shaders in order to bind a buffer for which we can send position data to create points. Points can then be created and drawn. The following code creates a buffer and binds it to the shaders with the help of WebGL, and then populated with points \n"+
        "```javascript\n"+
        "let vertices = [ vec2(0.0,0.5), vec2(-0.5, -0.5), vec2(0.5,-0.5)];\n"+
        "let vBuffer = gl.createBuffer();\n"+
        "gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);\n"+
        "gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);\n"+
        "let vPosition = gl.getAttribLocation(program, \"a_Position\");\n"+
        "gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0,0);\n"+
        "gl.enableVertexAttribArray(vPosition);\n"+
        "```\n"+
        "When done correctly, together with shaders, the points can then be drawn with the following call: ```gl.drawArrays(gl.POINTS, 0, 3);```",
} 


