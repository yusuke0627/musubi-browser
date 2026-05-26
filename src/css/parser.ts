import type { CSSRule } from "./types";

/**
 * CSS文字列をパースしてCSSRuleの配列を返す。
 *
 * 対応する構文（簡易版）:
 *   selector { property: value; property2: value2; }
 *
 * パースの流れ:
 *   1. セレクターを読む（'{' が来るまで）
 *   2. '{' を読み飛ばす
 *   3. 宣言ブロックを読む（'}' が来るまで）
 *   4. 宣言ブロック内でプロパティと値を ';' で区切って読む
 *   5. '}' を読み飛ばす
 *   6. 1〜5を繰り返して複数ルールを読む
 */
export function parseCSS(css: string): CSSRule[] {
  const rules: CSSRule[] = [];
  let i = 0; // 現在の文字位置（ポインタ）

  // 文字列の終わりまで1文字ずつ進む
  while (i < css.length) {
    // --- 前処理: セレクター前の空白をスキップ ---
    while (i < css.length && /\s/.test(css[i])) {
      i++;
    }

    // 空白スキップ後に文字列終了 → パース完了
    if (i >= css.length) break;

    // ============================================================
    // 【ステップ1】セレクターを読む
    // '{' が来るまでの文字列をセレクターとして蓄積
    // ============================================================
    let selector = "";
    while (i < css.length && css[i] !== "{") {
      selector += css[i];
      i++;
    }

    // セレクターの前後の空白を除去（例: "  p  " → "p"）
    selector = selector.trim();

    // [if] '{' が来た → セレクター読了。次は宣言ブロック
    if (css[i] === "{") {
      i++; // '{' を読み飛ばす
    }

    // ============================================================
    // 【ステップ2】宣言ブロックを読む
    // '}' が来るまでの文字列を宣言ブロックとして蓄積
    // ============================================================
    let declarations: Record<string, string> = {};
    let blockContent = "";

    while (i < css.length && css[i] !== "}") {
      blockContent += css[i];
      i++;
    }

    // ブロック内容の前後の空白を除去（例: "  color: blue;  " → "color: blue;"）
    blockContent = blockContent.trim();

    // ============================================================
    // 【ステップ3】宣言ブロック内のプロパティと値を分解
    // ';' で区切って各宣言を処理
    // ============================================================
    if (blockContent) {
      // [if] ブロック内容が空でない → ';' で分割して各宣言をパース
      const declarationsArray = blockContent.split(";");

      for (const decl of declarationsArray) {
        const trimmedDecl = decl.trim();

        // [if] 空文字列や空白だけの場合 → スキップ（末尾の';'対応）
        if (!trimmedDecl) continue;

        // プロパティと値を ':' で分割
        // 例: "color: blue" → ["color", "blue"]
        const colonIndex = trimmedDecl.indexOf(":");

        // [if] ':' が見つかった → プロパティと値に分離して登録
        if (colonIndex !== -1) {
          const property = trimmedDecl.slice(0, colonIndex).trim();
          const value = trimmedDecl.slice(colonIndex + 1).trim();

          // [if] プロパティと値が両方存在 → declarationsに登録
          if (property && value) {
            // CSSプロパティ名はkebab-case（例: "text-decoration"）
            // DOMスタイルではcamelCase（例: "textDecoration"）が一般的なので変換
            const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            declarations[camelCaseProperty] = value;
          }
          // [else] どちらかが空 → 不正な宣言として無視
        }
        // [else] ':' がない → 不正な宣言として無視
      }
    }
    // [else] ブロック内容が空 → declarationsは空のまま

    // ============================================================
    // 【ステップ4】'}' を読み飛ばす
    // ============================================================
    if (css[i] === "}") {
      i++; // '}' を読み飛ばす
    }

    // ============================================================
    // 【ステップ5】完成したルールを配列に追加
    // ============================================================
    // [if] セレクターが存在 → 有効なルールとして登録
    if (selector) {
      rules.push({ selector, declarations });
    }
    // [else] セレクターが空 → 不正なルールとして無視
  }

  return rules;
}
