/**
 * 图形的绘制样式（值对象）。
 * 与 SVG 的表现属性一一对应，由 Canvas 保存、由 Visitor 序列化。
 */
export interface ShapeStyle {
  readonly fill: string;
  readonly stroke: string | null;
  readonly strokeWidth: number;
}

/** 生产默认样式：黑色填充、无描边（与 SVG 默认值一致）。 */
export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
  fill: "#000000",
  stroke: null,
  strokeWidth: 1,
};
