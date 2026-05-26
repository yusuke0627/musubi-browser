/**
 * CSSルール（Rule）の型定義。
 *
 * CSSは「セレクター」と「宣言ブロック」のペアで構成される。
 *
 * 例: p { color: blue; }
 *     │   └─ 宣言ブロック（Declaration Block）
 *     └─ セレクター（Selector）
 *
 * セレクター: どのHTML要素に適用するか（例: "p", "a", "body"）
 * 宣言ブロック: どのプロパティをどの値にするか（例: { color: "blue" }）
 */

export interface CSSRule {
  /** セレクター。どのタグに適用するかを表す文字列（例: "p", "a", "body"） */
  selector: string;

  /** 宣言（プロパティと値のマップ）。このセレクターに適用するスタイル */
  declarations: Record<string, string>;
}
