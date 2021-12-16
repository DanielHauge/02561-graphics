let Project = {
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
        'attribute vec2 a_Texcord;\n' +
        'attribute vec4 a_Color;\n' +
        'uniform mat4 u_MvpMatrix;\n' +
        'uniform mat4 u_MvpMatrixFromLight;\n' +
        'varying vec4 v_PositionFromLight;\n' +
        'varying vec4 v_Color;\n' +
        'varying vec2 v_Texcord;\n' +
        'void main() {\n' +
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        '  v_PositionFromLight = u_MvpMatrixFromLight * a_Position;\n' +
        '  v_Color = a_Color;\n' +
        '  v_Texcord = a_Texcord;\n' +
        '}\n',

    FSHADER_SOURCE:
        'precision mediump float;\n' +
        'uniform sampler2D u_ShadowMap;\n' +
        'uniform sampler2D u_TexMap;\n' +
        'uniform float u_HasTexture;\n' +
        'varying vec4 v_PositionFromLight;\n' +
        'varying vec4 v_Color;\n' +
        'varying vec2 v_Texcord;\n' +
        'void main() {\n' +
        '  vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;\n' +
        '  vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);\n' +
        '  float depth = rgbaDepth.r;\n' +
        '  float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;\n' +
        '  if (u_HasTexture == 1.0) {\n' +
        '       gl_FragColor = vec4(texture2D(u_TexMap, v_Texcord).rgb * visibility, v_Color.a);\n' +
        '  } else {\n' +
        '       gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);\n' +
        '  }  \n' +
        '}\n',


    Phone_X: 0.7,
    Phone_Y: 0.35,
    Phone_Z: -0.35,

    drawPhone: (gl, program, phone, viewProjMatrix) => {
        
        Project.g_modelMatrix.setRotate(-90, 1, 0, 0);
        Project.g_modelMatrix.rotate(90, 0, 0, 1);

        Project.g_modelMatrix.translate(Project.Phone_X,Project.Phone_Y,Project.Phone_Z);
        
        const rot = new Matrix4();
        const mat4 = Project.q_rot.get_mat4();
        const flattened = flatten(mat4);

        rot.set({elements: flattened});

        
        Project.g_modelMatrix = Project.g_modelMatrix.multiply(rot);
        Project.g_modelMatrix.rotate(-90, 0, 0, 1);
        Project.g_modelMatrix.translate(0.8,0.4,0);

        // Project.g_modelMatrix.rotate(-90, 1, 0, 0);
        // Project.g_modelMatrix.rotate(180, 0, 1, 0);





        if (!phone.g_drawingInfo && phone.g_objDoc && phone.g_objDoc.isMTLComplete()){
            phone.g_drawingInfo = wshelper.onReadComplete(gl, phone, phone.g_objDoc);
        }

        if (phone.g_drawingInfo === null || phone.g_drawingInfo === undefined) {
            return;
        } else {
            Project.draw(gl, program, phone, viewProjMatrix);
        }


    },

    

    drawQuad: (gl, program, quad, viewProjMatrix) => {
        // Set rotate angle to model matrix and draw plane
        Project.g_modelMatrix.setRotate(0, 1, 0, 0);
        Project.g_modelMatrix.rotate(0, 0, 1, 0);
        Project.g_modelMatrix.rotate(0, 0, 0, 1);
        Project.g_modelMatrix.translate(0, -2, 0);

        Project.draw(gl, program, quad, viewProjMatrix);
    },

    
    viewProjMatrixFromLight: new Matrix4(),
    g_modelMatrix: new Matrix4(),
    g_mvpMatrix: new Matrix4(),
    q_rot: new Quaternion(),
    q_inc: new Quaternion(),
    q_rot_ref: new Quaternion(),
    q_dollyPan: new Vector3([4, 0, 0]),
    q_pan_X: 0,
    q_pan_Y: 0,
    

    draw: (gl, program, o, viewProjMatrix) => {
        ProjectInit.initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
        if (program.a_Color != undefined){
            ProjectInit.initAttributeVariable(gl, program.a_Color, o.colorBuffer);
        }
        if (program.a_Texcord != undefined && o.texcordBuffer != undefined ){
            ProjectInit.initAttributeVariable(gl, program.a_Texcord, o.texcordBuffer);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
        Project.g_mvpMatrix.set(viewProjMatrix);
        Project.g_mvpMatrix.multiply(Project.g_modelMatrix);
        gl.uniformMatrix4fv(program.u_MvpMatrix, false, Project.g_mvpMatrix.elements);
        gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0);
    },


    init: () => {
        // Initialize
        ProjectSockets.initWebsockets();
        const canvas = document.getElementById("project-canvas");
        if (canvas === null) return;
        const gl = canvas.getContext("webgl");
        if (!gl) {
            console.error("Yo gl was not found")
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.8, 0.9, 1.0, 1.0);

        // Init shaders
        const shadowProgram = createProgram(gl, Project.SHADOW_VSHADER_SOURCE, Project.SHADOW_FSHADER_SOURCE);
        shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
        shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');

        const normalProgram = createProgram(gl, Project.VSHADER_SOURCE, Project.FSHADER_SOURCE);
        normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');
        normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');
        normalProgram.a_Texcord = gl.getAttribLocation(normalProgram, 'a_Texcord');
        normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');
        normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight');
        normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, 'u_ShadowMap');
        normalProgram.u_TexMap = gl.getUniformLocation(normalProgram, 'u_TexMap');
        normalProgram.u_HasTexture = gl.getUniformLocation(normalProgram, 'u_HasTexture');

        gl.useProgram(normalProgram);

        // Init vertex info
        const quad = ProjectInit.initVertexBuffersForQuad(gl);
        const phone = ProjectInit.initVertexBuffersForPhone(gl);

        // Init FBO
        const fbo = ProjectInit.initFramebufferObject(gl);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

        // ViewMatrices
        Project.UpdateLightMatrix = () => {
            Project.viewProjMatrixFromLight = new Matrix4(); 
            Project.viewProjMatrixFromLight.setPerspective(90.0, ProjectInit.OFFSCREEN_WIDTH/ProjectInit.OFFSCREEN_HEIGHT, 1.0, 100.0);
            Project.viewProjMatrixFromLight.lookAt(Project.LIGHT_X, Project.LIGHT_Y, Project.LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        }

        Project.UpdateLightMatrix();
        let viewProjMatrix = new Matrix4(); 

        Project.UpdateViewMatrix = () => {
            viewProjMatrix = new Matrix4();
            viewProjMatrix.setPerspective(90, canvas.width/canvas.height, 1.0, 100.0);
            let qrot = Project.q_rot;
            let u = qrot.apply(new Vector3([0, 1, 0]));
            let r = qrot.apply(new Vector3([1, 0, 0]));
            let e = Project.q_dollyPan.elements;
            let p = new Vector3([0,0,0]).elements;
            let c = new Vector3([p[0] - r[0] * e[1] - u[0] * e[2], p[1] - r[1] * e[1] - u[1] * e[2], p[2] - r[2] * e[1] - u[2] * e[2]]).elements;
            let qrotEye = qrot.apply(vec3( e[0],1.0, 0));
            viewProjMatrix.lookAt(qrotEye[0] + c[0], qrotEye[1] + c[1], qrotEye[2] + c[2], c[0], c[1], c[2], u[0], u[1], u[2]);
        }
        Project.UpdateViewMatrix();
        

        let mvpMatrixFromLight_t = new Matrix4();
        let mvpMatrixFromLight_p = new Matrix4();



        const Position = {x:0, y:0, z:0};
        ProjectSockets.OnAccelerationRead = acc => {
            Position.x = Position.x + acc.x*0.01;
            Position.y = Position.y + acc.y*0.01;
            Position.z = Position.z + acc.z*0.01;
        }

        ProjectSockets.OnAlign = ori => {
            console.log("newAlign");
            const newOri = [ori[0], ori[1], ori[2], ori[3]]
            Project.q_rot_ref.set(newOri);
            Project.q_rot_ref = Project.q_rot_ref.invert();
        }

        ProjectSockets.OnOrientationRead = ori => {
            const newOri = [ori[0], ori[1], ori[2], ori[3]]
            if (Project.refSet == undefined) {
                Project.refSet = true;
                Project.q_rot_ref.set(newOri);
                Project.q_rot_ref = Project.q_rot_ref.invert();
                console.log("Setting ref");
            }
            Project.q_rot.set(newOri);
            Project.q_rot.multiply(Project.q_rot_ref);
            // model.quaternion.fromArray(sensor.quaternion).inverse();
        }



        function render() {
            setTimeout(function () {
                requestAnimationFrame(render);
                // let baseRot = new Quaternion().set(Project.q_rot);
                // Project.q_rot = baseRot.multiply(Project.q_inc);
                // Project.UpdateViewMatrix();

                // Set drawing on offscreen framebuffer.
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                gl.viewport(0, 0, ProjectInit.OFFSCREEN_HEIGHT, ProjectInit.OFFSCREEN_HEIGHT);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                // Draw shadows on framebuffer.
                Project.drawPhone(gl, shadowProgram, phone, Project.viewProjMatrixFromLight);
                mvpMatrixFromLight_t.set(Project.g_mvpMatrix);
                Project.drawQuad(gl, shadowProgram, quad, Project.viewProjMatrixFromLight);
                mvpMatrixFromLight_p.set(Project.g_mvpMatrix);

                // Set drawing for canvas.
                gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.useProgram(normalProgram);
                gl.uniform1i(normalProgram.u_ShadowMap, 0);

                // Draw normally:
                gl.uniform1i(normalProgram.u_TexMap, 1.0);
                gl.uniform1f(normalProgram.u_HasTexture, 1.0);
                gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
                Project.drawQuad(gl, normalProgram, quad, viewProjMatrix);
                gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements);
                gl.uniform1f(normalProgram.u_HasTexture, 0.0);
                Project.drawPhone(gl, normalProgram, phone, viewProjMatrix);
                
            }, 50);
        }

        render();
    },

    
}


