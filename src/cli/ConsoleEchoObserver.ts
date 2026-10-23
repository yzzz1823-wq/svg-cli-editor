import type { CanvasEvent } from "../core/CanvasEvent";
import type { CanvasObserver } from "../core/CanvasObserver";
import type { OutputWriter } from "./OutputWriter";

/**
 * Observer 模式中的具体观察者：把画布领域事件翻译成一行中文回显。
 *
 * 撤销/重做期间由 CliApp 调用 silenced() 临时静音，
 * 避免内部变更与“已撤销/已重做”提示重复。
 */
export class ConsoleEchoObserver implements CanvasObserver {
  private silent = false;

  constructor(private readonly output: OutputWriter) {}

  update(event: CanvasEvent): void {
    if (this.silent) {
      return;
    }
    if (event.operation === "document") {
      this.output.writeLine("文档已更新");
      return;
    }
    const shape = event.shape;
    if (shape === null) {
      return;
    }
    const name = shape.getName();
    const tag = shape.getTag();
    switch (event.operation) {
      case "add":
        this.output.writeLine(`已添加 ${name} (${tag})`);
        return;
      case "remove":
        this.output.writeLine(`已移除 ${name} (${tag})`);
        return;
      case "move":
        this.output.writeLine(`已移动 ${name}`);
        return;
      case "scale":
        this.output.writeLine(`已缩放 ${name}`);
        return;
      case "set":
        this.output.writeLine(`已修改 ${name}`);
        return;
      case "group":
        this.output.writeLine(`已建组 ${name}`);
        return;
      case "ungroup":
        this.output.writeLine(`已解散 ${name}`);
        return;
    }
  }

  /** 在静音状态下执行任务，结束后恢复原状态（即使抛错）。 */
  silenced<T>(task: () => T): T {
    const previous = this.silent;
    this.silent = true;
    try {
      return task();
    } finally {
      this.silent = previous;
    }
  }
}
