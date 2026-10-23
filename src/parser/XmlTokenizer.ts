import { SvgParseError } from "../errors/SvgParseError";
import { XmlElement } from "./XmlElement";

interface TagReadResult {
  readonly end: number;
  readonly closing: boolean;
  readonly name: string;
  readonly attributes: ReadonlyMap<string, string>;
  readonly selfClosing: boolean;
}

const NAME_START = /[A-Za-z_:]/;
const NAME_PART = /[A-Za-z0-9_:.-]/;

/**
 * 极简 XML 词法/语法分析器：只覆盖编辑器需要的子集。
 * 不做 DTD、命名空间解析，也不保留注释；结构不合法一律抛 SvgParseError。
 */
export class XmlTokenizer {
  parse(source: string): XmlElement {
    return this.scan(this.stripNoise(source));
  }

  /** 去掉 XML 声明、注释与 DOCTYPE，避免它们干扰标签扫描。 */
  private stripNoise(source: string): string {
    return source
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<\?xml[\s\S]*?\?>/g, "")
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "");
  }

  private scan(source: string): XmlElement {
    const stack: XmlElement[] = [];
    let root: XmlElement | null = null;
    let index = 0;

    while (index < source.length) {
      const tagStart = source.indexOf("<", index);
      if (tagStart < 0) {
        this.appendText(stack, source.slice(index));
        index = source.length;
        break;
      }
      if (tagStart > index) {
        this.appendText(stack, source.slice(index, tagStart));
      }

      const tag = this.readTag(source, tagStart);
      if (tag.closing) {
        const current = stack.pop();
        if (current === undefined) {
          throw new SvgParseError(`多余的结束标签：</${tag.name}>`);
        }
        if (current.getTagName() !== tag.name) {
          throw new SvgParseError(`标签不匹配：<${current.getTagName()}> 与 </${tag.name}>`);
        }
      } else {
        const element = new XmlElement(tag.name, tag.attributes);
        if (stack.length === 0) {
          if (root !== null) {
            throw new SvgParseError("存在多个根元素");
          }
          root = element;
        } else {
          stack[stack.length - 1]?.appendChild(element);
        }
        if (!tag.selfClosing) {
          stack.push(element);
        }
      }
      index = tag.end;
    }

    if (stack.length > 0) {
      throw new SvgParseError(`标签未闭合：<${stack[stack.length - 1]?.getTagName() ?? ""}>`);
    }
    if (root === null) {
      throw new SvgParseError("未找到根元素");
    }
    return root;
  }

  private appendText(stack: XmlElement[], text: string): void {
    if (text.trim() === "") {
      return;
    }
    const current = stack[stack.length - 1];
    if (current === undefined) {
      throw new SvgParseError("根元素之外出现文本内容");
    }
    current.appendText(this.unescape(text));
  }

  private readTag(source: string, start: number): TagReadResult {
    let index = start + 1;
    let closing = false;
    if (source[index] === "/") {
      closing = true;
      index += 1;
    }
    index = this.skipWhitespace(source, index);
    const name = this.readName(source, index);
    if (name === "") {
      throw new SvgParseError(`无法识别的标签：${source.slice(start, Math.min(start + 24, source.length))}`);
    }
    index += name.length;

    const attributes = new Map<string, string>();
    if (closing) {
      index = this.skipWhitespace(source, index);
      if (source[index] !== ">") {
        throw new SvgParseError(`结束标签格式错误：</${name}>`);
      }
      return { end: index + 1, closing, name, attributes, selfClosing: false };
    }

    while (index < source.length) {
      index = this.skipWhitespace(source, index);
      const char = source[index];
      if (char === ">") {
        return { end: index + 1, closing, name, attributes, selfClosing: false };
      }
      if (char === "/" && source[index + 1] === ">") {
        return { end: index + 2, closing, name, attributes, selfClosing: true };
      }
      if (char === undefined) {
        break;
      }

      const attributeName = this.readName(source, index);
      if (attributeName === "") {
        throw new SvgParseError(`标签 <${name}> 的属性格式错误`);
      }
      index += attributeName.length;
      index = this.skipWhitespace(source, index);
      if (source[index] !== "=") {
        throw new SvgParseError(`标签 <${name}> 的属性 "${attributeName}" 缺少取值`);
      }
      index += 1;
      index = this.skipWhitespace(source, index);

      const quote = source[index];
      if (quote !== '"' && quote !== "'") {
        throw new SvgParseError(`标签 <${name}> 的属性 "${attributeName}" 取值未加引号`);
      }
      const close = source.indexOf(quote, index + 1);
      if (close < 0) {
        throw new SvgParseError(`标签 <${name}> 的属性 "${attributeName}" 引号未闭合`);
      }
      attributes.set(attributeName, this.unescape(source.slice(index + 1, close)));
      index = close + 1;
    }

    throw new SvgParseError(`标签未闭合：<${name}>`);
  }

  private skipWhitespace(source: string, index: number): number {
    let cursor = index;
    while (cursor < source.length && (source[cursor] ?? "").trim() === "") {
      cursor += 1;
    }
    return cursor;
  }

  private readName(source: string, index: number): string {
    const first = source[index] ?? "";
    if (!NAME_START.test(first)) {
      return "";
    }
    let end = index + 1;
    while (end < source.length && NAME_PART.test(source[end] ?? "")) {
      end += 1;
    }
    return source.slice(index, end);
  }

  private unescape(value: string): string {
    return value.replace(/&(#x?[0-9A-Fa-f]+|[A-Za-z]+);/g, (match: string, entity: string): string => {
      switch (entity) {
        case "amp":
          return "&";
        case "lt":
          return "<";
        case "gt":
          return ">";
        case "quot":
          return '"';
        case "apos":
          return "'";
        default: {
          if (entity.startsWith("#x") || entity.startsWith("#X")) {
            return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
          }
          if (entity.startsWith("#")) {
            return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
          }
          return match;
        }
      }
    });
  }
}
