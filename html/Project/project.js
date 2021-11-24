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
        // const shadowProgram = createProgram(gl, W10P4.SHADOW_VSHADER_SOURCE, W10P4.SHADOW_FSHADER_SOURCE);
        // shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
        // shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');

        // Init vertex info


        const Position = {x:0, y:0, z:0};
        let quaternion = [0,0,0,0];
        ProjectSockets.OnAccelerationRead = acc => {
            Position.x = Position.x + acc.x;
            Position.y = Position.y + acc.y;
            Position.z = Position.z + acc.z;
        }

        ProjectSockets.OnOrientationRead = ori => {
            quaternion = ori;
            // model.quaternion.fromArray(sensor.quaternion).inverse();
        }



        function render() {
            setTimeout(function () {
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                console.log(Position);
                console.log(quaternion);

                requestAnimFrame(render);
            }, 2000);
        }

        render();
    }
}


