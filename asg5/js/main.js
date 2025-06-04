// js/main.js
import * as THREE from 'three';
import { initializeCameraControls, manualControls } from './cameraControls.js';
import { initializeSceneElements } from './sceneElements.js';
import { initializeEventManager } from './eventManager.js';

let scene, camera, renderer, clock;
let cars = [];
let streetLights = [];
let allPointLightsInStreetLights = [];
let fountainParticles = [];
let animatedPrimaryShapes = [];
let rainParticlesMesh = { current: null };
let isRainingState = { value: false };

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x60A0D0, 70, 350);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(40, 30, 50);
    camera.lookAt(0,0,0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    initializeCameraControls(camera, document);
    initializeSceneElements(
        scene, cars, streetLights, allPointLightsInStreetLights,
        undefined, // fountainGroup ref from main isn't directly used by sceneElements
        fountainParticles, animatedPrimaryShapes, rainParticlesMesh
    );
    initializeEventManager(
        camera, renderer, scene,
        isRainingState, rainParticlesMesh, allPointLightsInStreetLights
    );

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (manualControls.update) manualControls.update();

    cars.forEach(car => {
        const carSpeed = car.userData.speed;
        const dir = car.userData.direction;
        if (car.userData.axis === 'x') {
            car.position.x += carSpeed * dir * 150 * delta;
            if (dir === 1 && car.position.x > 55) car.position.x = -55;
            if (dir === -1 && car.position.x < -55) car.position.x = 55;
        } else {
            car.position.z += carSpeed * dir * 150 * delta;
            if (dir === 1 && car.position.z > 35) car.position.z = -35;
            if (dir === -1 && car.position.z < -35) car.position.z = 35;
        }
        if (car.userData.wheels) {
            car.userData.wheels.forEach(wheel => wheel.rotation.y += carSpeed * dir * 500 * delta);
        }
    });

    const gravity = new THREE.Vector3(0, -9.8 * delta * 0.3, 0);
    fountainParticles.forEach(particle => {
        particle.userData.velocity.add(gravity);
        particle.position.addScaledVector(particle.userData.velocity, delta * 10);
        particle.userData.life -= delta * 2;

        const cityFountain = scene.getObjectByName("city_fountain_group");
        let fountainEmitX = 0, fountainEmitY = 3.8, fountainEmitZ = 0; // Default to fountain's new fixed pos
        let fountainBaseY = 0.5;

        if(cityFountain){
            fountainBaseY = cityFountain.position.y + 0.5;
            fountainEmitX = cityFountain.position.x;
            fountainEmitY = cityFountain.position.y + 1 + 2.5 + 0.3; // Relative to fountain's structure
            fountainEmitZ = cityFountain.position.z;
        }

        if (particle.userData.life <= 0 || particle.position.y < fountainBaseY) {
            particle.position.set(fountainEmitX, fountainEmitY, fountainEmitZ);
            const angle = Math.random() * Math.PI * 2;
            const horizontalSpeed = Math.random() * 0.5 + 0.2;
            particle.userData.velocity.set(Math.cos(angle)*horizontalSpeed, Math.random()*1.5+1.0, Math.sin(angle)*horizontalSpeed);
            particle.userData.life = 1.0 + Math.random();
        }
    });

    if (isRainingState.value && rainParticlesMesh.current) {
        const positions = rainParticlesMesh.current.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i+1] -= 0.8 + Math.random()*0.5;
            if (positions[i+1] < -10) {
                positions[i+1] = Math.random()*100+50; positions[i] = Math.random()*200-100; positions[i+2] = Math.random()*200-100;
            }
        }
        rainParticlesMesh.current.geometry.attributes.position.needsUpdate = true;
    }

    animatedPrimaryShapes.forEach(objInfo => {
        if (objInfo.mesh) {
            if (objInfo.type === 'rotateY') objInfo.mesh.rotation.y += 0.005;
            else if (objInfo.type === 'scale') {
                const scaleValue = 1 + Math.sin(clock.getElapsedTime()*0.5)*0.05;
                objInfo.mesh.scale.set(scaleValue,scaleValue,scaleValue);
            }
        }
    });

    renderer.render(scene, camera);
}

init();