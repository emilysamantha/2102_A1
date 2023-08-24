export {Viewport, Constants, Block, Move, Rotate, tetrisShapes}
export type {BlockPosition, State, Key, Event, Shape }

// Constants
const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 200,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
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
}>

const tetrisShapes: Shape[] = [
  {
    // 0
    //  __ __ __ __
    // |  |  |  |  |
    // |__|__|__|__|
    positions: [
      { xPos: -1, yPos: 0 },   // Center
      { xPos: 0, yPos: 0 },
      { xPos: 1, yPos: 0 },
      { xPos: 2, yPos: 0 },
    ],
    color: "lightBlue",
  },
  {
    // 1
    //  __ __
    // |  |  |
    // |__|__|
    // |  |  |
    // |__|__|
    positions: [
      { xPos: 0, yPos: 0 },   // Center
      { xPos: 1, yPos: 0 },
      { xPos: 0, yPos: 1 },
      { xPos: 1, yPos: 1 },
    ],
    color: "yellow"
  },
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
    color: "cornflowerBlue"
  },
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
    color: "salmon"
  },
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
    color: "lightGreen"
  },
  {
    // 5
    // __  __
    //|   |  |
    //|__|__ |__
    //   |  |  |  
    //   |__|__|
    positions: [
      { xPos: -1, yPos: 0 },  
      { xPos: 0, yPos: 0 },  // Center
      { xPos: 0, yPos: 1 },
      { xPos: 1, yPos: 1 },
    ],
    color: "pink"
  },
  {
    // 6
    //    __  
    //   |   |
    // __|__ |__
    //|  |  |  |
    //|__|__|__|
    positions: [
      { xPos: 0, yPos: -1 },   // Center
      { xPos: -1, yPos: 0 },
      { xPos: 0, yPos: 0 },
      { xPos: 0, yPos: 1 },
    ],
    color: "violet"
  }
];

type State = Readonly<{
  gameEnd: boolean;                                     // To end the game
  currScore: number;                                    // To keep track of the score
  highScore: number;                                    // To keep track of the high score
  level: number;                                        // To keep track of the level
  movingShapePosition: BlockPosition;                   // To render the moving shape
  movingShape: Shape;
  // movingShapeIndex: number;                             // To keep track of the current shape from tetrisShapes
  blockFilled: ReadonlyArray<ReadonlyArray<Boolean>>;   // For collision detection
  blockFilledColor: ReadonlyArray<ReadonlyArray<String>>; // To render the fixed blocks
}>;

type Key = "KeyS" | "KeyA" | "KeyD";
type Event = "keydown" | "keyup" | "keypress";

// Action Types
class Move {
  constructor(public readonly direction: number) {}
}

class Rotate {
  constructor() {}
}
