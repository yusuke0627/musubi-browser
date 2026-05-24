import { parseURL } from "./url";
import { buildRequest } from "./request-builder";
import { parseResponse } from "./response-parser";
import type { HTTPRequest, HTTPResponse } from "./types";

export class HTTPClient {
  private socket: any = null;

  async fetch(urlString: string): Promise<HTTPResponse> {
    const url = parseURL(urlString);

    if (url.protocol !== "http") {
      throw new Error(`Unsupported protocol: ${url.protocol}. Only HTTP is supported.`);
    }

    const request: HTTPRequest = {
      method: "GET",
      host: url.host,
      port: url.port,
      path: url.path,
      headers: {
        Host: url.host,
        "User-Agent": "msubi-browser/0.1",
        Connection: "close",
      },
      body: null,
    };

    const rawRequest = buildRequest(request);
    const rawResponse = await this.sendAndReceive(url.host, url.port, rawRequest);
    return parseResponse(rawResponse);
  }

  private sendAndReceive(host: string, port: number, data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let buffer = "";

      const socket = Bun.connect({
        hostname: host,
        port,
        socket: {
          data(_socket: any, chunk: Uint8Array) {
            buffer += new TextDecoder().decode(chunk);
          },
          close() {
            resolve(buffer);
          },
          error(_socket: any, error: Error) {
            reject(error);
          },
          open(socket: any) {
            socket.write(data);
          },
        },
      });

      this.socket = socket;
    });
  }

  close(): void {
    if (this.socket) {
      try { this.socket.end(); } catch { /* ignore */ }
    }
  }
}
