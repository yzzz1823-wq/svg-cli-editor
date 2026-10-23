/** 逐行输入边界；返回 null 表示输入结束（EOF 或用户选择退出）。 */
export interface LineReader {
  readLine(): string | null;
}
