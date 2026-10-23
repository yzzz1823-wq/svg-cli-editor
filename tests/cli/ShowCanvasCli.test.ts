import { createCliHarness } from "../helpers/CliHarness";

/** show 与 canvas 的显示语义：输出到终端、不进入撤销栈。 */
describe("show 与 canvas 显示命令", () => {
  it("show 输出单个图形的完整属性明细", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 10 20 100 60 #ff0000");
    harness.run("create circle c1 5 6 7");

    harness.executeLine("show r1");

    const text = harness.output.all();
    expect(text).toContain("shape: r1 (rect)");
    expect(text).toContain("x: 10");
    expect(text).toContain("y: 20");
    expect(text).toContain("width: 100");
    expect(text).toContain("height: 60");
    expect(text).toContain("fill: #ff0000");
    expect(text).toContain("stroke: none");
    expect(text).toContain("stroke-width: 1");
  });

  it("show 未知图形给出友好错误", () => {
    const harness = createCliHarness();
    harness.executeLine("show ghost");

    expect(harness.output.all()).toContain("no such shape: ghost");
  });

  it("show 组时输出子节点数量", () => {
    const harness = createCliHarness();
    harness.executeLine("create g g1");

    harness.executeLine("show g1");

    expect(harness.output.all()).toContain("shape: g1 (g)");
    expect(harness.output.all()).toContain("children: 0");
  });

  it("show 不进入撤销栈", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 1 1");

    harness.executeLine("show r1");
    harness.executeLine("undo");

    expect(harness.canvas.findShape("r1")).toBeNull();
  });

  it("canvas 无参输出当前尺寸", () => {
    const harness = createCliHarness();
    harness.executeLine("canvas");

    expect(harness.output.all()).toContain("canvas size: 800x600");
  });

  it("canvas 带参调整尺寸后，无参输出新尺寸", () => {
    const harness = createCliHarness();
    harness.executeLine("canvas 300 400");
    harness.executeLine("canvas");

    expect(harness.output.all()).toContain("canvas size: 300x400");
  });

  it("canvas 无参不进入撤销栈", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 1 1");

    harness.executeLine("canvas");
    harness.executeLine("undo");

    expect(harness.canvas.findShape("r1")).toBeNull();
  });
});
