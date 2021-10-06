let W5P2 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Normal;
            varying vec4 v_Color;
            varying vec3 N, L, E;

            uniform mat4 V;
            uniform mat4 P;
            uniform vec4 lightPosition;
            uniform mat3 normalMatrix;

            void main(){
                vec3 pos = (V * a_Position).xyz;
                if(lightPosition.w == 0.0) L = normalize(lightPosition.xyz);
                else L = normalize( lightPosition.xyz - pos );
                E = -normalize(pos);
                N = normalize(normalMatrix*a_Normal.xyz);

                gl_Position = P * V * a_Position;   
            }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
            precision mediump float;
            uniform float shininess;
            uniform vec4 ambientProduct;
            uniform vec4 diffuseProduct;
            uniform vec4 specularProduct;
            varying vec3 N, L, E;
            void main() { 
                vec4 v_Color;
                vec3 H = normalize( L + E );

                vec4 ambient = ambientProduct;

                float Kd = max( dot(L, N), 0.0 );
                vec4  diffuse = Kd*diffuseProduct;

                float Ks = pow( max(dot(N, H), 0.0), shininess );
                vec4  specular = Ks * specularProduct;
                if( dot(L, N) < 0.0 ) {
                    specular = vec4(0.0, 0.0, 0.0, 1.0);
                } 

                v_Color = ambient + diffuse +specular;
                v_Color.a = 1.0;
                gl_FragColor = v_Color;
            } 
        `
    
    },

    // Controls
    loadControls: () =>{
        // No controls
        const div = document.createElement("div");

        const img1 = document.createElement("img");
        img1.src = "../images/stand1.jpg";
        img1.width = 512/2;
        
        
        const img2 = document.createElement("img");
        img2.src = "../images/stand2.jpg";
        img2.width = 512/2;

        div.appendChild(img1);
        div.appendChild(img2);


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

        // Optimize for depth test and invisible surfaces
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CCW);

        gl.a_Position = gl.getAttribLocation(program, "a_Position");
        gl.a_Normal =  gl.getAttribLocation(program, "a_Position");
        gl.v_Color = gl.getAttribLocation(program, "v_Color");

        let model = new Object();
        model.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
        model.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
        model.colorBuffer = createEmptyArrayBuffer(gl, program.v_Color, 4, gl.FLOAT);
        model.indexBuffer = gl.createBuffer(),


        readOBJFile('./Stander.obj', gl, model, 60, true)

        // Function for recycle the buffers and initialize the sphere.
        vertices = [];
        vertexColors = [];
        normals = [];
        gl.clearColor(0.8,0.9,1.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var nBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

        var aNormal = gl.getAttribLocation( program, "a_Normal" );
        gl.vertexAttribPointer(aNormal, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( aNormal);

        gl.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        let vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        let le = 1;
        let ka = 0.10;
        let ambient = mult(vec4(le, le, le, le ),vec4(ka, ka, ka, ka ));

        let kd = 0.8;
        let diffuse = mult(vec4( kd, kd, kd, kd),vec4( 1.0, 0.1, 0.1, 1.0 ));
        let ks = 0.5;
        let specular = mult(vec4( ks, ks, ks, ks ),vec4( 1.0, 1.0, 1.0, 1.0));

        gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(vec4(0,100,100, 1.0)));
        gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),  flatten(diffuse));
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),  flatten(ambient));
        gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specular));
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), 100);
        
        
        


        // PVM
        let at = vec3(0,0,0);
        let up = vec3(0.0,1.0,0.0);
        let eye = vec3(0.0,0.0,-1.0);
        // let theta = 0.0;
        // let radius = 4.5;
        // let phi = 0.0;
        // eye = vec3(radius*Math.sin(theta)*Math.cos(phi),radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
        let P = ortho(-3.0, 3.0, -3.0, 3.0, -10.0, 10.0);
        let scale = scalem(1,1,1);
        let V = mult(lookAt(eye, at, up), scale);

        let normalMatrix = [
            vec3(V[0][0], V[0][1], V[0][2]),
            vec3(V[1][0], V[1][1], V[1][2]),
            vec3(V[2][0], V[2][1], V[2][2])
        ];

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(V));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(P));
        gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix));


        function render(){
            setTimeout(function(){
                
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.GL_ACCUM_BUFFER_BIT | gl.GL_STENCIL_BUFFER_BIT);
                
                // No drawing yet. second part is to deploy create obj file.

                requestAnimationFrame(render);
            }, 25);
        }

        render();
    },

    hasCanvas: false,
    header: "3D Object export to mesh",
    description:
        "A model from a previous personal project is used. The object is a 3D printed smartphone stand which can hold a wireless charger and a smartphone. The stand is tailored and optimized for a Samsung galaxy S20+ with a cover on. \n"+
        "The model was initialy constructed in FreeCAD and the .FCStd was still available, thus the wavefront file is exported from FreeCAD. "
        ,
} 


