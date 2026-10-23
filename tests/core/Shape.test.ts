import { StubContainer } from "../helpers/StubContainer";
import { StubShape } from "../helpers/StubShape";
import { TEST_STYLE } from "../helpers/TestStyle";

/**
 * Shape 是抽象基类，无法直接实例化，因此通过最小测试替身 StubShape
 * 验证基类提供给所有图形（叶子与 <g>）的公共契约。
 */
describe("Shape（抽象图形基类）", () => {
  it("保存构造时传入的名称，并可通过 getName 读回", () => {
    const shape = new StubShape("node-1");

    expect(shape.getName()).toBe("node-1");
  });

  it("保存构造时传入的样式，并可通过 getStyle 读回", () => {
    const shape = new StubShape("node-1", TEST_STYLE);

    expect(shape.getStyle()).toEqual(TEST_STYLE);
  });

  it("新建图形没有父容器", () => {
    const shape = new StubShape("node-1");

    expect(shape.getParent()).toBeNull();
  });

  it("setParent 建立父指针，setParent(null) 解除父指针", () => {
    const shape = new StubShape("node-1");
    const container = new StubContainer("root");

    shape.setParent(container);
    expect(shape.getParent()).toBe(container);

    shape.setParent(null);
    expect(shape.getParent()).toBeNull();
  });

  it("getTag 由具体子类决定（基类不做类型判断）", () => {
    expect(new StubShape("a").getTag()).toBe("stub");
    expect(new StubShape("b", TEST_STYLE, "circle").getTag()).toBe("circle");
  });
});
