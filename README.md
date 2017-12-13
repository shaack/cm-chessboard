# cm-chessboard

The (upcoming) chessboard for [chessmail.eu](https://www.chessmail.eu) / [chessmail.de](https://www.chessmail.de)

Current version is "alpha", works on desktop (current versions of Chrome, Firefox, Safari, Edge), 
and mobile (Android and iOS). Will not work in IE. Not planned to get it working in IE.

Lightweight, SVG, ES6 module and almost no external dependencies.

- Demo: [http://shaack.com/projekte/cm-chessboard/](http://shaack.com/projekte/cm-chessboard/)
- Repository: [https://github.com/shaack/cm-chessboard](https://github.com/shaack/cm-chessboard)

## Install

`npm install`

## Configuration

With default values
```
this.config = {
    position: "empty", // empty board, set as fen or "start" or "empty"
    orientation: COLOR.white, // white on bottom
    showCoordinates: true, // show ranks and files
    responsive: false, // detects window resize, if true
    inputMode: INPUT_MODE.viewOnly, // set to INPUT_MODE.dragFigure (1) or INPUT_MODE.dragMarker (2) for interactive movement
    sprite: {
        file: "../assets/sprite.svg", // figures and markers
        grid: DEFAULT_SPRITE_GRID, // one figure every 40px
    },
    events: {
        inputStart: null, // callback(square), before figure move input, return false to cancel move
        inputDone: null // callback(squareFrom, squareTo), after figure move input, return false to cancel move
    }
};
```  

## API

### setSquare(square, figure) {

Set a figure on a square. Example: `board.setSquare("e4", FIGURE.blackKnight)` or
`board.setSquare("e4", "bn")`.

### getSquare(square)

Returns the figure on a square.

### setPosition(fen, animated = true)

Set the position as `fen`. Special values are `"start"`, sets the chess start position and 
`"empty"`, sets an empty board. When `animated` is set `false`, the new position will be 
shown instant.

### getPosition()

Get the board position as `fen`.

### setOrientation(color)

Set the board orientation (color at bottom). Allowed values are `COLOR.white` or `COLOR.black` 
or `"white"` or `"black"`.

###  getOrientation()

Returns the the board orientation. 

### destroy()

Remove the board from the DOM.

### enableInput(color, enable)

Enable and disable moves via user input (mouse or touch). Allowed values are `COLOR.white` or `COLOR.black` 
 or `"white"` or `"black"` for `color` and `boolean` for `enable`.
 
### addMarker(square, type = MARKER_TYPE.emphasize)

Add a marker to a square.

Default types are: `MARKER_TYPE.newMove`, `MARKER_TYPE.lastMove`, `MARKER_TYPE.emphasize`,
exportet by `Chessboard.js`. You can create your own marker types: Just create an object like 
`{slice: "marker1", opacity: 0.6}`, where `slice` is the `id` in `sprite.svg`, `opacity` the opacity.

### removeMarker(square = null, type = null);

Set `square` to `null` to remove `type` from all squares.
Set `type` to `null`, to remove all types. Set both to `null` to remove all markers.

## ToDos

- Switch orientation and play with black
- Switch orientation while displayed
- INPUT_MODE.dragMarker
- Animation when using click move
- Auto-animation queue
- Create Examples for all API functions
- Allow scrolling on touch when input is not enabled (configuration)