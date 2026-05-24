import type { Token } from "./token";

type State =
  | "data"
  | "tagOpen"
  | "tagName"
  | "endTagOpen"
  | "endTagName"
  | "beforeAttrName"
  | "attrName"
  | "beforeAttrValue"
  | "attrValueDoubleQuoted"
  | "attrValueSingleQuoted"
  | "attrValueUnquoted"
  | "afterAttrValue";

export function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let state: State = "data";
  let buffer = "";
  let currentTag = "";
  let currentAttrName = "";
  let currentAttrValue = "";
  let attributes: Record<string, string> = {};
  let isEndTag = false;

  for (let i = 0; i < html.length; i++) {
    const char = html[i];

    switch (state) {
      case "data": {
        if (char === "<") {
          if (buffer) {
            tokens.push({ type: "text", text: buffer });
            buffer = "";
          }
          state = "tagOpen";
        } else {
          buffer += char;
        }
        break;
      }

      case "tagOpen": {
        if (char === "/") {
          isEndTag = true;
          state = "endTagOpen";
        } else if (/[a-zA-Z]/.test(char)) {
          isEndTag = false;
          currentTag = char.toLowerCase();
          state = "tagName";
        }
        break;
      }

      case "endTagOpen": {
        if (/[a-zA-Z]/.test(char)) {
          currentTag = char.toLowerCase();
          state = "endTagName";
        }
        break;
      }

      case "tagName": {
        if (char === ">") {
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes: {},
          });
          currentTag = "";
          attributes = {};
          state = "data";
        } else if (/\s/.test(char)) {
          state = "beforeAttrName";
        } else {
          currentTag += char.toLowerCase();
        }
        break;
      }

      case "endTagName": {
        if (char === ">") {
          tokens.push({ type: "end", tag: currentTag });
          currentTag = "";
          isEndTag = false;
          state = "data";
        } else {
          currentTag += char.toLowerCase();
        }
        break;
      }

      case "beforeAttrName": {
        if (/\s/.test(char)) {
          // skip whitespace
        } else if (char === ">") {
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          currentTag = "";
          attributes = {};
          state = "data";
        } else if (/[a-zA-Z]/.test(char)) {
          currentAttrName = char.toLowerCase();
          state = "attrName";
        }
        break;
      }

      case "attrName": {
        if (char === "=") {
          state = "beforeAttrValue";
        } else if (/\s/.test(char)) {
          attributes[currentAttrName] = "";
          state = "beforeAttrName";
        } else if (char === ">") {
          attributes[currentAttrName] = "";
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          currentTag = "";
          attributes = {};
          state = "data";
        } else {
          currentAttrName += char.toLowerCase();
        }
        break;
      }

      case "beforeAttrValue": {
        if (/\s/.test(char)) {
          // skip whitespace
        } else if (char === '"') {
          currentAttrValue = "";
          state = "attrValueDoubleQuoted";
        } else if (char === "'") {
          currentAttrValue = "";
          state = "attrValueSingleQuoted";
        } else {
          currentAttrValue = char;
          state = "attrValueUnquoted";
        }
        break;
      }

      case "attrValueDoubleQuoted": {
        if (char === '"') {
          attributes[currentAttrName] = currentAttrValue;
          state = "afterAttrValue";
        } else {
          currentAttrValue += char;
        }
        break;
      }

      case "attrValueSingleQuoted": {
        if (char === "'") {
          attributes[currentAttrName] = currentAttrValue;
          state = "afterAttrValue";
        } else {
          currentAttrValue += char;
        }
        break;
      }

      case "attrValueUnquoted": {
        if (/\s/.test(char)) {
          attributes[currentAttrName] = currentAttrValue;
          state = "beforeAttrName";
        } else if (char === ">") {
          attributes[currentAttrName] = currentAttrValue;
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          currentTag = "";
          attributes = {};
          state = "data";
        } else {
          currentAttrValue += char;
        }
        break;
      }

      case "afterAttrValue": {
        if (/\s/.test(char)) {
          state = "beforeAttrName";
        } else if (char === ">") {
          tokens.push({
            type: "start",
            tag: currentTag,
            attributes,
          });
          currentTag = "";
          attributes = {};
          state = "data";
        }
        break;
      }
    }
  }

  // Handle any remaining text buffer
  if (buffer) {
    tokens.push({ type: "text", text: buffer });
  }

  return tokens;
}
