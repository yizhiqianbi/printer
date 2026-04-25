import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadPlaywright() {
  try {
    const mod = await import('playwright');
    return mod.default || mod;
  } catch {
    const fallback = path.join(
      process.env.HOME || '/Users/pencil',
      '.codex/skills/develop-web-game/node_modules/playwright/index.js',
    );
    const mod = await import(pathToFileURL(fallback).href);
    return mod.default || mod;
  }
}

const outputDir = path.resolve('printer/output');
const coversDir = path.join(outputDir, 'covers');
fs.mkdirSync(coversDir, { recursive: true });

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function coverNameFor(file) {
  return path.basename(file, '.html') + '.png';
}

function collectItems() {
  const fakeManifest = readJson(path.join(outputDir, 'fake_manifest.json'), { games: [] });
  const remixManifest = readJson(path.join(outputDir, 'remix_manifest.json'), { remixes: [] });
  const seen = new Set();
  const items = [];
  for (const item of [...(fakeManifest.games || []), ...(remixManifest.remixes || [])]) {
    if (!item.file || seen.has(item.file)) continue;
    seen.add(item.file);
    items.push(item);
  }
  return items;
}

async function renderCover(page, item) {
  const htmlPath = path.join(outputDir, item.file);
  if (!fs.existsSync(htmlPath)) return null;
  const target = path.join(coversDir, coverNameFor(item.file));
  const url = pathToFileURL(htmlPath).href + '?cover=1';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.phone-shell', { timeout: 5000 });
  await page.evaluate(() => {
    if (typeof window.advanceTime === 'function') window.advanceTime(900);
  });
  await page.waitForTimeout(260);
  const shell = page.locator('.phone-shell').first();
  await shell.screenshot({ path: target, type: 'png' });
  return target;
}

async function main() {
  const items = collectItems();
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 760 }, deviceScaleFactor: 1 });
  const rendered = [];
  try {
    for (const item of items) {
      try {
        const file = await renderCover(page, item);
        if (file) rendered.push(path.relative(outputDir, file));
      } catch (error) {
        console.warn(`cover render failed for ${item.file}: ${error.message}`);
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`Rendered ${rendered.length} covers into ${coversDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
