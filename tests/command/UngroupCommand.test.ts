import { UngroupCommand } from "../../src/command/UngroupCommand";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { Container } from "../../src/core/Container";
import { CommandError } from "../../src/errors/CommandError";
import { Rect } from "../../src/shapes/Rect";

/**
 * UngroupCommand 的正逆向：execute 解散组，undo 用同样的成员与组名重新成组。
 * “回到原位置”依赖 Canvas.groupShapes 的插入规则（插到最靠前成员处）。
 */
describe("UngroupCommand", () => {
  let canvas: Canvas;

  const add = (name: string): Rect => {
    const rect = new Rect(name, 0, 0, 10, 10);
    canvas.addShape(rect);
    return rect;
  };

  const groupOf = (names: readonly string[], groupName: string): Container => {
    const members = names.map((name) => add(name));
    return canvas.groupShapes(members, groupName);
  };

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
  });

  it("execute 解散组并让组脱离文档", () => {
    const group = groupOf(["a", "b"], "g1");

    new UngroupCommand(canvas, group).execute();

    expect(canvas.getRoot().getChildren().map((shape) => shape.getName())).toEqual(["a", "b"]);
    expect(group.getParent()).toBeNull();
    expect(canvas.findShape("g1")).toBeNull();
  });

  it("undo 用原成员与原组名重新成组，并回到原位置", () => {
    const group = groupOf(["a", "b"], "g1");
    add("c");
    const command = new UngroupCommand(canvas, group);
    command.execute();

    command.undo();

    expect(canvas.getRoot().getChildren().map((shape) => shape.getName())).toEqual(["g1", "c"]);
    const restored = canvas.getRoot().getChildren()[0] as Container;
    expect(restored.getName()).toBe("g1");
    expect(restored.getChildren().map((shape) => shape.getName())).toEqual(["a", "b"]);
  });

  it("解散根节点抛 CommandError", () => {
    expect(() => new UngroupCommand(canvas, canvas.getRoot()).execute()).toThrow(CommandError);
  });

  it("解散已脱离文档的组抛 CommandError", () => {
    const detached = groupOf(["a", "b"], "g1");
    new UngroupCommand(canvas, detached).execute();

    expect(() => new UngroupCommand(canvas, detached).execute()).toThrow(CommandError);
  });

  it("命令名为 ungroup", () => {
    const group = groupOf(["a", "b"], "g1");

    expect(new UngroupCommand(canvas, group).getName()).toBe("ungroup");
  });
});
