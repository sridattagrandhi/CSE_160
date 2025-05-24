// src/Sphere.js

let sphereBuffer = null;
let sphereIndexBuffer = null;
let sphereVertexCount = 0;

// Cached attribute and uniform locations for sphere
let a_Position_sphere_loc, a_TexCoord_sphere_loc, a_Normal_sphere_loc;

function generateSphereVertices(radius, latitudeBands, longitudeBands) {
    const vertices = [];
    const normals = [];
    const texCoords = [];
    const indices = [];

    for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        const theta = latNumber * Math.PI / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            const phi = longNumber * 2 * Math.PI / longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            
            const u = 1 - (longNumber / longitudeBands);
            const v = 1 - (latNumber / latitudeBands);

            normals.push(x);
            normals.push(y);
            normals.push(z);
            texCoords.push(u);
            texCoords.push(v);
            vertices.push(radius * x);
            vertices.push(radius * y);
            vertices.push(radius * z);
        }
    }

    for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
            const first = (latNumber * (longitudeBands + 1)) + longNumber;
            const second = first + longitudeBands + 1;
            indices.push(first);
            indices.push(second);
            indices.push(first + 1);

            indices.push(second);
            indices.push(second + 1);
            indices.push(first + 1);
        }
    }

    // Combine all attributes into a single interleaved array
    const interleavedVertices = [];
    for (let i = 0; i < vertices.length / 3; i++) {
        interleavedVertices.push(vertices[i*3]);
        interleavedVertices.push(vertices[i*3+1]);
        interleavedVertices.push(vertices[i*3+2]);
        
        interleavedVertices.push(texCoords[i*2]);
        interleavedVertices.push(texCoords[i*2+1]);

        interleavedVertices.push(normals[i*3]);
        interleavedVertices.push(normals[i*3+1]);
        interleavedVertices.push(normals[i*3+2]);
    }
    
    sphereVertexCount = indices.length;
    return {
        vertices: new Float32Array(interleavedVertices),
        indices: new Uint16Array(indices)
    };
}


function initSphere(gl) {
    if (!gl) {
        console.error("No WebGL context provided to initSphere");
        return;
    }

    const sphereData = generateSphereVertices(1.0, 30, 30); // radius 1, 30x30 segments

    sphereBuffer = gl.createBuffer();
    if (!sphereBuffer) {
        console.error("Failed to create sphere vertex buffer");
        return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphereData.vertices, gl.STATIC_DRAW);

    sphereIndexBuffer = gl.createBuffer();
    if(!sphereIndexBuffer) {
        console.error("Failed to create sphere index buffer");
        return;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereData.indices, gl.STATIC_DRAW);


    // Get attribute and uniform locations (assuming shader program is already compiled and used)
    a_Position_sphere_loc = gl.getAttribLocation(gl.program, 'a_Position');
    a_TexCoord_sphere_loc = gl.getAttribLocation(gl.program, 'a_TexCoord');
    a_Normal_sphere_loc = gl.getAttribLocation(gl.program, 'a_Normal');
    // u_ModelMatrix_sphere_loc will be the same as u_ModelMatrix_loc from Cube.js if sharing shaders
    // u_BaseColor_sphere_loc will be the same as u_BaseColor_loc

    if (a_Position_sphere_loc < 0 || a_TexCoord_sphere_loc < 0 || a_Normal_sphere_loc < 0) {
        console.warn("Sphere: Some attribute locations might be missing or inactive in the current shader.");
    }
     console.log("Sphere initialized. Vertex count:", sphereVertexCount);
}

function drawSphere(gl, modelMatrix, baseColor) {
    if (!gl || !sphereBuffer || !sphereIndexBuffer) {
        console.error("WebGL context or sphere buffers not ready for drawSphere");
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);

    const FSIZE = Float32Array.BYTES_PER_ELEMENT;
    const STRIDE = 8 * FSIZE; // Pos(3) + Tex(2) + Norm(3)

    // Enable and point attributes
    if (a_Position_sphere_loc >= 0) {
        gl.vertexAttribPointer(a_Position_sphere_loc, 3, gl.FLOAT, false, STRIDE, 0);
        gl.enableVertexAttribArray(a_Position_sphere_loc);
    }
    if (a_TexCoord_sphere_loc >= 0) {
        gl.vertexAttribPointer(a_TexCoord_sphere_loc, 2, gl.FLOAT, false, STRIDE, 3 * FSIZE);
        gl.enableVertexAttribArray(a_TexCoord_sphere_loc);
    }
    if (a_Normal_sphere_loc >= 0) {
        gl.vertexAttribPointer(a_Normal_sphere_loc, 3, gl.FLOAT, false, STRIDE, 5 * FSIZE);
        gl.enableVertexAttribArray(a_Normal_sphere_loc);
    }
    
    // Set uniforms (model matrix and base color are set in TexturedQuad.js before calling this)
    // The main TexturedQuad.js will handle u_ModelMatrix and u_BaseColor.
    // This function assumes they are already set if needed, or they are part of a unified draw call.

    gl.drawElements(gl.TRIANGLES, sphereVertexCount, gl.UNSIGNED_SHORT, 0);
}

window.initSphere = initSphere;
window.drawSphere = drawSphere;