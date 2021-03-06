let W9P2 = {
    
    loadShaders : () => {
        // Different kind of shader loading as recommended using the "Display shaddows" seciton.
    },

    SHADOW_VSHADER_SOURCE: 'attribute vec4 a_Position;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '}\n',

    SHADOW_FSHADER_SOURCE:
    'precision mediump float;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);\n' +
    '}\n',

    VSHADER_SOURCE:
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_Texcord;\n'+
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_MvpMatrixFromLight;\n' +
    'varying vec4 v_PositionFromLight;\n' +
    'varying vec4 v_Color;\n' +
    'varying vec2 v_Texcord;\n'+
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' + 
    '  v_PositionFromLight = u_MvpMatrixFromLight * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '  v_Texcord = a_Texcord;\n'+
    '}\n',

    FSHADER_SOURCE:
    'precision mediump float;\n' +
    'uniform sampler2D u_ShadowMap;\n' +
    'uniform sampler2D u_TexMap;\n'+
    'uniform float u_HasTexture;\n'+
    'varying vec4 v_PositionFromLight;\n' +
    'varying vec4 v_Color;\n' +
    'varying vec2 v_Texcord;\n'+
    'void main() {\n' +
    '  vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;\n' +
    '  vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);\n' +
    '  float depth = rgbaDepth.r;\n' +
    '  float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;\n' +
    '  if (u_HasTexture == 1.0) {\n'+
    '       gl_FragColor = vec4(texture2D(u_TexMap, v_Texcord).rgb * visibility, v_Color.a);\n'+
    '  } else {\n'+
    '       gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);\n' +
    '  }  \n'+
    '}\n',

    LIGHT_X: 0, 
    LIGHT_Y: 7, 
    LIGHT_Z: 2,
    PLANE_ROT_X: 25,
    PLANE_ROT_Y: 25,
    PLANE_ROT_Z: 25,
    STANDER_X: 0,
    STANDER_Y: 0,
    STANDER_Z: 0,
    viewProjMatrixFromLight: new Matrix4(),
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

        let newSlider = (text, range ,callback) => {
            const label = document.createElement("div");
            label.innerHTML = wshelper.md.render(text);
            div.appendChild(label);

            const slider = document.createElement("input");
            slider.type = "range";
            slider.min = "-"+range;
            slider.step = "1";
            slider.max = range;
            slider.value = "0";
            div.appendChild(slider);

            slider.addEventListener("input", callback);
        }

        newSlider("Quad Rotation Plane-X: ", "45",ev => W9P2.PLANE_ROT_X = ev.target.value);
        newSlider("Quad Rotation Plane-Y: ", "45",ev => W9P2.PLANE_ROT_Y = ev.target.value);
        newSlider("Quad Rotation Plane-Z: ", "45",ev => W9P2.PLANE_ROT_Z = ev.target.value);

        return div;
    },

    initArrayBufferForLaterUse: (gl, data, num, type) => {
        let buffer = gl.createBuffer();
        if (!buffer) {
          console.log('Failed to create the buffer object');
          return null;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      
        buffer.num = num;
        buffer.type = type;
      
        return buffer;
    },

    initElementArrayBufferForLaterUse: (gl, data, type) => {
        let buffer = gl.createBuffer();
        if (!buffer) {
          console.log('Failed to create the buffer object');
          return null;
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
      
        buffer.type = type;
      
        return buffer;
    },

    initFramebufferObject: (gl) => {
        let framebuffer, texture, depthBuffer;
      
        let error = () => {
          if (framebuffer) gl.deleteFramebuffer(framebuffer);
          if (texture) gl.deleteTexture(texture);
          if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
          return null;
        }
      
        framebuffer = gl.createFramebuffer();
        if (!framebuffer) {
          console.log('Failed to create frame buffer object');
          return error();
        }
      
        texture = gl.createTexture();
        if (!texture) {
          console.log('Failed to create texture object');
          return error();
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W9P2.OFFSCREEN_WIDTH, W9P2.OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      
        depthBuffer = gl.createRenderbuffer(); 
        if (!depthBuffer) {
          console.log('Failed to create renderbuffer object');
          return error();
        }
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, W9P2.OFFSCREEN_WIDTH, W9P2.OFFSCREEN_HEIGHT);
      
        // Attach the texture and the renderbuffer object to the FBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
      
        // Check if FBO is configured correctly
        let e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (gl.FRAMEBUFFER_COMPLETE !== e) {
          console.log('Frame buffer object is incomplete: ' + e.toString());
          return error();
        }
      
        framebuffer.texture = texture; // keep the required object
      
        // Unbind the buffer object
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      
        return framebuffer;
    },

    g_modelMatrix: new Matrix4(),
    g_mvpMatrix: new Matrix4(),
    OFFSCREEN_WIDTH:2048, 
    OFFSCREEN_HEIGHT: 2048,
    

    draw: (gl, program, o, viewProjMatrix) => {
        W9P2.initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
        if (program.a_Color != undefined){
            W9P2.initAttributeVariable(gl, program.a_Color, o.colorBuffer);
        }
        if (program.a_Texcord != undefined && o.texcordBuffer != undefined ){
            W9P2.initAttributeVariable(gl, program.a_Texcord, o.texcordBuffer);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
      
        W9P2.g_mvpMatrix.set(viewProjMatrix);
        W9P2.g_mvpMatrix.multiply(W9P2.g_modelMatrix);
        gl.uniformMatrix4fv(program.u_MvpMatrix, false, W9P2.g_mvpMatrix.elements);
        gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0);
    },

    

    initAttributeVariable: (gl, attribute, buffer) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
        gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0); 
        gl.enableVertexAttribArray(attribute); 
    },

    drawQuad: (gl, program, quad, viewProjMatrix) => {
        // Set rotate angle to model matrix and draw plane
        W9P2.g_modelMatrix.setRotate(W9P2.PLANE_ROT_X, 1, 0, 0);
        W9P2.g_modelMatrix.rotate(W9P2.PLANE_ROT_Y, 0, 1, 0);
        W9P2.g_modelMatrix.rotate(W9P2.PLANE_ROT_Z, 0, 0, 1);


        W9P2.draw(gl, program, quad, viewProjMatrix);
    },

    initVertexBuffersForQuad: (gl) => {

        let vertices = new Float32Array([
          3.0, -1.7, 2.5,  -3.0, -1.7, 2.5,  -3.0, -1.7, -2.5,   3.0, -1.7, -2.5 
        ]);
        let colors = new Float32Array([
          1.0, 1.0, 1.0,    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,   1.0, 1.0, 1.0
        ]);
        let indices = new Uint8Array([0, 1, 2,   0, 2, 3]);
        let texcords = flatten([vec2(1,-1), vec2(1,1), vec2(-1,-1), vec2(-1,1)]);



        let img = new Image();
        img.onload = function () {
            
            let texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
        img.src = "../images/xamp23.png";
      
        let o = new Object();
      
        // Write vertex information to buffer object
        o.vertexBuffer = W9P2.initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
        o.colorBuffer = W9P2.initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
        o.indexBuffer = W9P2.initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
        o.texcordBuffer = W9P2.initArrayBufferForLaterUse(gl, texcords, 2, gl.FLOAT);      
        o.numIndices = indices.length;
      
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      
        return o;
    },

    initVertexBuffersForStander: (gl) => {


        var o = new Object();
      
        o.vertexBuffer = W9P2.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.colorBuffer = W9P2.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.normalBuffer = W9P2.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.indexBuffer = W9P2.initElementArrayBufferForLaterUse(gl, new Float32Array([]), gl.UNSIGNED_BYTE);
        if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null; 
      
        wshelper.readOBJFile('./Stander.obj', gl, o, 0.012, true, (objDoc) => {
            o.g_objDoc = objDoc;
            o.numIndices = objDoc.getDrawingInfo().indices.length;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      
        return o;
    },



    drawStander: (gl, program, stander, angle, viewProjMatrix) => {
        W9P2.g_modelMatrix.setRotate(angle, 0, 1, 0);
        W9P2.g_modelMatrix.rotate(-90, 1, 0, 0);
        W9P2.g_modelMatrix.translate(W9P2.STANDER_X + 2,W9P2.STANDER_Y,W9P2.STANDER_Z + 1);
        if (!stander.g_drawingInfo && stander.g_objDoc && stander.g_objDoc.isMTLComplete()){
            stander.g_drawingInfo = wshelper.onReadComplete(gl, stander, stander.g_objDoc);
        }

        if (stander.g_drawingInfo === null || stander.g_drawingInfo === undefined) {
            return;
        } else {
            W9P2.draw(gl, program, stander, viewProjMatrix);
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
        gl.enable(gl.DEPTH_TEST);

        // Init shaders
        let shadowProgram = createProgram(gl, W9P2.SHADOW_VSHADER_SOURCE, W9P2.SHADOW_FSHADER_SOURCE);
        shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
        shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');

        let normalProgram = createProgram(gl, W9P2.VSHADER_SOURCE, W9P2.FSHADER_SOURCE);
        normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');
        normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');
        normalProgram.a_Texcord = gl.getAttribLocation(normalProgram, 'a_Texcord');
        normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');
        normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight');
        normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, 'u_ShadowMap');
        normalProgram.u_TexMap = gl.getUniformLocation(normalProgram, 'u_TexMap');
        normalProgram.u_HasTexture = gl.getUniformLocation(normalProgram, 'u_HasTexture');

        // Init vertex info
        let quad = W9P2.initVertexBuffersForQuad(gl);
        let stander = W9P2.initVertexBuffersForStander(gl);


        // Init FBO
        let fbo = W9P2.initFramebufferObject(gl);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

        // ViewMatrices
        W9P2.UpdateLightMatrix = () => {
            viewProjMatrixFromLight = new Matrix4(); 
            viewProjMatrixFromLight.setPerspective(70.0, W9P2.OFFSCREEN_WIDTH/W9P2.OFFSCREEN_HEIGHT, 1.0, 100.0);
            viewProjMatrixFromLight.lookAt(W9P2.LIGHT_X, W9P2.LIGHT_Y, W9P2.LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        }
        W9P2.UpdateLightMatrix();
        
        let viewProjMatrix = new Matrix4();          
        viewProjMatrix.setPerspective(45, canvas.width/canvas.height, 1.0, 100.0);
        viewProjMatrix.lookAt(0.0, 7.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

        let mvpMatrixFromLight_t = new Matrix4();
        let mvpMatrixFromLight_p = new Matrix4();

        let shouldRotate = true;
        let rotateAngle = 0;

        function render(){
            setTimeout(function(){
                requestAnimationFrame(render);

                if (shouldRotate){
                    rotateAngle += 2;
                }
                
                // Set drawing on offscreen framebuffer.
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                gl.viewport(0, 0, W9P2.OFFSCREEN_HEIGHT, W9P2.OFFSCREEN_HEIGHT);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                // Draw shadows on framebuffer.
                gl.useProgram(shadowProgram);
                W9P2.drawStander(gl, shadowProgram, stander, rotateAngle, viewProjMatrixFromLight);
                mvpMatrixFromLight_t.set(W9P2.g_mvpMatrix);
                W9P2.drawQuad(gl, shadowProgram, quad, viewProjMatrixFromLight);
                mvpMatrixFromLight_p.set(W9P2.g_mvpMatrix);

                // Set drawing for canvas.
                gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.useProgram(normalProgram);
                gl.uniform1i(normalProgram.u_ShadowMap, 0);

                // Draw normally:
                gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements);
                gl.uniform1f(normalProgram.u_HasTexture, 0.0);
                W9P2.drawStander(gl, normalProgram, stander, rotateAngle, viewProjMatrix);
                gl.uniform1i(normalProgram.u_TexMap, 1.0);
                gl.uniform1f(normalProgram.u_HasTexture, 1.0);
                gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
                W9P2.drawQuad(gl, normalProgram, quad, viewProjMatrix);
                
            }, 25);
        }

        document.getElementById("cb-lightcircle").addEventListener("change", ev => { shouldRotate = ev.target.checked; });

        render();
    },

    hasCanvas: true,
    header: "Shadow mapping",
    description:
        "Everything from the worksheet ie. tips, material, and instructions were very hard to parse. "+
        "Therefor the best guess is implemented with a lot of inspiration from the picture and Display shadows section of WebGL programming guide.\n\n"+
        "Like in part 1, 2 pairs of fragment and vertex shaders are constructed, in this part there is one for shadows and one for regular drawing. "+
        "Functions are constructed to help initialize the models the quad and stander: ```initVertexBuffersForQuad``` and ```initVertexBuffersForStander```. "+
        "Additionally, functions for drawing the quad and stander object are also written for better readability, ```drawQuad``` and ```drawStander```. "+
        "\n#### Shadows mapped in offscreen buffer\n\n"+
        "The main and new difference from part 1 is the way shadows are handled. In this case, the quad and ground are psudo drawn onto a offscreen buffer with the perspective of the light source. "+
        "By drawing the quad and stander from the perspective of the light source, the depths buffer is populated naturally from the light source, ie. the correct manner. "+
        "This offscreen framebuffer then be utilized as depths lookup from the perspective of the light source in the form of a texture lookup later. " +
        "##### Framebuffer initialization\n"+
        "The framebuffer is initialized and bound to texture 0 such that when drawn to, it will be drawn to texture 0 for later lookup.\n" +
        "```javascript\n"+
        "// Init FBO\n"+
        "let fbo = W9P2.initFramebufferObject(gl);\n"+
        "gl.activeTexture(gl.TEXTURE0);\n"+
        "gl.bindTexture(gl.TEXTURE_2D, fbo.texture);\n"+
        "```\n"+
        "##### Shadows are mapped\n"+
        "Shadows are then mapped to the offscreen buffer, by binding the framebuffer and then drawing the quad and the stander with the a viewmodel (Camera/Eye) that is from the perspective of the light source. "+
        "Consequently, populating the texture with depths coordinates etc. \n"+
        "```javascript\n"+
        "// Set drawing on offscreen framebuffer.\n"+
        "gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);\n"+
        "gl.viewport(0, 0, W9P2.OFFSCREEN_HEIGHT, W9P2.OFFSCREEN_HEIGHT);\n"+
        "gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);\n"+
        "\n"+
        "// Draw shadows on framebuffer.\n"+
        "gl.useProgram(shadowProgram);\n"+
        "W9P2.drawStander(gl, shadowProgram, stander, rotateAngle, viewProjMatrixFromLight);\n"+
        "mvpMatrixFromLight_t.set(W9P2.g_mvpMatrix);\n"+
        "W9P2.drawQuad(gl, shadowProgram, quad, viewProjMatrixFromLight);\n"+
        "mvpMatrixFromLight_p.set(W9P2.g_mvpMatrix);\n"+
        "```\n"+
        "Very importantly, for the shadow program, the depths stored as red in the shader.\n"+
        "```\n"+
        "gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);\n"+
        "```\n"+
        "After this, the framebuffer is then set to NULL and normal drawing program is used as to set it back to the regular canvas drawing.\n"+
        "```javascript\n"+
        "// Set drawing for canvas.\n"+
        "gl.bindFramebuffer(gl.FRAMEBUFFER, null);\n"+ 
        "gl.viewport(0, 0, canvas.width, canvas.height);\n"+
        "gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);\n"+
        "gl.useProgram(normalProgram);\n"+
        "gl.uniform1i(normalProgram.u_ShadowMap, 0);\n"+
        "```\n"+
        "##### Regular drawing, with shadow lookup\n"+
        "As previously mentioned, the shadows were stored as red in the shadow map, therefor the depth can be looked up in the texturemap with following in the shader:\n"+
        "```\n"+        
        "vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);\n"+
        "float depth = rgbaDepth.r;\n"+
        "float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;\n" +
        "```\n"+
        "Using the shadow lookup, a visibility factor can be derived. \n"+
        "This visibility factor essentially determines whether the current vertex is behind something or not with the perspective of the light source. "+
        "The visibility factor will be 0.7 when the vertex is determined behind something else, and can therefor be used to dim the color to match ambient light instead of pure black. \n" +
        "```\n"+
        "if (u_HasTexture == 1.0) {\n"+
        "\t gl_FragColor = vec4(texture2D(u_TexMap, v_Texcord).rgb * visibility, v_Color.a);\n"+
        "} else {\n"+
        "\tgl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);\n" +
        "}  \n"+
        "```\n"
        ,
} 


