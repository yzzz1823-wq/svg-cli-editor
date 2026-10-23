import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { Canvas } from "./core/Canvas";
import { DefaultContainerFactory } from "./core/DefaultContainerFactory";
import { CommandManager } from "./command/CommandManager";
import { CliApp } from "./cli/CliApp";
import { CliParser } from "./cli/CliParser";
import { CommandFactory } from "./cli/CommandFactory";
import { ConsoleEchoObserver } from "./cli/ConsoleEchoObserver";
import { DefaultSvgElementFactory } from "./parser/DefaultSvgElementFactory";
import { SvgExportVisitor } from "./visitor/SvgExportVisitor";
import { SvgParser } from "./parser/SvgParser";
import { SvgReader } from "./parser/SvgReader";
import type { OutputWriter } from "./cli/OutputWriter";
import type { TextFileStore } from "./io/TextFileStore";
import type { TextFileWriter } from "./io/TextFileWriter";

/** 进程入口：装配所有协作者（唯一允许直接 new 具体实现的地方）并启动 REPL。 */
function main(): void {
  const output: OutputWriter = {
    writeLine: (text: string): void => {
      process.stdout.write(`${text}\n`);
    },
  };

  const canvas = new Canvas(new DefaultContainerFactory());
  const echo = new ConsoleEchoObserver(output);
  canvas.attach(echo);

  const shapeFactory = new DefaultSvgElementFactory();
  const fileStore: TextFileStore = {
    readText: (path: string): string => readFileSync(path, "utf8"),
  };
  const fileWriter: TextFileWriter = {
    writeText: (path: string, content: string): void => {
      writeFileSync(path, content, "utf8");
    },
  };
  const reader = new SvgReader(new SvgParser(shapeFactory), fileStore);

  const manager = new CommandManager();
  const commandFactory = new CommandFactory({
    canvas,
    shapeFactory,
    exportVisitor: new SvgExportVisitor(),
    fileWriter,
    reader,
    output,
  });

  const app = new CliApp({
    canvas,
    manager,
    parser: new CliParser(),
    commandFactory,
    output,
    echo,
  });

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "svg> ",
  });

  output.writeLine("SVG CLI 编辑器（输入 help 查看命令，exit 退出）");
  readline.prompt();
  readline.on("line", (line: string) => {
    if (app.executeLine(line)) {
      readline.prompt();
    } else {
      readline.close();
    }
  });
  readline.on("close", () => {
    process.stdout.write("\n");
  });
}

main();
