# 🗺️ musubi-browser Roadmap #1〜#9 詳細解説

> **「ブラウザって結局どう動いてるの？」** を、生まれてこのかた一番シンプルな形で答えるプロジェクト。

このドキュメントは、musubi-browserの **9つのパイプラインステージ** を、コードを見ながら手を動かして学べるようにまとめた学習資料です。読み終わる頃には、`src/` 配下のどのファイルが「何をするための何」か、即答できるようになります 🎉

---

## 📖 目次

1. [全体像：ブラウザって何してるの？](#1-全体像ブラウザって何してるの)
2. [パイプライン全体図](#2-パイプライン全体図)
3. [各ステージの詳細](#3-各ステージの詳細)
   - [#1 HTTP/1.1 Client](#1-http11-client--loadingステージ) (Issue #2)
   - [#2 HTML Tokenizer](#2-html-tokenizer--parsingステージ) (Issue #3)
   - [#3 DOM Tree Builder](#3-dom-tree-builder--parsingステージ) (Issue #4)
   - [#4 CSS Parser](#4-css-parser--parsingステージ) (Issue #5)
   - [#5 Computed Style](#5-computed-style--renderingステージ) (Issue #6)
   - [#6 Block Layout](#6-block-layout--layoutステージ) (Issue #7)
   - [#7 Inline Layout](#7-inline-layout--layoutステージ) (Issue #8)
   - [#8 TUI Paint](#8-tui-paint--paintingステージ) (Issue #9)
   - [#9 Link Navigation](#9-link-navigation--scriptingステージ) (Issue #10)
4. [設計思想](#4-設計思想)
5. [データ型の旅](#5-データ型の旅一文字がどう変わるか)
6. [用語集](#6-用語集)
7. [学習のロードマップ](#7-学習のロードマップ)
8. [次にやること](#8-次にやること)

---

## 1. 全体像：ブラウザって何してるの？

ブラウザがやってることは、ざっくり言うと **6つのステージ** に分かれます：

| ステージ | やってること | 例えると |
|---------|------------|---------|
| **Loading** | サーバからデータをもらう | 料理でいう「買い出し」 |
| **Parsing** | データを構造化する | 「食材を切る・下処理する」 |
| **Rendering** | 「どう見せるか」を決める | 「レシピを決める」 |
| **Layout** | 画面上の位置とサイズを決める | 「お皿に盛り付ける」 |
| **Painting** | 実際に描く | 「テーブルに並べる」 |
| **Scripting** | ユーザーの操作に反応する | 「食事中に追加注文を受ける」 |

musubi-browserは、**これを全部スクラッチで実装する**プロジェクトです。
React も Vue も Chrome も使わず、TypeScriptとBunだけで。

---

## 2. パイプライン全体図

```
  URL                                          Terminal
   │                                              ▲
   ▼                                              │
┌────────┐    ┌─────┐    ┌──────┐   ┌────────┐   │
│  HTTP  │───▶│ HTML│───▶│ DOM  │──▶│Computed│   │
│ Client │    │Token│    │ Tree │   │ Style  │   │
└────────┘    └─────┘    └──────┘   └────────┘   │
   #1            #2         #3         #5        │
                                                │
   ┌────────────────────────────────────────┐   │
   ▼                                        ▼   ▼
┌────────┐    ┌────────┐    ┌──────┐    ┌──────┐
│ Layout │───▶│ Inline │───▶│  TUI │───▶│ Link │
│ Block  │    │ Layout │    │Paint │    │ Nav  │
└────────┘    └────────┘    └──────┘    └──────┘
   #6            #7           #8         #9
```

データは **左から右へ一方向に流れる** のがポイント。前のステージの出力が、次のステージの入力になります。

---

## 3. 各ステージの詳細

> **読み方のコツ**: 各ステージは「🎯 ゴール」「📥 入力」「📤 出力」「🗂️ ファイル」「🧪 テスト」「✅ ステータス」の6項目で統一されてます。気になるステージから読んでOK！

---

### #1 HTTP/1.1 Client — Loadingステージ

**Issue:** #2 (CLOSED ✅)

#### 🎯 ゴール

`fetch()` を使わず、**生ソケット**で HTTP/1.1 の GET リクエストを送り、レスポンスをパースしてオブジェクトにする。

#### 💡 なぜ「スクラッチで」？

「`Bun.connect()` で TCP ソケット開いて、テキストで `"GET / HTTP/1.1\r\n..."` 送って、`Content-Length` か `Connection: close` で終わりを判定して……」という地味な処理が、ブラウザの「Loading」の正体。
普段 `fetch()` で隠されてるこの動きを、自分の目で見るのがこのステージの面白さ。

#### 📥 入力 / 📤 出力

- **入力**: URL文字列（例: `"http://example.com/"`）
- **出力**: `HTTPResponse` オブジェクト
  ```ts
  {
    statusCode: 200,
    statusText: "OK",
    headers: { "Content-Type": "text/html", ... },
    body: "<html>...</html>"
  }
  ```

#### 🗂️ ファイル構成

```
src/http/
├── client.ts          # HTTPClient クラス（エントリ）
├── url.ts             # URLパーサ
├── request-builder.ts # 生HTTPリクエスト文字列の組み立て
├── response-parser.ts # レスポンス文字列 → HTTPResponse
└── types.ts           # HTTPRequest, HTTPResponse 型定義
```

#### 🔧 実装の核

```ts
// src/http/client.ts（抜粋）
const socket = Bun.connect({
  hostname: host,
  port,
  socket: {
    data(_socket, chunk) { buffer += decode(chunk); },
    open(socket) { socket.write(rawRequest); },
  },
});
```

たったこれだけでHTTPが喋れる。ライブラリって便利だねって実感する瞬間。

#### 🧪 テスト

- `tests/http/url.test.ts` — URLパース
- `tests/http/request-builder.test.ts` — リクエスト文字列生成
- `tests/http/response-parser.test.ts` — レスポンスパース
- `tests/http/client.test.ts` — エンドツーエンド
- `tests/http/cli.test.ts` — CLI統合

#### ✅ ステータス

**完了・マージ済み**。`bun run src/main.ts http://localhost:9999/` で動くはず。

---

### #2 HTML Tokenizer — Parsingステージ

**Issue:** #3 (CLOSED ✅)

#### 🎯 ゴール

HTMLの生文字列（`<p>hello</p>`）を、**トークンの列**に変換する。

#### 💡 なぜトークン化が要るの？

HTMLは自由な書き方が許されてる（閉じタグ省略OK、属性のクォートなしOK等）。なので**字句解析（lexing）** をして、まず「意味のある最小単位」に分解してから、次の木の組み立て（パース）に進む。

ブラウザの字句解析器は数千〜数万行あるけど、musubi-browserは最小限のサブセットだけ対応。

#### 📥 入力 / 📤 出力

- **入力**: `"<a href='x'>link</a>"`
- **出力**: `Token[]`
  ```ts
  [
    { type: "start", tag: "a", attributes: { href: "x" } },
    { type: "text",  text: "link" },
    { type: "end",   tag: "a" },
  ]
  ```

#### 🗂️ ファイル

- `src/html/token.ts` — `StartTagToken | EndTagToken | TextToken` の判別共用体型
- `src/html/tokenizer.ts` — 状態機械による字句解析（305行）

#### 🔧 実装の核

**状態機械（state machine）** で1文字ずつ進む：

```
         '<' に出会う           '>' に出会う
DATA ───────────────▶ TAG_OPEN ────────────▶ DATA
                       │
                       '/' なら
                       ▼
                    END_TAG_OPEN
```

コメントには各分岐の `if/else if/else` すべてにインライン解説がついてるので、読むだけで状態遷移が追える設計。

#### 🧪 テスト

- `tests/html/tokenizer.test.ts` — タグ・テキスト・属性のパース

#### ✅ ステータス

**完了・マージ済み**。

---

### #3 DOM Tree Builder — Parsingステージ

**Issue:** #4 (OPEN 🔓) ← 今ココ

#### 🎯 ゴール

トークンの列を、**木構造のDOMノード**に変換する。`<a href="...">` は特別な `HTMLAnchorElement` として扱う。

#### 💡 なぜ木構造？

HTMLは**入れ子構造**だから。`<div><p>hello</p></div>` のように、タグの中にタグが入る。配列や線形リストでは「親と子の関係」を表現しにくいから、木にする。

#### 📥 入力 / 📤 出力

- **入力**: `Token[]`（Tokenizerの出力）
- **出力**: DOM Tree
  ```
  Element(html)
  ├── Element(body)
  │   └── HTMLAnchorElement(href="https://example.com")
  │       └── Text("Example")
  ```

#### 🗂️ ファイル

- `src/html/node.ts` — `Node` 基底 + `Element` + `Text` + `HTMLAnchorElement`
- `src/html/tree-builder.ts` — **スタックベース**で木を構築（82行）

#### 🔧 データ構造（重要！）

```ts
// src/html/node.ts
class Node {
  children: Node[] = [];
  appendChild(child: Node): void { this.children.push(child); }
}

class Element extends Node {
  tag: string;
  attributes: Record<string, string>;
  isLink: boolean;     // ← <a> かどうかのフラグ
  get href(): string | undefined { return this.attributes.href; }
}

class HTMLAnchorElement extends Element {
  // コンストラクタで isLink = true
}
```

`HTMLAnchorElement` が `Element` を継承するのがポイント。
**リンクを「特別なElement」として最初からクラスレベルで区別** することで、後段のレイアウト・ペイントで楽になる（link-centric design）。

#### 🧪 テスト

- `tests/html/tree-builder.test.ts`

#### ✅ ステータス

**未着手 or 作業中**。Issue #4を開いてる状態。

---

### #4 CSS Parser — Parsingステージ

**Issue:** #5 (CLOSED ✅)

#### 🎯 ゴール

CSS文字列を、`selector` + `declarations` のルールの配列にパースする。

#### 💡 なぜこのステージが要る？

HTMLが「構造」、CSSが「見た目」。この2つは別々の言語で書かれてるから、**別々にパース** してから「どのDOMノードにどのルールが当たるか」を次のステージで計算する。

#### 📥 入力 / 📤 出力

- **入力**: `"p { color: blue; } a { color: red; }"`
- **出力**: `CSSRule[]`
  ```ts
  [
    { selector: "p", declarations: { color: "blue" } },
    { selector: "a", declarations: { color: "red" } },
  ]
  ```

#### 🗂️ ファイル

- `src/css/types.ts` — `CSSRule`, `CSSDeclaration` 型
- `src/css/parser.ts` — 手書きの再帰下降パーサ（119行）

#### 🔧 サポートするセレクター

- タグ: `p`
- クラス: `.foo`
- ID: `#bar`
-  descendant combinator: `div p`

フルスペックのCSSはとんでもなく複雑なので、**最小限のサブセット**だけ対応。

#### 🧪 テスト

- `tests/css/parser.test.ts`

#### ✅ ステータス

**完了・マージ済み**。

---

### #5 Computed Style — Renderingステージ

**Issue:** #6 (OPEN 🔓)

#### 🎯 ゴール

DOMツリーにCSSルールを適用して、**各ノードの最終的な見た目** を決定する。`<a>` タグは「リンク」だとマーク。

#### 💡 なぜこのステージが要る？

CSSは **どのノードにどう適用されるか** が後から決まる（カスケーディング）。なので：
1. すべてのルールをなめて
2. どのノードにマッチするか判定し
3. マッチしたルールのプロパティ値を
4. そのノードにコピーする

という計算が必要。結果は「**Render Tree**（または Style Tree）」と呼ばれる。

#### 📥 入力 / 📤 出力

- **入力**: `Node`（DOMノード）+ `CSSRule[]`
- **出力**: `StyledNode`
  ```ts
  {
    node: Element("p"),
    computedStyle: { color: "blue", fontSize: "16px" }
  }
  ```

#### 🗂️ ファイル

- `src/style/types.ts` — `StyledNode` 型
- `src/style/computed-style.ts` — マッチング + カスケード + 継承（129行）

#### 🔧 実装の核

```ts
// src/style/computed-style.ts
const DEFAULT_ANCHOR_STYLE = {
  color: "blue",
  textDecoration: "underline",
};

function applyStyle(node: Node, rules: CSSRule[]): StyledNode {
  // 1. マッチするルールを全部なめて declarations をマージ
  // 2. <a> タグなら DEFAULT_ANCHOR_STYLE を追加
  // 3. 子ノードも再帰的に処理（color等は継承）
}
```

**link marking**: `<a>` 要素は `isLink: true` フラグで「これはクリックできる」と識別される。`HTMLAnchorElement` クラスで既にやってる作業と、スタイル計算でまたやる役割分担がポイント。

#### 🧪 テスト

- `tests/style/computed-style.test.ts`

#### ✅ ステータス

**未着手 or 作業中**。Issue #6を開いてる状態。

---

### #6 Block Layout — Layoutステージ

**Issue:** #7 (CLOSED ✅)

#### 🎯 ゴール

`display: block` な要素の**位置とサイズ**を再帰的に計算する。最終的に「**Layout Tree**（Render Tree + 矩形）」を作る。

#### 💡 「レイアウト」の意味

CSSでスタイルが決まっても、**「画面のどこに表示するか」** はまだ決まってない。レイアウトエンジンが「x座標、y座標、幅、高さ」を割り振る。

#### 📥 入力 / 📤 出力

- **入力**: `StyledNode[]`（Computed Styleの結果）
- **出力**: `LayoutNode[]`
  ```ts
  {
    styledNode: StyledNode,
    rect: { x: 0, y: 0, width: 80, height: 1 },
    children: [...],
    lineBoxes?: LineBox[]
  }
  ```

#### 🗂️ ファイル

- `src/layout/types.ts` — `Rect`, `LayoutNode`, `InlineBox`, `LineBox` 型
- `src/layout/block-layout.ts` — 縦に積むアルゴリズム（167行）
- `src/layout/inline-layout.ts` — 行内配置（208行）

#### 🔧 実装の核

**ブロック要素は縦に積まれる**：

```
┌─────────────────┐
│     <div>       │ ← x=0, y=0
└─────────────────┘
┌─────────────────┐
│     <p>         │ ← x=0, y=1（前ブロックの高さ分下）
└─────────────────┘
┌─────────────────┐
│     <p>         │ ← x=0, y=2
└─────────────────┘
```

幅は `親の幅 - margin - padding - border` で計算。高さは `コンテンツ + padding + border` で計算。

#### 🧪 テスト

- `tests/layout/block-layout.test.ts` — 5テスト（基本 + インライン統合）

#### ✅ ステータス

**完了・マージ済み（PR #17）**。

---

### #7 Inline Layout — Layoutステージ

**Issue:** #8 (CLOSED ✅)

#### 🎯 ゴール

ブロック要素**の中身の**インライン要素を、行に分割して配置する。`<a>` リンクは**クリック判定用の矩形**を持つ。

#### 💡 なぜインラインだけ別ステージ？

ブロック要素は縦に積むだけだけど、**インライン要素は行内折り返し** がある。
「"これはリンクです"の途中で改行したい」「リンクは分断したくない」みたいな繊細な処理が必要だから、専用のエンジンに切り出してる。

#### 📥 入力 / 📤 出力

- **入力**: インラインノードの配列
- **出力**: `LineBox[]`
  ```ts
  {
    rect: { x: 0, y: 2, width: 80, height: 1 },
    boxes: [
      { type: "text", text: "Click ", rect: {...} },
      { type: "link", text: "here", href: "https://...", rect: {...} },
    ]
  }
  ```

#### 🗂️ ファイル

- `src/layout/inline-layout.ts` — テキスト折り返し + リンクボックス（208行）

#### 🔧 実装の核

- **テキストは1文字ずつ分割**して折り返し判定
- **リンクは分断禁止**（MVP制約）
- リンクは `href` を持つので、後のHit-Testで「ここがクリックされた」と判定できる

#### 🧪 テスト

- `tests/layout/inline-layout.test.ts` — 4テスト
- `tests/layout/block-layout.test.ts` — 統合テスト3つ

#### ✅ ステータス

**完了・マージ済み（PR #18）**。`feat/8-inline-layout` ブランチで作業、`hasInlineChildren()` でBlock Layoutに統合。

---

### #8 TUI Paint — Paintingステージ

**Issue:** #9 (OPEN 🔓) ← **今作業中！**

#### 🎯 ゴール

Layout Treeを、**ANSIエスケープコード**の文字列に変換してターミナルに描く。リンクは**青色＋下線**。

#### 💡 「TUI」って何？

**T**ext **U**ser **I**nterface の略。マウスも画像も使わず、**文字だけ**でUIを作ること。vimとかhtopみたいなやつ。

`\x1b[34m` で青色、`\x1b[4m` で下線、`\x1b[H` でカーソル先頭移動。**「文字で画面を描く」** ためのプロトコルがANSI escape code。

#### 📥 入力 / 📤 出力

- **入力**: `LayoutNode`（ルート）
- **出力**: ANSI文字列
  ```
  \x1b[2J\x1b[H\x1b[34m\x1b[4mリンク\x1b[0m
  ```
  → 「画面クリア → カーソル先頭 → 青＆下線で『リンク』と表示 → リセット」

#### 🗂️ ファイル

- `src/paint/ansi-paint.ts` — `paintLayoutTree()` 他（119行）

#### 🔧 実装の核

```ts
const ANSI = {
  CLEAR: "\x1b[2J",
  HOME: "\x1b[H",
  MOVE: (y, x) => `\x1b[${y};${x}H`,
  BLUE: "\x1b[34m",
  UNDERLINE: "\x1b[4m",
  RESET: "\x1b[0m",
  GRAY: "\x1b[90m",      // 画像は灰色
};

export function paintLayoutTree(layout: LayoutNode): string {
  // 1. 画面クリア + カーソル先頭
  // 2. ルートから再帰的に描画
  //    - ブロック要素: 矩形を空白で埋める
  //    - インライン要素: lineBoxes を1行ずつ描画
  //    - リンク: 青＋下線
  //    - 画像: 灰色で [img: alt text]
}
```

#### 🧪 テスト

- `tests/paint/ansi-paint.test.ts` — 4テスト

#### ✅ ステータス

**ブランチ `feat/9-tui-paint` で作業中、PR #19 オープン**。
- 機能: 34/34テスト全通過
- 次のアクション: マージ → Issue #10 へ

---

### #9 Link Navigation — Scriptingステージ

**Issue:** #10 (OPEN 🔓) ← **次はこれ！**

#### 🎯 ゴール

ユーザーがリンクをクリック（または Tab+Enter）したら、`href` を解決して**パイプラインを最初からやり直す**。

#### 💡 「Scripting」って名前だけど…

本当のJavaScriptエンジンは実装しない（**静的HTML/CSSのみ**）。
代わりに「Scripting = ユーザーの入力に反応するステージ」と定義して、**リンククリック → ページ遷移** だけに集中する。

#### 📥 入力 / 📤 出力

- **入力**: ユーザーのマウスクリック or キーボード入力
- **出力**: 新しいページのTUI描画

```
マウスイベント (x, y)
    ↓
Hit-Test: (x, y) がどの InlineBox.rect に入る？
    ↓
URL解決: href を絶対URLに変換
    ↓
HTTPClient.fetch(url)        ← Stage #1 に戻る！
    ↓
... パイプラインを全実行 ...
    ↓
TUI Paint
```

#### 🔧 実装するもの

- **Hit-Test**: クリック座標 → `InlineBox` の逆引き
- **マウスレポート**: `\x1b[?1000h`（クリック）, `\x1b[?1002h`（ドラッグ）, `\x1b[?1015h`（SGR拡張座標）
- **キーボード**: Tab でリンク巡回、Enter で遷移
- **URL解決**: 相対URL → 絶対URL

#### 🧪 テスト（予定）

- Hit-Test が正しいInlineBoxを返すこと
- 相対URLの解決が正しいこと
- 同じURLを2回フェッチしても壊れないこと

#### ✅ ステータス

**未着手**。Issue #10で詳細設計待ち。

---

## 4. 設計思想

### 🧭 Link-centric Design（リンク中心設計）

普通のブラウザは「テキスト」が中心で、リンクは「たまたま`href`属性がついたテキスト」。

musubi-browserは**逆**で、`<a>` を最初から `HTMLAnchorElement` という**専用のクラス**にして、**全ステージで「リンクの扱い」を意識**する。

- Tokenizer: `<a>` の `href` 属性を確実に拾う
- DOM: `HTMLAnchorElement` で他と区別
- Style: デフォルトで青＋下線
- Layout: クリック判定用の矩形を保存
- Paint: 青色＋下線で描画
- Navigation: クリックで遷移

「リンクは特別な存在」という前提を置くことで、コードがシンプルになる。

### 🖼️ 画像は文字列で代替

`<img src="...">` をデコードするのは大変。なので `[img: alt text]` という文字列ブロックで代替。
これにより、画像フォーマット（PNG, JPEG, WebP, ...）の学習を**完全にスキップ**できる。

### 🧪 TDD（テスト駆動開発）

各Issueは `tests/` 配下にテストファイルが先に書かれ、`src/` の中身は **テストを通すためだけ** に書かれる。
「動くかわからないけど書いた」を排除し、**常にテストが通る状態** を保つ。

### 📦 小さなIssue

「大きな機能を1つのIssueで実装」しない。代わりに：
- 1 Issue = 1 ステージ
- 1 PR = 1 Issue
- 1 セッション = 1 Issue完了

これで「PRが重すぎ」「レビューできない」問題を防ぐ。

---

## 5. データ型の旅（一文字がどう変わるか）

`"hello"` という文字列が、パイプラインを通ってどう変身するかを見てみよう：

| ステージ | 型 | 例 |
|---------|---|---|
| **入力** | URL文字列 | `"http://example.com/"` |
| **#1 後** | `HTTPResponse` | `{ body: "hello<a href='x'>link</a>" }` |
| **#2 後** | `Token[]` | `[{type:"text",text:"hello"}, {type:"start",tag:"a",...}, ...]` |
| **#3 後** | `Node` 木 | `Element("body") → [Text("hello"), HTMLAnchorElement]` |
| **#4 後** | `CSSRule[]` | `[{selector:"a",declarations:{color:"blue"}}]` |
| **#5 後** | `StyledNode` | `{node, computedStyle:{color:"blue",textDecoration:"underline"}}` |
| **#6 後** | `LayoutNode` | `{styledNode, rect:{x:0,y:0,width:80,height:1}, children, lineBoxes}` |
| **#8 後** | 文字列 | `"\x1b[2J\x1b[Hhello\x1b[34m\x1b[4mlink\x1b[0m"` |
| **#9 後** | 入力イベント → 上記を再生成 | ユーザーがリンクをクリックしたら全やり直し |

**データ構造がリファインされ続ける** のがブラウザパイプラインの本質。
各ステージの「入力型」と「出力型」を把握すれば、全体が線でつながる。

---

## 6. 用語集

| 用語 | 意味 |
|------|------|
| **TCPソケット** | ネットワーク通信の端点。`Bun.connect()` で開く |
| **HTTP/1.1** | 1996年制定のHTTPプロトコル。今でも大部分のウェブサイトがこれで通信してる |
| **トークン** | 字句解析の最小単位。HTMLなら「タグ」「テキスト」「コメント」 |
| **DOM** | Document Object Model。HTMLの木構造表現 |
| **CSSカスケード** | 複数のルールが同じノードに当たったとき、優先順位をつけて適用する仕組み |
| **Specificity（詳細度）** | `id` > `class` > `tag` の順で優先 |
| **Computed Style** | カスケード・継承・初期値を経た「最終的な」スタイル |
| **Block要素** | 縦に積まれる要素。`<div>`, `<p>`, `<h1>` 等 |
| **Inline要素** | 行内で流れる要素。`<a>`, `<span>`, `<strong>` 等 |
| **Layout Tree** | ノード + 矩形情報の木 |
| **Hit-Test** | 座標 → 当たり判定。クリックされた要素を特定する |
| **ANSI escape code** | ターミナルを制御する特殊文字シーケンス。`\x1b[34m` とか |
| **TUI** | Text User Interface。文字だけで作るUI |

---

## 7. 学習のロードマップ

「どこから読めばいいの？」への答え：

### 🟢 初心者向け（まずはここから）

1. **`src/main.ts`** — エントリポイント。CLIの動きが分かる
2. **`src/http/client.ts`** — `Bun.connect()` の使い方
3. **`src/html/tokenizer.ts`** — 状態機械の入門
4. **`src/paint/ansi-paint.ts`** — すぐ動く結果が得られる

### 🟡 中級者向け

1. **`src/html/tree-builder.ts`** — スタックで木を組むパターン
2. **`src/style/computed-style.ts`** — カスケードと継承
3. **`src/layout/block-layout.ts`** — 再帰で矩形を計算

### 🔴 上級者向け

1. **`src/layout/inline-layout.ts`** — テキスト折り返しアルゴリズム
2. **`src/css/parser.ts`** — 再帰下降パーサ
3. **Issue #10（予定）** — Hit-Test、URL解決、パイプライン再実行

---

## 8. 次にやること

現在の進捗：

| Issue | タイトル | 状態 |
|-------|---------|------|
| #1 | [Roadmap] TUI Browser from HTTP to Layout | OPEN |
| #2 | HTTP/1.1 Client | ✅ CLOSED |
| #3 | HTML Tokenizer | ✅ CLOSED |
| #4 | DOM Tree Builder | 🔓 OPEN |
| #5 | CSS Parser | ✅ CLOSED |
| #6 | Computed Style | 🔓 OPEN |
| #7 | Block Layout | ✅ CLOSED |
| #8 | Inline Layout | ✅ CLOSED |
| #9 | TUI Paint | 🔓 OPEN（PR #19 マージ待ち） |
| #10 | Link Navigation | 🔓 OPEN（次のIssue） |

**直近のタスク**:

1. **PR #19（Issue #9）をマージ** ← 今ここ
2. **`feat/10-link-navigation` ブランチを作成**
3. **Issue #10 を実装**: Hit-Test + キーボード/マウス入力 + パイプライン再実行
4. 🎉 **動いているブラウザの完成！**

---

## 🎉 最後に

このプロジェクトは、**「ブラックボックスを分解する楽しさ」** を体験するためにあります。

普段何気なく使ってる「ブラウザでページを見る」という行為の裏側に、9つのステージと、それらを結ぶデータ型の旅があることを知ると、**ネットを見る目** が変わります。

「あれ、このボタンなんで青色なんだろう？」
「この`<a>`タグ、なんで改行しても分断されないんだろう？」

そう思った瞬間、あなたはもう**ブラウザの中身を知っている人**です 🚀

Happy hacking! 🎉
