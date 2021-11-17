let W10P4 = {
    
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

    viewProjMatrixFromLight: new Matrix4(),
    // Controls
    loadControls: () =>{
        let div = document.createElement("div");

        let generateSelect = (id, label) => {
            let select_row = document.createElement("div");
            div.appendChild(select_row);
            select_row.classList.add("row", "js-select");
            
            let select_col = document.createElement("div");
            select_col.classList.add("col-md-5","mb-3");
            select_row.appendChild(select_col);

            let select_label = document.createElement("label");
            select_label["for"] = id;
            select_label.innerText = label;
            select_col.appendChild(select_label);

            let select = document.createElement("select");
            select.classList.add("custom-select","d-block","w-100");
            select.id = id;
            select_col.appendChild(select);

            return select;
        }

        let generateOptions = (select, opts) => {
            for (let index = 0; index < opts.length; index++) {
                const element = opts[index];
                let option = document.createElement("option");
                option.value = index;
                option.innerText = element;
                select.appendChild(option);
            }
        }

        let select = generateSelect("interaction-mode", "Interaction mode");
        generateOptions(select, ["Rotation","Dolly", "Panning"]);

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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W10P4.OFFSCREEN_WIDTH, W10P4.OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      
        depthBuffer = gl.createRenderbuffer(); 
        if (!depthBuffer) {
          console.log('Failed to create renderbuffer object');
          return error();
        }
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, W10P4.OFFSCREEN_WIDTH, W10P4.OFFSCREEN_HEIGHT);
      
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
        W10P4.initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
        if (program.a_Color != undefined){
            W10P4.initAttributeVariable(gl, program.a_Color, o.colorBuffer);
        }
        if (program.a_Texcord != undefined && o.texcordBuffer != undefined ){
            W10P4.initAttributeVariable(gl, program.a_Texcord, o.texcordBuffer);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
      
        W10P4.g_mvpMatrix.set(viewProjMatrix);
        W10P4.g_mvpMatrix.multiply(W10P4.g_modelMatrix);
        gl.uniformMatrix4fv(program.u_MvpMatrix, false, W10P4.g_mvpMatrix.elements);
        gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0);
    },

    

    initAttributeVariable: (gl, attribute, buffer) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
        gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0); 
        gl.enableVertexAttribArray(attribute); 
    },

    drawQuad: (gl, program, quad, viewProjMatrix) => {
        // Set rotate angle to model matrix and draw plane
        W10P4.g_modelMatrix.setRotate(0, 1, 0, 0);
        W10P4.g_modelMatrix.rotate(0, 0, 1, 0);
        W10P4.g_modelMatrix.rotate(0, 0, 0, 1);
        W10P4.g_modelMatrix.translate(0, -2, 0);

        W10P4.draw(gl, program, quad, viewProjMatrix);
    },

    initVertexBuffersForQuad: (gl) => {
        let scale = 5;
        let vertices = new Float32Array([
          3.0*scale, -2, 2.5*scale,  -3.0*scale, -2, 2.5*scale,  -3.0*scale, -2, -2.5*scale,   3.0*scale, -2, -2.5*scale 
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
        o.vertexBuffer = W10P4.initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
        o.colorBuffer = W10P4.initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
        o.indexBuffer = W10P4.initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
        o.texcordBuffer = W10P4.initArrayBufferForLaterUse(gl, texcords, 2, gl.FLOAT);      
        o.numIndices = indices.length;
      
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      
        return o;
    },

    initVertexBuffersForStander: (gl) => {


        var o = new Object();
      
        o.vertexBuffer = W10P4.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.colorBuffer = W10P4.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.normalBuffer = W10P4.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.indexBuffer = W10P4.initElementArrayBufferForLaterUse(gl, new Float32Array([]), gl.UNSIGNED_BYTE);
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


    q_rot: new Quaternion(),
    q_inc: new Quaternion(),
    q_dollyPan: new Vector3([4, 0,0]),
    q_pan_X: 0,
    q_pan_Y: 0,


    drawStander: (gl, program, stander, angle, viewProjMatrix) => {
        W10P4.g_modelMatrix.setRotate(-90, 1, 0, 0);
        
        W10P4.g_modelMatrix.translate(0.7,0.35,-0.35);
        if (!stander.g_drawingInfo && stander.g_objDoc && stander.g_objDoc.isMTLComplete()){
            stander.g_drawingInfo = wshelper.onReadComplete(gl, stander, stander.g_objDoc);
        }

        if (stander.g_drawingInfo === null || stander.g_drawingInfo === undefined) {
            return;
        } else {
            W10P4.draw(gl, program, stander, viewProjMatrix);
        }


    },

    

    init: () => {
        // Initialize
        const canvas = document.getElementById("c");
        if (canvas === null) return;
        const gl = canvas.getContext("webgl");
        if (!gl){
            console.error("Yo gl was not found")
        }
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor(0.8,0.9,1.0,1.0);
        gl.enable(gl.DEPTH_TEST);

        // Init shaders
        const shadowProgram = createProgram(gl, W10P4.SHADOW_VSHADER_SOURCE, W10P4.SHADOW_FSHADER_SOURCE);
        shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
        shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');

        const normalProgram = createProgram(gl, W10P4.VSHADER_SOURCE, W10P4.FSHADER_SOURCE);
        normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');
        normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');
        normalProgram.a_Texcord = gl.getAttribLocation(normalProgram, 'a_Texcord');
        normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');
        normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight');
        normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, 'u_ShadowMap');
        normalProgram.u_TexMap = gl.getUniformLocation(normalProgram, 'u_TexMap');
        normalProgram.u_HasTexture = gl.getUniformLocation(normalProgram, 'u_HasTexture');

        // Init vertex info
        const quad = W10P4.initVertexBuffersForQuad(gl);
        const stander = W10P4.initVertexBuffersForStander(gl);


        // Init FBO
        const fbo = W10P4.initFramebufferObject(gl);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

        // ViewMatrices
        W10P4.UpdateLightMatrix = () => {
            viewProjMatrixFromLight = new Matrix4(); 
            viewProjMatrixFromLight.setPerspective(90.0, W10P4.OFFSCREEN_WIDTH/W10P4.OFFSCREEN_HEIGHT, 1.0, 100.0);
            viewProjMatrixFromLight.lookAt(W10P4.LIGHT_X, W10P4.LIGHT_Y, W10P4.LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        }
        W10P4.UpdateLightMatrix();
        let viewProjMatrix = new Matrix4();   

        W10P4.UpdateViewMatrix = () => {
            viewProjMatrix = new Matrix4();
            viewProjMatrix.setPerspective(45, canvas.width/canvas.height, 1.0, 100.0);
            let qrot = W10P4.q_rot;
            let u = qrot.apply(new Vector3([0, 1, 0]));
            let r = qrot.apply(new Vector3([1, 0, 0]));
            let e = W10P4.q_dollyPan.elements;
            let p = new Vector3([0,0,0]).elements;
            let c = new Vector3([p[0] - r[0] * e[1] - u[0] * e[2], p[1] - r[1] * e[1] - u[1] * e[2], p[2] - r[2] * e[1] - u[2] * e[2]]).elements;
            let qrotEye = qrot.apply(vec3(0,1.0, e[0]));
            viewProjMatrix.lookAt(qrotEye[0] + c[0], qrotEye[1] + c[1], qrotEye[2] + c[2], c[0], c[1], c[2], u[0], u[1], u[2]);
        }
        W10P4.UpdateViewMatrix();
        

        let mvpMatrixFromLight_t = new Matrix4();
        let mvpMatrixFromLight_p = new Matrix4();

        let rotateAngle = 0;

        function render(){
            setTimeout(function(){
                requestAnimationFrame(render);
                let baseRot = new Quaternion().set(W10P4.q_rot);
                W10P4.q_rot = baseRot.multiply(W10P4.q_inc);
                W10P4.UpdateViewMatrix();

                // Set drawing on offscreen framebuffer.
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                gl.viewport(0, 0, W10P4.OFFSCREEN_HEIGHT, W10P4.OFFSCREEN_HEIGHT);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                // Draw shadows on framebuffer.
                gl.useProgram(shadowProgram);
                W10P4.drawStander(gl, shadowProgram, stander, rotateAngle, viewProjMatrixFromLight);
                mvpMatrixFromLight_t.set(W10P4.g_mvpMatrix);
                W10P4.drawQuad(gl, shadowProgram, quad, viewProjMatrixFromLight);
                mvpMatrixFromLight_p.set(W10P4.g_mvpMatrix);

                // Set drawing for canvas.
                gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.useProgram(normalProgram);
                gl.uniform1i(normalProgram.u_ShadowMap, 0);

                // Draw normally:
                gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements);
                gl.uniform1f(normalProgram.u_HasTexture, 0.0);
                W10P4.drawStander(gl, normalProgram, stander, rotateAngle, viewProjMatrix);
                gl.uniform1i(normalProgram.u_TexMap, 1.0);
                gl.uniform1f(normalProgram.u_HasTexture, 1.0);
                gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
                W10P4.drawQuad(gl, normalProgram, quad, viewProjMatrix);
                
            }, 25);
        }

        let rect = canvas.getBoundingClientRect();
        let mouseDown = false;
        let beginScrollTop = 0;
        let beginScrollLeft = 0;
        let lastQRot = W10P4.q_rot;
        let lastEyeZ = W10P4.q_dollyPan.elements[0];
        let lastPanx = W10P4.q_pan_X;
        let lastPany = W10P4.q_pan_Y;
        let last_x = 0;
        let last_y = 0;
        let u = vec3(0,0,0);

        let project_to_sphere = (x, y) => {
            var r = 2;
            var d = Math.sqrt(x * x + y * y);
            var t = r * Math.sqrt(2);
            var z;
            if (d < r) 
              z = Math.sqrt(r * r - d * d);
            else if (d < t)
              z = 0;
            else
              z = t * t / d;
            return z;
          }

        let mouseDownFunc = ev => {
            beginScrollTop = document.documentElement.scrollTop || document.body.scrollTop
            beginScrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
            rect = canvas.getBoundingClientRect()
            last_x = (0.5 - (ev.clientX - rect.left) / rect.width) * 4;
            last_y = ((ev.clientY - rect.top) / rect.height - 0.5) * 4;
            u = vec3(last_x, last_y, project_to_sphere(last_x, last_y));
            lastQRot = new Quaternion().set(W10P4.q_rot);
            lastEyeZ = W10P4.q_dollyPan.elements[0];
            lastPanx = W10P4.q_dollyPan.elements[1];
            lastPany = W10P4.q_dollyPan.elements[2];
            mouseDown = true;
        };

        let rotation = ev => {
            const x = (0.5 - (ev.clientX - rect.left) / rect.width) * 4;
            const y = ((ev.clientY - rect.top) / rect.height - 0.5) * 4;
            const v = vec3(x, y, project_to_sphere(x, y));
            W10P4.q_inc = W10P4.q_inc.make_rot_vec2vec(normalize(u), normalize(v));
        }

        let dolly = ev => {
            const y = ((ev.clientY - rect.top) / rect.height - 0.5) * 4;
            const dif = last_y - y
            
            W10P4.q_dollyPan.elements[0] = lastEyeZ + dif;
        }

        let pan = ev => {
            const x = (0.5 - (ev.clientX - rect.left) / rect.width)*4;
            const y = ((ev.clientY - rect.top) / rect.height - 0.5)*4;
            const difx = (last_x - x)*W10P4.q_dollyPan.elements[0]*0.25;
            const dify = (last_y - y)*W10P4.q_dollyPan.elements[0]*0.25;
            W10P4.q_dollyPan.elements[1] = lastPanx + difx
            W10P4.q_dollyPan.elements[2] = lastPany + dify
        }

        let moveMouseFunc = ev => {
            if (mouseDown){
                switch (document.getElementById("interaction-mode").value){
                    case "0": rotation(ev); break;
                    case "1": dolly(ev); break;
                    case "2": pan(ev); break;
                    default: console.error("invalid value for select"); break;
                }
            }
        };

        let mouseUpFunc = ev => {
            mouseDown = false;
            if (last_x === (0.5 - (ev.clientX - rect.left) / rect.width) * 4 && last_y === ((ev.clientY - rect.top) / rect.height - 0.5) * 4){
                W10P4.q_inc.setIdentity();
            }
        };

        canvas.addEventListener("mousedown", mouseDownFunc);
        canvas.addEventListener("touchstart", ev => mouseDown(ev.targetTouches[0]));
        canvas.addEventListener("mousemove", moveMouseFunc);
        canvas.addEventListener("touchmove", ev => moveMouseFunc(ev.targetTouches[0]));
        canvas.addEventListener("mouseup", mouseUpFunc);
        canvas.addEventListener("touchend", ev => mouseUpFunc(ev.targetTouches[0]));
        document.addEventListener("scroll", ev => {
            if (mouseDown){
                console.log(ev)
                document.documentElement.scrollTop
                window.scrollTo(beginScrollLeft, beginScrollTop);
                ev.preventDefault();
            }
        })

        render();
    },

    hasCanvas: true,
    header: "Spinning",
    description:
        "Spinning is achieved by moving ```UpdateMatrixView``` to the render loop function. Also multiply the quaternion rotation from default view with the incremental rotation on each loop. \n"+
        "```javascript\n"+
        "function render(){\n"+
            "   setTimeout(function(){\n"+
                "      requestAnimationFrame(render);\n"+
                "      let baseRot = new Quaternion().set(W10P4.q_rot);\n"+
                "      W10P4.q_rot = baseRot.multiply(W10P4.q_inc);\n"+
                "      W10P4.UpdateViewMatrix();\n"+
                "....\n"+
                "```\n"+
                "This causes constant spinning whenever ```W10P4.q_inc``` is set. N.B. Other interaction modes can be used while spinning."+
        "The spinning is stopped if clicking without moving: \n"+
        "```javascript\n"+
        "let mouseUpFunc = ev => {\n"+
            "\tmouseDown = false;\n"+
            "\tif (last_x === (0.5 - (ev.clientX - rect.left) / rect.width) * 4 && last_y === ((ev.clientY - rect.top) / rect.height - 0.5) * 4){\n"+
                "\t\tW10P4.q_inc.setIdentity();\n"+
            "\t}\n"+
        "};\n"+
        "```\n"
                ,
} 


