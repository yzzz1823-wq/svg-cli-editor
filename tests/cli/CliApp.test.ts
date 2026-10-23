import { Canvas } from "../../src/core/Canvas";
import { CommandManager } from "../../src/command/CommandManager";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { CliApp } from "../../src/cli/CliApp";
import { CliParser } from "../../src/cli/CliParser";
import { CommandFactory } from "../../src/cli/CommandFactory";
import { ConsoleEchoObserver } from "../../src/cli/ConsoleEchoObserver";
import { SvgExportVisitor } from "../../src/visitor/SvgExportVisitor";
import { DefaultSvgElementFactory } from "../../src/parser/DefaultSvgElementFactory";
import { SvgParser } from "../../src/parser/SvgParser";
import { SvgReader } from "../../src/parser/SvgReader";
import { Rect } from "../../src/shapes/Rect";
import { FakeLineReader } from "../helpers/FakeLineReader";
import { FakeOutputWriter } from "../helpers/FakeOutputWriter";
import { FakeTextFileStore } from "../helpers/FakeTextFileStore";
import { FakeTextFileWriter } from "../helpers/FakeTextFileWriter";

interface Harness {
  readonly app: CliApp;
  readonly canvas: Canvas;
  readonly manager: CommandManager;
  readonly output: FakeOutputWriter;
  readonly writer: FakeTextFileWriter;
}

const createHarness = (
  files: Record<string, string> = {},
  input: readonly string[] = [],
): Harness => {
  const canvas = new Canvas(new DefaultContainerFactory());
  const manager = new CommandManager();
  const output = new FakeOutputWriter();
  const writer = new FakeTextFileWriter();
  const shapeFactory = new DefaultSvgElementFactory();
  const reader = new SvgReader(new SvgParser(shapeFactory), new FakeTextFileStore(files));

  // 在挂观察者之前初始化，模拟用户先输入 init 的初始状态。
  canvas.init(800, 600);

  canvas.attach(new ConsoleEchoObserver(output));

  const commandFactory = new CommandFactory({
    canvas,
    shapeFactory,
    exportVisitor: new SvgExportVisitor(),
    fileWriter: writer,
    reader,
    output,
  });

  const app = new CliApp({
    canvas,
    manager,
    parser: new CliParser(),
    commandFactory,
    output,
    lineReader: new FakeLineReader(input),
  });

  return { app, canvas, manager, output, writer };
};

describe("CliApp", () => {
  it("执行 add 与 tree，输出树状结构", () => {
    const { app, output } = createHarness();

    app.executeLine("add rect r1 x=0 y=0 width=10 height=20");
    app.executeLine("tree");

    expect(output.all()).toContain("已添加 r1 (rect)");
    expect(output.all()).toContain("svg 800x600");
    expect(output.all()).toContain("r1 [rect]");
  });

  it("未知命令给出提示且不中断会话", () => {
    const { app, canvas, output } = createHarness();

    app.executeLine("fly away");
    app.executeLine("add rect r1 x=0 y=0 width=1 height=1");

    expect(output.all()).toContain("未知命令");
    expect(canvas.findShape("r1")).not.toBeNull();
  });

  it("参数错误给出用法提示且不中断会话", () => {
    const { app, output } = createHarness();

    app.executeLine("add rect");
    app.executeLine("add rect r2 x=0 y=0 width=1 height=1");

    expect(output.all()).toContain("用法");
    expect(output.all()).toContain("已添加 r2 (rect)");
  });

  it("undo 与 redo 作用于最近的命令", () => {
    const { app, canvas, output } = createHarness();

    app.executeLine("add rect r1 x=0 y=0 width=1 height=1");
    app.executeLine("translate r1 5 5");
    app.executeLine("undo");
    expect((canvas.findShape("r1") as Rect).getX()).toBe(0);

    app.executeLine("redo");
    expect((canvas.findShape("r1") as Rect).getX()).toBe(5);
    expect(output.all()).toContain("已撤销 translate");
    expect(output.all()).toContain("已重做 translate");
  });

  it("空撤销栈给出友好提示", () => {
    const { app, output } = createHarness();
    app.executeLine("undo");
    expect(output.all()).toContain("没有可撤销的命令");
  });

  it("save 写出当前文档", () => {
    const { app, writer } = createHarness();

    app.executeLine("add rect r1 x=0 y=0 width=1 height=1");
    app.executeLine("save out.svg");

    expect(writer.getContent("out.svg")).toContain('<rect id="r1"');
    expect(writer.paths()).toEqual(["out.svg"]);
  });

  it("tree 在空文档时输出 (empty)", () => {
    const { app, output } = createHarness();
    app.executeLine("tree");
    expect(output.all()).toContain("(empty)");
  });

  it("空行被忽略且不产生输出", () => {
    const { app, output } = createHarness();
    expect(app.executeLine("   ")).toBe(true);
    expect(output.all()).toBe("");
  });

  it("help 只列出规范命令，不含旧式别名", () => {
    const { app, output } = createHarness();
    app.executeLine("help");
    const help = output.all();
    for (const verb of [
      "init", "canvas", "create", "delete", "move", "scale", "set", "group",
      "ungroup", "addto", "front", "back", "show", "tree", "help", "undo",
      "redo", "save", "read", "exit",
    ]) {
      expect(help).toMatch(new RegExp(`\\b${verb}\\b`));
    }
    expect(help).not.toContain("add <");
    expect(help).not.toContain("translate");
    expect(help).not.toContain("remove");
  });

  it("exit 结束会话", () => {
    const { app } = createHarness();
    expect(app.executeLine("exit")).toBe(false);
  });

  it("run 逐行执行直到输入结束", () => {
    const { app, canvas } = createHarness({}, [
      "add rect r1 x=0 y=0 width=1 height=1",
      "translate r1 2 3",
    ]);

    app.run();

    expect((canvas.findShape("r1") as Rect).getX()).toBe(2);
  });
});
