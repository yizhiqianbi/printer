Original prompt: 调研最近中英文互联网很火的 抽象的 好玩的 评测的 热的小游戏, 并且尽量1比1复刻, 比如 SBTI, 羊了个羊, 玄学的, 各种.io的游戏方便爬的, 谷歌小恐龙, 等等等等, 全都做成html, 放在/Users/pencil/Documents/Printer/printer/output 里面, 建立一个赝品库

## 2026-04-25

- Scope approved by user with "做".
- Delivery profile: browser instant, no-build, single-file static HTML pages.
- Planned first batch: 12 playable pages plus `index.html`.
- Verification approach: static Node script plus Playwright browser smoke checks.
- Generated files:
  - `index.html`
  - `sbti-fake.html`
  - `sheep-stack.html`
  - `brainrot-clicker.html`
  - `stimulation-fake.html`
  - `cattle-bump.html`
  - `password-hell.html`
  - `infinite-craft-fake.html`
  - `million-checkboxes-fake.html`
  - `dino-fake.html`
  - `garden-idle.html`
  - `agar-fake.html`
  - `mystic-score.html`
- Static verification passed with `node printer/tests/verify_fake_library.mjs`.
- Browser smoke checks ran through the Playwright web-game client for every generated page. No console/page errors were emitted.
- Screenshots and state JSON are under `printer/test-artifacts/fake-library/`.

## Follow-up ideas

- Add a second batch for Flappy Bird, 2048, Wordle-like, Suika/合成大西瓜, Shell Shockers-style top-down arena, and "你是什么小狗/小猫" social quizzes.
- Add a filter/search bar to `index.html` once the library grows beyond the first shelf.
- Add per-page export/share-card buttons for the quiz and mystic pages.

## 2026-04-25 mobile rewrite

- Rewrote the fake-game generator to follow the Web Printer artifact contract more closely:
  - Output includes `printer/output/run_report.json`.
  - Each generated HTML has `data-printer-artifact="fake-game-library"`.
  - Each generated HTML sets `window.__PRINTER_ARTIFACT__`.
  - Game pages expose `window.render_game_to_text()` and `window.advanceTime(ms)`.
- Converted the library to a mobile-first portrait phone shell.
- Added canvas playfields for sheep stack, brainrot clicker, stimulation clicker, cattle bump, dino runner, and agar clone.
- Packaged the local Printer workflow as a Codex skill at `~/.codex/skills/printer`.
- Validation:
  - `node printer/tests/verify_fake_library.mjs` passed.
  - `quick_validate.py ~/.codex/skills/printer` passed.
  - Browser smoke checks produced screenshots under `printer/test-artifacts/mobile-rewrite/`.

## 2026-04-25 sheep stack fix

- Root cause: the sheep clone used text labels as icons and generated layers from a loose coordinate formula. That made the layout look like arbitrary overlap and made covered/free tile behavior hard to reason about.
- Added `printer/tests/verify_sheep_stack.mjs`.
- Updated `printer/tools/generate_fake_library.mjs`:
  - Sheep level now has explicit debug metadata in `window.__SHEEP_DEBUG_LEVEL__`.
  - Level has 54 tiles, 6 icon types, 9 copies of each icon.
  - Coordinates avoid exact overlap while still creating real higher-layer coverage.
  - Top layer has mixed icon types.
  - Canvas renders actual drawn tile icons instead of single text glyphs.
  - Covered visible tiles reject clicks; free tiles enter tray; three matching tiles clear.
- Validation:
  - `node printer/tests/verify_sheep_stack.mjs` passed.
  - `node printer/tests/verify_fake_library.mjs` passed.
  - Browser checks under `printer/test-artifacts/sheep-fix/` confirm covered click rejection and triple-clear behavior.

## 2026-04-25 alignment pass

- Added `printer/research/fake_game_alignment_sources.md` with source-alignment notes and permissive/public reference boundaries.
- Added `printer/tests/verify_game_alignment.mjs` to assert per-game alignment hooks and debug metadata.
- Upgraded the generator for the rest of the library:
  - Dino: high score, clouds, ducking, bird obstacle support, debug config.
  - Agar: large world, camera projection, leaderboard, split cells, ejected mass.
  - Password: progressive rule reveal, moon phase, captcha, exported rule list.
  - Infinite Craft: recipe cache, craft history, search, fixed unordered recipe matching.
  - One Million Checkboxes: personal/global counts, remote pulses, colored outlines.
  - Garden: stage model, restock timer, rarity, deterministic mutation.
  - Brainrot: mascot drawing, upgrade effects, edge-lane floating words.
  - Stimulation: modules, chaos level, DVD/video/podcast notification surfaces.
- Validation:
  - `node printer/tests/verify_game_alignment.mjs` passed.
  - `node printer/tests/verify_sheep_stack.mjs` passed.
  - `node printer/tests/verify_fake_library.mjs` passed.
  - Browser artifacts are under `printer/test-artifacts/alignment/`.

## 2026-04-25 home feed rewrite

- Reworked `index.html` generation to present content like a Loopit/TikTok-style vertical feed.
- Removed the visible directory-style summaries, numbering, and explanatory homepage copy.
- Each screen now focuses on one game with a large generated cover, game title, PLAY entry, and minimal side controls.
- Validation:
  - `node printer/tests/verify_fake_library.mjs` passed.
  - `node printer/tests/verify_game_alignment.mjs` passed.
  - Mobile screenshots and state are under `printer/test-artifacts/home-feed/`.

## 2026-04-25 unified touch color system

- Unified all generated pages around the home feed palette: black base, hot pink primary, cyan highlights, glass panels.
- Removed visible game-page summaries so the first screen gives priority to the playable surface.
- Increased touch targets for primary buttons, shop rows, chips, plots, input fields, and canvas surfaces.
- Recolored the main canvas backgrounds for sheep, brainrot, stimulation, cattle, dino, and agar to fit the same palette.
- Validation:
  - `node printer/tests/verify_fake_library.mjs` passed.
  - `node printer/tests/verify_game_alignment.mjs` passed.
  - `node printer/tests/verify_sheep_stack.mjs` passed.
  - Mobile touch screenshots/states are under `printer/test-artifacts/unified-touch/`.

## 2026-04-25 infinite craft chaos upgrade

- Rebuilt Infinite Craft from a small recipe table into a procedural combination engine.
- Added `window.__CRAFT_ENGINE__`, deterministic procedural naming, item depth metadata, pair-space counting, localStorage persistence, and `window.randomStew`.
- Added the mobile `乱炖 x5` button so one tap can create a burst of discoveries.
- The page now starts with 7 seed concepts and quickly expands the possible pair space as discoveries accumulate.
- Validation:
  - `node printer/tests/verify_fake_library.mjs` passed.
  - `node printer/tests/verify_game_alignment.mjs` passed.
  - Browser chaos run after 3 stew taps reached 22 discoveries, 231 possible pairs, depth 7.
  - Artifacts are under `printer/test-artifacts/infinite-craft-chaos-rerun/`.

## 2026-04-25 io arena template

- User redirected the `.io` shooter follow-up from “make several specific clones” to “turn this family into our reusable template”.
- Added `io-arena-template.html` generation in `printer/tools/generate_fake_library.mjs`.
- Template scope:
  - portrait-first phone shell
  - single canvas arena
  - dual-thumb touchsticks
  - airdropped weapons
  - bot swarm
  - fake leaderboard
  - palette/skin cycling hooks
- Added template alignment checks to `printer/tests/verify_game_alignment.mjs` and included the file in `printer/tests/verify_fake_library.mjs`.
- Exposed reusable hooks on the page:
  - `window.__IO_TEMPLATE__`
  - `window.applyArenaSkin()`
  - `window.spawnBot()`
  - `window.spawnDrop()`
  - `window.drawJoystick()`
- Expanded `render_game_to_text()` for the template to include player position, hp, boost, bullets, drops, and leaderboard.
- Validation:
  - `node printer/tools/generate_fake_library.mjs` passed.
  - `node printer/tests/verify_fake_library.mjs` passed.
  - `node printer/tests/verify_game_alignment.mjs` passed.
  - Playwright smoke artifact after clicking drop on the template is under `printer/test-artifacts/io-template-smoke/`.
  - Mobile Playwright interaction artifact after skin/drop/boost plus drag/fire is under `printer/test-artifacts/io-template-touch/`.

## 2026-04-25 infinite craft layout overflow fix

- User reported that `无限乱炖实验室` had a broken layout with horizontal overflow.
- Root cause: after repeated `乱炖 x5`, long generated concept names in `.slots` forced CSS Grid min-content sizing. The craft panel expanded past 2200px, and the browser horizontally scrolled `.phone-shell` to keep the focused button/input visible.
- Added `printer/tests/verify_infinite_craft_layout.mjs` to run Infinite Craft in real Chromium at 390px and 320px widths, click `乱炖 x5` sixteen times, and assert no document/body/shell horizontal overflow.
- Updated shared game-page CSS in `printer/tools/generate_fake_library.mjs`:
  - grid/flex children now opt into `min-width: 0`
  - craft slots use `minmax(0, 1fr)` and wrap/clamp long words
  - craft stats, logs, inputs, and chips wrap without widening the phone shell
- Regenerated `printer/output`.
- Validation:
  - `node printer/tests/verify_infinite_craft_layout.mjs` passed.
  - `node printer/tests/verify_fake_library.mjs` passed.
  - `node printer/tests/verify_game_alignment.mjs` passed.
  - `node printer/tests/verify_sheep_stack.mjs` passed.
  - Mobile browser metrics after 16 stews: viewport 390, document/body scrollWidth 390, shell clientWidth 388, shell scrollWidth 388, shell scrollLeft 0.
  - Screenshot and metrics are under `printer/test-artifacts/infinite-craft-layout/`.
