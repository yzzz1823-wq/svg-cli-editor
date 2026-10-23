/**
 * 命令接口 —— Command 模式的统一契约。
 *
 * 命令只描述“做什么”，执行与撤销都委托给接收者（Canvas）；
 * 文档级命令通过 isUndoable() 返回 false，避免被压入撤销栈。
 */
export interface Command {
  /** 命令名（与 CLI 动词一致：add / remove / translate / group / ungroup / init / canvas）。 */
  getName(): string;

  /** 正向操作。 */
  execute(): void;

  /** 逆向操作，必须把文档恢复到 execute 之前的状态。 */
  undo(): void;

  /** 是否进入撤销栈；文档级命令返回 false。 */
  isUndoable(): boolean;
}
