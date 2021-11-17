let W8P1 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec2 a_Texcord;
            uniform mat4 P;
            uniform mat4 V;
            varying vec2 v_Texcord;
            void main(){
                v_Texcord = a_Texcord;
                gl_Position = P * V * a_Position;   
            }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
            precision mediump float;
            uniform sampler2D texMap;
            varying vec2 v_Texcord;
            void main() { 
                gl_FragColor = texture2D(texMap, v_Texcord);
            } 
        `
    
    },

    // Controls
    loadControls: () =>{
        // No controls
        return document.createElement("div");
    },

    init: () => {
        // Initialize webgl
        let canvas = document.getElementById("c");
        if (canvas === null) return;
        let gl = canvas.getContext("webgl");
        if (!gl){
            console.error("Yo gl was not found")
        }
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor(0.8,0.9,1.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        let program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);

        // Optimize for depth test
        gl.enable(gl.DEPTH_TEST);

        
        // Vertices and texels.
        let GroundQuad = [vec3(2,-1,-5),vec3(2,-1,-1),vec3(-2,-1,-5),vec3(-2,-1,-1)];
        let Quad1 = [ vec3(0.75,-0.5,-1.25),vec3(0.25,-0.5,-1.25), vec3(0.75,-0.5,-1.75), vec3(0.25,-0.5,-1.75)];
        let Quad2 = [vec3(-1,-1,-2.5),vec3(-1,0,-2.5), vec3(-1,-1,-3), vec3(-1,0,-3)];
        let vertices = [...GroundQuad, ...Quad1, ...Quad2];
        let bufferData = flatten(vertices);
        gl.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

        let vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        let GroundQuadTexCord = [vec2(1,-1), vec2(1,1), vec2(-1,-1), vec2(-1,1)];
        let Quads = [vec2(1,1),vec2(-1,1), vec2(1,-1), vec2(-1,-1)];
        let texCords = [...GroundQuadTexCord, ...Quads, ...Quads];
        gl.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCords), gl.STATIC_DRAW);

        let tPosition = gl.getAttribLocation(program, "a_Texcord");
        gl.vertexAttribPointer(tPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(tPosition);

        
        // PVM
        let V = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
          ];
        let P = perspective(90, 512/512, 0.1, 20);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(V));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(P));

        // Texture setup. (The texture is already loaded, because it was calculated)
        let img = new Image();
        img.onload = function () {
            
            let texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
            gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            render();
        }
        img.src = "../images/xamp23.png";

        let quadTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, quadTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255,0,0]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);


        function render(){
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Ground quad
            gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
            gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4); // Quad 1
            gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4); // Quad 2
        }

        render();
    },

    hasCanvas: true,
    header: "Scene",
    description:
        "The initial scene is based on worksheet 6 part 1, with quad cordinates and their coresponding texture coordinates.: \n"+
        "```javascript\n"+
        "let GroundQuad = [vec3(2,-1,-5),vec3(2,-1,-1),vec3(-2,-1,-5),vec3(-2,-1,-1)];\n"+
        "let Quad1 = [ vec3(0.75,-0.5,-1.25),vec3(0.25,-0.5,-1.25), vec3(0.75,-0.5,-1.75), vec3(0.25,-0.5,-1.75)];\n"+
        "let Quad2 = [vec3(-1,-1,-2.5),vec3(-1,0,-2.5), vec3(-1,-1,-3), vec3(-1,0,-3)];\n"+
        "let vertices = [...GroundQuad, ...Quad1, ...Quad2];\n"+
        "let GroundQuadTexCord = [vec2(1,-1), vec2(1,1), vec2(-1,-1), vec2(-1,1)];\n"+
        "let Quads = [vec2(1,1),vec2(-1,1), vec2(1,-1), vec2(-1,-1)];\n"+
        "let texCords = [...GroundQuadTexCord, ...Quads, ...Quads];\n"+
        "```\n"+
        "They are put in buffer and sent as attributes to shaders. The 2 different textures is loaded and bound just like in previous worksheets. The following calls will then draw the quads: \n"+
        "```javascript\n"+
        "gl.uniform1i(gl.getUniformLocation(program, \"texMap\"), 0);\n"+
        "gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Ground quad\n"+
        "gl.uniform1i(gl.getUniformLocation(program, \"texMap\"), 1);\n"+
        "gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4); // Quad 1\n"+
        "gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4); // Quad 2\n"+
        "```\n"
        ,
} 


