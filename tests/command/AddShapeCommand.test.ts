import { AddShapeCommand } from "../../src/command/AddShapeCommand";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { CommandError } from "../../src/errors/CommandError";
import { Group } from "../../src/shapes/Group";
import { Rect } from "../../src/shapes/Rect";
import { RecordingObserver } from "../helpers/RecordingObserver";

/**
 * AddShapeCommand 的正逆向：execute 追加到容器，undo 摘除。
 * 结构变更全部委托 Canvas，命令本身只保留“要加什么、加到哪”。
 */
describe("AddShapeCommand", () => {
  let canvas: Canvas;
  let observer: RecordingObserver;

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
    observer = new RecordingObserver();
    canvas.attach(observer);
  });

  it("execute 把图形追加到根节点末尾并广播 add", () => {
    const rect = new Rect("r1", 0, 0, 10, 10);

    new AddShapeCommand(canvas, rect).execute();

    expect(canvas.getRoot().getChildren().map((shape) => shape.getName())).toEqual(["r1"]);
    expect(rect.getParent()).toBe(canvas.getRoot());
    expect(observer.operations()).toEqual(["add"]);
  });

  it("execute 支持挂到指定容器", () => {
    const group = new Group("g1");
    canvas.addShape(group);
    const rect = new Rect("r1", 0, 0, 10, 10);
    observer.reset();

    new AddShapeCommand(canvas, rect, group).execute();

    expect(group.getChildren().map((shape) => shape.getName())).toEqual(["r1"]);
    expect(rect.getParent()).toBe(group);
    expect(observer.operations()).toEqual(["add"]);
  });

  it("undo 摘除图形并恢复空文档", () => {
    const rect = new Rect("r1", 0, 0, 10, 10);
    const command = new AddShapeCommand(canvas, rect);
    command.execute();

    command.undo();

    expect(canvas.getRoot().childCount()).toBe(0);
    expect(canvas.findShape("r1")).toBeNull();
    expect(rect.getParent()).toBeNull();
    expect(observer.operations()).toEqual(["add", "remove"]);
  });

  it("名称冲突时抛 CommandError 且文档不变", () => {
    canvas.addShape(new Rect("r1", 0, 0, 1, 1));
    const command = new AddShapeCommand(canvas, new Rect("r1", 0, 0, 2, 2));

    expect(() => command.execute()).toThrow(CommandError);
    expect(canvas.getRoot().childCount()).toBe(1);
  });

  it("命令名为 add", () => {
    expect(new AddShapeCommand(canvas, new Rect("r1", 0, 0, 1, 1)).getName()).toBe("add");
  });
});
