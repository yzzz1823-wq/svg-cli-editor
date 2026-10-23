import type { ParsedDocument } from "./ParsedDocument";
import type { SvgParser } from "./SvgParser";
import type { TextFileStore } from "../io/TextFileStore";

/**
 * 文件读取边界：读入原始文本后交给 SvgParser。
 * 读取失败（ENOENT 等）原样上抛，由命令层决定提示文案。
 */
export class SvgReader {
  private readonly parser: SvgParser;
  private readonly fileStore: TextFileStore;

  constructor(parser: SvgParser, fileStore: TextFileStore) {
    this.parser = parser;
    this.fileStore = fileStore;
  }

  read(path: string): ParsedDocument {
    return this.parser.parse(this.fileStore.readText(path));
  }
}
