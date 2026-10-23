import type { LineReader } from "../../src/cli/LineReader";

/** 按脚本顺序返回输入行，耗尽后返回 null（EOF）。 */
export class FakeLineReader implements LineReader {
  private readonly lines: readonly string[];
  private index = 0;

  constructor(lines: readonly string[]) {
    this.lines = [...lines];
  }

  readLine(): string | null {
    const line = this.lines[this.index];
    this.index += 1;
    return line ?? null;
  }
}
