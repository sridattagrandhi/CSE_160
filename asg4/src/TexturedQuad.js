// TexturedQuad.js — Permanent Daytime

// ————————————————— shaders —————————————————
// ... (VSHADER_SOURCE and FSHADER_SOURCE remain unchanged from the previous version) ...
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_TexCoord;
  attribute vec3 a_Normal; // Normal for lighting

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix; // For transforming normals: transpose(inverse(modelMatrix))

  varying vec3 v_Normal;
  varying vec3 v_FragPos; // Vertex position in world space
  varying vec2 v_TexCoord;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_FragPos = vec3(u_ModelMatrix * a_Position);
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0))); // Normals are directions
    v_TexCoord = a_TexCoord;
  }
`;

const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform sampler2D u_Sampler;
  uniform vec4 u_BaseColor;      // Base color for non-textured or fallback
  uniform float u_TexColorWeight; // How much texture contributes (0-1)
  
  // Lighting Control
  uniform bool u_LightingOn_All;      // Master lighting switch
  uniform bool u_NormalVisualizationOn; // For debugging normals
  uniform bool u_IsSkybox;            // To disable lighting for skybox

  // Material Properties
  uniform float u_Ka; // Ambient reflectivity
  uniform float u_Kd; // Diffuse reflectivity
  uniform float u_Ks; // Specular reflectivity
  uniform float u_Shininess; // Specular shininess factor

  // Point Light Properties
  uniform bool u_PointLightOn;
  uniform vec3 u_PointLightPos;   // In world space
  uniform vec3 u_PointLightColor;

  // Spot Light Properties
  uniform bool u_SpotLightOn;
  uniform vec3 u_SpotLightPos;    // In world space
  uniform vec3 u_SpotLightDir;    // Direction spotlight is pointing (world space)
  uniform vec3 u_SpotLightColor;
  uniform float u_SpotLightCutoff;     // Cosine of half inner cone angle
  uniform float u_SpotLightOuterCutoff; // Cosine of half outer cone angle

  uniform vec3 u_CameraPos; // Camera position in world space

  varying vec3 v_Normal;
  varying vec3 v_FragPos;
  varying vec2 v_TexCoord;

  // Function to calculate light contribution
  vec3 calculateLight(vec3 lightPos, vec3 lightColor, vec3 normal, vec3 fragPos, vec3 viewDir, vec4 baseAlbedo) {
    vec3 lightContribution = vec3(0.0);
    vec3 lightDir = normalize(lightPos - fragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = u_Kd * diff * baseAlbedo.rgb * lightColor;
    lightContribution += diffuse;

    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_Shininess);
    vec3 specular = u_Ks * spec * lightColor;
    lightContribution += specular;
    
    return lightContribution;
  }
  
  vec3 calculateSpotLight(vec3 spotPos, vec3 spotDir, vec3 spotColor, float cutoff, float outerCutoff, vec3 normal, vec3 fragPos, vec3 viewDir, vec4 baseAlbedo) {
    vec3 spotContribution = vec3(0.0);
    vec3 lightDir = normalize(spotPos - fragPos);
    float theta = dot(lightDir, normalize(-spotDir));
    
    if (theta > outerCutoff) {
        float epsilon = cutoff - outerCutoff;
        if (epsilon <= 0.0) epsilon = 0.001;
        float intensity = clamp((theta - outerCutoff) / epsilon, 0.0, 1.0);
        
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = u_Kd * diff * baseAlbedo.rgb * spotColor * intensity;
        spotContribution += diffuse;

        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_Shininess);
        vec3 specular = u_Ks * spec * spotColor * intensity;
        spotContribution += specular;
    }
    return spotContribution;
  }

  void main() {
    vec4 baseAlbedo = mix(u_BaseColor, texture2D(u_Sampler, v_TexCoord), u_TexColorWeight);
    
    if (u_IsSkybox) {
      gl_FragColor = baseAlbedo;
      return;
    }

    if (u_NormalVisualizationOn) {
      gl_FragColor = vec4(v_Normal * 0.5 + 0.5, 1.0);
      return;
    }

    if (!u_LightingOn_All) {
      gl_FragColor = baseAlbedo;
      return;
    }

    vec3 norm = normalize(v_Normal);
    vec3 viewDir = normalize(u_CameraPos - v_FragPos);

    vec3 globalAmbientColor = vec3(0.35, 0.35, 0.35); 
    vec3 ambient = u_Ka * baseAlbedo.rgb * globalAmbientColor; 

    vec3 totalLight = ambient;

    if (u_PointLightOn) {
      totalLight += calculateLight(u_PointLightPos, u_PointLightColor, norm, v_FragPos, viewDir, baseAlbedo);
    }
    
    if (u_SpotLightOn) {
        totalLight += calculateSpotLight(u_SpotLightPos, u_SpotLightDir, u_SpotLightColor, u_SpotLightCutoff, u_SpotLightOuterCutoff, norm, v_FragPos, viewDir, baseAlbedo);
    }

    gl_FragColor = vec4(totalLight, baseAlbedo.a);
  }
`;


// ————————————————— globals —————————————————
let canvas, gl, camera;
let grassTexture, skyTexture, dirtTexture, stoneTexture, genericSphereTexture;
let texturesLoaded = 0;

let animationFrameId = null;

// Shader Locations (attributes and uniforms) - same as before
let a_Position_loc, a_TexCoord_loc, a_Normal_loc;
let u_ModelMatrixLoc, u_ViewMatrixLoc, u_ProjectionMatrixLoc, u_NormalMatrixLoc;
let u_SamplerLoc, u_BaseColorLoc, u_TexColorWeightLoc;
let u_LightingOn_All_Loc, u_NormalVisualizationOn_Loc, u_IsSkybox_Loc;
let u_Ka_Loc, u_Kd_Loc, u_Ks_Loc, u_Shininess_Loc;
let u_PointLightOn_Loc, u_PointLightPosLoc, u_PointLightColorLoc;
let u_SpotLightOn_Loc, u_SpotLightPosLoc, u_SpotLightDirLoc, u_SpotLightColorLoc;
let u_SpotLightCutoffLoc, u_SpotLightOuterCutoffLoc;
let u_CameraPosLoc;

// Lighting state - same as before
let g_lightingOn_All = true;
let g_normalVisualizationOn = false;
let g_isSkybox = false;

const g_material = { ka: 0.3, kd: 0.7, ks: 0.9, shininess: 50.0 };

let g_pointLightOn = true;
let g_pointLightPosition = new Vector3([0, 3, 0]);
let g_pointLightColor = [1.0, 1.0, 1.0];
let g_pointLightAngle = 0;

let g_spotLightOn = true;
let g_spotLightPosition = new Vector3();
let g_spotLightDirection = new Vector3();
let g_spotLightColor = [0.8, 0.8, 0.5];
let g_spotLightCutoff = Math.cos(12.5 * Math.PI / 180.0);
let g_spotLightOuterCutoff = Math.cos(17.5 * Math.PI / 180.0);

// REMOVED Day/Night cycle globals
// let timeOfDay = 0; // REMOVED
// const dayLength = 60; // REMOVED
const dayColor   = [0.5, 0.8, 1.0];  // RGB for day sky - RETAINED for fixed day color
// const nightColor = [0.01,0.01,0.02]; // REMOVED

let lastFrameTimestamp = 0;

// Input and other globals - same as before
let lastMouseX = null, lastMouseY = null;
let mouseDown = false;
const keyStates = { w: false, a: false, s: false, d: false, q: false, e: false };

const G_BLOCK_SIZE = 1.0;
window.g_worldBlocks = [];
const REACH_DISTANCE = 2.5;
window.g_currentBlockTypeToAdd = 'dirt';

let fpsDisplayElement;
let frameCount = 0;
let lastFPSTime = 0;

// Collision functions - same as before
window.getBlockAABB = function(block) { /* ... (copy from previous version) ... */ };
window.checkPointAABBCollision = function(point, aabb) { /* ... (copy from previous version) ... */ };
window.checkAABBAABBCollision = function(aabb1, aabb2) { /* ... (copy from previous version) ... */ };
// (For brevity, ensure these are copied from the working version you have)
window.getBlockAABB = function(block) {
    const halfSize = G_BLOCK_SIZE / 2;
    return {
        minX: block.x - halfSize, maxX: block.x + halfSize,
        minY: block.y - halfSize, maxY: block.y + halfSize,
        minZ: block.z - halfSize, maxZ: block.z + halfSize,
    };
};
window.checkPointAABBCollision = function(point, aabb) {
    return (
        point.x >= aabb.minX && point.x <= aabb.maxX &&
        point.y >= aabb.minY && point.y <= aabb.maxY &&
        point.z >= aabb.minZ && point.z <= aabb.maxZ
    );
};
window.checkAABBAABBCollision = function(aabb1, aabb2) {
    const overlapX = aabb1.minX <= aabb2.maxX && aabb1.maxX >= aabb2.minX;
    const overlapY = aabb1.minY <= aabb2.maxY && aabb1.maxY >= aabb2.minY;
    const overlapZ = aabb1.minZ <= aabb2.maxZ && aabb1.maxZ >= aabb2.minZ;
    return overlapX && overlapY && overlapZ;
};


// Scene definition - same as before (simple walls and ground)
function defineSimpleScene() { /* ... (copy from previous version) ... */ }
// (For brevity, ensure this is copied from the working version you have)
function defineSimpleScene() {
    window.g_worldBlocks = [];
    const blockSize = G_BLOCK_SIZE;

    const wallLength = 5;
    const sideWallLength = 4;
    const wallHeight = 3;

    const wallMaterial = 'dirt';
    const groundMaterial = 'grass';

    const groundDimX = 7;
    const groundDimZ = 7;
    for (let gx = -Math.floor(groundDimX / 2); gx <= Math.floor(groundDimX / 2); gx++) {
        for (let gz = -Math.floor(groundDimZ / 2); gz <= Math.floor(groundDimZ / 2); gz++) {
            window.g_worldBlocks.push({
                x: gx * blockSize,
                y: -blockSize / 2,
                z: gz * blockSize,
                type: groundMaterial
            });
        }
    }

    const backWallZ = -(Math.floor(groundDimZ / 2) +1) * blockSize;
    for (let i = -Math.floor(wallLength / 2); i <= Math.floor(wallLength / 2); i++) {
        for (let j = 0; j < wallHeight; j++) {
            window.g_worldBlocks.push({
                x: i * blockSize,
                y: (j * blockSize) + (blockSize / 2),
                z: backWallZ,
                type: wallMaterial
            });
        }
    }

    const sideWallX = (Math.floor(groundDimX / 2) + 1) * blockSize;
    for (let i = -Math.floor(sideWallLength / 2) ; i <= Math.floor(sideWallLength / 2); i++) {
        for (let j = 0; j < wallHeight; j++) {
            window.g_worldBlocks.push({
                x: sideWallX,
                y: (j * blockSize) + (blockSize / 2),
                z: i * blockSize,
                type: wallMaterial
            });
        }
    }
    console.log(`Generated ${window.g_worldBlocks.length} blocks for simple scene.`);
}


// ————————————————— main entry —————————————————
function main() {
    canvas = document.getElementById('webgl');
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    fpsDisplayElement = document.getElementById('fpsDisplay');

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.error('Failed to initialize shaders. See console for GLSL errors.');
        return;
    }

    // Get all attribute and uniform locations (same as before)
    window.a_Position_loc = gl.getAttribLocation(gl.program, 'a_Position');
    window.a_TexCoord_loc = gl.getAttribLocation(gl.program, 'a_TexCoord');
    window.a_Normal_loc = gl.getAttribLocation(gl.program, 'a_Normal');
    u_ModelMatrixLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_ViewMatrixLoc = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjectionMatrixLoc = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_NormalMatrixLoc = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_SamplerLoc = gl.getUniformLocation(gl.program, 'u_Sampler');
    u_BaseColorLoc = gl.getUniformLocation(gl.program, 'u_BaseColor');
    u_TexColorWeightLoc = gl.getUniformLocation(gl.program, 'u_TexColorWeight');
    u_LightingOn_All_Loc = gl.getUniformLocation(gl.program, 'u_LightingOn_All');
    u_NormalVisualizationOn_Loc = gl.getUniformLocation(gl.program, 'u_NormalVisualizationOn');
    u_IsSkybox_Loc = gl.getUniformLocation(gl.program, 'u_IsSkybox');
    u_Ka_Loc = gl.getUniformLocation(gl.program, 'u_Ka');
    u_Kd_Loc = gl.getUniformLocation(gl.program, 'u_Kd');
    u_Ks_Loc = gl.getUniformLocation(gl.program, 'u_Ks');
    u_Shininess_Loc = gl.getUniformLocation(gl.program, 'u_Shininess');
    u_PointLightOn_Loc = gl.getUniformLocation(gl.program, 'u_PointLightOn');
    u_PointLightPosLoc = gl.getUniformLocation(gl.program, 'u_PointLightPos');
    u_PointLightColorLoc = gl.getUniformLocation(gl.program, 'u_PointLightColor');
    u_SpotLightOn_Loc = gl.getUniformLocation(gl.program, 'u_SpotLightOn');
    u_SpotLightPosLoc = gl.getUniformLocation(gl.program, 'u_SpotLightPos');
    u_SpotLightDirLoc = gl.getUniformLocation(gl.program, 'u_SpotLightDir');
    u_SpotLightColorLoc = gl.getUniformLocation(gl.program, 'u_SpotLightColor');
    u_SpotLightCutoffLoc = gl.getUniformLocation(gl.program, 'u_SpotLightCutoff');
    u_SpotLightOuterCutoffLoc = gl.getUniformLocation(gl.program, 'u_SpotLightOuterCutoff');
    u_CameraPosLoc = gl.getUniformLocation(gl.program, 'u_CameraPos');
    if (u_SamplerLoc) gl.uniform1i(u_SamplerLoc, 0);

    initCube(gl);
    initSphere(gl);
    defineSimpleScene();

    camera = new Camera(canvas);
    camera.eye = new Vector3([2 * G_BLOCK_SIZE, 1.5 * G_BLOCK_SIZE, 4 * G_BLOCK_SIZE]);
    camera.at  = new Vector3([0, 0.5 * G_BLOCK_SIZE, 0]);
    camera.updateViewMatrix();

    if (u_ProjectionMatrixLoc) gl.uniformMatrix4fv(u_ProjectionMatrixLoc, false, camera.projectionMatrix.elements);
    
    // MODIFIED: Set clear color to fixed daytime color ONCE
    gl.clearColor(dayColor[0], dayColor[1], dayColor[2], 1.0);
    
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE); 
    gl.cullFace(gl.BACK);

    initTextures();
    setupUI();
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup',   handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown); 
    canvas.addEventListener('mouseup',   handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', () => { if(document.pointerLockElement !== canvas) canvas.requestPointerLock(); });

    lastFPSTime = performance.now();
    startAnimationLoop();
    console.log("WebGL Simple Scene Initialized (Permanent Daytime).");
}

// ————————————————— UI Setup —————————————————
// ... (setupUI function remains unchanged from the previous version) ...
function setupUI() {
    document.getElementById('toggleLightingBtn').onclick = () => {
        g_lightingOn_All = !g_lightingOn_All;
        document.getElementById('toggleLightingBtn').innerText = `Toggle All Lighting (${g_lightingOn_All ? 'On' : 'Off'})`;
    };
    document.getElementById('toggleNormalVizBtn').onclick = () => {
        g_normalVisualizationOn = !g_normalVisualizationOn;
        document.getElementById('toggleNormalVizBtn').innerText = `Toggle Normal Viz (${g_normalVisualizationOn ? 'On' : 'Off'})`;
    };
    document.getElementById('togglePointLightBtn').onclick = () => {
        g_pointLightOn = !g_pointLightOn;
        document.getElementById('togglePointLightBtn').innerText = `Point Light (${g_pointLightOn ? 'On' : 'Off'})`;
    };
    document.getElementById('toggleSpotLightBtn').onclick = () => {
        g_spotLightOn = !g_spotLightOn;
        document.getElementById('toggleSpotLightBtn').innerText = `Spot Light (${g_spotLightOn ? 'On' : 'Off'})`;
    };

    const pLightX = document.getElementById('pointLightXSlider');
    const pLightY = document.getElementById('pointLightYSlider');
    const pLightZ = document.getElementById('pointLightZSlider');
    pLightX.oninput = () => g_pointLightPosition.elements[0] = parseFloat(pLightX.value);
    pLightY.oninput = () => g_pointLightPosition.elements[1] = parseFloat(pLightY.value);
    pLightZ.oninput = () => g_pointLightPosition.elements[2] = parseFloat(pLightZ.value);
    pLightX.value = g_pointLightPosition.elements[0];
    pLightY.value = g_pointLightPosition.elements[1];
    pLightZ.value = g_pointLightPosition.elements[2];

    const pLightR = document.getElementById('pointLightRSlider');
    const pLightG = document.getElementById('pointLightGSlider');
    const pLightB = document.getElementById('pointLightBSlider');
    pLightR.oninput = () => g_pointLightColor[0] = parseFloat(pLightR.value);
    pLightG.oninput = () => g_pointLightColor[1] = parseFloat(pLightG.value);
    pLightB.oninput = () => g_pointLightColor[2] = parseFloat(pLightB.value);
    pLightR.value = g_pointLightColor[0];
    pLightG.value = g_pointLightColor[1];
    pLightB.value = g_pointLightColor[2];
}


// ————————————————— Game loop & Updates —————————————————
function startAnimationLoop() {
  lastFrameTimestamp = performance.now();
  function animate(now) {
    const delta = (now - lastFrameTimestamp) / 1000;
    lastFrameTimestamp = now;
    
    frameCount++;
    const deltaFPSTime = now - lastFPSTime;
    if (deltaFPSTime >= 1000) {
        const fps = (frameCount * 1000.0) / deltaFPSTime;
        if (fpsDisplayElement) fpsDisplayElement.textContent = `FPS: ${fps.toFixed(1)}`;
        frameCount = 0;
        lastFPSTime = now;
    }
    
    // REMOVED Day/Night update for gl.clearColor() from here
    // It's now set once in main()

    processInput();
    updateScene(delta);
    redraw();
    animationFrameId = requestAnimationFrame(animate);
  }
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(animate);
}

// updateScene, processInput, input handlers remain the same as previous version
function updateScene(delta) { /* ... (copy from previous version) ... */ }
function processInput() { /* ... (copy from previous version) ... */ }
function handleKeyDown(e) { /* ... (copy from previous version) ... */ }
function handleKeyUp(e) { /* ... (copy from previous version) ... */ }
function handleMouseDown(e) { /* ... (copy from previous version) ... */ }
function handleMouseUp(e) { /* ... (copy from previous version) ... */ }
function handleMouseMove(e) { /* ... (copy from previous version - ensure it's the YAW_ONLY one) ... */ }
// (For brevity, ensure these are copied from the working version you have,
// especially the YAW_ONLY handleMouseMove)
function updateScene(delta) {
    g_pointLightAngle += 45.0 * delta;
    if (!document.getElementById('pointLightXSlider').matches(':active') && 
        !document.getElementById('pointLightZSlider').matches(':active')) {
      const radius = 8;
      g_pointLightPosition.elements[0] = Math.sin(g_pointLightAngle * Math.PI / 180.0) * radius;
      g_pointLightPosition.elements[2] = Math.cos(g_pointLightAngle * Math.PI / 180.0) * radius -5;
      document.getElementById('pointLightXSlider').value = g_pointLightPosition.elements[0];
      document.getElementById('pointLightZSlider').value = g_pointLightPosition.elements[2];
    }

    g_spotLightPosition.set(camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
    let forwardDir = new Vector3([
        camera.at.elements[0] - camera.eye.elements[0],
        camera.at.elements[1] - camera.eye.elements[1],
        camera.at.elements[2] - camera.eye.elements[2]
    ]);
    forwardDir.normalize();
    g_spotLightDirection.set(forwardDir.elements[0], forwardDir.elements[1], forwardDir.elements[2]);
}
function processInput() {
  const moveSpeed   = 0.15; const rotateSpeed = 1.5; 
  try {
    if (keyStates.w) camera.moveForward(moveSpeed); if (keyStates.s) camera.moveBackwards(moveSpeed);
    if (keyStates.a) camera.moveLeft(moveSpeed); if (keyStates.d) camera.moveRight(moveSpeed);
    if (keyStates.q) camera.panLeft(rotateSpeed); if (keyStates.e) camera.panRight(rotateSpeed);
  } catch (err) { console.error("Error processing movement:", err); }
}
function handleKeyDown(e) { 
  const k = e.key.toLowerCase(); if (k in keyStates) { keyStates[k] = true; }
  if (k === 'f') { handleAddBlock(); e.preventDefault(); } 
  else if (k === 'r') { handleDeleteBlock(); e.preventDefault(); }
  if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) { e.preventDefault(); }
}
function handleKeyUp(e) { const k = e.key.toLowerCase(); if (k in keyStates) { keyStates[k] = false; } }
function handleMouseDown(e) { mouseDown = true; lastMouseX = e.clientX; lastMouseY = e.clientY; }
function handleMouseUp(e) { mouseDown = false; }
function handleMouseMove(e) { // YAW_ONLY version
  let dx = 0;
  if ( document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas ) {
    dx = e.movementX || 0;
  } else if (mouseDown && lastMouseX !== null) { 
    dx = e.clientX - lastMouseX;
    lastMouseX = e.clientX;
  } else {
    if (mouseDown && (lastMouseX === null)) { 
        lastMouseX = e.clientX;
    }
    return; 
  }
  try {
    const yawSensitivity  = 0.10;
    if (Math.abs(dx) > 0.01) {
        camera.panRight(dx * yawSensitivity); 
    }
  } catch (err) { console.error("Error in mouse handling:", err); }
}


// ————————————————— Redraw & Drawing Functions —————————————————
// redraw function remains unchanged
function redraw() { /* ... (copy from previous version) ... */ }
// (For brevity, ensure this is copied from the working version you have)
function redraw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clears with color set in main()

  if (u_ViewMatrixLoc) gl.uniformMatrix4fv(u_ViewMatrixLoc, false, camera.viewMatrix.elements);
  if (u_CameraPosLoc) gl.uniform3fv(u_CameraPosLoc, camera.eye.elements);
  
  if (u_LightingOn_All_Loc) gl.uniform1i(u_LightingOn_All_Loc, g_lightingOn_All);
  if (u_NormalVisualizationOn_Loc) gl.uniform1i(u_NormalVisualizationOn_Loc, g_normalVisualizationOn);
  
  if (u_Ka_Loc) gl.uniform1f(u_Ka_Loc, g_material.ka);
  if (u_Kd_Loc) gl.uniform1f(u_Kd_Loc, g_material.kd);
  if (u_Ks_Loc) gl.uniform1f(u_Ks_Loc, g_material.ks);
  if (u_Shininess_Loc) gl.uniform1f(u_Shininess_Loc, g_material.shininess);

  if (u_PointLightOn_Loc) gl.uniform1i(u_PointLightOn_Loc, g_pointLightOn);
  if (u_PointLightPosLoc) gl.uniform3fv(u_PointLightPosLoc, g_pointLightPosition.elements);
  if (u_PointLightColorLoc) gl.uniform3fv(u_PointLightColorLoc, g_pointLightColor);

  if (u_SpotLightOn_Loc) gl.uniform1i(u_SpotLightOn_Loc, g_spotLightOn);
  if (u_SpotLightPosLoc) gl.uniform3fv(u_SpotLightPosLoc, g_spotLightPosition.elements);
  if (u_SpotLightDirLoc) gl.uniform3fv(u_SpotLightDirLoc, g_spotLightDirection.elements);
  if (u_SpotLightColorLoc) gl.uniform3fv(u_SpotLightColorLoc, g_spotLightColor);
  if (u_SpotLightCutoffLoc) gl.uniform1f(u_SpotLightCutoffLoc, g_spotLightCutoff);
  if (u_SpotLightOuterCutoffLoc) gl.uniform1f(u_SpotLightOuterCutoffLoc, g_spotLightOuterCutoff);
  
  drawWorld();
}


// initTextures, createSolidTexture, prepareObjectDraw remain the same
function initTextures() { /* ... (copy from previous version) ... */ }
function createSolidTexture(texture, color) { /* ... (copy from previous version) ... */ }
function prepareObjectDraw(modelMatrix, baseColor = [1,1,1,1], texture = null, texWeight = 1.0, isSky = false) { /* ... (copy from previous version) ... */ }
// (For brevity, ensure these are copied from the working version you have)
function initTextures() {
  grassTexture = gl.createTexture(); skyTexture = gl.createTexture();
  dirtTexture = gl.createTexture(); stoneTexture = gl.createTexture();
  genericSphereTexture = gl.createTexture();

  createSolidTexture(grassTexture, [0, 0.7, 0, 1]);
  createSolidTexture(skyTexture, dayColor.concat(1.0)); // Use fixed dayColor for sky texture fallback
  createSolidTexture(dirtTexture, [0.6, 0.4, 0.2, 1]);
  createSolidTexture(stoneTexture, [0.5, 0.5, 0.5, 1]);
  createSolidTexture(genericSphereTexture, [0.8, 0.2, 0.2, 1]);

  console.log("Using fallback solid color textures initially.");

  function loadActualTexture(url, texture, name) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      function isPowerOf2(v) { return (v & (v - 1)) === 0; }
      if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      console.log(`Texture '${name}' loaded [${img.width}×${img.height}] from ${url}`);
      texturesLoaded++;
    };
    img.onerror = () => { console.warn(`Failed to load ${url}, using solid-color fallback for '${name}'`); };
    img.src = url;
  }
  loadActualTexture('../resources/dirt.jpg', dirtTexture, 'dirt');
  loadActualTexture('../resources/stone.png', stoneTexture, 'stone');
  loadActualTexture('../resources/grass.jpg', grassTexture, 'grass');
}
function createSolidTexture(texture, color) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const R = Math.floor(color[0] * 255); const G = Math.floor(color[1] * 255);
  const B = Math.floor(color[2] * 255); const A = Math.floor(color[3] * 255);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([R, G, B, A]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}
function prepareObjectDraw(modelMatrix, baseColor = [1,1,1,1], texture = null, texWeight = 1.0, isSky = false) {
    if (u_ModelMatrixLoc) gl.uniformMatrix4fv(u_ModelMatrixLoc, false, modelMatrix.elements);
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    if (u_NormalMatrixLoc) gl.uniformMatrix4fv(u_NormalMatrixLoc, false, normalMatrix.elements);
    if (u_BaseColorLoc) gl.uniform4fv(u_BaseColorLoc, baseColor);
    if (u_TexColorWeightLoc) gl.uniform1f(u_TexColorWeightLoc, texWeight);
    if (u_IsSkybox_Loc) gl.uniform1i(u_IsSkybox_Loc, isSky);
    gl.activeTexture(gl.TEXTURE0);
    if (texture) { gl.bindTexture(gl.TEXTURE_2D, texture);
    } else { gl.bindTexture(gl.TEXTURE_2D, dirtTexture); }
}


// drawWorld, drawSkybox, drawWorldBlocks, drawAdditionalObjects, drawLightMarkers remain the same
function drawWorld() { /* ... (copy from previous version, ensure flat drawGround() is not called) ... */ }
function drawSkybox() { /* ... (MODIFIED to use fixed dayColor) ... */ }
function drawWorldBlocks() { /* ... (copy from previous version) ... */ }
function drawAdditionalObjects() { /* ... (copy from previous version) ... */ }
function drawLightMarkers() { /* ... (copy from previous version) ... */ }
// (For brevity, ensure these are copied from the working version you have)
function drawWorld() {
  drawSkybox();
  drawWorldBlocks();
  drawAdditionalObjects(); 
  drawLightMarkers();
}
function drawSkybox() {
  // REMOVED t_sky calculation based on timeOfDay
  // Use fixed dayColor for skybox base
  const br = dayColor[0];
  const bg = dayColor[1];
  const bb = dayColor[2];

  gl.depthMask(false); 
  const modelMatrix = new Matrix4()
               .translate(camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2])
               .scale(200,200,200); 
  prepareObjectDraw(modelMatrix, [br,bg,bb,1.0], skyTexture, 0.5, true); // Use skyTexture or its fallback
  drawCube(gl);
  gl.depthMask(true);
}
function drawWorldBlocks() {
  const camX = camera.eye.elements[0]; const camZ = camera.eye.elements[2];
  const CULL_DISTANCE_XZ = 25.0;
  for (const block of window.g_worldBlocks) {
    const dx = block.x - camX; const dz = block.z - camZ;
    if (Math.abs(dx) > CULL_DISTANCE_XZ || Math.abs(dz) > CULL_DISTANCE_XZ) continue;
    const modelMatrix = new Matrix4().translate(block.x, block.y, block.z).scale(G_BLOCK_SIZE, G_BLOCK_SIZE, G_BLOCK_SIZE);
    let blockTexture = dirtTexture;
    let blockBaseColor = [0.6, 0.4, 0.2, 1.0]; 
    if (block.type === 'stone') {
        blockTexture = stoneTexture;
        blockBaseColor = [0.5, 0.5, 0.5, 1.0];
    } else if (block.type === 'grass') {
        blockTexture = grassTexture;
        blockBaseColor = [0.2, 0.6, 0.1, 1.0];
    }
    prepareObjectDraw(modelMatrix, blockBaseColor, blockTexture, 1.0);
    drawCube(gl);
  }
}
function drawAdditionalObjects() {
    let sphereModelMatrix = new Matrix4()
        .translate(0, 1.0 * G_BLOCK_SIZE, -2 * G_BLOCK_SIZE)
        .scale(0.8, 0.8, 0.8); 
    prepareObjectDraw(sphereModelMatrix, [1.0, 0.3, 0.3, 1.0], genericSphereTexture, 0.4); 
    drawSphere(gl);
    let sphereModelMatrix2 = new Matrix4()
        .translate(2 * G_BLOCK_SIZE, 0.75 * G_BLOCK_SIZE, 0) 
        .scale(0.6, 0.6, 0.6);
    prepareObjectDraw(sphereModelMatrix2, [0.3, 0.3, 1.0, 1.0], genericSphereTexture, 0.4);
    drawSphere(gl);
}
function drawLightMarkers() {
    if (g_pointLightOn) {
        let lightMarkerMatrix = new Matrix4()
            .translate(g_pointLightPosition.elements[0], g_pointLightPosition.elements[1], g_pointLightPosition.elements[2])
            .scale(0.25, 0.25, 0.25);
        const oldLightingState = g_lightingOn_All;
        if(u_LightingOn_All_Loc) gl.uniform1i(u_LightingOn_All_Loc, false);
        prepareObjectDraw(lightMarkerMatrix, g_pointLightColor.concat(1.0), null, 0.0, true); 
        drawCube(gl);
        if(u_LightingOn_All_Loc) gl.uniform1i(u_LightingOn_All_Loc, oldLightingState);
    }
}


// Add/Delete Block Logic - same as previous version
function getLookAtWorldPoint() { /* ... (copy from previous version) ... */ }
function handleAddBlock() { /* ... (copy from previous version) ... */ }
function handleDeleteBlock() { /* ... (copy from previous version) ... */ }
// (For brevity, ensure these are copied from the working version you have)
function getLookAtWorldPoint() {
    let forward = new Vector3([ camera.at.elements[0] - camera.eye.elements[0], camera.at.elements[1] - camera.eye.elements[1], camera.at.elements[2] - camera.eye.elements[2]]);
    forward.normalize();
    return { x: camera.eye.elements[0] + forward.elements[0] * REACH_DISTANCE, y: camera.eye.elements[1] + forward.elements[1] * REACH_DISTANCE, z: camera.eye.elements[2] + forward.elements[2] * REACH_DISTANCE, forward: forward };
}
function handleAddBlock() {
    const targetInfo = getLookAtWorldPoint(); const forward = targetInfo.forward;
    const placeX = camera.eye.elements[0] + forward.elements[0] * (REACH_DISTANCE - G_BLOCK_SIZE * 0.51); const placeY = camera.eye.elements[1] + forward.elements[1] * (REACH_DISTANCE - G_BLOCK_SIZE * 0.51); const placeZ = camera.eye.elements[2] + forward.elements[2] * (REACH_DISTANCE - G_BLOCK_SIZE * 0.51);
    const snappedPlaceX = Math.round(placeX / G_BLOCK_SIZE) * G_BLOCK_SIZE; const snappedPlaceY = Math.floor(placeY / G_BLOCK_SIZE) * G_BLOCK_SIZE + G_BLOCK_SIZE / 2; const snappedPlaceZ = Math.round(placeZ / G_BLOCK_SIZE) * G_BLOCK_SIZE;  
    const newBlock = { x: snappedPlaceX, y: snappedPlaceY, z: snappedPlaceZ, type: window.g_currentBlockTypeToAdd };
    const existingBlock = window.g_worldBlocks.find( b => Math.abs(b.x - newBlock.x) < 0.1 && Math.abs(b.y - newBlock.y) < 0.1 && Math.abs(b.z - newBlock.z) < 0.1 );
    if (!existingBlock) {
        const playerEyeY = camera.eye.elements[1];
        const playerMinY = playerEyeY - (camera.bodyHeight || 1.7);
        const playerMaxY = playerEyeY;
        const newBlockAABB = window.getBlockAABB(newBlock);
        const playerIntersectsNewBlock = 
            Math.abs(camera.eye.elements[0] - newBlock.x) < (G_BLOCK_SIZE/2 + (camera.bodyRadius || 0.3)) &&
            Math.abs(camera.eye.elements[2] - newBlock.z) < (G_BLOCK_SIZE/2 + (camera.bodyRadius || 0.3)) &&
            playerMaxY > newBlockAABB.minY && playerMinY < newBlockAABB.maxY;
        if (!playerIntersectsNewBlock) { 
            window.g_worldBlocks.push(newBlock); 
            console.log(`Added ${newBlock.type} block at:`, newBlock.x, newBlock.y, newBlock.z);
        } else { console.log("Cannot place block: collision with player or too close."); }
    } else { console.log("Cannot place block: cell already occupied at", newBlock.x, newBlock.y, newBlock.z); }
}
function handleDeleteBlock() {
    const targetInfo = getLookAtWorldPoint(); let blockToDelete = null; let minDistanceSqToTargetPoint = Infinity;
    for (const block of window.g_worldBlocks) {
        const blockAABB = window.getBlockAABB(block);
        if (window.checkPointAABBCollision({x: targetInfo.x, y: targetInfo.y, z: targetInfo.z}, blockAABB)) {
            const distSq = (block.x - targetInfo.x)**2 + (block.y - targetInfo.y)**2 + (block.z - targetInfo.z)**2;
            if (distSq < minDistanceSqToTargetPoint) { minDistanceSqToTargetPoint = distSq; blockToDelete = block; }
        }
    }
    if (blockToDelete) { window.g_worldBlocks = window.g_worldBlocks.filter(b => b !== blockToDelete); console.log("Deleted block at:", blockToDelete.x, blockToDelete.y, blockToDelete.z);
    } else { console.log("No block targeted for deletion within reach."); }
}

window.main = main;