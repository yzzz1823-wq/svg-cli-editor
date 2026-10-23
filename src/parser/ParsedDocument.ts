import type { Container } from "../core/Container";

/**
 * 解析结果：一棵未挂载到 Canvas 的文档树 + 画布尺寸 + 告警。
 * 由 read 命令负责把 root 交给 Canvas.load，并清空撤销栈。
 */
export interface ParsedDocument {
  readonly root: Container;
  readonly width: number;
  readonly height: number;
  readonly warnings: readonly string[];
}
