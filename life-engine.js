module.exports = function createInstance(game, opts) {
  opts = opts || {}
	//var 3d = false
  var on_material = opts.on_material || 2
  var off_material = opts.off_material || 0 // default to empty space for inactive cells
  var frequency = opts.frequency || 500
  var timeSinceTick = 0
  var paused = false
  var cells = []
  var live_cell_count = 0
  var cellsToAdd = []

  function addCell(voxel) { // voxel is [x,y,z]
    cellsToAdd.push( { x: voxel[0], y: voxel[1], z: voxel[2], on: true, off_material: 0 } )
  }

  function addCells(voxelArray) { // voxelArray is [ [x,y,z], [x,y,z] ]
    while (voxelArray.length) addCell(voxelArray.pop())
  }

  function pause() { 
    if (paused) return
    paused = true
    console.log("total live cell count: " + live_cell_count)
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
      var pos = [cell.x, cell.y, cell.z]
			game.setBlock(pos, off_material)
    })
    cells = [] // cells.length = 0 // clear and reuse?

    // add glider cells
    cells.push( { x: 0, y: 1, z: 0, on: true, off_material: 0 } )
    cells.push( { x: 0, y: 1, z: 1, on: true, off_material: 0 } )
    cells.push( { x: 0, y: 1, z: 2, on: true, off_material: 0 } )
    cells.push( { x: 1, y: 1, z: 2, on: true, off_material: 0 } )
    cells.push( { x: 2, y: 1, z: 1, on: true, off_material: 0 } )
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
  function getEmptyNeighbor(x, y, z) { 
    var material = game.getBlock([x, y, z])
    if (material === on_material) {
      return false // found a live neighbor, not empty
    }
    // return new inactive cell, candidate for activation if enough live neighbors
    return  { 
      x: x,
      y: y,
      z: z,
      on: false, 
      off_material: material // track previous material to restore when cell goes inactive
    } 
  }

  var generation_counter = 0

  function update(dt) { 
    if (paused) return;
    
    timeSinceTick += dt
    if (timeSinceTick < frequency) {
      return; // waiting
    }
    timeSinceTick = 0
    
    console.log("iteration " + generation_counter++ + ": live cells: " + live_cell_count + ", cells.length: " + cells.length)

    var candidateCells = []
    live_cell_count = 0

    // apply any cell additions that came in from addCell
    cellsToAdd.forEach(function (cell) {
			console.log('adding live cell:')
			console.log(cell)
		  cells.push(cell)
		})

		var board_size = 64
    // update voxels in world (both on and off), then remove dead cells from array
    cells = cells.filter(function (cell) {
      var material = cell.on ? on_material : (cell.off_material || off_material)
      var pos = [cell.x, cell.y, cell.z]
			pos = pos.map(function (coord) {
				coord = coord % board_size
				if (coord < board_size * -1) coord += board_size
				return coord
			})

			// limit position to wrapping boarder
			game.setBlock(pos, material)
      //if (game.voxels.chunkAtPosition(pos)) { // don't try to update out of bounds
        //game.setBlock(pos, material)
      //}
      return cell.on
    })

		// check current live cells for neighbors
		// check each of 8 neighbors of this active cell:
		// if a neighbor is active, increment counter
		// otherwise, save empty cell for later to check for activation
		var emptyCellIdCache = [] // a cache for IDs to check before avoiding dups

		cells.forEach(function (cell) { 
			live_cell_count++
			var liveNeighbors = 0 // number of live neighbors
			for (var dx = -1; dx < 2; dx++) {
				//if (3d) for (var dy = -1; dy < 2; dy++) { // 3D
				//else 
				for (var dy = 0; dy < 1; dy++) { // x,z plane
					for (var dz = -1; dz < 2; dz++) {
						if (dx === 0 && dy === 0 && dz === 0) continue // skip self
						var cellId = [cell.x + dx, cell.y + dy, cell.z + dz].join()
						if (emptyCellIdCache.indexOf(cellId) > -1) continue // empty already added
						var empty = getEmptyNeighbor(cell.x + dx, cell.y + dy, cell.z + dz)
						if (empty) {
							candidateCells.push(empty)
							emptyCellIdCache.push(cellId)
						}
						else liveNeighbors++
					}
				}
			}
			if (liveNeighbors < 2 || liveNeighbors > 3) cell.on = false
		})


    candidateCells.forEach(function (cell) { // check empty neighbors for birth
      var liveNeighbors = 0 // number of live neighbors
      for (var dx = -1; dx < 2; dx++) {
				//if (3d) for (var dy = -1; dy < 2; dy++) { // 3D
				//else 
				for (var dy = 0; dy < 1; dy++) { // x,z plane
          for (var dz = -1; dz < 2; dz++) {
            if (dx === 0 && dy === 0 && dz === 0) continue // skip self
            if (!getEmptyNeighbor(cell.x + dx, cell.y + dy, cell.z + dz)) {
              liveNeighbors++ // count liviing neighbors
            }
          }
        }
      }
      if (liveNeighbors === 3) { // a cell is born!
        cell.on = true
        cells.push(cell)
      }
    })
  }

  // public api:
  return {       
	  on_material: on_material,
	  off_material: off_material,
    addCell: addCell,
		addCells: addCells,
    pause: pause,
    togglePause: togglePause,
    resume: resume,
    reset: reset,
    update: update,
    speedUp: speedUp,
    speedDown: speedDown
  }
}

