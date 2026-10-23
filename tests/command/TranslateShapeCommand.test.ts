import { TranslateShapeCommand } from "../../src/command/TranslateShapeCommand";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { CommandError } from "../../src/errors/CommandError";
import { Rect } from "../../src/shapes/Rect";
import { RecordingObserver } from "../helpers/RecordingObserver";

/**
 * TranslateShapeCommand 的正逆向：execute 平移 (dx, dy)，undo 平移 (-dx, -dy)。
 * 组合节点的递归平移由 Shape 自己完成，命令不关心子节点。
 */
describe("TranslateShapeCommand", () => {
  let canvas: Canvas;
  let observer: RecordingObserver;

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
    observer = new RecordingObserver();
    canvas.attach(observer);
  });

  it("execute 平移图形并广播 move", () => {
    const rect = new Rect("r1", 10, 20, 5, 5);
    canvas.addShape(rect);
    observer.reset();

    new TranslateShapeCommand(canvas, rect, 5, -3).execute();

    expect(rect.getX()).toBe(15);
    expect(rect.getY()).toBe(17);
    expect(observer.operations()).toEqual(["move"]);
  });

  it("undo 反向平移恢复原坐标", () => {
    const rect = new Rect("r1", 10, 20, 5, 5);
    canvas.addShape(rect);
    observer.reset();
    const command = new TranslateShapeCommand(canvas, rect, 5, -3);
    command.execute();

    command.undo();

    expect(rect.getX()).toBe(10);
    expect(rect.getY()).toBe(20);
    expect(observer.operations()).toEqual(["move", "move"]);
  });

  it("平移组合节点时递归作用于全部后代", () => {
    const first = new Rect("a", 0, 0, 1, 1);
    const second = new Rect("b", 100, 0, 1, 1);
    canvas.addShape(first);
    canvas.addShape(second);
    const group = canvas.groupShapes([first, second], "g1");
    const command = new TranslateShapeCommand(canvas, group, 5, 7);

    command.execute();

    expect(first.getX()).toBe(5);
    expect(first.getY()).toBe(7);
    expect(second.getX()).toBe(105);

    command.undo();

    expect(first.getX()).toBe(0);
    expect(second.getX()).toBe(100);
  });

  it("平移根节点抛 CommandError", () => {
    expect(
      () => new TranslateShapeCommand(canvas, canvas.getRoot(), 1, 1).execute(),
    ).toThrow(CommandError);
  });

  it("零位移也保持结构不变", () => {
    const rect = new Rect("r1", 10, 20, 5, 5);
    canvas.addShape(rect);

    new TranslateShapeCommand(canvas, rect, 0, 0).execute();

    expect(rect.getX()).toBe(10);
    expect(rect.getY()).toBe(20);
  });

  it("命令名为 translate", () => {
    expect(
      new TranslateShapeCommand(canvas, new Rect("r1", 0, 0, 1, 1), 1, 1).getName(),
    ).toBe("translate");
  });
});
