import { Container } from "../core/Container";
import { DEFAULT_SHAPE_STYLE } from "../core/ShapeStyle";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { SvgAttributes } from "../core/SvgAttributes";
import type { ShapeVisitor } from "../visitor/ShapeVisitor";

/** 分组 —— 叶子图形的容器；平移时递归作用于全部后代。 */
export class Group extends Container {
  constructor(
    name: string,
    style: ShapeStyle = DEFAULT_SHAPE_STYLE,
    attributes?: SvgAttributes,
  ) {
    super(name, style, attributes);
  }

  getTag(): string {
    return "g";
  }

  accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitGroup(this);
  }

  translate(dx: number, dy: number): void {
    for (const child of this.getChildren()) {
      child.translate(dx, dy);
    }
  }
}
