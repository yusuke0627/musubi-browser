import type { Node } from "../html/node";
import type { CSSRule } from "../css/types";
import { computeStyle } from "../style/computed-style";
import type { LayoutNode, Rect } from "./types";
import { computeInlineLayout } from "./inline-layout";

/**
 * DOMツリーに対してBlock Layoutを計算し、レイアウトツリーを構築する。
 *
 * Block Layoutの原理:
 *   - ブロック要素（display: blockの要素）は縦に積まれる
 *   - 各要素の幅は親の幅を満たす（width = 親のwidth）
 *   - 子要素は上から順に配置され、Y座標が積み上がっていく
 *   - 親の高さは子の合計高さ
 *
 * ブロック要素の中でインライン子を持つ場合（例: <p>hello</p>）:
 *   - Inline Layoutを用いて行分割する
 *   - 行数 = 高さ
 *   - 結果は lineBoxes に保存
 *
 * 例:
 *   <div>          → rect: { x:0, y:0, width:80, height:2 }
 *     <p>hello</p> → rect: { x:0, y:0, width:80, height:1 }, lineBoxes: [...]
 *     <p>world</p> → rect: { x:0, y:1, width:80, height:1 }, lineBoxes: [...]
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
    // 空白のみのテキストノードはスキップ
    if (isWhitespaceOnlyTextNode(childNode)) continue;

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
 * ノードが空白のみのテキストノードかどうかを判定する。
 * HTML ではブロック要素間の改行・空白は通常無視される。
 */
function isWhitespaceOnlyTextNode(node: Node): boolean {
  return "text" in node && typeof node.text === "string" && node.text.trim().length === 0;
}

/**
 * ノードがインライン子を持つかチェックする。
 * TextノードやHTMLAnchorElementを含む場合はtrue。
 * 空白のみのテキストノードは無視する。
 */
function hasInlineChildren(node: Node): boolean {
  return node.children.some(
    (child) =>
      !isWhitespaceOnlyTextNode(child) &&
      ("text" in child || ("tag" in child && child.tag === "a"))
  );
}

/**
 * 再帰的に子ノードのレイアウトを計算する。
 *
 * 子がインライン要素の場合はInline Layoutを使い、
 * ブロック要素の場合は縦積みのBlock Layoutを使う。
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

  // [if] 子がいない（葉ノード）→ 高さは1行
  if (node.children.length === 0) {
    rect.height = 1;
    return {
      styledNode,
      rect,
      children: [],
    };
  }

  // [if] 子がインライン要素（Textや<a>）を含む → Inline Layout
  if (hasInlineChildren(node)) {
    // 子を行に分割して配置
    const lineBoxes = computeInlineLayout(node.children, parentWidth, parentX, 0);
    // 高さは行数（行がない場合は1）
    rect.height = lineBoxes.length > 0 ? lineBoxes.length : 1;

    return {
      styledNode,
      rect,
      children: [],
      lineBoxes,
    };
  }

  // [else] 子がブロック要素のみ → 縦積みのBlock Layout
  const children: LayoutNode[] = [];
  let childCurrentY = 0; // このノード内での子のY座標（相対位置）

  for (const childNode of node.children) {
    // 空白のみのテキストノードはスキップ
    if (isWhitespaceOnlyTextNode(childNode)) continue;

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

  return {
    styledNode,
    rect,
    children,
  };
}
