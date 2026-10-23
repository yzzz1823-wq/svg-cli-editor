import { DEFAULT_SHAPE_STYLE } from "../core/ShapeStyle";
import { Shape } from "../core/Shape";
import type { AttributePatch } from "../core/AttributePatch";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { SvgAttributes } from "../core/SvgAttributes";
import type { ShapeVisitor } from "../visitor/ShapeVisitor";

/** 矩形。 */
export class Rect extends Shape {
  private x: number;
  private y: number;
  private width: number;
  private height: number;

  constructor(
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    style: ShapeStyle = DEFAULT_SHAPE_STYLE,
    attributes?: SvgAttributes,
  ) {
    super(name, style, attributes);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getTag(): string {
    return "rect";
  }

  accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitRect(this);
  }

  translate(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  protected applyGeometry(patch: AttributePatch): void {
    this.assertSupported(patch, ["x", "y", "width", "height"]);
    if (patch.x !== undefined) {
      this.x = patch.x;
    }
    if (patch.y !== undefined) {
      this.y = patch.y;
    }
    if (patch.width !== undefined) {
      this.width = patch.width;
    }
    if (patch.height !== undefined) {
      this.height = patch.height;
    }
  }

  protected captureGeometry(target: AttributePatch): void {
    target.x = this.x;
    target.y = this.y;
    target.width = this.width;
    target.height = this.height;
  }
}
