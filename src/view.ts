/** Rendering (side effects) */
/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
export const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};
/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
export const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");
/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
export const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

export const showGameOver = (svg: SVGGraphicsElement & HTMLElement) => {
  const gameOverGroup = createSvgElement(svg.namespaceURI, "g", {
    id: "gameOver",
    visibility: "visible", // Change this to "visible" if you want to show the message
  });

  const rect = createSvgElement(svg.namespaceURI, "rect", {
    x: "26",
    y: "120",
    fill: "white",
    height: "48",
    width: "149",
  });

  const text = createSvgElement(svg.namespaceURI, "text", {
    x: "36",
    y: "150",
  });
  text.textContent = "Game Over";

  gameOverGroup.appendChild(rect);
  gameOverGroup.appendChild(text);

  svg.appendChild(gameOverGroup);
}