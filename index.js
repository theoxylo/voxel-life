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

var materials = [
  'obsidian',
  'diamond',
  ['grass', 'dirt', 'grass_dirt'], // top, bottom, sides
  'brick',
  'grass',
  'plank'
]

var game = createGame( {
  generateOld: function (x, y, z) {
      return (y % 16 === 0) ? Math.ceil(Math.random() * 2) // repeating levels of grass and obsidian
      : (x === 0 && y === 1 && z === 0) ? 3         // brick
      : (x === 1 && y === 1 && z === 0) ? 4         // plank
      : 0                                           // empty
  },
  generate: function (x, y, z) {
    return (y === 10 && x === 0 && z === 0) ? 3 // single voxel for player start platform
      //: (y === 0 && Math.abs(x) <= 32 && Math.abs(z) <= 32) ? 1   // expanse of grass same size as life board
      //: (y === 0 && Math.abs(x) <= 48 && Math.abs(z) <= 48) ? 1   // expanse of grass same size as life board
      : (y === 0) ? 1   // infinite expanse of grass, bigger than life board
      : 0 // space!
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
    , 'T': 'select_rotate'
    , 'O': 'life_reset'
    , 'P': 'life_pause'
    , 'U': 'life_faster'
    , 'J': 'life_slower'
    , 'N': 'material_change'
    , '<mouse 1>': 'fire'
    , '<mouse 2>': 'firealt'
    , '<space>'  : 'jump'
    , '<shift>'  : 'crouch'
    , '<control>': 'alt'
  }, 
  chunkDistance: 4,
  materials: [
    'obsidian',
    'diamond',
    ['grass', 'dirt', 'grass_dirt'],
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
var player = createPlayer(game)('img/player.png', { gravity: true })
player.possess()
player.yaw.position.set(0, 14, 0)
var triggerView = createNonRepeater('view', player.toggle.bind(player))

// highlight blocks when you look at them
var blockPosPlace, blockPosErase
var highlighter = highlight(game, {
  color: 0xffff00
  , distance: 100
  , adjacentActive: createToggler('adjacent')
  , selectActive: createToggler('select')
  , animate: true
})
highlighter.on('highlight', function (voxelPos) { blockPosErase = voxelPos })
highlighter.on('remove', function (voxelPos) { blockPosErase = null })
highlighter.on('highlight-adjacent', function (voxelPos) { blockPosPlace = voxelPos })
highlighter.on('remove-adjacent', function (voxelPos) { blockPosPlace = null })

// block interaction stuff, uses highlight data
var currentMaterial = 2 // default obsidian
var triggerMaterialChange = createNonRepeater('material_change', function () {
  currentMaterial = ++currentMaterial % materials.length
  if (!currentMaterial) currentMaterial = 1
})

game.on('fire', function (target, state) {
  var position = blockPosPlace
  if (position) game.createBlock(position, currentMaterial)
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
var triggerRotate = createNonRepeater('select_rotate')

// GoL support, life engine wrapper
var life = require('./life-engine')(game, { 
  tickTime: 200
  , off_material: 2 // for fill in
  , on_material: 4 // from materials []
  , boardSize: 24
})
life.reset()
life.resume()

var triggerLifeReset = createNonRepeater('life_reset', life.reset)
var triggerLifePause = createNonRepeater('life_pause', life.togglePause)
var triggerLifeFaster = createNonRepeater('life_faster', life.speedUp)
var triggerLifeSlower = createNonRepeater('life_slower', life.speedDown)

// main update function, called at about 60 hz
game.on('tick', onUpdate)

function onUpdate(dt) {
  if (triggerCopy() && selection) {
    clipboard.copy(selection.start, selection.end)
  }
  else if (triggerPaste()) {
    clipboard.paste(highlighter.currVoxelAdj || highlighter.currVoxelPos, selection)
    life.readVoxels()
  }
  
  if (triggerRotate()) clipboard.rotateAboutY()
  
  if (triggerExport()) {
    var exportedData = JSON.stringify(clipboard.exportData())
    console.log(exportedData)
    alert("Selection data: " + exportedData)
  }
  
  triggerView() // 1st vs 3rd person view
  triggerMaterialChange() // select next material
  
  // game of life triggers
  triggerLifeReset()
  triggerLifePause()
  triggerLifeFaster()
  triggerLifeSlower()
  life.tick(dt) // iterate life engine
}

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

