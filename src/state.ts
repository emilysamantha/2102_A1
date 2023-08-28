export { initialState, reduceState, tick };

import {
  BlockPosition,
  Constants,
  Move,
  Rotate,
  Shape,
  State,
  tetrisShapes,
} from "./types";

const initialState: State = {
  gameEnd: false,
  currScore: 0,
  highScore: 0,
  level: 0,
  numLinesCleared: 0,
  movingShape: tetrisShapes[0],                   // TODO: Replace with random shape
  movingShapePosition: { xPos: 4, yPos: 0 },      // TODO: Replace with random position
  nextShape: tetrisShapes[6],                     // TODO: Replace with random shape
  blockFilled: Array.from({ length: Constants.GRID_HEIGHT }, () =>
    Array(Constants.GRID_WIDTH).fill(false)
  ),
  blockFilledColor: Array.from({ length: Constants.GRID_HEIGHT }, () =>
    Array(Constants.GRID_WIDTH).fill("")
  ),
} as const;

// State transducer
const reduceState: (
  s: State,
  action: Move | Rotate | [number, number, number]
) => State = (s, action) =>
  action instanceof Move
    ? // Move right
      action.direction === 1
      ? {
          ...s,
          movingShapePosition: {
            ...s.movingShapePosition,
            xPos:
              // If the shape is at the right edge of the grid, do not move
              s.movingShape.positions.some(
                ({ xPos: xShift }) =>
                  s.movingShapePosition.xPos + xShift + 1 >=
                  Constants.GRID_WIDTH
              ) ||
              // or if moving the shape to the right collides with a fixed block, do not move
              s.movingShape.positions.some(({ xPos: xShift, yPos: yShift }) =>
                isCollision(
                  {
                    xPos: s.movingShapePosition.xPos + xShift + 1,
                    yPos: s.movingShapePosition.yPos + yShift,
                  },
                  s.blockFilled
                )
              )
                ? 
                  s.movingShapePosition.xPos        // Do not move
                : s.movingShapePosition.xPos + 1,   // Move right
          },
        }
      : // Move left
        {
          ...s,
          movingShapePosition: {
            ...s.movingShapePosition,
            xPos:
              // If the shape is at the left edge of the grid, do not move
              s.movingShape.positions.some(
                ({ xPos: xShift }) =>
                  s.movingShapePosition.xPos + xShift - 1 < 0
              ) ||
              // or if moving the shape to the left collides with a fixed block, do not move
              s.movingShape.positions.some(({ xPos: xShift, yPos: yShift }) => isCollision(
                {
                  xPos: s.movingShapePosition.xPos + xShift - 1,
                  yPos: s.movingShapePosition.yPos + yShift,
                },
                s.blockFilled
              ))
                ? s.movingShapePosition.xPos
                : s.movingShapePosition.xPos - 1,
          },
        }
    : // Rotate
    action instanceof Rotate
    ? {
        ...s,
        movingShape: rotateShape(s.movingShapePosition, s.movingShape),
      }
    : tick(s, action);

// Function to check if a position is a collision
const isCollision = (
  pos: BlockPosition,
  blockFilled: ReadonlyArray<ReadonlyArray<Boolean>>
) => {
  return (
    // Checks if the shape is at the bottom of the grid or
    pos.yPos >= Constants.GRID_HEIGHT ||
    // collides with a fixed block
    blockFilled[pos.yPos >= 0 ? pos.yPos : 0][pos.xPos]
  );
};

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State, randomShape: [number, number, number]) => {
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
  // Test
  if (s.gameEnd) console.log("Game end, yPos === 0 and collision")

  // Move the moving shape down
  // If moving shape collides with a fixed block or the bottom of the grid
  const newY = s.movingShapePosition.yPos + 1;
  const x = s.movingShapePosition.xPos;

  if (
    s.movingShape.positions.some(({ xPos, yPos }) =>
      isCollision({ xPos: x + xPos, yPos: newY + yPos }, s.blockFilled)
    )
  ) {
    // TODO: Check if yPos is less than 0
    if (s.movingShape.positions.some(({ yPos }) => newY + yPos < 0)) {
      // Test
      console.log("Game end, yPos < 0")
      return {
        ...s,
        gameEnd: true,
      };
    }
    // Update the blockFilled array
    const newBlockFilled = s.movingShape.positions.reduce(
      (accBlockFilled, { xPos: xShift, yPos: yShift }) => {
        return [
          ...accBlockFilled.slice(
            0,
            Math.max(0, s.movingShapePosition.yPos + yShift)
          ),
          [
            ...accBlockFilled[Math.max(0, newY + yShift - 1)].slice(
              0,
              x + xShift
            ),
            true,
            ...accBlockFilled[Math.max(0, newY + yShift - 1)].slice(
              x + xShift + 1
            ),
          ],
          ...accBlockFilled.slice(Math.max(0, newY + yShift)),
        ];
      },
      s.blockFilled
    );

    // Update the blockFilledColor array
    const newBlockFilledColor = s.movingShape.positions.reduce(
      (accBlockFilledColor, { xPos: xShift, yPos: yShift }) => {
        return [
          ...accBlockFilledColor.slice(
            0,
            Math.max(0, s.movingShapePosition.yPos + yShift)
          ),
          [
            ...accBlockFilledColor[Math.max(0, newY + yShift - 1)].slice(
              0,
              x + xShift
            ),
            s.movingShape.color,
            ...accBlockFilledColor[Math.max(0, newY + yShift - 1)].slice(
              x + xShift + 1
            ),
          ],
          ...accBlockFilledColor.slice(Math.max(0, newY + yShift)),
        ];
      },
      s.blockFilledColor
    );

    // Generate a new shape
    const randomX = Math.floor(
      ((randomShape[0] + 1) / 2) * Constants.GRID_WIDTH
    );
    const randomShapeIndex = Math.floor(
      ((randomShape[1] + 1) / 2) * tetrisShapes.length
    );
    const randomShapeRotationIndex = Math.floor(
      ((randomShape[2] + 1) / 2) * 4 + 1
    );
    const rotations = Array.from({ length: randomShapeRotationIndex });
    const newShapePosition = {
      xPos: safeXPos(randomX, tetrisShapes[randomShapeIndex]),
      yPos: 0,
    };
    const newRotatedShape = rotations.reduce(
      (accShape, _) => rotateShape(newShapePosition, accShape as Shape),
      tetrisShapes[randomShapeIndex] as Shape
    );

    return handleFilledRows({
      ...s,
      blockFilled: newBlockFilled,
      blockFilledColor: newBlockFilledColor,
      movingShape: s.nextShape,
      nextShape: newRotatedShape as Shape,
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
  const addedScore = s.blockFilled.reduce(
    (acc, row) => (isRowFilled(row) ? acc + Constants.GRID_WIDTH : acc), 0
  );
  const newScore = s.currScore + addedScore;

  const newLinesCleared = addedScore / Constants.GRID_WIDTH;
  const addedLevel = Math.floor(newScore / Constants.LEVEL_UP_POINTS) - s.level;
  const newLevel = s.level + addedLevel;

  return {
    ...s,
    currScore: newScore,
    highScore: newScore > s.highScore ? newScore : s.highScore,
    numLinesCleared: (s.numLinesCleared + newLinesCleared) % 10,
    level: newLevel,
    blockFilled: s.blockFilled.reduce(
      (acc, row) =>
        isRowFilled(row)
          ? // Create a new row of false at the top of the grid, shifting the rest of the rows down
            [Array.from({ length: Constants.GRID_WIDTH }, () => false), ...acc]
          : // Keep the row as is
            [...acc, row],
      [] as ReadonlyArray<ReadonlyArray<Boolean>>
    ),
    blockFilledColor: s.blockFilled.reduce(
      (acc, row, index) =>
        isRowFilled(row) ?
          // Create a new row of "" at the top of the grid, shifting the rest of the rows down
          [Array.from({ length: Constants.GRID_WIDTH }, () => ""), ...acc]
          : // Keep the row as is
          [...acc, s.blockFilledColor[index]],
          [] as ReadonlyArray<ReadonlyArray<String>>
    )
  };
};

const rotateShape = (
  movingShapePosition: BlockPosition,
  shape: Shape
): Shape => {
  if (shape.excludeRotation) {
    return shape; // Do not rotate if marked to exclude rotation
  }

  const newPositions = shape.positions.map((pos) => ({
    xPos: -pos.yPos,
    yPos: pos.xPos,
  }));

  return {
    ...shape,
    positions: safeShapePosition(movingShapePosition, newPositions),
  } as Shape;
};

const safeXPos = (randomX: number, shape: Shape) => {
  const maxSafeXPos = Constants.GRID_WIDTH - shape.widthFromCenterToEnd;
  const minSafeXPos = shape.widthFromCenterToStart;

  return randomX >= minSafeXPos
    ? randomX <= maxSafeXPos
      ? randomX
      : maxSafeXPos
    : minSafeXPos;
};

const safeShapePosition: (
  movingShapePosition: BlockPosition,
  positions: ReadonlyArray<BlockPosition>
) => ReadonlyArray<BlockPosition> = (movingShapePosition, positions) => {
  const isBeyondLeft = positions.some(
    ({ xPos: xShift }) => movingShapePosition.xPos + xShift < 0
  );
  const isBeyondRight = positions.some(
    ({ xPos: xShift }) =>
      movingShapePosition.xPos + xShift >= Constants.GRID_WIDTH
  );
  if (isBeyondLeft) {
    // Shift the shape to the right
    console.log("isBeyondLeft");
    return safeShapePosition(
      movingShapePosition,
      positions.map(({ xPos, yPos }) => ({ xPos: xPos + 1, yPos }))
    );
  }
  if (isBeyondRight) {
    console.log("isBeyondRight");
    // Shift the shape to the left
    return safeShapePosition(
      movingShapePosition,
      positions.map(({ xPos, yPos }) => ({ xPos: xPos - 1, yPos }))
    );
  }
  return positions;
};
