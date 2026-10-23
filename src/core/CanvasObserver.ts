import type { CanvasEvent } from "./CanvasEvent";

/** 观察者：CLI 终端回显等展示层实现它，与画布解耦。 */
export interface CanvasObserver {
  update(event: CanvasEvent): void;
}
