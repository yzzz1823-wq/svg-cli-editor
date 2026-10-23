import { DEFAULT_SHAPE_STYLE } from "../core/ShapeStyle";
import { Shape } from "../core/Shape";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { SvgAttributes } from "../core/SvgAttributes";
import type { ShapeVisitor } from "../visitor/ShapeVisitor";

/** 线段。 */
export class Line extends Shape {
  private x1: number;
  private y1: number;
  private x2: number;
  private y2: number;

  constructor(
    name: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    style: ShapeStyle = DEFAULT_SHAPE_STYLE,
    attributes?: SvgAttributes,
  ) {
    super(name, style, attributes);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  getX1(): number {
    return this.x1;
  }

  getY1(): number {
    return this.y1;
  }

  getX2(): number {
    return this.x2;
  }

  getY2(): number {
    return this.y2;
  }

  getTag(): string {
    return "line";
  }

  accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitLine(this);
  }

  translate(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }
}
