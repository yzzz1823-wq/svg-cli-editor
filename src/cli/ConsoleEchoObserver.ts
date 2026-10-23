import type { CanvasEvent } from "../core/CanvasEvent";
import type { CanvasObserver } from "../core/CanvasObserver";
import type { OutputWriter } from "./OutputWriter";

/** CLI 终端回显：订阅 Canvas 事件并把变更打印出来（Observer 模式的观察者）。 */
export class ConsoleEchoObserver implements CanvasObserver {
  private readonly output: OutputWriter;
  private silenceDepth = 0;

  constructor(output: OutputWriter) {
    this.output = output;
  }

  /**
   * 在 task 执行期间抑制回显：撤销/重做内部的 Canvas 变更不应重复打印，
   * 只由调用方回显“已撤销/已重做”。
   */
  silenced<T>(task: () => T): T {
    this.silenceDepth += 1;
    try {
      return task();
    } finally {
      this.silenceDepth -= 1;
    }
  }

  update(event: CanvasEvent): void {
    if (this.silenceDepth > 0) {
      return;
    }
    const shape = event.shape;
    switch (event.operation) {
      case "add":
        this.describe(shape, (label) => `已添加 ${label}`, true);
        return;
      case "remove":
        this.describe(shape, (label) => `已移除 ${label}`, true);
        return;
      case "move":
        this.describe(shape, (name) => `已移动 ${name}`, false);
        return;
      case "group":
        this.describe(shape, (name) => `已建组 ${name}`, false);
        return;
      case "ungroup":
        this.describe(shape, (name) => `已解散 ${name}`, false);
        return;
      case "document":
        this.output.writeLine("文档已更新");
        return;
    }
  }

  private describe(
    shape: CanvasEvent["shape"],
    render: (label: string) => string,
    withTag: boolean,
  ): void {
    if (shape === null) {
      return;
    }
    const label = withTag ? `${shape.getName()} (${shape.getTag()})` : shape.getName();
    this.output.writeLine(render(label));
  }
}
