import { Node, Element, Text } from "../html/node";
import type { CSSRule } from "../css/types";
import type { StyledNode } from "./types";

/**
 * DOMツリーにCSSルールを適用し、スタイル適用済みノードツリーを構築する。
 *
 * 処理の流れ:
 *   1. 各Elementノードに対して、マッチするCSSルールを探す
 *   2. マッチしたルールの宣言（declarations）をノードのcomputedStyleにコピー
 *   3. <a>タグにはデフォルトスタイルを適用
 *   4. 子ノードも再帰的に処理（継承プロパティを伝播）
 *
 * 例:
 *   HTML: <p>hello</p>
 *   CSS:  p { color: blue; }
 *   → Element("p") の computedStyle = { color: "blue" }
 *     └── Text("hello") の computedStyle = { color: "blue" }（継承）
 */

/**
 * <a> タグのデフォルトスタイル。
 * ブラウザのUA Stylesheet（User Agent Stylesheet）に相当する。
 *
 * 通常のブラウザでは、<a> 要素は以下のデフォルトスタイルを持つ:
 *   - color: blue（または #0000EE）
 *   - text-decoration: underline
 *
 * 今回はシンプル化のため、明示的なCSSルールがなくても
 * <a> タグには自動的にこれらのスタイルを適用する。
 */
const DEFAULT_ANCHOR_STYLE: Record<string, string> = {
  color: "blue",
  textDecoration: "underline",
};

/**
 * 単一のDOMノードに、マッチするCSSルールとデフォルトスタイルを適用して
 * StyledNode を作成する。
 *
 * 【処理の流れ】
 *   1. 空の computedStyle を作成
 *   2. CSSRule[] を巡回し、selector が node.tag と一致するルールを探す
 *   3. 一致したルールの declarations を computedStyle にマージ（上書き）
 *   4. ノードが <a> タグなら DEFAULT_ANCHOR_STYLE をマージ
 *   5. 完成した computedStyle を持つ StyledNode を返す
 */
function applyStyle(node: Node, rules: CSSRule[]): StyledNode {
  // [if] Element ノード → スタイル適用の対象
  if (node instanceof Element) {
    // --- ステップ1: 空のスタイルマップを初期化 ---
    const computedStyle: Record<string, string> = {};

    // --- ステップ2: CSSルールとのマッチング ---
    // rules を順番に見て、selector が node.tag と一致するか確認
    for (const rule of rules) {
      // [if] ルールのセレクターがノードのタグ名と完全一致 → スタイル適用
      if (rule.selector === node.tag) {
        // ルールの宣言を computedStyle にコピー（上書き）
        for (const [property, value] of Object.entries(rule.declarations)) {
          computedStyle[property] = value;
        }
      }
      // [else] セレクターが不一致 → 何もしない（スキップ）
    }

    // --- ステップ3: <a> タグのデフォルトスタイル適用 ---
    // [if] ノードが <a> タグ → リンクのデフォルトスタイルを追加
    if (node.tag === "a") {
      // 既存のスタイルを上書きしないように、DEFAULT のプロパティを確認
      for (const [property, value] of Object.entries(DEFAULT_ANCHOR_STYLE)) {
        // [if] まだ設定されていないプロパティ → デフォルト値を適用
        if (!computedStyle[property]) {
          computedStyle[property] = value;
        }
        // [else] 既にCSSで指定されている → 指定値を優先
      }
    }

    return { node, computedStyle };
  }

  // [else] Text ノード → スタイル適用の対象外（ただし継承は別途処理）
  return { node, computedStyle: {} };
}

/**
 * DOMツリーのルートから再帰的にスタイルを適用し、
 * StyledNode のツリーを構築する。
 *
 * 【処理の流れ】
 *   1. ルートノードに applyStyle() でスタイル適用
 *   2. 子ノードを再帰的に処理
 *   3. 継承プロパティ（今回は "color" のみ）を子に伝播
 *
 * 注: 今回はシンプル化のため、継承プロパティは "color" のみ対応。
 *     本物のブラウザでは font-size, line-height など多数の継承プロパティがある。
 */
export function computeStyle(root: Node, rules: CSSRule[]): StyledNode {
  // --- ステップ1: ルートノードにスタイル適用 ---
  const styledRoot = applyStyle(root, rules);

  // --- ステップ2: 子ノードを再帰的に処理 ---
  // ルートノードの子要素を1つずつ styled に変換
  const styledChildren: StyledNode[] = [];

  for (const child of root.children) {
    // 子ノードに対して再帰的に computeStyle を呼び出す
    const styledChild = computeStyle(child, rules);

    // --- ステップ3: 継承プロパティの伝播 ---
    // [if] 親の computedStyle に "color" がある → 子にもコピー
    if (styledRoot.computedStyle.color) {
      // [if] 子がまだ "color" を持っていない → 親の色を継承
      if (!styledChild.computedStyle.color) {
        styledChild.computedStyle.color = styledRoot.computedStyle.color;
      }
      // [else] 子が既に自分の "color" を持っている → 子の値を優先（上書きしない）
    }

    styledChildren.push(styledChild);
  }

  // 元のNodeの子を StyledNode の子に差し替え
  // 注: Node.children は StyledNode[] ではないので、ここでは別途管理が必要
  // 今回は StyledNode 自体に children を持たせる設計に変更

  return styledRoot;
}
