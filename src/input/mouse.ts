/**
 * マウスイベント。
 *
 * xterm SGR マウスプロトコルからパースされる。
 */
export type MouseEvent = {
  /** イベントの種類 */
  type: "click" | "drag";

  /** 押されたボタン */
  button: "left" | "middle" | "right";

  /** クリックされた列（1-indexed のまま） */
  col: number;

  /** クリックされた行（1-indexed のまま） */
  row: number;
};

/**
 * xterm SGR マウスエスケープシーケンスをパースする。
 *
 * 対応するフォーマット:
 *   \x1b[<Cb;Cx;CyM  — ボタン押下 / ドラッグ
 *   \x1b[<Cb;Cx;Cym  — ボタン解放（無視して null）
 *
 * Cb の値:
 *   0, 32  → left
 *   1, 33  → middle
 *   2, 34  → right
 *   32以上 → drag
 *
 * @param input - 入力文字列
 * @returns パース結果。該当しない場合は null
 */
export function parseMouseEvent(input: string): MouseEvent | null {
  const match = input.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/);
  if (!match) return null;

  const [, buttonStr, colStr, rowStr, suffix] = match;
  if (suffix === "m") {
    // 解放イベントはここでは扱わない
    return null;
  }

  const buttonCode = Number(buttonStr);
  const button = buttonCodeToButton(buttonCode);
  if (button === null) return null;

  const type = buttonCode >= 32 ? "drag" : "click";

  return {
    type,
    button,
    col: Number(colStr),
    row: Number(rowStr),
  };
}

function buttonCodeToButton(code: number): MouseEvent["button"] | null {
  switch (code % 32) {
    case 0:
      return "left";
    case 1:
      return "middle";
    case 2:
      return "right";
    default:
      return null;
  }
}

/**
 * SGR 拡張マウストラッキングを有効にする。
 *
 * 出力先をカスタマイズできるようにして、テスト時にモックできる。
 *
 * @param stdout - エスケープシーケンスを書き込むストリーム。デフォルトは process.stdout
 */
export function enableMouseTracking(
  stdout: { write: (data: string) => void } = process.stdout
): void {
  // ?1000h: クリックレポート
  // ?1002h: ドラッグレポート
  // ?1006h: SGR 拡張座標フォーマット（主流のターミナル対応）
  // ?1015h: SGR 拡張座標フォーマット（互換性用）
  stdout.write("\x1b[?1000h\x1b[?1002h\x1b[?1006h\x1b[?1015h");
}

/**
 * SGR 拡張マウストラッキングを無効にする。
 *
 * @param stdout - エスケープシーケンスを書き込むストリーム。デフォルトは process.stdout
 */
export function disableMouseTracking(
  stdout: { write: (data: string) => void } = process.stdout
): void {
  stdout.write("\x1b[?1000l\x1b[?1002l\x1b[?1006l\x1b[?1015l");
}
