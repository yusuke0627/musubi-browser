export interface ParsedURL {
  protocol: string;
  host: string;
  port: number;
  path: string;
}

export function parseURL(url: string): ParsedURL {
  const protocolMatch = url.match(/^([a-z]+):\/\//);
  if (!protocolMatch) {
    throw new Error(`Invalid URL: ${url}`);
  }
  const protocol = protocolMatch[1];

  const rest = url.slice(protocolMatch[0].length);
  const pathIndex = rest.indexOf("/");
  const hostAndPort = pathIndex === -1 ? rest : rest.slice(0, pathIndex);
  const path = pathIndex === -1 ? "/" : rest.slice(pathIndex);

  let host: string;
  let port: number;
  const portMatch = hostAndPort.match(/:(\d+)$/);
  if (portMatch) {
    host = hostAndPort.slice(0, -portMatch[0].length);
    port = parseInt(portMatch[1], 10);
  } else {
    host = hostAndPort;
    port = protocol === "https" ? 443 : 80;
  }

  return { protocol, host, port, path };
}
