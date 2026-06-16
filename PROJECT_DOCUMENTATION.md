# Printer Project Documentation

## 1. 项目定位

`Printer` 是一个本地网页复刻与交互产物生成项目。它的核心目标是：根据用户意图和输入材料，生成可以直接打开或运行的前端产物。

项目目前主要包含两条工作流：

- `Web Printer Pipeline`：输入意图、URL、截图或 MHTML，输出单页 HTML、多页 HTML 或 React 项目骨架。
- `Fake Game Library`：维护一组离线、竖屏、可交互的小游戏赝品页，并支持本地 remix。

项目重心不是传统 Web 应用后端，而是“生成和验证前端 artifact”。

## 2. 仓库位置和工作目录

当前项目目录是：

```text
/Users/pencil/Documents/Printer
```

实际 Python 项目根目录是：

```text
/Users/pencil/Documents/Printer/printer
```

有一类 Node 脚本使用父目录作为工作目录，因此运行 fake-library 相关命令时通常从 `/Users/pencil/Documents/Printer` 执行。

## 3. 目录结构

```text
printer/
  web_printer_selenium.py          # 主 CLI 入口，兼容新版和旧版调用
  requirements.txt                 # Python 依赖
  README.md                        # 简短使用说明
  AGENTS.md                        # 给 agent 的仓库工作约定
  CLAUDE.md                        # 旧 agent 使用说明

  src/
    input_parser.py                # 解析 URL、图片、MHTML 等输入
    page_extractor.py              # 采集页面结构、截图和 MHTML 内容
    complexity_analyzer.py         # 评分并决定输出格式
    intent_planner.py              # 使用 LangChain/OpenAI 或规则 fallback 规划意图
    artifact_generator.py          # 调模型生成 HTML/项目文件
    pipeline.py                    # 串联端到端流程
    config.py                      # 环境变量配置
    logger.py                      # 会话日志、截图和 API 调用日志

  tools/
    generate_fake_library.mjs      # 生成 fake game library 的核心脚本
    render_fake_covers.mjs         # 为小游戏渲染封面图
    remix_harness_server.py        # 本地 remix 服务
    write_index.py                 # 辅助写 index 的旧工具

  tests/
    test_env_config.py             # Python 环境配置测试
    test_remix_harness.py          # Remix harness 单元测试
    verify_fake_library.mjs        # fake-library 结构验收
    verify_game_alignment.mjs      # 游戏交互/契约验收
    verify_remix_outputs.mjs       # remix 产物验收
    verify_sheep_stack.mjs         # 特定游戏 smoke 验收

  output/
    index.html                     # fake-library 首页
    *.html                         # 生成的游戏页或其他 artifact
    *.remix.json                   # remix 描述文件
    remix_manifest.json            # remix manifest
    remix_manifest.js              # 浏览器可加载的 manifest shim
    covers/                        # 游戏封面图

  research/
    fake_game_alignment_sources.md # 玩法来源、边界和复刻约束

  test-artifacts/
    ...                            # Playwright/验证脚本输出截图和状态文件
```

## 4. Web Printer Pipeline

主入口是：

```bash
cd /Users/pencil/Documents/Printer/printer
python web_printer_selenium.py \
  --intent "做一个简洁的产品官网，强调下载按钮和价格卡" \
  --input https://example.com \
  --input ./shots/home.png \
  --input ./archive/page.mhtml \
  --output ./output/demo \
  --show-plan
```

端到端流程由 `src/pipeline.py` 编排：

```text
InputParser
  -> PageExtractor
  -> ComplexityAnalyzer
  -> IntentPlanner
  -> ArtifactGenerator
  -> write files
  -> run_report.json
```

各阶段职责：

- `InputParser`：校验和分类输入，支持 URL、图片、MHTML/MHT。
- `PageExtractor`：用 Selenium 采集页面结构、视觉摘要、截图，也能解析 MHTML。
- `ComplexityAnalyzer`：根据组件、交互、页面数、数据流评分。
- `IntentPlanner`：使用 LangChain/OpenAI 生成意图计划；不可用时回退到规则规划。
- `ArtifactGenerator`：构造多模态 prompt，解析模型返回的 `filepath:` 代码块，生成文件。
- `Pipeline`：写入产物和 `run_report.json`。

## 5. 输出格式

当前 pipeline 支持的主要输出格式：

- `single_html`：一个自包含 HTML 文件。
- `multi_html`：多个完整 HTML 文件，一般包含 `index.html`。
- `react_project`：在生成器里有结构支持，但复杂度分析当前主要落到 single/multi HTML。

每次 pipeline 成功运行后都会写：

```text
run_report.json
```

报告包含输出格式、复杂度分数、意图规划、warning 和文件清单。

## 6. Fake Game Library

Fake Game Library 是当前项目里最活跃的产物集合。它把热门小游戏机制复刻成离线、手机竖屏、自包含 HTML 页面。

核心脚本是：

```bash
cd /Users/pencil/Documents/Printer
node printer/tools/generate_fake_library.mjs
```

生成内容主要写到：

```text
printer/output/
```

生成器负责：

- 写 `index.html` 首页。
- 写每个基础游戏页面。
- 写 deterministic remix 页面。
- 写 `fake_manifest.json`。
- 写 `remix_manifest.json` 和 `remix_manifest.js`。
- 写 `run_report.json`。

新增或修改 fake-library 游戏时，优先改 `printer/tools/generate_fake_library.mjs`，再重新生成 `printer/output/`。不要把长期变更只手改在 `output/*.html`，否则下一次生成会覆盖。

## 7. Fake Game 页面契约

每个 fake-library 游戏页需要满足下面的基本契约：

- 完整 `<!DOCTYPE html>`。
- 移动端 viewport，包含 `viewport-fit=cover`。
- 页面自包含，不依赖外部 URL、CDN、图片或字体。
- 包含 `data-printer-artifact="fake-game-library"`。
- 包含 `class="phone-shell"` 的竖屏手机壳布局。
- 设置 `window.__PRINTER_ARTIFACT__` 元数据。
- 暴露 `window.render_game_to_text()`。
- 暴露 `window.advanceTime(ms)`。
- 动作类、实时类游戏优先使用 `<canvas>`。
- 触摸交互需要适配移动端。

`printer/tests/verify_fake_library.mjs` 会检查这些契约。

## 8. Remix Harness

Remix Harness 是本地服务，用于从已有 fake-library 游戏生成改版。

启动方式：

```bash
cd /Users/pencil/Documents/Printer/printer
python tools/remix_harness_server.py --port 8787
```

然后打开：

```text
http://127.0.0.1:8787/index.html
```

主要 API 行为：

- 读取 `output/fake_manifest.json` 作为可 remix 来源。
- 接收文本 prompt 或语音转录。
- 调用模型生成 remix 草稿。
- 发布后写入 `<slug>.html`。
- 同步写 `<slug>.remix.json`。
- 更新 `remix_manifest.json` 和 `remix_manifest.js`。

Remix HTML 也必须保留 fake-library 页面契约。

## 9. 常用命令

安装 Python 依赖：

```bash
cd /Users/pencil/Documents/Printer/printer
pip install -r requirements.txt
```

运行 Python 单元测试：

```bash
cd /Users/pencil/Documents/Printer/printer
python -m unittest tests/test_env_config.py tests/test_remix_harness.py
```

生成 fake-library：

```bash
cd /Users/pencil/Documents/Printer
node printer/tools/generate_fake_library.mjs
```

验收 fake-library：

```bash
cd /Users/pencil/Documents/Printer
node printer/tests/verify_fake_library.mjs
```

其他可用验证：

```bash
cd /Users/pencil/Documents/Printer
node printer/tests/verify_game_alignment.mjs
node printer/tests/verify_sheep_stack.mjs
node printer/tests/verify_remix_outputs.mjs
```

渲染游戏封面：

```bash
cd /Users/pencil/Documents/Printer
node printer/tools/render_fake_covers.mjs
```

封面渲染依赖浏览器环境；如果出现 browser context closed 或权限类错误，先以静态验证结果为准，再单独处理渲染环境。

## 10. 环境变量

可以从 `.env.example` 复制 `.env`：

```bash
cd /Users/pencil/Documents/Printer/printer
cp .env.example .env
```

常用变量：

- `OPENAI_API_KEY`：标准 OpenAI 兼容 key。
- `OPEN_ROUTER_API`：本地支持的 OpenRouter alias。
- `OPENAI_BASE_URL`：API base URL。
- `OPENAI_MODEL`：主 pipeline 模型。
- `OPENAI_REMIX_MODEL`：remix harness 使用的模型。
- `HEADLESS`：Selenium 是否无头运行。
- `WAIT_TIME`：页面渲染等待秒数。
- `MAX_TOKENS`：生成时最大 token。
- `USE_LANGCHAIN`：是否启用 LangChain intent planner。
- `OUTPUT_DIR`：默认输出目录。

不要提交 `.env`，也不要在日志或文档里泄露真实 key。

## 11. 新增小游戏的推荐流程

1. 调研当前热门机制，确认它没有被现有库覆盖。
2. 在 `printer/research/fake_game_alignment_sources.md` 记录来源、玩法边界和不复制资产的约束。
3. 在 `printer/tools/generate_fake_library.mjs` 添加生成函数或复用已有生成器。
4. 把 base 游戏加入 `games` 列表。
5. 如果有 deterministic remix，把 remix 加入 `deterministicRemixes`。
6. 在 `printer/tests/verify_fake_library.mjs` 更新 expected file 和 canvas whitelist。
7. 运行 `node printer/tools/generate_fake_library.mjs`。
8. 运行 `node printer/tests/verify_fake_library.mjs`。
9. 需要封面时再运行 `node printer/tools/render_fake_covers.mjs`。

验收时以 verifier 结果为主。封面渲染是补充验证，不应掩盖页面契约失败。

## 12. 维护注意事项

- `printer/output/` 和 `printer/test-artifacts/` 里经常有生成文件，不要随意清空。
- fake-library 的长期变更应进入 generator，而不是只改 output。
- verifier 的 expected list 必须和 generator 同步，否则会出现生成成功但验收覆盖不足。
- `fake_game_alignment_sources.md` 是机制边界文档，新增热门玩法时要同步更新。
- 读取 `.env.example` 可以，读取或输出 `.env` 真实值不可以。
- 项目根目录和命令工作目录容易混淆，Python pipeline 通常在 `printer/` 下跑，Node fake-library 通常在父目录跑。

## 13. 当前项目状态

当前 fake-library 已经包含多条热门玩法线，包括排序、停车解堵、六角弹出、三连清、箭头出块、分流、找茬、跑酷、模拟器和轻量测试类页面。

近期新增玩法通常遵循同一模式：

- 先验证热门机制仍然活跃。
- 再检查库里是否已有同类玩法。
- 加一个最小 base clone。
- 加一个办公室或本地语境的二创 remix。
- 最后通过 `verify_fake_library.mjs` 做静态契约验收。

这个模式是当前 `Printer` 项目里最稳定的小游戏扩展路径。
