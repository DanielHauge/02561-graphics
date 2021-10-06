
let W2P1 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            void main(){
                gl_Position = a_Position;
                gl_PointSize = 10.0;
            }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
            precision mediump float; 
            void main() { 
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            } 
        `
    
    },

    init: () => {

        let canvas = document.getElementById("c");
        let gl = canvas.getContext("webgl");
        if (!gl){
            console.error("Yo gl was not found")
        }
    
        gl.clearColor(0.8,0.9,1.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        let program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);
    
        let max_verts = 1000;
        let index = 0;
        let numPoints = 0;
        let vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);
        
        

    
        let vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
    

        function render(){
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.POINTS, 0, numPoints);
        }
        
        // let mousePos = vec2(0.0,0.0);
        canvas.addEventListener("click", (ev) => {
            var bbox = ev.target.getBoundingClientRect();
            let mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
            gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));
            numPoints = Math.max(numPoints, ++index); index %= max_verts;
            render();
        });

        render();
    },

    hasCanvas: true,
    header: "Events and mouse inputs",
    description:
        "Interacting with the canvas can be done with typical peripheral devices inputs, eg. Using mouse clicks to draw new points. An eventhandler can be added to the canvas, such that it will draw a point on the mouse position in the event that the mouse is clicked on the canvas. "+
        "Allocation of memory is much more expensive than to just write or read. So to handle yet to be drawn points, vertices will be pre-allocated in the vertex buffer. In this case up to 1000 vertices, replacing points when execeding the allowed amount. "+
        "The following code adds the click eventlistener to the canvas, such that it will submit/\"write\" new data to the vertex buffer to draw another point.\n"+
        "```javascript\n"+
        "canvas.addEventListener(\"click\", (ev) => {\n"+
        "\tvar bbox = ev.target.getBoundingClientRect();\n"+
        "\tlet mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);\n"+
        "\tgl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));\n"+
        "\tnumPoints = Math.max(numPoints, ++index); index %= max_verts;\n"+
        "\trender();\n"+
        "});\n"+
        "```\n",
} 


