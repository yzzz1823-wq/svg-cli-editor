import type { Circle } from "../shapes/Circle";
import type { Ellipse } from "../shapes/Ellipse";
import type { Group } from "../shapes/Group";
import type { Line } from "../shapes/Line";
import type { Rect } from "../shapes/Rect";
import type { Text } from "../shapes/Text";

/**
 * 图形访问者 —— Visitor 模式中的 Visitor。
 *
 * 新增“对图形的整类操作”（保存为 SVG、打印树状结构等）时只加实现类，
 * 不修改任何图形类；图形类只保留 accept 这一处分派。
 *
 * @typeParam R 各 visit 方法的统一返回类型（如 string、void）。
 */
export interface ShapeVisitor<R> {
  visitGroup(group: Group): R;

  visitRect(rect: Rect): R;

  visitCircle(circle: Circle): R;

  visitEllipse(ellipse: Ellipse): R;

  visitLine(line: Line): R;

  visitText(text: Text): R;
}
