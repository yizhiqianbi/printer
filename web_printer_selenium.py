#!/usr/bin/env python3
"""
网页复印机 - Selenium 增强版
获取渲染后的网页，并把结构信息和视觉摘要一起发送给 Claude 生成 HTML。
"""

import json
import os
import re
import sys
import time
from collections import Counter
from urllib.parse import urlparse

from anthropic import Anthropic
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class WebPrinterSelenium:
    def __init__(self, api_key=None, headless=True):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("需要设置 ANTHROPIC_API_KEY 环境变量")
        self.client = Anthropic(api_key=self.api_key)
        self.headless = headless

    def setup_driver(self):
        """设置 Selenium WebDriver。"""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )

        try:
            return webdriver.Chrome(options=chrome_options)
        except Exception as exc:
            print(f"启动 Chrome 失败: {exc}")
            print("请确认已安装 Chrome 和 ChromeDriver")
            return None

    @staticmethod
    def _compact_style(style_dict):
        return {
            key: value
            for key, value in style_dict.items()
            if value not in ("", None, "rgba(0, 0, 0, 0)")
        }

    def _collect_visual_snapshot(self, driver):
        """提取页面视觉摘要，帮助模型复刻布局和风格。"""
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

            const cleanText = (text) => (text || '').replace(/\\s+/g, ' ').trim().slice(0, 140);

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

    def fetch_url_with_selenium(self, url, wait_time=5):
        """使用 Selenium 获取渲染后的页面。"""
        print(f"正在获取并渲染: {url}")
        driver = self.setup_driver()
        if not driver:
            return None, None, None

        try:
            driver.get(url)

            print(f"等待 {wait_time} 秒让页面完全加载...")
            time.sleep(wait_time)

            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
            except Exception:
                pass

            driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 2);")
            time.sleep(1)
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)
            driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(1)

            visual_snapshot = self._collect_visual_snapshot(driver)
            html_content = driver.page_source
            title = driver.title

            driver.quit()
            return html_content, title, visual_snapshot

        except Exception as exc:
            print(f"获取页面失败: {exc}")
            driver.quit()
            return None, None, None

    def extract_page_info(self, html_content, url, title, visual_snapshot=None):
        """提取网页关键信息。"""
        soup = BeautifulSoup(html_content, "html.parser")

        info = {
            "url": url,
            "title": title,
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
            info["text_content"] = text[:10000]

        for link in soup.find_all("a", href=True)[:40]:
            text = link.get_text(strip=True)
            if text and len(text) > 1:
                info["links"].append({"text": text[:100], "href": link["href"]})

        for image in soup.find_all("img")[:20]:
            src = image.get("src") or image.get("data-src") or image.get("data-lazy-src")
            if src:
                info["images"].append(
                    {
                        "src": src,
                        "alt": image.get("alt", "")[:100],
                    }
                )

        for button in soup.find_all(["button", "a"], class_=True)[:20]:
            text = button.get_text(strip=True)
            if text and len(text) > 1:
                info["buttons"].append(
                    {
                        "text": text[:60],
                        "classes": " ".join(button.get("class", [])[:4]),
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
                "top_blocks": visual_snapshot.get("blocks", [])[:6],
                "prominent_headings": visual_snapshot.get("headings", [])[:6],
                "prominent_buttons": visual_snapshot.get("buttons", [])[:8],
                "prominent_images": visual_snapshot.get("images", [])[:6],
            }

        return info

    def generate_html_with_claude(self, page_info):
        """使用 Claude API 生成 HTML。"""
        print("正在使用Claude API生成HTML...")

        prompt = f"""请根据以下网页信息，生成一个功能和视觉都尽量接近原网页的完整 HTML 文件。
网页信息：
- URL: {page_info['url']}
- 标题: {page_info['title']}
- 描述: {page_info['meta_description']}
- 页面结构: {page_info['structure']}

标题层级 ({len(page_info['headings'])} 个):
{json.dumps(page_info['headings'], ensure_ascii=False, indent=2)}

按钮/交互元素:
{json.dumps(page_info['buttons'], ensure_ascii=False, indent=2)}

视觉摘要:
{json.dumps(page_info.get('visual_summary', {}), ensure_ascii=False, indent=2)}

主要内容:
{page_info['text_content'][:5000]}

链接:
{json.dumps(page_info['links'][:20], ensure_ascii=False, indent=2)}

图片:
{json.dumps(page_info['images'][:15], ensure_ascii=False, indent=2)}

要求：
1. 生成完整的 HTML5 文档，包含 <!DOCTYPE html>
2. 优先还原首屏布局、区块顺序、主色、字体气质、按钮样式、卡片样式和留白节奏
3. 使用内联 CSS 样式，不依赖外部 CSS 或 JS
4. 保留所有标题、文本内容、链接和图片
5. 为按钮和交互元素添加基本 hover 效果
6. 使用响应式设计，适配移动端
7. 保持语义化的 HTML 标签
8. 图片使用原始 URL
9. 链接保持原始 href
10. 如果视觉摘要里出现大面积背景、玻璃拟态、阴影、圆角、渐变、横向卡片、设备截图展示等特征，请显式复现
11. 如果信息不足，不要退化成通用 SaaS 模板，应优先依据视觉摘要复现页面结构和视觉气质
12. 只输出 HTML 代码，不要任何解释
请直接输出完整的 HTML 代码："""

        try:
            message = self.client.messages.create(
                model="claude-opus-4-20250514",
                max_tokens=16000,
                messages=[{"role": "user", "content": prompt}],
            )

            html_content = message.content[0].text

            html_match = re.search(r"```html\s*(.*?)\s*```", html_content, re.DOTALL)
            if html_match:
                html_content = html_match.group(1)

            stripped = html_content.strip()
            if not stripped.startswith("<!DOCTYPE") and not stripped.startswith("<html"):
                html_start = html_content.find("<!DOCTYPE")
                if html_start == -1:
                    html_start = html_content.find("<html")
                if html_start > 0:
                    html_content = html_content[html_start:]

            return html_content

        except Exception as exc:
            print(f"Claude API 调用失败: {exc}")
            return None

    def save_html(self, html_content, output_path):
        """保存 HTML 文件。"""
        try:
            with open(output_path, "w", encoding="utf-8") as file:
                file.write(html_content)
            print(f"HTML 文件已保存: {output_path}")
            return True
        except Exception as exc:
            print(f"保存文件失败: {exc}")
            return False

    def print_webpage(self, url, output_path=None, wait_time=5):
        """主流程：复印网页。"""
        html_content, title, visual_snapshot = self.fetch_url_with_selenium(url, wait_time)
        if not html_content:
            return False

        print("正在分析网页结构...")
        page_info = self.extract_page_info(html_content, url, title, visual_snapshot)

        print(
            f"提取到: {len(page_info['headings'])} 个标题, "
            f"{len(page_info['links'])} 个链接, "
            f"{len(page_info['images'])} 个图片"
        )
        print("视觉摘要:", json.dumps(page_info.get("visual_summary", {}), ensure_ascii=False))
        print(page_info)

        generated_html = self.generate_html_with_claude(page_info)
        if not generated_html:
            return False

        if not output_path:
            domain = urlparse(url).netloc.replace(".", "_")
            output_path = f"printed_{domain}_selenium.html"

        return self.save_html(generated_html, output_path)


def main():
    if len(sys.argv) < 2:
        print("用法: python web_printer_selenium.py <URL> [输出文件名] [等待时间(秒)]")
        print("示例: python web_printer_selenium.py https://example.com output.html 5")
        sys.exit(1)

    url = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    wait_time = int(sys.argv[3]) if len(sys.argv) > 3 else 5

    try:
        printer = WebPrinterSelenium()
        success = printer.print_webpage(url, output_path, wait_time)
        sys.exit(0 if success else 1)
    except Exception as exc:
        print(f"错误: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
