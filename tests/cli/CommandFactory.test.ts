import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { CliParser } from "../../src/cli/CliParser";
import { CommandFactory } from "../../src/cli/CommandFactory";
import { CliError } from "../../src/errors/CliError";
import { AddShapeCommand } from "../../src/command/AddShapeCommand";
import { CanvasCommand } from "../../src/command/CanvasCommand";
import { GroupCommand } from "../../src/command/GroupCommand";
import { InitCommand } from "../../src/command/InitCommand";
import { ReadCommand } from "../../src/command/ReadCommand";
import { RemoveShapeCommand } from "../../src/command/RemoveShapeCommand";
import { SaveCommand } from "../../src/command/SaveCommand";
import { TranslateShapeCommand } from "../../src/command/TranslateShapeCommand";
import { UngroupCommand } from "../../src/command/UngroupCommand";
import { SvgExportVisitor } from "../../src/visitor/SvgExportVisitor";
import { DefaultSvgElementFactory } from "../../src/parser/DefaultSvgElementFactory";
import { SvgParser } from "../../src/parser/SvgParser";
import { SvgReader } from "../../src/parser/SvgReader";
import { Group } from "../../src/shapes/Group";
import { Rect } from "../../src/shapes/Rect";
import { Text } from "../../src/shapes/Text";
import { FakeOutputWriter } from "../helpers/FakeOutputWriter";
import { FakeTextFileStore } from "../helpers/FakeTextFileStore";
import { FakeTextFileWriter } from "../helpers/FakeTextFileWriter";

interface Harness {
  readonly canvas: Canvas;
  readonly factory: CommandFactory;
  readonly output: FakeOutputWriter;
  readonly writer: FakeTextFileWriter;
}

const createHarness = (files: Record<string, string> = {}): Harness => {
  const canvas = new Canvas(new DefaultContainerFactory());
  const shapeFactory = new DefaultSvgElementFactory();
  const output = new FakeOutputWriter();
  const writer = new FakeTextFileWriter();
  const store = new FakeTextFileStore(files);
  const parser = new SvgParser(shapeFactory);
  const factory = new CommandFactory({
    canvas,
    shapeFactory,
    exportVisitor: new SvgExportVisitor(),
    fileWriter: writer,
    reader: new SvgReader(parser, store),
    output,
  });
  return { canvas, factory, output, writer };
};

const parse = (line: string): { verb: string; args: readonly string[] } => {
  const parsed = new CliParser().parse(line);
  if (parsed === null) {
    throw new Error(`测试输入不合法：${line}`);
  }
  return parsed;
};

const add = (harness: Pick<Harness, "canvas" | "factory">, line: string): void => {
  harness.factory.create(parse(line)).execute();
};

describe("CommandFactory", () => {
  it("init 映射为不可撤销的初始化命令", () => {
    const { factory } = createHarness();
    expect(factory.create(parse("init"))).toBeInstanceOf(InitCommand);
  });

  it("init 带尺寸时映射为 canvas 命令并生效", () => {
    const { factory, canvas } = createHarness();
    const command = factory.create(parse("init 100 200"));
    expect(command).toBeInstanceOf(CanvasCommand);
    command.execute();
    expect(canvas.getWidth()).toBe(100);
    expect(canvas.getHeight()).toBe(200);
  });

  it("canvas 命令只改尺寸，保留已有图形", () => {
    const { factory, canvas } = createHarness();
    add({ factory, canvas }, "add rect r1 x=0 y=0 width=1 height=1");

    factory.create(parse("canvas 300 400")).execute();

    expect(canvas.getWidth()).toBe(300);
    expect(canvas.getHeight()).toBe(400);
    expect(canvas.findShape("r1")).not.toBeNull();
  });

  it("add 创建带几何与样式的矩形", () => {
    const { factory, canvas } = createHarness();
    const command = factory.create(
      parse("add rect r1 x=0 y=0 width=10 height=20 fill=#ff0000"),
    );
    expect(command).toBeInstanceOf(AddShapeCommand);
    command.execute();

    const shape = canvas.findShape("r1");
    expect(shape).toBeInstanceOf(Rect);
    const rect = shape as Rect;
    expect(rect.getWidth()).toBe(10);
    expect(rect.getHeight()).toBe(20);
    expect(rect.getStyle().fill).toBe("#ff0000");
  });

  it("add 文本时把 text 键作为文本内容", () => {
    const { factory, canvas } = createHarness();
    factory.create(parse('add text t1 x=1 y=2 text="Hi there"')).execute();
    expect((canvas.findShape("t1") as Text).getContent()).toBe("Hi there");
  });

  it("add 后 undo 可移除刚添加的图形", () => {
    const { factory, canvas } = createHarness();
    const command = factory.create(parse("add rect r1 x=0 y=0 width=1 height=1"));
    command.execute();
    command.undo();
    expect(canvas.findShape("r1")).toBeNull();
  });

  it("translate 生成可撤销的平移命令", () => {
    const { factory, canvas } = createHarness();
    add({ factory, canvas }, "add rect r1 x=0 y=0 width=1 height=1");

    const command = factory.create(parse("translate r1 5 6"));
    expect(command).toBeInstanceOf(TranslateShapeCommand);
    command.execute();
    expect((canvas.findShape("r1") as Rect).getX()).toBe(5);
    command.undo();
    expect((canvas.findShape("r1") as Rect).getX()).toBe(0);
  });

  it("group 与 ungroup 成对工作", () => {
    const { factory, canvas } = createHarness();
    add({ factory, canvas }, "add rect a x=0 y=0 width=1 height=1");
    add({ factory, canvas }, "add rect b x=0 y=0 width=1 height=1");

    const group = factory.create(parse("group g1 a b"));
    expect(group).toBeInstanceOf(GroupCommand);
    group.execute();
    expect(canvas.findShape("g1")).toBeInstanceOf(Group);

    const ungroup = factory.create(parse("ungroup g1"));
    expect(ungroup).toBeInstanceOf(UngroupCommand);
    ungroup.execute();
    expect(canvas.findShape("g1")).toBeNull();
    expect(canvas.findShape("a")).not.toBeNull();
  });

  it("remove 生成可撤销的删除命令", () => {
    const { factory, canvas } = createHarness();
    add({ factory, canvas }, "add rect r1 x=0 y=0 width=1 height=1");

    const command = factory.create(parse("remove r1"));
    expect(command).toBeInstanceOf(RemoveShapeCommand);
    command.execute();
    expect(canvas.findShape("r1")).toBeNull();
    command.undo();
    expect(canvas.findShape("r1")).not.toBeNull();
  });

  it("save 写入导出内容", () => {
    const { factory, canvas, writer } = createHarness();
    add({ factory, canvas }, "add rect r1 x=0 y=0 width=1 height=1");

    const command = factory.create(parse("save out.svg"));
    expect(command).toBeInstanceOf(SaveCommand);
    command.execute();
    expect(writer.getContent("out.svg")).toContain('<rect id="r1"');
  });

  it("read 装载文件并输出缺 id 提示", () => {
    const { factory, canvas, output } = createHarness({
      "in.svg": '<svg width="30" height="40"><rect/></svg>',
    });

    const command = factory.create(parse("read in.svg"));
    expect(command).toBeInstanceOf(ReadCommand);
    command.execute();

    expect(canvas.getWidth()).toBe(30);
    expect(canvas.findShape("shape-1")).toBeInstanceOf(Rect);
    expect(output.all()).toContain("提示：");
  });

  it("未知命令抛出带提示的 CliError", () => {
    const { factory } = createHarness();
    expect(() => factory.create(parse("fly away"))).toThrow(CliError);
    expect(() => factory.create(parse("fly away"))).toThrow(/未知命令/);
  });

  it("add 缺少参数时给出用法提示", () => {
    const { factory } = createHarness();
    expect(() => factory.create(parse("add rect"))).toThrow(/用法/);
  });

  it("translate 参数非数字时抛出 CliError", () => {
    const { factory } = createHarness();
    expect(() => factory.create(parse("translate r1 abc def"))).toThrow(/数字/);
  });

  it("group 少于两个子节点时被拒绝", () => {
    const { factory } = createHarness();
    expect(() => factory.create(parse("group g1 only"))).toThrow(/至少两个/);
  });
});
