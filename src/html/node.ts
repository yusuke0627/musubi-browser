export class Node {
  children: Node[] = [];

  appendChild(child: Node): void {
    this.children.push(child);
  }
}

export class Element extends Node {
  tag: string;
  attributes: Record<string, string>;
  isLink: boolean;

  constructor(tag: string, attributes: Record<string, string> = {}) {
    super();
    this.tag = tag;
    this.attributes = attributes;
    this.isLink = false;
  }

  get href(): string | undefined {
    return this.attributes.href;
  }
}

export class HTMLAnchorElement extends Element {
  constructor(attributes: Record<string, string> = {}) {
    super("a", attributes);
    this.isLink = true;
  }
}

export class Text extends Node {
  text: string;

  constructor(text: string) {
    super();
    this.text = text;
  }
}
