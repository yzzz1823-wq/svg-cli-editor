import { BaseCommand } from "./BaseCommand";
import { CommandError } from "../errors/CommandError";
import type { Canvas } from "../core/Canvas";

/**
 * 初始化文档：重置为 800×600 的空画布，广播 document。
 * 文档级命令不可撤销 —— 允许撤销“新建文档”会退回到上一个文档，语义上不成立。
 */
export class InitCommand extends BaseCommand {
  private readonly canvas: Canvas;

  constructor(canvas: Canvas) {
    super("init");
    this.canvas = canvas;
  }

  execute(): void {
    this.canvas.init();
  }

  undo(): void {
    throw new CommandError("init 是文档级命令，不支持撤销");
  }

  isUndoable(): boolean {
    return false;
  }
}
