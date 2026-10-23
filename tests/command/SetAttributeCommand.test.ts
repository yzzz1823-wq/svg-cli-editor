import { SetAttributeCommand } from "../../src/command/SetAttributeCommand";
import { CommandManager } from "../../src/command/CommandManager";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { CommandError } from "../../src/errors/CommandError";
import { Circle } from "../../src/shapes/Circle";
import { Ellipse } from "../../src/shapes/Ellipse";
import { Line } from "../../src/shapes/Line";
import { Rect } from "../../src/shapes/Rect";
import { Text } from "../../src/shapes/Text";
import { RecordingObserver } from "../helpers/RecordingObserver";

/**
 * SetAttributeCommand：把一份“属性补丁”绝对覆盖到图形上，
 * undo 时把执行前捕获的完整快照写回，因此不依赖属性顺序。
 */
describe("SetAttributeCommand", () => {
  let canvas: Canvas;
  let observer: RecordingObserver;

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
    observer = new RecordingObserver();
    canvas.attach(observer);
  });

  it("覆盖矩形几何属性并广播 set", () => {
    const rect = new Rect("r1", 10, 20, 100, 60);
    canvas.addShape(rect);
    observer.reset();

    new SetAttributeCommand(canvas, rect, { x: 5, y: 6, width: 50, height: 25 }).execute();

    expect(rect.getX()).toBe(5);
    expect(rect.getY()).toBe(6);
    expect(rect.getWidth()).toBe(50);
    expect(rect.getHeight()).toBe(25);
    expect(observer.operations()).toEqual(["set"]);
  });

  it("覆盖圆的圆心与半径", () => {
    const circle = new Circle("c1", 0, 0, 5);
    canvas.addShape(circle);

    new SetAttributeCommand(canvas, circle, { cx: 30, cy: 40, radius: 12 }).execute();

    expect(circle.getCx()).toBe(30);
    expect(circle.getCy()).toBe(40);
    expect(circle.getRadius()).toBe(12);
  });

  it("覆盖椭圆的横纵半径", () => {
    const ellipse = new Ellipse("e1", 0, 0, 5, 3);
    canvas.addShape(ellipse);

    new SetAttributeCommand(canvas, ellipse, { rx: 20, ry: 10 }).execute();

    expect(ellipse.getRx()).toBe(20);
    expect(ellipse.getRy()).toBe(10);
  });

  it("覆盖线段两端点", () => {
    const line = new Line("l1", 0, 0, 1, 1);
    canvas.addShape(line);

    new SetAttributeCommand(canvas, line, { x1: 5, y1: 6, x2: 7, y2: 8 }).execute();

    expect(line.getX1()).toBe(5);
    expect(line.getY1()).toBe(6);
    expect(line.getX2()).toBe(7);
    expect(line.getY2()).toBe(8);
  });

  it("修改文本内容并保留坐标", () => {
    const text = new Text("t1", 10, 20, "old");
    canvas.addShape(text);

    new SetAttributeCommand(canvas, text, { text: "Hello World" }).execute();

    expect(text.getContent()).toBe("Hello World");
    expect(text.getX()).toBe(10);
    expect(text.getY()).toBe(20);
  });

  it("修改填充、描边与描边宽度", () => {
    const rect = new Rect("r1", 0, 0, 1, 1);
    canvas.addShape(rect);

    new SetAttributeCommand(canvas, rect, { fill: "red", stroke: "blue", strokeWidth: 3 }).execute();

    expect(rect.getStyle().fill).toBe("red");
    expect(rect.getStyle().stroke).toBe("blue");
    expect(rect.getStyle().strokeWidth).toBe(3);
  });

  it("stroke 设为 null 表示取消描边", () => {
    const rect = new Rect("r1", 0, 0, 1, 1);
    canvas.addShape(rect);

    new SetAttributeCommand(canvas, rect, { stroke: null }).execute();

    expect(rect.getStyle().stroke).toBeNull();
  });

  it("只覆盖给出的属性，其余保持原值", () => {
    const rect = new Rect("r1", 10, 20, 100, 60);
    canvas.addShape(rect);

    new SetAttributeCommand(canvas, rect, { width: 200 }).execute();

    expect(rect.getX()).toBe(10);
    expect(rect.getY()).toBe(20);
    expect(rect.getWidth()).toBe(200);
    expect(rect.getHeight()).toBe(60);
  });

  it("undo 把所有已修改属性恢复为旧值", () => {
    const rect = new Rect("r1", 10, 20, 100, 60);
    canvas.addShape(rect);
    const command = new SetAttributeCommand(canvas, rect, {
      x: 50,
      width: 200,
      fill: "blue",
    });
    command.execute();

    command.undo();

    expect(rect.getX()).toBe(10);
    expect(rect.getWidth()).toBe(100);
    expect(rect.getStyle().fill).toBe("#000000");
    expect(rect.getY()).toBe(20);
    expect(rect.getHeight()).toBe(60);
  });

  it("redo 重新应用补丁", () => {
    const rect = new Rect("r1", 10, 20, 100, 60);
    canvas.addShape(rect);
    const manager = new CommandManager();
    manager.execute(new SetAttributeCommand(canvas, rect, { x: 50, fill: "blue" }));

    manager.undo();
    expect(rect.getX()).toBe(10);

    manager.redo();

    expect(rect.getX()).toBe(50);
    expect(rect.getStyle().fill).toBe("blue");
  });

  it("图形不支持的属性抛 CommandError", () => {
    const rect = new Rect("r1", 0, 0, 1, 1);
    canvas.addShape(rect);

    const command = new SetAttributeCommand(canvas, rect, { radius: 5 });

    expect(() => command.execute()).toThrow(CommandError);
    expect(() => command.execute()).toThrow(/不支持/);
  });

  it("空补丁在构造时被拒绝", () => {
    const rect = new Rect("r1", 0, 0, 1, 1);

    expect(() => new SetAttributeCommand(canvas, rect, {})).toThrow(CommandError);
    expect(() => new SetAttributeCommand(canvas, rect, {})).toThrow(/至少/);
  });

  it("命令名为 set 且可撤销", () => {
    const command = new SetAttributeCommand(canvas, new Rect("r1", 0, 0, 1, 1), { x: 1 });

    expect(command.getName()).toBe("set");
    expect(command.isUndoable()).toBe(true);
  });

  it("组合节点只允许修改样式，几何属性被拒绝", () => {
    const first = new Rect("a", 0, 0, 1, 1);
    const second = new Rect("b", 1, 1, 1, 1);
    canvas.addShape(first);
    canvas.addShape(second);
    const group = canvas.groupShapes([first, second], "g1");

    new SetAttributeCommand(canvas, group, { fill: "green" }).execute();
    expect(group.getStyle().fill).toBe("green");

    expect(() => new SetAttributeCommand(canvas, group, { x: 10 }).execute()).toThrow(/不支持/);
  });
});
