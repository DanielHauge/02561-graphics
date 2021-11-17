let W5P4 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
        attribute vec4 a_Position;
        attribute vec4 a_Normal;
        attribute vec4 a_Color;
        varying vec4 v_Color;


        uniform mat4 P;
        uniform mat4 V;

        varying vec3 N, L, E;
        uniform vec4 lightPosition;
        uniform mat3 normalMatrix;


        void main(){

            vec3 pos = (V * a_Position).xyz;
            if(lightPosition.w == 0.0) L = normalize(lightPosition.xyz);
            else L = normalize( lightPosition.xyz - pos );
            E = -normalize(pos);
            N = normalize(normalMatrix*a_Normal.xyz);

            gl_Position = P * V * a_Position;
            v_Color = a_Color;
        }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
        precision mediump float;
        varying vec4 v_Color; 
        uniform float shininess;
        uniform vec4 ambientProduct;
        uniform vec4 diffuseProduct;
        uniform vec4 specularProduct;
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

            f_Color = ambient + diffuse + specular;
            gl_FragColor = f_Color;
        } 
        `
    
    },

    // Controls
    loadControls: () =>{
        // No controls
        const div = document.createElement("div");

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
        
    
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CCW);

        // Attribute locations.
        gl.a_Position = gl.getAttribLocation(program, "a_Position");
        gl.a_Normal =  gl.getAttribLocation(program, "a_Normal");
        gl.v_Color = gl.getAttribLocation(program, "a_Color");

        // Position:
        let vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        
        gl.vertexAttribPointer(gl.a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.a_Position);

        // Normals
        let nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        
        gl.vertexAttribPointer(gl.a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.a_Normal);

        // Colors:
        let colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    
        gl.vertexAttribPointer(gl.v_Color, 4, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(gl.v_Color);

        // Indices:
        let iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        

        let model = new Object();
        model.vertexBuffer = vBuffer;
        model.normalBuffer = nBuffer;
        model.colorBuffer = colorBuffer;
        model.indexBuffer = gl.createBuffer();



        let g_drawingInfo = null;
        let g_objDoc = null;
        wshelper.readOBJFile('./Stander.obj', gl, model, 0.012, true, (objDoc) => {g_objDoc = objDoc});


        // Light stuff
        let le = 1;
        let ka = 0.10;
        let ambient = mult(vec4(le, le, le, le ),vec4(ka, ka, ka, ka ));

        let kd = 0.8;
        let diffuse = vec4( kd, kd, kd, 1);
        
        let ks = 0.5;
        let specular = mult(vec4( ks, ks, ks, ks ),vec4( 1.0, 1.0, 1.0, 1.0));

        gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(vec4(0,100,100, 1.0)));
        gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),  flatten(diffuse));
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),  flatten(ambient));
        gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specular));
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), 10);
        

        let PLoc = gl.getUniformLocation(program, "P");
        let VLoc = gl.getUniformLocation(program, "V");

        
        let T = translate(0,-0.5,0);
        let at = vec3(0,0,0);
        let up = vec3(0.0,1.0,0.0);
        let eye = vec3(0,0,3);
        let V = lookAt(eye, at, up);
        let P = perspective(45, 1.5, 0.1, 6);
        V = mult(V, T)
        V = mult(V, mult(rotateZ(0), rotateX(90)));
        gl.uniformMatrix4fv(PLoc, false, flatten(P));
        gl.uniformMatrix4fv(VLoc, false, flatten(V));

        let normalMatrix = [
            vec3(V[0][0], V[0][1], V[0][2]),
            vec3(V[1][0], V[1][1], V[1][2]),
            vec3(V[2][0], V[2][1], V[2][2])
        ];
        let radius = 3;
        let theta = 0;
        let phi = 0;
        let rotationValue = 0;

        function render(){
            setTimeout(function(){
                requestAnimationFrame(render);
                
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
                if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()){

                    g_drawingInfo = wshelper.onReadComplete(gl, model, g_objDoc);
                }
                if (g_drawingInfo === null || g_drawingInfo === undefined) {
                    return;
                }
                theta += 0.054;
                phi += 0.041
                eye = vec3(radius*Math.sin(theta)*Math.cos(0),radius*Math.sin(theta)*Math.sin(0), radius*Math.cos(theta));
                
                V = lookAt(eye, at, up);
                V = mult(V, T)
                V = mult(V, mult(rotateX(0), rotateX(90)));


                gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(vec4(50*Math.sin(phi),50*Math.cos(phi)*Math.sin(theta), 50*Math.cos(phi), 0.0)));

                
                let Rz = rotateZ(rotationValue*1.3);
                let newV = mult(V, Rz);
                normalMatrix = [
                    vec3(newV[0][0], newV[0][1], newV[0][2]),
                    vec3(newV[1][0], newV[1][1], newV[1][2]),
                    vec3(newV[2][0], newV[2][1], newV[2][2])
                ];
                gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix));     
                gl.uniformMatrix4fv(VLoc, false, flatten(newV));
                gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_BYTE, 0);
            }, 25);
        }

        render();
    },

    hasCanvas: true,
    header: "Let there be light",
    description:
        "The light implementation is the same as from Part 5 of worksheet 4. The canvas is displaying the model rotating around it's original constraining root point, with a light source slowly swirling around the object aswell. \n"+
        "The normals are obtained through OBJParser.js, as a part of it's parsing. More specifically in the calcNormal function. \n"+
        "During interpolation, the normals gets shortened, however by re-normalizing them, the transition from one face to another is smoothly interpolated with the same length of vector, hence making the light give the effect of a smoother surface."
        ,
} 

