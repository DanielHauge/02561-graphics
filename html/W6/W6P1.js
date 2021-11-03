let W6P1 = {
    
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
        let vertices = [vec3(4,-1,-1), vec3(-4,-1,-1), vec3(4,-1,-21), vec3(-4,-1,-21)];
        gl.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        let vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        let texCords = [vec2(2.5,0), vec2(-1.5, 0), vec2(2.5,10), vec2(-1.5,10)];
        gl.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCords), gl.STATIC_DRAW);

        let tPosition = gl.getAttribLocation(program, "a_Texcord");
        gl.vertexAttribPointer(tPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(tPosition);



        // Texture calculation. (In this case, the texture is calculated syncroniusly)
        let texSize = 64;
        let texels = new Uint8Array(4*texSize*texSize);
        let numRows = 8;
        let numCols = 8;
        for(let i = 0; i < texSize; ++i){
            for(let j = 0; j < texSize; ++j)
            {
                let patchx = Math.floor(i/(texSize/numRows));
                let patchy = Math.floor(j/(texSize/numCols));
                let c = 0;
                if (patchx%2 !== patchy%2){
                    c = 255;
                };
                let idx = 4*(i*texSize + j);
                texels[idx] = texels[idx + 1] = texels[idx + 2] = c;
                texels[idx + 3] = 255;
            }
        }
        
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
        let texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, texels);
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
        

        // Texture settings
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);


        function render(){
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        render();
    },

    hasCanvas: true,
    header: "Texturing",
    description:
        "The texture is generated to be a 8 by 8 checkered pattern, ending up as an array of RGBA values. "+
        "To specify where the texture should be used, a new attribute akin to vertices is created. This attribute is essentially coordinates for specifying boundaries for the textures. Just like with vertex attribute it is uploaded with a buffer: \n"+
        "```javascript\n"+
        "let texCords = [vec2(-1.5, 0), vec2(2.5,0), vec2(2.5,10), vec2(-1.5,10)];\n"+
        "gl.tBuffer = gl.createBuffer();\n"+
        "gl.bindBuffer(gl.ARRAY_BUFFER, gl.tBuffer);\n"+
        "gl.bufferData(gl.ARRAY_BUFFER, flatten(texCords), gl.STATIC_DRAW);\n"+
        "\n"+
        "let tPosition = gl.getAttribLocation(program, \"a_Texcord\");\n"+
        "gl.vertexAttribPointer(tPosition, 2, gl.FLOAT, false, 0, 0);\n"+
        "gl.enableVertexAttribArray(tPosition);\n"+
        "```\n"+
        "The actual texture / colouring of the texture is loaded into webgl with the following code:\n"+
        "```javascript\n"+
        "let texture = gl.createTexture();\n"+
        "gl.activeTexture(gl.TEXTURE0);\n"+
        "gl.bindTexture(gl.TEXTURE_2D, texture);\n"+
        "gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, texels);\n"+
        "gl.uniform1i(gl.getUniformLocation(program, \"texMap\"), 0);\n"+
        "```\n"+
        "The texture might be displayed very close or far away, resulting in texels occupying more than one pixel or multiple texels on a single pixel. "+
        "There are different filtering strategies which can be used in this case. In this case, the nearest texel is used when there are multiple candidats. This is setup with: \n"+
        "```javascript\n"+
        "gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);\n"+
        "gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);\n"+
        "```\n"+
        "Additionaly, the texture might be smaller than the surface which it needs to paint on, therefor a strategy is provided to accomodate this. In this case, the patter is repeated in both s and t coordinates. \n"+
        "```javascript\n"+
        "gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);\n"+
        "gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);\n"+
        "```\n"+
        "When the texture and its coordinates are loaded, the fragment shader is responsible for colouring the surface with the texture."
        ,
} 


