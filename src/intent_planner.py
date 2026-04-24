"""意图理解与任务规划（LangChain 增强）。"""

import json
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .complexity_analyzer import OutputFormat
from .logger import get_logger


@dataclass
class IntentPlan:
    """意图规划结果。"""

    summary: str
    ui_requirements: List[str] = field(default_factory=list)
    technical_requirements: List[str] = field(default_factory=list)
    complexity_bias: int = 0
    output_hint: Optional[OutputFormat] = None
    confidence: float = 0.5
    requires_interactivity: bool = False  # 是否需要交互功能
    interaction_features: List[str] = field(default_factory=list)  # 需要实现的交互功能列表
    raw_response: str = ""


class IntentPlanner:
    """优先使用 LangChain 进行意图理解，不可用时回退规则引擎。"""

    def __init__(self, openai_api_key: str, openai_base_url: str, model: str, enabled: bool = True):
        self.enabled = enabled
        self._chat_model = None
        self._prompt_builder = None
        self._init_error = ""

        if not enabled:
            return

        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.prompts import ChatPromptTemplate

            self._chat_model = ChatOpenAI(
                model=model,
                openai_api_key=openai_api_key,
                openai_api_base=openai_base_url,
                temperature=0,
                max_tokens=2000,
            )
            self._prompt_builder = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "你是资深 Web 产品规划师。"
                        "你需要把用户意图和多模态页面线索转成可执行开发计划。"
                        "只输出 JSON，不要解释。",
                    ),
                    ("human", "{input_text}"),
                ]
            )
        except Exception as exc:
            print(f"\n[WARNING] LangChain 初始化失败: {exc}")
            import traceback
            traceback.print_exc()
            self._init_error = str(exc)
            self._chat_model = None
            self._prompt_builder = None

    def is_langchain_ready(self) -> bool:
        return bool(self.enabled and self._chat_model and self._prompt_builder)

    def plan(self, intent: str, extraction_context: Dict[str, Any]) -> IntentPlan:
        """生成意图规划。"""
        if self.is_langchain_ready():
            try:
                return self._plan_with_langchain(intent, extraction_context)
            except Exception:
                pass
        return self._plan_with_heuristics(intent, extraction_context)

    def _plan_with_langchain(self, intent: str, extraction_context: Dict[str, Any]) -> IntentPlan:
        context_text = json.dumps(extraction_context, ensure_ascii=False, indent=2)
        input_text = (
            "请基于以下信息做规划。\n"
            "输出 JSON 字段必须包含：\n"
            "summary: string\n"
            "ui_requirements: string[]\n"
            "technical_requirements: string[]\n"
            "complexity_bias: integer (-10 到 20)\n"
            "output_hint: string (single_html/multi_html/auto)\n"
            "confidence: number (0-1)\n"
            "requires_interactivity: boolean (是否需要实现交互功能)\n"
            "interaction_features: string[] (需要实现的具体交互功能列表)\n\n"
            "交互性判断标准：\n"
            "- 如果页面包含表单、按钮、输入框、下拉菜单等交互元素，requires_interactivity 应为 true\n"
            "- 如果页面包含动态内容、状态管理、数据提交等功能，requires_interactivity 应为 true\n"
            "- 如果页面只是静态展示内容（如文章、介绍页），requires_interactivity 可为 false\n"
            "- interaction_features 应列出所有需要实现的交互功能，例如：\n"
            "  * '表单提交和验证'\n"
            "  * '按钮点击响应'\n"
            "  * '数据增删改查'\n"
            "  * '文件上传和预览'\n"
            "  * '搜索和筛选'\n"
            "  * '模态框/弹窗交互'\n"
            "  * '拖拽排序'\n"
            "  * '实时数据更新'\n\n"
            f"用户意图:\n{intent}\n\n"
            f"多模态上下文:\n{context_text}"
        )

        print(f"\n[DEBUG] LangChain 意图规划:")
        print(f"  - Intent: {intent[:100]}")
        print(f"  - Context Size: {len(context_text)} chars")

        chain = self._prompt_builder | self._chat_model
        message = chain.invoke({"input_text": input_text})
        response_text = message.content if isinstance(message.content, str) else str(message.content)

        print(f"  - Response Length: {len(response_text)} chars")
        print(f"  - Response Preview: {response_text[:300]}")

        # 记录 API 调用
        logger = get_logger()
        logger.log_api_call(
            agent_type="intent_planner",
            model=str(self._chat_model.model_name) if hasattr(self._chat_model, 'model_name') else "unknown",
            base_url=str(self._chat_model.openai_api_base) if hasattr(self._chat_model, 'openai_api_base') else "unknown",
            prompt=input_text,
            response=response_text,
            metadata={"intent": intent[:200]},
        )

        data = self._safe_json(response_text)
        return IntentPlan(
            summary=data.get("summary", "根据输入重建页面"),
            ui_requirements=self._normalize_list(data.get("ui_requirements")),
            technical_requirements=self._normalize_list(data.get("technical_requirements")),
            complexity_bias=int(data.get("complexity_bias", 0)),
            output_hint=self._parse_output_hint(data.get("output_hint")),
            confidence=float(data.get("confidence", 0.6)),
            requires_interactivity=bool(data.get("requires_interactivity", False)),
            interaction_features=self._normalize_list(data.get("interaction_features")),
            raw_response=response_text,
        )

    def _plan_with_heuristics(self, intent: str, extraction_context: Dict[str, Any]) -> IntentPlan:
        intent_lower = intent.lower()
        pages_count = len(extraction_context.get("pages", []))
        screenshot_count = len(extraction_context.get("screenshots", []))

        ui_requirements: List[str] = []
        technical_requirements: List[str] = []
        complexity_bias = 0
        output_hint = None
        requires_interactivity = False
        interaction_features: List[str] = []

        # 分析交互性需求
        pages = extraction_context.get("pages", [])
        for page in pages:
            buttons = page.get("buttons", [])
            links = page.get("links", [])

            # 检测表单相关元素
            button_texts = [btn.get("text", "").lower() for btn in buttons]
            has_form_buttons = any(
                keyword in text
                for text in button_texts
                for keyword in ["提交", "submit", "登录", "login", "注册", "register", "搜索", "search", "保存", "save", "确认", "confirm", "添加", "add", "删除", "delete"]
            )

            if has_form_buttons:
                requires_interactivity = True
                interaction_features.append("表单提交和验证")
                technical_requirements.append("实现表单交互逻辑，包括输入验证和提交处理")
                complexity_bias += 10

            # 检测按钮数量（排除纯链接）
            if len(buttons) >= 3:
                requires_interactivity = True
                if "按钮点击响应" not in interaction_features:
                    interaction_features.append("按钮点击响应")
                technical_requirements.append("实现所有按钮的点击事件处理")
                complexity_bias += 5

            # 检测文本内容中的交互关键词
            text_content = page.get("text_content", "").lower()

            if any(kw in text_content for kw in ["上传", "upload", "选择文件", "choose file"]):
                requires_interactivity = True
                interaction_features.append("文件上传和预览")
                technical_requirements.append("实现文件选择、上传和预览功能")
                complexity_bias += 8

            if any(kw in text_content for kw in ["搜索", "search", "筛选", "filter"]):
                requires_interactivity = True
                interaction_features.append("搜索和筛选")
                technical_requirements.append("实现搜索和筛选功能")
                complexity_bias += 6

            if any(kw in text_content for kw in ["排序", "sort", "拖拽", "drag"]):
                requires_interactivity = True
                interaction_features.append("拖拽排序")
                technical_requirements.append("实现拖拽排序功能")
                complexity_bias += 10

            if any(kw in text_content for kw in ["弹窗", "modal", "对话框", "dialog"]):
                requires_interactivity = True
                interaction_features.append("模态框/弹窗交互")
                technical_requirements.append("实现模态框的打开、关闭和交互")
                complexity_bias += 5

        # 用户意图中的交互关键词
        if any(word in intent_lower for word in ["交互", "功能", "操作", "点击", "输入", "提交"]):
            requires_interactivity = True
            if not interaction_features:
                interaction_features.append("基础交互功能")
            complexity_bias += 5

        if any(word in intent_lower for word in ["后台", "dashboard", "管理", "admin"]):
            ui_requirements.append("需要信息密度较高的仪表盘布局")
            requires_interactivity = True
            if "数据增删改查" not in interaction_features:
                interaction_features.append("数据增删改查")
            technical_requirements.append("实现完整的 CRUD 操作")
            complexity_bias += 8

        if any(word in intent_lower for word in ["动效", "动画", "交互", "状态"]):
            requires_interactivity = True
            if "实时数据更新" not in interaction_features:
                interaction_features.append("实时数据更新")
            technical_requirements.append("需要可维护的交互状态管理")
            complexity_bias += 10

        if pages_count >= 2:
            complexity_bias += 8
            technical_requirements.append("输入包含多页面线索，需要导航与页面拆分")

        if screenshot_count >= 2:
            ui_requirements.append("需优先还原截图中的布局、间距和色彩")
            complexity_bias += 5

        summary = "基于意图与多模态素材重建页面，并保证可维护结构"
        if requires_interactivity:
            summary += "，实现完整的交互功能"

        if self._init_error:
            technical_requirements.append(f"LangChain 初始化失败，已回退规则模式: {self._init_error}")

        return IntentPlan(
            summary=summary,
            ui_requirements=ui_requirements or ["保持输入内容语义与视觉一致性"],
            technical_requirements=technical_requirements or ["输出代码需可直接运行"],
            complexity_bias=complexity_bias,
            output_hint=output_hint,
            confidence=0.5,
            requires_interactivity=requires_interactivity,
            interaction_features=interaction_features or [],
            raw_response="heuristic_fallback",
        )

    @staticmethod
    def _normalize_list(value: Any) -> List[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []

    @staticmethod
    def _parse_output_hint(value: Any) -> Optional[OutputFormat]:
        if not value:
            return None
        normalized = str(value).strip().lower()
        mapping = {
            "single_html": OutputFormat.SINGLE_HTML,
            "multi_html": OutputFormat.MULTI_HTML,
            "react_project": OutputFormat.REACT_PROJECT,
        }
        return mapping.get(normalized)

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
