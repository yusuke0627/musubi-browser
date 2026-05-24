import type { HTTPRequest } from "./types";

export function buildRequest(req: HTTPRequest): string {
  const lines: string[] = [`${req.method} ${req.path} HTTP/1.1`];
  for (const [key, value] of Object.entries(req.headers)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push("", "");
  return lines.join("\r\n");
}
