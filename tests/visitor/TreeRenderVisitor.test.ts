import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import { Circle } from "../../src/shapes/Circle";
import { Group } from "../../src/shapes/Group";
import { Rect } from "../../src/shapes/Rect";
import { Text } from "../../src/shapes/Text";
import { TreeRenderVisitor } from "../../src/visitor/TreeRenderVisitor";

/**
 * tree 命令把文档渲染成终端树状文本（Visitor 实现）。
 * 格式：首行 "svg 宽x高"，空文档追加 "(empty)"；
 * 每个节点 "名称 [标签]"，文本节点额外带引号内容；
 * 分支用 ├─ / └─，下层延续线用 │ 与空格。
 */
describe("TreeRenderVisitor", () => {
  let canvas: Canvas;
  let visitor: TreeRenderVisitor;

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
    visitor = new TreeRenderVisitor();
  });

  it("空文档输出 svg 尺寸与 (empty)", () => {
    expect(visitor.render(canvas)).toBe(["svg 800x600", "(empty)"].join("\n"));
  });

  it("根层单个节点使用 └─ 分支", () => {
    canvas.addShape(new Rect("r1", 0, 0, 10, 10));

    expect(visitor.render(canvas)).toBe(["svg 800x600", "└─ r1 [rect]"].join("\n"));
  });

  it("组合节点递归渲染，子节点带延续线", () => {
    canvas.addShape(new Rect("r1", 0, 0, 10, 10));
    const group = new Group("g1");
    canvas.addShape(group);
    group.append(new Circle("c1", 0, 0, 5));
    group.append(new Text("t1", 0, 0, "Hello"));

    expect(visitor.render(canvas)).toBe(
      [
        "svg 800x600",
        "├─ r1 [rect]",
        "└─ g1 [g]",
        '   ├─ c1 [circle]',
        '   └─ t1 [text] "Hello"',
      ].join("\n"),
    );
  });

  it("多层分组逐级缩进", () => {
    const outer = new Group("g1");
    const inner = new Group("g2");
    outer.append(inner);
    inner.append(new Rect("a", 0, 0, 1, 1));
    canvas.addShape(outer);
    canvas.addShape(new Rect("b", 0, 0, 1, 1));

    expect(visitor.render(canvas)).toBe(
      [
        "svg 800x600",
        "├─ g1 [g]",
        "│  └─ g2 [g]",
        "│     └─ a [rect]",
        "└─ b [rect]",
      ].join("\n"),
    );
  });
});
