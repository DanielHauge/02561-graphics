




let W4P2 = {
    
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
        gl.enable(gl.CULL_FACE);

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
           }
           else { // When recursion stops, add model data.
            vertices.push(a);
            vertices.push(b);
            vertices.push(c);
            vertexColors.push([0.5*a[0]+0.5,0.5*a[1]+0.5,0.5*a[2]+0.5,1]);
            vertexColors.push([0.5*b[0]+0.5,0.5*b[1]+0.5,0.5*b[2]+0.5,1]);
            vertexColors.push([0.5*c[0]+0.5,0.5*c[1]+0.5,0.5*c[2]+0.5,1]);

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
        let rotationValue = 0;

        function render(){
            setTimeout(function(){
                requestAnimationFrame(render);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                rotationValue += 2;
                let Ry = rotateY(rotationValue*1.3);
                let Rx = rotateX(rotationValue*0.8);
                
                let PVMRot = mult(PVM, mult(Rx,Ry));
                gl.uniformMatrix4fv(PVMLoc, false, flatten(PVMRot));
                for (let i = 0; i<vertices.length; i+=3) gl.drawArrays(gl.TRIANGLES, i, 3);
            }, 25);
        }

        document.getElementById("sub-slider").addEventListener("input", ev =>{
            initSphere();
        });

        render();
    },

    hasCanvas: true,
    header: "Colors and Cull face optimization",
    description:
        "Instead of just pushing the color red all the time, we can draw the color of by the vetex position, such that red, green and blue increase and decrease corresponding to x,y,z. "+
        "This is easily achieved by a change in ```divideTriangle``` function. The vertex colors that are now pushed is shown below:"+
        "\n```javascript\n"+
        "vertexColors.push([0.5*a[0]+0.5,0.5*a[1]+0.5,0.5*a[2]+0.5,1]);\n"+
        "vertexColors.push([0.5*b[0]+0.5,0.5*b[1]+0.5,0.5*b[2]+0.5,1]);\n"+
        "vertexColors.push([0.5*c[0]+0.5,0.5*c[1]+0.5,0.5*c[2]+0.5,1]);\n"+
        "```\n"+
        "All surfaces of a closed objects have surfaces that are not visible from a given perspective. The surfaces that are invisible are those which normals are pointing away from the eye/viewpoint. "+
        "Just like with depth, where we can avoid drawing parts of objects that are behind other objects, we can avoid drawing the surfaces that are not in view/hidden. This is done very similarly to depth, shown below: "+
        "\n```javascript\n"+
        "gl.enable(gl.DEPTH_TEST);\n"+
        "gl.enable(gl.CULL_FACE);\n"+
        "```\n"
        ,
} 


