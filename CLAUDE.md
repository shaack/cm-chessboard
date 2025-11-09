# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

cm-chessboard is a lightweight, dependency-free JavaScript chessboard library. It's ES6 module-based, responsive, SVG-rendered, and used in production on chessmail.eu/chessmail.de.

**Key Philosophy:** The core is intentionally minimal. Functionality is extended through an extension system rather than adding features to the core.

## Development Commands

### Running Tests

```bash
# Tests use the Teevi framework and must be run in a browser
# Open test/index.html directly to run the test suite
```

### No Build Step
This project has no build process. It uses native ES6 modules that run directly in modern browsers.

## Architecture

### Core Components (MVC Pattern)

The codebase follows a clean MVC architecture:

1. **Model Layer** (`src/model/`)
   - `Position.js` - Board state representation using FEN notation. Contains 64-square array and FEN parsing/serialization
   - `ChessboardState.js` - Manages application state (orientation, input flags, extension points)
   - `Extension.js` - Base class for all extensions. Defines EXTENSION_POINT constants

2. **View Layer** (`src/view/`)
   - `ChessboardView.js` - SVG rendering, board drawing, piece rendering, coordinate display
   - `VisualMoveInput.js` - Handles user interaction (drag & drop, click to move)
   - `PositionAnimationsQueue.js` - Queues and executes piece animations

3. **Controller** (`src/Chessboard.js`)
   - Main API class that coordinates model and view
   - Entry point for all public methods
   - Instantiates extensions from props

4. **Utilities** (`src/lib/`)
   - `Svg.js` - SVG DOM manipulation helpers
   - `Utils.js` - General utilities (URL handling, object merging)

### Data Flow

1. User calls API method on `Chessboard` instance
2. `Chessboard` updates `Position` in `ChessboardState`
3. Extension points are invoked via `state.invokeExtensionPoints()`
4. Animation is queued in `PositionAnimationsQueue`
5. `ChessboardView` renders the changes to SVG

### Extension System

Extensions are the primary way to add functionality. They:
- Extend the `Extension` base class
- Register callbacks at extension points using `registerExtensionPoint(EXTENSION_POINT.*, callback)`
- Can add methods directly to the chessboard instance (e.g., `chessboard.addMarker = this.addMarker.bind(this)`)

**Available Extension Points** (defined in `Extension.js`):
- `positionChanged` - Piece positions changed
- `boardChanged` - Board orientation changed
- `boardResized` - Board was resized
- `moveInputToggled` - Move input enabled/disabled
- `moveInput` - Move events (started, validating, canceled, finished)
- `beforeRedrawBoard` / `afterRedrawBoard` - Board redraw lifecycle
- `animation` - Animation lifecycle hooks
- `destroy` - Cleanup before board destruction

**Included Extensions** (`src/extensions/`):
- `markers/` - Visual markers on squares (frames, circles, dots)
- `arrows/` - Drawing arrows between squares
- `right-click-annotator/` - Right-click UI for annotations (uses markers + arrows)
- `accessibility/` - Screen reader support, braille notation, keyboard input
- `promotion-dialog/` - UI dialog for pawn promotion
- `persistence/` - Save/restore board state to localStorage
- `html-layer/` - Overlay HTML content on the board
- `auto-border-none/` - Utility extension

## Important Implementation Details

### Coordinate System
- Squares are represented as strings: "a1", "h8", etc.
- Internally uses 0-63 index (Position.squareToIndex / indexToSquare)
- Orientation affects rendering but not internal representation

### FEN Handling
- Position class only stores the piece placement (first part of full FEN)
- Full FEN format is supported in setPosition() but only piece positions are stored
- Use `FEN.start` and `FEN.empty` constants

### Piece Naming
- Format: `{color}{type}` - e.g., "wp" (white pawn), "bk" (black king)
- Color: "w" or "b"
- Type: "p", "n", "b", "r", "q", "k"

### SVG Rendering
- Pieces are rendered from SVG sprites (40x40px tiles)
- Sprite can be cached in a hidden div for performance
- Board uses multiple SVG groups as layers (board, coordinates, markers, pieces, etc.)
- Responsive sizing via ResizeObserver or window resize events

### Move Input System
- Implemented in `VisualMoveInput.js`
- Supports both drag-and-drop and click-to-move
- Callback receives event objects with types from `INPUT_EVENT_TYPE`
- Returns true/false to validate moves
- Move input can be enabled per color (white/black/both)

### Animation Queue
- All position changes are queued to prevent conflicts
- Animations return Promises that resolve when complete
- Queue ensures sequential execution even with rapid API calls

## Writing Extensions

Template for a new extension:

```javascript
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"

export class MyExtension extends Extension {
    constructor(chessboard, props = {}) {
        super(chessboard)

        // Set default props
        this.props = {
            myOption: true
        }
        Object.assign(this.props, props)

        // Register extension points
        this.registerExtensionPoint(EXTENSION_POINT.positionChanged, (data) => {
            // React to position changes
        })

        // Add methods to chessboard instance
        chessboard.myMethod = this.myMethod.bind(this)
    }

    myMethod() {
        // Implementation
    }
}
```

Enable extension in chessboard props:
```javascript
extensions: [{class: MyExtension, props: {myOption: false}}]
```

## Common Patterns

### Adding a piece
```javascript
board.setPiece("e4", "wn", true) // animated
```

### Moving pieces
```javascript
board.movePiece("e2", "e4", true) // animated
```

### Setting entire position
```javascript
board.setPosition(FEN.start, true) // animated
```

### Enabling move input
```javascript
board.enableMoveInput((event) => {
    if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
        // Validate the move
        return isLegalMove(event.squareFrom, event.squareTo)
    }
}, COLOR.white) // Optional: restrict to one side
```

### Creating markers (requires Markers extension)
```javascript
board.addMarker(MARKER_TYPE.dot, "e4")
board.removeMarkers(MARKER_TYPE.frame) // Remove by type
board.removeMarkers() // Remove all
```

## Assets Structure

- `assets/pieces/` - SVG sprite files for piece sets (standard.svg, staunty.svg)
- `assets/extensions/` - Assets needed by extensions (markers SVG, arrow SVG, etc.)
- `assets/chessboard.css` - Core styles
- Extension-specific CSS must be included separately when using extensions

## Examples

The `examples/` directory contains working examples demonstrating:
- Simple board creation
- Move input and validation
- Different visual styles
- All included extensions
- Animation examples
- Responsive boards
- Multiple boards on one page

Reference examples when implementing new features or debugging issues.
