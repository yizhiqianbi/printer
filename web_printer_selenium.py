#!/usr/bin/env python3
"""网页复印机 - 多模态升级版入口。

支持两种使用方式：
1) 新模式（推荐）:
   python web_printer_selenium.py --intent "重建一个营销页" --input https://example.com --input shot.png --input page.mhtml
2) 兼容模式（旧 URL 调用）:
   python web_printer_selenium.py https://example.com output.html 5
"""

import argparse
import os
import sys
from typing import List, Optional, Tuple

from src import Config, WebPrinterPipeline
from src.complexity_analyzer import OutputFormat

DEFAULT_LEGACY_INTENT = "请根据该网页重建页面，保持内容结构和视觉风格。"


class WebPrinterSelenium:
    """兼容旧接口的包装类。"""

    def __init__(self, api_key: Optional[str] = None, headless: bool = True):
        if api_key:
            os.environ["OPENAI_API_KEY"] = api_key

        config = Config.from_env()
        config.headless = headless
        self.pipeline = WebPrinterPipeline(config)

    def print_webpage(self, url: str, output_path: Optional[str] = None, wait_time: int = 5) -> bool:
        """兼容旧版 URL 打印方法。"""
        result = self.pipeline.run(
            intent=DEFAULT_LEGACY_INTENT,
            inputs=[url],
            output_path=output_path,
            wait_time=wait_time,
        )
        return result.success


def parse_args() -> argparse.Namespace:
    """解析命令行参数。"""
    parser = argparse.ArgumentParser(
        description="Web Printer: 根据意图 + URL/截图/MHTML 生成 HTML 或 React 项目"
    )

    # 兼容旧版位置参数
    parser.add_argument("legacy_url", nargs="?", help="兼容模式: URL")
    parser.add_argument("legacy_output", nargs="?", help="兼容模式: 输出文件路径")
    parser.add_argument("legacy_wait", nargs="?", type=int, help="兼容模式: URL 等待时间(秒)")

    # 新模式参数
    parser.add_argument("--intent", help="用户意图描述（推荐）")
    parser.add_argument(
        "--input",
        dest="inputs",
        action="append",
        default=[],
        help="输入项（可重复）：URL、截图路径、.mhtml/.mht 文件路径",
    )
    parser.add_argument("--output", help="输出路径：单页可为 .html，复杂项目建议目录")
    parser.add_argument("--wait-time", type=int, default=None, help="URL 渲染等待时间(秒)")

    parser.add_argument("--headless", action="store_true", help="启用无头浏览器")
    parser.add_argument("--no-headless", action="store_true", help="禁用无头浏览器")
    parser.add_argument("--disable-langchain", action="store_true", help="禁用 LangChain 意图规划")
    parser.add_argument("--show-plan", action="store_true", help="打印复杂度和规划摘要")

    return parser.parse_args()


def resolve_runtime_input(args: argparse.Namespace) -> Tuple[str, List[str], Optional[str], Optional[int]]:
    """统一解析新旧模式输入。"""
    inputs = list(args.inputs)

    if args.intent:
        intent = args.intent.strip()
        if args.legacy_url:
            inputs.append(args.legacy_url)
        if not intent:
            raise ValueError("--intent 不能为空")
        if not inputs:
            raise ValueError("请至少提供一个 --input（或附带 legacy_url）")
        output_path = args.output or args.legacy_output
        wait_time = args.wait_time if args.wait_time is not None else args.legacy_wait
        return intent, inputs, output_path, wait_time

    if not args.legacy_url:
        raise ValueError(
            "缺少输入。请使用新模式: --intent + --input，或兼容模式: web_printer_selenium.py <URL>"
        )

    intent = DEFAULT_LEGACY_INTENT
    inputs = [args.legacy_url] + inputs
    output_path = args.output or args.legacy_output
    wait_time = args.wait_time if args.wait_time is not None else args.legacy_wait
    return intent, inputs, output_path, wait_time


def apply_runtime_overrides(config: Config, args: argparse.Namespace) -> Config:
    """将 CLI 参数覆盖到配置。"""
    if args.headless and args.no_headless:
        raise ValueError("--headless 与 --no-headless 不能同时使用")
    if args.headless:
        config.headless = True
    if args.no_headless:
        config.headless = False
    if args.disable_langchain:
        config.use_langchain = False
    return config


def print_result_summary(result) -> None:
    """打印执行结果摘要。"""
    format_label = {
        OutputFormat.SINGLE_HTML: "single_html",
        OutputFormat.MULTI_HTML: "multi_html",
        OutputFormat.REACT_PROJECT: "react_project",
    }[result.output_format]

    print("执行成功")
    print(f"输出类型: {format_label}")
    print(f"输出路径: {result.output_path}")
    print(f"写入文件数: {len(result.written_files)}")

    if result.warnings:
        print("警告:")
        for warning in result.warnings:
            print(f"- {warning}")


def print_plan_summary(result) -> None:
    """打印规划摘要。"""
    complexity = result.complexity
    plan = result.intent_plan

    print("\n复杂度评分:")
    print(f"- total: {complexity.total}")
    print(f"- components: {complexity.components}")
    print(f"- interactions: {complexity.interactions}")
    print(f"- pages: {complexity.pages}")
    print(f"- data_flow: {complexity.data_flow}")

    print("\n意图规划:")
    print(f"- summary: {plan.summary}")
    print(f"- complexity_bias: {plan.complexity_bias}")
    print(f"- confidence: {plan.confidence:.2f}")
    if plan.output_hint:
        print(f"- output_hint: {plan.output_hint.value}")

    if plan.ui_requirements:
        print("- ui_requirements:")
        for requirement in plan.ui_requirements:
            print(f"  * {requirement}")

    if plan.technical_requirements:
        print("- technical_requirements:")
        for requirement in plan.technical_requirements:
            print(f"  * {requirement}")


def main() -> None:
    args = parse_args()

    try:
        intent, inputs, output_path, wait_time = resolve_runtime_input(args)

        config = Config.from_env()
        config = apply_runtime_overrides(config, args)

        pipeline = WebPrinterPipeline(config)
        result = pipeline.run(
            intent=intent,
            inputs=inputs,
            output_path=output_path,
            wait_time=wait_time,
        )

        print_result_summary(result)
        if args.show_plan:
            print_plan_summary(result)

        sys.exit(0 if result.success else 1)
    except Exception as exc:
        print(f"错误: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
