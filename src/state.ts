export { initialState, reduceState, tick };

import {
  BlockPosition,
  Constants,
  Move,
  Restart,
  Rotate,
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
  level: 0,
  numLinesCleared: 0,
  movingShape: null, 
  movingShapePosition: { xPos: 4, yPos: 0 }, // Placeholder position
  nextShape: tetrisShapes[6], // Placeholder shape
  blockFilledColor: Array.from({ length: Constants.GRID_HEIGHT }, () =>
    Array(Constants.GRID_WIDTH).fill("")
  ),
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
  action: Move | Rotate | Restart | [number, number, number]
) => State = (s, action) =>
  action instanceof Move
    ? // Move
      { ...s, movingShapePosition: moveShape(s, action.direction) }
    : // Rotate
    action instanceof Rotate
    ? {
        ...s,
        movingShape: s.movingShape? rotateShape(s.movingShapePosition, s.movingShape) : s.movingShape,
      }
    : 
    action instanceof Restart
    ? {
      ...s,
      gameEnd: false,
      currScore: 0,
      level: 0,
      numLinesCleared: 0,
      movingShape: null, // null movingShape indicates the start of the game
      movingShapePosition: { xPos: 4, yPos: 0 }, // placeholder position
      nextShape: tetrisShapes[6], // placeholder shape
      blockFilled: Array.from({ length: Constants.GRID_HEIGHT }, () =>
        Array(Constants.GRID_WIDTH).fill(false)
      ),
      blockFilledColor: Array.from({ length: Constants.GRID_HEIGHT }, () =>
        Array(Constants.GRID_WIDTH).fill("")
      ),
    } :
    tick(s, action);

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
    blockFilledColor[pos.yPos >= 0 ? pos.yPos : 0][pos.xPos] !== ""
  );
};

/**
 * Function which updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State, randomShape: [number, number, number]) => {
  // If the s.movingShape is null (start of the game), generate a new shape
  if (s.movingShape === null) {
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

    return {
      ...s,
      movingShape: newRotatedShape as Shape,
      movingShapePosition: newShapePosition,
      nextShape: tetrisShapes[randomShapeIndex + 1 % tetrisShapes.length],
    };
    }

  // Check if the new block exceeds the top of the grid
  if (
    s.movingShapePosition.yPos === 0 &&
    s.movingShape?.positions.some(({ xPos: xShift, yPos: yShift }) =>
      isCollision(
        {
          xPos: s.movingShapePosition.xPos + xShift,
          yPos: s.movingShapePosition.yPos + yShift,
        },
        s.blockFilledColor
      )
    )
  ) {
    // Test
    if (s.gameEnd) console.log("Game end, yPos === 0 and collision");
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

// Function to move the moving shape left or right
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

// Function to check if a row is filled
const isRowFilled = (row: ReadonlyArray<String>) => {
  return row.filter((color) => color !== "").length === Constants.GRID_WIDTH;
};

// Function to handle filled rows
const handleFilledRows = (s: State) => {
  // Return the state with filled rows removed from the blockFilled array
  const addedScore = s.blockFilledColor.reduce(
    (acc, row) => (isRowFilled(row) ? acc + Constants.GRID_WIDTH : acc),
    0
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

// Function to rotate the moving shape
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
