import { SaveCommand } from "../../src/command/SaveCommand";
import { SvgExportVisitor } from "../../src/visitor/SvgExportVisitor";
import { createCliHarness } from "../helpers/CliHarness";
import type { CliHarness } from "../helpers/CliHarness";
import type { TextFileWriter } from "../../src/io/TextFileWriter";

/**
 * 官方错误输出规范表的契约测试：逐条断言 CLI 输出的最后一行与规范文本完全一致。
 */
const lastLine = (harness: CliHarness): string => {
  const lines = harness.output.linesWritten();
  return lines[lines.length - 1] ?? "";
};

describe("错误输出规范", () => {
  it("id 已存在：error: id already exists: <id>", () => {
    const harness = createCliHarness();
    harness.executeLine("create rect r1 0 0 1 1");
    harness.executeLine("create rect r1 2 2 1 1");

    expect(lastLine(harness)).toBe("error: id already exists: r1");
  });

  it("id 不存在：error: no such shape: <id>", () => {
    const harness = createCliHarness();

    harness.executeLine("remove ghost");

    expect(lastLine(harness)).toBe("error: no such shape: ghost");
  });

  it("move 的 id 不存在同样报 no such shape", () => {
    const harness = createCliHarness();

    harness.executeLine("move ghost 1 1");

    expect(lastLine(harness)).toBe("error: no such shape: ghost");
  });

  it("in 目标不存在：error: no such container: <containerId>", () => {
    const harness = createCliHarness();

    harness.executeLine("create rect r1 0 0 1 1 in ghost");

    expect(lastLine(harness)).toBe("error: no such container: ghost");
  });

  it("in 目标不是容器：error: not a container: <id>", () => {
    const harness = createCliHarness();
    harness.executeLine("create rect r1 0 0 1 1");

    harness.executeLine("create rect r2 0 0 1 1 in r1");

    expect(lastLine(harness)).toBe("error: not a container: r1");
  });

  it("未注册的图形类型：带插件提示", () => {
    const harness = createCliHarness();

    harness.executeLine("create star s1");

    expect(lastLine(harness)).toBe("error: unknown shape type: star (is the plugin loaded?)");
  });

  it("ungroup 非容器图形：error: cannot ungroup composite shape: <id>", () => {
    const harness = createCliHarness();
    harness.executeLine("create rect r1 0 0 1 1");

    harness.executeLine("ungroup r1");

    expect(lastLine(harness)).toBe("error: cannot ungroup composite shape: r1");
  });

  it("ungroup 根级容器：error: cannot ungroup top-level container: <id>", () => {
    const harness = createCliHarness();
    harness.executeLine("create rect r1 0 0 1 1");
    harness.executeLine("create rect r2 0 0 2 2");
    harness.executeLine("group g1 r1 r2");

    harness.executeLine("ungroup g1");

    expect(lastLine(harness)).toBe("error: cannot ungroup top-level container: g1");
  });

  it("group 同时包含容器与其子孙：error: cannot group a container into its own descendant", () => {
    const harness = createCliHarness();
    harness.executeLine("create g g1");
    harness.executeLine("create rect r1 0 0 1 1 in g1");
    harness.executeLine("create rect r2 0 0 2 2");

    harness.executeLine("group g2 g1 r1");

    expect(lastLine(harness)).toBe(
      "error: cannot group a container into its own descendant: g1",
    );
  });

  it("scale 非正数：error: scale factor must be positive", () => {
    const harness = createCliHarness();
    harness.executeLine("create rect r1 0 0 1 1");

    harness.executeLine("scale r1 0");

    expect(lastLine(harness)).toBe("error: scale factor must be positive");
  });

  it("文件不存在：error: cannot read file: <file>", () => {
    const harness = createCliHarness();

    harness.executeLine("read missing.svg");

    expect(lastLine(harness)).toBe("error: cannot read file: missing.svg");
  });

  it("文件不可写：error: cannot write file: <file>", () => {
    const harness = createCliHarness();
    const failing: TextFileWriter = {
      writeText: () => {
        throw new Error("EACCES: permission denied");
      },
    };
    const command = new SaveCommand(harness.canvas, new SvgExportVisitor(), failing, "/tmp/out.svg");

    expect(() => command.execute()).toThrow("cannot write file: /tmp/out.svg");
  });

  it("未 init/read 就操作：error: no document. use 'init' or 'read' first", () => {
    const harness = createCliHarness({ initializeDocument: false });

    harness.executeLine("create rect r1 0 0 1 1");
    expect(lastLine(harness)).toBe("error: no document. use 'init' or 'read' first");

    harness.executeLine("tree");
    expect(lastLine(harness)).toBe("error: no document. use 'init' or 'read' first");

    harness.executeLine("init");
    harness.executeLine("create rect r1 0 0 1 1");
    expect(lastLine(harness)).toBe("已添加 r1 (rect)");
  });
});
