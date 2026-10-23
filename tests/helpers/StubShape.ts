import { Shape } from "../../src/core/Shape";
import type { AttributePatch } from "../../src/core/AttributePatch";
import type { ShapeStyle } from "../../src/core/ShapeStyle";
import { TEST_STYLE } from "./TestStyle";

/**
 * core 层测试替身：只提供“叶子形状”的最小行为，用于验证 Shape / Container / Canvas
 * 的公共契约，不参与 Visitor 分派（accept 直接抛错，由后续 shapes 测试覆盖）。
 */
export class StubShape extends Shape {
  private readonly tag: string;
  private offsetX = 0;
  private offsetY = 0;

  constructor(name: string, style: ShapeStyle = TEST_STYLE, tag = "stub") {
    super(name, style);
    this.tag = tag;
  }

  accept<R>(_visitor: unknown): R {
    throw new Error("StubShape 不参与 Visitor 测试");
  }

  translate(dx: number, dy: number): void {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  scale(factor: number): void {
    this.offsetX *= factor;
    this.offsetY *= factor;
  }

  protected applyGeometry(_patch: AttributePatch): void {
    // 测试替身没有几何字段。
  }

  protected captureGeometry(_target: AttributePatch): void {
    // 测试替身没有几何字段。
  }

  getTag(): string {
    return this.tag;
  }

  getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }
}
