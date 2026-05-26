import { describe, it, expect } from "bun:test";
import { tokenize } from "../../src/html/tokenizer";

describe("tokenize", () => {
  it("tokenizes a simple HTML document", () => {
    const html = "<html><body><p>hello</p></body></html>";
    const tokens = tokenize(html);

    expect(tokens.length).toBe(7);
    expect(tokens[0]).toEqual({ type: "start", tag: "html", attributes: {} });
    expect(tokens[1]).toEqual({ type: "start", tag: "body", attributes: {} });
    expect(tokens[2]).toEqual({ type: "start", tag: "p", attributes: {} });
    expect(tokens[3]).toEqual({ type: "text", text: "hello" });
    expect(tokens[4]).toEqual({ type: "end", tag: "p" });
    expect(tokens[5]).toEqual({ type: "end", tag: "body" });
    expect(tokens[6]).toEqual({ type: "end", tag: "html" });
  });

  it("tokenizes a tag with attributes", () => {
    const html = '<a href="http://example.com">link</a>';
    const tokens = tokenize(html);

    expect(tokens.length).toBe(3);
    expect(tokens[0]).toEqual({
      type: "start",
      tag: "a",
      attributes: { href: "http://example.com" },
    });
    expect(tokens[1]).toEqual({ type: "text", text: "link" });
    expect(tokens[2]).toEqual({ type: "end", tag: "a" });
  });
});
