/**
 * musubi-browser パイプライン デモ
 *
 * HTML 文字列をトークン化 → DOMツリー構築 → レイアウト計算 → TUI ペイント
 * という musubi-browser の全パイプラインを通して実行し、ANSI エスケープ
 * コード付きの描画結果をターミナルに出力します。
 *
 * 実行:
 *   bun run examples/paint-demo.ts
 *
 * オプション:
 *   bun run examples/paint-demo.ts "任意の HTML 文字列"
 */

import { tokenize } from "../src/html/tokenizer";
import { buildTree } from "../src/html/tree-builder";
import { computeBlockLayout } from "../src/layout/block-layout";
import { paintLayoutTree } from "../src/paint/ansi-paint";

// --- デモ用 HTML（コマンドライン引数があればそれを使う） ---
const DEFAULT_HTML = `
<html><body>
<h1>musubi-browser</h1>
<p>TUI ブラウザパイプラインのデモ。</p>
<p>詳細は <a href="https://github.com/yusuke0627/musubi-browser">リポジトリ</a> を見てね。</p>
<p>複数行のテキストも折り返して表示されます。長い文章を入力すれば、自動的に2行・3行に分割されて、リンクだけが青＋下線で強調されます。</p>
</body></html>
`.trim();

const html = process.argv[2] ?? DEFAULT_HTML;

// --- パイプライン実行 ---
console.log("=== INPUT HTML ===");
console.log(html);
console.log("\n=== PIPELINE STAGES ===");

const tokens = tokenize(html);
console.log(`1. Tokenize: ${tokens.length} tokens`);

const dom = buildTree(tokens);
console.log(`2. Build DOM: ${countNodes(dom)} nodes`);

const VIEWPORT_WIDTH = 80;
const layout = computeBlockLayout(dom, [], VIEWPORT_WIDTH);
console.log(`3. Layout: root rect = ${JSON.stringify(layout.rect)}`);

const output = paintLayoutTree(layout);
console.log(`4. Paint: ${output.length} chars of ANSI`);

console.log("\n=== RAW ANSI OUTPUT (JSON) ===");
console.log(JSON.stringify(output));

console.log("\n=== RENDERED IN TERMINAL ===");
process.stdout.write(output);
console.log("\n");

// --- ヘルパー ---
function countNodes(node: { children: any[] }): number {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}
