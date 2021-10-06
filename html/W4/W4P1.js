




let W4P1 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            varying vec4 v_Color;

            uniform mat4 PVM;

            void main(){
                gl_Position = PVM*a_Position;
                v_Color = a_Color;
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

        return div;
    },

    init: () => {
        let canvas = document.getElementById("c");
        let gl = canvas.getContext("webgl");
        if (!gl){
            console.error("Yo gl was not found")
        }
        gl.clearColor(0.8,0.9,1.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        let program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);
        gl.enable(gl.DEPTH_TEST);

        gl.vBuffer = null;
        gl.cBuffer = null;
    

        // The initial simplex in 3d.
        let va = vec4(0.0, 0.0, -1.0, 1);
        let vb = vec4(0.0, 0.942809, 0.333333, 1);
        let vc = vec4(-0.816497, -0.471405, 0.333333, 1);
        let vd = vec4(0.816497, -0.471405, 0.333333, 1);

        // The model data.
        let vertices = [];
        let vertexColors = [];

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
           } else { // When recursion stops, add model data.
            vertices.push(a);
            vertices.push(b);
            vertices.push(c);
            vertexColors.push([1,0,0,1]);
            vertexColors.push([1,0,0,1]);
            vertexColors.push([1,0,0,1]);
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
            const subDivs = document.getElementById("sub-slider").value
            tetrahedron(va, vb,vc,vd, subDivs);

            gl.deleteBuffer(gl.cBuffer);
            let cBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

            
            let cColor = gl.getAttribLocation(program, "a_Color");
            gl.vertexAttribPointer(cColor, 4, gl.FLOAT, false, 0,0);
            gl.enableVertexAttribArray(cColor);


            gl.deleteBuffer(gl.vBuffer);
            gl.vBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

            let vPosition = gl.getAttribLocation(program, "a_Position");
            gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);
        }
        
        


        // Model view matrix location
        let PVMLoc = gl.getUniformLocation(program, "PVM");

        let T = translate(0,0,0);
        let at = vec3(0,0,0);
        let up = vec3(0.0,1.0,0.0);
        let eye = vec3(0,0,0);
        let V = lookAt(eye, at, up);
        let P = ortho(-3, 3, -3, 3, -10, 10);
        let VM = mult(V, T)
        let PVM = mult(P, VM);
        gl.uniformMatrix4fv(PVMLoc, false, flatten(PVM));
        initSphere();


        function render(){
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            for (let i = 0; i<vertices.length; i+=3) gl.drawArrays(gl.TRIANGLES, i, 3);

        }

        document.getElementById("sub-slider").addEventListener("input", ev =>{
            initSphere();
            render();
        });

        render();
    },

    hasCanvas: true,
    header: "Sphere estimation by triangle subdivions",
    description:
        "Like a circle can be imitated by alot of triangles, a sphere can also be imitated by alot of triangles. Starting with the simplex in 3D, a tetrahedron which is 4 triangles put together."+
        " Dividing each triangles in 4 equal triangles and normalizing them from the origin. This subdivison will eksponentially increase the amount of triangles and therefor also the vertices. "+
        "Already after about 3 subdivions, a rough sphere should start to appear."+
        "The subdivision is implemented by recursion from initial tetrahedron points as shown below:"+
        "\n```javascript\n"+
        "function divideTriangle(a, b, c, count) {\n"+
            "\tif ( count > 0 ) {\n"+
                "\t\tlet ab = normalize(mix( a, b, 0.5), true);\n"+
                "\t\tlet ac = normalize(mix( a, c, 0.5), true);\n"+
                "\t\tlet bc = normalize(mix( b, c, 0.5), true);\n"+
                "\t\tdivideTriangle( a, ab, ac, count - 1 );\n"+
                "\t\tdivideTriangle( ab, b, bc, count - 1 );\n"+
                "\t\tdivideTriangle( bc, c, ac, count - 1 );\n"+
                "\t\tdivideTriangle( ab, bc, ac, count - 1 );\n"+
            "\t} else { // When recursion stops, add model data.\n"+
                "\t\tvertices.push(a);\n"+
                "\t\tvertices.push(b);\n"+
                "\t\tvertices.push(c);\n"+
                "\t\tvertexColors.push([1,0,0,1]);\n"+
                "\t\tvertexColors.push([1,0,0,1]);\n"+
                "\t\tvertexColors.push([1,0,0,1]);\n"+
            "\t}\n"+
         "}\n"+
         "function tetrahedron(a, b, c, d, n) {\n"+
            "\tdivideTriangle(a, b, c, n);\n"+
            "\tdivideTriangle(d, c, b, n);\n"+
            "\tdivideTriangle(a, d, b, n);\n"+
            "\tdivideTriangle(a, c, d, n);\n"+
         "}\n"+
         "```\n"+
        "\nThe triangles are then drawn like in worksheet 2. \n```javascript\ngl.drawArrays(gl.TRIANGLES, i, 3);\n```\n",
} 


