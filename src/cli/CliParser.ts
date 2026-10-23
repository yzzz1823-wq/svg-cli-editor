import { CliError } from "../errors/CliError";
import type { ParsedInvocation } from "./ParsedInvocation";

/**
 * 命令行词法分析：按空白切分，双引号与单引号内的空白保留。
 *
 * 只做“拆词”，不理解任何命令语义；解释工作交给 CommandFactory。
 */
export class CliParser {
  /** 空行（含纯空白）返回 null，REPL 直接忽略。 */
  parse(line: string): ParsedInvocation | null {
    const tokens = this.tokenize(line);
    if (tokens.length === 0) {
      return null;
    }
    const [verb, ...args] = tokens;
    return { verb: verb ?? "", args };
  }

  private tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let quote: string | null = null;

    for (const char of line) {
      if (quote !== null) {
        if (char === quote) {
          quote = null;
        } else {
          current += char;
        }
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }
      if (/\s/.test(char)) {
        if (current !== "") {
          tokens.push(current);
          current = "";
        }
        continue;
      }
      current += char;
    }

    if (quote !== null) {
      throw new CliError("命令中的引号未闭合");
    }
    if (current !== "") {
      tokens.push(current);
    }
    return tokens;
  }
}
