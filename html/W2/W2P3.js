
let W2P3 = {
    
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
        clearButton.classList.add("btn", "btn-success", "btn-shadow" ,"px-3", "my-0", "ml-0", "text-left");
        clearButton.title = "Download Theme";
        clearButton.innerText = "Clear";
        clearButton.id = "clearbut";
        div.appendChild(clearButton);

        // Drawing mode:
        const modeSelect = document.createElement("select");
        modeSelect.classList.add("custom-select","d-block","w-100", "my-3");
        modeSelect.id = "drawmode";
        const dotOption = document.createElement("option");
        dotOption.text = "Dot";
        dotOption.value = 0;
        const triangleOption = document.createElement("option");
        triangleOption.text = "Triangle";
        triangleOption.value = 1;
        modeSelect.appendChild(dotOption);
        modeSelect.appendChild(triangleOption);
        div.appendChild(modeSelect);

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

        let dotsIndices = [];
        let triangleIndices = [];
        let triangleCounter = 0;


        function render(){
            gl.clear(gl.COLOR_BUFFER_BIT);
            // Draw triangles.
            for (let i = 0; i < triangleIndices.length; i++) {
                const triangleIndex = triangleIndices[i];
                gl.drawArrays(gl.TRIANGLES, triangleIndex, 3);
            }
            // Draw dots
            for (let i = 0; i < dotsIndices.length; i++) {
                const dotIndex = dotsIndices[i];
                gl.drawArrays(gl.POINT, dotIndex, 1);
                
            }
        }
        
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

            // Draw modes.
            switch (document.getElementById("drawmode").value){
                case "0":
                    dotsIndices.push(index);
                    break;
                case "1":
                    if (triangleCounter < 2){
                        dotsIndices.push(index);
                        triangleCounter++;
                    } else{
                        dotsIndices.pop();
                        triangleIndices.push(dotsIndices.pop());
                        triangleCounter = 0;
                    }
                    break;
                default:
                    console.log("Drawmode is invalid?")
                     break;
            }
            
            index++;
            index %= max_verts;
            render();
        });

        document.getElementById("clearbut").addEventListener("click", () => {
            index = 0;
            numPoints = 0;
            triangleCounter = 0;
            triangleIndices = [];
            dotsIndices = [];
            render();
        });

        document.getElementById("clear-select").addEventListener("change", (ev) => {
            const newClearColor = wshelper.hexToRGB(ev.target.value);
            gl.clearColor(newClearColor[0]/255,newClearColor[1]/255,newClearColor[2]/255,1.0);
            render();
        });

        document.getElementById("drawmode").addEventListener("change", (ev) => {
            triangleCounter = 0;
        });

        


        render();
    },

    hasCanvas: true,
    header: "Interactive drawing: Triangles",
    description:
        "Drawing modes is implemented with a select. Selecting triangles, will create a triangle for every third point placed. Essentially just changing the way the shader is rendering the 3 points. "+
        "This change of rendering is achieved by keeping track of indices of each object type. For every third point placed with triangle mode enabled, will remove the indices from points and turn them into triangles: \n"+
        "```javascript\n"+
        "if (triangleCounter < 2){\n"+
            "\tdotsIndices.push(index);\n"+
            "\ttriangleCounter++;\n"+
        "} else{\n"+
            "\tdotsIndices.pop();\n"+
            "\ttriangleIndices.push(dotsIndices.pop());\n"+
            "\ttriangleCounter = 0;\n"+
        "}\n"+
        "```\n"+
        "With these indices tracked, it is just a matter of rendering with different draw styles for draw calls. Render function is changed to:\n"+
        "```javascript\n"+
        "function render(){\n"+
            "\tgl.clear(gl.COLOR_BUFFER_BIT);\n"+
            "\t// Draw triangles.\n"+
            "\tfor (let i = 0; i < triangleIndices.length; i++) {\n"+
                "\t\tconst triangleIndex = triangleIndices[i];\n"+
                "\t\tgl.drawArrays(gl.TRIANGLES, triangleIndex, 3);\n"+
            "\t}\n"+
            "\t// Draw dots\n"+
            "\tfor (let i = 0; i < dotsIndices.length; i++) {\n"+
                "\t\tconst dotIndex = dotsIndices[i];\n"+
                "\t\tgl.drawArrays(gl.POINT, dotIndex, 1);\n"+
            "\t}\n"+
        "}\n"+
        "```\n"+
        "",
} 


