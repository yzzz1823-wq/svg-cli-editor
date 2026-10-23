import { BaseCommand } from "./BaseCommand";
import { CommandError } from "../errors/CommandError";
import type { Canvas } from "../core/Canvas";
import type { Shape } from "../core/Shape";

/** 以原点为基准按倍数缩放图形；撤销时用倒数还原。 */
export class ScaleShapeCommand extends BaseCommand {
  constructor(
    private readonly canvas: Canvas,
    private readonly shape: Shape,
    private readonly factor: number,
  ) {
    super("scale");
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new CommandError("scale factor must be positive");
    }
  }

  getName(): string {
    return "scale";
  }

  execute(): void {
    this.canvas.scaleShape(this.shape, this.factor);
  }

  undo(): void {
    this.canvas.scaleShape(this.shape, 1 / this.factor);
  }
}
