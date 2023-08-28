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
import { fromEvent, interval, merge, Observable, Subject, zip } from "rxjs";
import { map, filter, scan, distinctUntilChanged, delay } from "rxjs/operators";
import {
  Constants,
  Viewport,
  Key,
  Block,
  State,
  Move,
  Rotate,
  Restart,
} from "./types";
import { RNG } from "./util";
import { initialState, reduceState, tick } from "./state";
import { createSvgElement, hide, show, showGameOver } from "./view";

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

    // Reset the preview canvas
    preview.innerHTML = "";

    // Update the level
    levelText.innerHTML = `${s.level}`;

    // Update the score
    scoreText.innerHTML = `${s.currScore}`;

    // Update the high score
    highScoreText.innerHTML = `${s.highScore}`;

    // Render fixed blocks
    s.blockFilled.forEach((row, y) =>
      row.forEach((bool, x) => {
        if (bool) {
          const block = createSvgElement(svg.namespaceURI, "rect", {
            height: `${Block.HEIGHT}`,
            width: `${Block.WIDTH}`,
            x: `${Block.WIDTH * x}`,
            y: `${Block.HEIGHT * y}`,
            style: `fill: ${
              s.blockFilledColor[y][x] !== null
                ? s.blockFilledColor[y][x]
                : "white"
            }`,
          });

          svg.appendChild(block);
        }
      })
    );

    // Render the moving shape
    s.movingShape?.positions.forEach((pos) => {
      const { xPos, yPos } = pos;
      const block = createSvgElement(svg.namespaceURI, "rect", {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${Block.WIDTH * (s.movingShapePosition.xPos + xPos)}`,
        y: `${Block.HEIGHT * (s.movingShapePosition.yPos + yPos)}`,
        style: `fill: ${s.movingShape?.color}`,
      });
      svg.appendChild(block);
    });

    // Render the next shape in the preview canvas
    s.nextShape.positions.forEach((pos) => {
      const { xPos, yPos } = pos;
      const block = createSvgElement(preview.namespaceURI, "rect", {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${Block.WIDTH * (3 + xPos)}`,
        y: `${Block.HEIGHT * (1 + yPos)}`,
        style: `fill: ${s.nextShape.color}`,
      });
      preview.appendChild(block);
    });
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
  const shapeIndexRandom$ = createRngStreamFromSource(gameClock$)(
    new Date().getTime() + 1
  );
  const rotationIndexRandom$ = createRngStreamFromSource(gameClock$)(
    new Date().getTime() + 2
  );

  const restartSignal$ = new Subject();
  const restart$ = restartSignal$.pipe(map(() => new Restart()));

  // Merge all streams
  const source$ = merge(
    left$,
    right$,
    rotate$,
    zip(xRandom$, shapeIndexRandom$, rotationIndexRandom$),
    restart$
  )
    .pipe(scan(reduceState, initialState))
    .subscribe((s: State) => {
      if (s.movingShape !== null) {
        console.log("Rendering")
        render(s);
      }
      

      if (s.gameEnd) {
        // Test
        console.log("Show game over called");

        showGameOver(svg);

        // // Emit the restart signal after the delay
        restartSignal$.next(0);
        // Display game over screen after waiting for 3 seconds
        // setTimeout(() => {
        //   console.log("Show game over called");
        //   showGameOver(svg);

        //   // Emit the restart signal after the delay
        //   restartSignal$.next(0);
        // }, 3000);
      } else {
        hide(gameover);
      }
    });

  const restartSubscription = restart$.subscribe((restart) => {
    console.log("Restart signal received. Restarting the game...");
    // Perform the restart logic using the restart instance
    // Reset the game state, hide game over screen, etc.
  });

  restartSubscription.unsubscribe();

  // const level$ = source$.pipe(map((s) => s.level), distinctUntilChanged());

  // const gameClock$ = level$.pipe(
  //   switchMap((level) =>
  //     interval(Constants.TICK_RATE_MS - level * 10) // Adjust the interval based on the level
  //   )
  // );
}

function createRngStreamFromSource<T>(source$: Observable<T>) {
  return function createRngStream(seed: number): Observable<number> {
    const randomNumberStream = source$.pipe(
      scan((acc, _) => RNG.hash(acc), seed),
      map(RNG.scale)
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