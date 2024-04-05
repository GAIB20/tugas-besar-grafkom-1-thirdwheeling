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
let selectedVertexSquare = -1;
var selectedVertexRectIndex = null
var selectedVertexPolyIndex = null
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

  function updatePolygonVertex(){
    var vertexList = document.getElementById("vertexListPolygon");
    while (vertexList.firstChild) {
      vertexList.removeChild(vertexList.firstChild);
    }
    allPolygons.forEach(function(polygon, index) {
      console.log("rrr ", polygon)
      if(index==0){
        for(var i=0;i<polygon.length;i++){
          var option = document.createElement("option");
          option.value = i;
          option.textContent = "Vertex " + (i + 1); // Change this to display the shape's properties if you want
          vertexList.appendChild(option);
        }
      }
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
  var sideLength = Math.min(gl.canvas.width, gl.canvas.height);

  var left = (gl.canvas.width - sideLength) / 2;
  var bottom = (gl.canvas.height - sideLength) / 2;
  gl.viewport(left, bottom, gl.canvas.width, gl.canvas.height);

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
  colorLocation = gl.getUniformLocation(program, "u_color");
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
        console.log(positions)
        lines.push({ positions: positions, rotation: 0, color:[0, 0, 0, 1] }); // Add the line's coordinates and rotation to the array
        redrawLines(
          gl,
          program,
          positionAttributeLocation,
          positionBuffer,
          lines
        );
        updateVertexLineList();
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
        var newRect = { vert1: startPointRect, vert2 :[endPoint[0], startPointRect[1]] ,vert3: endPoint, vert4:[startPointRect[0], endPoint[1]],color: [0, 0, 0, 1]};
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
  
        var newSquare =  { vert1: startPointSqrt, vert2 :[endPointSqrt[0], startPointSqrt[1]] ,vert3: endPointSqrt, vert4:[startPointSqrt[0], endPointSqrt[1]], color: [0,0,0, 1]};
        squares.push(newSquare);
        lastIndex = squares.length - 1; // Update the index of the last drawn square
        drawSquares(gl, positionBuffer, squares, 0, 0, 0, 0);
        updateVertexSquareList();
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
          addVertex(currentPolygon, x, y,[0,0,0, 1]); 
          console.log(clickCount, currentPolygon);
          lastIndex = allPolygons.length - 1;
          console.log("lastIndex", lastIndex);
          drawPolygon(gl, positionBuffer, [currentPolygon]);
          console.log("lastVertex", lastVertex);
          console.log("lastVertexY", lastVertex.y);
          var isPolygonExsist = false;
          updatePolygonVertex();
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
            addVertex(currentPolygon, x, y, [0,0,0,1]); // Tambahkan sudut baru
            console.log("New angle added at (" + x + ", " + y + ")");
            console.log("Current polygon:", currentPolygon);
            drawPolygon(gl, positionBuffer, [currentPolygon]); // Gambar ulang shape dengan sudut baru
            updatePolygonVertex();
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
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawRectangles(gl, positionBuffer, rectangles, 1, 1, 0, 0);
    drawSquares(gl, positionBuffer, squares, 1, 0, 0, 0);
    updateVertexSquareList();
    drawPolygon(gl, positionBuffer, allPolygons);
    redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
    updateVertexLineList();
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
    var lineAttr = document.getElementById("lineAttribute")
    if(text=="Rectangle"){
      rectAttr.style.display = "block"
      squareAttr.style.display = "none"
      polyAttr.style.display = "none"
      lineAttr.style.display = "none"
      selectedRectIndex = index
    }else if(text=="Square"){
      squareAttr.style.display = "block"
      rectAttr.style.display = "none"
      polyAttr.style.display = "none"
      lineAttr.style.display = "none"
      selectedSquareIndex = index
    }else if(text=="Lines"){
      squareAttr.style.display = "none"
      rectAttr.style.display = "none"
      polyAttr.style.display = "none"
      lineAttr.style.display = "block"
      selectedLineIndex = index
    }else if(text=="Polygon"){
      rectAttr.style.display = "none"
      squareAttr.style.display = "none"
      polyAttr.style.display = "block"
      lineAttr.style.display = "none"
      selectedPolygonIndex = index
    }
    
  });

  // BUTTON BUTTON
  var saveButton = document.getElementById("saveButton");
  saveButton.addEventListener("click", function(event) {
    saveFile(event);
  });

  var loadButton = document.getElementById("loadButton");
  loadButton.addEventListener("change", function(event) {
    // select file to open
    loadFile(event,gl);
  });

  // MACAM MACAM SLIDER

  // PUNYA LINE
  var xSliderLine = document.getElementById("translateLineX");
  var ySliderLine = document.getElementById("translateLineY");
  var rotationSliderLine = document.getElementById("rotationLine");
  var dilatationSliderLine = document.getElementById("dilateLine");
  var animationLine = document.getElementById("animationLine");
  var stopAnimationLine = document.getElementById("stopAnimationLine");
  var colorPickerLine = document.getElementById("colorPickerLine");
  var dilateOneVertexLine = document.getElementById("dilateOneVertexLine");

  rotationSliderLine.addEventListener("input", function(event) {
    updateRotation(event, gl);
  });

  xSliderLine.addEventListener("input", function(event) {
    updateTranslationX(event, gl);
  });

  ySliderLine.addEventListener("input", function(event) {
    updateTranslationY(event, gl);
  });

  dilateOneVertexLine.addEventListener("input", function () {
    // Get the select element
    var vertexSelect = document.getElementById("vertexLineList");

    // Get the selected option
    var selectedOption = vertexSelect.options[vertexSelect.selectedIndex];

    // Split the value to extract line index and vertex index
    var indices = selectedOption.value.split("_");
    var lineIndex = parseInt(indices[0]);
    var vertexIndex = parseInt(indices[1]);

    // Check if the indices are valid
    if (isNaN(lineIndex) || isNaN(vertexIndex) || lineIndex < 0 || lineIndex >= lines.length || vertexIndex < 1 || vertexIndex > 2) {
        console.error('Invalid line or vertex index.');
        return;
    }

    // Get the dilation factor from the slider and convert it to a float
    var scaleFactor = parseFloat(dilateOneVertexLine.value);

    // If the slider allows only positive values, we need to handle negative values
    if (scaleFactor < 0) {
        // Invert the scale factor to ensure shrinking
        scaleFactor = 1 / Math.abs(scaleFactor);
    }

    // Call the dilation function
    dilateLineFromVertex(gl, positionBuffer, lines, lineIndex, vertexIndex, scaleFactor);
});



  colorPickerLine.addEventListener("input", function (event) {
    var color = event.target.value;
    console.log("Color:", color);
    var colorArray = hexToRgb(color);
    gl.uniform4f(colorLocation, colorArray.r, colorArray.g, colorArray.b, 1);
    changeColorLine(gl, positionBuffer, lines, selectedLineIndex, [colorArray.r, colorArray.g, colorArray.b, 1]);
  });

  // PUNYA RECTANGLE
  var heightSliderRect = document.getElementById("sliderHeightRect");
  var widthSliderRect = document.getElementById("sliderWidthRect");
  var xSliderRect = document.getElementById("translateRectangleX");
  var ySliderRect = document.getElementById("translateRectangleY");
  var rotationSliderRect = document.getElementById("rotationRectangle");
  var animationRect = document.getElementById("animationRectangle");
  var stopAnimationRect = document.getElementById("stopAnimationRectangle");
  var colorPickerRect = document.getElementById("colorPickerRect");
  var selectedVertexRect = document.getElementById("selectVertexRect");
  var sliderDilateRect = document.getElementById("vertexRect");

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

  animationRect.addEventListener("click", function (event) {
    animateRectangle(gl, positionBuffer, rectangles, selectedRectIndex, Math.PI / 180, 1000); // Rotate 1 degree per frame over 1000 milliseconds (1 second)
  });

  stopAnimationRect.addEventListener("click", function (event) {
    stopAnimation();
  });

  colorPickerRect.addEventListener("input", function (event) {
    var color = event.target.value;
    console.log("Color:", color);
    var colorArray = hexToRgb(color);
    gl.uniform4f(colorLocation, colorArray.r, colorArray.g, colorArray.b, 1);
    changeColorRect(gl, positionBuffer, rectangles, selectedRectIndex, [colorArray.r, colorArray.g, colorArray.b, 1]);
  });

  selectedVertexRect.addEventListener("click", function (event) {
    var vertex = event.target.value;
    console.log("Vertex:", vertex);
    selectedVertexRectIndex = parseInt(vertex);
  });
  sliderDilateRect.addEventListener("input", function (event) {
    var scaleFactor = parseFloat(event.target.value);
    // console.log("Scale Factor:", scaleFactor);
    dilateRectangle(gl, positionBuffer, rectangles, selectedRectIndex, selectedVertexRectIndex, scaleFactor);
  });


  //PUNYA SQUARE
  var xSliderSquare = document.getElementById("translateSquareX");
  var ySliderSquare = document.getElementById("translateSquareY");
  var rotationSliderSquare = document.getElementById("rotationSquare");
  var dilatationSliderSquare = document.getElementById("dilateSquare");
  var animationSquare = document.getElementById("animationSquare");
  var stopAnimationSquare = document.getElementById("stopAnimationSquare");
  var dilateOneVertex = document.getElementById("dilateOneVertex");
  var colorPickerSquare = document.getElementById("colorPickerSquare");
  xSliderSquare.addEventListener("input", function (event) {
      var x = parseFloat(event.target.value);
      console.log("X:", x);
      var deltaX = x;
      moveSquare(gl, positionBuffer, squares, selectedSquareIndex, deltaX, 0);
      // lastSquareX = x; 
  });
  
  ySliderSquare.addEventListener("input", function (event) {
      var y = parseFloat(event.target.value);
      console.log("Y:", y);
      var deltaY = y;
      moveSquare(gl, positionBuffer, squares, selectedSquareIndex, 0, deltaY);
      // lastSquareY = y; 
  });

  rotationSliderSquare.addEventListener("input", function (event) {
    var rotationAngle = parseFloat(event.target.value) * Math.PI / 180; // Convert degrees to radians
    console.log("Rotation Angle:", rotationAngle);
    drawSquares(gl, positionBuffer, squares, 0, 0, 0, rotationAngle);
    updateVertexSquareList();
  });


  dilatationSliderSquare.addEventListener("input", function (event) {
      var scaleFactor = parseFloat(event.target.value);
      console.log("Scale Factor:", scaleFactor);
      drawSquares(gl, positionBuffer, squares, scaleFactor, 0, 0, 0);
      updateVertexSquareList();

  });

  animationSquare.addEventListener("click", function (event) {
    animateSquare(gl, positionBuffer, squares, selectedSquareIndex, Math.PI / 180, 1000); // Rotate 1 degree per frame over 1000 milliseconds (1 second)
  });

  stopAnimationSquare.addEventListener("click", function (event) {
    stopAnimation();
  });

  dilateOneVertex.addEventListener("input", function () {
    // Get the select element
    var vertexSelect = document.getElementById("vertexSquareList");
  
    // Get the selected vertex index from the dropdown list
    var selectedVertexIndex = vertexSelect.value;
  
    // Get the square and vertex index from the vertexList
    var squareIndex = vertexList[selectedVertexIndex].squareIndex;
    var vertexIndex = vertexList[selectedVertexIndex].vertexIndex;
  
    // Check if the vertex index is valid
    if (vertexIndex < 1 || vertexIndex > 4) {
      console.error('Invalid vertex index. Must be between 1 and 4.');
      return;
    }
  
    // Get the dilation factor from the slider and convert it to a float
    var scaleFactor = parseFloat(dilateOneVertex.value);
  
    // If the slider allows only positive values, we need to handle negative values
    if (scaleFactor < 0) {
      // Invert the scale factor to ensure shrinking
      scaleFactor = 1 / Math.abs(scaleFactor);
    }
  
    // Call the dilation function
    dilateSquareFromVertex(gl, positionBuffer, squares, squareIndex, vertexIndex, scaleFactor);
  });
  

  colorPickerSquare.addEventListener("input", function (event) {
    var color = event.target.value;
    console.log("Color square:", color);
    console.log(selectedSquareIndex)
    var colorArray = hexToRgb(color);
    gl.uniform4f(colorLocation, colorArray.r, colorArray.g, colorArray.b, 1);
    changeColorSquare(gl, positionBuffer, squares, selectedSquareIndex, [colorArray.r, colorArray.g, colorArray.b, 1]);
  });

  //SLIDER POLYGON
  var sliderYPoly = document.getElementById("sliderYPoly");
  var sliderXPoly = document.getElementById("sliderXPoly");
  var sliderRotationPoly = document.getElementById("sliderRotationPoly");
  var sliderScalePoly = document.getElementById("sliderScalePoly");
  var animationPoly = document.getElementById("animationPoly");
  var stopAnimationPoly = document.getElementById("stopAnimationPoly");
  var colorPickerPoly = document.getElementById("colorPickerPoly");
  var deleteVertex = document.getElementById("deleteVertexButton");
  var selectedVertexPolygonIndex = document.getElementById("vertexListPolygon")
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
  animationPoly.addEventListener("click", function (event) {
    animatePolygon(gl, positionBuffer, polygons, selectedPolygonIndex, Math.PI / 180, 1000); // Rotate 1 degree per frame over 1000 milliseconds (1 second)
  });
  stopAnimationPoly.addEventListener("click", function (event) {
    stopAnimation();
  });
  colorPickerPoly.addEventListener("input", function (event) {
    var color = event.target.value;
    console.log("Color square:", color);
    console.log(selectedSquareIndex)
    var colorArray = hexToRgb(color);
    gl.uniform4f(colorLocation, colorArray.r, colorArray.g, colorArray.b, 1);
    console.log("ppppp ", allPolygons)
    changeColorPoly(gl, positionBuffer, allPolygons,0, [colorArray.r, colorArray.g, colorArray.b, 1]);
  });
  selectedVertexPolygonIndex.addEventListener("click", function(event) {
    var vertex = event.target.value;
    console.log("Vertex:", vertex);
    selectedVertexPolyIndex = parseInt(vertex);
  });
  deleteVertex.addEventListener("click", function(event) {
    console.log("Delete vertex");
    console.log(currentPolygon)
    if(currentPolygon.length > 3){
      currentPolygon.splice(selectedVertexPolyIndex, 1);
    }
    drawPolygon(gl, positionBuffer, [currentPolygon]);
    updatePolygonVertex();
  });


}

main();
