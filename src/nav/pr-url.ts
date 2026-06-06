/**
 * GitHub Pull Request URL utilities.
 *
 * Pull Request URLs follow this canonical pattern:
 *   https://github.com/{owner}/{repo}/pull/{number}
 *
 * Optional path segments and suffixes are allowed:
 *   /pull/25/files      - ファイル一覧タブ
 *   /pull/25.diff       - diff ビュー
 *   /pull/25.patch      - patch ビュー
 *   /pull/25/           - 末尾スラッシュ
 */

/** パース結果。GitHub PR URL でない場合は null。 */
export interface PullRequestRef {
  owner: string;
  repo: string;
  number: number;
}

/**
 * GitHub Pull Request URL をパースして { owner, repo, number } を返す。
 *
 * PR URL でなければ null。 Issue URL、GitHub 以外のホスト、無効な
 * パス（数字でない、桁が0など）は null。
 *
 * @param url - 対象 URL 文字列
 * @returns パース結果、または null
 */
export function parsePullRequestUrl(url: string): PullRequestRef | null {
  // 空文字は早期 return（new URL() に渡すと "Invalid URL" になるため）
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // ホストは github.com のみ
  if (parsed.host !== "github.com") return null;

  // /<owner>/<repo>/pull/<number>... の形に分解
  //   例: /yusuke0627/musubi-browser/pull/25
  //       /yusuke0627/musubi-browser/pull/25/files
  //       /yusuke0627/musubi-browser/pull/25.diff
  const segments = parsed.pathname.split("/").filter((s) => s.length > 0);
  if (segments.length < 4) return null;

  const [owner, repo, segment, numberStr] = segments;
  if (segment !== "pull") return null;

  // ".diff" ".patch" "/files" などを剥がす
  //   "25.diff" → "25", "25" → "25", "25" → "25"
  const numericPart = numberStr.replace(/\.(diff|patch)$/, "");
  if (!/^\d+$/.test(numericPart)) return null;
  if (numericPart.startsWith("-")) return null; // 防御（正規表現で弾かれるが念のため）

  const number = Number(numericPart);
  if (!Number.isInteger(number) || number < 1) return null;

  return { owner, repo, number };
}

/**
 * URL が GitHub Pull Request URL であれば true。
 *
 * parsePullRequestUrl() の薄いラッパー。
 *
 * @param url - 対象 URL 文字列
 * @returns PR URL なら true
 */
export function isPullRequestUrl(url: string): boolean {
  return parsePullRequestUrl(url) !== null;
}
