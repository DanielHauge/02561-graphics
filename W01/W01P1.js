let W01P1 = {

    hasCanvas: true,
    header: "Hello canvas (Setup)",
    description:"did og dat",

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
        
        W01P1.loadShaders();

        let canvas = document.getElementById("c");
        let gl = canvas.getContext("webgl");
        if (!gl){
            console.error("Yo gl was not found")
        }
    
        gl.clearColor(0.8,0.9,1.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    
    }
} 


