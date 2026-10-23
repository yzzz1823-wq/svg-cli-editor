import { RemoveShapeCommand } from "../../src/command/RemoveShapeCommand";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { Container } from "../../src/core/Container";
import { CommandError } from "../../src/errors/CommandError";
import { Rect } from "../../src/shapes/Rect";
import { RecordingObserver } from "../helpers/RecordingObserver";

/**
 * RemoveShapeCommand 的正逆向：execute 摘除（保留对象），undo 按原父容器与原下标放回。
 * 位置必须精确恢复，否则撤销后的文档顺序会和执行前不一致。
 */
describe("RemoveShapeCommand", () => {
  let canvas: Canvas;
  let observer: RecordingObserver;

  const add = (name: string): Rect => {
    const rect = new Rect(name, 0, 0, 10, 10);
    canvas.addShape(rect);
    return rect;
  };

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
    observer = new RecordingObserver();
    canvas.attach(observer);
  });

  it("execute 从文档摘除但保留对象本身", () => {
    const rect = add("r1");
    observer.reset();

    new RemoveShapeCommand(canvas, rect).execute();

    expect(canvas.findShape("r1")).toBeNull();
    expect(rect.getParent()).toBeNull();
    expect(canvas.getRoot().childCount()).toBe(0);
    expect(observer.operations()).toEqual(["remove"]);
  });

  it("undo 按原下标把图形放回", () => {
    add("r1");
    const second = add("r2");
    add("r3");
    const command = new RemoveShapeCommand(canvas, second);
    command.execute();

    command.undo();

    expect(canvas.getRoot().getChildren().map((shape) => shape.getName())).toEqual([
      "r1",
      "r2",
      "r3",
    ]);
    expect(second.getParent()).toBe(canvas.getRoot());
  });

  it("撤销后可重新执行（redo 语义）", () => {
    const rect = add("r1");
    const command = new RemoveShapeCommand(canvas, rect);
    command.execute();
    command.undo();

    command.execute();

    expect(canvas.findShape("r1")).toBeNull();
  });

  it("undo 恢复嵌套容器中的原位置", () => {
    const first = add("a");
    const second = add("b");
    const group = canvas.groupShapes([first, second], "g1") as Container;
    const command = new RemoveShapeCommand(canvas, second);
    command.execute();

    command.undo();

    expect(group.getChildren().map((shape) => shape.getName())).toEqual(["a", "b"]);
    expect(canvas.findShape("b")).toBe(second);
  });

  it("移除未挂载节点抛 CommandError", () => {
    const detached = new Rect("x", 0, 0, 1, 1);

    expect(() => new RemoveShapeCommand(canvas, detached).execute()).toThrow(CommandError);
  });

  it("移除根节点抛 CommandError", () => {
    expect(() => new RemoveShapeCommand(canvas, canvas.getRoot()).execute()).toThrow(CommandError);
  });

  it("命令名为 remove", () => {
    expect(new RemoveShapeCommand(canvas, add("r1")).getName()).toBe("remove");
  });
});
