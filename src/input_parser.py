"""多模态输入解析器"""

import mimetypes
from dataclasses import dataclass, field
from email import policy
from email.parser import BytesParser
from pathlib import Path
from typing import List, Optional, Union
from urllib.parse import urlparse


@dataclass
class InputItem:
    """输入项"""

    type: str  # "url", "screenshot", "mhtml"
    content: Union[str, bytes]
    metadata: dict
    source: str


@dataclass
class ParsedInput:
    """解析后的输入"""

    intent: str
    items: List[InputItem]
    warnings: List[str] = field(default_factory=list)

    def has_urls(self) -> bool:
        return any(item.type == "url" for item in self.items)

    def has_screenshots(self) -> bool:
        return any(item.type == "screenshot" for item in self.items)

    def has_mhtml(self) -> bool:
        return any(item.type == "mhtml" for item in self.items)


class InputParser:
    """输入解析器"""

    @staticmethod
    def is_url(text: str) -> bool:
        """判断是否为 URL"""
        try:
            result = urlparse(text)
            return all([result.scheme in ("http", "https"), result.netloc])
        except Exception:
            return False

    @staticmethod
    def is_image_file(path: str) -> bool:
        """判断是否为图片文件"""
        mime_type, _ = mimetypes.guess_type(path)
        return bool(mime_type and mime_type.startswith("image/"))

    @staticmethod
    def is_mhtml_file(path: str) -> bool:
        """判断是否为 MHTML 文件"""
        return path.lower().endswith((".mhtml", ".mht"))

    def parse(self, intent: str, inputs: List[str]) -> ParsedInput:
        """解析输入列表。"""
        normalized_intent = (intent or "").strip()
        if not normalized_intent:
            raise ValueError("intent 不能为空")

        if not inputs:
            raise ValueError("至少提供一个输入（URL/截图/MHTML）")

        items: List[InputItem] = []
        warnings: List[str] = []

        for raw_input in inputs:
            inp = (raw_input or "").strip()
            if not inp:
                continue

            if self.is_url(inp):
                items.append(
                    InputItem(
                        type="url",
                        content=inp,
                        metadata={"url": inp},
                        source=inp,
                    )
                )
                continue

            path = Path(inp)
            if not path.exists():
                warnings.append(f"输入不存在，已跳过: {inp}")
                continue

            if self.is_image_file(str(path)):
                with open(path, "rb") as file:
                    content = file.read()
                items.append(
                    InputItem(
                        type="screenshot",
                        content=content,
                        metadata={
                            "filename": path.name,
                            "path": str(path),
                            "mime_type": mimetypes.guess_type(str(path))[0] or "image/png",
                        },
                        source=str(path),
                    )
                )
                continue

            if self.is_mhtml_file(str(path)):
                with open(path, "rb") as file:
                    raw_bytes = file.read()
                try:
                    content = raw_bytes.decode("utf-8")
                except UnicodeDecodeError:
                    content = raw_bytes.decode("latin-1", errors="ignore")

                items.append(
                    InputItem(
                        type="mhtml",
                        content=content,
                        metadata={"filename": path.name, "path": str(path)},
                        source=str(path),
                    )
                )
                continue

            warnings.append(f"暂不支持该文件类型，已跳过: {inp}")

        return ParsedInput(intent=normalized_intent, items=items, warnings=warnings)

    @staticmethod
    def extract_html_from_mhtml(mhtml_content: str) -> Optional[str]:
        """从 MHTML 提取 HTML。"""
        try:
            message = BytesParser(policy=policy.default).parsebytes(
                mhtml_content.encode("utf-8", errors="ignore")
            )

            if message.is_multipart():
                for part in message.walk():
                    if part.get_content_type() != "text/html":
                        continue
                    payload = part.get_payload(decode=True)
                    if payload is None:
                        continue
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace")
            elif message.get_content_type() == "text/html":
                payload = message.get_payload(decode=True)
                if payload is None:
                    return None
                charset = message.get_content_charset() or "utf-8"
                return payload.decode(charset, errors="replace")
        except Exception:
            pass

        try:
            marker = "Content-Type: text/html"
            lower_content = mhtml_content.lower()
            marker_index = lower_content.find(marker.lower())
            if marker_index < 0:
                return None

            chunk = mhtml_content[marker_index:]
            html_start = chunk.find("\n\n")
            if html_start < 0:
                html_start = chunk.find("\r\n\r\n")
            if html_start < 0:
                return None

            html_body = chunk[html_start:].strip()
            boundary_index = html_body.find("\n--")
            if boundary_index > 0:
                html_body = html_body[:boundary_index]
            return html_body.strip() or None
        except Exception:
            return None
