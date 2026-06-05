import { describe, test, expect } from "bun:test";
import { resolveHref } from "../../src/nav/url-resolver";

describe("resolveHref", () => {
  // パターン1: 絶対URL
  test("returns absolute URL unchanged", () => {
    expect(
      resolveHref("https://example.com/page", "http://other.com/")
    ).toBe("https://example.com/page");
  });

  // パターン2: 絶対パス
  test("resolves absolute path against base host", () => {
    expect(
      resolveHref("/foo/bar", "http://example.com/page.html")
    ).toBe("http://example.com/foo/bar");
  });

  // パターン3: 相対パス
  test("resolves relative path against base directory", () => {
    expect(
      resolveHref("foo/bar", "http://example.com/dir/page.html")
    ).toBe("http://example.com/dir/foo/bar");
  });

  // パターン4: プロトコル相対
  test("resolves protocol-relative URL with base protocol", () => {
    expect(
      resolveHref("//other.com/path", "http://example.com/")
    ).toBe("http://other.com/path");
  });
});
