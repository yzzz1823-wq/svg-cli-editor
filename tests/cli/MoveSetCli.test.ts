import { CliError } from "../../src/errors/CliError";
import { TranslateShapeCommand } from "../../src/command/TranslateShapeCommand";
import { Circle } from "../../src/shapes/Circle";
import { Rect } from "../../src/shapes/Rect";
import { Text } from "../../src/shapes/Text";
import { createCliHarness } from "../helpers/CliHarness";

/** move：translate 的新名字；set：位置参数 + 白名单。 */
describe("move 与 set 的规范化语法", () => {
  it("move 映射为平移命令并生效", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 10 10");

    const command = harness.factory.create(harness.parse("move r1 5 -5"));
    expect(command).toBeInstanceOf(TranslateShapeCommand);
    harness.run("move r1 5 -5");

    const rect = harness.canvas.findShape("r1") as Rect;
    expect(rect.getX()).toBe(5);
    expect(rect.getY()).toBe(-5);
  });

  it("set 用位置参数修改填充色", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 10 10");

    harness.run("set r1 fill red");

    expect((harness.canvas.findShape("r1") as Rect).getStyle().fill).toBe("red");
  });

  it("set 用位置参数修改几何属性且不影响其它字段", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 10 20 100 60");

    harness.run("set r1 width 50");

    const rect = harness.canvas.findShape("r1") as Rect;
    expect(rect.getWidth()).toBe(50);
    expect(rect.getHeight()).toBe(60);
    expect(rect.getX()).toBe(10);
  });

  it("set text 保留引号内容", () => {
    const harness = createCliHarness();
    harness.run('create text t1 10 20 "old"');

    harness.run('set t1 text "Hello World"');

    expect((harness.canvas.findShape("t1") as Text).getContent()).toBe("Hello World");
  });

  it("set stroke 与 stroke-width 生效", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 10 10");

    harness.run("set r1 stroke blue");
    harness.run("set r1 stroke-width 3");

    const style = (harness.canvas.findShape("r1") as Rect).getStyle();
    expect(style.stroke).toBe("blue");
    expect(style.strokeWidth).toBe(3);
  });

  it("set stroke none 表示取消描边", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 10 10");

    harness.run("set r1 stroke none");

    expect((harness.canvas.findShape("r1") as Rect).getStyle().stroke).toBeNull();
  });

  it("set r 归一化为半径", () => {
    const harness = createCliHarness();
    harness.run("create circle c1 0 0 5");

    harness.run("set c1 r 12");

    expect((harness.canvas.findShape("c1") as Circle).getRadius()).toBe(12);
  });

  it("白名单之外属性报 unknown attribute", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 1 1");

    expect(() => harness.run("set r1 foo bar")).toThrow(CliError);
    expect(() => harness.run("set r1 foo bar")).toThrow(/unknown attribute: foo/);
  });

  it("缺少值给出用法提示", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 1 1");

    expect(() => harness.run("set r1 fill")).toThrow(/用法/);
  });

  it("未知图形报找不到图形", () => {
    const harness = createCliHarness();
    expect(() => harness.run("set ghost fill red")).toThrow(/no such shape/);
  });

  it("位置参数形式的 set 可撤销", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 10 10");
    harness.run("set r1 fill red");

    harness.manager.undo();

    expect((harness.canvas.findShape("r1") as Rect).getStyle().fill).toBe("#000000");
  });
});
