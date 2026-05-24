import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { HTTPClient } from "../../src/http/client";

let server: any;

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch() {
      return new Response("<html><body>Hello from msubi-browser</body></html>", {
        headers: { "Content-Type": "text/html" },
      });
    },
  });
});

afterAll(() => {
  server.stop();
});

describe("HTTPClient (integration)", () => {
  it("fetches from local test server", async () => {
    const client = new HTTPClient();
    const url = `http://localhost:${server.port}/`;
    const response = await client.fetch(url);
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("Hello from msubi-browser");
    client.close();
  });
}, { timeout: 10000 });
