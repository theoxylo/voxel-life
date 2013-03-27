var voxel = require('voxel')
var createGame = require('voxel-engine')
var highlight = require('voxel-highlight')
var createPlayer = require('voxel-player')
var texturePath = require('painterly-textures')(__dirname)
var Clipboard = require('./voxel-clipboard')

function createToggler(keyControl) {
  var active, canToggle
  return function () {
    if (!game.controls.state[keyControl]) {
      canToggle = true  // key released, reset
    } else if (canToggle) {
      canToggle = false
      active = !active
    }
    return active
  }
}

function createNonRepeater(keyControl, fn) {
  var canActivate
  return function () { // will only return true once per long keypress
    if (!game.controls.state[keyControl]) {
      canActivate = true  // key released, reset
    } else if (canActivate) {
      canActivate = false
      if (typeof fn === 'function') fn()
      return true
    }
    return false
  }
}

var game = createGame( {
  generate: function (x, y, z) {
    return y % 16 ? 0 : Math.ceil(Math.random() * 2)
  },
  keybindings: {
      'W': 'forward'
    , 'A': 'left'
    , 'S': 'backward'
    , 'D': 'right'
    , '<mouse 1>': 'fire'
    , '<mouse 2>': 'firealt'
    , '<space>': 'jump'
    , '<shift>': 'crouch'
    , '<control>': 'alt'
    , 'R': 'view'
    , 'H': 'adjacent'
    , 'I': 'select'
    , 'X': 'copy'
    , 'E': 'paste'
    , 'O': 'randomize'
    , 'P': 'pause'
  }, 
  chunkDistance: 2,
  materials: [
    ['grass', 'dirt', 'grass_dirt'],
    'obsidian',
    'brick',
    'grass',
    'plank'
  ],
  texturePath: texturePath,
  worldOrigin: [0, 0, 0],
  controls: { discreteFire: true }
});

window.game = game // for debugging
game.appendTo(document.body)

// add the player
var playerFn = createPlayer(game)
var player = playerFn('player.png')
player.possess()
player.yaw.position.set(2, 14, 4)
var triggerView = createNonRepeater('view', player.toggle.bind(player));

// highlight blocks when you look at them, hold <Ctrl> for block placement
var blockPosPlace, blockPosErase
var highlighter = highlight(game, {
  color: 0xffff00
  , distance: 100
  , adjacentActive: createToggler('adjacent')
  , selectActive: createToggler('select')
  , animate: false
});
highlighter.on('highlight', function (voxelPos) { blockPosErase = voxelPos })
highlighter.on('remove', function (voxelPos) { blockPosErase = null })
highlighter.on('highlight-adjacent', function (voxelPos) { blockPosPlace = voxelPos })
highlighter.on('remove-adjacent', function (voxelPos) { blockPosPlace = null })

// block interaction stuff, uses highlight data
var currentMaterial = 1

game.on('fire', function (target, state) {
  var position = blockPosPlace
  if (position) {
    game.createBlock(position, currentMaterial)
  }
  else {
    position = blockPosErase
    if (position) game.setBlock(position, 0)
  }
})

// copy-paste multi-voxel selection
var clipboard = new Clipboard(game)
var selection
var triggerCopy = createNonRepeater('copy')
var triggerPaste = createNonRepeater('paste')

// GoL support, life engine wrapper
var life = require('./life')(game, { tickTime: 300 } )
life.randomize()
life.apply()

var triggerRandomize = createNonRepeater('randomize', life.randomize.bind(life))
var triggerPause = createNonRepeater('pause', life.pause.bind(life))

// main update function, called at about 60 hz
game.on('tick', function onUpdate(dt) {

  if (triggerCopy() && selection) {
    clipboard.copy(selection.start, selection.end);
  }
  else if (triggerPaste()) {
    clipboard.paste(highlighter.currVoxelAdj || highlighter.currVoxelPos, selection);
  }

  triggerView() // 1st vs 3rd person view

  triggerRandomize() // re-randomize the life board

  triggerPause() // pause life engine

  life.tick(dt) // update life engine
})

highlighter.on('highlight-select', function (s) {
  selection = s
  console.log(">>> [" + s.start + "][" + s.end + "] highlighted selection")
})
highlighter.on('highlight-deselect', function (s) {
  selection = null
  console.log("<<< [" + s.start + "][" + s.end + "] selection un-highlighted")
})

//highlighter.on('highlight', function (voxelPos) {
//  console.log(">   [" + voxelPos + "] highlighted voxel")
//})
//highlighter.on('remove', function (voxelPos) {
//  console.log("<   [" + voxelPos + "] removed voxel highlight")
//})
//highlighter.on('highlight-adjacent', function (voxelPos) {
//  console.log(">>  [" + voxelPos + "] highlighted adjacent")
//})
//highlighter.on('remove-adjacent', function (voxelPos) {
//  console.log("<<  [" + voxelPos + "] removed adjacent highlight")
//})

