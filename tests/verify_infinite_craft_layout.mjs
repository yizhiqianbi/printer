import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

function resolveOutputFile(file) {
  const candidates = [
    path.resolve('printer/output', file),
    path.resolve('output', file),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(`${file}: not found in printer/output or output`);
  }
  return found;
}

async function loadChromium() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
    process.env.HOME
      ? pathToFileURL(path.join(process.env.HOME, '.codex/skills/develop-web-game/node_modules/playwright/index.mjs')).href
      : null,
  ].filter(Boolean);

  const errors = [];
  for (const candidate of candidates) {
    try {
      const mod = await import(candidate);
      if (mod.chromium) return mod.chromium;
    } catch (error) {
      errors.push(`${candidate}: ${error.message}`);
    }
  }

  throw new Error(`Playwright is required for layout verification.\n${errors.join('\n')}`);
}

const outputFile = resolveOutputFile('infinite-craft-fake.html');
const chromium = await loadChromium();
const failures = [];

function inspectLayout() {
  const read = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      selector,
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      scrollLeft: el.scrollLeft,
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
      text: (el.textContent || '').trim().slice(0, 80),
    };
  };

  return {
    viewportWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    shell: read('.phone-shell'),
    stage: read('.game-stage'),
    craftMachine: read('.craft-machine'),
    slots: read('.slots'),
    toolbar: read('.craft-toolbar'),
    log: read('#craftLog'),
    stats: read('.craft-stats'),
    field: read('.field-label'),
    input: read('#searchInput'),
    pool: read('#pool'),
    state: window.render_game_to_text ? JSON.parse(window.render_game_to_text()) : null,
  };
}

function checkMetrics(name, metrics) {
  const tolerance = 2;
  const shell = metrics.shell;
  if (!shell) {
    failures.push(`${name}: missing .phone-shell`);
    return;
  }

  if (metrics.documentScrollWidth > metrics.viewportWidth + tolerance) {
    failures.push(`${name}: document scrollWidth ${metrics.documentScrollWidth} exceeds viewport ${metrics.viewportWidth}`);
  }
  if (metrics.bodyScrollWidth > metrics.viewportWidth + tolerance) {
    failures.push(`${name}: body scrollWidth ${metrics.bodyScrollWidth} exceeds viewport ${metrics.viewportWidth}`);
  }
  if (shell.scrollWidth > shell.clientWidth + tolerance) {
    failures.push(`${name}: phone shell scrollWidth ${shell.scrollWidth} exceeds clientWidth ${shell.clientWidth}`);
  }
  if (shell.scrollLeft > tolerance) {
    failures.push(`${name}: phone shell scrolled horizontally to ${shell.scrollLeft}`);
  }

  for (const box of [
    metrics.stage,
    metrics.craftMachine,
    metrics.slots,
    metrics.toolbar,
    metrics.log,
    metrics.stats,
    metrics.field,
    metrics.input,
    metrics.pool,
  ]) {
    if (!box) continue;
    if (box.width > shell.clientWidth + tolerance) {
      failures.push(`${name}: ${box.selector} rendered ${box.width}px wide inside ${shell.clientWidth}px shell`);
    }
    if (box.left < shell.left - tolerance || box.right > shell.right + tolerance) {
      failures.push(`${name}: ${box.selector} bounds [${box.left}, ${box.right}] escape shell [${shell.left}, ${shell.right}]`);
    }
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'narrow-320', width: 320, height: 640 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: true,
    });
    await page.goto(pathToFileURL(outputFile).href, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(100);

    for (let i = 0; i < 16; i++) {
      await page.click('#stewBtn');
    }
    await page.waitForTimeout(100);

    const metrics = await page.evaluate(inspectLayout);
    checkMetrics(viewport.name, metrics);
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('Infinite craft layout verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Infinite craft layout verification passed.');
