import { describe, it, expect } from "bun:test";
import { computeBlockLayout } from "../../src/layout/block-layout";
import { buildTree } from "../../src/html/tree-builder";
import { tokenize } from "../../src/html/tokenizer";
import type { CSSRule } from "../../src/css/types";

describe("computeBlockLayout", () => {
  it("computes block layout for a simple paragraph", () => {
    // HTML: <html><body><p>hello</p></body></html>
    const tokens = tokenize("<html><body><p>hello</p></body></html>");
    const dom = buildTree(tokens);

    const rules: CSSRule[] = [];
    const layout = computeBlockLayout(dom, rules, 80);

    // <html> はルート。子は <body>
    expect(layout.rect.x).toBe(0);
    expect(layout.rect.y).toBe(0);
    expect(layout.rect.width).toBe(80);

    // <body> の子 <p> のレイアウトを確認
    const bodyLayout = layout.children[0];
    const pLayout = bodyLayout.children[0];
    expect(pLayout.rect.x).toBe(0);
    expect(pLayout.rect.y).toBe(0);
    expect(pLayout.rect.width).toBe(80);
    expect(pLayout.rect.height).toBe(1);
  });

  it("stacks block elements vertically", () => {
    // HTML: <html><body><p>hello</p><p>world</p></body></html>
    const tokens = tokenize("<html><body><p>hello</p><p>world</p></body></html>");
    const dom = buildTree(tokens);

    const rules: CSSRule[] = [];
    const layout = computeBlockLayout(dom, rules, 80);

    // <html> → <body> → [<p>, <p>]
    const bodyLayout = layout.children[0];
    expect(bodyLayout.children.length).toBe(2);

    // 1つ目の <p>
    expect(bodyLayout.children[0].rect.y).toBe(0);
    expect(bodyLayout.children[0].rect.height).toBe(1);

    // 2つ目の <p> は 1つ目の下に積まれる
    expect(bodyLayout.children[1].rect.y).toBe(1);
    expect(bodyLayout.children[1].rect.height).toBe(1);
  });

  // --- Inline Layout 統合のテスト ---

  it("テキストを含む<p>は lineBoxes を持つ", () => {
    // HTML: <html><body><p>hello</p></body></html>
    const tokens = tokenize("<html><body><p>hello</p></body></html>");
    const dom = buildTree(tokens);

    const rules: CSSRule[] = [];
    const layout = computeBlockLayout(dom, rules, 80);

    const bodyLayout = layout.children[0];
    const pLayout = bodyLayout.children[0];

    // <p> はインライン子を持つので lineBoxes を持つ
    expect(pLayout.lineBoxes).toBeDefined();
    expect(pLayout.lineBoxes).toHaveLength(1);
    expect(pLayout.lineBoxes![0].boxes).toHaveLength(1);
    expect(pLayout.lineBoxes![0].boxes[0].type).toBe("text");
    expect(pLayout.lineBoxes![0].boxes[0].text).toBe("hello");
    expect(pLayout.lineBoxes![0].boxes[0].rect).toEqual({ x: 0, y: 0, width: 5, height: 1 });
  });

  it("リンクを含む<p>は link の lineBoxes を持つ", () => {
    // HTML: <html><body><p>hi <a href="/x">link</a></p></body></html>
    const tokens = tokenize('<html><body><p>hi <a href="/x">link</a></p></body></html>');
    const dom = buildTree(tokens);

    const rules: CSSRule[] = [];
    const layout = computeBlockLayout(dom, rules, 80);

    const bodyLayout = layout.children[0];
    const pLayout = bodyLayout.children[0];

    expect(pLayout.lineBoxes).toBeDefined();
    expect(pLayout.lineBoxes).toHaveLength(1);

    const line = pLayout.lineBoxes![0];
    expect(line.boxes).toHaveLength(2);
    // Text "hi "
    expect(line.boxes[0].type).toBe("text");
    expect(line.boxes[0].text).toBe("hi ");
    expect(line.boxes[0].rect.x).toBe(0);
    // Link "link"
    expect(line.boxes[1].type).toBe("link");
    expect(line.boxes[1].text).toBe("link");
    expect(line.boxes[1].href).toBe("/x");
    expect(line.boxes[1].rect.x).toBe(3);
  });

  it("長いテキストは折り返して lineBoxes が複数になる", () => {
    // HTML: <html><body><p>helloworld</p></body></html>
    // 親幅=5 なので "helloworld"(10文字) は2行に分割
    const tokens = tokenize("<html><body><p>helloworld</p></body></html>");
    const dom = buildTree(tokens);

    const rules: CSSRule[] = [];
    const layout = computeBlockLayout(dom, rules, 5);

    const bodyLayout = layout.children[0];
    const pLayout = bodyLayout.children[0];

    expect(pLayout.rect.height).toBe(2); // 高さ=2行
    expect(pLayout.lineBoxes).toBeDefined();
    expect(pLayout.lineBoxes).toHaveLength(2);
    // 行1: "hello"
    expect(pLayout.lineBoxes![0].boxes[0].text).toBe("hello");
    expect(pLayout.lineBoxes![0].rect.y).toBe(0);
    // 行2: "world"
    expect(pLayout.lineBoxes![1].boxes[0].text).toBe("world");
    expect(pLayout.lineBoxes![1].rect.y).toBe(1);
  });

  it("ブロック要素間の改行・空白は無視して積まれる", () => {
    // HTML: <html><body>\n  <p>first</p>\n  <p>second</p>\n</body></html>
    const tokens = tokenize("<html><body>\n  <p>first</p>\n  <p>second</p>\n</body></html>");
    const dom = buildTree(tokens);

    const rules: CSSRule[] = [];
    const layout = computeBlockLayout(dom, rules, 80);

    const bodyLayout = layout.children[0];
    // 空白ノードを無視して <p> だけが残る
    expect(bodyLayout.children.length).toBe(2);

    expect(bodyLayout.children[0].rect.y).toBe(0);
    expect(bodyLayout.children[0].rect.height).toBe(1);
    expect(bodyLayout.children[1].rect.y).toBe(1);
    expect(bodyLayout.children[1].rect.height).toBe(1);
  });
});
