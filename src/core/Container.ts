import { Shape } from "./Shape";
import { CommandError } from "../errors/CommandError";
import type { SvgAttributes } from "./SvgAttributes";
import type { ShapeStyle } from "./ShapeStyle";

/**
 * 组合节点基类 —— Composite 模式中的 Composite。
 *
 * 只有它知道“子节点列表”的结构，维护父子指针不变式：
 * 一个 Shape 在同一时刻最多属于一个 Container。
 */
export abstract class Container extends Shape {
  private readonly children: Shape[] = [];

  protected constructor(name: string, style: ShapeStyle, attributes?: SvgAttributes) {
    super(name, style, attributes);
  }

  /** 追加到末尾。 */
  append(child: Shape): void {
    this.assertDetached(child);
    child.setParent(this);
    this.children.push(child);
  }

  /** 插入到指定下标（0 ≤ index ≤ childCount）。 */
  insertAt(index: number, child: Shape): void {
    if (!Number.isInteger(index) || index < 0 || index > this.children.length) {
      throw new CommandError(
        `插入位置越界：${index}（容器 "${this.getName()}" 现有 ${this.children.length} 个子节点）`,
      );
    }
    this.assertDetached(child);
    child.setParent(this);
    this.children.splice(index, 0, child);
  }

  /** 摘除直接子节点，被摘除的节点变为游离节点。 */
  remove(child: Shape): void {
    const index = this.indexOf(child);
    if (index < 0) {
      throw new CommandError(`节点 "${child.getName()}" 不是容器 "${this.getName()}" 的子节点`);
    }
    this.children.splice(index, 1);
    child.setParent(null);
  }

  /** 直接子节点下标，找不到返回 -1。 */
  indexOf(child: Shape): number {
    return this.children.indexOf(child);
  }

  childCount(): number {
    return this.children.length;
  }

  /** 只读快照，防止外部绕过不变式直接改动内部数组。 */
  getChildren(): readonly Shape[] {
    return [...this.children];
  }

  /** 按名称查找“直接”子节点（不递归）。 */
  getChildByName(name: string): Shape | null {
    for (const child of this.children) {
      if (child.getName() === name) {
        return child;
      }
    }
    return null;
  }

  private assertDetached(child: Shape): void {
    if (child.getParent() !== null) {
      throw new CommandError(
        `节点 "${child.getName()}" 已属于容器 "${child.getParent()?.getName() ?? ""}"，必须先移除`,
      );
    }
  }
}
