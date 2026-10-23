import type { Container } from "./Container";
import type { ContainerFactory } from "./ContainerFactory";
import { Group } from "../shapes/Group";

/** 生产环境使用的组合节点工厂：根节点固定命名为 root。 */
export class DefaultContainerFactory implements ContainerFactory {
  createRoot(): Container {
    return new Group("root");
  }

  createGroup(name: string): Container {
    return new Group(name);
  }
}
