import { TreeRenderVisitor } from "../visitor/TreeRenderVisitor";
import type { CommandManager } from "../command/CommandManager";
import type { CommandFactory } from "./CommandFactory";
import type { Canvas } from "../core/Canvas";
import type { CliParser } from "./CliParser";
import type { ConsoleEchoObserver } from "./ConsoleEchoObserver";
import type { LineReader } from "./LineReader";
import type { OutputWriter } from "./OutputWriter";
import type { ParsedInvocation } from "./ParsedInvocation";

/** 输入结束时的兜底 reader：事件驱动的 REPL 不使用 run() 循环。 */
const NULL_READER: LineReader = { readLine: () => null };

export interface CliAppDependencies {
  readonly canvas: Canvas;
  readonly manager: CommandManager;
  readonly parser: CliParser;
  readonly commandFactory: CommandFactory;
  readonly output: OutputWriter;
  readonly lineReader?: LineReader;
  /** 提供时，撤销/重做内部变更不重复回显。 */
  readonly echo?: ConsoleEchoObserver;
}

/**
 * REPL 门面：读一行 → 解析 → 分派（内建命令 / CommandFactory）→ 执行 → 回显。
 *
 * 这里只做流程编排；业务规则在命令与 Canvas 中，错误统一由 EditorError 子类表达。
 */
export class CliApp {
  private readonly deps: CliAppDependencies;
  private readonly treeRenderer = new TreeRenderVisitor();

  constructor(deps: CliAppDependencies) {
    this.deps = deps;
  }

  /** 逐行处理，直到输入结束或用户输入 exit/quit。 */
  run(): void {
    const reader = this.deps.lineReader ?? NULL_READER;
    for (;;) {
      const line = reader.readLine();
      if (line === null) {
        return;
      }
      if (!this.executeLine(line)) {
        return;
      }
    }
  }

  /** 执行一行输入；返回 false 表示应结束会话（exit/quit）。 */
  executeLine(line: string): boolean {
    let invocation: ParsedInvocation | null;
    try {
      invocation = this.deps.parser.parse(line);
    } catch (error) {
      this.report(error);
      return true;
    }
    if (invocation === null) {
      return true;
    }

    switch (invocation.verb) {
      case "help":
        this.printHelp();
        return true;
      case "exit":
      case "quit":
        this.deps.output.writeLine("再见");
        return false;
      case "tree":
        this.deps.output.writeLine(this.treeRenderer.render(this.deps.canvas));
        return true;
      case "undo":
        this.undo();
        return true;
      case "redo":
        this.redo();
        return true;
      default:
        this.runCommand(invocation);
        return true;
    }
  }

  private undo(): void {
    try {
      const command = this.quietly(() => this.deps.manager.undo());
      this.deps.output.writeLine(`已撤销 ${command.getName()}`);
    } catch (error) {
      this.report(error);
    }
  }

  private redo(): void {
    try {
      const command = this.quietly(() => this.deps.manager.redo());
      this.deps.output.writeLine(`已重做 ${command.getName()}`);
    } catch (error) {
      this.report(error);
    }
  }

  private quietly<T>(task: () => T): T {
    const echo = this.deps.echo;
    return echo === undefined ? task() : echo.silenced(task);
  }

  private runCommand(invocation: ParsedInvocation): void {
    try {
      const command = this.deps.commandFactory.create(invocation);
      this.deps.manager.execute(command);
    } catch (error) {
      this.report(error);
    }
  }

  private report(error: unknown): void {
    if (error instanceof Error) {
      this.deps.output.writeLine(`错误：${error.message}`);
      return;
    }
    this.deps.output.writeLine(`错误：${String(error)}`);
  }

  private printHelp(): void {
    this.deps.output.writeLine(
      [
        "可用命令：",
        "  init [宽 高]                     新建文档（默认 800×600）",
        "  canvas <宽> <高>                 新建指定尺寸文档",
        "  add <类型> <名称> [键=值 ...]    添加图形（rect/circle/ellipse/line/text）",
        "  remove <名称>                    删除图形",
        "  translate <名称> <dx> <dy>       平移图形",
        "  group <组名> <名称1> <名称2> ... 组合（至少两个节点）",
        "  ungroup <组名>                   解散分组",
        "  undo | redo                      撤销 / 重做",
        "  save <路径>                      保存为 SVG 文件",
        "  read <路径>                      读取 SVG 文件",
        "  tree                             打印文档树",
        "  help | exit                      帮助 / 退出",
      ].join("\n"),
    );
  }
}
