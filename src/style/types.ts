import type { Node } from "../html/node";

/**
 * スタイル適用済みノードの型。
 *
 * DOMノードに、計算済みのCSSスタイル（computedStyle）を付与したもの。
 * ブラウザパイプラインで言うところの「Render Tree」のノードに相当する。
 *
 * 例:
 *   Element("p") → StyledNode(Element, computedStyle: { color: "blue" })
 */

/**
 * スタイル適用済みノード。
 * 元のDOMノード + 計算済みスタイルマップ。
 */
export interface StyledNode {
  /** 元のDOMノード（Element または Text） */
  node: Node;

  /** 計算済みスタイル。プロパティ名と値のマップ */
  computedStyle: Record<string, string>;
}
