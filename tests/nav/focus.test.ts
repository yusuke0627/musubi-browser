import { describe, test, expect } from "bun:test";
import { getFocusableLinks, nextFocus, prevFocus } from "../../src/nav/focus";
import type { LayoutNode, LineBox, InlineBox } from "../../src/layout/types";
import type { StyledNode } from "../../src/style/types";

/**
 * テスト用ヘルパー: 最小構成の LayoutNode を作る
 */
function makeLayout(
  lineBoxes: LineBox[],
  y: number = 0,
  width: number = 80
): LayoutNode {
  const styledNode = {} as StyledNode;
  return {
    styledNode,
    rect: { x: 0, y, width, height: lineBoxes.length },
    children: [],
    lineBoxes,
  };
}

describe("getFocusableLinks", () => {
  test("returns empty array when layout has no links", () => {
    // テキストのみの LineBox
    const text: InlineBox = {
      type: "text",
      text: "hello",
      rect: { x: 0, y: 0, width: 5, height: 1 },
    };
    const lineBox: LineBox = {
      rect: { x: 0, y: 0, width: 80, height: 1 },
      boxes: [text],
    };
    const layout = makeLayout([lineBox]);

    expect(getFocusableLinks(layout)).toEqual([]);
  });

  test("returns the single link when layout has one link", () => {
    // 1つのリンクのみ
    const link: InlineBox = {
      type: "link",
      text: "Example",
      rect: { x: 0, y: 0, width: 7, height: 1 },
      href: "https://example.com",
    };
    const lineBox: LineBox = {
      rect: { x: 0, y: 0, width: 80, height: 1 },
      boxes: [link],
    };
    const layout = makeLayout([lineBox]);

    expect(getFocusableLinks(layout)).toEqual([link]);
  });

  test("returns multiple links in document order", () => {
    // 2行レイアウト: 1行目に2リンク、2行目に1リンク
    const link1: InlineBox = {
      type: "link", text: "first", rect: { x: 0, y: 0, width: 5, height: 1 }, href: "/1",
    };
    const link2: InlineBox = {
      type: "link", text: "second", rect: { x: 6, y: 0, width: 6, height: 1 }, href: "/2",
    };
    const link3: InlineBox = {
      type: "link", text: "third", rect: { x: 0, y: 0, width: 5, height: 1 }, href: "/3",
    };
    const lineBox1: LineBox = {
      rect: { x: 0, y: 0, width: 80, height: 1 },
      boxes: [link1, link2],
    };
    const lineBox2: LineBox = {
      rect: { x: 0, y: 1, width: 80, height: 1 },
      boxes: [link3],
    };
    const layout = makeLayout([lineBox1, lineBox2]);

    expect(getFocusableLinks(layout)).toEqual([link1, link2, link3]);
  });
});

describe("nextFocus", () => {
  // 3つのリンクを共有で使う
  const link1: InlineBox = { type: "link", text: "a", rect: { x: 0, y: 0, width: 1, height: 1 }, href: "/1" };
  const link2: InlineBox = { type: "link", text: "b", rect: { x: 0, y: 0, width: 1, height: 1 }, href: "/2" };
  const link3: InlineBox = { type: "link", text: "c", rect: { x: 0, y: 0, width: 1, height: 1 }, href: "/3" };
  const links = [link1, link2, link3];

  test("returns the next link in the array", () => {
    expect(nextFocus(link1, links)).toBe(link2);
  });

  test("cycles from the last link back to the first", () => {
    expect(nextFocus(link3, links)).toBe(link1);
  });
});

describe("prevFocus", () => {
  const link1: InlineBox = { type: "link", text: "a", rect: { x: 0, y: 0, width: 1, height: 1 }, href: "/1" };
  const link2: InlineBox = { type: "link", text: "b", rect: { x: 0, y: 0, width: 1, height: 1 }, href: "/2" };
  const link3: InlineBox = { type: "link", text: "c", rect: { x: 0, y: 0, width: 1, height: 1 }, href: "/3" };
  const links = [link1, link2, link3];

  test("returns the previous link in the array", () => {
    expect(prevFocus(link2, links)).toBe(link1);
  });

  test("cycles from the first link back to the last", () => {
    expect(prevFocus(link1, links)).toBe(link3);
  });
});
