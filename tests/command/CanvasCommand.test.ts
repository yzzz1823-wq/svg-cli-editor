import { CanvasCommand } from "../../src/command/CanvasCommand";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { CommandError } from "../../src/errors/CommandError";
import { Rect } from "../../src/shapes/Rect";
import { RecordingObserver } from "../helpers/RecordingObserver";

/**
 * CanvasCommand 是文档级命令：只修改画布尺寸，保留画布上已有的全部图形。
 * 尺寸在构造时校验，非法输入不允许变成一条“执行到一半才失败”的命令。
 */
describe("CanvasCommand", () => {
  let canvas: Canvas;
  let observer: RecordingObserver;

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
    observer = new RecordingObserver();
    canvas.attach(observer);
  });

  it("execute 更新尺寸且保留原有图形", () => {
    canvas.addShape(new Rect("r1", 10, 20, 100, 60));
    observer.reset();

    new CanvasCommand(canvas, 1024, 768).execute();

    expect(canvas.getWidth()).toBe(1024);
    expect(canvas.getHeight()).toBe(768);
    expect(canvas.getRoot().childCount()).toBe(1);

    const shape = canvas.findShape("r1");
    expect(shape).toBeInstanceOf(Rect);
    expect((shape as Rect).getX()).toBe(10);
    expect((shape as Rect).getY()).toBe(20);
    expect((shape as Rect).getWidth()).toBe(100);
    expect((shape as Rect).getHeight()).toBe(60);
  });

  it("执行后广播 document 事件", () => {
    new CanvasCommand(canvas, 1024, 768).execute();

    expect(observer.operations()).toEqual(["document"]);
  });

  it("是文档级命令：不可撤销", () => {
    expect(new CanvasCommand(canvas, 100, 100).isUndoable()).toBe(false);
  });

  it("直接调用 undo 抛 CommandError", () => {
    const command = new CanvasCommand(canvas, 100, 100);
    command.execute();

    expect(() => command.undo()).toThrow(CommandError);
  });

  it("非法尺寸在构造时抛 CommandError", () => {
    expect(() => new CanvasCommand(canvas, 0, 600)).toThrow(CommandError);
    expect(() => new CanvasCommand(canvas, 800, -1)).toThrow(CommandError);
    expect(() => new CanvasCommand(canvas, 1.5, 600)).toThrow(CommandError);
    expect(() => new CanvasCommand(canvas, Number.NaN, 600)).toThrow(CommandError);
  });

  it("命令名为 canvas", () => {
    expect(new CanvasCommand(canvas, 100, 100).getName()).toBe("canvas");
  });
});
