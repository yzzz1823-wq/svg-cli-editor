import { BaseCommand } from "./BaseCommand";
import { CommandError } from "../errors/CommandError";
import type { Canvas } from "../core/Canvas";

/**
 * 修改画布尺寸：只更新宽高并广播 document，保留画布上已有的全部图形。
 * 尺寸在构造时校验，非法值不会留下“执行到一半才失败”的命令对象。
 */
export class CanvasCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private readonly width: number;
  private readonly height: number;

  constructor(canvas: Canvas, width: number, height: number) {
    super("canvas");
    CanvasCommand.assertPositiveInteger(width, "画布宽度");
    CanvasCommand.assertPositiveInteger(height, "画布高度");
    this.canvas = canvas;
    this.width = width;
    this.height = height;
  }

  execute(): void {
    this.canvas.resize(this.width, this.height);
  }

  undo(): void {
    throw new CommandError("canvas 是文档级命令，不支持撤销");
  }

  isUndoable(): boolean {
    return false;
  }

  private static assertPositiveInteger(value: number, label: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new CommandError(`${label}必须是正整数，当前为 ${value}`);
    }
  }
}
