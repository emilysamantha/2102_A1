export {Viewport, Constants, Block, Move, Rotate, GameOver, Restart, SaveShape, tetrisShapes}
export type {BlockPosition, State, Key, Event, Shape, NewRandomShape }

// Constants
const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 100, 
} as const;

const Constants = {
  TICK_RATE_MS: 10,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
  LEVEL_UP_POINTS: 20,    // Level up after 2 rows are cleared, adjust this to change the level up points
  FALL_RATE_MS: 500,      // The shape falls every 500ms, adjust this to change the fall rate
  SPEED_UP_MS: 50,        // Each level up, the fall rate decreases by 50ms, adjust this to change the speed up rate
  MIN_FALL_RATE_MS: 100,  // The minimum fall rate is 100ms, adjust this to change the minimum fall rate
} as const;

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

// Types
type BlockPosition = Readonly<{ xPos: number; yPos: number }>;

type Shape = Readonly<{
  positions: ReadonlyArray<BlockPosition>;
  color: string;
  excludeRotation?: boolean;    // To exclude rotation for the square block
}>

const tetrisShapes: Shape[] = [
  {
    // 0
    //   __ __ __ __
    //  |  |  |  |  |
    // |__|_*_|__|__|
    positions: [
      { xPos: -1, yPos: 0 },   
      { xPos: 0, yPos: 0 }, // Center
      { xPos: 1, yPos: 0 },
      { xPos: 2, yPos: 0 },
    ],
    color: "cyan",
  } as Shape,
  {
    // 1
    //  __ __
    // |  |  |
    // |__|__|
    // |  |  |
    // |__|__|
    positions: [
      { xPos: 0, yPos: 0 },   
      { xPos: 1, yPos: 0 },
      { xPos: 0, yPos: 1 },
      { xPos: 1, yPos: 1 },
    ],
    color: "yellow",
    excludeRotation: true, // Mark the square block to exclude rotation
  } as Shape,
  {
    // 2
    // __
    //|  |
    //|__|___ __
    //|  |   |  |
    //|__|_*_|__|
    positions: [
      { xPos: -1, yPos: -1 },  
      { xPos: -1, yPos: 0 },
      { xPos: 0, yPos: 0 }, // Center
      { xPos: 1, yPos: 0 },
    ],
    color: "blue"
  } as Shape,
  {
    // 3
    //          __
    //        |  |
    // __ ___ |__|
    //|  |   |  |
    //|__|_*_|__|
    positions: [
      { xPos: 1, yPos: -1 },   
      { xPos: -1, yPos: 0 },
      { xPos: 0, yPos: 0 },   // Center
      { xPos: 1, yPos: 0 },
    ],
    color: "orange"
  } as Shape,
  {
    // 4
    //    ___ __
    //   |   |  |
    // __|_*_|__|
    //|  |  |  
    //|__|__|
    positions: [
      { xPos: 0, yPos: 0 },   // Center
      { xPos: 1, yPos: 0 },
      { xPos: -1, yPos: 1 },
      { xPos: 0, yPos: 1 },
    ],
    color: "green"
  } as Shape,
  {
    // 5
    // __  __
    //|   |  |
    //|__|_*_|__
    //   |  |  |  
    //   |__|__|
    positions: [
      { xPos: -1, yPos: 0 },  
      { xPos: 0, yPos: 0 },  // Center
      { xPos: 0, yPos: 1 },
      { xPos: 1, yPos: 1 },
    ],
    color: "red"
  } as Shape,
  {
    // 6
    //      __  
    //    |   |
    //  __|__ |__
    // |  |  |  |
    //|__|_*_|__|
    positions: [
      { xPos: 0, yPos: -1 },   // Center
      { xPos: -1, yPos: 0 },
      { xPos: 0, yPos: 0 },
      { xPos: 0, yPos: 1 },
    ],
    color: "purple"
  } 
];

type State = Readonly<{
  gameEnd: boolean;                                     // To end the game
  currScore: number;                                    // To keep track of the score
  highScore: number;                                    // To keep track of the high score
  level: number;                                        // To keep track of the level, after 10 lines are cleared, level up
  numLinesCleared: number;                              // To keep track of the number of lines cleared 
  movingShape: Shape | null;
  movingShapePosition: BlockPosition;                   // To render the moving shape
  nextShape: Shape;                                     // To render the next shape
  nextShapePosition: BlockPosition;                     // To render the next shape
  blockFilledColor: ReadonlyArray<ReadonlyArray<String>>; // To render the fixed blocks
  promptRestart: boolean;                               // To prompt the user to restart the game
  intervalCounter: number;                              // To keep track of the interval
  savedShape: Shape | null;                             // To save the shape
}>;

type Key = "KeyS" | "KeyA" | "KeyD" | "KeyR" | "KeyW";
type Event = "keydown" | "keyup" | "keypress";

type NewRandomShape = [number, number, number]  // Index 0: random x, Index 1: random shape index, Index 2: random rotation index


// Action Types
class Move {
  constructor(public readonly direction: number) {}
}

class Rotate {
  constructor() {}
}

class GameOver {
  constructor() {}
}

class Restart {
  constructor() {}
}

class SaveShape {
  constructor() {}
}