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

    for (var i = cells.length; i > 0; i--) {
      var cell = cells[i - 1]
      if (!cell) continue
      var pos = [cell.x, cell.y, cell.z]
      pos = constrainPosition(pos)
      game.setBlock(pos, off_material)
    }
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

  var countdown = frequency
  var generation_counter = 0
  var update_phase = 'check_live_cells'
  var live_cell_count = 0
  var empty_considered_count = 0
  var empty_cells_to_check = []
  var empty_cell_id_cache = [] // a cache for empty cell IDs to avoid checking dups

  function update(dt) { 
    if (paused) return

    countdown -= dt
    
    if (update_phase === 'check_live_cells') {
      // check current live cells for overcrowding
      // and save empty neighbors to check for birth later
      empty_cells_to_check.length = 0
      empty_cell_id_cache.length = 0
      for (var i = cells.length; i > 0; i--) {
        var cell = cells[i - 1]
        if (!cell) continue
        var liveNeighbors = 0 // number of live neighbors
        for (var dx = -1; dx < 2; dx++) {
          for (var dz = -1; dz < 2; dz++) {
            if (dx === 0 && dz === 0) continue // skip self
            var pos = constrainPosition([cell.x + dx, cell.y, cell.z + dz])
            var cellId = pos.join()
            if (empty_cell_id_cache.indexOf(cellId) + 1) continue // this neighbor already found to be empty
            var material = game.getBlock(pos)
            if (material === on_material) { // found a live neighbor, not an empty
              liveNeighbors++
              continue
            }
            empty_cell_id_cache.push(cellId)
            empty_cells_to_check.push({ // save candidate for activation
              x: pos[0],
              y: pos[1],
              z: pos[2],
              on: false, 
              off_material: material // track previous material to restore when cell goes inactive
            })
          } // end z loop
        }   // end x loop
        if (liveNeighbors < 2 || liveNeighbors > 3) cell.on = false
      }
      update_phase = 'check_empty_neighbors'
      if (countdown > 0) return
    }

    // check empty neighbors for birth
    if (update_phase === 'check_empty_neighbors') {
      empty_considered_count = empty_cells_to_check.length
      for (var i = empty_cells_to_check.length; i > 0; i--) {
        var cell = empty_cells_to_check[i - 1]
        var liveNeighbors = 0 // number of live neighbors
        for (var dx = -1; dx < 2; dx++) {
          for (var dz = -1; dz < 2; dz++) {
            if (dx === 0 && dz === 0) continue // skip self
            var pos = constrainPosition([cell.x + dx, cell.y, cell.z + dz])
            var material = game.getBlock(pos)
            if (material === on_material) { // found a live neighbor, not an empty
              liveNeighbors++
              if (liveNeighbors === 4) break // no need to continue, not checking empties
            }
          } // end z loop
        }   // end x loop
        if (liveNeighbors === 3) { // a cell is born!
          cell.on = true
          cells.push(cell)
        }
      } // end empty cells loop
      update_phase = 'add_cells'
      if (countdown > 0) return
    }

    if (update_phase === 'add_cells') {
      // add any new live cell additions that came in from addCell
      while (cellsToAdd.length) {
        var new_cell = cellsToAdd.pop()
        console.log('adding live cell:')
        console.log(new_cell)
        cells.push(new_cell)
      }
      update_phase = 'increment_generation'
      if (countdown > 0) return
    }

    if (update_phase === 'increment_generation') {
      if (countdown > 0) {
        return // not yet time to set blocks
      }
      generation_counter++
      countdown = frequency
      // update cell voxels in world (both on and off), then remove off cells from array
      var cells_updated = []
      for (var i = cells.length; i > 0; i--) {
        var cell = cells[i - 1]
        if (!cell) continue
        // leave behind specific material or empty space
        var material = cell.on ? on_material : (off_material || cell.off_material)
        var pos = [cell.x, cell.y, cell.z]
        pos = constrainPosition(pos)
        game.setBlock(pos, material)
        //return cell.on
        if (cell.on) cells_updated.push(cell)
      }
      cells = cells_updated
      live_cell_count = cells.length
      update_phase = 'check_live_cells'
    }
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

