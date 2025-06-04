// js/textureFactory.js
import * as THREE from 'three';

export function createRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = '#444';
    context.fillRect(0, 0, 256, 256);
    context.fillStyle = '#FFF';
    for (let i = 0; i < 256; i += 40) {
        context.fillRect(i, 126, 20, 4);
    }
    context.fillStyle = '#FFD700';
    context.fillRect(0, 10, 256, 2);
    context.fillRect(0, 244, 256, 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 2);
    return texture;
}

export function createSidewalkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = '#AAA';
    context.fillRect(0, 0, 128, 128);
    context.strokeStyle = '#888';
    context.lineWidth = 2;
    for (let i = 0; i < 128; i += 32) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, 128);
        context.stroke();
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(128, i);
        context.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(30, 3);
    return texture;
}

export function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = '#558844';
    context.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 100; i++) {
        context.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.2})`;
        context.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
}

export function createBuildingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    const baseHue = Math.random();
    context.fillStyle = `hsl(${baseHue * 360}, 30%, ${40 + Math.random() * 20}%)`;
    context.fillRect(0, 0, 128, 256);

    context.fillStyle = `hsl(${baseHue * 360}, 40%, ${20 + Math.random() * 10}%)`;
    const windowWidth = 20;
    const windowHeight = 30;
    const spacingX = 10;
    const spacingY = 15;
    for (let y = spacingY; y < 256 - windowHeight; y += windowHeight + spacingY) {
        for (let x = spacingX; x < 128 - windowWidth; x += windowWidth + spacingX) {
            if (Math.random() > 0.1) {
                 context.fillStyle = Math.random() < 0.1 ?
                    '#666633' :
                    `hsl(${baseHue * 360}, 40%, ${25 + Math.random() * 15}%)`;
                context.fillRect(x, y, windowWidth, windowHeight);
            }
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

export function createCarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = new THREE.Color(Math.random() * 0xffffff).getStyle();
    context.fillRect(0, 0, 128, 64);

    context.fillStyle = '#607B8B'; // Darker windows for daytime
    context.fillRect(30, 10, 68, 20);
    context.fillRect(10, 10, 15, 20);
    context.fillRect(103, 10, 15, 20);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}