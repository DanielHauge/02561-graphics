
let W2P4 = {
    
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
        const circleOption = document.createElement("option");
        circleOption.text = "Circle";
        circleOption.value = 2;
        modeSelect.appendChild(dotOption);
        modeSelect.appendChild(triangleOption);
        modeSelect.appendChild(circleOption);
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
    
        let max_verts = 1500;
        let overrideVertsAt = 1250;
        let index = 0;
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
        let circleIndices = [];
        let triangleCounter = 0;
        let circleCenter = null;


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

            // Draw circles
            for (let i = 0; i < circleIndices.length; i++) {
                const circleIndex = circleIndices[i];
                gl.drawArrays(gl.TRIANGLE_FAN, circleIndex, 152);
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
                case "2":
                    if(circleCenter == null){
                        dotsIndices.push(index);
                        circleCenter = mousepos;
                    } else{
                        circleIndices.push(dotsIndices.pop());
                        // Push additional vertices points for circle.
                        const v = vec2(circleCenter[0]-mousepos[0], circleCenter[1]-mousepos[1]);
                        const radius = Math.sqrt(v[0]*v[0]+v[1]*v[1]); // a^2 + b^2 = c^2
                        console.log(radius)
                        let n = 150;
                        let vertices = [];
                        let colors = [];
                        for (let i = -1; i < n; i++) {
                            let angle = 2*Math.PI*i/n
                            vertices.push(vec2(circleCenter[0]+radius*Math.cos(angle), circleCenter[1] + radius*Math.sin(angle)));
                            colors.push(color);
                        }
                        // Submit additional position and color data:
                        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(vertices));
                        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(colors));
                        index += 150;
                        circleCenter = null;
                    }
                    break
                default:
                    console.error("Drawmode is invalid?")
                     break;
            }
            
            index++;
            index %= overrideVertsAt;
            render();
        });

        document.getElementById("clearbut").addEventListener("click", () => {
            index = 0;
            numPoints = 0;
            triangleCounter = 0;
            triangleIndices = [];
            dotsIndices = [];
            circleCounter = 0;
            render();
        });

        document.getElementById("clear-select").addEventListener("change", (ev) => {
            const newClearColor = wshelper.hexToRGB(ev.target.value);
            gl.clearColor(newClearColor[0]/255,newClearColor[1]/255,newClearColor[2]/255,1.0);
            render();
        });

        document.getElementById("drawmode").addEventListener("change", (ev) => {
            triangleCounter = 0;
            circleCounter = 0;
        });

        


        render();
    },

    hasCanvas: true,
    header: "Interactive drawing: Circles",
    description:
        "Inactive drawing for circles are very similar to triangles. Although this time, 2 points will generate 150 in this case additional vertices. Instead of keeping track of amount of points as with triangles, circles save a center point on first click. Second click in circle mode will calculate the length from circle center saved on first click to this second point and use it as radius. With the radius found, the circle vertices generated is identical to worksheet 1 part 5. The circles are then drawn with the ```TRIANGLE_FAN``` style in the draw call:\n"+
        "```javascript\n"+
        "for (let i = 0; i < circleIndices.length; i++) {\n"+
            "\tconst circleIndex = circleIndices[i];\n"+
            "\tgl.drawArrays(gl.TRIANGLE_FAN, circleIndex, 152);\n"+
        "}\n"+
        "```\n",
} 


