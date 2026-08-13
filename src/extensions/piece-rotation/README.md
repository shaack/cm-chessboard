# PieceRotation extension

Rotates the piece glyphs in place, by any angle, optionally animated — either all pieces or only those of one color. The squares and the position stay untouched, only the glyphs turn around their own center.

The main use case is over-the-board play on a tablet lying flat between two players: rotate the pieces by 180 degrees towards the player to move, so both players see their pieces upright.

## Usage

```js
import {PieceRotation} from "cm-chessboard/src/extensions/piece-rotation/PieceRotation.js"

const board = new Chessboard(context, {
    position: FEN.start,
    assetsUrl: "./assets/",
    extensions: [{class: PieceRotation, props: {animationDuration: 300}}]
})

// rotate all pieces, animated, returns a Promise
await board.setPiecesRotation(180)

// rotate only the black pieces, not animated
board.setPiecesRotation(180, {color: COLOR.black, animated: false})

// the current target angle of a color (default COLOR.white)
board.getPiecesRotation(COLOR.black)
```

## Props

| Prop                | Default | Description                                            |
|---------------------|---------|--------------------------------------------------------|
| `angle`             | `0`     | Initial rotation angle in degrees, for all pieces      |
| `animationDuration` | `300`   | Duration of an animated rotation in milliseconds       |

## How it works

The rotation is an additional `SVGTransform` appended to each piece's `use` element, after the translate and scale the view sets there. Appended last, it rotates in sprite coordinates around the tile center, so it composes with any piece position and survives the move animations, which only touch the translate of the surrounding group. A `MutationObserver` on the pieces group re-applies the angles to freshly drawn pieces, so the rotation survives redraws and position changes from any code path.

The rotation is independent of move input. The dragged ghost piece following the pointer is intentionally not rotated.
