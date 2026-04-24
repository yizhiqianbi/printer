"""意图理解与任务规划（LangChain 增强）。"""

import json
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .complexity_analyzer import OutputFormat


@dataclass
class IntentPlan:
    """意图规划结果。"""

    summary: str
    ui_requirements: List[str] = field(default_factory=list)
    technical_requirements: List[str] = field(default_factory=list)
    complexity_bias: int = 0
    output_hint: Optional[OutputFormat] = None
    confidence: float = 0.5
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
            "output_hint: string (single_html/multi_html/react_project/auto)\n"
            "confidence: number (0-1)\n\n"
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

        data = self._safe_json(response_text)
        return IntentPlan(
            summary=data.get("summary", "根据输入重建页面"),
            ui_requirements=self._normalize_list(data.get("ui_requirements")),
            technical_requirements=self._normalize_list(data.get("technical_requirements")),
            complexity_bias=int(data.get("complexity_bias", 0)),
            output_hint=self._parse_output_hint(data.get("output_hint")),
            confidence=float(data.get("confidence", 0.6)),
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

        if any(word in intent_lower for word in ["后台", "dashboard", "管理", "admin"]):
            ui_requirements.append("需要信息密度较高的仪表盘布局")
            complexity_bias += 8

        if any(word in intent_lower for word in ["动效", "动画", "交互", "状态"]):
            technical_requirements.append("需要可维护的交互状态管理")
            complexity_bias += 10

        if any(word in intent_lower for word in ["react", "组件", "hooks", "typescript"]):
            technical_requirements.append("用户偏向组件化工程输出")
            output_hint = OutputFormat.REACT_PROJECT
            complexity_bias += 10

        if pages_count >= 2:
            complexity_bias += 8
            technical_requirements.append("输入包含多页面线索，需要导航与页面拆分")

        if screenshot_count >= 2:
            ui_requirements.append("需优先还原截图中的布局、间距和色彩")
            complexity_bias += 5

        summary = "基于意图与多模态素材重建页面，并保证可维护结构"
        if self._init_error:
            technical_requirements.append(f"LangChain 初始化失败，已回退规则模式: {self._init_error}")

        return IntentPlan(
            summary=summary,
            ui_requirements=ui_requirements or ["保持输入内容语义与视觉一致性"],
            technical_requirements=technical_requirements or ["输出代码需可直接运行"],
            complexity_bias=complexity_bias,
            output_hint=output_hint,
            confidence=0.5,
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
