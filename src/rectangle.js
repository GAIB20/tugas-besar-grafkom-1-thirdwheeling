
// FUNGSI RECTANGLE

function drawRectangles(gl, positionBuffer, rectangles, height, width, offsetX, offsetY) {
    // gl.clear(gl.COLOR_BUFFER_BIT); // Clear canvas before drawing
  
    rectangles.forEach(function (rect) {
      // Convert coordinates to WebGL space (-1 to 1)
      var positions = [
        rect.vert1[0], rect.vert1[1],
        rect.vert2[0], rect.vert2[1],
        rect.vert4[0], rect.vert4[1],
        rect.vert3[0], rect.vert3[1]
      ].map(function(val, index) {
        // Convert X coordinates
        if (index % 2 === 0) {
          return ((val + offsetX) / gl.canvas.width) * 2 - 1;
        }
        // Convert Y coordinates
        else {
          return (1 - (val + offsetY) / gl.canvas.height) * 2 - 1;
        }
      });
  
      // Scale the rectangle based on height and width
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
  
      // Update last rectangle position
      lastRectX = offsetX;
      lastRectY = offsetY;
      lastRectWidth = width;
      lastRectHeight = height;
    });
  }
  
  function moveRectangle(gl, positionBuffer, rectangles, index, newX, newY) {
    // Move the specified rectangle
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
    // Get the rectangle
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
  