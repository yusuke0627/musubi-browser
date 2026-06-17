/**
 * マウス入力のデバッグ用デモ。
 *
 * 受信した生のバイト列を stderr に出力するので、
 * ターミナルがマウスイベントを送っているか確認できる。
 *
 * 実行:
 *   bun run examples/static-debug.ts
 *
 * マウスをクリックすると、イベントバイト列がターミナル下部に表示される。
 * Ctrl+C / Escape で終了。
 */

import { runBrowserLoop } from "../src/main";
import type { HTTPResponse } from "../src/http/types";

const PAGE1 = `<html><body><p>マウス入力デバッグページ</p><p><a href="/page2">次のページへ</a></p></body></html>`;

const PAGE2 = `<html><body><p>Page 2 へようこそ！</p><p><a href="/">戻る</a></p></body></html>`;

const mockClient = {
  async fetch(url: string): Promise<HTTPResponse> {
    const path = new URL(url).pathname;
    return {
      statusCode: 200,
      statusText: "OK",
      headers: { "Content-Type": "text/html" },
      body: path === "/page2" ? PAGE2 : PAGE1,
    };
  },
  close() {},
};

function debugReader(): ReadableStreamDefaultReader<Uint8Array> {
  const reader = Bun.stdin.stream().getReader();
  return {
    async read() {
      const result = await reader.read();
      if (result.value) {
        const text = new TextDecoder().decode(result.value);
        console.error("[debug] raw bytes:", JSON.stringify(text));
      }
      return result;
    },
    releaseLock() {
      reader.releaseLock();
    },
  } as unknown as ReadableStreamDefaultReader<Uint8Array>;
}

await runBrowserLoop("http://localhost:9999/", {
  client: mockClient,
  reader: debugReader(),
});
