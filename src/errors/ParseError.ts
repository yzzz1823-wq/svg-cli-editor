import { EditorError } from "./EditorError";

/** 命令行文本无法解析为合法命令时抛出。 */
export class ParseError extends EditorError {}
