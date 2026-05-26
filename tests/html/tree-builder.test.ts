import { describe, it, expect } from "bun:test";
import { buildTree } from "../../src/html/tree-builder";
import type { Token } from "../../src/html/token";

describe("buildTree", () => {
  it("builds a simple DOM tree from tokens", () => {
    const tokens: Token[] = [
      { type: "start", tag: "html", attributes: {} },
      { type: "start", tag: "body", attributes: {} },
      { type: "start", tag: "p", attributes: {} },
      { type: "text", text: "hello" },
      { type: "end", tag: "p" },
      { type: "end", tag: "body" },
      { type: "end", tag: "html" },
    ];

    const root = buildTree(tokens);

    expect(root.tag).toBe("html");
    expect(root.children.length).toBe(1);

    const body = root.children[0];
    expect(body.tag).toBe("body");
    expect(body.children.length).toBe(1);

    const p = body.children[0];
    expect(p.tag).toBe("p");
    expect(p.children.length).toBe(1);

    const text = p.children[0];
    expect(text.text).toBe("hello");
  });

  it("creates HTMLAnchorElement for <a> tags", () => {
    const tokens: Token[] = [
      { type: "start", tag: "a", attributes: { href: "http://example.com" } },
      { type: "text", text: "link" },
      { type: "end", tag: "a" },
    ];

    const root = buildTree(tokens);

    expect(root.tag).toBe("a");
    expect(root.isLink).toBe(true);
    expect(root.href).toBe("http://example.com");
    expect(root.children.length).toBe(1);
    expect(root.children[0].text).toBe("link");
  });
});
