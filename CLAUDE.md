# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Web Printer** (网页复印机) is a web page replication and code generation system. It takes user intent descriptions with multi-modal inputs (URLs, screenshots, MHTML files) and generates self-contained HTML or React page replicas using OpenAI's vision API.

## Setup & Running

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Configure environment:**
```bash
cp .env.example .env
# Set OPENAI_API_KEY at minimum
```

**Run (new mode):**
```bash
python web_printer_selenium.py \
  --intent "description of desired output" \
  --input https://example.com \
  --input ./screenshot.png \
  --output ./output/demo \
  --show-plan
```

**Run (legacy mode):**
```bash
python web_printer_selenium.py https://example.com output.html 5
```

**Validate generated artifacts (Node.js):**
```bash
node tests/verify_fake_library.mjs
node tests/verify_game_alignment.mjs
node tests/verify_sheep_stack.mjs
```

**Build generated React output (if applicable):**
```bash
cd output/react_project_*
npm install && npm run dev
```

## Key Environment Variables (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | — | Required |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | API endpoint |
| `OPENAI_MODEL` | `gpt-4o` | Model used for generation |
| `HEADLESS` | `true` | Run Chrome headlessly |
| `WAIT_TIME` | `5` | Seconds to wait for dynamic content |
| `MAX_TOKENS` | `16000` | Max tokens per generation call |
| `USE_LANGCHAIN` | `true` | Use LangChain for intent planning; false = rule-based fallback |
| `AUTO_SCREENSHOT` | `true` | Auto-screenshot URLs for vision analysis |

## Architecture

The pipeline is orchestrated by `src/pipeline.py` (`WebPrinterPipeline.run()`), which chains these stages in order:

```
InputParser → PageExtractor → ComplexityAnalyzer → IntentPlanner
    → ArtifactGenerator → file write → run_report.json
```

**Stage responsibilities:**

- `src/input_parser.py` — Validates and categorizes inputs (URL / image file / MHTML archive) into `ParsedInput`
- `src/page_extractor.py` — Selenium + JavaScript injection to capture DOM structure, visual summaries, and screenshots; MHTML parsed via Python's `email` module
- `src/complexity_analyzer.py` — Scores page complexity (0–80+) across four dimensions (components, interactions, pages, data_flow); score ≥ 40 → `MULTI_HTML`, otherwise `SINGLE_HTML`
- `src/intent_planner.py` — LangChain structured output (or rule-based fallback) converts the user's intent string into an `IntentPlan` with UI/tech requirements and a `complexity_bias` adjustment (−10 to +20)
- `src/artifact_generator.py` — Builds the OpenAI multimodal prompt (text + base64 images), parses the response into named files, applies a safe-template fallback on failure
- `src/logger.py` — Writes timestamped session logs to `log/YYYYMMDD_HHMMSS/` (API calls, extraction JSON, complexity JSON, screenshots)

**Entry point:** `web_printer_selenium.py` — CLI arg parsing and legacy compatibility wrapper around `WebPrinterPipeline`.

## Output Formats

- **`single_html`** — one self-contained `.html` file
- **`multi_html`** — `index.html` + supporting files in a directory
- React/Vite output is mentioned in `artifact_generator.py` but not yet surfaced by `complexity_analyzer.py`

Each run produces `run_report.json` in the output directory with format, complexity scores, intent plan, warnings, and file list.

## Testing

There is no Python test suite. Validation is done via Node.js ESM scripts in `tests/` that check generated HTML artifacts for correct structure (doctype, viewport, no external HTTP deps, required canvas/game hooks).
