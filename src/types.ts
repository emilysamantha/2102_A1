export {IMPLEMENT_THIS, Viewport, Constants, Block, Move, Rotate}
export type {BlockPosition, State, Key, Event }

// Constants
const IMPLEMENT_THIS: any = undefined;

const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 100,
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

type State = Readonly<{
  gameEnd: boolean;                                     // To end the game
  currScore: number;                                    // To keep track of the score
  movingShapePosition: BlockPosition;                   // To render the moving shape
  blockFilled: ReadonlyArray<ReadonlyArray<Boolean>>;   // For collision detection
}>;

type Key = "KeyS" | "KeyA" | "KeyD";
type Event = "keydown" | "keyup" | "keypress";

// Action Types
class Move {
  constructor(public readonly direction: number) {}
}

class Tick {
  constructor(public readonly elapsed: number) {}
}

class Rotate {
  constructor() {}
}