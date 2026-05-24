import { HTTPClient } from "./http/client";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: bun run src/main.ts <URL>");
    process.exit(1);
  }

  const client = new HTTPClient();
  try {
    const response = await client.fetch(url);
    console.log(`Status: ${response.statusCode} ${response.statusText}`);
    console.log("---");
    console.log(response.body);
  } catch (err) {
    console.error("Fetch failed:", err);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
