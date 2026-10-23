import { Container } from "../../src/core/Container";
import type { AttributePatch } from "../../src/core/AttributePatch";
import type { ShapeStyle } from "../../src/core/ShapeStyle";
import { TEST_STYLE } from "./TestStyle";

/** core 层测试替身：充当根容器或 <g>，只实现 Shape 的抽象成员。 */
export class StubContainer extends Container {
  constructor(name: string, style: ShapeStyle = TEST_STYLE) {
    super(name, style);
  }

  accept<R>(_visitor: unknown): R {
    throw new Error("StubContainer 不参与 Visitor 测试");
  }

  translate(dx: number, dy: number): void {
    for (const child of this.getChildren()) {
      child.translate(dx, dy);
    }
  }

  scale(factor: number): void {
    for (const child of this.getChildren()) {
      child.scale(factor);
    }
  }

  protected applyGeometry(_patch: AttributePatch): void {
    // 容器没有几何字段。
  }

  protected captureGeometry(_target: AttributePatch): void {
    // 容器没有几何字段。
  }

  getTag(): string {
    return "g";
  }
}
