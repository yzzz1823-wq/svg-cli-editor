import type { Shape } from "./Shape";

/** 画布上发生的变化类型。 */
export type CanvasOperation =
  | "add"
  | "remove"
  | "move"
  | "scale"
  | "set"
  | "group"
  | "ungroup"
  | "document";

/**
 * 广播给观察者的事件（不可变值对象）。
 * 观察者据此决定回显文案，而不需要反向查询画布。
 */
export class CanvasEvent {
  readonly operation: CanvasOperation;
  readonly shape: Shape | null;

  constructor(operation: CanvasOperation, shape: Shape | null = null) {
    this.operation = operation;
    this.shape = shape;
  }
}
