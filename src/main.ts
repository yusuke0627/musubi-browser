import { renderURL } from "./nav/pipeline";
import type { HTTPClientLike } from "./nav/pipeline";
import { enableMouseTracking, disableMouseTracking } from "./input/mouse";
import { readInput, setStdinRawMode } from "./input/keyboard";
import { hitTest } from "./nav/hit-test";
import { getFocusableLinks } from "./nav/focus";
import { resolveHref } from "./nav/url-resolver";
import type { InlineBox, LayoutNode } from "./layout/types";

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
  let layout: LayoutNode = await fetchLayout(currentURL, options.client);

  const stdout = options.stdout ?? process.stdout;

  enableMouseTracking(stdout);
  setStdinRawMode(true);
  const reader = options.reader ?? Bun.stdin.stream().getReader();

  try {
    while (true) {
      const links = getFocusableLinks(layout);
      const focusedLink: InlineBox | undefined = links[focusedLinkIndex];

      const ansi = await paint(currentURL, options.client, focusedLink);
      stdout.write(ansi);

      const event = await readInput(reader);
      if (event === null) break;

      if (event.type === "click") {
        const clicked = hitTest(layout, event.row - 1, event.col - 1);
        if (clicked && clicked.type === "link" && clicked.href) {
          currentURL = resolveHref(clicked.href, currentURL);
          focusedLinkIndex = 0;
          layout = await fetchLayout(currentURL, options.client);
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
            layout = await fetchLayout(currentURL, options.client);
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

async function fetchLayout(
  url: string,
  client?: HTTPClientLike
): Promise<LayoutNode> {
  const { layout } = await renderURL(url, VIEWPORT_WIDTH, client);
  return layout;
}

async function paint(
  url: string,
  client: HTTPClientLike | undefined,
  focusedLink: InlineBox | undefined
): Promise<string> {
  const { ansi } = await renderURL(url, VIEWPORT_WIDTH, client, focusedLink);
  return ansi;
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
