/**
 * 编辑器的统一异常基类。
 * 所有对用户可见的错误都从它派生，CLI 层只需捕获 EditorError 即可统一输出。
 */
export class EditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
