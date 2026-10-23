import { BaseCommand } from "./BaseCommand";
import { CommandError } from "../errors/CommandError";
import type { Canvas } from "../core/Canvas";
import type { Container } from "../core/Container";
import type { Shape } from "../core/Shape";

/**
 * 成组：execute 把同级节点收拢成命名组，undo 解散回原位。
 * 插入位置、组内顺序与合法性校验都由 Canvas.groupShapes 决定。
 */
export class GroupCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private readonly children: readonly Shape[];
  private readonly groupName: string;
  private group: Container | null = null;

  constructor(canvas: Canvas, children: readonly Shape[], name: string) {
    super("group");
    this.canvas = canvas;
    this.children = [...children];
    this.groupName = name;
  }

  execute(): void {
    this.group = this.canvas.groupShapes(this.children, this.groupName);
  }

  undo(): void {
    const group = this.group;
    if (group === null) {
      throw new CommandError("成组命令尚未执行，无法撤销");
    }
    this.canvas.ungroupContainer(group);
  }
}
