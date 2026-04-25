"""配置管理"""

import os
from dataclasses import dataclass
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()


@dataclass
class Config:
    """全局配置"""

    openai_api_key: str
    openai_base_url: str
    model: str = "gpt-4o"
    headless: bool = True
    default_wait_time: int = 5
    max_tokens: int = 16000
    output_dir: str = "output"
    use_langchain: bool = True
    auto_screenshot: bool = True  # 是否自动截图

    @classmethod
    def from_env(cls) -> "Config":
        """从环境变量加载配置"""
        uses_openrouter_alias = bool(os.environ.get("OPEN_ROUTER_API") or os.environ.get("OPENROUTER_API_KEY"))
        base_url = os.environ.get(
            "OPENAI_BASE_URL",
            "https://openrouter.ai/api/v1" if uses_openrouter_alias else "https://api.openai.com/v1",
        )
        openrouter_key = os.environ.get("OPEN_ROUTER_API") or os.environ.get("OPENROUTER_API_KEY")
        standard_key = os.environ.get("OPENAI_API_KEY")
        api_key = (openrouter_key or standard_key) if "openrouter.ai" in base_url else (standard_key or openrouter_key)
        if not api_key:
            raise ValueError("需要设置 OPENAI_API_KEY 或 OPEN_ROUTER_API 环境变量")

        default_model = "moonshotai/kimi-k2.6" if "openrouter.ai" in base_url else "gpt-4o"

        return cls(
            openai_api_key=api_key,
            openai_base_url=base_url,
            model=os.environ.get("OPENAI_MODEL", default_model),
            headless=os.environ.get("HEADLESS", "true").lower() == "true",
            default_wait_time=int(os.environ.get("WAIT_TIME", "5")),
            max_tokens=int(os.environ.get("MAX_TOKENS", "16000")),
            output_dir=os.environ.get("OUTPUT_DIR", "output"),
            use_langchain=os.environ.get("USE_LANGCHAIN", "true").lower() == "true",
            auto_screenshot=os.environ.get("AUTO_SCREENSHOT", "true").lower() == "true",
        )
