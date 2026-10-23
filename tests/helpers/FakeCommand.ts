import type { Command } from "../../src/command/Command";

/** 只记录调用次数的命令替身，用于验证 CommandManager / HistoryStack 的栈行为。 */
export class FakeCommand implements Command {
  executeCalls = 0;
  undoCalls = 0;

  private readonly name: string;
  private readonly undoable: boolean;

  constructor(name: string, undoable = true) {
    this.name = name;
    this.undoable = undoable;
  }

  getName(): string {
    return this.name;
  }

  isUndoable(): boolean {
    return this.undoable;
  }

  execute(): void {
    this.executeCalls += 1;
  }

  undo(): void {
    this.undoCalls += 1;
  }
}
