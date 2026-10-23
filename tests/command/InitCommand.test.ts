import { InitCommand } from "../../src/command/InitCommand";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { CommandError } from "../../src/errors/CommandError";
import { Rect } from "../../src/shapes/Rect";
import { RecordingObserver } from "../helpers/RecordingObserver";

/**
 * InitCommand 是文档级命令：重置为默认尺寸的空画布，广播 document，
 * 本身不可撤销（CommandManager 会清空历史，不允许撤销到上一个文档）。
 */
describe("InitCommand", () => {
  let canvas: Canvas;
  let observer: RecordingObserver;

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
    observer = new RecordingObserver();
    canvas.attach(observer);
  });

  it("execute 重置为 800×600 的空文档", () => {
    canvas.addShape(new Rect("r1", 0, 0, 10, 10));
    observer.reset();

    new InitCommand(canvas).execute();

    expect(canvas.getWidth()).toBe(800);
    expect(canvas.getHeight()).toBe(600);
    expect(canvas.getRoot().childCount()).toBe(0);
    expect(canvas.findShape("r1")).toBeNull();
  });

  it("执行后广播 document 事件", () => {
    new InitCommand(canvas).execute();

    expect(observer.operations()).toEqual(["document"]);
  });

  it("是文档级命令：不可撤销", () => {
    expect(new InitCommand(canvas).isUndoable()).toBe(false);
  });

  it("直接调用 undo 抛 CommandError", () => {
    const command = new InitCommand(canvas);
    command.execute();

    expect(() => command.undo()).toThrow(CommandError);
  });

  it("命令名为 init", () => {
    expect(new InitCommand(canvas).getName()).toBe("init");
  });
});
