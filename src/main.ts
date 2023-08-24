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
import {
  Constants,
  Viewport,
  Key,
  Block,
  State,
  Move,
  Rotate,
} from "./types";
import { RNG } from "./util";
import { initialState, reduceState, tick } from "./state";
import { createSvgElement, hide, show } from "./view";

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
function main() {
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

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {
    // Reset the canvas
    svg.innerHTML = "";

    // Update the level
    levelText.innerHTML = `${s.level}`;

    // Update the score
    scoreText.innerHTML = `${s.currScore}`;

    // Update the high score
    highScoreText.innerHTML = `${s.highScore}`;

    // Render blocks
    s.blockFilled.forEach((row, y) =>
      row.forEach((bool, x) => {
        if (bool) {
          const block = createSvgElement(svg.namespaceURI, "rect", {
            height: `${Block.HEIGHT}`,
            width: `${Block.WIDTH}`,
            x: `${Block.WIDTH * x}`,
            y: `${Block.HEIGHT * y}`,
            style: "fill: green", // Color for fixed blocks, TODO: stick to the shape's color
          });
          svg.appendChild(block);
        }
      })
    );

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

  // Observable streams
  const gameClock$ = interval(Constants.TICK_RATE_MS);

  const key$ = fromEvent<KeyboardEvent>(document, "keypress");
  const fromKey = (keyCode: Key) =>
    key$.pipe(filter(({ code }) => code === keyCode));
  const left$ = fromKey("KeyA").pipe(map(() => new Move(-1)));
  const right$ = fromKey("KeyD").pipe(map(() => new Move(1)));
  const rotate$ = fromKey("KeyS").pipe(map(() => new Rotate()));

  const xRandom$ = createRngStreamFromSource(gameClock$)(new Date().getTime()); 
  
  // Merge all streams
  const source$ = merge(left$, right$, rotate$, xRandom$)
    .pipe(
      scan(reduceState, initialState),
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

function createRngStreamFromSource<T>(source$: Observable<T>) {
  return function createRngStream(seed: number): Observable<number> {
    const randomNumberStream = source$.pipe(
      scan((acc, _) => RNG.hash(acc), seed),
      map(RNG.scale),
      map((v) => Math.floor(((v + 1) / 2) * Constants.GRID_WIDTH))
    );
    return randomNumberStream;
  };
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
