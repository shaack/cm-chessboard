# chessmailboardJS
Chessboard for chessmail.eu

## Requirements
- jQuery
- chess.js

## Figures
- One file per set, like `figures/commons.svg`  

## Configuration
On the right, default values
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

## API
### fen(string fen)
- Set the position as fen
### enableMoves(boolean enable)
- Enable interactive Moving
### callbacks
#### onMove(fieldFrom, fieldTo)
- Click oder Drag allowed

# References
- http://keith-wood.name/svg.html
- https://css-tricks.com/ajaxing-svg-sprite/
- https://stackoverflow.com/questions/16488884/add-svg-element-to-existing-svg-using-dom
- https://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element


