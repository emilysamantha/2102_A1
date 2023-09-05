export { initialState, reduceState, tick };

import {
  BlockPosition,
  Constants,
  GameOver,
  Move,
  NewRandomShape,
  Restart,
  Rotate,
  SaveShape,
  Shape,
  State,
  tetrisShapes,
} from "./types";

/**
 * Initial state
 */
const initialState: State = {
  gameEnd: false,
  currScore: 0,
  highScore: 0,
  level: 1,
  numLinesCleared: 0,
  movingShape: null,
  movingShapePosition: { xPos: 4, yPos: 0 }, // Placeholder position
  nextShape: tetrisShapes[6], // Placeholder shape
  nextShapePosition: { xPos: 0, yPos: 0 }, // Placeholder position
  blockFilledColor: Array.from({ length: Constants.GRID_HEIGHT }, () =>
    Array(Constants.GRID_WIDTH).fill("")
  ),
  promptRestart: false,
  intervalCounter: Constants.TICK_RATE_MS,
  savedShape: null,
} as const;

/**
 * State transducer
 *
 * @param s Current state
 * @param action The action to perform
 * @returns Updated state
 */
const reduceState: (
  s: State,
  action: Move | Rotate | GameOver | Restart | SaveShape | NewRandomShape
) => State = (s, action) =>
  // Move
  action instanceof Move
    ? { ...s, movingShapePosition: moveShape(s, action.direction) }
    : // Rotate
    action instanceof Rotate
    ? {
        ...s,
        movingShape: s.movingShape
          ? rotateShape(s.movingShapePosition, s.movingShape)
          : s.movingShape,
      }
    : // Game Over
    action instanceof GameOver
    ? {
        ...s,
        promptRestart: true,
      }
    : // Restart
    action instanceof Restart
    ? s.gameEnd
      ? {
          ...initialState,
          highScore: s.highScore, // Keep the high score
        }
      : { ...s }
    : 
    // Save Shape
    action instanceof SaveShape ? {
      ...s,
      savedShape: s.movingShape,
      movingShape: s.savedShape
    } :
    // Check if the tick interval is divisible by the fall rate
    // This controls the speed of the moving shape based on the level
    (s.intervalCounter % (Constants.FALL_RATE_MS - (s.level * Constants.SPEED_UP_MS) > 0 ? Constants.FALL_RATE_MS - (s.level * Constants.SPEED_UP_MS) : Constants.MIN_FALL_RATE_MS))  === 0
    ? // Game tick
      tick(s, action)
    : // Wait until the tick interval is divisible by the fall rate
    {
      ...s,
      intervalCounter: s.intervalCounter + Constants.TICK_RATE_MS,
    }

/**
 * Function which updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State, randomShape: NewRandomShape) => {
  // If the s.movingShape is null (start of the game), generate a new shape
  if (s.movingShape === null) {
    const randomX = Math.floor(
      ((randomShape[0] + 1) / 2) * Constants.GRID_WIDTH
    );
    const randomShapeIndex = Math.floor(
      ((randomShape[1] + 1) / 2) * tetrisShapes.length
    );
    const newShape = tetrisShapes[randomShapeIndex] as Shape;
    const randomShapeRotationIndex = Math.floor(
      ((randomShape[2] + 1) / 2) * 4 + 1
    );
    const rotations = Array.from({ length: randomShapeRotationIndex });
    const newShapePosition = {
      xPos: safeXPos(randomX, newShape),
      yPos: 0,
    };
    const newRotatedShape = rotations.reduce(
      (accShape, _) => rotateShape(newShapePosition, accShape as Shape),
      newShape
    );

    return {
      ...s,
      movingShape: newRotatedShape as Shape,
      movingShapePosition: {
        xPos: safeXPos(randomX, newRotatedShape as Shape),
        yPos: 0,
      },
      nextShape: tetrisShapes[randomShapeIndex + (1 % tetrisShapes.length)],
      nextShapePosition: {
        xPos: safeXPos(randomX - 1, newRotatedShape as Shape),
        yPos: 0,
      },
      intervalCounter: Constants.TICK_RATE_MS, // Reset the interval counter
    };
  }

  // Check if the new block exceeds the top of the grid
  if (exceedsTop(s)) {
    return {
      ...s,
      gameEnd: true,
    };
  }

  // Move the moving shape down
  // If moving shape collides with a fixed block or the bottom of the grid
  const newY = s.movingShapePosition.yPos + 1;
  const x = s.movingShapePosition.xPos;

  if (
    s.movingShape?.positions.some(({ xPos, yPos }) =>
      isCollision({ xPos: x + xPos, yPos: newY + yPos }, s.blockFilledColor)
    )
  ) {
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
            s.movingShape ? s.movingShape.color : "",
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
    const newShape = tetrisShapes[randomShapeIndex] as Shape;
    const randomShapeRotationIndex = Math.floor(
      ((randomShape[2] + 1) / 2) * 4 + 1
    );
    const rotations = Array.from({ length: randomShapeRotationIndex });
    const newShapePosition = {
      xPos: randomX,
      yPos: 0,
    };
    const newRotatedShape = rotations.reduce(
      (accShape, _) => rotateShape(newShapePosition, accShape as Shape),
      newShape
    );

    return handleFilledRows({
      ...s,
      blockFilledColor: newBlockFilledColor,
      movingShape: s.nextShape,
      movingShapePosition: s.nextShapePosition,
      nextShape: newRotatedShape as Shape,
      nextShapePosition: {
        xPos: safeXPos(randomX, newRotatedShape as Shape),
        yPos: 0,
      },
      intervalCounter: Constants.TICK_RATE_MS, // Reset the interval counter
    });
  }

  // Else if the moving shape can move down without colliding
  return {
    ...s,
    movingShapePosition: { ...s.movingShapePosition, yPos: newY },
    intervalCounter: Constants.TICK_RATE_MS, // Reset the interval counter
  };
};

/**
 * Function to check if a position is a collision
 *
 * @param pos the position to check
 * @param blockFilled 2D array of booleans representing the fixed blocks
 * @returns whether the position is a collision
 */
const isCollision: (
  pos: BlockPosition,
  blockFilledColor: ReadonlyArray<ReadonlyArray<String>>
) => Boolean = (pos, blockFilledColor) => {
  return (
    // Checks if the shape is at the bottom of the grid or
    pos.yPos >= Constants.GRID_HEIGHT ||
    // collides with a fixed block
    (blockFilledColor[pos.yPos >= 0 ? pos.yPos : 0][pos.xPos] !== "" &&
      pos.xPos < Constants.GRID_WIDTH &&
      pos.xPos >= 0)
  );
};

/**
 * Function to move the moving shape left or right
 * @param s the current state
 * @param moveAmount the amount to move the shape by
 * @returns the updated state with the shape moved
 */
const moveShape = (s: State, moveAmount: number) => {
  return {
    ...s.movingShapePosition,
    xPos:
      // If the shape is at the edge of the grid, do not move
      s.movingShape?.positions.some(
        ({ xPos: xShift }) =>
          s.movingShapePosition.xPos + xShift + moveAmount < 0 ||
          s.movingShapePosition.xPos + xShift + moveAmount >=
            Constants.GRID_WIDTH
      ) ||
      // or if moving the shape collides with a fixed block, do not move
      s.movingShape?.positions.some(({ xPos: xShift, yPos: yShift }) =>
        isCollision(
          {
            xPos: s.movingShapePosition.xPos + xShift + moveAmount,
            yPos: s.movingShapePosition.yPos + yShift,
          },
          s.blockFilledColor
        )
      )
        ? s.movingShapePosition.xPos // Do not move
        : s.movingShapePosition.xPos + moveAmount, // Move right
  };
};

/**
 * Function to check if the new shape exceeds the top of the grid
 * @param s the current state
 * @returns whether the new shape exceeds the top of the grid
 */
const exceedsTop = (s: State) => {
  return (
    s.movingShapePosition.yPos === 0 &&
    s.movingShape?.positions.some(({ xPos: xShift, yPos: yShift }) => {
      return isCollision(
        {
          xPos: s.movingShapePosition.xPos + xShift,
          yPos: s.movingShapePosition.yPos + yShift,
        },
        s.blockFilledColor
      );
    })
  );
};

/**
 * Function to check if a row is filled
 * @param row the row to check
 * @returns whether the row is filled
 */
const isRowFilled = (row: ReadonlyArray<String>) => {
  return row.filter((color) => color !== "").length === Constants.GRID_WIDTH;
};

/**
 * Function to handle filled rows
 * @param s the current state
 * @returns the updated state with filled rows removed and score and level updated
 */
const handleFilledRows = (s: State) => {
  // Return the state with filled rows removed from the blockFilled array
  const addedScore = s.blockFilledColor.reduce(
    (acc, row) => (isRowFilled(row) ? acc + Constants.GRID_WIDTH : acc),
    0
  );
  const newScore = s.currScore + addedScore;

  const newLinesCleared = addedScore / Constants.GRID_WIDTH;
  const addedLevel = Math.floor(newScore / Constants.LEVEL_UP_POINTS) - s.level + 1;
  const newLevel = s.level + addedLevel;

  return {
    ...s,
    currScore: newScore,
    highScore: newScore > s.highScore ? newScore : s.highScore,
    numLinesCleared: (s.numLinesCleared + newLinesCleared) % 10,
    level: newLevel,
    blockFilledColor: s.blockFilledColor.reduce(
      (acc, row, index) =>
        isRowFilled(row)
          ? // Create a new row of "" at the top of the grid, shifting the rest of the rows down
            [Array.from({ length: Constants.GRID_WIDTH }, () => ""), ...acc]
          : // Keep the row as is
            [...acc, s.blockFilledColor[index]],
      [] as ReadonlyArray<ReadonlyArray<String>>
    ),
  };
};

/**
 * Function to rotate the moving shape
 * @param movingShapePosition the position of the moving shape
 * @param shape the shape to rotate
 * @returns the updated shape
 */
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
    positions: safeShapePositions(movingShapePosition, newPositions),
  } as Shape;
};

/**
 * Function to ensure that the random x position for the shape is within the grid
 * @param randomX the random x position to check
 * @param shape the shape to check
 * @returns the safe x position for the shape
 */
const safeXPos = (randomX: number, shape: Shape) => {
  const maxSafeXPos = Constants.GRID_WIDTH - 1 - widthFromCenterToEnd(shape);
  const minSafeXPos = widthFromCenterToStart(shape);

  return randomX >= minSafeXPos
    ? randomX <= maxSafeXPos
      ? randomX
      : maxSafeXPos
    : minSafeXPos;
};

/**
 * Function to ensure that the shape is within the grid
 * @param movingShapePosition the position of the moving shape
 * @param positions the block positions of the shape
 * @returns 
 */
const safeShapePositions: (
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
    return safeShapePositions(
      movingShapePosition,
      positions.map(({ xPos, yPos }) => ({ xPos: xPos + 1, yPos }))
    );
  }
  else if (isBeyondRight) {
    // Shift the shape to the left
    return safeShapePositions(
      movingShapePosition,
      positions.map(({ xPos, yPos }) => ({ xPos: xPos - 1, yPos }))
    );
  }
  return positions;
};

/**
 * Function to calculate the width of the shape from the center to the end
 * @param shape the shape to check
 * @returns the width of the shape from the center to the end
 */
const widthFromCenterToEnd = (shape: Shape): number => {
  const maxX = shape.positions.reduce((max, pos) => Math.max(max, pos.xPos), 0);
  return maxX;
};

/**
 * Function to calculate the width of the shape from the center to the start
 * @param shape the shape to check
 * @returns the width of the shape from the center to the start
 */
const widthFromCenterToStart = (shape: Shape): number => {
  const minX = shape.positions.reduce((min, pos) => Math.min(min, pos.xPos), 0);
  return -minX; // Return the positive value
};
