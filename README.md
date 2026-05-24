# msubi-browser

Educational TUI browser built with TypeScript + Bun.

From raw TCP sockets to layout engine — understanding how browsers work from the ground up.

## Architecture

```
Loading → Parsing → Rendering → Layout → Painting → Scripting
  HTTP    HTML/CSS  Computed    Block/   TUI ANSI    Link click
  client  parser    Style       Inline   escape      Navigation
```

## Tech Stack

- **TypeScript** — type-safe educational code
- **Bun** — fast runtime, built-in test runner
- **Raw TCP sockets** — no `fetch`, no `node:http`. HTTP/1.1 from scratch
- **ANSI escape codes** — terminal UI rendering

## Development

```bash
# Run tests
bun test

# Fetch a URL (Issue #1)
bun run src/main.ts http://localhost:9999/

# Dev mode (watch)
bun run dev
```

## Roadmap

| Issue | Stage | Description |
|-------|-------|-------------|
| #1 | Loading | HTTP/1.1 client (raw TCP) |
| #2 | Parsing | HTML tokenizer |
| #3 | Parsing | DOM tree builder |
| #4 | Parsing | CSS parser |
| #5 | Rendering | Computed style + link marking |
| #6 | Layout | Block layout |
| #7 | Layout | Inline layout (link boxes) |
| #8 | Painting | TUI paint (blue + underlined links) |
| #9 | Scripting | Link click, hit-test, navigation |

> **Link-centric design:** Hyperlinks are first-class citizens throughout every stage. Images render as `[img: alt text]` placeholders.
