"""根据复杂度生成单页、多页或 React 项目代码。"""

import base64
import json
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List

from openai import OpenAI

from .complexity_analyzer import OutputFormat
from .intent_planner import IntentPlan
from .logger import get_logger


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
            finish_reason = response.choices[0].finish_reason

            print(f"\n[DEBUG] API 响应成功:")
            print(f"  - Response Length: {len(raw_response)} chars")
            print(f"  - Finish Reason: {finish_reason}")
            print(f"  - First 500 chars: {raw_response[:500]}")

            # 检查是否因为长度限制被截断
            if finish_reason == "length":
                error_msg = (
                    f"模型输出因达到 max_tokens 限制 ({self.max_tokens}) 而被截断。"
                    f"响应长度: {len(raw_response)} 字符。"
                    f"请检查日志文件查看完整输出，或增加 MAX_TOKENS 配置。"
                )
                print(f"\n[ERROR] {error_msg}")
                warnings.append(error_msg)
                # 仍然尝试解析，但如果失败则报错而不是回退
                parsed_files = self._parse_files(raw_response)
                if not parsed_files:
                    raise RuntimeError(error_msg)
                files = self._normalize_files(parsed_files)
            else:
                # 记录 API 调用
                logger = get_logger()
                logger.log_api_call(
                    agent_type="artifact_generator",
                    model=self.model,
                    base_url=str(self.client.base_url),
                    prompt=prompt,
                    response=raw_response,
                    metadata={
                        "max_tokens": self.max_tokens,
                        "output_format": output_format.value,
                        "image_count": len(content_parts) - 1,
                        "finish_reason": finish_reason,
                    },
                )

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
            OutputFormat.SINGLE_HTML: (
                "输出 1 个完全独立的 HTML 文件，所有内容必须内联：\n"
                "- CSS 必须写在 <style> 标签内\n"
                "- JavaScript 必须写在 <script> 标签内\n"
                "- 如需使用库（如 jQuery、Chart.js 等），通过 CDN 引入\n"
                "- 不允许外部文件引用（除 CDN）\n"
                "- 文件可以直接双击在浏览器中打开运行"
            ),
            OutputFormat.MULTI_HTML: (
                "输出 2-5 个独立的 HTML 文件，每个文件都是完整的：\n"
                "- 每个 HTML 文件都包含完整的 <head>、<style>、<script>\n"
                "- CSS 和 JavaScript 必须内联在各自的 HTML 文件中\n"
                "- 如需使用库，通过 CDN 引入\n"
                "- 页面间通过相对路径链接（如 <a href=\"page2.html\">）\n"
                "- 每个文件都可以独立在浏览器中打开"
            ),
        }

        return (
            "你是资深前端工程师。请基于用户意图与页面线索实现一个功能完整的web前端，必须具体实现全部功能，让用户直接可用。\n\n"
            f"目标输出类型: {output_format.value}\n"
            f"格式要求: {format_requirements[output_format]}\n"
            f"用户意图: {intent}\n"
            f"规划摘要: {intent_plan.summary}\n"
            f"UI 说明: {json.dumps(intent_plan.ui_requirements, ensure_ascii=False)}\n"
            f"技术说明: {json.dumps(intent_plan.technical_requirements, ensure_ascii=False)}\n"
            f"交互性要求: {'必须实现' if intent_plan.requires_interactivity else '可选'}\n"
            f"需要实现的交互功能: {json.dumps(intent_plan.interaction_features, ensure_ascii=False)}\n"
            f"上下文摘要: {json.dumps(compact_context, ensure_ascii=False, indent=2)}\n\n"
            "注意:\n"
            "1. 尽可能实现网页中需要的功能。如果采集的信息不足，你需要推断并实现。\n"
            "2. 对于涉及文件或设备交互的功能（如图片上传、文件选择、相机调用等），在 HTML 中实现：\n"
            "   - 使用 <input type=\"file\"> 实现文件选择和上传\n"
            "   - 使用 <input type=\"file\" accept=\"image/*\" capture=\"camera\"> 调用相机\n"
            "   - 使用 localStorage/sessionStorage 或内存数组管理数据\n"
            "3. 除非特殊情况，否则你应该创建<script>块并给出交互逻辑的完整实现。交互结果应当是用户可见的，而非console日志。\n"
            + (
                "\n4. **关键要求 - 必须实现交互功能**:\n"
                "   - 页面包含交互元素（按钮、表单、输入框等），必须实现完整的功能逻辑\n"
                "   - 所有按钮必须有实际的点击事件处理，不能只是静态展示\n"
                "   - 如需复杂交互，可通过 CDN 引入轻量级库（如 Alpine.js、Petite Vue 等）\n"
                "   - 确保用户可以实际使用这些功能，而不是空壳界面\n"
                if intent_plan.requires_interactivity
                else ""
            )
            + "\n\n输出格式要求:\n"
            "使用代码块格式输出每个文件，格式如下：\n"
            "```filepath:relative/path/to/file.ext\n"
            "文件内容\n"
            "```\n\n"
            "示例:\n"
            "```filepath:index.html\n"
            "<!DOCTYPE html>\n"
            "<html>...</html>\n"
            "```\n\n"
            "```filepath:page2.html\n"
            "<!DOCTYPE html>\n"
            "<html>...</html>\n"
            "```\n\n"
            "- 代码块标记必须是 ```filepath:路径\n"
            "- 不要添加任何解释文字，只输出代码块\n"
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
        """从响应中解析文件。优先使用代码块格式，兼容 JSON 格式。"""
        files: Dict[str, str] = {}

        # 方法1: 解析 ```filepath:path 格式的代码块
        filepath_pattern = r"```filepath:([^\n]+)\n(.*?)```"
        matches = re.findall(filepath_pattern, response_text, re.DOTALL)

        if matches:
            print(f"[DEBUG] Found {len(matches)} filepath code blocks")
            for path, content in matches:
                path = path.strip()
                if path:
                    files[path] = content
            if files:
                return files

        # 方法2: 尝试解析 JSON 格式（兼容旧格式）
        data = ArtifactGenerator._safe_json(response_text)
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

        # 方法3: 兜底 - 尝试从 markdown 代码块中提取单个 HTML
        html_match = re.search(r"```html\s*(.*?)\s*```", response_text, re.DOTALL)
        if html_match:
            return {"index.html": html_match.group(1)}

        # 方法4: 兜底 - 检查是否直接是 HTML
        stripped = response_text.strip()
        if stripped.startswith("<!DOCTYPE") or stripped.startswith("<html"):
            return {"index.html": stripped}

        return {}

    @staticmethod
    def _safe_json(text: str) -> Dict[str, Any]:
        stripped = text.strip()

        # 尝试直接解析
        try:
            return json.loads(stripped)
        except Exception as e:
            print(f"[DEBUG] Direct JSON parse failed: {e}")

        # 尝试从 markdown 代码块提取
        fenced = re.search(r"```json\s*(.*?)\s*```", stripped, re.DOTALL)
        if fenced:
            try:
                return json.loads(fenced.group(1))
            except Exception as e:
                print(f"[DEBUG] Fenced JSON parse failed: {e}")

        # 使用更精确的方法：逐字符解析找到第一个完整的 JSON 对象
        try:
            start_idx = stripped.find('{')
            if start_idx != -1:
                brace_count = 0
                in_string = False
                escape_next = False

                for i in range(start_idx, len(stripped)):
                    char = stripped[i]

                    if escape_next:
                        escape_next = False
                        continue

                    if char == '\\':
                        escape_next = True
                        continue

                    if char == '"' and not escape_next:
                        in_string = not in_string
                        continue

                    if not in_string:
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                json_str = stripped[start_idx:i+1]
                                print(f"[DEBUG] Extracted JSON length: {len(json_str)} chars")
                                try:
                                    return json.loads(json_str)
                                except json.JSONDecodeError as je:
                                    print(f"[DEBUG] JSON decode error: {je}")
                                    print(f"[DEBUG] Error at position {je.pos}")
                                    if je.pos < len(json_str):
                                        context_start = max(0, je.pos - 100)
                                        context_end = min(len(json_str), je.pos + 100)
                                        print(f"[DEBUG] Context around error: {json_str[context_start:context_end]}")
                                    # 尝试使用 strict=False 解析
                                    try:
                                        return json.loads(json_str, strict=False)
                                    except Exception:
                                        pass
        except Exception as e:
            print(f"[DEBUG] Character-by-character JSON parse failed: {e}")

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

        return files

    def _fallback_files(self, intent: str, output_format: OutputFormat) -> Dict[str, str]:
        if output_format == OutputFormat.SINGLE_HTML:
            return {
                "index.html": (
                    "<!DOCTYPE html>\n"
                    "<html lang=\"zh-CN\">\n"
                    "<head>\n"
                    "  <meta charset=\"UTF-8\"/>\n"
                    "  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>\n"
                    "  <title>Generated Page</title>\n"
                    "  <style>\n"
                    "    body { font-family: system-ui; margin: 0; padding: 40px; background: #f5f7fb; color: #1c2430; }\n"
                    "    .card { max-width: 920px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 28px; box-shadow: 0 20px 50px rgba(22,37,66,.08); }\n"
                    "    h1 { margin: 0 0 12px; }\n"
                    "    p { line-height: 1.7; color: #475569; }\n"
                    "  </style>\n"
                    "</head>\n"
                    "<body>\n"
                    "  <main class=\"card\">\n"
                    "    <h1>页面草稿</h1>\n"
                    f"    <p>{intent}</p>\n"
                    "  </main>\n"
                    "</body>\n"
                    "</html>"
                )
            }

        if output_format == OutputFormat.MULTI_HTML:
            return {
                "index.html": (
                    "<!DOCTYPE html>\n"
                    "<html lang=\"zh-CN\">\n"
                    "<head>\n"
                    "  <meta charset=\"UTF-8\"/>\n"
                    "  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>\n"
                    "  <title>主页</title>\n"
                    "  <style>\n"
                    "    body { font-family: system-ui; margin: 0; padding: 32px; }\n"
                    "    nav a { margin-right: 12px; }\n"
                    "  </style>\n"
                    "</head>\n"
                    "<body>\n"
                    "  <nav>\n"
                    "    <a href=\"index.html\">首页</a>\n"
                    "    <a href=\"details.html\">详情页</a>\n"
                    "  </nav>\n"
                    "  <h1>主页</h1>\n"
                    f"  <p>{intent}</p>\n"
                    "</body>\n"
                    "</html>"
                ),
                "details.html": (
                    "<!DOCTYPE html>\n"
                    "<html lang=\"zh-CN\">\n"
                    "<head>\n"
                    "  <meta charset=\"UTF-8\"/>\n"
                    "  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>\n"
                    "  <title>详情页</title>\n"
                    "  <style>\n"
                    "    body { font-family: system-ui; margin: 0; padding: 32px; }\n"
                    "    nav a { margin-right: 12px; }\n"
                    "  </style>\n"
                    "</head>\n"
                    "<body>\n"
                    "  <nav>\n"
                    "    <a href=\"index.html\">返回首页</a>\n"
                    "  </nav>\n"
                    "  <h1>详情页</h1>\n"
                    "  <p>这是自动生成的详情页占位。</p>\n"
                    "</body>\n"
                    "</html>"
                ),
            }

        return {}
