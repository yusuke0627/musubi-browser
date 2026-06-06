import type { LayoutNode, InlineBox, Rect } from "../layout/types";

/**
 * 点が矩形内に含まれるかを判定する。
 *
 * 矩形の座標は親の中での相対位置なので、呼び出し側で offsetX/offsetY を足す。
 *
 * @param row - クリックの行座標（絶対）
 * @param col - クリックの列座標（絶対）
 * @param rect - 矩形の座標（相対）
 * @param offsetX - X 方向の累積オフセット
 * @param offsetY - Y 方向の累積オフセット
 */
function isInRect(
  row: number,
  col: number,
  rect: Rect,
  offsetX: number,
  offsetY: number
): boolean {
  const absX = rect.x + offsetX;
  const absY = rect.y + offsetY;
  return (
    row >= absY &&
    row < absY + rect.height &&
    col >= absX &&
    col < absX + rect.width
  );
}

/**
 * レイアウトツリー内で、クリック座標 (row, col) に該当する InlineBox を探す。
 *
 * LineBox.rect.y や InlineBox.rect.y は親ブロックの中での相対位置なので、
 * 再帰で累積オフセットを足しながら絶対座標と比較する。
 *
 * @param layout - レイアウトツリーのルート
 * @param row - クリックの行座標（0-indexed）
 * @param col - クリックの列座標（0-indexed）
 * @returns 該当した InlineBox（テキスト or リンク）、なければ null
 */
export function hitTest(
  layout: LayoutNode,
  row: number,
  col: number
): InlineBox | null {
  return hitTestRecursive(layout, row, col, 0, 0);
}

function hitTestRecursive(
  layout: LayoutNode,
  row: number,
  col: number,
  offsetX: number,
  offsetY: number
): InlineBox | null {
  // --- このノードが lineBoxes を持つ場合、各 LineBox をチェック ---
  if (layout.lineBoxes) {
    for (const lineBox of layout.lineBoxes) {
      // LineBox 内の矩形判定（offset 込み）
      if (isInRect(row, col, lineBox.rect, offsetX, offsetY)) {
        // LineBox の絶対座標を計算
        //   - InlineBox.rect.x は「行内の相対位置」
        //   - InlineBox.rect.y は常に 0（行の Y に等しい）
        //   - よって InlineBox の絶対位置 = LineBox の絶対位置 + box.rect
        const lineAbsX = offsetX + lineBox.rect.x;
        const lineAbsY = offsetY + lineBox.rect.y;

        // LineBox 内の各 InlineBox を探す
        for (const box of lineBox.boxes) {
          if (isInRect(row, col, box.rect, lineAbsX, lineAbsY)) {
            return box;
          }
        }
      }
    }
  }

  // --- 子ブロックを再帰的に探索 ---
  // 自分の rect.x / rect.y をオフセットとして累積
  for (const child of layout.children) {
    const result = hitTestRecursive(
      child,
      row,
      col,
      offsetX + layout.rect.x,
      offsetY + layout.rect.y
    );
    if (result) return result;
  }

  return null;
}
