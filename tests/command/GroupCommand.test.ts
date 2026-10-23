import { GroupCommand } from "../../src/command/GroupCommand";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { Container } from "../../src/core/Container";
import { CommandError } from "../../src/errors/CommandError";
import { Rect } from "../../src/shapes/Rect";

/**
 * GroupCommand 的正逆向：execute 把同级节点收拢成组，undo 解散回原位。
 * 组的位置与组内顺序都由 Canvas.groupShapes 决定，命令只提供成员与组名。
 */
describe("GroupCommand", () => {
  let canvas: Canvas;

  const add = (name: string): Rect => {
    const rect = new Rect(name, 0, 0, 10, 10);
    canvas.addShape(rect);
    return rect;
  };

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
  });

  it("execute 收拢成组并保持文档顺序", () => {
    const first = add("a");
    const second = add("b");
    add("c");

    new GroupCommand(canvas, [first, second], "g1").execute();

    const names = canvas.getRoot().getChildren().map((shape) => shape.getName());
    expect(names).toEqual(["g1", "c"]);
    const group = canvas.getRoot().getChildren()[0] as Container;
    expect(group.getChildren().map((shape) => shape.getName())).toEqual(["a", "b"]);
    expect(first.getParent()).toBe(group);
  });

  it("新组插入到最靠前的选中节点位置", () => {
    const first = add("a");
    add("b");
    const third = add("c");

    new GroupCommand(canvas, [first, third], "g1").execute();

    expect(canvas.getRoot().getChildren().map((shape) => shape.getName())).toEqual(["g1", "b"]);
    const group = canvas.getRoot().getChildren()[0] as Container;
    expect(group.getChildren().map((shape) => shape.getName())).toEqual(["a", "c"]);
  });

  it("undo 解散并恢复原始同级顺序", () => {
    const first = add("a");
    const second = add("b");
    const command = new GroupCommand(canvas, [first, second], "g1");
    command.execute();

    command.undo();

    expect(canvas.getRoot().getChildren().map((shape) => shape.getName())).toEqual(["a", "b"]);
    expect(canvas.findShape("g1")).toBeNull();
    expect(first.getParent()).toBe(canvas.getRoot());
  });

  it("成员不足两个时抛 CommandError 且文档不变", () => {
    const only = add("a");

    expect(() => new GroupCommand(canvas, [only], "g1").execute()).toThrow(CommandError);
    expect(canvas.getRoot().getChildren().map((shape) => shape.getName())).toEqual(["a"]);
  });

  it("组名重复时抛 CommandError", () => {
    const first = add("a");
    const second = add("b");
    canvas.addShape(new Rect("g1", 0, 0, 1, 1));

    expect(() => new GroupCommand(canvas, [first, second], "g1").execute()).toThrow(CommandError);
  });

  it("命令名为 group", () => {
    const first = add("a");
    const second = add("b");

    expect(new GroupCommand(canvas, [first, second], "g1").getName()).toBe("group");
  });
});
