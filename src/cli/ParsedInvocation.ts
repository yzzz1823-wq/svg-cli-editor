/** CLI 解析结果：动词 + 原始参数（尚未解释为命令）。 */
export interface ParsedInvocation {
  readonly verb: string;
  readonly args: readonly string[];
}
