import type { StyledNode } from "../style/types";

/**
 * レイアウト矩形。
 * TUI（ターミナル）上での位置とサイズを文字単位で表す。
 *
 * 例: { x: 0, y: 0, width: 80, height: 1 }
 *   → 画面上の左上(0,0)に、横80文字×縦1行の矩形
 */
export interface Rect {
  /** 左端のX座標（文字単位） */
  x: number;
  /** 上端のY座標（行単位） */
  y: number;
  /** 幅（文字数） */
  width: number;
  /** 高さ（行数） */
  height: number;
}

/**
 * レイアウトノード。
 * スタイル適用済みノードに、画面上の位置・サイズ情報（Rect）を付与したもの。
 *
 * ブラウザパイプラインで言うところの「レイアウトツリー（Render Tree）」のノードに相当。
 */
export interface LayoutNode {
  /** スタイル適用済みノード */
  styledNode: StyledNode;

  /** 画面上の矩形 */
  rect: Rect;

  /** 子レイアウトノードの配列 */
  children: LayoutNode[];
}
