let W7P3 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Normal;
            varying vec4 v_Color, Pos;
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
                Pos = a_Normal;
                gl_Position = P * V * a_Position;   
            }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
            precision mediump float;
            uniform samplerCube texMap;
            uniform float shininess;
            uniform float reflective;
            uniform vec4 ambientProduct;
            uniform vec4 diffuseProduct;
            uniform vec4 specularProduct;
            uniform mat3 mtex;
            uniform vec3 eyePos;
            varying vec3 N, L, E;
            varying vec4 Pos;


            void main() { 
                vec4 v_Color;
                vec3 H = normalize( L + E );

                vec4 ambient = ambientProduct;


                float Ks = pow( max(dot(N, H), 0.0), shininess );
                vec4  specular = Ks * specularProduct;
                if( dot(L, N) < 0.0 ) {
                    specular = vec4(0.0, 0.0, 0.0, 1.0);
                } 

                vec3 Texcord;
                Texcord.x = Pos.x;
                Texcord.y = Pos.y;
                Texcord.z = Pos.z;
                if ( reflective == 1.0){
                    Texcord = reflect(eyePos, Texcord);
                }
                Texcord = Texcord * mtex;
                v_Color = textureCube(texMap, Texcord);
                v_Color.a = 1.0;
                gl_FragColor = v_Color;
            } 
        `
    
    },

    // Controls
    loadControls: () =>{
        let div = document.createElement("div");

        
        return div;
    },

    init: () => {
        // Initialize webgl
        let canvas = document.getElementById("c");
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

        // Initialize buffers on webgl to be able to delete later.
        gl.vBuffer = null;
        gl.nBuffer = null;
        gl.iBuffer = null;
        gl.bBuffer = null;
    

        // The initial simplex in 3d.
        let va = vec4(0.0, 0.0, -1.0,1);
        let vb = vec4(0.0, 0.942809, 0.333333, 1);
        let vc = vec4(-0.816497, -0.471405, 0.333333, 1);
        let vd = vec4(0.816497, -0.471405, 0.333333,1);

        // The model data arrays to be sent to buffers.
        let vertices = [];
        let backgroundVertices = [vec4(-1.0,-1.0,0.9999,1.0),vec4(1.0,-1.0,0.9999,1.0), vec4(-1.0,1.0,0.9999,1.0),vec4(1.0,1.0,0.9999,1.0) ];
        let normals = [];
        let indices = [];
        let index = 0;
        let g_tex_ready = 0;


        // Function for dividing a triangle given by points a,b,c.  
        function divideTriangle(a, b, c, count) {
           if ( count > 0 ) {
               let ab = normalize(mix( a, b, 0.5), true);
               let ac = normalize(mix( a, c, 0.5), true);
               let bc = normalize(mix( b, c, 0.5), true);
               divideTriangle( a, ab, ac, count - 1 );
               divideTriangle( ab, b, bc, count - 1 );
               divideTriangle( bc, c, ac, count - 1 );
               divideTriangle( ab, bc, ac, count - 1 );
           }
           else { // When recursion stops, add model data.
            vertices.push(a);
            vertices.push(b);
            vertices.push(c);  
            indices.push(++index);
            indices.push(++index);
            indices.push(++index);
            let normal = normalize(cross(subtract(c, a), subtract(b, a)));
            normal = vec4(normal);
            normal[3]  = 0.0;
            normals.push(normal);
            normals.push(normal);
            normals.push(normal);
           }
        }
        
        // Generate data from tetrahedron given points a, b, c, d and subdivide by n.
        function tetrahedron(a, b, c, d, n) {
            divideTriangle(a, b, c, n);
            divideTriangle(d, c, b, n);
            divideTriangle(a, d, b, n);
            divideTriangle(a, c, d, n);
        }
        
        // Function for recycle the buffers and initialize the sphere.
        function initSphere(){
            
            // Buffers
            vertices = [];
            normals = [];
            indices = [];
            index = 0;
            gl.clearColor(0.8,0.9,1.0,1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            const subDivs = 8;
            tetrahedron(va, vb,vc,vd, subDivs);
            for (const element in backgroundVertices){
                vertices.push(backgroundVertices[element]);
                normals.push(backgroundVertices[element])
            }



            gl.deleteBuffer(gl.nBuffer);
            var nBuffer = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
            gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

            var aNormal = gl.getAttribLocation( program, "a_Normal" );
            gl.vertexAttribPointer(aNormal, 4, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray(aNormal);

            gl.deleteBuffer(gl.vBuffer);
            gl.vBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

            let vPosition = gl.getAttribLocation(program, "a_Position");
            gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);

            

            gl.deleteBuffer(gl.iBuffer);
            let iBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
            

            // Light
            let le = 1.3;
            let ambient = vec4(le, le, le, le );
            let ks = 1.2;
            let specular = mult(vec4( ks, ks, ks, ks ),vec4( 0.8,0.8,0.8, 1));
            gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(vec4(3,3,3, 1.0)));
            gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),  flatten(ambient));
            gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specular));
            gl.uniform1f(gl.getUniformLocation(program, "shininess"), 0.8);

            // Texture
            let cubemap = [
                    "../images/cm_left.png", // POSITIVE x
                    "../images/cm_right.png", // NEGATIVE X
                    "../images/cm_top.png",  // POSITVE Y
                    "../images/cm_bottom.png",  // NEGATIVE Y
                    "../images/cm_back.png", // POSITIVE Z
                    "../images/cm_front.png" // NEGATIVE Z
            ];

            gl.activeTexture(gl.TEXTURE0);
            let texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            for (let i = 0; i < 6; i++) {
                let img = new Image();
                img.crossOrigin = 'anonymous';
                img.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
                img.onload = function (event) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                    gl.texImage2D(img.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
                    g_tex_ready++;
                }
                img.src = cubemap[i];
            }
            gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
        }

        

        
        // PVM
        let at = vec3(0,0,0);
        let up = vec3(0.0,1.0,0.0);
        let eye = vec3(0.0,0.0,-1.0);
        let P = ortho(-3.0, 3.0, -3.0, 3.0, -10.0, 10.0);
        let scale = scalem(1,1,1);
        let V = lookAt(eye, at, up);
        let theta = 0.0;
        let radius = 4.5;
        let phi = 0.0;
        let normalMatrix = [
            vec3(V[0][0], V[0][1], V[0][2]),
            vec3(V[1][0], V[1][1], V[1][2]),
            vec3(V[2][0], V[2][1], V[2][2])
        ];

        initSphere();

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(P));
        gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix));   

        
        function render(){
            setTimeout(function(){
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                if (!(g_tex_ready < 5)) {
                    theta += 0.045;
                    phi += 0.08;
                    eye = vec3(radius*Math.sin(theta)*Math.cos(0),radius*Math.sin(theta)*Math.sin(0), radius*Math.cos(theta));
                    V = lookAt(eye, at, up);
                    V = mult(V, scale);
                    gl.uniform3fv(gl.getUniformLocation(program, "eyePos"), flatten(eye));
                    gl.uniformMatrix3fv(gl.getUniformLocation(program, "mtex"), false, flatten(mat3()));     
                    gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(P));
                    gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(V));
                    gl.uniform1f(gl.getUniformLocation(program, "reflective"), 1);
                    gl.drawArrays(gl.TRIANGLES, 0, indices.length);
                }
                
                
                let mtex = inverse3(V);

                gl.uniformMatrix3fv(gl.getUniformLocation(program, "mtex"), false, flatten(mtex));     
                gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(mat4()));
                gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(mat4()));
                gl.uniform1f(gl.getUniformLocation(program, "reflective"), 0);
                gl.drawArrays(gl.TRIANGLE_STRIP, indices.length, 4);

                requestAnimationFrame(render);
            }, 25);
        }

        render();
    },

    hasCanvas: true,
    header: "Reflection",
    description:
        ""
} 


