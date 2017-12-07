# cm-chessboard

The chessboard for [chessmail.eu](https://www.chessmail.eu) / [chessmail.de](https://www.chessmail.de)

Lightweight, SVG, ES6-module and almost no external dependencies.

- Demo: [http://shaack.com/projekte/cm-chessboard/](http://shaack.com/projekte/cm-chessboard/)
- Repository: [https://github.com/shaack/cm-chessboard](https://github.com/shaack/cm-chessboard)

## Install

`npm install`

## Configuration

With default values
```
this._config = {
    position: "empty", // empty board, set as fen or "start" or "empty"
    orientation: COLOR.white, // white on bottom
    showCoordinates: true, // show ranks and files
    responsive: false, // detect window resize
    inputMode: INPUT_MODE.dragFigure, // type of interactive movement
    sprite: {
        file: "../assets/sprite.svg", // figures and markers
        grid: DEFAULT_SPRITE_GRID, // one figure every 40 px
    },
    events: {
        inputStart: null, // callback, before figure move input
        inputDone: null // callback after figure move input
    }
};
```  

## API

### addMarker(square, type = MARKER_TYPE.emphasize)

Add a marker on a square. Default types are: MARKER_TYPE.newMove, MARKER_TYPE.lastMove, MARKER_TYPE.emphasize,
exportet by `Chessboard.js`. You can create your own marker types, just create an object like {slice: "marker1", opacity: 0.6}.
`slice` is the id in sprite.svg, `opacity` the opacity.
 

### removeMarker(field = null, type = null);

Set field to null to remove all marker from squares.
Set type to null, to remove all types.

### getSquare(square)

Get figure on square.

### setPosition(fen)

Set the position as fen. Special values: `start` sets the chess start position, `empty` sets empty board.

### getPosition()

Get the position as fen.

### setOrientation(color)

Set the board orientation. (Color at bottom). Allowed values are `COLOR.white` or `COLOR.black` 
or `"white"` or `"black"`.

###  getOrientation()

Get the board orientation. 

### destroy()

Remove the board from the DOM.

### enableInput(color, enable)

Enables moves via user input, mouse or touch. Allowed values are `COLOR.white` or `COLOR.black` 
 or `"white"` or `"black"` and boolean.