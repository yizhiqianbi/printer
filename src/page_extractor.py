"""页面内容采集与摘要提取。"""

import json
import re
import time
from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from .input_parser import InputParser, ParsedInput


@dataclass
class ExtractionResult:
    """采集结果。"""

    pages: List[Dict[str, Any]]
    screenshots: List[Dict[str, Any]]
    warnings: List[str] = field(default_factory=list)


class PageExtractor:
    """从 URL/MHTML/截图构建统一页面上下文。"""

    def __init__(self, headless: bool = True):
        self.headless = headless

    def setup_driver(self):
        """创建 Selenium WebDriver。"""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        return webdriver.Chrome(options=chrome_options)

    @staticmethod
    def _compact_style(style_dict: Dict[str, str]) -> Dict[str, str]:
        return {
            key: value
            for key, value in style_dict.items()
            if value not in ("", None, "rgba(0, 0, 0, 0)")
        }

    def _collect_visual_snapshot(self, driver) -> Dict[str, Any]:
        """提取可用于复刻布局的视觉摘要。"""
        snapshot = driver.execute_script(
            """
            const visible = (el) => {
                if (!el) return false;
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    parseFloat(style.opacity || '1') > 0 &&
                    rect.width > 24 &&
                    rect.height > 20;
            };

            const cleanText = (text) => (text || '').replace(/\s+/g, ' ').trim().slice(0, 140);

            const styleInfo = (style) => ({
                color: style.color,
                backgroundColor: style.backgroundColor,
                backgroundImage: style.backgroundImage && style.backgroundImage !== 'none'
                    ? style.backgroundImage.slice(0, 140)
                    : '',
                fontFamily: style.fontFamily.split(',').slice(0, 2).join(','),
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
                textAlign: style.textAlign,
                display: style.display,
                justifyContent: style.justifyContent,
                alignItems: style.alignItems,
                gap: style.gap,
                borderRadius: style.borderRadius,
                border: style.border && style.border !== '0px none rgb(0, 0, 0)'
                    ? style.border.slice(0, 100)
                    : '',
                boxShadow: style.boxShadow && style.boxShadow !== 'none'
                    ? style.boxShadow.slice(0, 140)
                    : '',
                padding: style.padding,
                margin: style.margin
            });

            const elementInfo = (el) => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return {
                    tag: el.tagName.toLowerCase(),
                    id: el.id || '',
                    classes: Array.from(el.classList).slice(0, 6),
                    text: cleanText(el.innerText || el.textContent),
                    rect: {
                        x: Math.round(rect.x),
                        y: Math.round(rect.y),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    },
                    style: styleInfo(style)
                };
            };

            const blocks = Array.from(
                document.querySelectorAll('header, nav, main, section, article, footer, aside, div')
            )
                .filter(visible)
                .map(elementInfo)
                .filter((item) => item.rect.width >= 180 && item.rect.height >= 60)
                .sort((a, b) => {
                    const ay = a.rect.y;
                    const by = b.rect.y;
                    if (Math.abs(ay - by) > 40) return ay - by;
                    return (b.rect.width * b.rect.height) - (a.rect.width * a.rect.height);
                })
                .slice(0, 14);

            const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
                .filter(visible)
                .slice(0, 10)
                .map(elementInfo);

            const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'))
                .filter(visible)
                .slice(0, 16)
                .map(elementInfo);

            const images = Array.from(document.querySelectorAll('img'))
                .filter(visible)
                .slice(0, 12)
                .map((el) => {
                    const info = elementInfo(el);
                    info.src = el.currentSrc || el.src || '';
                    info.alt = (el.alt || '').slice(0, 80);
                    return info;
                });

            const bodyStyle = window.getComputedStyle(document.body);
            return {
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    documentHeight: document.documentElement.scrollHeight
                },
                body: {
                    backgroundColor: bodyStyle.backgroundColor,
                    color: bodyStyle.color,
                    fontFamily: bodyStyle.fontFamily.split(',').slice(0, 2).join(',')
                },
                blocks,
                headings,
                buttons,
                images
            };
            """
        )

        color_counter = Counter()
        font_counter = Counter()

        for collection_name in ("blocks", "headings", "buttons"):
            for item in snapshot.get(collection_name, []):
                style = item.get("style", {})
                for key in ("backgroundColor", "color"):
                    value = style.get(key)
                    if value and value != "rgba(0, 0, 0, 0)":
                        color_counter[value] += 1
                if style.get("fontFamily"):
                    font_counter[style["fontFamily"]] += 1
                item["style"] = self._compact_style(style)

        snapshot["dominant_colors"] = [color for color, _ in color_counter.most_common(8)]
        snapshot["dominant_fonts"] = [font for font, _ in font_counter.most_common(4)]
        return snapshot

    def fetch_url_with_selenium(self, url: str, wait_time: int = 5) -> Tuple[Optional[str], Optional[str], Optional[Dict[str, Any]], Optional[str]]:
        """使用 Selenium 获取 URL 的渲染结果。"""
        driver = None
        try:
            print(f"\n[DEBUG] Selenium 采集 URL: {url}")
            print(f"  - Wait Time: {wait_time}s")
            print(f"  - Headless: {self.headless}")

            driver = self.setup_driver()
            driver.get(url)

            time.sleep(max(wait_time, 1))
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
            except Exception:
                pass

            driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 2);")
            time.sleep(0.8)
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(0.8)
            driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(0.8)

            visual_snapshot = self._collect_visual_snapshot(driver)
            html_content = driver.page_source
            title = driver.title

            print(f"  - Title: {title}")
            print(f"  - HTML Size: {len(html_content)} chars")
            print(f"  - Visual Blocks: {len(visual_snapshot.get('blocks', []))}")
            print(f"  - Headings: {len(visual_snapshot.get('headings', []))}")
            print(f"  - Buttons: {len(visual_snapshot.get('buttons', []))}")

            return html_content, title, visual_snapshot, None
        except Exception as exc:
            return None, None, None, f"URL 采集失败 {url}: {exc}"
        finally:
            if driver:
                driver.quit()

    def extract_page_info(
        self,
        html_content: str,
        source: str,
        title: Optional[str] = None,
        visual_snapshot: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """从 HTML 提取页面关键信息。"""
        soup = BeautifulSoup(html_content, "html.parser")

        info = {
            "source": source,
            "title": title or (soup.title.get_text(strip=True) if soup.title else ""),
            "meta_description": "",
            "headings": [],
            "text_content": "",
            "links": [],
            "images": [],
            "buttons": [],
            "structure": "",
            "visual_summary": {},
        }

        meta_desc = soup.find("meta", attrs={"name": "description"})
        if not meta_desc:
            meta_desc = soup.find("meta", property="og:description")
        if meta_desc:
            info["meta_description"] = meta_desc.get("content", "")

        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()

        for level in range(1, 7):
            for heading in soup.find_all(f"h{level}")[:20]:
                text = heading.get_text(strip=True)
                if text and len(text) > 1:
                    info["headings"].append({"level": level, "text": text})

        body = soup.find("body")
        if body:
            text = body.get_text(separator=" ", strip=True)
            text = re.sub(r"\s+", " ", text)
            info["text_content"] = text[:12000]

        for link in soup.find_all("a", href=True)[:60]:
            text = link.get_text(strip=True)
            if text and len(text) > 1:
                info["links"].append({"text": text[:100], "href": link["href"]})

        for image in soup.find_all("img")[:30]:
            src = image.get("src") or image.get("data-src") or image.get("data-lazy-src")
            if src:
                info["images"].append({"src": src, "alt": image.get("alt", "")[:100]})

        for button in soup.find_all(["button", "a"], class_=True)[:30]:
            text = button.get_text(strip=True)
            if text and len(text) > 1:
                info["buttons"].append(
                    {
                        "text": text[:80],
                        "classes": " ".join(button.get("class", [])[:5]),
                    }
                )

        main_tags = ["header", "nav", "main", "article", "section", "aside", "footer"]
        structure_parts = [tag for tag in main_tags if soup.find(tag)]
        info["structure"] = ", ".join(structure_parts) if structure_parts else "basic html"

        if visual_snapshot:
            info["visual_summary"] = {
                "viewport": visual_snapshot.get("viewport", {}),
                "body": visual_snapshot.get("body", {}),
                "dominant_colors": visual_snapshot.get("dominant_colors", []),
                "dominant_fonts": visual_snapshot.get("dominant_fonts", []),
                "top_blocks": visual_snapshot.get("blocks", [])[:8],
                "prominent_headings": visual_snapshot.get("headings", [])[:10],
                "prominent_buttons": visual_snapshot.get("buttons", [])[:12],
                "prominent_images": visual_snapshot.get("images", [])[:10],
            }

        return info

    def extract_from_parsed_input(self, parsed_input: ParsedInput, wait_time: int = 5) -> ExtractionResult:
        """将 ParsedInput 转成统一上下文。"""
        pages: List[Dict[str, Any]] = []
        screenshots: List[Dict[str, Any]] = []
        warnings = list(parsed_input.warnings)

        for item in parsed_input.items:
            if item.type == "url":
                html_content, title, visual_snapshot, warning = self.fetch_url_with_selenium(
                    str(item.content), wait_time
                )
                if warning:
                    warnings.append(warning)
                    continue
                if not html_content:
                    warnings.append(f"URL 内容为空，已跳过: {item.source}")
                    continue
                pages.append(
                    self.extract_page_info(
                        html_content=html_content,
                        source=item.source,
                        title=title,
                        visual_snapshot=visual_snapshot,
                    )
                )
                continue

            if item.type == "mhtml":
                html_content = InputParser.extract_html_from_mhtml(str(item.content))
                if not html_content:
                    warnings.append(f"MHTML 解析失败，已跳过: {item.source}")
                    continue
                pages.append(
                    self.extract_page_info(
                        html_content=html_content,
                        source=item.source,
                        title=item.metadata.get("filename", "mhtml_page"),
                    )
                )
                continue

            if item.type == "screenshot":
                screenshots.append(
                    {
                        "bytes": item.content,
                        "filename": item.metadata.get("filename", "screenshot"),
                        "mime_type": item.metadata.get("mime_type", "image/png"),
                        "source": item.source,
                    }
                )

        return ExtractionResult(pages=pages, screenshots=screenshots, warnings=warnings)

    @staticmethod
    def to_debug_summary(extraction: ExtractionResult) -> str:
        """将上下文压缩为可读调试信息。"""
        summary = {
            "pages": [
                {
                    "source": page.get("source"),
                    "title": page.get("title"),
                    "headings": len(page.get("headings", [])),
                    "links": len(page.get("links", [])),
                    "images": len(page.get("images", [])),
                }
                for page in extraction.pages
            ],
            "screenshots": [shot.get("filename") for shot in extraction.screenshots],
            "warnings": extraction.warnings,
        }
        return json.dumps(summary, ensure_ascii=False, indent=2)
