
// FUNGSI RECTANGLE

function drawRectangles(gl, positionBuffer, rectangles, height, width, offsetX, offsetY) {
    // gl.clear(gl.COLOR_BUFFER_BIT); // Clear canvas before drawing
  
    rectangles.forEach(function (rect) {
      gl.uniform4fv(colorLocation, rect.color);
      var positions = [
        rect.vert1[0], rect.vert1[1],
        rect.vert2[0], rect.vert2[1],
        rect.vert4[0], rect.vert4[1],
        rect.vert3[0], rect.vert3[1]
      ].map(function(val, index) {
        if (index % 2 === 0) {
          return ((val + offsetX) / gl.canvas.width) * 2 - 1;
        }
        else {
          return (1 - (val + offsetY) / gl.canvas.height) * 2 - 1;
        }
      });
      for (let i = 0; i < positions.length; i++) {
        if (i % 2 === 0) positions[i] *= width;
        else positions[i] *= height;
      }
  
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
      // draw
      var primitiveType = gl.TRIANGLE_STRIP;
      var offset = 0;
      var count = 4;
      gl.drawArrays(primitiveType, offset, count);

      lastRectX = offsetX;
      lastRectY = offsetY;
      lastRectWidth = width;
      lastRectHeight = height;
    });
  }
  
  function moveRectangle(gl, positionBuffer, rectangles, index, newX, newY) {
    var rect = rectangles[index];
    rect.vert1[0] += newX;
    rect.vert2[0] += newX;
    rect.vert3[0] += newX;
    rect.vert4[0] += newX;
    rect.vert1[1] += newY;
    rect.vert2[1] += newY;
    rect.vert3[1] += newY;
    rect.vert4[1] += newY;
  
    // Redraw all rectangles
    drawRectangles(gl, positionBuffer, rectangles, 1, 1, 0, 0);
  }
  
  function rotateRectangle(gl, positionBuffer, rectangles, index, angleInDegrees) {
    var rect = rectangles[index];
    var angleInRadians = angleInDegrees * Math.PI / 180;
    var cos = Math.cos(angleInRadians);
    var sin = Math.sin(angleInRadians);
  
    var centerX = (rect.vert1[0] + rect.vert3[0]) / 2;
    var centerY = (rect.vert1[1] + rect.vert3[1]) / 2;
  
    var vertices = [rect.vert1, rect.vert2, rect.vert4, rect.vert3];
    var newVertices = vertices.map(function(vertex) {
      var newX = (vertex[0] - centerX) * cos - (vertex[1] - centerY) * sin + centerX;
      var newY = (vertex[0] - centerX) * sin + (vertex[1] - centerY) * cos + centerY;
      return [newX, newY];
    });
  
    rect.vert1 = newVertices[0];
    rect.vert2 = newVertices[1];
    rect.vert3 = newVertices[3];
    rect.vert4 = newVertices[2];
  
    // Redraw all rectangles
    drawRectangles(gl, positionBuffer, rectangles, 1, 1, 0, 0);
  }
  
  function changeWidth(gl, positionBuffer, rectangles, index, newWidth) {
    var rect = rectangles[index];
  
    // Calculate the scale factor
    var midpoint = (rect.vert1[0] + rect.vert3[0]) / 2;
    rect.vert1[0] = midpoint - newWidth;
    rect.vert2[0] = midpoint + newWidth;
    rect.vert3[0] = midpoint + newWidth;
    rect.vert4[0] = midpoint - newWidth;
  
  
    // Redraw all rectangles
    drawRectangles(gl, positionBuffer, rectangles, 1, 1, 0, 0);
  }
  
  function changeHeight(gl, positionBuffer, rectangles, index, newHeight) {
    var rect = rectangles[index];
  
    // Calculate the scale factor
    var midpoint = (rect.vert1[1] + rect.vert3[1]) / 2;
    rect.vert1[1] = midpoint - newHeight;
    rect.vert2[1] = midpoint - newHeight;
    rect.vert3[1] = midpoint + newHeight;
    rect.vert4[1] = midpoint + newHeight;
  
    // Redraw all rectangles
    drawRectangles(gl, positionBuffer, rectangles, 1, 1, 0, 0);
  }
  
  var requestId = null;
  var continueAnimation = true;
  
  function animateRectangle(gl, positionBuffer, rectangles, index, rotationAngle) {
    var start = null;
    var totalRotation = 0;
  
    function animate(timestamp) {
      if (!start) start = timestamp;
      var progress = timestamp - start;

      totalRotation += rotationAngle * progress / 1000;

      rotateRectangle(gl, positionBuffer, rectangles, index, totalRotation);
  
      // Continue the animation if the flag is set
      if (continueAnimation) {
        requestId = requestAnimationFrame(animate);
      } else {
        // Animation stopped
        requestId = null;
      }
    }
  
    // Start the animation
    requestId = requestAnimationFrame(animate);
  }
  
  // To stop the animation
  function stopAnimation() {
    continueAnimation = false;
    if (requestId) {
      cancelAnimationFrame(requestId);
      requestId = null;
    }
  }
  
  function changeColorRect(gl, positionBuffer, rectangles, index, newColor) {
    var rect = rectangles[index];
    rect.color = newColor;
    console.log("Color:", newColor);
  
    // Redraw all rectangles
    drawRectangles(gl, positionBuffer, rectangles, 1, 1, 0, 0);
  }

  function dilateRectangle(gl, positionBuffer, rectangles, index, vertexIndex, scaleFactor) {
    var rect = rectangles[index];

  var centerVertex = rect['vert' + vertexIndex];

  for (var i = 1; i <= 4; i++) {
    if (i === vertexIndex) continue;

    var vertex = rect['vert' + i];

    var directionX = vertex[0] - centerVertex[0];
    var directionY = vertex[1] - centerVertex[1];

    var scaledDirectionX = directionX * scaleFactor;
    var scaledDirectionY = directionY * scaleFactor;

    var newVertexX = centerVertex[0] + scaledDirectionX;
    var newVertexY = centerVertex[1] + scaledDirectionY;

    vertex[0] = newVertexX;
    vertex[1] = newVertexY;
  }


    // Redraw all rectangles
    drawRectangles(gl, positionBuffer, rectangles, 1, 1, 0, 0);
  }

  

  