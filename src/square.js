// FUNGSI SQUARE
function drawSquares(
  gl,
  positionBuffer,
  squares,
  scaleFactor,
  offsetX,
  offsetY,
  rotation
) {
  // gl.clear(gl.COLOR_BUFFER_BIT); // Clear canvas before drawing

  squares.forEach(function (square, index) {
    var x1 = square.vert1[0] - offsetX;
    var y1 = square.vert1[1] - offsetY;
    var x2 = square.vert2[0] - offsetX;
    var y2 = square.vert2[1] - offsetY;
    var x3 = square.vert3[0] - offsetX;
    var y3 = square.vert3[1] - offsetY;
    var x4 = square.vert4[0] - offsetX;
    var y4 = square.vert4[1] - offsetY;
    gl.uniform4fv(colorLocation, square.color);

    var centerX = (x1 + x2) / 2;
    var centerY = (y1 + y2) / 2;

    var cos = Math.cos(rotation);
    var sin = Math.sin(rotation);
    var rotatedX1 = centerX + (x1 - centerX) * cos - (y1 - centerY) * sin;
    var rotatedY1 = centerY + (x1 - centerX) * sin + (y1 - centerY) * cos;
    var rotatedX2 = centerX + (x2 - centerX) * cos - (y2 - centerY) * sin;
    var rotatedY2 = centerY + (x2 - centerX) * sin + (y2 - centerY) * cos;
    var rotatedX3 = centerX + (x3 - centerX) * cos - (y3 - centerY) * sin;
    var rotatedY3 = centerY + (x3 - centerX) * sin + (y3 - centerY) * cos;
    var rotatedX4 = centerX + (x4 - centerX) * cos - (y4 - centerY) * sin;
    var rotatedY4 = centerY + (x4 - centerX) * sin + (y4 - centerY) * cos;

    if (index === squares.length - 1) {
      rotatedX1 = centerX + (rotatedX1 - centerX) * scaleFactor;
      rotatedX2 = centerX + (rotatedX2 - centerX) * scaleFactor;
      rotatedX3 = centerX + (rotatedX3 - centerX) * scaleFactor;
      rotatedX4 = centerX + (rotatedX4 - centerX) * scaleFactor;
      rotatedY1 = centerY + (rotatedY1 - centerY) * scaleFactor;
      rotatedY2 = centerY + (rotatedY2 - centerY) * scaleFactor;
      rotatedY3 = centerY + (rotatedY3 - centerY) * scaleFactor;
      rotatedY4 = centerY + (rotatedY4 - centerY) * scaleFactor;
    }

    rotatedX1 += offsetX;
    rotatedY1 += offsetY;
    rotatedX2 += offsetX;
    rotatedY2 += offsetY;
    rotatedX3 += offsetX;
    rotatedY3 += offsetY;
    rotatedX4 += offsetX;
    rotatedY4 += offsetY;

    var squareX1 = (rotatedX1 / gl.canvas.width) * 2 - 1;
    var squareY1 = (1 - rotatedY1 / gl.canvas.height) * 2 - 1;
    var squareX2 = (rotatedX2 / gl.canvas.width) * 2 - 1;
    var squareY2 = (1 - rotatedY2 / gl.canvas.height) * 2 - 1;
    var squareX3 = (rotatedX3 / gl.canvas.width) * 2 - 1;
    var squareY3 = (1 - rotatedY3 / gl.canvas.height) * 2 - 1;
    var squareX4 = (rotatedX4 / gl.canvas.width) * 2 - 1;
    var squareY4 = (1 - rotatedY4 / gl.canvas.height) * 2 - 1;

    var positions = [
      squareX1,
      squareY1,
      squareX2,
      squareY2,
      squareX4,
      squareY4,
      squareX3,
      squareY3,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    // draw
    var primitiveType = gl.TRIANGLE_STRIP;
    var offset = 0;
    var count = 4;
    gl.drawArrays(primitiveType, offset, count);
  });
}

function moveSquare(gl, positionBuffer, squares, index, newX, newY) {
  // Move the specified square
  var square = squares[index];
  square.vert1[0] += newX;
  square.vert2[0] += newX;
  square.vert3[0] += newX;
  square.vert4[0] += newX;
  square.vert1[1] += newY;
  square.vert2[1] += newY;
  square.vert3[1] += newY;
  square.vert4[1] += newY;

  // Redraw all squares
  drawSquares(gl, positionBuffer, squares, 1, 0, 0, 0); // scaleFactor is set to 1
}

var requestId = null;

var requestId = null;
var continueAnimation = true;

function animateSquare(gl, positionBuffer, squares, index, rotationAngle) {
  var start = null;
  var totalRotation = 0;

  function animate(timestamp) {
    if (!start) start = timestamp;
    var progress = timestamp - start;

    totalRotation += rotationAngle * progress / 1000; // Convert to seconds

    drawSquares(gl, positionBuffer, squares, 1, 0, 0, totalRotation);

    if (continueAnimation) {
      requestId = requestAnimationFrame(animate);
    } else {
      requestId = null;
    }
  }

  requestId = requestAnimationFrame(animate);
}

function stopAnimation() {
  continueAnimation = false;
  if (requestId) {
    cancelAnimationFrame(requestId);
    requestId = null;
  }
}
function changeColorSquare(gl, positionBuffer, squares, index, newColor) {
  // Get the rectangle
  var square = squares[index];
  console.log("ssssss ",square)
  square.color = newColor;
  console.log("Color:", newColor);

  drawSquares(gl, positionBuffer, squares, 1, 0, 0, 0);
}


function scaleVertex(square, vertexIndex, scaleFactor) {
  if (vertexIndex < 1 || vertexIndex > 4) {
    console.error('Invalid vertex index. Must be between 1 and 4.');
    return;
  }

  var vertex = square['vert' + vertexIndex];

  var centerX = (square.vert1[0] + square.vert2[0] + square.vert3[0] + square.vert4[0]) / 4;
  var centerY = (square.vert1[1] + square.vert2[1] + square.vert3[1] + square.vert4[1]) / 4;

  var directionX = vertex[0] - centerX;
  var directionY = vertex[1] - centerY;

  var scaledDirectionX = directionX * scaleFactor;
  var scaledDirectionY = directionY * scaleFactor;

  var newVertexX = centerX + scaledDirectionX;
  var newVertexY = centerY + scaledDirectionY;

  vertex[0] = newVertexX;
  vertex[1] = newVertexY;
}

function updateVertexSquareList() {
  vertexList = [];

  var vertexSelect = document.getElementById("vertexSquareList");

  vertexSelect.innerHTML = '';

  squares.forEach(function (square, squareIndex) {
    [square.vert1, square.vert2, square.vert3, square.vert4].forEach(function (vertex, vertexIndex) {
      vertexList.push({ squareIndex: squareIndex, vertexIndex: vertexIndex, vertex: vertex });

      var option = document.createElement("option");
      option.value = vertexList.length - 1; // The value is the index of the vertex in vertexList
      option.textContent = "Square " + (squareIndex + 1) + ", Vertex " + (vertexIndex + 1);
      vertexSelect.appendChild(option);
    });
  });
}

function dilateSquareFromVertex(gl, positionBuffer, squares, squareIndex, vertexIndex, scaleFactor) {
  if (vertexIndex < 1 || vertexIndex > 4) {
    console.error('Invalid vertex index. Must be between 1 and 4.');
    return;
  }

  var square = squares[squareIndex];

  var centerVertex = square['vert' + vertexIndex];

  for (var i = 1; i <= 4; i++) {
    if (i === vertexIndex) continue;

    var vertex = square['vert' + i];

    var directionX = vertex[0] - centerVertex[0];
    var directionY = vertex[1] - centerVertex[1];

    var scaledDirectionX = directionX * scaleFactor;
    var scaledDirectionY = directionY * scaleFactor;

    var newVertexX = centerVertex[0] + scaledDirectionX;
    var newVertexY = centerVertex[1] + scaledDirectionY;

    vertex[0] = newVertexX;
    vertex[1] = newVertexY;
  }

  drawSquares(gl, positionBuffer, squares, 1, 0, 0, 0); // scaleFactor is set to 1
}
