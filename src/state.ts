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
  movingShape: tetrisShapes[0], // TODO: Replace with random shape
  movingShapePosition: { xPos: 4, yPos: 0 }, // TODO: Replace with random position
  movingShapeIndex: 0, // TODO: Replace with random index
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
              // s.movingShapePosition.xPos + 1 >= Constants.GRID_WIDTH ||
              // or if moving the shape to the right collides with a fixed block, do not move
              isCollision(
                {
                  xPos: s.movingShapePosition.xPos + 1,
                  yPos: s.movingShapePosition.yPos,
                },
                s.blockFilled
              )
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
              s.movingShape.positions.some(
                ({ xPos: xShift }) =>
                  s.movingShapePosition.xPos + xShift - 1 < 0
              ) ||
              // s.movingShapePosition.xPos - 1 < 0 ||
              // or if moving the shape to the left collides with a fixed block, do not move
              isCollision(
                {
                  xPos: s.movingShapePosition.xPos - 1,
                  yPos: s.movingShapePosition.yPos,
                },
                s.blockFilled
              )
                ? s.movingShapePosition.xPos
                : s.movingShapePosition.xPos - 1,
          },
        }
    : // Rotate
    action instanceof Rotate
    ? {
        ...s,
        movingShape: rotateShape(s.movingShape),
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
    blockFilled[pos.yPos][pos.xPos]
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

  // Move the moving shape down
  // If moving shape collides with a fixed block or the bottom of the grid
  const newY = s.movingShapePosition.yPos + 1;
  const x = s.movingShapePosition.xPos;

  if (
    s.movingShape.positions.some(({ xPos, yPos }) =>
      isCollision({ xPos: x + xPos, yPos: newY + yPos }, s.blockFilled)
    )
  ) {
    // Update the blockFilled array
    const newBlockFilled = s.movingShape.positions.reduce(
      (accBlockFilled, { xPos: xShift, yPos: yShift }) => {
        return [
          ...accBlockFilled.slice(0, s.movingShapePosition.yPos + yShift),
          [
            ...accBlockFilled[newY + yShift - 1].slice(0, x + xShift),
            true,
            ...accBlockFilled[newY + yShift - 1].slice(x + xShift + 1),
          ],
          ...accBlockFilled.slice(newY + yShift),
        ];
      },
      s.blockFilled
    );

    // Update the blockFilledColor array
    const newBlockFilledColor = s.movingShape.positions.reduce(
      (accBlockFilledColor, { xPos: xShift, yPos: yShift }) => {
        return [
          ...accBlockFilledColor.slice(0, s.movingShapePosition.yPos + yShift),
          [
            ...accBlockFilledColor[newY + yShift - 1].slice(0, x + xShift),
            s.movingShape.color,
            ...accBlockFilledColor[newY + yShift - 1].slice(x + xShift + 1),
          ],
          ...accBlockFilledColor.slice(newY + yShift),
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
    )
    const rotations = Array.from({ length: randomShapeRotationIndex });
    const newRotatedShape = rotations.reduce((accShape, _) => rotateShape(accShape as Shape), tetrisShapes[randomShapeIndex] as Shape)
    const newShapePosition = {
      xPos: safeXPos(randomX, tetrisShapes[randomShapeIndex]),
      yPos: 0,
    };

    return handleFilledRows({
      ...s,
      blockFilled: newBlockFilled,
      blockFilledColor: newBlockFilledColor,
      movingShape: newRotatedShape as Shape,
      movingShapePosition: newShapePosition,
      movingShapeIndex: randomShapeIndex,
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

const rotateShape = (shape: Shape): Shape => {
  if (shape.excludeRotation) {
    return shape; // Do not rotate if marked to exclude rotation
  }

  const newPositions = shape.positions.map((pos) => ({
    xPos: -pos.yPos,
    yPos: pos.xPos,
  }));
  return {
    ...shape,
    positions: newPositions,
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
