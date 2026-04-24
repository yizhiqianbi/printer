"""页面复杂度分析器"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any


class OutputFormat(Enum):
    """输出格式"""
    SINGLE_HTML = "single_html"  # 单个 HTML 文件（所有内容内联）
    MULTI_HTML = "multi_html"    # 多个 HTML 页面（独立文件）


@dataclass
class ComplexityScore:
    """复杂度评分"""
    total: int
    components: int
    interactions: int
    pages: int
    data_flow: int

    def get_format(self) -> OutputFormat:
        """根据复杂度决定输出格式"""
        if self.total < 40:
            return OutputFormat.SINGLE_HTML
        else:
            return OutputFormat.MULTI_HTML


class ComplexityAnalyzer:
    """复杂度分析器"""

    def analyze(self, page_info: Dict[str, Any]) -> ComplexityScore:
        """
        分析页面复杂度

        评分标准：
        - 组件数量：标题、按钮、图片、表单等
        - 交互复杂度：动态内容、状态管理需求
        - 页面数量：多页面应用
        - 数据流：API 调用、数据绑定
        """
        components_score = self._score_components(page_info)
        interactions_score = self._score_interactions(page_info)
        pages_score = self._score_pages(page_info)
        data_flow_score = self._score_data_flow(page_info)

        total = components_score + interactions_score + pages_score + data_flow_score

        return ComplexityScore(
            total=total,
            components=components_score,
            interactions=interactions_score,
            pages=pages_score,
            data_flow=data_flow_score
        )

    def _score_components(self, page_info: Dict[str, Any]) -> int:
        """评估组件复杂度"""
        score = 0

        # 基础元素
        score += min(len(page_info.get("headings", [])), 10)
        score += min(len(page_info.get("buttons", [])) // 2, 10)
        score += min(len(page_info.get("images", [])) // 3, 10)

        # 视觉摘要中的区块
        visual = page_info.get("visual_summary", {})
        score += min(len(visual.get("top_blocks", [])), 10)

        return score

    def _score_interactions(self, page_info: Dict[str, Any]) -> int:
        """评估交互复杂度"""
        score = 0

        # 按钮和交互元素
        buttons = page_info.get("buttons", [])
        score += min(len(buttons) // 3, 15)

        # 表单元素（从文本内容推断）
        text = page_info.get("text_content", "").lower()
        if any(keyword in text for keyword in ["submit", "login", "register", "search"]):
            score += 10

        return score

    def _score_pages(self, page_info: Dict[str, Any]) -> int:
        """评估页面数量"""
        score = 0

        # 导航链接数量
        links = page_info.get("links", [])
        nav_links = [link for link in links if len(link.get("text", "")) < 20]
        score += min(len(nav_links) // 3, 15)

        return score

    def _score_data_flow(self, page_info: Dict[str, Any]) -> int:
        """评估数据流复杂度"""
        score = 0

        # 动态内容指标
        text = page_info.get("text_content", "").lower()
        if any(keyword in text for keyword in ["api", "loading", "fetch", "data"]):
            score += 10

        # 列表和重复结构
        visual = page_info.get("visual_summary", {})
        blocks = visual.get("top_blocks", [])
        if len(blocks) > 5:
            score += 10

        return score
