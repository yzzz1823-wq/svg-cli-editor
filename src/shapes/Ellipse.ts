import { DEFAULT_SHAPE_STYLE } from "../core/ShapeStyle";
import { Shape } from "../core/Shape";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { SvgAttributes } from "../core/SvgAttributes";
import type { ShapeVisitor } from "../visitor/ShapeVisitor";

/** 椭圆。 */
export class Ellipse extends Shape {
  private cx: number;
  private cy: number;
  private rx: number;
  private ry: number;

  constructor(
    name: string,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    style: ShapeStyle = DEFAULT_SHAPE_STYLE,
    attributes?: SvgAttributes,
  ) {
    super(name, style, attributes);
    this.cx = cx;
    this.cy = cy;
    this.rx = rx;
    this.ry = ry;
  }

  getCx(): number {
    return this.cx;
  }

  getCy(): number {
    return this.cy;
  }

  getRx(): number {
    return this.rx;
  }

  getRy(): number {
    return this.ry;
  }

  getTag(): string {
    return "ellipse";
  }

  accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitEllipse(this);
  }

  translate(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }
}
