/** 文本文件写入边界；save 命令依赖它，测试用内存替身。 */
export interface TextFileWriter {
  writeText(path: string, content: string): void;
}
