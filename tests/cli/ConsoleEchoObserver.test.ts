import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { ConsoleEchoObserver } from "../../src/cli/ConsoleEchoObserver";
import { Group } from "../../src/shapes/Group";
import { Rect } from "../../src/shapes/Rect";
import { FakeOutputWriter } from "../helpers/FakeOutputWriter";

const createCanvas = (): { canvas: Canvas; output: FakeOutputWriter } => {
  const canvas = new Canvas(new DefaultContainerFactory());
  const output = new FakeOutputWriter();
  canvas.attach(new ConsoleEchoObserver(output));
  return { canvas, output };
};

describe("ConsoleEchoObserver", () => {
  it("添加图形时回显名称与类型", () => {
    const { canvas, output } = createCanvas();
    canvas.addShape(new Rect("r1", 0, 0, 1, 1));
    expect(output.all()).toBe("已添加 r1 (rect)");
  });

  it("移动与移除图形时回显操作", () => {
    const { canvas, output } = createCanvas();
    const rect = new Rect("r1", 0, 0, 1, 1);
    canvas.addShape(rect);
    canvas.moveShape(rect, 1, 1);
    canvas.removeShape(rect);
    expect(output.linesWritten()).toEqual(["已添加 r1 (rect)", "已移动 r1", "已移除 r1 (rect)"]);
  });

  it("建组与新建文档时回显", () => {
    const { canvas, output } = createCanvas();
    canvas.addShape(new Rect("a", 0, 0, 1, 1));
    canvas.addShape(new Rect("b", 0, 0, 1, 1));
    canvas.groupShapes([canvas.findShape("a") as Rect, canvas.findShape("b") as Rect], "g1");
    canvas.init();

    expect(output.all()).toContain("已建组 g1");
    expect(output.all()).toContain("文档已更新");
  });

  it("解散分组时回显", () => {
    const { canvas, output } = createCanvas();
    canvas.addShape(new Rect("a", 0, 0, 1, 1));
    canvas.addShape(new Rect("b", 0, 0, 1, 1));
    const group = canvas.groupShapes(
      [canvas.findShape("a") as Rect, canvas.findShape("b") as Rect],
      "g1",
    ) as Group;
    canvas.ungroupContainer(group);
    expect(output.all()).toContain("已解散 g1");
  });
});
