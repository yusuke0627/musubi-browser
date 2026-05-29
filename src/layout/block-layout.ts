import type { Node } from "../html/node";
import type { CSSRule } from "../css/types";
import { computeStyle } from "../style/computed-style";
import type { LayoutNode, Rect } from "./types";

/**
 * DOMツリーに対してBlock Layoutを計算し、レイアウトツリーを構築する。
 *
 * Block Layoutの原理:
 *   - ブロック要素（display: block）は縦に積まれる
 *   - 各要素の幅は親の幅を満たす（width = 親のwidth）
 *   - 子要素は上から順に配置され、Y座標が積み上がっていく
 *   - 親の高さは子の合計高さ
 *
 * 例:
 *   <div>          → rect: { x:0, y:0, width:80, height:2 }
 *     <p>hello</p> → rect: { x:0, y:0, width:80, height:1 }
 *     <p>world</p> → rect: { x:0, y:1, width:80, height:1 }
 *
 * @param rootNode - DOMツリーのルートノード
 * @param cssRules - CSSルール配列
 * @param viewportWidth - 画面幅（文字数）
 * @returns レイアウトツリーのルートノード
 */
export function computeBlockLayout(
  rootNode: Node,
  cssRules: CSSRule[],
  viewportWidth: number
): LayoutNode {
  // --- ステップ1: ルートノードにスタイルを適用 ---
  const styledRoot = computeStyle(rootNode, cssRules);

  // --- ステップ2: ルートの矩形を初期化 ---
  // ルートは画面全体を占める。y=0, x=0, width=viewportWidth, height=0（後で子の合計に更新）
  const rootRect: Rect = { x: 0, y: 0, width: viewportWidth, height: 0 };

  // --- ステップ3: 子ノードを再帰的にレイアウト ---
  const children: LayoutNode[] = [];
  let currentY = 0; // 子を配置する現在のY座標（縦方向のカーソル）

  for (const childNode of rootNode.children) {
    // 子ノードに対して再帰的にレイアウト計算
    const childLayout = computeBlockLayoutRecursive(childNode, cssRules, viewportWidth, 0, currentY);

    children.push(childLayout);

    // [if] 子のrectがある → 次の子はこの子の下に配置（yを積み上げる）
    if (childLayout.rect) {
      currentY += childLayout.rect.height;
    }
  }

  // --- ステップ4: ルートの高さを子の合計に更新 ---
  rootRect.height = currentY;

  return {
    styledNode: styledRoot,
    rect: rootRect,
    children,
  };
}

/**
 * 再帰的に子ノードのレイアウトを計算する。
 *
 * @param node - 現在のDOMノード
 * @param cssRules - CSSルール配列
 * @param parentWidth - 親の幅（ブロック要素はこれを満たす）
 * @param parentX - 親のX座標（子は親と同じxから開始）
 * @param currentY - 現在のY座標（子はこの位置に配置）
 * @returns レイアウトノード
 */
function computeBlockLayoutRecursive(
  node: Node,
  cssRules: CSSRule[],
  parentWidth: number,
  parentX: number,
  currentY: number
): LayoutNode {
  // --- ステップ1: ノードにスタイルを適用 ---
  const styledNode = computeStyle(node, cssRules);

  // --- ステップ2: ノードの矩形を計算 ---
  // ブロック要素は親の幅を満たし、親と同じx座標から開始
  const rect: Rect = {
    x: parentX,
    y: currentY,
    width: parentWidth,
    height: 0, // 後で更新
  };

  // --- ステップ3: 子ノードを再帰的にレイアウト ---
  const children: LayoutNode[] = [];
  let childCurrentY = 0; // このノード内での子のY座標（相対位置）

  // [if] 子がいる → 子を縦に積む
  if (node.children.length > 0) {
    for (const childNode of node.children) {
      const childLayout = computeBlockLayoutRecursive(
        childNode,
        cssRules,
        parentWidth,  // 子も同じ幅
        parentX,      // 子も同じx座標（ブロック要素は左寄せ）
        childCurrentY // このノード内での相対Y座標
      );

      children.push(childLayout);

      // [if] 子のrectがある → 次の子はこの子の下に配置
      if (childLayout.rect) {
        childCurrentY += childLayout.rect.height;
      }
    }
    // [if] 子がいた → 自分の高さは子の合計高さ
    rect.height = childCurrentY;
  } else {
    // [else] 子がいない（葉ノード）→ 高さは1行（テキスト要素など）
    rect.height = 1;
  }

  return {
    styledNode,
    rect,
    children,
  };
}
