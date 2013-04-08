module.exports = Voxel

function Voxel(pos, material) {
    
  if (!(this instanceof Voxel)) {
    console.log("warning: Voxel called without 'new' keyword")
    return new Voxel(pos, material)
  }
  
  return {
      length: 3
    , 0: pos[0]
    , 1: pos[1]
    , 2: pos[2]
    , material: 0 || material
  }

}
