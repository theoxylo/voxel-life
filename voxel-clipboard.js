var Voxel = require('./Voxel')

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

  for (var x = 0; x < this.dims[0]; x++) {
    for (var y = 0; y < this.dims[1]; y++) {
      for (var z = 0; z < this.dims[2]; z++) {
        // store voxel block material index, 0 for none
        var material = this.game.getBlock([x_min + x, y_min + y, z_min + z])
        newSelectionData[index++] = new Voxel([x, y, z], material)
      }
    }
  }
  this.data = newSelectionData
}

Clipboard.prototype.getContentsAt = function (pos) {
  if (!this.data || !pos || pos.length !== 3) {
    console.log("paste failed: missing required data")
    return;
  }
  var moved = this.data.map(function (voxel) {
    var newPos = new Voxel(voxel, voxel.material)
    newPos.translate(pos)
    return newPos
  })
  console.log("Returning copied selection placed at position " + pos + ", data: " + moved.join(' '))
  return moved
}

Clipboard.prototype.rotateRight = function () {
  if (!this.data) return;
  
  console.log("rotateRight start data: " + this.data);
  
  var newSelectionData = this.data.map(function (voxel) {
      var oldX =  voxel[0]
      voxel[0] = -voxel[2]  // x: becomes negative old value of z
      voxel[2] =  oldX      // z: becomes old value of x
      return voxel
  })
  this.data = newSelectionData
  console.log("rotateRight ended data: " + this.data)
}

Clipboard.prototype.rotateLeft = function () {
  if (!this.data) return;
  
  console.log("rotateLeft start data: " + this.data);
  
  var newSelectionData = this.data.map(function (voxel) {
      var oldX =  voxel[0]
      voxel[0] =  voxel[2]  // x: becomes old value of z
      voxel[2] = -oldX      // z: becomes negative old value of x
      return voxel
  })
  this.data = newSelectionData
  console.log("rotateLeft ended data: " + this.data)
}

// paint all clipboard voxels with orig restore on cancel
Clipboard.prototype.preview = function (position) {
  var arr_undo = arr_undo || []
  while (arr_undo.length) { // restore orig blocks before previewing new ones
    var voxel = arr_undo.pop()
    this.game.setBlock(voxel.slice(), voxel.material)
  }
  this.getContentsAt(position).forEach(function (voxel) {
    var orig_material = this.game.getBlock(voxel.slice())
    this.game.setBlock(voxel.slice(), voxel.material)
    voxel.material = orig_material // save original material for undo
    arr_undo.push(voxel)
  })
}

// paint all clipboard voxels
Clipboard.prototype.paste = function (position) {
  this.getContentsAt(position).forEach(function (voxel) {
    this.game.setBlock(voxel.slice(), voxel.material)
  })
}

// serialize copied voxel data as packed array of material with dimensions
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
      
      if (index1 != index2) {
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

