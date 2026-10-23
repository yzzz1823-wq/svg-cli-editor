import { SvgParseError } from "../errors/SvgParseError";
import { Circle } from "../shapes/Circle";
import { Ellipse } from "../shapes/Ellipse";
import { Group } from "../shapes/Group";
import { Line } from "../shapes/Line";
import { Rect } from "../shapes/Rect";
import { Text } from "../shapes/Text";
import type { Shape } from "../core/Shape";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { SvgAttributes } from "../core/SvgAttributes";
import type { SvgElementFactory } from "./SvgElementFactory";

/** 内置图元的默认工厂：全项目唯一的“标签名 → 类”映射表。 */
export class DefaultSvgElementFactory implements SvgElementFactory {
  create(
    tag: string,
    name: string,
    attributes: SvgAttributes,
    style: ShapeStyle,
    textContent = "",
  ): Shape {
    switch (tag) {
      case "svg":
      case "g":
        return new Group(name, style, attributes);
      case "rect":
        return new Rect(
          name,
          this.number(attributes, "x"),
          this.number(attributes, "y"),
          this.number(attributes, "width"),
          this.number(attributes, "height"),
          style,
          attributes,
        );
      case "circle":
        return new Circle(
          name,
          this.number(attributes, "cx"),
          this.number(attributes, "cy"),
          this.number(attributes, "r"),
          style,
          attributes,
        );
      case "ellipse":
        return new Ellipse(
          name,
          this.number(attributes, "cx"),
          this.number(attributes, "cy"),
          this.number(attributes, "rx"),
          this.number(attributes, "ry"),
          style,
          attributes,
        );
      case "line":
        return new Line(
          name,
          this.number(attributes, "x1"),
          this.number(attributes, "y1"),
          this.number(attributes, "x2"),
          this.number(attributes, "y2"),
          style,
          attributes,
        );
      case "text":
        return new Text(
          name,
          this.number(attributes, "x"),
          this.number(attributes, "y"),
          textContent,
          style,
          attributes,
        );
      default:
        throw new SvgParseError(`不支持的标签：<${tag}>`);
    }
  }

  private number(attributes: SvgAttributes, attributeName: string, fallback = 0): number {
    const raw = attributes[attributeName];
    if (raw === undefined || raw.trim() === "") {
      return fallback;
    }
    const value = Number(raw.trim());
    if (!Number.isFinite(value)) {
      throw new SvgParseError(`属性 "${attributeName}" 不是合法数字："${raw}"`);
    }
    return value;
  }
}
