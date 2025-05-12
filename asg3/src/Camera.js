// Camera.js — Adding Full Mouse Look (Pitch & Yaw) + Q/E Key Yaw

class Camera {
  constructor(canvas) {
    this.fov = 60;
    // Initial position will be set by TexturedQuad.js main()
    this.eye = new Vector3([0, 1.7, 0]); 
    this.at  = new Vector3([0, 1.7, -1]); 
    this.up  = new Vector3([0, 1, 0]);

    // Pitch properties removed
    // this.pitchAngle = 0; 
    // this.MAX_PITCH = 89.0;

    this.bodyRadius = 0.3; 
    this.bodyHeight = 1.7;
    
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    
    const aspect = canvas ? (canvas.width / canvas.height) : 1.0;
    this.projectionMatrix.setPerspective(this.fov, aspect, 0.1, 1000);
    
    this.up.normalize();
    this.updateViewMatrix();
  }

  updateViewMatrix() {
    try {
      this.up.normalize(); 
      if (Math.hypot(this.up.elements[0], this.up.elements[1], this.up.elements[2]) < 0.0001) { this.up.set(0, 1, 0); }
      let forward = new Vector3([ this.at.elements[0] - this.eye.elements[0], this.at.elements[1] - this.eye.elements[1], this.at.elements[2] - this.eye.elements[2] ]);
      const forwardLen = Math.hypot(forward.elements[0], forward.elements[1], forward.elements[2]);
      if (forwardLen < 0.0001) { this.at.elements[2] -= 0.01; forward.set(this.at.elements[0] - this.eye.elements[0], this.at.elements[1] - this.eye.elements[1], this.at.elements[2] - this.eye.elements[2]); }
      forward.normalize(); 
      let right = Vector3.cross(forward, this.up);
      if (Math.hypot(right.elements[0], right.elements[1], right.elements[2]) < 0.0001) {
        if (Math.abs(forward.elements[1]) > 0.9) {  this.up.set(0, 0, (forward.elements[1] > 0 ? -1 : 1)); } 
        else { this.up.set(0, 1, 0);  }
        this.up.normalize(); right = Vector3.cross(forward, this.up);
      }
      right.normalize(); 
      let newUp = Vector3.cross(right, forward); newUp.normalize();
      this.up.set(newUp.elements[0], newUp.elements[1], newUp.elements[2]);
      this.viewMatrix.setLookAt(
        this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
        this.at.elements[0], this.at.elements[1], this.at.elements[2],
        this.up.elements[0], this.up.elements[1], this.up.elements[2]
      );
    } catch (e) { console.error("Error in updateViewMatrix:", e); }
  }

  _moveInternal(dx, dy, dz) {
    let newEyeX = this.eye.elements[0] + dx; let newEyeY = this.eye.elements[1] + dy; let newEyeZ = this.eye.elements[2] + dz;
    const camAABB = {
        minX: newEyeX - this.bodyRadius, maxX: newEyeX + this.bodyRadius,
        minY: newEyeY - this.bodyHeight, maxY: newEyeY, 
        minZ: newEyeZ - this.bodyRadius, maxZ: newEyeZ + this.bodyRadius
    };
    let collisionDetected = false;
    if (typeof window.g_worldBlocks !== 'undefined' && typeof window.getBlockAABB !== 'undefined' && typeof window.checkAABBAABBCollision !== 'undefined') {
        for (const block of window.g_worldBlocks) {
            const blockAABB = window.getBlockAABB(block);
            if (window.checkAABBAABBCollision(camAABB, blockAABB)) {
                collisionDetected = true; break;
            }
        }
    }
    if (!collisionDetected) {
        this.eye.elements[0] = newEyeX; this.eye.elements[1] = newEyeY; this.eye.elements[2] = newEyeZ;
        this.at.elements[0] += dx; this.at.elements[1] += dy; this.at.elements[2] += dz;
        return true; 
    }
    return false; 
  }

  moveForward(speed = 0.15) { 
    let dir = new Vector3([ this.at.elements[0] - this.eye.elements[0], 0, this.at.elements[2] - this.eye.elements[2] ]);
    dir.normalize(); 
    if (Math.hypot(dir.elements[0], dir.elements[2]) < 0.0001) {
        let actualForward = new Vector3([ this.at.elements[0] - this.eye.elements[0], this.at.elements[1] - this.eye.elements[1], this.at.elements[2] - this.eye.elements[2]]);
        actualForward.normalize(); dir.set(actualForward.elements[0], 0, actualForward.elements[2]); dir.normalize();
        if (Math.hypot(dir.elements[0], dir.elements[2]) < 0.0001) return;
    }
    if (this._moveInternal(dir.elements[0] * speed, 0, dir.elements[2] * speed)) { this.updateViewMatrix(); }
  }
  moveBackwards(speed = 0.15) { 
    let dir = new Vector3([ this.at.elements[0] - this.eye.elements[0], 0, this.at.elements[2] - this.eye.elements[2] ]);
    dir.normalize();
    if (Math.hypot(dir.elements[0], dir.elements[2]) < 0.0001) {
        let actualForward = new Vector3([ this.at.elements[0] - this.eye.elements[0], this.at.elements[1] - this.eye.elements[1], this.at.elements[2] - this.eye.elements[2]]);
        actualForward.normalize(); dir.set(actualForward.elements[0], 0, actualForward.elements[2]); dir.normalize();
        if (Math.hypot(dir.elements[0], dir.elements[2]) < 0.0001) return;
    }
    if (this._moveInternal(-dir.elements[0] * speed, 0, -dir.elements[2] * speed)) { this.updateViewMatrix(); }
  }
  moveLeft(speed = 0.15) { 
    let viewX = this.at.elements[0] - this.eye.elements[0]; let viewZ = this.at.elements[2] - this.eye.elements[2];
    let rightX = -viewZ; let rightZ = viewX;
    if (Math.hypot(viewX, viewZ) < 0.0001) { 
        let fullViewDir = new Vector3([this.at.elements[0]-this.eye.elements[0], this.at.elements[1]-this.eye.elements[1], this.at.elements[2]-this.eye.elements[2]]);
        fullViewDir.normalize(); let actualRight = Vector3.cross(fullViewDir, this.up);
        rightX = actualRight.elements[0]; rightZ = actualRight.elements[2];
    }
    let rightDirNorm = new Vector3([rightX, 0, rightZ]); rightDirNorm.normalize();
    if (Math.hypot(rightDirNorm.elements[0], rightDirNorm.elements[2]) < 0.0001) return;
    if (this._moveInternal(-rightDirNorm.elements[0] * speed, 0, -rightDirNorm.elements[2] * speed)) { this.updateViewMatrix(); }
  }
  moveRight(speed = 0.15) { 
    let viewX = this.at.elements[0] - this.eye.elements[0]; let viewZ = this.at.elements[2] - this.eye.elements[2];
    let rightX = -viewZ; let rightZ = viewX;
     if (Math.hypot(viewX, viewZ) < 0.0001) {
        let fullViewDir = new Vector3([this.at.elements[0]-this.eye.elements[0], this.at.elements[1]-this.eye.elements[1], this.at.elements[2]-this.eye.elements[2]]);
        fullViewDir.normalize(); let actualRight = Vector3.cross(fullViewDir, this.up);
        rightX = actualRight.elements[0]; rightZ = actualRight.elements[2];
    }
    let rightDirNorm = new Vector3([rightX, 0, rightZ]); rightDirNorm.normalize();
    if (Math.hypot(rightDirNorm.elements[0], rightDirNorm.elements[2]) < 0.0001) return;
    if (this._moveInternal(rightDirNorm.elements[0] * speed, 0, rightDirNorm.elements[2] * speed)) { this.updateViewMatrix(); }
  }

  // panLeft(positive_deg) should turn view to the left.
  panLeft(deg = 2.0) { 
    const yOffset = this.at.elements[1] - this.eye.elements[1];
    let viewDx = this.at.elements[0] - this.eye.elements[0]; 
    let viewDz = this.at.elements[2] - this.eye.elements[2];
    const lenXZ = Math.hypot(viewDx, viewDz);
    if (lenXZ < 0.0001 && Math.abs(yOffset) > 0.0001) { this.updateViewMatrix(); return; } 
    
    const rad = deg * Math.PI / 180.0; 
    const cosA = Math.cos(rad); const sinA = Math.sin(rad);
    const newViewDx = viewDx * cosA - viewDz * sinA;
    const newViewDz = viewDx * sinA + viewDz * cosA;

    this.at.elements[0] = this.eye.elements[0] + newViewDx;
    this.at.elements[2] = this.eye.elements[2] + newViewDz;
    this.at.elements[1] = this.eye.elements[1] + yOffset; 
    this.updateViewMatrix();
  }
  panRight(deg = 2.0) { this.panLeft(-deg); }

  debugInfo() {
    console.log("Camera Eye:", this.eye.elements.slice());
    console.log("Camera At:", this.at.elements.slice());
    console.log("Camera Up:", this.up.elements.slice());
    // console.log("Camera Pitch Angle:", this.pitchAngle); // pitchAngle removed
    let forward = new Vector3([ this.at.elements[0] - this.eye.elements[0], this.at.elements[1] - this.eye.elements[1], this.at.elements[2] - this.eye.elements[2] ]);
    forward.normalize();
    console.log("Camera Forward Vec:", forward.elements.slice());
  }
}

window.Camera = Camera;