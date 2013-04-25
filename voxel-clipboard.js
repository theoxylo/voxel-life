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
    console.log('copy failed: missing data')
    return;
  }

  // start and end are opposite corners
  console.log('Copying selection from ' + start + ' to ' + end)
  
  var x_min = Math.min(start[0], end[0])
  var y_min = Math.min(start[1], end[1])
  var z_min = Math.min(start[2], end[2])

  var x_max = Math.max(start[0], end[0])
  var y_max = Math.max(start[1], end[1])
  var z_max = Math.max(start[2], end[2])

  // dimensions
  this.dims[0] = Math.abs(x_max - x_min) + 1 // x
  this.dims[1] = Math.abs(y_max - y_min) + 1 // y
  this.dims[2] = Math.abs(z_max - z_min) + 1 // z
  console.log('copy dimensions: ' + this.dims)

  var newSelectionData = []
  var index = 0

  for (var z = 0; z < this.dims[2]; z++) {
    for (var y = 0; y < this.dims[1]; y++) {
      for (var x = 0; x < this.dims[0]; x++) {
        // store voxel block material index, 0 for none
        var material = this.game.getBlock([x_min + x, y_min + y, z_min + z])
        newSelectionData[index++] = new Voxel([x, y, z], material)
      }
    }
  }
  this.data = newSelectionData
  console.log('new selection: ' + this.data.join('|'))
}

Clipboard.prototype.getContentsAt = function (pos) {
  if (!this.data || !pos || pos.length !== 3) {
    console.log('getContentsAt failed: missing required data')
    return;
  }
  var moved = this.data.map(function (voxel) {
    var newPos = new Voxel(voxel, voxel.material)
    newPos.translate(pos)
    return newPos
  })
  console.log('Returning copied selection placed at position ' + pos + ', data: ' + moved.join('|'))
  return moved
}

Clipboard.prototype.rotateRight = function () {
  if (!this.data) return;
  this.data = this.data.map(function (voxel) {
    var oldX =  voxel[0]
    voxel[0] = -voxel[2]  // x: becomes negative old value of z
    voxel[2] =  oldX      // z: becomes old value of x
    return voxel
  })
  this.dims = [this.dims[2], this.dims[1], this.dims[0]] // flip x and z

  this.data = this.normalizeData(this.data)
}

Clipboard.prototype.rotateLeft = function () {
  if (!this.data) return;
  this.data = this.data.map(function (voxel) {
    var oldX =  voxel[0]
    voxel[0] =  voxel[2]  // x: becomes old value of z
    voxel[2] = -oldX      // z: becomes negative old value of x
    return voxel
  })
  this.dims = [this.dims[2], this.dims[1], this.dims[0]] // flip x and z

  this.data = this.normalizeData(this.data)
}

// paint all clipboard voxels with orig restore on cancel
// NOT WORKING
Clipboard.prototype.previewX = function (position) {
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
  console.log('paste at position: ' + position.join('|'))
  var game = this.game
  this.getContentsAt(position).forEach(function (voxel) {
    game.setBlock(voxel.slice(), voxel.material)
  })
}

// normalize data to get rid of negative coords introduced by rotation
// (shift all coords so that selection is anchored at 0,0,0)
Clipboard.prototype.normalizeData = function (data) {
  if (!data || !data.length) return []

  var x_min = data[0][0]
  var y_min = data[0][1]
  var z_min = data[0][2]
  for (var i = 1; i < data.length; i++) {
    x_min = Math.min(x_min, data[i][0])
    y_min = Math.min(y_min, data[i][1])
    z_min = Math.min(z_min, data[i][2])
  }
  console.log('min voxel: [' + [-x_min, -y_min, -z_min].join(', ') + ']')

  return data.map(function (voxel) {
    return voxel.translate([-x_min, -y_min, -z_min])
  })
}

// serialize copied voxel data as packed array of material with dimensions
Clipboard.prototype.exportData = function () {
  
  if (!this.data) return '{ voxels: [], dimensions: [0,0,0], position: [0,0,0] }'

  console.log('exportData data BEFORE normalize: ' + this.data.join('|'))
  this.data = this.normalizeData(this.data)
  console.log('exportData data AFTER normalize: ' + this.data.join('|'))

  console.log('exporting data: ' + this.data.join('|'))
  
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
  
  var voxels = []
  voxels.length = this.dims[0] * this.dims[1] * this.dims[2]
  for (var i = 0; i < voxels.length; i++) {
    voxels[i] = 0 // init zero array for default empty space
  }
  
  (function packData(data, dims) {
    data.forEach(function (voxel) {
      var index1 = xyzToPackedIndex(voxel[0], voxel[1], voxel[2], dims)
      var index2 = getPackedIndex(voxel[0], voxel[1], voxel[2], dims)
      
      if (index1 != index2) {
	console.log('error, indexes not the same: ' + index1 + ' !== ' + index2)
	console.log(voxel)
      }
      
      voxels[getPackedIndex(voxel[0], voxel[1], voxel[2], dims)] = voxel.material
    })
  })(this.data, this.dims)
  console.log('exported voxels array: ' + voxels.join('], ['))

  return {
    voxels: voxels,
    dimensions: this.dims.slice(),
    position: [0, 0, 0]
  }
}

