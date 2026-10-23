import { AddToContainerCommand } from "../../src/command/AddToContainerCommand";
import { CommandError } from "../../src/errors/CommandError";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import type { Container } from "../../src/core/Container";
import { Rect } from "../../src/shapes/Rect";

interface Fixture {
  readonly canvas: Canvas;
  readonly group: Container;
  readonly a: Rect;
  readonly b: Rect;
  readonly c: Rect;
}

const setup = (): Fixture => {
  const canvas = new Canvas(new DefaultContainerFactory());
  const a = new Rect("a", 0, 0, 1, 1);
  const b = new Rect("b", 0, 0, 1, 1);
  const c = new Rect("c", 0, 0, 1, 1);
  canvas.addShape(a);
  canvas.addShape(b);
  canvas.addShape(c);
  const group = canvas.groupShapes([a, b], "g1");
  return { canvas, group, a, b, c };
};

const names = (shapes: readonly { getName(): string }[]): readonly string[] =>
  shapes.map((shape) => shape.getName());

describe("AddToContainerCommand", () => {
  it("execute 把图形移到目标容器末尾", () => {
    const { canvas, group, c } = setup();

    new AddToContainerCommand(canvas, c, group).execute();

    expect(names(group.getChildren())).toEqual(["a", "b", "c"]);
    expect(names(canvas.getRoot().getChildren())).toEqual(["g1"]);
    expect(c.getParent()).toBe(group);
  });

  it("undo 放回原父容器的原下标", () => {
    const { canvas, group, c } = setup();
    const command = new AddToContainerCommand(canvas, c, group);
    command.execute();

    command.undo();

    expect(group.getChildren().map((child) => child.getName())).toEqual(["a", "b"]);
    expect(names(canvas.getRoot().getChildren())).toEqual(["g1", "c"]);
    expect(c.getParent()).toBe(canvas.getRoot());
  });

  it("redo 再次移入目标末尾", () => {
    const { canvas, group, c } = setup();
    const command = new AddToContainerCommand(canvas, c, group);
    command.execute();
    command.undo();

    command.execute();

    expect(names(group.getChildren())).toEqual(["a", "b", "c"]);
  });

  it("组内节点移入同组时排到末尾", () => {
    const { canvas, group, a } = setup();

    new AddToContainerCommand(canvas, a, group).execute();

    expect(names(group.getChildren())).toEqual(["b", "a"]);
  });

  it("拒绝把容器移入自身", () => {
    const { canvas, group } = setup();
    const command = new AddToContainerCommand(canvas, group, group);

    expect(() => command.execute()).toThrow(CommandError);
    expect(() => command.execute()).toThrow(/自身|后代/);
  });

  it("拒绝把容器移入自己的后代", () => {
    const { canvas, group, a, b } = setup();
    const inner = canvas.groupShapes([a, b], "inner");

    expect(inner.getParent()).toBe(group);
    const command = new AddToContainerCommand(canvas, group, inner);
    expect(() => command.execute()).toThrow(/自身|后代/);
  });
});
