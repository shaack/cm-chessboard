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
this.config = {
    position: startPositionFen,
    orientation: COLOR.white, // white on bottom
    showNotation: false, // TODO
    sprite: "../assets/sprite.svg", // figures and markers
    spriteGrid: 40, // one figure every 40 px
    responsive: false, // detect window resize
    // moveInputMode: MOVE_MODE.pbm, // type of interactive movement with mouse or tap
    onBeforeMove: null, // callback, before interactive move, return true for ok
    onAfterMove: null // callback after interactive move
};
```  

## API (not implemented yet)

### fen(string fen)
- Set the position as fen

### enableMoves(boolean enable)
- Enable interactive moving

### callbacks

#### onBeforeMove(fieldFrom, fieldTo)
- Click oder drag allowed

#### onAfterMove(fieldFrom, fieldTo)
- Click oder drag allowed


