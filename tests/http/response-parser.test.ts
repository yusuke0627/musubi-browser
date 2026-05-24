import { describe, it, expect } from "bun:test";
import { parseResponse } from "../../src/http/response-parser";

describe("parseResponse", () => {
  it("parses a simple 200 response", () => {
    const raw = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: 14\r\n\r\n<html></html>";
    const res = parseResponse(raw);
    expect(res.statusCode).toBe(200);
    expect(res.statusText).toBe("OK");
    expect(res.headers["Content-Type"]).toBe("text/html");
    expect(res.body).toBe("<html></html>");
  });

  it("parses a 404 response", () => {
    const raw = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\nNot found";
    const res = parseResponse(raw);
    expect(res.statusCode).toBe(404);
    expect(res.statusText).toBe("Not Found");
    expect(res.body).toBe("Not found");
  });

  it("parses headers case-insensitively", () => {
    const raw = "HTTP/1.1 200 OK\r\ncontent-type: text/html\r\n\r\n";
    const res = parseResponse(raw);
    expect(res.headers["content-type"]).toBe("text/html");
  });
});
