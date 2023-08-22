export {IMPLEMENT_THIS, Viewport, Constants, Block, Move}
export type {BlockPosition, State, Key, Event }

/** Constants */
const IMPLEMENT_THIS: any = undefined;

const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 500,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

type BlockPosition = { xPos: number; yPos: number };

type State = Readonly<{
  gameEnd: boolean; // To end the game
  movingShapePosition: BlockPosition; // To render the moving shape
  fixedBlocks: ReadonlyArray<BlockPosition>; // To render blocks
  blockFilled: ReadonlyArray<ReadonlyArray<Boolean>>; // For collision detection
}>;

/** User input */
type Key = "KeyS" | "KeyA" | "KeyD";
type Event = "keydown" | "keyup" | "keypress";

/** Action types */
// TODO: Complete the action types
class Move {
  constructor(public readonly direction: number) {}
}
