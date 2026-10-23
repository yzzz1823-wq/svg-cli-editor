/**
 * 无法归入 ShapeStyle 的 SVG 属性（如 font-size、text-anchor、transform 等）。
 * 保存为“原样键值对”，保证 load → save 往返时未知属性不丢失。
 */
export interface SvgAttributes {
  readonly [name: string]: string;
}

/** 没有任何额外属性的默认值。 */
export const EMPTY_SVG_ATTRIBUTES: SvgAttributes = Object.freeze({});
