let W4P6 = {
    
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
        const div = document.createElement("div");

        const sliderText = document.createElement("div");
        sliderText.innerText = "Subdivisons:";
        div.appendChild(sliderText);

        const slider = document.createElement("input");
        slider.type ="range";
        slider.min = "0";
        slider.max ="6";
        slider.value = "5";
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


        const leText = document.createElement("div");
        leText.innerHTML = wshelper.md.render("$L_e$");
        div.appendChild(leText);

        const leSlider = document.createElement("input");
        leSlider.type = "range";
        leSlider.id = "leSlider";
        leSlider.min = "0";
        leSlider.step = "0.01";
        leSlider.max = "2";
        leSlider.value = "1";
        div.appendChild(leSlider);


        const kaText = document.createElement("div");
        kaText.innerHTML = wshelper.md.render("$k_a$");
        div.appendChild(kaText);

        const kaSlider = document.createElement("input");
        kaSlider.type = "range";
        kaSlider.id = "kaSlider";
        kaSlider.min = "0";
        kaSlider.step = "0.01";
        kaSlider.max = "1";
        kaSlider.value = "0.10";
        div.appendChild(kaSlider);


        const kdText = document.createElement("div");
        kdText.innerHTML = wshelper.md.render("$k_d$");
        div.appendChild(kdText);

        const kdSlider = document.createElement("input");
        kdSlider.type = "range";
        kdSlider.id = "kdSlider";
        kdSlider.min = "0";
        kdSlider.step = "0.01";
        kdSlider.max = "1";
        kdSlider.value = "0.8";
        div.appendChild(kdSlider);


        const ksText = document.createElement("div");
        ksText.innerHTML = wshelper.md.render("$k_s$");
        div.appendChild(ksText);

        const ksSlider = document.createElement("input");
        ksSlider.type = "range";
        ksSlider.id = "ksSlider";
        ksSlider.min = "0";
        ksSlider.step = "0.01";
        ksSlider.max = "1";
        ksSlider.value = "0.5";
        div.appendChild(ksSlider);


        const sText = document.createElement("div");
        sText.innerHTML = wshelper.md.render("$s$");
        div.appendChild(sText);

        const sSlider = document.createElement("input");
        sSlider.type = "range";
        sSlider.id = "sSlider";
        sSlider.min = "0";
        sSlider.step = "1";
        sSlider.max = "1000";
        sSlider.value = "10";
        div.appendChild(sSlider);


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

            let le = document.getElementById("leSlider").value;
            let ka = document.getElementById("kaSlider").value;
            let ambient = mult(vec4(le, le, le, le ),vec4(ka, ka, ka, ka ));

            let kd = document.getElementById("kdSlider").value;
            let diffuse = mult(vec4( kd, kd, kd, kd),vec4( 1.0, 0.1, 0.1, 1.0 ));
            
            let ks = document.getElementById("ksSlider").value;
            let specular = mult(vec4( ks, ks, ks, ks ),vec4( 1.0, 1.0, 1.0, 1.0));

            gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(vec4(0,100,100, 1.0)));
            gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),  flatten(diffuse));
            gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),  flatten(ambient));
            gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specular));
            gl.uniform1f(gl.getUniformLocation(program, "shininess"), document.getElementById("sSlider").value);
        }
        
        // PVM
        let at = vec3(0,0,0);
        let up = vec3(0.0,1.0,0.0);
        let eye = vec3(0.0,0.0,-1.0);
        let P = ortho(-3.0, 3.0, -3.0, 3.0, -10.0, 10.0);
        let scale = scalem(2,2,2);
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
                    theta += 0.075;
                } 
                eye = vec3(radius*Math.sin(theta)*Math.cos(phi),radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
                V = lookAt(eye, at, up);
                V = mult(V, scale);
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

        document.getElementById("sSlider").addEventListener("input", _ => {initSphere();})
        document.getElementById("kaSlider").addEventListener("input", _ => {initSphere();})
        document.getElementById("kdSlider").addEventListener("input", _ => {initSphere();})
        document.getElementById("leSlider").addEventListener("input", _ => {initSphere();})
        document.getElementById("ksSlider").addEventListener("input", _ => {initSphere();})


        initSphere();
        render();
    },

    hasCanvas: true,
    header: "Clarifications",
    description:
        "### a.\n"+
        "The Phong reflection model calculates how much light is reflected back to the eye/camera for a given surface. Where as phong shader is the algorithm which calculate and uses the reflection model to produce pixel color regardless of vertices.\n"+
        "### b.\n"+
        "- Flat shading is when the colouring is only one tone per surface, can be seen in part 1.\n"+
        "\t- (+) Compared to Gouraud and Phong shading, flat shading has allmost no processing as colours is used exactly like they are sent to the buffer.\n"+
        "\t- (+) It is very simple to implement and work with.\n"+
        "\t- (-) It is difficult to make colours with flat shading look pretty.\n"+
        "\t- (-) Presenting depth is very difficult if not impossible to do reliably.\n"+
        "- Gouraud reflections is only calculating light at the vertices and interpolate the colors.\n"+
        "\t- (+) Can represent depth with lighting pretty well.\n"+
        "\t- (+) The lighting model is simpler than Phong, hence it is faster to compute.\n"+
        "\t- (-) Highlighting is behaving weirdly around vertices, making reflections look very unrealistic. This is due to the nature of the Gouraud shader.\n"+
        "- Phong reflection mimics scattering due to many little microfacets.\n"+
        "\t- (+) Will produce very good reflections for a realistic look on glossy objects.\n"+
        "\t- (-) Requires more computations, hence making it slower than flat or Gouraud shader.\n"+
        "### c.\n"+
        "Directional light will produce a reflection model which has a lightsource with constant direction. With a point light the reflection model will have lightsource direction vary as it is calculated from the surface to the light point.\n"+
        "### d.\n"+
        "One could argue that the object is illuminated the same regardless of viewpoint. But eye position definitly changes the way an object is displayed on screen, as evident on the canvas. It looks like the light source is orbiting the sphere, however it is the eye position that orbits the sphere, hence eye position influence the shading.\n"+
        "### e.\n"+
        "There would be no highlight/sparkle at all. The specular in this example is white light, so with no specular, the object would take the full colour of the material (diffusion). In this case the material colour is very red, which is what would be displayed if setting specular to 0.\n"+
        "### f.\n"+
        "The highlight/sparkle will become more focused.\n"+
        "### g.\n"+
        "Lighting is calculated in world space. The following code snippet which calculates L, can be changed in the shader to calculate the lighting to eye space. \n"+
        "```\n"+
        "if(lightPosition.w == 0.0) L = normalize((V*lightPosition).xyz);\n"+
        "else L = normalize( (V*lightPosition).xyz - pos );\n"+
        "```\n"+
        "#### Reflection (pun definitly intended)\n"+
        "From this worksheet, I've thought alot about game engines and the correlation between performance and multiple light sources in games.\n"+
        "I've come to the realization, that lighting is a very important aspect of making graphics look realistic and great, but can be computally heavy."
        ,
} 


