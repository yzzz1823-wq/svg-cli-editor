import { CliError } from "../errors/CliError";
import { SvgParseError } from "../errors/SvgParseError";
import { AddShapeCommand } from "../command/AddShapeCommand";
import { CanvasCommand } from "../command/CanvasCommand";
import { GroupCommand } from "../command/GroupCommand";
import { InitCommand } from "../command/InitCommand";
import { ReadCommand } from "../command/ReadCommand";
import { RemoveShapeCommand } from "../command/RemoveShapeCommand";
import { SaveCommand } from "../command/SaveCommand";
import { ScaleShapeCommand } from "../command/ScaleShapeCommand";
import { SetAttributeCommand } from "../command/SetAttributeCommand";
import { TranslateShapeCommand } from "../command/TranslateShapeCommand";
import { UngroupCommand } from "../command/UngroupCommand";
import { DEFAULT_SHAPE_STYLE } from "../core/ShapeStyle";
import { Container } from "../core/Container";
import type { AttributePatch } from "../core/AttributePatch";
import type { Command } from "../command/Command";
import type { Canvas } from "../core/Canvas";
import type { OutputWriter } from "./OutputWriter";
import type { ParsedInvocation } from "./ParsedInvocation";
import type { SvgElementFactory } from "../parser/SvgElementFactory";
import type { SvgExportVisitor } from "../visitor/SvgExportVisitor";
import type { SvgReader } from "../parser/SvgReader";
import type { Shape } from "../core/Shape";
import type { ShapeStyle } from "../core/ShapeStyle";
import type { TextFileWriter } from "../io/TextFileWriter";

/** CommandFactory 需要的全部协作者（避免在工厂里 new 领域对象）。 */
export interface CommandFactoryDependencies {
  readonly canvas: Canvas;
  readonly shapeFactory: SvgElementFactory;
  readonly exportVisitor: SvgExportVisitor;
  readonly fileWriter: TextFileWriter;
  readonly reader: SvgReader;
  readonly output: OutputWriter;
}

/**
 * 唯一的“命令名 → 命令对象”映射点（Agent.md 允许的两处按名分派之一）。
 *
 * 这里只做参数校验与对象装配；真正的执行、撤销由 CommandManager 负责。
 * 图形类型名 → 图形类仍然只发生在 SvgElementFactory 里。
 */
export class CommandFactory {
  private readonly deps: CommandFactoryDependencies;

  constructor(deps: CommandFactoryDependencies) {
    this.deps = deps;
  }

  create(invocation: ParsedInvocation): Command {
    switch (invocation.verb) {
      case "init":
        return this.createInit(invocation.args);
      case "canvas":
        this.requireArity(invocation, 2, "canvas <宽> <高>");
        return new CanvasCommand(
          this.deps.canvas,
          this.integer(invocation.args[0], "画布宽度"),
          this.integer(invocation.args[1], "画布高度"),
        );
      case "add":
        return this.createAdd(invocation.args);
      case "remove":
        this.requireArity(invocation, 1, "remove <名称>");
        return new RemoveShapeCommand(this.deps.canvas, this.requireShape(invocation.args[0]));
      case "translate": {
        this.requireArity(invocation, 3, "translate <名称> <dx> <dy>");
        // 先校验语法（数字），再校验语义（图形是否存在），错误提示更贴近输入。
        const dx = this.number(invocation.args[1] ?? "", "dx");
        const dy = this.number(invocation.args[2] ?? "", "dy");
        return new TranslateShapeCommand(this.deps.canvas, this.requireShape(invocation.args[0]), dx, dy);
      }
      case "scale": {
        this.requireArity(invocation, 2, "scale <名称> <系数>");
        const factor = this.number(invocation.args[1] ?? "", "缩放系数");
        return new ScaleShapeCommand(this.deps.canvas, this.requireShape(invocation.args[0]), factor);
      }
      case "set":
        return this.createSet(invocation.args);
      case "group":
        return this.createGroup(invocation.args);
      case "ungroup":
        this.requireArity(invocation, 1, "ungroup <组名>");
        return new UngroupCommand(this.deps.canvas, this.requireGroup(invocation.args[0]));
      case "save":
        this.requireArity(invocation, 1, "save <路径>");
        return new SaveCommand(
          this.deps.canvas,
          this.deps.exportVisitor,
          this.deps.fileWriter,
          invocation.args[0] ?? "",
        );
      case "read":
        this.requireArity(invocation, 1, "read <路径>");
        return new ReadCommand(
          this.deps.canvas,
          this.deps.reader,
          invocation.args[0] ?? "",
          this.deps.output,
        );
      default:
        throw new CliError(`未知命令：${invocation.verb}。输入 help 查看可用命令。`);
    }
  }

  private createInit(args: readonly string[]): Command {
    if (args.length === 0) {
      return new InitCommand(this.deps.canvas);
    }
    if (args.length === 2) {
      return new CanvasCommand(this.deps.canvas, this.integer(args[0], "画布宽度"), this.integer(args[1], "画布高度"));
    }
    throw new CliError("用法：init [宽 高]");
  }

  private createAdd(args: readonly string[]): Command {
    if (args.length < 2) {
      throw new CliError("用法：add <类型> <名称> [属性=值 ...]");
    }
    const type = args[0] ?? "";
    const name = args[1] ?? "";
    const attributes: Record<string, string> = {};
    let style: ShapeStyle = { ...DEFAULT_SHAPE_STYLE };
    let textContent = "";

    for (const pair of args.slice(2)) {
      const separator = pair.indexOf("=");
      if (separator <= 0) {
        throw new CliError(`属性格式应为 键=值：${pair}`);
      }
      const key = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      switch (key) {
        case "fill":
          style = { ...style, fill: value };
          break;
        case "stroke":
          style = { ...style, stroke: value === "none" ? null : value };
          break;
        case "stroke-width":
          style = { ...style, strokeWidth: this.number(value, "stroke-width") };
          break;
        case "text":
          textContent = value;
          break;
        case "w":
          attributes["width"] = value;
          break;
        case "h":
          attributes["height"] = value;
          break;
        case "radius":
          attributes["r"] = value;
          break;
        default:
          attributes[key] = value;
      }
    }

    try {
      const shape = this.deps.shapeFactory.create(type, name, attributes, style, textContent);
      return new AddShapeCommand(this.deps.canvas, shape);
    } catch (error) {
      if (error instanceof SvgParseError) {
        throw new CliError(`无法创建 ${type}：${error.message}`);
      }
      throw error;
    }
  }

  private createSet(args: readonly string[]): Command {
    if (args.length < 2) {
      throw new CliError("用法：set <名称> <属性=值> ...（至少一个属性）");
    }
    const shape = this.requireShape(args[0]);
    return new SetAttributeCommand(this.deps.canvas, shape, this.buildPatch(args.slice(1)));
  }

  /** 把 CLI 的 键=值 列表翻译成类型化补丁；别名在这里归一化。 */
  private buildPatch(pairs: readonly string[]): AttributePatch {
    let patch: AttributePatch = {};
    for (const pair of pairs) {
      const separator = pair.indexOf("=");
      if (separator <= 0) {
        throw new CliError(`属性格式应为 键=值：${pair}`);
      }
      const key = pair.slice(0, separator);
      const raw = pair.slice(separator + 1);
      patch = { ...patch, ...this.patchEntry(key, raw) };
    }
    return patch;
  }

  private patchEntry(key: string, raw: string): AttributePatch {
    switch (key) {
      case "x":
        return { x: this.number(raw, "x") };
      case "y":
        return { y: this.number(raw, "y") };
      case "width":
      case "w":
        return { width: this.number(raw, key) };
      case "height":
      case "h":
        return { height: this.number(raw, key) };
      case "cx":
        return { cx: this.number(raw, "cx") };
      case "cy":
        return { cy: this.number(raw, "cy") };
      case "radius":
      case "r":
        return { radius: this.number(raw, key) };
      case "rx":
        return { rx: this.number(raw, "rx") };
      case "ry":
        return { ry: this.number(raw, "ry") };
      case "x1":
        return { x1: this.number(raw, "x1") };
      case "y1":
        return { y1: this.number(raw, "y1") };
      case "x2":
        return { x2: this.number(raw, "x2") };
      case "y2":
        return { y2: this.number(raw, "y2") };
      case "text":
        return { text: raw };
      case "fill":
        return { fill: raw };
      case "stroke":
        return { stroke: raw === "none" ? null : raw };
      case "stroke-width":
      case "strokeWidth":
        return { strokeWidth: this.number(raw, key) };
      case "name":
      case "id":
        throw new CliError("不能修改图形名称（name/id 不可变）");
      default:
        throw new CliError(`不支持的属性：${key}`);
    }
  }

  private createGroup(args: readonly string[]): Command {
    if (args.length < 3) {
      throw new CliError("用法：group <组名> <名称1> <名称2> ...（至少两个节点）");
    }
    const groupName = args[0] ?? "";
    const children = args.slice(1).map((name) => this.requireShape(name));
    return new GroupCommand(this.deps.canvas, children, groupName);
  }

  private requireShape(name: string | undefined): Shape {
    if (name === undefined || name === "") {
      throw new CliError("缺少图形名称");
    }
    const shape = this.deps.canvas.findShape(name);
    if (shape === null) {
      throw new CliError(`找不到图形：${name}`);
    }
    return shape;
  }

  private requireGroup(name: string | undefined): Container {
    const shape = this.requireShape(name);
    if (!(shape instanceof Container)) {
      throw new CliError(`"${shape.getName()}" 不是分组，无法解散`);
    }
    return shape;
  }

  private requireArity(invocation: ParsedInvocation, count: number, usage: string): void {
    if (invocation.args.length !== count) {
      throw new CliError(`用法：${usage}`);
    }
  }

  private integer(raw: string | undefined, label: string): number {
    const value = this.number(raw ?? "", label);
    if (!Number.isInteger(value)) {
      throw new CliError(`${label}必须是整数，收到："${raw ?? ""}"`);
    }
    return value;
  }

  private number(raw: string, label: string): number {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new CliError(`${label}必须是数字，收到："${raw}"`);
    }
    return value;
  }
}
