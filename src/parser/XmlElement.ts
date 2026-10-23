/**
 * XML 元素的轻量 AST 节点（解析期内部结构，不进入领域层）。
 * 只暴露读取与构建两类行为，避免解析器直接摆弄裸字段。
 */
export class XmlElement {
  private readonly tagName: string;
  private readonly attributes: Map<string, string>;
  private readonly children: XmlElement[] = [];
  private textContent = "";

  constructor(tagName: string, attributes: ReadonlyMap<string, string>) {
    this.tagName = tagName;
    this.attributes = new Map(attributes);
  }

  getTagName(): string {
    return this.tagName;
  }

  /** 属性不存在返回 null（区分“缺失”与空串）。 */
  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  getAttributes(): ReadonlyMap<string, string> {
    return new Map(this.attributes);
  }

  appendChild(child: XmlElement): void {
    this.children.push(child);
  }

  getChildren(): readonly XmlElement[] {
    return this.children;
  }

  appendText(text: string): void {
    this.textContent += text;
  }

  getText(): string {
    return this.textContent;
  }
}
