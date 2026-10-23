import type { Shape } from "../core/Shape";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { SvgAttributes } from "../core/SvgAttributes";

/**
 * SVG 标签名 → 图形类的工厂接口。
 *
 * Agent.md 允许的两处“按名字分派”之一就在这里；SvgParser 只依赖本接口，
 * 新增图元时只扩展实现，解析器本身无需改动。
 */
export interface SvgElementFactory {
  /**
   * 创建元素。
   *
   * @throws SvgParseError 标签不受支持或几何属性非法时
   */
  create(
    tag: string,
    name: string,
    attributes: SvgAttributes,
    style: ShapeStyle,
    textContent?: string,
  ): Shape;
}
