
// FUNGSI POLYGON


function rotatePolygon(gl, positionBuffer, polygons, index, angle) {
    if (index !== -1) {
      // Calculate the centroid of the polygon
      var centroid = calculateCentroid(currentPolygon);
      
      // Ensure angle stays within 0 to 360 degrees
      angle %= 360;
      if (angle < 0) {
        angle += 360;
      }
  
      // Calculate the rotation matrix
      var radians = (angle * Math.PI) / 180;
      var cos = Math.cos(radians);
      var sin = Math.sin(radians);
  
      // Rotate each vertex around the centroid
      var rotatedPolygon = currentPolygon.map(function(vertex) {
        var x = vertex[0] - centroid[0];
        var y = vertex[1] - centroid[1];
        return [
          x * cos - y * sin + centroid[0],
          x * sin + y * cos + centroid[1]
        ];
      });
  
      console.log("Rotated polygon:", rotatedPolygon);
  
      drawPolygon(gl, positionBuffer, [rotatedPolygon]);
    }
  }
  
  function translatePolygon(gl, positionBuffer, polygons, index, dx, dy) {
    // Loop through each vertex of the polygon and translate it
    for (var i = 0; i < currentPolygon.length; i++) {
      currentPolygon[i][0] += dx; // Update x-coordinate
      currentPolygon[i][1] += dy; // Update y-coordinate
    }
  
    // Redraw the polygon with the updated positions
    redrawPolygons(gl, positionBuffer, [currentPolygon]);
  }
  
  function dilatePolygon(gl, positionBuffer, polygons, index, scale) {
    if (index !== -1) {
      // Calculate the centroid of the polygon
      var centroid = calculateCentroid(currentPolygon);
  
      // Scale each vertex outward or inward from the centroid
      var dilatedPolygon = currentPolygon.map(function(vertex) {
        var x = (vertex[0] - centroid[0]) * scale + centroid[0];
        var y = (vertex[1] - centroid[1]) * scale + centroid[1];
        return [x, y];
      });
  
      // Update currentPolygon with the dilated polygon vertices
      currentPolygon = dilatedPolygon;
  
      console.log("Dilated polygon:", dilatedPolygon);
  
      drawPolygon(gl, positionBuffer, [dilatedPolygon]);
    }
  }
  
  
  function redrawPolygons(gl, positionBuffer, polygons) {
    // gl.clear(gl.COLOR_BUFFER_BIT);
  
    polygons.forEach(function(vertices) {
        var positions = [];
        vertices.forEach(function(vertex) {
            var x = (vertex[0] / gl.canvas.width) * 2 - 1;
            var y = (vertex[1] / gl.canvas.height) * -2 + 1;
            positions.push(x, y);
        });
  
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
        var primitiveType = gl.TRIANGLE_FAN;
        var offset = 0;
        var count = positions.length / 2;
        gl.drawArrays(primitiveType, offset, count);
    });
  }
  
  
  function findNearestVertexIndex(polygons, x, y) {
    var threshold = 10; // Threshold distance for considering a vertex as "selected"
    for (var i = 0; i < polygons.length; i++) {
      for (var j = 0; j < polygons[i].length; j++) {
        var vertex = polygons[i][j];
        var distance = Math.sqrt(Math.pow(x - vertex[0], 2) + Math.pow(y - vertex[1], 2));
        if (distance < threshold) {
          return { polygonIndex: i, vertexIndex: j };
        }
      }
    }
    return -1;
  }
  
  function drawPolygon(gl, positionBuffer, polygons) {
    // gl.clear(gl.COLOR_BUFFER_BIT);
  
    polygons.forEach(function(vertices) {
      var positions = [];
      vertices.forEach(function(vertex) {
        var x = (vertex[0] / gl.canvas.width) * 2 - 1;
        var y = (vertex[1] / gl.canvas.height) * -2 + 1;
        positions.push(x, y);
      });
  
      // Create a new buffer for the polygon's positions
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
      var primitiveType = gl.TRIANGLE_FAN;
      var offset = 0;
      var count = positions.length / 2; // Number of vertices
  
      // Draw the polygon
      gl.drawArrays(primitiveType, offset, count);
    });
  }
  
  
  function addVertex(polygon, x, y, color) {
    polygon.push([x, y, color]);
  }
  
  function calculateCentroid(polygon) {
    var centroid = [0, 0];
    polygon.forEach(function(vertex) {
      centroid[0] += vertex[0];
      centroid[1] += vertex[1];
    });
    centroid[0] /= polygon.length;
    centroid[1] /= polygon.length;
    return centroid;
  }
  

  function animatePolygon(gl, positionBuffer, polygon, index, rotationAngle){
    var start = null;
    var totalRotation = 0;

    function animate(timestamp) {
        if (!start) start = timestamp;
        var progress = timestamp - start;

        // Update total rotation based on the progress
        totalRotation += rotationAngle * progress / 1000; // Convert to seconds

        // Draw squares with updated rotation
        rotatePolygon(gl, positionBuffer, polygon, index, totalRotation);
        if (continueAnimation) {
            requestId = requestAnimationFrame(animate);
        }
        else{
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

  function changeColorPoly(gl, positionBuffer, polygons, index, newColor) {
    for (var i = 0; i < polygons.length; i++) {
      if (i === index) {
        polygons[i][2] = newColor;
      }
    }

    // Redraw all polygons
    drawPolygon(gl, positionBuffer, polygons);
  }