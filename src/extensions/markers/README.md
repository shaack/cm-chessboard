# cm-chessboard Markers extension

## API

### addMarker(type, square)

Adds a marker on a square.

Default types are: `MARKER_TYPE.frame`, `MARKER_TYPE.square`, `MARKER_TYPE.dot`, `MARKER_TYPE.circle` exported
by `Chessboard.js`.

[Example for **addMarker**, **getMarkers** and
**removeMarkers**](https://shaack.com/projekte/cm-chessboard/examples/extensions/markers-extension.html)

### getMarkers(type = undefined, square = undefined)

Returns the board's markers as an array.

Only set type, to get all markers of a type on the board. Set type to `undefined`, to get markers of all types on a
square.

Set both to `undefined` (or don't set them at all) to get all markers on the board.

### removeMarkers(type = undefined, square = undefined)

Removes markers from the board.

Only set `type` to remove all markers of `type` from the board. Set `type` to `undefined`, to remove all types
of markers from a square. Call without parameters to remove all markers from the board.

## Create your own custom markers

Just create an object like `const myMarker = {class: "markerCssClass", slice: "markerSliceId"}`, where `class` is the
css class of the marker for styling and `slice` is the `id` in `sprite.svg`.

### Example

The markerCircle is defined in the SVG as a circle with a radius of 18:

```svg

<g id="markerCircle" transform="translate(2.000000, 2.000000)" fill="#000000" fill-opacity="0">
    <circle cx="18" cy="18" r="18"/>
</g>
```

Has this CSS, where stroke color, width and opacity are defined:

```css
marker.marker-circle-red {
    stroke: #aa0000;
    stroke-width: 3px;
    opacity: 0.4;
}
```

And is used like this in your JavaScript:

```js
const myMarkerType = {class: "marker-circle-red", slice: "markerCircle"}
// add
chessboard.addMarker(myMarkerType, "e4")
// remove a specific marker
chessboard.removeMarkers(myMarkerType, "e4")
// remove all "myMarkerType"
chessboard.removeMarkers(myMarkerType)
// remove all markers
chessboard.removeMarkers()
```
