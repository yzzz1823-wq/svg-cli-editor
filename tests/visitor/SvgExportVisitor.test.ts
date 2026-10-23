import { Canvas } from "../../src/core/Canvas";
import { DefaultContainerFactory } from "../../src/core/DefaultContainerFactory";
import type { ShapeStyle } from "../../src/core/ShapeStyle";
import { Circle } from "../../src/shapes/Circle";
import { Group } from "../../src/shapes/Group";
import { Rect } from "../../src/shapes/Rect";
import { Text } from "../../src/shapes/Text";
import { SvgExportVisitor } from "../../src/visitor/SvgExportVisitor";

const RED: ShapeStyle = { fill: "#ff0000", stroke: "#000000", strokeWidth: 2 };

/**
 * save 命令把文档序列化为 SVG XML（Visitor 实现）。
 * 约定：根元素固定带 xmlns/width/height；两空格缩进；
 * 属性顺序 id → 几何 → fill → stroke → stroke-width → 额外属性；
 * stroke 为 null 时省略 stroke 与 stroke-width；文本内容做实体转义。
 */
describe("SvgExportVisitor", () => {
  let canvas: Canvas;
  let visitor: SvgExportVisitor;

  beforeEach(() => {
    canvas = new Canvas(new DefaultContainerFactory());
    visitor = new SvgExportVisitor();
  });

  it("导出 svg 根元素与矩形几何、样式", () => {
    canvas.addShape(new Rect("r1", 10, 20, 30, 40, RED));

    expect(visitor.exportDocument(canvas)).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">',
        '  <rect id="r1" x="10" y="20" width="30" height="40" fill="#ff0000" stroke="#000000" stroke-width="2"/>',
        "</svg>",
      ].join("\n"),
    );
  });

  it("组合节点内部缩进，无描边的图形省略描边属性", () => {
    const group = new Group("g1");
    canvas.addShape(group);
    group.append(
      new Circle("c1", 5, 6, 7, { fill: "#00ff00", stroke: null, strokeWidth: 1 }),
    );

    expect(visitor.exportDocument(canvas)).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">',
        '  <g id="g1">',
        '    <circle id="c1" cx="5" cy="6" r="7" fill="#00ff00"/>',
        "  </g>",
        "</svg>",
      ].join("\n"),
    );
  });

  it("文本内容做 XML 实体转义", () => {
    canvas.addShape(new Text("t1", 1, 2, "Tom & Jerry <3"));

    expect(visitor.exportDocument(canvas)).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">',
        '  <text id="t1" x="1" y="2" fill="#000000">Tom &amp; Jerry &lt;3</text>',
        "</svg>",
      ].join("\n"),
    );
  });

  it("空文档只有根元素", () => {
    expect(visitor.exportDocument(canvas)).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">',
        "</svg>",
      ].join("\n"),
    );
  });

  it("空分组输出自闭合标签", () => {
    canvas.addShape(new Group("g1"));

    expect(visitor.exportDocument(canvas)).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">',
        '  <g id="g1"/>',
        "</svg>",
      ].join("\n"),
    );
  });

  it("保留无法归入 style 的额外属性，并使用画布尺寸", () => {
    canvas.init(100, 50);
    canvas.addShape(new Rect("r1", 0, 0, 10, 10, undefined, { "stroke-dasharray": "4 2" }));

    expect(visitor.exportDocument(canvas)).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">',
        '  <rect id="r1" x="0" y="0" width="10" height="10" fill="#000000" stroke-dasharray="4 2"/>',
        "</svg>",
      ].join("\n"),
    );
  });
});
