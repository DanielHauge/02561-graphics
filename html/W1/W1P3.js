
let W1P3 = {
        
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            varying vec4 v_Color;
            void main(){
                gl_Position = a_Position;
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
    
        // Points / Positions
        let vertices = [ vec2(0.0,0.5), vec2(-0.5, -0.5), vec2(0.5,-0.5)];
    
        let vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
        let vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(vPosition);
    
        // Colors
        let colors = [vec3(1,0,0), vec3(0,1,0), vec3(0,0,1)];
    
        let cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
        let cColor = gl.getAttribLocation(program, "a_Color");
        gl.vertexAttribPointer(cColor, 3, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(cColor);
        
    
        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    
    },

    hasCanvas: true,
    header: "Triangles",
    description:
        "To support colors, additional attributes has been added to the shaders. A color vector represented as RGB, the colors are then set based on the attribute data:\n"+
        "```javascript\n"+
        "...\n"+
        "attribute vec4 a_Color;\n"+
        "varying vec4 v_Color;\n"+
        "void main(){\n"+
        "\tgl_Position = a_Position;\n"+
        "\tv_Color = a_Color;\n"+
        "\t...\n"+
        "```\n"+
        "With these new attributes, a new buffer with color data can be made in exactly the same fashion as position for the points previously. "+
        "The difference from positions is that color has 1 more float of data which is therefor increased in the ```vertexAttribPointer``` call, also a different attribute name which is used in the ```getAttribLocation``` call.\n\n"+
        "Then to draw a triangle with interpolating colors, instead of 3 dots with different colors, the draw style can be changed to ```TRIANGLE``` as follows:\n"+
        "```javascript\n"+
        "gl.drawArrays(gl.TRIANGLES, 0, 3);\n"+
        "```"
} 



