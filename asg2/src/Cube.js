// Cube.js
// A centralized, VBO-based cube drawer—no more scattered triangles!

let cubeBuffer = null;
let a_Position_loc, u_ModelMatrix_loc, u_Color_loc;

/**
 * initCube(gl)
 *   Call once after your shaders are initialized to build the cube VBO
 *   and cache attribute/uniform locations.
 */
function initCube(gl) {
  if (!cubeBuffer) {
    // 6 faces × 2 triangles/face × 3 verts = 36 vertices
    const vertices = new Float32Array([
      // Front
      -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
      -0.5,-0.5, 0.5,   0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,
      // Back
      -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5,
      -0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5,-0.5,-0.5,
      // Left
      -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
      -0.5,-0.5,-0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,
      // Right
       0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,
       0.5,-0.5, 0.5,   0.5, 0.5,-0.5,   0.5, 0.5, 0.5,
      // Top
      -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,
      -0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,
      // Bottom
      -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
      -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5
    ]);
    cubeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  // Cache once
  a_Position_loc    = gl.getAttribLocation(gl.program,  'a_Position');
  u_ModelMatrix_loc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_Color_loc       = gl.getUniformLocation(gl.program, 'u_Color');
}

/**
 * drawCube(gl, M, color)
 *   Binds the cube VBO, uploads the model matrix & color, then draws 36 verts.
 */
function drawCube(gl, M, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(a_Position_loc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position_loc);

  gl.uniformMatrix4fv(u_ModelMatrix_loc, false, M.elements);
  gl.uniform4fv(u_Color_loc, color);

  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

window.initCube = initCube;
window.drawCube = drawCube;
