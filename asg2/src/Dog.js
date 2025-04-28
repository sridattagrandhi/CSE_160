// Dog.js

const Colors = {
    head:  [0.9, 0.8, 0.7, 1.0],
    ear:   [0.2, 0.8, 0.7, 1.0],
    snout: [1.0, 0.6, 0.6, 1.0],
    body:  [0.7, 0.5, 0.3, 1.0],
    leg:   [0.4, 0.2, 0.1, 1.0]
  };
  
  function renderDog() {
    // ───────── HEAD ─────────
    const headMat = new Matrix4()
      .setIdentity()
      .translate(0, 0.3, -0.1)
      .scale(0.4, 0.4, 0.4);
    gl.uniform4fv(u_Color, Colors.head);
    drawCube(gl, headMat, Colors.head);
  
    // ───────── SNOUT ─────────
    const snoutMat = new Matrix4(headMat)
      .translate(0.0, 0.3, -0.3)
      .scale(0.1, 0.1, 0.1);
    gl.uniform4fv(u_Color, Colors.snout);
    drawSphere(gl, snoutMat, Colors.snout);
  
    // ───────── BODY ─────────
    const bodyMat = new Matrix4()
      .setIdentity()
      .translate(0, -0.1, 0.3)
      .scale(0.5, 0.5, 1.0);
    gl.uniform4fv(u_Color, Colors.body);
    drawCube(gl, bodyMat, Colors.body);
  
    // ───────── LEFT EAR ─────────
    const earLeft = new Matrix4(headMat)
      .translate(-0.2, 0.5, 0)
      .scale(0.2, 0.2, 0.2);
    gl.uniform4fv(u_Color, Colors.ear);
    drawCube(gl, earLeft, Colors.ear);
  
    // ───────── RIGHT EAR ─────────
    const earRight = new Matrix4(headMat)
      .translate(0.2, 0.5, 0)
      .scale(0.2, 0.2, 0.2);
    gl.uniform4fv(u_Color, Colors.ear);
    drawCube(gl, earRight, Colors.ear);
  
    // ───────── TAIL ─────────
    const tailMat = new Matrix4(bodyMat)
      .translate(0, 0.0, 0.9)
      .rotate(g_tailAngle, 0, 1, 0)
      .scale(0.1, 0.1, 0.4);
    gl.uniform4fv(u_Color, Colors.leg);
    drawCube(gl, tailMat, Colors.leg);
  
    // ───────── LEGS (upper and lower) ─────────
    function drawLeg(offsetX, offsetZ) {
        // ─── UPPER LEG ───
        const upperLeg = new Matrix4(bodyMat)
          .translate(offsetX, -0.4, offsetZ)    // KEEP YOUR TRANSLATE
          .rotate(g_legAngle, 1, 0, 0)           // rotate upper leg
          .scale(0.1, 0.2, 0.1);
        gl.uniform4fv(u_Color, Colors.leg);
        drawCube(gl, upperLeg, Colors.leg);
    
        // ─── LOWER LEG ───
        const lowerLeg = new Matrix4(upperLeg)
          .translate(offsetX, -0.6, offsetZ)     // KEEP YOUR TRANSLATE
          .rotate(g_legAngle, 1, 0, 0)           // rotate with upper leg
          .rotate(g_kneeAngle, 1, 0, 0)          // extra knee rotation
          .scale(0.1, 0.2, 0.1);
        gl.uniform4fv(u_Color, Colors.leg);
        drawCube(gl, lowerLeg, Colors.leg);
      }
  
      function drawPaw(offsetX, offsetZ) {
          const paw = new Matrix4(bodyMat)
            .translate(offsetX, -0.7, offsetZ) // 🠔 Make sure this height matches end of legs
            .rotate(g_pawAngle, 1, 0, 0)
            .scale(0.15, 0.05, 0.2);           // small, flat paw
          gl.uniform4fv(u_Color, Colors.leg);
          drawCube(gl, paw, Colors.leg);
      }

      const totalAngle = g_legAngle + g_kneeAngle + g_pawAngle;
  
    drawLeg( 0.2,  0.75); // Front-Left
    drawLeg(-0.2,  0.75); // Front-Right
    drawLeg( 0.2, -0.15); // Back-Left
    drawLeg(-0.2, -0.15); // Back-Right

    drawPaw( 0.2,  0.75); // Front-Left Paw
    drawPaw(-0.2,  0.75); // Front-Right Paw
    drawPaw( 0.2, -0.15); // Back-Left Paw
    drawPaw(-0.2, -0.15); // Back-Right Paw
  }
  
  window.renderDog = renderDog;
  