# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Web Printer** (网页复印机) is a local frontend artifact generation project. It includes:

- A web page reconstruction pipeline that turns user intent plus multi-modal inputs (URLs, screenshots, MHTML files) into self-contained single-page or multi-page HTML artifacts.
- A generated Fake Game Library of offline, mobile-first fake game pages.
- A local Fake / Remix harness that can create a game from scratch or remix an existing artifact, then publish it back into `output/`.

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

**Validate generated artifacts (Node.js, from the parent workspace):**
```bash
cd /Users/pencil/Documents/Printer
node printer/tests/verify_fake_library.mjs
node printer/tests/verify_game_alignment.mjs
node printer/tests/verify_sheep_stack.mjs
```

**Run Python tests (from the repo root):**
```bash
python -m unittest tests/test_env_config.py tests/test_remix_harness.py
```

**Run the Fake / Remix harness:**
```bash
python tools/remix_harness_server.py --port 8787
```

## Key Environment Variables (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | — | Required |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | API endpoint |
| `OPENAI_MODEL` | `moonshotai/kimi-k2.6` | Model used for the main generation pipeline |
| `OPENAI_REMIX_MODEL` | `moonshotai/kimi-k2.6` | Model used by the Fake / Remix harness |
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
- React/Vite output is legacy fallback code only. The current `OutputFormat` enum exposes `single_html` and `multi_html`.

Each run produces `run_report.json` in the output directory with format, complexity scores, intent plan, warnings, and file list.

## Fake Game Library and Harness

The fake-game showcase is generated from `tools/generate_fake_library.mjs`, not hand-maintained in `output/*.html`. Durable changes should go into the generator, then `output/` should be regenerated.

The local harness is implemented in `tools/remix_harness_server.py` and provides:

- `/api/fake/draft-jobs` for from-scratch game generation.
- `/api/remix/draft-jobs` for remixing an existing source artifact.
- `/api/remix/publish` for writing `output/<slug>.html`, `output/<slug>.remix.json`, and updating `remix_manifest.json` / `remix_manifest.js`.

## Testing

The repo has both Python unit tests and Node.js ESM validators:

- `python -m unittest tests/test_env_config.py tests/test_remix_harness.py`
- `node printer/tests/verify_fake_library.mjs`
- `node printer/tests/verify_game_alignment.mjs`
- `node printer/tests/verify_remix_outputs.mjs`

The Node validators check generated HTML artifacts for required structure, metadata, no external HTTP dependencies, mobile shell layout, and game hooks.
