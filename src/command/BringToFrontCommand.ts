import { CommandError } from "../errors/CommandError";
import { BaseCommand } from "./BaseCommand";
import type { Canvas } from "../core/Canvas";
import type { Container } from "../core/Container";
import type { Shape } from "../core/Shape";

/**
 * 把图形移动到同级末尾（front 命令，最前图层）。
 * undo 用执行前记录的下标把节点插回原位。
 */
export class BringToFrontCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private readonly shape: Shape;
  private parent: Container | null = null;
  private index = -1;

  constructor(canvas: Canvas, shape: Shape) {
    super("front");
    this.canvas = canvas;
    this.shape = shape;
  }

  execute(): void {
    const parent = this.shape.getParent();
    if (parent !== null) {
      this.parent = parent;
      this.index = parent.indexOf(this.shape);
    }
    this.canvas.bringToFront(this.shape);
  }

  undo(): void {
    const parent = this.parent;
    if (parent === null) {
      throw new CommandError("置顶命令尚未执行，无法撤销");
    }
    parent.remove(this.shape);
    parent.insertAt(this.index, this.shape);
  }
}
