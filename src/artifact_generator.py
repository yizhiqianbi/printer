"""根据复杂度生成单页、多页或 React 项目代码。"""

import base64
import json
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List

from openai import OpenAI

from .complexity_analyzer import OutputFormat
from .intent_planner import IntentPlan


@dataclass
class GenerationArtifact:
    """代码生成结果。"""

    output_format: OutputFormat
    files: Dict[str, str]
    warnings: List[str] = field(default_factory=list)
    raw_response: str = ""


class ArtifactGenerator:
    """多格式产物生成器。"""

    def __init__(self, api_key: str, base_url: str, model: str, max_tokens: int = 16000):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.max_tokens = max_tokens

    def generate(
        self,
        intent: str,
        extraction_context: Dict[str, Any],
        intent_plan: IntentPlan,
        output_format: OutputFormat,
    ) -> GenerationArtifact:
        """按目标格式生成文件集合。"""
        prompt = self._build_prompt(
            intent=intent,
            extraction_context=extraction_context,
            intent_plan=intent_plan,
            output_format=output_format,
        )

        # 构建 OpenAI 消息格式
        content_parts = [{"type": "text", "text": prompt}]
        for shot in extraction_context.get("screenshots", [])[:6]:
            image_bytes = shot.get("bytes")
            if not image_bytes:
                continue
            media_type = shot.get("mime_type", "image/png")
            content_parts.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{media_type};base64,{base64.b64encode(image_bytes).decode('utf-8')}"
                    },
                }
            )

        warnings: List[str] = []
        raw_response = ""

        try:
            print(f"\n[DEBUG] 调用 OpenAI API:")
            print(f"  - Model: {self.model}")
            print(f"  - Base URL: {self.client.base_url}")
            print(f"  - Max Tokens: {self.max_tokens}")
            print(f"  - Content Parts: {len(content_parts)} (text + {len(content_parts)-1} images)")

            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                messages=[{"role": "user", "content": content_parts}],
            )

            raw_response = response.choices[0].message.content
            print(f"\n[DEBUG] API 响应成功:")
            print(f"  - Response Length: {len(raw_response)} chars")
            print(f"  - First 500 chars: {raw_response[:500]}")

            parsed_files = self._parse_files(raw_response)
            print(f"\n[DEBUG] 文件解析结果:")
            print(f"  - Parsed Files: {len(parsed_files)}")
            if parsed_files:
                print(f"  - File Paths: {list(parsed_files.keys())}")

            files = self._normalize_files(parsed_files)
        except Exception as exc:
            print(f"\n[ERROR] 模型调用失败: {exc}")
            import traceback
            traceback.print_exc()
            warnings.append(f"模型调用失败，使用回退模板: {exc}")
            files = self._fallback_files(intent, output_format)

        if not files:
            print(f"\n[WARNING] 模型输出解析为空")
            print(f"  - Raw Response Preview: {raw_response[:1000]}")
            warnings.append("模型输出解析为空，使用回退模板")
            files = self._fallback_files(intent, output_format)

        files = self._ensure_required_files(files, output_format, intent)
        return GenerationArtifact(
            output_format=output_format,
            files=files,
            warnings=warnings,
            raw_response=raw_response,
        )

    def _build_prompt(
        self,
        intent: str,
        extraction_context: Dict[str, Any],
        intent_plan: IntentPlan,
        output_format: OutputFormat,
    ) -> str:
        compact_context = self._compact_context(extraction_context)

        format_requirements = {
            OutputFormat.SINGLE_HTML: "输出 1 个可直接打开的 HTML 文件（建议 index.html）",
            OutputFormat.MULTI_HTML: "输出至少 2 个 HTML 文件，包含清晰导航与互链",
            OutputFormat.REACT_PROJECT: (
                "输出可运行的 React 项目文件，至少包含 "
                "package.json、index.html、src/main.jsx、src/App.jsx、src/styles.css"
            ),
        }

        return (
            "你是资深前端工程师。请基于用户意图与页面线索生成代码。\n"
            "必须严格返回 JSON，不要 markdown，不要解释。\n"
            "JSON 格式:\n"
            "{\n"
            "  \"files\": [\n"
            "    {\"path\": \"relative/path\", \"content\": \"file text\"}\n"
            "  ]\n"
            "}\n\n"
            f"目标输出类型: {output_format.value}\n"
            f"格式要求: {format_requirements[output_format]}\n"
            f"用户意图: {intent}\n"
            f"规划摘要: {intent_plan.summary}\n"
            f"UI 要求: {json.dumps(intent_plan.ui_requirements, ensure_ascii=False)}\n"
            f"技术要求: {json.dumps(intent_plan.technical_requirements, ensure_ascii=False)}\n"
            f"上下文摘要: {json.dumps(compact_context, ensure_ascii=False, indent=2)}\n\n"
            "补充要求:\n"
            "1. 保留可见文本语义和页面区块层级。\n"
            "2. 使用现代化布局与响应式样式。\n"
            "3. 路径必须是相对路径，不得使用绝对路径。\n"
            "4. 所有文件内容必须完整可用，不要省略。\n"
            "5. 不要输出 files 之外的字段。\n\n"
            "视觉还原要求（重要）:\n"
            "1. 严格还原原页面的配色方案（背景色、文字色、按钮色）。\n"
            "2. 保持原页面的字体大小、粗细、行高比例。\n"
            "3. 精确复刻布局间距（padding、margin、gap）。\n"
            "4. 还原圆角、阴影、边框等视觉细节。\n"
            "5. 保持按钮、卡片等组件的视觉层次感。\n"
            "6. 使用渐变、阴影等效果提升视觉质量。\n"
            "7. 确保响应式设计在不同屏幕尺寸下都美观。"
        )

    @staticmethod
    def _compact_context(extraction_context: Dict[str, Any]) -> Dict[str, Any]:
        pages = extraction_context.get("pages", [])
        compact_pages = []
        for page in pages[:4]:
            visual_summary = page.get("visual_summary", {})
            compact_pages.append(
                {
                    "source": page.get("source"),
                    "title": page.get("title"),
                    "meta_description": page.get("meta_description", "")[:240],
                    "structure": page.get("structure"),
                    "headings": page.get("headings", [])[:12],
                    "buttons": page.get("buttons", [])[:16],
                    "links": page.get("links", [])[:20],
                    "images": page.get("images", [])[:16],
                    "visual_summary": {
                        "viewport": visual_summary.get("viewport", {}),
                        "body": visual_summary.get("body", {}),
                        "dominant_colors": visual_summary.get("dominant_colors", []),
                        "dominant_fonts": visual_summary.get("dominant_fonts", []),
                        "top_blocks": visual_summary.get("top_blocks", [])[:8],
                        "prominent_headings": visual_summary.get("prominent_headings", [])[:6],
                        "prominent_buttons": visual_summary.get("prominent_buttons", [])[:8],
                        "prominent_images": visual_summary.get("prominent_images", [])[:6],
                    },
                    "text_excerpt": page.get("text_content", "")[:3000],
                }
            )

        return {
            "pages": compact_pages,
            "screenshot_files": [
                {
                    "filename": shot.get("filename", "screenshot"),
                    "source": shot.get("source", ""),
                }
                for shot in extraction_context.get("screenshots", [])
            ],
            "warnings": extraction_context.get("warnings", []),
        }

    @staticmethod
    def _parse_files(response_text: str) -> Dict[str, str]:
        data = ArtifactGenerator._safe_json(response_text)
        files: Dict[str, str] = {}

        if isinstance(data, dict):
            file_items = data.get("files", [])
            if isinstance(file_items, list):
                for item in file_items:
                    if not isinstance(item, dict):
                        continue
                    path = str(item.get("path", "")).strip()
                    content = item.get("content", "")
                    if not path:
                        continue
                    files[path] = str(content)

        if files:
            return files

        # 兜底：尝试从 markdown 代码块中提取单个 HTML
        html_match = re.search(r"```html\s*(.*?)\s*```", response_text, re.DOTALL)
        if html_match:
            return {"index.html": html_match.group(1)}

        stripped = response_text.strip()
        if stripped.startswith("<!DOCTYPE") or stripped.startswith("<html"):
            return {"index.html": stripped}

        return {}

    @staticmethod
    def _safe_json(text: str) -> Dict[str, Any]:
        stripped = text.strip()
        try:
            return json.loads(stripped)
        except Exception:
            pass

        fenced = re.search(r"```json\s*(.*?)\s*```", stripped, re.DOTALL)
        if fenced:
            try:
                return json.loads(fenced.group(1))
            except Exception:
                pass

        obj_match = re.search(r"\{.*\}", stripped, re.DOTALL)
        if obj_match:
            try:
                return json.loads(obj_match.group(0))
            except Exception:
                pass

        return {}

    @staticmethod
    def _normalize_files(files: Dict[str, str]) -> Dict[str, str]:
        normalized: Dict[str, str] = {}
        for path, content in files.items():
            clean_path = path.replace("\\", "/").strip("/")
            if not clean_path or clean_path.startswith(".."):
                continue
            normalized[clean_path] = content
        return normalized

    def _ensure_required_files(
        self,
        files: Dict[str, str],
        output_format: OutputFormat,
        intent: str,
    ) -> Dict[str, str]:
        if output_format == OutputFormat.SINGLE_HTML:
            if not files:
                return self._fallback_files(intent, output_format)
            html_files = [path for path in files if path.lower().endswith(".html")]
            if not html_files:
                first_path = next(iter(files))
                return {"index.html": files[first_path]}
            return files

        if output_format == OutputFormat.MULTI_HTML:
            html_files = [path for path in files if path.lower().endswith(".html")]
            if len(html_files) < 2:
                fallback = self._fallback_files(intent, output_format)
                files.update(fallback)
            return files

        # React 项目
        required = {
            "package.json": self._default_package_json(),
            "index.html": self._default_index_html(),
            "src/main.jsx": self._default_main_jsx(),
            "src/App.jsx": self._default_app_jsx(intent),
            "src/styles.css": self._default_styles_css(),
        }
        for path, content in required.items():
            files.setdefault(path, content)
        return files

    def _fallback_files(self, intent: str, output_format: OutputFormat) -> Dict[str, str]:
        if output_format == OutputFormat.SINGLE_HTML:
            return {
                "index.html": (
                    "<!DOCTYPE html>\n"
                    "<html lang=\"zh-CN\">\n"
                    "<head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>"
                    "<title>Generated Page</title>"
                    "<style>body{font-family:system-ui;margin:0;padding:40px;background:#f5f7fb;color:#1c2430;}"
                    ".card{max-width:920px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 20px 50px rgba(22,37,66,.08);}"
                    "h1{margin:0 0 12px;}p{line-height:1.7;color:#475569;}</style></head>\n"
                    f"<body><main class=\"card\"><h1>页面草稿</h1><p>{intent}</p></main></body></html>"
                )
            }

        if output_format == OutputFormat.MULTI_HTML:
            return {
                "index.html": (
                    "<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"UTF-8\"/>"
                    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>主页</title>"
                    "<style>body{font-family:system-ui;margin:0;padding:32px;}nav a{margin-right:12px;}</style></head>"
                    "<body><nav><a href=\"index.html\">首页</a><a href=\"details.html\">详情页</a></nav>"
                    f"<h1>主页</h1><p>{intent}</p></body></html>"
                ),
                "details.html": (
                    "<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"UTF-8\"/>"
                    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>详情页</title></head>"
                    "<body><nav><a href=\"index.html\">返回首页</a></nav><h1>详情页</h1><p>这是自动生成的详情页占位。</p></body></html>"
                ),
            }

        return {
            "package.json": self._default_package_json(),
            "index.html": self._default_index_html(),
            "src/main.jsx": self._default_main_jsx(),
            "src/App.jsx": self._default_app_jsx(intent),
            "src/styles.css": self._default_styles_css(),
        }

    @staticmethod
    def _default_package_json() -> str:
        return json.dumps(
            {
                "name": "web-printer-output",
                "private": True,
                "version": "0.0.1",
                "type": "module",
                "scripts": {
                    "dev": "vite",
                    "build": "vite build",
                    "preview": "vite preview",
                },
                "dependencies": {"react": "^18.3.1", "react-dom": "^18.3.1"},
                "devDependencies": {"vite": "^5.4.10"},
            },
            ensure_ascii=False,
            indent=2,
        )

    @staticmethod
    def _default_index_html() -> str:
        return (
            "<!doctype html>\n"
            "<html lang=\"zh-CN\">\n"
            "  <head>\n"
            "    <meta charset=\"UTF-8\" />\n"
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n"
            "    <title>Web Printer React Output</title>\n"
            "  </head>\n"
            "  <body>\n"
            "    <div id=\"root\"></div>\n"
            "    <script type=\"module\" src=\"/src/main.jsx\"></script>\n"
            "  </body>\n"
            "</html>\n"
        )

    @staticmethod
    def _default_main_jsx() -> str:
        return (
            "import React from 'react';\n"
            "import { createRoot } from 'react-dom/client';\n"
            "import App from './App';\n"
            "import './styles.css';\n\n"
            "createRoot(document.getElementById('root')).render(\n"
            "  <React.StrictMode>\n"
            "    <App />\n"
            "  </React.StrictMode>\n"
            ");\n"
        )

    @staticmethod
    def _default_app_jsx(intent: str) -> str:
        safe_text = intent.replace("'", "\\'")
        return (
            "export default function App() {\n"
            "  return (\n"
            "    <main className=\"layout\">\n"
            "      <section className=\"card\">\n"
            "        <h1>React 项目骨架</h1>\n"
            f"        <p>{safe_text}</p>\n"
            "      </section>\n"
            "    </main>\n"
            "  );\n"
            "}\n"
        )

    @staticmethod
    def _default_styles_css() -> str:
        return (
            ":root { font-family: 'Segoe UI', Tahoma, sans-serif; }\n"
            "* { box-sizing: border-box; }\n"
            "body { margin: 0; background: #eef2ff; color: #111827; }\n"
            ".layout { min-height: 100vh; display: grid; place-items: center; padding: 24px; }\n"
            ".card { max-width: 780px; background: white; border-radius: 18px; padding: 28px; box-shadow: 0 15px 45px rgba(30, 41, 59, 0.12); }\n"
            "h1 { margin-top: 0; }\n"
            "p { line-height: 1.8; color: #374151; }\n"
        )
