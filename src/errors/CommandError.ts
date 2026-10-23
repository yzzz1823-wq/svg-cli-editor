import { EditorError } from "./EditorError";

/** 领域层拒绝执行某个操作（重名、找不到节点、非法组合等）时抛出。 */
export class CommandError extends EditorError {}
