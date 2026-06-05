/**
 * 相対 URL を絶対 URL に解決する。
 *
 * JavaScript 標準の `new URL(href, base)` コンストラクタに委譲。
 * 4パターンすべてに対応する:
 *   - 絶対 URL:        "https://x.com/"  → そのまま
 *   - 絶対パス:        "/foo"            → "http(s)://host/foo"
 *   - 相対パス:        "foo/bar"         → "http(s)://host/dir/foo/bar"
 *   - プロトコル相対:  "//x.com/"        → "http(s)://x.com/"
 *
 * @param href - 解決対象の href（`<a>` 要素の href 属性）
 * @param base - 基準となる URL（現在のページの URL）
 * @returns 絶対 URL 文字列
 */
export function resolveHref(href: string, base: string): string {
  return new URL(href, base).toString();
}
