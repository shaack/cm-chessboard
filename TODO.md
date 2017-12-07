## ToDo

- Animated position changes
- inputMode: INPUT_MODE.dragMarker

## Figure animation

1. Draw all figures in previous position
2. If position changed
    - Iterate through all fields and mark changes
        - find pairs of appear and disappear of the same figure type, prefer nearer distance
            - store these pairs in an array
        - store also left over appears and disappars in the array, will fade in 
        - animate all figures in the array  