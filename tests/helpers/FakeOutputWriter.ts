import type { OutputWriter } from "../../src/cli/OutputWriter";

/** 收集所有输出行，便于断言 CLI 回显。 */
export class FakeOutputWriter implements OutputWriter {
  private readonly lines: string[] = [];

  writeLine(text: string): void {
    this.lines.push(text);
  }

  all(): string {
    return this.lines.join("\n");
  }

  linesWritten(): readonly string[] {
    return [...this.lines];
  }

  reset(): void {
    this.lines.length = 0;
  }
}
