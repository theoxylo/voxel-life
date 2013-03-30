var Life = require('alive')

module.exports = function createInstance(game, opts) {
  opts = opts || {}
  var boardPos = opts.boardPosition || [-32, 0, -32]
  var boardSize = opts.boardSize || 64
  var tickTime = opts.tickTime || 500
  var timeSinceTick = 0
  var paused = false
  var instance = new Life(boardSize)

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

  function randomize() {
    pause()
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        // random cell state 1 (grass) or 2 (obsidian)
        instance.setCell(i, j, Math.random() > 0.5 ? 1 : 0)
      }
    }
    paint()
  }

  function readVoxels() {
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        var pos = [boardPos[0] + i, boardPos[1], boardPos[2] + j] 
	// voxel material 2 (obsidian) is active life cell
        instance.setCell(i, j, game.getBlock(pos) === 2 ? 1 : 0) 
      }
    }
    paint()
  }

  function tick(dt) { 
    if (paused) return;
    timeSinceTick += dt
    if (timeSinceTick > tickTime) {
      timeSinceTick = 0
      instance.tick() // slow? need partial tick without paint
      paint()
    }
  }

  function paint() {
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        var pos = [boardPos[0] + i, boardPos[1], boardPos[2] + j] 
        game.setBlock(pos, instance.getCell(i, j) ? 2 : 1)
      }
    }
  }

  // public api:
  return {       
    pause: pause,
    togglePause: togglePause,
    resume: resume,
    randomize: randomize,
    tick: tick,
    paint: paint
  }
}

