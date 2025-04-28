// sphere.js
// A simple UV‐sphere VBO + IBO drawer.

let sphereVBO = null, sphereIBO = null, sphereIndexCount = 0, a_SpherePosLoc = null;

function initSphere(gl, latBands = 24, longBands = 24) {
  if (sphereVBO) return;  // already built

  const positions = [];
  const indices   = [];

  for (let lat = 0; lat <= latBands; lat++) {
    const theta = lat * Math.PI / latBands,
          sinT  = Math.sin(theta),
          cosT  = Math.cos(theta);
    for (let lon = 0; lon <= longBands; lon++) {
      const phi = lon * 2 * Math.PI / longBands,
            sinP = Math.sin(phi),
            cosP = Math.cos(phi);
      positions.push(cosP * sinT, cosT, sinP * sinT);
    }
  }

  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < longBands; lon++) {
      const first  = lat * (longBands + 1) + lon;
      const second = first + longBands + 1;
      indices.push(first, second, first + 1,
                   second, second + 1, first + 1);
    }
  }

  sphereIndexCount = indices.length;

  // Position VBO
  sphereVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Index IBO
  sphereIBO = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  a_SpherePosLoc = gl.getAttribLocation(gl.program, 'a_Position');
}

function drawSphere(gl, M, color) {
  // Bind position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVBO);
  gl.vertexAttribPointer(a_SpherePosLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_SpherePosLoc);

  // Bind index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIBO);

  // Upload transforms & color
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  gl.uniform4fv(u_Color, color);

  // Draw
  gl.drawElements(gl.TRIANGLES, sphereIndexCount, gl.UNSIGNED_SHORT, 0);
}

window.initSphere  = initSphere;
window.drawSphere  = drawSphere;
