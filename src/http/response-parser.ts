import type { HTTPResponse } from "./types";

export function parseResponse(raw: string): HTTPResponse {
  const separator = "\r\n\r\n";
  const headerEnd = raw.indexOf(separator);
  if (headerEnd === -1) {
    throw new Error("Invalid HTTP response: missing header/body separator");
  }

  const headerSection = raw.slice(0, headerEnd);
  const body = raw.slice(headerEnd + separator.length);

  const lines = headerSection.split("\r\n");
  const statusLine = lines[0];
  const statusMatch = statusLine.match(/^HTTP\/1\.\d\s+(\d+)\s+(.*)$/);
  if (!statusMatch) {
    throw new Error(`Invalid status line: ${statusLine}`);
  }

  const statusCode = parseInt(statusMatch[1], 10);
  const statusText = statusMatch[2];

  const headers: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    headers[key] = value;
  }

  return { statusCode, statusText, headers, body };
}
