import { ShapeDetailVisitor } from "../visitor/ShapeDetailVisitor";
import { BaseCommand } from "./BaseCommand";
import { CommandError } from "../errors/CommandError";
import type { OutputWriter } from "../io/OutputWriter";
import type { Shape } from "../core/Shape";

/**
 * 显示单个图形的完整属性明细。
 *
 * 是“显示类”命令：不改变文档，因此不进入撤销栈（由 CliApp 直接执行），
 * 具体格式由 ShapeDetailVisitor 负责，命令本身不感知图形类型。
 */
export class ShowCommand extends BaseCommand {
  private readonly shape: Shape;
  private readonly output: OutputWriter;
  private readonly detailVisitor = new ShapeDetailVisitor();

  constructor(shape: Shape, output: OutputWriter) {
    super("show");
    this.shape = shape;
    this.output = output;
  }

  isUndoable(): boolean {
    return false;
  }

  execute(): void {
    this.output.writeLine(this.detailVisitor.render(this.shape).join("\n"));
  }

  undo(): void {
    throw new CommandError("显示命令不修改文档，无需撤销");
  }
}
