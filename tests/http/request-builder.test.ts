import { describe, it, expect } from "bun:test";
import { buildRequest } from "../../src/http/request-builder";
import type { HTTPRequest } from "../../src/http/types";

describe("buildRequest", () => {
  it("builds a simple GET request", () => {
    const req: HTTPRequest = {
      method: "GET",
      host: "example.com",
      port: 80,
      path: "/",
      headers: { "Host": "example.com" },
      body: null,
    };
    const raw = buildRequest(req);
    expect(raw).toBe("GET / HTTP/1.1\r\nHost: example.com\r\n\r\n");
  });

  it("builds a GET request with multiple headers", () => {
    const req: HTTPRequest = {
      method: "GET",
      host: "example.com",
      port: 80,
      path: "/path",
      headers: { "Host": "example.com", "User-Agent": "msubi-browser/0.1" },
      body: null,
    };
    const raw = buildRequest(req);
    expect(raw).toContain("GET /path HTTP/1.1\r\n");
    expect(raw).toContain("Host: example.com\r\n");
    expect(raw).toContain("User-Agent: msubi-browser/0.1\r\n");
    expect(raw.endsWith("\r\n\r\n")).toBe(true);
  });
});
