# cm-chessboard

A JavaScript chessboard which is lightweight, ES6 module based, responsive, SVG rendered and **without dependencies**.

cm-chessboard is the main chessboard of
[chessmail.eu](https://www.chessmail.eu) and [chessmail.de](https://www.chessmail.de). It is also used
in [chess-console](https://shaack.com/projekte/chess-console/examples/load-pgn.html) and in
[cm-fen-editor](https://shaack.com/projekte/cm-fen-editor/). They are all nice written ES6 Modules to handle different
aspects of chess games.

> Note: With version 7, I made a heavy allover refactoring. The chessboard props have been changed and the files structure also. Version 7 of the cm-chessboard will not work out of the box after an update from a previous version. Also with version 7 comes the move cancelling via secondary mouse button.

## Features

- **No dependencies**, just clean ES6
- [Can handle moves input via click or drag](https://shaack.com/projekte/cm-chessboard/examples/validate-moves.html)
- [Styleable via css and supports multiple piece sets](https://shaack.com/projekte/cm-chessboard/examples/different-styles.html)
- Uses SVG for rendering
- [Allows adding **extensions** to extend the functionality](https://shaack.com/projekte/cm-chessboard/examples/extensions/arrows-extension.html)

## Extensions

The core of cm-chessboard is small, fast and reduced to the essentials. You can extend its functionality with extensions.

- [Accessibility Extension](https://shaack.com/projekte/cm-chessboard/examples/extensions/accessibility-extension.html) - makes the chessboard more accessible
- [Arrows Extension](https://shaack.com/projekte/cm-chessboard/examples/extensions/arrows-extension.html) - renders arrows on the chessboard
- [Markers Extension](https://shaack.com/projekte/cm-chessboard/examples/extensions/markers-extension.html)  🆕 - create markers on specific squares
- [PromotionDialog Extension](https://shaack.com/projekte/cm-chessboard/examples/extensions/promotion-dialog-extension.html)  🆕 - shows a dialog to select the piece to promote to
- [RenderVideo Extension](https://shaack.com/projekte/cm-chessboard/examples/extensions/render-video-extension.html)  🆕 - renders a video from the pieces movement on the board

## Demo and repository

- **Demo: [http://shaack.com/projekte/cm-chessboard/](https://shaack.com/projekte/cm-chessboard/)**
- **Repository: [https://github.com/shaack/cm-chessboard](https://github.com/shaack/cm-chessboard)**

![Example chessboards](https://shaack.com/projekte/assets/img/example_chessboards_staunty.png?v=2)

## Install

**Option 1:** Install the [npm package](https://www.npmjs.com/package/cm-chessboard) with `npm install cm-chessboard`.

**Option 2:** Download the code from [GitHub](https://github.com/shaack/cm-chessboard).

**Option 3:** Use it via CDN https://cdn.jsdelivr.net/npm/cm-chessboard@7/src/Chessboard.js

After installation, copy the sprite in `cm-chessboard/assets/images/` to your projects `assets/images/`
folder. If you put the sprite somewhere else you have to configure the location
with `{sprite.url: "./url/of/chessboard-sprite.svg"}`
(see section 'Configuration' below).

To run the unit tests in `/test` you first have to `npm install` the dev dependencies. Without tests there are no
dependencies.

## Usage

Preconditions for using cm-chessboard in a web page:

1. **include the css:** `assets/styles/cm-chessboard.css`
2. **import the ES6 module:** `import {Chessboard} from "PATH/TO/src/Chessboard.js"`

Example, showing a FEN:

```html

<script type="module">
    import {Chessboard} from "./src/Chessboard.js"

    new Chessboard(document.getElementById("containerId"),
            {position: "rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR"})
</script>
```

Take a look at the [/examples](https://github.com/shaack/cm-chessboard/tree/master/examples) folder for more simple
examples.

## Configuration

Below is the default configuration

```javascript
this.props = {
  position: FEN.empty, // set position as fen, use FEN.start or FEN.empty as shortcuts
  orientation: COLOR.white, // white on bottom
  responsive: true, // resize the board automatically to the size of the context element
  language: navigator.language.substring(0, 2).toLowerCase(), // supports "de" and "en" for now, used for pieces naming
  assetsUrl: "./assets/", // put all css and sprites in this folder
  assetsCache: true, // cache sprites
  style: {
    cssClass: "default", // set the css theme of the board, try "green", "blue" or "chess-club"
    showCoordinates: true, // show ranks and files
    borderType: BORDER_TYPE.none, // "thin" thin border, "frame" wide border with coordinates in it, "none" no border
    aspectRatio: 1, // height/width of the board
    pieces: {
      type: PIECES_FILE_TYPE.svgSprite, // pieces are in an SVG sprite, no other type supported for now
      file: "standard.svg", // the filename of the sprite in `assets/pieces/`
      tileSize: 40 // the tile size in the sprite
    },
    animationDuration: 300 // pieces animation duration in milliseconds. Disable all animations with `0`.
  },
  extensions: [ /* {class: ExtensionClass, props: { ... }} */] // add extensions here
}
```

## API

### constructor

`new Chessboard(context, props = {})`

- **`context`**: the HTML DOM element being the container of the widget
- **`props`**: The board configuration (properties)

### setPiece(square, piece, animated = false)

Sets a piece on a square. Example: `board.setPiece("e4", PIECE.blackKnight, true)` or
`board.setPiece("e4", "bn")`. Remove a Piece with `board.setPiece("e4", null)`. Returns a **Promise**, which is
resolved,
after the animation finished.

### getPiece(square)

Returns the piece on a square or `null` if the square is empty.

### movePiece(squareFrom, squareTo, animated = false)

Move a piece from `squareFrom` to `squareTo`. Returns a **Promise**, which is resolved, after the animation finished.

[Example for **movePiece**](https://shaack.com/projekte/cm-chessboard/examples/pieces-animation.html)

### setPosition(fen, animated = false)

Sets the position as `fen`. Returns a **Promise**, which is resolved, after the animation finished.

[Example for **setPosition**](https://shaack.com/projekte/cm-chessboard/examples/pieces-animation.html)

### getPosition()

Returns the board position as `fen`.

### addMarker(type, square)

> Moved to the Markers extension with version 6

Adds a marker on a square.

Default types are: `MARKER_TYPE.frame`, `MARKER_TYPE.square`, `MARKER_TYPE.dot`, `MARKER_TYPE.circle` exportet
by `Chessboard.js`.

#### You can create your own marker types:

Just create an object like `const myMarker = {class: "markerCssClass", slice: "markerSliceId"}`, where `class` is the
css class of the marker for styling
and `slice` is the `id` in `sprite.svg`. See also [Create your own custom markers](#create-your-own-custom-markers)
below.

[Example for **addMarker**, **getMarkers** and
**removeMarkers**](https://shaack.com/projekte/cm-chessboard/examples/extensions/markers-extension.html)

### getMarkers(type = undefined, square = undefined)

> Moved to the Markers extension with version 6

Returns the board's markers as an array.

Only set type, to get all markers of a type on the board. Set type to `undefined`, to get markers of all types on a
square.
Set `both` to `undefined` to get all markers on the board.

### removeMarkers(type = undefined, square = undefined)

> Moved to the Markers extension with version 6

Removes markers from the board.

Only set `type` to remove all markers of `type` from the board. Set `type` to `undefined`, to remove all types
of markers from a square. Call without parameters to remove all markers from the board.

### setOrientation(color)

Sets the board orientation (color at bottom). Allowed values are `COLOR.white` or `COLOR.black`.

[Example for **setOrientation**](https://shaack.com/projekte/cm-chessboard/examples/enable-input.html)

### getOrientation()

Returns the board orientation.

### destroy()

Removes the board from the DOM.

[Example for **destroy**](https://shaack.com/projekte/cm-chessboard/examples/destroy-many-boards.html)

### enableMoveInput(eventHandler, color = undefined)

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

- **`INPUT_EVENT_TYPE.moveInputStarted`**: User started the move input, `event.square` contains the coordinates. Return true or false to validate the start square.
- **`INPUT_EVENT_TYPE.validateMoveInput`**: User finished the move input, `event.squareFrom` and `event.squareTo` contain the coordinates. Return true or false to validate the move input.
- **`INPUT_EVENT_TYPE.moveInputCanceled`**: User canceled the move with clicking again on the start square or clicking outside the board.

```javascript
chessboard.enableMoveInput((event) => {
  switch (event.type) {
    case INPUT_EVENT_TYPE.moveInputStarted:
      console.log(`moveInputStarted: ${event.square}`)
      // return `true`, if input is accepted/valid, `false` aborts the interaction, the piece will not move
      return true
    case INPUT_EVENT_TYPE.validateMoveInput:
      console.log(`validateMoveInput: ${event.squareFrom}-${event.squareTo}`)
      // return true, if input is accepted/valid, `false` takes the move back
      return true
    case INPUT_EVENT_TYPE.moveInputCanceled:
      console.log(`moveInputCanceled`)
  }
}, COLOR.white)
```

### disableMoveInput()

Disables moves via user input.

### enableSquareSelect(eventHandler)

Enables primary and secondary pointer events on squares.
On desktop devices this means left and right click on squares.

```javascript
board.enableSquareSelect((event) => {
    switch (event.type) {
        case SQUARE_SELECT_TYPE.primary:
        // left click
        case SQUARE_SELECT_TYPE.secondary:
        // right click
    }
})
```

[Example for **enableSquareSelect**](https://shaack.com/projekte/cm-chessboard/examples/extensions/markers-extension.html)

**`event.square`** contains the coordinates of the user input.

### disableSquareSelect()

Disables the square select.

## Piece sets

cm-chessboard supports alternative piece sets. A piece set is defined in an SVG sprite. cm-chessboard is shipped with
two sets, the default [staunty](https://github.com/ornicar/lila/tree/master/public/piece/staunty) (
chessboard-sprite-staunty.svg) and a sprite of the
[Wikimedia standard pieces](https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces/Standard)
(chessboard-sprite.svg).

Sprites must be 40x40px in size where the piece elements must have ids like
"bp" (black pawn) or "wq" (white queen). Just open the sprite in a text editor, SVG is readable like HTML. Also the
markers are defined in the sprite.

## Create your own custom markers

The ability to add custom markers is build in. You can use the existing
marker shapes in the SVG sprite and create your own markers with just css or create
your own custom SVG shapes. With a program like InkScape or Sketch this should be relatively easy.

Example: The markerCircle is defined in the SVG like this.

```svg

<g id="markerCircle" transform="translate(2.000000, 2.000000)" fill="#000000" fill-opacity="0">
    <circle cx="18" cy="18" r="18"/>
</g>
```

It's a circle with the radius 18 and its center at 20/20.

Important is the id "markerCircle". You can set the marker
with `board.addMarker({class: "markerSquare", slice: "markerSquare"}, "e4")`
"emphasize" is the css class, which defines the color and opacity of the marker. "slice" is the id of the marker in the
SVG. This is
also demonstrated in the [mark squares example](https://shaack.com/projekte/cm-chessboard/examples/extensions/markers-extension.html)
.

The color and stroke-width of the marker is defined in the css (or scss). You could also define your marker completely
in the sprite, but then that is not so flexible.

These are the css styles of the markers "markerSquare" and "markerCircleRed".

```css
marker.marker-square {
    fill: black;
    opacity: 0.11;
}

marker.marker-circle-red {
    stroke: #aa0000;
    stroke-width: 3px;
    opacity: 0.4;
}
```

So you can simply add a marker with the id `myMarkerIdInSvg` to the SVG, and add the class `myMarkerCssClass` to the
css. Then you can show it on the field "e4" with

`addMarker({class: "myMarkerCssClass", slice: "myMarkerIdInSvg"}, "e4")`

To allow easy removing of the marker, you have to define the marker type in your code.

```js
const myMarkerType = {class: "myMarkerCssClass", slice: "myMarkerIdInSvg"}
// add
chessboard.addMarker(myMarkerType, "e4")
// remove a specific marker
chessboard.removeMarkers(myMarkerType, "e4")
// remove all "myMarkerType"
chessboard.removeMarkers(myMarkerType)
// remove all markers
chessboard.removeMarkers()
```

## Extensions

cm-chessboard provides the ability to extend its functionality with extensions. Extensions extend the class `Extension`
and have access to the chessboard and can register extension points.

### registerExtensionPoint(name, callback)

```js
class MyCoolChessboardExtension extends Extension {
    constructor(chessboard, props) {
        super(chessboard, props)
        this.registerExtensionPoint(EXTENSION_POINT.moveInput, (data) => {
            // do something on move [start | cancel | done]
            console.log(data)
        })
    }
}
```

Currently possible extension points are defined in `Extension.js`.

```js
export const EXTENSION_POINT = {
  positionChanged: "positionChanged", // the positions of the pieces was changed
  boardChanged: "boardChanged", // the board (orientation) was changed
  moveInputToggled: "moveInputToggled", // move input was enabled or disabled
  moveInput: "moveInput", // move started, moving over a square, validating or canceled
  redrawBoard: "redrawBoard", // called after redrawing the board
  animation: "animation", // called on animation start, end and on every animation frame
  destroy: "destroy" // called, before the board is destroyed
}
```

Enable extensions via the chessboard props.

```js
const chessboard = new Chessboard(document.getElementById("board"), {
    position: FEN.start,
    extensions: // list of used extensions
        [{
            class: MyCoolChessboardExtension, // the class of the extension
            props: {
                // configure the extension here
            }
        }]
})
```

### registerMethod(name, callback)

> Deprecated 2023-05-18, just add methods directly to the chessboard class instance.

Add methods to the main chessboard from your extension with `this.registerMethod("name", callback)`
like `addArrow(type, from, to)` in the
[Arrows extension](https://shaack.com/projekte/cm-chessboard/examples/extensions/arrows-extension.html).

```js
this.registerMethod("addArrow", this.addArrow)
```

### Existing extensions

cm-chessboard is shipped with these extensions.

#### Accessibility Extension

This extension ensures that visual impaired people can better use the chessboard. It displays the braille notation
of the current position in the alt tag of the board image and enables a form to move the pieces via text input. It
can also display the board as HTML table and the pieces as list.

See
example [Accessibility extension](https://shaack.com/projekte/cm-chessboard/examples/extensions/accessibility-extension.html)

##### Usage

```js
const chessboard = new Chessboard(document.getElementById("board"), {
    position: FEN.start,
    sprite: {url: "../assets/images/chessboard-sprite.svg"},
    // animationDuration: 0, // optional, set to 0 to disable animations
    style: {
        cssClass: "default-contrast" // make the coordinates better visible with the "default-contrast" theme
    },
    extensions:
        [{
            class: Accessibility,
            props: {
                brailleNotationInAlt: true, // show the braille notation of the position in the alt attribute of the SVG image
                boardAsTable: true, // display the board additionally as HTML table
                movePieceForm: true, // display a form to move a piece (from, to, move)
                piecesAsList: true, // display the pieces additionally as List
                visuallyHidden: false // hide all those extra outputs visually but keep them accessible for screen readers and braille displays
            }

        }]
})
```

#### Arrows extension

Draw arrows on the board.

Example: [Arrows extension](https://shaack.com/projekte/cm-chessboard/examples/extensions/arrows-extension.html)

##### Methods

###### addArrow(type, fromSquare, toSquare)

Add an arrow.

###### removeArrows(type, from, to)

To remove all arrows, call `chessboard.removeArrows()` without parameters. To remove all arrows of a specific
type (type "danger"), call `chessboard.removeArrows(ARROW_TYPE.danger)`. To remove all arrows starting at "
e2"
you can call `chessboard.removeArrows(undefined, "e2")` and so on...

###### getArrows(type, from, to)

To get all arrows, call `chessboard.getArrows()` without parameters, as with `removeArrows(type, from, to)`.

## Usage with React

There exists a ticket from someone who is using cm-chessboard with react:
https://github.com/shaack/cm-chessboard/issues/20

## Licenses

- License for the code: [MIT](https://github.com/shaack/cm-chessboard/blob/master/LICENSE)
- License for the Staunty SVG-pieces (
  chessboard-sprite-staunty.svg): [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- License for the Wikimedia SVG-pieces (
  chessboard-sprite.svg): [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

## cm-chess

You may also be interested in [cm-chess](https://github.com/shaack/cm-chess), it is like
[chess.js](https://github.com/jhlywa/chess.js), but in ES6 and can handle games and PGNs with variants, NAGs and
comments.

