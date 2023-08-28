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
  TICK_RATE_MS: 300,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
  LEVEL_UP_POINTS: 50,
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
  widthFromCenterToEnd: number;
  widthFromCenterToStart: number;
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
    widthFromCenterToEnd: 2,
    widthFromCenterToStart: 1,
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
    widthFromCenterToEnd: 1,
    widthFromCenterToStart: 0,
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
    widthFromCenterToEnd: 1,
    widthFromCenterToStart: 1,
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
    widthFromCenterToEnd: 1,
    widthFromCenterToStart: 1,
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
    widthFromCenterToEnd: 1,
    widthFromCenterToStart: 1,
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
    widthFromCenterToEnd: 1,
    widthFromCenterToStart: 1,
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
    widthFromCenterToEnd: 1,
    widthFromCenterToStart: 1,
    color: "purple"
  } 
];

type State = Readonly<{
  gameEnd: boolean;                                     // To end the game
  currScore: number;                                    // To keep track of the score
  highScore: number;                                    // To keep track of the high score
  level: number;                                        // To keep track of the level, after 10 lines are cleared, level up
  numLinesCleared: number;                              // To keep track of the number of lines cleared 
  movingShape: Shape;
  movingShapePosition: BlockPosition;                   // To render the moving shape
  nextShape: Shape;                                     // To render the next shape
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
