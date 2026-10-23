import type { Container } from "../../src/core/Container";
import type { ContainerFactory } from "../../src/core/ContainerFactory";
import { StubContainer } from "./StubContainer";

/** 让 core 层测试不依赖 shapes/Group 的最小工厂。 */
export class StubContainerFactory implements ContainerFactory {
  createRoot(): Container {
    return new StubContainer("root");
  }

  createGroup(name: string): Container {
    return new StubContainer(name);
  }
}
