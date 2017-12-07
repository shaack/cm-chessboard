## ToDo

- Don't works on touch because of SVG DOM redrawing.
    - Don't add marker to DOM, just enable them.
        - Create two invisible move marker on draw. Show and translate them to the correct position.
        
### Done

- Don't use "setNeedsRedraw" while dragging. @171207
- Hide figure on drag start, don't remove from DOM. @171207