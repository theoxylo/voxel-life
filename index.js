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
      (y % 16 === 0) ? Math.ceil(Math.random() * 2) // repeating levels of grass and obsidian
      : (x === 0 && y === 1 && z === 0) ? 3         // brick
      : (x === 1 && y === 1 && z === 0) ? 4         // plank
      : 0                                           // empty
  },
  keybindings: {
      'W': 'forward'
    , 'A': 'left'
    , 'S': 'backward'
    , 'D': 'right'
    , 'R': 'view'
    , 'H': 'adjacent'
    , 'I': 'select'
    , 'X': 'select_copy'
    , 'E': 'select_paste'
    , 'Y': 'select_export'
    , 'O': 'life_randomize'
    , 'U': 'life_update'
    , 'P': 'life_pause'
    , '<mouse 1>': 'fire'
    , '<mouse 2>': 'firealt'
    , '<space>'  : 'jump'
    , '<shift>'  : 'crouch'
    , '<control>': 'alt'
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
})

window.game = game // add to global browser scope for easy debugging
game.appendTo(document.body)

// add the player
var player = createPlayer(game)('img/player.png')
player.possess()
player.yaw.position.set(2, 14, 4)
var triggerView = createNonRepeater('view', player.toggle.bind(player));

// highlight blocks when you look at them
var blockPosPlace, blockPosErase
var highlighter = highlight(game, {
  color: 0xffff00
  , distance: 100
  , adjacentActive: createToggler('adjacent')
  , selectActive: createToggler('select')
  , animate: true
});
highlighter.on('highlight', function (voxelPos) { blockPosErase = voxelPos })
highlighter.on('remove', function (voxelPos) { blockPosErase = null })
highlighter.on('highlight-adjacent', function (voxelPos) { blockPosPlace = voxelPos })
highlighter.on('remove-adjacent', function (voxelPos) { blockPosPlace = null })

// block interaction stuff, uses highlight data
var currentMaterial = 2 // default obsidian

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
var triggerCopy = createNonRepeater('select_copy')
var triggerPaste = createNonRepeater('select_paste')
var triggerExport = createNonRepeater('select_export')

// GoL support, life engine wrapper
var life = require('./life-engine')(game, { tickTime: 300 } )
life.randomize()
life.resume()

var triggerLifeRandomize = createNonRepeater('life_randomize', life.randomize)
var triggerLifePause     = createNonRepeater('life_pause',     life.togglePause)
var triggerLifeUpdate    = createNonRepeater('life_update',    life.readVoxels)

// main update function, called at about 60 hz
game.on('tick', function onUpdate(dt) {
  if (triggerCopy() && selection) {
    clipboard.copy(selection.start, selection.end);
  }
  else if (triggerPaste()) {
    clipboard.paste(highlighter.currVoxelAdj || highlighter.currVoxelPos, selection);
  }
  
  if (triggerExport()) {
    var exportedData = JSON.stringify(clipboard.exportData())
    console.log(exportedData)
    alert("Selection data: " + exportedData)
  }
  
  triggerView() // 1st vs 3rd person view
  
  // game of life triggers
  triggerLifeRandomize()
  triggerLifePause()
  triggerLifeUpdate()
  life.tick(dt) // iterate life engine
})

game.on('updateLife', function () {
  console.log("Applying voxel state to life engine")
  life.readVoxels()
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

