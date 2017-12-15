# cm-chessboard

The (upcoming) chessboard for [chessmail.eu](https://www.chessmail.eu) / [chessmail.de](https://www.chessmail.de)

A Lightweight, ES6 module based, responsive, SVG chessboard with almost no external dependencies.

Current version is "beta". It works on desktop (current versions of Chrome, Firefox, Safari, Edge), 
and mobile (Android and iOS).

- Demo: [http://shaack.com/projekte/cm-chessboard/](http://shaack.com/projekte/cm-chessboard/)
- Repository: [https://github.com/shaack/cm-chessboard](https://github.com/shaack/cm-chessboard)

If you use this board, it would be nice, if you put a link to chessmail ([chessmail.eu](https://www.chessmail.eu) or [chessmail.de](https://www.chessmail.de)) on your site. Thanks. :)

## Install

**Option 1:** Download from [GitHub](https://github.com/shaack/cm-chessboard) and run `npm install` without parameters

**Option 2:** Install the [npm package](https://www.npmjs.com/package/cm-chessboard) with `npm install --save cm-chessboard`

## Example Usage

Preconditions:

- **include css:** `styles/cm-chessboard.css`
- **import ES6 module:** `import {Chessboard} from "../src/cm-chessboard/Chessboard.js"`

Example, showing a FEN:
```
new Chessboard(document.getElementById("containerId"), 
        { position: "rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR" });
```
Take a look at the [/examples](https://github.com/shaack/cm-chessboard/tree/master/examples) folder for more simple examples.

## Configuration

With default values
```
this.config = {
    position: "empty", // set as fen or "start" or "empty"
    orientation: COLOR.white, // white on bottom
    showCoordinates: true, // show ranks and files
    responsive: false, // detects window resize, if true
    animationDuration: 300, // in milliseconds
    inputMode: INPUT_MODE.viewOnly, // set to INPUT_MODE.dragFigure '1' or INPUT_MODE.dragMarker '2' for interactive movement
    events: {
        inputStart: null, // callback(square), before figure move input, return false to cancel move
        inputDone: null // callback(squareFrom, squareTo), after figure move input, return false to cancel move
    },
    sprite: {
        file: "../assets/sprite.svg", // figures and markers
        grid: DEFAULT_SPRITE_GRID // one figure every 40px
    }
};
```  

## API

### constructor

`new Chessboard(containerElement, config = {}, callback = null)`

- **containerElement:** a HTML DOM element being the container of the widget
- **config:** The board configuration
- **callback:** Callback after sprite loading and initialization. Wait for the callback before using the API. 

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
