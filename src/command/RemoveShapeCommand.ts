import { BaseCommand } from "./BaseCommand";
import { CommandError } from "../errors/CommandError";
import type { Canvas } from "../core/Canvas";
import type { Container } from "../core/Container";
import type { Shape } from "../core/Shape";

/**
 * 移除图形：execute 摘除并记住“原父容器 + 原下标”，undo 精确放回原位。
 * 被移除的 Shape 对象仍由命令持有，不参与文档树但可完整恢复。
 */
export class RemoveShapeCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private readonly shape: Shape;
  private parent: Container | null = null;
  private index = -1;

  constructor(canvas: Canvas, shape: Shape) {
    super("remove");
    this.canvas = canvas;
    this.shape = shape;
  }

  execute(): void {
    const parent = this.shape.getParent();
    if (parent === null) {
      // 游离节点/根节点：交给 Canvas 抛出统一错误。
      this.canvas.removeShape(this.shape);
      return;
    }
    this.parent = parent;
    this.index = parent.indexOf(this.shape);
    this.canvas.removeShape(this.shape);
  }

  undo(): void {
    const parent = this.parent;
    if (parent === null) {
      throw new CommandError("移除命令尚未执行，无法撤销");
    }
    parent.insertAt(this.index, this.shape);
  }
}
