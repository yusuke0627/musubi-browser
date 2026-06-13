import { test, expect, describe } from "bun:test";
import { parsePullRequestUrl, isPullRequestUrl } from "../../src/nav/pr-url";

describe("parsePullRequestUrl", () => {
  test("parses canonical GitHub PR URL", () => {
    const result = parsePullRequestUrl(
      "https://github.com/yusuke0627/musubi-browser/pull/25"
    );
    expect(result).toEqual({
      owner: "yusuke0627",
      repo: "musubi-browser",
      number: 25,
    });
  });

  test("parses PR URL with trailing slash", () => {
    const result = parsePullRequestUrl(
      "https://github.com/yusuke0627/musubi-browser/pull/25/"
    );
    expect(result).toEqual({
      owner: "yusuke0627",
      repo: "musubi-browser",
      number: 25,
    });
  });

  test("parses PR URL with .diff suffix (returns base pr)", () => {
    const result = parsePullRequestUrl(
      "https://github.com/yusuke0627/musubi-browser/pull/25.diff"
    );
    expect(result).toEqual({
      owner: "yusuke0627",
      repo: "musubi-browser",
      number: 25,
    });
  });

  test("parses PR URL with .patch suffix", () => {
    const result = parsePullRequestUrl(
      "https://github.com/yusuke0627/musubi-browser/pull/25.patch"
    );
    expect(result).toEqual({
      owner: "yusuke0627",
      repo: "musubi-browser",
      number: 25,
    });
  });

  test("parses PR URL with /files path segment", () => {
    const result = parsePullRequestUrl(
      "https://github.com/yusuke0627/musubi-browser/pull/25/files"
    );
    expect(result).toEqual({
      owner: "yusuke0627",
      repo: "musubi-browser",
      number: 25,
    });
  });

  test("returns null for non-GitHub host", () => {
    const result = parsePullRequestUrl(
      "https://gitlab.com/owner/repo/-/merge_requests/1"
    );
    expect(result).toBeNull();
  });

  test("returns null for GitHub URL that is not a PR", () => {
    const result = parsePullRequestUrl(
      "https://github.com/yusuke0627/musubi-browser/issues/25"
    );
    expect(result).toBeNull();
  });

  test("returns null for GitHub root URL", () => {
    const result = parsePullRequestUrl("https://github.com/");
    expect(result).toBeNull();
  });

  test("returns null for empty string", () => {
    const result = parsePullRequestUrl("");
    expect(result).toBeNull();
  });

  test("returns null for PR URL with non-numeric number", () => {
    const result = parsePullRequestUrl(
      "https://github.com/yusuke0627/musubi-browser/pull/abc"
    );
    expect(result).toBeNull();
  });

  test("returns null for PR URL with negative number", () => {
    const result = parsePullRequestUrl(
      "https://github.com/yusuke0627/musubi-browser/pull/-1"
    );
    expect(result).toBeNull();
  });
});

describe("isPullRequestUrl", () => {
  test("returns true for canonical PR URL", () => {
    expect(
      isPullRequestUrl("https://github.com/yusuke0627/musubi-browser/pull/25")
    ).toBe(true);
  });

  test("returns false for issue URL", () => {
    expect(
      isPullRequestUrl("https://github.com/yusuke0627/musubi-browser/issues/25")
    ).toBe(false);
  });

  test("returns false for non-GitHub host", () => {
    expect(
      isPullRequestUrl("https://example.com/foo/bar/pull/1")
    ).toBe(false);
  });
});
