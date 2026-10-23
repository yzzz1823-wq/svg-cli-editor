import { CliError } from "../../src/errors/CliError";
import { CliParser } from "../../src/cli/CliParser";

describe("CliParser", () => {
  const parser = new CliParser();

  it("解析命令名与参数", () => {
    expect(parser.parse("init 800 600")).toEqual({
      verb: "init",
      args: ["800", "600"],
    });
  });

  it("折叠多余空白", () => {
    expect(parser.parse("   add   rect   r1  ")).toEqual({
      verb: "add",
      args: ["rect", "r1"],
    });
  });

  it("保留双引号内的空格", () => {
    expect(parser.parse('add text t1 x=1 y=2 text="Hello world"')).toEqual({
      verb: "add",
      args: ["text", "t1", "x=1", "y=2", "text=Hello world"],
    });
  });

  it("支持单引号", () => {
    const parsed = parser.parse("add text t1 text='Hi there'");
    expect(parsed?.args).toContain("text=Hi there");
  });

  it("空行与纯空白返回 null", () => {
    expect(parser.parse("")).toBeNull();
    expect(parser.parse("   \t ")).toBeNull();
  });

  it("引号未闭合时抛出友好的 CliError", () => {
    expect(() => parser.parse('add text t1 text="oops')).toThrow(CliError);
    expect(() => parser.parse('add text t1 text="oops')).toThrow(/引号/);
  });
});
