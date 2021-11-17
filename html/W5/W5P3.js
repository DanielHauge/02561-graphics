let W5P3 = {
    
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

        let PVMLoc = gl.getUniformLocation(program, "PVM");
        
        
        let T = translate(0,-0.5,0);
        let at = vec3(0,0,0);
        let up = vec3(0.0,1.0,0.0);
        let eye = vec3(0,0,-3);
        let V = lookAt(eye, at, up);
        let P = perspective(45, 2, 0, 6);
        let VM = mult(V, T)
        let PVM = mult(P, VM);
        PVM = mult(PVM, mult(rotateZ(0), rotateX(90)));
        gl.uniformMatrix4fv(PVMLoc, false, flatten(PVM));


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

                rotationValue += 2;
                let Rz = rotateZ(rotationValue*1.3);
                let PVMRot = mult(PVM, Rz);
                gl.uniformMatrix4fv(PVMLoc, false, flatten(PVMRot));
                gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_BYTE, 0);
            }, 25);
        }

        render();
    },

    hasCanvas: true,
    header: "Loading Triangle mesh",
    description:
        "To load the .obj file and still work comfortably locally, cross origin ressource sharing (CORS) has been enabled with a simple package on the go server, which is now: \n"+
        "```go\n"+
        "package main\n"+
        "import (\n"+
        "\t\"log\"\n"+
        "\t\"net/http\"\n"+
        "\t\"github.com/rs/cors\"\n"+
        ")\n"+
        "func main() { \n"+
        "\tfs := http.FileServer(http.Dir(\"./html\"))\n"+
        "\thandler := cors.Default().Handler(fs)\n"+
        "\tlog.Println(\"Serving at localhost:80...\")\n"+
        "\tlog.Fatal(http.ListenAndServe(\":80\", handler))\n"+
        "}\n"+
        "```\n"+
        "The .obj is loaded with the OBJParser.js which is described and documented in the WebGL Programming Guide."
        ,
} 

