## ToDo

- Don't works on touch because of SVG DOM redrawing.
    - Don't use "setNeedsRedraw" while dragging.
        - Hide figure on drag start, don't remove from DOM. @done
        - Don't add marker to DOM, just enable them.
            - create two invisible move marker on draw. Show and translate them to the correct position.