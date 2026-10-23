/**
 * 属性补丁（值对象）：set 命令与撤销快照共用的“绝对值覆盖”载体。
 *
 * 只有给出的字段会被覆盖；未给出的字段保持原值。
 * 名称不在补丁里，因此从类型层面杜绝改名。
 * 字段可变：撤销快照由图形自身的 captureGeometry 逐项写入。
 */
export interface AttributePatch {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  radius?: number;
  rx?: number;
  ry?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  fill?: string;
  stroke?: string | null;
  strokeWidth?: number;
}
