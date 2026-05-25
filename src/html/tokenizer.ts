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
        if (char === "<") {
          // '<' を見つけた = タグが始まる合図
          // それまで蓄積していたテキストがあれば、Textトークンとして出力
          if (buffer) {
            tokens.push({ type: "text", text: buffer });
            buffer = "";
          }
          // 次の文字で「開始タグか終了タグか」を判断する状態へ遷移
          state = "tagOpen";
        } else {
          // '<' 以外は普通の文字 → テキストバッファに蓄積
          buffer += char;
        }
        break;
      }

      // ============================================================
      // 【TagOpen状態】'<' を読んだ直後
      // 次の1文字で「開始タグ」か「終了タグ」かを判断
      // ============================================================
      case "tagOpen": {
        if (char === "/") {
          // '<' の次が '/' → 終了タグ開始（例: </body>）
          isEndTag = true;
          state = "endTagOpen";
        } else if (/[a-zA-Z]/.test(char)) {
          // '<' の次がアルファベット → 開始タグ開始（例: <html>）
          isEndTag = false;
          // タグ名の最初の文字を蓄積（小文字に統一）
          currentTag = char.toLowerCase();
          state = "tagName";
        }
        // 注: '<' の次が '!'（DOCTYPE宣言）や '?'（XML処理命令）は今回非対応
        break;
      }

      // ============================================================
      // 【EndTagOpen状態】'</' を読んだ直後
      // 終了タグの名前を読み始める
      // ============================================================
      case "endTagOpen": {
        if (/[a-zA-Z]/.test(char)) {
          // アルファベット → 終了タグ名の開始
          currentTag = char.toLowerCase();
          state = "endTagName";
        }
        // 注: '</' の後にアルファベット以外（空白や記号）が来るのは不正HTMLだが、
        //     今回は単純化のため無視
        break;
      }

      // ============================================================
      // 【TagName状態】開始タグの名前を読み込み中
      // タグ名の後には「属性」か「タグ終了('>')」が来る
      // ============================================================
      case "tagName": {
        if (char === ">") {
          // '>' を見つけた = タグが終了（属性なし）
          // 蓄積したタグ名で StartTag トークンを出力
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes: {},  // 属性なしなので空オブジェクト
          });
          // 変数をリセットして次のテキスト読み込みへ
          currentTag = "";
          attributes = {};
          state = "data";
        } else if (/\s/.test(char)) {
          // 空白文字 → タグ名が終了、次に属性が来る可能性がある
          state = "beforeAttrName";
        } else {
          // アルファベット（または数字）→ タグ名の続き
          currentTag += char.toLowerCase();
        }
        break;
      }

      // ============================================================
      // 【EndTagName状態】終了タグの名前を読み込み中
      // '>' が来るまでタグ名を蓄積
      // ============================================================
      case "endTagName": {
        if (char === ">") {
          // '>' を見つけた = 終了タグが終了
          // 蓄積したタグ名で EndTag トークンを出力
          tokens.push({ type: "end", tag: currentTag });
          // 変数をリセット
          currentTag = "";
          isEndTag = false;
          state = "data";
        } else {
          // '>' 以外 → 終了タグ名の続き
          currentTag += char.toLowerCase();
        }
        break;
      }

      // ============================================================
      // 【BeforeAttrName状態】タグ名読了後、次に何が来るか確認中
      // 次の属性名が来るか、タグが終わるかを判断
      // ============================================================
      case "beforeAttrName": {
        if (/\s/.test(char)) {
          // 空白文字 → 単なる区切り、スキップして次の文字へ
          // 何もしない（状態はそのまま）
        } else if (char === ">") {
          // '>' → タグが終了（属性が途中まで読まれた状態で終わる）
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          // 変数をリセット
          currentTag = "";
          attributes = {};
          state = "data";
        } else if (/[a-zA-Z]/.test(char)) {
          // アルファベット → 属性名の開始
          // 属性名の最初の文字を蓄積（小文字に統一）
          currentAttrName = char.toLowerCase();
          state = "attrName";
        }
        break;
      }

      // ============================================================
      // 【AttrName状態】属性名を読み込み中
      // 属性名の後には '='（値あり）、空白（値なし）、'>'（タグ終了）が来る
      // ============================================================
      case "attrName": {
        if (char === "=") {
          // '=' → 属性値が続く
          // 属性名は確定したが、値はまだ。次の状態で値を読む
          state = "beforeAttrValue";
        } else if (/\s/.test(char)) {
          // 空白 → 属性名だけで値なし（例: <input disabled>）
          // 属性名を空文字列の値として登録
          attributes[currentAttrName] = "";
          // 次の属性があるかもしれないので、属性名読み込み前の状態へ
          state = "beforeAttrName";
        } else if (char === ">") {
          // '>' → タグが突然終了（属性値なし）
          attributes[currentAttrName] = "";
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          // 変数をリセット
          currentTag = "";
          attributes = {};
          state = "data";
        } else {
          // アルファベット → 属性名の続き
          currentAttrName += char.toLowerCase();
        }
        break;
      }

      // ============================================================
      // 【BeforeAttrValue状態】'=' を読んだ直後
      // 次の文字で属性値の囲い方（ダブル/シングル/なし）を判断
      // ============================================================
      case "beforeAttrValue": {
        if (/\s/.test(char)) {
          // '=' の直後に空白 → 値の前の空白をスキップ
          // （例: class = "foo" の '=' と '"' の間の空白）
        } else if (char === '"') {
          // ダブルクォート → ダブルクォートで囲まれた値を読む
          currentAttrValue = "";
          state = "attrValueDoubleQuoted";
        } else if (char === "'") {
          // シングルクォート → シングルクォートで囲まれた値を読む
          currentAttrValue = "";
          state = "attrValueSingleQuoted";
        } else {
          // クォートなし → 空白か '>' が来るまで値として読む
          // （例: <div class=foo>）
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
        if (char === '"') {
          // 閉じの " を見つけた = 属性値確定
          // 属性名→属性値のマップに登録
          attributes[currentAttrName] = currentAttrValue;
          // 属性値読了後、次の属性か '>' を待つ状態へ
          state = "afterAttrValue";
        } else {
          // " 以外 → 属性値の一部として蓄積
          currentAttrValue += char;
        }
        break;
      }

      // ============================================================
      // 【AttrValueSingleQuoted状態】'value' を読み込み中
      // 閉じの ' が来るまで、すべてを属性値として蓄積
      // ============================================================
      case "attrValueSingleQuoted": {
        if (char === "'") {
          // 閉じの ' を見つけた = 属性値確定
          attributes[currentAttrName] = currentAttrValue;
          state = "afterAttrValue";
        } else {
          // ' 以外 → 属性値の一部として蓄積
          currentAttrValue += char;
        }
        break;
      }

      // ============================================================
      // 【AttrValueUnquoted状態】クォートなしの値を読み込み中
      // 空白か '>' が来るまで、値として蓄積
      // ============================================================
      case "attrValueUnquoted": {
        if (/\s/.test(char)) {
          // 空白 → 値が終了。属性を登録して次の属性へ
          attributes[currentAttrName] = currentAttrValue;
          state = "beforeAttrName";
        } else if (char === ">") {
          // '>' → 値が終了＆タグも終了
          attributes[currentAttrName] = currentAttrValue;
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          // 変数をリセット
          currentTag = "";
          attributes = {};
          state = "data";
        } else {
          // 空白/'>' 以外 → 値の続き
          currentAttrValue += char;
        }
        break;
      }

      // ============================================================
      // 【AfterAttrValue状態】属性値を読み終わった直後
      // 次に空白（次の属性へ）、'>'（タグ終了）が来ることを期待
      // ============================================================
      case "afterAttrValue": {
        if (/\s/.test(char)) {
          // 空白 → 次の属性がある可能性がある
          state = "beforeAttrName";
        } else if (char === ">") {
          // '>' → タグが終了
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          // 変数をリセット
          currentTag = "";
          attributes = {};
          state = "data";
        }
        // 注: 空白や '>' 以外（例えばアルファベット）が来た場合、
        //     不正なHTMLだが、今回は無視して次の文字へ進む
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
