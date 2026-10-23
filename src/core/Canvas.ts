import { CanvasEvent } from "./CanvasEvent";
import { CanvasSubject } from "./CanvasSubject";
import { CommandError } from "../errors/CommandError";
import { Container } from "./Container";
import type { AttributePatch } from "./AttributePatch";
import type { ContainerFactory } from "./ContainerFactory";
import type { Shape } from "./Shape";

/** 新建画布的默认尺寸。 */
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

/**
 * 画布 —— 领域层的根对象与唯一“被观察者”。
 *
 * 所有结构性操作（增删改、组合、整篇装载）都在这里完成并广播事件；
 * Command 只负责调用它，不自己改结构。
 */
export class Canvas extends CanvasSubject {
  private readonly containerFactory: ContainerFactory;
  private root: Container;
  private width: number;
  private height: number;
  private documentLoaded = false;

  constructor(containerFactory: ContainerFactory) {
    super();
    this.containerFactory = containerFactory;
    this.width = DEFAULT_WIDTH;
    this.height = DEFAULT_HEIGHT;
    this.root = containerFactory.createRoot();
  }

  /** 是否已经 init/read 过文档；CLI 用它区分“尚未开始”的状态。 */
  hasDocument(): boolean {
    return this.documentLoaded;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getRoot(): Container {
    return this.root;
  }

  /** 新建空文档（init 命令）。文档级操作，调用方需负责清空撤销栈。 */
  init(width: number = DEFAULT_WIDTH, height: number = DEFAULT_HEIGHT): void {
    this.width = width;
    this.height = height;
    this.root = this.containerFactory.createRoot();
    this.documentLoaded = true;
    this.notify(new CanvasEvent("document"));
  }

  /** 整篇装载已解析的文档（read 命令）。 */
  load(root: Container, width: number, height: number): void {
    this.root = root;
    this.width = width;
    this.height = height;
    this.documentLoaded = true;
    this.notify(new CanvasEvent("document"));
  }

  /**
   * 仅修改画布尺寸（canvas 命令）：不触碰根节点及其子图形，
   * 与 init() 的“清空并重置”形成明确区分。
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.notify(new CanvasEvent("document"));
  }

  /** 递归查找节点；找不到返回 null。 */
  findShape(name: string): Shape | null {
    return this.findInContainer(this.root, name);
  }

  /** 添加图形到指定容器（默认根节点），名称必须全局唯一。 */
  addShape(shape: Shape, parent: Container = this.root): void {
    if (this.findShape(shape.getName()) !== null) {
      throw new CommandError(`id already exists: ${shape.getName()}`);
    }
    parent.append(shape);
    this.notify(new CanvasEvent("add", shape));
  }

  /**
   * 从文档中摘除图形（不是删除对象）。
   * 根节点与游离节点都会被拒绝，保证文档始终有一个根。
   */
  removeShape(shape: Shape): void {
    if (shape === this.root) {
      throw new CommandError("不能移除文档根节点");
    }
    const parent = shape.getParent();
    if (parent === null) {
      throw new CommandError(`节点 "${shape.getName()}" 不在文档中`);
    }
    parent.remove(shape);
    this.notify(new CanvasEvent("remove", shape));
  }

  /** 平移图形；组合节点会递归平移后代。 */
  moveShape(shape: Shape, dx: number, dy: number): void {
    if (shape === this.root) {
      throw new CommandError("不能移动文档根节点");
    }
    shape.translate(dx, dy);
    this.notify(new CanvasEvent("move", shape));
  }

  /** 以原点为基准缩放图形；组合节点会递归缩放后代。 */
  scaleShape(shape: Shape, factor: number): void {
    if (shape === this.root) {
      throw new CommandError("不能缩放文档根节点");
    }
    shape.scale(factor);
    this.notify(new CanvasEvent("scale", shape));
  }

  /** 以属性补丁绝对覆盖图形（样式 + 几何），供 set 命令使用。 */
  setShapeAttributes(shape: Shape, patch: AttributePatch): void {
    if (shape === this.root) {
      throw new CommandError("不能修改文档根节点");
    }
    shape.applyPatch(patch);
    this.notify(new CanvasEvent("set", shape));
  }

  /**
   * 把同属一个父容器的若干节点收拢成新组。
   * 新组插入到这些节点中最靠前者的位置，组内保持原有文档顺序。
   */
  groupShapes(children: readonly Shape[], name: string): Container {
    if (children.length < 2) {
      throw new CommandError("至少需要两个节点才能成组");
    }
    if (new Set<Shape>(children).size !== children.length) {
      throw new CommandError("成组列表中存在重复节点");
    }
    const parent = children[0]?.getParent() ?? null;
    if (parent === null) {
      throw new CommandError("不能把游离节点成组");
    }
    // 祖先与后代不能同组，否则会把容器“装进自己”，形成环。
    for (const child of children) {
      for (const other of children) {
        if (child !== other && this.isAncestorOf(child, other)) {
          throw new CommandError(
            `cannot group a container into its own descendant: ${child.getName()}`,
          );
        }
      }
    }
    for (const child of children) {
      if (child.getParent() !== parent) {
        throw new CommandError(`节点 "${child.getName()}" 与其它节点不属于同一个父容器`);
      }
    }
    if (this.findShape(name) !== null) {
      throw new CommandError(`id already exists: ${name}`);
    }

    // 记录插入位置：移除选中节点后，首个被选节点之前剩余的同级数量。
    const siblings = parent.getChildren();
    const selected = new Set<Shape>(children);
    const firstIndex = Math.min(...children.map((child) => parent.indexOf(child)));
    let insertIndex = 0;
    for (let i = 0; i < firstIndex; i += 1) {
      const sibling = siblings[i];
      if (sibling !== undefined && !selected.has(sibling)) {
        insertIndex += 1;
      }
    }

    // 组内顺序必须与文档顺序一致。
    const ordered = [...children].sort(
      (left, right) => parent.indexOf(left) - parent.indexOf(right),
    );
    for (const child of ordered) {
      parent.remove(child);
    }

    const group = this.containerFactory.createGroup(name);
    for (const child of ordered) {
      group.append(child);
    }
    parent.insertAt(insertIndex, group);

    this.notify(new CanvasEvent("group", group));
    return group;
  }

  /**
   * 把已有节点移动到另一个容器的末尾（addto 命令）。
   * 目标必须是容器；不允许移动到自身或自己的后代，避免形成环。
   */
  reparent(shape: Shape, target: Container): void {
    if (shape === this.root) {
      throw new CommandError("不能移动文档根节点");
    }
    const parent = shape.getParent();
    if (parent === null) {
      throw new CommandError(`节点 "${shape.getName()}" 不在文档中`);
    }
    if (target === shape) {
      throw new CommandError(`不能把 "${shape.getName()}" 移动到自身`);
    }
    if (this.isAncestorOf(shape, target)) {
      throw new CommandError(`不能把 "${shape.getName()}" 移动到自身的后代中`);
    }
    parent.remove(shape);
    target.append(shape);
    this.notify(new CanvasEvent("move", shape));
  }

  /** 把节点移动到同级末尾（最前图层，front 命令）。 */
  bringToFront(shape: Shape): void {
    const parent = this.siblingParent(shape);
    parent.remove(shape);
    parent.append(shape);
    this.notify(new CanvasEvent("reorder", shape));
  }

  /** 把节点移动到同级开头（最后图层，back 命令）。 */
  sendToBack(shape: Shape): void {
    const parent = this.siblingParent(shape);
    parent.remove(shape);
    parent.insertAt(0, shape);
    this.notify(new CanvasEvent("reorder", shape));
  }

  /** 解散分组：子节点按原顺序回到祖父容器，组本身被摘除。 */
  ungroupContainer(group: Container): void {
    if (group === this.root) {
      throw new CommandError("不能解散文档根节点");
    }
    const parent = group.getParent();
    if (parent === null) {
      throw new CommandError(`容器 "${group.getName()}" 不在文档中`);
    }
    const index = parent.indexOf(group);
    const children = [...group.getChildren()];

    parent.remove(group);
    children.forEach((child, offset) => {
      group.remove(child);
      parent.insertAt(index + offset, child);
    });

    this.notify(new CanvasEvent("ungroup", group));
  }

  /** 调整图层顺序前的统一校验：根节点与游离节点都拒绝。 */
  private siblingParent(shape: Shape): Container {
    if (shape === this.root) {
      throw new CommandError("不能调整文档根节点的层级");
    }
    const parent = shape.getParent();
    if (parent === null) {
      throw new CommandError(`节点 "${shape.getName()}" 不在文档中`);
    }
    return parent;
  }

  /** ancestor 是否为 node 的祖先（沿父指针上溯）。 */
  private isAncestorOf(ancestor: Shape, node: Shape): boolean {
    let current = node.getParent();
    while (current !== null) {
      if (current === ancestor) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }

  private findInContainer(container: Container, name: string): Shape | null {
    for (const child of container.getChildren()) {
      if (child.getName() === name) {
        return child;
      }
      // 这里判断的是“是否组合节点”（角色），而非具体图形类型，属于 Composite 的遍历职责。
      if (child instanceof Container) {
        const found = this.findInContainer(child, name);
        if (found !== null) {
          return found;
        }
      }
    }
    return null;
  }
}
