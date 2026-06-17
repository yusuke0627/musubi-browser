import { test, expect } from "bun:test";
import { paintLayoutTree } from "../../src/paint/ansi-paint";
import type { LayoutNode, InlineBox } from "../../src/layout/types";

function buildLayout(boxes: InlineBox[]): LayoutNode {
  return {
    styledNode: { node: {} as any, computedStyle: {} },
    rect: { x: 0, y: 0, width: 80, height: 1 },
    children: [],
    lineBoxes: [
      {
        rect: { x: 0, y: 0, width: 80, height: 1 },
        boxes,
      },
    ],
  };
}

test("paintLayoutTree > renders focused link with reverse video", () => {
  const link: InlineBox = {
    type: "link",
    text: "link",
    rect: { x: 0, y: 0, width: 4, height: 1 },
    href: "/next",
  };
  const layout = buildLayout([link]);

  const output = paintLayoutTree(layout, link);

  expect(output).toContain("\x1b[7mlink\x1b[0m");
});

test("paintLayoutTree > renders non-focused link normally", () => {
  const link: InlineBox = {
    type: "link",
    text: "link",
    rect: { x: 0, y: 0, width: 4, height: 1 },
    href: "/next",
  };
  const layout = buildLayout([link]);

  const output = paintLayoutTree(layout);

  expect(output).not.toContain("\x1b[7m");
  expect(output).toContain("\x1b[34m\x1b[4mlink\x1b[0m");
});
