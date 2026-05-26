import type { Token } from "./token";
import { Node, Element, HTMLAnchorElement, Text } from "./node";

/**
 * トークン配列からDOM木を構築する。
 *
 * 原理:
 *   HTMLは「開始タグ」と「終了タグ」が対になって入れ子になる。
 *   これを「スタック」で追跡することで、親子関係を復元する。
 *
 *   [開始タグ] → 新しい要素を作り、現在の親にappendChild → 自分を新しい親に（push）
 *   [テキスト]  → 現在の親にテキストノードをappendChild
 *   [終了タグ]  → 親を1段階戻る（pop）
 *
 * 例: <html><body><p>hello</p></body></html>
 *
 *   <html>  push(html)    スタック: [placeholder, html]
 *   <body>  push(body)    スタック: [placeholder, html, body]
 *   <p>     push(p)       スタック: [placeholder, html, body, p]
 *   hello   append text   スタック: [placeholder, html, body, p]（変化なし）
 *   </p>    pop()         スタック: [placeholder, html, body]
 *   </body> pop()         スタック: [placeholder, html]
 *   </html> pop()         スタック: [placeholder]
 */
export function buildTree(tokens: Token[]): Element {
  // プレースホルダールート。
  // 本物のDOM木は root.children[0] に入る。
  // これにより、複数トップレベル要素が来ても統一的に処理できる。
  const root = new Element("");

  // --- スタック：現在の「親要素」を追跡 ---
  // 常に stack[stack.length - 1] = 現在appendすべき親要素
  const stack: Node[] = [root];

  // トークンを1つずつ順番に処理（Tokenizerが平らにした順序のまま）
  for (const token of tokens) {
    // スタックの最上位 = 現在の親要素
    // 新しいノードは必ずこの「current」にappendChildされる
    const current = stack[stack.length - 1];

    // [if] 開始タグ（例: <html>, <body>, <a href="...">）
    //   → 新しい要素を作り、親に追加。そして自分を親にする（深くなる）
    if (token.type === "start") {
      let element: Element;

      // [if] タグ名が "a" → HTMLAnchorElement（リンク特殊要素）
      if (token.tag === "a") {
        element = new HTMLAnchorElement(token.attributes);
      // [else] その他のタグ → 通常のElement
      } else {
        element = new Element(token.tag, token.attributes);
      }

      // 現在の親に新しい要素を子として追加
      current.appendChild(element);

      // 新しい要素をスタックに積む → 次のトークンはこの子の中に入る
      stack.push(element);

    // [else if] 終了タグ（例: </html>, </body>）
    //   → 現在の要素を閉じて、親に戻る（浅くなる）
    } else if (token.type === "end") {
      // スタックから最上位要素を取り除く
      // これにより「current」が親要素に戻る
      stack.pop();

    // [else if] テキスト（例: "hello"）
    //   → 現在の親にテキストノードを追加（スタックは変わらない）
    } else if (token.type === "text") {
      // テキストノードは葉（子を持たない）なのでスタックには積まない
      current.appendChild(new Text(token.text));
    }
    // [else] 上記以外のトークン型 → 今回は無視（Token型で型安全なので実際には来ない）
  }

  // ============================================================
  // ループ終了後：プレースホルダーを飛ばして本物のルート要素を返す
  // ============================================================
  // 入力: <html>...</html> → root.children[0] = html要素
  // 入力が空の場合は undefined だが、今回は正常なHTMLを前提
  return root.children[0] as Element;
}
