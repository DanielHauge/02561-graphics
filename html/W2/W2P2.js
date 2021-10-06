
let W2P2 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            varying vec4 v_Color;
            void main(){
                gl_Position = a_Position;
                v_Color = a_Color;
                gl_PointSize = 10.0;
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

    loadControls: () => {
        // Controls div to return for load.
        const div = document.createElement("div");

        // Clear button
        const clearButton = document.createElement("a");
        clearButton.classList.add("btn", "btn-success", "btn-shadow" ,"px-3", "my-3", "ml-0", "text-left");
        clearButton.title = "Download Theme";
        clearButton.innerText = "Clear";
        clearButton.id = "clearbut";
        div.appendChild(clearButton);

        // Clear color selection
        const clearDiv = document.createElement("div");
        const clearSelect = document.createElement("input");
        const clearSelectLabel = document.createElement("label");
        clearSelectLabel.innerHTML =  "- Clear / background color selection";
        clearSelectLabel.htmlFor = "clear-select";
        clearSelect.type = "color";
        clearSelect.id = "clear-select";
        let hex = wshelper.RGBToHex(0.8*255, 0.9*255, 255);
        clearSelect.value = hex;
        clearSelect.defaultValue = hex;
        clearSelect.classList.add("ml-6")
        clearDiv.appendChild(clearSelect);
        clearDiv.appendChild(clearSelectLabel);
        div.appendChild(clearDiv);
        

        // Drawing color selection
        const drawDiv = document.createElement("div");
        const drawSelect = document.createElement("input");
        const drawSelectLabel = document.createElement("label");
        drawSelectLabel.innerHTML =  "- draw color selection";
        drawSelectLabel.htmlFor = "draw-select";
        drawSelect.type = "color";
        drawSelect.id = "draw-select";
        let drawHex = wshelper.RGBToHex(1*255, 0, 0);
        drawSelect.value = drawHex;
        drawSelect.defaultValue = drawHex;
        drawSelect.classList.add("ml-6")
        drawDiv.appendChild(drawSelect);
        drawDiv.appendChild(drawSelectLabel);

        div.appendChild(drawDiv);

        return div;
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

        // Colors
        let cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec3'], gl.STATIC_DRAW);
    
        let cColor = gl.getAttribLocation(program, "a_Color");
        gl.vertexAttribPointer(cColor, 3, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(cColor);

        function render(){
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.POINTS, 0, numPoints);
        }
        
        // let mousePos = vec2(0.0,0.0);
        canvas.addEventListener("click", (ev) => {
            // Submit position data
            var bbox = ev.target.getBoundingClientRect();
            let mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));

            // Submit color data
            const color = wshelper.hexToRGB(document.getElementById("draw-select").value)
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(color));

            numPoints = Math.max(numPoints, ++index); index %= max_verts;
            render();
        });

        document.getElementById("clearbut").addEventListener("click", () => {
            index = 0;
            numPoints = 0;
            render();
        });

        document.getElementById("clear-select").addEventListener("change", (ev) => {
            const newClearColor = wshelper.hexToRGB(ev.target.value);
            gl.clearColor(newClearColor[0]/255,newClearColor[1]/255,newClearColor[2]/255,1.0);
            render();
        });

        render();
    },

    hasCanvas: true,
    header: "Simple controls",
    description:
        "Controls are easily added as HTML. See ```loadControls``` function in JS Code. Eventlisteners can be added to facilitate interaction just like with part 1. The code below adds clear action to button:\n"+
        "```javascript\n"+
        "document.getElementById(\"clearbut\").addEventListener(\"click\", () => {\n"+
            "\tindex = 0;\n"+
            "\tnumPoints = 0;\n"+
            "\trender();\n"+
        "});\n"+
        "```\n\n"+
        "To change clear/background color, the HTML5 color picker is used. Whenever a new color is picked for clear/background, it is changed in the webgl context and rerendered. The code below adds this functionality:\n"+
        "```javascript\n"+
        "document.getElementById(\"clear-select\").addEventListener(\"change\", (ev) => {\n"+
            "\tconst newClearColor = wshelper.hexToRGB(ev.target.value);\n"+
            "\tgl.clearColor(newClearColor[0]/255,newClearColor[1]/255,newClearColor[2]/255,1.0);\n"+
            "\trender();\n"+
        "});\n"+
        "```\n\n"+
        "As the drawing of points now work with 2 buffers, color and position, the draw on click need to switch between buffers when writing. The following code is the new click on canvas handler that switches buffers for colors and position:\n"+
        "```javascript\n"+
        "canvas.addEventListener(\"click\", (ev) => {\n"+
            "\t// Submit position data\n"+
            "\tvar bbox = ev.target.getBoundingClientRect();\n"+
            "\tlet mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);\n"+
            "\tgl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);\n"+
            "\tgl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));\n"+
            "\n"+
            "\t// Submit color data\n"+
            "\tconst color = wshelper.hexToRGB(document.getElementById(\"draw-select\").value)\n"+
            "\tgl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);\n"+
            "\tgl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(color));\n"+
            "\n"+
            "\tnumPoints = Math.max(numPoints, ++index); index %= max_verts;\n"+
            "\trender();\n"+
        "});\n"+
        "```\n\n",
} 


