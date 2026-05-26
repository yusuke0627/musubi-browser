import { describe, it, expect } from "bun:test";
import { computeStyle } from "../../src/style/computed-style";
import { buildTree } from "../../src/html/tree-builder";
import { tokenize } from "../../src/html/tokenizer";
import type { CSSRule } from "../../src/css/types";

describe("computeStyle", () => {
  it("applies matching CSS rules to DOM nodes", () => {
    // HTML: <p>hello</p>
    const tokens = tokenize("<p>hello</p>");
    const dom = buildTree(tokens);

    // CSS: p { color: blue; }
    const rules: CSSRule[] = [
      { selector: "p", declarations: { color: "blue" } },
    ];

    const styled = computeStyle(dom, rules);

    // <p> の computedStyle に color: blue が適用される
    expect(styled.computedStyle).toEqual({ color: "blue" });
  });

  it("applies default blue color to <a> tags", () => {
    // HTML: <a href="http://example.com">link</a>
    const tokens = tokenize('<a href="http://example.com">link</a>');
    const dom = buildTree(tokens);

    const rules: CSSRule[] = [];

    const styled = computeStyle(dom, rules);

    // <a> のデフォルトスタイル: color: blue, textDecoration: underline
    expect(styled.computedStyle).toEqual({
      color: "blue",
      textDecoration: "underline",
    });
  });
});
