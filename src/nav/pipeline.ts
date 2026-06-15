/**
 * URL からページをフェッチし、全パイプラインを通して ANSI 出力を生成する。
 *
 * HTTP → HTML Tokenizer → DOM Tree Builder → Layout → Paint
 */

import { HTTPClient } from "../http/client";
import { tokenize } from "../html/tokenizer";
import { buildTree } from "../html/tree-builder";
import { computeBlockLayout } from "../layout/block-layout";
import { paintLayoutTree } from "../paint/ansi-paint";
import type { LayoutNode } from "../layout/types";
import type { HTTPResponse } from "../http/types";

/**
 * renderURL の結果。
 */
export interface RenderResult {
  /** レイアウトツリー */
  layout: LayoutNode;

  /** ターミナル出力用の ANSI エスケープシーケンス付き文字列 */
  ansi: string;

  /** 実際にフェッチした URL（リダイレクト後などで変わる可能性があるため） */
  url: string;
}

/**
 * renderURL で使用する HTTPClient のインターフェース。
 *
 * テスト時にモックを注入できるように抽象化している。
 */
export interface HTTPClientLike {
  fetch(url: string): Promise<HTTPResponse>;
  close(): void;
}

/**
 * 指定した URL のページをフェッチし、全パイプラインを実行する。
 *
 * @param url - フェッチする URL
 * @param viewportWidth - ビューポート幅（文字数）
 * @param client - HTTPClient。デフォルトは新規 HTTPClient
 * @returns レイアウトと ANSI 出力を含む RenderResult
 */
export async function renderURL(
  url: string,
  viewportWidth: number,
  client: HTTPClientLike = new HTTPClient()
): Promise<RenderResult> {
  try {
    const response = await client.fetch(url);

    const tokens = tokenize(response.body);
    const dom = buildTree(tokens);
    const layout = computeBlockLayout(dom, [], viewportWidth);
    const ansi = paintLayoutTree(layout);

    return { layout, ansi, url };
  } finally {
    client.close();
  }
}
