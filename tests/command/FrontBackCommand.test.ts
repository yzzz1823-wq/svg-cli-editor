import { BringToFrontCommand } from "../../src/command/BringToFrontCommand";
import { SendToBackCommand } from "../../src/command/SendToBackCommand";
import { CommandError } from "../../src/errors/CommandError";
import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { Rect } from "../../src/shapes/Rect";

interface Fixture {
  readonly canvas: Canvas;
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
  return { canvas, a, b, c };
};

const names = (shapes: readonly { getName(): string }[]): readonly string[] =>
  shapes.map((shape) => shape.getName());

describe("BringToFrontCommand", () => {
  it("execute 移到同级末尾，undo 恢复原下标", () => {
    const { canvas, a } = setup();
    const command = new BringToFrontCommand(canvas, a);

    command.execute();
    expect(names(canvas.getRoot().getChildren())).toEqual(["b", "c", "a"]);

    command.undo();
    expect(names(canvas.getRoot().getChildren())).toEqual(["a", "b", "c"]);
  });

  it("重复 execute 幂等", () => {
    const { canvas, c } = setup();
    const command = new BringToFrontCommand(canvas, c);

    command.execute();
    command.execute();

    expect(names(canvas.getRoot().getChildren())).toEqual(["a", "b", "c"]);
  });

  it("对根节点报错", () => {
    const { canvas } = setup();
    const command = new BringToFrontCommand(canvas, canvas.getRoot());

    expect(() => command.execute()).toThrow(CommandError);
  });
});

describe("SendToBackCommand", () => {
  it("execute 移到同级开头，undo 恢复原下标", () => {
    const { canvas, c } = setup();
    const command = new SendToBackCommand(canvas, c);

    command.execute();
    expect(names(canvas.getRoot().getChildren())).toEqual(["c", "a", "b"]);

    command.undo();
    expect(names(canvas.getRoot().getChildren())).toEqual(["a", "b", "c"]);
  });

  it("对根节点报错", () => {
    const { canvas } = setup();
    const command = new SendToBackCommand(canvas, canvas.getRoot());

    expect(() => command.execute()).toThrow(CommandError);
  });
});
