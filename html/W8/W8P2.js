let W8P2 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec2 a_Texcord;
            uniform mat4 P;
            uniform mat4 V;
            uniform vec4 lightPosition;
            varying vec2 v_Texcord;
            varying vec4 v_Color;
            void main(){
                v_Texcord = a_Texcord;
                gl_Position = P * V * a_Position;    
            }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
            precision mediump float;
            uniform sampler2D texMap;
            uniform float shadow;
            varying vec2 v_Texcord;
            uniform float v_shadow;
            uniform vec4 shadow_color;
            void main() { 
                if (v_shadow == 1.0){
                    gl_FragColor = shadow_color;
                } else{
                    gl_FragColor = texture2D(texMap, v_Texcord); 
                }
            } 
        `
    
    },

    // Controls
    loadControls: () =>{
        let div = document.createElement("div");

        // Checkbox
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "cb-lightcircle";
        checkbox.checked = true;
        div.appendChild(checkbox);

        // Paragraph
        let p = document.createElement("p");
        p.innerHTML = "Light circulation";
        div.appendChild(p);

        return div;
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
        // gl.enable(gl.DEPTH_TEST);

        
        // Vertices and texels.
        let Yg = -1;
        let GroundQuad = [vec3(2,Yg,-5),vec3(2,Yg,-1),vec3(-2,Yg,-5),vec3(-2,Yg,-1)];
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
        let V = mat4();
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

        let lightC = vec3(0,2,-2)
        let phi = 0;
        let radius = 2;
        let lightCirculation = true;
        let d = -(lightC[1] - Yg);
        let shadowProjectionM = mat4();
        shadowProjectionM[3][3] = 0;
        shadowProjectionM[3][1] = 1/d;

        function render(){
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            

            // Shadows:
            if ( lightCirculation ) {
                phi += 0.025;
            }
            let lPos = vec4(lightC[0] + Math.cos(phi)*radius, lightC[1], lightC[2] + Math.sin(phi)*radius, 1.0);
            let toLM = translate(lPos[0], lPos[1], lPos[2]);
            let fromLM = translate(-lPos[0], -lPos[1], -lPos[2]);
            let shadowMatrix = mult(mult(mult(V, toLM), shadowProjectionM), fromLM);

            

            // Ground
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(V));
            gl.uniform1f(gl.getUniformLocation(program, "v_shadow"), 0.0);
            gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // Quad shadows
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(shadowMatrix)); 
            gl.uniform1f(gl.getUniformLocation(program, "v_shadow"), 1.0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);
            gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);

            // Quads
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(V));
            gl.uniform1f(gl.getUniformLocation(program, "v_shadow"), 0.0);
            gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
            gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);
            gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);

            requestAnimFrame(render);
        }   

        document.getElementById("cb-lightcircle").addEventListener("change", ev => { lightCirculation = ev.target.checked; });

        render();
    },

    hasCanvas: true,
    header: "Projection shadows",
    description:
        "The light source is defined and a shadow projeciton matrix can then be calculated: \n"+
        "```javascript\n"+
        "let lightC = vec3(0,2,-2)\n"+
        "let phi = 0;\n"+
        "let radius = 2;\n"+
        "let lightCirculation = true;\n"+
        "let d = -(lightC[1] - Yg);\n"+
        "let shadowProjectionM = mat4();\n"+
        "shadowProjectionM[3][3] = 0;\n"+
        "shadowProjectionM[3][1] = 1/d;\n"+
        "```\n"+
        "The shadow projection matrix can then be used to calculate a shadow matrix which is used in place of the standard view matrix when it is a shadow that is being rendered.: \n"+
        "```javascript\n"+
        "if ( lightCirculation ) {\n"+
         "\tphi += 0.025;\n"+
        "}\n"+
        "let lPos = vec4(lightC[0] + Math.cos(phi)*radius, lightC[1], lightC[2] + Math.sin(phi)*radius, 1.0);\n"+
        "let toLM = translate(lPos[0], lPos[1], lPos[2]);\n"+
        "let fromLM = translate(-lPos[0], -lPos[1], -lPos[2]);\n"+
        "let shadowMatrix = mult(mult(mult(V, toLM), shadowProjectionM), fromLM);\n"+
        "...\n"+
        "// Quad shadows\n"+
        "gl.uniformMatrix4fv(gl.getUniformLocation(program, \"V\"), false, flatten(shadowMatrix)); \n"+
        "gl.uniform1f(gl.getUniformLocation(program, \"v_shadow\"), 1.0);\n"+
        "gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);\n"+
        "gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);\n"+
        "```\n" +
        "The shadow quads are coloured based on the uniform variable ```v_shadow```, which is used in the fragment shader: \n"+
        "```javascript\n"+
        "if (v_shadow == 1.0){\n"+
            "\tgl_FragColor = shadow_color;\n"+
        "} else{\n"+
        "\tgl_FragColor = texture2D(texMap, v_Texcord); \n"+
        "}\n"+
        "```\n"
        ,
} 


