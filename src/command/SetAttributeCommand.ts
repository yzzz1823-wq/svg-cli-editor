import { BaseCommand } from "./BaseCommand";
import { CommandError } from "../errors/CommandError";
import type { AttributePatch } from "../core/AttributePatch";
import type { Canvas } from "../core/Canvas";
import type { Shape } from "../core/Shape";

/**
 * 把一份属性补丁绝对覆盖到图形上。
 *
 * 执行前捕获完整快照，撤销时整体写回，因此不依赖属性修改的先后顺序。
 */
export class SetAttributeCommand extends BaseCommand {
  private snapshot: AttributePatch | null = null;

  constructor(
    private readonly canvas: Canvas,
    private readonly shape: Shape,
    private readonly patch: AttributePatch,
  ) {
    super("set");
    if (Object.keys(patch).length === 0) {
      throw new CommandError("属性补丁至少需要一项");
    }
  }

  getName(): string {
    return "set";
  }

  execute(): void {
    this.snapshot = this.shape.captureState();
    this.canvas.setShapeAttributes(this.shape, this.patch);
  }

  undo(): void {
    if (this.snapshot === null) {
      throw new CommandError("set 命令尚未执行，无法撤销");
    }
    this.canvas.setShapeAttributes(this.shape, this.snapshot);
  }
}
