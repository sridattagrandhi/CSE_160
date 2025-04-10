// Vertex shader
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global
let canvas, gl;
let a_Position, u_FragColor, u_Size;
let rotationAngle = 0;
let animationActive = false;
let animationFrame = null;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get WebGL context.');
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
}

const POINT = 0, TRIANGLE = 1, CIRCLE = 2;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_size = 5, g_selectedType = POINT, g_segments = 10;
let g_shapesList = [];

function addActionsForHtmlUI() {
  document.getElementById('green').onclick = () => g_selectedColor = [0.0, 1.0, 0.0, 1.0];
  document.getElementById('red').onclick = () => g_selectedColor = [1.0, 0.0, 0.0, 1.0];
  document.getElementById('clearButton').onclick = () => {
    stopAnimation();
    g_shapesList = [];
    renderAllShapes();
  };

  document.getElementById('pointButton').onclick = () => g_selectedType = POINT;
  document.getElementById('triButton').onclick = () => g_selectedType = TRIANGLE;
  document.getElementById('circleButton').onclick = () => g_selectedType = CIRCLE;

  document.getElementById('redSlide').addEventListener('mouseup', e => g_selectedColor[0] = e.target.value / 100);
  document.getElementById('greenSlide').addEventListener('mouseup', e => g_selectedColor[1] = e.target.value / 100);
  document.getElementById('blueSlide').addEventListener('mouseup', e => g_selectedColor[2] = e.target.value / 100);

  document.getElementById('sizeSlide').addEventListener('mouseup', e => g_size = e.target.value);
  document.getElementById('segmentSlide').addEventListener('mouseup', e => g_segments = e.target.value);

  document.getElementById('drawSceneButton').onclick = () => {
    startAnimation();
  };
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  canvas.onmousedown = click;
  canvas.onmousemove = ev => { if (ev.buttons === 1) click(ev); };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  let shape = g_selectedType === POINT ? new Point() :
              g_selectedType === TRIANGLE ? new Triangle() : new Circle();

  shape.position = [x, y];
  shape.color = g_selectedColor.slice();
  shape.size = g_size;
  g_shapesList.push(shape);

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  let x = ev.clientX, y = ev.clientY;
  let rect = ev.target.getBoundingClientRect();
  return [
    ((x - rect.left) - canvas.width/2) / (canvas.width/2),
    (canvas.height/2 - (y - rect.top)) / (canvas.height/2)
  ];
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  let startTime = performance.now();

  g_shapesList.forEach(shape => shape.render());

  let duration = performance.now() - startTime;
  sendTextToHTML(`numdot: ${g_shapesList.length} ms: ${Math.floor(duration)} fps: ${Math.floor(10000/duration)/10}`, "numdot");
}

function sendTextToHTML(text, htmlID) {
  let elem = document.getElementById(htmlID);
  if (elem) elem.innerHTML = text;
}

function startAnimation() {
  if (!animationActive) {
    animationActive = true;
    animateScene();
  }
}

function stopAnimation() {
  animationActive = false;
  if (animationFrame) cancelAnimationFrame(animationFrame);
}

function animateScene() {
  if (!animationActive) return;
  rotationAngle += 0.02;
  drawMyScene();
  animationFrame = requestAnimationFrame(animateScene);
}

function drawMyScene() {
  g_shapesList = [];

  const red = [0.8, 0.0, 0.0, 1.0];
  const orange = [1.0, 0.5, 0.0, 1.0];
  const yellow = [1.0, 1.0, 0.0, 1.0];
  const blue = [0.2, 0.6, 1.0, 1.0];
  const white = [1.0, 1.0, 1.0, 1.0];
  const gray = [0.2, 0.2, 0.2, 1.0];
  const SCALE = 1.5;

  const stars = [
    [-0.8, 0.8], [-0.4, 0.85], [0.0, 0.9],
    [0.4, 0.85], [0.8, 0.8]
  ];
  for (let [x, y] of stars) createStar(x, y, 0.02, rotationAngle);

  // Rocket
  g_shapesList.push(createTriangle(scale([-0.05, -0.1, -0.05, 0.3, 0.05, 0.3], SCALE), white));
  g_shapesList.push(createTriangle(scale([-0.05, -0.1,  0.05, -0.1, 0.05, 0.3], SCALE), white));
  g_shapesList.push(createTriangle(scale([-0.05, 0.3,  0.05, 0.3, 0.0, 0.45], SCALE), red));

  let circle = new Circle();
  circle.color = blue;
  circle.size = 12;
  circle.segments = 12;
  circle.position = [0.0, 0.12];
  g_shapesList.push(circle);

  g_shapesList.push(createTriangle(scale([-0.05, 0.05, -0.20, -0.1, -0.05, -0.1], SCALE), red));
  g_shapesList.push(createTriangle(scale([-0.05, 0.05, -0.20, -0.1, -0.15, 0.05], SCALE), red));
  g_shapesList.push(createTriangle(scale([0.05, 0.05,  0.20, -0.1, 0.05, -0.1], SCALE), red));
  g_shapesList.push(createTriangle(scale([0.05, 0.05,  0.20, -0.1, 0.15, 0.05], SCALE), red));
  g_shapesList.push(createTriangle(scale([-0.01, -0.1,  0.01, -0.1, -0.01, -0.25], SCALE), gray));
  g_shapesList.push(createTriangle(scale([0.01, -0.1,  0.01, -0.25, -0.01, -0.25], SCALE), gray));
  g_shapesList.push(createTriangle(scale([0.0, -0.25, -0.03, -0.35, 0.03, -0.35], SCALE), red));
  g_shapesList.push(createTriangle(scale([-0.08, -0.35, 0.08, -0.35, -0.05, -0.45], SCALE), orange));
  g_shapesList.push(createTriangle(scale([0.08, -0.35, 0.05, -0.45, -0.05, -0.45], SCALE), orange));
  g_shapesList.push(createTriangle(scale([-0.02, -0.45, 0.02, -0.45, 0.0, -0.55], SCALE), yellow));
  g_shapesList.push(createTriangle(scale([-0.02, -0.45, 0.0, -0.40, 0.02, -0.45], SCALE), yellow));

  renderAllShapes();
}

function rotatePoint(x, y, cx, cy, angle) {
  const cosA = Math.cos(angle), sinA = Math.sin(angle);
  const dx = x - cx, dy = y - cy;
  return [cx + dx * cosA - dy * sinA, cy + dx * sinA + dy * cosA];
}

function createStar(cx, cy, size, angle) {
  const yellow = [1.0, 1.0, 0.0, 1.0], s = size;
  const points = [
    [-s, -s], [s, -s], [s, s], [-s, s],
    [0, s * 2.5], [0, -s * 2.5],
    [-s * 2.5, 0], [s * 2.5, 0],
  ];
  const rotated = points.map(p => rotatePoint(p[0], p[1], 0, 0, angle));
  const toWorld = ([x, y]) => [x + cx, y + cy];
  const r = rotated.map(toWorld);

  g_shapesList.push(createTriangle([r[0][0], r[0][1], r[1][0], r[1][1], r[2][0], r[2][1]], yellow));
  g_shapesList.push(createTriangle([r[0][0], r[0][1], r[2][0], r[2][1], r[3][0], r[3][1]], yellow));
  g_shapesList.push(createTriangle([r[3][0], r[3][1], r[2][0], r[2][1], r[4][0], r[4][1]], yellow));
  g_shapesList.push(createTriangle([r[0][0], r[0][1], r[1][0], r[1][1], r[5][0], r[5][1]], yellow));
  g_shapesList.push(createTriangle([r[0][0], r[0][1], r[3][0], r[3][1], r[6][0], r[6][1]], yellow));
  g_shapesList.push(createTriangle([r[1][0], r[1][1], r[2][0], r[2][1], r[7][0], r[7][1]], yellow));
}

function scale(coords, factor) {
  return coords.map(coord => coord * factor);
}

function createTriangle(verts, color) {
  const t = new Triangle();
  t.position = [0, 0];
  t.color = color;
  t.render = () => {
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    drawTriangle(verts);
  };
  return t;
}
