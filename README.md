# 网页复印机 (Web Page Printer)

一个使用 Claude API 的智能网页复印工具，能够获取任意 URL 的内容并生成功能相似的 HTML 文件。

## 功能特点

- 🌐 自动获取并解析网页内容
- 🧠 使用 Claude Opus 4 理解页面结构和功能
- 🎨 生成带有现代化 CSS 样式的 HTML
- 📱 响应式设计，适配移动端
- 📋 保留表单、链接、图片等元素
- ✨ 添加基本的 JavaScript 交互功能
- 🚀 支持两种模式：快速模式（requests）和完整模式（Selenium）

## 两种工具对比

### web_printer.py - 快速模式(已移除)
- ✅ 速度快，无需浏览器
- ✅ 适合静态HTML页面
- ❌ 无法处理JavaScript渲染的内容
- 使用场景：简单网页、博客、文档站

### web_printer_selenium.py - 完整模式
- ✅ 完整渲染JavaScript应用
- ✅ 支持React/Vue/Angular等SPA
- ✅ 提取更多内容和交互元素
- ❌ 需要安装Chrome和ChromeDriver
- ❌ 速度较慢
- 使用场景：现代Web应用、动态内容网站

## 安装

```bash
# 安装依赖
pip install -r requirements.txt

# 如果使用Selenium模式，还需要安装Chrome和ChromeDriver
# Windows: 下载ChromeDriver并添加到PATH
# Mac: brew install chromedriver
# Linux: apt-get install chromium-chromedriver

# 设置 API Key
export ANTHROPIC_API_KEY='your-api-key-here'  # Linux/Mac
set ANTHROPIC_API_KEY=your-api-key-here       # Windows CMD
$env:ANTHROPIC_API_KEY='your-api-key-here'    # Windows PowerShell
```

## 使用方法

### 快速模式（推荐用于静态页面）

```bash
# 基本用法
python web_printer.py https://example.com

# 指定输出文件名
python web_printer.py https://example.com output.html

# 示例
python web_printer.py https://news.ycombinator.com
python web_printer.py https://www.miradesktop.com my_page.html
```

### 完整模式（推荐用于JavaScript应用）

```bash
# 基本用法
python web_printer_selenium.py https://example.com

# 指定输出文件和等待时间
python web_printer_selenium.py https://example.com output.html 10

# 示例
python web_printer_selenium.py https://react-app.com
python web_printer_selenium.py https://vue-site.com my_page.html 8
```

## 工作原理

### 快速模式流程

1. **获取网页**: 使用 requests 获取目标 URL 的 HTML 内容
2. **解析结构**: 使用 BeautifulSoup 提取关键信息：
   - 标题和元数据
   - 标题层级结构 (h1-h6)
   - 主要文本内容
   - 链接、图片、表单
   - 页面语义结构
3. **AI 生成**: 将提取的信息发送给 Claude API，生成功能相似的 HTML
4. **保存文件**: 将生成的 HTML 保存到本地文件

### 完整模式流程

1. **启动浏览器**: 使用 Selenium 启动 Chrome 浏览器
2. **渲染页面**: 等待 JavaScript 完全执行，页面完整渲染
3. **滚动加载**: 自动滚动触发懒加载内容
4. **提取信息**: 从渲染后的 DOM 提取所有可见内容
5. **AI 生成**: 使用 Claude API 生成高质量 HTML
6. **保存文件**: 保存到本地

## 提取的信息

### 快速模式
- 页面标题和描述
- 标题层级结构
- 主要文本内容（8000字符）
- 链接（30个）
- 图片（15个）
- 表单结构
- CSS类名

### 完整模式
- 所有快速模式的信息
- 渲染后的完整内容（10000字符）
- 按钮和交互元素
- 更多链接（40个）
- 更多图片（20个）
- 动态加载的内容

## 生成的 HTML 特性

- ✅ 完整的 HTML5 文档结构
- ✅ 现代化 CSS 样式
- ✅ 响应式设计
- ✅ 语义化标签
- ✅ 基本的 JavaScript 交互
- ✅ 表单验证（如果有表单）

## 注意事项

- 需要有效的 Anthropic API Key
- 生成的 HTML 是对原网页的"功能模仿"，不是完全复制
- Selenium 模式需要安装 Chrome 浏览器和 ChromeDriver
- 某些动态内容和复杂交互可能无法完全还原
- 受 API token 限制，超大页面可能被截断

## 示例输出

运行后会生成类似 `printed_example_com.html` 的文件，包含：
- 原网页的内容结构
- 美观的现代化样式
- 可用的链接和表单
- 响应式布局

## 技术栈

- Python 3.7+
- Anthropic Claude API (Opus 4)
- BeautifulSoup4 (HTML 解析)
- Requests (HTTP 请求)
- Selenium (浏览器自动化，可选)