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
        position: null, // empty board
        orientation: COLOR.white, // white on bottom
        showCoordinates: true, // show ranks and files
        responsive: false, // detect window resize
        inputMode: INPUT_MODE.dragFigure, // type of interactive movement
        sprite: {
            file: "../assets/sprite.svg", // figures and markers
            grid: DEFAULT_SPRITE_GRID, // one figure every 40 px
        },
        events: {
            beforeInput: null, // callback, before figure move input
            afterInput: null // callback after figure move input
        }
    };
```  

## API

### addMarker(square, type = MARKER_TYPE.emphasize)
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

Set the board orientation. (Color at bottom).

###  getOrientation()

Get the board orientation. 

### destroy()

Remove the board from the DOM.

### enableInput(color, enable)

Enables moves via user input, mouse or touch