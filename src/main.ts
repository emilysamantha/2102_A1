/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";
import { fromEvent, interval, merge, Observable } from "rxjs";
import { map, filter, scan } from "rxjs/operators";
import { Constants, Viewport, Key, Block, BlockPosition, State } from "./types";
import { RNG } from "./util";
import { initialState } from "./state";
import { createSvgElement, hide, show } from "./view";

function createRngStreamFromSource<T>(source$: Observable<T>) {
  return function createRngStream(seed: number): Observable<number> {
    const randomNumberStream = source$.pipe(
      scan((acc, _) => RNG.hash(acc), seed),
      map(RNG.scale),
      map((v) => ((v + 1) / 2) * Constants.GRID_WIDTH)
    );
    return randomNumberStream;
  };
}

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State) => {
  // 1. Move the shape down
  const newY = s.movingShapePosition.yPos + 1;
  const x = s.movingShapePosition.xPos;

  // - Check for collision
  if (isCollision(x, newY, s.blockFilled)) {
    const newFixedBlocks = [...s.fixedBlocks, s.movingShapePosition]; // TODO: Filter the y position of the fixed blocks to remove the filled rows
    const newBlockFilled = [
      ...s.blockFilled.slice(0, newY - 1),
      [
        ...s.blockFilled[newY - 1].slice(0, x),
        true,
        ...s.blockFilled[newY - 1].slice(x + 1),
      ],
      ...s.blockFilled.slice(newY),
    ];

    // - Generate a new shape position
    const newShapePosition = {
      xPos: Math.floor(Math.random() * Constants.GRID_WIDTH),
      yPos: 0,
    };

    // - Check for filled rows
    // > Reset blockFilled with filled rows to false

    // > Move all blocks all the way down -> update blockFilled and fixedBlocks

    return {
      ...s,
      movingShapePosition: newShapePosition,
      fixedBlocks: newFixedBlocks,
      blockFilled: newBlockFilled,
    };
  }

  // Move the shape down on each tick
  return {
    ...s,
    movingShapePosition: { ...s.movingShapePosition, yPos: newY },
  };
};

// Collision detection function
const isCollision = (
  x: number,
  y: number,
  blockFilled: ReadonlyArray<ReadonlyArray<Boolean>>
) => {
  return (
    // Checks if the shape is at the bottom of the grid or collides with a fixed block
    y >= Constants.GRID_HEIGHT ||
    // fixedBlocks.some(({ xPos, yPos }) => xPos === x && yPos === y)
    blockFilled[y][x]
  );
};

// Filled row detection function
const isRowFilled = (row: ReadonlyArray<Boolean>) => {
  return row.filter((bool) => bool).length === Constants.GRID_WIDTH;
};

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  /** User input */

  const key$ = fromEvent<KeyboardEvent>(document, "keypress");

  const fromKey = (keyCode: Key) =>
    key$.pipe(filter(({ code }) => code === keyCode));

  // TODO: Implement moving the shape left, right, and down
  const left$ = fromKey("KeyA");
  const right$ = fromKey("KeyD");
  const down$ = fromKey("KeyS");

  /** Observables */

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS);

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {
    // Add blocks to the main grid canvas
    // const cube = createSvgElement(svg.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: "0",
    //   y: "0",
    //   style: "fill: green",
    // });
    // svg.appendChild(cube);

    svg.innerHTML = "";

    // Render fixed blocks
    s.fixedBlocks.forEach(({ xPos, yPos }) => {
      const block = createSvgElement(svg.namespaceURI, "rect", {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${Block.WIDTH * xPos}`,
        y: `${Block.HEIGHT * yPos}`,
        style: "fill: green", // Color for fixed blocks
      });
      svg.appendChild(block);
    });
    // s.blockFilled.forEach((row) => row.filter((bool) => bool).map())

    // Render the moving shape
    const { xPos, yPos } = s.movingShapePosition;
    const cube = createSvgElement(svg.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.WIDTH * xPos}`,
      y: `${Block.HEIGHT * yPos}`,
      style: "fill: pink", // Color for the moving shape
    });
    svg.appendChild(cube);

    // const cube2 = createSvgElement(svg.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `${Block.WIDTH * (3 - 1)}`,
    //   y: `${Block.HEIGHT * (20 - 1)}`,
    //   style: "fill: red",
    // });
    // svg.appendChild(cube2);
    // const cube3 = createSvgElement(svg.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `${Block.WIDTH * (4 - 1)}`,
    //   y: `${Block.HEIGHT * (20 - 1)}`,
    //   style: "fill: red",
    // });
    // svg.appendChild(cube3);

    // Add a block to the preview canvas
    // const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `${Block.WIDTH * 2}`,
    //   y: `${Block.HEIGHT}`,
    //   style: "fill: green",
    // });
    // preview.appendChild(cubePreview);
  };

  const source$ = merge(tick$)
    .pipe(
      scan(tick, initialState),
      map((s) => (s.gameEnd ? initialState : s))
    )
    .subscribe((s: State) => {
      render(s);

      if (s.gameEnd) {
        show(gameover);
      } else {
        hide(gameover);
      }
    });
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
