import { CommandError } from "../errors/CommandError";
import { HistoryStack } from "./HistoryStack";
import type { Command } from "./Command";

/** 默认的撤销深度。 */
const DEFAULT_DEPTH = 100;

/**
 * 撤销/重做的唯一入口。
 *
 * - 可撤销命令：执行 → 入撤销栈，并清空重做栈；
 * - 文档级命令：执行 → 两个栈都清空，且命令本身不入栈。
 */
export class CommandManager {
  private readonly undoStack: HistoryStack;
  private readonly redoStack: HistoryStack;

  constructor(maxDepth: number = DEFAULT_DEPTH) {
    this.undoStack = new HistoryStack(maxDepth);
    this.redoStack = new HistoryStack(maxDepth);
  }

  execute(command: Command): void {
    command.execute();
    if (!command.isUndoable()) {
      this.clear();
      return;
    }
    this.undoStack.push(command);
    this.redoStack.clear();
  }

  /** 撤销最近一条命令；空栈抛 CommandError。 */
  undo(): Command {
    const command = this.undoStack.pop();
    if (command === null) {
      throw new CommandError("没有可撤销的命令");
    }
    command.undo();
    this.redoStack.push(command);
    return command;
  }

  /** 重做最近一条被撤销的命令；空栈抛 CommandError。 */
  redo(): Command {
    const command = this.redoStack.pop();
    if (command === null) {
      throw new CommandError("没有可重做的命令");
    }
    command.execute();
    this.undoStack.push(command);
    return command;
  }

  canUndo(): boolean {
    return !this.undoStack.isEmpty();
  }

  canRedo(): boolean {
    return !this.redoStack.isEmpty();
  }

  undoDepth(): number {
    return this.undoStack.size();
  }

  redoDepth(): number {
    return this.redoStack.size();
  }

  clear(): void {
    this.undoStack.clear();
    this.redoStack.clear();
  }
}
