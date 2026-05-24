import { describe, it, expect } from "bun:test";
import { parseURL } from "../../src/http/url";

describe("parseURL", () => {
  it("parses simple HTTP URL", () => {
    const url = parseURL("http://example.com/");
    expect(url.protocol).toBe("http");
    expect(url.host).toBe("example.com");
    expect(url.port).toBe(80);
    expect(url.path).toBe("/");
  });

  it("parses URL with non-default port", () => {
    const url = parseURL("http://example.com:8080/path");
    expect(url.port).toBe(8080);
    expect(url.path).toBe("/path");
  });

  it("parses URL without trailing slash", () => {
    const url = parseURL("http://example.com");
    expect(url.path).toBe("/");
  });

  it("parses URL with query string", () => {
    const url = parseURL("http://example.com/search?q=test");
    expect(url.path).toBe("/search?q=test");
  });
});
