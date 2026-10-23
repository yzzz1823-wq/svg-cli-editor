import { HistoryStack } from "../../src/command/HistoryStack";
import { CommandError } from "../../src/errors/CommandError";
import { FakeCommand } from "../helpers/FakeCommand";

/**
 * HistoryStack 是纯数据结构：只负责“有上限的栈”与后进先出，
 * 不理解命令语义，也不触发 execute/undo。
 */
describe("HistoryStack", () => {
  it("初始为空", () => {
    const stack = new HistoryStack();

    expect(stack.isEmpty()).toBe(true);
    expect(stack.size()).toBe(0);
    expect(stack.pop()).toBeNull();
  });

  it("按后进先出弹出命令", () => {
    const stack = new HistoryStack();
    stack.push(new FakeCommand("a"));
    stack.push(new FakeCommand("b"));

    expect(stack.size()).toBe(2);
    expect(stack.pop()?.getName()).toBe("b");
    expect(stack.pop()?.getName()).toBe("a");
    expect(stack.pop()).toBeNull();
  });

  it("超出容量时丢弃最早的记录", () => {
    const stack = new HistoryStack(2);
    stack.push(new FakeCommand("a"));
    stack.push(new FakeCommand("b"));
    stack.push(new FakeCommand("c"));

    expect(stack.size()).toBe(2);
    expect(stack.snapshot().map((command) => command.getName())).toEqual(["b", "c"]);
  });

  it("snapshot 返回最早到最新的副本，不受后续 push 影响", () => {
    const stack = new HistoryStack();
    stack.push(new FakeCommand("a"));

    const snapshot = stack.snapshot();
    stack.push(new FakeCommand("b"));

    expect(snapshot.map((command) => command.getName())).toEqual(["a"]);
    expect(stack.size()).toBe(2);
  });

  it("clear 清空历史但不影响后续使用", () => {
    const stack = new HistoryStack(2);
    stack.push(new FakeCommand("a"));
    stack.clear();

    expect(stack.isEmpty()).toBe(true);
    stack.push(new FakeCommand("b"));
    expect(stack.size()).toBe(1);
  });

  it("容量必须是正整数", () => {
    expect(() => new HistoryStack(0)).toThrow(CommandError);
    expect(() => new HistoryStack(-1)).toThrow(CommandError);
    expect(() => new HistoryStack(1.5)).toThrow(CommandError);
  });
});
