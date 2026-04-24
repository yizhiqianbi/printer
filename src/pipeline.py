"""Web Printer 主流程编排。"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .artifact_generator import ArtifactGenerator, GenerationArtifact
from .complexity_analyzer import ComplexityAnalyzer, ComplexityScore, OutputFormat
from .config import Config
from .input_parser import InputParser
from .intent_planner import IntentPlan, IntentPlanner
from .page_extractor import ExtractionResult, PageExtractor


@dataclass
class PipelineResult:
    """主流程执行结果。"""

    success: bool
    output_format: OutputFormat
    output_path: str
    written_files: List[str]
    complexity: ComplexityScore
    intent_plan: IntentPlan
    warnings: List[str] = field(default_factory=list)


class WebPrinterPipeline:
    """负责串联输入解析、采集、意图规划、复杂度分析和代码输出。"""

    def __init__(self, config: Config):
        self.config = config
        self.input_parser = InputParser()
        self.extractor = PageExtractor(headless=config.headless)
        self.complexity_analyzer = ComplexityAnalyzer()
        self.intent_planner = IntentPlanner(
            openai_api_key=config.openai_api_key,
            openai_base_url=config.openai_base_url,
            model=config.model,
            enabled=config.use_langchain,
        )
        self.generator = ArtifactGenerator(
            api_key=config.openai_api_key,
            base_url=config.openai_base_url,
            model=config.model,
            max_tokens=config.max_tokens,
        )

    def run(
        self,
        intent: str,
        inputs: List[str],
        output_path: Optional[str] = None,
        wait_time: Optional[int] = None,
    ) -> PipelineResult:
        """运行端到端流程。"""
        print(f"\n{'='*60}")
        print(f"Web Printer Pipeline 开始执行")
        print(f"{'='*60}")
        print(f"Intent: {intent}")
        print(f"Inputs: {inputs}")
        print(f"Output Path: {output_path}")
        print(f"{'='*60}\n")

        parsed = self.input_parser.parse(intent=intent, inputs=inputs)
        print(f"\n[STEP 1] 输入解析完成:")
        print(f"  - Items: {len(parsed.items)}")
        print(f"  - Types: {[item.type for item in parsed.items]}")
        print(f"  - Warnings: {len(parsed.warnings)}")
        extraction = self.extractor.extract_from_parsed_input(
            parsed_input=parsed,
            wait_time=wait_time or self.config.default_wait_time,
        )

        if not extraction.pages and not extraction.screenshots:
            raise RuntimeError("未提取到有效内容，请至少提供可访问 URL、可解析 MHTML 或截图")

        print(f"\n[STEP 2] 页面采集完成:")
        print(f"  - Pages: {len(extraction.pages)}")
        print(f"  - Screenshots: {len(extraction.screenshots)}")
        print(f"  - Warnings: {len(extraction.warnings)}")

        merged_page_info = self._merge_pages_for_complexity(extraction)
        base_complexity = self.complexity_analyzer.analyze(merged_page_info)

        print(f"\n[STEP 3] 复杂度分析:")
        print(f"  - Total: {base_complexity.total}")
        print(f"  - Components: {base_complexity.components}")
        print(f"  - Interactions: {base_complexity.interactions}")
        print(f"  - Pages: {base_complexity.pages}")
        print(f"  - Data Flow: {base_complexity.data_flow}")
        print(f"  - Suggested Format: {base_complexity.get_format().value}")

        planner_context = self._build_planner_context(extraction)
        intent_plan = self.intent_planner.plan(intent=intent, extraction_context=planner_context)

        print(f"\n[STEP 4] 意图规划完成:")
        print(f"  - Summary: {intent_plan.summary}")
        print(f"  - Complexity Bias: {intent_plan.complexity_bias}")
        print(f"  - Output Hint: {intent_plan.output_hint}")
        print(f"  - Confidence: {intent_plan.confidence}")

        enhanced_complexity = ComplexityScore(
            total=max(base_complexity.total + intent_plan.complexity_bias, 0),
            components=base_complexity.components,
            interactions=base_complexity.interactions,
            pages=base_complexity.pages,
            data_flow=base_complexity.data_flow,
        )

        output_format = intent_plan.output_hint or enhanced_complexity.get_format()

        print(f"\n[STEP 5] 最终输出格式: {output_format.value}")
        print(f"  - Enhanced Complexity: {enhanced_complexity.total}")

        generation_context = {
            "pages": extraction.pages,
            "screenshots": extraction.screenshots,
            "warnings": extraction.warnings,
        }
        print(f"\n[STEP 6] 开始代码生成...")

        artifacts = self.generator.generate(
            intent=intent,
            extraction_context=generation_context,
            intent_plan=intent_plan,
            output_format=output_format,
        )

        print(f"\n[STEP 7] 代码生成完成:")
        print(f"  - Files Generated: {len(artifacts.files)}")
        print(f"  - File Paths: {list(artifacts.files.keys())}")
        print(f"  - Warnings: {len(artifacts.warnings)}")

        output_root, written_files = self._write_artifacts(
            artifacts=artifacts,
            output_path=output_path,
            output_format=output_format,
        )

        warnings = []
        warnings.extend(parsed.warnings)
        warnings.extend(extraction.warnings)
        warnings.extend(artifacts.warnings)

        self._write_report(
            output_root=output_root,
            output_format=output_format,
            complexity=enhanced_complexity,
            intent_plan=intent_plan,
            warnings=warnings,
            files=written_files,
        )

        print(f"\n[STEP 8] 文件写入完成:")
        print(f"  - Output Root: {output_root}")
        print(f"  - Written Files: {len(written_files)}")
        print(f"\n{'='*60}")
        print(f"Pipeline 执行完成")
        print(f"{'='*60}\n")

        return PipelineResult(
            success=True,
            output_format=output_format,
            output_path=output_root,
            written_files=written_files,
            complexity=enhanced_complexity,
            intent_plan=intent_plan,
            warnings=warnings,
        )

    @staticmethod
    def _merge_pages_for_complexity(extraction: ExtractionResult) -> Dict[str, Any]:
        merged: Dict[str, Any] = {
            "headings": [],
            "buttons": [],
            "images": [],
            "links": [],
            "text_content": "",
            "visual_summary": {"top_blocks": []},
        }

        for page in extraction.pages:
            merged["headings"].extend(page.get("headings", []))
            merged["buttons"].extend(page.get("buttons", []))
            merged["images"].extend(page.get("images", []))
            merged["links"].extend(page.get("links", []))
            merged["text_content"] += " " + page.get("text_content", "")

            visual = page.get("visual_summary", {})
            merged["visual_summary"]["top_blocks"].extend(visual.get("top_blocks", []))

        return merged

    @staticmethod
    def _build_planner_context(extraction: ExtractionResult) -> Dict[str, Any]:
        return {
            "pages": [
                {
                    "source": page.get("source"),
                    "title": page.get("title"),
                    "structure": page.get("structure"),
                    "headings": page.get("headings", [])[:12],
                    "buttons": page.get("buttons", [])[:12],
                    "links": page.get("links", [])[:20],
                    "has_visual_summary": bool(page.get("visual_summary")),
                }
                for page in extraction.pages
            ],
            "screenshots": [
                {
                    "filename": shot.get("filename"),
                    "mime_type": shot.get("mime_type"),
                    "source": shot.get("source"),
                }
                for shot in extraction.screenshots
            ],
            "warnings": extraction.warnings,
        }

    def _write_artifacts(
        self,
        artifacts: GenerationArtifact,
        output_path: Optional[str],
        output_format: OutputFormat,
    ) -> Tuple[str, List[str]]:
        files = artifacts.files
        written_files: List[str] = []

        if output_path and output_path.lower().endswith(".html") and output_format == OutputFormat.SINGLE_HTML:
            target = Path(output_path)
            target.parent.mkdir(parents=True, exist_ok=True)

            html_path = next(
                (path for path in files.keys() if path.lower().endswith(".html")),
                "index.html",
            )
            target.write_text(files[html_path], encoding="utf-8")
            written_files.append(str(target))
            return str(target), written_files

        root = Path(output_path) if output_path else self._default_output_dir(output_format)
        root.mkdir(parents=True, exist_ok=True)

        for relative_path, content in files.items():
            file_path = root / relative_path
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content, encoding="utf-8")
            written_files.append(str(file_path))

        return str(root), written_files

    def _default_output_dir(self, output_format: OutputFormat) -> Path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        folder_name = f"{output_format.value}_{timestamp}"
        return Path(self.config.output_dir) / folder_name

    @staticmethod
    def _write_report(
        output_root: str,
        output_format: OutputFormat,
        complexity: ComplexityScore,
        intent_plan: IntentPlan,
        warnings: List[str],
        files: List[str],
    ) -> None:
        report_path = Path(output_root)
        if report_path.suffix:
            report_path = report_path.parent / "run_report.json"
        else:
            report_path = report_path / "run_report.json"

        report = {
            "output_format": output_format.value,
            "complexity": {
                "total": complexity.total,
                "components": complexity.components,
                "interactions": complexity.interactions,
                "pages": complexity.pages,
                "data_flow": complexity.data_flow,
            },
            "intent_plan": {
                "summary": intent_plan.summary,
                "ui_requirements": intent_plan.ui_requirements,
                "technical_requirements": intent_plan.technical_requirements,
                "complexity_bias": intent_plan.complexity_bias,
                "output_hint": intent_plan.output_hint.value if intent_plan.output_hint else None,
                "confidence": intent_plan.confidence,
            },
            "warnings": warnings,
            "files": files,
            "generated_at": datetime.now().isoformat(),
        }

        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
