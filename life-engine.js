module.exports = function createInstance(game, opts) {
  opts = opts || {}
  var on_material = 2 || opts.on_material
  var off_material = 0 || opts.off_material
  var boardPos = opts.boardPosition || [-32, 1, -32]
  var boardSize = opts.boardSize || 64
  var tickTime = opts.tickTime || 500
  var timeSinceTick = 0
  var paused = false
  var cells = [] // new Array(boardSize * boardSize)

  function addCell(cell) {
    cells[cell.x * boardSize + cell.z] = cell
  }

  function pause() { 
    if (paused) return
    paused = true
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
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        var pos = [boardPos[0] + i, boardPos[1], boardPos[2] + j] 
        game.setBlock(pos, off_material)
      }
    }

    // add glider cells
    addCell( { x: 0, z: 0, on: true } )
    addCell( { x: 0, z: 1, on: true } )
    addCell( { x: 0, z: 2, on: true } )
    addCell( { x: 1, z: 2, on: true } )
    addCell( { x: 2, z: 1, on: true } )


    updateVoxels()
  }

  function readVoxels() {
    console.log('readVoxels')
    for (var x = 0; x < boardSize; x++) {
      for (var z = 0; z < boardSize; z++) {
        var pos = [boardPos[0] + x, boardPos[1], boardPos[2] + z] 
        if (game.getBlock(pos) === on_material) {
          addCell( { x: x, z: z, on: true } )
        }
      }
    }
  }

  function speedUp() {
    tickTime *= 0.9
    if (tickTime < 10) tickTime = 10
  }

  function speedDown() {
    tickTime *= 1.1
  }

  function tick(dt) { 
    if (paused) return;
    timeSinceTick += dt
    if (timeSinceTick > tickTime) {
      timeSinceTick = 0

      // remove inactive cells
      cells = cells.map(function (cell) { 
        return cell && cell.on ? cell : null 
      })

      var possibleNewCells = []

      cells.forEach(function (cell) {
        if (!cell) return
        // check each of 8 neighbors:
        // if a neighbor is active, increment counter
        // otherwise, save for later to check for new cell
        var count = 0 // number of live neighbors
        for (var dx = -1; dx < 2; dx++) {
          for (var dz = -1; dz < 2; dz++) {
            if (dx === 0 && dz === 0) continue
            var empty = getEmptyNeighbor(cell.x, cell.z, dx, dz)
            if (empty) possibleNewCells.push(empty)
            else count++
          }
        }
        if (count < 2 || count > 3) cell.on = false
      })

      possibleNewCells.map(function (cell) {
        var count = 0 // number of live neighbors
        for (var dx = -1; dx < 2; dx++) {
          for (var dz = -1; dz < 2; dz++) {
            if (dx === 0 && dz === 0) continue // self
            var empty = getEmptyNeighbor(cell.x, cell.z, dx, dz)
            if (!empty) count++
          }
        }
        if (count === 3) return cell // a new cell is born
        return null
      }).forEach(function (cell) {
          if (!cell) return
          cell.on = true
          addCell(cell)
      })

      function getEmptyNeighbor(x, z, dx, dz) { // candidate for new cell if enough live neighbors
        var x_coord = (x + dx) % boardSize
        if (x_coord < 0) x_coord += boardSize

        var z_coord = (z + dz) % boardSize
        if (z_coord < 0) z_coord += boardSize

        if (cells[x_coord * boardSize + z_coord]) return false // there is a live neighbor there
        return  { x: x_coord, z: z_coord, on: false } // return inactive cell, candidate for activation
      }

      updateVoxels()
    }
  }

  function updateVoxels() {
    cells.forEach(function (cell) { 
      if (!cell) return
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

