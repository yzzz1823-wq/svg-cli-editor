import type { ShapeStyle } from "../../src/core/ShapeStyle";

/** 测试用样式：与生产默认样式解耦，避免测试断言依赖默认值。 */
export const TEST_STYLE: ShapeStyle = {
  fill: "#ff0000",
  stroke: "#000000",
  strokeWidth: 1,
};
