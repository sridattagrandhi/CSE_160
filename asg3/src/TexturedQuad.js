// TexturedQuad.js — Complete with Add/Delete Fix and All Features

// TexturedQuad.js — Elaborate 32x32 Maze, Mouse Look, FPS, Add/Delete

// ————————————————— shaders —————————————————
const VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_ModelMatrix;
varying vec2 v_TexCoord;
void main() {
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
  v_TexCoord = a_TexCoord;
}
`;

const FSHADER_SOURCE = `
#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D u_Sampler;
uniform float u_texColorWeight;
uniform vec4 u_BaseColor;
varying vec2 v_TexCoord;
void main() {
  vec4 texColor = texture2D(u_Sampler, v_TexCoord);
  gl_FragColor = mix(u_BaseColor, texColor, u_texColorWeight);
}
`;

// ————————————————— globals —————————————————
let canvas, gl, camera;
let grassTexture, skyTexture, dirtTexture, stoneTexture;
let texturesLoaded = 0;
let texturesError = false;
let animationFrameId = null;

let u_ViewMatrixLoc, u_ProjectionMatrixLoc, u_ModelMatrixLoc;
let u_SamplerLoc, u_texColorWeightLoc, u_BaseColorLoc;

// Day/Night cycle globals
let timeOfDay = 0;
const dayLength = 60;  // one full cycle in seconds
const dayColor   = [0.5, 0.8, 1.0];  // RGB for day sky
const nightColor = [0.01,0.01,0.02];  // RGB for night sky
let lastFrameTimestamp = 0;

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

// Collision Helper Functions
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

// --- Maze Generation ---
const MAZE_DIM_CELLS = 12; // Results in a 31x31 block area for the maze structure
window.g_mazeStartXWorld = 0; // Will be updated by maze generator
window.g_mazeStartZWorld = 0; // Will be updated by maze generator
window.g_mazeStartLookZ = -1; // Default look direction

function defineMazeAndWorldBlocks() {
    const worldBlocksData = [];
    const wallHeight = 2;
    // Grid: 1 for wall, 0 for path. Initialize all to walls.
    const mazeGrid = Array(MAZE_DIM_CELLS).fill(null).map(() => Array(MAZE_DIM_CELLS).fill(1));

    const addWallColumn = (x, z, type) => {
        for (let h = 0; h < wallHeight; h++) {
            worldBlocksData.push({
                x: x,
                y: (h * G_BLOCK_SIZE) + (G_BLOCK_SIZE / 2),
                z: z,
                type: type
            });
        }
    };

    const stack = [];
    const startGridX = 1; // Start carving from an odd coordinate cell
    const startGridZ = 1;
    
    mazeGrid[startGridZ][startGridX] = 0; // Mark start as path
    stack.push({ x: startGridX, z: startGridZ });

    // Safety break for the while loop, just in case
    const carveAttemptsSafety = MAZE_DIM_CELLS * MAZE_DIM_CELLS * 5; 
    let attempts = 0;

    while (stack.length > 0 && attempts < carveAttemptsSafety) {
        attempts++;
        let current = stack[stack.length - 1];
        let neighbors = [];

        // Directions: [dx, dz, wall_dx, wall_dz] (wall is between current and neighbor)
        const directions = [
            { x: 0,  z: -2, wx: 0,  wz: -1 }, // North
            { x: 2,  z: 0,  wx: 1,  wz: 0  }, // East
            { x: 0,  z: 2,  wx: 0,  wz: 1  }, // South
            { x: -2, z: 0,  wx: -1, wz: 0  }  // West
        ];
        // Shuffle directions
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        for (const dir of directions) {
            const nextX = current.x + dir.x;
            const nextZ = current.z + dir.z;
            const wallX = current.x + dir.wx;
            const wallZ = current.z + dir.wz;

            if (nextX >= 0 && nextX < MAZE_DIM_CELLS && nextZ >= 0 && nextZ < MAZE_DIM_CELLS && mazeGrid[nextZ][nextX] === 1) {
                neighbors.push({ x: nextX, z: nextZ, wallX: wallX, wallZ: wallZ });
            }
        }
        
        if (neighbors.length > 0) {
            const chosenNeighbor = neighbors[0]; // Could pick random, but first shuffled is fine
            mazeGrid[chosenNeighbor.wallZ][chosenNeighbor.wallX] = 0; // Carve wall
            mazeGrid[chosenNeighbor.z][chosenNeighbor.x] = 0;       // Carve next cell
            stack.push({ x: chosenNeighbor.x, z: chosenNeighbor.z });
        } else {
            stack.pop(); // Backtrack
        }
    }
     if (attempts >= carveAttemptsSafety) console.warn("Maze generation safety break triggered.");


    // Convert mazeGrid to worldBlocks
    const mazeWorldOffsetX = -Math.floor(MAZE_DIM_CELLS / 2) * G_BLOCK_SIZE;
    const mazeWorldOffsetZ = -Math.floor(MAZE_DIM_CELLS / 2) * G_BLOCK_SIZE;

    for (let r = 0; r < MAZE_DIM_CELLS; r++) {
        for (let c = 0; c < MAZE_DIM_CELLS; c++) {
            if (mazeGrid[r][c] === 1) { // If it's a wall cell
                const worldX = (c * G_BLOCK_SIZE) + mazeWorldOffsetX;
                const worldZ = (r * G_BLOCK_SIZE) + mazeWorldOffsetZ;
                const blockType = Math.random() < 0.7 ? 'dirt' : 'stone'; // 70% dirt, 30% stone
                addWallColumn(worldX, worldZ, blockType);
            }
        }
    }
    
    window.g_mazeStartXWorld = (startGridX * G_BLOCK_SIZE) + mazeWorldOffsetX;
    window.g_mazeStartZWorld = (startGridZ * G_BLOCK_SIZE) + mazeWorldOffsetZ;
    // Determine a valid look-at direction from the start
    if (startGridZ + 1 < MAZE_DIM_CELLS && mazeGrid[startGridZ + 1][startGridX] === 0 && mazeGrid[startGridZ + 2][startGridX] === 0) {
        window.g_mazeStartLookZ = window.g_mazeStartZWorld + G_BLOCK_SIZE; // Look South in grid
    } else if (startGridX + 1 < MAZE_DIM_CELLS && mazeGrid[startGridZ][startGridX + 1] === 0 && mazeGrid[startGridZ][startGridX + 2] === 0) {
        window.g_mazeStartLookX = window.g_mazeStartXWorld + G_BLOCK_SIZE; // Look East
        window.g_mazeStartLookZ = window.g_mazeStartZWorld;
    } // Add more conditions for other start directions if needed, or default

    window.g_worldBlocks = worldBlocksData;
    console.log(`Generated ${window.g_worldBlocks.length} blocks for a ${MAZE_DIM_CELLS}x${MAZE_DIM_CELLS} maze.`);
}

// ————————————————— main entry —————————————————
function main() {
    canvas = document.getElementById('webgl');
    if (!canvas) { console.error('Canvas element not found'); return; }
    gl = getWebGLContext(canvas);
    if (!gl) { console.error('WebGL not supported'); return; }
    
    fpsDisplayElement = document.getElementById('fpsDisplay');

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) { console.error('Failed to initialize shaders.'); return; }

    u_ViewMatrixLoc = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjectionMatrixLoc = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_ModelMatrixLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_SamplerLoc = gl.getUniformLocation(gl.program, 'u_Sampler');
    u_texColorWeightLoc = gl.getUniformLocation(gl.program, 'u_texColorWeight');
    u_BaseColorLoc = gl.getUniformLocation(gl.program, 'u_BaseColor');
    if (u_SamplerLoc) gl.uniform1i(u_SamplerLoc, 0);

    initCube(gl); 
    defineMazeAndWorldBlocks(); 

    camera = new Camera(canvas); 
    // Start camera inside the maze
    camera.eye = new Vector3([window.g_mazeStartXWorld, 1.7, window.g_mazeStartZWorld]); 
    camera.at  = new Vector3([window.g_mazeStartLookX || window.g_mazeStartXWorld, 1.7, window.g_mazeStartLookZ || (window.g_mazeStartZWorld -1)]); 
    camera.updateViewMatrix();

    if (u_ProjectionMatrixLoc) gl.uniformMatrix4fv(u_ProjectionMatrixLoc, false, camera.projectionMatrix.elements);
    if (u_ViewMatrixLoc) gl.uniformMatrix4fv(u_ViewMatrixLoc, false, camera.viewMatrix.elements);

    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.enable(gl.DEPTH_TEST);
    initTextures();

    document.addEventListener('keydown', handleKeyDown); 
    document.addEventListener('keyup',   handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown); 
    canvas.addEventListener('mouseup',   handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove); // This should call the full mouse look camera
    canvas.addEventListener('click', () => { if(canvas.requestPointerLock) canvas.requestPointerLock(); });

    lastFPSTime = performance.now();
    startAnimationLoop();
    console.log("TexturedQuad.js: 32x32 Maze, FPS, Add/Delete, Full Mouse Look. Q/E active.");
}

// ————————————————— Game loop (with FPS) —————————————————
function startAnimationLoop() {
  lastFrameTimestamp = performance.now();
  function animate(now) {
    // time delta
    const delta = now - lastFrameTimestamp;
    lastFrameTimestamp = now;
    // update FPS
    frameCount++;
    const deltaFPSTime = now - lastFPSTime;
    if (deltaFPSTime >= 1000) {
        const fps = (frameCount * 1000.0) / deltaFPSTime;
        if (fpsDisplayElement) fpsDisplayElement.textContent = `FPS: ${fps.toFixed(1)}`;
        frameCount = 0;
        lastFPSTime = now;
    }
    // update day/night cycle
    timeOfDay = (timeOfDay + delta / 500) % dayLength;
    const t = Math.sin((timeOfDay / dayLength) * Math.PI * 2) * 0.5 + 0.5;
    const r = dayColor[0] * t + nightColor[0] * (1 - t);
    const g = dayColor[1] * t + nightColor[1] * (1 - t);
    const b = dayColor[2] * t + nightColor[2] * (1 - t);
    gl.clearColor(r, g, b, 1);

    processInput();
    redraw();
    animationFrameId = requestAnimationFrame(animate);
  }
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(animate);
}

// Process keyboard input
function processInput() {
  const moveSpeed   = 0.15; const rotateSpeed = 1.5; 
  try {
    if (keyStates.w) camera.moveForward(moveSpeed); if (keyStates.s) camera.moveBackwards(moveSpeed);
    if (keyStates.a) camera.moveLeft(moveSpeed); if (keyStates.d) camera.moveRight(moveSpeed);
    if (keyStates.q) camera.panLeft(rotateSpeed); if (keyStates.e) camera.panRight(rotateSpeed);
  } catch (err) { console.error("Error processing movement:", err); }
}

// ————————————————— input handlers —————————————————
function handleKeyDown(e) { 
  const k = e.key.toLowerCase(); if (k in keyStates) { keyStates[k] = true; }
  if (k === 'f') { handleAddBlock(); e.preventDefault(); } 
  else if (k === 'r') { handleDeleteBlock(); e.preventDefault(); }
  // Prevent default for arrow keys/space if they cause page scroll and are not used for game actions
  if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
  }
}
function handleKeyUp(e) { const k = e.key.toLowerCase(); if (k in keyStates) { keyStates[k] = false; } }
function handleMouseDown(e) { mouseDown = true; lastMouseX = e.clientX; lastMouseY = e.clientY; }
function handleMouseUp(e) { mouseDown = false; }

// MODIFIED handleMouseMove for Full Mouse Look (Pitch and Yaw)
function handleMouseMove(e) {
  let dx = 0; let dy = 0; 
  if ( document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas ) {
    dx = e.movementX || 0; dy = e.movementY || 0;
  } else if (mouseDown && lastMouseX !== null && lastMouseY !== null) { 
    dx = e.clientX - lastMouseX; dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX; lastMouseY = e.clientY; 
  } else {
    if (mouseDown && (lastMouseX === null || lastMouseY === null)) { lastMouseX = e.clientX; lastMouseY = e.clientY; }
    return;
  }
  try {
    const yawSensitivity  = 0.10; 
    const pitchSensitivity = 0.10; 
    if (Math.abs(dx) > 0.01) { camera.panRight(dx * yawSensitivity); } // Yaw
    if (Math.abs(dy) > 0.01 && typeof camera.tilt === 'function') { // Pitch (check if tilt exists)
        camera.tilt(-dy * pitchSensitivity); 
    }
  } catch (err) { console.error("Error in mouse handling:", err); }
}

// ————————————————— redraw  —————————————————
function redraw() {
  // ... (This function is IDENTICAL to the one you provided) ...
  try {
    if(camera && camera.viewMatrix && u_ViewMatrixLoc) {
        gl.uniformMatrix4fv(u_ViewMatrixLoc, false, camera.viewMatrix.elements);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawWorld();
  } catch (e) { console.error("Error in redraw:", e); }
}

// ————————————————— load textures —————————————————
function initTextures() {
  // Create texture objects and initialize with solid color fallbacks
  grassTexture = gl.createTexture(); skyTexture = gl.createTexture();
  dirtTexture = gl.createTexture(); 
  stoneTexture = gl.createTexture();
  
  // Create recognizable fallback colors
  createSolidTexture(grassTexture, [0, 0.7, 0, 1]);
  createSolidTexture(skyTexture, [0.5, 0.7, 1.0, 1]);
  createSolidTexture(dirtTexture, [0.6, 0.4, 0.2, 1]);
  createSolidTexture(stoneTexture, [0.5, 0.5, 0.5, 1]); 
  
  console.log("Using fallback solid color textures initially.");

  // Keep track of loaded resources
  let pendingTextures = 0;
  let loadedTextures = 0;
  
  // Helper function to load a texture
  function loadTexture(url, texture, name, fallbackUrl=null) {
    const img = new Image();
    img.crossOrigin = "";            // if you load over network
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
  
      // if this image is POT in both dims, you can repeat/mipmap
      function isPowerOf2(v) { return (v & (v - 1)) === 0; }
      if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // NPOT: clamp to edge, no mipmaps
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      }
  
      console.log(`Texture '${name}' loaded [${img.width}×${img.height}] from ${url}`);
    };
    img.onerror = () => {
      if (fallbackUrl) {
        console.warn(`Failed to load ${url}, trying fallback ${fallbackUrl}`);
        loadTexture(fallbackUrl, texture, name);
      } else {
        console.warn(`Failed to load ${url}, using solid-color fallback for '${name}'`);
      }
    };
    img.src = url;
  }

  // Try to load textures
  loadTexture('../resources/dirt.jpg', dirtTexture, 'dirt');
  loadTexture('../resources/stone.png', stoneTexture, 'stone');
  // Try alternative stone texture if available
  setTimeout(() => {
    // If stone texture didn't load, try the JPG version as backup
    if (loadedTextures < 2) {
      loadTexture('../resources/stone.jpg', stoneTexture, 'stone');
    }
  }, 500);
}

// --- createSolidTexture ---
function createSolidTexture(texture, color) {
  // ... (This function is IDENTICAL to the one you provided) ...
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const R = Math.floor(color[0] * 255); const G = Math.floor(color[1] * 255);
  const B = Math.floor(color[2] * 255); const A = Math.floor(color[3] * 255);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([R, G, B, A]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}
// --- drawWorld and its components ---
function drawWorld() {
  try { drawSkybox(); drawGround(); drawWorldBlocks(); drawObjects();  
  } catch (e) { console.error("Error in drawWorld:", e); }
}

function drawSkybox() {
  // compute the same t/r/g/b you do in animate()
  const t = Math.sin((timeOfDay/dayLength)*Math.PI*2)*0.5 + 0.5;
  const br = dayColor[0]*t + nightColor[0]*(1-t);
  const bg = dayColor[1]*t + nightColor[1]*(1-t);
  const bb = dayColor[2]*t + nightColor[2]*(1-t);

  gl.depthMask(false);

  // bind your sky texture as before
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, skyTexture);

  // tell the shader to blend 50/50 (or however you like) between baseColor and texture
  if (u_texColorWeightLoc)  gl.uniform1f(u_texColorWeightLoc, 0.5);
  if (u_BaseColorLoc)       gl.uniform4fv(u_BaseColorLoc, [br,bg,bb,1.0]);

  // draw your cube
  const eyePos = camera.eye.elements;
  const M = new Matrix4()
               .translate(eyePos[0],eyePos[1],eyePos[2])
               .scale(200,200,200);
  drawCube(gl, M, null);

  gl.depthMask(true);
}


function drawGround() { 
  if (!grassTexture) return; 
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, grassTexture); 
  if (u_texColorWeightLoc) gl.uniform1f(u_texColorWeightLoc, 1.0);
  const groundSize = 32; const groundCenterY = -0.005; 
  const modelMatrix = new Matrix4().translate(0, groundCenterY, 0).scale(groundSize, 0.01, groundSize); 
  drawCube(gl, modelMatrix, [1,1,1,1]); 
}

// In TexturedQuad.js

function drawWorldBlocks() {
  gl.activeTexture(gl.TEXTURE0);

  const camX = camera.eye.elements[0];
  const camZ = camera.eye.elements[2];
  const CULL_DISTANCE_XZ = 10.0;

  let drawnBlockCount = 0;

  for (const block of window.g_worldBlocks) {
    // Distance culling
    const dx = block.x - camX;
    const dz = block.z - camZ;
    if (Math.abs(dx) > CULL_DISTANCE_XZ || Math.abs(dz) > CULL_DISTANCE_XZ) {
      continue;
    }

    drawnBlockCount++;

    // Set texture weight to full
    if (u_texColorWeightLoc) gl.uniform1f(u_texColorWeightLoc, 1.0);
    // Set base color as fallback (will mix if texture issues)
    if (u_BaseColorLoc) {
      if (block.type === 'stone') {
        gl.uniform4fv(u_BaseColorLoc, [0.5, 0.5, 0.5, 1.0]);
      } else {
        gl.uniform4fv(u_BaseColorLoc, [0.6, 0.4, 0.2, 1.0]);
      }
    }

    // Choose and bind appropriate texture
    if (block.type === 'stone' && stoneTexture) {
      gl.bindTexture(gl.TEXTURE_2D, stoneTexture);
    } else if (block.type === 'dirt' && dirtTexture) {
      gl.bindTexture(gl.TEXTURE_2D, dirtTexture);
    } else {
      // Emergency fallback
      gl.bindTexture(gl.TEXTURE_2D, dirtTexture || createDefaultTexture());
    }

    const modelMatrix = new Matrix4();
    modelMatrix.translate(block.x, block.y, block.z); 
    modelMatrix.scale(G_BLOCK_SIZE, G_BLOCK_SIZE, G_BLOCK_SIZE);
    drawCube(gl, modelMatrix, [1,1,1,1]);
  }
}

function drawObjects() { 
  const positions = [ [-5,0.5,-5], [5,0.5,-8], [-8,0.5,-15], [8,0.5,-20], [0,0.5,-12] ];
  positions.forEach((pos, i) => {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, (i % 2 === 0 && grassTexture) ? grassTexture : (skyTexture || grassTexture) );
    if (u_texColorWeightLoc) gl.uniform1f(u_texColorWeightLoc, 0.7); 
    const color = [ (i*0.1+0.3)%1.0, ((i+2)*0.1)%1.0, ((i+4)*0.1)%1.0, 1.0 ];
    if(u_BaseColorLoc) gl.uniform4fv(u_BaseColorLoc, color);
    const size = 1.0 + i * 0.3;
    const Mobj = new Matrix4().translate(pos[0], pos[1], pos[2]).scale(size, size, size).rotate(i * 30, 0, 1, 0);
    drawCube(gl, Mobj, color);
  });
}
// --- End Drawing Functions ---

// --- Add/Delete Block Logic ---
function getLookAtWorldPoint() {
    let forward = new Vector3([
        camera.at.elements[0] - camera.eye.elements[0],
        camera.at.elements[1] - camera.eye.elements[1],
        camera.at.elements[2] - camera.eye.elements[2]
    ]);
    forward.normalize();
    return {
        x: camera.eye.elements[0] + forward.elements[0] * REACH_DISTANCE,
        y: camera.eye.elements[1] + forward.elements[1] * REACH_DISTANCE,
        z: camera.eye.elements[2] + forward.elements[2] * REACH_DISTANCE,
        forward: forward 
    };
}

function handleAddBlock() {
    const targetInfo = getLookAtWorldPoint();
    const forward = targetInfo.forward;

    const placeX = camera.eye.elements[0] + forward.elements[0] * (REACH_DISTANCE - G_BLOCK_SIZE * 0.51);
    const placeY = camera.eye.elements[1] + forward.elements[1] * (REACH_DISTANCE - G_BLOCK_SIZE * 0.51);
    const placeZ = camera.eye.elements[2] + forward.elements[2] * (REACH_DISTANCE - G_BLOCK_SIZE * 0.51);

    const snappedPlaceX = Math.round(placeX / G_BLOCK_SIZE) * G_BLOCK_SIZE;
    const snappedPlaceY = Math.floor(placeY / G_BLOCK_SIZE) * G_BLOCK_SIZE + G_BLOCK_SIZE / 2;
    const snappedPlaceZ = Math.round(placeZ / G_BLOCK_SIZE) * G_BLOCK_SIZE;
    
    const newBlock = { x: snappedPlaceX, y: snappedPlaceY, z: snappedPlaceZ, type: window.g_currentBlockTypeToAdd };

    const existingBlock = window.g_worldBlocks.find(
        b => Math.abs(b.x - newBlock.x) < 0.1 && Math.abs(b.y - newBlock.y) < 0.1 && Math.abs(b.z - newBlock.z) < 0.1
    );

    if (!existingBlock) {
        const playerAABB = { 
            minX: camera.eye.elements[0] - camera.bodyRadius, maxX: camera.eye.elements[0] + camera.bodyRadius,
            minY: camera.eye.elements[1] - camera.bodyHeight, maxY: camera.eye.elements[1],
            minZ: camera.eye.elements[2] - camera.bodyRadius, maxZ: camera.eye.elements[2] + camera.bodyRadius
        };
        const newBlockAABB = window.getBlockAABB(newBlock);

        if (!window.checkAABBAABBCollision(playerAABB, newBlockAABB)) {
            window.g_worldBlocks.push(newBlock);
            console.log(`Added ${newBlock.type} block at:`, newBlock.x, newBlock.y, newBlock.z);
        } else {
            console.log("Cannot place block: collision with player.");
        }
    } else {
        console.log("Cannot place block: cell already occupied at", newBlock.x, newBlock.y, newBlock.z);
    }
}

function handleDeleteBlock() {
    const targetInfo = getLookAtWorldPoint();
    let blockToDelete = null;
    let minDistanceSqToTargetPoint = Infinity;

    for (const block of window.g_worldBlocks) {
        const blockAABB = window.getBlockAABB(block);
        if (window.checkPointAABBCollision({x: targetInfo.x, y: targetInfo.y, z: targetInfo.z}, blockAABB)) {
            const distSq = (block.x - targetInfo.x)**2 + (block.y - targetInfo.y)**2 + (block.z - targetInfo.z)**2;
            if (distSq < minDistanceSqToTargetPoint) {
                minDistanceSqToTargetPoint = distSq;
                blockToDelete = block;
            }
        }
    }

    if (blockToDelete) {
        window.g_worldBlocks = window.g_worldBlocks.filter(b => b !== blockToDelete);
        console.log("Deleted block at:", blockToDelete.x, blockToDelete.y, blockToDelete.z);
    } else {
        console.log("No block targeted for deletion within reach.");
    }
}
// --- End Add/Delete Block Logic ---

window.main = main;