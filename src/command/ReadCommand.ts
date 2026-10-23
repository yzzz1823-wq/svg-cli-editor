import { CommandError } from "../errors/CommandError";
import { BaseCommand } from "./BaseCommand";
import type { Canvas } from "../core/Canvas";
import type { OutputWriter } from "../cli/OutputWriter";
import type { SvgReader } from "../parser/SvgReader";

/** 文档级命令：读取 SVG 文件并替换当前画布内容，缺 id 的提示通过写入器回显。 */
export class ReadCommand extends BaseCommand {
  private readonly canvas: Canvas;
  private readonly reader: SvgReader;
  private readonly path: string;
  private readonly output: OutputWriter;

  constructor(canvas: Canvas, reader: SvgReader, path: string, output: OutputWriter) {
    super("read");
    if (path.trim() === "") {
      throw new CommandError("read 需要文件路径");
    }
    this.canvas = canvas;
    this.reader = reader;
    this.path = path;
    this.output = output;
  }

  execute(): void {
    const document = this.reader.read(this.path);
    this.canvas.load(document.root, document.width, document.height);
    for (const warning of document.warnings) {
      this.output.writeLine(`提示：${warning}`);
    }
  }

  undo(): void {
    throw new CommandError("read 是文档级命令，不支持撤销");
  }

  isUndoable(): boolean {
    return false;
  }
}
