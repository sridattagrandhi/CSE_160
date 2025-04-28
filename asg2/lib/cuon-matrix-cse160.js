// cuon-matrix-cse160.js

//
// A 4×4 matrix and 3D vector utility library
//

// 3-component vector class (used if you need lookAt, etc.)
class Vector3 {
    constructor(x=0, y=0, z=0) {
      this.elements = new Float32Array([x, y, z]);
    }
    set(x, y, z) {
      const e = this.elements;
      e[0]=x; e[1]=y; e[2]=z;
      return this;
    }
  }
  
  // 4×4 matrix class
  class Matrix4 {
    constructor() {
      this.elements = new Float32Array(16);
      this.setIdentity();
    }
  
    // load identity
    setIdentity() {
      const e = this.elements;
      e[0]=1; e[4]=0; e[8]=0;  e[12]=0;
      e[1]=0; e[5]=1; e[9]=0;  e[13]=0;
      e[2]=0; e[6]=0; e[10]=1; e[14]=0;
      e[3]=0; e[7]=0; e[11]=0; e[15]=1;
      return this;
    }
  
    // premultiply by a translation matrix
    translate(x, y, z) {
      const e = this.elements;
      e[12] += x*e[0] + y*e[4] + z*e[8];
      e[13] += x*e[1] + y*e[5] + z*e[9];
      e[14] += x*e[2] + y*e[6] + z*e[10];
      e[15] += x*e[3] + y*e[7] + z*e[11];
      return this;
    }
  
    // premultiply by a scaling matrix
    scale(x, y, z) {
      const e = this.elements;
      e[0] *= x;  e[4] *= y;  e[8]  *= z;
      e[1] *= x;  e[5] *= y;  e[9]  *= z;
      e[2] *= x;  e[6] *= y;  e[10] *= z;
      e[3] *= x;  e[7] *= y;  e[11] *= z;
      return this;
    }
  
    // premultiply by a rotation matrix about axis (x,y,z) by angle° 
    rotate(angle, x, y, z) {
      const rad = Math.PI * angle / 180.0;
      let len = Math.hypot(x, y, z);
      if (len === 0) { return this; }
      x /= len; y /= len; z /= len;
      const s = Math.sin(rad), c = Math.cos(rad), t = 1 - c;
  
      // build rotation matrix R
      const r00 = t*x*x + c;
      const r01 = t*x*y + z*s;
      const r02 = t*x*z - y*s;
      const r10 = t*x*y - z*s;
      const r11 = t*y*y + c;
      const r12 = t*y*z + x*s;
      const r20 = t*x*z + y*s;
      const r21 = t*y*z - x*s;
      const r22 = t*z*z + c;
  
      const e = this.elements;
      // multiply current matrix by R on the left: this = R * this
      const m00 = e[0], m01 = e[4], m02 = e[8],  m03 = e[12];
      const m10 = e[1], m11 = e[5], m12 = e[9],  m13 = e[13];
      const m20 = e[2], m21 = e[6], m22 = e[10], m23 = e[14];
      const m30 = e[3], m31 = e[7], m32 = e[11], m33 = e[15];
  
      e[0]  = r00*m00 + r01*m10 + r02*m20;
      e[4]  = r00*m01 + r01*m11 + r02*m21;
      e[8]  = r00*m02 + r01*m12 + r02*m22;
      e[12] = r00*m03 + r01*m13 + r02*m23;
  
      e[1]  = r10*m00 + r11*m10 + r12*m20;
      e[5]  = r10*m01 + r11*m11 + r12*m21;
      e[9]  = r10*m02 + r11*m12 + r12*m22;
      e[13] = r10*m03 + r11*m13 + r12*m23;
  
      e[2]  = r20*m00 + r21*m10 + r22*m20;
      e[6]  = r20*m01 + r21*m11 + r22*m21;
      e[10] = r20*m02 + r21*m12 + r22*m22;
      e[14] = r20*m03 + r21*m13 + r22*m23;
  
      // bottom row stays [0 0 0 1]
      e[3]  = m30; e[7]  = m31; e[11] = m32; e[15] = m33;
      return this;
    }
  
    // optional: a multiply(other) to post-multiply by another Matrix4
    multiply(other) {
      const a = this.elements, b = other.elements;
      const tmp = new Float32Array(16);
      for (let i = 0; i < 4; ++i) {
        for (let j = 0; j < 4; ++j) {
          tmp[i*4 + j] =
            a[i*4 + 0] * b[0*4 + j] +
            a[i*4 + 1] * b[1*4 + j] +
            a[i*4 + 2] * b[2*4 + j] +
            a[i*4 + 3] * b[3*4 + j];
        }
      }
      this.elements.set(tmp);
      return this;
    }
  }
  
  // Export globals if using modules (otherwise these define globals)
  window.Vector3 = Vector3;
  window.Matrix4 = Matrix4;
  