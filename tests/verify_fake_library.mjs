import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const outputDir = path.resolve('printer/output');
const expectedFiles = [
  'index.html',
  'screw-sorter.html',
  'screw-box-blitz.html',
  'screwdom-fake.html',
  'brainrot-merge-pot.html',
  'brainrot-raider-yard.html',
  'brainrot-egg-run.html',
  'arrow-escape-fake.html',
  'emoji-gator-hop.html',
  'zen-logic-fake.html',
  'marble-sort-fake.html',
  'wool-sort-fake.html',
  'pixel-loop-fake.html',
  'seat-away-fake.html',
  'sbti-fake.html',
  'sheep-stack.html',
  'goose-ladle.html',
  'nostalgia-spotter.html',
  'overtime-blocks.html',
  'clock-out-jam.html',
  'meeting-pinball.html',
  'brainrot-clicker.html',
  'stimulation-fake.html',
  'cattle-bump.html',
  'password-hell.html',
  'infinite-craft-fake.html',
  'million-checkboxes-fake.html',
  'dino-fake.html',
  'garden-idle.html',
  'agar-fake.html',
  'snake-battle-fake.html',
  'mystic-score.html',
  'tarot-daily.html',
  'bazi-lite.html',
  'astro-wheel.html',
  'yijing-coins.html',
  'qingjiao-sim.html',
  'life-restart-fake.html',
  'twitter-governance.html',
  'io-arena-template.html',
  'lunchbox-merge-pot.html',
  'office-pin-pile.html',
  'office-raider-yard.html',
  'courier-arrow-rush.html',
  'office-hop-stack.html',
  'meeting-gridlock.html',
  'milk-tea-sorter.html',
  'office-loom-sort.html',
  'overtime-pixel-loop.html',
  'bus-jam-fake.html',
  'night-shift-shuttle.html',
  'office-seat-scramble.html',
  'parking-jam-fake.html',
  'overtime-carpool-jam.html',
  'traffic-bolt-jam.html',
  'factory-bolt-jam.html',
  'color-block-jam-fake.html',
  'office-folder-jam.html',
  'loop-sort-fake.html',
  'office-loop-sort.html',
  'hexa-away-fake.html',
  'office-stamp-away.html',
  'hexa-sort-fake.html',
  'office-badge-stack.html',
  'triple-match-fake.html',
  'desk-clutter-triples.html',
  'goods-sort-fake.html',
  'office-snack-stock.html',
];

const canvasExpected = new Set([
  'screw-sorter.html',
  'screw-box-blitz.html',
  'screwdom-fake.html',
  'brainrot-merge-pot.html',
  'brainrot-raider-yard.html',
  'brainrot-egg-run.html',
  'arrow-escape-fake.html',
  'emoji-gator-hop.html',
  'zen-logic-fake.html',
  'marble-sort-fake.html',
  'wool-sort-fake.html',
  'pixel-loop-fake.html',
  'seat-away-fake.html',
  'sheep-stack.html',
  'goose-ladle.html',
  'nostalgia-spotter.html',
  'overtime-blocks.html',
  'clock-out-jam.html',
  'meeting-pinball.html',
  'brainrot-clicker.html',
  'stimulation-fake.html',
  'cattle-bump.html',
  'dino-fake.html',
  'agar-fake.html',
  'snake-battle-fake.html',
  'astro-wheel.html',
  'io-arena-template.html',
  'lunchbox-merge-pot.html',
  'office-pin-pile.html',
  'office-raider-yard.html',
  'courier-arrow-rush.html',
  'office-hop-stack.html',
  'meeting-gridlock.html',
  'milk-tea-sorter.html',
  'office-loom-sort.html',
  'overtime-pixel-loop.html',
  'bus-jam-fake.html',
  'night-shift-shuttle.html',
  'office-seat-scramble.html',
  'parking-jam-fake.html',
  'overtime-carpool-jam.html',
  'traffic-bolt-jam.html',
  'factory-bolt-jam.html',
  'color-block-jam-fake.html',
  'office-folder-jam.html',
  'loop-sort-fake.html',
  'office-loop-sort.html',
  'hexa-away-fake.html',
  'office-stamp-away.html',
  'hexa-sort-fake.html',
  'office-badge-stack.html',
]);

const failures = [];

const runReportPath = path.join(outputDir, 'run_report.json');
if (!fs.existsSync(runReportPath)) {
  failures.push('run_report.json: missing');
} else {
  const report = JSON.parse(fs.readFileSync(runReportPath, 'utf8'));
  if (report.output_format !== 'multi_html') failures.push('run_report.json: output_format must be multi_html');
  if (!Array.isArray(report.files) || report.files.length < expectedFiles.length) {
    failures.push('run_report.json: files list is incomplete');
  }
}

const remixManifestPath = path.join(outputDir, 'remix_manifest.json');
const remixManifestShimPath = path.join(outputDir, 'remix_manifest.js');
const coverDir = path.join(outputDir, 'covers');
if (!fs.existsSync(remixManifestPath)) failures.push('remix_manifest.json: missing');
if (!fs.existsSync(remixManifestShimPath)) failures.push('remix_manifest.js: missing');
if (fs.existsSync(remixManifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(remixManifestPath, 'utf8'));
  if (!Array.isArray(manifest.remixes)) failures.push('remix_manifest.json: remixes must be an array');
}
if (fs.existsSync(remixManifestShimPath)) {
  const shim = fs.readFileSync(remixManifestShimPath, 'utf8');
  if (!shim.includes('window.__PRINTER_REMIX_MANIFEST__')) {
    failures.push('remix_manifest.js: missing global manifest assignment');
  }
}

for (const file of expectedFiles) {
  const fullPath = path.join(outputDir, file);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${file}: missing`);
    continue;
  }

  const html = fs.readFileSync(fullPath, 'utf8');
  if (!html.includes('<!DOCTYPE html>')) failures.push(`${file}: missing doctype`);
  if (!html.includes('<meta name="viewport"')) failures.push(`${file}: missing viewport`);
  if (!html.includes('viewport-fit=cover')) failures.push(`${file}: viewport is not mobile app ready`);
  if (!html.includes('<title>')) failures.push(`${file}: missing title`);
  if (/https?:\/\//i.test(html)) failures.push(`${file}: contains external URL`);
  if (!html.includes('data-printer-artifact="fake-game-library"')) {
    failures.push(`${file}: missing printer artifact marker`);
  }
  if (!html.includes('window.__PRINTER_ARTIFACT__')) {
    failures.push(`${file}: missing printer artifact metadata`);
  }
  if (!html.includes('class="phone-shell"')) {
    failures.push(`${file}: missing portrait phone shell`);
  }

  if (file !== 'index.html') {
    if (!html.includes('window.render_game_to_text')) failures.push(`${file}: missing render_game_to_text`);
    if (!html.includes('window.advanceTime')) failures.push(`${file}: missing advanceTime`);
    if (!html.includes('data-game-page')) failures.push(`${file}: missing game marker`);
    if (!html.includes('touch-action')) failures.push(`${file}: missing touch-action mobile handling`);
    if (canvasExpected.has(file) && !html.includes('<canvas')) {
      failures.push(`${file}: expected canvas-based playfield`);
    }
  } else {
    if (!html.includes('remix_manifest.js')) failures.push('index.html: missing remix manifest shim');
    if (!html.includes('/api/remix/draft')) failures.push('index.html: missing harness draft API integration');
    if (!html.includes('/api/remix/draft-jobs')) failures.push('index.html: missing async harness draft job integration');
    if (!html.includes('/api/remix/publish')) failures.push('index.html: missing harness publish API integration');
    if (!html.includes('/api/fake/draft')) failures.push('index.html: missing from-scratch fake draft API integration');
    if (!html.includes('/api/fake/draft-jobs')) failures.push('index.html: missing async from-scratch fake job integration');
    if (!html.includes('data-fake-create')) failures.push('index.html: missing visible Fake-create action');
    if (!html.includes('openFakePanel')) failures.push('index.html: missing Fake-create modal flow');
    if (!html.includes('supportsFakeCreate: true')) failures.push('index.html: home text state should advertise Fake-create support');
    if (!html.includes('formatRemixError')) failures.push('index.html: missing friendly Remix network error handling');
    if (html.includes("error.message ? error.message : error")) {
      failures.push('index.html: Remix errors should not expose raw Failed to fetch');
    }
    if (!html.includes('id="homeScreen"')) failures.push('index.html: missing waterfall home screen');
    if (!html.includes('class="waterfall"')) failures.push('index.html: missing Xiaohongshu-style waterfall grid');
    if (!/\.home-screen\s*\{[^}]*background:\s*#050505/i.test(html)) {
      failures.push('index.html: waterfall home screen must keep the black visual theme');
    }
    if (!html.includes('data-start-feed')) failures.push('index.html: missing start feed action');
    if (!html.includes('data-open-feed')) failures.push('index.html: waterfall cards must open the swipe feed');
    if (!html.includes('class="water-cover-image"')) {
      failures.push('index.html: waterfall covers must use rendered game screenshots');
    }
    if (!html.includes('"cover":"covers/')) {
      failures.push('index.html: base games must declare rendered cover asset paths');
    }
    if (!html.includes("cover: entry.cover || ('covers/'")) {
      failures.push('index.html: published remixes must derive rendered cover asset paths');
    }
    if (!html.includes("const waterfall = document.getElementById('waterfall')")) {
      failures.push('index.html: waterfall must be addressable for registered remixes');
    }
    if (!html.includes('appendWaterfallCard')) {
      failures.push('index.html: published/remix manifest items must register into the waterfall home');
    }
    if (!html.includes('manifestItems.forEach((item, index) => appendWaterfallCard')) {
      failures.push('index.html: remix_manifest entries must be rendered into the waterfall home on load');
    }
    if (!html.includes('appendWaterfallCard(newItem')) {
      failures.push('index.html: publishing a remix must register the new item into the waterfall home');
    }
    if (!html.includes('id="feedScreen"')) failures.push('index.html: missing swipe feed screen');
    if (!html.includes('id="publishStep"')) failures.push('index.html: missing post-draft naming step');
    if (!html.includes('id="remixName"')) failures.push('index.html: missing simple remix name input');
    if (!html.includes('id="remixProgress"') || !html.includes('id="remixProgressBar"')) {
      failures.push('index.html: Remix generation should show visible progress feedback');
    }
    if (!html.includes('pollDraftJob')) {
      failures.push('index.html: Remix generation should poll backend draft job progress');
    }
    if (html.includes("remixPrompt.value = '';")) {
      failures.push('index.html: opening Remix must not clear the typed adjustment prompt');
    }
    if (!html.includes('remixPromptByFile') || !html.includes("remixPrompt.addEventListener('input'")) {
      failures.push('index.html: Remix prompt text should be preserved per source game');
    }
    if (!html.includes('function isTextEntryTarget')) {
      failures.push('index.html: global keyboard shortcuts must detect text-entry targets');
    }
    if (!html.includes('if (isTextEntryTarget(event.target)) return;')) {
      failures.push('index.html: global keyboard shortcuts must not run while typing in Remix text fields');
    }
    for (const removedId of ['remixTranscript', 'recordStart', 'recordStop', 'audioUpload', 'agentDescription', 'publishSlug']) {
      if (html.includes(`id="${removedId}"`)) failures.push(`index.html: should not expose ${removedId} in simplified remix flow`);
    }
    if (html.includes('feed-tabs') || html.includes('FOR YOU')) {
      failures.push('index.html: feed header tabs should not be rendered');
    }
    if (html.includes('top: -142px') || html.includes('calc(100% + 166px)')) {
      failures.push('index.html: feed iframe must not use crop offsets');
    }
    if (!html.includes('?embed=1')) {
      failures.push('index.html: feed iframes should use explicit embed mode');
    }
    if (!/\.html-frame\s*\{[^}]*pointer-events:\s*auto/i.test(html)) {
      failures.push('index.html: feed iframe previews must be clickable after entering feed');
    }
    if (!html.includes('bridgeFrameGestures')) {
      failures.push('index.html: feed iframe gestures must be bridged back to parent swipe feed');
    }
    const feedIframeSandboxes = [...html.matchAll(/<iframe[^>]*class="html-frame"[^>]*sandbox="([^"]*)"/g)];
    if (!feedIframeSandboxes.length) {
      failures.push('index.html: missing feed iframe sandbox declarations');
    }
    for (const [, sandbox] of feedIframeSandboxes) {
      if (!sandbox.includes('allow-scripts') || !sandbox.includes('allow-same-origin')) {
        failures.push('index.html: feed iframe sandbox must allow scripts and same-origin storage');
        break;
      }
    }
  }
}

if (!fs.existsSync(coverDir)) {
  failures.push('covers: missing rendered cover directory');
} else {
  const pngs = fs.readdirSync(coverDir).filter((file) => file.endsWith('.png'));
  if (pngs.length < 3) failures.push('covers: expected rendered PNG cover assets');
}

if (failures.length) {
  console.error('Fake library verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Fake library verification passed: ${expectedFiles.length} HTML files checked.`);
