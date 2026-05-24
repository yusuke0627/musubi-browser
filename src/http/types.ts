export interface HTTPRequest {
  method: "GET" | "POST" | "HEAD";
  host: string;
  port: number;
  path: string;
  headers: Record<string, string>;
  body: string | null;
}

export interface HTTPResponse {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}
