
let W3P3 = {
    
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

        let T = translate(0.5,0.5,0.5);
        let at = vec3(0.5,0.5,0.5);
        let up = vec3(0.0,1.0,0.0);
        let eye = vec3(0.5,0.5,-2.5);
        let V = lookAt(eye, at, up);
        let P = perspective(45, 1, 0.1, 6);
        let VM = mult(V, T)
        let PVM = mult(P, VM);
        gl.uniformMatrix4fv(PVMLoc, false, flatten(PVM));

        // Animated render function.
        let rotationValue = 0;

        function render(){
            setTimeout(function(){
                requestAnimationFrame(render);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                rotationValue += 2;
                let Ry = rotateY(rotationValue);
                let Rz = rotateZ(rotationValue*1.3);
                let Rx = rotateX(rotationValue*0.8);
                let RRR = mult(mult(Ry,Rz), Rx);
                let PVMRot = mult(PVM, RRR);
                gl.uniformMatrix4fv(PVMLoc, false, flatten(PVMRot));
                gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);

            }, 25)
        }

        render();
    },

    hasCanvas: true,
    header: "Theory of affine transformation",
    description:
        "The transformations that were done:\n"+
        "#### Translation: \n"+
        "Moving each vertex/point a finite distance d: $$p' = p + d$$ \n"+
        "Adding each coordinate from p with d does not combine well with other affine transformations, so a multiplication is done instead.\n" + 
        "$$p' = T \\times p$$\n where T is the matrix:\n\n"+
        "$$T=\\begin{bmatrix}1 & 0 & 0 & d_x\\\\0 & 1 & 0 & d_y \\\\ 0 & 0 & 1 & d_z \\\\ 0 & 0 & 0 & 1 \\end{bmatrix}$$\n\n"+
        "#### Rotation: \n"+
        "A combination of translation and sheering for points, such that it rotates around an axis by degrees.\n"+
        "The same as with translation, multiple affine transformation works well for matrix multiplication.\n"+
        "$$p'= R_z \\times p$$\n"+
        "Where we can define the rotation matrix for the z axis with:\n"+
        "$$R_z(\\theta) = \\begin{bmatrix} cos(\\theta) &  -sin(\\theta) & 0 & 0\\\\sin(\\theta) & cos(\\theta) & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & 1 \\end{bmatrix} $$\n"+
        "There is different, but similar matrices for x and y. They are similar in terms of leaving one axis alone while using trigonometric functions to rotate points around for the other axes.\n"+
        "#### Perspectives & Camera...\n"+
        "Using perspective and lookAt function in webgl that also produces basis-changing matrices to achieve the goal of camera position and field of view perspective."+
        "The matrices are basically scaling, sheering, translating and rotating the points to achieve the desired effect.\n"+
        "The cool thing about affine transformations like these, are that a final transformations matrix can be calculated fully before calculations on the vertices happen. "+
        "So even with a large amount of transformations, the final transformation matrix can be calculated by combining all the matrices. " +
        "Having only 1 transformation matrix in the end makes it very efficient, as each vertex only needs to be processed with one multiplication per draw. "+
        "\n#### Cube formulars\n"+
        "_Apply **Perspective** part to see the cubes_.\n\n"+
        "Where $p_n$ is cube formular in n'th point perspective, $P$: matrix from ```webgl.perspective```, $V$: matrix from ```webgl.lookAt```, $T$: Translations matrix, $R_y$: Rotation matrix around y axis, $R_z$ Rotation matrix around z axis and $Model$ is the original vertex data for the cube.\n"+
        "$$p_1 = P\\times V \\times T \\times Model$$\n"+
        "$$p_2 = P\\times V \\times R_y \\times T \\times Model$$\n"+
        "$$p_3 = P\\times V \\times R_y \\times R_z \\times T \\times Model$$\n",
} 


