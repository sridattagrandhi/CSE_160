// BlockyAnimal.js

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ModelMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_Color;
  void main() {
    gl_FragColor = u_Color;
  }
`;

// ── Globals ───────────────────────────────────────
let gl;
let u_GlobalRotateMatrix, u_ModelMatrix, u_Color;

let g_globalAngle = 0;
let g_mouseXAngle = 0, g_mouseYAngle = 0;
let g_tailAngle = 0;
let g_legAngle = 0;
let g_kneeAngle = 0;
let g_pawAngle = 0;

let g_bodyBounce = 0;
let g_headTilt = 0;
let g_pawBounce = 0;

let g_animationActive = false;
let g_time = 0;
let g_pokeActive = false;
let g_pokeStartTime = 0;
let g_lastFrameTime = performance.now();

// ── Setup ───────────────────────────────────────
function setupWebGL() {
  const canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if (!gl) throw 'WebGL not supported';
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.53, 0.81, 0.92, 1.0);
}

function initShadersAndLocations() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    throw 'Shader init failed';
  }
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_Color = gl.getUniformLocation(gl.program, 'u_Color');
}

function addUIActions() {
  document.getElementById('angleSlide').oninput = e => { g_globalAngle = +e.target.value; renderScene(); };
  document.getElementById('tailSlide').oninput = e => { g_tailAngle = +e.target.value; };
  document.getElementById('legSlider').oninput = e => { g_legAngle = +e.target.value; };
  document.getElementById('kneeSlider').oninput = e => { g_kneeAngle = +e.target.value; };
  document.getElementById('pawSlider').oninput = e => { g_pawAngle = +e.target.value; };

  document.getElementById('animOnBtn').onclick = () => { g_animationActive = true; };
  document.getElementById('animOffBtn').onclick = () => { g_animationActive = false; };

  const canvas = gl.canvas;
  let dragging = false, lastX = 0, lastY = 0;
  
  canvas.addEventListener('mousedown', e => {
    if (e.shiftKey) {
      g_pokeActive = true;            // Start poke
      g_pokeStartTime = g_time;        // (optional, if you still want pokeStartTime tracking)
    } else {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    }
  });

  canvas.addEventListener('mouseup', e => {
    dragging = false;
    g_pokeActive = false;              // Stop poke
  });

  canvas.addEventListener('mousemove', e => {
    if (!dragging) return;

    if (!e.shiftKey && g_pokeActive) { // If user lets go of Shift while moving
      g_pokeActive = false;
    }

    g_mouseXAngle += (e.clientX - lastX) * 0.5;
    g_mouseYAngle += (e.clientY - lastY) * 0.5;
    lastX = e.clientX;
    lastY = e.clientY;
    renderScene();
  });
}


// ── Animation ─────────────────────────────────────
function updateAnimationAngles() {
  if (!g_animationActive) return;

  const t = g_time;

  g_legAngle = 10 * Math.sin(t * 6);
  g_kneeAngle = 0;
  g_pawAngle = 10 * Math.sin(t * 6);
}

function updatePokeAnimation() {
  if (!g_pokeActive) return;
  
  let elapsed = g_time - g_pokeStartTime;

  if (elapsed < 5.0) {
    g_tailAngle = 50 * Math.sin(elapsed * 15);  // Tail wags bigger and faster
    g_bodyBounce = 0.05 * Math.sin(elapsed * 10); // Body slightly jumps
    g_headTilt = 10 * Math.sin(elapsed * 8);    // Head tilts left and right
    g_pawBounce = 0.05 * Math.sin(elapsed * 20);
  } else {
    g_pokeActive = false;
    g_tailAngle = 0;
    g_bodyBounce = 0;
    g_headTilt = 0;
    g_pawBounce = 0;
  }
}


// ── Rendering ─────────────────────────────────────
function renderScene() {
  const G = new Matrix4()
    .rotate(g_globalAngle + g_mouseXAngle, 0, 1, 0)
    .rotate(g_mouseYAngle, 1, 0, 0);

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, G.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  renderDog();
}

// ── Main ─────────────────────────────────────
function main() {
  setupWebGL();
  initShadersAndLocations();
  initCube(gl);
  initSphere(gl);
  addUIActions();

  function tick() {
    g_time = performance.now() * 0.001;
    updateAnimationAngles();
    updatePokeAnimation();
    renderScene();

    const now = performance.now();
    const fps = Math.round(1000 / (now - g_lastFrameTime));
    g_lastFrameTime = now;
    document.getElementById('numdot').innerText = `FPS: ${fps}`;

    requestAnimationFrame(tick);
  }
  tick();
}

window.onload = main;
