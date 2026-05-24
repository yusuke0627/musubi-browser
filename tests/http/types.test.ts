import { describe, it, expect } from "bun:test";
import type { HTTPRequest, HTTPResponse } from "../../src/http/types";

describe("HTTP types", () => {
  it("HTTPRequest should accept valid structure", () => {
    const req: HTTPRequest = {
      method: "GET",
      host: "example.com",
      port: 80,
      path: "/",
      headers: { "Host": "example.com" },
      body: null,
    };
    expect(req.method).toBe("GET");
    expect(req.host).toBe("example.com");
    expect(req.port).toBe(80);
  });

  it("HTTPResponse should accept valid structure", () => {
    const res: HTTPResponse = {
      statusCode: 200,
      statusText: "OK",
      headers: { "Content-Type": "text/html" },
      body: "<html></html>",
    };
    expect(res.statusCode).toBe(200);
    expect(res.statusText).toBe("OK");
  });
});
