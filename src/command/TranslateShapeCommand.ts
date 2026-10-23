import { BaseCommand } from "./BaseCommand";
import type { Canvas } from "../core/Canvas";
import type { Shape } from "../core/Shape";

/**
 * 平移图形：execute 平移 (dx, dy)，undo 平移 (-dx, -dy)。
 * 组合节点的递归平移由 Shape.translate 自己完成，命令不感知子节点。
 */
export class TranslateShapeCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private readonly shape: Shape;
  private readonly dx: number;
  private readonly dy: number;

  constructor(canvas: Canvas, shape: Shape, dx: number, dy: number) {
    super("translate");
    this.canvas = canvas;
    this.shape = shape;
    this.dx = dx;
    this.dy = dy;
  }

  execute(): void {
    this.canvas.moveShape(this.shape, this.dx, this.dy);
  }

  undo(): void {
    this.canvas.moveShape(this.shape, -this.dx, -this.dy);
  }
}
