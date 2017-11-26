# chessmailboardJS
Chessboard for chessmail.eu / chessmail.de
No runtime requirements.

## Figures
- One file per set, see `figures/commons.svg`  

## Configuration
With default values: 
```
var config = {
    figures: "media/commons.js",
    markers: "media/markers.js",
    initialPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    style : {
        darkField: "#",
        whiteField: "#",
        fieldBorder: "#",
        boardBorder: "#",
        coordinates: "inside"
    }
}
```  

## API (Not implemented yet)
### fen(string fen)
- Set the position as fen
### enableMoves(boolean enable)
- Enable interactive Moving via Mouse or Touch
### callbacks
#### onMove(fieldFrom, fieldTo)
- Click oder Drag allowed

# References
- https://css-tricks.com/ajaxing-svg-sprite/
- https://stackoverflow.com/questions/16488884/add-svg-element-to-existing-svg-using-dom
- https://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element

## SVG.js
- http://svgjs.com/
- https://stackoverflow.com/questions/15911246/loading-a-svg-file-with-svg-js

