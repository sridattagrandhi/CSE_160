// Cube.js
// A centralized, VBO-based cube drawer—no more scattered triangles!

let cubeBuffer = null;
let a_Position_loc, a_TexCoord_loc, u_ModelMatrix_loc, u_BaseColor_loc;

function initCube(gl) {
  if (!gl) {
    console.error("No WebGL context provided to initCube");
    return;
  }

  if (!cubeBuffer) {
    const vertices = new Float32Array([
      // x,y,z,   u,v    (6 faces × 2 tris × 3 verts)
      // Front
      -0.5,-0.5, 0.5, 0.0,0.0,   0.5,-0.5, 0.5,1.0,0.0,   0.5,0.5,0.5,1.0,1.0,
      -0.5,-0.5, 0.5, 0.0,0.0,   0.5,0.5, 0.5,1.0,1.0,  -0.5,0.5,0.5,0.0,1.0,
      // Back
      -0.5,-0.5,-0.5, 1.0,0.0,  -0.5,0.5,-0.5,1.0,1.0,   0.5,0.5,-0.5,0.0,1.0,
      -0.5,-0.5,-0.5, 1.0,0.0,   0.5,0.5,-0.5,0.0,1.0,   0.5,-0.5,-0.5,0.0,0.0,
      // Left
      -0.5,-0.5,-0.5, 0.0,0.0,  -0.5,-0.5,0.5,1.0,0.0,  -0.5,0.5,0.5,1.0,1.0,
      -0.5,-0.5,-0.5, 0.0,0.0,  -0.5,0.5,0.5,1.0,1.0,  -0.5,0.5,-0.5,0.0,1.0,
      // Right
       0.5,-0.5, 0.5,0.0,0.0,   0.5,-0.5,-0.5,1.0,0.0,   0.5,0.5,-0.5,1.0,1.0,
       0.5,-0.5, 0.5,0.0,0.0,   0.5,0.5,-0.5,1.0,1.0,    0.5,0.5,0.5,0.0,1.0,
      // Top
      -0.5, 0.5, 0.5,0.0,0.0,   0.5,0.5,0.5,1.0,0.0,    0.5,0.5,-0.5,1.0,1.0,
      -0.5, 0.5, 0.5,0.0,0.0,   0.5,0.5,-0.5,1.0,1.0,  -0.5,0.5,-0.5,0.0,1.0,
      // Bottom
      -0.5,-0.5,-0.5,0.0,0.0,    0.5,-0.5,-0.5,1.0,0.0,  0.5,-0.5,0.5,1.0,1.0,
      -0.5,-0.5,-0.5,0.0,0.0,    0.5,-0.5,0.5,1.0,1.0,  -0.5,-0.5,0.5,0.0,1.0
    ]);
    
    cubeBuffer = gl.createBuffer();
    if (!cubeBuffer) {
      console.error("Failed to create cube buffer");
      return;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  // cache all the locations
  a_Position_loc = gl.getAttribLocation(gl.program, 'a_Position');
  a_TexCoord_loc = gl.getAttribLocation(gl.program, 'a_TexCoord');
  u_ModelMatrix_loc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_BaseColor_loc = gl.getUniformLocation(gl.program, 'u_BaseColor');
  
  if (a_Position_loc < 0 || a_TexCoord_loc < 0 || 
      !u_ModelMatrix_loc || !u_BaseColor_loc) {
    console.warn("Some attributes or uniforms might be missing");
  }
}

function drawCube(gl, M, color) {
  if (!gl || !cubeBuffer) {
    console.error("WebGL context or cube buffer not ready");
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  const FSIZE = Float32Array.BYTES_PER_ELEMENT;

  // Only enable attributes if they exist
  if (a_Position_loc >= 0) {
    gl.vertexAttribPointer(a_Position_loc, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position_loc);
  }

  if (a_TexCoord_loc >= 0) {
    gl.vertexAttribPointer(a_TexCoord_loc, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_TexCoord_loc);
  }

  // Set uniforms if they exist
  if (u_ModelMatrix_loc) {
    gl.uniformMatrix4fv(u_ModelMatrix_loc, false, M.elements);
  }
  
  if (u_BaseColor_loc && color) {
    gl.uniform4fv(u_BaseColor_loc, color);
  }

  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

window.initCube = initCube;
window.drawCube = drawCube;