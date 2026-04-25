import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const outputDir = path.resolve('printer/output');
const failures = [];

function html(file) {
  return fs.readFileSync(path.join(outputDir, file), 'utf8');
}

function requireIncludes(file, tokens) {
  const text = html(file);
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${file}: missing ${token}`);
  }
}

requireIncludes('dino-fake.html', [
  'window.__DINO_DEBUG_CONFIG__',
  'hiScore',
  'bird',
  'clouds',
  'ducking',
]);

requireIncludes('agar-fake.html', [
  'window.__AGAR_DEBUG_CONFIG__',
  'worldWidth',
  'camera',
  'splitCells',
  'ejectMass',
  'leaderboard',
]);

requireIncludes('password-hell.html', [
  'window.__PASSWORD_RULES__',
  'visibleRules',
  'progressive',
  'moonPhase',
  'captcha',
]);

requireIncludes('infinite-craft-fake.html', [
  'window.__CRAFT_RECIPES__',
  'window.__CRAFT_ENGINE__',
  'First Discovery',
  'recipeCache',
  'craftHistory',
  'searchInput',
  'randomStew',
  'makeProceduralResult',
  'pairSpace',
  'depth',
]);

requireIncludes('million-checkboxes-fake.html', [
  'window.__CHECKBOX_DEBUG_CONFIG__',
  'personalChecked',
  'globalChecked',
  'remotePulse',
  'coloredOutlines',
]);

requireIncludes('garden-idle.html', [
  'window.__GARDEN_DEBUG_CONFIG__',
  'stageFor',
  'mutation',
  'stockTimer',
  'rarity',
]);

requireIncludes('brainrot-clicker.html', [
  'window.__BRAINROT_DEBUG_CONFIG__',
  'floatingWords',
  'upgradeEffects',
  'drawMascot',
]);

requireIncludes('stimulation-fake.html', [
  'window.__STIM_DEBUG_CONFIG__',
  'modules',
  'chaosLevel',
  'drawModule',
]);

requireIncludes('io-arena-template.html', [
  'window.__IO_TEMPLATE__',
  'controlScheme',
  'weaponDrops',
  'spawnBot',
  'drawJoystick',
  'applyArenaSkin',
  'leaderboard',
]);

if (failures.length) {
  console.error('Game alignment verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Game alignment verification passed.');
