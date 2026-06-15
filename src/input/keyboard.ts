/**
 * キーボードイベント。
 */
export type KeyEvent = {
  /** 押されたキーの種類 */
  type: "tab" | "enter" | "escape" | "other";
};

/**
 * 単一の入力文字列を KeyEvent に変換する。
 *
 * 認識する入力:
 *   \t        → tab
 *   \r / \r\n  → enter
 *   \x1b      → escape
 *   その他    → other
 *
 * @param input - 入力文字列
 * @returns KeyEvent
 */
export function parseKeyEvent(input: string): KeyEvent {
  if (input === "\t") return { type: "tab" };
  if (input === "\r" || input === "\r\n") return { type: "enter" };
  if (input === "\x1b") return { type: "escape" };
  return { type: "other" };
}

/**
 * stdin を raw mode に設定 / 解除する。
 *
 * テスト時には stdin のモックを渡せるようにしている。
 *
 * @param enabled - true で raw mode 有効、false で無効
 * @param stdin - 操作対象の stdin ストリーム。デフォルトは process.stdin
 */
export function setStdinRawMode(
  enabled: boolean,
  stdin: { setRawMode?: (mode: boolean) => void } = process.stdin
): void {
  if (typeof stdin.setRawMode === "function") {
    stdin.setRawMode(enabled);
  }
}

/**
 * 入力ストリームから一つのイベントを読み込んでパースする。
 *
 * マウスイベントが見つかればそれを優先し、
 * キーボードイベントとして返す。
 *
 * @param reader - 読み込み元の ReadableStreamDefaultReader。
 *                 デフォルトは Bun.stdin.stream().getReader()
 * @returns MouseEvent または KeyEvent
 */
export async function readInput(
  reader: ReadableStreamDefaultReader<Uint8Array> = Bun.stdin.stream().getReader()
): Promise<import("./mouse").MouseEvent | KeyEvent> {
  const { parseMouseEvent } = await import("./mouse");
  let buffer = "";
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return parseKeyEvent(buffer);
    }

    buffer += decoder.decode(value, { stream: true });

    // マウスイベントとして解釈できればそれを返す
    const mouse = parseMouseEvent(buffer);
    if (mouse) return mouse;

    // Escape で始まる場合、まだ完成していないマウスシーケンスの可能性がある
    if (buffer[0] === "\x1b") {
      // 長すぎる escape シーケンスは安全のため escape として扱う
      if (buffer.length > 20) {
        return { type: "escape" };
      }
      continue;
    }

    return parseKeyEvent(buffer);
  }
}
