module.exports = Voxel

function Voxel(pos, material) {
  if (!(this instanceof Voxel)) {
    console.log("warning: Voxel called without 'new' keyword")
    return new Voxel(pos, material)
  }
  this.length = 3
  this[0] = pos[0]
  this[1] = pos[1]
  this[2] = pos[2]
  this.material = material || 0
}

Voxel.prototype.translate = function (deltaPos) {
  this[0] += deltaPos[0]
  this[1] += deltaPos[1]
  this[2] += deltaPos[2]
}

Voxel.prototype.slice = function () {
  return [ this[0], this[1], this[2] ]
}
