import type { LayoutNode, InlineBox } from "../layout/types";

/**
 * レイアウトツリーから、フォーカス可能なリンク（type: "link"）を文書順で集める。
 *
 * DFS で:
 *   1. 自分の lineBoxes 内のリンクを収集
 *   2. 子ブロックを再帰的に探索
 *
 * テキストボックスは対象外。
 *
 * @param layout - レイアウトツリーのルート
 * @returns 文書順の InlineBox（type: "link"）の配列
 */
export function getFocusableLinks(layout: LayoutNode): InlineBox[] {
  const links: InlineBox[] = [];

  // --- このノードの lineBoxes 内のリンクを収集 ---
  if (layout.lineBoxes) {
    for (const lineBox of layout.lineBoxes) {
      for (const box of lineBox.boxes) {
        if (box.type === "link") {
          links.push(box);
        }
      }
    }
  }

  // --- 子ブロックを再帰的に探索 ---
  for (const child of layout.children) {
    links.push(...getFocusableLinks(child));
  }

  return links;
}

/**
 * 現在のリンクから「次」のフォーカス対象を返す。
 *
 * 配列の最後から先頭へ循環する。
 *
 * @param current - 現在フォーカス中のリンク
 * @param links - getFocusableLinks() で取得したリンク配列
 * @returns 次にフォーカスすべきリンク
 */
export function nextFocus(
  current: InlineBox,
  links: InlineBox[]
): InlineBox {
  const index = links.indexOf(current);
  // 見つからない、または最後の要素 → 先頭へ
  if (index === -1 || index === links.length - 1) {
    return links[0];
  }
  return links[index + 1];
}

/**
 * 現在のリンクから「前」のフォーカス対象を返す。
 *
 * 配列の先頭から末尾へ循環する。
 *
 * @param current - 現在フォーカス中のリンク
 * @param links - getFocusableLinks() で取得したリンク配列
 * @returns 前にフォーカスすべきリンク
 */
export function prevFocus(
  current: InlineBox,
  links: InlineBox[]
): InlineBox {
  const index = links.indexOf(current);
  // 見つからない、または先頭の要素 → 末尾へ
  if (index === -1 || index === 0) {
    return links[links.length - 1];
  }
  return links[index - 1];
}
