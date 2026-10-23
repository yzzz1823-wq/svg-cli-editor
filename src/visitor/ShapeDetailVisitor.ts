import type { ShapeVisitor } from "./ShapeVisitor";
import type { Circle } from "../shapes/Circle";
import type { Ellipse } from "../shapes/Ellipse";
import type { Group } from "../shapes/Group";
import type { Line } from "../shapes/Line";
import type { Rect } from "../shapes/Rect";
import type { Text } from "../shapes/Text";
import type { Shape } from "../core/Shape";

/**
 * show 命令的展示格式：把图形渲染成“标题 + 属性行”。
 *
 * 与 save / tree 一样属于“对图形的整类操作”，因此沿用 Visitor：
 * 新增图形类型时只实现新的 accept 分支，渲染代码不出现类型判断。
 */
export class ShapeDetailVisitor implements ShapeVisitor<readonly string[]> {
  render(shape: Shape): readonly string[] {
    return shape.accept(this);
  }

  visitGroup(group: Group): readonly string[] {
    return [...this.header(group), `  children: ${group.childCount()}`, ...this.styleLines(group)];
  }

  visitRect(rect: Rect): readonly string[] {
    return [
      ...this.header(rect),
      `  x: ${rect.getX()}`,
      `  y: ${rect.getY()}`,
      `  width: ${rect.getWidth()}`,
      `  height: ${rect.getHeight()}`,
      ...this.styleLines(rect),
    ];
  }

  visitCircle(circle: Circle): readonly string[] {
    return [
      ...this.header(circle),
      `  cx: ${circle.getCx()}`,
      `  cy: ${circle.getCy()}`,
      `  r: ${circle.getRadius()}`,
      ...this.styleLines(circle),
    ];
  }

  visitEllipse(ellipse: Ellipse): readonly string[] {
    return [
      ...this.header(ellipse),
      `  cx: ${ellipse.getCx()}`,
      `  cy: ${ellipse.getCy()}`,
      `  rx: ${ellipse.getRx()}`,
      `  ry: ${ellipse.getRy()}`,
      ...this.styleLines(ellipse),
    ];
  }

  visitLine(line: Line): readonly string[] {
    return [
      ...this.header(line),
      `  x1: ${line.getX1()}`,
      `  y1: ${line.getY1()}`,
      `  x2: ${line.getX2()}`,
      `  y2: ${line.getY2()}`,
      ...this.styleLines(line),
    ];
  }

  visitText(text: Text): readonly string[] {
    return [
      ...this.header(text),
      `  x: ${text.getX()}`,
      `  y: ${text.getY()}`,
      `  text: ${text.getContent()}`,
      ...this.styleLines(text),
    ];
  }

  private header(shape: Shape): readonly string[] {
    return [`shape: ${shape.getName()} (${shape.getTag()})`];
  }

  private styleLines(shape: Shape): readonly string[] {
    const style = shape.getStyle();
    return [
      `  fill: ${style.fill}`,
      `  stroke: ${style.stroke ?? "none"}`,
      `  stroke-width: ${style.strokeWidth}`,
    ];
  }
}
