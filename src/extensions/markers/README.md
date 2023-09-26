# cm-chessboard Markers extension

## API

### addMarker(type, square)

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

Returns the board's markers as an array.

Only set type, to get all markers of a type on the board. Set type to `undefined`, to get markers of all types on a
square.
Set `both` to `undefined` to get all markers on the board.

### removeMarkers(type = undefined, square = undefined)

Removes markers from the board.

Only set `type` to remove all markers of `type` from the board. Set `type` to `undefined`, to remove all types
of markers from a square. Call without parameters to remove all markers from the board.

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
also demonstrated in
the [mark squares example](https://shaack.com/projekte/cm-chessboard/examples/extensions/markers-extension.html)
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
