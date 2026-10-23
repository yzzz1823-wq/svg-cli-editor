import { DEFAULT_SHAPE_STYLE } from "../core/ShapeStyle";
import { Shape } from "../core/Shape";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { SvgAttributes } from "../core/SvgAttributes";
import type { ShapeVisitor } from "../visitor/ShapeVisitor";

/** 文本。 */
export class Text extends Shape {
  private x: number;
  private y: number;
  private content: string;

  constructor(
    name: string,
    x: number,
    y: number,
    content: string,
    style: ShapeStyle = DEFAULT_SHAPE_STYLE,
    attributes?: SvgAttributes,
  ) {
    super(name, style, attributes);
    this.x = x;
    this.y = y;
    this.content = content;
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  getContent(): string {
    return this.content;
  }

  getTag(): string {
    return "text";
  }

  accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitText(this);
  }

  translate(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }
}
