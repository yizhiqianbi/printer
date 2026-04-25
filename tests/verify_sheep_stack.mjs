import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const htmlPath = path.resolve('printer/output/sheep-stack.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const failures = [];

if (!html.includes('drawTileIcon')) {
  failures.push('sheep-stack: missing canvas icon drawing function');
}
if (!html.includes('window.__SHEEP_DEBUG_LEVEL__')) {
  failures.push('sheep-stack: missing debug level metadata');
}

const match = html.match(/window\.__SHEEP_DEBUG_LEVEL__\s*=\s*(\{.*?\});/s);
if (match) {
  const level = JSON.parse(match[1]);
  const { tiles, tileWidth, tileHeight } = level;
  if (!Array.isArray(tiles) || tiles.length === 0) failures.push('sheep-stack: debug tiles missing');
  if (tiles.length % 3 !== 0) failures.push(`sheep-stack: tile count ${tiles.length} is not divisible by 3`);

  const iconCounts = new Map();
  const exactPositions = new Set();
  let exactOverlapCount = 0;
  for (const tile of tiles) {
    iconCounts.set(tile.icon, (iconCounts.get(tile.icon) || 0) + 1);
    const key = `${tile.x},${tile.y}`;
    if (exactPositions.has(key)) exactOverlapCount += 1;
    exactPositions.add(key);
  }
  if (exactOverlapCount > 0) failures.push(`sheep-stack: ${exactOverlapCount} tiles have exact overlapping coordinates`);
  for (const [icon, count] of iconCounts) {
    if (count % 3 !== 0) failures.push(`sheep-stack: icon ${icon} count ${count} is not a multiple of 3`);
  }

  const rect = (tile) => ({ left: tile.x, top: tile.y, right: tile.x + tileWidth, bottom: tile.y + tileHeight });
  const overlaps = (a, b) => {
    const ra = rect(a);
    const rb = rect(b);
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
    const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    return w > 0 && h > 0;
  };
  const isFree = (tile) => !tiles.some((other) => other.z > tile.z && overlaps(tile, other));
  const freeCount = tiles.filter(isFree).length;
  const coveredCount = tiles.length - freeCount;
  const maxZ = Math.max(...tiles.map((tile) => tile.z));
  const topLayerIconTypes = new Set(tiles.filter((tile) => tile.z === maxZ).map((tile) => tile.icon)).size;
  const topLayerBlocked = tiles.some((tile) => tile.z === maxZ && !isFree(tile));

  if (freeCount < 4) failures.push(`sheep-stack: too few free tiles (${freeCount})`);
  if (coveredCount < 12) failures.push(`sheep-stack: too few covered tiles (${coveredCount})`);
  if (topLayerIconTypes < 4) failures.push(`sheep-stack: top layer only has ${topLayerIconTypes} icon types`);
  if (topLayerBlocked) failures.push('sheep-stack: top layer contains blocked tiles');
}

if (failures.length) {
  console.error('Sheep stack verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Sheep stack verification passed.');
