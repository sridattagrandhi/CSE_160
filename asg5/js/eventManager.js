// js/eventManager.js
import * as THREE from 'three';
import { manualControls } from './cameraControls.js';

let cameraRef, rendererRef, sceneRef;
let isRainingRef, rainParticlesMeshRef, allPointLightsInStreetLightsRef;

// DOM Elements
let objectCountElement, lightCountElement, rainStatusElement, streetLightStatusElement;

function onWindowResize() {
    if (cameraRef && rendererRef) {
        cameraRef.aspect = window.innerWidth / window.innerHeight;
        cameraRef.updateProjectionMatrix();
        rendererRef.setSize(window.innerWidth, window.innerHeight);
    }
}

function onKeyDown(event) {
    switch(event.key.toUpperCase()) {
        case 'R':
            if (manualControls.reset) manualControls.reset();
            break;
        case 'P':
            isRainingRef.value = !isRainingRef.value;
            if (rainParticlesMeshRef.current) {
                rainParticlesMeshRef.current.visible = isRainingRef.value;
            }
            updateUI();
            break;
        case 'L':
            if (allPointLightsInStreetLightsRef) {
                allPointLightsInStreetLightsRef.forEach(light => {
                    light.visible = !light.visible;
                    const fixture = light.parent.userData.fixture;
                    if (fixture) {
                        fixture.material.color.set(light.visible ? 0xFFFF99 : 0x555555);
                    }
                });
            }
            updateUI();
            break;
    }
}

function updateUI() {
    if (objectCountElement && sceneRef) {
        let count = 0;
        sceneRef.traverse((obj) => { if (obj.isMesh || obj.isPoints || obj.isGroup) count++; });
        objectCountElement.textContent = count;
    }
    if (lightCountElement && sceneRef) {
        let count = 0;
        sceneRef.traverse((obj) => { if (obj.isLight) count++; });
        lightCountElement.textContent = count;
    }
    if(rainStatusElement && isRainingRef) rainStatusElement.textContent = isRainingRef.value ? "On" : "Off";

    if(streetLightStatusElement && allPointLightsInStreetLightsRef && allPointLightsInStreetLightsRef.length > 0) {
        streetLightStatusElement.textContent = allPointLightsInStreetLightsRef[0].visible ? "On" : "Off";
    } else if (streetLightStatusElement) {
        streetLightStatusElement.textContent = "Off (Day)";
    }
}


export function initializeEventManager(
    camera, renderer, scene,
    isRainingObj,
    rainMeshObj,
    streetLightsArray
) {
    cameraRef = camera;
    rendererRef = renderer;
    sceneRef = scene;
    isRainingRef = isRainingObj;
    rainParticlesMeshRef = rainMeshObj;
    allPointLightsInStreetLightsRef = streetLightsArray;

    objectCountElement = document.getElementById('objectCount');
    lightCountElement = document.getElementById('lightCount');
    rainStatusElement = document.getElementById('rainStatus');
    streetLightStatusElement = document.getElementById('streetLightStatus');

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', onKeyDown, false);

    updateUI();
}