let W6P2 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec2 a_Texcord;
            uniform mat4 P;
            uniform mat4 V;
            varying vec2 v_Texcord;
            void main(){
                v_Texcord = a_Texcord;
                gl_Position = P * V * a_Position;   
            }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
            precision mediump float;
            uniform sampler2D texMap;
            varying vec2 v_Texcord;
            void main() { 
                gl_FragColor = texture2D(texMap, v_Texcord);
            } 
        `
    
    },

    // Controls
    loadControls: () =>{
        let div = document.createElement("div");

        let generateSelect = (id, label) => {
            let select_row = document.createElement("div");
            div.appendChild(select_row);
            select_row.classList.add("row", "js-select");
            
            let select_col = document.createElement("div");
            select_col.classList.add("col-md-5","mb-3");
            select_row.appendChild(select_col);

            let select_label = document.createElement("label");
            select_label["for"] = id;
            select_label.innerText = label;
            select_col.appendChild(select_label);

            let select = document.createElement("select");
            select.classList.add("custom-select","d-block","w-100");
            select.id = id;
            select_col.appendChild(select);

            return select;
        }

        let generateOptions = (select, opts) => {
            for (let index = 0; index < opts.length; index++) {
                const element = opts[index];
                let option = document.createElement("option");
                option.value = index;
                option.innerText = element;
                select.appendChild(option);
            }
        }
        
        let wrap_select = generateSelect("wrap_select", "Texture wraping");
        generateOptions(wrap_select, ["Repeat", "Clamp to edge"]);
        
        let magni_filter_select = generateSelect("magni_filter_select", "Magnification filtering");
        generateOptions(magni_filter_select, ["Nearest", "Linear"]);

        let mini_filter_select = generateSelect("mini_filter_select", "Magnification filtering");
        generateOptions(mini_filter_select, ["Nearest", "Linear", "Nearest-Mipmap-Nearest", "Linear-Mipmap-Nearest", "Nearest-Mipmap-Linear", "Linear-Mipmap-Linear"]);
        
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

        // Optimize for depth test
        gl.enable(gl.DEPTH_TEST);

        
        // Vertices and texels.
        let vertices = [vec3(-4,-1,-1), vec3(4,-1,-1), vec3(4,-1,-21), vec4(-4,-1,-21)];
        gl.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        let vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        let texCords = [vec2(-1.5, 0), vec2(2.5,0), vec2(2.5,10), vec2(-1.5,10)];
        gl.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCords), gl.STATIC_DRAW);

        let tPosition = gl.getAttribLocation(program, "a_Texcord");
        gl.vertexAttribPointer(tPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(tPosition);



        // Texture calculation. (In this case, the texture is calculated syncroniusly)
        let texSize = 64;
        let texels = new Uint8Array(4*texSize*texSize);
        let numRows = 8;
        let numCols = 8;
        for(let i = 0; i < texSize; ++i){
            for(let j = 0; j < texSize; ++j)
            {
                let patchx = Math.floor(i/(texSize/numRows));
                let patchy = Math.floor(j/(texSize/numCols));
                let c = 0;
                if (patchx%2 !== patchy%2){
                    c = 255;
                };
                let idx = 4*(i*texSize + j);
                texels[idx] = texels[idx + 1] = texels[idx + 2] = c;
                texels[idx + 3] = 255;
            }
        }
        
        // PVM
        let V = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
          ];
        let P = perspective(90, 512/512, 0.1, 20);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(V));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(P));

        // Texture setup. (The texture is already loaded, because it was calculated)
        let texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, texels);
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
        gl.generateMipmap(gl.TEXTURE_2D);
        

        function render(){
            switch (document.getElementById("wrap_select").value){
                case "0": 
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                    break;
                case "1":
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    break;
                default: console.error("invalid value for wrap_select"); break;
            }

            switch (document.getElementById("magni_filter_select").value){
                case "0": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); break;
                case "1":   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); break;
                default: console.error("invalid value for magni_filter_select"); break;
            }

            switch (document.getElementById("mini_filter_select").value){
                case "0": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); break;
                case "1": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); break;
                case "2": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST); break;
                case "3": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST); break;
                case "4": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR); break;
                case "5": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); break;
                default: console.error("invalid value for magni_filter_select"); break;
            }
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        document.querySelectorAll(".js-select").forEach( select => {
            select.addEventListener('input', () => {
                render();
            })
        });

        render();
    },

    hasCanvas: true,
    header: "Filtering",
    description:
        "Filtering is done by changing the texture parameters in webgl. The following switch example illustrates how the selection changes the parameters: \n"+
        "```javascript\n"+
        "switch (document.getElementById(\"magni_filter_select\").value){\n"+
        "  case \"0\": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); break;\n"+
        "  case \"1\": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); break;\n"+
        "  default: console.error(\"invalid value for magni_filter_select\"); break;\n"+
        "}\n"+
        "```\n"+
        "## Texture wraping:\n"+
        "#### Repeat: \n"+
        "Coordinates outside the boundaries of the texture, will have a copied texture pattern \"repeated\".\n"+
        "#### Clamp to edge: \n"+
        "Coordinates outside the boundaries of the texture, will have the last known texture color. \n"+
        "## Magnification & Minification filters:\n"+
        "#### Nearest\n"+
        "This setting will display the nearest texel. The resulting effect is also commonly known as pixelation, as it seems like one can single out individual pixels. \n"+
        "### Linear\n"+
        "This setting will display an interpolated texel. The resulting effect is commonly known as blurryness. As the color inbetween 2 texels will be an interpolated color. \n"+
        " \n"+
        "#### Mipmap\n"+
        "In case textures has a resolution that is powers of two, mipmap can be generated. Such that we get texels that are closer to the pixels that is needed.\n"
        ,
} 


