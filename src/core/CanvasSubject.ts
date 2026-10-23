import type { CanvasEvent } from "./CanvasEvent";
import type { CanvasObserver } from "./CanvasObserver";

/**
 * 被观察者基类 —— Observer 模式中的 Subject。
 * 维护观察者清单，并在状态变化后广播事件。
 */
export abstract class CanvasSubject {
  private readonly observers: CanvasObserver[] = [];

  attach(observer: CanvasObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  detach(observer: CanvasObserver): void {
    const index = this.observers.indexOf(observer);
    if (index >= 0) {
      this.observers.splice(index, 1);
    }
  }

  /** 通知所有观察者；遍历快照，允许观察者在回调里 attach/detach。 */
  protected notify(event: CanvasEvent): void {
    for (const observer of [...this.observers]) {
      observer.update(event);
    }
  }
}
