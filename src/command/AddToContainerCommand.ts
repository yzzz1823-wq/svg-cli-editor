import { CommandError } from "../errors/CommandError";
import { BaseCommand } from "./BaseCommand";
import type { Canvas } from "../core/Canvas";
import type { Container } from "../core/Container";
import type { Shape } from "../core/Shape";

/**
 * 把已有图形移动到另一个容器的末尾（addto 命令）。
 *
 * execute 记录“原父容器 + 原下标”，undo 精确放回；
 * 是否允许移动（环检测、根节点等）由 Canvas.reparent 统一裁决。
 */
export class AddToContainerCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private readonly shape: Shape;
  private readonly target: Container;
  private originParent: Container | null = null;
  private originIndex = -1;

  constructor(canvas: Canvas, shape: Shape, target: Container) {
    super("addto");
    this.canvas = canvas;
    this.shape = shape;
    this.target = target;
  }

  execute(): void {
    const parent = this.shape.getParent();
    if (parent !== null) {
      this.originParent = parent;
      this.originIndex = parent.indexOf(this.shape);
    }
    this.canvas.reparent(this.shape, this.target);
  }

  undo(): void {
    if (this.originParent === null) {
      throw new CommandError("移入命令尚未执行，无法撤销");
    }
    const current = this.shape.getParent();
    if (current !== null) {
      current.remove(this.shape);
    }
    this.originParent.insertAt(this.originIndex, this.shape);
  }
}
