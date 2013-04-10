module.exports = function createInstance(game, opts) {
  opts = opts || {}
  var on_material = opts.on_material || 2
  var off_material = opts.off_material || 0
  var boardPos = opts.boardPosition || [-32, 1, -32]
  var boardSize = opts.boardSize || 64
  var board = { x: boardSize, y: 1, z: boardSize } // used to wrap live cell patterns
  var frequency = opts.frequency || 500
  var timeSinceTick = 0
  var paused = false
  var cells = []
  var num_live_voxels = 0

  function addCell(voxel) {
    //cells[cell.x * boardSize + cell.z] = cell
    cells.push(voxel)
  }

  function pause() { 
    if (paused) return
    paused = true
    console.log("total live cell count: " + num_live_voxels)
  }

  function togglePause() {
    paused ? resume() : pause()
  }

  function resume() { 
    if (!paused) return
    paused = false
  }

  function reset() {
    pause()

    cells.forEach(function (cell) { 
      game.setBlock([cell.x, cell.y, cell.z], off_material)
    })
    cells.length = 0 // clear

    // add glider cells
    addCell( { x: 0, y: 1, z: 0, on: true } )
    addCell( { x: 0, y: 1, z: 1, on: true } )
    addCell( { x: 0, y: 1, z: 2, on: true } )
    addCell( { x: 1, y: 1, z: 2, on: true } )
    addCell( { x: 2, y: 1, z: 1, on: true } )
  }

  function speedUp() {
    frequency = Math.floor(frequency * 0.9)
    if (frequency < 10) frequency = 10
    console.log("frequency: " + frequency)
  }

  function speedDown() {
    frequency = Math.floor(frequency * 1.1)
    if (frequency > 1000) frequency = 1000
    console.log("frequency: " + frequency)
  }

  // an empty/inactive neighbor is a candidate for a new live cell
  //
  function getEmptyNeighbor(x, y, z, dx, dy, dz) { 
    var material = game.getBlock([x + dx, y + dy, z + dz])
    if (material === on_material) return false // there is a live neighbor there, not empty
    return  { x: x + dx, y: y + dy, z: z + dz, on: false, off_material: material } // return new inactive cell, candidate for activation
    // keeping track of the previous material in case we want to restore it when the cell goes inactive
  }

  var counter = 0
  function update(dt) { 
    if (paused) return;
    
    timeSinceTick += dt
    if (timeSinceTick < frequency) {
      return; // still waiting, better way to get called at the proper frequency?
    }
    
    console.log("iteration " + counter);
    timeSinceTick = 0

    var possibleNewCells = []

    var new_num_live_voxels = 0;
    cells.forEach(function (cell) {
      if (!cell) {
        console.log("warning: found bad cell in 'cells' array even after cleanup")
        return;
      }
      new_num_live_voxels++
      // check each of 8 neighbors:
      // if a neighbor is active, increment counter
      // otherwise, save for later to check for new cell birth
      var liveNeighbors = 0 // number of live neighbors
      for (var dx = -1; dx < 2; dx++) {
        //for (var dy = -1; dy < 2; dy++) { // 3D?
        for (var dy = 0; dy < 1; dy++) { // mono-layer
    	    for (var dz = -1; dz < 2; dz++) {
    	      if (dx === 0 && dy === 0 && dz === 0) continue // skip self
    	      var empty = getEmptyNeighbor(cell.x, cell.y, cell.z, dx, dy, dz)
    	      if (empty) possibleNewCells.push(empty)
    	      else liveNeighbors++
    	    }
    	  }
      }
      if (liveNeighbors < 2 || liveNeighbors > 3) cell.on = false
    })
    num_live_voxels = new_num_live_voxels

    possibleNewCells.forEach(function (cell, index, array) {
      var liveNeighbors = 0 // number of live neighbors
      for (var dx = -1; dx < 2; dx++) {
        //for (var dy = -1; dy < 2; dy++) { // 3D?
        for (var dy = 0; dy < 1; dy++) { // mono-layer
    	    for (var dz = -1; dz < 2; dz++) {
    	      if (dx === 0 && dy === 0 && dz === 0) continue // skip self
    	      if (!getEmptyNeighbor(cell.x, cell.y, cell.z, dx, dy, dz)) liveNeighbors++ // count liviing neighbors
    	    }
    	  }
      }
      if (liveNeighbors !== 3) delete array[index] // this cell didn't make it
    })
    
    possibleNewCells.forEach(function (cell) {
      if (!cell) {
        console.log("warning: found bad cell in 'possibleNewCells' array even after cleanup")
        return;
      }
      cell.on = true
      addCell(cell)
    })

    // update voxels (both on and off), then remove off cells from array
    cells = cells.filter(function (cell) {
      var pos = [cell.x, cell.y, cell.z] 
      if (!cell) {
        console.log("warning: found bad cell in 'cells' array during updateVoxels")
        return false;
      }
      game.setBlock([cell.x, cell.y, cell.z], cell.on ? on_material : off_material)
      return cell.on
    })
  }

  // public api:
  return {       
    pause: pause,
    togglePause: togglePause,
    resume: resume,
    reset: reset,
    update: update,
    speedUp: speedUp,
    speedDown: speedDown
  }
}

