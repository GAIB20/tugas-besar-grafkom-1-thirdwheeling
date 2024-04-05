
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

function loadFile(event, gl){
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      var contents = e.target.result;
      var data = JSON.parse(contents);
      lines = data.lines;
      rectangles = data.rectangles;
      squares = data.squares;
      allPolygons = data.polygons;
      redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
      drawRectangles(gl, positionBuffer, rectangles, 1, 1, 0, 0);
      drawSquares(gl, positionBuffer, squares, 1, 0, 0, 0);
      drawPolygon(gl, positionBuffer, allPolygons);
      updateShapeList();
    };
    reader.readAsText(file);
}

function saveFile(event){
    var saveData = {
        lines: lines,
        rectangles: rectangles,
        squares: squares,
        polygons: allPolygons
      };
      var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saveData));
      var a = document.createElement("a");
      a.href = "data:" + data;
      a.download = "data.json";
      a.click();
}

function hexToRgb(hex) {
  var bigint = parseInt(hex.substring(1), 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}
