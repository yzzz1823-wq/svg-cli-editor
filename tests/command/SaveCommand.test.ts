import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { SaveCommand } from "../../src/command/SaveCommand";
import { CommandError } from "../../src/errors/CommandError";
import { SvgExportVisitor } from "../../src/visitor/SvgExportVisitor";
import { Rect } from "../../src/shapes/Rect";
import { FakeTextFileWriter } from "../helpers/FakeTextFileWriter";

const createContext = () => {
  const canvas = new Canvas(new DefaultContainerFactory());
  canvas.addShape(new Rect("r1", 0, 0, 10, 20));
  const writer = new FakeTextFileWriter();
  const command = new SaveCommand(canvas, new SvgExportVisitor(), writer, "out.svg");
  return { canvas, writer, command };
};

describe("SaveCommand", () => {
  it("把当前文档导出到指定路径", () => {
    const { writer, command } = createContext();
    command.execute();

    expect(writer.paths()).toEqual(["out.svg"]);
    expect(writer.getContent("out.svg")).toContain('<rect id="r1"');
    expect(writer.getContent("out.svg")).toContain("<svg");
  });

  it("是文档级命令，不进入撤销栈", () => {
    const { command } = createContext();
    expect(command.getName()).toBe("save");
    expect(command.isUndoable()).toBe(false);
  });

  it("不支持撤销", () => {
    const { command } = createContext();
    expect(() => command.undo()).toThrow(CommandError);
  });
});
