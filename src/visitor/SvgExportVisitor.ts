import type { Canvas } from "../core/Canvas";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { SvgAttributes } from "../core/SvgAttributes";
import type { ShapeVisitor } from "./ShapeVisitor";
import type { Circle } from "../shapes/Circle";
import type { Ellipse } from "../shapes/Ellipse";
import type { Group } from "../shapes/Group";
import type { Line } from "../shapes/Line";
import type { Rect } from "../shapes/Rect";
import type { Text } from "../shapes/Text";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const INDENT = "  ";

/** 已经由几何/样式单独输出的属性，额外属性里出现时跳过，避免重复。 */
const RESERVED_ATTRIBUTES: ReadonlySet<string> = new Set([
  "id",
  "x",
  "y",
  "width",
  "height",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x1",
  "y1",
  "x2",
  "y2",
  "fill",
  "stroke",
  "stroke-width",
  "xmlns",
]);

/**
 * save 命令的 SVG 序列化（Visitor 实现）。
 *
 * 输出稳定、可 diff：属性顺序固定为 id → 几何 → fill → stroke → stroke-width → 额外属性，
 * 子元素统一两空格缩进；不依赖 DOM/第三方库。
 */
export class SvgExportVisitor implements ShapeVisitor<string> {
  exportDocument(canvas: Canvas): string {
    const open = `<svg xmlns="${SVG_NAMESPACE}" width="${this.formatNumber(canvas.getWidth())}" height="${this.formatNumber(canvas.getHeight())}">`;
    const children = canvas.getRoot().getChildren();
    if (children.length === 0) {
      return `${open}\n</svg>`;
    }
    const body = children.map((child) => this.indent(child.accept(this))).join("\n");
    return `${open}\n${body}\n</svg>`;
  }

  visitGroup(group: Group): string {
    const head = `${this.idAttribute(group.getName())}${this.extraAttributes(group.getAttributes())}`;
    const children = group.getChildren();
    if (children.length === 0) {
      return `<g${head}/>`;
    }
    const body = children.map((child) => this.indent(child.accept(this))).join("\n");
    return `<g${head}>\n${body}\n</g>`;
  }

  visitRect(rect: Rect): string {
    const body =
      this.idAttribute(rect.getName()) +
      this.geometry([
        ["x", rect.getX()],
        ["y", rect.getY()],
        ["width", rect.getWidth()],
        ["height", rect.getHeight()],
      ]) +
      this.styleAttributes(rect.getStyle()) +
      this.extraAttributes(rect.getAttributes());
    return `<rect${body}/>`;
  }

  visitCircle(circle: Circle): string {
    const body =
      this.idAttribute(circle.getName()) +
      this.geometry([
        ["cx", circle.getCx()],
        ["cy", circle.getCy()],
        ["r", circle.getRadius()],
      ]) +
      this.styleAttributes(circle.getStyle()) +
      this.extraAttributes(circle.getAttributes());
    return `<circle${body}/>`;
  }

  visitEllipse(ellipse: Ellipse): string {
    const body =
      this.idAttribute(ellipse.getName()) +
      this.geometry([
        ["cx", ellipse.getCx()],
        ["cy", ellipse.getCy()],
        ["rx", ellipse.getRx()],
        ["ry", ellipse.getRy()],
      ]) +
      this.styleAttributes(ellipse.getStyle()) +
      this.extraAttributes(ellipse.getAttributes());
    return `<ellipse${body}/>`;
  }

  visitLine(line: Line): string {
    const body =
      this.idAttribute(line.getName()) +
      this.geometry([
        ["x1", line.getX1()],
        ["y1", line.getY1()],
        ["x2", line.getX2()],
        ["y2", line.getY2()],
      ]) +
      this.styleAttributes(line.getStyle()) +
      this.extraAttributes(line.getAttributes());
    return `<line${body}/>`;
  }

  visitText(text: Text): string {
    const body =
      this.idAttribute(text.getName()) +
      this.geometry([
        ["x", text.getX()],
        ["y", text.getY()],
      ]) +
      this.styleAttributes(text.getStyle()) +
      this.extraAttributes(text.getAttributes());
    return `<text${body}>${this.escapeText(text.getContent())}</text>`;
  }

  private idAttribute(name: string): string {
    return ` id="${this.escapeAttribute(name)}"`;
  }

  private geometry(pairs: ReadonlyArray<readonly [string, number]>): string {
    return pairs
      .map(([name, value]) => ` ${name}="${this.formatNumber(value)}"`)
      .join("");
  }

  private styleAttributes(style: ShapeStyle): string {
    let out = ` fill="${this.escapeAttribute(style.fill)}"`;
    if (style.stroke !== null) {
      out += ` stroke="${this.escapeAttribute(style.stroke)}"`;
      out += ` stroke-width="${this.formatNumber(style.strokeWidth)}"`;
    }
    return out;
  }

  private extraAttributes(attributes: SvgAttributes): string {
    let out = "";
    for (const [name, value] of Object.entries(attributes)) {
      if (RESERVED_ATTRIBUTES.has(name)) {
        continue;
      }
      out += ` ${name}="${this.escapeAttribute(value)}"`;
    }
    return out;
  }

  private indent(block: string): string {
    return block
      .split("\n")
      .map((line) => INDENT + line)
      .join("\n");
  }

  private formatNumber(value: number): string {
    return Object.is(value, -0) ? "0" : String(value);
  }

  private escapeAttribute(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  private escapeText(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
