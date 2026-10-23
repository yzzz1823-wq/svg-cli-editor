import { Group } from "../../src/shapes/Group";
import { Rect } from "../../src/shapes/Rect";
import { createCliHarness } from "../helpers/CliHarness";

const names = (shapes: readonly { getName(): string }[]): readonly string[] =>
  shapes.map((shape) => shape.getName());

/** addto / front / back 的 CLI 集成：结构变化 + 撤销。 */
describe("层级结构命令", () => {
  it("addto 把图形移入组末尾，undo 恢复原位置", () => {
    const harness = createCliHarness();
    harness.executeLine("create g g1");
    harness.executeLine("create rect r1 0 0 1 1");
    harness.executeLine("create rect r2 0 0 2 2");

    harness.executeLine("addto g1 r1");

    const group = harness.canvas.findShape("g1") as Group;
    expect(names(group.getChildren())).toEqual(["r1"]);
    expect(names(harness.canvas.getRoot().getChildren())).toEqual(["g1", "r2"]);

    harness.executeLine("undo");

    expect(group.childCount()).toBe(0);
    expect(names(harness.canvas.getRoot().getChildren())).toEqual(["g1", "r1", "r2"]);
  });

  it("addto 未知容器给出友好错误", () => {
    const harness = createCliHarness();
    harness.executeLine("create rect r1 0 0 1 1");

    harness.executeLine("addto ghost r1");

    expect(harness.output.all()).toContain("no such container: ghost");
  });

  it("addto 目标不是分组时报错", () => {
    const harness = createCliHarness();
    harness.executeLine("create rect r1 0 0 1 1");
    harness.executeLine("create rect r2 0 0 2 2");

    harness.executeLine("addto r1 r2");

    expect(harness.output.all()).toContain("not a container: r1");
  });

  it("front 把图形移到同级末尾，undo 恢复原位", () => {
    const harness = createCliHarness();
    harness.executeLine("create rect a 0 0 1 1");
    harness.executeLine("create rect b 0 0 1 1");
    harness.executeLine("create rect c 0 0 1 1");
    const root = harness.canvas.getRoot();

    harness.executeLine("front a");
    expect(names(root.getChildren())).toEqual(["b", "c", "a"]);

    harness.executeLine("undo");
    expect(names(root.getChildren())).toEqual(["a", "b", "c"]);
  });

  it("back 把图形移到同级开头，redo 可重复", () => {
    const harness = createCliHarness();
    harness.executeLine("create rect a 0 0 1 1");
    harness.executeLine("create rect b 0 0 1 1");
    harness.executeLine("create rect c 0 0 1 1");
    const root = harness.canvas.getRoot();

    harness.executeLine("back c");
    expect(names(root.getChildren())).toEqual(["c", "a", "b"]);

    harness.executeLine("undo");
    expect(names(root.getChildren())).toEqual(["a", "b", "c"]);

    harness.executeLine("redo");
    expect(names(root.getChildren())).toEqual(["c", "a", "b"]);
  });
});
