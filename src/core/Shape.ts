import { CommandError } from "../errors/CommandError";
import { EMPTY_SVG_ATTRIBUTES } from "./SvgAttributes";
import type { AttributePatch } from "./AttributePatch";
import type { SvgAttributes } from "./SvgAttributes";
import type { Container } from "./Container";
import type { ShapeStyle } from "./ShapeStyle";
import type { ShapeVisitor } from "../visitor/ShapeVisitor";

/** 由基类统一处理的样式键；子类的几何键校验会跳过它们。 */
const STYLE_KEYS: readonly string[] = ["fill", "stroke", "strokeWidth"];

/**
 * 所有图形（叶子与组合节点）的统一基类 —— Composite 模式中的 Component。
 *
 * 领域行为放在类里（translate / scale / applyPatch / accept / getName），
 * 外部只通过方法调用，不直接读字段，避免退化成贫血模型。
 */
export abstract class Shape {
  private readonly name: string;
  private style: ShapeStyle;
  private readonly attributes: SvgAttributes;
  private parent: Container | null = null;

  protected constructor(
    name: string,
    style: ShapeStyle,
    attributes: SvgAttributes = EMPTY_SVG_ATTRIBUTES,
  ) {
    this.name = name;
    this.style = style;
    this.attributes = attributes;
  }

  /** 文档内唯一标识，命令通过它定位图形；不可修改。 */
  getName(): string {
    return this.name;
  }

  getStyle(): ShapeStyle {
    return this.style;
  }

  /** 无法归入 style 的原样属性（font-size 等），供 Visitor 序列化。 */
  getAttributes(): SvgAttributes {
    return this.attributes;
  }

  /** 父容器；游离节点为 null。由 Container 维护，图形自身不修改。 */
  getParent(): Container | null {
    return this.parent;
  }

  /** 仅供 Container 维护组合关系，外部不应直接调用。 */
  setParent(parent: Container | null): void {
    this.parent = parent;
  }

  /**
   * 绝对覆盖属性：样式统一在基类处理，几何由各子类处理。
   * 传入自身不支持的属性时抛 CommandError，避免静默忽略用户意图。
   */
  applyPatch(patch: AttributePatch): void {
    this.applyStyle(patch);
    this.applyGeometry(patch);
  }

  /** 捕获当前可修改属性的完整快照，供撤销写回。 */
  captureState(): AttributePatch {
    const snapshot: AttributePatch = {
      fill: this.style.fill,
      stroke: this.style.stroke,
      strokeWidth: this.style.strokeWidth,
    };
    this.captureGeometry(snapshot);
    return snapshot;
  }

  /** SVG 标签名（rect / circle / g ...），由子类给出。 */
  abstract getTag(): string;

  /** Visitor 分派的唯一入口 —— 取代 instanceof 判断。 */
  abstract accept<R>(visitor: ShapeVisitor<R>): R;

  /** 相对平移；组合节点递归平移全部后代。 */
  abstract translate(dx: number, dy: number): void;

  /** 以原点为基准按倍数缩放；组合节点递归缩放全部后代。 */
  abstract scale(factor: number): void;

  /** 子类在此覆盖自身几何字段。 */
  protected abstract applyGeometry(patch: AttributePatch): void;

  /** 子类在此把自身几何字段写入快照。 */
  protected abstract captureGeometry(target: AttributePatch): void;

  /** 子类声明自己接受的几何键；其余键一律报错。 */
  protected assertSupported(patch: AttributePatch, allowed: readonly string[]): void {
    for (const key of Object.keys(patch)) {
      if (STYLE_KEYS.includes(key)) {
        continue;
      }
      if (!allowed.includes(key)) {
        throw new CommandError(`图形 "${this.name}" 不支持属性 "${key}"`);
      }
    }
  }

  private applyStyle(patch: AttributePatch): void {
    if (patch.fill === undefined && patch.stroke === undefined && patch.strokeWidth === undefined) {
      return;
    }
    this.style = {
      fill: patch.fill ?? this.style.fill,
      stroke: patch.stroke === undefined ? this.style.stroke : patch.stroke,
      strokeWidth: patch.strokeWidth ?? this.style.strokeWidth,
    };
  }
}
