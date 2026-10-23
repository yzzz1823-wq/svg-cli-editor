import { SvgParseError } from "../../src/errors/SvgParseError";
import { Circle } from "../../src/shapes/Circle";
import type { Group } from "../../src/shapes/Group";
import { Rect } from "../../src/shapes/Rect";
import { Text } from "../../src/shapes/Text";
import { DefaultSvgElementFactory } from "../../src/parser/DefaultSvgElementFactory";
import { SvgParser } from "../../src/parser/SvgParser";

/**
 * SvgParser：把 SVG 文本解析成文档树（Composite）并收集警告。
 * 缺 id 的元素按文档顺序自动命名为 shape-1、shape-2……
 * 非法 XML / 不支持的标签 / 非法数字都抛 SvgParseError。
 */
describe("SvgParser", () => {
  const parser = new SvgParser(new DefaultSvgElementFactory());
  const parse = (svg: string) => parser.parse(svg);

  it("解析根尺寸与矩形几何、样式", () => {
    const doc = parse(
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">' +
        '<rect id="r1" x="1" y="2" width="3" height="4" fill="#123456"/>' +
        "</svg>",
    );

    expect(doc.width).toBe(320);
    expect(doc.height).toBe(240);
    const rect = doc.root.getChildren()[0] as Rect;
    expect(rect).toBeInstanceOf(Rect);
    expect(rect.getName()).toBe("r1");
    expect(rect.getX()).toBe(1);
    expect(rect.getY()).toBe(2);
    expect(rect.getWidth()).toBe(3);
    expect(rect.getHeight()).toBe(4);
    expect(rect.getStyle().fill).toBe("#123456");
    expect(doc.warnings).toHaveLength(0);
  });

  it("嵌套分组保持层级与父子指针", () => {
    const doc = parse(
      '<svg width="10" height="10">' +
        '<g id="g1"><rect id="a"/><g id="g2"><circle id="b" cx="1" cy="2" r="3"/></g></g>' +
        "</svg>",
    );

    const g1 = doc.root.getChildren()[0] as Group;
    expect(g1.getName()).toBe("g1");
    expect(g1.getChildByName("a")).toBeInstanceOf(Rect);
    const g2 = g1.getChildByName("g2") as Group;
    const circle = g2.getChildren()[0] as Circle;
    expect(circle.getName()).toBe("b");
    expect(circle.getRadius()).toBe(3);
    expect(circle.getParent()).toBe(g2);
  });

  it("缺少 id 时按文档顺序自动命名并逐条警告", () => {
    const doc = parse(
      '<svg width="10" height="10"><rect/><circle/><g><text>hi</text></g></svg>',
    );

    expect(doc.root.getChildren().map((shape) => shape.getName())).toEqual([
      "shape-1",
      "shape-2",
      "shape-3",
    ]);
    const group = doc.root.getChildren()[2] as Group;
    expect(group.getChildren()[0]!.getName()).toBe("shape-4");
    expect(doc.warnings).toHaveLength(4);
    expect(doc.warnings[0]).toContain("缺少 id");
    expect(doc.warnings[0]).toContain("shape-1");
  });

  it("部分元素有 id 时，自动命名计数不受影响", () => {
    const doc = parse('<svg><rect id="a"/><rect/></svg>');

    expect(doc.root.getChildren()[1]!.getName()).toBe("shape-1");
    expect(doc.warnings).toHaveLength(1);
  });

  it("未声明样式时使用默认样式", () => {
    const doc = parse('<svg><rect id="a" fill="#fff" stroke="#000" stroke-width="3"/><rect id="b"/></svg>');

    const styled = doc.root.getChildren()[0] as Rect;
    expect(styled.getStyle()).toEqual({ fill: "#fff", stroke: "#000", strokeWidth: 3 });
    const plain = doc.root.getChildren()[1] as Rect;
    expect(plain.getStyle()).toEqual({ fill: "#000000", stroke: null, strokeWidth: 1 });
  });

  it("文本内容解析并反转义实体", () => {
    const doc = parse('<svg><text id="t" x="1" y="2">Tom &amp; Jerry &lt;3</text></svg>');

    const text = doc.root.getChildren()[0] as Text;
    expect(text).toBeInstanceOf(Text);
    expect(text.getContent()).toBe("Tom & Jerry <3");
  });

  it("缺省尺寸回落到 800×600", () => {
    const doc = parse("<svg></svg>");

    expect(doc.width).toBe(800);
    expect(doc.height).toBe(600);
  });

  it("非法数字抛 SvgParseError", () => {
    expect(() => parse('<svg><rect id="a" x="abc"/></svg>')).toThrow(SvgParseError);
  });

  it("根元素不是 svg 抛 SvgParseError", () => {
    expect(() => parse("<html></html>")).toThrow(SvgParseError);
  });

  it("不支持的标签抛 SvgParseError", () => {
    expect(() => parse('<svg><path id="p" d="M0 0"/></svg>')).toThrow(SvgParseError);
  });

  it("标签未闭合抛 SvgParseError", () => {
    expect(() => parse('<svg><g id="g">')).toThrow(SvgParseError);
  });
});
