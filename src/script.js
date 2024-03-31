/* eslint no-console:0 consistent-return:0 */
"use strict";

// Global variables for program, position buffer, and attribute location
let program, positionBuffer, positionAttributeLocation;

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

function createLine(gl, program, positionAttributeLocation, positionBuffer, positions){
  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Use the program
  gl.useProgram(program);

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

  // Draw
  var primitiveType = gl.LINES;
  var count = positions.length / 2; // Number of vertices
  console.log("Drawing line with "+count+" vertices");
  console.log(positions);
  gl.drawArrays(primitiveType, 0, count);
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

var lines = [];

function redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines) {
  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Iterate over the lines array and redraw each line
  for (var i = 0; i < lines.length; i++) {
    createLine(gl, program, positionAttributeLocation, positionBuffer, lines[i]);
  }
}

function main() {
  // Get A WebGL context
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl", {antialias: true});
  if (!gl) {
    console.log("WebGL not supported, or context creation failed");
    return;
  }
  resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


  // Get the strings for our GLSL shaders
  var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
  var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;

  // create GLSL shaders, upload the GLSL source, compile the shaders
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  // Link the two shaders into a program
  program = createProgram(gl, vertexShader, fragmentShader);

  // look up where the vertex data needs to go.
  positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // Create a buffer for positions
  positionBuffer = gl.createBuffer();

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Listen for mouse clicks on the canvas
  var click = []; // Array to store click coordinates
  canvas.addEventListener("click", function(event){
    // let rect = canvas.getBoundingClientRect();
    let x = event.clientX - canvas.offsetLeft;
    let y = event.clientY - canvas.offsetTop;
    
    // Convert click coordinates to WebGL clip space
    x = (x / canvas.width) * 2 - 1;
    y = (y / canvas.height) * -2 + 1;

    console.log("Clicked at "+x+","+y);
    console.log("Canvas size: "+canvas.width+","+canvas.height);  
    // Store click coordinates
    // click.push({ x, y });

    gl.useProgram(program);
    var aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight;

    // Pass the aspect ratio to the vertex shader
    var aspectRatioLocation = gl.getUniformLocation(program, "u_aspectRatio");
    gl.uniform1f(aspectRatioLocation, aspectRatio);

    // Draw lines when two points are clicked
    if (click === null) {
      click = { x, y };
    } 
    // If this is the second click, draw the final line
    else {
      var positions = [
        click.x, click.y,
        x, y,
      ];
      lines.push(positions); // Add the line's coordinates to the array
      redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
      click = null; // Reset click variable
      console.log("Line drawn: " + positions);
    }
  });

  canvas.addEventListener("mousemove", function(event){
    // If there has been a first click, draw a temporary line
    if (click !== null) {
      let rect = canvas.getBoundingClientRect();
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;
      
      // Convert mouse coordinates to WebGL clip space
      x = (x / canvas.width) * 2 - 1;
      y = (y / canvas.height) * -2 + 1;

      // Update the last line in the lines array with the new mouse coordinates
      if (lines.length > 0) {
        lines[lines.length - 1] = [
          click.x, click.y,
          x, y,
        ];
      }

      // Clear the canvas
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Redraw the existing lines
      redrawLines(gl, program, positionAttributeLocation, positionBuffer, lines);
    }
  });
}

main();
