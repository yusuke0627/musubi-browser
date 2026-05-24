import { describe, it, expect, beforeAll, afterAll } from "bun:test";

let server: any;

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch() {
      return new Response("<html><body>CLI test passed!</body></html>", {
        headers: { "Content-Type": "text/html" },
      });
    },
  });
});

afterAll(() => {
  server.stop();
});

describe("CLI", () => {
  it("fetches URL via CLI", async () => {
    const proc = Bun.spawn(["bun", "run", "src/main.ts", `http://localhost:${server.port}/`]);

    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    expect(exitCode).toBe(0);
    expect(output).toContain("Status: 200 OK");
    expect(output).toContain("CLI test passed!");
  });
});
