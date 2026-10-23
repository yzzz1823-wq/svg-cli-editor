/** 终端输出边界：REPL 与观察者只依赖它，测试用内存实现。 */
export interface OutputWriter {
  writeLine(text: string): void;
}
