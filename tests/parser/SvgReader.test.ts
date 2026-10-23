import { SvgReader } from "../../src/parser/SvgReader";
import { SvgParser } from "../../src/parser/SvgParser";
import { DefaultSvgElementFactory } from "../../src/parser/DefaultSvgElementFactory";
import { FakeTextFileStore } from "../helpers/FakeTextFileStore";

/** SvgReader：文件层 + 解析层的组合，负责把磁盘内容变成文档树。 */
describe("SvgReader", () => {
  const readerFor = (files: Record<string, string>) =>
    new SvgReader(new SvgParser(new DefaultSvgElementFactory()), new FakeTextFileStore(files));

  it("读取文件并解析为文档树", () => {
    const store = new FakeTextFileStore({
      "a.svg": '<svg width="10" height="20"><rect id="r"/></svg>',
    });
    const reader = new SvgReader(new SvgParser(new DefaultSvgElementFactory()), store);

    const doc = reader.read("a.svg");

    expect(doc.width).toBe(10);
    expect(doc.height).toBe(20);
    expect(doc.root.getChildren()[0]!.getName()).toBe("r");
    expect(store.readPaths()).toEqual(["a.svg"]);
  });

  it("透传解析阶段的缺 id 警告", () => {
    const reader = readerFor({ "a.svg": "<svg><rect/></svg>" });

    const doc = reader.read("a.svg");

    expect(doc.warnings).toHaveLength(1);
    expect(doc.root.getChildren()[0]!.getName()).toBe("shape-1");
  });

  it("文件读取失败时向上抛出", () => {
    const reader = readerFor({});

    expect(() => reader.read("missing.svg")).toThrow("ENOENT");
  });
});
