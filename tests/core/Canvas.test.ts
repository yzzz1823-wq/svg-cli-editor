import { Canvas } from "../../src/core/Canvas";
import type { Container } from "../../src/core/Container";
import { CommandError } from "../../src/errors/CommandError";
import { RecordingObserver } from "../helpers/RecordingObserver";
import { StubContainer } from "../helpers/StubContainer";
import { StubContainerFactory } from "../helpers/StubContainerFactory";
import { StubShape } from "../helpers/StubShape";

/**
 * Canvas 是文档聚合根，也是 Observer 模式中的 Subject：
 * 所有结构变更都经过它，由它维护“全局唯一名称”“父子一致”“变更后通知”三条不变量。
 * 通知只描述“已经发生的事实”，失败的操作不发通知。
 */
describe("Canvas", () => {
  let canvas: Canvas;
  let observer: RecordingObserver;

  /** 默认挂到根节点的测试用叶子。 */
  const add = (name: string): StubShape => {
    const shape = new StubShape(name);
    canvas.addShape(shape);
    return shape;
  };

  /** 造一个两节点的组，返回该组。 */
  const addGroup = (name: string): Container => {
    return canvas.groupShapes([add(`${name}-a`), add(`${name}-b`)], name);
  };

  beforeEach(() => {
    canvas = new Canvas(new StubContainerFactory());
    observer = new RecordingObserver();
    canvas.attach(observer);
  });

  describe("文档状态", () => {
    it("新建画布得到 800×600 的空文档", () => {
      expect(canvas.getWidth()).toBe(800);
      expect(canvas.getHeight()).toBe(600);
      expect(canvas.getRoot().childCount()).toBe(0);
    });

    it("init 重置画布尺寸并清空内容", () => {
      add("a");

      canvas.init(400, 300);

      expect(canvas.getWidth()).toBe(400);
      expect(canvas.getHeight()).toBe(300);
      expect(canvas.getRoot().childCount()).toBe(0);
    });

    it("init 发出 document 事件", () => {
      observer.reset();

      canvas.init(400, 300);

      expect(observer.operations()).toEqual(["document"]);
      expect(observer.last()?.shape).toBeNull();
    });

    it("load 用外部图形树替换文档根并更新尺寸", () => {
      const root = new StubContainerFactory().createRoot();
      root.append(new StubShape("imported"));

      canvas.load(root, 100, 50);

      expect(canvas.getRoot()).toBe(root);
      expect(canvas.findShape("imported")).not.toBeNull();
      expect(canvas.getWidth()).toBe(100);
      expect(canvas.getHeight()).toBe(50);
    });

    it("load 发出 document 事件", () => {
      observer.reset();

      canvas.load(new StubContainerFactory().createRoot(), 10, 10);

      expect(observer.operations()).toEqual(["document"]);
    });
  });

  describe("添加图形", () => {
    it("addShape 默认挂到根节点并建立父指针", () => {
      const shape = new StubShape("a");

      canvas.addShape(shape);

      expect(shape.getParent()).toBe(canvas.getRoot());
      expect(canvas.getRoot().getChildren()).toEqual([shape]);
    });

    it("addShape 允许显式指定已存在的容器作为父节点", () => {
      const group = addGroup("g");
      const child = new StubShape("c");

      canvas.addShape(child, group);

      expect(child.getParent()).toBe(group);
      expect(group.childCount()).toBe(3);
      expect(group.getChildren()[2]).toBe(child);
      expect(canvas.findShape("c")).toBe(child);
    });

    it("addShape 发出携带该图形的 add 事件", () => {
      const shape = new StubShape("a");

      canvas.addShape(shape);

      expect(observer.operations()).toEqual(["add"]);
      expect(observer.last()?.shape).toBe(shape);
    });

    it("addShape 与嵌套节点重名时抛出 CommandError，且文档与通知都不变", () => {
      const a = add("a");
      addGroup("g");
      const before = canvas.getRoot().childCount();
      observer.reset();

      expect(() => canvas.addShape(new StubShape("a"))).toThrow(CommandError);

      expect(canvas.getRoot().childCount()).toBe(before);
      expect(canvas.findShape("a")).toBe(a);
      expect(observer.events).toEqual([]);
    });
  });

  describe("查找与删除", () => {
    it("findShape 能递归找到嵌套在组内的图形", () => {
      const a = add("a");
      const b = add("b");
      const group = canvas.groupShapes([a, b], "g");

      expect(canvas.findShape("a")).toBe(a);
      expect(canvas.findShape("b")).toBe(b);
      expect(canvas.getRoot().getChildren()).toEqual([group]);
    });

    it("findShape 找不到时返回 null", () => {
      expect(canvas.findShape("missing")).toBeNull();
    });

    it("removeShape 摘除图形并清除父指针", () => {
      const a = add("a");

      canvas.removeShape(a);

      expect(a.getParent()).toBeNull();
      expect(canvas.getRoot().childCount()).toBe(0);
      expect(canvas.findShape("a")).toBeNull();
    });

    it("removeShape 发出携带该图形的 remove 事件", () => {
      const a = add("a");
      observer.reset();

      canvas.removeShape(a);

      expect(observer.operations()).toEqual(["remove"]);
      expect(observer.last()?.shape).toBe(a);
    });

    it("removeShape 允许删除组（子节点随组一起离开文档）", () => {
      const group = addGroup("g");

      canvas.removeShape(group);

      expect(group.getParent()).toBeNull();
      expect(canvas.findShape("g")).toBeNull();
      expect(canvas.findShape("g-a")).toBeNull();
    });

    it("removeShape 拒绝移除文档根节点", () => {
      expect(() => canvas.removeShape(canvas.getRoot())).toThrow(CommandError);
      expect(canvas.getRoot().getParent()).toBeNull();
    });

    it("removeShape 拒绝移除不在文档中的图形", () => {
      expect(() => canvas.removeShape(new StubShape("ghost"))).toThrow(
        CommandError,
      );
    });
  });

  describe("移动", () => {
    it("moveShape 把位移委托给图形自身并发出 move 事件", () => {
      const a = add("a");
      observer.reset();

      canvas.moveShape(a, 10, -5);

      expect(a.getOffset()).toEqual({ x: 10, y: -5 });
      expect(observer.operations()).toEqual(["move"]);
      expect(observer.last()?.shape).toBe(a);
    });

    it("moveShape 拒绝移动文档根节点", () => {
      expect(() => canvas.moveShape(canvas.getRoot(), 1, 1)).toThrow(
        CommandError,
      );
    });
  });

  describe("组合", () => {
    it("groupShapes 把新组插入到首个子节点的原位置", () => {
      const a = add("a");
      const b = add("b");
      const c = add("c");
      const d = add("d");

      const group = canvas.groupShapes([b, d], "g");

      expect(canvas.getRoot().getChildren()).toEqual([a, group, c]);
      expect(group.getChildren()).toEqual([b, d]);
    });

    it("groupShapes 按文档顺序收拢子节点（与参数顺序无关）", () => {
      const a = add("a");
      const b = add("b");

      const group = canvas.groupShapes([b, a], "g");

      expect(group.getChildren()).toEqual([a, b]);
    });

    it("groupShapes 更新组与子节点的父子指针", () => {
      const a = add("a");
      const b = add("b");

      const group = canvas.groupShapes([a, b], "g");

      expect(a.getParent()).toBe(group);
      expect(b.getParent()).toBe(group);
      expect(group.getParent()).toBe(canvas.getRoot());
    });

    it("groupShapes 发出携带新组的 group 事件", () => {
      const a = add("a");
      const b = add("b");
      observer.reset();

      const group = canvas.groupShapes([a, b], "g");

      expect(observer.operations()).toEqual(["group"]);
      expect(observer.last()?.shape).toBe(group);
    });

    it("groupShapes 少于两个节点时抛出 CommandError", () => {
      const a = add("a");

      expect(() => canvas.groupShapes([a], "g")).toThrow(CommandError);
      expect(a.getParent()).toBe(canvas.getRoot());
    });

    it("groupShapes 跨父容器时抛出 CommandError", () => {
      const a = add("a");
      const b = add("b");
      const group = canvas.groupShapes([a, b], "g");
      const outside = add("c");

      expect(() => canvas.groupShapes([a, outside], "g2")).toThrow(CommandError);
      expect(group.getChildren()).toEqual([a, b]);
    });

    it("groupShapes 含重复节点时抛出 CommandError", () => {
      const a = add("a");
      add("b");

      expect(() => canvas.groupShapes([a, a], "g")).toThrow(CommandError);
      expect(a.getParent()).toBe(canvas.getRoot());
    });

    it("groupShapes 与已有节点重名时抛出 CommandError", () => {
      const a = add("a");
      const b = add("b");

      expect(() => canvas.groupShapes([a, b], "a")).toThrow(CommandError);
      expect(a.getParent()).toBe(canvas.getRoot());
    });
  });

  describe("解组", () => {
    it("ungroupContainer 用子节点原位替换组", () => {
      const a = add("a");
      const b = add("b");
      const c = add("c");
      const group = canvas.groupShapes([a, c], "g");

      canvas.ungroupContainer(group);

      // 组占据首个子节点 a 的位置；未被选中的 b 保持在组之后。
      expect(canvas.getRoot().getChildren()).toEqual([a, c, b]);
      expect(group.childCount()).toBe(0);
    });

    it("ungroupContainer 把子节点父指针交还给祖父容器", () => {
      const a = add("a");
      const b = add("b");
      const group = canvas.groupShapes([a, b], "g");

      canvas.ungroupContainer(group);

      expect(a.getParent()).toBe(canvas.getRoot());
      expect(b.getParent()).toBe(canvas.getRoot());
      expect(group.getParent()).toBeNull();
    });

    it("ungroupContainer 发出携带被解散组的 ungroup 事件", () => {
      const a = add("a");
      const b = add("b");
      const group = canvas.groupShapes([a, b], "g");
      observer.reset();

      canvas.ungroupContainer(group);

      expect(observer.operations()).toEqual(["ungroup"]);
      expect(observer.last()?.shape).toBe(group);
    });

    it("ungroupContainer 拒绝作用于文档根节点", () => {
      expect(() => canvas.ungroupContainer(canvas.getRoot())).toThrow(
        CommandError,
      );
    });

    it("ungroupContainer 拒绝游离容器", () => {
      expect(() => canvas.ungroupContainer(new StubContainer("free"))).toThrow(
        CommandError,
      );
    });
  });

  describe("观察者", () => {
    it("多个观察者都能收到同一事件", () => {
      const second = new RecordingObserver();
      canvas.attach(second);

      add("a");

      expect(observer.operations()).toEqual(["add"]);
      expect(second.operations()).toEqual(["add"]);
    });

    it("detach 之后不再收到事件", () => {
      canvas.detach(observer);

      add("a");

      expect(observer.events).toEqual([]);
    });

    it("空操作不会发出通知（失败命令必须在通知之前中止）", () => {
      expect(() => canvas.groupShapes([], "g")).toThrow(CommandError);

      expect(observer.events).toEqual([]);
    });
  });
});
