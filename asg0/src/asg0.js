//sridatta grandhi
//srgrandh@ucsc.edu
let canvas, ctx;

function main() {  
  canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  ctx = canvas.getContext('2d');

  clearCanvas();
}

function clearCanvas() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVector(ctx, v, color) {
  ctx.strokeStyle = color;
  ctx.beginPath();

  const centerX = 200;
  const centerY = 200;

  const scale = 20;
  const x = v.elements[0] * scale;
  const y = v.elements[1] * scale;

  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + x, centerY - y);
  ctx.stroke();
}

function handleDrawEvent() {
  clearCanvas();

  const x1 = parseFloat(document.getElementById('x-input').value);
  const y1 = parseFloat(document.getElementById('y-input').value);
  const x2 = parseFloat(document.getElementById('x2-input').value);
  const y2 = parseFloat(document.getElementById('y2-input').value);

  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
    alert("Please enter valid vector values.");
    return;
  }

  const v1 = new Vector3([x1, y1, 0]);
  const v2 = new Vector3([x2, y2, 0]);

  drawVector(ctx, v1, "red");
  drawVector(ctx, v2, "blue");
}


function handleDrawOperationEvent() {
  clearCanvas();

  const x1 = parseFloat(document.getElementById('x-input').value);
  const y1 = parseFloat(document.getElementById('y-input').value);
  const x2 = parseFloat(document.getElementById('x2-input').value);
  const y2 = parseFloat(document.getElementById('y2-input').value);

  const v1 = new Vector3([x1, y1, 0]);
  const v2 = new Vector3([x2, y2, 0]);

  drawVector(ctx, v1, "red");
  drawVector(ctx, v2, "blue");

  const operation = document.getElementById('operation-select').value;
  const scalar = parseFloat(document.getElementById('scalar-input').value);

  if ((operation === "mul" || operation === "div") && isNaN(scalar)) {
    alert("Please enter a valid scalar value.");
    return;
  }

  if (operation === "add") {
    drawVector(ctx, new Vector3([x1, y1, 0]).add(new Vector3([x2, y2, 0])), "green");
  } else if (operation === "sub") {
    drawVector(ctx, new Vector3([x1, y1, 0]).sub(new Vector3([x2, y2, 0])), "green");
  } else if (operation === "mul") {
    drawVector(ctx, new Vector3([x1, y1, 0]).mul(scalar), "green");
    drawVector(ctx, new Vector3([x2, y2, 0]).mul(scalar), "green");
  } else if (operation === "div") {
    drawVector(ctx, new Vector3([x1, y1, 0]).div(scalar), "green");
    drawVector(ctx, new Vector3([x2, y2, 0]).div(scalar), "green");
  } else if (operation === "magnitude") {
    console.log("Magnitude v1:", v1.magnitude());
    console.log("Magnitude v2:", v2.magnitude());
  } else if (operation === "normalize") {
    console.log("Magnitude v1:", v1.magnitude());
    console.log("Magnitude v2:", v2.magnitude());
    drawVector(ctx, v1.normalize(), "green");
    drawVector(ctx, v2.normalize(), "green");
  } else if (operation === "angle") {
    const angle = angleBetween(v1, v2);
    console.log("Angle:", angle);
  } else if (operation === "area") {
    const area = areaTriangle(v1, v2);
    console.log("Area of Triangle:", area);
  }
}

function angleBetween(v1, v2) {
  const dotProduct = Vector3.dot(v1, v2);
  const magV1 = v1.magnitude();
  const magV2 = v2.magnitude();
  const cosTheta = dotProduct / (magV1 * magV2);
  const angleRadians = Math.acos(cosTheta);
  const angleDegrees = angleRadians * (180 / Math.PI);
  return angleDegrees;
}

function areaTriangle(v1, v2) {
  const cross = Vector3.cross(v1, v2);
  return 0.5 * cross.magnitude();
}


