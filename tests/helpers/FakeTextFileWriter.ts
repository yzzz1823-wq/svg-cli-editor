import type { TextFileWriter } from "../../src/io/TextFileWriter";

/** 内存文件写入替身，记录路径与内容。 */
export class FakeTextFileWriter implements TextFileWriter {
  private readonly files = new Map<string, string>();

  writeText(path: string, content: string): void {
    this.files.set(path, content);
  }

  getContent(path: string): string | null {
    return this.files.get(path) ?? null;
  }

  paths(): readonly string[] {
    return [...this.files.keys()];
  }
}
