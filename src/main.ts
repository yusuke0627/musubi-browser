import { renderURL } from "./nav/pipeline";
import type { HTTPClientLike } from "./nav/pipeline";
import { enableMouseTracking, disableMouseTracking } from "./input/mouse";
import { readInput, setStdinRawMode } from "./input/keyboard";
import { hitTest } from "./nav/hit-test";
import { getFocusableLinks, nextFocus } from "./nav/focus";
import { resolveHref } from "./nav/url-resolver";

const VIEWPORT_WIDTH = 80;

interface BrowserLoopOptions {
  /** 入力リーダー。指定がなければ Bun.stdin が使われる */
  reader?: ReadableStreamDefaultReader<Uint8Array>;

  /** 出力先。指定がなければ process.stdout が使われる */
  stdout?: { write: (data: string) => void };

  /** HTTP クライアント。指定がなければ新規 HTTPClient */
  client?: HTTPClientLike;
}

/**
 * ターミナル上でブラウザーループを実行する。
 *
 * 入力イベントを受けて:
 *   - Tab / Enter: リンクをフォーカスして選択
 *   - マウスクリック: クリックした位置のリンクに遷移
 *   - Escape / Ctrl+C / EOF: 終了
 *
 * @param initialURL - 初期表示する URL
 * @param options - テスト用の依存物注入オプション
 */
export async function runBrowserLoop(
  initialURL: string,
  options: BrowserLoopOptions = {}
): Promise<void> {
  let currentURL = initialURL;
  let focusedLinkIndex = 0;

  const stdout = options.stdout ?? process.stdout;

  enableMouseTracking(stdout);
  setStdinRawMode(true);

  try {
    while (true) {
      const { layout, ansi } = await renderURL(currentURL, VIEWPORT_WIDTH, options.client);
      stdout.write(ansi);

      const event = await readInput(options.reader);
      if (event === null) break;

      const links = getFocusableLinks(layout);

      if (event.type === "click") {
        const clicked = hitTest(layout, event.row - 1, event.col - 1);
        if (clicked && clicked.type === "link" && clicked.href) {
          currentURL = resolveHref(clicked.href, currentURL);
          focusedLinkIndex = 0;
        }
      } else if (event.type === "tab") {
        if (links.length > 0) {
          focusedLinkIndex = (focusedLinkIndex + 1) % links.length;
        }
      } else if (event.type === "enter") {
        if (links.length > 0 && focusedLinkIndex < links.length) {
          const link = links[focusedLinkIndex];
          if (link.href) {
            currentURL = resolveHref(link.href, currentURL);
            focusedLinkIndex = 0;
          }
        }
      } else if (event.type === "escape" || event.type === "ctrl_c") {
        break;
      }
    }
  } finally {
    setStdinRawMode(false);
    disableMouseTracking(stdout);
  }
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: bun run src/main.ts <URL>");
    process.exit(1);
  }

  await runBrowserLoop(url);
}

if (import.meta.main) {
  main();
}
