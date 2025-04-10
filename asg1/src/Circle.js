class Circle {
    constructor() {
      this.type = 'circle';
      this.position = [0.0, 0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.size = 5.0;
      this.segments = g_segments; // ← correctly store the current global value
    }
  
    render() {
      const xy = this.position;
      const rgba = this.color;
      const size = this.size;
      const d = size / 200.0;
      const angleStep = 360 / this.segments;
  
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniform1f(u_Size, size);
  
      for (let angle = 0; angle < 360; angle += angleStep) {
        const angle1 = angle;
        const angle2 = angle + angleStep;
  
        const vec1 = [
          Math.cos(angle1 * Math.PI / 180) * d,
          Math.sin(angle1 * Math.PI / 180) * d,
        ];
        const vec2 = [
          Math.cos(angle2 * Math.PI / 180) * d,
          Math.sin(angle2 * Math.PI / 180) * d,
        ];
  
        const pt1 = [xy[0] + vec1[0], xy[1] + vec1[1]];
        const pt2 = [xy[0] + vec2[0], xy[1] + vec2[1]];
  
        drawTriangle([xy[0], xy[1], pt1[0], pt1[1], pt2[0], pt2[1]]);
      }
    }
  }
  