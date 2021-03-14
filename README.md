# cm-chessboard

A Lightweight, ES6 module based, responsive, mobile friendly SVG chessboard **without dependencies**. It works on
desktop (current versions of Chrome, Firefox, Safari, Edge), and mobile (Android and iOS).

cm-chessboard is the main chessboard of
[chessmail.eu](https://www.chessmail.eu) and [chessmail.de](https://www.chessmail.de). It is also used
in [chess-console](https://shaack.com/projekte/chess-console/examples/load-pgn.html) and in
[cm-fen-editor](https://shaack.com/projekte/cm-fen-editor/). They are all nice written ES6 Modules to handle different
aspects of chess games.

## Features

- [Mobile friendly and responsive](https://shaack.com/projekte/cm-chessboard/examples/responsive-board.html)
- [Can handle moves input via click or drag](https://shaack.com/projekte/cm-chessboard/examples/validate-moves.html)
- [Styleable via css](https://shaack.com/projekte/cm-chessboard/examples/styles.html)
- [Supports multiple piece sets](https://shaack.com/projekte/cm-chessboard/examples/styles.html)
- Uses SVG for rendering
- Vanilla JavaScript modules in ECMAScript 6 syntax
- **No dependencies**

## Demo and repository

- **Demo: [http://shaack.com/projekte/cm-chessboard/](https://shaack.com/projekte/cm-chessboard/)**
- **Repository: [https://github.com/shaack/cm-chessboard](https://github.com/shaack/cm-chessboard)**

![Example chessboards](https://shaack.com/projekte/assets/img/example_chessboards_staunty.png?v=2)

## Install

**Option 1:** Install the [npm package](https://www.npmjs.com/package/cm-chessboard) with `npm install cm-chessboard`.

**Option 2:** Download the code from [GitHub](https://github.com/shaack/cm-chessboard).

To run the tests in `/test` you first have to `npm install` the dev dependencies. Without tests there are no
dependencies.

After installation, copy the sprite in `cm-chessboard/assets/images/` to your projects `assets/images/`
folder. If you put the sprite somewhere else you have to configure the location with `props.sprite.url`.

## Example usage

Preconditions for using cm-chessboard in a web page:

- **include the css:** `styles/cm-chessboard.css`
- **import the ES6 module:** `import {Chessboard} from "PATH/TO/src/cm-chessboard/Chessboard.js"`

Example, showing a FEN:

```html

<script type="module">
    import {Chessboard} from "./src/cm-chessboard/Chessboard.js"

    new Chessboard(document.getElementById("containerId"), 
            {position: "rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR"})
</script>
```

Take a look at the [/examples](https://github.com/shaack/cm-chessboard/tree/master/examples) folder for more simple
examples.

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
        aspectRatio: 1 // height/width. Set to null, if you want to define it only in the css.
    },
    responsive: false, // resizes the board on window resize, if true
    animationDuration: 300, // pieces animation duration in milliseconds
    moveInputMode: MOVE_INPUT_MODE.viewOnly, // set to MOVE_INPUT_MODE.dragPiece or MOVE_INPUT_MODE.dragMarker for interactive movement
    sprite: {
        url: "./assets/images/chessboard-sprite-staunty.svg", // pieces and markers are stored as svg sprite
        size: 40, // the sprite size, defaults to 40x40px
        cache: true // cache the sprite inline, in the HTML
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
`"empty"`, sets an empty board. When `animated` is set `false`, the new position will be shown instant.

Returns a **Promise** which will be resolved, after the Animation has finished.

[Example for **setPosition**](https://shaack.com/projekte/cm-chessboard/examples/pieces-animation.html)

### getPosition()

Returns the board position as `fen`.

### addMarker(square, type = MARKER_TYPE.emphasize)

Adds a marker on a square.

Default types are: `MARKER_TYPE.move`, `MARKER_TYPE.emphasize`, exportet by `Chessboard.js`. You can create your own
marker types: Just create an object like
`const myMarker = {class: "my-marker", slice: "marker1"}`, where `class` is the css class of the marker for styling
and `slice` is the `id` in `sprite.svg`. See also [Create your own custom markers](#create-your-own-custom-markers)
below.

[Example for **addMarker**, **getMarkers** and **
removeMarkers**](https://shaack.com/projekte/cm-chessboard/examples/context-input.html)

### getMarkers(square = null, type = null)

Returns the the board's markers as an array.

Set square to `null`, to get all markers of a type on the board. Set type to `null`, to get all types. Set `both` to
null to get all markers on the board.

### removeMarkers(square = null, type = null)

Removes markers from the board.

Set `square` to `null` to remove markers of `type` from all squares. Set `type` to `null`, to remove all types from a
square. Set both to `null` to remove all markers from the board.

### setOrientation(color)

Sets the board orientation (color at bottom). Allowed values are `COLOR.white` or `COLOR.black`.

[Example for **setOrientation**](https://shaack.com/projekte/cm-chessboard/examples/enable-input.html)

### getOrientation()

Returns the the board orientation.

### destroy()

Removes the board from the DOM. Returns a **Promise** which will be resolved, after destruction.

### enableMoveInput(eventHandler, color = null)

Enables moves via user input (mouse or touch). Set optional `color`, if you want to enable the move input for a specific
side, `COLOR.white` or `COLOR.black`.

`eventHandler` is called on specific events of the user interaction. Receives the parameter `event`.

```javascript
board.enableMoveInput((event) => {
    // handle user input here
}, COLOR.white)
```

[Example for **enableMoveInput**](http://shaack.com/projekte/cm-chessboard/examples/enable-input.html)

The event has the following **`event.type`**:

- **`INPUT_EVENT_TYPE.moveStart`** - User started the move input, `event.square` contains the coordinates
- **`INPUT_EVENT_TYPE.moveDone`** - User finished the move input, `event.squareFrom` and `event.squareTo` contain the
  coordinates
- **`INPUT_EVENT_TYPE.moveCanceled`** - User canceled the move with clicking again on the start square or clicking
  outside of the board

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

## Piece sets

cm-chessboard supports alternative piece sets. A piece set is defined in an SVG sprite. cm-chessboart is shipped with
two sets, the default [staunty](https://github.com/ornicar/lila/tree/master/public/piece/staunty) (
chessboard-sprite-staunty.svg) and a sprite of the
[Wikimedia standard pieces](https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces/Standard)
(chessboard-sprite.svg).

Sprites must be 40x40px in size where the piece elements must have ids like
"bp" (black pawn) or "wq" (white queen). Just open the sprite in a text editor, SVG is readable like HTML. Also the
markers are defined in the sprite.

## Create your own custom markers

The ability to add custom markers is build in. The main hurdle is to add the marker to the SVG sprite. With a program
like InkScape or Sketch this should be relatively easy.

Example: The default circle marker is defined in the SVG like this.

```svg

<g id="marker2" transform="translate(2.000000, 2.000000)" fill="#000000" fill-opacity="0">
    <circle cx="18" cy="18" r="18"></circle>
</g>
```

It's a circle with the radius 18 and its center at 20/20.

Important is the id "marker2". You can set the marker
with `board.addMarker("e4", {class: "emphasize", slice: "marker2"})`
"emphasize" is the css class, which defines the color of the marker. "slice" is the id of the marker in the SVG. This is
also demonstrated in the [mark Squares Example](https://shaack.com/projekte/cm-chessboard/examples/input-callbacks.html)
.

The color and stroke-width of the marker is defined in the css (or scss). You could also define your marker completely
in the sprite, but then that is not so flexible.

```css
marker.emphasize {
    stroke: #009900;
    stroke-width: 4px;
    opacity: 0.5;
}
```

So you can simply add a marker with the id `myMarkerIdInSvg` to the SVG, and add the class `myMarkerCssClass` to the
css. Then you can add it to the field "e4" on your board with

`addMarker("e4", {class: "myMarkerCssClass", slice: "myMarkerIdInSvg"})`

To allow easy removing of the marker, you have to define the marker type in your code.

```js
const myMarkerType = {class: "myMarkerCssClass", slice: "myMarkerIdInSvg"}
// add
addMarker("e4", myMarkerType)
// remove
removeMarkers("e4", myMarkerType)
// remove all "myMarkerType"
removeMarkers(null, myMarkerType)
```

## Usage with React

There exists a ticket from someone who is using cm-chessboard with react:
https://github.com/shaack/cm-chessboard/issues/20

## Licenses

- License for the code: [MIT](https://github.com/shaack/cm-chessboard/blob/master/LICENSE)
- License for the Staunty SVG-pieces (
  chessboard-sprite-staunty.svg): [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- License for the Wikimedia SVG-pieces: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

## cm-chess

You may also be interested in [cm-chess](https://github.com/shaack/cm-chess), it is like
[chess.js](https://github.com/jhlywa/chess.js), but in ES6 and can handle games and PGNs with variants, NAGs and
comments. 

