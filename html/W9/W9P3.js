let W9P3 = {
    
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

        newSlider("Quad Rotation Plane-X: ", "45",ev => W9P3.PLANE_ROT_X = ev.target.value);
        newSlider("Quad Rotation Plane-Y: ", "45",ev => W9P3.PLANE_ROT_Y = ev.target.value);
        newSlider("Quad Rotation Plane-Z: ", "45",ev => W9P3.PLANE_ROT_Z = ev.target.value);

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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W9P3.OFFSCREEN_WIDTH, W9P3.OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      
        depthBuffer = gl.createRenderbuffer(); 
        if (!depthBuffer) {
          console.log('Failed to create renderbuffer object');
          return error();
        }
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, W9P3.OFFSCREEN_WIDTH, W9P3.OFFSCREEN_HEIGHT);
      
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
        W9P3.initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
        if (program.a_Color != undefined){
            W9P3.initAttributeVariable(gl, program.a_Color, o.colorBuffer);
        }
        if (program.a_Texcord != undefined && o.texcordBuffer != undefined ){
            W9P3.initAttributeVariable(gl, program.a_Texcord, o.texcordBuffer);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
      
        W9P3.g_mvpMatrix.set(viewProjMatrix);
        W9P3.g_mvpMatrix.multiply(W9P3.g_modelMatrix);
        gl.uniformMatrix4fv(program.u_MvpMatrix, false, W9P3.g_mvpMatrix.elements);
        gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0);
    },

    

    initAttributeVariable: (gl, attribute, buffer) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
        gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0); 
        gl.enableVertexAttribArray(attribute); 
    },

    drawQuad: (gl, program, quad, viewProjMatrix) => {
        // Set rotate angle to model matrix and draw plane
        W9P3.g_modelMatrix.setRotate(W9P3.PLANE_ROT_X, 1, 0, 0);
        W9P3.g_modelMatrix.rotate(W9P3.PLANE_ROT_Y, 0, 1, 0);
        W9P3.g_modelMatrix.rotate(W9P3.PLANE_ROT_Z, 0, 0, 1);


        W9P3.draw(gl, program, quad, viewProjMatrix);
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
        o.vertexBuffer = W9P3.initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
        o.colorBuffer = W9P3.initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
        o.indexBuffer = W9P3.initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
        o.texcordBuffer = W9P3.initArrayBufferForLaterUse(gl, texcords, 2, gl.FLOAT);      
        o.numIndices = indices.length;
      
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      
        return o;
    },

    initVertexBuffersForStander: (gl) => {


        var o = new Object();
      
        o.vertexBuffer = W9P3.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.colorBuffer = W9P3.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.normalBuffer = W9P3.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.indexBuffer = W9P3.initElementArrayBufferForLaterUse(gl, new Float32Array([]), gl.UNSIGNED_BYTE);
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
        W9P3.g_modelMatrix.setRotate(angle, 0, 1, 0);
        W9P3.g_modelMatrix.rotate(-60, 1, 0, 0);
        W9P3.g_modelMatrix.translate(W9P3.STANDER_X + 2,W9P3.STANDER_Y,W9P3.STANDER_Z + 1);
        if (!stander.g_drawingInfo && stander.g_objDoc && stander.g_objDoc.isMTLComplete()){
            stander.g_drawingInfo = wshelper.onReadComplete(gl, stander, stander.g_objDoc);
        }

        if (stander.g_drawingInfo === null || stander.g_drawingInfo === undefined) {
            return;
        } else {
            W9P3.draw(gl, program, stander, viewProjMatrix);
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
        let shadowProgram = createProgram(gl, W9P3.SHADOW_VSHADER_SOURCE, W9P3.SHADOW_FSHADER_SOURCE);
        shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
        shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');

        let normalProgram = createProgram(gl, W9P3.VSHADER_SOURCE, W9P3.FSHADER_SOURCE);
        normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');
        normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');
        normalProgram.a_Texcord = gl.getAttribLocation(normalProgram, 'a_Texcord');
        normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');
        normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight');
        normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, 'u_ShadowMap');
        normalProgram.u_TexMap = gl.getUniformLocation(normalProgram, 'u_TexMap');
        normalProgram.u_HasTexture = gl.getUniformLocation(normalProgram, 'u_HasTexture');

        // Init vertex info
        let quad = W9P3.initVertexBuffersForQuad(gl);
        let stander = W9P3.initVertexBuffersForStander(gl);


        // Init FBO
        let fbo = W9P3.initFramebufferObject(gl);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

        // ViewMatrices
        W9P3.UpdateLightMatrix = () => {
            viewProjMatrixFromLight = new Matrix4(); 
            viewProjMatrixFromLight.setPerspective(70.0, W9P3.OFFSCREEN_WIDTH/W9P3.OFFSCREEN_HEIGHT, 1.0, 100.0);
            viewProjMatrixFromLight.lookAt(W9P3.LIGHT_X, W9P3.LIGHT_Y, W9P3.LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        }
        W9P3.UpdateLightMatrix();
        
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
                gl.viewport(0, 0, W9P3.OFFSCREEN_HEIGHT, W9P3.OFFSCREEN_HEIGHT);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                // Draw shadows on framebuffer.
                gl.useProgram(shadowProgram);
                W9P3.drawStander(gl, shadowProgram, stander, rotateAngle, viewProjMatrixFromLight);
                mvpMatrixFromLight_t.set(W9P3.g_mvpMatrix);
                W9P3.drawQuad(gl, shadowProgram, quad, viewProjMatrixFromLight);
                mvpMatrixFromLight_p.set(W9P3.g_mvpMatrix);

                // Set drawing for canvas.
                gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.useProgram(normalProgram);
                gl.uniform1i(normalProgram.u_ShadowMap, 0);

                // Draw normally:
                gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements);
                gl.uniform1f(normalProgram.u_HasTexture, 0.0);
                W9P3.drawStander(gl, normalProgram, stander, rotateAngle, viewProjMatrix);
                gl.uniform1i(normalProgram.u_TexMap, 1.0);
                gl.uniform1f(normalProgram.u_HasTexture, 1.0);
                gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
                W9P3.drawQuad(gl, normalProgram, quad, viewProjMatrix);
                
            }, 25);
        }

        document.getElementById("cb-lightcircle").addEventListener("change", ev => { shouldRotate = ev.target.checked; });

        render();
    },

    hasCanvas: true,
    header: "Shadow comparison",
    description:
        "## Shadow projection\n"+
        "Part 1 of this worksheet demonstrates shadow projection.\n"+
        "#### Pros\n"+
        "- Only needs to draw additional polygons, this is fairly efficient. \n"+
        "- Shadow polygons can be drawn within the same shader.\n"+
        "#### Cons\n"+
        "- Shadow polygons are alright to create for a flat surface, but will be complex if shadows are casted on a non flat surface.\n"+
        "- For the part 1 shadow projections, it is assumed that shadow polygons are only casted on a flat surface. \n"+
        "- The shadows produced by the shadow polygons do not support self shadowing. \n"+
        "## Shadow mapping\n"+
        "Part 2 and 3 of this worksheet demonstrates shadow projection.\n"+
        "#### Pros\n"+
        "- Shadows are easily cast on any type of surface, flat or deformed. \n"+
        "- It is easy to scale for multiple light sources, as each light source could produce a shadow map to be used later.\n"+
        "- Self shadowing is supported (The object is slighty tilted compared to part 2 to showcase this). \n"+
        "#### Cons\n"+
        "- Drawing to an offscreen buffer require a lot of additional computing power, as the scene is essentially drawn twice. One for mapping shadows, and lastly for drawing the scene. \n"
        ,
} 


