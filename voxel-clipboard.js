var Vooxel = require('./Voxel')

module.exports = Clipboard

function Clipboard(game, opts) {
  if (!(this instanceof Clipboard)) return new Clipboard(game, opts);
  this.game = game || {}
  this.opts = opts || {}
  this.dims = []
  this.data = []
}

Clipboard.prototype.copy = function (start, end) {
  if (!start || !end) {
    console.log("copy failed: missing data")
    return;
  }
  console.log("Copying selection from " + start + " to " + end)
  
  var x_min = Math.min(start[0], end[0])
  var y_min = Math.min(start[1], end[1])
  var z_min = Math.min(start[2], end[2])

  // dimensions
  this.dims[0] = Math.abs(start[0] - end[0]) + 1
  this.dims[1] = Math.abs(start[1] - end[1]) + 1
  this.dims[2] = Math.abs(start[2] - end[2]) + 1

  var newSelectionData = []
  var index = 0

  for (var i = 0; i < this.dims[0]; i++) {
    for (var j = 0; j < this.dims[1]; j++) {
      for (var k = 0; k < this.dims[2]; k++) {
        // store voxel block material index, 0 for none
        var material = this.game.getBlock([x_min + i, y_min + j, z_min + k])
        newSelectionData[index++] = new Vooxel([i, j, k], material)
      }
    }
  }
  this.data = newSelectionData
}

Clipboard.prototype.paste = function (position, selection) {
  if (!this.data || (!position && !selection)) {
    console.log("paste failed: missing required data")
    return;
  }
  if (!position) { // derive placement position from selection volume
     var x_min = Math.min(selection.start[0], selection.end[0])
     var y_min = Math.min(selection.start[1], selection.end[1])
     var z_min = Math.min(selection.start[2], selection.end[2])
     position = [x_min, y_min, z_min]
  }
  console.log("Pasting copied selection at position " + position + ", data: " + this.data)

  var game = this.game
  this.data.map(function (voxel) {
      game.setBlock([position[0] + voxel[0], position[1] + voxel[1], position[2] + voxel[2]], voxel.material)
  })
}

Clipboard.prototype.rotateAboutY = function () {
  if (!this.data) return;
  
  console.log("rotateAboutY start data: " + this.data);
  
  var newSelectionData = this.data.map(function (voxel) {
      var oldX = voxel[0]
      voxel[0] =  voxel[2]  // x: becomes old value of z
      voxel[2] = -oldX      // z: becomes negative old value x
      return voxel
  })
  this.data = newSelectionData
  console.log("rotateAboutY ended data: " + this.data)
}

Clipboard.prototype.exportData = function () {
  
  if (!this.data) return "{ voxels: [], dimensions: [0,0,0], position: [0,0,0] }"
  
  function xyzToPackedIndex(x_arg, y_arg, z_arg, dims) { // slow stupid impl
    var index = 0
    for (var z = 0; z < dims[2]; z++) {
      for (var y = 0; y < dims[1]; y++) {
        for (var x = 0; x < dims[0]; x++) {
          if (x_arg === x && y_arg === y && z_arg === z) return index
          index++
        }
      }
    }
  }
  
  function getPackedIndex(x, y, z, dims) { // better impl?
    return z * (dims[1] * dims[0]) + y * dims[0] + x
  }
  
  var dimensions = this.dims.slice()
  var voxels = []
  voxels.length = this.dims[0] * this.dims[1] * this.dims[2]
  for (var i = 0; i < voxels.length; i++) voxels[i] = 0 // init zero array
  
  this.data.map(function (voxel) {
      var index1 = xyzToPackedIndex(voxel[0], voxel[1], voxel[2], dimensions)
      var index2 = getPackedIndex(voxel[0], voxel[1], voxel[2], dimensions)
      
      if (index1 !== index2) {
        console.log("error, indexes not the same: " + index1 + " !== " + index2)
        console.log(voxel)
      }
      
      voxels[getPackedIndex(voxel[0], voxel[1], voxel[2], dimensions)] = voxel.material
  })

  return {
    voxels: voxels,
    dimensions: dimensions,
    position: [0, 0, 0]
  }
}

