let W6P3 = {
    
    loadShaders : () => {
        let vertex = document.getElementById("vertex-shader");
        vertex.innerText = `
            attribute vec4 a_Position;
            attribute vec4 a_Normal;
            varying vec4 v_Color, Pos;
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
                Pos = a_Normal;
                gl_Position = P * V * a_Position;   
            }
        `
    
        let fragment = document.getElementById("fragment-shader");
        fragment.innerText = `
            precision mediump float;
            uniform sampler2D texMap;
            uniform float shininess;
            uniform vec4 ambientProduct;
            uniform vec4 diffuseProduct;
            uniform vec4 specularProduct;
            varying vec3 N, L, E;
            varying vec4 Pos;

            void main() { 
                vec4 v_Color;
                vec3 H = normalize( L + E );

                vec4 ambient = ambientProduct;


                float Ks = pow( max(dot(N, H), 0.0), shininess );
                vec4  specular = Ks * specularProduct;
                if( dot(L, N) < 0.0 ) {
                    specular = vec4(0.0, 0.0, 0.0, 1.0);
                } 

                vec2 Texcord;
                Texcord.x = 1.0 - (atan(Pos.z, Pos.x)/(2.0*3.14));
                Texcord.y = acos(Pos.y)/3.14;
                v_Color = (ambient * texture2D(texMap, Texcord) * specular) + texture2D(texMap, Texcord) * vec4(0.2,0.2,0.2,0.2) ;
                v_Color.a = 1.0;
                gl_FragColor = v_Color;
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

        let mini_filter_select = generateSelect("mini_filter_select", "Magnification filtering");
        generateOptions(mini_filter_select, ["Nearest", "Linear", "Nearest-Mipmap-Nearest", "Linear-Mipmap-Nearest", "Nearest-Mipmap-Linear", "Linear-Mipmap-Linear"]);
        
        
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
        gl.iBuffer = null;
    

        // The initial simplex in 3d.
        let va = vec4(0.0, 0.0, -1.0,1);
        let vb = vec4(0.0, 0.942809, 0.333333, 1);
        let vc = vec4(-0.816497, -0.471405, 0.333333, 1);
        let vd = vec4(0.816497, -0.471405, 0.333333,1);

        // The model data arrays to be sent to buffers.
        let vertices = [];
        let normals = [];
        let indices = [];
        let index = 0;

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
            indices.push(++index);
            indices.push(++index);
            indices.push(++index);
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
            
            // Buffers
            vertices = [];
            vertexColors = [];
            normals = [];
            indices = [];
            index = 0;
            gl.clearColor(0.8,0.9,1.0,1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            const subDivs = 8;
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

            gl.deleteBuffer(gl.iBuffer);
            let iBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
            

            // Light
            let le = 1.3;
            let ambient = vec4(le, le, le, le );
            let ks = 1.2;
            let specular = mult(vec4( ks, ks, ks, ks ),vec4( 0.8,0.8,0.8, 1));
            gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(vec4(3,3,3, 1.0)));
            gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),  flatten(ambient));
            gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specular));
            gl.uniform1f(gl.getUniformLocation(program, "shininess"), 0.8);

            // Texture
            var img = new Image();
            img.onload = function () {
                
                let texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.activeTexture(gl.TEXTURE0);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
                gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            }
            img.src = "../images/earth.jpg";
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

        initSphere();

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "P"), false, flatten(P));
        gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix));     
        

        function render(){
            setTimeout(function(){
                
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                theta += 0.045;
                phi += 0.08;
                eye = vec3(radius*Math.sin(theta)*Math.cos(0),radius*Math.sin(theta)*Math.sin(0), radius*Math.cos(theta));
                V = lookAt(eye, at, up);
                V = mult(V, scale);
                gl.uniformMatrix4fv(gl.getUniformLocation(program, "V"), false, flatten(V));

                
                gl.drawArrays(gl.TRIANGLES, 0, indices.length);
                requestAnimationFrame(render);
            }, 25);
        }


        document.querySelectorAll(".js-select").forEach( select => {
            select.addEventListener('input', () => {
                switch (document.getElementById("mini_filter_select").value){
                    case "0": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); break;
                    case "1": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); break;
                    case "2": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST); break;
                    case "3": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST); break;
                    case "4": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR); break;
                    case "5": gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); break;
                    default: console.error("invalid value for magni_filter_select"); break;
                }
            })
        });


        render();
    },

    hasCanvas: true,
    header: "A beautiful wet rock",
    description:
        "Using phong lighting from previus implementation, and sphere implementation from worksheet 4 as baseline. "+
        "The texture is loaded like in previous parts, but instead of a calculated texture an image is used as texture. " +
        "The texture is very large compared to the face it is used on, so it will primarily be minification issues that is observed. "+
        "**__Disclaimer: I clearly see the effect of different texture filtering on part 2, however i cannot see a clear difference in part 3 with the spinning earth__**. \n"+
        "Disregarding previous statement, if one would need to increase quality without too much blurring, LINEAR/interpolation should not be used. The \"LINEAR_MIPMAP_NEAREST\" could be a good candidat for providing good results without too much blurryness. It is using interpolating filter on the the reduced mipmap, otherwise not. This should give the effect of a retained pattern without too much blurryness."
        ,
} 


