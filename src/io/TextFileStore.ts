/** 文本文件读写边界；生产环境用 node:fs 实现，测试用内存替身。 */
export interface TextFileStore {
  readText(path: string): string;
}
