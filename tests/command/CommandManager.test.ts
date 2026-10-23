import { CommandManager } from "../../src/command/CommandManager";
import { CommandError } from "../../src/errors/CommandError";
import { FakeCommand } from "../helpers/FakeCommand";

/**
 * CommandManager 是撤销/重做的唯一入口：
 * 可撤销命令执行后入撤销栈、重做栈清空；文档级命令执行后两个栈都清空且不入栈。
 */
describe("CommandManager", () => {
  let manager: CommandManager;

  beforeEach(() => {
    manager = new CommandManager();
  });

  it("执行命令后进入撤销栈", () => {
    const command = new FakeCommand("c1");

    manager.execute(command);

    expect(command.executeCalls).toBe(1);
    expect(manager.canUndo()).toBe(true);
    expect(manager.canRedo()).toBe(false);
    expect(manager.undoDepth()).toBe(1);
  });

  it("撤销调用命令的 undo 并移入重做栈", () => {
    const command = new FakeCommand("c1");
    manager.execute(command);

    const undone = manager.undo();

    expect(undone.getName()).toBe("c1");
    expect(command.undoCalls).toBe(1);
    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(true);
    expect(manager.redoDepth()).toBe(1);
  });

  it("重做重新 execute 并回到撤销栈", () => {
    const command = new FakeCommand("c1");
    manager.execute(command);
    manager.undo();

    const redone = manager.redo();

    expect(redone.getName()).toBe("c1");
    expect(command.executeCalls).toBe(2);
    expect(manager.canUndo()).toBe(true);
    expect(manager.canRedo()).toBe(false);
  });

  it("撤销后执行新命令会清空重做栈", () => {
    manager.execute(new FakeCommand("c1"));
    manager.undo();

    manager.execute(new FakeCommand("c2"));

    expect(manager.canRedo()).toBe(false);
    expect(manager.undoDepth()).toBe(1);
  });

  it("文档级命令不进撤销栈，并清空已有历史", () => {
    const undoable = new FakeCommand("c1");
    const documentCommand = new FakeCommand("init", false);
    manager.execute(undoable);

    manager.execute(documentCommand);

    expect(documentCommand.executeCalls).toBe(1);
    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(false);
    expect(manager.undoDepth()).toBe(0);
  });

  it("空栈撤销或重做抛 CommandError", () => {
    expect(() => manager.undo()).toThrow(CommandError);
    expect(() => manager.redo()).toThrow(CommandError);
  });

  it("超过深度上限时丢弃最早的记录", () => {
    const limited = new CommandManager(2);
    limited.execute(new FakeCommand("c1"));
    limited.execute(new FakeCommand("c2"));
    limited.execute(new FakeCommand("c3"));

    expect(limited.undoDepth()).toBe(2);
    limited.undo();
    limited.undo();
    expect(limited.canUndo()).toBe(false);
  });

  it("连续撤销按相反顺序执行", () => {
    const first = new FakeCommand("c1");
    const second = new FakeCommand("c2");
    manager.execute(first);
    manager.execute(second);

    expect(manager.undo().getName()).toBe("c2");
    expect(manager.undo().getName()).toBe("c1");
    expect(manager.canUndo()).toBe(false);
  });

  it("clear 同时清空两个栈", () => {
    manager.execute(new FakeCommand("c1"));
    manager.undo();
    manager.execute(new FakeCommand("c2"));

    manager.clear();

    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(false);
  });
});
