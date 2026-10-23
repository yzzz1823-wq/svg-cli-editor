import type { CanvasEvent } from "../../src/core/CanvasEvent";
import type { CanvasObserver } from "../../src/core/CanvasObserver";

/** 记录收到的全部事件，便于断言“通知了什么、通知了几次”。 */
export class RecordingObserver implements CanvasObserver {
  readonly events: CanvasEvent[] = [];

  update(event: CanvasEvent): void {
    this.events.push(event);
  }

  operations(): string[] {
    return this.events.map((event) => event.operation);
  }

  last(): CanvasEvent | undefined {
    return this.events[this.events.length - 1];
  }

  reset(): void {
    this.events.length = 0;
  }
}
