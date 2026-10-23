# SVG CLI 编辑器 — 架构说明

一个用 TypeScript + Node.js 实现的命令行 SVG 绘图编辑器：以 REPL 接收命令，在内存中维护一棵可组合的图形树，支持撤销 / 重做、SVG 读写与文本树查看。设计目标不是画得好看，而是**用命令行场景把面向对象设计做“薄而真”**：每个模式都解决一个具体的扩展点，而不是为了模式而模式。

---

## 1. 项目结构

```
svg-cli-editor/
├─ src/
│  ├─ index.ts                    # 进程入口：装配协作者 + 启动 REPL（唯一的组合根）
│  ├─ errors/                     # 错误体系（全部继承 EditorError）
│  │  ├─ EditorError.ts
│  │  ├─ CommandError.ts          # 命令层错误（撤销栈空、不可撤销命令等）
│  │  ├─ ParseError.ts            # 解析基类错误
│  │  ├─ SvgParseError.ts         # SVG 语法 / 结构错误
│  │  └─ CliError.ts              # CLI 输入错误（消息直接面向用户）
│  ├─ core/                       # 领域核心：图形树、画布、事件
│  │  ├─ Shape.ts                 # abstract：所有图形（叶子与组合）的根类型
│  │  ├─ Container.ts             # abstract：能持有子节点的 Shape
│  │  ├─ Canvas.ts                # 文档边界 + 业务规则（增删改、组合、尺寸）
│  │  ├─ CanvasSubject.ts         # 观察者注册/通知
│  │  ├─ CanvasObserver.ts        # interface update(event)
│  │  ├─ CanvasEvent.ts           # 事件对象（operation + shape）
│  │  ├─ ContainerFactory.ts      # interface：创建根容器（避免 Canvas 依赖具体 Group）
│  │  ├─ DefaultContainerFactory.ts
│  │  ├─ ShapeStyle.ts            # 填充 / 描边样式（不可变值对象）
│  │  └─ SvgAttribute.ts          # 额外属性条目
│  ├─ shapes/                     # 具体图形（一类一文件）
│  │  ├─ Rect.ts  Circle.ts  Ellipse.ts  Line.ts  Text.ts
│  │  └─ Group.ts                 # Composite：<g>
│  ├─ command/                    # 命令层
│  │  ├─ Command.ts               # interface：getName/execute/undo/isUndoable
│  │  ├─ BaseCommand.ts           # abstract：命令名与默认可撤销
│  │  ├─ HistoryStack.ts          # 有界 LIFO 栈
│  │  ├─ CommandManager.ts        # undo/redo 栈的编排者
│  │  ├─ AddShapeCommand.ts  RemoveShapeCommand.ts  TranslateShapeCommand.ts
│  │  ├─ GroupCommand.ts  UngroupCommand.ts
│  │  ├─ InitCommand.ts  CanvasCommand.ts      # 文档级命令（不可撤销）
│  │  └─ SaveCommand.ts  ReadCommand.ts        # 文档级命令（不可撤销）
│  ├─ visitor/                    # 访问者：把“遍历 + 输出格式”从图形里剥离
│  │  ├─ ShapeVisitor.ts          # 泛型访问者接口
│  │  ├─ TreeRenderVisitor.ts     # Canvas → 控制台文本树
│  │  └─ SvgExportVisitor.ts      # Canvas → SVG 文本
│  ├─ parser/                     # SVG 读取
│  │  ├─ ParsedDocument.ts
│  │  ├─ XmlElement.ts  XmlTokenizer.ts
│  │  ├─ SvgElementFactory.ts     # interface：标签名 → Shape
│  │  ├─ DefaultSvgElementFactory.ts
│  │  ├─ SvgParser.ts             # 文本 → 文档树（含缺 id 补全与告警）
│  │  └─ SvgReader.ts             # 文件读取 → 解析
│  ├─ io/
│  │  ├─ TextFileStore.ts         # interface：读文本
│  │  └─ TextFileWriter.ts        # interface：写文本
│  └─ cli/                        # 交互层
│     ├─ CliParser.ts             # 词法：拆词（引号感知）
│     ├─ ParsedInvocation.ts      # 动词 + 原始参数
│     ├─ CommandFactory.ts        # 唯一的“命令名 → Command”映射
│     ├─ CliApp.ts                # REPL 门面：解析 → 分派 → 执行 → 回显
│     ├─ ConsoleEchoObserver.ts   # Observer 的 CLI 实现
│     ├─ OutputWriter.ts          # interface：行输出
│     └─ LineReader.ts            # interface：逐行输入
├─ tests/                         # 与 src/ 镜像的 Jest 单测（22 套件 / 174 例）
└─ doc/
   └─ README.md                   # 本文档
```

---

## 2. 分层与依赖方向

```
        ┌─────────────────────────────┐
        │  cli/  （输入输出、分派）    │
        └──────────────┬──────────────┘
                       │ 依赖
        ┌──────────────▼──────────────┐
        │  command/ （请求、撤销编排） │
        └──────────────┬──────────────┘
                       │ 依赖
   ┌───────────────────▼───────────────────┐
   │  core/ · shapes/ （领域模型与规则）     │
   └───────────────────▲───────────────────┘
                       │ 只被访问
   ┌───────────────────┴───────────────────┐
   │  visitor/ · parser/ · io/ （外围适配） │
   └───────────────────────────────────────┘
```

规则（由代码结构与测试共同保证）：

1. **core/ 不依赖任何外层**：`Canvas` 不认识命令、不认识 CLI、不认识文件系统；它只依赖 `ContainerFactory`、`CanvasObserver` 等接口。
2. **shapes/ 只依赖 core/**：具体的矩形、圆、组不导入命令或访问者。
3. **command/ 依赖 core/，不依赖 cli/**：命令只调用 Canvas 的公开契约，不读终端、不解析字符串。
4. **cli/ 是组合与翻译层**：把字符串翻译成命令，把命令交给 `CommandManager`，把结果交给 `OutputWriter`。
5. **parser/ 依赖 core/ 与 shapes/**，但通过 `SvgElementFactory` 接口隔离具体类；`Canvas` 不知道 SVG。
6. **所有跨层交互都经过接口**（`TextFileStore`、`TextFileWriter`、`OutputWriter`、`LineReader`、`CanvasObserver`），因此测试里可以完全不起文件系统、不起终端。

---

## 3. 四大设计模式（各自解决什么）

### 3.1 Command —— 撤销 / 重做

- `Command` 只有四个成员：`getName()`、`execute()`、`undo()`、`isUndoable()`。
- **命令只做请求转发**：例如 `TranslateShapeCommand.execute()` 仅调用 `canvas.moveShape(shape, dx, dy)`，不在这里写几何规则；`GroupCommand` 仅调用 `canvas.groupShapes(...)`。
- `HistoryStack` 是纯粹的“有界栈”，容量在构造时校验（非正整数抛 `CommandError`）。
- `CommandManager` 是唯一的执行入口：
  - `execute` 成功后把命令压入 undo 栈并清空 redo 栈；命令抛错时两个栈都不变（不留脏历史）。
  - 可撤销命令从 undo 栈弹出 → `undo()` → 压入 redo 栈；反向同理。
  - **文档级命令**（`isUndoable() === false`，如 `init`/`canvas`/`save`/`read`）执行后清空两个栈并禁用撤销，因为它们替换的是整篇文档。
- `RemoveShapeCommand` 额外记住“父容器 + 原下标”，`undo` 用 `insertAt` 精确放回原位；`UngroupCommand.undo()` 会重新 `groupShapes` 并把新组实例写回自身字段，保证“撤销→重做→再撤销”链条不断裂。

### 3.2 Composite —— 图形树

- 叶子（`Rect`、`Circle`…）与容器（`Group`）拥有共同基类 `Shape`，因此 `Canvas` 只需面对 `Shape`：平移、改名、查询都无差别。
- `Container` 在 `Shape` 之上增加“子节点集合 + 子节点位置维护”，组合的几何语义（如组内递归平移）由 `Shape.moveBy` 的多态实现承担，而不是 `if (shape instanceof Group)`。
- 组合与解散的“原位替换”逻辑集中在 `Canvas`：成组时新组插入到第一个成员的原位置；解散时成员回到组占据的位置。

### 3.3 Visitor —— 序列化与树渲染

- `ShapeVisitor<R>` 声明 `visitRect / visitCircle / visitEllipse / visitLine / visitText / visitGroup`；`Shape.accept(visitor)` 负责“类型分派”，因此 **新增导出格式 = 新增访问者，不改图形类**。
- `SvgExportVisitor` 把画布导出为 SVG 文本（属性顺序固定、两空格缩进、空元素自闭合、文本实体转义）。
- `TreeRenderVisitor` 把画布渲染为终端树（`├─`/`└─`/`│  ` 连线），`tree` 命令直接用它的返回值。
- 读取方向是**反过来的**：`SvgParser` 用“标签名 → 类”的工厂（`SvgElementFactory`）建树，因为这里的分派依据是外部输入的类型名，而不是既有对象的运行时类型。

### 3.4 Observer —— 终端回显

- `CanvasSubject` 持有观察者列表并提供 `attach/detach/notify`；`Canvas` 在每次变更后发出 `CanvasEvent`（`add`/`remove`/`move`/`group`/`ungroup`/`document`）。
- `ConsoleEchoObserver` 是唯一把事件翻译成中文提示的实现；测试里换成 `FakeOutputWriter` 即可断言输出。
- 领域层因此完全不知道“终端”的存在，后续加日志、加 WebSocket 推送都只是新增观察者。

---

## 4. 两个受控的类型分派点

项目**只允许**两处按名字分派，其余一律多态：

| 位置 | 分派内容 | 理由 |
| --- | --- | --- |
| `cli/CommandFactory.ts` | 命令名 → `Command` 实例 | CLI 的天然入口，字符串→行为的唯一翻译点 |
| `parser/DefaultSvgElementFactory.ts` | SVG 标签名 → 图形类 | 解析外部输入时类型信息只以字符串形式存在 |

`Shape.accept(visitor)` 中的分派由多态/访问者承担，不属于“按名字 switch”；`instanceof Container` 只出现在“是否为组合”这一 Composite 角色判断上，不用于区分叶子类型。

---

## 5. 一条命令的完整旅程

```
终端输入 "translate r1 10 -5"
  → CliParser       拆词 → { verb: "translate", args: ["r1","10","-5"] }
  → CliApp          判断是内建命令还是编辑器命令
  → CommandFactory  校验参数 → new TranslateShapeCommand(canvas, r1, 10, -5)
  → CommandManager  execute → 入 undo 栈
  → Command         canvas.moveShape(r1, 10, -5)
  → Canvas          改坐标 → notify(CanvasEvent("move", r1))
  → ConsoleEchoObserver  writeLine("已移动 r1")
```

`undo` / `redo` 走同一条链路，只是分别调用 `CommandManager.undo()` / `redo()`，并把结果命令名回显为“已撤销 …”/“已重做 …”。

---

## 6. CLI 使用指南

### 启动

```bash
npx ts-node src/index.ts
# 或先编译：npx tsc && node dist/index.js
```

提示符为 `svg> `。输入 `help` 查看命令，`exit` / `quit` 退出；空行会被忽略。

### 命令一览

| 命令 | 说明 |
| --- | --- |
| `init [宽 高]` | 新建空文档（默认 800×600） |
| `canvas <宽> <高>` | 新建指定尺寸文档 |
| `add <类型> <名称> [键=值 ...]` | 添加图形：`rect`、`circle`、`ellipse`、`line`、`text` |
| `remove <名称>` | 删除图形 |
| `translate <名称> <dx> <dy>` | 平移图形（组会递归平移子节点） |
| `group <组名> <名称1> <名称2> ...` | 组合，至少两个节点 |
| `ungroup <组名>` | 解散分组 |
| `undo` / `redo` | 撤销 / 重做 |
| `save <路径>` | 序列化为 SVG 写入文件 |
| `read <路径>` | 读取 SVG 文件替换当前文档 |
| `tree` | 打印文档树 |
| `help` / `exit` | 帮助 / 退出 |

几何属性直接写成 `键=值`；`fill`、`stroke`、`stroke-width` 会进入样式，`text=...` 作为文本内容，其余键作为额外 SVG 属性原样输出。

### 示例会话

```text
svg> add rect r1 x=10 y=20 w=100 h=60 fill=#ff0000 stroke=black stroke-width=2
已添加 r1 (rect)
svg> add circle c1 cx=200 cy=100 r=40 fill=blue
已添加 c1 (circle)
svg> group g1 r1 c1
已建组 g1
svg> translate g1 10 10
已移动 g1
svg> tree
svg 800x600
└─ g1 [g]
   ├─ r1 [rect]
   └─ c1 [circle]
svg> undo
已撤销 move
svg> save out.svg
svg> read out.svg
svg> exit
再见
```

### 错误提示

所有可预期的输入问题都以 `错误：…` 输出，且不影响会话继续：

```text
svg> add rect
错误：用法：add <类型> <名称> [属性=值 ...]
svg> translate r1 abc 10
错误：dx必须是数字，收到："abc"
svg> remove ghost
错误：找不到图形：ghost
svg> fly away
错误：未知命令：fly away。输入 help 查看可用命令。
```

`save`/`read` 失败时错误来自 `CommandError`/`SvgParseError`，同样经 `CliApp.report` 统一输出。

---

## 7. 测试策略

- 与 `src/` 结构镜像的 Jest 单测，共 22 个套件、174 个用例。
- 领域层测试不依赖文件系统与终端：`FakeTextFileStore`、`FakeTextFileWriter`、`FakeOutputWriter`、`FakeLineReader`、`FakeCommand` 全部放在 `tests/helpers/`。
- 每个阶段都先写失败测试再实现（红 → 绿），命令层与 CLI 层的行为契约（错误文案、回显格式、栈清理规则）都由测试固定。

---

## 8. 设计约束与已知取舍

1. **类型分派白名单**：新增图形类型时改 `DefaultSvgElementFactory` 与 `ShapeVisitor` 接口（这是设计意图，而非遗漏）；新增导出格式只需新增访问者。
2. **命令不承担业务校验**：参数合法性（如画布尺寸必须为正整数）由命令构造期或 Canvas 负责，CLI 只做格式校验，避免规则散落。
3. **文档级命令不可撤销**：`init`/`canvas`/`save`/`read` 一旦执行即清空历史，这是命令行编辑器的简化取舍；若需要“打开新文档仍可撤销”，应引入文档切换栈。
4. **手写 XML 词法分析**：不引入第三方解析库，覆盖项目所需子集（元素、属性、文本、注释、CDATA 之外的常见结构）；遇到不支持的标签或未闭合标签抛 `SvgParseError`。
5. **无并发**：REPL 单线程顺序执行，未处理多文档/多会话。
