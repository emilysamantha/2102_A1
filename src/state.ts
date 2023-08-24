export { initialState, reduceState, tick };

import { BlockPosition, Constants, Move, Rotate, State } from "./types";

const initialState: State = {
  gameEnd: false,
  currScore: 0,
  highScore: 0,
  level: 0,
  movingShapePosition: { xPos: 0, yPos: 0 }, // TODO: Replace with random position
  blockFilled: Array.from({ length: Constants.GRID_HEIGHT }, () =>
    Array(Constants.GRID_WIDTH).fill(false)
  ),
} as const;

// State transducer
const reduceState: (s: State, action: Move | Rotate | number) => State = (
  s,
  action
) =>
  action instanceof Move
    ? // Move right
      action.direction === 1
      ? {
          ...s,
          movingShapePosition: {
            ...s.movingShapePosition,
            xPos:
              // If the shape is at the right edge of the grid, do not move
              s.movingShapePosition.xPos + 1 >= Constants.GRID_WIDTH ||
              // or if moving the shape to the right collides with a fixed block, do not move
              isCollision({xPos: s.movingShapePosition.xPos + 1, yPos: s.movingShapePosition.yPos}, s.blockFilled)
                ? s.movingShapePosition.xPos
                : s.movingShapePosition.xPos + 1,
          },
        }
      : // Move left
        {
          ...s,
          movingShapePosition: {
            ...s.movingShapePosition,
            xPos:
              // If the shape is at the left edge of the grid, do not move
              s.movingShapePosition.xPos - 1 < 0 ||
              // or if moving the shape to the left collides with a fixed block, do not move
              isCollision({xPos: s.movingShapePosition.xPos - 1, yPos: s.movingShapePosition.yPos}, s.blockFilled)
                ? s.movingShapePosition.xPos
                : s.movingShapePosition.xPos - 1,
          },
        }
    : // Rotate
    action instanceof Rotate
    ? {
        ...s,
        // TODO: Rotate the shape, once shape is implemented
      }
    : tick(s, action);

// Function to check if a position is a collision
const isCollision = (
  pos: BlockPosition,
  blockFilled: ReadonlyArray<ReadonlyArray<Boolean>>
) => {
  return (
    // Checks if the shape is at the bottom of the grid or collides with a fixed block
    pos.yPos >= Constants.GRID_HEIGHT || blockFilled[pos.yPos][pos.xPos]
  );
};

// Function to move the shape down
const moveShapeDown = (s: State, randomX: number) => {
  // Check if the new block exceeds the top of the grid
  if (
    s.movingShapePosition.yPos === 0 &&
    isCollision(
      { xPos: s.movingShapePosition.xPos, yPos: s.movingShapePosition.yPos },
      s.blockFilled
    )
  ) {
    return {
      ...s,
      gameEnd: true,
    };
  }

  // Move the moving shape down
  const newY = s.movingShapePosition.yPos + 1;
  const x = s.movingShapePosition.xPos;

  // If moving shape collides with a fixed block or the bottom of the grid
  if (isCollision({ xPos: x, yPos: newY }, s.blockFilled)) {
    // Update the fixed blocks and blockFilled arrays
    const newBlockFilled = [
      ...s.blockFilled.slice(0, newY - 1),
      [
        ...s.blockFilled[newY - 1].slice(0, x),
        true,
        ...s.blockFilled[newY - 1].slice(x + 1),
      ],
      ...s.blockFilled.slice(newY),
    ];

    // Generate a new shape position
    const newShapePosition = {
      xPos: randomX,
      yPos: 0,
    };

    return handleFilledRows({
      ...s,
      blockFilled: newBlockFilled,
      movingShapePosition: newShapePosition,
    });
  }

  // Else if the moving shape can move down without colliding
  return {
    ...s,
    movingShapePosition: { ...s.movingShapePosition, yPos: newY },
  };
};

// Function to check if a row is filled
const isRowFilled = (row: ReadonlyArray<Boolean>) => {
  return row.filter((bool) => bool).length === Constants.GRID_WIDTH;
};

// Function to handle filled rows
const handleFilledRows = (s: State) => {
  // Return the state with filled rows removed from the blockFilled array
  const currScore = s.blockFilled.reduce(
    (acc, row) => (isRowFilled(row) ? acc + Constants.GRID_WIDTH : acc),
    s.currScore
  );
  return {
    ...s,
    currScore: currScore,
    highScore: currScore > s.highScore ? currScore : s.highScore,
    blockFilled: s.blockFilled.reduce(
      (acc, row) =>
        isRowFilled(row)
          ? // Create a new row of false at the top of the grid, shifting the rest of the rows down
            [Array.from({ length: Constants.GRID_WIDTH }, () => false), ...acc]
          : // Keep the row as is
            [...acc, row],
      [] as ReadonlyArray<ReadonlyArray<Boolean>>
    ),
  };
};

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State, randomX: number) => {
  return moveShapeDown(s, randomX);
};
