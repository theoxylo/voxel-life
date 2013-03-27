var Life = require('alive')

module.exports = function (game, opts) {
  opts = opts || {}
  var boardPos = opts.boardPosition || [-32, 0, -32]
  var boardSize = opts.boardSize || 64
  var tickTime = opts.tickTime || 900
  var timeSinceTick = 0
  var paused = false
  return {
    instance: new Life(boardSize),

    pause: function () { paused = !paused },

    tick: function (dt) { 
      timeSinceTick += dt
      if (timeSinceTick > tickTime) {
        timeSinceTick = 0
        this.instance.tick()
        this.apply()
        console.log("life tick " + Date.now())
      }
    },

    randomize: function () {
      console.log("life::randomize")
      for (var i = 0; i < boardSize; i++) {
        for (var j = 0; j < boardSize; j++) {
          // random cell state 1 (grass) or 2 (obsidian)
          this.instance.setCell(i, j, Math.random() > 0.5 ? 1 : 0)
        }
      }
    },

    apply: function () {
      if (this.paused) return;
      var pos
      for (var i = 0; i < boardSize; i++) {
        for (var j = 0; j < boardSize; j++) {
          pos = [boardPos[0] + i, boardPos[1], boardPos[2] + j] 
          game.setBlock(pos, this.instance.getCell(i, j) ? 2 : 1)
        }
      }
    }
  }
}

