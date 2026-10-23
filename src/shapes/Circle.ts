import { DEFAULT_SHAPE_STYLE } from "../core/ShapeStyle";
import { Shape } from "../core/Shape";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { SvgAttributes } from "../core/SvgAttributes";
import type { ShapeVisitor } from "../visitor/ShapeVisitor";

/** 圆。 */
export class Circle extends Shape {
  private cx: number;
  private cy: number;
  private radius: number;

  constructor(
    name: string,
    cx: number,
    cy: number,
    radius: number,
    style: ShapeStyle = DEFAULT_SHAPE_STYLE,
    attributes?: SvgAttributes,
  ) {
    super(name, style, attributes);
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
  }

  getCx(): number {
    return this.cx;
  }

  getCy(): number {
    return this.cy;
  }

  getRadius(): number {
    return this.radius;
  }

  getTag(): string {
    return "circle";
  }

  accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitCircle(this);
  }

  translate(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }
}
