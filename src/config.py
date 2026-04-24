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

    @classmethod
    def from_env(cls) -> "Config":
        """从环境变量加载配置"""
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("需要设置 OPENAI_API_KEY 环境变量")

        base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")

        return cls(
            openai_api_key=api_key,
            openai_base_url=base_url,
            model=os.environ.get("OPENAI_MODEL", "gpt-4o"),
            headless=os.environ.get("HEADLESS", "true").lower() == "true",
            default_wait_time=int(os.environ.get("WAIT_TIME", "5")),
            max_tokens=int(os.environ.get("MAX_TOKENS", "16000")),
            output_dir=os.environ.get("OUTPUT_DIR", "output"),
            use_langchain=os.environ.get("USE_LANGCHAIN", "true").lower() == "true",
        )
