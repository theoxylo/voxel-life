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
        newSelectionData[index++] = this.game.getBlock([x_min + i, y_min + j, z_min + k])
      }
    }
  }
  this.data = newSelectionData
}

Clipboard.prototype.paste = function (pos, selection) {
  if (!this.data || (!pos && !selection)) {
    console.log("paste failed: missing required data")
    return;
  }
  if (!pos) { // derive placement position from selection volume
     var x_min = Math.min(selection.start[0], selection.end[0])
     var y_min = Math.min(selection.start[1], selection.end[1])
     var z_min = Math.min(selection.start[2], selection.end[2])
     pos = [x_min, y_min, z_min]
  }
  console.log("Pasting copied selection at position " + pos + ", data: " + this.data)

  var index = 0

  for (var i = 0; i < this.dims[0]; i++) {
    for (var j = 0; j < this.dims[1]; j++) {
      for (var k = 0; k < this.dims[2]; k++) {
        this.game.setBlock([pos[0]+ i, pos[1] + j, pos[2] + k], this.data[index++])
      }
    }
  }
}

Clipboard.prototype.rotateAboutY = function () {
  if (!this.data) return;
  
  console.log("rotateAboutY start data: " + this.data);
  
  var newSelectionData = []
  var index = 0

  for (var i = 0; i < this.dims[0]; i++) {
    for (var j = 0; j < this.dims[1]; j++) {
      for (var k = 0; k < this.dims[2]; k++) {
        newSelectionData = this.data[index++] // rearrange data somehow...
      }
    }
  }
  this.data = newSelectionData
  console.log("rotateAboutY ended data: " + this.data)
}
