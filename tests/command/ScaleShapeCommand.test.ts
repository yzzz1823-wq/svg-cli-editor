import { ScaleShapeCommand } from "../../src/command/ScaleShapeCommand";
import { CommandManager } from "../../src/command/CommandManager";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { CommandError } from "../../src/errors/CommandError";
import { Circle } from "../../src/shapes/Circle";
import { Rect } from "../../src/shapes/Rect";
import { Text } from "../../src/shapes/Text";
import { RecordingObserver } from "../helpers/RecordingObserver";

/**
 * ScaleShapeCommand：execute 以原点为基准按倍数缩放，undo 除以倍数还原。
 * 组合节点的递归缩放由 Shape.scale 自己完成，命令不感知子节点。
 */
describe("ScaleShapeCommand", () => {
  let canvas: Canvas;
  let observer: RecordingObserver;

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
    observer = new RecordingObserver();
    canvas.attach(observer);
  });

  it("execute 缩放矩形几何并广播 scale", () => {
    const rect = new Rect("r1", 10, 20, 100, 60);
    canvas.addShape(rect);
    observer.reset();

    new ScaleShapeCommand(canvas, rect, 1.5).execute();

    expect(rect.getX()).toBe(15);
    expect(rect.getY()).toBe(30);
    expect(rect.getWidth()).toBe(150);
    expect(rect.getHeight()).toBe(90);
    expect(observer.operations()).toEqual(["scale"]);
  });

  it("undo 除以倍数后恢复原尺寸", () => {
    const rect = new Rect("r1", 10, 20, 100, 60);
    canvas.addShape(rect);
    const command = new ScaleShapeCommand(canvas, rect, 2);
    command.execute();

    command.undo();

    expect(rect.getX()).toBe(10);
    expect(rect.getY()).toBe(20);
    expect(rect.getWidth()).toBe(100);
    expect(rect.getHeight()).toBe(60);
  });

  it("缩放组合节点时递归作用于全部后代", () => {
    const rect = new Rect("a", 0, 0, 10, 10);
    const circle = new Circle("c", 10, 20, 5);
    canvas.addShape(rect);
    canvas.addShape(circle);
    const group = canvas.groupShapes([rect, circle], "g1");
    const command = new ScaleShapeCommand(canvas, group, 2);

    command.execute();

    expect(rect.getX()).toBe(0);
    expect(rect.getWidth()).toBe(20);
    expect(circle.getCx()).toBe(20);
    expect(circle.getCy()).toBe(40);
    expect(circle.getRadius()).toBe(10);

    command.undo();

    expect(rect.getWidth()).toBe(10);
    expect(circle.getRadius()).toBe(5);
  });

  it("缩放文本只缩放坐标，文字内容不变", () => {
    const text = new Text("t1", 10, 20, "Hello");
    canvas.addShape(text);

    new ScaleShapeCommand(canvas, text, 2).execute();

    expect(text.getX()).toBe(20);
    expect(text.getY()).toBe(40);
    expect(text.getContent()).toBe("Hello");
  });

  it("系数为 0 时构造即抛 CommandError 并提示必须为正", () => {
    const rect = new Rect("r1", 0, 0, 1, 1);

    expect(() => new ScaleShapeCommand(canvas, rect, 0)).toThrow(CommandError);
    expect(() => new ScaleShapeCommand(canvas, rect, 0)).toThrow(/scale factor must be positive/);
  });

  it("负系数同样被拒绝", () => {
    const rect = new Rect("r1", 0, 0, 1, 1);

    expect(() => new ScaleShapeCommand(canvas, rect, -2)).toThrow(CommandError);
    expect(() => new ScaleShapeCommand(canvas, rect, -2)).toThrow(/scale factor must be positive/);
  });

  it("非有限系数被拒绝", () => {
    const rect = new Rect("r1", 0, 0, 1, 1);

    expect(() => new ScaleShapeCommand(canvas, rect, Number.NaN)).toThrow(CommandError);
  });

  it("命令名为 scale 且可撤销", () => {
    const command = new ScaleShapeCommand(canvas, new Rect("r1", 0, 0, 1, 1), 2);

    expect(command.getName()).toBe("scale");
    expect(command.isUndoable()).toBe(true);
  });

  it("经 CommandManager 执行后可撤销并重做", () => {
    const rect = new Rect("r1", 0, 0, 10, 10);
    canvas.addShape(rect);
    const manager = new CommandManager();

    manager.execute(new ScaleShapeCommand(canvas, rect, 3));
    expect(rect.getWidth()).toBe(30);

    manager.undo();
    expect(rect.getWidth()).toBe(10);

    manager.redo();
    expect(rect.getWidth()).toBe(30);
  });
});
