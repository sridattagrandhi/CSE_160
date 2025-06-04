// js/sceneElements.js
// js/sceneElements.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import {
    createRoadTexture,
    createSidewalkTexture,
    createGrassTexture,
    createBuildingTexture,
    createCarTexture
} from './textureFactory.js';

// Module-scoped references that will be set by initializeSceneElements
let carsRef, streetLightsRef, allPointLightsInStreetLightsRef, moduleScopedFountainRef, fountainParticlesRef, animatedPrimaryShapesRef, rainParticlesMeshRef;
let sceneRef;

const loadedKeepOutZones = [];
const KEEPOUT_BUFFER = 5; // Buffer around loaded GLB models and other key elements

function isPositionOccupied(x, z, itemWidth = 1, itemDepth = 1, excludeSource = null) {
    const item_x_min = x - itemWidth / 2;
    const item_x_max = x + itemWidth / 2;
    const item_z_min = z - itemDepth / 2;
    const item_z_max = z + itemDepth / 2;

    for (const zone of loadedKeepOutZones) {
        if (excludeSource && zone.source === excludeSource) {
            continue;
        }
        if (item_x_min < zone.x_max && item_x_max > zone.x_min &&
            item_z_min < zone.z_max && item_z_max > zone.z_min) {
            return true;
        }
    }
    return false;
}

function addKeepOutZone(sourceName, centerX, centerZ, width, depth) {
    loadedKeepOutZones.push({
        x_min: centerX - width / 2 - KEEPOUT_BUFFER,
        x_max: centerX + width / 2 + KEEPOUT_BUFFER,
        z_min: centerZ - depth / 2 - KEEPOUT_BUFFER,
        z_max: centerZ + depth / 2 + KEEPOUT_BUFFER,
        source: sourceName
    });
}

function loadCustomGLBModel(modelPath, position, scale = { x: 1, y: 1, z: 1 }, rotationY = 0, estimatedFootprint) {
    const loader = new GLTFLoader();
    loader.load(
        modelPath,
        function (gltf) {
            const model = gltf.scene;
            model.position.set(position.x, position.y, position.z);
            model.scale.set(scale.x, scale.y, scale.z);
            model.rotation.y = rotationY;
            model.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
            sceneRef.add(model);
            console.log(`Model loaded from: ${modelPath}`);

            const footprintWidth = estimatedFootprint ? estimatedFootprint.width * scale.x : (scale.x || 1) * 5;
            const footprintDepth = estimatedFootprint ? estimatedFootprint.depth * scale.z : (scale.z || 1) * 5;

            addKeepOutZone(modelPath, position.x, position.z, footprintWidth, footprintDepth);
        },
        undefined,
        function (error) {
            console.error(`Error loading model from ${modelPath}:`, error);
            // Removed placeholder from here to avoid confusion if file paths are the primary issue.
            // Ensure your GLB files exist at the specified paths.
        }
    );
}

export function createSkybox(scene) {
    const canvasSize = 512;
    const skyColor = '#87CEEB'; // Light sky blue
    const cloudColor = '#FFFFFF';
    const groundColor = '#B0E0E6'; // Slightly different blue for "bottom" or a light ground

    function createSkyFaceCanvas(color, addClouds) {
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const context = canvas.getContext('2d');

        // Background color
        context.fillStyle = color;
        context.fillRect(0, 0, canvasSize, canvasSize);

        if (addClouds) {
            context.fillStyle = cloudColor;
            context.globalAlpha = 0.8; // Slightly transparent clouds

            for (let i = 0; i < 10; i++) { // Draw 10 clouds per face
                const x = Math.random() * canvasSize;
                const y = Math.random() * (canvasSize * 0.6) + (canvasSize * 0.1); // Clouds mostly in upper 60%
                const radiusX = Math.random() * 50 + 40; // Cloud width
                const radiusY = Math.random() * 20 + 20; // Cloud height

                context.beginPath();
                context.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
                context.fill();

                // Add a few more smaller ellipses to make clouds fluffier
                for (let j = 0; j < 2; j++) {
                    context.beginPath();
                    context.ellipse(
                        x + (Math.random() - 0.5) * radiusX * 0.7,
                        y + (Math.random() - 0.5) * radiusY * 0.7,
                        radiusX * (Math.random() * 0.3 + 0.4),
                        radiusY * (Math.random() * 0.3 + 0.4),
                        0, 0, 2 * Math.PI
                    );
                    context.fill();
                }
            }
            context.globalAlpha = 1.0;
        }
        return canvas;
    }

    const canvases = [
        createSkyFaceCanvas(skyColor, true),    // Positive X (Right)
        createSkyFaceCanvas(skyColor, true),    // Negative X (Left)
        createSkyFaceCanvas(skyColor, true),    // Positive Y (Top)
        createSkyFaceCanvas(groundColor, false),// Negative Y (Bottom) - fewer or no clouds
        createSkyFaceCanvas(skyColor, true),    // Positive Z (Front)
        createSkyFaceCanvas(skyColor, true)     // Negative Z (Back)
    ];

    // Create a CubeTexture directly from the array of canvas elements
    // The order of canvases must be: +X, -X, +Y, -Y, +Z, -Z
    const cubeTexture = new THREE.CubeTexture(canvases);
    cubeTexture.needsUpdate = true; // Important to tell Three.js to upload the texture to the GPU

    scene.background = cubeTexture;
    console.log("Procedural skybox with clouds applied.");
}
export function addLighting(scene) {
    // Using the lighting values from the code you provided
    const ambientLight = new THREE.AmbientLight(0x8090A0, 1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.8);
    directionalLight.position.set(80, 120, 60);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 350;
    directionalLight.shadow.camera.left = -180;
    directionalLight.shadow.camera.right = 180;
    directionalLight.shadow.camera.top = 180;
    directionalLight.shadow.camera.bottom = -180;
    scene.add(directionalLight);
    const hemisphereLight = new THREE.HemisphereLight(0xB0C8E0, 0x607040, 0.7);
    scene.add(hemisphereLight);
 }

function createGround() {
    // ... (Your existing createGround logic) ...
    const roadGeometry = new THREE.PlaneGeometry(100, 10);
    const roadTexture = createRoadTexture();
    const roadMaterial = new THREE.MeshLambertMaterial({ map: roadTexture });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2; road.receiveShadow = true; sceneRef.add(road);
    const crossRoadGeometry = new THREE.PlaneGeometry(10, 60);
    const crossRoadMaterial = new THREE.MeshLambertMaterial({ map: roadTexture });
    const crossRoad = new THREE.Mesh(crossRoadGeometry, crossRoadMaterial);
    crossRoad.rotation.x = -Math.PI / 2; crossRoad.position.set(0, 0.01, 0); crossRoad.receiveShadow = true; sceneRef.add(crossRoad);
    const sidewalkGeometry = new THREE.PlaneGeometry(100, 5);
    const sidewalkTexture = createSidewalkTexture();
    const sidewalkMaterial = new THREE.MeshLambertMaterial({ map: sidewalkTexture });
    const sidewalk1 = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
    sidewalk1.rotation.x = -Math.PI / 2; sidewalk1.position.set(0, 0.02, 7.5); sidewalk1.receiveShadow = true; sceneRef.add(sidewalk1);
    const sidewalk2 = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
    sidewalk2.rotation.x = -Math.PI / 2; sidewalk2.position.set(0, 0.02, -7.5); sidewalk2.receiveShadow = true; sceneRef.add(sidewalk2);
    const crossSidewalkGeometry = new THREE.PlaneGeometry(5, 60);
    const crossSidewalk1 = new THREE.Mesh(crossSidewalkGeometry, sidewalkMaterial);
    crossSidewalk1.rotation.x = -Math.PI / 2; crossSidewalk1.position.set(7.5, 0.02, 0); crossSidewalk1.receiveShadow = true; sceneRef.add(crossSidewalk1);
    const crossSidewalk2 = new THREE.Mesh(crossSidewalkGeometry, sidewalkMaterial);
    crossSidewalk2.rotation.x = -Math.PI / 2; crossSidewalk2.position.set(-7.5, 0.02, 0); crossSidewalk2.receiveShadow = true; sceneRef.add(crossSidewalk2);
    const grassGeometry = new THREE.PlaneGeometry(200, 200);
    const grassTexture = createGrassTexture();
    const grassMaterial = new THREE.MeshLambertMaterial({ map: grassTexture });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2; grass.position.y = -0.05; grass.receiveShadow = true; sceneRef.add(grass);
}

function createRandomBuilding(index) {
    // ... (Your existing createRandomBuilding logic with isPositionOccupied check) ...
    let buildingMeshOrGroup;
    const height = 5 + Math.random() * 25;
    const width = 4 + Math.random() * 6;
    const depth = 4 + Math.random() * 6;
    let isAnimatedBuilding = false;
    const buildingFootprintW = width + KEEPOUT_BUFFER / 2; 
    const buildingFootprintD = depth + KEEPOUT_BUFFER / 2;
    let attempts = 0;
    let posFound = false;
    let buildingX, buildingZ;
    do {
        const sideXGen = Math.random() > 0.5 ? 1 : -1;
        const sideZGen = Math.random() > 0.5 ? 1 : -1;
        buildingX = (15 + Math.random() * 35) * sideXGen; 
        buildingZ = (15 + Math.random() * 35) * sideZGen;
        if (!((Math.abs(buildingX) < 12 && Math.abs(buildingZ) < 37) || 
              (Math.abs(buildingZ) < 12 && Math.abs(buildingX) < 47)) &&
            !isPositionOccupied(buildingX, buildingZ, buildingFootprintW, buildingFootprintD)) {
            posFound = true;
        }
        attempts++;
        if (attempts > 100) { console.warn("Max attempts to place procedural building. Skipping for building index: " + index); return; }
    } while (!posFound);
    const buildingTypes = ['box', 'cylinder', 'complex'];
    const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
    let geometry; 
    switch (type) {
        case 'box':
            geometry = new THREE.BoxGeometry(width, height, depth);
            buildingMeshOrGroup = new THREE.Mesh(geometry);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(width/2, width/2, height, 16);
            buildingMeshOrGroup = new THREE.Mesh(geometry);
            break;
        case 'complex':
            buildingMeshOrGroup = new THREE.Group(); 
            isAnimatedBuilding = Math.random() < 0.2;
            const baseGeom = new THREE.BoxGeometry(width, height * 0.6, depth);
            const baseMat = new THREE.MeshLambertMaterial({ map: createBuildingTexture() });
            const base = new THREE.Mesh(baseGeom, baseMat);
            base.position.y = height * 0.3; base.castShadow = true; base.receiveShadow = true; buildingMeshOrGroup.add(base);
            const topGeom = new THREE.BoxGeometry(width * 0.8, height * 0.4, depth * 0.8);
            const topMat = new THREE.MeshLambertMaterial({ map: createBuildingTexture() });
            const topMesh = new THREE.Mesh(topGeom, topMat);
            topMesh.position.y = height*0.6+(height*0.4/2); topMesh.castShadow=true; topMesh.receiveShadow=true; buildingMeshOrGroup.add(topMesh);
            break;
        default: return; 
    }
    if (type !== 'complex' && buildingMeshOrGroup) {
        if (Math.random() > 0.3) {
            const texture = createBuildingTexture();
            texture.repeat.set(Math.ceil(width/4), Math.ceil(height/8)); texture.needsUpdate = true;
            buildingMeshOrGroup.material = new THREE.MeshLambertMaterial({ map: texture });
        } else {
            buildingMeshOrGroup.material = new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(Math.random(),0.3,0.4+Math.random()*0.3) });
        }
    }
    buildingMeshOrGroup.position.set(buildingX, (type === 'complex' ? 0 : height / 2), buildingZ);
    buildingMeshOrGroup.castShadow = true; 
    buildingMeshOrGroup.receiveShadow = true;
    buildingMeshOrGroup.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }});
    sceneRef.add(buildingMeshOrGroup);
    if (isAnimatedBuilding && type === 'complex') animatedPrimaryShapesRef.push({mesh: buildingMeshOrGroup, type: 'rotateY'});
    else if (!isAnimatedBuilding && type !== 'complex' && Math.random() < 0.1) animatedPrimaryShapesRef.push({mesh: buildingMeshOrGroup, type: 'scale'});
}

function createBuildings() { for (let i = 0; i < 30; i++) createRandomBuilding(i); }

// --- MODIFIED createStreetLight ---
function createStreetLight() {
    const group = new THREE.Group();
    const poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 7, 8);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 3.5; pole.castShadow = true; group.add(pole);
    const armGeometry = new THREE.BoxGeometry(2, 0.2, 0.2);
    const arm = new THREE.Mesh(armGeometry, poleMaterial);
    arm.position.set(1, 6.8, 0); group.add(arm);
    const fixtureGeometry = new THREE.CylinderGeometry(0.4, 0.3, 0.5, 8);
    const fixtureMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 }); 
    const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
    fixture.position.set(2, 6.5, 0); group.add(fixture); group.userData.fixture = fixture;
    
    const pointLight = new THREE.PointLight(0xFFFF99, 0.8, 30, 2); // Kept intensity at 0.8 as it's per light
    pointLight.position.set(2, 6.3, 0);
    pointLight.castShadow = false; // *** KEY CHANGE: Disabled shadows for point lights ***
    pointLight.visible = false; 
    group.add(pointLight);
    return group;
}

// Ensure all the functions that were collapsed (e.g. createTrees, createBenches, createStreetLights, etc.)
// are the full versions from the code you provided in the prompt for this specific issue,
// as they contain the procedural placement and necessary calls to isPositionOccupied.
function createStreetLights() {
    allPointLightsInStreetLightsRef.length = 0;
    const streetlightPositions = [
        ...Array(5).fill(null).map((_,i) => ({x: -40 + i * 20, z: 6.5})),
        ...Array(5).fill(null).map((_,i) => ({x: -40 + i * 20, z: -6.5})),
        ...Array(3).fill(null).map((_,i) => ({x: 6.5, z: -20 + i * 20})),
        ...Array(3).fill(null).map((_,i) => ({x: -6.5, z: -20 + i * 20})),
    ];
    const streetlightFootprint = 1.0; 

    streetlightPositions.forEach(pos => {
        if (isPositionOccupied(pos.x, pos.z, streetlightFootprint, streetlightFootprint)) {
            // console.warn(`Skipping streetlight at (${pos.x}, ${pos.z}) due to GLB/Fountain overlap.`);
            return; // Skip if colliding
        }
        const streetLightGroup = createStreetLight();
        streetLightGroup.position.set(pos.x, 0, pos.z);
        sceneRef.add(streetLightGroup);
        streetLightsRef.push(streetLightGroup);
        streetLightGroup.children.forEach(child => {
            if (child instanceof THREE.PointLight) allPointLightsInStreetLightsRef.push(child);
        });
        const fixture = streetLightGroup.userData.fixture;
        if (fixture) fixture.material.color.set(0x555555); 
    });
}

function createTrafficLights() {
    const trafficLightLayout = [ 
        { x: 5.5, z: 5.5, rotationY: -Math.PI / 4 }, { x: -5.5, z: 5.5, rotationY: Math.PI / 4 },
        { x: 5.5, z: -5.5, rotationY: -3 * Math.PI / 4 }, { x: -5.5, z: -5.5, rotationY: 3 * Math.PI / 4 }
    ];
    trafficLightLayout.forEach(data => {
        const { x, z, rotationY } = data;
        const trafficLight = new THREE.Group();
        const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 4, 6);
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.y = 2; pole.castShadow = true; trafficLight.add(pole);
        const boxGeom = new THREE.BoxGeometry(0.3, 0.9, 0.3);
        const boxMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const box = new THREE.Mesh(boxGeom, boxMat);
        box.position.y = 3.8; box.castShadow = true; trafficLight.add(box);
        const lightColors = [0xFF0000, 0xFFFF00, 0x00FF00];
        lightColors.forEach((color, index) => {
            const lightGeom = new THREE.CircleGeometry(0.1, 16);
            const lightMat = new THREE.MeshBasicMaterial({ color: color });
            const light = new THREE.Mesh(lightGeom, lightMat);
            light.position.set(0, 4.2 - (index * 0.28), 0.16); trafficLight.add(light);
        });
        trafficLight.position.set(x, 0, z); trafficLight.rotation.y = rotationY;
        sceneRef.add(trafficLight);
    });
 }

function createTrees() {
    for (let i = 0; i < 25; i++) {
        const treeFootprint = 3; 
        let treeX, treeZ, attempts = 0, posFound = false;
        do {
            treeX = (Math.random() - 0.5) * 90; 
            treeZ = (Math.random() - 0.5) * 90;
            if (!((Math.abs(treeX) < 12 && Math.abs(treeZ) < 37) || 
                  (Math.abs(treeZ) < 12 && Math.abs(treeX) < 47)) &&
                !isPositionOccupied(treeX, treeZ, treeFootprint, treeFootprint)) {
                posFound = true;
            }
            attempts++;
            if (attempts > 50) { console.warn(`Max attempts to place tree, skipping tree index: ${i}`); break; }
        } while (!posFound);

        if (posFound) {
            const tree = new THREE.Group();
            const trunkHeight = 2.5 + Math.random();
            const trunkGeom = new THREE.CylinderGeometry(0.15,0.25,trunkHeight,8);
            const trunkMat = new THREE.MeshLambertMaterial({color:0x8B4513});
            const trunk = new THREE.Mesh(trunkGeom,trunkMat);
            trunk.position.y=trunkHeight/2; trunk.castShadow=true; tree.add(trunk);
            const numLeafSpheres = 3 + Math.floor(Math.random()*2);
            for(let j=0;j<numLeafSpheres;j++){
                const leafRadius=1.2+Math.random()*0.6;
                const leavesGeom = new THREE.SphereGeometry(leafRadius,8,6);
                const leavesMat = new THREE.MeshLambertMaterial({color:new THREE.Color().setHSL(0.3,0.5,0.3+Math.random()*0.2)});
                const leaves = new THREE.Mesh(leavesGeom,leavesMat);
                leaves.position.set((Math.random()-0.5)*leafRadius*0.4,trunkHeight+(Math.random()-0.3)*leafRadius*0.8,(Math.random()-0.5)*leafRadius*0.4);
                leaves.castShadow=true; tree.add(leaves);
            }
            tree.position.set(treeX, 0, treeZ);
            sceneRef.add(tree);
        }
    }
}

function createBenches() {
    const intersectionMargin = 10.5;
    const mainRoadSidewalkZFixed = 9.0;
    const crossRoadSidewalkXFixed = 9.0;
    const benchYPosition = 0.02;
    const benchFootprintL = 2.2, benchFootprintD = 0.7; 
    for (let i = 0; i < 10; i++) {
        let benchX, benchZ, rotY, attempts=0, posFound=false;
        do {
            if (Math.random() > 0.5) { 
                rotY = 0;
                benchZ = (Math.random() > 0.5) ? mainRoadSidewalkZFixed : -mainRoadSidewalkZFixed;
                const randomXMagnitude = intersectionMargin + Math.random() * (40 - intersectionMargin);
                benchX = (Math.random() < 0.5 ? -1 : 1) * randomXMagnitude;
                if (!isPositionOccupied(benchX, benchZ, benchFootprintL, benchFootprintD)) posFound = true;
            } else { 
                rotY = Math.PI / 2;
                benchX = (Math.random() > 0.5) ? crossRoadSidewalkXFixed : -crossRoadSidewalkXFixed;
                const randomZMagnitude = intersectionMargin + Math.random() * (25 - intersectionMargin);
                benchZ = (Math.random() < 0.5 ? -1 : 1) * randomZMagnitude;
                if (!isPositionOccupied(benchX, benchZ, benchFootprintD, benchFootprintL)) posFound = true;
            }
            attempts++; 
            if(attempts>50) { console.warn("Max attempts to place bench, skipping."); break; }
        } while(!posFound);
        if (posFound) { 
            const bench = new THREE.Group(); 
            const seatMat=new THREE.MeshLambertMaterial({color:0x964B00});
            const seatGeom=new THREE.BoxGeometry(2,0.15,0.5);
            const seat=new THREE.Mesh(seatGeom,seatMat);
            seat.position.y=0.5; seat.castShadow=true; bench.add(seat);
            const backGeom=new THREE.BoxGeometry(2,0.8,0.1);
            const back=new THREE.Mesh(backGeom,seatMat);
            back.position.set(0,0.95,-0.2); back.rotation.x=-0.1; back.castShadow=true; bench.add(back);
            const legGeom=new THREE.BoxGeometry(0.1,0.5,0.1);
            const legPositions=[[-0.9,0.25,0.2],[0.9,0.25,0.2],[-0.9,0.25,-0.2],[0.9,0.25,-0.2]];
            legPositions.forEach(pos=>{const leg=new THREE.Mesh(legGeom,seatMat); leg.position.set(...pos); leg.castShadow=true; bench.add(leg);});
            bench.rotation.y = rotY;
            bench.position.set(benchX, benchYPosition, benchZ);
            sceneRef.add(bench);
        }
    }
}

function createFireHydrants() {
    const hydrantYPosition = 0.02;
    const hydrantFootprint = 0.8; 
    for (let i = 0; i < 6; i++) {
        let hydrantX, hydrantZ, attempts=0, posFound=false;
        do {
            if (Math.random() > 0.5) {
                hydrantX = -40 + Math.random() * 80; hydrantZ = Math.random() > 0.5 ? 11 : -11;
            } else {
                hydrantZ = -25 + Math.random() * 50; hydrantX = Math.random() > 0.5 ? 11 : -11;
            }
            if (!isPositionOccupied(hydrantX, hydrantZ, hydrantFootprint, hydrantFootprint)) posFound = true;
            attempts++; 
            if(attempts>50) { console.warn("Max attempts to place hydrant, skipping."); break; }
        } while(!posFound);
        if (posFound) { 
            const hydrant=new THREE.Group();
            const bodyMat=new THREE.MeshLambertMaterial({color:0xFF0000});
            const bodyGeom=new THREE.CylinderGeometry(0.2,0.3,0.8,8);
            const body=new THREE.Mesh(bodyGeom,bodyMat);
            body.position.y=0.4; body.castShadow=true; hydrant.add(body);
            const topGeom=new THREE.CylinderGeometry(0.15,0.2,0.2,8);
            const topMesh=new THREE.Mesh(topGeom,bodyMat);
            topMesh.position.y=0.8+0.1; topMesh.castShadow=true; hydrant.add(topMesh);
            const nozzleGeom=new THREE.CylinderGeometry(0.1,0.1,0.2,6);
            const nozzle1=new THREE.Mesh(nozzleGeom,bodyMat);
            nozzle1.position.set(0.3,0.5,0); nozzle1.rotation.z=Math.PI/2; hydrant.add(nozzle1);
            const nozzle2=new THREE.Mesh(nozzleGeom,bodyMat);
            nozzle2.position.set(-0.3,0.5,0); nozzle2.rotation.z=-Math.PI/2; hydrant.add(nozzle2);
            hydrant.position.set(hydrantX, hydrantYPosition, hydrantZ);
            sceneRef.add(hydrant);
        }
    }
}

function createCar() {
    const car = new THREE.Group();
    const bodyWidth=1.8, bodyHeight=1.0, bodyLength=3.8;
    const bodyGeometry = new THREE.BoxGeometry(bodyLength,bodyHeight,bodyWidth);
    const bodyMaterial = new THREE.MeshLambertMaterial({map:createCarTexture()});
    const body = new THREE.Mesh(bodyGeometry,bodyMaterial);
    body.position.y = bodyHeight/2; body.castShadow=true; body.receiveShadow=true; car.add(body);
    const roofHeight=0.7, roofLength=2.0, roofWidth=bodyWidth*0.9;
    const roofGeometry = new THREE.BoxGeometry(roofLength,roofHeight,roofWidth);
    const carBodyColor = new THREE.Color(bodyMaterial.map.image.getContext('2d').fillStyle);
    const roofMaterial = new THREE.MeshLambertMaterial({color:carBodyColor.clone().offsetHSL(0,0,-0.2)});
    const roof = new THREE.Mesh(roofGeometry,roofMaterial);
    roof.position.set(0.2,bodyHeight+roofHeight/2-0.1,0); roof.castShadow=true; car.add(roof);
    const wheelRadius=0.35, wheelWidth=0.25;
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius,wheelRadius,wheelWidth,16);
    const wheelMaterial = new THREE.MeshLambertMaterial({color:0x222222});
    const wheelPositions = [
        {x:(bodyLength/2-wheelRadius*1.5),y:wheelRadius,z:(bodyWidth/2+wheelWidth/2)}, {x:(bodyLength/2-wheelRadius*1.5),y:wheelRadius,z:-(bodyWidth/2+wheelWidth/2)},
        {x:-(bodyLength/2-wheelRadius*1.5),y:wheelRadius,z:(bodyWidth/2+wheelWidth/2)}, {x:-(bodyLength/2-wheelRadius*1.5),y:wheelRadius,z:-(bodyWidth/2+wheelWidth/2)}
    ];
    wheelPositions.forEach(pos=>{
        const wheel = new THREE.Mesh(wheelGeometry,wheelMaterial);
        wheel.position.set(pos.x,pos.y,pos.z); wheel.rotation.x=Math.PI/2; wheel.castShadow=true; car.add(wheel);
        car.userData.wheels = car.userData.wheels || []; car.userData.wheels.push(wheel);
    });
    const headlightGeometry = new THREE.SphereGeometry(0.12,8,6);
    const headlightMaterial = new THREE.MeshBasicMaterial({color:0xDDDDDD});
    const leftHeadlight = new THREE.Mesh(headlightGeometry,headlightMaterial);
    leftHeadlight.position.set(bodyLength/2,bodyHeight*0.6,-bodyWidth/2*0.6); car.add(leftHeadlight);
    const rightHeadlight = new THREE.Mesh(headlightGeometry,headlightMaterial);
    rightHeadlight.position.set(bodyLength/2,bodyHeight*0.6,bodyWidth/2*0.6); car.add(rightHeadlight);
    const taillightMaterial = new THREE.MeshBasicMaterial({color:0xAA0000});
    const leftTaillight = new THREE.Mesh(headlightGeometry,taillightMaterial);
    leftTaillight.position.set(-bodyLength/2,bodyHeight*0.6,-bodyWidth/2*0.6); car.add(leftTaillight);
    const rightTaillight = new THREE.Mesh(headlightGeometry,taillightMaterial);
    rightTaillight.position.set(-bodyLength/2,bodyHeight*0.6,bodyWidth/2*0.6); car.add(rightTaillight);
    return car;
}
function createCars() {
    const carCount = 8;
    for (let i = 0; i < carCount; i++) {
        const car = createCar();
        let initialX, initialZ, initialRotationY; const laneOffset=2.0;
        if (Math.random()>0.5) { /* X-axis movement */
            initialX=-45+(i*(90/carCount)); initialZ=(Math.random()>0.5)?laneOffset:-laneOffset;
            initialRotationY=(initialZ>0)?Math.PI:0; car.userData.axis='x'; car.userData.direction=(initialZ>0)?-1:1;
        } else { /* Z-axis movement */
            initialZ=-25+(i*(50/carCount)); initialX=(Math.random()>0.5)?laneOffset:-laneOffset;
            initialRotationY=(initialX>0)?Math.PI/2:-Math.PI/2; car.userData.axis='z'; car.userData.direction=(initialX>0)?1:-1;
        }
        car.position.set(initialX,0.5,initialZ); car.rotation.y=initialRotationY;
        car.userData.speed=0.05+Math.random()*0.1; car.userData.initialRotationY=initialRotationY;
        carsRef.push(car); sceneRef.add(car);
    }
}

function resetFountainParticle(particle) {
    if (!moduleScopedFountainRef || !moduleScopedFountainRef.position) {
        particle.position.set(0, 3.8, 0); // Default if fountain not ready
    } else {
        const fountainTopY = moduleScopedFountainRef.position.y + 1 + 2.5 + 0.3;
        const fountainX = moduleScopedFountainRef.position.x;
        const fountainZ = moduleScopedFountainRef.position.z;
        particle.position.set(fountainX,fountainTopY,fountainZ);
    }
    const angle=Math.random()*Math.PI*2; const horizontalSpeed=Math.random()*0.5+0.2;
    particle.userData = {
        velocity:new THREE.Vector3(Math.cos(angle)*horizontalSpeed, Math.random()*1.5+1.0, Math.sin(angle)*horizontalSpeed),
        life:1.0+Math.random()
    };
 }
function createFountainParticles() {
    const particleCount = 200;
    const particleMaterial = new THREE.MeshBasicMaterial({color:0x77AADD,transparent:true,opacity:0.85});
    for (let i=0; i<particleCount; i++) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.08,5,4), particleMaterial);
        resetFountainParticle(particle); // Uses moduleScopedFountainRef
        fountainParticlesRef.push(particle); sceneRef.add(particle);
    }
}
function createFountain() {
    const localFountain = new THREE.Group();
    localFountain.name = "city_fountain_group";
    moduleScopedFountainRef = localFountain; // Assign to module-scoped ref for resetFountainParticle

    const fountainWidth = 7, fountainDepth = 7; // Approximate base size of fountain
    const fountainX = 15, fountainY = 0, fountainZ = 30; // NEW CENTRAL POSITION

    addKeepOutZone(localFountain.name, fountainX, fountainZ, fountainWidth, fountainDepth);

    const baseMat = new THREE.MeshLambertMaterial({color:0xAAAAAA,map:createSidewalkTexture()});
    baseMat.map.repeat.set(2,2);
    const baseGeom = new THREE.CylinderGeometry(3.5,4,1,16);
    const base = new THREE.Mesh(baseGeom,baseMat);
    base.position.y=0.5; base.castShadow=true; base.receiveShadow=true; localFountain.add(base);
    const waterGeom = new THREE.CylinderGeometry(3.2,3.7,0.8,16);
    const waterMat = new THREE.MeshPhongMaterial({color:0x6699CC,transparent:true,opacity:0.75});
    const water = new THREE.Mesh(waterGeom,waterMat);
    water.position.y=0.5; localFountain.add(water);
    const pillarGeom = new THREE.CylinderGeometry(0.4,0.5,2.5,8);
    const pillar = new THREE.Mesh(pillarGeom,baseMat);
    pillar.position.y=1+2.5/2; pillar.castShadow=true; localFountain.add(pillar);
    const topGeom = new THREE.SphereGeometry(0.6,16,12);
    const topMesh = new THREE.Mesh(topGeom,baseMat);
    topMesh.position.y=1+2.5+0.3; topMesh.castShadow=true; localFountain.add(topMesh);

    localFountain.position.set(fountainX, fountainY, fountainZ);
    sceneRef.add(localFountain);
    createFountainParticles();
}

function createRainEffect() {
    const rainCount = 5000;
    const rainGeometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < rainCount; i++) {
        vertices.push(Math.random()*200-100, Math.random()*100+50, Math.random()*200-100);
    }
    rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
    const rainMaterial = new THREE.PointsMaterial({color:0xAAAAFF,size:0.2,transparent:true,opacity:0.7});
    rainParticlesMeshRef.current = new THREE.Points(rainGeometry,rainMaterial);
    rainParticlesMeshRef.current.visible = false;
    sceneRef.add(rainParticlesMeshRef.current);
}

function createCityElements() {
    createTrafficLights();
    createTrees();
    createBenches();
    createFireHydrants();
}

export function initializeSceneElements(
    s, crs, sls, aplisls, ftnMainRefNotUsed, fps, aps, rp
) {
    sceneRef = s; carsRef = crs; streetLightsRef = sls; allPointLightsInStreetLightsRef = aplisls;
    fountainParticlesRef = fps; animatedPrimaryShapesRef = aps; rainParticlesMeshRef = rp;

    createSkybox(sceneRef);
    addLighting(sceneRef);
    createGround();

    // Load custom GLB models FIRST to define their keep-out zones
    loadCustomGLBModel(
        'assets/models/new_city_building.glb',
        { x: 0, y: 0, z: -35 }, // MOVED "SAFER" POSITION
        { x: 1, y: 1, z: 1 },
        0,
        { width: 15, depth: 20 } // !! REPLACE with YOUR model's ORIGINAL pre-scale dimensions !!
    );
    loadCustomGLBModel(
        'assets/models/custom_object.glb',
        { x: 20, y: 0, z: 0 }, // MOVED "SAFER" POSITION
        { x: 2, y: 2, z: 2 },
        Math.PI / 4,
        { width: 2, depth: 2 } // !! REPLACE with YOUR model's ORIGINAL pre-scale dimensions !!
    );

    // Create fountain (fixed position, defines its own keep-out zone)
    createFountain();
    
    // Then create procedural elements
    createBuildings();
    createStreetLights();
    createCityElements();
    createCars();
    createRainEffect();
}