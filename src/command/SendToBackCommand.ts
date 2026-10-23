import { CommandError } from "../errors/CommandError";
import { BaseCommand } from "./BaseCommand";
import type { Canvas } from "../core/Canvas";
import type { Container } from "../core/Container";
import type { Shape } from "../core/Shape";

/**
 * 把图形移动到同级开头（back 命令，最后图层）。
 * undo 用执行前记录的下标把节点插回原位。
 */
export class SendToBackCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private readonly shape: Shape;
  private parent: Container | null = null;
  private index = -1;

  constructor(canvas: Canvas, shape: Shape) {
    super("back");
    this.canvas = canvas;
    this.shape = shape;
  }

  execute(): void {
    const parent = this.shape.getParent();
    if (parent !== null) {
      this.parent = parent;
      this.index = parent.indexOf(this.shape);
    }
    this.canvas.sendToBack(this.shape);
  }

  undo(): void {
    const parent = this.parent;
    if (parent === null) {
      throw new CommandError("置底命令尚未执行，无法撤销");
    }
    parent.remove(this.shape);
    parent.insertAt(this.index, this.shape);
  }
}
