import type { Node, Element, HTMLAnchorElement } from "../html/node";
import type { InlineBox, LineBox } from "./types";

/**
 * 子ノード配列に対してInline Layoutを計算し、LineBoxの配列を返す。
 *
 * Inline Layoutの原理:
 *   - 要素を行に詰めていく（横並び）
 *   - 行の幅を超えたら次の行へ（折り返し）
 *   - リンクは分割しない（MVP制約）
 *
 * @param children - 子ノード配列（テキストノードやHTMLAnchorElementを含む）
 * @param parentWidth - 親の幅（行の最大幅）
 * @param parentX - 親のX座標（行内のオフセット）
 * @param currentY - 親ブロック内での相対Y座標
 * @returns LineBoxの配列
 */
export function computeInlineLayout(
  children: Node[],
  parentWidth: number,
  parentX: number,
  currentY: number
): LineBox[] {
  const lines: LineBox[] = [];
  let currentLineBoxes: InlineBox[] = [];
  let currentLineWidth = 0; // 現在の行の累計幅
  const currentYRef = { value: currentY }; // 統一されたY座標参照

  // --- 子ノードを順に処理 ---
  for (const child of children) {
    const inlineBoxes = nodeToInlineBoxes(child);

    for (const box of inlineBoxes) {
      // [if] リンクボックス → 分割しない（MVP制約）
      if (box.type === "link") {
        currentLineWidth = placeBoxInLine(
          box,
          parentWidth,
          currentLineBoxes,
          currentLineWidth,
          lines,
          currentYRef
        );
        continue;
      }

      // [else] テキストボックス → 文字単位で分割
      let remainingText = box.text;
      let textIndex = 0;

      while (textIndex < remainingText.length) {
        const availableWidth = parentWidth - currentLineWidth;

        // [if] 現在の行に空きがない → 行を確定して次へ
        if (availableWidth <= 0) {
          lines.push(createLineBox(currentLineBoxes, parentWidth, currentYRef.value));
          currentYRef.value += 1;
          currentLineBoxes = [];
          currentLineWidth = 0;
          continue;
        }

        // 取り出す文字数（残りと空き幅の小さい方）
        const chunkLength = Math.min(
          remainingText.length - textIndex,
          availableWidth
        );
        const chunk = remainingText.substring(textIndex, textIndex + chunkLength);

        // チャンクボックスを作成
        const chunkBox: InlineBox = {
          type: "text",
          text: chunk,
          rect: { x: currentLineWidth, y: 0, width: chunkLength, height: 1 },
        };

        currentLineBoxes.push(chunkBox);
        currentLineWidth += chunkLength;
        textIndex += chunkLength;

        // [if] 行がいっぱいになった → 行を確定
        if (currentLineWidth >= parentWidth) {
          lines.push(createLineBox(currentLineBoxes, parentWidth, currentYRef.value));
          currentYRef.value += 1;
          currentLineBoxes = [];
          currentLineWidth = 0;
        }
      }
    }
  }

  // 残りの行を確定
  if (currentLineBoxes.length > 0) {
    lines.push(createLineBox(currentLineBoxes, parentWidth, currentYRef.value));
  }

  return lines;
}

/**
 * ノードをInlineBoxの配列に変換する。
 *
 * - Text ノード → textボックス（1つ）
 * - HTMLAnchorElement → linkボックス（1つ、子のテキストを結合）
 * - その他のElement → 子を再帰的に処理
 */
function nodeToInlineBoxes(node: Node): InlineBox[] {
  // [if] Text ノード
  if ("text" in node && typeof node.text === "string") {
    return [
      {
        type: "text",
        text: node.text,
        rect: { x: 0, y: 0, width: node.text.length, height: 1 },
      },
    ];
  }

  // [if] HTMLAnchorElement リンク
  if ("tag" in node && node.tag === "a" && "href" in node) {
    const anchor = node as HTMLAnchorElement;
    const linkText = extractTextContent(anchor);
    return [
      {
        type: "link",
        text: linkText,
        rect: { x: 0, y: 0, width: linkText.length, height: 1 },
        href: anchor.href || undefined,
      },
    ];
  }

  // [else] その他の要素（子を再帰的に処理）
  if ("children" in node && node.children.length > 0) {
    const boxes: InlineBox[] = [];
    for (const child of node.children) {
      boxes.push(...nodeToInlineBoxes(child));
    }
    return boxes;
  }

  // 子がいない要素は空配列
  return [];
}

/**
 * 要素内のテキスト内容を提出する。
 * 子Textノードの文字列を結合する。
 */
function extractTextContent(element: Element): string {
  let text = "";
  for (const child of element.children) {
    if ("text" in child && typeof child.text === "string") {
      text += child.text;
    }
  }
  return text;
}

/**
 * 単一ボックス（リンクなど分割しないもの）を行に配置する。
 * 収まらなければ新しい行を始める。
 *
 * @returns 更新後の currentLineWidth
 */
function placeBoxInLine(
  box: InlineBox,
  parentWidth: number,
  currentLineBoxes: InlineBox[],
  currentLineWidth: number,
  lines: LineBox[],
  currentYRef: { value: number }
): number {
  // [if] 現在の行に収まる
  if (currentLineWidth + box.rect.width <= parentWidth) {
    box.rect.x = currentLineWidth;
    currentLineBoxes.push(box);
    return currentLineWidth + box.rect.width;
  }

  // [else] 現在の行に収まらない
  // 現在の行を確定
  if (currentLineBoxes.length > 0) {
    lines.push(createLineBox(currentLineBoxes, parentWidth, currentYRef.value));
    currentYRef.value += 1;
  }

  // 新しい行に移動
  box.rect.x = 0;
  currentLineBoxes.length = 0;
  currentLineBoxes.push(box);
  return box.rect.width;
}

/**
 * LineBoxを作成する。
 * 配列のコピーを作成して、参照渡しの問題を回避する。
 */
function createLineBox(
  boxes: InlineBox[],
  parentWidth: number,
  y: number
): LineBox {
  return {
    rect: { x: 0, y, width: parentWidth, height: 1 },
    boxes: [...boxes], // コピーを作成
  };
}
