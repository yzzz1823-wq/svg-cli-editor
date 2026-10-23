import { BaseCommand } from "./BaseCommand";
import type { Canvas } from "../core/Canvas";
import type { Container } from "../core/Container";
import type { Shape } from "../core/Shape";

/**
 * 添加图形：execute 追加到指定容器（默认根节点），undo 摘除。
 * 名称唯一性等规则由 Canvas 负责，命令不重复校验。
 */
export class AddShapeCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private readonly shape: Shape;
  private readonly parent: Container | null;

  constructor(canvas: Canvas, shape: Shape, parent: Container | null = null) {
    super("add");
    this.canvas = canvas;
    this.shape = shape;
    this.parent = parent;
  }

  execute(): void {
    if (this.parent === null) {
      this.canvas.addShape(this.shape);
      return;
    }
    this.canvas.addShape(this.shape, this.parent);
  }

  undo(): void {
    this.canvas.removeShape(this.shape);
  }
}
