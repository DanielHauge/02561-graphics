
let W3P1 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            varying vec4 v_Color;

            uniform vec4 translation;
            uniform mat4 VM;


            void main(){
                gl_Position = VM*(a_Position+translation);
                v_Color = a_Color;
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
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        let program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);
        gl.enable(gl.DEPTH_TEST);
    
        let vertices = [
            vec3(-0.5, -0.5, 0.5), // 0 (--+)
            vec3(-0.5, 0.5, 0.5), // 1 (-++)
            vec3(0.5, 0.5, 0.5), // 2 (+++)
            vec3(0.5, -0.5, 0.5), // 3 (+-+)
            vec3(-0.5, -0.5, -0.5), // 4 (---)
            vec3(-0.5, 0.5, -0.5), // 5 (-+-)
            vec3(0.5, 0.5, -0.5), // 6 (++-)
            vec3(0.5, -0.5, -0.5) // 7 (+--)
        ];

        let vertexColors = [
            [ 1.0, 0.0, 0.0, 1.0 ], // red
            [ 1.0, 0.0, 0.0, 1.0 ], // red
            [ 0.0, 0.0, 1.0, 1.0 ], // red
            [ 1.0, 0.0, 0.0, 1.0 ], // red
            [ 1.0, 1.0, 1.0, 0.5 ], // white
            [ 1.0, 0.0, 0.0, 1.0 ], // red
            [ 1.0, 0.0, 0.0, 1.0 ], // red
            [ 1.0, 0.0, 0.0, 1.0 ] // red
            ];
        
        let indices = [
            4,0,
            0,1,
            0,3,
            4,5,
            5,6,
            5,1,
            4,7,
            7,6,
            7,3,
            2,1,
            2,3,
            2,6,
        ];


        // Position:
        let vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        
        let vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        // Colors:
        let cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);
    
        let cColor = gl.getAttribLocation(program, "a_Color");
        gl.vertexAttribPointer(cColor, 4, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(cColor);

        // Indices:
        let iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
        

        // Translate so diagonals at 0,0,0 and 1,1,1
        let TranslateLoc = gl.getUniformLocation(program, "translation");
        gl.uniform4f(TranslateLoc, 0.5, 0.5, 0.5, 0.0);

        // VM (Camera)
        let VMLoc = gl.getUniformLocation(program, "VM");
        let at = vec3(0,0,0);
        let up = vec3(0.0,1.0,0.0);
        let eye = vec3(0.5,0.5,0.5);
        let View = lookAt(eye, at, up);
        gl.uniformMatrix4fv(VMLoc, false, flatten(View));


        function render(){
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);
        }
        
        
        render();
    },

    hasCanvas: true,
    header: "3D Wireframe",
    description:
        "A 3D wireframe of a cube can be constructed with lines. These lines can be constructed by sending vertex data to the buffer and drawing with the drawstyle ```gl.LINES```. The vertex data is handled just like previous worksheets, by using a buffer and vec4 attribute in shader. \n "+
        "An easier way to draw objects than previous is to include an indices buffer which holds all the indices, such that we can specify objects to be drawn based on the indices data. The following indices is for drawing lines that correspond to the 3D cube wireframe, each index points to the vertex data.\n"+
        "```javascript\n"+
        "// Every pair correspond to a line when drawing with gl.Lines\n"+
        "let indices = [ \n"+
            "\t4,0, // 5th vertex -> firt vertex.\n"+
            "\t0,1,\n"+
            "\t0,3,\n"+
            "\t4,5,\n"+
            "\t5,6,\n"+
            "\t5,1,\n"+
            "\t4,7,\n"+
            "\t7,6,\n"+
            "\t7,3,\n"+
            "\t2,1,\n"+
            "\t2,3,\n"+
            "\t2,6,\n"+
            
        "];\n"+
        "let iBuffer = gl.createBuffer();\n"+
        "gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);\n"+
        "gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);\n"+
        "gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);\n"+
        "```\n"+
        "Isometric view can then be achieved by a model-view matrix, that essentially transform the vertices such that when viewed it displays the wireframe in isometric view. "+
        "The matrix is declared : \n```uniform mat4 VM;``` and used ```gl_Position = VM*(a_Position+translation);``` in the shader.\n"+
        "the matrix is constructed and sent to the shader with the following code: \n"+
        "```javascript\n"+
        "let VMLoc = gl.getUniformLocation(program, \"VM\");\n"+
        "let at = vec3(0,0,0);\n"+
        "let up = vec3(0.0,1.0,0.0);\n"+
        "let eye = vec3(0.5,0.5,0.5);\n"+
        "let View = lookAt(eye, at, up);\n"+
        "gl.uniformMatrix4fv(VMLoc, false, flatten(View));\n"+
        "```\n",

} 


