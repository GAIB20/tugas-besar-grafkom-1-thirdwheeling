/* eslint no-console:0 consistent-return:0 */
"use strict";

// Global variables for program, position buffer, and attribute location
let program, positionBuffer, positionAttributeLocation, resolutionLocation, colorLocation, translationLocation, rotationLocation, rotationAngle;
var lines = [];
var rectangles = [];
var squares = [];
var polygons = [];
var currentPolygon = [];
var allPolygons = [];
var selectedLineIndex = null
var selectedRectIndex = null
var selectedSquareIndex = null
let selectedPolygonIndex = -1;
let selectedVertexIndex = -1;
var lastVertex = { x: 0, y: 0 };

var lastRectX, lastRectY, lastRectWidth, lastRectHeight;

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}


function resizeCanvasToDisplaySize(canvas, scale) {
  scale = scale || 1;
  const newWidth = Math.floor(canvas.clientWidth * scale);
  const newHeight = Math.floor(canvas.clientHeight * scale);
  if (canvas.width !== newWidth || canvas.height !== newHeight) {
    canvas.width = newWidth;
    canvas.height = newHeight;
    return true;
  }
  return false;
}

function updateShapeList() {
  var shapeList = document.getElementById("shapeList");

  // Clear the list
  while (shapeList.firstChild) {
    shapeList.removeChild(shapeList.firstChild);
  }
  // Add an option for each shape
  lines.forEach(function(rect, index) {
    var option = document.createElement("option");
    option.value = index;
    option.textContent = "Lines " + (index + 1); // Change this to display the shape's properties if you want
    shapeList.appendChild(option);
  });

  rectangles.forEach(function(rect, index) {
    var option = document.createElement("option");
    option.value = index;
    option.textContent = "Rectangle " + (index + 1); // Change this to display the shape's properties if you want
    shapeList.appendChild(option);
  });

  squares.forEach(function(rect, index) {
    var option = document.createElement("option");
    option.value = index;
    option.textContent = "Square " + (index + 1); // Change this to display the shape's properties if you want
    shapeList.appendChild(option);
  });

  allPolygons.forEach(function(rect, index) {
    var option = document.createElement("option");
    option.value = index;
    option.textContent = "Polygon " + (index + 1); // Change this to display the shape's properties if you want
    shapeList.appendChild(option);
  });

  
}


function main() {
  // Get A WebGL context
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl", { antialias: true });
  if (!gl) {
    return;
  }

  
  resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.width);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Get the strings for our GLSL shaders
  var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
  var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;

  // create GLSL shaders, upload the GLSL source, compile the shaders
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  // Link the two shaders into a program
  var program = createProgram(gl, vertexShader, fragmentShader);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  var colorLocation = gl.getUniformLocation(program, "u_color");
  var translationLocation = gl.getUniformLocation(program, "u_translation");
  var rotationLocation = gl.getUniformLocation(program, "u_rotation");
  var aspectRatioLocation = gl.getUniformLocation(program, "u_aspectRatio");

  // Create a buffer and put rectangle vertices in it
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);
  var aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight;

  // Pass the aspect ratio to the vertex shader
  gl.uniform1f(aspectRatioLocation, aspectRatio);
  gl.uniform2f(translationLocation, 0, 0);
  gl.uniformMatrix2fv(rotationLocation, false, new Float32Array([1, 0, 0, 1]));

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset);

  var buttons = document.querySelectorAll(".buttonShape");
  var selectedShape = null;

  buttons.forEach(function(button) {
    button.addEventListener("click", function(event) {
      // Remove "selected" class from all buttons
      buttons.forEach(function(btn) {
        btn.classList.remove("selected");
      });

      // Add "selected" class to the clicked button
      this.classList.add("selected");

      // Log the text of the clicked button
      console.log("Clicked button:", this.textContent);
      selectedShape = this.textContent;
    });
  });

  

  // Listen for mouse clicks on the canvas
  var click = []; // Array to store click coordinates
  var isDrawingRect = false;
  var isDrawingSqrt = false;
  let isDrawingPoly = false; 
  var startPointRect = null;
  var startPointSqrt = null;
  var endPointSqrt = null;
  let clickCount = 0; 
  
  canvas.addEventListener("click", function(event){
    console.log("selectedShape: "+selectedShape)
    if(selectedShape === "Line"){
      console.log("Line selected");
      let x = event.clientX - canvas.offsetLeft;
      let y = event.clientY - canvas.offsetTop;
    
      // Convert click coordinates to WebGL clip space
      x = (x / canvas.width) * 2 - 1;
      y = (y / canvas.height) * -2 + 1;
    
      console.log("Clicked at " + x + "," + y);
      console.log("Canvas size: " + canvas.width + "," + canvas.height);
      // Store click coordinates
      // click.push({ x, y });
    
    
      // Draw lines when two points are clicked
      if (click === null) {
        click = { x, y };
      }
      else {
        var positions = [click.x, click.y, x, y];
        lines.push({ positions: positions, rotation: 0 }); // Add the line's coordinates and rotation to the array
        redrawLines(
          gl,
          program,
          positionAttributeLocation,
          positionBuffer,
          lines
        );
        click = null; // Reset click variable
        console.log("Line drawn: " + positions);
      }
    
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var positions = line.positions;
        var dx1 = positions[0] - x;
        var dy1 = positions[1] - y;
        var dx2 = positions[2] - x;
        var dy2 = positions[3] - y;
        // If the click is within 0.1 units of the line, select it
        if (Math.sqrt(dx1 * dx1 + dy1 * dy1) < 0.1 || Math.sqrt(dx2 * dx2 + dy2 * dy2) < 0.1) {
          selectedLineIndex = i;
          break;
        }
      }

      updateShapeList();
    }else if(selectedShape === "Rectangle"){
      console.log("Rectangle selected");
      

      // Variables to keep track of last rectangle position
      lastRectX = 0;
      lastRectY = 0;
      lastRectWidth = 0;
      lastRectHeight = 0;

      var lastIndex = -1;
      if (!isDrawingRect) {
        isDrawingRect = true;
        startPointRect = [event.clientX, event.clientY];
        console.log(isDrawingRect, startPointRect)
      } else {
        isDrawingRect = false;
        var endPoint = [event.clientX, event.clientY];
        var newRect = { vert1: startPointRect, vert2 :[endPoint[0], startPointRect[1]] ,vert3: endPoint, vert4:[startPointRect[0], endPoint[1]]};
        rectangles.push(newRect);
        console.log("Rectangle:", newRect);
        lastIndex = rectangles.length - 1; // Update the index of the last drawn rectangle
        drawRectangles(gl, positionBuffer, rectangles, 1, 1, 0, 0);
        updateShapeList();
      }
    }else if(selectedShape === "Square"){
      console.log("Square selected");
      if (!isDrawingSqrt) {
        isDrawingSqrt = true;
        startPointSqrt = [event.clientX, event.clientY];
      } else {
        isDrawingSqrt = false;
        var endPointSqrt = [event.clientX, event.clientY];
  
        // Calculate the width and height of the square
        var width = Math.abs(endPointSqrt[0] - startPointSqrt[0]);
        var height = Math.abs(endPointSqrt[1] - startPointSqrt[1]);
  
        // Make the width and height equal to form a square
        var size = Math.max(width, height); // Use max instead of min
  
        // Adjust the end point to form a square
        if (endPointSqrt[0] < startPointSqrt[0]) {
          endPointSqrt[0] = startPointSqrt[0] - size;
        } else {
          endPointSqrt[0] = startPointSqrt[0] + size;
        }
  
        if (endPointSqrt[1] < startPointSqrt[1]) {
          endPointSqrt[1] = startPointSqrt[1] - size;
        } else {
          endPointSqrt[1] = startPointSqrt[1] + size;
        }
  
        var newSquare =  { vert1: startPointSqrt, vert2 :[endPointSqrt[0], startPointSqrt[1]] ,vert3: endPointSqrt, vert4:[startPointSqrt[0], endPointSqrt[1]]};
        squares.push(newSquare);
        lastIndex = squares.length - 1; // Update the index of the last drawn square
        drawSquares(gl, positionBuffer, squares, 0, 0, 0, 0);
        updateShapeList();
      }
    }else if(selectedShape === "Polygon"){
      console.log("Polygon selected");
      var rect = canvas.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
    
      var lastIndex = -1;
      if (!isDrawingPoly) {
        console.log("isDrawingPoly", isDrawingPoly);
        if (clickCount < 3) { // Jika belum ada 3 klik, tambahkan titik baru
          console.log("currentPolygon", currentPolygon)
          addVertex(currentPolygon, x, y);
          console.log(clickCount, currentPolygon);
          lastIndex = allPolygons.length - 1;
          console.log("lastIndex", lastIndex);
          drawPolygon(gl, positionBuffer, [currentPolygon]);
          console.log("lastVertex", lastVertex);
          console.log("lastVertexY", lastVertex.y);
          var isPolygonExsist = false;
          for (var i = 0; i < allPolygons.length; i++) {
            var polygon = allPolygons[i];
            if (polygon === currentPolygon) {
              console.log("Polygon found at index", i);
              // Update polygon
              allPolygons[i] = currentPolygon;
              isPolygonExsist = true;
              lastIndex = i;
              break;
            }
            else {
              console.log("Polygon not found");
            }
          }
          if (!isPolygonExsist) {
            allPolygons.push(currentPolygon);
            lastIndex = allPolygons.length - 1;
            console.log("Polygon added at index", lastIndex);
          }
          console.log("allPolygons", allPolygons);
          lastIndex = currentPolygon.length - 1;
          clickCount++;
          updateShapeList();
        } else { 
          // Jika sudah ada 3 klik, tambahkan sudut pada shape yang sudah ada
            addVertex(currentPolygon, x, y); // Tambahkan sudut baru
            console.log("New angle added at (" + x + ", " + y + ")");
            console.log("Current polygon:", currentPolygon);
            drawPolygon(gl, positionBuffer, [currentPolygon]); // Gambar ulang shape dengan sudut baru

            // Gambar garis dari sudut terakhir ke titik yang baru ditambahkan
            gl.useProgram(program);
            var newVertices = [lastVertex, { x: x, y: y }];
            var newBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, newBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newVertices.flatMap(v => [v.x, v.y])), gl.STATIC_DRAW);

            var positionLoc = gl.getAttribLocation(program, "a_position");
            gl.enableVertexAttribArray(positionLoc);
            gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

            // gl.drawArrays(gl.LINES, 0, newVertices.length);

            // jika polygon yang sedang digambar hanya menambah sudut, maka tidak perlu menambahkan polygon baru
            
            var isPolygonExsist = false;
            for (var i = 0; i < allPolygons.length; i++) {
              var polygon = allPolygons[i];
              if (polygon === currentPolygon) {
                console.log("Polygon found at index", i);
                // Update polygon
                allPolygons[i] = currentPolygon;
                isPolygonExsist = true;
                lastIndex = i;
                break;
              }
              else {
                console.log("Polygon not found");
              }
            }
            if (!isPolygonExsist) {
              allPolygons.push(currentPolygon);
              lastIndex = allPolygons.length - 1;
              console.log("Polygon added at index", lastIndex);
            }

            // lastIndex = allPolygons.length - 1;
            console.log("allPolygons", allPolygons);
            console.log("lastIndex", lastIndex);
            updateShapeList();
            
            lastVertex = { x: x, y: y };
            clickCount++;
        }
      } else {
        isDrawingPoly = true;
        console.log("isDrawingPoly", isDrawingPoly);
        currentPolygon = [];
        clickCount = 0;
      }
    }
    // // redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
    // drawRectangles(gl, positionBuffer, rectangles, 1, 1, 0, 0);
    // drawSquares(gl, positionBuffer, squares, 1, 0, 0, 0);
  });

  var listShape = document.getElementById("shapeList");
  listShape.addEventListener("change", function(event) {
    var index = event.target.value;
    var text = event.target.options[event.target.selectedIndex].textContent;
    text = text.slice(0, -2);
    
  
    console.log("selected list index: " + index);
    console.log("selected list text: " + text);
    var rectAttr = document.getElementById("rectangleAttribute")
    var squareAttr = document.getElementById("squareAttribute")
    var polyAttr = document.getElementById("polygonAttribute")
    if(text=="Rectangle"){
      rectAttr.style.display = "block"
      squareAttr.style.display = "none"
      polyAttr.style.display = "none"
      selectedRectIndex = index
    }else if(text=="Square"){
      squareAttr.style.display = "block"
      rectAttr.style.display = "none"
      polyAttr.style.display = "none"
      selectedSquareIndex = index
    }else if(text=="Lines"){
      // rectAttr.style.display = "none"
      // squareAttr.style.display = "none"
      // selectedLineIndex = index
    }else if(text=="Polygon"){
      rectAttr.style.display = "none"
      squareAttr.style.display = "none"
      polyAttr.style.display = "block"
      selectedPolygonIndex = index
    }

    
    
  });

  // MACAM MACAM SLIDER

  // PUNYA RECTANGLE
  var heightSliderRect = document.getElementById("sliderHeightRect");
  var widthSliderRect = document.getElementById("sliderWidthRect");
  var xSliderRect = document.getElementById("translateRectangleX");
  var ySliderRect = document.getElementById("translateRectangleY");
  var rotationSliderRect = document.getElementById("rotationRectangle");
  // var colorPickerRect = document.getElementById("colorPicker");

  rotationSliderRect.addEventListener("input", function (event) {
      var rotation = event.target.value;
      console.log("Rotation:", rotation);
      rotateRectangle(gl, positionBuffer, rectangles, selectedRectIndex, rotation);
  });

  heightSliderRect.addEventListener("input", function (event) {    
      var height = event.target.value;
      console.log("Height:", height);
      changeHeight(gl, positionBuffer, rectangles, selectedRectIndex, height*100);
  });

  widthSliderRect.addEventListener("input", function (event) {    
      var width = event.target.value;
      console.log("Width:", width);
      changeWidth(gl, positionBuffer, rectangles, selectedRectIndex, width*100);
  });

  xSliderRect.addEventListener("input", function (event) {
      var x = parseFloat(event.target.value);
      console.log("X:", x);
      var deltaX = x - lastRectX;
      moveRectangle(gl, positionBuffer, rectangles, selectedRectIndex, deltaX*100, 0);
      lastRectX = x;
  });
  
  ySliderRect.addEventListener("input", function (event) {
      var y = parseFloat(event.target.value);
      console.log("Y:", y);
      var deltaY = y - lastRectY;
      moveRectangle(gl, positionBuffer, rectangles, selectedRectIndex, 0, deltaY*100);
      lastRectY = y;
  });


  //PUNYA SQUARE
  var xSliderSquare = document.getElementById("translateSquareX");
  var ySliderSquare = document.getElementById("translateSquareY");
  var rotationSliderSquare = document.getElementById("rotationSquare");
  var dilatationSliderSquare = document.getElementById("dilateSquare");

  xSliderSquare.addEventListener("input", function (event) {
      var x = parseFloat(event.target.value);
      console.log("X:", x);
      var deltaX = x;
      moveSquare(gl, positionBuffer, squares, selectedSquareIndex, deltaX * 100, 0);
      // lastSquareX = x; 
  });
  
  ySliderSquare.addEventListener("input", function (event) {
      var y = parseFloat(event.target.value);
      console.log("Y:", y);
      var deltaY = y;
      moveSquare(gl, positionBuffer, squares, selectedSquareIndex, 0, deltaY * 100);
      // lastSquareY = y; 
  });

  rotationSliderSquare.addEventListener("input", function (event) {
    var rotationAngle = parseFloat(event.target.value) * Math.PI / 180; // Convert degrees to radians
    console.log("Rotation Angle:", rotationAngle);
    drawSquares(gl, positionBuffer, squares, 0, 0, 0, rotationAngle);
  });


  dilatationSliderSquare.addEventListener("input", function (event) {
      var scaleFactor = parseFloat(event.target.value);
      console.log("Scale Factor:", scaleFactor);
      drawSquares(gl, positionBuffer, squares, scaleFactor, 0, 0, 0);
  });

  //SLIDER POLYGON
  var sliderYPoly = document.getElementById("sliderYPoly");
  var sliderXPoly = document.getElementById("sliderXPoly");
  var sliderRotationPoly = document.getElementById("sliderRotationPoly");
  var sliderScalePoly = document.getElementById("sliderScalePoly");

  sliderYPoly.addEventListener("input", function(event) {
    if(selectedPolygonIndex !== -1) {
      var y = parseFloat(event.target.value);
      console.log("y:", y);
  
      console.log("Last vertex Y:", lastVertex.y);
        var deltaY = y - lastVertex.y;
        console.log("deltaY ",  deltaY);
        console.log("currentPolygons", currentPolygon);
        translatePolygon(gl, positionBuffer, polygons, selectedPolygonIndex, 0, deltaY*0.5);
        console.log("translatePolygon by deltaY", deltaY*0.5);
        lastVertex.y = y; // Update last vertex Y position
    } else {
        console.log("Last vertex Y:", y);
    }
  });

  sliderXPoly.addEventListener("input", function(event) {
    if(selectedPolygonIndex !== -1) {
      var x = parseFloat(event.target.value);
      console.log("x:", x);
  
      console.log("Last vertex X:", lastVertex.x);
        var deltaX = x - lastVertex.x;
        console.log("Translating by ",  deltaX);
        translatePolygon(gl, positionBuffer, polygons, selectedPolygonIndex, deltaX*0.5, 0);
        console.log("translatePolygon");
        lastVertex.x = x; // Update last vertex X position
    } else {
        console.log("Last vertex X:", x);
    }});

  sliderRotationPoly.addEventListener("input", function(event) {
      var rotationAngle = parseFloat(event.target.value);
      console.log("Rotation angle:", rotationAngle);
      console.log("Last index:", selectedPolygonIndex);
      rotatePolygon(gl, positionBuffer, polygons, selectedPolygonIndex, rotationAngle);
  });

  sliderScalePoly.addEventListener("input", function(event) {
      var scale = parseFloat(event.target.value);
      console.log("Scale:", scale);
      dilatePolygon(gl, positionBuffer, polygons, selectedPolygonIndex, scale);
  });

}


// FUNGSI PUNYA LINE

function createLine(
  gl,
  program,
  positionAttributeLocation,
  positionBuffer,
  positions,
  rotation,
  translationX,
  translationY,
  scaleFactor
) {
  // Calculate centroid of the line's positions
  let centerX = 0;
  let centerY = 0;
  for (let i = 0; i < positions.length; i += 2) {
    centerX += positions[i];
    centerY += positions[i + 1];
  }
  centerX /= positions.length / 2;
  centerY /= positions.length / 2;

  // Apply translation and rotation to the positions
  let transformedPositions = [];
  for (let i = 0; i < positions.length; i += 2) {
    // Translate the point to the centroid
    let x = positions[i] - centerX;
    let y = positions[i + 1] - centerY;

    // Apply dilation
    x *= scaleFactor;
    y *= scaleFactor;

    // Apply rotation
    let cos = Math.cos(rotation);
    let sin = Math.sin(rotation);
    let rotatedX = x * cos - y * sin;
    let rotatedY = x * sin + y * cos;

    // Apply translation
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
  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Iterate over the lines array and redraw each line
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    createLine(
      gl,
      program,
      positionAttributeLocation,
      positionBuffer,
      line.positions,
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
    currentLine.positions[0] += deltaX;
    currentLine.positions[2] += deltaX;
    currentLine.translationX = translationX;
  }
  redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
}

function updateTranslationY(event, gl) {
  var translationY = parseFloat(event.target.value);
  if (lines.length > 0) {
    var currentLine = lines[lines.length - 1];
    var deltaY = translationY - (currentLine.positions[1] + currentLine.positions[3]) / 2;
    currentLine.positions[1] += deltaY;
    currentLine.positions[3] += deltaY;
    currentLine.translationY = translationY;
  }
  redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
}

function updateDilatation(event, gl, scaleFactor) {
  if (lines.length > 0) {
    var currentLine = lines[lines.length - 1];
    var centerX = (currentLine.positions[0] + currentLine.positions[2]) / 2;
    var centerY = (currentLine.positions[1] + currentLine.positions[3]) / 2;
    var x = currentLine.positions[0] - centerX;
    var y = currentLine.positions[1] - centerY;
    var dilatedX = x * scaleFactor;
    var dilatedY = y * scaleFactor;
    currentLine.positions[0] = dilatedX + centerX;
    currentLine.positions[1] = dilatedY + centerY;
    x = currentLine.positions[2] - centerX;
    y = currentLine.positions[3] - centerY;
    dilatedX = x * scaleFactor;
    dilatedY = y * scaleFactor;
    currentLine.positions[2] = dilatedX + centerX;
    currentLine.positions[3] = dilatedY + centerY;
  }
  redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines, scaleFactor);
}

function updateRotation(event, gl) {
  rotationAngle = parseInt(event.target.value) * Math.PI / 180; // Convert degrees to radians
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

// FUNGSI RECTANGLE

function drawRectangles(gl, positionBuffer, rectangles, height, width, offsetX, offsetY) {
  gl.clear(gl.COLOR_BUFFER_BIT); // Clear canvas before drawing

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


// FUNGSI SQUARE
function drawSquares(gl, positionBuffer, squares, scaleFactor, offsetX, offsetY, rotation) {
  gl.clear(gl.COLOR_BUFFER_BIT); // Clear canvas before drawing

  squares.forEach(function (square, index) {
      var x1 = square.vert1[0] - offsetX;
      var y1 = square.vert1[1] - offsetY;
      var x2 = square.vert2[0] - offsetX;
      var y2 = square.vert2[1] - offsetY;
      var x3 = square.vert3[0] - offsetX;
      var y3 = square.vert3[1] - offsetY;
      var x4 = square.vert4[0] - offsetX;
      var y4 = square.vert4[1] - offsetY;

      // Calculate the center of the square
      var centerX = (x1 + x2) / 2;
      var centerY = (y1 + y2) / 2;

      // Apply rotation around the center of the square
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

      // Apply dilation
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

      // Translate back
      rotatedX1 += offsetX;
      rotatedY1 += offsetY;
      rotatedX2 += offsetX;
      rotatedY2 += offsetY;
      rotatedX3 += offsetX;
      rotatedY3 += offsetY;
      rotatedX4 += offsetX;
      rotatedY4 += offsetY;

      // Convert coordinates to WebGL space (-1 to 1)
      var squareX1 = (rotatedX1 / gl.canvas.width) * 2 - 1;
      var squareY1 = (1 - rotatedY1 / gl.canvas.height) * 2 - 1;
      var squareX2 = (rotatedX2 / gl.canvas.width) * 2 - 1;
      var squareY2 = (1 - rotatedY2 / gl.canvas.height) * 2 - 1;
      var squareX3 = (rotatedX3 / gl.canvas.width) * 2 - 1;
      var squareY3 = (1 - rotatedY3 / gl.canvas.height) * 2 - 1;
      var squareX4 = (rotatedX4 / gl.canvas.width) * 2 - 1;
      var squareY4 = (1 - rotatedY4 / gl.canvas.height) * 2 - 1;

      var positions = [
          squareX1, squareY1,
          squareX2, squareY2,
          squareX4, squareY4,
          squareX3, squareY3,
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
  gl.clear(gl.COLOR_BUFFER_BIT);

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
  gl.clear(gl.COLOR_BUFFER_BIT);

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


function addVertex(polygon, x, y) {
  polygon.push([x, y]);
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


main();
