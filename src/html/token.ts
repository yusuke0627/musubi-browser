export interface StartTagToken {
  type: "start";
  tag: string;
  attributes: Record<string, string>;
}

export interface EndTagToken {
  type: "end";
  tag: string;
}

export interface TextToken {
  type: "text";
  text: string;
}

export type Token = StartTagToken | EndTagToken | TextToken;
