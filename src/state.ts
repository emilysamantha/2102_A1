export { initialState }

import { Constants, Move, State } from "./types";


const initialState: State = {
    gameEnd: false,
    movingShapePosition: { xPos: 0, yPos: 0 }, // TODO: Replace with random position
    fixedBlocks: [],
    blockFilled: Array.from({ length: Constants.GRID_HEIGHT }, () =>
      Array(Constants.GRID_WIDTH).fill(false)
    ),
  } as const;

  const reduceState: (s: State, action: Move) => State = (s, action) => 
  action.direction === 1
    ? { ...s, movingShapePosition: { ...s.movingShapePosition, xPos: s.movingShapePosition.xPos + 1 } }
    : { ...s, movingShapePosition: { ...s.movingShapePosition, xPos: s.movingShapePosition.xPos - 1 } };
