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

requireIncludes('emoji-gator-hop.html', [
  'window.__EMOJI_HOPPER_DEBUG__',
  'autoBounce',
  'fragilePlatforms',
  'skeletonPlatforms',
  'emojiBoosts',
  'cameraY',
]);

requireIncludes('nostalgia-spotter.html', [
  'window.__NOSTALGIA_SPOTTER__',
  'differenceCount',
  'mistakes',
  'scanlinePhase',
  'foundOrder',
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

requireIncludes('qingjiao-sim.html', [
  'window.__QINGJIAO_SIM__',
  'disciplineSelect',
  'quarterActions',
  'students',
  'funding',
  'papers',
  'mindset',
  'promotionTrack',
]);

requireIncludes('life-restart-fake.html', [
  'window.__LIFE_RESTART_SIM__',
  'talentPool',
  'allocatePoints',
  'eventTimeline',
  'lifespan',
  'summaryRank',
  'restartLife',
]);

requireIncludes('twitter-governance.html', [
  'window.__TWITTER_GOVERNANCE_SIM__',
  'OpenRouter',
  'speechRecognition',
  'newsAgentLoop',
  'tweetComposer',
  'commandPanel',
  'advisorRoster',
  'sendTweet',
  'issueOrder',
  'newsFeed',
  'xTopTabs',
  'forYouTab',
  'xTimeline',
  'bottomNav',
  'floatingCompose',
]);

if (failures.length) {
  console.error('Game alignment verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Game alignment verification passed.');
