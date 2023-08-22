export { initialState }

import { Constants, State } from "./types";


const initialState: State = {
    gameEnd: false,
    movingShapePosition: { xPos: 3, yPos: 0 }, // TODO: Replace with random position
    fixedBlocks: [],
    blockFilled: Array.from({ length: Constants.GRID_HEIGHT }, () =>
      Array(Constants.GRID_WIDTH).fill(false)
    ),
  } as const;

