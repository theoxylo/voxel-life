module.exports = function createInstance(game, opts) {
  opts = opts || {}
  //var 3d = false
  var on_material = opts.on_material || 2
  var off_material = opts.off_material || 0 // default to empty space for inactive cells
  var frequency = opts.frequency || 500
  var paused = false
  var cells = []
  var cellsToAdd = []
  var board_size = opts.board_size || 16 // in each direction x, z
  //var board_pos = []

  function addCell(voxel) { // voxel is [x,y,z]
    var pos = [voxel[0], /*voxel[1]*/ 1, voxel[2]]
    pos = constrainPosition(pos)
    cellsToAdd.push( { x: pos[0], y: pos[1], z: pos[2], on: true, off_material: 0 } )
  }

  function addCells(voxelArray) { // voxelArray is [ [x,y,z], [x,y,z] ]
    while (voxelArray.length) {
      var voxel = voxelArray.pop()
      if (voxel.material === on_material) addCell(voxel)
    }
  }

  function pause() { 
    if (paused) return
    paused = true
    console.log("Paused at generation " + generation_counter + "; live cells: " + live_cell_count + "; empty cells considered: " + empty_considered_count )
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
      pos = constrainPosition(pos)
      game.setBlock(pos, off_material)
    })
    cells = [] // cells.length = 0 // clear and reuse?

    // add glider cells at position 20,20
    //addCell( [0 + 20, 1, 0 + 20 ] )
    //addCell( [0 + 20, 1, 1 + 20 ] )
    //addCell( [0 + 20, 1, 2 + 20 ] )
    //addCell( [1 + 20, 1, 2 + 20 ] )
    //addCell( [2 + 20, 1, 1 + 20 ] )

    // add growth pattern
    addCell([1,1,1])
    addCell([1,1,3])
    addCell([1,1,5])
    addCell([2,1,2])
    addCell([2,1,3])
    addCell([2,1,5])
    addCell([3,1,4])
    addCell([3,1,5])
    addCell([4,1,1])
    addCell([5,1,1])
    addCell([5,1,2])
    addCell([5,1,3])
    addCell([5,1,5])
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
  function getEmptyNeighbor(pos) { 
    pos = constrainPosition(pos)
    var material = game.getBlock(pos)
    if (material === on_material) {
      return false // found a live neighbor, not empty
    }
    // return new inactive cell, candidate for activation if enough live neighbors
    return  { 
      x: pos[0],
      y: pos[1],
      z: pos[2],
      on: false, 
      off_material: material // track previous material to restore when cell goes inactive
    } 
  }

  // check 8 neighbors of cell
  var neighbors = [
    [-1, 0, -1],
    [ 0, 0, -1],
    [ 1, 0, -1],
    [-1, 0,  0],
    [ 1, 0,  0],
    [-1, 0,  1],
    [ 0, 0,  1],
    [ 1, 0,  1]
  ]
  function getLiveNeighborCount(cell, empty_neighbors, empty_neighbor_ids) {
    var liveNeighbors = 0 // number of live neighbors

    // without nested loops
    for (var i = 0; i < neighbors.length; i++) {
      var pos = [cell.x + neighbors[i][0], cell.y, cell.z + neighbors[i][2]]
      var empty = getEmptyNeighbor(pos)
      if (empty) {
	if (empty_neighbors) { // collect empty neighbors if array param passed
	  var cellId = pos.join()
	  if (empty_neighbor_ids.indexOf(cellId) + 1) continue // this empty neighbor already checked
	  empty_neighbors.push(empty) // save empty cell for later to check for activation
	  empty_neighbor_ids.push(cellId) // update id cache
	}
      }
      // if a neighbor is active (not empty), increment counter
      else liveNeighbors++
    }
    //for (var dx = -1; dx < 2; dx++) {
      //for (var dy = 0; dy < 1; dy++) { // x,z plane
	//for (var dz = -1; dz < 2; dz++) {
	  //if (dx === 0 && dy === 0 && dz === 0) continue // skip self
	  //var pos = [cell.x + dx, cell.y + dy, cell.z + dz]
	  //var empty = getEmptyNeighbor(pos)
	  //if (empty) {
	    //if (empty_neighbors) { // collect empty neighbors if array param passed
	      //var cellId = pos.join()
	      //if (empty_neighbor_ids.indexOf(cellId) + 1) continue // this empty neighbor already checked
	      //empty_neighbors.push(empty) // save empty cell for later to check for activation
	      //empty_neighbor_ids.push(cellId) // update id cache
	    //}
	  //}
	  //// if a neighbor is active (not empty), increment counter
	  //else liveNeighbors++
	//}
      //}
    //}
    return liveNeighbors
  }

  var countdown = 0
  var generation_counter = 0
  var update_phase = 'check_live_cells'
  var live_cell_count = 0
  var empty_considered_count = 0
  var empty_cells_to_check = []
  var empty_cell_id_cache = [] // a cache for empty cell IDs to avoid checking dups

  function update(dt) { 
    if (paused) return

    countdown -= dt
    
    if (update_phase === 'increment_generation') {
      //if (countdown > 0) {
      if (countdown > dt) { // could be a little early, close enough
	return // not yet time to set blocks
      }
      generation_counter++
      countdown = frequency
      // add any new live cell additions that came in from addCell
      while (cellsToAdd.length) {
	var new_cell = cellsToAdd.pop()
	console.log('adding live cell:')
	console.log(new_cell)
	cells.push(new_cell)
      }
      // update cell voxels in world (both on and off), then remove off cells from array
      cells = cells.filter(function (cell) {
	// leave behind specific material or empty space
	var material = cell.on ? on_material : (off_material || cell.off_material)
	var pos = [cell.x, cell.y, cell.z]
	pos = constrainPosition(pos)
	game.setBlock(pos, material)
	return cell.on
      })
      live_cell_count = cells.length
      update_phase = 'check_live_cells'
    }
    
    if (update_phase === 'check_live_cells') {
      // check current live cells for overcrowding
      // and save empty neighbors to check for birth later
      empty_cells_to_check.length = 0
      empty_cell_id_cache.length = 0
      cells.forEach(function (cell) {
	var liveNeighbors = getLiveNeighborCount(cell, empty_cells_to_check, empty_cell_id_cache)
	if (liveNeighbors < 2 || liveNeighbors > 3) cell.on = false
      })
      update_phase = 'check_empty_neighbors'
      return
    }

    // check empty neighbors for birth
    if (update_phase === 'check_empty_neighbors') {
      empty_considered_count = empty_cells_to_check.length
      empty_cells_to_check.forEach(function (cell) { 
	if (getLiveNeighborCount(cell) === 3) { // a cell is born!
	  cell.on = true
	  cells.push(cell)
	}
      })
    }
    update_phase = 'increment_generation'
  }

  // wrap at edges, come in from other side
  function constrainPosition(pos) {
    return pos.map(function (coord) {
      coord += board_size
      coord = coord % (board_size * 2)
      if (coord < 0) coord += (board_size * 2)
      return coord - board_size
    })
  }

  // public api:
  return {       
    id: new Date().getTime(),
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

