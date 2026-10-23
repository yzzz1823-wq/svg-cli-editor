import type { Canvas } from "../core/Canvas";
import type { Shape } from "../core/Shape";
import type { ShapeVisitor } from "./ShapeVisitor";
import type { Circle } from "../shapes/Circle";
import type { Ellipse } from "../shapes/Ellipse";
import type { Group } from "../shapes/Group";
import type { Line } from "../shapes/Line";
import type { Rect } from "../shapes/Rect";
import type { Text } from "../shapes/Text";

const BRANCH = "├─ ";
const LAST_BRANCH = "└─ ";
const CONT = "│  ";
const EMPTY = "   ";

/**
 * tree 命令的控制台树状渲染（Visitor 实现）。
 *
 * 每个节点返回“自身子树的文本行”，父节点负责给子块补分支符与延续线，
 * 因此不需要 instanceof，也不需要把缩进状态塞进字段。
 */
export class TreeRenderVisitor implements ShapeVisitor<readonly string[]> {
  render(canvas: Canvas): string {
    const header = `svg ${canvas.getWidth()}x${canvas.getHeight()}`;
    const children = canvas.getRoot().getChildren();
    if (children.length === 0) {
      return `${header}\n(empty)`;
    }
    return [header, ...this.renderLevel(children)].join("\n");
  }

  visitGroup(group: Group): readonly string[] {
    const label = `${group.getName()} [${group.getTag()}]`;
    const children = group.getChildren();
    if (children.length === 0) {
      return [label];
    }
    return [label, ...this.renderLevel(children)];
  }

  visitRect(rect: Rect): readonly string[] {
    return [`${rect.getName()} [${rect.getTag()}]`];
  }

  visitCircle(circle: Circle): readonly string[] {
    return [`${circle.getName()} [${circle.getTag()}]`];
  }

  visitEllipse(ellipse: Ellipse): readonly string[] {
    return [`${ellipse.getName()} [${ellipse.getTag()}]`];
  }

  visitLine(line: Line): readonly string[] {
    return [`${line.getName()} [${line.getTag()}]`];
  }

  visitText(text: Text): readonly string[] {
    return [`${text.getName()} [${text.getTag()}] "${text.getContent()}"`];
  }

  private renderLevel(children: readonly Shape[]): string[] {
    return children.flatMap((child, index) =>
      this.withBranch(child.accept(this), index === children.length - 1),
    );
  }

  private withBranch(block: readonly string[], isLast: boolean): string[] {
    const head = isLast ? LAST_BRANCH : BRANCH;
    const rest = isLast ? EMPTY : CONT;
    return block.map((line, index) => (index === 0 ? head + line : rest + line));
  }
}
