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
    if (len > 0) {
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
          m20=e[2], m21=e[6], m22=e[10], m23=e[14],
          m30=e[3], m31=e[7], m32=e[11], m33=e[15];

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

    // bottom row
    e[3]=m30; e[7]=m31; e[11]=m32; e[15]=m33;
    return this;
  }

  // multiply this matrix by another matrix
  multiply(other) {
    const a=this.elements, b=other.elements, tmp=new Float32Array(16);
    for (let i=0;i<4;++i) {
      for (let j=0;j<4;++j) {
        tmp[4*i+j] =
          a[4*i+0]*b[0*4+j] +
          a[4*i+1]*b[1*4+j] +
          a[4*i+2]*b[2*4+j] +
          a[4*i+3]*b[3*4+j];
      }
    }
    this.elements.set(tmp);
    return this;
  }

  // multiply this matrix by a Vector3 (treating vec as [x,y,z,1])
  multiplyVector3(v) {
    const e=this.elements, x=v.elements[0], y=v.elements[1], z=v.elements[2];
    return new Vector3(
      e[0]*x + e[4]*y + e[8]*z  + e[12],
      e[1]*x + e[5]*y + e[9]*z  + e[13],
      e[2]*x + e[6]*y + e[10]*z + e[14]
    );
  }
}

window.Vector3 = Vector3;
window.Matrix4 = Matrix4;
