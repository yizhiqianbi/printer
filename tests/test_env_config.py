import os
import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

from tools.remix_harness_server import resolve_api_key


CONFIG_PATH = Path(__file__).resolve().parents[1] / "src" / "config.py"
spec = importlib.util.spec_from_file_location("printer_config", CONFIG_PATH)
printer_config = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(printer_config)
Config = printer_config.Config


class EnvConfigTest(unittest.TestCase):
    def test_config_accepts_open_router_api_alias(self):
        with patch.dict(os.environ, {"OPEN_ROUTER_API": "or-test-key"}, clear=True):
            config = Config.from_env()

        self.assertEqual(config.openai_api_key, "or-test-key")
        self.assertEqual(config.openai_base_url, "https://openrouter.ai/api/v1")
        self.assertEqual(config.model, "moonshotai/kimi-k2.6")

    def test_remix_key_resolution_prefers_specific_then_requested_provider(self):
        with patch.dict(
            os.environ,
            {
                "OPEN_ROUTER_API": "or-test-key",
                "OPENAI_API_KEY": "standard-key",
                "OPENAI_REMIX_API_KEY": "remix-key",
            },
            clear=True,
        ):
            self.assertEqual(resolve_api_key("OPENAI_REMIX_API_KEY"), "remix-key")

        with patch.dict(os.environ, {"OPEN_ROUTER_API": "or-test-key", "OPENAI_API_KEY": "standard-key"}, clear=True):
            self.assertEqual(resolve_api_key("OPENAI_REMIX_API_KEY"), "standard-key")
            self.assertEqual(resolve_api_key("OPENAI_REMIX_API_KEY", prefer_openrouter=True), "or-test-key")

        with patch.dict(os.environ, {"OPEN_ROUTER_API": "or-test-key"}, clear=True):
            self.assertEqual(resolve_api_key("OPENAI_REMIX_API_KEY"), "or-test-key")

    def test_config_prefers_open_router_api_when_base_url_is_openrouter(self):
        with patch.dict(
            os.environ,
            {
                "OPENAI_API_KEY": "standard-key",
                "OPEN_ROUTER_API": "or-test-key",
                "OPENAI_BASE_URL": "https://openrouter.ai/api/v1",
            },
            clear=True,
        ):
            config = Config.from_env()

        self.assertEqual(config.openai_api_key, "or-test-key")


if __name__ == "__main__":
    unittest.main()
