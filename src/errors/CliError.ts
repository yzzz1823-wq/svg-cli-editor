import { EditorError } from "./EditorError";

/** CLI 输入不合法（未知命令、参数缺失、格式错误）时抛出，消息直接面向用户。 */
export class CliError extends EditorError {}
