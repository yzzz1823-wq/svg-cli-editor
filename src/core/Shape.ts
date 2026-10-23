import { EMPTY_SVG_ATTRIBUTES } from "./SvgAttributes";
import type { SvgAttributes } from "./SvgAttributes";
import type { Container } from "./Container";
import type { ShapeStyle } from "./ShapeStyle";
import type { ShapeVisitor } from "../visitor/ShapeVisitor";

/**
 * 所有图形（叶子与组合节点）的统一基类 —— Composite 模式中的 Component。
 *
 * 领域行为放在类里（translate / accept / getName），外部只通过方法调用，
 * 不直接读字段，避免退化成贫血模型。
 */
export abstract class Shape {
  private readonly name: string;
  private readonly style: ShapeStyle;
  private readonly attributes: SvgAttributes;
  private parent: Container | null = null;

  protected constructor(
    name: string,
    style: ShapeStyle,
    attributes: SvgAttributes = EMPTY_SVG_ATTRIBUTES,
  ) {
    this.name = name;
    this.style = style;
    this.attributes = attributes;
  }

  /** 文档内唯一标识，命令通过它定位图形。 */
  getName(): string {
    return this.name;
  }

  getStyle(): ShapeStyle {
    return this.style;
  }

  /** 无法归入 style 的原样属性（font-size 等），供 Visitor 序列化。 */
  getAttributes(): SvgAttributes {
    return this.attributes;
  }

  /** 父容器；游离节点为 null。由 Container 维护，图形自身不修改。 */
  getParent(): Container | null {
    return this.parent;
  }

  /** 仅供 Container 维护组合关系，外部不应直接调用。 */
  setParent(parent: Container | null): void {
    this.parent = parent;
  }

  /** SVG 标签名（rect / circle / g ...），由子类给出。 */
  abstract getTag(): string;

  /** Visitor 分派的唯一入口 —— 取代 instanceof 判断。 */
  abstract accept<R>(visitor: ShapeVisitor<R>): R;

  /** 相对平移；组合节点递归平移全部后代。 */
  abstract translate(dx: number, dy: number): void;
}
