# cm-chessboard

The (upcoming) chessboard for [chessmail.eu](https://www.chessmail.eu) / [chessmail.de](https://www.chessmail.de)

A Lightweight, ES6 module based, responsive, SVG chessboard with almost no external dependencies.

Current version is "beta". It works on desktop (current versions of Chrome, Firefox, Safari, Edge), 
and mobile (Android and iOS). In Firefox it is necessary to `enable dom.moduleScripts.enabled` in `about:config`.
See: [Firefox, Experimental features, JavaScript](https://developer.mozilla.org/en-US/Firefox/Experimental_features#JavaScript)

- Demo: [http://shaack.com/projekte/cm-chessboard/](http://shaack.com/projekte/cm-chessboard/)
- Repository: [https://github.com/shaack/cm-chessboard](https://github.com/shaack/cm-chessboard)

If you use this board, it would be nice, if you put a link to chessmail ([chessmail.eu](https://www.chessmail.eu) or [chessmail.de](https://www.chessmail.de)) on your site. Thanks. :)

![Example chessboards](http://shaack.com/projekte/assets/img/example_chessboards.png)

## Install

**Option 1:** Download from [GitHub](https://github.com/shaack/cm-chessboard) and run `npm install` without parameters

**Option 2:** Install the [npm package](https://www.npmjs.com/package/cm-chessboard) with `npm install --save cm-chessboard`

After installation copy the `cm-chessboard/assets/images/chessboard-sprite.svg` to your projects `assets/images` folder.
If you put the sprite somewhere else you have to configure the location in `config.sprite.url`.

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
    style: {
        cssClass: "default",
        showCoordinates: true, // show ranks and files
        showBorder: false, // display a border around the board
    },
    responsive: false, // detects window resize, if true
    animationDuration: 300, // in milliseconds
    moveInputMode: MOVE_INPUT_MODE.viewOnly, // set to MOVE_INPUT_MODE.dragPiece '1' or MOVE_INPUT_MODE.dragMarker '2' for interactive movement
    sprite: {
        url: "./assets/images/chessboard-sprite.svg", // pieces and markers
        grid: DEFAULT_SPRITE_GRID // one piece every 40px
    }
};
```  

## API

### constructor

`new Chessboard(containerElement, config = {}, callback = null)`

- **containerElement:** a HTML DOM element being the container of the widget
- **config:** The board configuration
- **callback:** Callback after sprite loading and initialization. Wait for the callback before using the API. 

### setPiece(square, piece)

Set a piece on a square. Example: `board.setPiece("e4", PIECE.blackKnight)` or
`board.setPiece("e4", "bn")`.

### getPiece(square)

Returns the piece on a square or `null` if the square is empty.

### setPosition(fen, animated = true)

Set the position as `fen`. Special values are `"start"`, sets the chess start position and 
`"empty"`, sets an empty board. When `animated` is set `false`, the new position will be 
shown instant.

### getPosition()

Get the board position as `fen`.

### addMarker(square, type = MARKER_TYPE.emphasize)

Add a marker on a square.

Default types are: `MARKER_TYPE.move`, `MARKER_TYPE.emphasize`,
exportet by `Chessboard.js`. You can create your own marker types: Just create an object like 
`{slice: "marker1", opacity: 0.6}`, where `slice` is the `id` in `sprite.svg`, `opacity` the opacity.

### getMarkers(square = null, type = null)

Set square to `null`, to get all markers of a type on the board. Set type to `null`, to get all types.
Set `both` to null to get all markers on the board.

### removeMarkers(square = null, type = null);

Set `square` to `null` to remove markers of `type` from all squares.
Set `type` to `null`, to remove all types from a square. 
Set both to `null` to remove all markers from the board.

### setOrientation(color)

Set the board orientation (color at bottom). Allowed values are `COLOR.white` or `COLOR.black`.

### getOrientation()

Returns the the board orientation. 

### destroy()

Remove the board from the DOM.

### enableMoveInput(callback, color = null)

Enable moves via user input (mouse or touch). Set color, if you just want to enable move input for one specific color. 

### disableMoveInput()

Disable moves via user input.

### enableContextInput(callback)

Enable context input (right click).

### disableContextInput()

Disable context input.
