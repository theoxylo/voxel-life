# voxel-life
a browser-based voxel.js game based on Conway's Game of Life, written in JavaScript for Node.js

* [voxel.js](http://voxeljs.com)
* [Conway's Game of Life](http://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)

## play online
The latest stable version of the game is available online:

http://theoxylo.github.com/voxel-life

## controls
These are not yet configurable via the UI (coming soon)
```
keybindings: {
    'W': 'forward'        // move forward
  , 'A': 'left'           // strafe left
  , 'S': 'backward'       // move backward
  , 'D': 'right'          // strafe right
  , 'R': 'view'           // toggle 1st/3rd-person view
  , 'H': 'adjacent'       // toggle selection of adjacent (empty) voxel
  , 'I': 'select'         // toggle multi-voxel selection box
  , 'X': 'select_copy'    // copy current multi-voxel selection
  , 'E': 'select_paste'   // paste current multi-voxel selection
  , 'Y': 'select_export'  // export selection copy in [voxel interchange format](https://github.com/maxogden/voxel-engine#voxel-interchange-format)
  , 'O': 'randomize'      // reset GoL state
  , 'P': 'pause'          // pause GoL updates
  , 'U': 'life_update'    // apply voxel edits back to life engine
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
