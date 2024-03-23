"use strict"
function createShader(gl, type, source){
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
 
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

let canvas = document.querySelector("#canvas");
var gl = canvas.getContext("webgl");
let vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
let fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
let program = createProgram(gl, vertexShader, fragmentShader);


let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
let positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
let positions = [
  0, 0,
  0, 0.5,
  0.7, 0,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
// gl.drawArrays(gl.TRIANGLES,0,3)
var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");
gl.enableVertexAttribArray(positionLoc);
 
var numComponents = 3;  // (x, y, z)
var type = gl.FLOAT;    // 32bit floating point values
var normalize = false;  // leave the values as they are
var offset = 0;         // start at the beginning of the buffer
var stride = 0;         // how many bytes to move to the next vertex
                        // 0 = use the correct stride for type and numComponents
 
gl.vertexAttribPointer(positionLoc, numComponents, type, normalize, stride, offset);


if (!gl) {
  console.log("hahaha")
}

// gl.enableVertexAttribArray(positionAttributeLocation);
// gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

// gl.clearColor(1,1,1,1);
// gl.clear(gl.COLOR_BUFFER_BIT);
// gl.drawArrays(gl.LINES, 0, 3); // Draw a line with 2 vertices
