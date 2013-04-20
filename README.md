# voxel-life
a browser-based voxel.js game based on Conway's Game of Life, written in JavaScript for Node.js

* [voxel.js](http://voxeljs.com)
* [Conway's Game of Life](http://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)


## play online

The latest stable version of the game is available online:

http://theoxylo.github.com/voxel-life/index_v3.html


Some older versions are also available:

http://theoxylo.github.com/voxel-life/index_v2.html


## how to play
Game play is still very rough and evolving quickly, but here are some things to try.

### Shapes you create in the ground with obsidian will become active life patterns:
1. pause the life simulation: press the P key
2. add diamond blocks: press H to toggle build mode, then left-click
3. unpause the simulation and your new creation will come to life

### You can copy interesting formations and paste them again:
1. pause the life simulation: press the P key
2. toggle to select mode: press the I key
3. move and look around until you get the desired selection (toggle H to select empty cubes)
4. copy the selection into memory: press the X key
5. cancel select mode: press the I key again
5. you can rotate the selection before pasting: press the T key
6. paste the selection: press the E key
7. unpause the simulation and your new creations will come to life
8. you can paste additional copies without pausing


## controls
These are not yet configurable via the UI (coming soon)
```
keybindings: {
    'W': 'forward'        // move forward
  , 'A': 'left'           // strafe left
  , 'S': 'backward'       // move backward
  , 'D': 'right'          // strafe right
  , 'R': 'view'           // toggle 1st/3rd-person view
  , 'H': 'adjacent'       // toggle selection of adjacent (empty) voxels
  , 'I': 'select'         // toggle multi-voxel selection box
  , 'X': 'select_copy'    // copy current multi-voxel selection
  , 'E': 'select_paste'   // paste current multi-voxel selection
  , 'T': 'select_rotate'  // rotates currently copied selection (in memory)
  , 'Y': 'select_export'  // export selection copy in [voxel interchange format](https://github.com/maxogden/voxel-engine#voxel-interchange-format)
  , 'O': 'reset'          // reset GoL state
  , 'U': 'speed_up'       // speed up GoL
  , 'j': 'speed_down'     // slow down GoL
  , 'P': 'pause'          // pause GoL updates
  , '<mouse 1>': 'fire'   // left mouse click, remove or place block
  , '<mouse 2>': 'firealt'
  , '<space>'  : 'jump'
  , '<shift>'  : 'crouch'
  , '<control>': 'alt'
}
```


## github project
Bug reports, support, source code, etc:

https://github.com/theoxylo/voxel-life


## offline setup
If you would like to host the game on your local machine,
perhaps to modify it or play while offline:
```
npm install voxel-life
cd voxel-life && npm install
npm install -g browserify
browserify test.js -o bundle.js -dv
npm start
```
Then browse to [http://localhost:8080](http://localhost:8080)


## license
BSD
