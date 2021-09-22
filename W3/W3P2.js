
let W3P2 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            varying vec4 v_Color;

            uniform mat4 PVM;


            void main(){
                gl_Position = PVM*a_Position;
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

        
        let lineindicies = [
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

        let indices = lineindicies;

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

        // Model view matrix location
        let PVMLoc = gl.getUniformLocation(program, "PVM");


        function render(){
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Draw first point
            let T = translate(0.5,0.5,0.5);
            let at = vec3(0.5,0.5,0.5);
            let up = vec3(0.0,1.0,0.0);
            let eye = vec3(0.5,0.5,-4.5);
            let V = lookAt(eye, at, up);

            let P = perspective(45, 1, 0.1, 6);
            let VM = mult(V, T)
            let PVM = mult(P, VM);
            gl.uniformMatrix4fv(PVMLoc, false, flatten(PVM));
            gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);

            // Draw second point perspective
            T = translate(2,0.5,0.3);
            let Ry = rotateY(15);
            let R = mult(Ry,T)
            VM = mult(V, R)
            PVM = mult(P, VM);
            gl.uniformMatrix4fv(PVMLoc, false, flatten(PVM));
            gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);

            // Draw third point perspective
            T = translate(-0.8,-0.5,0.5);
            let Rz = rotateX(15);
            let RR = mult(mult(Rz, T), Ry);
            VM = mult(V, RR)
            PVM = mult(P, VM);
            gl.uniformMatrix4fv(PVMLoc, false, flatten(PVM));
            gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);
        }
        
        
        render();
    },

    hasCanvas: true,
    header: "Perspectives",
    description:
        "Perspectives can be achieved by transforming the model-view matrix. Translations, Camera potion and field of view etc. "+
        "\n- One-point perspective can be achieved by translating the object centered to the eye point in respect to both horizontal and vertical position, without any rotations to the model. One-point perspective is seen as the middle wireframe. " +
        "\n- Two-point perspective is achieved by rotating the object such that it faces a direction. Two-point perspective is done with translation and 15 degrees rotation off the y axis, shown on the right. "+
        "\n- Three-point perspective is achieved by multi axis rotation of the object. Three-point perspective is done by translation and 15 degrees rotation off the y and z axis, shown on the bottom left.",

} 


