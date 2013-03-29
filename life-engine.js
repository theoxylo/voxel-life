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
    paused = true
  }

  function togglePause() {
    paused = !paused
  }

  function resume() { 
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
    pause()
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        pos = [boardPos[0] + i, boardPos[1], boardPos[2] + j] 
        instance.setCell(i, j, game.getBlock(pos))
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
    var pos
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
    pos = [boardPos[0] + i, boardPos[1], boardPos[2] + j] 
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
    readVoxels: readVoxels,
    tick: tick,
    paint: paint
  }
}

