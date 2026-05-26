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
});
