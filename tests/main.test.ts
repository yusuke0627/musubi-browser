import { test, expect } from "bun:test";
import { runBrowserLoop } from "../src/main";
import { getFocusableLinks } from "../src/nav/focus";
import { renderURL } from "../src/nav/pipeline";
import type { LayoutNode, LineBox } from "../src/layout/types";

function mockReader(chunks: string[]): ReadableStreamDefaultReader<Uint8Array> {
  let i = 0;
  return {
    read: async () => {
      if (i >= chunks.length) {
        return { done: true, value: undefined };
      }
      const value = new TextEncoder().encode(chunks[i++]);
      return { done: false, value };
    },
    releaseLock: () => {},
  } as unknown as ReadableStreamDefaultReader<Uint8Array>;
}

function findLineContainingLink(layout: LayoutNode, link: { rect: { x: number; y: number } }): LineBox | null {
  for (const child of layout.children) {
    if (child.lineBoxes) {
      for (const line of child.lineBoxes) {
        if (line.boxes.some((box) => box === link)) {
          return line;
        }
      }
    }
    const nested = findLineContainingLink(child, link);
    if (nested) return nested;
  }
  return null;
}

test("runBrowserLoop > navigates via Tab + Enter", async () => {
  const server = Bun.serve({
    port: 0,
    fetch(req) {
      const path = new URL(req.url).pathname;
      if (path === "/page2") {
        return new Response("<html><body><p>Page 2</p></body></html>");
      }
      return new Response(
        '<html><body><p><a href="/page2">Go to page 2</a></p></body></html>'
      );
    },
  });

  try {
    const writes: string[] = [];
    const stdout = { write: (data: string) => writes.push(data) };
    const reader = mockReader(["\t", "\r"]);

    await runBrowserLoop(`http://localhost:${server.port}/`, {
      reader,
      stdout,
    });

    const output = writes.join("");
    expect(output).toContain("Go to page 2");
    expect(output).toContain("Page 2");
  } finally {
    server.stop();
  }
});

test("runBrowserLoop > navigates via mouse click", async () => {
  const server = Bun.serve({
    port: 0,
    fetch(req) {
      const path = new URL(req.url).pathname;
      if (path === "/page2") {
        return new Response("<html><body><p>Page 2</p></body></html>");
      }
      return new Response(
        '<html><body><p><a href="/page2">Go to page 2</a></p></body></html>'
      );
    },
  });

  try {
    const url = `http://localhost:${server.port}/`;
    const { layout } = await renderURL(url, 80);
    const links = getFocusableLinks(layout);
    expect(links.length).toBe(1);
    const link = links[0];

    const line = findLineContainingLink(layout, link);
    expect(line).not.toBeNull();

    // ターミナル座標は 1-indexed
    const row = line!.rect.y + link.rect.y + 1;
    const col = line!.rect.x + link.rect.x + 1;

    const writes: string[] = [];
    const stdout = { write: (data: string) => writes.push(data) };
    const reader = mockReader([`\x1b[<0;${col};${row}M`]);

    await runBrowserLoop(url, { reader, stdout });

    const output = writes.join("");
    expect(output).toContain("Go to page 2");
    expect(output).toContain("Page 2");
  } finally {
    server.stop();
  }
});
