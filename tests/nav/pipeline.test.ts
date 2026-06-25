import { test, expect } from "bun:test";
import { renderURL } from "../../src/nav/pipeline";

test("renderURL > fetches HTML and runs full pipeline", async () => {
  const server = Bun.serve({
    port: 0,
    fetch() {
      return new Response(
        "<html><body><p>Hello <a href='/next'>link</a></p></body></html>"
      );
    },
  });

  try {
    const result = await renderURL(`http://localhost:${server.port}/`, 80);

    expect(result.url).toBe(`http://localhost:${server.port}/`);
    expect(result.ansi).toContain("Hello");
    expect(result.ansi).toContain("link");
    expect(result.layout).toBeDefined();
    expect(result.layout.children.length).toBeGreaterThan(0);
  } finally {
    server.stop();
  }
});

test("renderURL > uses provided HTTPClient", async () => {
  let fetchedUrl: string | null = null;

  const mockClient = {
    async fetch(url: string) {
      fetchedUrl = url;
      return {
        statusCode: 200,
        statusText: "OK",
        headers: { "Content-Type": "text/html" },
        body: "<html><body><p>Mocked</p></body></html>",
      };
    },
    close() {},
  };

  const result = await renderURL("http://example.com/", 40, mockClient as any);

  expect(fetchedUrl).toBe("http://example.com/");
  expect(result.ansi).toContain("Mocked");
});
