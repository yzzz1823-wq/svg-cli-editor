import { Canvas } from "../../src/core/Canvas";
import { CommandManager } from "../../src/command/CommandManager";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { CliApp } from "../../src/cli/CliApp";
import { CliParser } from "../../src/cli/CliParser";
import { CommandFactory } from "../../src/cli/CommandFactory";
import { ConsoleEchoObserver } from "../../src/cli/ConsoleEchoObserver";
import { DefaultSvgElementFactory } from "../../src/parser/DefaultSvgElementFactory";
import { SvgParser } from "../../src/parser/SvgParser";
import { SvgReader } from "../../src/parser/SvgReader";
import { SvgExportVisitor } from "../../src/visitor/SvgExportVisitor";
import { FakeOutputWriter } from "./FakeOutputWriter";
import { FakeTextFileStore } from "./FakeTextFileStore";
import { FakeTextFileWriter } from "./FakeTextFileWriter";
import type { ParsedInvocation } from "../../src/cli/ParsedInvocation";

/** CLI 层测试的公共装配：真实 CliApp + 内存 I/O，同时提供“直接走工厂”的入口。 */
export interface CliHarness {
  readonly app: CliApp;
  readonly canvas: Canvas;
  readonly manager: CommandManager;
  readonly factory: CommandFactory;
  readonly output: FakeOutputWriter;
  executeLine(line: string): boolean;
  parse(line: string): ParsedInvocation;
  run(line: string): void;
}

export interface CliHarnessOptions {
  /** 默认 true：模拟已 init 的文档，避免每个用例都先输入 init。 */
  readonly initializeDocument?: boolean;
}

export const createCliHarness = (options: CliHarnessOptions = {}): CliHarness => {
  const canvas = new Canvas(new DefaultContainerFactory());
  if (options.initializeDocument !== false) {
    // 在挂观察者之前初始化，避免把“文档已更新”回显混进用例输出。
    canvas.init(800, 600);
  }
  const manager = new CommandManager();
  const output = new FakeOutputWriter();
  const writer = new FakeTextFileWriter();
  const shapeFactory = new DefaultSvgElementFactory();

  canvas.attach(new ConsoleEchoObserver(output));

  const factory = new CommandFactory({
    canvas,
    shapeFactory,
    exportVisitor: new SvgExportVisitor(),
    fileWriter: writer,
    reader: new SvgReader(new SvgParser(shapeFactory), new FakeTextFileStore()),
    output,
  });

  const app = new CliApp({
    canvas,
    manager,
    parser: new CliParser(),
    commandFactory: factory,
    output,
    echo: new ConsoleEchoObserver(output),
  });

  const parse = (line: string): ParsedInvocation => {
    const invocation = new CliParser().parse(line);
    if (invocation === null) {
      throw new Error(`测试输入不合法：${line}`);
    }
    return invocation;
  };

  return {
    app,
    canvas,
    manager,
    factory,
    output,
    executeLine: (line: string) => app.executeLine(line),
    parse,
    run: (line: string) => manager.execute(factory.create(parse(line))),
  };
};
