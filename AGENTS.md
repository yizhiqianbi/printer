# AGENTS.md

## Project Overview

Web Printer is a local frontend artifact generation project. It has three active surfaces:

- A webpage reconstruction pipeline that accepts an intent plus URLs, screenshots, or MHTML files, then writes self-contained HTML or multi-file artifacts under `output/`.
- A generated Fake Game Library made from offline, mobile-first fake game pages and a showcase homepage.
- A local Fake / Remix harness that creates from-scratch game drafts or remixes existing game artifacts, then publishes them back into `output/` and the remix manifest.

The main Python pipeline is:

```text
InputParser -> PageExtractor -> ComplexityAnalyzer -> IntentPlanner -> ArtifactGenerator
```

Entry point: `web_printer_selenium.py`

Core modules:

- `src/input_parser.py` validates URL, image, and MHTML inputs.
- `src/page_extractor.py` captures DOM, visual summaries, screenshots, and MHTML content.
- `src/complexity_analyzer.py` scores output complexity and chooses output format.
- `src/intent_planner.py` builds an intent plan using LangChain when enabled, with a rule-based fallback.
- `src/artifact_generator.py` prompts the model and parses generated files.
- `src/pipeline.py` orchestrates the end-to-end run and writes `run_report.json`.

Fake-library source of truth:

- `tools/generate_fake_library.mjs` writes `output/index.html`, game pages, `fake_manifest.json`, `remix_manifest.json`, and `run_report.json`.
- `tools/remix_harness_server.py` serves the local showcase and implements `/api/fake/*` plus `/api/remix/*`.
- `tests/verify_fake_library.mjs` is the primary static acceptance gate for generated game artifacts.

## Working Directory Notes

The git repository root is:

```bash
/Users/pencil/Documents/Printer/printer
```

Some Node scripts use paths rooted at the parent directory and expect this cwd:

```bash
/Users/pencil/Documents/Printer
```

When running fake library generation or verification, prefer the parent cwd commands shown below.

## Environment

Install Python dependencies from the repo root:

```bash
pip install -r requirements.txt
```

Use `.env.example` as the template for `.env`. Preserve `.env` and never print, copy, or commit secrets from it.

Important environment variables:

- `OPENAI_API_KEY` or local alias `OPEN_ROUTER_API`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `OPENAI_REMIX_MODEL`
- `HEADLESS`
- `WAIT_TIME`
- `MAX_TOKENS`
- `USE_LANGCHAIN`

## Common Commands

Run the main pipeline from the repo root:

```bash
python web_printer_selenium.py \
  --intent "description of desired output" \
  --input https://example.com \
  --output ./output/demo \
  --show-plan
```

Run legacy URL mode:

```bash
python web_printer_selenium.py https://example.com ./output/example.html 5
```

Run Python unit tests from the repo root:

```bash
python -m unittest tests/test_env_config.py tests/test_remix_harness.py
```

Generate the fake game library from the parent directory:

```bash
cd /Users/pencil/Documents/Printer
node printer/tools/generate_fake_library.mjs
```

Run artifact validators from the parent directory:

```bash
cd /Users/pencil/Documents/Printer
node printer/tests/verify_fake_library.mjs
node printer/tests/verify_game_alignment.mjs
node printer/tests/verify_sheep_stack.mjs
node printer/tests/verify_remix_outputs.mjs
```

Run the remix harness from the repo root:

```bash
python tools/remix_harness_server.py --port 8787
```

Then open:

```text
http://127.0.0.1:8787/index.html
```

## Artifact Rules

Generated HTML should be self-contained unless the user explicitly asks for a hosted app. Avoid external URLs, CDN dependencies, copied logos, and protected original assets.

Each pipeline output should include or preserve a nearby `run_report.json` with output format, complexity, plan, warnings, and files.

For fake-game library pages:

- Use portrait-first mobile markup with `class="phone-shell"`.
- Include a mobile viewport with `viewport-fit=cover`.
- Include `data-printer-artifact="fake-game-library"`.
- Set `window.__PRINTER_ARTIFACT__` with generation and game metadata.
- Expose `window.render_game_to_text()` and `window.advanceTime(ms)`.
- Prefer a visible `<canvas>` playfield for action or realtime games.
- Ensure touch handling is mobile-friendly.

When changing generated fake-game pages, prefer editing `tools/generate_fake_library.mjs` and regenerating `output/` artifacts. Hand-edit individual output HTML only for one-off experiments, and reflect durable changes back into the generator before final verification.

## Repo Hygiene

This repo often has many generated or untracked files under `output/`, `test-artifacts/`, and `research/`. Do not revert or delete user changes unless explicitly asked.

Do not read or expose `.env` values. Reading `.env.example` is fine.

Keep generated artifacts deterministic where possible so validators can compare structure and metadata reliably.
