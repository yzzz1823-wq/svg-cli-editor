import type { Container } from "./Container";

/**
 * 组合节点的创建入口。
 *
 * 按类型名创建实例的“类型分派”收敛到工厂实现里（唯一被允许的类型分派点之一），
 * Canvas 只依赖本接口，从而不感知具体图形类。
 */
export interface ContainerFactory {
  /** 新建文档根节点。 */
  createRoot(): Container;

  /** 新建命名分组。 */
  createGroup(name: string): Container;
}
