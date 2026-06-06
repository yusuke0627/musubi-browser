import { describe, test, expect } from "bun:test";
import { hitTest } from "../../src/nav/hit-test";
import type { LayoutNode, LineBox, InlineBox } from "../../src/layout/types";
import type { StyledNode } from "../../src/style/types";

/**
 * テスト用のヘルパー: 最小構成の LayoutNode を作る
 *
 * @param lineBoxes - この LayoutNode が持つ LineBox 配列
 * @param y - 親の中での Y 座標
 * @param width - 幅
 * @returns LayoutNode
 */
function makeLayout(
  lineBoxes: LineBox[],
  y: number = 0,
  width: number = 80
): LayoutNode {
  // 最小限の StyledNode（テストでは内容は使わない）
  const styledNode = {} as StyledNode;
  return {
    styledNode,
    rect: { x: 0, y, width, height: lineBoxes.length },
    children: [],
    lineBoxes,
  };
}

describe("hitTest", () => {
  test("returns the link InlineBox when clicked on it", () => {
    // 単一のリンクを持つ LineBox
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

    // (row=0, col=0) は link の中
    expect(hitTest(layout, 0, 0)).toBe(link);
  });

  test("returns null when clicked outside the link", () => {
    // リンクの右側をクリック
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

    // (row=0, col=10) は link の外（link は x=0..7 まで）
    expect(hitTest(layout, 0, 10)).toBeNull();
  });

  test("returns the text InlineBox when clicked on text", () => {
    // テキストのみの LineBox（リンクなし）
    const text: InlineBox = {
      type: "text",
      text: "hello world",
      rect: { x: 0, y: 0, width: 11, height: 1 },
    };
    const lineBox: LineBox = {
      rect: { x: 0, y: 0, width: 80, height: 1 },
      boxes: [text],
    };
    const layout = makeLayout([lineBox]);

    // (row=0, col=5) はテキストの中
    expect(hitTest(layout, 0, 5)).toBe(text);
  });

  test("finds a link on the second line of a multi-line layout", () => {
    // 2行レイアウト: 1行目はテキスト、2行目にリンク
    const text1: InlineBox = {
      type: "text",
      text: "first line",
      rect: { x: 0, y: 0, width: 10, height: 1 },
    };
    const link2: InlineBox = {
      type: "link",
      text: "second",
      rect: { x: 0, y: 0, width: 6, height: 1 },
      href: "https://example.com",
    };
    const lineBox1: LineBox = {
      rect: { x: 0, y: 0, width: 80, height: 1 },
      boxes: [text1],
    };
    const lineBox2: LineBox = {
      rect: { x: 0, y: 1, width: 80, height: 1 },  // y=1 で 2行目
      boxes: [link2],
    };
    const layout = makeLayout([lineBox1, lineBox2]);

    // (row=1, col=0) は 2行目のリンクの中
    expect(hitTest(layout, 1, 0)).toBe(link2);
  });
});
