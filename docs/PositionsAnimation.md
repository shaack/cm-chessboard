# Positions Queue

- Extra Class
- Holds the Queue
- API 
  - `isRunning(): boolean`
  - `pushPosition(position, animated)`
  - `run(): Promise` // starts the animation, callback when finished, if running : Promis
  - `skip(callback): Promise` // skips all running steps, displays the last position and returns to callback
- Positions are set immediately in the Model
  - Then they are pushed into an Animations queue and run (if not running)
