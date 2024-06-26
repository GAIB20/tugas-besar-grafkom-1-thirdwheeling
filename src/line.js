function createLine(
    gl,
    program,
    positionAttributeLocation,
    positionBuffer,
    positions,
    color,
    rotation,
    translationX,
    translationY,
    scaleFactor
  ) {
    let centerX = 0;
    let centerY = 0;
    for (let i = 0; i < positions.length; i += 2) {
      centerX += positions[i];
      centerY += positions[i + 1];
    }
    centerX /= positions.length / 2;
    centerY /= positions.length / 2;
    gl.uniform4fv(colorLocation, color);

    
  
    let transformedPositions = [];
    for (let i = 0; i < positions.length; i += 2) {
      let x = positions[i] - centerX;
      let y = positions[i + 1] - centerY;
  
      x *= scaleFactor;
      y *= scaleFactor;
  
      let cos = Math.cos(rotation);
      let sin = Math.sin(rotation);
      let rotatedX = x * cos - y * sin;
      let rotatedY = x * sin + y * cos;
  
      rotatedX += centerX + translationX;
      rotatedY += centerY + translationY;
  
      transformedPositions.push(rotatedX, rotatedY);
    }
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(transformedPositions), gl.STATIC_DRAW);
  
    // Draw
    gl.drawArrays(gl.LINES, 0, positions.length / 2);
  }
  
  function redrawLines(
    gl,
    program,
    positionAttributeLocation,
    positionBuffer,
    lines, scaleFactor
  ) {
    // gl.clear(gl.COLOR_BUFFER_BIT);
  
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      createLine(
        gl,
        program,
        positionAttributeLocation,
        positionBuffer,
        line.positions,
        line.color,
        line.rotation || 0,
        line.translationX || 0,
        line.translationY || 0,
        scaleFactor || 1
      );
    }
  }
  
  
  
  function updateTranslationX(event, gl) {
    var translationX = parseFloat(event.target.value);
    if (lines.length > 0) {
      var currentLine = lines[lines.length - 1];
      var deltaX = translationX - (currentLine.positions[0] + currentLine.positions[2]) / 2;
      for (var i = 0; i < currentLine.positions.length; i += 2) {
        currentLine.positions[i] += deltaX;
      }
      currentLine.translationX = translationX;
    }
    redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
  }
  
  function updateTranslationY(event, gl) {
    var translationY = parseFloat(event.target.value);
    if (lines.length > 0) {
      var currentLine = lines[lines.length - 1];
      var deltaY = translationY - (currentLine.positions[1] + currentLine.positions[3]) / 2;
      for (var i = 1; i < currentLine.positions.length; i += 2) {
        currentLine.positions[i] += deltaY;
      }
      currentLine.translationY = translationY;
    }
    redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
  }
  
  function updateDilatation(event, gl) {
    var scaleFactor = parseFloat(event.target.value);
    if (lines.length > 0) {
      var currentLine = lines[lines.length - 1];
      var centerX = (currentLine.positions[0] + currentLine.positions[2]) / 2;
      var centerY = (currentLine.positions[1] + currentLine.positions[3]) / 2;
      for (var i = 0; i < currentLine.positions.length; i += 2) {
        var x = currentLine.positions[i] - centerX;
        var y = currentLine.positions[i + 1] - centerY;
        var dilatedX = x * scaleFactor;
        var dilatedY = y * scaleFactor;
        currentLine.positions[i] = dilatedX + centerX;
        currentLine.positions[i + 1] = dilatedY + centerY;
      }
    }
    redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
  }
  
  function updateRotation(event, gl) {
    rotationAngle = parseInt(event.target.value) * Math.PI / 180; 
    if (lines.length > 0) {
      var currentLine = lines[lines.length - 1];
      var centerX = (currentLine.positions[0] + currentLine.positions[2]) / 2;
      var centerY = (currentLine.positions[1] + currentLine.positions[3]) / 2;
      var x = currentLine.positions[0] - centerX;
      var y = currentLine.positions[1] - centerY;
      var cos = Math.cos(rotationAngle);
      var sin = Math.sin(rotationAngle);
      var rotatedX = x * cos - y * sin;
      var rotatedY = x * sin + y * cos;
      currentLine.positions[0] = rotatedX + centerX;
      currentLine.positions[1] = rotatedY + centerY;
      x = currentLine.positions[2] - centerX;
      y = currentLine.positions[3] - centerY;
      rotatedX = x * cos - y * sin;
      rotatedY = x * sin + y * cos;
      currentLine.positions[2] = rotatedX + centerX;
      currentLine.positions[3] = rotatedY + centerY;
      currentLine.rotation = rotationAngle;
    }
    redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
  }

  function animateLine(gl, positionBuffer, lines, program, positionAttributeLocation, scaleFactor) {
    var start = null;
    var speed = 0.01;
    var animate = function (timestamp) {
      if (!start) start = timestamp;
      var progress = timestamp - start;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        line.rotation = progress * speed;
      }
      redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines, scaleFactor);
      window.requestAnimationFrame(animate);
    };
    window.requestAnimationFrame(animate);
  }

  function stopAnimation() {
    continueAnimation = false;
    if (requestId) {
      cancelAnimationFrame(requestId);
      requestId = null;
    }
  }
  function changeColorLine(gl, positionBuffer, lines, index, newColor) {
    var line = lines[index];
    line.color = newColor;
    console.log("Color:", newColor);
  
    redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines, 1);
  }

  function updateVertexLineList(){
    var vertexLineList = document.getElementById("vertexLineList");
    vertexLineList.innerHTML = "";
    for (var i = 0; i < lines.length; i++) {
        for (var j = 1; j <= 2; j++) {
            var vertexLine = document.createElement("option");
            vertexLine.innerHTML = "Line " + (i + 1) + ", Vertex " + j;
            vertexLine.value = i + "_" + j; 
            vertexLineList.appendChild(vertexLine);
        }
    }
}


function dilateLineFromVertex(gl, positionBuffer, lines, index, vertexIndex, scaleFactor) {
  var line = lines[index];
  var vertexPositionIndex = (vertexIndex - 1) * 2; 

  var vertexX = line.positions[vertexPositionIndex];
  var vertexY = line.positions[vertexPositionIndex + 1];

  for (var i = 0; i < line.positions.length; i += 2) {
      var deltaX = line.positions[i] - vertexX;
      var deltaY = line.positions[i + 1] - vertexY;

      deltaX *= scaleFactor;
      deltaY *= scaleFactor;

      line.positions[i] = deltaX + vertexX;
      line.positions[i + 1] = deltaY + vertexY;
  }

  redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
}
