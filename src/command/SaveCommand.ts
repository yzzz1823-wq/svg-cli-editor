import { CommandError } from "../errors/CommandError";
import { BaseCommand } from "./BaseCommand";
import type { Canvas } from "../core/Canvas";
import type { SvgExportVisitor } from "../visitor/SvgExportVisitor";
import type { TextFileWriter } from "../io/TextFileWriter";

/** 文档级命令：把当前画布序列化为 SVG 写入文件，不可撤销。 */
export class SaveCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private readonly exporter: SvgExportVisitor;
  private readonly writer: TextFileWriter;
  private readonly path: string;

  constructor(canvas: Canvas, exporter: SvgExportVisitor, writer: TextFileWriter, path: string) {
    super("save");
    if (path.trim() === "") {
      throw new CommandError("save 需要文件路径");
    }
    this.canvas = canvas;
    this.exporter = exporter;
    this.writer = writer;
    this.path = path;
  }

  execute(): void {
    const content = this.exporter.exportDocument(this.canvas);
    try {
      this.writer.writeText(this.path, content);
    } catch {
      throw new CommandError(`cannot write file: ${this.path}`);
    }
  }

  undo(): void {
    throw new CommandError("save 是文档级命令，不支持撤销");
  }

  isUndoable(): boolean {
    return false;
  }
}
