// Cube.js
// A centralized, VBO-based cube drawer—now with normals!

let cubeBuffer = null; // Single buffer for interleaved data
// Attribute locations will be fetched in TexturedQuad.js or initCube if program is available
let a_Position_loc_cube, a_TexCoord_loc_cube, a_Normal_loc_cube; 
// Uniform locations are typically global or passed around
// let u_ModelMatrix_loc, u_BaseColor_loc; // These are global in TexturedQuad.js

function initCube(gl) {
  if (!gl) {
    console.error("No WebGL context provided to initCube");
    return;
  }

  if (!cubeBuffer) {
    // x, y, z,   u, v,   nx, ny, nz  (8 floats per vertex)
    const vertices = new Float32Array([
      // Front face
      -0.5, -0.5,  0.5,   0.0, 0.0,   0.0,  0.0,  1.0,
       0.5, -0.5,  0.5,   1.0, 0.0,   0.0,  0.0,  1.0,
       0.5,  0.5,  0.5,   1.0, 1.0,   0.0,  0.0,  1.0,
      -0.5, -0.5,  0.5,   0.0, 0.0,   0.0,  0.0,  1.0,
       0.5,  0.5,  0.5,   1.0, 1.0,   0.0,  0.0,  1.0,
      -0.5,  0.5,  0.5,   0.0, 1.0,   0.0,  0.0,  1.0,

      // Back face
      -0.5, -0.5, -0.5,   1.0, 0.0,   0.0,  0.0, -1.0,
      -0.5,  0.5, -0.5,   1.0, 1.0,   0.0,  0.0, -1.0,
       0.5,  0.5, -0.5,   0.0, 1.0,   0.0,  0.0, -1.0,
      -0.5, -0.5, -0.5,   1.0, 0.0,   0.0,  0.0, -1.0,
       0.5,  0.5, -0.5,   0.0, 1.0,   0.0,  0.0, -1.0,
       0.5, -0.5, -0.5,   0.0, 0.0,   0.0,  0.0, -1.0,

      // Left face
      -0.5, -0.5, -0.5,   0.0, 0.0,  -1.0,  0.0,  0.0,
      -0.5, -0.5,  0.5,   1.0, 0.0,  -1.0,  0.0,  0.0,
      -0.5,  0.5,  0.5,   1.0, 1.0,  -1.0,  0.0,  0.0,
      -0.5, -0.5, -0.5,   0.0, 0.0,  -1.0,  0.0,  0.0,
      -0.5,  0.5,  0.5,   1.0, 1.0,  -1.0,  0.0,  0.0,
      -0.5,  0.5, -0.5,   0.0, 1.0,  -1.0,  0.0,  0.0,

      // Right face
       0.5, -0.5,  0.5,   0.0, 0.0,   1.0,  0.0,  0.0,
       0.5, -0.5, -0.5,   1.0, 0.0,   1.0,  0.0,  0.0,
       0.5,  0.5, -0.5,   1.0, 1.0,   1.0,  0.0,  0.0,
       0.5, -0.5,  0.5,   0.0, 0.0,   1.0,  0.0,  0.0,
       0.5,  0.5, -0.5,   1.0, 1.0,   1.0,  0.0,  0.0,
       0.5,  0.5,  0.5,   0.0, 1.0,   1.0,  0.0,  0.0,

      // Top face
      -0.5,  0.5,  0.5,   0.0, 0.0,   0.0,  1.0,  0.0,
       0.5,  0.5,  0.5,   1.0, 0.0,   0.0,  1.0,  0.0,
       0.5,  0.5, -0.5,   1.0, 1.0,   0.0,  1.0,  0.0,
      -0.5,  0.5,  0.5,   0.0, 0.0,   0.0,  1.0,  0.0,
       0.5,  0.5, -0.5,   1.0, 1.0,   0.0,  1.0,  0.0,
      -0.5,  0.5, -0.5,   0.0, 1.0,   0.0,  1.0,  0.0,

      // Bottom face
      -0.5, -0.5, -0.5,   0.0, 0.0,   0.0, -1.0,  0.0,
       0.5, -0.5, -0.5,   1.0, 0.0,   0.0, -1.0,  0.0,
       0.5, -0.5,  0.5,   1.0, 1.0,   0.0, -1.0,  0.0,
      -0.5, -0.5, -0.5,   0.0, 0.0,   0.0, -1.0,  0.0,
       0.5, -0.5,  0.5,   1.0, 1.0,   0.0, -1.0,  0.0,
      -0.5, -0.5,  0.5,   0.0, 1.0,   0.0, -1.0,  0.0,
    ]);
    
    cubeBuffer = gl.createBuffer();
    if (!cubeBuffer) {
      console.error("Failed to create cube buffer");
      return;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  // Cache attribute locations (called once after shader program is linked)
  // This should ideally be done in TexturedQuad.js after initShaders
  // For now, we assume gl.program is available or these are fetched globally.
  a_Position_loc_cube = gl.getAttribLocation(gl.program, 'a_Position');
  a_TexCoord_loc_cube = gl.getAttribLocation(gl.program, 'a_TexCoord');
  a_Normal_loc_cube = gl.getAttribLocation(gl.program, 'a_Normal');
  
  if (a_Position_loc_cube < 0 || a_TexCoord_loc_cube < 0 || a_Normal_loc_cube < 0 ) {
    console.warn("Cube: Some attribute locations might be missing or inactive in the current shader.");
  }
}

function drawCube(gl, M_model, baseColorToSet) { // M is modelMatrix
  if (!gl || !cubeBuffer) {
    console.error("WebGL context or cube buffer not ready for drawCube");
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  const FSIZE = Float32Array.BYTES_PER_ELEMENT;
  const STRIDE = 8 * FSIZE; // 3 pos, 2 tex, 3 normal

  // Set up attribute pointers
  // These locations (a_Position_loc_cube, etc.) should be valid from initCube or globally.
  // They are now specific to cube, but likely same as sphere's if using same shader program.
  // We will use global locations from TexturedQuad.js (e.g., a_Position_loc) for consistency.

  if (window.a_Position_loc >= 0) {
    gl.vertexAttribPointer(window.a_Position_loc, 3, gl.FLOAT, false, STRIDE, 0);
    gl.enableVertexAttribArray(window.a_Position_loc);
  }
  if (window.a_TexCoord_loc >= 0) {
    gl.vertexAttribPointer(window.a_TexCoord_loc, 2, gl.FLOAT, false, STRIDE, FSIZE * 3);
    gl.enableVertexAttribArray(window.a_TexCoord_loc);
  }
  if (window.a_Normal_loc >= 0) {
    gl.vertexAttribPointer(window.a_Normal_loc, 3, gl.FLOAT, false, STRIDE, FSIZE * 5);
    gl.enableVertexAttribArray(window.a_Normal_loc);
  } else {
    // console.warn("a_Normal_loc is not available for cube.");
  }
  
  // Uniforms are set outside, like u_ModelMatrix, u_NormalMatrix, u_BaseColor, etc.
  // if (u_ModelMatrix_loc) { // u_ModelMatrix_loc is global in TexturedQuad.js
  //   gl.uniformMatrix4fv(u_ModelMatrix_loc, false, M_model.elements);
  // }
  // if (u_BaseColor_loc && baseColorToSet) { // u_BaseColor_loc is global
  //   gl.uniform4fv(u_BaseColor_loc, baseColorToSet);
  // }

  gl.drawArrays(gl.TRIANGLES, 0, 36); // 36 vertices for a cube (6 faces * 2 triangles * 3 vertices)
}

window.initCube = initCube;
window.drawCube = drawCube;