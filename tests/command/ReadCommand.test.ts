import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { ReadCommand } from "../../src/command/ReadCommand";
import { CommandError } from "../../src/errors/CommandError";
import { DefaultSvgElementFactory } from "../../src/parser/DefaultSvgElementFactory";
import { SvgParser } from "../../src/parser/SvgParser";
import { SvgReader } from "../../src/parser/SvgReader";
import { Rect } from "../../src/shapes/Rect";
import { FakeOutputWriter } from "../helpers/FakeOutputWriter";
import { FakeTextFileStore } from "../helpers/FakeTextFileStore";

const createContext = (files: Record<string, string>) => {
  const canvas = new Canvas(new DefaultContainerFactory());
  const shapeFactory = new DefaultSvgElementFactory();
  const store = new FakeTextFileStore(files);
  const reader = new SvgReader(new SvgParser(shapeFactory), store);
  const output = new FakeOutputWriter();
  return { canvas, output, reader, store };
};

describe("ReadCommand", () => {
  it("装载文件内容与画布尺寸", () => {
    const { canvas, output, reader } = createContext({
      "in.svg": '<svg width="30" height="40"><rect id="r"/></svg>',
    });

    new ReadCommand(canvas, reader, "in.svg", output).execute();

    expect(canvas.getWidth()).toBe(30);
    expect(canvas.getHeight()).toBe(40);
    expect(canvas.findShape("r")).toBeInstanceOf(Rect);
    expect(output.all()).toBe("");
  });

  it("把缺 id 的自动命名提示输出给用户", () => {
    const { canvas, output, reader } = createContext({
      "in.svg": "<svg><rect/></svg>",
    });

    new ReadCommand(canvas, reader, "in.svg", output).execute();

    expect(output.all()).toContain("提示：");
    expect(output.all()).toContain("shape-1");
  });

  it("是文档级命令，不支持撤销", () => {
    const { canvas, output, reader } = createContext({
      "in.svg": '<svg width="1" height="1"></svg>',
    });
    const command = new ReadCommand(canvas, reader, "in.svg", output);

    expect(command.getName()).toBe("read");
    expect(command.isUndoable()).toBe(false);
    expect(() => command.undo()).toThrow(CommandError);
  });
});
