"""统一日志管理器。"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional


class SessionLogger:
    """会话级日志记录器，每次运行创建独立的时间戳文件夹。"""

    def __init__(self, base_log_dir: str = "log"):
        self.base_log_dir = Path(base_log_dir)
        self.session_dir: Optional[Path] = None
        self.session_id: Optional[str] = None

    def init_session(self) -> str:
        """初始化会话日志目录。"""
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.session_dir = self.base_log_dir / self.session_id
        self.session_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n[LOG] 会话日志目录: {self.session_dir}")
        return str(self.session_dir)

    def log_api_call(
        self,
        agent_type: str,
        model: str,
        base_url: str,
        prompt: str,
        response: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """记录 API 调用详情。"""
        if not self.session_dir:
            self.init_session()

        timestamp = datetime.now().strftime("%H%M%S")
        log_file = self.session_dir / f"{timestamp}_{agent_type}.txt"

        with open(log_file, "w", encoding="utf-8") as f:
            f.write("=" * 80 + "\n")
            f.write(f"Agent Type: {agent_type}\n")
            f.write(f"Timestamp: {datetime.now().isoformat()}\n")
            f.write(f"Model: {model}\n")
            f.write(f"Base URL: {base_url}\n")
            if metadata:
                f.write(f"Metadata: {json.dumps(metadata, ensure_ascii=False, indent=2)}\n")
            f.write("=" * 80 + "\n\n")

            f.write("-" * 80 + "\n")
            f.write("INPUT (Prompt):\n")
            f.write("-" * 80 + "\n\n")
            f.write(prompt)
            f.write("\n\n")

            f.write("-" * 80 + "\n")
            f.write("OUTPUT (Response):\n")
            f.write("-" * 80 + "\n\n")
            f.write(response)
            f.write("\n")

        print(f"[LOG] API 调用已记录: {log_file.name}")

    def log_extraction(self, extraction_data: Dict[str, Any]) -> None:
        """记录页面采集结果。"""
        if not self.session_dir:
            self.init_session()

        log_file = self.session_dir / "extraction.json"
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(extraction_data, f, ensure_ascii=False, indent=2)

        print(f"[LOG] 采集结果已记录: {log_file.name}")

    def log_complexity(self, complexity_data: Dict[str, Any]) -> None:
        """记录复杂度分析结果。"""
        if not self.session_dir:
            self.init_session()

        log_file = self.session_dir / "complexity.json"
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(complexity_data, f, ensure_ascii=False, indent=2)

        print(f"[LOG] 复杂度分析已记录: {log_file.name}")

    def log_session_summary(self, summary: Dict[str, Any]) -> None:
        """记录会话摘要。"""
        if not self.session_dir:
            self.init_session()

        log_file = self.session_dir / "session_summary.json"
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

        print(f"[LOG] 会话摘要已记录: {log_file.name}")

    def save_screenshot(self, screenshot_bytes: bytes, filename: str) -> str:
        """保存截图到会话目录。"""
        if not self.session_dir:
            self.init_session()

        screenshots_dir = self.session_dir / "screenshots"
        screenshots_dir.mkdir(exist_ok=True)

        screenshot_path = screenshots_dir / filename
        with open(screenshot_path, "wb") as f:
            f.write(screenshot_bytes)

        return str(screenshot_path)


# 全局单例
_global_logger: Optional[SessionLogger] = None


def get_logger(base_log_dir: str = "log") -> SessionLogger:
    """获取全局日志记录器实例。"""
    global _global_logger
    if _global_logger is None:
        _global_logger = SessionLogger(base_log_dir)
    return _global_logger
