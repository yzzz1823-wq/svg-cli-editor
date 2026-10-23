import { BaseCommand } from "./BaseCommand";
import { CommandError } from "../errors/CommandError";
import type { Canvas } from "../core/Canvas";
import type { Container } from "../core/Container";
import type { Shape } from "../core/Shape";

/**
 * 解散分组：execute 摘下组并让子节点回到祖父容器，undo 用原成员与原组名重新成组。
 *
 * undo 会记录重新成组后的新组实例，因此“撤销 → 重做 → 再撤销”可以连续工作；
 * 成组位置由 Canvas.groupShapes 的插入规则保证回到原处。
 */
export class UngroupCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private group: Container;
  private groupName = "";
  private children: readonly Shape[] = [];

  constructor(canvas: Canvas, group: Container) {
    super("ungroup");
    this.canvas = canvas;
    this.group = group;
  }

  execute(): void {
    this.groupName = this.group.getName();
    this.children = [...this.group.getChildren()];
    this.canvas.ungroupContainer(this.group);
  }

  undo(): void {
    if (this.groupName === "") {
      throw new CommandError("解散命令尚未执行，无法撤销");
    }
    this.group = this.canvas.groupShapes(this.children, this.groupName);
  }
}
