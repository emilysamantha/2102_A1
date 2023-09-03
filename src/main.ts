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
  GameOver,
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
    s.blockFilledColor.forEach((row, y) =>
      row.forEach((color, x) => {
        if (color !== "") {
          const block = createSvgElement(svg.namespaceURI, "rect", {
            height: `${Block.HEIGHT}`,
            width: `${Block.WIDTH}`,
            x: `${Block.WIDTH * x}`,
            y: `${Block.HEIGHT * y}`,
            style: `fill: ${color}`,
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
  const restart$ = fromKey("KeyR").pipe(map(() => new Restart()));

  const xRandom$ = createRngStreamFromSource(gameClock$)(new Date().getTime());
  const shapeIndexRandom$ = createRngStreamFromSource(gameClock$)(
    new Date().getTime() + 1
  );
  const rotationIndexRandom$ = createRngStreamFromSource(gameClock$)(
    new Date().getTime() + 2
  );

  const gameOverSignal$ = new Subject();
  const gameOver$ = gameOverSignal$.pipe(map(() => new GameOver()));

  // Merge all streams
  const source$ = merge(
    left$,
    right$,
    rotate$,
    zip(xRandom$, shapeIndexRandom$, rotationIndexRandom$),
    gameOver$,
    restart$
  )
    .pipe(scan(reduceState, initialState))
    .subscribe((s: State) => {
      if (s.promptRestart) {
        // Show the game over message and option to restart
        showGameOver(svg);
      }
      else if (s.gameEnd) {
        // Emit the game over signal
        gameOverSignal$.next(0);
      } 
      else {
        // Render the current state of the game
        render(s);
      }
    });
}

/**
 * Function to create a random number stream from a given source.
 * @param source$ the source observable
 * @returns random number stream
 */
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