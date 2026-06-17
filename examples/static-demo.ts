/**
 * サーバーを立てずに静的 HTML を使ってインタラクティブブラウザを動かすデモ。
 *
 * 実行:
 *   bun run examples/static-demo.ts
 *
 * 操作方法:
 *   - マウスクリック: リンクをクリックして遷移
 *   - Tab / Enter: リンクをフォーカスして遷移
 *   - Ctrl+C / Escape: 終了
 */

import { runBrowserLoop } from "../src/main";
import type { HTTPResponse } from "../src/http/types";

const PAGE1 = `<html><body><p>これは静的 HTML のデモページです。</p><p><a href="/page2">次のページへ</a></p></body></html>`;

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

await runBrowserLoop("http://localhost:9999/", { client: mockClient });
