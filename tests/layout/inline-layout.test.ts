import { test, expect, describe } from "bun:test";
import { Text, HTMLAnchorElement } from "../../src/html/node";
import { computeInlineLayout } from "../../src/layout/inline-layout";

describe("computeInlineLayout", () => {
  // --- 例1: 単純なテキスト（折り返しなし） ---
  test("テキストを1行に収まる場合", () => {
    const children = [new Text("hi")];
    const lines = computeInlineLayout(children, 10, 0, 0);

    expect(lines).toHaveLength(1);
    expect(lines[0].boxes).toHaveLength(1);
    expect(lines[0].boxes[0]).toEqual({
      type: "text",
      text: "hi",
      rect: { x: 0, y: 0, width: 2, height: 1 },
    });
    expect(lines[0].rect).toEqual({ x: 0, y: 0, width: 10, height: 1 });
  });

  // --- 例2: 長いテキストの折り返し ---
  test("長いテキストが折り返す場合", () => {
    const children = [new Text("hello world")]; // 11文字
    const lines = computeInlineLayout(children, 5, 0, 0); // 親幅5

    // MVP: 文字単位で硬直に分割
    expect(lines).toHaveLength(3);
    // 行1: "hello" (5文字)
    expect(lines[0].boxes[0]).toEqual({
      type: "text",
      text: "hello",
      rect: { x: 0, y: 0, width: 5, height: 1 },
    });
    expect(lines[0].rect).toEqual({ x: 0, y: 0, width: 5, height: 1 });
    // 行2: " worl" (5文字)
    expect(lines[1].boxes[0]).toEqual({
      type: "text",
      text: " worl",
      rect: { x: 0, y: 0, width: 5, height: 1 },
    });
    expect(lines[1].rect).toEqual({ x: 0, y: 1, width: 5, height: 1 });
    // 行3: "d" (1文字)
    expect(lines[2].boxes[0]).toEqual({
      type: "text",
      text: "d",
      rect: { x: 0, y: 0, width: 1, height: 1 },
    });
    expect(lines[2].rect).toEqual({ x: 0, y: 2, width: 5, height: 1 });
  });

  // --- 例3: テキスト + リンク（折り返しなし） ---
  test("テキストとリンクが混在する場合", () => {
    const children = [
      new Text("hi "),
      new HTMLAnchorElement({ href: "/x" }),
    ];
    // アンカー要素にテキスト子を追加
    children[1].appendChild(new Text("link"));

    const lines = computeInlineLayout(children, 10, 0, 0);

    expect(lines).toHaveLength(1);
    expect(lines[0].boxes).toHaveLength(2);
    // Text "hi "
    expect(lines[0].boxes[0]).toEqual({
      type: "text",
      text: "hi ",
      rect: { x: 0, y: 0, width: 3, height: 1 },
    });
    // Link "link"
    expect(lines[0].boxes[1]).toEqual({
      type: "link",
      text: "link",
      rect: { x: 3, y: 0, width: 4, height: 1 },
      href: "/x",
    });
  });

  // --- 例4: リンクが折り返し境界をまたぐ場合（MVP: 分割しない） ---
  test("リンクが折り返し境界をまたぐ場合は次の行に送る", () => {
    const children = [
      new Text("hello "),
      new HTMLAnchorElement({ href: "/x" }),
    ];
    children[1].appendChild(new Text("worldwide"));
    // "hello "=6文字 + "worldwide"=9文字 = 15文字
    // 親幅10だと、"hello "は行1に収まるが、リンクは行2に送られる

    const lines = computeInlineLayout(children, 10, 0, 0);

    expect(lines).toHaveLength(2);
    // 行1: "hello "
    expect(lines[0].boxes).toHaveLength(1);
    expect(lines[0].boxes[0]).toEqual({
      type: "text",
      text: "hello ",
      rect: { x: 0, y: 0, width: 6, height: 1 },
    });
    expect(lines[0].rect).toEqual({ x: 0, y: 0, width: 10, height: 1 });
    // 行2: "worldwide"
    expect(lines[1].boxes).toHaveLength(1);
    expect(lines[1].boxes[0]).toEqual({
      type: "link",
      text: "worldwide",
      rect: { x: 0, y: 0, width: 9, height: 1 },
      href: "/x",
    });
    expect(lines[1].rect).toEqual({ x: 0, y: 1, width: 10, height: 1 });
  });
});
