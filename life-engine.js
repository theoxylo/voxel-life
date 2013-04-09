module.exports = function createInstance(game, opts) {
  opts = opts || {}
  var on_material = opts.on_material || 2
  var off_material = opts.off_material || 0
  var boardPos = opts.boardPosition || [-32, 1, -32]
  var boardSize = opts.boardSize || 64
  var board = { x: boardSize, y: 1, z: boardSize } // used to wrap live cell patterns
  var tickTime = opts.tickTime || 500
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
    readVoxels()
    paused = false
  }

  function reset() {
    pause()

    // clear life cells and voxels
    cells = []
    for (var i = 0; i < board.x; i++) {
      for (var j = 0; j < board.z; j++) {
        var pos = [boardPos[0] + i, boardPos[1], boardPos[2] + j] 
        game.setBlock(pos, off_material)
      }
    }

    // add glider cells
    addCell( { x: 0, y: 1, z: 0, on: true } )
    addCell( { x: 0, y: 1, z: 1, on: true } )
    addCell( { x: 0, y: 1, z: 2, on: true } )
    addCell( { x: 1, y: 1, z: 2, on: true } )
    addCell( { x: 2, y: 1, z: 1, on: true } )


    updateVoxels()
  }

  function readVoxels() {
    console.log('readVoxels')
    for (var x = 0; x < board.x; x++) {
      for (var y = 0; y < board.y; y++) {
	for (var z = 0; z < board.z; z++) {
	  var pos = [boardPos[0] + x, boardPos[1] + y, boardPos[2] + z] 
console.log('reading voxel at pos ' + pos)
	  if (game.getBlock(pos) === on_material) {
	    addCell( { x: x, y: y, z: z, on: true } )
	  }
	  //addCell( { x: x, z: z, on: game.getBlock(pos) === on_material } )
	}
      }
    }
  }

  function speedUp() {
    tickTime = Math.floor(tickTime * 0.9)
    if (tickTime < 10) tickTime = 10
    console.log("tickTime: " + tickTime)
  }

  function speedDown() {
    tickTime = Math.floor(tickTime * 1.1)
    if (tickTime > 1000) tickTime = 1000
    console.log("tickTime: " + tickTime)
  }

  // an empty/inactive neighbor is a candidate for a new live cell
  //
  function getEmptyNeighbor(x, y, z, dx, dy, dz) { 
    var x_coord = (x + dx) % board.x
    if (x_coord < 0) x_coord += board.x

    var y_coord = (y + dy) % board.y
    if (y_coord < 0) y_coord += board.y

    var z_coord = (z + dz) % board.z
    if (z_coord < 0) z_coord += board.z

    var pos = [x_coord, y_coord, z_coord]
    var material = game.getBlock(pos)
    if (material === on_material) return false // there is a live neighbor there, not empty
    //if (cells[x_coord * boardSize + z_coord]) return false 
    return  { x: x_coord, y: y_coord, z: z_coord, on: false, off_material: material } // return new inactive cell, candidate for activation
    // keeping track of the previous material in case we want to restore it when the cell goes inactive
  }

  function tick(dt) { 
    if (paused) return;
    timeSinceTick += dt
    if (timeSinceTick > tickTime) {
      timeSinceTick = 0

      // remove inactive cells at beginning of cycle
      //cells = cells.map(function (cell, index, array) { 
        //return cell && cell.on ? cell : null 
      //})
      cells.forEach(function (cell, index, array) { 
        if (!cell || !cell.on) delete array[index] // remove inactive cells
      })

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
	      if (dx === 0 && dy === 0 && dz === 0) continue // self
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
	      if (dx === 0 && dy === 0 && dz === 0) continue // self
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

      updateVoxels()
    }
  }

  function updateVoxels() {
    cells.forEach(function (cell) { 
      if (!cell) {
        console.log("warning: found bad cell in 'cells' array during updateVoxels")
        return;
      }
      var pos = [boardPos[0] + cell.x, boardPos[1], boardPos[2] + cell.z] 
      game.setBlock(pos, cell.on ? on_material : off_material)
    })
  }

  // public api:
  return {       
    pause: pause,
    togglePause: togglePause,
    resume: resume,
    reset: reset,
    tick: tick,
    speedUp: speedUp,
    speedDown: speedDown,
    readVoxels: readVoxels
  }
}

