#!/usr/bin/env python3
"""Local Remix Harness for the fake game library."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import tempfile
import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

load_dotenv()


REQUIRED_AGENT_FIELDS = {
    "one_liner": "",
    "core_loop": "",
    "controls": "",
    "mechanics": [],
    "visual_language": "",
    "state_model": "",
    "share_hook": "",
    "known_constraints": ["离线单文件", "移动竖屏", "无外链"],
    "next_evolution_hooks": [],
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def resolve_api_key(specific_key: Optional[str] = None, prefer_openrouter: bool = False) -> Optional[str]:
    if specific_key and os.environ.get(specific_key):
        return os.environ.get(specific_key)
    openrouter_key = os.environ.get("OPEN_ROUTER_API") or os.environ.get("OPENROUTER_API_KEY")
    standard_key = os.environ.get("OPENAI_API_KEY")
    return (openrouter_key or standard_key) if prefer_openrouter else (standard_key or openrouter_key)


def using_openrouter_alias() -> bool:
    return bool(os.environ.get("OPEN_ROUTER_API") or os.environ.get("OPENROUTER_API_KEY"))


def resolve_base_url(specific_key: Optional[str] = None) -> str:
    if specific_key and os.environ.get(specific_key):
        return os.environ[specific_key]
    if os.environ.get("OPENAI_BASE_URL"):
        return os.environ["OPENAI_BASE_URL"]
    if using_openrouter_alias():
        return "https://openrouter.ai/api/v1"
    return "https://api.openai.com/v1"


def sanitize_slug(value: str) -> str:
    raw = (value or "").strip().lower()
    if "/" in raw or "\\" in raw or ".." in raw:
        raise ValueError("slug cannot contain path separators or '..'")
    slug = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    if not slug:
        raise ValueError("slug cannot be empty")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise ValueError("slug may only contain lowercase letters, numbers, and dashes")
    return slug


def safe_child(root: Path, relative_path: str) -> Path:
    if "/" in relative_path or "\\" in relative_path or ".." in relative_path:
        raise ValueError(f"unsafe path: {relative_path}")
    target = (root / relative_path).resolve()
    root_resolved = root.resolve()
    if root_resolved != target and root_resolved not in target.parents:
        raise ValueError(f"path escapes output root: {relative_path}")
    return target


def load_json(path: Path, default: Dict[str, Any]) -> Dict[str, Any]:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def write_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def normalize_agent_description(value: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    data = dict(REQUIRED_AGENT_FIELDS)
    if isinstance(value, dict):
        for key in REQUIRED_AGENT_FIELDS:
            if key in value:
                data[key] = value[key]
    for list_key in ("mechanics", "known_constraints", "next_evolution_hooks"):
        if not isinstance(data[list_key], list):
            data[list_key] = [str(data[list_key])]
    return data


def safe_manifest_color(value: Any, default: str = "#ffcf33") -> str:
    text = str(value or "").strip()
    if re.fullmatch(r"#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?", text):
        return text
    return default


def safe_manifest_text(value: Any, default: str, limit: int = 12) -> str:
    text = str(value or "").strip()
    if not text:
        return default
    return text[:limit]


def extract_artifact_metadata(html: str) -> Dict[str, Any]:
    match = re.search(r"window\.__PRINTER_ARTIFACT__\s*=\s*(\{.*?\});", html, re.DOTALL)
    if not match:
        return {}
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return {}


def parse_model_json(text: str) -> Dict[str, Any]:
    stripped = text.strip()
    fenced = re.search(r"```json\s*(.*?)```", stripped, re.DOTALL)
    if fenced:
        stripped = fenced.group(1).strip()
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    start = stripped.find("{")
    if start < 0:
        raise ValueError("model response did not contain JSON")

    depth = 0
    in_string = False
    escape_next = False
    for index in range(start, len(stripped)):
        char = stripped[index]
        if escape_next:
            escape_next = False
            continue
        if char == "\\":
            escape_next = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return json.loads(stripped[start : index + 1])
    raise ValueError("model response JSON was incomplete")


def parse_model_payload(text: str) -> Dict[str, Any]:
    raw = text.strip()
    meta_match = re.search(r"<(?:remix|fake)_meta>\s*(\{.*?\})\s*</(?:remix|fake)_meta>", raw, re.DOTALL)
    html_start = raw.find("<!DOCTYPE html>")
    if meta_match and html_start >= 0:
        try:
            meta = json.loads(meta_match.group(1))
        except json.JSONDecodeError as exc:
            raise ValueError("model response remix metadata was invalid JSON") from exc
        html = raw[html_start:].strip()
        payload = {
            "title": meta.get("title", "Remix"),
            "slug_suggestion": meta.get("slug_suggestion") or meta.get("slug") or meta.get("title", "remix"),
            "html": html,
            "agent_description": meta.get("agent_description", {}),
        }
        for optional_key in ("kind", "accent", "glyph", "summary"):
            if optional_key in meta:
                payload[optional_key] = meta[optional_key]
        return payload

    try:
        return parse_model_json(text)
    except ValueError as json_error:
        raise json_error


def validate_remix_html(html: str) -> None:
    checks = {
        "doctype": "<!DOCTYPE html>",
        "viewport": '<meta name="viewport"',
        "artifact marker": 'data-printer-artifact="fake-game-library"',
        "phone shell": 'class="phone-shell"',
        "artifact metadata": "window.__PRINTER_ARTIFACT__",
        "render function": "window.render_game_to_text",
        "advance function": "window.advanceTime",
    }
    missing = [label for label, needle in checks.items() if needle not in html]
    for metadata_field in ("parent_file", "remix_prompt", "agent_description_file"):
        if metadata_field not in html:
            missing.append(f"metadata {metadata_field}")
    if missing:
        raise ValueError("generated HTML missing required contract: " + ", ".join(missing))
    if re.search(r"https?://", html, re.I):
        raise ValueError("generated HTML must not contain external URLs")


@dataclass
class RemixContext:
    source_file: str
    source_html: str
    source_metadata: Dict[str, Any]
    parent_description: Dict[str, Any]
    prompt_text: str
    voice_transcript: str
    screenshot_png: Optional[bytes]


@dataclass
class FakeGameContext:
    prompt_text: str
    voice_transcript: str
    library_summary: List[Dict[str, Any]]


class OpenAIRemixGenerator:
    def __init__(self) -> None:
        from openai import OpenAI

        base_url = resolve_base_url("OPENAI_REMIX_BASE_URL")
        default_headers = {}
        if "openrouter.ai" in base_url:
            default_headers = {
                "HTTP-Referer": os.environ.get("OPENROUTER_HTTP_REFERER", "http://127.0.0.1:8787"),
                "X-Title": os.environ.get("OPENROUTER_X_TITLE", "Printer Remix Harness"),
            }
        self.client = OpenAI(
            api_key=resolve_api_key("OPENAI_REMIX_API_KEY", prefer_openrouter="openrouter.ai" in base_url),
            base_url=base_url,
            default_headers=default_headers or None,
        )
        self.model = os.environ.get("OPENAI_REMIX_MODEL") or os.environ.get("OPENAI_MODEL") or (
            "moonshotai/kimi-k2.6" if "openrouter.ai" in base_url else "gpt-4o"
        )
        self.source_chars = int(os.environ.get("OPENAI_REMIX_SOURCE_CHARS", "26000"))
        self.temperature = float(os.environ.get("OPENAI_REMIX_TEMPERATURE", "0.45"))

    def generate_remix(self, context: RemixContext) -> Dict[str, Any]:
        source_excerpt = context.source_html[: self.source_chars]
        parent_json = json.dumps(context.parent_description, ensure_ascii=False, indent=2)
        metadata_json = json.dumps(context.source_metadata, ensure_ascii=False, indent=2)
        prompt = f"""你是一个浏览器小游戏 remix agent。请基于源游戏生成一个新的单文件 HTML remix。

硬性要求:
- 优先输出 `<remix_meta>...</remix_meta>` 加 raw HTML，不要 markdown，不要解释。
- remix_meta 内是 JSON，字段: title, slug_suggestion, agent_description。
- remix_meta 后直接输出完整 HTML；不要把 HTML 放进 JSON 字符串。
- 如果你无法使用 remix_meta 格式，也可以输出 JSON 对象，字段: title, slug_suggestion, html, agent_description。
- html 必须是完整单文件 HTML，包含 <!DOCTYPE html>。
- html 必须自包含 CSS/JS，无 CDN、无外链、无复制商标素材。
- html 必须保留 data-printer-artifact="fake-game-library"。
- html 必须包含 class="phone-shell"。
- html 必须设置 window.__PRINTER_ARTIFACT__，其中包含 parent_file、remix_prompt、agent_description_file。
- html 必须暴露 window.render_game_to_text() 和 window.advanceTime(ms)。
- 不要只改标题或颜色；至少改变一个玩法机制、一个视觉节奏点、一个分享钩子。
- 保持移动竖屏优先。
- 为了避免生成慢和响应截断，HTML 尽量控制在 18KB 到 32KB，优先实现一个清晰可玩的核心循环。

agent_description 必须包含:
one_liner, core_loop, controls, mechanics, visual_language, state_model, share_hook, known_constraints, next_evolution_hooks。

输出格式示例:
<remix_meta>{{"title":"短标题","slug_suggestion":"short-slug","agent_description":{{"one_liner":"一句话", "core_loop":"...", "controls":"...", "mechanics":["..."], "visual_language":"...", "state_model":"...", "share_hook":"...", "known_constraints":["离线单文件","移动竖屏","无外链"], "next_evolution_hooks":["..."]}}}}</remix_meta>
<!DOCTYPE html>
<html lang="zh-CN">...</html>

用户文本 prompt:
{context.prompt_text}

用户语音转录:
{context.voice_transcript}

源文件:
{context.source_file}

源 metadata:
{metadata_json}

父版本 agent description:
{parent_json}

源 HTML:
{source_excerpt}
"""
        content_parts: List[Dict[str, Any]] = [{"type": "text", "text": prompt}]
        if context.screenshot_png:
            import base64

            data_url = "data:image/png;base64," + base64.b64encode(context.screenshot_png).decode("ascii")
            content_parts.append({"type": "image_url", "image_url": {"url": data_url}})

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": content_parts}],
            temperature=self.temperature,
            max_tokens=int(os.environ.get("OPENAI_REMIX_MAX_TOKENS", "20000")),
        )
        raw = response.choices[0].message.content or ""
        return parse_model_payload(raw)


class OpenAIFakeGameGenerator(OpenAIRemixGenerator):
    def generate_fake_game(self, context: FakeGameContext) -> Dict[str, Any]:
        library_json = json.dumps(context.library_summary[:24], ensure_ascii=False, indent=2)
        prompt = f"""你是一个浏览器小游戏 fake-game agent。请从零生成一款新的单文件 HTML 竖屏小游戏，不要基于任何现有源文件 remix。

硬性要求:
- 优先输出 `<fake_meta>...</fake_meta>` 加 raw HTML，不要 markdown，不要解释。
- fake_meta 内是 JSON，字段: title, slug_suggestion, kind, accent, glyph, agent_description。
- fake_meta 后直接输出完整 HTML；不要把 HTML 放进 JSON 字符串。
- 如果你无法使用 fake_meta 格式，也可以输出 JSON 对象，字段: title, slug_suggestion, html, kind, accent, glyph, agent_description。
- html 必须是完整单文件 HTML，包含 <!DOCTYPE html>。
- html 必须自包含 CSS/JS，无 CDN、无外链、无复制商标素材。
- html 必须保留 data-printer-artifact="fake-game-library"。
- html 必须包含 class="phone-shell"。
- html 必须设置 window.__PRINTER_ARTIFACT__。
- html 必须暴露 window.render_game_to_text() 和 window.advanceTime(ms)。
- 游戏必须有一个清晰可玩的核心循环，适合手机竖屏，优先 20-60 秒短局。
- 为了避免生成慢和响应截断，HTML 尽量控制在 18KB 到 32KB。

agent_description 必须包含:
one_liner, core_loop, controls, mechanics, visual_language, state_model, share_hook, known_constraints, next_evolution_hooks。

输出格式示例:
<fake_meta>{{"title":"短标题","slug_suggestion":"short-fake-game","kind":"Fake","accent":"#ffcf33","glyph":"造","agent_description":{{"one_liner":"一句话", "core_loop":"...", "controls":"...", "mechanics":["..."], "visual_language":"...", "state_model":"...", "share_hook":"...", "known_constraints":["离线单文件","移动竖屏","无外链"], "next_evolution_hooks":["..."]}}}}</fake_meta>
<!DOCTYPE html>
<html lang="zh-CN">...</html>

用户文本 prompt:
{context.prompt_text}

用户语音转录:
{context.voice_transcript}

当前赝品库参考，不要重复这些已有题材和玩法:
{library_json}
"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}],
            temperature=self.temperature,
            max_tokens=int(os.environ.get("OPENAI_REMIX_MAX_TOKENS", "20000")),
        )
        raw = response.choices[0].message.content or ""
        return parse_model_payload(raw)


class OpenAITranscriber:
    def __init__(self) -> None:
        from openai import OpenAI

        base_url = os.environ.get("OPENAI_TRANSCRIBE_BASE_URL") or resolve_base_url()
        self.client = OpenAI(
            api_key=resolve_api_key("OPENAI_TRANSCRIBE_API_KEY", prefer_openrouter="openrouter.ai" in base_url),
            base_url=base_url,
        )
        self.model = os.environ.get("OPENAI_TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe")

    def transcribe(self, file_path: Path) -> str:
        with file_path.open("rb") as audio_file:
            response = self.client.audio.transcriptions.create(model=self.model, file=audio_file)
        return getattr(response, "text", str(response))


class SeleniumScreenshotProvider:
    def __call__(self, html_path: Path) -> Optional[bytes]:
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options

            options = Options()
            options.add_argument("--headless=new")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=430,760")
            driver = webdriver.Chrome(options=options)
            try:
                driver.get(html_path.resolve().as_uri())
                driver.implicitly_wait(1)
                return driver.get_screenshot_as_png()
            finally:
                driver.quit()
        except Exception:
            return None


class RemixHarness:
    def __init__(
        self,
        output_dir: Path,
        generator: Optional[Any] = None,
        fake_generator: Optional[Any] = None,
        transcriber: Optional[Any] = None,
        screenshot_provider: Optional[Callable[[Path], Optional[bytes]]] = None,
    ) -> None:
        self.output_dir = output_dir.resolve()
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.drafts_dir = self.output_dir / ".remix_drafts"
        self.drafts_dir.mkdir(parents=True, exist_ok=True)
        self.generator = generator
        self.fake_generator = fake_generator
        self.transcriber = transcriber
        self.screenshot_provider = screenshot_provider

    @property
    def manifest_path(self) -> Path:
        return self.output_dir / "remix_manifest.json"

    @property
    def manifest_js_path(self) -> Path:
        return self.output_dir / "remix_manifest.js"

    def list_sources(self) -> Dict[str, Any]:
        base_manifest = load_json(self.output_dir / "fake_manifest.json", {"games": []})
        remix_manifest = self._load_remix_manifest()
        sources = []
        for game in base_manifest.get("games", []):
            item = dict(game)
            item["type"] = "base"
            sources.append(item)
        for remix in remix_manifest.get("remixes", []):
            item = dict(remix)
            item["type"] = "remix"
            sources.append(item)
        return {"sources": sources, "remix_manifest": remix_manifest}

    def transcribe_audio(self, upload: UploadFile) -> str:
        suffix = Path(upload.filename or "audio.webm").suffix or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            shutil.copyfileobj(upload.file, temp)
            temp_path = Path(temp.name)
        try:
            transcriber = self.transcriber or OpenAITranscriber()
            return transcriber.transcribe(temp_path)
        finally:
            temp_path.unlink(missing_ok=True)

    def create_draft(
        self,
        source_file: str,
        prompt_text: str,
        voice_transcript: str,
        progress: Optional[Callable[[int, str], None]] = None,
    ) -> Dict[str, Any]:
        def report(percent: int, message: str) -> None:
            if progress:
                progress(percent, message)

        report(8, "读取源游戏文件...")
        source_path = safe_child(self.output_dir, source_file)
        if not source_path.exists() or source_path.suffix.lower() != ".html":
            raise FileNotFoundError(f"source HTML not found: {source_file}")
        source_html = source_path.read_text(encoding="utf-8")
        report(18, "提取源游戏上下文...")
        source_metadata = extract_artifact_metadata(source_html)
        parent_description = self._load_parent_description(source_file, source_metadata)
        report(28, "准备 Remix 输入...")
        screenshot_png = self.screenshot_provider(source_path) if self.screenshot_provider else None
        context = RemixContext(
            source_file=source_file,
            source_html=source_html,
            source_metadata=source_metadata,
            parent_description=parent_description,
            prompt_text=prompt_text,
            voice_transcript=voice_transcript,
            screenshot_png=screenshot_png,
        )
        generator = self.generator or OpenAIRemixGenerator()
        report(42, "调用模型生成单文件 HTML...")
        generated = generator.generate_remix(context)
        report(76, "检查模型输出...")
        html = str(generated.get("html", ""))
        title = str(generated.get("title") or self._fallback_title(source_metadata))
        slug_suggestion = sanitize_slug(str(generated.get("slug_suggestion") or title))
        html = self._patch_published_artifact_metadata(
            html=html,
            source_file=source_file,
            prompt_text=prompt_text,
            description_file=f"{slug_suggestion}.remix.json",
        )
        validate_remix_html(html)
        report(88, "写入草稿预览...")
        agent_description = normalize_agent_description(generated.get("agent_description"))
        draft_id = "draft-" + datetime.now().strftime("%Y%m%d%H%M%S") + "-" + uuid.uuid4().hex[:8]
        draft_dir = self._safe_draft_dir(draft_id)
        draft_dir.mkdir(parents=True, exist_ok=False)
        (draft_dir / "index.html").write_text(html, encoding="utf-8")
        draft_meta = {
            "draft_id": draft_id,
            "source_file": source_file,
            "source_metadata": source_metadata,
            "parent_description": parent_description,
            "prompt": {"text": prompt_text, "voice_transcript": voice_transcript},
            "title": title,
            "slug_suggestion": slug_suggestion,
            "agent_description": agent_description,
            "created_at": utc_now(),
        }
        write_json(draft_dir / "draft.remix.json", draft_meta)
        report(100, "草稿预览已准备好。")
        return {
            "draft_id": draft_id,
            "preview_url": f"/.remix_drafts/{draft_id}/index.html",
            "title": title,
            "slug_suggestion": slug_suggestion,
            "agent_description": agent_description,
        }

    def create_fake_draft(
        self,
        prompt_text: str,
        voice_transcript: str,
        progress: Optional[Callable[[int, str], None]] = None,
    ) -> Dict[str, Any]:
        def report(percent: int, message: str) -> None:
            if progress:
                progress(percent, message)

        if not (prompt_text or voice_transcript).strip():
            raise ValueError("prompt_text or voice_transcript is required")

        report(10, "读取赝品库上下文...")
        base_manifest = load_json(self.output_dir / "fake_manifest.json", {"games": []})
        remix_manifest = self._load_remix_manifest()
        library_summary = [
            {
                "title": item.get("title"),
                "kind": item.get("kind"),
                "summary": item.get("summary"),
                "source_game": item.get("source_game") or item.get("source_file"),
            }
            for item in [*base_manifest.get("games", []), *remix_manifest.get("remixes", [])]
        ]
        report(28, "准备从零 Fake 输入...")
        generator = self.fake_generator or OpenAIFakeGameGenerator()
        report(42, "调用模型生成新游戏 HTML...")
        generated = generator.generate_fake_game(
            FakeGameContext(
                prompt_text=prompt_text,
                voice_transcript=voice_transcript,
                library_summary=library_summary,
            )
        )
        report(76, "检查模型输出...")
        html = str(generated.get("html", ""))
        title = str(generated.get("title") or "Untitled Fake Game")
        slug_suggestion = sanitize_slug(str(generated.get("slug_suggestion") or title))
        html = self._patch_published_artifact_metadata(
            html=html,
            source_file="__scratch__.html",
            prompt_text=prompt_text,
            description_file=f"{slug_suggestion}.remix.json",
            extra_metadata={"creation_mode": "scratch"},
        )
        validate_remix_html(html)
        report(88, "写入从零草稿预览...")
        agent_description = normalize_agent_description(generated.get("agent_description"))
        draft_id = "draft-" + datetime.now().strftime("%Y%m%d%H%M%S") + "-" + uuid.uuid4().hex[:8]
        draft_dir = self._safe_draft_dir(draft_id)
        draft_dir.mkdir(parents=True, exist_ok=False)
        (draft_dir / "index.html").write_text(html, encoding="utf-8")
        fake_kind = safe_manifest_text(generated.get("kind"), "Fake")
        draft_meta = {
            "draft_id": draft_id,
            "origin": "scratch",
            "source_file": "__scratch__.html",
            "source_metadata": {
                "game": {
                    "id": slug_suggestion,
                    "title": title,
                    "kind": fake_kind,
                    "source_game": "从零 fake 生成",
                    "mobile_portrait": True,
                }
            },
            "parent_description": {
                "schema_version": 1,
                "slug": "scratch",
                "title": "From Scratch",
                "source_file": "__scratch__.html",
                "lineage": ["scratch"],
                "agent_description": agent_description,
            },
            "prompt": {"text": prompt_text, "voice_transcript": voice_transcript},
            "title": title,
            "slug_suggestion": slug_suggestion,
            "agent_description": agent_description,
            "manifest": {
                "kind": fake_kind,
                "accent": safe_manifest_color(generated.get("accent")),
                "glyph": safe_manifest_text(generated.get("glyph"), "造", 2),
                "summary": safe_manifest_text(generated.get("summary"), agent_description.get("one_liner", ""), 120),
            },
            "created_at": utc_now(),
        }
        write_json(draft_dir / "draft.remix.json", draft_meta)
        report(100, "新游戏草稿预览已准备好。")
        return {
            "draft_id": draft_id,
            "preview_url": f"/.remix_drafts/{draft_id}/index.html",
            "title": title,
            "slug_suggestion": slug_suggestion,
            "agent_description": agent_description,
        }

    def publish_draft(
        self,
        draft_id: str,
        slug: str,
        title: str,
        agent_description: Dict[str, Any],
    ) -> Dict[str, Any]:
        draft_dir = self._safe_draft_dir(draft_id)
        html_path = draft_dir / "index.html"
        meta_path = draft_dir / "draft.remix.json"
        if not html_path.exists() or not meta_path.exists():
            raise FileNotFoundError(f"draft not found: {draft_id}")
        cleaned_slug = sanitize_slug(slug)
        target_html = safe_child(self.output_dir, f"{cleaned_slug}.html")
        target_description = safe_child(self.output_dir, f"{cleaned_slug}.remix.json")
        if target_html.exists() or target_description.exists():
            raise FileExistsError(f"remix already exists: {cleaned_slug}")

        manifest = self._load_remix_manifest()
        if any(item.get("slug") == cleaned_slug for item in manifest.get("remixes", [])):
            raise FileExistsError(f"manifest already contains remix: {cleaned_slug}")

        draft_meta = load_json(meta_path, {})
        origin = draft_meta.get("origin", "remix")
        source_file = draft_meta.get("source_file", "")
        parent_slug = "scratch" if origin == "scratch" else self._parent_slug(source_file, draft_meta.get("parent_description", {}))
        parent_lineage = draft_meta.get("parent_description", {}).get("lineage")
        lineage = list(parent_lineage) if isinstance(parent_lineage, list) and parent_lineage else [parent_slug]
        if cleaned_slug not in lineage:
            lineage.append(cleaned_slug)

        html = html_path.read_text(encoding="utf-8")
        html = self._patch_published_artifact_metadata(
            html=html,
            source_file=source_file,
            prompt_text=draft_meta.get("prompt", {}).get("text", ""),
            description_file=f"{cleaned_slug}.remix.json",
            extra_metadata={"creation_mode": "scratch"} if origin == "scratch" else None,
        )
        validate_remix_html(html)
        target_html.write_text(html, encoding="utf-8")
        normalized_description = normalize_agent_description(agent_description)
        manifest_defaults = draft_meta.get("manifest", {}) if isinstance(draft_meta.get("manifest"), dict) else {}
        manifest_kind = safe_manifest_text(manifest_defaults.get("kind"), "Fake" if origin == "scratch" else "Remix")
        manifest_accent = safe_manifest_color(manifest_defaults.get("accent"), "#ffcf33" if origin == "scratch" else "#22f4ee")
        manifest_glyph = safe_manifest_text(manifest_defaults.get("glyph"), "造" if origin == "scratch" else "改", 2)
        description_payload = {
            "schema_version": 1,
            "id": ("fake-" if origin == "scratch" else "remix-") + uuid.uuid4().hex[:12],
            "slug": cleaned_slug,
            "title": title,
            "origin": origin,
            "source_file": source_file,
            "parent_slug": parent_slug,
            "lineage": lineage,
            "created_at": utc_now(),
            "prompt": draft_meta.get("prompt", {"text": "", "voice_transcript": ""}),
            "agent_description": normalized_description,
            "files": {"html": f"{cleaned_slug}.html"},
            "validation": {"static_checked": True, "browser_checked": False, "notes": []},
        }
        write_json(target_description, description_payload)

        manifest_entry = {
            "id": description_payload["id"],
            "slug": cleaned_slug,
            "file": f"{cleaned_slug}.html",
            "description_file": f"{cleaned_slug}.remix.json",
            "title": title,
            "kind": manifest_kind,
            "source_file": source_file,
            "parent_slug": parent_slug,
            "lineage": lineage,
            "summary": manifest_defaults.get("summary") or normalized_description.get("one_liner", ""),
            "accent": manifest_accent,
            "glyph": manifest_glyph,
            "created_at": description_payload["created_at"],
            "agent_description": normalized_description,
            "origin": origin,
        }
        manifest["remixes"].append(manifest_entry)
        self._write_remix_manifest(manifest)
        return {
            "file": f"{cleaned_slug}.html",
            "description_file": f"{cleaned_slug}.remix.json",
            "manifest_entry": manifest_entry,
        }

    def delete_draft(self, draft_id: str) -> Dict[str, Any]:
        draft_dir = self._safe_draft_dir(draft_id)
        if not draft_dir.exists():
            raise FileNotFoundError(f"draft not found: {draft_id}")
        shutil.rmtree(draft_dir)
        return {"deleted": draft_id}

    def _safe_draft_dir(self, draft_id: str) -> Path:
        if not re.fullmatch(r"draft-\d{14}-[a-f0-9]{8}", draft_id or ""):
            raise ValueError("invalid draft id")
        target = (self.drafts_dir / draft_id).resolve()
        drafts_resolved = self.drafts_dir.resolve()
        if drafts_resolved != target and drafts_resolved not in target.parents:
            raise ValueError("draft path escapes drafts root")
        return target

    def _load_remix_manifest(self) -> Dict[str, Any]:
        manifest = load_json(self.manifest_path, {"schema_version": 1, "remixes": []})
        manifest.setdefault("schema_version", 1)
        manifest.setdefault("remixes", [])
        return manifest

    def _write_remix_manifest(self, manifest: Dict[str, Any]) -> None:
        write_json(self.manifest_path, manifest)
        js = "window.__PRINTER_REMIX_MANIFEST__ = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n"
        self.manifest_js_path.write_text(js, encoding="utf-8")

    def _load_parent_description(self, source_file: str, source_metadata: Dict[str, Any]) -> Dict[str, Any]:
        source_path = Path(source_file)
        description_path = self.output_dir / f"{source_path.stem}.remix.json"
        if description_path.exists():
            return load_json(description_path, {})
        game = source_metadata.get("game", {}) if isinstance(source_metadata, dict) else {}
        title = game.get("title") or source_path.stem
        return {
            "schema_version": 1,
            "slug": source_path.stem,
            "title": title,
            "source_file": source_file,
            "lineage": [source_path.stem],
            "agent_description": {
                "one_liner": game.get("source_game", title),
                "core_loop": "Use the existing game loop and remix it according to the prompt.",
                "controls": "Match the current HTML controls.",
                "mechanics": [game.get("kind", "game")],
                "visual_language": "Match the current portrait fake-game library language.",
                "state_model": "Infer state from window.render_game_to_text and source JS.",
                "share_hook": "Produce a visible, shareable result moment.",
                "known_constraints": ["离线单文件", "移动竖屏", "无外链"],
                "next_evolution_hooks": ["change one mechanic", "change one visual rhythm", "change one share hook"],
            },
        }

    @staticmethod
    def _parent_slug(source_file: str, parent_description: Dict[str, Any]) -> str:
        if parent_description.get("slug"):
            return str(parent_description["slug"])
        return Path(source_file).stem

    @staticmethod
    def _fallback_title(source_metadata: Dict[str, Any]) -> str:
        game = source_metadata.get("game", {}) if isinstance(source_metadata, dict) else {}
        return str(game.get("title") or "Untitled Remix") + " · Remix"

    @staticmethod
    def _patch_published_artifact_metadata(
        html: str,
        source_file: str,
        prompt_text: str,
        description_file: str,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        match = re.search(r"(window\.__PRINTER_ARTIFACT__\s*=\s*)(\{.*?\})(;)", html, re.DOTALL)
        if not match:
            return html
        try:
            data = json.loads(match.group(2))
        except json.JSONDecodeError:
            return html
        data["parent_file"] = source_file
        data["remix_prompt"] = prompt_text
        data["agent_description_file"] = description_file
        if extra_metadata:
            data.update(extra_metadata)
        replacement = match.group(1) + json.dumps(data, ensure_ascii=False) + match.group(3)
        return html[: match.start()] + replacement + html[match.end() :]


class DraftRequest(BaseModel):
    source_file: str
    prompt_text: str = ""
    voice_transcript: str = ""


class FakeDraftRequest(BaseModel):
    prompt_text: str = ""
    voice_transcript: str = ""


class PublishRequest(BaseModel):
    draft_id: str
    slug: str
    title: str
    agent_description: Dict[str, Any] = Field(default_factory=dict)


def create_app(harness: RemixHarness) -> FastAPI:
    app = FastAPI(title="Printer Remix Harness")
    draft_jobs: Dict[str, Dict[str, Any]] = {}
    draft_jobs_lock = threading.Lock()

    def update_draft_job(job_id: str, **updates: Any) -> None:
        with draft_jobs_lock:
            job = draft_jobs.setdefault(
                job_id,
                {
                    "job_id": job_id,
                    "status": "queued",
                    "percent": 0,
                    "message": "排队中...",
                    "created_at": utc_now(),
                },
            )
            job.update(updates)
            job["updated_at"] = utc_now()

    def read_draft_job(job_id: str) -> Optional[Dict[str, Any]]:
        with draft_jobs_lock:
            job = draft_jobs.get(job_id)
            return dict(job) if job else None

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/remix/sources")
    def sources() -> Dict[str, Any]:
        return harness.list_sources()

    @app.post("/api/remix/transcribe")
    def transcribe(file: UploadFile = File(...)) -> Dict[str, str]:
        try:
            return {"transcript": harness.transcribe_audio(file)}
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.post("/api/remix/draft")
    def draft(request: DraftRequest) -> Dict[str, Any]:
        try:
            return harness.create_draft(
                source_file=request.source_file,
                prompt_text=request.prompt_text,
                voice_transcript=request.voice_transcript,
            )
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.post("/api/remix/draft-jobs")
    def create_draft_job(request: DraftRequest) -> Dict[str, Any]:
        job_id = "job-" + datetime.now().strftime("%Y%m%d%H%M%S") + "-" + uuid.uuid4().hex[:8]
        update_draft_job(job_id, status="queued", percent=3, message="已加入生成队列...")

        def run_job() -> None:
            def report(percent: int, message: str) -> None:
                update_draft_job(job_id, status="running", percent=percent, message=message)

            try:
                report(5, "开始生成 Remix...")
                draft_result = harness.create_draft(
                    source_file=request.source_file,
                    prompt_text=request.prompt_text,
                    voice_transcript=request.voice_transcript,
                    progress=report,
                )
                update_draft_job(
                    job_id,
                    status="done",
                    percent=100,
                    message="调整完成，取个名字后发布。",
                    draft=draft_result,
                )
            except Exception as exc:
                update_draft_job(
                    job_id,
                    status="error",
                    percent=100,
                    message="生成失败。",
                    error=str(exc),
                )

        threading.Thread(target=run_job, daemon=True).start()
        return read_draft_job(job_id) or {"job_id": job_id, "status": "queued", "percent": 0}

    @app.post("/api/fake/draft")
    def fake_draft(request: FakeDraftRequest) -> Dict[str, Any]:
        try:
            return harness.create_fake_draft(
                prompt_text=request.prompt_text,
                voice_transcript=request.voice_transcript,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.post("/api/fake/draft-jobs")
    def create_fake_draft_job(request: FakeDraftRequest) -> Dict[str, Any]:
        job_id = "fake-job-" + datetime.now().strftime("%Y%m%d%H%M%S") + "-" + uuid.uuid4().hex[:8]
        update_draft_job(job_id, status="queued", percent=3, message="已加入新游戏生成队列...")

        def run_job() -> None:
            def report(percent: int, message: str) -> None:
                update_draft_job(job_id, status="running", percent=percent, message=message)

            try:
                report(5, "开始从零 Fake 一款游戏...")
                draft_result = harness.create_fake_draft(
                    prompt_text=request.prompt_text,
                    voice_transcript=request.voice_transcript,
                    progress=report,
                )
                update_draft_job(
                    job_id,
                    status="done",
                    percent=100,
                    message="新游戏草稿完成，取个名字后发布。",
                    draft=draft_result,
                )
            except Exception as exc:
                update_draft_job(
                    job_id,
                    status="error",
                    percent=100,
                    message="生成失败。",
                    error=str(exc),
                )

        threading.Thread(target=run_job, daemon=True).start()
        return read_draft_job(job_id) or {"job_id": job_id, "status": "queued", "percent": 0}

    @app.get("/api/remix/draft-jobs/{job_id}")
    def draft_job_status(job_id: str) -> Dict[str, Any]:
        job = read_draft_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail=f"draft job not found: {job_id}")
        return job

    @app.get("/api/fake/draft-jobs/{job_id}")
    def fake_draft_job_status(job_id: str) -> Dict[str, Any]:
        job = read_draft_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail=f"draft job not found: {job_id}")
        return job

    @app.post("/api/remix/publish")
    def publish(request: PublishRequest) -> Dict[str, Any]:
        try:
            return harness.publish_draft(
                draft_id=request.draft_id,
                slug=request.slug,
                title=request.title,
                agent_description=request.agent_description,
            )
        except FileExistsError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.delete("/api/remix/draft/{draft_id}")
    def delete_draft(draft_id: str) -> Dict[str, Any]:
        try:
            return harness.delete_draft(draft_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    app.mount("/", StaticFiles(directory=str(harness.output_dir), html=True), name="output")
    return app


def default_output_dir() -> Path:
    return Path(__file__).resolve().parents[1] / "output"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the local Printer Remix Harness server.")
    parser.add_argument("--output-dir", default=str(default_output_dir()), help="Printer output directory")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--screenshots", action="store_true", help="Enable Selenium screenshots for drafts")
    parser.add_argument("--no-screenshots", action="store_true", help="Disable Selenium screenshots for drafts")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    import uvicorn

    screenshot_provider = SeleniumScreenshotProvider() if args.screenshots and not args.no_screenshots else None
    harness = RemixHarness(Path(args.output_dir), screenshot_provider=screenshot_provider)
    uvicorn.run(create_app(harness), host=args.host, port=args.port)


if __name__ == "__main__":
    main()
