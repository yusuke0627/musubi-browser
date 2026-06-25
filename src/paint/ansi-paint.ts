import type { LayoutNode, LineBox, InlineBox } from "../layout/types";

/**
 * ANSIエスケープコード定数。
 * ターミナルの色、下線、カーソル制御に使用する。
 */
const ANSI = {
  /** 画面をクリア */
  CLEAR: "\x1b[2J",
  /** カーソルを先頭に移動 */
  HOME: "\x1b[H",
  /** 指定位置にカーソル移動（ANSIは1-indexed） */
  MOVE: (y: number, x: number) => `\x1b[${y};${x}H`,
  /** 青色 */
  BLUE: "\x1b[34m",
  /** 下線 */
  UNDERLINE: "\x1b[4m",
  /** リバースビデオ */
  REVERSE: "\x1b[7m",
  /** リセット（属性解除） */
  RESET: "\x1b[0m",
  /** 灰色 */
  GRAY: "\x1b[90m",
};

/**
 * レイアウトツリーをANSIエスケープコードで描画する。
 *
 * 処理の流れ:
 *   1. 画面クリア + カーソル先頭
 *   2. リーフノードから再帰的に描画
 *
 * @param layout - レイアウトツリーのルートノード
 * @param focusedBox - フォーカス中のインラインボックス（オプション）
 * @returns ANSIエスケープコードを含む描画文字列
 */
export function paintLayoutTree(
  layout: LayoutNode,
  focusedBox?: InlineBox
): string {
  // --- ステップ1: 画面クリア + カーソル先頭 ---
  let output = ANSI.CLEAR + ANSI.HOME;

  // --- ステップ2: ルートから再帰的に描画 ---
  // オフセットは起点(0,0)から始める（ANSIは1-indexedなので内部で+1する）
  output += paintLayoutNode(layout, 0, 0, focusedBox);

  return output;
}

/**
 * レイアウトノードを再帰的に描画する。
 *
 * @param node - 現在のレイアウトノード
 * @param offsetX - 親からのX方向オフセット（累積）
 * @param offsetY - 親からのY方向オフセット（累積）
 * @returns このノード以下の描画文字列
 */
function paintLayoutNode(
  node: LayoutNode,
  offsetX: number,
  offsetY: number,
  focusedBox?: InlineBox
): string {
  let output = "";

  // --- ステップ1: インライン要素を描田 ---
  // [if] lineBoxes がある → 行を描田
  if (node.lineBoxes) {
    for (const line of node.lineBoxes) {
      output += paintLine(line, offsetX, offsetY, focusedBox);
    }
  }

  // --- ステップ2: 子ブロック要素を再帰的に描田 ---
  for (const child of node.children) {
    // 子の絶対位置 = 親のオフセット + 子の相対位置
    output += paintLayoutNode(
      child,
      offsetX + child.rect.x,
      offsetY + child.rect.y,
      focusedBox
    );
  }

  return output;
}

/**
 * 1行（LineBox）を描画する。
 *
 * @param line - 描画する行
 * @param offsetX - X方向オフセット
 * @param offsetY - Y方向オフセット
 * @returns この行の描画文字列
 */
function paintLine(
  line: LineBox,
  offsetX: number,
  offsetY: number,
  focusedBox?: InlineBox
): string {
  // 絶対位置を計算（ANSIは1-indexedなので+1）
  const absY = offsetY + line.rect.y + 1;
  const absX = offsetX + line.rect.x + 1;

  // カーソルを行の開始位置に移動
  let output = ANSI.MOVE(absY, absX);

  // 行内の各インラインボックスを描田
  for (const box of line.boxes) {
    output += paintInlineBox(box, box === focusedBox);
  }

  return output;
}

/**
 * インラインボックスを描田する。
 *
 * @param box - 描田するインラインボックス
 * @param isFocused - フォーカス中かどうか
 * @returns このボックスの描田文字列
 */
function paintInlineBox(box: InlineBox, isFocused: boolean): string {
  // [if] フォーカス中 → リバースビデオ
  if (isFocused) {
    return ANSI.REVERSE + box.text + ANSI.RESET;
  }

  // [else if] リンク → 青色 + 下線
  if (box.type === "link") {
    return ANSI.BLUE + ANSI.UNDERLINE + box.text + ANSI.RESET;
  }

  // [else] テキスト → そのまま
  return box.text;
}
