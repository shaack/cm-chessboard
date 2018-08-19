# cm-chessboard

A Lightweight, ES6 module based, responsive, mobile friendly SVG chessboard with almost no dependencies (no jQuery needed). It works on desktop (current versions of Chrome, Firefox, Safari, Edge),
and mobile (Android and iOS).

cm-chessboard is the new chessboard for the upcoming 'version 3' of
[chessmail.eu](https://www.chessmail.eu) / [chessmail.de](https://www.chessmail.de), which is currently in development.

## Features

- **[Mobile friendly and responsive](https://shaack.com/projekte/cm-chessboard/examples/responsive-board.html)**
- **[Can handle moves input via click or drag](https://shaack.com/projekte/cm-chessboard/examples/validate-moves.html)**
- **[Styleable via css](https://shaack.com/projekte/cm-chessboard/examples/styles.html)**
- Uses **SVG for rendering**
- **Vanilla JavaScript modules** in **ECMAScript 6** syntax
- **No dependencies**, exept the very lightweight SVG 
rendering helper [svjs-svg](https://shaack.com/projekte/svjs-svg/)

## Demo and Repository

- **Demo: [http://shaack.com/projekte/cm-chessboard/](https://shaack.com/projekte/cm-chessboard/)**
- **Repository: [https://github.com/shaack/cm-chessboard](https://github.com/shaack/cm-chessboard)**

![Example chessboards](https://shaack.com/projekte/assets/img/example_chessboards.png)

## Install

**Option 1:** Download from [GitHub](https://github.com/shaack/cm-chessboard) and run `npm install` without parameters, or

**Option 2:** Install the [npm package](https://www.npmjs.com/package/cm-chessboard) with `npm install --save cm-chessboard`

Note: cm-chessboard uses symlinks internally, which requires admin rights on windows. If you're installing cm-chessboard on windows, please run `npm install` as an administrator.

After installation, copy the `cm-chessboard/assets/images/chessboard-sprite.svg` to your projects `assets/images` folder.
If you put the sprite somewhere else you have to configure the location in `props.sprite.url`.

## Example Usage

Preconditions for using cm-chessboard in a web page:

- **include the css:** `styles/cm-chessboard.css`
- **import the ES6 module:** `import {Chessboard} from "../src/cm-chessboard/Chessboard.js"`

Example, showing a FEN:

```html
<script type="module">
    import {Chessboard} from "./src/cm-chessboard/Chessboard.js"

    new Chessboard(document.getElementById("containerId"),
            { position: "rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR" })
</script>
```

Take a look at the [/examples](https://github.com/shaack/cm-chessboard/tree/master/examples) folder for more simple examples.

## Configuration

Below is the default configuration

```javascript
props = {
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
        url: "./assets/images/chessboard-sprite.svg", // pieces and markers are stored as svg in the sprite
        grid: 40 // the sprite is tiled with one piece every 40px
    }
}
```

## API

### constructor

`new Chessboard(containerElement, props = {})`

- **`containerElement`** - a HTML DOM element being the container of the widget
- **`props`** - The board configuration (properties)

### setPiece(square, piece)

Sets a piece on a square. Example: `board.setPiece("e4", PIECE.blackKnight)` or
`board.setPiece("e4", "bn")`.

Returns a **Promise** which will be resolved, after the piece is set.

### getPiece(square)

Returns the piece on a square or `null` if the square is empty.

### setPosition(fen, animated = true)

Sets the position as `fen`. Special values are `"start"`, sets the chess start position and
`"empty"`, sets an empty board. When `animated` is set `false`, the new position will be 
shown instant.

Returns a **Promise** which will be resolved, after the Animation has finished.

[Example for **setPosition**](https://shaack.com/projekte/cm-chessboard/examples/pieces-animation.html)

### getPosition()

Returns the board position as `fen`.

### addMarker(square, type = MARKER_TYPE.emphasize)

Adds a marker on a square.

Default types are: `MARKER_TYPE.move`, `MARKER_TYPE.emphasize`,
exportet by `Chessboard.js`. You can create your own marker types: Just create an object like 
`const myMarker = {class: "my-marker", slice: "marker1"}`, where `class` is the css class of the
marker for styling and `slice` is the `id` in `sprite.svg`.

[Example for **addMarker**, **getMarkers** and **removeMarkers**](https://shaack.com/projekte/cm-chessboard/examples/context-input.html)

### getMarkers(square = null, type = null)

Returns the the board's markers as an array.

Set square to `null`, to get all markers of a type on the board. Set type to `null`, to get all types.
Set `both` to null to get all markers on the board.

### removeMarkers(square = null, type = null)

Removes markers from the board.

Set `square` to `null` to remove markers of `type` from all squares.
Set `type` to `null`, to remove all types from a square. 
Set both to `null` to remove all markers from the board.

### setOrientation(color)

Sets the board orientation (color at bottom). Allowed values are `COLOR.white` or `COLOR.black`.

[Example for **setOrientation**](https://shaack.com/projekte/cm-chessboard/examples/enable-input.html)

### getOrientation()

Returns the the board orientation. 

### destroy()

Removes the board from the DOM. Returns a **Promise** which will be resolved, after destruction.


### enableMoveInput(eventHandler, color = null)

Enables moves via user input (mouse or touch).
Set optional `color`, if you want to enable the move input for a specific side, `COLOR.white` or `COLOR.black`.

`eventHandler` is called on specific events of the user interaction. Receives the parameter `event`.

```javascript
board.enableMoveInput((event) => {
    // handle user input here
}, COLOR.white)
```
[Example for **enableMoveInput**](http://shaack.com/projekte/cm-chessboard/examples/enable-input.html)


The event has the following **`event.type`**:

- **`INPUT_EVENT_TYPE.moveStart`** - User started the move input, `event.square` contains the coordinates
- **`INPUT_EVENT_TYPE.moveDone`** - User finished the move input, `event.squareFrom` and `event.squareTo` contain the coordinates
- **`INPUT_EVENT_TYPE.moveCanceled`** - User canceled the move with clicking again ob the start square or clicking outside of the board

```javascript
chessboard.enableMoveInput((event) => {
    switch (event.type) {
        case INPUT_EVENT_TYPE.moveStart:
            console.log(`moveStart: ${event.square}`)
            // return `true`, if input is accepted/valid, `false` aborts the interaction, the piece will not move
            return true
        case INPUT_EVENT_TYPE.moveDone:
            console.log(`moveDone: ${event.squareFrom}-${event.squareTo}`)
            // return true, if input is accepted/valid, `false` takes the move back
            return true
        case INPUT_EVENT_TYPE.moveCanceled:
            console.log(`moveCanceled`)
    }
}, COLOR.white)
```

### disableMoveInput()

Disables moves via user input.

### enableContextInput(eventHandler)

Enables context input (right click on squares).

```javascript
board.enableContextInput((event) => {
    // handle user context input here    
})
```

[Example for **enableContextInput**](https://shaack.com/projekte/cm-chessboard/examples/context-input.html)


**`event.square`** contains the coordinates of the user input.

### disableContextInput()

Disables the context input.

## Licenses

- License for the code: [MIT](https://github.com/shaack/cm-chessboard/blob/master/LICENSE), 
License for the SVG-pieces [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).


