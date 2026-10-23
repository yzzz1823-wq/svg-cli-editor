import { SvgParseError } from "../errors/SvgParseError";
import { Container } from "../core/Container";
import { DEFAULT_SHAPE_STYLE } from "../core/ShapeStyle";
import type { ParsedDocument } from "./ParsedDocument";
import type { Shape } from "../core/Shape";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { SvgAttributes } from "../core/SvgAttributes";
import type { SvgElementFactory } from "./SvgElementFactory";
import type { XmlElement } from "./XmlElement";
import { XmlTokenizer } from "./XmlTokenizer";

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const ROOT_NAME = "root";

/**
 * 把 SVG 文本解析成文档树。
 *
 * 缺 id 的元素按文档顺序命名为 shape-1、shape-2……并写入 warnings；
 * 语法/标签/数字错误统一抛 SvgParseError，解析失败不会返回半成品。
 */
export class SvgParser {
  private readonly factory: SvgElementFactory;

  constructor(factory: SvgElementFactory) {
    this.factory = factory;
  }

  parse(content: string): ParsedDocument {
    const xml = new XmlTokenizer().parse(content);
    if (xml.getTagName() !== "svg") {
      throw new SvgParseError(`根元素必须是 <svg>，实际为 <${xml.getTagName()}>`);
    }

    const width = this.numberAttribute(xml, "width", DEFAULT_WIDTH);
    const height = this.numberAttribute(xml, "height", DEFAULT_HEIGHT);
    const warnings: string[] = [];
    let autoCount = 0;

    const nextName = (element: XmlElement): string => {
      const id = element.getAttribute("id")?.trim() ?? "";
      if (id !== "") {
        return id;
      }
      autoCount += 1;
      const name = `shape-${autoCount}`;
      warnings.push(`元素 <${element.getTagName()}> 缺少 id，已自动命名为 "${name}"`);
      return name;
    };

    const root = this.factory.create("svg", ROOT_NAME, {}, DEFAULT_SHAPE_STYLE);
    if (!(root instanceof Container)) {
      throw new SvgParseError("根节点必须是容器");
    }
    this.buildChildren(root, xml, nextName);

    return { root, width, height, warnings };
  }

  private buildChildren(
    parent: Container,
    element: XmlElement,
    nextName: (child: XmlElement) => string,
  ): void {
    for (const child of element.getChildren()) {
      const shape = this.createShape(child, nextName(child));
      if (shape instanceof Container) {
        this.buildChildren(shape, child, nextName);
      }
      parent.append(shape);
    }
  }

  private createShape(element: XmlElement, name: string): Shape {
    return this.factory.create(
      element.getTagName(),
      name,
      this.collectAttributes(element),
      this.readStyle(element),
      element.getText().trim(),
    );
  }

  private collectAttributes(element: XmlElement): SvgAttributes {
    const attributes: Record<string, string> = {};
    for (const [name, value] of element.getAttributes()) {
      if (name !== "xmlns") {
        attributes[name] = value;
      }
    }
    return attributes;
  }

  private readStyle(element: XmlElement): ShapeStyle {
    const fill = element.getAttribute("fill") ?? DEFAULT_SHAPE_STYLE.fill;
    const rawStroke = element.getAttribute("stroke");
    const stroke = rawStroke === null || rawStroke.trim() === "none" ? null : rawStroke;
    const rawStrokeWidth = element.getAttribute("stroke-width");
    const strokeWidth =
      rawStrokeWidth === null
        ? DEFAULT_SHAPE_STYLE.strokeWidth
        : this.toNumber(rawStrokeWidth, "stroke-width");
    return { fill, stroke, strokeWidth };
  }

  private numberAttribute(element: XmlElement, name: string, fallback: number): number {
    const raw = element.getAttribute(name);
    return raw === null ? fallback : this.toNumber(raw, name);
  }

  private toNumber(raw: string, attributeName: string): number {
    const value = Number(raw.trim());
    if (!Number.isFinite(value)) {
      throw new SvgParseError(`属性 "${attributeName}" 不是合法数字："${raw}"`);
    }
    return value;
  }
}
