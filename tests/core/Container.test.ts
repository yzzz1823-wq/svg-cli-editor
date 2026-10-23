import { CommandError } from "../../src/errors/CommandError";
import { StubContainer } from "../helpers/StubContainer";
import { StubShape } from "../helpers/StubShape";

/**
 * Container 是组合节点（<g> 与文档根）的抽象基类。
 * 这里只验证“子节点集合 + 父子指针一致性”这一组合契约，
 * 不涉及 accept / translate / getTag（由具体子类负责）。
 */
describe("Container（抽象组合节点）", () => {
  let container: StubContainer;
  let first: StubShape;
  let second: StubShape;

  beforeEach(() => {
    container = new StubContainer("root");
    first = new StubShape("first");
    second = new StubShape("second");
  });

  it("新建容器没有任何子节点", () => {
    expect(container.childCount()).toBe(0);
    expect(container.getChildren()).toEqual([]);
  });

  it("append 按调用顺序追加子节点并建立父指针", () => {
    container.append(first);
    container.append(second);

    expect(container.getChildren()).toEqual([first, second]);
    expect(first.getParent()).toBe(container);
    expect(second.getParent()).toBe(container);
  });

  it("append 一个已属于其它容器的节点时抛出 CommandError，且原容器不受影响", () => {
    const other = new StubContainer("other");
    other.append(first);

    expect(() => container.append(first)).toThrow(CommandError);
    expect(other.getChildren()).toEqual([first]);
    expect(container.childCount()).toBe(0);
  });

  it("append 同一个节点两次时抛出 CommandError", () => {
    container.append(first);

    expect(() => container.append(first)).toThrow(CommandError);
    expect(container.childCount()).toBe(1);
  });

  it("insertAt 在指定下标插入节点并保持既有顺序", () => {
    container.append(first);
    container.insertAt(0, second);

    expect(container.getChildren()).toEqual([second, first]);
  });

  it("insertAt 允许在末尾插入（下标等于当前子节点数量）", () => {
    container.append(first);
    container.insertAt(1, second);

    expect(container.getChildren()).toEqual([first, second]);
  });

  it("insertAt 下标越界时抛出 CommandError，且容器不变", () => {
    expect(() => container.insertAt(1, first)).toThrow(CommandError);
    expect(container.childCount()).toBe(0);
  });

  it("indexOf 返回子节点所在下标", () => {
    container.append(first);
    container.append(second);

    expect(container.indexOf(first)).toBe(0);
    expect(container.indexOf(second)).toBe(1);
  });

  it("indexOf 对不是子节点的图形返回 -1", () => {
    expect(container.indexOf(first)).toBe(-1);
  });

  it("remove 摘除子节点并清除其父指针", () => {
    container.append(first);
    container.append(second);

    container.remove(first);

    expect(container.getChildren()).toEqual([second]);
    expect(first.getParent()).toBeNull();
  });

  it("remove 非子节点时抛出 CommandError", () => {
    expect(() => container.remove(first)).toThrow(CommandError);
  });

  it("getChildren 返回防御性快照，外部修改不影响容器内部结构", () => {
    container.append(first);

    const snapshot = container.getChildren() as StubShape[];
    snapshot.push(second);

    expect(container.childCount()).toBe(1);
    expect(container.getChildren()).toEqual([first]);
  });

  it("getChildByName 找到直接子节点，找不到时返回 null", () => {
    container.append(first);

    expect(container.getChildByName("first")).toBe(first);
    expect(container.getChildByName("missing")).toBeNull();
  });

  it("getChildByName 不递归进入子容器（深查找是 Canvas 的职责）", () => {
    const inner = new StubContainer("inner");
    inner.append(first);
    container.append(inner);

    expect(container.getChildByName("first")).toBeNull();
    expect(inner.getChildByName("first")).toBe(first);
  });
});
