import { ParseError } from "./ParseError";

/** SVG 文件内容不是受支持的 XML/SVG 子集时抛出。 */
export class SvgParseError extends ParseError {}
