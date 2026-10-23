import { CommandError } from "../errors/CommandError";
import type { Command } from "./Command";

/** 撤销/重做栈的默认容量。 */
const DEFAULT_CAPACITY = 100;

/**
 * 有界的历史栈（纯数据结构）。
 *
 * 只负责后进先出与容量上限，不理解命令语义；撤销/重做该做什么由 CommandManager 决定。
 */
export class HistoryStack {
  private readonly capacity: number;
  private readonly commands: Command[] = [];

  constructor(capacity: number = DEFAULT_CAPACITY) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new CommandError(`历史栈容量必须是正整数，当前为 ${capacity}`);
    }
    this.capacity = capacity;
  }

  /** 压栈；超过容量时丢弃最早的一条。 */
  push(command: Command): void {
    this.commands.push(command);
    if (this.commands.length > this.capacity) {
      this.commands.shift();
    }
  }

  /** 弹栈；为空返回 null。 */
  pop(): Command | null {
    return this.commands.pop() ?? null;
  }

  clear(): void {
    this.commands.length = 0;
  }

  size(): number {
    return this.commands.length;
  }

  isEmpty(): boolean {
    return this.commands.length === 0;
  }

  /** 最早到最新的只读副本，供测试与调试使用。 */
  snapshot(): readonly Command[] {
    return [...this.commands];
  }
}
