# Premove extension

Lets the player enter a move while it is the opponent's turn. The move is stored as premove and the app
plays it right after the opponent's move. Modeled after lichess' [chessground](https://github.com/lichess-org/chessground).

[Example](https://shaack.com/projekte/cm-chessboard/examples/extensions/premove-extension.html)

## How it works

- The board does not know whose turn it is, the app tells it with `setTurn(color)`.
- While it is not the player's turn, the extension takes over the move input of the player's pieces.
  The app's `moveInputCallback` does not get these events.
- A premove is stored, not executed. The piece stays on its square, the from and to squares are marked.
  The board position never diverges from the game.
- Premove destinations are pseudo legal: only the geometry of the piece counts, blockers are ignored, because
  the position changes before the premove is played. Moves into own pieces (recaptures) and castling are allowed.
- Move or premove is decided on drop. If the opponent moves while the player drags, the drop is a regular move.
- After it applied the opponent's move, the app calls `playPremove(executor)`. The executor makes the move with
  the real rules (e.g. chess.js). The premove is cleared in any case.
- The premove is canceled by a click on the board, if the premoved piece is captured, or with `cancelPremove()`.

## Usage

```html
<link rel="stylesheet" href="./node_modules/cm-chessboard/assets/extensions/markers/markers.css"/>
<link rel="stylesheet" href="./node_modules/cm-chessboard/assets/extensions/premove/premove.css"/>
```

```javascript
import {Markers} from "cm-chessboard/src/extensions/markers/Markers.js"
import {Premove} from "cm-chessboard/src/extensions/premove/Premove.js"

const board = new Chessboard(element, {
    position: chess.fen(),
    extensions: [{class: Markers}, {class: Premove, props: {color: COLOR.white}}]
})
board.setTurn(COLOR.white)
// keep the move input enabled for the player's color the whole game, don't disable it on the opponent's turn
board.enableMoveInput(inputHandler, COLOR.white)

// after the player moved
board.setTurn(COLOR.black)

// when the opponent's move arrives
chess.move(opponentMove)
board.setPosition(chess.fen(), true)
const played = board.playPremove((premove) => { // {from, to, piece, promotion}
    if (!chess.move({from: premove.from, to: premove.to, promotion: premove.promotion})) {
        return false // illegal now, the premove is dropped
    }
    board.setPosition(chess.fen(), true) // the animation is queued after the opponent's move
    sendMoveToServer(premove)
    return true
})
if (played) {
    board.setTurn(COLOR.black)
}
```

Call `playPremove` synchronously, right after the opponent's move. Don't wait for the animation, the board queues
the animations. `playPremove` sets the turn to the player's color before it calls the executor.

## Props

```javascript
{
    color: chessboard.getOrientation(), // the color of the player, who can premove
    markers: true, // mark the premove and its destinations, needs the Markers extension
    autoQueen: true, // promote premoves to a queen, else show the PromotionDialog (if added)
    castle: true, // allow castling premoves (king to c/g file or onto an own rook)
    dests: null, // optional `(square, piece, chessboard) => [squares]` for custom (variant) premove destinations
    cancelOnRightClick: false, // cancel the premove with a right click on the board
    onSet: null, // `(premove) => {}` called after a premove was set
    onUnset: null // `(premove, reason) => {}` called after a premove was unset, see PREMOVE_UNSET_REASON
}
```

## API

Added to the chessboard instance:

- `setTurn(color)`, `getTurn()` – the color to move, `null` disables premoves
- `isPremoveTurn()` – `true`, while the player's moves are stored as premoves
- `getPremove()` – the stored premove `{from, to, piece, promotion}` or `null`
- `setPremove(from, to, promotion)` – set a premove programmatically, e.g. from keyboard input
- `cancelPremove()`
- `playPremove(executor)` – play the stored premove, returns `true`, if the executor accepted it
- `getPremoveDests(square)` – the premove destinations of the piece on `square`

Also exported: `premoveDests(position, square, castle)`, `PREMOVE_MARKER_TYPE`, `PREMOVE_UNSET_REASON`.
