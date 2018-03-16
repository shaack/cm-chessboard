# cm-chessboard

A Lightweight, ES6 module based, responsive, SVG chessboard with almost no external dependencies.
Current version is "beta". It works on desktop (current versions of Chrome, Firefox, Safari, Edge),
and mobile (Android and iOS).

cm-chessboard is the new chessboard for the upcoming version 3 of
[chessmail.eu](https://www.chessmail.eu) / [chessmail.de](https://www.chessmail.de), which is currently in development.

## Features

- [Mobile friendly and responsive](http://shaack.com/projekte/cm-chessboard/examples/responsive-board.html)
- [Can handle moves input via click or drag](http://shaack.com/projekte/cm-chessboard/examples/validate-moves.html)
- [Styleable via css](http://shaack.com/projekte/cm-chessboard/examples/styles.html)
- Uses SVG for rendering
- No jQuery needed, just vanilla JavaScript modules in ECMAScript 6 syntax

> A note on ES6 support in Firefox: [Firefox will support JavaScript modules in near future](https://bugzilla.mozilla.org/show_bug.cgi?id=1438139), from release 60 (coming in May 2018). For now, in current versions of Firefox, the [browser-es-module-loader](https://github.com/ModuleLoader/browser-es-module-loader) polyfill is used. Its works, but not very fast. This problem will vanish in May. Why I don't use Babel? Because, I think in 2018 the time is right to [stop using complex build tasks for JavaScript distributions](https://www.contentful.com/blog/2017/04/04/es6-modules-support-lands-in-browsers-is-it-time-to-rethink-bundling/).

## Demo and Repository

- Demo: [http://shaack.com/projekte/cm-chessboard/](http://shaack.com/projekte/cm-chessboard/)
- Repository: [https://github.com/shaack/cm-chessboard](https://github.com/shaack/cm-chessboard)

![Example chessboards](http://shaack.com/projekte/assets/img/example_chessboards.png)

## Install

**Option 1:** Download from [GitHub](https://github.com/shaack/cm-chessboard) and run `npm install` without parameters, or

**Option 2:** Install the [npm package](https://www.npmjs.com/package/cm-chessboard) with `npm install --save cm-chessboard`

After installation, copy the `cm-chessboard/assets/images/chessboard-sprite.svg` to your projects `assets/images` folder.
If you put the sprite somewhere else you have to configure the location in `config.sprite.url`.

## Example Usage

Preconditions for using cm-chessboard in a web page:

- **include the css:** `styles/cm-chessboard.css`
- **import the ES6 module:** `import {Chessboard} from "../src/cm-chessboard/Chessboard.js"`

Example, showing a FEN:

```html
<script type="module">
    import {Chessboard} from "./src/cm-chessboard/Chessboard.js"

    new Chessboard(document.getElementById("containerId"),
            { position: "rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR" });
</script>
```

Take a look at the [/examples](https://github.com/shaack/cm-chessboard/tree/master/examples) folder for more simple examples.

## Configuration

Below is the configuration with default values

```javascript
this.config = {
    position: "empty", // set as fen, "start" or "empty"
    orientation: COLOR.white, // white on bottom
    style: {
        cssClass: "default",
        showCoordinates: true, // show ranks and files
        showBorder: false, // display a border around the board
    },
    responsive: false, // resizes the board on window resize, if true
    animationDuration: 300, // pieces animation duration in milliseconds
    moveInputMode: MOVE_INPUT_MODE.viewOnly, // set to MOVE_INPUT_MODE.dragPiece or MOVE_INPUT_MODE.dragMarker for interactive movement
    sprite: {
        url: "./assets/images/chessboard-sprite.svg", // pieces and markers are stored es svg in the sprite
        grid: 40 // the sprite is tiled with one piece every 40px
    }
};
```

## API

### constructor

`new Chessboard(containerElement, config = {}, callback = null)`

- `containerElement`: a HTML DOM element being the container of the widget
- `config`: The board configuration
- `callback`: The callback after sprite loading and initialization; wait for the callback before using the API

### setPiece(square, piece)

Sets a piece on a square. Example: `board.setPiece("e4", PIECE.blackKnight)` or
`board.setPiece("e4", "bn")`.

### getPiece(square)

Returns the piece on a square or `null` if the square is empty.

### setPosition(fen, animated = true)

Sets the position as `fen`. Special values are `"start"`, sets the chess start position and
`"empty"`, sets an empty board. When `animated` is set `false`, the new position will be 
shown instant.

### getPosition()

Returns the board position as `fen`.

### addMarker(square, type = MARKER_TYPE.emphasize)

Adds a marker on a square.

Default types are: `MARKER_TYPE.move`, `MARKER_TYPE.emphasize`,
exportet by `Chessboard.js`. You can create your own marker types: Just create an object like 
`const myMarker = {class: "my-marker", slice: "marker1"};`, where `class` is the css class of the
marker for styling and `slice` is the `id` in `sprite.svg`.

### getMarkers(square = null, type = null)

Returns the the boards markers as an array.

Set square to `null`, to get all markers of a type on the board. Set type to `null`, to get all types.
Set `both` to null to get all markers on the board.

### removeMarkers(square = null, type = null);

Removes markers from the board.

Set `square` to `null` to remove markers of `type` from all squares.
Set `type` to `null`, to remove all types from a square. 
Set both to `null` to remove all markers from the board.

### setOrientation(color)

Sets the board orientation (color at bottom). Allowed values are `COLOR.white` or `COLOR.black`.

### getOrientation()

Returns the the board orientation. 

### destroy()

Removes the board from the DOM.

### enableMoveInput(callback, color = null)

Enables moves via user input (mouse or touch).
Set optional `color`, if you want to enable the move input for a specific side, `COLOR.white` or `COLOR.black`.

[Example page for move input](http://shaack.com/projekte/cm-chessboard/examples/enable-input.html)

`callback` is called on specific events of the user interaction. Receives the parameter `event`.

```javascript
board.enableMoveInput((event) => {
    // handle user input
}, COLOR.white);
```

These events can have the following `event.type`:

- `INPUT_EVENT_TYPE.moveStart`: User starts move input, `event.square` contains the coordinates
- `INPUT_EVENT_TYPE.moveDone`: User starts move input, `event.squareFrom` and `event.squareTo` contain the coordinates
- `INPUT_EVENT_TYPE.moveCanceled`: User cancels move with clicking start square again or outside of the board

```javascript
chessboard.enableMoveInput((event) => {
    switch (event.type) {
        case INPUT_EVENT_TYPE.moveStart:
            console.log(`moveStart: ${event.square}`);
            // return `true`, if input is accepted/valid, `false` aborts the interaction, nothing will happen
            return true;
        case INPUT_EVENT_TYPE.moveDone:
            console.log(`moveDone: ${event.squareFrom}-${event.squareTo}`);
            // return true, if input is accepted/valid, `false` takes the move back
            return true;
        case INPUT_EVENT_TYPE.moveCanceled:
            console.log(`moveCanceled`);
    }
}, COLOR.white);
```

### disableMoveInput()

Disables the moves via user input.

### enableContextInput(callback)

Enables context input (right click on squares).

[Example page for context input](http://shaack.com/projekte/cm-chessboard/examples/context-input.html)

```javascript
board.enableContextInput((event) => {
    // handle user context input
});
```

The `event` contains in `event.square` the coordinates of the user input.

### disableContextInput()

Disables the context input.


