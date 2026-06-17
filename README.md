# Web Printer

`Web Printer` 是一个本地前端 artifact 生成与展示项目。它不是传统后端应用，也不只是静态页面集合；更准确地说，它把“意图、网页素材、小游戏玩法”转成可以直接打开、试玩、验证和继续 Remix 的前端产物。

当前仓库由三层组成：

- `Web Printer Pipeline`：根据意图、URL、截图或 MHTML 生成单页或多页 HTML artifact。
- `Fake Game Library`：用生成器维护一组离线、竖屏、自包含的 fake game 页面和展示首页。
- `Fake / Remix Harness`：把首页里的 `Fake 一款` 和 `Remix` 接到本地模型生成、草稿预览、发布和 manifest 更新流程。

## 架构一览

```text
web_printer_selenium.py
  -> src/input_parser.py
  -> src/page_extractor.py
  -> src/complexity_analyzer.py
  -> src/intent_planner.py
  -> src/artifact_generator.py
  -> output/* + run_report.json

tools/generate_fake_library.mjs
  -> output/index.html
  -> output/*.html
  -> output/fake_manifest.json
  -> output/remix_manifest.json

tools/remix_harness_server.py
  -> /api/fake/*
  -> /api/remix/*
  -> output/.remix_drafts/*
  -> output/<slug>.html + output/<slug>.remix.json
```

长期维护时要区分源码和生成物：

- 改通用网页生成流程：优先改 `src/` 和 `web_printer_selenium.py`。
- 改 fake game library：优先改 `tools/generate_fake_library.mjs`，再重新生成 `output/`。
- 改从零 Fake 或 Remix 服务：优先改 `tools/remix_harness_server.py` 和 `tests/test_remix_harness.py`。
- `output/` 是可提交的展示产物，但大部分长期逻辑不应只手改在 `output/*.html`。

## 目录结构

```text
printer/
  web_printer_selenium.py          # Web Printer CLI 入口
  src/                             # 通用网页生成 pipeline
  tools/
    generate_fake_library.mjs      # fake game library 源生成器
    remix_harness_server.py        # 本地 Fake / Remix API 服务
    render_fake_covers.mjs         # 封面渲染工具
  tests/
    test_env_config.py             # 环境变量配置测试
    test_remix_harness.py          # Fake / Remix harness 单元测试
    verify_fake_library.mjs        # fake-library 静态契约验证
    verify_game_alignment.mjs      # 游戏交互/契约验证
    verify_remix_outputs.mjs       # remix manifest 和产物验证
  output/                          # 生成的首页、游戏页、manifest、run report
  research/                        # 热门玩法来源与复刻边界记录
  PROJECT_DOCUMENTATION.md         # 维护者指南
  PROJECT_HIGHLIGHTS.md            # 对外亮点介绍
```

实际 git 仓库根目录是 `printer/`。部分 Node 脚本沿用历史路径，通常需要从外层工作区执行：

```bash
cd <workspace-root>
node printer/tools/generate_fake_library.mjs
node printer/tests/verify_fake_library.mjs
```

Python pipeline、单元测试和 harness 通常从仓库根目录执行：

```bash
cd <repo-root>
python -m unittest tests/test_env_config.py tests/test_remix_harness.py
python tools/remix_harness_server.py --port 8787
```

## 安装与配置

```bash
cd <repo-root>
pip install -r requirements.txt
cp .env.example .env
```

常用环境变量：

```bash
OPENAI_API_KEY=your_api_key
OPEN_ROUTER_API=
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=moonshotai/kimi-k2.6
OPENAI_REMIX_MODEL=moonshotai/kimi-k2.6

OPENROUTER_HTTP_REFERER=http://127.0.0.1:8787
OPENROUTER_X_TITLE=Printer Remix Harness

OPENAI_TRANSCRIBE_API_KEY=
OPENAI_TRANSCRIBE_BASE_URL=https://api.openai.com/v1
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe

HEADLESS=true
WAIT_TIME=5
MAX_TOKENS=16000
OUTPUT_DIR=output
USE_LANGCHAIN=true
AUTO_SCREENSHOT=true
```

不要提交 `.env`，也不要在日志、文档或 issue 里暴露真实 key。

## Web Printer Pipeline

通用网页生成入口：

```bash
cd <repo-root>
python web_printer_selenium.py \
  --intent "做一个简洁的产品官网，强调下载按钮和价格卡" \
  --input https://example.com \
  --input ./shots/home.png \
  --input ./archive/page.mhtml \
  --output ./output/demo \
  --show-plan
```

兼容旧调用：

```bash
python web_printer_selenium.py https://example.com ./output/example.html 5
```

当前运行时输出格式主要是：

- `single_html`：一个自包含 HTML 文件。
- `multi_html`：多个完整 HTML 文件。

`artifact_generator.py` 里有历史 React/Vite 相关兜底代码，但当前 `complexity_analyzer.py` 只暴露 `single_html` 和 `multi_html`，因此 README 不把 React 项目作为当前主流程承诺。

每次成功运行会写入目标 artifact 和 `run_report.json`。

## Fake Game Library

Fake Game Library 是当前最适合展示的项目面：它把热门小游戏机制转成离线、手机竖屏、自包含 HTML，并通过 `output/index.html` 聚合展示。

生成：

```bash
cd <workspace-root>
node printer/tools/generate_fake_library.mjs
```

验证：

```bash
cd <workspace-root>
node printer/tests/verify_fake_library.mjs
```

页面契约包括：

- 完整 `<!DOCTYPE html>`。
- 移动端 viewport，包含 `viewport-fit=cover`。
- `data-printer-artifact="fake-game-library"`。
- `class="phone-shell"` 竖屏手机壳。
- `window.__PRINTER_ARTIFACT__` artifact 元数据。
- `window.render_game_to_text()` 和 `window.advanceTime(ms)`。
- 无外部 URL、CDN 图片、远程字体或受保护原始资产。

新增长期游戏时，流程是：调研机制边界，改 `tools/generate_fake_library.mjs`，同步 verifier expected list，重新生成 `output/`，再跑验证。

## Fake / Remix Harness

启动本地 harness：

```bash
cd <repo-root>
python tools/remix_harness_server.py --port 8787
```

打开：

```text
http://127.0.0.1:8787/index.html
```

核心交互：

- `Fake 一款` / `从零 Fake`：不选择源游戏，直接输入玩法 prompt 生成新游戏草稿。
- `Remix`：基于当前 fake game 的 HTML、metadata 和 agent description 生成变体草稿。
- 发布：写入 `output/<slug>.html`、`output/<slug>.remix.json`，并更新 `output/remix_manifest.json` 和 `output/remix_manifest.js`。

主要 API：

- `GET /api/remix/sources`
- `POST /api/fake/draft-jobs`
- `GET /api/fake/draft-jobs/{job_id}`
- `POST /api/remix/draft-jobs`
- `GET /api/remix/draft-jobs/{job_id}`
- `POST /api/remix/publish`
- `DELETE /api/remix/draft/{draft_id}`

从零 Fake 发布后会标记为 `origin: "scratch"`、`kind: "Fake"`，但仍复用 remix manifest、首页瀑布流和滑动 feed 逻辑。

## 常用验证

```bash
cd <repo-root>
python -m unittest tests/test_env_config.py tests/test_remix_harness.py
```

```bash
cd <workspace-root>
node printer/tests/verify_fake_library.mjs
node printer/tests/verify_game_alignment.mjs
node printer/tests/verify_remix_outputs.mjs
```

封面渲染：

```bash
cd <workspace-root>
node printer/tools/render_fake_covers.mjs
```

封面渲染依赖本地浏览器环境；如果失败，不应替代或掩盖静态契约验证结果。

## 文档

- `PROJECT_DOCUMENTATION.md`：面向维护者的完整项目指南。
- `PROJECT_HIGHLIGHTS.md`：面向展示、汇报和产品介绍的亮点文档。
- `AGENTS.md`：agent 在本仓库工作的路径、命令和安全约束。
