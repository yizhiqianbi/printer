"""Web Printer - 智能网页复印工具"""

__version__ = "0.2.0"

from .config import Config
from .pipeline import PipelineResult, WebPrinterPipeline

__all__ = ["Config", "WebPrinterPipeline", "PipelineResult"]
