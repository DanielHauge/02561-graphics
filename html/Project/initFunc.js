ProjectInit = {

    OFFSCREEN_WIDTH:2048, 
    OFFSCREEN_HEIGHT: 2048,

    initVertexBuffersForQuad: (gl) => {
        let scale = 10;
        let vertices = new Float32Array([
          3.0*scale, -2, 2.5*scale,  -3.0*scale, -2, 2.5*scale,  -3.0*scale, -2, -2.5*scale,   3.0*scale, -2, -2.5*scale 
        ]);
        let colors = new Float32Array([
          1.0, 1.0, 1.0,    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,   1.0, 1.0, 1.0
        ]);
        let indices = new Uint8Array([0, 1, 2,   0, 2, 3]);
        let texcords = flatten([vec2(1,-1), vec2(1,1), vec2(-1,-1), vec2(-1,1)]);

        let img = new Image();
        img.onload = function () {
            
            let texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
        img.src = "../images/grass.png";
      
        let o = new Object();
      
        // Write vertex information to buffer object
        o.vertexBuffer = ProjectInit.initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
        o.colorBuffer = ProjectInit.initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
        o.indexBuffer = ProjectInit.initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
        o.texcordBuffer = ProjectInit.initArrayBufferForLaterUse(gl, texcords, 2, gl.FLOAT);      
        o.numIndices = indices.length;
      
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      
        return o;
    },

    initAttributeVariable: (gl, attribute, buffer) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
        gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0); 
        gl.enableVertexAttribArray(attribute); 
    },

    initVertexBuffersForPhone: (gl) => {
        var o = new Object();
        o.vertexBuffer = ProjectInit.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.colorBuffer = ProjectInit.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.normalBuffer = ProjectInit.initArrayBufferForLaterUse(gl, new Float32Array([]), 3, gl.FLOAT);
        o.indexBuffer = ProjectInit.initElementArrayBufferForLaterUse(gl, new Float32Array([]), gl.UNSIGNED_BYTE);
        if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null; 
        
        wshelper.readOBJFile('./stander.obj', gl, o, 0.012, true, (objDoc) => {
            o.g_objDoc = objDoc;
            o.numIndices = objDoc.getDrawingInfo().indices.length;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        
        return o;
    },

    initFramebufferObject: (gl) => {
        let framebuffer, texture, depthBuffer;
      
        let error = () => {
          if (framebuffer) gl.deleteFramebuffer(framebuffer);
          if (texture) gl.deleteTexture(texture);
          if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
          return null;
        }
      
        framebuffer = gl.createFramebuffer();
        if (!framebuffer) {
          console.log('Failed to create frame buffer object');
          return error();
        }
      
        texture = gl.createTexture();
        if (!texture) {
          console.log('Failed to create texture object');
          return error();
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ProjectInit.OFFSCREEN_WIDTH, ProjectInit.OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      
        depthBuffer = gl.createRenderbuffer(); 
        if (!depthBuffer) {
          console.log('Failed to create renderbuffer object');
          return error();
        }
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, ProjectInit.OFFSCREEN_WIDTH, ProjectInit.OFFSCREEN_HEIGHT);
      
        // Attach the texture and the renderbuffer object to the FBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
      
        // Check if FBO is configured correctly
        let e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (gl.FRAMEBUFFER_COMPLETE !== e) {
          console.log('Frame buffer object is incomplete: ' + e.toString());
          return error();
        }
      
        framebuffer.texture = texture; // keep the required object
      
        // Unbind the buffer object
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      
        return framebuffer;
    },

    initArrayBufferForLaterUse: (gl, data, num, type) => {
        let buffer = gl.createBuffer();
        if (!buffer) {
          console.log('Failed to create the buffer object');
          return null;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      
        buffer.num = num;
        buffer.type = type;
      
        return buffer;
    },

    initElementArrayBufferForLaterUse: (gl, data, type) => {
        let buffer = gl.createBuffer();
        if (!buffer) {
          console.log('Failed to create the buffer object');
          return null;
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
      
        buffer.type = type;
      
        return buffer;
    }
}