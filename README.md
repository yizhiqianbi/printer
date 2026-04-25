# Web Printer

将网页复刻原型升级为一个可扩展项目：
- 输入从单 URL 扩展为 意图说明 + 多个 URL/截图/MHTML
- 输出会根据需求复杂度自动选择 单 HTML / 多页面 HTML / React 项目
- 引入 LangChain（可选）强化意图理解和规划

## 核心能力

1. 多模态输入
- 必填: 意图说明文字
- 可选多个输入: URL、截图文件（png/jpg/webp 等）、mhtml/mht 文件

2. 复杂度驱动输出
- 低复杂度: single_html
- 中复杂度: multi_html
- 高复杂度: react_project

3. LangChain 增强
- 使用 LangChain + OpenAI 进行意图规划
- LangChain 不可用时自动回退到规则引擎

## 项目结构

- web_printer_selenium.py: CLI 入口（兼容旧版 URL 调用）
- src/input_parser.py: 多模态输入解析
- src/page_extractor.py: URL 渲染采集 + MHTML 提取 + 结构摘要
- src/complexity_analyzer.py: 页面复杂度评分与输出决策
- src/intent_planner.py: LangChain 意图理解与规划
- src/artifact_generator.py: 代码生成（单页/多页/React）
- src/pipeline.py: 端到端主流程编排

## 安装

```bash
pip install -r requirements.txt
```

环境变量:

```bash
# 必填，OpenRouter + Kimi K2.6
# Either key name works. OPENAI_API_KEY is preferred; OPEN_ROUTER_API is supported as a local alias.
OPENAI_API_KEY=your_openrouter_api_key
OPEN_ROUTER_API=
OPENAI_BASE_URL=https://openrouter.ai/api/v1

# 可选
OPENAI_MODEL=moonshotai/kimi-k2.6
OPENAI_REMIX_MODEL=moonshotai/kimi-k2.6
OPENROUTER_HTTP_REFERER=http://127.0.0.1:8787
OPENROUTER_X_TITLE=Printer Remix Harness

# 语音转录通常需要单独支持 /audio/transcriptions 的端点。
OPENAI_TRANSCRIBE_API_KEY=
OPENAI_TRANSCRIBE_BASE_URL=https://api.openai.com/v1
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
HEADLESS=true
WAIT_TIME=5
MAX_TOKENS=16000
OUTPUT_DIR=output
USE_LANGCHAIN=true
```

你可以复制 `.env.example` 为 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

## 用法

### 新模式（推荐）

```bash
python web_printer_selenium.py \
  --intent "做一个简洁的产品官网，强调下载按钮和价格卡" \
  --input https://example.com \
  --input ./shots/home.png \
  --input ./archive/page.mhtml \
  --output ./output/demo \
  --show-plan
```

参数说明:
- --intent: 用户目标/意图描述
- --input: 可重复传入，支持 URL、截图路径、mhtml/mht
- --output: 输出文件或输出目录
- --wait-time: Selenium 渲染等待时间
- --disable-langchain: 禁用 LangChain
- --headless / --no-headless: 浏览器模式

### 兼容模式（旧调用）

```bash
python web_printer_selenium.py https://example.com output.html 5
```

### Remix Harness

本地 remix 服务会把 `output/index.html` 里的 Remix 按钮接到真实生成流程：

```bash
python tools/remix_harness_server.py --port 8787
```

然后打开：

```text
http://127.0.0.1:8787/index.html
```

点击任意游戏的 Remix，输入文本 prompt 或上传/录制语音。生成草稿后可预览、编辑 agent description，并发布到 `output/<slug>.html`。发布时还会写入 `output/<slug>.remix.json` 和 `output/remix_manifest.json`，下一次 remix 会优先把这份 description 作为 agent 上下文。

## 输出类型

1. single_html
- 输出一个 HTML 文件，可直接双击打开

2. multi_html
- 输出多个互相链接的 HTML 页面

3. react_project
- 输出可运行的 React 多文件项目（Vite 结构）
- 默认包含:
  - package.json
  - index.html
  - src/main.jsx
  - src/App.jsx
  - src/styles.css

## 运行结果

每次执行会生成:
- 代码文件（单文件或多文件）
- run_report.json（复杂度评分、意图规划、警告、产物清单）

Remix Harness 发布时额外维护:
- `<slug>.html`
- `<slug>.remix.json`
- `remix_manifest.json`
- `remix_manifest.js`

## 注意事项

- URL 采集依赖 Chrome + ChromeDriver
- 截图会作为多模态参考输入给模型
- 模型输出不可解析时，系统会自动回退到安全模板，保证有可用结果
