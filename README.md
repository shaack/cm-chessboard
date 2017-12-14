# cm-chessboard

The (upcoming) chessboard for [chessmail.eu](https://www.chessmail.eu) / [chessmail.de](https://www.chessmail.de)

A Lightweight ES6 module based responsive SVG chessboard with almost no external dependencies.

Current version is "beta". It works on desktop (current versions of Chrome, Firefox, Safari, Edge), 
and mobile (Android and iOS).

- Demo: [http://shaack.com/projekte/cm-chessboard/](http://shaack.com/projekte/cm-chessboard/)
- Repository: [https://github.com/shaack/cm-chessboard](https://github.com/shaack/cm-chessboard)

## Install

Download and `npm install`

Also available as npm package: [https://www.npmjs.com/package/cm-chessboard](https://www.npmjs.com/package/cm-chessboard)

Install the npm with `npm install --save cm-chessboard`

## Configuration

With default values
```
this.config = {
    position: "empty", // empty board, set as fen or "start" or "empty"
    orientation: COLOR.white, // white on bottom
    showCoordinates: true, // show ranks and files
    responsive: false, // detects window resize, if true
    inputMode: INPUT_MODE.viewOnly, // set to INPUT_MODE.dragFigure "1" or INPUT_MODE.dragMarker "2" for interactive movement
    animationSpeed: 300,
    events: {
        inputStart: null, // callback(square), before figure move input, return false to cancel move
        inputDone: null, // callback(squareFrom, squareTo), after figure move input, return false to cancel move
        inputContext: null // callback(square), on right click/context touch
    },
    sprite: {
        file: "../assets/sprite.svg", // figures and markers
        grid: DEFAULT_SPRITE_GRID, // one figure every 40px
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

- inputContext callback and emphasize markers
- Create Examples for all API functions