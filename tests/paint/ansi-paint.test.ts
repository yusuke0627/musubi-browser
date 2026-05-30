import { describe, test, expect } from "bun:test";
import { tokenize } from "../../src/html/tokenizer";
import { buildTree } from "../../src/html/tree-builder";
import { computeBlockLayout } from "../../src/layout/block-layout";
import { paintLayoutTree } from "../../src/paint/ansi-paint";
import type { LayoutNode, LineBox, InlineBox } from "../../src/layout/types";

const ANSI = {
  BLUE: "\x1b[34m",
  UNDERLINE: "\x1b[4m",
  RESET: "\x1b[0m",
  CLEAR: "\x1b[2J",
  HOME: "\x1b[H",
  MOVE: (y: number, x: number) => `\x1b[${y};${x}H`,
};

describe("paintLayoutTree", () => {
  // --- 例1: 単純なテキスト ---
  test("renders simple text without ANSI colors", () => {
    const tokens = tokenize("<html><body><p>hello</p></body></html>");
    const dom = buildTree(tokens);
    const layout = computeBlockLayout(dom, [], 80);
    const output = paintLayoutTree(layout);

    // 画面クリアとホームが含まれる
    expect(output).toContain(ANSI.CLEAR);
    expect(output).toContain(ANSI.HOME);
    // テキストが含まれる
    expect(output).toContain("hello");
  });

  // --- 例2: リンクは青+下線 ---
  test("renders links in blue with underline", () => {
    const tokens = tokenize('<html><body><p><a href="/x">link</a></p></body></html>');
    const dom = buildTree(tokens);
    const layout = computeBlockLayout(dom, [], 80);
    const output = paintLayoutTree(layout);

    // リンクの周囲にANSIコードがある
    expect(output).toContain(ANSI.BLUE + ANSI.UNDERLINE + "link" + ANSI.RESET);
  });

  // --- 例3: 2行のテキストにカーソル移動がある ---
  test("moves cursor for each line", () => {
    const tokens = tokenize("<html><body><p>helloworld</p></body></html>");
    const dom = buildTree(tokens);
    // 親幅=5 で "helloworld"(10文字) は2行に分割
    const layout = computeBlockLayout(dom, [], 5);
    const output = paintLayoutTree(layout);

    // 行1 にカーソル移動（ANSIは1-indexedなので y=1）
    expect(output).toContain(ANSI.MOVE(1, 1));
    // 行2 にカーソル移動（y=2）
    expect(output).toContain(ANSI.MOVE(2, 1));
  });

  // --- 例4: 複数ブロック要素 ---
  test("stacks multiple paragraphs vertically", () => {
    const tokens = tokenize("<html><body><p>hello</p><p>world</p></body></html>");
    const dom = buildTree(tokens);
    const layout = computeBlockLayout(dom, [], 80);
    const output = paintLayoutTree(layout);

    // 1つ目の <p> は y=1（1-indexed）
    expect(output).toContain(ANSI.MOVE(1, 1));
    expect(output).toContain("hello");
    // 2つ目の <p> は y=2
    expect(output).toContain(ANSI.MOVE(2, 1));
    expect(output).toContain("world");
  });
});
