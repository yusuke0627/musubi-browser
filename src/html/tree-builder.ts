import type { Token } from "./token";
import { Node, Element, HTMLAnchorElement, Text } from "./node";

export function buildTree(tokens: Token[]): Element {
  const root = new Element(""); // placeholder root
  const stack: Node[] = [root];

  for (const token of tokens) {
    const current = stack[stack.length - 1];

    if (token.type === "start") {
      let element: Element;
      if (token.tag === "a") {
        element = new HTMLAnchorElement(token.attributes);
      } else {
        element = new Element(token.tag, token.attributes);
      }
      current.appendChild(element);
      stack.push(element);
    } else if (token.type === "end") {
      stack.pop();
    } else if (token.type === "text") {
      current.appendChild(new Text(token.text));
    }
  }

  // Return the first real element (skip placeholder)
  return root.children[0] as Element;
}
