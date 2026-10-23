import type { TextFileStore } from "../../src/io/TextFileStore";

/** 内存文件系统替身，记录被读取过的路径。 */
export class FakeTextFileStore implements TextFileStore {
  private readonly files: Map<string, string>;
  private readonly readHistory: string[] = [];

  constructor(files: Record<string, string> = {}) {
    this.files = new Map(Object.entries(files));
  }

  readText(path: string): string {
    this.readHistory.push(path);
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file, open '${path}'`);
    }
    return content;
  }

  readPaths(): readonly string[] {
    return [...this.readHistory];
  }
}
