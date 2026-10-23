import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { CliParser } from "../../src/cli/CliParser";
import { CommandFactory } from "../../src/cli/CommandFactory";
import { CliError } from "../../src/errors/CliError";
import { CommandError } from "../../src/errors/CommandError";
import { ScaleShapeCommand } from "../../src/command/ScaleShapeCommand";
import { SetAttributeCommand } from "../../src/command/SetAttributeCommand";
import { SvgExportVisitor } from "../../src/visitor/SvgExportVisitor";
import { DefaultSvgElementFactory } from "../../src/parser/DefaultSvgElementFactory";
import { SvgParser } from "../../src/parser/SvgParser";
import { SvgReader } from "../../src/parser/SvgReader";
import { Rect } from "../../src/shapes/Rect";
import { Text } from "../../src/shapes/Text";
import { FakeOutputWriter } from "../helpers/FakeOutputWriter";
import { FakeTextFileStore } from "../helpers/FakeTextFileStore";
import { FakeTextFileWriter } from "../helpers/FakeTextFileWriter";

/** scale / set 在 CLI 层的注册、参数校验与别名归一化。 */
describe("scale 与 set 的 CLI 映射", () => {
  const createHarness = (): {
    canvas: Canvas;
    factory: CommandFactory;
    execute: (line: string) => void;
  } => {
    const canvas = new Canvas(new DefaultContainerFactory());
    const shapeFactory = new DefaultSvgElementFactory();
    const output = new FakeOutputWriter();
    const factory = new CommandFactory({
      canvas,
      shapeFactory,
      exportVisitor: new SvgExportVisitor(),
      fileWriter: new FakeTextFileWriter(),
      reader: new SvgReader(new SvgParser(shapeFactory), new FakeTextFileStore()),
      output,
    });
    const parser = new CliParser();
    const execute = (line: string): void => {
      const invocation = parser.parse(line);
      if (invocation === null) {
        throw new Error(`测试输入不合法：${line}`);
      }
      factory.create(invocation).execute();
    };
    return { canvas, factory, execute };
  };

  const parse = (line: string): { verb: string; args: readonly string[] } => {
    const parsed = new CliParser().parse(line);
    if (parsed === null) {
      throw new Error(`测试输入不合法：${line}`);
    }
    return parsed;
  };

  it("scale 映射为 ScaleShapeCommand 并按倍数生效", () => {
    const { canvas, factory, execute } = createHarness();
    const rect = new Rect("r1", 10, 20, 100, 60);
    canvas.addShape(rect);

    const command = factory.create(parse("scale r1 1.5"));
    expect(command).toBeInstanceOf(ScaleShapeCommand);

    execute("scale r1 1.5");

    expect(rect.getWidth()).toBe(150);
    expect(rect.getHeight()).toBe(90);
  });

  it("scale 系数非数字时抛 CliError", () => {
    const { canvas, factory } = createHarness();
    canvas.addShape(new Rect("r1", 0, 0, 1, 1));

    expect(() => factory.create(parse("scale r1 abc"))).toThrow(CliError);
    expect(() => factory.create(parse("scale r1 abc"))).toThrow(/数字/);
  });

  it("scale 系数 <= 0 时由命令抛 CommandError", () => {
    const { canvas, factory } = createHarness();
    canvas.addShape(new Rect("r1", 0, 0, 1, 1));

    expect(() => factory.create(parse("scale r1 0"))).toThrow(CommandError);
    expect(() => factory.create(parse("scale r1 -1"))).toThrow(/scale factor must be positive/);
  });

  it("set 支持简写别名 w/h 与 strokeWidth", () => {
    const { canvas, factory, execute } = createHarness();
    const rect = new Rect("r1", 0, 0, 10, 10);
    canvas.addShape(rect);

    const command = factory.create(parse("set r1 w=200 h=50 fill=blue strokeWidth=4"));
    expect(command).toBeInstanceOf(SetAttributeCommand);

    execute("set r1 w=200 h=50 fill=blue strokeWidth=4");

    expect(rect.getWidth()).toBe(200);
    expect(rect.getHeight()).toBe(50);
    expect(rect.getStyle().fill).toBe("blue");
    expect(rect.getStyle().strokeWidth).toBe(4);
  });

  it("set 修改文本时保留含空格的引号内容", () => {
    const { canvas, execute } = createHarness();
    const text = new Text("t1", 10, 20, "old");
    canvas.addShape(text);

    execute('set t1 text="Hello World"');

    expect(text.getContent()).toBe("Hello World");
    expect(text.getX()).toBe(10);
  });

  it("set 不允许修改 name 或 id", () => {
    const { canvas, factory } = createHarness();
    canvas.addShape(new Rect("r1", 0, 0, 1, 1));

    expect(() => factory.create(parse("set r1 name=foo"))).toThrow(CliError);
    expect(() => factory.create(parse("set r1 name=foo"))).toThrow(/不能修改/);
    expect(() => factory.create(parse("set r1 id=xx"))).toThrow(/不能修改/);
  });

  it("set 未知属性名被拒绝", () => {
    const { canvas, factory } = createHarness();
    canvas.addShape(new Rect("r1", 0, 0, 1, 1));

    expect(() => factory.create(parse("set r1 filll=red"))).toThrow(CliError);
    expect(() => factory.create(parse("set r1 filll=red"))).toThrow(/不支持的属性/);
  });

  it("set 缺少属性对时给出用法提示", () => {
    const { canvas, factory } = createHarness();
    canvas.addShape(new Rect("r1", 0, 0, 1, 1));

    expect(() => factory.create(parse("set r1"))).toThrow(/用法/);
  });
});
