import type { Command } from "./Command";

/** 命令基类：统一实现“命令名”与默认可撤销，子类只关心正逆向操作。 */
export abstract class BaseCommand implements Command {
  private readonly name: string;

  protected constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  isUndoable(): boolean {
    return true;
  }

  abstract execute(): void;

  abstract undo(): void;
}
