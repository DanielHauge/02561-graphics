let W4P3 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Normal;
            varying vec4 v_Color;

            uniform vec4 ambientProduct;
            uniform vec4 diffuseProduct;
            uniform vec4 specularProduct;
            uniform mat4 V;
            uniform mat4 P;
            uniform vec4 lightPosition;
            uniform float shininess;
            uniform mat3 normalMatrix;

            void main(){

                vec3 pos = (V * a_Position).xyz;
    
                
                vec3 L;
                
                
                if(lightPosition.w == 0.0) L = normalize(lightPosition.xyz);
                else L = normalize( lightPosition.xyz - pos );

                    
                vec3 E = -normalize( pos );
                
                
                vec3 H = normalize( L + E );

                vec3 N = normalize( normalMatrix*a_Normal.xyz);


                vec4 ambient = ambientProduct;

                float Kd = max( dot(L, N), 0.0 );
                vec4  diffuse = Kd*diffuseProduct;

                float Ks = pow( max(dot(N, H), 0.0), shininess );
                vec4  specular = Ks * specularProduct;
                
                if( dot(L, N) < 0.0 ) {
                    specular = vec4(0.0, 0.0, 0.0, 1.0);
                } 

                gl_Position = P * V * a_Position;
                
                v_Color = diffuse + ambient + specular;

                v_Color.a = 1.0;
            }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
            precision mediump float;
            varying vec4 v_Color; 
            void main() { 
                gl_FragColor = v_Color;
            } 
        `
    
    },

    // Controls
    loadControls: () =>{
        const div = document.createElement("div");

        const sliderText = document.createElement("div");
        sliderText.innerText = "Subdivisons:";
        div.appendChild(sliderText);

        const slider = document.createElement("input");
        slider.type ="range";
        slider.min = "0";
        slider.max ="6";
        slider.value = "3";
        slider.id = "sub-slider";
        div.appendChild(slider);

        const spinText = document.createElement("div");
        spinText.innerText = "Spin on/off:";
        div.appendChild(spinText);

        const spinCb = document.createElement("input");
        spinCb.type ="checkbox";
        spinCb.checked = true;
        spinCb.id = "spinCb";
        div.appendChild(spinCb);

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
    

        // The initial simplex in 3d.
        let va = vec4(0.0, 0.0, -1.0,1);
        let vb = vec4(0.0, 0.942809, 0.333333, 1);
        let vc = vec4(-0.816497, -0.471405, 0.333333, 1);
        let vd = vec4(0.816497, -0.471405, 0.333333,1);

        // The model data arrays to be sent to buffers.
        let vertices = [];
        let normals = [];

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
            normals.push(a[0],a[1], a[2], 0.0);
            normals.push(b[0],b[1], b[2], 0.0);
            normals.push(c[0],c[1], c[2], 0.0);
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

            vertices = [];
            vertexColors = [];
            normals = [];
            gl.clearColor(0.8,0.9,1.0,1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            const subDivs = document.getElementById("sub-slider").value
            tetrahedron(va, vb,vc,vd, subDivs);

            gl.deleteBuffer(gl.nBuffer);
            var nBuffer = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
            gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

            var aNormal = gl.getAttribLocation( program, "a_Normal" );
            gl.vertexAttribPointer(aNormal, 4, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( aNormal);

            gl.deleteBuffer(gl.vBuffer);
            gl.vBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

            let vPosition = gl.getAttribLocation(program, "a_Position");
            gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);

            var ambient = mult(vec4(0.2, 0.2, 0.2, 1.0 ),vec4(1.0, 0.0, 1.0, 1.0 ));
            var diffuse = mult(vec4( 1.0, 1.0, 1.0, 1.0),vec4( 1.0, 0.2, 0.1, 1.0 ));
            var specular = mult(vec4( 1.0, 1.0, 1.0, 1.0 ),vec4( 1.0, 1.0, 1.0, 1.0));

            // Light
            gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(vec4(0,0,1, 0.0)));
            // Object base color k_d
            gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),  flatten(diffuse));
            // Ambient k_a
            gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),  flatten(ambient));
            // Emission or intesity
            gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specular));
            gl.uniform1f(gl.getUniformLocation(program, "shininess"), 120);
        }

        // PVM
        let at = vec3(0,0,0);
        let up = vec3(0.0,1.0,0.0);
        let eye = vec3(0.0,0.0,-1.0);
        let P = ortho(-3.0, 3.0, -3.0, 3.0, -10.0, 10.0);
        let V = lookAt(eye, at, up);
        let theta = 0.0;
        let radius = 4.5;
        let phi = 0.0;
        let normalMatrix = [
            vec3(V[0][0], V[0][1], V[0][2]),
            vec3(V[1][0], V[1][1], V[1][2]),
            vec3(V[2][0], V[2][1], V[2][2])
        ];

        function render(){
            setTimeout(function(){
                
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.GL_ACCUM_BUFFER_BIT | gl.GL_STENCIL_BUFFER_BIT);
                
                if (document.getElementById("spinCb").checked){
                    theta += 0.05;
                } 
                eye = vec3(radius*Math.sin(theta)*Math.cos(phi),radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
                V = lookAt(eye, at, up);
                normalMatrix = [
                    vec3(V[0][0], V[0][1], V[0][2]),
                    vec3(V[1][0], V[1][1], V[1][2]),
                    vec3(V[2][0], V[2][1], V[2][2])
                ];
                gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(V));
                gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(P));
                gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix));     
                
                for (let i = 0; i<vertices.length; i+=3) gl.drawArrays(gl.TRIANGLES, i, 3);
                
                
                requestAnimationFrame(render);
            }, 25);
        }

        document.getElementById("sub-slider").addEventListener("input", _ =>{
            initSphere();
        });

        initSphere();
        render();
    },

    hasCanvas: true,
    header: "Gouraud shading",
    description:
        "Color is now determined by the diffusion, specular and ambiency rather than pixel colour data. "+
        "Calculating color and light is now done by using the aforementioned and the normals of the triangles. As light shining straigth onto a surface would reflect the most light. "+
        "If the surface was allmost parallel with the light source, allmost no light would be reflected towards the viewer. "+
        "Another thing about Gouraud shading is that the specular is not very pretty. "+
        "Normals are calculated during subdivision and sent to the shader just like points. \n\n\n*N.B Some of the code was meant to be implemented in part 4, as i accidentally continued without \"saving\" part 3*.",
} 


