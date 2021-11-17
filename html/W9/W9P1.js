let W9P1 = {
    
    loadShaders : () => {
        let objectVertex = document.getElementById("object-vertex-shader");
        objectVertex.innerText = `
        attribute vec4 a_Position;
        attribute vec4 a_Normal;
        attribute vec4 a_Color;
        varying vec4 v_Color;


        uniform mat4 P;
        uniform mat4 V;

        varying float v_shadow;
        uniform float shadow;

        varying vec3 N, L, E;
        uniform vec4 lightPosition;
        uniform mat3 normalMatrix;


        void main(){
            v_shadow = shadow;
            vec3 pos = (V * a_Position).xyz;
            if(lightPosition.w == 0.0) L = normalize(lightPosition.xyz);
            else L = normalize( lightPosition.xyz - pos );
            E = -normalize(pos);
            N = normalize(normalMatrix*a_Normal.xyz);
            if (shadow == 1.0){
                gl_Position = P * V * a_Position;
            } else{
                gl_Position = P * V * a_Position;
            }
            v_Color = a_Color;
        }
    `
        
        let objectFragment = document.getElementById("object-fragment-shader");
        objectFragment.innerText = `
        precision mediump float;
        uniform sampler2D texMap;
        varying vec4 v_Color; 
        uniform float shininess;
        uniform vec4 shadow_color;
        uniform vec4 ambientProduct;
        uniform vec4 diffuseProduct;
        uniform vec4 specularProduct;
        varying float v_shadow;
        varying vec3 N, L, E;
        void main() { 
            vec4 f_Color;
            vec3 H = normalize( L + E );
    
            vec4 ambient = ambientProduct;
    
            float Kd = max( dot(L, N), 0.0 );
            vec4  diffuse = Kd*diffuseProduct;
    
            float Ks = pow( max(dot(N, H), 0.0), shininess );
            vec4  specular = Ks * specularProduct;
            if( dot(L, N) < 0.0 ) {
                specular = vec4(0.0, 0.0, 0.0, 1.0);
            } 
    
            if (v_shadow == 1.0){
                f_Color = vec4(0,0,0,1);
            } else{
                f_Color = ambient + diffuse + specular;
            }
            gl_FragColor = f_Color;
        } 
        `

        let groundVertex = document.getElementById("ground-vertex-shader");
        groundVertex.innerText = `
        attribute vec4 a_Position;
        attribute vec2 a_Texcord;
        uniform mat4 P;
        uniform mat4 V;
        varying vec2 v_Texcord;
        varying vec4 v_Color;
        
        void main(){
            v_Texcord = a_Texcord;
            gl_Position = P * V * a_Position;  
    
        }
        `
        
        let groundFragment = document.getElementById("ground-fragment-shader");
        groundFragment.innerText = `
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
        let div = document.createElement("div");

        // Checkbox
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "cb-lightcircle";
        checkbox.checked = true;
        div.appendChild(checkbox);

        // Paragraph
        let p = document.createElement("p");
        p.innerHTML = "Light circulation & Bounce";
        div.appendChild(p);

        return div;
    },

    initAttributeVariable: (gl, attribute, buffer) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
        gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0); 
        gl.enableVertexAttribArray(attribute); 
    },

    Yg: -1,

    initObject: (gl, program) => {

        // Attribute locations.
        
        program.a_Position = gl.getAttribLocation(program, "a_Position");
        program.a_Normal =  gl.getAttribLocation(program, "a_Normal");
        program.a_Color = gl.getAttribLocation(program, "a_Color");
        
        

        // Position:
        program.vBuffer = gl.createBuffer();
        program.vBuffer.num = 3;
        program.vBuffer.type = gl.FLOAT;
        gl.bindBuffer(gl.ARRAY_BUFFER, program.vBuffer);
        
        gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Position);

        // Normals
        program.nBuffer = gl.createBuffer();
        program.nBuffer.num = 3;
        program.nBuffer.type = gl.FLOAT;
        gl.bindBuffer(gl.ARRAY_BUFFER, program.nBuffer);
        
        gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Normal);

        // Colors:
        program.cBuffer = gl.createBuffer();
        program.cBuffer.num = 4;
        program.cBuffer.type = gl.FLOAT;
        gl.bindBuffer(gl.ARRAY_BUFFER, program.cBuffer);
    
        gl.vertexAttribPointer(program.a_Color, 4, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(program.a_Color);

        // Indices:
        program.iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program.iBuffer);

        // Mesh model
        let model = new Object();
        model.vertexBuffer = program.vBuffer;
        model.normalBuffer = program.nBuffer;
        model.colorBuffer = program.cBuffer;
        model.indexBuffer = program.iBuffer;
        program.model = model;
        wshelper.readOBJFile('./Stander.obj', gl, model, 0.012, true, (objDoc) => {program.g_objDoc = objDoc});

        // Light stuff
        let le = 1;
        let ka = 0.10;
        let ambient = mult(vec4(le, le, le, le ),vec4(ka, ka, ka, ka ));

        let kd = 0.8;
        let diffuse = vec4( kd, kd, kd, 1);
        
        let ks = 0.5;
        let specular = mult(vec4( ks, ks, ks, ks ),vec4( 1.0, 1.0, 1.0, 1.0));

        let lightC = vec3(0,5,-2)
        let phi = 0;
        let radius = 2;
        program.lightCirculation = true;
        
        gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),  flatten(diffuse));
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),  flatten(ambient));
        gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specular));
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), 10);

        // Shadow stuff
        let d = -(lightC[1] - (W9P1.Yg));
        let shadowProjectionM = mat4();
        shadowProjectionM[3][3] = 0;
        shadowProjectionM[3][1] = 1/d;
        
        // View
        let PLoc = gl.getUniformLocation(program, "P");
        let VLoc = gl.getUniformLocation(program, "V");
        program.VLoc = VLoc;
        let P = perspective(90, 512/512, 0.1, 20);
        gl.uniformMatrix4fv(PLoc, false, flatten(P));
        let rotValue = 0;
        program.rotationValue = 0;
        program.render = () => {
            gl.useProgram(program);
            W9P1.initAttributeVariable(gl, program.a_Position, program.vBuffer);
            W9P1.initAttributeVariable(gl, program.a_Normal, program.nBuffer);
            W9P1.initAttributeVariable(gl, program.a_Color, program.cBuffer);

            if (!program.g_drawingInfo && program.g_objDoc && program.g_objDoc.isMTLComplete()){
                program.g_drawingInfo = wshelper.onReadComplete(gl, program.model, program.g_objDoc);
            }
            if (program.g_drawingInfo === null || program.g_drawingInfo === undefined) {
                return;
            }

            if ( program.lightCirculation ) {
                phi += 0.025;
                rotValue +=1;
            }
            
            // Shadow matrix
            let T = translate(1,0.25 + Math.sin(phi)/10,-2.5);
            if (program.lightCirculation ) {
                phi += 0.025;
            }
            let lPos = vec4(lightC[0] + Math.cos(phi)*radius, lightC[1], lightC[2] + Math.sin(phi)*radius, 1.0);
            let toLM = translate(lPos[0], lPos[1], lPos[2]);
            let fromLM = translate(-lPos[0], -lPos[1], -lPos[2]);

            V = mat4();
            V = mult(V, T)

            
            let shadowMatrix = mult(mult(mult(V, toLM), shadowProjectionM), fromLM);



            // Lys på stander ting.
            let normalMatrix = [
                vec3(V[0][0], V[0][1], V[0][2]),
                vec3(V[1][0], V[1][1], V[1][2]),
                vec3(V[2][0], V[2][1], V[2][2])
            ];
            gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix)); 
            gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lPos));

            
            gl.enable(gl.BLEND);
            gl.enable(gl.CULL_FACE);
            gl.frontFace(gl.CCW);
            // Render stander shadow
            gl.blendFunc(gl.ZERO, gl.ZERO);
            gl.uniform1f(gl.getUniformLocation(program, "shadow"), 0.0);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(shadowMatrix)); 
            gl.drawElements(gl.TRIANGLES, program.g_drawingInfo.indices.length, gl.UNSIGNED_BYTE, 0);


            // // Draw stander
            gl.disable(gl.BLEND);
            gl.depthFunc(gl.LESS);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            program.rotationValue +=1;
            gl.uniform1f(gl.getUniformLocation(program, "shadow"), 0.0);
            gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix));     
            gl.uniformMatrix4fv(program.VLoc, false, flatten(V));
            gl.drawElements(gl.TRIANGLES, program.g_drawingInfo.indices.length, gl.UNSIGNED_BYTE, 0);
        }


    },

    initGround:(gl, program) => {

        program.a_Position = gl.getAttribLocation(program, "a_Position");
        program.a_Texcord = gl.getAttribLocation(program, "a_Texcord");
        

        // Vertices
        let GroundQuad = [vec3(2,W9P1.Yg,-5),vec3(2,W9P1.Yg,-1),vec3(-2,W9P1.Yg,-5),vec3(-2,W9P1.Yg,-1)];
        program.vBuffer = gl.createBuffer();
        program.vBuffer.num = 3;
        program.vBuffer.type = gl.FLOAT;
        gl.bindBuffer(gl.ARRAY_BUFFER, program.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(GroundQuad), gl.STATIC_DRAW);

        gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Position);

        // Texture cords
        let GroundQuadTexCord = [vec2(1,-1), vec2(1,1), vec2(-1,-1), vec2(-1,1)];
        program.tBuffer = gl.createBuffer();
        program.tBuffer.num = 2;
        program.tBuffer.type = gl.FLOAT;
        gl.bindBuffer(gl.ARRAY_BUFFER, program.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(GroundQuadTexCord), gl.STATIC_DRAW);

        gl.vertexAttribPointer(program.a_Texcord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Texcord);

        
        // PVM
        let V = mat4();
        let T = translate(0,0,0);
        V = mult(V, T);

        let P = perspective(90, 512/512, 0.1, 20);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(V));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(P));

        // Texture setup. (The texture is already loaded, because it was calculated)
        let img = new Image();
        program.isLoaded = false;
        img.onload = function () {
            
            let texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
            gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            program.isLoaded = true;
        }
        img.src = "../images/xamp23.png";

        program.render = () => {
            gl.useProgram(program);
            W9P1.initAttributeVariable(gl, program.a_Position, program.vBuffer);
            W9P1.initAttributeVariable(gl, program.a_Texcord, program.tBuffer);


            gl.depthFunc(gl.LESS);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(V));
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(P));

            gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);


            gl.enable(gl.BLEND);
            gl.disable(gl.CULL_FACE);
            gl.frontFace(gl.CCW);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

    },

    

    init: () => {
        // Initialize
        let canvas = document.getElementById("c");
        if (canvas === null) return;
        let gl = canvas.getContext("webgl");
        if (!gl){
            console.error("Yo gl was not found")
        }
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor(0.8,0.9,1.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        
    
        let objectProgram = initShaders(gl, "object-vertex-shader", "object-fragment-shader");
        gl.useProgram(objectProgram);
        W9P1.initObject(gl, objectProgram);
        
        let groundProgram = initShaders(gl, "ground-vertex-shader", "ground-fragment-shader");
        gl.useProgram(groundProgram);
        W9P1.initGround(gl, groundProgram);

        // Rotation of stander

        function render(){
            setTimeout(function(){
                requestAnimationFrame(render);
                
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                
                groundProgram.render();
                objectProgram.render();
            }, 25);
        }

        document.getElementById("cb-lightcircle").addEventListener("change", ev => { objectProgram.lightCirculation = ev.target.checked; });

        render();
    },

    hasCanvas: true,
    header: "Scene and projection shadows for reference",
    description:
        "When trying with the teapot, the file seemed to be corrupted, so same mesh from worksheet 5 is used.\n"+
        "Without the teapot and clear instructions, the best guess for what the intent of the worksheet part is done with the homemade mesh."+
        "The scene is now split into 4 shaders and loaded whenever it is needed."+
        "Functions are introduced to help initialize the shader programs: \n"+
        "```javascript\n"+
        "let objectProgram = initShaders(gl, \"object-vertex-shader\", \"object-fragment-shader\");\n"+
        "gl.useProgram(objectProgram);\n"+
        "W9P1.initObject(gl, objectProgram);\n"+
        "\n"+
        "let groundProgram = initShaders(gl, \"ground-vertex-shader\", \"ground-fragment-shader\");\n"+
        "gl.useProgram(groundProgram);\n"+
        "W9P1.initGround(gl, groundProgram);\n"+
        "```\n"+
        "The init functions for each of the programs contains code for initializing buffers, enabling and binding attributes, setting buffer data for position, texture cords, texture map etc."+
        "Besides buffers and attribute locations, each function will set a render function on the corresponding program. This will then be called in the render function:\n"+
        "```javascript´\n"+
        "function render(){\n"+
        "\tsetTimeout(function(){\n"+
        "\t\trequestAnimationFrame(render);\n"+
        "\n"        +
        "\t\tgl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);\n"+
        "\n"        +
         "\t\tgroundProgram.render();\n"+
          "\t\tobjectProgram.render();\n"+
            "\t}, 25);\n"+
        "}\n"+
        "```\n"+
        "The render functions will both set the correct program and initilize the attribute bindings for the program. For example the ground render function will do the following 3 lines first:"+
        "\n```javascript\n"+
        "gl.useProgram(program);\n"+
        "W9P1.initAttributeVariable(gl, program.a_Position, program.vBuffer);\n"+
        "W9P1.initAttributeVariable(gl, program.a_Texcord, program.tBuffer);\n"+
        "```\n"
        
        ,
} 


