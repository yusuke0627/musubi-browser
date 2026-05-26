import { describe, it, expect } from "bun:test";
import { parseCSS } from "../../src/css/parser";

describe("parseCSS", () => {
  it("parses a simple rule", () => {
    const css = "p { color: blue; }";
    const rules = parseCSS(css);

    expect(rules.length).toBe(1);
    expect(rules[0]).toEqual({
      selector: "p",
      declarations: { color: "blue" },
    });
  });

  it("parses multiple rules", () => {
    const css = "p { color: blue; } a { color: blue; text-decoration: underline; }";
    const rules = parseCSS(css);

    expect(rules.length).toBe(2);
    expect(rules[0]).toEqual({
      selector: "p",
      declarations: { color: "blue" },
    });
    expect(rules[1]).toEqual({
      selector: "a",
      declarations: {
        color: "blue",
        textDecoration: "underline",
      },
    });
  });
});
