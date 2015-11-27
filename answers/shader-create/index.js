//This is a helper function to make it easier to get started.
//You should call this function once your shader is set up
var drawTriangle = require('./draw-triangle')
var fs = require('fs')

//Load the fragment/vertex shader sources
var FRAG_SRC = fs.readFileSync(__dirname + '/shader.frag', 'utf8')
var VERT_SRC = fs.readFileSync(__dirname + '/shader.vert', 'utf8')

//TODO: Create this shader in init
var fragShader, vertShader

// Run once at the beginning: use this to create
// and setup things to be used in your draw function.
exports.init = function(gl) {

  //TODO: Initialize the shader here
  //Create a fragment shader
  var fragShader = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fragShader, FRAG_SRC)
  gl.compileShader(fragShader)

  //Create a vertex shader
  var vertShader = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vertShader, VERT_SRC)
  gl.compileShader(vertShader)


  var program = gl.createProgram()
  gl.attachShader(program, fragShader)
  gl.attachShader(program, vertShader)
  gl.linkProgram(program)
  gl.useProgram(program)


}

// Run every frame: use this to draw things to the screen.
exports.draw = function(gl) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
  //Clear drawing buffer
  gl.clearColor(0,0,0,1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  //TODO: Bind the shader here

  //Now draw the triangle
  drawTriangle(gl)
}
