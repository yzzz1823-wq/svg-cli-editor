import { CliError } from "../../src/errors/CliError";
import { CommandError } from "../../src/errors/CommandError";
import { Circle } from "../../src/shapes/Circle";
import { Ellipse } from "../../src/shapes/Ellipse";
import { Group } from "../../src/shapes/Group";
import { Line } from "../../src/shapes/Line";
import { Rect } from "../../src/shapes/Rect";
import { Text } from "../../src/shapes/Text";
import { createCliHarness } from "../helpers/CliHarness";

/** create：位置参数语法 + 可选 in <容器>。 */
describe("create 命令", () => {
  it("rect 使用位置参数并接受可选 fill", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 10 20 100 60 #ff0000");

    const rect = harness.canvas.findShape("r1") as Rect;
    expect(rect.getX()).toBe(10);
    expect(rect.getY()).toBe(20);
    expect(rect.getWidth()).toBe(100);
    expect(rect.getHeight()).toBe(60);
    expect(rect.getStyle().fill).toBe("#ff0000");
  });

  it("circle、ellipse 使用各自的位置参数", () => {
    const harness = createCliHarness();
    harness.run("create circle c1 5 6 7 blue");
    harness.run("create ellipse e1 1 2 3 4");

    const circle = harness.canvas.findShape("c1") as Circle;
    expect(circle.getCx()).toBe(5);
    expect(circle.getCy()).toBe(6);
    expect(circle.getRadius()).toBe(7);
    expect(circle.getStyle().fill).toBe("blue");

    const ellipse = harness.canvas.findShape("e1") as Ellipse;
    expect(ellipse.getCx()).toBe(1);
    expect(ellipse.getCy()).toBe(2);
    expect(ellipse.getRx()).toBe(3);
    expect(ellipse.getRy()).toBe(4);
  });

  it("line 使用两端点并可指定 stroke", () => {
    const harness = createCliHarness();
    harness.run("create line l1 0 0 10 20 red");

    const line = harness.canvas.findShape("l1") as Line;
    expect(line.getX1()).toBe(0);
    expect(line.getY1()).toBe(0);
    expect(line.getX2()).toBe(10);
    expect(line.getY2()).toBe(20);
    expect(line.getStyle().stroke).toBe("red");
  });

  it("text 保留引号内的空格内容", () => {
    const harness = createCliHarness();
    harness.run('create text t1 10 20 "Hello World"');

    const text = harness.canvas.findShape("t1") as Text;
    expect(text.getX()).toBe(10);
    expect(text.getY()).toBe(20);
    expect(text.getContent()).toBe("Hello World");
  });

  it("create g 创建空组", () => {
    const harness = createCliHarness();
    harness.run("create g g1");

    const group = harness.canvas.findShape("g1") as Group;
    expect(group).toBeInstanceOf(Group);
    expect(group.childCount()).toBe(0);
  });

  it("in <容器> 把新图形挂到组末尾", () => {
    const harness = createCliHarness();
    harness.run("create g g1");
    harness.run("create rect r1 0 0 10 10");
    harness.run("create rect r2 1 1 2 2 in g1");

    const group = harness.canvas.findShape("g1") as Group;
    expect(group.childCount()).toBe(1);
    expect(group.getChildren()[0]?.getName()).toBe("r2");
    expect(group.getChildren()[0]?.getParent()).toBe(group);
    expect(harness.canvas.getRoot().childCount()).toBe(2);
  });

  it("in 容器不存在时报错", () => {
    const harness = createCliHarness();
    expect(() => harness.run("create rect r1 0 0 1 1 in ghost")).toThrow(CliError);
    expect(() => harness.run("create rect r1 0 0 1 1 in ghost")).toThrow(/no such container/);
  });

  it("in 目标不是分组时报错", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 1 1");

    expect(() => harness.run("create rect r2 0 0 1 1 in r1")).toThrow(CliError);
    expect(() => harness.run("create rect r2 0 0 1 1 in r1")).toThrow(/not a container/);
  });

  it("缺少位置参数给出用法提示", () => {
    const harness = createCliHarness();
    expect(() => harness.run("create rect r1 1 2")).toThrow(/用法/);
    expect(() => harness.run("create g g1 extra")).toThrow(/用法/);
  });

  it("非数字参数被拒绝", () => {
    const harness = createCliHarness();
    expect(() => harness.run("create rect r1 x 2 3 4")).toThrow(/数字/);
  });

  it("未知类型给出插件提示", () => {
    const harness = createCliHarness();
    expect(() => harness.run("create star s1")).toThrow(/unknown shape type/);
  });

  it("重复 id 在 execute 时抛 CommandError", () => {
    const harness = createCliHarness();
    harness.run("create rect r1 0 0 1 1");
    expect(() => harness.run("create rect r1 2 2 3 3")).toThrow(CommandError);
  });
});
