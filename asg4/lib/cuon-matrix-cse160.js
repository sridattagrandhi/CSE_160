// cuon-matrix-cse160.js

// A 4×4 matrix and 3D vector utility library

// 3-component vector class
class Vector3 {
  constructor(x=0, y=0, z=0) {
    // allow new Vector3([x,y,z])
    if (Array.isArray(x) && x.length === 3) {
      this.elements = new Float32Array(x);
    } else {
      this.elements = new Float32Array([x, y, z]);
    }
  }

  // set components
  set(x, y, z) {
    const e = this.elements;
    e[0] = x; e[1] = y; e[2] = z;
    return this;
  }

  // add another Vector3 in place
  add(v) {
    const e = this.elements, f = v.elements;
    e[0] += f[0]; e[1] += f[1]; e[2] += f[2];
    return this;
  }

  // subtract v from this in place
  sub(v) {
    const e = this.elements, f = v.elements;
    e[0] -= f[0]; e[1] -= f[1]; e[2] -= f[2];
    return this;
  }

  // multiply by scalar in place
  mul(s) {
    const e = this.elements;
    e[0] *= s; e[1] *= s; e[2] *= s;
    return this;
  }

  // normalize this vector in place
  normalize() {
    const e = this.elements;
    const len = Math.hypot(e[0], e[1], e[2]);
    if (len > 0.00001) { // Added small epsilon to avoid division by zero
      const inv = 1 / len;
      e[0] *= inv; e[1] *= inv; e[2] *= inv;
    }
    return this;
  }

  // static cross product: a × b
  static cross(a, b) {
    const ae = a.elements, be = b.elements;
    return new Vector3(
      ae[1]*be[2] - ae[2]*be[1],
      ae[2]*be[0] - ae[0]*be[2],
      ae[0]*be[1] - ae[1]*be[0]
    );
  }

  // static dot product: a · b
  static dot(a, b) {
    const ae = a.elements, be = b.elements;
    return ae[0]*be[0] + ae[1]*be[1] + ae[2]*be[2];
  }
}

// 4×4 matrix class
class Matrix4 {
  constructor() {
    this.elements = new Float32Array(16);
    this.setIdentity();
  }

  setIdentity() {
    const e = this.elements;
    e[0]=1; e[4]=0; e[8]=0;  e[12]=0;
    e[1]=0; e[5]=1; e[9]=0;  e[13]=0;
    e[2]=0; e[6]=0; e[10]=1; e[14]=0;
    e[3]=0; e[7]=0; e[11]=0; e[15]=1;
    return this;
  }

  setLookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz) {
    const e = this.elements;
    // forward = center−eye
    let fx = cx - ex, fy = cy - ey, fz = cz - ez;
    let rlf = 1 / Math.hypot(fx, fy, fz);
    fx *= rlf; fy *= rlf; fz *= rlf;
    // side = forward × up
    let sx = fy*uz - fz*uy;
    let sy = fz*ux - fx*uz;
    let sz = fx*uy - fy*ux;
    let rls = 1 / Math.hypot(sx, sy, sz);
    sx *= rls; sy *= rls; sz *= rls;
    // new up = side × forward
    let ux_ = sy*fz - sz*fy;
    let uy_ = sz*fx - sx*fz;
    let uz_ = sx*fy - sy*fx;
    e[0]= sx;  e[4]= sy;  e[8]= sz;   e[12]= -(sx*ex + sy*ey + sz*ez);
    e[1]= ux_; e[5]= uy_; e[9]= uz_;   e[13]= -(ux_*ex + uy_*ey + uz_*ez);
    e[2]= -fx; e[6]= -fy; e[10]= -fz;  e[14]=  (fx*ex + fy*ey + fz*ez);
    e[3]= 0;    e[7]=0;    e[11]=0;    e[15]=1;
    return this;
  }

  setPerspective(fovy, aspect, near, far) {
    const e = this.elements;
    const f = 1.0 / Math.tan((fovy/2) * Math.PI/180);
    const nf = 1/(near - far);
    e[0]= f/aspect; e[4]=0; e[8]=0;                    e[12]=0;
    e[1]=0;          e[5]=f; e[9]=0;                    e[13]=0;
    e[2]=0;          e[6]=0; e[10]=(far+near)*nf;       e[14]=2*far*near*nf;
    e[3]=0;          e[7]=0; e[11]=-1;                  e[15]=0;
    return this;
  }

  translate(x, y, z) {
    const e = this.elements;
    e[12] += x*e[0] + y*e[4] + z*e[8];
    e[13] += x*e[1] + y*e[5] + z*e[9];
    e[14] += x*e[2] + y*e[6] + z*e[10];
    e[15] += x*e[3] + y*e[7] + z*e[11];
    return this;
  }

  setTranslate(x, y, z) {
    this.setIdentity();
    this.elements[12]=x;
    this.elements[13]=y;
    this.elements[14]=z;
    return this;
  }

  scale(x, y, z) {
    const e = this.elements;
    e[0]*=x; e[4]*=y; e[8]*=z;
    e[1]*=x; e[5]*=y; e[9]*=z;
    e[2]*=x; e[6]*=y; e[10]*=z;
    e[3]*=x; e[7]*=y; e[11]*=z;
    return this;
  }

  rotate(angle, x, y, z) {
    const rad = angle * Math.PI/180;
    let len = Math.hypot(x,y,z);
    if (len===0) return this;
    x/=len; y/=len; z/=len;
    const s=Math.sin(rad), c=Math.cos(rad), t=1-c;
    // R = …
    const r00 = t*x*x + c,    r01 = t*x*y + z*s,  r02 = t*x*z - y*s;
    const r10 = t*x*y - z*s,  r11 = t*y*y + c,    r12 = t*y*z + x*s;
    const r20 = t*x*z + y*s,  r21 = t*y*z - x*s,  r22 = t*z*z + c;

    const e=this.elements,
          m00=e[0], m01=e[4], m02=e[8],  m03=e[12],
          m10=e[1], m11=e[5], m12=e[9],  m13=e[13],
          m20=e[2], m21=e[6], m22=e[10], m23=e[14];
          // m30=e[3], m31=e[7], m32=e[11], m33=e[15]; // Not needed for multiplication by R

    e[0] = r00*m00 + r01*m10 + r02*m20;
    e[4] = r00*m01 + r01*m11 + r02*m21;
    e[8] = r00*m02 + r01*m12 + r02*m22;
    e[12]= r00*m03 + r01*m13 + r02*m23;

    e[1] = r10*m00 + r11*m10 + r12*m20;
    e[5] = r10*m01 + r11*m11 + r12*m21;
    e[9] = r10*m02 + r11*m12 + r12*m22;
    e[13]= r10*m03 + r11*m13 + r12*m23;

    e[2] = r20*m00 + r21*m10 + r22*m20;
    e[6] = r20*m01 + r21*m11 + r22*m21;
    e[10]= r20*m02 + r21*m12 + r22*m22;
    e[14]= r20*m03 + r21*m13 + r22*m23;

    // bottom row of M remains unchanged when multiplied by R
    // e[3]=m30; e[7]=m31; e[11]=m32; e[15]=m33;
    return this;
  }

  // multiply this matrix by another matrix
  multiply(other) {
    const a=this.elements, b=other.elements;
    const out = new Float32Array(16);

    for (let i=0;i<4;++i) {
      for (let j=0;j<4;++j) {
        out[j*4+i] = // Transposed access for standard column-major matrix multiplication
          a[0*4+i]*b[j*4+0] +
          a[1*4+i]*b[j*4+1] +
          a[2*4+i]*b[j*4+2] +
          a[3*4+i]*b[j*4+3];
      }
    }
    this.elements.set(out);
    return this;
  }
  
  // Create a new matrix that is the multiplication of this and another
  multiplied(other) {
    const newMatrix = new Matrix4();
    newMatrix.elements.set(this.elements); // copy current matrix
    return newMatrix.multiply(other);      // then multiply
  }


  // multiply this matrix by a Vector3 (treating vec as [x,y,z,1])
  multiplyVector3(v) {
    const e=this.elements, x=v.elements[0], y=v.elements[1], z=v.elements[2];
    const wInv = 1 / (e[3]*x + e[7]*y + e[11]*z + e[15]); // For perspective division if w is not 1
    return new Vector3(
      (e[0]*x + e[4]*y + e[8]*z  + e[12]) * wInv,
      (e[1]*x + e[5]*y + e[9]*z  + e[13]) * wInv,
      (e[2]*x + e[6]*y + e[10]*z + e[14]) * wInv
    );
  }

  // NEW: Transpose this matrix
  transpose() {
    const e = this.elements;
    let t;
    t = e[ 1];  e[ 1] = e[ 4];  e[ 4] = t;
    t = e[ 2];  e[ 2] = e[ 8];  e[ 8] = t;
    t = e[ 3];  e[ 3] = e[12];  e[12] = t;
    t = e[ 6];  e[ 6] = e[ 9];  e[ 9] = t;
    t = e[ 7];  e[ 7] = e[13];  e[13] = t;
    t = e[11];  e[11] = e[14];  e[14] = t;
    return this;
  }

  // NEW: Set this matrix to the inverse of another matrix
  setInverseOf(other) {
    const s = other.elements; // Source matrix elements
    const d = new Float32Array(16); // Determinant array (adjugate)
    const t = this.elements; // Target matrix elements (this.elements)

    d[0]  = s[5]*s[10]*s[15] - s[5]*s[11]*s[14] - s[9]*s[6]*s[15] + s[9]*s[7]*s[14] + s[13]*s[6]*s[11] - s[13]*s[7]*s[10];
    d[4]  = -s[4]*s[10]*s[15] + s[4]*s[11]*s[14] + s[8]*s[6]*s[15] - s[8]*s[7]*s[14] - s[12]*s[6]*s[11] + s[12]*s[7]*s[10];
    d[8]  = s[4]*s[9]*s[15] - s[4]*s[11]*s[13] - s[8]*s[5]*s[15] + s[8]*s[7]*s[13] + s[12]*s[5]*s[11] - s[12]*s[7]*s[9];
    d[12] = -s[4]*s[9]*s[14] + s[4]*s[10]*s[13] + s[8]*s[5]*s[14] - s[8]*s[6]*s[13] - s[12]*s[5]*s[10] + s[12]*s[6]*s[9];

    d[1]  = -s[1]*s[10]*s[15] + s[1]*s[11]*s[14] + s[9]*s[2]*s[15] - s[9]*s[3]*s[14] - s[13]*s[2]*s[11] + s[13]*s[3]*s[10];
    d[5]  = s[0]*s[10]*s[15] - s[0]*s[11]*s[14] - s[8]*s[2]*s[15] + s[8]*s[3]*s[14] + s[12]*s[2]*s[11] - s[12]*s[3]*s[10];
    d[9]  = -s[0]*s[9]*s[15] + s[0]*s[11]*s[13] + s[8]*s[1]*s[15] - s[8]*s[3]*s[13] - s[12]*s[1]*s[11] + s[12]*s[3]*s[9];
    d[13] = s[0]*s[9]*s[14] - s[0]*s[10]*s[13] - s[8]*s[1]*s[14] + s[8]*s[2]*s[13] + s[12]*s[1]*s[10] - s[12]*s[2]*s[9];

    d[2]  = s[1]*s[6]*s[15] - s[1]*s[7]*s[14] - s[5]*s[2]*s[15] + s[5]*s[3]*s[14] + s[13]*s[2]*s[7] - s[13]*s[3]*s[6];
    d[6]  = -s[0]*s[6]*s[15] + s[0]*s[7]*s[14] + s[4]*s[2]*s[15] - s[4]*s[3]*s[14] - s[12]*s[2]*s[7] + s[12]*s[3]*s[6];
    d[10] = s[0]*s[5]*s[15] - s[0]*s[7]*s[13] - s[4]*s[1]*s[15] + s[4]*s[3]*s[13] + s[12]*s[1]*s[7] - s[12]*s[3]*s[5];
    d[14] = -s[0]*s[5]*s[14] + s[0]*s[6]*s[13] + s[4]*s[1]*s[14] - s[4]*s[2]*s[13] - s[12]*s[1]*s[6] + s[12]*s[2]*s[5];

    d[3]  = -s[1]*s[6]*s[11] + s[1]*s[7]*s[10] + s[5]*s[2]*s[11] - s[5]*s[3]*s[10] - s[9]*s[2]*s[7] + s[9]*s[3]*s[6];
    d[7]  = s[0]*s[6]*s[11] - s[0]*s[7]*s[10] - s[4]*s[2]*s[11] + s[4]*s[3]*s[10] + s[8]*s[2]*s[7] - s[8]*s[3]*s[6];
    d[11] = -s[0]*s[5]*s[11] + s[0]*s[7]*s[9] + s[4]*s[1]*s[11] - s[4]*s[3]*s[9] - s[8]*s[1]*s[7] + s[8]*s[3]*s[5];
    d[15] = s[0]*s[5]*s[10] - s[0]*s[6]*s[9] - s[4]*s[1]*s[10] + s[4]*s[2]*s[9] + s[8]*s[1]*s[6] - s[8]*s[2]*s[5];

    let det = s[0]*d[0] + s[1]*d[4] + s[2]*d[8] + s[3]*d[12];
    if (Math.abs(det) < 1e-10) { // Use a small epsilon for floating point comparison
        console.error("Determinant is zero or too small, can't invert matrix. Setting to identity.");
        this.setIdentity();
        return this;
    }

    det = 1.0 / det;
    for (let i = 0; i < 16; i++) {
        t[i] = d[i] * det;
    }
    return this;
  }
}

window.Vector3 = Vector3;
window.Matrix4 = Matrix4;