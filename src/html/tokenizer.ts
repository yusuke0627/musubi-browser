import type { Token } from "./token";

/**
 * トークナイザーの状態（ステートマシン）。
 * HTMLを1文字ずつ読みながら、現在の「文脈」を表す。
 */
type State =
  | "data"              // 通常のテキスト読み込み中
  | "tagOpen"           // '<' を読んだ直後（開始タグか終了タグか判断）
  | "tagName"           // 開始タグの名前を読み込み中
  | "endTagOpen"        // '</' を読んだ直後（終了タグ開始）
  | "endTagName"        // 終了タグの名前を読み込み中
  | "beforeAttrName"    // タグ名読了後、属性があるか確認中
  | "attrName"          // 属性名を読み込み中
  | "beforeAttrValue"   // '=' を読んだ直後、属性値が来る
  | "attrValueDoubleQuoted" // 属性値を " で囲んで読み込み中
  | "attrValueSingleQuoted" // 属性値を ' で囲んで読み込み中
  | "attrValueUnquoted"     // 属性値をクォートなしで読み込み中
  | "afterAttrValue";       // 属性値読了後、次の属性か '>' を待つ

export function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let state: State = "data";

  // --- バッファと蓄積変数 ---
  let buffer = "";                 // Data状態でテキストを蓄積
  let currentTag = "";             // 現在パース中のタグ名
  let currentAttrName = "";      // 現在パース中の属性名
  let currentAttrValue = "";     // 現在パース中の属性値
  let attributes: Record<string, string> = {}; // 完成した属性のマップ
  let isEndTag = false;          // '</' かどうかのフラグ（実際にはendTagNameで判断）

  for (let i = 0; i < html.length; i++) {
    const char = html[i];

    switch (state) {
      // ============================================================
      // 【Data状態】通常のテキストを読み込んでいる状態
      // ============================================================
      case "data": {
        // [if] '<' が来た → タグ開始。蓄積テキストを出力して状態遷移
        if (char === "<") {
          if (buffer) {
            tokens.push({ type: "text", text: buffer });
            buffer = "";
          }
          state = "tagOpen";
        // [else] '<' 以外 → 普通の文字としてバッファに蓄積
        } else {
          buffer += char;
        }
        break;
      }

      // ============================================================
      // 【TagOpen状態】'<' を読んだ直後
      // 次の1文字で「開始タグ」か「終了タグ」かを判断
      // ============================================================
      case "tagOpen": {
        // [if] '<' の次が '/' → 終了タグ（例: </body>）
        if (char === "/") {
          isEndTag = true;
          state = "endTagOpen";
        // [else if] '<' の次がアルファベット → 開始タグ（例: <html>）
        } else if (/[a-zA-Z]/.test(char)) {
          isEndTag = false;
          currentTag = char.toLowerCase();
          state = "tagName";
        }
        // [else] '<' の次が '!'（DOCTYPE）や '?'（XML）は今回非対応 → 無視
        break;
      }

      // ============================================================
      // 【EndTagOpen状態】'</' を読んだ直後
      // 終了タグの名前を読み始める
      // ============================================================
      case "endTagOpen": {
        // [if] アルファベット → 終了タグ名の開始
        if (/[a-zA-Z]/.test(char)) {
          currentTag = char.toLowerCase();
          state = "endTagName";
        }
        // [else] '</' の後にアルファベット以外（不正HTML）→ 無視
        break;
      }

      // ============================================================
      // 【TagName状態】開始タグの名前を読み込み中
      // タグ名の後には「属性」か「タグ終了('>')」が来る
      // ============================================================
      case "tagName": {
        // [if] '>' が来た → タグ終了（属性なし）。StartTagトークンを出力
        if (char === ">") {
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes: {},
          });
          currentTag = "";
          attributes = {};
          state = "data";
        // [else if] 空白が来た → タグ名終了。次に属性が来る可能性
        } else if (/\s/.test(char)) {
          state = "beforeAttrName";
        // [else] アルファベット/数字 → タグ名の続き
        } else {
          currentTag += char.toLowerCase();
        }
        break;
      }

      // ============================================================
      // 【EndTagName状態】終了タグの名前を読み込み中
      // '>' が来るまでタグ名を蓄積
      // ============================================================
      case "endTagName": {
        // [if] '>' → 終了タグ終了。EndTagトークンを出力
        if (char === ">") {
          tokens.push({ type: "end", tag: currentTag });
          currentTag = "";
          isEndTag = false;
          state = "data";
        // [else] '>' 以外 → 終了タグ名の続き
        } else {
          currentTag += char.toLowerCase();
        }
        break;
      }

      // ============================================================
      // 【BeforeAttrName状態】タグ名読了後、次に何が来るか確認中
      // 次の属性名が来るか、タグが終わるかを判断
      // ============================================================
      case "beforeAttrName": {
        // [if] 空白 → 区切り。スキップして次の文字へ
        if (/\s/.test(char)) {
          // 何もしない（状態はそのまま）
        // [else if] '>' → タグ終了。属性途中でも閉じる
        } else if (char === ">") {
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          currentTag = "";
          attributes = {};
          state = "data";
        // [else if] アルファベット → 属性名の開始
        } else if (/[a-zA-Z]/.test(char)) {
          currentAttrName = char.toLowerCase();
          state = "attrName";
        }
        // [else] 上記以外（不正HTML）→ 無視して次へ
        break;
      }

      // ============================================================
      // 【AttrName状態】属性名を読み込み中
      // 属性名の後には '='（値あり）、空白（値なし）、'>'（タグ終了）が来る
      // ============================================================
      case "attrName": {
        // [if] '=' → 属性値が続く。次の状態で値を読む
        if (char === "=") {
          state = "beforeAttrValue";
        // [else if] 空白 → 属性名だけで値なし（例: <input disabled>）
        } else if (/\s/.test(char)) {
          attributes[currentAttrName] = "";
          state = "beforeAttrName";
        // [else if] '>' → タグ突然終了。値なしで登録して閉じる
        } else if (char === ">") {
          attributes[currentAttrName] = "";
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          currentTag = "";
          attributes = {};
          state = "data";
        // [else] アルファベット/数字 → 属性名の続き
        } else {
          currentAttrName += char.toLowerCase();
        }
        break;
      }

      // ============================================================
      // 【BeforeAttrValue状態】'=' を読んだ直後
      // 次の文字で属性値の囲い方（ダブル/シングル/なし）を判断
      // ============================================================
      case "beforeAttrValue": {
        // [if] '=' の直後の空白 → 値の前の空白をスキップ
        if (/\s/.test(char)) {
          // 何もしない
        // [else if] '"' → ダブルクォートで囲まれた値を読む
        } else if (char === '"') {
          currentAttrValue = "";
          state = "attrValueDoubleQuoted";
        // [else if] "'" → シングルクォートで囲まれた値を読む
        } else if (char === "'") {
          currentAttrValue = "";
          state = "attrValueSingleQuoted";
        // [else] クォートなし → 空白か'>'が来るまで値として読む（例: class=foo）
        } else {
          currentAttrValue = char;
          state = "attrValueUnquoted";
        }
        break;
      }

      // ============================================================
      // 【AttrValueDoubleQuoted状態】"value" を読み込み中
      // 閉じの " が来るまで、すべてを属性値として蓄積
      // ============================================================
      case "attrValueDoubleQuoted": {
        // [if] 閉じの '"' → 属性値確定。マップに登録して次へ
        if (char === '"') {
          attributes[currentAttrName] = currentAttrValue;
          state = "afterAttrValue";
        // [else] '"' 以外 → 属性値の一部として蓄積
        } else {
          currentAttrValue += char;
        }
        break;
      }

      // ============================================================
      // 【AttrValueSingleQuoted状態】'value' を読み込み中
      // 閉じの ' が来るまで、すべてを属性値として蓄積
      // ============================================================
      case "attrValueSingleQuoted": {
        // [if] 閉じの "'" → 属性値確定。マップに登録して次へ
        if (char === "'") {
          attributes[currentAttrName] = currentAttrValue;
          state = "afterAttrValue";
        // [else] "'" 以外 → 属性値の一部として蓄積
        } else {
          currentAttrValue += char;
        }
        break;
      }

      // ============================================================
      // 【AttrValueUnquoted状態】クォートなしの値を読み込み中
      // 空白か '>' が来るまで、値として蓄積
      // ============================================================
      case "attrValueUnquoted": {
        // [if] 空白 → 値が終了。属性を登録して次の属性へ
        if (/\s/.test(char)) {
          attributes[currentAttrName] = currentAttrValue;
          state = "beforeAttrName";
        // [else if] '>' → 値が終了＆タグも終了
        } else if (char === ">") {
          attributes[currentAttrName] = currentAttrValue;
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          currentTag = "";
          attributes = {};
          state = "data";
        // [else] 空白/'>' 以外 → 値の続き
        } else {
          currentAttrValue += char;
        }
        break;
      }

      // ============================================================
      // 【AfterAttrValue状態】属性値を読み終わった直後
      // 次に空白（次の属性へ）、'>'（タグ終了）が来ることを期待
      // ============================================================
      case "afterAttrValue": {
        // [if] 空白 → 次の属性がある可能性がある
        if (/\s/.test(char)) {
          state = "beforeAttrName";
        // [else if] '>' → タグが終了
        } else if (char === ">") {
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          currentTag = "";
          attributes = {};
          state = "data";
        }
        // [else] 空白や'>'以外（不正HTML）→ 無視して次へ進む
        break;
      }
    }
  }

  // ============================================================
  // ループ終了後：テキストバッファに残りがあればTextトークンとして出力
  // （HTMLがテキストで終わった場合、Data状態で '<' が来ないまま終了する）
  // ============================================================
  if (buffer) {
    tokens.push({ type: "text", text: buffer });
  }

  return tokens;
}
