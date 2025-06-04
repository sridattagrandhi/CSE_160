// js/cameraControls.js

let cameraRef, documentRef;
let mouseX = 0, mouseY = 0;
let targetPhi = Math.PI / 4, targetTheta = Math.PI / 4;
let phi = targetPhi, theta = targetTheta;
let radius = 50;
let isMouseDown = false;
const dampingFactor = 0.1;

function onMouseDown(event) {
    if (event.button === 0) {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
}

function onMouseUp(event) {
    if (event.button === 0) {
        isMouseDown = false;
    }
}

function onMouseMove(event) {
    if (!isMouseDown) return;

    let deltaX = event.clientX - mouseX;
    let deltaY = event.clientY - mouseY;

    targetTheta -= deltaX * 0.005;
    targetPhi -= deltaY * 0.005;
    targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, targetPhi));

    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onWheel(event) {
    radius += event.deltaY * 0.05;
    radius = Math.max(10, Math.min(200, radius));
}

function updateCameraPosition() {
    if (!cameraRef) return;
    phi += (targetPhi - phi) * dampingFactor;
    theta += (targetTheta - theta) * dampingFactor;

    cameraRef.position.x = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.position.y = radius * Math.cos(phi);
    cameraRef.position.z = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.lookAt(0, 0, 0);
}

export const manualControls = {
    update: updateCameraPosition,
    reset: () => {
        targetPhi = Math.PI / 4;
        targetTheta = Math.PI / 4;
        radius = 50;
    }
};

export function initializeCameraControls(camera, documentElement) {
    cameraRef = camera;
    documentRef = documentElement;
    documentRef.addEventListener('mousedown', onMouseDown);
    documentRef.addEventListener('mouseup', onMouseUp);
    documentRef.addEventListener('mousemove', onMouseMove);
    documentRef.addEventListener('wheel', onWheel);
}