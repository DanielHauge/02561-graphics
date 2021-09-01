let W1P1 = {
    
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
        
        W1P1.loadShaders();

        let canvas = document.getElementById("c");
        let gl = canvas.getContext("webgl");
        if (!gl){
            console.error("Yo gl was not found")
        }
    
        gl.clearColor(0.8,0.9,1.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    
    },

    hasCanvas: true,
    header: "Hello canvas (Setup)",
    description:
        "Initial setup has the common scripts, a canvas element and 2 script elements respectively for vertex and fragment shaders. Also a seperate javascript file for handling the part of the worksheet, in this case W1P1.js\n"+
        "```html\n"+
        "<script type=\"text/javascript\" src=\"../Common/initShaders.js\" ></script>\n"+
        "<script type=\"text/javascript\" src=\"../Common/MV.js\" ></script>\n"+
        "<script type=\"text/javascript\" src=\"../Common/webgl-utils.js\" ></script>\n"+
        "<script id=\"vertex-shader\" type=\"x-shader/x-vertex\">\n"+
        "<script id=\"fragment-shader\" type=\"x-shader/x-fragment\">\n"+
        "<script type=\"text/javascript\" src=\"W1P1.js\" ></script>\n"+
        "```\n\n"+
        "The W1P1.js file contains an object which holds 2 relevant functions: ```loadShaders()``` which handles the injection of vertex attributes etc. The other function is ```init()``` which is the javascript code that manipulates the canvas and uses WebGL to accomplishes the tasks. "+
        "Aside from the relevant functions, the object also contains some meta information which is used for the lab journal showcasing etc. See full javascript code by clicking the \"JS Code\" button next to the part title.\n\nThe initial canvas is simply cleared to a color:\n"+
        "```javascript\n"+
        "gl.clearColor(0.8,0.9,1.0,1.0);\n"+
        "gl.clear(gl.COLOR_BUFFER_BIT);\n"+
        "```\n\n"
} 


