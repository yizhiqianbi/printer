import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve('printer/output');
fs.mkdirSync(outputDir, { recursive: true });

const generatedAt = new Date().toISOString();
const intent = '建立移动端竖屏 Playable Catalog：按热门小游戏机制生成离线 HTML，保留交互、节奏和传播点，不复制原站代码或素材。';

const coverForFile = (file) => 'covers/' + path.basename(file, '.html') + '.png';

const pipelinePlan = {
  summary: '基于游戏参考意图生成移动端竖屏多页面 Playable Catalog',
  ui_requirements: [
    '所有游戏优先适配手机竖屏，桌面端居中显示手机 shell',
    '动作和实时反馈类游戏使用 canvas playfield',
    '每个产物必须自包含、无外链、可双击打开',
  ],
  technical_requirements: [
    '每个游戏暴露 window.render_game_to_text()',
    '每个游戏暴露 window.advanceTime(ms)',
    '输出 run_report.json 模拟 WebPrinterPipeline 的执行摘要',
  ],
  complexity_bias: 18,
  output_hint: 'multi_html',
  confidence: 0.82,
  requires_interactivity: true,
  interaction_features: ['触摸操作', 'Canvas 游戏循环', '本地状态管理', '移动端竖屏布局'],
};

function createSheepLevel() {
  const tileWidth = 56;
  const tileHeight = 46;
  const icons = ['bag', 'tea', 'melon', 'shoe', 'cake', 'fish'];
  const deck = [];
  for (let round = 0; round < 9; round++) {
    const offset = (round * 2) % icons.length;
    for (let i = 0; i < icons.length; i++) {
      deck.push(icons[(i + offset) % icons.length]);
    }
  }

  const slots = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      slots.push({ x: 27 + col * 70, y: 62 + row * 54, z: 0 });
    }
  }
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      slots.push({ x: 62 + col * 70, y: 108 + row * 64, z: 1 });
    }
  }
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      slots.push({ x: 76 + col * 70, y: 188 + row * 82, z: 2 });
    }
  }

  return {
    tileWidth,
    tileHeight,
    tiles: slots.map((slot, index) => ({ id: index, icon: deck[index], ...slot })),
  };
}

const sheepLevel = createSheepLevel();

function createGooseLevel() {
  const tileWidth = 56;
  const tileHeight = 46;
  const icons = ['keyboard', 'coffee', 'badge', 'mail', 'mouse', 'battery'];
  const deck = [];
  for (let round = 0; round < 9; round++) {
    const offset = (round * 3) % icons.length;
    for (let i = 0; i < icons.length; i++) {
      deck.push(icons[(i + offset) % icons.length]);
    }
  }

  const slots = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      slots.push({ x: 28 + col * 68, y: 92 + row * 48, z: 0 });
    }
  }
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      slots.push({ x: 62 + col * 68, y: 136 + row * 60, z: 1 });
    }
  }
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      slots.push({ x: 76 + col * 64, y: 216 + row * 74, z: 2 });
    }
  }

  return {
    tileWidth,
    tileHeight,
    slots,
    goose: { x: 147, y: 240, radius: 44 },
    tiles: slots.map((slot, index) => ({ id: index, icon: deck[index], ...slot })),
  };
}

const gooseLevel = createGooseLevel();

function createScrewLevel() {
  const plates = [
    { id: 'base', x: 54, y: 248, w: 282, h: 168, layer: 0, fill: '#39445f', edge: '#6f7ca0', label: '主板' },
    { id: 'right', x: 194, y: 138, w: 132, h: 136, layer: 1, fill: '#5a4351', edge: '#b38399', label: '夹板' },
    { id: 'left', x: 70, y: 96, w: 152, h: 126, layer: 2, fill: '#4d5b35', edge: '#97bf63', label: '压条' },
  ];
  const screws = [
    { id: 0, x: 112, y: 134, color: 'pink', layer: 2, plate: 'left' },
    { id: 1, x: 180, y: 152, color: 'cyan', layer: 2, plate: 'left' },
    { id: 2, x: 146, y: 204, color: 'amber', layer: 2, plate: 'left' },
    { id: 3, x: 222, y: 170, color: 'pink', layer: 1, plate: 'right' },
    { id: 4, x: 294, y: 184, color: 'lime', layer: 1, plate: 'right' },
    { id: 5, x: 250, y: 252, color: 'amber', layer: 1, plate: 'right' },
    { id: 6, x: 98, y: 286, color: 'cyan', layer: 0, plate: 'base' },
    { id: 7, x: 172, y: 304, color: 'lime', layer: 0, plate: 'base' },
    { id: 8, x: 258, y: 296, color: 'pink', layer: 0, plate: 'base' },
    { id: 9, x: 120, y: 374, color: 'amber', layer: 0, plate: 'base' },
    { id: 10, x: 214, y: 362, color: 'cyan', layer: 0, plate: 'base' },
    { id: 11, x: 298, y: 384, color: 'lime', layer: 0, plate: 'base' },
  ];
  return { plates, screws, screwRadius: 21 };
}

const screwLevel = createScrewLevel();

function createScrewGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    trayLabel: config.trayLabel,
    winCopy: config.winCopy,
    loseCopy: config.loseCopy,
    statusNoun: config.statusNoun,
    plateAccent: config.plateAccent,
    backA: config.backA,
    backB: config.backB,
    backC: config.backC,
    colors: config.colors,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '拧螺丝',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="tray" id="tray"></div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">重开这一板</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const LEVEL = ${JSON.stringify(screwLevel)};
      const THEME = ${JSON.stringify(theme)};
      const colorMeta = THEME.colors;
      const state = { screws: [], tray: [], mode: 'playing', removed: 0 };
      function plateById(id) {
        return LEVEL.plates.find((plate) => plate.id === id);
      }
      function plateVisible(id) {
        return state.screws.some((screw) => screw.active && screw.plate === id);
      }
      function pointInPlate(point, plate) {
        return point.x >= plate.x && point.x <= plate.x + plate.w && point.y >= plate.y && point.y <= plate.y + plate.h;
      }
      function free(screw) {
        if (!screw.active || state.mode !== 'playing') return false;
        return !state.screws.some((other) => {
          if (!other.active || other.layer <= screw.layer) return false;
          const otherPlate = plateById(other.plate);
          return otherPlate ? pointInPlate(screw, otherPlate) : false;
        });
      }
      function reset() {
        state.screws = LEVEL.screws.map((screw) => ({ ...screw, active: true, spin: 0 }));
        state.tray = [];
        state.mode = 'playing';
        state.removed = 0;
        render();
      }
      function resolveTriples(color) {
        const count = state.tray.filter((item) => item === color).length;
        if (count < 3) return false;
        let removed = 0;
        state.tray = state.tray.filter((item) => {
          if (item === color && removed < 3) {
            removed += 1;
            return false;
          }
          return true;
        });
        state.removed += 3;
        return true;
      }
      function pick(screw) {
        if (!screw || !free(screw)) return;
        screw.active = false;
        screw.spin = 1;
        state.tray.push(screw.color);
        resolveTriples(screw.color);
        if (state.screws.every((item) => !item.active)) state.mode = 'won';
        if (state.mode !== 'won' && state.tray.length >= 6) state.mode = 'lost';
        render();
      }
      function pointer(event) {
        const box = canvas.getBoundingClientRect();
        const x = (event.clientX - box.left) * canvas.width / box.width;
        const y = (event.clientY - box.top) * canvas.height / box.height;
        const target = state.screws
          .filter((screw) => screw.active && Math.hypot(x - screw.x, y - screw.y) <= LEVEL.screwRadius + 6)
          .sort((a, b) => b.layer - a.layer)[0];
        pick(target);
      }
      function drawPlate(plate) {
        if (!plateVisible(plate.id)) return;
        const offset = plate.layer * 8;
        ctx.fillStyle = plate.fill;
        ctx.strokeStyle = plate.edge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(plate.x, plate.y - offset, plate.w, plate.h, 22);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.fillRect(plate.x + 16, plate.y + 14 - offset, plate.w - 32, 10);
        ctx.fillStyle = THEME.plateAccent;
        ctx.font = '900 12px sans-serif';
        ctx.fillText(plate.label, plate.x + 16, plate.y + 34 - offset);
      }
      function drawScrew(screw) {
        if (!screw.active) return;
        const meta = colorMeta[screw.color];
        const enabled = free(screw);
        const depthOffset = screw.layer * 8;
        ctx.save();
        ctx.translate(screw.x, screw.y - depthOffset);
        ctx.fillStyle = enabled ? meta.fill : '#4e4b56';
        ctx.strokeStyle = enabled ? '#ffffff' : '#29262d';
        ctx.lineWidth = enabled ? 3 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, LEVEL.screwRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = enabled ? '#17131c' : '#1d1a20';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(8, 8);
        ctx.moveTo(8, -8);
        ctx.lineTo(-8, 8);
        ctx.stroke();
        ctx.fillStyle = enabled ? '#fff' : 'rgba(255,255,255,.42)';
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(meta.label, 0, 4);
        ctx.restore();
      }
      function render() {
        ctx.fillStyle = THEME.backA;
        ctx.fillRect(0, 0, 390, 560);
        const sky = ctx.createLinearGradient(0, 0, 0, 240);
        sky.addColorStop(0, THEME.backB);
        sky.addColorStop(1, THEME.backC);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 390, 240);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.beginPath();
        ctx.roundRect(18, 18, 354, 62, 22);
        ctx.fill();
        ctx.fillStyle = '#fff8ef';
        ctx.font = '900 28px sans-serif';
        ctx.fillText(THEME.heading, 30, 54);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 13px sans-serif';
        ctx.fillText(THEME.subheading, 30, 74);
        LEVEL.plates.slice().sort((a, b) => a.layer - b.layer).forEach(drawPlate);
        state.screws.slice().sort((a, b) => a.layer - b.layer).forEach(drawScrew);
        document.getElementById('tray').innerHTML = Array.from({ length: 6 }, (_, i) => {
          const color = state.tray[i];
          return '<span>' + (color ? colorMeta[color].glyph : '') + '</span>';
        }).join('');
        const freeCount = state.screws.filter(free).length;
        const topLayer = state.screws.filter((screw) => screw.active).reduce((max, screw) => Math.max(max, screw.layer), -1);
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? THEME.winCopy
          : state.mode === 'lost'
            ? THEME.loseCopy
            : '可拆 ' + freeCount + ' 枚 · 当前顶层 L' + Math.max(0, topLayer) + ' · 已收 ' + state.removed + ' · ' + THEME.statusNoun + '槽 ' + state.tray.length + '/6';
      }
      canvas.addEventListener('pointerdown', pointer);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 layered screw board',
        mode: state.mode,
        tray: state.tray,
        removed: state.removed,
        free: state.screws.filter(free).length,
        remaining: state.screws.filter((screw) => screw.active).length,
        visible_plates: LEVEL.plates.filter((plate) => plateVisible(plate.id)).map((plate) => plate.id)
      });
    `,
  };
}

const screwBaseGame = createScrewGame({
  id: 'screw-sorter',
  file: 'screw-sorter.html',
  title: '打个螺丝局',
  sourceGame: '打个螺丝 / 一起拧螺丝式层叠拆卸排序',
  accent: '#ffb11c',
  summary: '先拆上层彩钉，再把同色螺丝凑进盒里，盒满就卡关。',
  heading: '打个螺丝局',
  subheading: '热门拧钉复刻 · 先拆遮挡层，再凑三枚同色',
  trayLabel: '收纳盒',
  winCopy: '你把整板螺丝拆空了，工位终于不再乱响。',
  loseCopy: '收纳盒塞满了，螺丝还卡在板上。',
  statusNoun: '收纳',
  plateAccent: '#ffd781',
  backA: '#120d12',
  backB: '#34201b',
  backC: '#16131f',
  colors: {
    pink: { fill: '#ff5d8f', label: '粉', glyph: '粉' },
    cyan: { fill: '#42d7ff', label: '蓝', glyph: '蓝' },
    amber: { fill: '#ffc145', label: '黄', glyph: '黄' },
    lime: { fill: '#91d64d', label: '绿', glyph: '绿' },
  },
});

const screwRemixGame = createScrewGame({
  id: 'night-shift-screws',
  file: 'night-shift-screws.html',
  title: '夜班拆钉台',
  sourceGame: '打个螺丝局 Remix',
  accent: '#00d0ff',
  summary: '把螺丝板改成夜班工牌台，节奏更硬，颜色更冷。',
  heading: '夜班拆钉台',
  subheading: '二创版 · 工牌压板、键帽挡片、冷光收纳盒',
  trayLabel: '夜班盒',
  winCopy: '夜班台面被你拆到见底，最后一颗钉也归档了。',
  loseCopy: '夜班盒爆了，工牌和键帽还压着底板。',
  statusNoun: '夜班',
  plateAccent: '#8ceaff',
  backA: '#071018',
  backB: '#0e2842',
  backC: '#090a12',
  colors: {
    pink: { fill: '#ff6dbe', label: '卡', glyph: '卡' },
    cyan: { fill: '#52e3ff', label: '键', glyph: '键' },
    amber: { fill: '#ffd05f', label: '灯', glyph: '灯' },
    lime: { fill: '#87e364', label: '章', glyph: '章' },
  },
});

function createScrewBoxGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    winCopy: config.winCopy,
    loseCopy: config.loseCopy,
    statusNoun: config.statusNoun,
    plateAccent: config.plateAccent,
    backA: config.backA,
    backB: config.backB,
    backC: config.backC,
    colors: config.colors,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '彩盒拆钉',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact stack">
        <div class="box-grid" id="boxGrid"></div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">重开这一局</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const LEVEL = ${JSON.stringify(screwLevel)};
      const THEME = ${JSON.stringify(theme)};
      const colorMeta = THEME.colors;
      const colorOrder = Object.keys(colorMeta);
      const state = { screws: [], bins: {}, mode: 'playing', removed: 0 };
      function plateById(id) {
        return LEVEL.plates.find((plate) => plate.id === id);
      }
      function plateVisible(id) {
        return state.screws.some((screw) => screw.active && screw.plate === id);
      }
      function pointInPlate(point, plate) {
        return point.x >= plate.x && point.x <= plate.x + plate.w && point.y >= plate.y && point.y <= plate.y + plate.h;
      }
      function free(screw) {
        if (!screw.active || state.mode !== 'playing') return false;
        return !state.screws.some((other) => {
          if (!other.active || other.layer <= screw.layer) return false;
          const otherPlate = plateById(other.plate);
          return otherPlate ? pointInPlate(screw, otherPlate) : false;
        });
      }
      function totalPending() {
        return colorOrder.reduce((sum, color) => sum + state.bins[color], 0);
      }
      function reset() {
        state.screws = LEVEL.screws.map((screw) => ({ ...screw, active: true }));
        state.bins = Object.fromEntries(colorOrder.map((color) => [color, 0]));
        state.mode = 'playing';
        state.removed = 0;
        render();
      }
      function pick(screw) {
        if (!screw || !free(screw)) return;
        screw.active = false;
        state.bins[screw.color] += 1;
        if (state.bins[screw.color] >= 3) {
          state.bins[screw.color] = 0;
          state.removed += 3;
        }
        if (state.screws.every((item) => !item.active) && totalPending() === 0) {
          state.mode = 'won';
        } else if (totalPending() >= 6) {
          state.mode = 'lost';
        }
        render();
      }
      function pointer(event) {
        const box = canvas.getBoundingClientRect();
        const x = (event.clientX - box.left) * canvas.width / box.width;
        const y = (event.clientY - box.top) * canvas.height / box.height;
        const target = state.screws
          .filter((screw) => screw.active && Math.hypot(x - screw.x, y - screw.y) <= LEVEL.screwRadius + 6)
          .sort((a, b) => b.layer - a.layer)[0];
        pick(target);
      }
      function drawPlate(plate) {
        if (!plateVisible(plate.id)) return;
        const offset = plate.layer * 8;
        ctx.fillStyle = plate.fill;
        ctx.strokeStyle = plate.edge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(plate.x, plate.y - offset, plate.w, plate.h, 22);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.fillRect(plate.x + 16, plate.y + 14 - offset, plate.w - 32, 10);
        ctx.fillStyle = THEME.plateAccent;
        ctx.font = '900 12px sans-serif';
        ctx.fillText(plate.label, plate.x + 16, plate.y + 34 - offset);
      }
      function drawScrew(screw) {
        if (!screw.active) return;
        const meta = colorMeta[screw.color];
        const enabled = free(screw);
        const depthOffset = screw.layer * 8;
        ctx.save();
        ctx.translate(screw.x, screw.y - depthOffset);
        ctx.fillStyle = enabled ? meta.fill : '#4e4b56';
        ctx.strokeStyle = enabled ? '#ffffff' : '#29262d';
        ctx.lineWidth = enabled ? 3 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, LEVEL.screwRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = enabled ? '#17131c' : '#1d1a20';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(8, 8);
        ctx.moveTo(8, -8);
        ctx.lineTo(-8, 8);
        ctx.stroke();
        ctx.fillStyle = enabled ? '#fff' : 'rgba(255,255,255,.42)';
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(meta.label, 0, 4);
        ctx.restore();
      }
      function renderBoxes() {
        document.getElementById('boxGrid').innerHTML = colorOrder.map((color) => {
          const meta = colorMeta[color];
          const count = state.bins[color];
          const slots = Array.from({ length: 3 }, (_, index) => '<i style="opacity:' + (index < count ? '1' : '.18') + '">' + meta.glyph + '</i>').join('');
          return '<div class="color-box" style="--box-fill:' + meta.fill + '"><b>' + meta.label + '盒</b><span>' + slots + '</span></div>';
        }).join('');
      }
      function render() {
        ctx.fillStyle = THEME.backA;
        ctx.fillRect(0, 0, 390, 560);
        const sky = ctx.createLinearGradient(0, 0, 0, 240);
        sky.addColorStop(0, THEME.backB);
        sky.addColorStop(1, THEME.backC);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 390, 240);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.beginPath();
        ctx.roundRect(18, 18, 354, 62, 22);
        ctx.fill();
        ctx.fillStyle = '#fff8ef';
        ctx.font = '900 28px sans-serif';
        ctx.fillText(THEME.heading, 30, 54);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 13px sans-serif';
        ctx.fillText(THEME.subheading, 30, 74);
        LEVEL.plates.slice().sort((a, b) => a.layer - b.layer).forEach(drawPlate);
        state.screws.slice().sort((a, b) => a.layer - b.layer).forEach(drawScrew);
        renderBoxes();
        const freeCount = state.screws.filter(free).length;
        const topLayer = state.screws.filter((screw) => screw.active).reduce((max, screw) => Math.max(max, screw.layer), -1);
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? THEME.winCopy
          : state.mode === 'lost'
            ? THEME.loseCopy
            : '可拆 ' + freeCount + ' 枚 · 当前顶层 L' + Math.max(0, topLayer) + ' · 已归档 ' + state.removed + ' · ' + THEME.statusNoun + '待满 ' + totalPending() + '/6';
      }
      canvas.addEventListener('pointerdown', pointer);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 layered screw board with color boxes',
        mode: state.mode,
        bins: state.bins,
        removed: state.removed,
        free: state.screws.filter(free).length,
        remaining: state.screws.filter((screw) => screw.active).length,
        visible_plates: LEVEL.plates.filter((plate) => plateVisible(plate.id)).map((plate) => plate.id)
      });
    `,
  };
}

const screwBoxBaseGame = createScrewBoxGame({
  id: 'screw-box-blitz',
  file: 'screw-box-blitz.html',
  title: '彩盒拧钉局',
  sourceGame: '一起拧螺丝 / 无敌螺丝王式同色彩盒拆钉',
  accent: '#65d2ff',
  summary: '先拆上层，再把同色螺丝塞进对应彩盒，三枚凑满立刻清盒。',
  heading: '彩盒拧钉局',
  subheading: '热门拆钉复刻 · 同色进同盒，凑满三枚马上清空',
  winCopy: '四个彩盒都被你喂顺了，这块压板终于整片脱落。',
  loseCopy: '待满螺丝卡到六格上限，彩盒节奏断了。',
  statusNoun: '彩盒',
  plateAccent: '#d5f2ff',
  backA: '#081017',
  backB: '#133552',
  backC: '#0a1018',
  colors: {
    pink: { fill: '#ff6e98', label: '粉', glyph: '粉' },
    cyan: { fill: '#4fddff', label: '蓝', glyph: '蓝' },
    amber: { fill: '#ffd36a', label: '黄', glyph: '黄' },
    lime: { fill: '#91e36e', label: '绿', glyph: '绿' },
  },
});

const screwBoxRemixGame = createScrewBoxGame({
  id: 'parcel-screw-boxes',
  file: 'parcel-screw-boxes.html',
  title: '分拨拆钉台',
  sourceGame: '彩盒拧钉局 Remix',
  accent: '#ffb347',
  summary: '把彩盒拆钉改成快递分拨台主题，颜色盒换成四个包裹框。',
  heading: '分拨拆钉台',
  subheading: '二创版 · 包裹框吃同色封签，三张凑满立刻出库',
  winCopy: '这一车封签全被分拨完了，压板和包材一并清空。',
  loseCopy: '包裹框先堵住了，后面的封签全压在台面上。',
  statusNoun: '分拨框',
  plateAccent: '#ffe1a7',
  backA: '#181008',
  backB: '#4d2a13',
  backC: '#16100a',
  colors: {
    pink: { fill: '#ff8ca8', label: '急', glyph: '急' },
    cyan: { fill: '#72d7ff', label: '蓝', glyph: '蓝' },
    amber: { fill: '#ffc660', label: '黄', glyph: '黄' },
    lime: { fill: '#a5da67', label: '绿', glyph: '绿' },
  },
});

function createScrewdomGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    hint: config.hint,
    selectCopy: config.selectCopy,
    sendCopy: config.sendCopy,
    clearCopy: config.clearCopy,
    winCopy: config.winCopy,
    loseCopy: config.loseCopy,
    blockedCopy: config.blockedCopy,
    pinLabel: config.pinLabel,
    boxLabel: config.boxLabel,
    bgA: config.bgA,
    bgB: config.bgB,
    bgC: config.bgC,
    rod: config.rod,
    pinPlate: config.pinPlate,
    colors: config.colors,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '针位拆钉',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact stack">
        <div class="box-grid" id="boxGrid"></div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">重开这一盘</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const LEVEL = ${JSON.stringify(config.level)};
      const THEME = ${JSON.stringify(theme)};
      const colorOrder = Object.keys(THEME.colors);
      const state = {
        pins: [],
        bins: Object.fromEntries(colorOrder.map((color) => [color, 0])),
        selected: null,
        mode: 'playing',
        removed: 0,
        note: THEME.hint,
      };
      function clonePins() {
        return LEVEL.pins.map((pin) => ({ ...pin, stack: pin.stack.slice() }));
      }
      function totalPending() {
        return colorOrder.reduce((sum, color) => sum + state.bins[color], 0);
      }
      function pinRect(pin) {
        return { x: pin.x - 24, y: 116, w: 48, h: 276 };
      }
      function screwCenter(pin, indexFromBottom) {
        return { x: pin.x, y: 348 - indexFromBottom * 48 };
      }
      function topColor(pin) {
        return pin.stack.length ? pin.stack[pin.stack.length - 1] : null;
      }
      function topCenter(pin) {
        const color = topColor(pin);
        if (!color) return null;
        return screwCenter(pin, pin.stack.length - 1);
      }
      function reset() {
        state.pins = clonePins();
        state.bins = Object.fromEntries(colorOrder.map((color) => [color, 0]));
        state.selected = null;
        state.mode = 'playing';
        state.removed = 0;
        state.note = THEME.hint;
        render();
      }
      function activeTopCount() {
        return state.pins.filter((pin) => pin.stack.length).length;
      }
      function pick(pinIndex) {
        if (state.mode !== 'playing') return;
        const pin = state.pins[pinIndex];
        if (!pin || !pin.stack.length) return;
        const color = topColor(pin);
        if (state.selected === pinIndex) {
          pin.stack.pop();
          state.bins[color] += 1;
          state.removed += 1;
          state.selected = null;
          if (state.bins[color] >= 3) {
            state.bins[color] = 0;
            state.note = THEME.colors[color].label + THEME.clearCopy;
          } else {
            state.note = pin.label + THEME.sendCopy.replace('{color}', THEME.colors[color].label);
          }
          if (state.pins.every((item) => item.stack.length === 0) && totalPending() === 0) {
            state.mode = 'won';
            state.note = THEME.winCopy;
          } else if (totalPending() >= 6) {
            state.mode = 'lost';
            state.note = THEME.loseCopy;
          }
        } else {
          state.selected = pinIndex;
          state.note = pin.label + THEME.selectCopy.replace('{color}', THEME.colors[color].label);
        }
        render();
      }
      function pinFromPoint(point) {
        return state.pins.findIndex((pin) => {
          const center = topCenter(pin);
          if (!center) return false;
          return Math.hypot(point.x - center.x, point.y - center.y) <= 24;
        });
      }
      function pointFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height,
        };
      }
      function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, 560);
        gradient.addColorStop(0, THEME.bgA);
        gradient.addColorStop(0.45, THEME.bgB);
        gradient.addColorStop(1, THEME.bgC);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.beginPath();
        ctx.roundRect(18, 18, 354, 62, 22);
        ctx.fill();
        ctx.fillStyle = '#fff8ef';
        ctx.font = '900 28px sans-serif';
        ctx.fillText(THEME.heading, 30, 54);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 13px sans-serif';
        ctx.fillText(THEME.subheading, 30, 74);
      }
      function drawPin(pin, index) {
        const rect = pinRect(pin);
        ctx.fillStyle = THEME.pinPlate;
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y + 246, rect.w, 18, 10);
        ctx.fill();
        ctx.strokeStyle = THEME.rod;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(pin.x, rect.y + 26);
        ctx.lineTo(pin.x, rect.y + 246);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.62)';
        ctx.font = '800 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pin.label, pin.x, 406);
        pin.stack.forEach((color, stackIndex) => {
          const meta = THEME.colors[color];
          const center = screwCenter(pin, stackIndex);
          const selected = state.selected === index && stackIndex === pin.stack.length - 1;
          ctx.fillStyle = meta.fill;
          ctx.strokeStyle = selected ? '#ffffff' : meta.edge;
          ctx.lineWidth = selected ? 4 : 3;
          ctx.beginPath();
          ctx.arc(center.x, center.y, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = 'rgba(16,18,26,.74)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(center.x - 9, center.y);
          ctx.lineTo(center.x + 9, center.y);
          ctx.stroke();
          ctx.fillStyle = '#0d1117';
          ctx.font = '900 10px sans-serif';
          ctx.fillText(meta.glyph, center.x, center.y + 4);
        });
      }
      function renderBoxes() {
        document.getElementById('boxGrid').innerHTML = colorOrder.map((color) => {
          const meta = THEME.colors[color];
          const count = state.bins[color];
          const slots = Array.from({ length: 3 }, (_, index) => '<i style="opacity:' + (index < count ? '1' : '.18') + '">' + meta.glyph + '</i>').join('');
          return '<div class="color-box" style="--box-fill:' + meta.fill + '"><b>' + meta.label + THEME.boxLabel + '</b><span>' + slots + '</span></div>';
        }).join('');
      }
      function render() {
        drawBackground();
        state.pins.forEach(drawPin);
        renderBoxes();
        document.getElementById('statusText').textContent = state.mode === 'playing'
          ? '可拆 ' + activeTopCount() + ' 柱 · 已归 ' + state.removed + ' · 待清 ' + totalPending() + '/6 · ' + state.note
          : state.note;
      }
      canvas.addEventListener('pointerdown', (event) => {
        const pinIndex = pinFromPoint(pointFromEvent(event));
        if (pinIndex >= 0) pick(pinIndex);
        else if (state.mode === 'playing') {
          state.selected = null;
          state.note = THEME.blockedCopy;
          render();
        }
      });
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with five vertical screw pins and four bottom color boxes',
        mode: state.mode,
        selected: state.selected,
        removed: state.removed,
        pending: totalPending(),
        bins: state.bins,
        pins: state.pins.map((pin) => ({ label: pin.label, top: topColor(pin), depth: pin.stack.length })),
      });
    `,
  };
}

const screwdomBaseGame = createScrewdomGame({
  id: 'screwdom-fake',
  file: 'screwdom-fake.html',
  title: '钉柱归箱局',
  sourceGame: 'Screwdom 式针位堆叠拆钉',
  accent: '#86f2ff',
  summary: '盯住每根钉柱的顶层颜色，按顺序拆下并送进同色箱，三枚同色立刻清箱。',
  heading: '钉柱归箱局',
  subheading: 'Screwdom 热门复刻 · 只拆顶层，三枚同色马上清箱',
  hint: '先点顶层钉帽选中，再点同一根柱子把它拆下来；顺序不对会把底部箱位挤爆。',
  selectCopy: ' 顶层这枚是 {color} 钉，再点一次就会入箱。',
  sendCopy: ' 顶层 {color} 钉已经送进归档箱。',
  clearCopy: ' 箱凑满三枚，整箱马上清空。',
  winCopy: '所有钉柱都被你拆顺了，底部归档箱也清空了。',
  loseCopy: '底部待清箱位堆到六格上限，这盘节奏断了。',
  blockedCopy: '只能点每根柱子最上面那枚钉帽。',
  pinLabel: '钉柱',
  boxLabel: '箱',
  bgA: '#08131b',
  bgB: '#103248',
  bgC: '#091018',
  rod: '#a5b4c7',
  pinPlate: 'rgba(255,255,255,.16)',
  colors: {
    cyan: { fill: '#63dcff', edge: '#e0f7ff', label: '蓝', glyph: '蓝' },
    pink: { fill: '#ff7ea7', edge: '#ffe0ea', label: '粉', glyph: '粉' },
    amber: { fill: '#ffcf67', edge: '#fff1c4', label: '黄', glyph: '黄' },
    lime: { fill: '#93e06d', edge: '#e7ffd7', label: '绿', glyph: '绿' },
  },
  level: {
    pins: [
      { x: 58, label: 'A', stack: ['amber', 'cyan', 'pink'] },
      { x: 124, label: 'B', stack: ['lime', 'amber', 'cyan', 'pink'] },
      { x: 195, label: 'C', stack: ['pink', 'lime', 'amber'] },
      { x: 266, label: 'D', stack: ['cyan', 'pink', 'lime', 'amber'] },
      { x: 332, label: 'E', stack: ['amber', 'lime', 'cyan'] },
    ],
  },
});

const screwdomOfficeRemixGame = createScrewdomGame({
  id: 'office-pin-pile',
  file: 'office-pin-pile.html',
  title: '工位夹签归档',
  sourceGame: '钉柱归箱局 Remix',
  accent: '#97f0ff',
  summary: '把钉柱换成工位夹签柱，盯住顶层夹签颜色，三张同部门标签立刻归档。',
  heading: '工位夹签归档',
  subheading: '办公室二创 · 只拆最上层夹签，三张同部门立即归档',
  hint: '先点一根夹签柱顶层标签，再点一次把它送进对应部门框；别让待归标签先把底栏堵住。',
  selectCopy: ' 顶层是 {color} 部门签，再点一次就会归档。',
  sendCopy: ' 顶层 {color} 部门签已经送进归档框。',
  clearCopy: ' 这个部门框凑满三张，已经整框归档。',
  winCopy: '整排工位夹签都已经归档完毕。',
  loseCopy: '待归标签先把底部框位堵满了。',
  blockedCopy: '只能处理每根夹签柱露在最上面的那一张。',
  pinLabel: '夹签柱',
  boxLabel: '框',
  bgA: '#0a1218',
  bgB: '#162b3a',
  bgC: '#091015',
  rod: '#a6b9c8',
  pinPlate: 'rgba(255,255,255,.14)',
  colors: {
    cyan: { fill: '#6fd5ff', edge: '#e2f6ff', label: '研发', glyph: '研' },
    pink: { fill: '#ff8bb4', edge: '#ffe1ec', label: '客服', glyph: '客' },
    amber: { fill: '#f8c86c', edge: '#fff0c2', label: '运营', glyph: '运' },
    lime: { fill: '#9ddd78', edge: '#e9ffd9', label: '行政', glyph: '行' },
  },
  level: {
    pins: [
      { x: 58, label: '工位 A', stack: ['amber', 'cyan', 'pink'] },
      { x: 124, label: '工位 B', stack: ['lime', 'amber', 'cyan', 'pink'] },
      { x: 195, label: '工位 C', stack: ['pink', 'lime', 'amber'] },
      { x: 266, label: '工位 D', stack: ['cyan', 'pink', 'lime', 'amber'] },
      { x: 332, label: '工位 E', stack: ['amber', 'lime', 'cyan'] },
    ],
  },
});

function createMergeDropGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    scoreLabel: config.scoreLabel,
    queueLabel: config.queueLabel,
    winLabel: config.winLabel,
    loseLabel: config.loseLabel,
    dropLabel: config.dropLabel,
    jarFill: config.jarFill,
    jarStroke: config.jarStroke,
    bgA: config.bgA,
    bgB: config.bgB,
    accent: config.accent,
    line: config.line,
    tiers: config.tiers,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '合成',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="scoreText">${config.scoreLabel} 0</b><span id="queueText">${config.queueLabel}</span></div>
        <p id="statusText">${config.dropLabel}</p>
        <button class="primary" id="resetBtn">重开这一锅</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const THEME = ${JSON.stringify(theme)};
      const seedBase = ${Number(generatedAt.slice(0, 10).replace(/-/g, ''))};
      const bucket = { x: 57, y: 108, w: 276, h: 360 };
      const loseLine = 160;
      const gravity = 0.12;
      const damping = 0.985;
      const bounce = 0.84;
      const settleSpeed = 0.42;
      const mergeDelay = 180;
      const spawnXs = [112, 155, 198, 241, 284];
      const state = { pieces: [], next: 0, previewX: 195, score: 0, merges: 0, mode: 'aiming', hold: 0, rng: seedBase, cooldown: 0 };
      function rand() {
        state.rng = (state.rng * 1664525 + 1013904223) >>> 0;
        return state.rng / 4294967296;
      }
      function tier(index) {
        return THEME.tiers[Math.max(0, Math.min(THEME.tiers.length - 1, index))];
      }
      function freshNext() {
        const roll = rand();
        return roll < 0.45 ? 0 : roll < 0.8 ? 1 : 2;
      }
      function reset() {
        state.pieces = [];
        state.score = 0;
        state.merges = 0;
        state.mode = 'aiming';
        state.hold = 0;
        state.cooldown = 0;
        state.previewX = 195;
        state.next = freshNext();
        render();
      }
      function spawnAt(x) {
        if (state.mode === 'lost' || state.cooldown > 0) return;
        const lane = spawnXs.reduce((best, value) => Math.abs(value - x) < Math.abs(best - x) ? value : best, spawnXs[0]);
        const info = tier(state.next);
        state.pieces.push({
          id: Date.now() + Math.floor(rand() * 99999),
          tier: state.next,
          x: lane,
          y: loseLine - info.r - 10,
          vx: 0,
          vy: 0,
          justMerged: 0,
          alive: true
        });
        state.next = freshNext();
        state.cooldown = 220;
        state.mode = 'falling';
      }
      function pointerPosition(event) {
        const box = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - box.left) * canvas.width / box.width,
          y: (event.clientY - box.top) * canvas.height / box.height
        };
      }
      function insideBucket(piece) {
        const info = tier(piece.tier);
        return piece.x > bucket.x + info.r && piece.x < bucket.x + bucket.w - info.r;
      }
      function physicsStep() {
        let moving = false;
        for (const piece of state.pieces) {
          if (!piece.alive) continue;
          const info = tier(piece.tier);
          piece.vy += gravity;
          piece.x += piece.vx;
          piece.y += piece.vy;
          piece.vx *= damping;
          if (piece.x - info.r < bucket.x) {
            piece.x = bucket.x + info.r;
            piece.vx = Math.abs(piece.vx) * bounce;
          }
          if (piece.x + info.r > bucket.x + bucket.w) {
            piece.x = bucket.x + bucket.w - info.r;
            piece.vx = -Math.abs(piece.vx) * bounce;
          }
          if (piece.y + info.r > bucket.y + bucket.h) {
            piece.y = bucket.y + bucket.h - info.r;
            piece.vy = -Math.abs(piece.vy) * 0.22;
            piece.vx *= 0.96;
            if (Math.abs(piece.vy) < 0.5) piece.vy = 0;
          }
          if (piece.justMerged > 0) piece.justMerged = Math.max(0, piece.justMerged - 16);
          if (Math.abs(piece.vx) > settleSpeed || Math.abs(piece.vy) > settleSpeed) moving = true;
        }
        for (let i = 0; i < state.pieces.length; i++) {
          const a = state.pieces[i];
          if (!a || !a.alive) continue;
          const ar = tier(a.tier).r;
          for (let j = i + 1; j < state.pieces.length; j++) {
            const b = state.pieces[j];
            if (!b || !b.alive) continue;
            const br = tier(b.tier).r;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy) || 0.0001;
            const minDistance = ar + br;
            if (distance < minDistance) {
              const overlap = minDistance - distance;
              const nx = dx / distance;
              const ny = dy / distance;
              a.x -= nx * overlap * 0.5;
              a.y -= ny * overlap * 0.5;
              b.x += nx * overlap * 0.5;
              b.y += ny * overlap * 0.5;
              const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (relative < 0) {
                const impulse = -relative * 0.58;
                a.vx -= impulse * nx;
                a.vy -= impulse * ny;
                b.vx += impulse * nx;
                b.vy += impulse * ny;
              }
              if (a.tier === b.tier && a.justMerged <= 0 && b.justMerged <= 0 && distance < minDistance * 0.72) {
                const nextTier = Math.min(THEME.tiers.length - 1, a.tier + 1);
                const centerX = (a.x + b.x) * 0.5;
                const centerY = (a.y + b.y) * 0.5;
                a.alive = false;
                b.alive = false;
                state.pieces.push({
                  id: Date.now() + Math.floor(rand() * 99999),
                  tier: nextTier,
                  x: centerX,
                  y: centerY,
                  vx: (a.vx + b.vx) * 0.25,
                  vy: Math.min(-1.6, (a.vy + b.vy) * 0.18),
                  justMerged: mergeDelay,
                  alive: true
                });
                state.score += (nextTier + 1) * 12;
                state.merges += 1;
                moving = true;
                break;
              }
            }
          }
        }
        state.pieces = state.pieces.filter((piece) => piece.alive);
        const topDanger = state.pieces.some((piece) => {
          const info = tier(piece.tier);
          return piece.y - info.r < loseLine && Math.abs(piece.vy) < 0.25 && insideBucket(piece);
        });
        if (topDanger) {
          state.hold += 16;
          if (state.hold > 900) state.mode = 'lost';
        } else {
          state.hold = Math.max(0, state.hold - 24);
        }
        if (state.mode !== 'lost') state.mode = moving ? 'falling' : 'aiming';
      }
      function step(ms) {
        const steps = Math.max(1, Math.round(ms / 16));
        for (let i = 0; i < steps; i++) {
          if (state.cooldown > 0) state.cooldown = Math.max(0, state.cooldown - 16);
          physicsStep();
        }
        render();
      }
      function drawJar() {
        const grad = ctx.createLinearGradient(0, bucket.y, 0, bucket.y + bucket.h);
        grad.addColorStop(0, THEME.bgA);
        grad.addColorStop(1, THEME.bgB);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(bucket.x, bucket.y, bucket.w, bucket.h, 28);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = THEME.jarStroke;
        ctx.stroke();
        ctx.fillStyle = THEME.jarFill;
        ctx.fillRect(bucket.x + 18, bucket.y + 18, bucket.w - 36, 10);
        ctx.strokeStyle = THEME.line;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(bucket.x + 10, loseLine);
        ctx.lineTo(bucket.x + bucket.w - 10, loseLine);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = THEME.line;
        ctx.font = '900 11px sans-serif';
        ctx.fillText(THEME.loseLabel, bucket.x + 16, loseLine - 8);
      }
      function drawPreview() {
        ctx.fillStyle = '#fff';
        ctx.font = '900 18px sans-serif';
        ctx.fillText(THEME.heading, 24, 38);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '12px sans-serif';
        ctx.fillText(THEME.subheading, 24, 56);
        const info = tier(state.next);
        ctx.strokeStyle = THEME.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(state.previewX, 74);
        ctx.lineTo(state.previewX, loseLine - info.r - 20);
        ctx.stroke();
        drawPiece({ x: state.previewX, y: 88, tier: state.next, justMerged: 0 }, true);
        ctx.fillStyle = '#fff';
        ctx.font = '800 12px sans-serif';
        ctx.fillText(THEME.dropLabel, 196, 88);
      }
      function drawPiece(piece, preview) {
        const info = tier(piece.tier);
        ctx.save();
        if (piece.justMerged > 0) {
          const pulse = 1 + piece.justMerged / (mergeDelay * 5);
          ctx.translate(piece.x, piece.y);
          ctx.scale(pulse, pulse);
          ctx.translate(-piece.x, -piece.y);
        }
        ctx.beginPath();
        ctx.arc(piece.x, piece.y, info.r, 0, Math.PI * 2);
        ctx.fillStyle = info.fill;
        ctx.fill();
        ctx.lineWidth = preview ? 3 : 2;
        ctx.strokeStyle = preview ? '#fffbe6' : 'rgba(255,255,255,.75)';
        ctx.stroke();
        ctx.fillStyle = '#22160d';
        ctx.font = '900 ' + Math.max(14, Math.round(info.r * 0.84)) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.glyph, piece.x, piece.y + 1);
        ctx.restore();
      }
      function render() {
        const bg = ctx.createLinearGradient(0, 0, 0, 560);
        bg.addColorStop(0, '#140d1a');
        bg.addColorStop(1, '#050608');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 390, 560);
        drawPreview();
        drawJar();
        state.pieces.forEach((piece) => drawPiece(piece, false));
        document.getElementById('scoreText').textContent = THEME.scoreLabel + ' ' + state.score;
        document.getElementById('queueText').textContent = THEME.queueLabel + ' ' + tier(state.next).label;
        document.getElementById('statusText').textContent = state.mode === 'lost'
          ? THEME.winLabel + ' 失败：锅满了'
          : '已合成 ' + state.merges + ' 次 · 危险值 ' + Math.min(100, Math.round(state.hold / 9)) + '%';
      }
      canvas.addEventListener('pointermove', (event) => {
        const point = pointerPosition(event);
        state.previewX = Math.max(bucket.x + 30, Math.min(bucket.x + bucket.w - 30, point.x));
        render();
      });
      canvas.addEventListener('pointerdown', (event) => {
        const point = pointerPosition(event);
        state.previewX = Math.max(bucket.x + 30, Math.min(bucket.x + bucket.w - 30, point.x));
        spawnAt(state.previewX);
        render();
      });
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(() => step(16), 16);
      window.advanceTime = (ms) => step(ms);
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 merge jar',
        mode: state.mode,
        score: state.score,
        merges: state.merges,
        next: tier(state.next).label,
        danger: Math.min(100, Math.round(state.hold / 9)),
        pieces: state.pieces.map((piece) => ({ tier: tier(piece.tier).label, x: Math.round(piece.x), y: Math.round(piece.y) }))
      });
    `,
  };
}

const brainrotMergeGame = createMergeDropGame({
  id: 'brainrot-merge-pot',
  file: 'brainrot-merge-pot.html',
  title: '脑腐合成锅',
  sourceGame: 'Brainrot Merge / 合成大西瓜式掉落合成',
  accent: '#ff7a59',
  summary: '沿着顶线丢进怪物丸子，同类碰撞升级，别让锅口堆爆。',
  heading: '脑腐合成锅',
  subheading: '热点复刻 · 顶部投放、同类升级、堆到警戒线就翻锅',
  scoreLabel: '脑腐值',
  queueLabel: '下一个',
  winLabel: '脑腐值',
  loseLabel: '翻锅线',
  dropLabel: '左右挪动预览线，点一下把怪物丢进锅里。',
  jarFill: 'rgba(255,154,61,.14)',
  jarStroke: '#ff9a3d',
  bgA: '#2d1718',
  bgB: '#12090d',
  line: '#ffcf8d',
  tiers: [
    { label: '拖', glyph: '拖', fill: '#ffd166', r: 19 },
    { label: '啦', glyph: '啦', fill: '#ff9f68', r: 24 },
    { label: '啵', glyph: '啵', fill: '#ff7aa2', r: 28 },
    { label: '咚', glyph: '咚', fill: '#c084fc', r: 33 },
    { label: '锅', glyph: '锅', fill: '#7dd3fc', r: 38 },
    { label: '王', glyph: '王', fill: '#a3e635', r: 44 }
  ]
});

const lunchMergeRemixGame = createMergeDropGame({
  id: 'lunchbox-merge-pot',
  file: 'lunchbox-merge-pot.html',
  title: '午饭合成锅',
  sourceGame: '脑腐合成锅 Remix',
  accent: '#5eead4',
  summary: '把脑腐丸子改成午饭配菜，掉落、碰撞、升级逻辑不变。',
  heading: '午饭合成锅',
  subheading: '二创版 · 把梗图怪球替成打工人午饭配菜',
  scoreLabel: '饱腹值',
  queueLabel: '下一口',
  winLabel: '饱腹值',
  loseLabel: '打包线',
  dropLabel: '左右选落点，把便当配菜一颗颗丢进锅里。',
  jarFill: 'rgba(93,234,212,.14)',
  jarStroke: '#38bdf8',
  bgA: '#102122',
  bgB: '#071111',
  line: '#9bf7e8',
  tiers: [
    { label: '蛋', glyph: '蛋', fill: '#ffe082', r: 19 },
    { label: '菇', glyph: '菇', fill: '#ffb4a2', r: 24 },
    { label: '肠', glyph: '肠', fill: '#fb7185', r: 28 },
    { label: '饭', glyph: '饭', fill: '#93c5fd', r: 33 },
    { label: '盒', glyph: '盒', fill: '#6ee7b7', r: 38 },
    { label: '王', glyph: '王', fill: '#c4b5fd', r: 44 }
  ]
});

function createMergeRaiderGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    scoreLabel: config.scoreLabel,
    incomeLabel: config.incomeLabel,
    recruitLabel: config.recruitLabel,
    upgradeLabel: config.upgradeLabel,
    alertIdle: config.alertIdle,
    alertLive: config.alertLive,
    alertLose: config.alertLose,
    accent: config.accent,
    bgA: config.bgA,
    bgB: config.bgB,
    arena: config.arena,
    tiers: config.tiers,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '养成合成',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact stack">
        <div class="row"><b id="coinText">${config.scoreLabel} 0</b><span id="incomeText">${config.incomeLabel} 0/s</span></div>
        <div class="row"><button class="primary" id="spawnBtn">${config.recruitLabel}</button><button class="primary" id="upgradeBtn">${config.upgradeLabel}</button></div>
        <div class="row"><button class="primary" id="alarmBtn">拦截小偷</button><span id="statusText">${config.alertIdle}</span></div>
        <button class="primary" id="resetBtn">重开这块场</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const THEME = ${JSON.stringify(theme)};
      const slots = [
        { x: 104, y: 184 }, { x: 194, y: 184 }, { x: 284, y: 184 },
        { x: 104, y: 278 }, { x: 194, y: 278 }, { x: 284, y: 278 },
        { x: 104, y: 372 }, { x: 194, y: 372 }, { x: 284, y: 372 },
      ];
      const state = {
        coins: 8,
        incomeBonus: 1,
        units: [],
        slotCount: 5,
        nextId: 1,
        dragId: null,
        dragX: 0,
        dragY: 0,
        merges: 0,
        blocked: 0,
        stolen: 0,
        threat: 7.5,
        raid: null,
        flash: 0,
        ticker: 0,
      };
      function tier(index) {
        return THEME.tiers[Math.max(0, Math.min(THEME.tiers.length - 1, index))];
      }
      function spawnCost() {
        return 6 + Math.max(0, state.units.length - 2) * 3;
      }
      function upgradeCost() {
        return 22 + Math.round(state.incomeBonus * 12);
      }
      function activeSlots() {
        return slots.slice(0, state.slotCount);
      }
      function unitAtSlot(slotIndex) {
        return state.units.find((unit) => unit.slot === slotIndex) || null;
      }
      function totalIncome() {
        return Number((state.units.reduce((sum, unit) => sum + tier(unit.tier).income, 0) * state.incomeBonus).toFixed(1));
      }
      function openSlots() {
        return activeSlots().map((_, index) => index).filter((index) => !unitAtSlot(index));
      }
      function nextRaidDelay() {
        return 8 + Math.max(0, 3 - Math.min(3, state.merges)) * 1.2;
      }
      function reset() {
        state.coins = 8;
        state.incomeBonus = 1;
        state.units = [];
        state.slotCount = 5;
        state.nextId = 1;
        state.dragId = null;
        state.dragX = 0;
        state.dragY = 0;
        state.merges = 0;
        state.blocked = 0;
        state.stolen = 0;
        state.threat = 7.5;
        state.raid = null;
        state.flash = 0;
        state.ticker = 0;
        recruit();
        recruit();
        render();
      }
      function recruit(free = false) {
        const empty = openSlots();
        const cost = spawnCost();
        if (!empty.length || (!free && state.coins < cost)) return false;
        if (!free) state.coins -= cost;
        const slot = empty[(state.nextId + state.merges) % empty.length];
        state.units.push({
          id: state.nextId++,
          slot,
          tier: 0,
          pulse: 1,
        });
        state.flash = 0.28;
        render();
        return true;
      }
      function upgradeIncome() {
        const cost = upgradeCost();
        if (state.coins < cost) return false;
        state.coins -= cost;
        state.incomeBonus = Number((state.incomeBonus + 0.35).toFixed(2));
        state.flash = 0.4;
        render();
        return true;
      }
      function startRaid() {
        if (state.raid) return;
        const target = [...state.units].sort((a, b) => a.tier - b.tier || a.slot - b.slot)[0];
        state.raid = { ttl: 2.2, targetId: target ? target.id : null, mood: target ? 'armed' : 'idle' };
      }
      function blockRaid() {
        if (!state.raid || state.raid.mood !== 'armed') return false;
        state.blocked += 1;
        state.coins += 12 + state.blocked * 2;
        state.raid = null;
        state.threat = nextRaidDelay();
        state.flash = 0.55;
        render();
        return true;
      }
      function resolveRaid() {
        if (!state.raid) return;
        if (state.raid.targetId == null) {
          state.raid = null;
          state.threat = nextRaidDelay() - 1.5;
          return;
        }
        const target = state.units.find((unit) => unit.id === state.raid.targetId);
        if (target) {
          state.units = state.units.filter((unit) => unit.id !== target.id);
          state.stolen += 1;
        }
        state.raid = null;
        state.threat = nextRaidDelay();
        render();
      }
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height,
        };
      }
      function findUnitAt(x, y) {
        return state.units.find((unit) => {
          const slot = slots[unit.slot];
          const px = state.dragId === unit.id ? state.dragX : slot.x;
          const py = state.dragId === unit.id ? state.dragY : slot.y;
          return Math.hypot(px - x, py - y) < tier(unit.tier).r;
        }) || null;
      }
      function slotForPoint(x, y) {
        let best = null;
        activeSlots().forEach((slot, index) => {
          const distance = Math.hypot(slot.x - x, slot.y - y);
          if (!best || distance < best.distance) best = { index, distance };
        });
        return best && best.distance < 54 ? best.index : null;
      }
      function mergeInto(target, source) {
        target.tier = Math.min(THEME.tiers.length - 1, target.tier + 1);
        target.pulse = 1.18;
        state.units = state.units.filter((unit) => unit.id !== source.id);
        state.merges += 1;
        state.coins += tier(target.tier).income * 5;
        if (state.slotCount < slots.length && state.merges >= 3 && state.slotCount < 6) state.slotCount = 6;
        if (state.slotCount < slots.length && state.merges >= 6 && state.slotCount < 7) state.slotCount = 7;
        if (state.slotCount < slots.length && state.merges >= 9 && state.slotCount < 8) state.slotCount = 8;
        if (state.slotCount < slots.length && state.merges >= 12 && state.slotCount < 9) state.slotCount = 9;
        state.flash = 0.42;
      }
      function releaseDrag() {
        const drag = state.units.find((unit) => unit.id === state.dragId);
        if (!drag) return;
        const targetSlot = slotForPoint(state.dragX, state.dragY);
        const mergeTarget = state.units.find((unit) => unit.id !== drag.id && Math.hypot(slots[unit.slot].x - state.dragX, slots[unit.slot].y - state.dragY) < 34);
        if (mergeTarget && mergeTarget.tier === drag.tier) {
          mergeInto(mergeTarget, drag);
        } else if (targetSlot != null && !unitAtSlot(targetSlot)) {
          drag.slot = targetSlot;
        }
        state.dragId = null;
        render();
      }
      function step(ms) {
        const dt = ms / 1000;
        state.coins = Number((state.coins + totalIncome() * dt).toFixed(1));
        state.ticker += dt;
        state.flash = Math.max(0, state.flash - dt);
        state.units.forEach((unit) => {
          unit.pulse = Math.max(1, unit.pulse - dt * 0.8);
        });
        if (!state.raid) {
          state.threat -= dt;
          if (state.threat <= 0) startRaid();
        } else {
          state.raid.ttl -= dt;
          if (state.raid.ttl <= 0) resolveRaid();
        }
        render();
      }
      function drawArena() {
        const bg = ctx.createLinearGradient(0, 0, 0, 560);
        bg.addColorStop(0, THEME.bgA);
        bg.addColorStop(1, THEME.bgB);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.font = '900 20px sans-serif';
        ctx.fillText(THEME.heading, 20, 38);
        ctx.fillStyle = 'rgba(255,255,255,.68)';
        ctx.font = '12px sans-serif';
        ctx.fillText(THEME.subheading, 20, 58);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.strokeStyle = 'rgba(255,255,255,.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(38, 108, 314, 334, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.font = '900 12px sans-serif';
        ctx.fillText('合成场', 52, 132);
        activeSlots().forEach((slot, index) => {
          ctx.fillStyle = index < state.slotCount ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.03)';
          ctx.strokeStyle = 'rgba(255,255,255,.12)';
          ctx.beginPath();
          ctx.roundRect(slot.x - 34, slot.y - 34, 68, 68, 22);
          ctx.fill();
          ctx.stroke();
        });
        const meter = Math.max(0, Math.min(1, state.raid ? state.raid.ttl / 2.2 : state.threat / nextRaidDelay()));
        ctx.fillStyle = 'rgba(255,255,255,.1)';
        ctx.fillRect(52, 456, 286, 12);
        ctx.fillStyle = state.raid ? '#ff7a59' : '#22f4ee';
        ctx.fillRect(52, 456, 286 * meter, 12);
        ctx.fillStyle = '#fff';
        ctx.font = '900 11px sans-serif';
        ctx.fillText(state.raid ? '小偷倒计时' : '下次偷袭', 52, 449);
      }
      function drawUnit(unit) {
        const slot = slots[unit.slot];
        const info = tier(unit.tier);
        const x = state.dragId === unit.id ? state.dragX : slot.x;
        const y = state.dragId === unit.id ? state.dragY : slot.y;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(unit.pulse, unit.pulse);
        ctx.beginPath();
        ctx.arc(0, 0, info.r, 0, Math.PI * 2);
        ctx.fillStyle = info.fill;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,.82)';
        ctx.stroke();
        ctx.fillStyle = '#1d1320';
        ctx.font = '900 ' + Math.round(info.r * 0.8) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.glyph, 0, 1);
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,.84)';
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+' + info.income + '/s', x, y + info.r + 16);
      }
      function render() {
        drawArena();
        state.units.filter((unit) => unit.id !== state.dragId).forEach(drawUnit);
        const drag = state.units.find((unit) => unit.id === state.dragId);
        if (drag) drawUnit(drag);
        if (state.raid) {
          ctx.fillStyle = 'rgba(0,0,0,.36)';
          ctx.fillRect(0, 0, 390, 560);
          ctx.fillStyle = '#ff7a59';
          ctx.beginPath();
          ctx.roundRect(84, 138, 222, 94, 24);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = '900 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(state.raid.targetId == null ? '空场巡逻' : '小偷来抢了', 195, 176);
          ctx.font = '12px sans-serif';
          ctx.fillText(state.raid.targetId == null ? '这轮没人可抢，继续养成。' : THEME.alertLive, 195, 202);
        }
        if (state.flash > 0) {
          ctx.fillStyle = 'rgba(255,255,255,' + (state.flash * 0.22) + ')';
          ctx.fillRect(0, 0, 390, 560);
        }
        document.getElementById('coinText').textContent = THEME.scoreLabel + ' ' + Math.floor(state.coins);
        document.getElementById('incomeText').textContent = THEME.incomeLabel + ' ' + totalIncome().toFixed(1) + '/s';
        document.getElementById('spawnBtn').textContent = THEME.recruitLabel + ' ' + spawnCost();
        document.getElementById('upgradeBtn').textContent = THEME.upgradeLabel + ' ' + upgradeCost();
        document.getElementById('spawnBtn').disabled = !openSlots().length || state.coins < spawnCost();
        document.getElementById('upgradeBtn').disabled = state.coins < upgradeCost();
        document.getElementById('alarmBtn').disabled = !state.raid || state.raid.targetId == null;
        document.getElementById('statusText').textContent = state.raid
          ? THEME.alertLive
          : (state.stolen > 0 ? THEME.alertLose + ' ' + state.stolen + ' 次' : THEME.alertIdle);
      }
      canvas.addEventListener('pointerdown', (event) => {
        const p = point(event);
        const unit = findUnitAt(p.x, p.y);
        if (!unit) return;
        state.dragId = unit.id;
        state.dragX = p.x;
        state.dragY = p.y;
        render();
      });
      canvas.addEventListener('pointermove', (event) => {
        if (state.dragId == null) return;
        const p = point(event);
        state.dragX = p.x;
        state.dragY = p.y;
        render();
      });
      canvas.addEventListener('pointerup', releaseDrag);
      canvas.addEventListener('pointercancel', () => { state.dragId = null; render(); });
      document.getElementById('spawnBtn').addEventListener('click', () => recruit());
      document.getElementById('upgradeBtn').addEventListener('click', upgradeIncome);
      document.getElementById('alarmBtn').addEventListener('click', blockRaid);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(() => step(16), 16);
      window.advanceTime = (ms) => step(ms);
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 grid merge yard',
        coins: Math.floor(state.coins),
        income: totalIncome(),
        units: state.units.map((unit) => ({ tier: tier(unit.tier).label, slot: unit.slot })),
        merges: state.merges,
        blocked: state.blocked,
        stolen: state.stolen,
        raidActive: Boolean(state.raid),
        slotsOpen: state.slotCount,
      });
    `,
  };
}

const brainrotRaiderGame = createMergeRaiderGame({
  id: 'brainrot-raider-yard',
  file: 'brainrot-raider-yard.html',
  title: '脑腐偷家场',
  sourceGame: 'Merge & Steal Brainrot / Italian Brainrot Merge',
  accent: '#7c5cff',
  summary: '招募低级梗怪、拖拽同类合成、自动产币，还得随时拦截来偷家的巡逻贼。',
  heading: '脑腐偷家场',
  subheading: '热点复刻 · 生单位、拖拽合成、挂机产币、定时防偷',
  scoreLabel: '硬币',
  incomeLabel: '秒产',
  recruitLabel: '招一只',
  upgradeLabel: '刷广告牌',
  alertIdle: '先招募，再把同类拖到一起合成更高阶怪。',
  alertLive: '小偷正在盯最低阶单位，点按钮把它赶走。',
  alertLose: '刚才被偷走了',
  bgA: '#1b1230',
  bgB: '#07080f',
  arena: '#120d1d',
  tiers: [
    { label: '拖', glyph: '拖', fill: '#ffd166', r: 20, income: 1 },
    { label: '拉', glyph: '拉', fill: '#ff9f68', r: 22, income: 3 },
    { label: '啵', glyph: '啵', fill: '#ff7aa2', r: 24, income: 6 },
    { label: '锅', glyph: '锅', fill: '#b794f6', r: 26, income: 10 },
    { label: '王', glyph: '王', fill: '#7dd3fc', r: 29, income: 16 },
    { label: '尊', glyph: '尊', fill: '#a3e635', r: 31, income: 24 },
  ],
});

const officeRaiderRemixGame = createMergeRaiderGame({
  id: 'office-raider-yard',
  file: 'office-raider-yard.html',
  title: '工位摸鱼盘',
  sourceGame: '脑腐偷家场 Remix',
  accent: '#22f4ee',
  summary: '把脑腐怪换成工位杂物，保留生单位、拖拽合成、产币和防偷循环。',
  heading: '工位摸鱼盘',
  subheading: '二创版 · 把偷家合成场翻译成夜班工位养成盘',
  scoreLabel: '摸鱼币',
  incomeLabel: '偷闲',
  recruitLabel: '摆一件',
  upgradeLabel: '补咖啡',
  alertIdle: '先摆满工位杂物，再把同类拖到一起升级成更值钱的大件。',
  alertLive: '巡查经理来收东西了，赶紧拦住。',
  alertLose: '刚才被经理收走了',
  bgA: '#0d1d24',
  bgB: '#05090b',
  arena: '#0e161b',
  tiers: [
    { label: '签', glyph: '签', fill: '#ffe082', r: 20, income: 1 },
    { label: '杯', glyph: '杯', fill: '#8be9fd', r: 22, income: 3 },
    { label: '表', glyph: '表', fill: '#fda4af', r: 24, income: 6 },
    { label: '屏', glyph: '屏', fill: '#67e8f9', r: 26, income: 10 },
    { label: '椅', glyph: '椅', fill: '#86efac', r: 29, income: 16 },
    { label: '王', glyph: '王', fill: '#c4b5fd', r: 31, income: 24 },
  ],
});

function createEggCollectorGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    scoreLabel: config.scoreLabel,
    incomeLabel: config.incomeLabel,
    buyLabel: config.buyLabel,
    stealLabel: config.stealLabel,
    stealReady: config.stealReady,
    stealLocked: config.stealLocked,
    stealFail: config.stealFail,
    idleHint: config.idleHint,
    palette: config.palette,
    tiers: config.tiers,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '收集养成',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="stat-row"><span id="coinText"></span><span id="incomeText"></span></div>
        <div class="button-row">
          <button class="primary" id="buyBtn"></button>
          <button class="chip" id="stealBtn"></button>
        </div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">重开这条线</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const THEME = ${JSON.stringify(theme)};
      const state = {
        coins: 16,
        units: [],
        eggs: [],
        dragEggId: null,
        dragPoint: null,
        nextId: 1,
        nextOfferTier: 0,
        nextStealTier: 1,
        raidTimer: 6.5,
        flash: 0,
        mode: 'playing',
        message: THEME.idleHint,
      };
      const nests = [
        { x: 74, y: 410, w: 86, h: 92 },
        { x: 152, y: 410, w: 86, h: 92 },
        { x: 230, y: 410, w: 86, h: 92 },
      ];
      function tierMeta(index) {
        return THEME.tiers[Math.max(0, Math.min(THEME.tiers.length - 1, index))];
      }
      function incomeTotal() {
        return state.units.reduce((sum, unit) => sum + tierMeta(unit.tier).income, 0);
      }
      function buyCost() {
        return 6 + state.nextOfferTier * 4;
      }
      function stealReady() {
        return state.raidTimer <= 0;
      }
      function freeNestIndex() {
        for (let i = 0; i < nests.length; i += 1) {
          if (!state.eggs.some((egg) => egg.nestIndex === i) && !state.units.some((unit) => unit.nestIndex === i)) return i;
        }
        return -1;
      }
      function point(event) {
        const box = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - box.left) * canvas.width / box.width,
          y: (event.clientY - box.top) * canvas.height / box.height,
        };
      }
      function eggRadius(egg) {
        return 21 + egg.tier * 3;
      }
      function eggAt(x, y) {
        return state.eggs
          .filter((egg) => egg.state !== 'hatched')
          .sort((a, b) => b.y - a.y)
          .find((egg) => Math.hypot(x - egg.x, y - egg.y) <= eggRadius(egg) + 6) || null;
      }
      function spawnEgg(origin, tier) {
        const meta = tierMeta(tier);
        const id = state.nextId++;
        state.eggs.push({
          id,
          tier,
          laneX: 70,
          x: origin === 'shop' ? 70 : 302,
          y: origin === 'shop' ? 168 : 112,
          vx: origin === 'shop' ? 54 : -72,
          hatch: 0,
          nestIndex: null,
          state: 'belt',
          source: origin,
          label: meta.glyph,
        });
        return id;
      }
      function buyEgg() {
        if (state.mode !== 'playing') return;
        const cost = buyCost();
        if (state.coins < cost) {
          state.message = '硬币不够，先等窝里那几只继续下蛋。';
          return;
        }
        state.coins -= cost;
        spawnEgg('shop', state.nextOfferTier);
        state.nextOfferTier = Math.min(THEME.tiers.length - 1, state.nextOfferTier + (state.coins > 34 ? 1 : 0));
        state.message = '新蛋上了传送带，拖回工位就能开始孵。';
        render();
      }
      function stealEgg() {
        if (state.mode !== 'playing') return;
        if (!stealReady()) {
          state.message = THEME.stealLocked;
          render();
          return;
        }
        const slot = freeNestIndex();
        if (slot === -1) {
          state.coins += 8 + state.nextStealTier * 4;
          state.raidTimer = 10.5;
          state.message = THEME.stealFail;
          render();
          return;
        }
        spawnEgg('steal', state.nextStealTier);
        state.nextStealTier = Math.min(THEME.tiers.length - 1, state.nextStealTier + 1);
        state.raidTimer = 12;
        state.flash = 1;
        state.message = THEME.stealReady;
        render();
      }
      function dropEgg(egg, nestIndex) {
        const nest = nests[nestIndex];
        egg.nestIndex = nestIndex;
        egg.state = 'nest';
        egg.vx = 0;
        egg.x = nest.x + nest.w / 2;
        egg.y = nest.y + nest.h / 2;
        egg.hatch = 0;
        state.message = '蛋进窝了，等它孵出会自动产币。';
      }
      function hatchEgg(egg) {
        state.units.push({ id: egg.id, tier: egg.tier, nestIndex: egg.nestIndex, pulse: 1 });
        state.eggs = state.eggs.filter((item) => item.id !== egg.id);
        if (state.units.length >= 2 && state.nextOfferTier < THEME.tiers.length - 1) state.nextOfferTier += 1;
        state.message = tierMeta(egg.tier).label + '已经孵出来了。';
      }
      function reset() {
        state.coins = 16;
        state.units = [];
        state.eggs = [];
        state.dragEggId = null;
        state.dragPoint = null;
        state.nextId = 1;
        state.nextOfferTier = 0;
        state.nextStealTier = 1;
        state.raidTimer = 6.5;
        state.flash = 0;
        state.mode = 'playing';
        state.message = THEME.idleHint;
        render();
      }
      function updateEggs(dt) {
        for (const egg of state.eggs) {
          if (egg.id === state.dragEggId && state.dragPoint) {
            egg.x = state.dragPoint.x;
            egg.y = state.dragPoint.y;
            continue;
          }
          if (egg.state === 'belt') {
            egg.laneX += egg.vx * dt;
            if (egg.source === 'shop') {
              if (egg.laneX > 320) egg.laneX = 70;
              egg.x = egg.laneX;
              egg.y = 168 + Math.sin(egg.laneX / 26) * 4;
            } else {
              if (egg.laneX < 96) egg.laneX = 302;
              egg.x = egg.laneX;
              egg.y = 112 + Math.cos(egg.laneX / 22) * 5;
            }
          } else if (egg.state === 'nest') {
            egg.hatch += dt / (3.8 - Math.min(egg.tier * 0.35, 1.4));
            if (egg.hatch >= 1) hatchEgg(egg);
          }
        }
      }
      function updateUnits(dt) {
        state.coins += incomeTotal() * dt;
        state.units.forEach((unit) => { unit.pulse = Math.max(0, unit.pulse - dt * 1.8); });
      }
      function step(ms) {
        const dt = ms / 1000;
        if (state.mode !== 'playing') return;
        state.raidTimer -= dt;
        if (state.raidTimer < -4) state.raidTimer = 12;
        state.flash = Math.max(0, state.flash - dt * 2.4);
        updateEggs(dt);
        updateUnits(dt);
        render();
      }
      function drawEgg(x, y, tier, hatch, outline) {
        const meta = tierMeta(tier);
        const radius = 21 + tier * 3;
        ctx.fillStyle = meta.fill;
        ctx.strokeStyle = outline || 'rgba(255,255,255,.22)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius + 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.18)';
        ctx.beginPath();
        ctx.ellipse(x - radius / 3, y - radius / 2, radius / 4, radius / 2.8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111827';
        ctx.font = '900 ' + (14 + tier * 2) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(meta.glyph, x, y + 5);
        if (typeof hatch === 'number' && hatch > 0) {
          ctx.strokeStyle = 'rgba(255,255,255,.72)';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(x, y + radius + 12, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(hatch, 1));
          ctx.stroke();
        }
      }
      function drawUnit(unit) {
        const nest = nests[unit.nestIndex];
        const meta = tierMeta(unit.tier);
        const x = nest.x + nest.w / 2;
        const y = nest.y + 44;
        const r = 18 + unit.tier * 3 + unit.pulse * 3;
        ctx.fillStyle = meta.body;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.18)';
        ctx.beginPath();
        ctx.arc(x - r / 3, y - r / 3, r / 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#061018';
        ctx.font = '900 ' + (13 + unit.tier * 2) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(meta.glyph, x, y + 5);
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.font = '900 11px sans-serif';
        ctx.fillText('+' + meta.income + '/s', x, y + 34);
      }
      function render() {
        const palette = THEME.palette;
        ctx.clearRect(0, 0, 390, 560);
        const back = ctx.createLinearGradient(0, 0, 0, 560);
        back.addColorStop(0, palette.backA);
        back.addColorStop(1, palette.backB);
        ctx.fillStyle = back;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = 'rgba(255,255,255,.06)';
        ctx.fillRect(38, 72, 314, 34);
        ctx.fillRect(38, 152, 314, 34);
        ctx.fillStyle = 'rgba(255,255,255,.26)';
        for (let x = 58; x < 334; x += 36) {
          ctx.fillRect(x, 89, 18, 4);
          ctx.fillRect(x, 169, 18, 4);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(THEME.heading, 24, 36);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.subheading, 24, 56);
        ctx.fillText('买蛋传送带', 42, 145);
        ctx.fillText('顺手偷隔壁', 42, 96);
        nests.forEach((nest, index) => {
          ctx.fillStyle = 'rgba(255,255,255,.08)';
          ctx.strokeStyle = 'rgba(255,255,255,.18)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(nest.x, nest.y, nest.w, nest.h, 18);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.34)';
          ctx.font = '800 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('工位 ' + (index + 1), nest.x + nest.w / 2, nest.y + 76);
        });
        if (stealReady()) {
          ctx.fillStyle = 'rgba(255,197,94,.18)';
          ctx.fillRect(250, 72, 104, 34);
          ctx.fillStyle = '#ffd166';
          ctx.font = '900 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('可截胡', 302, 94);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,.2)';
          ctx.font = '900 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(state.raidTimer.toFixed(1) + 's', 302, 94);
        }
        state.eggs.forEach((egg) => drawEgg(egg.x, egg.y, egg.tier, egg.state === 'nest' ? egg.hatch : null, egg.source === 'steal' ? '#ffd166' : null));
        state.units.forEach(drawUnit);
        if (state.flash > 0) {
          ctx.fillStyle = 'rgba(255,255,255,' + (state.flash * 0.24) + ')';
          ctx.fillRect(0, 0, 390, 560);
        }
        document.getElementById('coinText').textContent = THEME.scoreLabel + ' ' + Math.floor(state.coins);
        document.getElementById('incomeText').textContent = THEME.incomeLabel + ' ' + incomeTotal().toFixed(1) + '/s';
        document.getElementById('buyBtn').textContent = THEME.buyLabel + ' ' + buyCost();
        document.getElementById('stealBtn').textContent = stealReady() ? THEME.stealLabel : Math.max(0, state.raidTimer).toFixed(1) + 's';
        document.getElementById('statusText').textContent = state.message;
      }
      canvas.addEventListener('pointerdown', (event) => {
        const p = point(event);
        const egg = eggAt(p.x, p.y);
        if (!egg) return;
        state.dragEggId = egg.id;
        state.dragPoint = p;
      });
      canvas.addEventListener('pointermove', (event) => {
        if (state.dragEggId == null) return;
        state.dragPoint = point(event);
        render();
      });
      function releaseDrag(event) {
        if (state.dragEggId == null) return;
        const egg = state.eggs.find((item) => item.id === state.dragEggId);
        const p = point(event);
        const nestIndex = nests.findIndex((nest) => p.x >= nest.x && p.x <= nest.x + nest.w && p.y >= nest.y && p.y <= nest.y + nest.h);
        if (egg && nestIndex >= 0 && freeNestIndex() === nestIndex) {
          dropEgg(egg, nestIndex);
        } else if (egg && egg.source === 'steal') {
          egg.x = 302;
          egg.y = 112;
          egg.state = 'belt';
          egg.vx = -72;
        } else if (egg) {
          egg.x = egg.laneX;
          egg.y = egg.source === 'shop' ? 168 : 112;
          egg.state = 'belt';
          egg.vx = egg.source === 'shop' ? 54 : -72;
          state.message = '要拖进空工位里，才能开始孵。';
        }
        state.dragEggId = null;
        state.dragPoint = null;
        render();
      }
      canvas.addEventListener('pointerup', releaseDrag);
      canvas.addEventListener('pointercancel', () => {
        state.dragEggId = null;
        state.dragPoint = null;
        render();
      });
      document.getElementById('buyBtn').addEventListener('click', buyEgg);
      document.getElementById('stealBtn').addEventListener('click', stealEgg);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(() => step(16), 16);
      window.advanceTime = (ms) => step(ms);
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 egg conveyor base',
        coins: Math.floor(state.coins),
        income: incomeTotal(),
        eggs: state.eggs.map((egg) => ({ tier: tierMeta(egg.tier).label, state: egg.state, nestIndex: egg.nestIndex })),
        units: state.units.map((unit) => ({ tier: tierMeta(unit.tier).label, nestIndex: unit.nestIndex })),
        nextOfferTier: tierMeta(state.nextOfferTier).label,
        nextStealTier: tierMeta(state.nextStealTier).label,
        stealReady: stealReady(),
      });
    `,
  };
}

const brainrotEggGame = createEggCollectorGame({
  id: 'brainrot-egg-run',
  file: 'brainrot-egg-run.html',
  title: '脑腐抢蛋线',
  sourceGame: 'Collect Brainrot Egg',
  accent: '#f59e0b',
  summary: '买蛋上带、拖回工位孵化、自动产币，再抓偷蛋窗口白嫖高阶蛋。',
  heading: '脑腐抢蛋线',
  subheading: '热点复刻 · 买蛋传送带 / 拖回基地 / 孵化产币 / 偷蛋窗口',
  scoreLabel: '硬币',
  incomeLabel: '孵化收益',
  buyLabel: '买一颗',
  stealLabel: '顺走隔壁蛋',
  stealReady: '高阶蛋截胡成功，赶紧拖回去孵。',
  stealLocked: '偷蛋窗还没开，先养自己这三窝。',
  stealFail: '工位满了，只能把隔壁蛋折成现金。',
  idleHint: '先买低阶蛋，拖回空工位里孵，等它稳定产币再开偷蛋窗。',
  palette: { backA: '#2b1603', backB: '#0b0810' },
  tiers: [
    { label: '纸蛋', glyph: '纸', fill: '#fde68a', body: '#fef3c7', income: 1 },
    { label: '拖蛋', glyph: '拖', fill: '#fdba74', body: '#fed7aa', income: 2.5 },
    { label: '锅蛋', glyph: '锅', fill: '#fca5a5', body: '#fecaca', income: 4.5 },
    { label: '王蛋', glyph: '王', fill: '#93c5fd', body: '#bfdbfe', income: 7 },
  ],
});

const officeEggRemixGame = createEggCollectorGame({
  id: 'office-egg-run',
  file: 'office-egg-run.html',
  title: '快递柜摸鱼蛋',
  sourceGame: '脑腐抢蛋线 Remix',
  accent: '#34d399',
  summary: '把脑腐蛋改成办公室快递盲盒，保留买盒、拖回工位、孵化和截胡循环。',
  heading: '快递柜摸鱼蛋',
  subheading: '二创版 · 把抢蛋养成盘翻成办公室快递盲盒线',
  scoreLabel: '摸鱼币',
  incomeLabel: '拆盒收益',
  buyLabel: '拿一盒',
  stealLabel: '截胡隔壁件',
  stealReady: '截胡到加急件了，拖回你工位赶紧拆。',
  stealLocked: '巡楼快递还没到，先把自己柜子养起来。',
  stealFail: '工位都塞满了，只能把加急件换成摸鱼币。',
  idleHint: '先从快递柜拿低阶盒子，拖到空工位拆开，再等办公室摆件持续产币。',
  palette: { backA: '#05201b', backB: '#051014' },
  tiers: [
    { label: '便签盒', glyph: '签', fill: '#fde68a', body: '#fef3c7', income: 1 },
    { label: '咖啡盒', glyph: '杯', fill: '#67e8f9', body: '#a5f3fc', income: 2.5 },
    { label: '外设盒', glyph: '屏', fill: '#a7f3d0', body: '#d1fae5', income: 4.5 },
    { label: '总监件', glyph: '王', fill: '#c4b5fd', body: '#ddd6fe', income: 7 },
  ],
});

function createArrowEscapeLevel() {
  const cols = 5;
  const rows = 6;
  const centerX = (cols - 1) / 2;
  const centerY = (rows - 1) / 2;
  const skip = new Set(['2,2', '2,3']);
  const tiles = [];
  let id = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${col},${row}`;
      if (skip.has(key)) continue;
      const dx = col - centerX;
      const dy = row - centerY;
      let dir = 'up';
      if (Math.abs(dx) > Math.abs(dy)) dir = dx < 0 ? 'left' : 'right';
      else if (Math.abs(dy) > Math.abs(dx)) dir = dy < 0 ? 'up' : 'down';
      else dir = row < centerY ? 'up' : 'down';
      tiles.push({ id: id++, col, row, dir });
    }
  }
  return { cols, rows, tiles };
}

const arrowEscapeLevel = createArrowEscapeLevel();

function createArrowEscapeGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    progressLabel: config.progressLabel,
    heartsLabel: config.heartsLabel,
    tipLabel: config.tipLabel,
    winCopy: config.winCopy,
    loseCopy: config.loseCopy,
    shellA: config.shellA,
    shellB: config.shellB,
    boardA: config.boardA,
    boardB: config.boardB,
    line: config.line,
    glow: config.glow,
    tileFill: config.tileFill,
    tileStroke: config.tileStroke,
    blockedFill: config.blockedFill,
    text: config.text,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '解谜',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="progressText">${config.progressLabel}</b><span id="heartText">${config.heartsLabel}</span></div>
        <p id="statusText">${config.tipLabel}</p>
        <button class="primary" id="resetBtn">重开这一局</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const LEVEL = ${JSON.stringify(arrowEscapeLevel)};
      const THEME = ${JSON.stringify(theme)};
      const cell = 58;
      const board = {
        x: Math.round((390 - LEVEL.cols * cell) / 2),
        y: 116,
        w: LEVEL.cols * cell,
        h: LEVEL.rows * cell
      };
      const arrows = {
        up: { glyph: '↑', dx: 0, dy: -1, angle: -Math.PI / 2 },
        right: { glyph: '→', dx: 1, dy: 0, angle: 0 },
        down: { glyph: '↓', dx: 0, dy: 1, angle: Math.PI / 2 },
        left: { glyph: '←', dx: -1, dy: 0, angle: Math.PI }
      };
      const state = { tiles: [], hearts: 3, cleared: 0, mode: 'playing', shimmer: 0 };
      function tileAt(col, row) {
        return state.tiles.find((tile) => tile.active && tile.col === col && tile.row === row);
      }
      function free(tile) {
        if (!tile || !tile.active || state.mode !== 'playing') return false;
        const arrow = arrows[tile.dir];
        let col = tile.col + arrow.dx;
        let row = tile.row + arrow.dy;
        while (col >= 0 && col < LEVEL.cols && row >= 0 && row < LEVEL.rows) {
          if (tileAt(col, row)) return false;
          col += arrow.dx;
          row += arrow.dy;
        }
        return true;
      }
      function reset() {
        state.tiles = LEVEL.tiles.map((tile) => ({ ...tile, active: true, pulse: 0 }));
        state.hearts = 3;
        state.cleared = 0;
        state.mode = 'playing';
        state.shimmer = 0;
        render();
      }
      function pick(tile) {
        if (!tile || state.mode !== 'playing') return;
        if (free(tile)) {
          tile.active = false;
          state.cleared += 1;
          state.shimmer = 1;
          if (state.tiles.every((item) => !item.active)) state.mode = 'won';
        } else {
          state.hearts -= 1;
          tile.pulse = 1;
          if (state.hearts <= 0) state.mode = 'lost';
        }
        render();
      }
      function tileRect(tile) {
        return {
          x: board.x + tile.col * cell,
          y: board.y + tile.row * cell,
          w: cell,
          h: cell
        };
      }
      function pointer(event) {
        const box = canvas.getBoundingClientRect();
        const x = (event.clientX - box.left) * canvas.width / box.width;
        const y = (event.clientY - box.top) * canvas.height / box.height;
        const target = state.tiles.find((tile) => {
          if (!tile.active) return false;
          const rect = tileRect(tile);
          return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
        });
        pick(target);
      }
      function step(ms) {
        const delta = Math.min(0.12, ms / 1000);
        state.shimmer = Math.max(0, state.shimmer - delta * 1.4);
        state.tiles.forEach((tile) => {
          if (tile.pulse > 0) tile.pulse = Math.max(0, tile.pulse - delta * 2.2);
        });
        render();
      }
      function drawArrow(rect, dir, enabled, pulse) {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const wobble = pulse > 0 ? pulse * 5 : 0;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(arrows[dir].angle);
        ctx.fillStyle = enabled ? THEME.tileFill : THEME.blockedFill;
        ctx.strokeStyle = enabled ? THEME.tileStroke : 'rgba(255,255,255,.18)';
        ctx.lineWidth = enabled ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(-22 - wobble * 0.2, -16, 44 + wobble * 0.4, 32, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = THEME.text;
        ctx.beginPath();
        ctx.moveTo(-6, -12);
        ctx.lineTo(14, 0);
        ctx.lineTo(-6, 12);
        ctx.lineTo(-6, 4);
        ctx.lineTo(-18, 4);
        ctx.lineTo(-18, -4);
        ctx.lineTo(-6, -4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      function render() {
        const bg = ctx.createLinearGradient(0, 0, 0, 560);
        bg.addColorStop(0, THEME.shellA);
        bg.addColorStop(1, THEME.shellB);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 390, 560);

        ctx.fillStyle = '#fff';
        ctx.font = '900 20px sans-serif';
        ctx.fillText(THEME.heading, 24, 40);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '12px sans-serif';
        ctx.fillText(THEME.subheading, 24, 58);

        const boardGrad = ctx.createLinearGradient(0, board.y, 0, board.y + board.h);
        boardGrad.addColorStop(0, THEME.boardA);
        boardGrad.addColorStop(1, THEME.boardB);
        ctx.fillStyle = boardGrad;
        ctx.beginPath();
        ctx.roundRect(board.x - 10, board.y - 10, board.w + 20, board.h + 20, 28);
        ctx.fill();
        ctx.strokeStyle = THEME.line;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,.08)';
        ctx.lineWidth = 1;
        for (let col = 0; col <= LEVEL.cols; col++) {
          const x = board.x + col * cell;
          ctx.beginPath();
          ctx.moveTo(x, board.y);
          ctx.lineTo(x, board.y + board.h);
          ctx.stroke();
        }
        for (let row = 0; row <= LEVEL.rows; row++) {
          const y = board.y + row * cell;
          ctx.beginPath();
          ctx.moveTo(board.x, y);
          ctx.lineTo(board.x + board.w, y);
          ctx.stroke();
        }

        if (state.shimmer > 0) {
          ctx.fillStyle = 'rgba(255,255,255,' + (state.shimmer * 0.18).toFixed(3) + ')';
          ctx.fillRect(board.x, board.y, board.w, board.h);
        }

        state.tiles.forEach((tile) => {
          if (!tile.active) return;
          const rect = tileRect(tile);
          drawArrow(rect, tile.dir, free(tile), tile.pulse);
        });

        const removable = state.tiles.filter(free).length;
        document.getElementById('progressText').textContent = THEME.progressLabel + ' ' + state.cleared + '/' + LEVEL.tiles.length;
        document.getElementById('heartText').textContent = THEME.heartsLabel + ' ' + '♥'.repeat(Math.max(0, state.hearts));
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? THEME.winCopy
          : state.mode === 'lost'
            ? THEME.loseCopy
            : THEME.tipLabel + ' 现在可拔 ' + removable + ' 枚';
      }
      canvas.addEventListener('pointerdown', pointer);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(() => step(16), 16);
      window.advanceTime = (ms) => step(ms);
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'grid ' + LEVEL.cols + 'x' + LEVEL.rows + ' rendered to canvas 390x560',
        mode: state.mode,
        hearts: state.hearts,
        cleared: state.cleared,
        removable: state.tiles.filter(free).length,
        activeTiles: state.tiles.filter((tile) => tile.active).map((tile) => ({ col: tile.col, row: tile.row, dir: tile.dir }))
      });
    `,
  };
}

const arrowEscapeGame = createArrowEscapeGame({
  id: 'arrow-escape-fake',
  file: 'arrow-escape-fake.html',
  title: '拔箭逃生局',
  sourceGame: 'Arrows - Puzzle Escape',
  accent: '#86efac',
  summary: '只能拔出朝出口方向一路通畅的箭块，误点三次就翻车。',
  heading: '拔箭逃生局',
  subheading: '热门复刻 · 从外层开始剥，给中间的箭腾出逃生线',
  progressLabel: '已清',
  heartsLabel: '容错',
  tipLabel: '点一枚能直线飞出棋盘的箭。',
  winCopy: '全场清空，逃生线打通了。',
  loseCopy: '误点次数用完，重新找外层箭。',
  shellA: '#0d1713',
  shellB: '#060807',
  boardA: '#10241e',
  boardB: '#08120f',
  line: '#86efac',
  glow: '#c7ffd9',
  tileFill: '#86efac',
  tileStroke: '#e8fff0',
  blockedFill: '#315046',
  text: '#05230f',
});

const courierArrowRemixGame = createArrowEscapeGame({
  id: 'courier-arrow-rush',
  file: 'courier-arrow-rush.html',
  title: '快递箭阵',
  sourceGame: '拔箭逃生局 Remix',
  accent: '#fbbf24',
  summary: '把逃生箭改成快递分拣箭道，同机制但更像一块高峰站点面板。',
  heading: '快递箭阵',
  subheading: '二创版 · 先清外侧分流箭，再放中间包裹出站',
  progressLabel: '出站',
  heartsLabel: '压单',
  tipLabel: '先点能直接飞出站台的分流箭。',
  winCopy: '包裹全部出站，晚高峰守住了。',
  loseCopy: '压单爆了，回到上一轮重排。',
  shellA: '#1a1308',
  shellB: '#070605',
  boardA: '#30220b',
  boardB: '#140f07',
  line: '#fbbf24',
  glow: '#fff1b3',
  tileFill: '#fbbf24',
  tileStroke: '#fff4d1',
  blockedFill: '#6a5321',
  text: '#241503',
});

function createEmojiHopperGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    hint: config.hint,
    winlessCopy: config.winlessCopy,
    loseCopy: config.loseCopy,
    accent: config.accent,
    skyA: config.skyA,
    skyB: config.skyB,
    cloud: config.cloud,
    normal: config.normal,
    fragile: config.fragile,
    skeleton: config.skeleton,
    boost: config.boost,
    player: config.player,
    pickup: config.pickup,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '跳跃',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="stat-grid">
          <span><b id="scoreText">0</b><i>当前</i></span>
          <span><b id="bestText">0</b><i>最高</i></span>
          <span><b id="boostText">0</b><i>连踩</i></span>
        </div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">重开这一跳</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      const THEME = ${JSON.stringify(theme)};
      const storageKey = 'printer-best-' + ${JSON.stringify(config.id)};
      let best = Number(localStorage.getItem(storageKey) || 0);
      const state = { mode: 'playing', score: 0, combo: 0, time: 0, cameraY: 0, targetX: WIDTH * 0.5, pointerActive: false, player: null, platforms: [], pickups: [], seed: 17 };
      window.__EMOJI_HOPPER_DEBUG__ = { reference: ${JSON.stringify(config.sourceGame)}, mechanics: ['autoBounce', 'horizontalSteer', 'fragilePlatforms', 'skeletonPlatforms', 'emojiBoosts'], portraitCanvas: [WIDTH, HEIGHT] };
      function rng(seed) {
        let value = seed >>> 0;
        return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
      }
      let random = rng(state.seed);
      function rand() {
        return random();
      }
      function makePlatform(y, forcedType) {
        const roll = rand();
        const type = forcedType || (roll < 0.13 ? 'fragile' : roll < 0.22 ? 'skeleton' : roll < 0.3 ? 'boost' : 'normal');
        return {
          x: 34 + rand() * 250,
          y,
          w: 74 + rand() * 18,
          h: 18,
          type,
          broken: false,
          used: false,
        };
      }
      function makePickup(y) {
        return {
          x: 58 + rand() * 274,
          y,
          type: rand() < 0.5 ? 'emoji' : 'spark',
          active: true,
        };
      }
      function reset() {
        random = rng(state.seed);
        state.mode = 'playing';
        state.score = 0;
        state.combo = 0;
        state.time = 0;
        state.cameraY = 0;
        state.targetX = WIDTH * 0.5;
        state.pointerActive = false;
        state.player = { x: WIDTH * 0.5, y: 474, vx: 0, vy: -420, r: 16, boostTrail: 0 };
        state.platforms = [];
        state.pickups = [];
        for (let i = 0; i < 13; i++) {
          const y = 520 - i * 78;
          state.platforms.push(makePlatform(y, i < 3 ? 'normal' : undefined));
          if (i > 3 && i % 4 === 0) state.pickups.push(makePickup(y - 34));
        }
        render();
      }
      function spawnAhead() {
        let topY = state.platforms.reduce((min, platform) => Math.min(min, platform.y), Infinity);
        while (topY > state.cameraY - 920) {
          topY -= 68 + rand() * 26;
          state.platforms.push(makePlatform(topY));
          if (rand() < 0.32) state.pickups.push(makePickup(topY - 30));
        }
        state.platforms = state.platforms.filter((platform) => platform.y < state.cameraY + HEIGHT + 120 && !platform.broken);
        state.pickups = state.pickups.filter((pickup) => pickup.active && pickup.y < state.cameraY + HEIGHT + 140);
      }
      function lose(reason) {
        state.mode = 'lost';
        state.combo = 0;
        document.getElementById('statusText').textContent = reason || THEME.loseCopy;
      }
      function landOn(platform) {
        if (platform.type === 'skeleton') {
          lose(THEME.loseCopy);
          return;
        }
        state.combo += 1;
        state.player.vy = platform.type === 'boost' ? -705 : -540;
        state.player.boostTrail = platform.type === 'boost' ? 0.34 : 0.14;
        if (platform.type === 'fragile') platform.broken = true;
      }
      function collectPickup(pickup) {
        pickup.active = false;
        state.player.vy = -760;
        state.player.boostTrail = 0.48;
        state.combo += 2;
      }
      function updateScore() {
        state.score = Math.max(state.score, Math.max(0, Math.floor((-state.cameraY + 40) / 22)));
        if (state.score > best) {
          best = state.score;
          localStorage.setItem(storageKey, String(best));
        }
      }
      function step(ms) {
        const dt = Math.min(0.032, ms / 1000);
        state.time += dt;
        if (state.mode !== 'playing') {
          render();
          return;
        }
        const player = state.player;
        const previousY = player.y;
        const drift = Math.max(-1, Math.min(1, (state.targetX - player.x) / 86));
        player.vx = drift * 205;
        player.vy += 1480 * dt;
        player.x += player.vx * dt;
        player.y += player.vy * dt;
        if (player.x < -18) player.x = WIDTH + 18;
        if (player.x > WIDTH + 18) player.x = -18;
        if (player.vy > 0) {
          const landing = state.platforms
            .filter((platform) => !platform.broken && player.x + player.r > platform.x && player.x - player.r < platform.x + platform.w)
            .find((platform) => previousY + player.r <= platform.y && player.y + player.r >= platform.y);
          if (landing) landOn(landing);
        }
        state.pickups.forEach((pickup) => {
          if (!pickup.active) return;
          if (Math.hypot(player.x - pickup.x, player.y - pickup.y) < player.r + 18) collectPickup(pickup);
        });
        if (player.y - state.cameraY < 204) state.cameraY = player.y - 204;
        player.boostTrail = Math.max(0, player.boostTrail - dt);
        spawnAhead();
        updateScore();
        if (player.y - state.cameraY > HEIGHT + 44) lose(THEME.loseCopy);
        render();
      }
      function drawBackdrop() {
        const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        grad.addColorStop(0, THEME.skyA);
        grad.addColorStop(1, THEME.skyB);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        for (let i = 0; i < 14; i++) {
          const x = (i * 31 + state.time * 14) % (WIDTH + 40) - 20;
          const y = 48 + (i * 37 % 460);
          ctx.fillStyle = 'rgba(255,255,255,.08)';
          ctx.beginPath();
          ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      function drawPlatform(platform) {
        const y = platform.y - state.cameraY;
        if (y < -40 || y > HEIGHT + 40) return;
        const color = platform.type === 'fragile' ? THEME.fragile : platform.type === 'skeleton' ? THEME.skeleton : platform.type === 'boost' ? THEME.boost : THEME.normal;
        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(255,255,255,.72)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(platform.x, y - 10, platform.w, 20, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(8,9,16,.45)';
        ctx.beginPath();
        ctx.arc(platform.x + 18, y - 2, 3, 0, Math.PI * 2);
        ctx.arc(platform.x + platform.w - 18, y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        if (platform.type === 'fragile') {
          ctx.strokeStyle = 'rgba(255,255,255,.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(platform.x + 16, y + 5);
          ctx.lineTo(platform.x + platform.w * 0.48, y - 4);
          ctx.lineTo(platform.x + platform.w - 18, y + 4);
          ctx.stroke();
        } else if (platform.type === 'skeleton') {
          ctx.fillStyle = 'rgba(255,255,255,.94)';
          ctx.font = '900 16px sans-serif';
          ctx.fillText('☠', platform.x + platform.w * 0.5 - 8, y + 6);
        } else if (platform.type === 'boost') {
          ctx.fillStyle = 'rgba(255,255,255,.94)';
          ctx.font = '900 14px sans-serif';
          ctx.fillText('↟', platform.x + platform.w * 0.5 - 5, y + 5);
        }
      }
      function drawPickups() {
        state.pickups.forEach((pickup) => {
          if (!pickup.active) return;
          const y = pickup.y - state.cameraY;
          if (y < -40 || y > HEIGHT + 40) return;
          ctx.fillStyle = THEME.pickup;
          ctx.beginPath();
          ctx.arc(pickup.x, y, 17, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1d1027';
          ctx.font = '900 16px sans-serif';
          ctx.fillText(pickup.type === 'emoji' ? '😎' : '✦', pickup.x - 9, y + 6);
        });
      }
      function drawPlayer() {
        const y = state.player.y - state.cameraY;
        if (state.player.boostTrail > 0) {
          ctx.fillStyle = 'rgba(255,233,110,' + Math.max(0.16, state.player.boostTrail).toFixed(3) + ')';
          ctx.beginPath();
          ctx.ellipse(state.player.x, y + 18, 14, 28, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = THEME.player;
        ctx.beginPath();
        ctx.arc(state.player.x, y, state.player.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#190f1b';
        ctx.beginPath();
        ctx.arc(state.player.x - 5, y - 3, 2.2, 0, Math.PI * 2);
        ctx.arc(state.player.x + 5, y - 3, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#190f1b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.player.x, y + 4, 6, .2, Math.PI - .2);
        ctx.stroke();
      }
      function render() {
        drawBackdrop();
        state.platforms.forEach(drawPlatform);
        drawPickups();
        drawPlayer();
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.font = '900 26px sans-serif';
        ctx.fillText(THEME.heading, 18, 34);
        ctx.fillStyle = 'rgba(255,255,255,.68)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.subheading, 18, 54);
        ctx.fillText('SCORE ' + state.score, 18, 86);
        ctx.fillText('BEST ' + best, 148, 86);
        ctx.fillText('COMBO ' + state.combo, 264, 86);
        document.getElementById('scoreText').textContent = String(state.score);
        document.getElementById('bestText').textContent = String(best);
        document.getElementById('boostText').textContent = String(state.combo);
        document.getElementById('statusText').textContent = state.mode === 'lost' ? THEME.loseCopy : THEME.hint;
      }
      function setTarget(clientX) {
        const rect = canvas.getBoundingClientRect();
        state.targetX = (clientX - rect.left) * WIDTH / rect.width;
      }
      canvas.addEventListener('pointerdown', (event) => {
        state.pointerActive = true;
        setTarget(event.clientX);
      });
      canvas.addEventListener('pointermove', (event) => {
        if (!state.pointerActive) return;
        setTarget(event.clientX);
      });
      canvas.addEventListener('pointerup', () => {
        state.pointerActive = false;
      });
      canvas.addEventListener('pointercancel', () => {
        state.pointerActive = false;
      });
      window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') state.targetX = Math.max(22, state.targetX - 42);
        if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') state.targetX = Math.min(WIDTH - 22, state.targetX + 42);
      });
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(() => step(16), 16);
      window.advanceTime = (ms) => step(ms);
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 vertical hopper',
        mode: state.mode,
        score: state.score,
        best,
        combo: state.combo,
        cameraY: Math.round(state.cameraY),
        player: { x: Math.round(state.player.x), y: Math.round(state.player.y), vy: Math.round(state.player.vy) },
        platformTypes: state.platforms.reduce((acc, platform) => {
          acc[platform.type] = (acc[platform.type] || 0) + 1;
          return acc;
        }, {}),
        pickups: state.pickups.filter((pickup) => pickup.active).length
      });
    `,
  };
}

const emojiHopperGame = createEmojiHopperGame({
  id: 'emoji-gator-hop',
  file: 'emoji-gator-hop.html',
  title: '表情踩鳄梯',
  sourceGame: 'TikTok hidden emoji DM game',
  accent: '#74f4b4',
  summary: '左右挪动表情往上蹦，踩断裂鳄梯会塌，碰上表情加速泡能一口气冲高。',
  heading: '表情踩鳄梯',
  subheading: '热点复刻 · 自动弹跳、断台、骷髅台和表情加速都压进一屏',
  hint: '左右挪动接下一只鳄梯，灰骷髅别踩，吃到表情泡会猛冲一段。',
  winlessCopy: '',
  loseCopy: '掉出镜头了，重新连踩一把。',
  skyA: '#103d2d',
  skyB: '#07140f',
  cloud: '#9ff7d4',
  normal: '#74f4b4',
  fragile: '#ffe07c',
  skeleton: '#76808c',
  boost: '#ffb14f',
  player: '#fff77d',
  pickup: '#ffd966',
});

const officeHopRemixGame = createEmojiHopperGame({
  id: 'office-hop-stack',
  file: 'office-hop-stack.html',
  title: '工牌踩箱梯',
  sourceGame: '表情踩鳄梯 Remix',
  accent: '#7dd3fc',
  summary: '把踩鳄跳高改成夜班工位箱梯，踩碎纸箱会塌，咖啡徽章是冲刺加速。',
  heading: '工牌踩箱梯',
  subheading: '二创版 · 文档托盘代替鳄梯，咖啡冲刺保留那种社交 App 小玩具节奏',
  hint: '向左右接文件托盘，破箱只吃一次，咖啡徽章能把你往上顶。',
  winlessCopy: '',
  loseCopy: '工牌掉回一楼大厅了，晚班重开。',
  skyA: '#12263d',
  skyB: '#070c14',
  cloud: '#b2ecff',
  normal: '#7dd3fc',
  fragile: '#f9c873',
  skeleton: '#8f95a3',
  boost: '#6ee7b7',
  player: '#fef3c7',
  pickup: '#6ee7b7',
});

const tubeSortLevel = {
  capacity: 4,
  tubes: [
    ['pink', 'blue', 'amber', 'teal'],
    ['teal', 'pink', 'amber', 'blue'],
    ['amber', 'teal', 'blue', 'pink'],
    ['blue', 'amber', 'pink', 'teal'],
    [],
    [],
  ],
};

function createTubeSortGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    moveLabel: config.moveLabel,
    hintLabel: config.hintLabel,
    selectedLabel: config.selectedLabel,
    winCopy: config.winCopy,
    idleCopy: config.idleCopy,
    accent: config.accent,
    bgA: config.bgA,
    bgB: config.bgB,
    glass: config.glass,
    glassStroke: config.glassStroke,
    shadow: config.shadow,
    colors: config.colors,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '分拣',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="moveText">${config.moveLabel} 0</b><span id="hintText">${config.hintLabel}</span></div>
        <p id="statusText">${config.idleCopy}</p>
        <button class="primary" id="resetBtn">重开这一局</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const LEVEL = ${JSON.stringify(tubeSortLevel)};
      const THEME = ${JSON.stringify(theme)};
      const tubeRects = [
        { x: 44, y: 132, w: 74, h: 182 },
        { x: 158, y: 132, w: 74, h: 182 },
        { x: 272, y: 132, w: 74, h: 182 },
        { x: 101, y: 338, w: 74, h: 182 },
        { x: 215, y: 338, w: 74, h: 182 },
        { x: 329, y: 338, w: 74, h: 182 }
      ].map((tube) => ({ ...tube, x: tube.x - 37 }));
      const state = { tubes: [], selected: null, moves: 0, mode: 'playing' };
      function cloneLevel() {
        return LEVEL.tubes.map((tube) => tube.slice());
      }
      function topColor(index) {
        const tube = state.tubes[index];
        return tube && tube.length ? tube[tube.length - 1] : null;
      }
      function topRun(index) {
        const tube = state.tubes[index];
        if (!tube || !tube.length) return 0;
        const color = tube[tube.length - 1];
        let count = 0;
        for (let i = tube.length - 1; i >= 0; i--) {
          if (tube[i] !== color) break;
          count += 1;
        }
        return count;
      }
      function freeSlots(index) {
        return LEVEL.capacity - state.tubes[index].length;
      }
      function solvedTube(tube) {
        return tube.length === LEVEL.capacity && tube.every((color) => color === tube[0]);
      }
      function checkWin() {
        return state.tubes.every((tube) => tube.length === 0 || solvedTube(tube));
      }
      function canPour(from, to) {
        if (from === to || from == null || to == null) return false;
        const source = state.tubes[from];
        const target = state.tubes[to];
        if (!source.length || target.length >= LEVEL.capacity) return false;
        if (!target.length) return true;
        return topColor(from) === topColor(to) && freeSlots(to) > 0;
      }
      function reset() {
        state.tubes = cloneLevel();
        state.selected = null;
        state.moves = 0;
        state.mode = 'playing';
        render();
      }
      function pour(from, to) {
        if (!canPour(from, to) || state.mode !== 'playing') return false;
        const amount = Math.min(topRun(from), freeSlots(to));
        const color = topColor(from);
        for (let i = 0; i < amount; i++) {
          state.tubes[from].pop();
          state.tubes[to].push(color);
        }
        state.moves += 1;
        state.selected = null;
        if (checkWin()) state.mode = 'won';
        render();
        return true;
      }
      function tubeAt(x, y) {
        return tubeRects.findIndex((tube) => x >= tube.x && x <= tube.x + tube.w && y >= tube.y && y <= tube.y + tube.h);
      }
      function handleTap(index) {
        if (index < 0 || state.mode !== 'playing') return;
        const tube = state.tubes[index];
        if (state.selected == null) {
          if (!tube.length) return;
          state.selected = index;
          render();
          return;
        }
        if (state.selected === index) {
          state.selected = null;
          render();
          return;
        }
        if (!pour(state.selected, index)) {
          if (tube.length) state.selected = index;
          else state.selected = null;
          render();
        }
      }
      function pointer(event) {
        const box = canvas.getBoundingClientRect();
        const x = (event.clientX - box.left) * canvas.width / box.width;
        const y = (event.clientY - box.top) * canvas.height / box.height;
        handleTap(tubeAt(x, y));
      }
      function drawOrb(x, y, colorKey, label) {
        const meta = THEME.colors[colorKey];
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, Math.PI * 2);
        ctx.fillStyle = meta.fill;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,.7)';
        ctx.stroke();
        ctx.fillStyle = '#22140d';
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label || meta.glyph, x, y + 1);
      }
      function drawTube(tube, index) {
        const rect = tubeRects[index];
        const selected = state.selected === index;
        const targetable = state.selected != null && canPour(state.selected, index);
        ctx.save();
        ctx.fillStyle = THEME.glass;
        ctx.strokeStyle = targetable ? THEME.accent : selected ? '#fff7d6' : THEME.glassStroke;
        ctx.lineWidth = selected || targetable ? 4 : 3;
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 24);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rect.x + 14, rect.y + 16);
        ctx.lineTo(rect.x + 14, rect.y + rect.h - 14);
        ctx.lineTo(rect.x + rect.w - 14, rect.y + rect.h - 14);
        ctx.lineTo(rect.x + rect.w - 14, rect.y + 16);
        ctx.strokeStyle = 'rgba(255,255,255,.16)';
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let i = 0; i < LEVEL.capacity; i++) {
          const colorKey = tube[i];
          const cy = rect.y + rect.h - 28 - i * 38;
          if (colorKey) drawOrb(rect.x + rect.w / 2, cy, colorKey);
          else {
            ctx.beginPath();
            ctx.arc(rect.x + rect.w / 2, cy, 24, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,.08)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
        if (selected) {
          ctx.fillStyle = THEME.accent;
          ctx.font = '900 12px sans-serif';
          ctx.fillText(THEME.selectedLabel, rect.x + rect.w / 2, rect.y - 12);
        }
        ctx.restore();
      }
      function render() {
        const bg = ctx.createLinearGradient(0, 0, 0, 560);
        bg.addColorStop(0, THEME.bgA);
        bg.addColorStop(1, THEME.bgB);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#fff';
        ctx.font = '900 27px sans-serif';
        ctx.fillText(THEME.heading, 24, 44);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.subheading, 24, 64);
        ctx.fillStyle = THEME.shadow;
        ctx.beginPath();
        ctx.ellipse(195, 522, 142, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        state.tubes.forEach((tube, index) => drawTube(tube, index));
        document.getElementById('moveText').textContent = THEME.moveLabel + ' ' + state.moves;
        document.getElementById('hintText').textContent = state.selected == null
          ? THEME.hintLabel
          : THEME.selectedLabel + ' ' + (state.selected + 1);
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? THEME.winCopy
          : state.selected == null
            ? THEME.idleCopy
            : '把上层连续同色倒进空瓶，或倒到同色顶层。';
      }
      canvas.addEventListener('pointerdown', pointer);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 tube sort board',
        mode: state.mode,
        selected: state.selected,
        moves: state.moves,
        solved: state.tubes.filter((tube) => solvedTube(tube)).length,
        tops: state.tubes.map((tube) => tube.length ? tube[tube.length - 1] : null),
        tubes: state.tubes.map((tube) => tube.slice())
      });
    `,
  };
}

const marbleSortGame = createTubeSortGame({
  id: 'marble-sort-fake',
  file: 'marble-sort-fake.html',
  title: '弹珠分色瓶',
  sourceGame: 'Marble Sort! / Water Sort Puzzle 式单指分拣',
  accent: '#67e8f9',
  summary: '选一瓶，把顶层连续同色弹珠倒进空瓶或同色瓶，直到每瓶只剩一种颜色。',
  heading: '弹珠分色瓶',
  subheading: '热门 sorting 复刻 · 单指换瓶、同色归位、短局高复玩',
  moveLabel: '手数',
  hintLabel: '点一瓶选中',
  selectedLabel: '已选',
  winCopy: '所有颜色都归瓶了，这一把分得很干净。',
  idleCopy: '把顶层连续同色倒进空瓶，或倒到同色顶层。',
  bgA: '#0f1728',
  bgB: '#06080f',
  glass: 'rgba(255,255,255,.08)',
  glassStroke: 'rgba(151,238,255,.48)',
  shadow: 'rgba(0,0,0,.34)',
  colors: {
    pink: { fill: '#fb7185', glyph: '莓' },
    blue: { fill: '#60a5fa', glyph: '冰' },
    amber: { fill: '#fbbf24', glyph: '蜜' },
    teal: { fill: '#2dd4bf', glyph: '青' },
  },
});

const milkTeaSortRemixGame = createTubeSortGame({
  id: 'milk-tea-sorter',
  file: 'milk-tea-sorter.html',
  title: '奶茶封杯局',
  sourceGame: '弹珠分色瓶 Remix',
  accent: '#f59e0b',
  summary: '把弹珠换成奶茶配料杯，还是同一套换杯分拣节奏，但更像门店备料台。',
  heading: '奶茶封杯局',
  subheading: '二创版 · 把分色瓶改成奶茶备料杯与封杯台',
  moveLabel: '出杯',
  hintLabel: '点一杯选中',
  selectedLabel: '封杯位',
  winCopy: '所有配料都分杯封好了，这单能顺畅出餐了。',
  idleCopy: '先选一杯，再把顶层同料倒进空杯或同料顶层。',
  bgA: '#28160b',
  bgB: '#100907',
  glass: 'rgba(255,244,220,.08)',
  glassStroke: 'rgba(255,206,132,.5)',
  shadow: 'rgba(0,0,0,.38)',
  colors: {
    pink: { fill: '#f472b6', glyph: '莓' },
    blue: { fill: '#7dd3fc', glyph: '冻' },
    amber: { fill: '#fbbf24', glyph: '珠' },
    teal: { fill: '#86efac', glyph: '椰' },
  },
});

const woolSortLevel = {
  capacity: 4,
  spools: [
    ['coral', 'sky', 'gold', 'mint'],
    ['mint', 'coral', 'gold', 'sky'],
    ['gold', 'mint', 'sky', 'coral'],
    ['sky', 'gold', 'coral', 'mint'],
    [],
    [],
  ],
  embroidery: [
    ['gold', 'gold', 'coral', 'coral', 'mint', 'mint', 'sky', 'sky'],
    ['gold', 'coral', 'coral', 'mint', 'mint', 'sky', 'sky', 'gold'],
    ['coral', 'coral', 'mint', 'mint', 'sky', 'sky', 'gold', 'gold'],
    ['coral', 'mint', 'mint', 'sky', 'sky', 'gold', 'gold', 'coral'],
    ['mint', 'mint', 'sky', 'sky', 'gold', 'gold', 'coral', 'coral'],
    ['mint', 'sky', 'sky', 'gold', 'gold', 'coral', 'coral', 'mint'],
  ],
};

function createWoolSortGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    moveLabel: config.moveLabel,
    hintLabel: config.hintLabel,
    selectedLabel: config.selectedLabel,
    artLabel: config.artLabel,
    doneCopy: config.doneCopy,
    winCopy: config.winCopy,
    idleCopy: config.idleCopy,
    accent: config.accent,
    bgA: config.bgA,
    bgB: config.bgB,
    panel: config.panel,
    line: config.line,
    colors: config.colors,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '绕线',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="moveText">${config.moveLabel} 0</b><span id="progressText">${config.artLabel} 0 / 4</span></div>
        <p id="statusText">${config.idleCopy}</p>
        <button class="primary" id="resetBtn">重开这一绷</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const LEVEL = ${JSON.stringify(woolSortLevel)};
      const THEME = ${JSON.stringify(theme)};
      const spoolRects = [
        { x: 32, y: 126, w: 92, h: 170 },
        { x: 149, y: 126, w: 92, h: 170 },
        { x: 266, y: 126, w: 92, h: 170 },
        { x: 90, y: 318, w: 92, h: 170 },
        { x: 207, y: 318, w: 92, h: 170 },
        { x: 324, y: 318, w: 92, h: 170 }
      ].map((spool) => ({ ...spool, x: spool.x - 46 }));
      const state = { spools: [], selected: null, moves: 0, mode: 'playing', stitched: [] };
      function cloneLevel() {
        return LEVEL.spools.map((spool) => spool.slice());
      }
      function topColor(index) {
        const spool = state.spools[index];
        return spool && spool.length ? spool[spool.length - 1] : null;
      }
      function topRun(index) {
        const spool = state.spools[index];
        if (!spool || !spool.length) return 0;
        const color = topColor(index);
        let count = 0;
        for (let i = spool.length - 1; i >= 0; i--) {
          if (spool[i] !== color) break;
          count += 1;
        }
        return count;
      }
      function freeSlots(index) {
        return LEVEL.capacity - state.spools[index].length;
      }
      function solvedSpool(spool) {
        return spool.length === LEVEL.capacity && spool.every((color) => color === spool[0]);
      }
      function solvedCount() {
        return state.spools.filter((spool) => solvedSpool(spool)).length;
      }
      function checkWin() {
        return state.spools.every((spool) => spool.length === 0 || solvedSpool(spool));
      }
      function canPour(from, to) {
        if (from === to || from == null || to == null) return false;
        const source = state.spools[from];
        const target = state.spools[to];
        if (!source.length || target.length >= LEVEL.capacity) return false;
        if (!target.length) return true;
        return topColor(from) === topColor(to) && freeSlots(to) > 0;
      }
      function refreshEmbroidery() {
        const next = [];
        const solved = new Set(state.spools.filter((spool) => solvedSpool(spool)).map((spool) => spool[0]));
        LEVEL.embroidery.forEach((row, y) => row.forEach((color, x) => {
          if (solved.has(color)) next.push({ x, y, color });
        }));
        state.stitched = next;
      }
      function reset() {
        state.spools = cloneLevel();
        state.selected = null;
        state.moves = 0;
        state.mode = 'playing';
        state.stitched = [];
        refreshEmbroidery();
        render();
      }
      function pour(from, to) {
        if (!canPour(from, to) || state.mode !== 'playing') return false;
        const amount = Math.min(topRun(from), freeSlots(to));
        const color = topColor(from);
        for (let i = 0; i < amount; i++) {
          state.spools[from].pop();
          state.spools[to].push(color);
        }
        state.moves += 1;
        state.selected = null;
        refreshEmbroidery();
        if (checkWin()) state.mode = 'won';
        render();
        return true;
      }
      function spoolAt(x, y) {
        return spoolRects.findIndex((spool) => x >= spool.x && x <= spool.x + spool.w && y >= spool.y && y <= spool.y + spool.h);
      }
      function handleTap(index) {
        if (index < 0 || state.mode !== 'playing') return;
        const spool = state.spools[index];
        if (state.selected == null) {
          if (!spool.length) return;
          state.selected = index;
          render();
          return;
        }
        if (state.selected === index) {
          state.selected = null;
          render();
          return;
        }
        if (!pour(state.selected, index)) {
          if (spool.length) state.selected = index;
          else state.selected = null;
          render();
        }
      }
      function pointer(event) {
        const box = canvas.getBoundingClientRect();
        const x = (event.clientX - box.left) * canvas.width / box.width;
        const y = (event.clientY - box.top) * canvas.height / box.height;
        handleTap(spoolAt(x, y));
      }
      function drawEmbroidery() {
        const ox = 28;
        const oy = 24;
        const cell = 18;
        ctx.fillStyle = 'rgba(255,255,255,.06)';
        ctx.beginPath();
        ctx.roundRect(18, 16, 208, 132, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.12)';
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let y = 0; y < LEVEL.embroidery.length; y++) {
          for (let x = 0; x < LEVEL.embroidery[y].length; x++) {
            ctx.fillStyle = 'rgba(255,255,255,.05)';
            ctx.fillRect(ox + x * cell, oy + y * cell, cell - 2, cell - 2);
          }
        }
        state.stitched.forEach((stitch) => {
          const meta = THEME.colors[stitch.color];
          const px = ox + stitch.x * cell + 1;
          const py = oy + stitch.y * cell + 1;
          ctx.fillStyle = meta.fill;
          ctx.fillRect(px, py, cell - 4, cell - 4);
          ctx.strokeStyle = 'rgba(255,255,255,.48)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(px + 3, py + 3);
          ctx.lineTo(px + cell - 7, py + cell - 7);
          ctx.moveTo(px + cell - 7, py + 3);
          ctx.lineTo(px + 3, py + cell - 7);
          ctx.stroke();
        });
        ctx.fillStyle = '#fff';
        ctx.font = '900 18px sans-serif';
        ctx.fillText(THEME.heading, 244, 42);
        ctx.fillStyle = 'rgba(255,255,255,.74)';
        ctx.font = '700 11px sans-serif';
        ctx.fillText(THEME.subheading, 244, 60);
      }
      function drawSpool(spool, index) {
        const rect = spoolRects[index];
        const selected = state.selected === index;
        const targetable = state.selected != null && canPour(state.selected, index);
        const solved = solvedSpool(spool);
        ctx.save();
        ctx.fillStyle = solved ? 'rgba(255,255,255,.14)' : THEME.panel;
        ctx.strokeStyle = targetable ? THEME.accent : selected ? '#fff4d4' : THEME.line;
        ctx.lineWidth = selected || targetable ? 3.5 : 2;
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 26);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.fillRect(rect.x + 18, rect.y + 14, rect.w - 36, 10);
        ctx.fillRect(rect.x + 18, rect.y + rect.h - 24, rect.w - 36, 10);
        for (let i = 0; i < LEVEL.capacity; i++) {
          const colorKey = spool[i];
          const cy = rect.y + rect.h - 42 - i * 26;
          if (colorKey) {
            const meta = THEME.colors[colorKey];
            ctx.strokeStyle = meta.fill;
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(rect.x + 24, cy);
            ctx.bezierCurveTo(rect.x + 40, cy - 12, rect.x + 52, cy + 12, rect.x + 68, cy);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(rect.x + 26, cy + 9);
            ctx.bezierCurveTo(rect.x + 42, cy - 3, rect.x + 54, cy + 21, rect.x + 70, cy + 9);
            ctx.stroke();
          } else {
            ctx.strokeStyle = 'rgba(255,255,255,.08)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rect.x + 24, cy + 4);
            ctx.lineTo(rect.x + 68, cy + 4);
            ctx.stroke();
          }
        }
        if (selected) {
          ctx.fillStyle = THEME.accent;
          ctx.font = '900 12px sans-serif';
          ctx.fillText(THEME.selectedLabel, rect.x + 20, rect.y - 10);
        } else if (solved) {
          ctx.fillStyle = '#fff3c4';
          ctx.font = '900 12px sans-serif';
          ctx.fillText(THEME.doneCopy, rect.x + 18, rect.y - 10);
        }
        ctx.restore();
      }
      function render() {
        const bg = ctx.createLinearGradient(0, 0, 0, 560);
        bg.addColorStop(0, THEME.bgA);
        bg.addColorStop(1, THEME.bgB);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 390, 560);
        drawEmbroidery();
        state.spools.forEach((spool, index) => drawSpool(spool, index));
        document.getElementById('moveText').textContent = THEME.moveLabel + ' ' + state.moves;
        document.getElementById('progressText').textContent = THEME.artLabel + ' ' + solvedCount() + ' / 4';
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? THEME.winCopy
          : state.selected == null
            ? THEME.idleCopy
            : '把顶层连续同色绕到空卷轴，或绕到同色顶层卷轴。';
      }
      canvas.addEventListener('pointerdown', pointer);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 wool sort board with embroidery preview',
        mode: state.mode,
        selected: state.selected,
        moves: state.moves,
        solved: solvedCount(),
        tops: state.spools.map((spool) => spool.length ? spool[spool.length - 1] : null),
        spools: state.spools.map((spool) => spool.slice()),
        stitched: state.stitched.length
      });
    `,
  };
}

const woolSortBaseGame = createWoolSortGame({
  id: 'wool-sort-fake',
  file: 'wool-sort-fake.html',
  title: '线团绣图局',
  sourceGame: 'Wool Sort 式绕线分拣 + 像素绣图显现',
  accent: '#f472b6',
  summary: '按同色把线团倒进空卷轴或同色卷轴，四卷归齐后整张绣图才会完整显出来。',
  heading: '线团绣图局',
  subheading: '热门 Wool Sort 复刻 · 绕线归色后，像素绣片会一块块亮出来',
  moveLabel: '绕线',
  hintLabel: '点一卷选中',
  selectedLabel: '已选',
  artLabel: '绣片',
  doneCopy: '已绣好',
  winCopy: '四色线团都理顺了，整张绣片也终于收针。',
  idleCopy: '先选一卷，再把顶层同色绕到空卷轴或同色顶层。',
  bgA: '#261228',
  bgB: '#0f0913',
  panel: 'rgba(255,255,255,.08)',
  line: 'rgba(255,214,234,.34)',
  colors: {
    coral: { fill: '#fb7185' },
    sky: { fill: '#67e8f9' },
    gold: { fill: '#fbbf24' },
    mint: { fill: '#86efac' },
  },
});

const officeWoolRemixGame = createWoolSortGame({
  id: 'office-loom-sort',
  file: 'office-loom-sort.html',
  title: '工位理线板',
  sourceGame: '线团绣图局 Remix',
  accent: '#60a5fa',
  summary: '把绣线改成工位排线：四种线束理顺后，面板上的工牌像素图才会完整亮起。',
  heading: '工位理线板',
  subheading: '二创版 · 把绣图换成工牌面板，理线动作还是那套短局节奏',
  moveLabel: '排线',
  hintLabel: '点一卷选中',
  selectedLabel: '已夹',
  artLabel: '工牌图',
  doneCopy: '已归束',
  winCopy: '四路线束都夹顺了，整块工牌面板终于亮全。',
  idleCopy: '先选一卷，再把顶层同色线束绕进空轴或同色线轴。',
  bgA: '#132234',
  bgB: '#081019',
  panel: 'rgba(182,220,255,.08)',
  line: 'rgba(151,213,255,.34)',
  colors: {
    coral: { fill: '#fb7185' },
    sky: { fill: '#60a5fa' },
    gold: { fill: '#fbbf24' },
    mint: { fill: '#34d399' },
  },
});

function createPixelFlowGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    queueLabel: config.queueLabel,
    slotLabel: config.slotLabel,
    overflowLabel: config.overflowLabel,
    readyCopy: config.readyCopy,
    jamCopy: config.jamCopy,
    bgA: config.bgA,
    bgB: config.bgB,
    belt: config.belt,
    beltGlow: config.beltGlow,
    panel: config.panel,
    targetBack: config.targetBack,
    colors: config.colors,
    pixels: config.pixels,
    queuePattern: config.queuePattern,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '环流',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact stack">
        <div class="row"><b id="queueText"></b><span id="overflowText"></span></div>
        <div class="tray" id="slotRack"></div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">重开这一环</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const THEME = ${JSON.stringify(theme)};
      const pathPoints = [
        { x: 92, y: 94 }, { x: 150, y: 94 }, { x: 208, y: 94 }, { x: 266, y: 94 }, { x: 324, y: 94 },
        { x: 324, y: 150 }, { x: 324, y: 206 }, { x: 324, y: 262 }, { x: 324, y: 318 },
        { x: 266, y: 374 }, { x: 208, y: 374 }, { x: 150, y: 374 }, { x: 92, y: 374 },
        { x: 92, y: 318 }, { x: 92, y: 262 }, { x: 92, y: 206 }, { x: 92, y: 150 }
      ];
      const pixelCells = THEME.pixels.map((color, index) => ({
        color,
        painted: false,
        x: 141 + (index % 4) * 28,
        y: 168 + Math.floor(index / 4) * 28
      }));
      const spawnEvery = 2;
      const maxOverflow = 5;
      const slotAmmo = 3;
      const state = {
        carriers: [],
        slots: [],
        queueIndex: 0,
        tick: 0,
        spawnCursor: 0,
        nextColor: '',
        overflow: 0,
        painted: 0,
        score: 0,
        mode: 'playing'
      };
      function colorMeta(key) {
        return THEME.colors[key];
      }
      function nextQueueColor() {
        const key = THEME.queuePattern[state.queueIndex % THEME.queuePattern.length];
        state.queueIndex += 1;
        return key;
      }
      function reset() {
        state.carriers = [];
        state.slots = Array.from({ length: 5 }, () => null);
        state.queueIndex = 0;
        state.tick = 0;
        state.spawnCursor = 0;
        state.nextColor = nextQueueColor();
        state.overflow = 0;
        state.painted = 0;
        state.score = 0;
        state.mode = 'playing';
        pixelCells.forEach((cell) => { cell.painted = false; });
        render();
      }
      function slotState(slot) {
        if (!slot) return 'empty';
        return slot.spent ? 'spent' : 'armed';
      }
      function deploy(slotIndex) {
        if (state.mode !== 'playing') return;
        const slot = state.slots[slotIndex];
        if (!slot) {
          state.slots[slotIndex] = { color: state.nextColor, ammo: slotAmmo, spent: false, flash: 18 };
          state.nextColor = nextQueueColor();
        } else if (slot.spent) {
          state.slots[slotIndex] = null;
        }
        if (state.slots.every((item) => item && item.spent)) state.mode = 'lost';
        render();
      }
      function paintPixel(color) {
        const target = pixelCells.find((cell) => !cell.painted && cell.color === color);
        if (!target) return false;
        target.painted = true;
        state.painted += 1;
        state.score += 10;
        if (state.painted >= pixelCells.length) state.mode = 'won';
        return true;
      }
      function fireSlots() {
        for (const slot of state.slots) {
          if (!slot || slot.spent || state.mode !== 'playing') continue;
          const target = state.carriers.find((carrier) => carrier.step >= 2 && carrier.step <= 12 && carrier.color === slot.color);
          if (!target) continue;
          target.hit = true;
          slot.ammo -= 1;
          slot.flash = 8;
          paintPixel(slot.color);
          if (slot.ammo <= 0) slot.spent = true;
        }
        state.carriers = state.carriers.filter((carrier) => !carrier.hit);
      }
      function moveCarriers() {
        const survivors = [];
        for (const carrier of state.carriers) {
          carrier.step += 1;
          if (carrier.step >= pathPoints.length) {
            state.overflow += 1;
            if (state.overflow >= maxOverflow) state.mode = 'lost';
          } else {
            survivors.push(carrier);
          }
        }
        state.carriers = survivors;
      }
      function spawnCarrier() {
        if (state.mode !== 'playing') return;
        if (state.tick % spawnEvery !== 0) return;
        if (state.carriers.some((carrier) => carrier.step === 0)) return;
        const color = THEME.queuePattern[state.spawnCursor % THEME.queuePattern.length];
        state.spawnCursor += 1;
        state.carriers.push({ color, step: 0, wobble: (state.spawnCursor % 3) * 0.35 });
      }
      function step() {
        if (state.mode !== 'playing') return render();
        state.tick += 1;
        moveCarriers();
        spawnCarrier();
        fireSlots();
        if (state.slots.every((item) => item && item.spent)) state.mode = 'lost';
        render();
      }
      function drawTarget() {
        ctx.fillStyle = THEME.targetBack;
        ctx.beginPath();
        ctx.roundRect(123, 148, 144, 144, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.18)';
        ctx.lineWidth = 2;
        ctx.stroke();
        pixelCells.forEach((cell) => {
          const meta = colorMeta(cell.color);
          ctx.fillStyle = cell.painted ? meta.fill : 'rgba(255,255,255,.08)';
          ctx.fillRect(cell.x, cell.y, 22, 22);
          ctx.strokeStyle = cell.painted ? 'rgba(255,255,255,.72)' : 'rgba(255,255,255,.12)';
          ctx.strokeRect(cell.x, cell.y, 22, 22);
        });
      }
      function drawBelt() {
        ctx.strokeStyle = THEME.belt;
        ctx.lineWidth = 18;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        ctx.closePath();
        ctx.stroke();
        ctx.strokeStyle = THEME.beltGlow;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      function drawCarrier(carrier) {
        const point = pathPoints[carrier.step];
        if (!point) return;
        const meta = colorMeta(carrier.color);
        ctx.save();
        ctx.translate(point.x, point.y + Math.sin((state.tick + carrier.wobble) * 0.6) * 2);
        ctx.fillStyle = meta.fill;
        ctx.beginPath();
        ctx.roundRect(-16, -12, 32, 24, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.76)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#120d16';
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.glyph, 0, 1);
        ctx.restore();
      }
      function drawPorts() {
        const startX = 72;
        for (let i = 0; i < 5; i++) {
          const x = startX + i * 60;
          const slot = state.slots[i];
          ctx.fillStyle = slot ? (slot.spent ? '#3b2436' : THEME.panel) : 'rgba(255,255,255,.06)';
          ctx.beginPath();
          ctx.roundRect(x, 438, 46, 58, 14);
          ctx.fill();
          ctx.strokeStyle = slot ? 'rgba(255,255,255,.24)' : 'rgba(255,255,255,.12)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = '900 11px sans-serif';
          ctx.textAlign = 'center';
          if (!slot) {
            ctx.fillStyle = 'rgba(255,255,255,.46)';
            ctx.fillText('空槽', x + 23, 470);
          } else {
            const meta = colorMeta(slot.color);
            ctx.fillStyle = meta.fill;
            ctx.font = '900 22px sans-serif';
            ctx.fillText(meta.glyph, x + 23, 462);
            ctx.fillStyle = slot.spent ? '#ff9cb8' : '#fff';
            ctx.font = '900 11px sans-serif';
            ctx.fillText(slot.spent ? '点按清槽' : '电量 ' + slot.ammo, x + 23, 482);
          }
        }
        ctx.textAlign = 'left';
      }
      function syncRack() {
        const rack = document.getElementById('slotRack');
        rack.innerHTML = state.slots.map((slot, index) => {
          const stateText = slotState(slot);
          const label = !slot
            ? '部署'
            : slot.spent
              ? '清槽'
              : colorMeta(slot.color).label + ' ' + slot.ammo;
          return '<button class="chip ' + (stateText === 'spent' ? 'picked' : '') + '" data-slot="' + index + '">' + label + '<small>' + THEME.slotLabel + ' ' + (index + 1) + '</small></button>';
        }).join('');
      }
      function render() {
        const bg = ctx.createLinearGradient(0, 0, 0, 560);
        bg.addColorStop(0, THEME.bgA);
        bg.addColorStop(1, THEME.bgB);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#fff';
        ctx.font = '900 26px sans-serif';
        ctx.fillText(THEME.heading, 24, 42);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.subheading, 24, 62);
        drawBelt();
        drawTarget();
        state.carriers.forEach(drawCarrier);
        drawPorts();
        document.getElementById('queueText').textContent = THEME.queueLabel + ' ' + colorMeta(state.nextColor).label;
        document.getElementById('overflowText').textContent = THEME.overflowLabel + ' ' + state.overflow + '/' + maxOverflow;
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? THEME.readyCopy
          : state.mode === 'lost'
            ? THEME.jamCopy
            : '已点亮 ' + state.painted + '/' + pixelCells.length + ' 格 · 分数 ' + state.score + ' · 点空槽部署，点废槽清走。';
        syncRack();
      }
      document.getElementById('slotRack').addEventListener('click', (event) => {
        const target = event.target.closest('[data-slot]');
        if (!target) return;
        deploy(Number(target.dataset.slot || 0));
      });
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(step, 260);
      window.advanceTime = (ms) => {
        const steps = Math.max(1, Math.round(ms / 260));
        for (let i = 0; i < steps; i++) step();
      };
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 conveyor loop around 4x4 pixel target',
        mode: state.mode,
        score: state.score,
        overflow: state.overflow,
        next: colorMeta(state.nextColor).label,
        painted: state.painted,
        carriers: state.carriers.map((carrier) => ({ color: carrier.color, step: carrier.step })),
        slots: state.slots.map((slot) => slot ? { color: slot.color, ammo: slot.ammo, spent: slot.spent } : null)
      });
    `,
  };
}

const pixelFlowGame = createPixelFlowGame({
  id: 'pixel-loop-fake',
  file: 'pixel-loop-fake.html',
  title: '像素环流局',
  sourceGame: 'Pixel Flow 式实时环带清色',
  accent: '#ff8a4c',
  summary: '彩块沿环带绕图跑，点空槽部署同色清扫头，五格废槽全堵就崩盘。',
  heading: '像素环流局',
  subheading: '热点复刻 · 环带输送、同色清扫、五槽堵死即翻车',
  queueLabel: '下个清扫头',
  slotLabel: '工位',
  overflowLabel: '漏件',
  readyCopy: '整张像素图被你点亮了，这一环算是干净闭合。',
  jamCopy: '漏件太多，或者五个工位全成废槽，这环已经堵死了。',
  bgA: '#190f17',
  bgB: '#07080d',
  belt: '#2f2433',
  beltGlow: '#ffb067',
  panel: 'rgba(255,176,103,.18)',
  targetBack: 'rgba(255,255,255,.06)',
  colors: {
    coral: { fill: '#ff8a4c', glyph: '焰', label: '焰块' },
    aqua: { fill: '#4de7d5', glyph: '浪', label: '浪块' },
    lime: { fill: '#b6ef63', glyph: '芽', label: '芽块' },
    violet: { fill: '#c193ff', glyph: '雾', label: '雾块' },
  },
  pixels: ['coral','aqua','lime','violet','coral','coral','aqua','violet','lime','lime','violet','aqua','coral','aqua','lime','violet'],
  queuePattern: ['coral','aqua','lime','violet','coral','lime','aqua','violet','coral','aqua','lime','violet']
});

const officePixelRemixGame = createPixelFlowGame({
  id: 'overtime-pixel-loop',
  file: 'overtime-pixel-loop.html',
  title: '加班像素回路',
  sourceGame: '像素环流局 Remix',
  accent: '#6ee7ff',
  summary: '把彩块改成工位杂务，还是同一套环带压力局，但更像夜班清单在绕圈追你。',
  heading: '加班像素回路',
  subheading: '二创版 · 工牌、邮件、表格、报销在环带上轮番压来',
  queueLabel: '下个处理头',
  slotLabel: '夜班槽',
  overflowLabel: '堆单',
  readyCopy: '这一屏夜班杂务总算被你清完，工位短暂恢复呼吸。',
  jamCopy: '堆单炸了，五个夜班槽也全报废，这班已经彻底卡死。',
  bgA: '#081018',
  bgB: '#05070a',
  belt: '#1a2a34',
  beltGlow: '#7ce9ff',
  panel: 'rgba(124,233,255,.16)',
  targetBack: 'rgba(255,255,255,.05)',
  colors: {
    coral: { fill: '#ff8f70', glyph: '邮', label: '邮件' },
    aqua: { fill: '#6ee7ff', glyph: '表', label: '表格' },
    lime: { fill: '#b8f97c', glyph: '会', label: '会议' },
    violet: { fill: '#c6a3ff', glyph: '销', label: '报销' },
  },
  pixels: ['coral','coral','aqua','violet','lime','aqua','aqua','violet','lime','lime','violet','coral','aqua','coral','lime','violet'],
  queuePattern: ['coral','aqua','violet','lime','coral','aqua','lime','violet','coral','lime','aqua','violet']
});

const gooseRemixWarmupLevel = {
  tileWidth: gooseLevel.tileWidth,
  tileHeight: gooseLevel.tileHeight,
  slots: gooseLevel.slots,
  goose: gooseLevel.goose,
  tiles: [
    { id: 0, icon: 'shrimp', x: 48, y: 118, z: 0 },
    { id: 1, icon: 'corn', x: 118, y: 118, z: 0 },
    { id: 2, icon: 'lotus', x: 188, y: 118, z: 0 },
    { id: 3, icon: 'tofu', x: 258, y: 118, z: 0 },
    { id: 4, icon: 'shrimp', x: 83, y: 182, z: 1 },
    { id: 5, icon: 'corn', x: 153, y: 182, z: 1 },
    { id: 6, icon: 'lotus', x: 223, y: 182, z: 1 },
    { id: 7, icon: 'tofu', x: 118, y: 248, z: 2 },
    { id: 8, icon: 'shrimp', x: 188, y: 248, z: 2 },
    { id: 9, icon: 'corn', x: 83, y: 314, z: 1 },
    { id: 10, icon: 'lotus', x: 153, y: 314, z: 1 },
    { id: 11, icon: 'tofu', x: 223, y: 314, z: 1 },
  ],
};

const gooseRushRemixGame = {
  id: 'midnight-goose-rush',
  file: 'midnight-goose-rush.html',
  title: '夜宵颠锅抓鸽王',
  kind: '堆叠',
  sourceGame: '摸鱼捞大鸽 Remix',
  accent: '#f97316',
  summary: '把抓大鹅的热身关和陡增二关压成一个更贴脸的夜宵锅局。',
  canvas: true,
  markup: `
    <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
    <section class="panel compact">
      <div class="row"><b id="stageText">第 1 锅</b><span id="timerText">0 秒</span></div>
      <div class="tray" id="tray"></div>
      <p id="statusText"></p>
      <div class="stack">
        <button class="primary" id="shakeBtn">颠锅 x0</button>
        <button class="choice" id="resetBtn">重开这锅</button>
      </div>
    </section>
  `,
  script: `
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const LEVELS = [
      { id: 1, label: '热身锅', time: 24, shakes: 1, gooseTitle: '第一锅只给你练手', board: ${JSON.stringify(gooseRemixWarmupLevel)} },
      {
        id: 2,
        label: '正片锅',
        time: 48,
        shakes: 3,
        gooseTitle: '第二锅开始真上强度',
        board: ${JSON.stringify({
          ...gooseLevel,
          tiles: gooseLevel.tiles.map((tile, index) => ({
            ...tile,
            icon: ['shrimp', 'corn', 'lotus', 'tofu', 'pepper', 'fishball'][index % 6],
          })),
        })}
      }
    ];
    const TILE_W = LEVELS[0].board.tileWidth;
    const TILE_H = LEVELS[0].board.tileHeight;
    const iconSet = {
      shrimp: { label: '虾', color: '#ff8b7b' },
      corn: { label: '玉', color: '#ffd54f' },
      lotus: { label: '藕', color: '#c4b5fd' },
      tofu: { label: '豆', color: '#f8fafc' },
      pepper: { label: '椒', color: '#fb7185' },
      fishball: { label: '丸', color: '#7dd3fc' }
    };
    const state = { levelIndex: 0, tiles: [], tray: [], mode: 'playing', removed: 0, timeLeft: 0, shakes: 0, rescued: false, pulse: 0 };
    function currentLevel() { return LEVELS[state.levelIndex]; }
    function rect(tile) { return { left: tile.x, top: tile.y, right: tile.x + TILE_W, bottom: tile.y + TILE_H }; }
    function overlapsRect(a, b) {
      const ra = rect(a);
      const rb = rect(b);
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      return w > 0 && h > 0;
    }
    function overlapsGoose(tile) {
      const goose = currentLevel().board.goose;
      const tileCx = tile.x + TILE_W / 2;
      const tileCy = tile.y + TILE_H / 2;
      return Math.abs(tileCx - goose.x) < goose.radius + TILE_W * 0.38 && Math.abs(tileCy - goose.y) < goose.radius + TILE_H * 0.42;
    }
    function gooseFree() { return !state.tiles.some((tile) => tile.active && overlapsGoose(tile)); }
    function free(tile) {
      return tile.active && !state.tiles.some((other) => other.active && other.z > tile.z && overlapsRect(tile, other));
    }
    function loadLevel(index) {
      const level = LEVELS[index];
      state.levelIndex = index;
      state.tiles = level.board.tiles.map((tile) => ({ ...tile, active: true }));
      state.tray = [];
      state.mode = 'playing';
      state.removed = 0;
      state.timeLeft = level.time;
      state.shakes = level.shakes;
      state.rescued = false;
      state.pulse = 0;
      render();
    }
    function reset() { loadLevel(0); }
    function resolveTriples(icon) {
      const count = state.tray.filter((item) => item === icon).length;
      if (count < 3) return;
      let removed = 0;
      state.tray = state.tray.filter((item) => {
        if (item === icon && removed < 3) {
          removed += 1;
          return false;
        }
        return true;
      });
      state.removed += 3;
      state.pulse = 1;
    }
    function pickTile(tile) {
      if (!tile || state.mode !== 'playing' || !free(tile)) return;
      tile.active = false;
      state.tray.push(tile.icon);
      resolveTriples(tile.icon);
      if (state.tray.length >= 7) state.mode = 'lost';
      render();
    }
    function rescueGoose() {
      if (state.mode !== 'playing' || !gooseFree()) return;
      state.rescued = true;
      state.mode = state.levelIndex === LEVELS.length - 1 ? 'won' : 'between';
      state.pulse = 1;
      render();
    }
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
    }
    function shakePan() {
      if (state.mode !== 'playing' || state.shakes <= 0) return;
      state.shakes -= 1;
      state.timeLeft = Math.max(5, state.timeLeft - (state.levelIndex === 0 ? 2 : 4));
      const board = currentLevel().board;
      [0, 1, 2].forEach((z) => {
        const active = state.tiles.filter((tile) => tile.active && tile.z === z);
        const slots = board.slots.filter((slot) => slot.z === z).map((slot) => ({ x: slot.x, y: slot.y }));
        shuffle(slots);
        active.forEach((tile, index) => {
          if (slots[index]) {
            tile.x = slots[index].x;
            tile.y = slots[index].y;
          }
        });
      });
      state.tiles.filter((tile) => tile.active && tile.z > 0).sort((a, b) => b.z - a.z).slice(0, state.levelIndex === 0 ? 2 : 4).forEach((tile) => { tile.z -= 1; });
      state.pulse = 1;
      render();
    }
    function pointer(ev) {
      const box = canvas.getBoundingClientRect();
      const x = (ev.clientX - box.left) * canvas.width / box.width;
      const y = (ev.clientY - box.top) * canvas.height / box.height;
      const goose = currentLevel().board.goose;
      if (gooseFree() && Math.hypot(x - goose.x, y - goose.y) <= goose.radius + 10) {
        rescueGoose();
        return;
      }
      const top = state.tiles.filter((tile) => tile.active && x >= tile.x && x <= tile.x + TILE_W && y >= tile.y && y <= tile.y + TILE_H).sort((a, b) => b.z - a.z)[0];
      pickTile(top);
    }
    function step(ms) {
      if (state.mode !== 'playing') {
        render();
        return;
      }
      state.timeLeft = Math.max(0, state.timeLeft - ms / 1000);
      state.pulse = Math.max(0, state.pulse - ms / 900);
      if (state.timeLeft <= 0) state.mode = 'lost';
      render();
    }
    function drawIcon(icon, cx, cy) {
      const meta = iconSet[icon];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineWidth = 2.1;
      ctx.strokeStyle = '#1d1311';
      if (icon === 'shrimp') {
        ctx.fillStyle = meta.color;
        ctx.beginPath(); ctx.arc(-2, 0, 12, 0.3, Math.PI * 1.8); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#fff3ea';
        ctx.beginPath(); ctx.arc(-2, 0, 8, 0.5, Math.PI * 1.65); ctx.stroke();
      } else if (icon === 'corn') {
        ctx.fillStyle = meta.color;
        ctx.beginPath(); ctx.roundRect(-7, -14, 14, 28, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff7c8';
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 2; col++) ctx.fillRect(-5 + col * 6, -10 + row * 6, 4, 4);
        }
      } else if (icon === 'lotus') {
        ctx.fillStyle = meta.color;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.arc(i * 8, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      } else if (icon === 'tofu') {
        ctx.fillStyle = meta.color;
        ctx.beginPath(); ctx.roundRect(-14, -11, 28, 22, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#d1d5db';
        ctx.fillRect(-8, -5, 16, 10);
      } else if (icon === 'pepper') {
        ctx.fillStyle = meta.color;
        ctx.beginPath(); ctx.moveTo(-12, 2); ctx.quadraticCurveTo(-6, -16, 9, -10); ctx.quadraticCurveTo(13, 5, -2, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (icon === 'fishball') {
        ctx.fillStyle = meta.color;
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#eff6ff';
        ctx.beginPath(); ctx.arc(-4, -4, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    function drawGoose() {
      const goose = currentLevel().board.goose;
      ctx.save();
      ctx.translate(goose.x, goose.y + Math.sin((96 - state.timeLeft) * 3) * 2);
      ctx.globalAlpha = gooseFree() ? 1 : 0.26;
      ctx.fillStyle = gooseFree() ? '#fff1c4' : '#56473c';
      ctx.strokeStyle = '#23120f';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 10, 28 + state.pulse * 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(16, -18, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.moveTo(28, -18); ctx.lineTo(40, -13); ctx.lineTo(28, -7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#17121d';
      ctx.beginPath(); ctx.arc(18, -20, 2.1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function render() {
      const level = currentLevel();
      ctx.fillStyle = '#120906';
      ctx.fillRect(0, 0, 390, 560);
      const topGrad = ctx.createLinearGradient(0, 0, 0, 108);
      topGrad.addColorStop(0, '#5f1b0f');
      topGrad.addColorStop(1, '#24100d');
      ctx.fillStyle = topGrad;
      ctx.beginPath(); ctx.roundRect(18, 18, 354, 68, 24); ctx.fill();
      ctx.fillStyle = '#fff8ef';
      ctx.font = '900 27px sans-serif';
      const title = state.mode === 'between' ? '第一锅过了' : state.mode === 'won' ? '鸽王拿下' : '夜宵颠锅抓鸽王';
      ctx.fillText(title, 30, 54);
      ctx.fillStyle = '#ffd1ac';
      ctx.font = '700 13px sans-serif';
      ctx.fillText('抖音热榜同源节奏 · ' + level.label + ' · 剩 ' + state.tiles.filter((tile) => tile.active).length + ' 件', 30, 76);
      ctx.fillStyle = '#5c2c16';
      ctx.beginPath(); ctx.arc(195, 300, 152, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a401a';
      ctx.beginPath(); ctx.arc(195, 300, 128, 0, Math.PI * 2); ctx.fill();
      drawGoose();
      state.tiles.filter((tile) => tile.active).sort((a, b) => a.z - b.z).forEach((tile) => {
        const enabled = free(tile);
        const depthOffset = tile.z * 5;
        ctx.fillStyle = enabled ? '#fff0df' : '#7b5c4b';
        ctx.strokeStyle = enabled ? '#ffffff' : '#46342d';
        ctx.lineWidth = enabled ? 2.1 : 1.1;
        ctx.beginPath(); ctx.roundRect(tile.x, tile.y - depthOffset, TILE_W, TILE_H, 10); ctx.fill(); ctx.stroke();
        drawIcon(tile.icon, tile.x + TILE_W / 2, tile.y + TILE_H / 2 - depthOffset);
        if (!enabled) {
          ctx.fillStyle = 'rgba(16,8,6,.16)';
          ctx.fillRect(tile.x + 4, tile.y + 3 - depthOffset, TILE_W - 8, TILE_H - 8);
        }
      });
      if (gooseFree() && !state.rescued && state.mode === 'playing') {
        ctx.fillStyle = '#fff4cf';
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('锅底露鸽了，点它直接收工', 195, 468);
        ctx.textAlign = 'left';
      }
      document.getElementById('tray').innerHTML = Array.from({ length: 7 }, (_, i) => '<span>' + (state.tray[i] ? iconSet[state.tray[i]].label : '') + '</span>').join('');
      document.getElementById('stageText').textContent = '第 ' + level.id + ' 锅';
      document.getElementById('timerText').textContent = Math.ceil(state.timeLeft) + ' 秒';
      document.getElementById('statusText').textContent = state.mode === 'between'
        ? '第一锅只是热身，第二锅才是榜单里真正折磨人的那一锅。'
        : state.mode === 'won'
          ? '两锅都过了，锅底那只鸽王也被你拎走了。'
          : state.mode === 'lost'
            ? (state.timeLeft <= 0 ? '时间到了，锅还没翻干净。' : '暂存栏爆了，这锅只能重开。')
            : '可点 ' + state.tiles.filter(free).length + ' · 已消 ' + state.removed + ' · 颠锅剩 ' + state.shakes + ' · ' + level.gooseTitle;
      document.getElementById('shakeBtn').textContent = state.mode === 'between' ? '进第二锅' : '颠锅 x' + state.shakes;
      document.getElementById('resetBtn').textContent = state.mode === 'won' ? '从第一锅重开' : '重开这锅';
    }
    canvas.addEventListener('pointerdown', pointer);
    document.getElementById('shakeBtn').addEventListener('click', () => {
      if (state.mode === 'between') {
        loadLevel(state.levelIndex + 1);
        return;
      }
      shakePan();
    });
    document.getElementById('resetBtn').addEventListener('click', reset);
    reset();
    setInterval(() => step(200), 200);
    window.advanceTime = (ms) => step(ms);
    window.render_game_to_text = () => JSON.stringify({
      coordinate_system: 'canvas 390x560 origin top-left',
      mode: state.mode,
      stage: currentLevel().id,
      tray: state.tray,
      remaining: state.tiles.filter((tile) => tile.active).length,
      free: state.tiles.filter(free).length,
      removed: state.removed,
      timeLeft: Number(state.timeLeft.toFixed(1)),
      shakes: state.shakes,
      gooseFree: gooseFree(),
      rescued: state.rescued
    });
  `,
};

function createZenLogicGame(config) {
  const theme = {
    tokenGlyph: config.tokenGlyph,
    tokenNoun: config.tokenNoun,
    intro: config.intro,
    hintLead: config.hintLead,
    winCopy: config.winCopy,
    regionColors: config.regionColors,
    bgTop: config.bgTop,
    bgBottom: config.bgBottom,
    panel: config.panel,
    blocked: config.blocked,
  };
  const regionMap = [
    ['A', 'A', 'B', 'B', 'C', 'C'],
    ['A', 'A', 'B', 'B', 'C', 'C'],
    ['D', 'D', 'B', 'E', 'C', 'C'],
    ['D', 'D', 'E', 'E', 'F', 'F'],
    ['D', 'E', 'E', 'E', 'F', 'F'],
    ['D', 'E', 'F', 'F', 'F', 'F'],
  ];
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '逻辑',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="countText">已放 0 / 6</b><span id="hintText">唯一候选 0</span></div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">重开这盘</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const SIZE = 6;
      const CELL = 48;
      const BOARD_X = 51;
      const BOARD_Y = 106;
      const REGION_MAP = ${JSON.stringify(regionMap)};
      const THEME = ${JSON.stringify(theme)};
      const REGION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
      const state = { queens: [], mode: 'playing', forced: [], note: '', invalidTaps: 0 };
      window.__ZEN_LOGIC_DEBUG__ = { regions: REGION_MAP, size: SIZE, theme: THEME };
      function key(row, col) {
        return row + '-' + col;
      }
      function hasQueen(row, col) {
        return state.queens.some((queen) => queen.row === row && queen.col === col);
      }
      function queenInRow(row) {
        return state.queens.some((queen) => queen.row === row);
      }
      function queenInCol(col) {
        return state.queens.some((queen) => queen.col === col);
      }
      function queenInRegion(region) {
        return state.queens.some((queen) => REGION_MAP[queen.row][queen.col] === region);
      }
      function blockedReason(row, col) {
        for (const queen of state.queens) {
          if (queen.row === row) return '这一行已经放过了';
          if (queen.col === col) return '这一列已经放过了';
          if (REGION_MAP[queen.row][queen.col] === REGION_MAP[row][col]) return '这个色块已经放过了';
          if (Math.abs(queen.row - row) <= 1 && Math.abs(queen.col - col) <= 1) return '它会和已放目标挨在一起';
        }
        return '';
      }
      function cellBlocked(row, col) {
        return !hasQueen(row, col) && Boolean(blockedReason(row, col));
      }
      function candidatesForCells(cells) {
        return cells.filter(([row, col]) => !hasQueen(row, col) && !cellBlocked(row, col));
      }
      function forcedKeys() {
        const forced = new Set();
        for (let row = 0; row < SIZE; row += 1) {
          if (queenInRow(row)) continue;
          const cells = Array.from({ length: SIZE }, (_, col) => [row, col]);
          const candidates = candidatesForCells(cells);
          if (candidates.length === 1) forced.add(key(candidates[0][0], candidates[0][1]));
        }
        for (let col = 0; col < SIZE; col += 1) {
          if (queenInCol(col)) continue;
          const cells = Array.from({ length: SIZE }, (_, row) => [row, col]);
          const candidates = candidatesForCells(cells);
          if (candidates.length === 1) forced.add(key(candidates[0][0], candidates[0][1]));
        }
        for (const region of REGION_KEYS) {
          if (queenInRegion(region)) continue;
          const cells = [];
          for (let row = 0; row < SIZE; row += 1) {
            for (let col = 0; col < SIZE; col += 1) {
              if (REGION_MAP[row][col] === region) cells.push([row, col]);
            }
          }
          const candidates = candidatesForCells(cells);
          if (candidates.length === 1) forced.add(key(candidates[0][0], candidates[0][1]));
        }
        return Array.from(forced);
      }
      function solved() {
        if (state.queens.length !== SIZE) return false;
        for (let row = 0; row < SIZE; row += 1) {
          if (state.queens.filter((queen) => queen.row === row).length !== 1) return false;
        }
        for (let col = 0; col < SIZE; col += 1) {
          if (state.queens.filter((queen) => queen.col === col).length !== 1) return false;
        }
        for (const region of REGION_KEYS) {
          if (state.queens.filter((queen) => REGION_MAP[queen.row][queen.col] === region).length !== 1) return false;
        }
        for (let i = 0; i < state.queens.length; i += 1) {
          for (let j = i + 1; j < state.queens.length; j += 1) {
            const a = state.queens[i];
            const b = state.queens[j];
            if (Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1) return false;
          }
        }
        return true;
      }
      function recalc(nextNote) {
        state.forced = forcedKeys();
        state.note = nextNote || '';
        state.mode = solved() ? 'won' : 'playing';
        render();
      }
      function toggleCell(row, col) {
        if (state.mode === 'won') {
          reset();
          return;
        }
        const existing = state.queens.findIndex((queen) => queen.row === row && queen.col === col);
        if (existing >= 0) {
          state.queens.splice(existing, 1);
          recalc('撤回了一格，继续排。');
          return;
        }
        const reason = blockedReason(row, col);
        if (reason) {
          state.invalidTaps += 1;
          state.note = THEME.hintLead + reason;
          render();
          return;
        }
        state.queens.push({ row, col });
        recalc('');
      }
      function pointer(event) {
        const box = canvas.getBoundingClientRect();
        const x = (event.clientX - box.left) * canvas.width / box.width;
        const y = (event.clientY - box.top) * canvas.height / box.height;
        const col = Math.floor((x - BOARD_X) / CELL);
        const row = Math.floor((y - BOARD_Y) / CELL);
        if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return;
        toggleCell(row, col);
      }
      function drawBoard() {
        const palette = THEME.regionColors;
        for (let row = 0; row < SIZE; row += 1) {
          for (let col = 0; col < SIZE; col += 1) {
            const x = BOARD_X + col * CELL;
            const y = BOARD_Y + row * CELL;
            const regionIndex = REGION_KEYS.indexOf(REGION_MAP[row][col]);
            ctx.fillStyle = palette[regionIndex];
            ctx.fillRect(x, y, CELL - 2, CELL - 2);
            if (cellBlocked(row, col)) {
              ctx.fillStyle = THEME.blocked;
              ctx.fillRect(x, y, CELL - 2, CELL - 2);
              ctx.strokeStyle = 'rgba(255,255,255,.24)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x + 13, y + 13);
              ctx.lineTo(x + CELL - 15, y + CELL - 15);
              ctx.moveTo(x + CELL - 15, y + 13);
              ctx.lineTo(x + 13, y + CELL - 15);
              ctx.stroke();
            }
            if (state.forced.includes(key(row, col)) && !hasQueen(row, col)) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 3;
              ctx.strokeRect(x + 6, y + 6, CELL - 14, CELL - 14);
            }
            if (hasQueen(row, col)) {
              ctx.fillStyle = THEME.panel;
              ctx.beginPath();
              ctx.arc(x + CELL / 2 - 1, y + CELL / 2 - 1, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = '900 18px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(THEME.tokenGlyph, x + CELL / 2 - 1, y + CELL / 2 + 1);
            }
          }
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.font = '800 12px sans-serif';
        for (let i = 0; i < SIZE; i += 1) {
          ctx.fillText(String(i + 1), BOARD_X + i * CELL + CELL / 2 - 1, BOARD_Y - 12);
          ctx.fillText(String(i + 1), BOARD_X - 18, BOARD_Y + i * CELL + CELL / 2 + 4);
        }
      }
      function render() {
        const gradient = ctx.createLinearGradient(0, 0, 0, 560);
        gradient.addColorStop(0, THEME.bgTop);
        gradient.addColorStop(1, THEME.bgBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.font = '900 14px sans-serif';
        ctx.fillText(THEME.intro, 24, 32);
        ctx.fillStyle = 'rgba(255,255,255,.66)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText('每行、每列、每个色块各放 1 个，而且不能贴边相邻。', 24, 52);
        drawBoard();
        const placed = state.queens.length;
        document.getElementById('countText').textContent = '已放 ' + placed + ' / ' + SIZE;
        document.getElementById('hintText').textContent = '唯一候选 ' + state.forced.length;
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? THEME.winCopy
          : state.note || ('还差 ' + (SIZE - placed) + ' 个 ' + THEME.tokenNoun + '。');
      }
      function reset() {
        state.queens = [];
        state.mode = 'playing';
        state.forced = [];
        state.note = '';
        state.invalidTaps = 0;
        recalc('');
      }
      canvas.addEventListener('pointerdown', pointer);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with 6x6 logic grid',
        mode: state.mode,
        token: THEME.tokenNoun,
        placed: state.queens.length,
        forced: state.forced.length,
        invalidTaps: state.invalidTaps,
        queens: state.queens.map((queen) => ({ row: queen.row, col: queen.col, region: REGION_MAP[queen.row][queen.col] }))
      });
    `,
  };
}

const zenLogicBaseGame = createZenLogicGame({
  id: 'zen-logic-fake',
  file: 'zen-logic-fake.html',
  title: '佛系排排坐',
  sourceGame: '佛系消消消式数独 / Queens 混合逻辑盘',
  accent: '#7ad79d',
  summary: '看行列和色块把 6 只羊摆开，谁都不能挨着谁。',
  tokenGlyph: '羊',
  tokenNoun: '小羊',
  intro: '热门逻辑盘复刻 · 色块唯一位',
  hintLead: '这里不行：',
  winCopy: '六只羊已经排开了，整盘逻辑成立。',
  regionColors: ['#86d5a2', '#76c5df', '#f1b970', '#c79af4', '#f08f9d', '#8dc3ff'],
  bgTop: '#0c2d1f',
  bgBottom: '#102319',
  panel: '#214b34',
  blocked: 'rgba(15,24,18,.42)',
});

const meetingGridlockGame = createZenLogicGame({
  id: 'meeting-gridlock',
  file: 'meeting-gridlock.html',
  title: '会议室别挨着',
  sourceGame: '佛系消消消式逻辑盘 · 会议座位二创',
  accent: '#7cc8ff',
  summary: '给 6 组参会人分座：每行每列每区各一位，而且谁也别紧挨着坐。',
  tokenGlyph: '人',
  tokenNoun: '参会人',
  intro: '会议座位二创 · 谁都别贴着坐',
  hintLead: '这格冲突：',
  winCopy: '所有参会人都被隔开了，这场会总算能开。',
  regionColors: ['#7cc8ff', '#68d6b0', '#f7bd6d', '#fb8aa5', '#b58ef7', '#8eb2ff'],
  bgTop: '#0b1e31',
  bgBottom: '#0f1725',
  panel: '#183149',
  blocked: 'rgba(9,16,24,.44)',
});

function createSnakeGame(config) {
  const theme = {
    hudLead: config.hudLead,
    goalCopy: config.goalCopy,
    boostCopy: config.boostCopy,
    arenaTitle: config.arenaTitle,
    boostLabel: config.boostLabel,
    baseColor: config.baseColor,
    boostColor: config.boostColor,
    pelletA: config.pelletA,
    pelletB: config.pelletB,
    arenaTop: config.arenaTop,
    arenaBottom: config.arenaBottom,
    ring: config.ring,
    grid: config.grid,
    botNames: config.botNames,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '竞技',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="stat-row"><b id="snakeScore">长度 12</b><span id="snakeRank">第 5 名</span></div>
        <p id="snakeStatus">${theme.goalCopy}</p>
        <div class="button-row">
          <button class="choice" id="boostBtn">${theme.boostLabel}</button>
          <button class="primary" id="resetBtn">重开</button>
        </div>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const CONFIG = ${JSON.stringify(theme)};
      window.__SNAKE_DEBUG_CONFIG__ = { reference: ${JSON.stringify(config.sourceGame)}, canvas: [390, 560], boost: true, bots: CONFIG.botNames.length, targetLength: 40 };
      const WORLD = { w: 820, h: 1180 };
      const SEGMENT = 10;
      const BASE_SPEED = 94;
      const BOOST_SPEED = 154;
      const TURN_RATE = 3.8;
      const GOAL = 40;
      const botColors = ['#ff8a65', '#ffd54f', '#81c784', '#64b5f6', '#ce93d8'];
      const pointer = { active: false, x: WORLD.w / 2, y: WORLD.h / 2 };
      const state = { mode: 'playing', player: null, bots: [], pellets: [], boostHeld: false, tick: 0, deathBursts: 0 };
      function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
      function wrapAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
      }
      function rand(seed) {
        const x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
      }
      function spawnPellet(seed, bonus) {
        return {
          x: 26 + rand(seed * 3 + 1) * (WORLD.w - 52),
          y: 30 + rand(seed * 5 + 2) * (WORLD.h - 60),
          r: bonus ? 7 : 5,
          gain: bonus ? 2 : 1,
          hue: bonus ? CONFIG.pelletB : CONFIG.pelletA,
        };
      }
      function makeSnake(name, color, x, y, angle, ai) {
        const trail = [];
        for (let i = 0; i < 160; i += 1) trail.push({ x: x - i * SEGMENT * Math.cos(angle), y: y - i * SEGMENT * Math.sin(angle) });
        return { name, color, x, y, angle, ai, alive: true, speed: BASE_SPEED, target: { x, y }, length: 12, trail, think: 0, boostMeter: 0 };
      }
      function segmentsOf(snake) {
        const needed = Math.max(12, snake.length * SEGMENT);
        return snake.trail.filter((_, index) => index % SEGMENT === 0).slice(0, Math.max(3, Math.floor(needed / SEGMENT)));
      }
      function sprinkle(x, y, count, hue) {
        for (let i = 0; i < count; i += 1) {
          state.pellets.push({
            x: clamp(x + Math.cos(i * 2.2) * (10 + i * 3), 20, WORLD.w - 20),
            y: clamp(y + Math.sin(i * 1.7) * (10 + i * 3), 20, WORLD.h - 20),
            r: i % 3 === 0 ? 7 : 5,
            gain: i % 3 === 0 ? 2 : 1,
            hue: i % 2 === 0 ? hue : CONFIG.pelletB,
          });
        }
      }
      function eliminateSnake(snake, droppedByPlayer) {
        snake.alive = false;
        const points = segmentsOf(snake).slice(1);
        points.forEach((point, index) => {
          state.pellets.push({
            x: clamp(point.x + Math.sin(index * 2.4) * 4, 18, WORLD.w - 18),
            y: clamp(point.y + Math.cos(index * 1.8) * 4, 18, WORLD.h - 18),
            r: index % 5 === 0 ? 7 : 5,
            gain: index % 5 === 0 ? 2 : 1,
            hue: droppedByPlayer ? CONFIG.pelletB : snake.color,
          });
        });
        state.deathBursts += 1;
      }
      function reset() {
        state.mode = 'playing';
        state.boostHeld = false;
        state.tick = 0;
        state.deathBursts = 0;
        state.player = makeSnake('YOU', CONFIG.baseColor, WORLD.w / 2, WORLD.h * 0.72, -Math.PI / 2, false);
        state.bots = CONFIG.botNames.map((name, index) => makeSnake(name, botColors[index % botColors.length], 140 + (index % 2) * 300, 180 + index * 150, index % 2 ? Math.PI * 0.15 : Math.PI * 0.85, true));
        state.pellets = Array.from({ length: 120 }, (_, index) => spawnPellet(index + 1, index % 9 === 0));
        render();
      }
      function updateTrail(snake) {
        snake.trail.unshift({ x: snake.x, y: snake.y });
        const maxTrail = Math.max(180, snake.length * SEGMENT + 80);
        if (snake.trail.length > maxTrail) snake.trail.length = maxTrail;
      }
      function trimForBoost(snake, dt) {
        if (snake.length <= 12) return;
        snake.boostMeter += dt * 7;
        while (snake.boostMeter >= 1 && snake.length > 12) {
          snake.boostMeter -= 1;
          snake.length -= 1;
          const tail = snake.trail[Math.min(snake.trail.length - 1, snake.length * SEGMENT - 1)];
          if (tail) state.pellets.push({ x: tail.x, y: tail.y, r: 5, gain: 1, hue: CONFIG.pelletA });
        }
      }
      function steerSnake(snake, targetX, targetY, dt, boosting) {
        const desired = Math.atan2(targetY - snake.y, targetX - snake.x);
        const diff = wrapAngle(desired - snake.angle);
        snake.angle += clamp(diff, -TURN_RATE * dt, TURN_RATE * dt);
        snake.speed += ((boosting ? BOOST_SPEED : BASE_SPEED) - snake.speed) * Math.min(1, dt * 4.4);
        snake.x = clamp(snake.x + Math.cos(snake.angle) * snake.speed * dt, 16, WORLD.w - 16);
        snake.y = clamp(snake.y + Math.sin(snake.angle) * snake.speed * dt, 16, WORLD.h - 16);
        updateTrail(snake);
      }
      function thinkBot(bot, dt) {
        bot.think -= dt;
        if (bot.think <= 0) {
          const juicy = state.pellets.slice(0, 80).sort((a, b) => Math.hypot(bot.x - a.x, bot.y - a.y) - Math.hypot(bot.x - b.x, bot.y - b.y))[0];
          bot.target = juicy ? { x: juicy.x, y: juicy.y } : { x: WORLD.w / 2, y: WORLD.h / 2 };
          bot.think = 0.35 + rand(state.tick + bot.x + bot.y) * 0.5;
        }
        if (bot.x < 80) bot.target.x = WORLD.w - 80;
        if (bot.x > WORLD.w - 80) bot.target.x = 80;
        if (bot.y < 80) bot.target.y = WORLD.h - 80;
        if (bot.y > WORLD.h - 80) bot.target.y = 80;
      }
      function collectPellets(snake) {
        state.pellets = state.pellets.filter((pellet) => {
          if (Math.hypot(snake.x - pellet.x, snake.y - pellet.y) > 14 + pellet.r) return true;
          snake.length = Math.min(60, snake.length + pellet.gain);
          return false;
        });
      }
      function hitTrail(head, owner) {
        const snakes = [state.player, ...state.bots].filter((snake) => snake.alive);
        for (const snake of snakes) {
          const segments = segmentsOf(snake);
          for (let i = snake === owner ? 9 : 4; i < segments.length; i += 1) {
            const point = segments[i];
            if (Math.hypot(head.x - point.x, head.y - point.y) < 9) return snake;
          }
        }
        return null;
      }
      function ranking() {
        return [state.player, ...state.bots].filter((snake) => snake.alive).sort((a, b) => b.length - a.length);
      }
      function pointerEvent(event) {
        const box = canvas.getBoundingClientRect();
        pointer.active = true;
        pointer.x = (event.clientX - box.left) * canvas.width / box.width;
        pointer.y = (event.clientY - box.top) * canvas.height / box.height;
      }
      canvas.addEventListener('pointerdown', pointerEvent);
      canvas.addEventListener('pointermove', (event) => { if (event.buttons) pointerEvent(event); });
      canvas.addEventListener('pointerup', () => { pointer.active = false; });
      window.addEventListener('keydown', (event) => {
        if (event.key === ' ') state.boostHeld = true;
        if (event.key === 'ArrowLeft') pointer.x -= 32;
        if (event.key === 'ArrowRight') pointer.x += 32;
        if (event.key === 'ArrowUp') pointer.y -= 32;
        if (event.key === 'ArrowDown') pointer.y += 32;
      });
      window.addEventListener('keyup', (event) => { if (event.key === ' ') state.boostHeld = false; });
      const boostBtn = document.getElementById('boostBtn');
      ['pointerdown', 'pointerenter'].forEach((type) => boostBtn.addEventListener(type, () => { state.boostHeld = true; }));
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => boostBtn.addEventListener(type, () => { state.boostHeld = false; }));
      function step(ms) {
        if (state.mode !== 'playing') { render(); return; }
        const dt = Math.min(0.032, ms / 1000);
        state.tick += dt;
        const player = state.player;
        const targetX = pointer.active ? pointer.x / canvas.width * WORLD.w : player.x + Math.cos(player.angle) * 120;
        const targetY = pointer.active ? pointer.y / canvas.height * WORLD.h : player.y + Math.sin(player.angle) * 120;
        steerSnake(player, targetX, targetY, dt, state.boostHeld);
        if (state.boostHeld) trimForBoost(player, dt);
        collectPellets(player);
        state.bots.forEach((bot) => {
          if (!bot.alive) return;
          thinkBot(bot, dt);
          const shouldBoost = bot.length > 15 && rand(state.tick * 40 + bot.x) > 0.94;
          steerSnake(bot, bot.target.x, bot.target.y, dt, shouldBoost);
          if (shouldBoost && bot.length > 12 && rand(state.tick * 90 + bot.y) > 0.45) bot.length -= 1;
          collectPellets(bot);
        });
        const playerHit = hitTrail(player, player);
        if (playerHit) state.mode = 'lost';
        state.bots.forEach((bot) => {
          if (!bot.alive) return;
          const collided = hitTrail(bot, bot);
          if (collided) eliminateSnake(bot, collided === state.player);
        });
        if (state.bots.filter((bot) => bot.alive).length < CONFIG.botNames.length) {
          while (state.pellets.length < 140) state.pellets.push(spawnPellet(state.pellets.length + state.tick * 100, state.pellets.length % 11 === 0));
        }
        if (player.length >= GOAL) state.mode = 'won';
        render();
      }
      function drawArena() {
        const gradient = ctx.createLinearGradient(0, 0, 0, 560);
        gradient.addColorStop(0, CONFIG.arenaTop);
        gradient.addColorStop(1, CONFIG.arenaBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 390, 560);
        ctx.strokeStyle = CONFIG.ring;
        ctx.lineWidth = 5;
        ctx.strokeRect(14, 14, 362, 532);
        ctx.strokeStyle = CONFIG.grid;
        ctx.lineWidth = 1;
        for (let x = 38; x < 360; x += 44) { ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x, 542); ctx.stroke(); }
        for (let y = 38; y < 540; y += 44) { ctx.beginPath(); ctx.moveTo(18, y); ctx.lineTo(372, y); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,.86)';
        ctx.font = '900 14px sans-serif';
        ctx.fillText(CONFIG.arenaTitle, 24, 34);
      }
      function project(point) {
        return { x: point.x / WORLD.w * 350 + 20, y: point.y / WORLD.h * 500 + 38 };
      }
      function drawSnake(snake, playerLike) {
        const segments = segmentsOf(snake);
        segments.slice().reverse().forEach((segment, index) => {
          const p = project(segment);
          const radius = Math.max(4, 9 - index * 0.16);
          ctx.fillStyle = snake.color;
          ctx.globalAlpha = playerLike && state.boostHeld ? 0.9 : 0.78;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        const head = project({ x: snake.x, y: snake.y });
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 3.2, 0, Math.PI * 2);
        ctx.arc(head.x + Math.cos(snake.angle) * 4, head.y + Math.sin(snake.angle) * 4, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = playerLike ? '#0a0a0a' : 'rgba(255,255,255,.92)';
        ctx.font = '800 10px sans-serif';
        ctx.fillText(snake.name, head.x - 14, head.y - 14);
      }
      function render() {
        drawArena();
        state.pellets.forEach((pellet) => {
          const p = project(pellet);
          ctx.fillStyle = pellet.hue;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pellet.r * 0.55, 0, Math.PI * 2);
          ctx.fill();
        });
        state.bots.filter((bot) => bot.alive).forEach((bot) => drawSnake(bot, false));
        if (state.player.alive) drawSnake(state.player, true);
        if (state.mode !== 'playing') {
          ctx.fillStyle = 'rgba(0,0,0,.42)';
          ctx.fillRect(56, 212, 278, 120);
          ctx.strokeStyle = CONFIG.ring;
          ctx.strokeRect(56, 212, 278, 120);
          ctx.fillStyle = '#fff';
          ctx.font = '900 30px sans-serif';
          ctx.fillText(state.mode === 'won' ? '冲榜成功' : '蛇头撞没了', 108, 266);
          ctx.font = '700 14px sans-serif';
          ctx.fillText(state.mode === 'won' ? CONFIG.hudLead : CONFIG.boostCopy, 88, 296);
        }
        const order = ranking();
        const rank = Math.max(1, order.findIndex((snake) => snake === state.player) + 1);
        document.getElementById('snakeScore').textContent = '长度 ' + state.player.length;
        document.getElementById('snakeRank').textContent = '第 ' + rank + ' 名 / ' + order.length;
        document.getElementById('snakeStatus').textContent = state.mode === 'playing'
          ? (state.boostHeld ? CONFIG.boostCopy : CONFIG.goalCopy)
          : (state.mode === 'won' ? CONFIG.hudLead : '撞到别人的蛇身了，重开再冲。');
        boostBtn.textContent = state.boostHeld ? '松开停冲' : CONFIG.boostLabel;
      }
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(() => step(16), 16);
      window.advanceTime = (ms) => { for (let i = 0; i < Math.max(1, Math.round(ms / 16)); i += 1) step(16); };
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 mapped from 820x1180 arena',
        mode: state.mode,
        playerLength: state.player.length,
        aliveBots: state.bots.filter((bot) => bot.alive).length,
        pellets: state.pellets.length,
        deathBursts: state.deathBursts,
        rank: ranking().findIndex((snake) => snake === state.player) + 1,
        boostHeld: state.boostHeld
      });
    `,
  };
}

const snakeBattleBaseGame = createSnakeGame({
  id: 'snake-battle-fake',
  file: 'snake-battle-fake.html',
  title: '贪吃蛇冲榜局',
  sourceGame: '贪吃蛇大作战式单指冲榜',
  accent: '#58d26a',
  summary: '单指转向，按住加速甩尾，蹭豆把长度冲到 40。',
  hudLead: '长度冲到 40 就算上榜，撞线前多吃几颗大豆。',
  goalCopy: '拖动转向，按住加速会掉尾巴，但抢豆更快。',
  boostCopy: '正在加速甩尾，尾部会掉出可回收的小豆。',
  arenaTitle: '冲榜热区',
  boostLabel: '按住加速',
  baseColor: '#58d26a',
  boostColor: '#b7ff72',
  pelletA: '#f7f38a',
  pelletB: '#ffcf5a',
  arenaTop: '#102b14',
  arenaBottom: '#07140b',
  ring: '#72ff88',
  grid: 'rgba(114,255,136,.10)',
  botNames: ['芽芽', '团团', '阿卷', '晚高峰'],
});

const subwaySnakeRemixGame = createSnakeGame({
  id: 'subway-snake-shift',
  file: 'subway-snake-shift.html',
  title: '地铁刷卡蛇',
  sourceGame: '贪吃蛇大作战式通勤二创',
  accent: '#5dc2ff',
  summary: '把光豆换成刷卡点，蛇身像列车长龙，冲刺时掉落通勤票。',
  hudLead: '先吃进站点，再冲过换乘口，长度到 40 就算通勤通关。',
  goalCopy: '拖动像给列车变道，长按冲刺会掉票，但能抢到换乘豆。',
  boostCopy: '正在压站冲刺，尾巴会抖出票根，别一头撞进别车。',
  arenaTitle: '换乘大厅',
  boostLabel: '长按冲刺',
  baseColor: '#5dc2ff',
  boostColor: '#c4f0ff',
  pelletA: '#ffd166',
  pelletB: '#ff8f5e',
  arenaTop: '#0b1830',
  arenaBottom: '#09111f',
  ring: '#5dc2ff',
  grid: 'rgba(93,194,255,.11)',
  botNames: ['二号线', '九号线', '末班车', '闸机口'],
});

function createBusJamGame(config) {
  const theme = {
    topCopy: config.topCopy,
    buttonCopy: config.buttonCopy,
    emptyCopy: config.emptyCopy,
    winCopy: config.winCopy,
    loseCopy: config.loseCopy,
    laneLabel: config.laneLabel,
    riderLabel: config.riderLabel,
    depotLabel: config.depotLabel,
    bgTop: config.bgTop,
    bgBottom: config.bgBottom,
    panelTint: config.panelTint,
    curb: config.curb,
    bay: config.bay,
    colors: config.colors,
    lanes: config.lanes,
    queue: config.queue,
    capacity: config.capacity,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '分流',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="tripText">已发 0 车</b><span id="queueText">剩余 16 人</span></div>
        <p id="statusText">${theme.topCopy}</p>
        <button class="primary" id="resetBtn">${theme.buttonCopy}</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const CONFIG = ${JSON.stringify(theme)};
      window.__BUS_JAM_DEBUG__ = {
        reference: ${JSON.stringify(config.sourceGame)},
        lanes: CONFIG.lanes.map((lane) => lane.slice()),
        queue: CONFIG.queue.slice(),
        capacity: CONFIG.capacity
      };
      const state = {
        lanes: [],
        buses: [],
        queueIndex: 0,
        trips: 0,
        mode: 'playing',
        note: CONFIG.topCopy,
        lastFrame: 0,
      };
      const colorKeys = Object.keys(CONFIG.colors);
      function makeBus(color, bay) {
        return { color, bay, passengers: [], departing: false, timer: 0, pulse: 0 };
      }
      function reset() {
        state.lanes = CONFIG.lanes.map((lane) => lane.slice());
        state.queueIndex = 0;
        state.trips = 0;
        state.mode = 'playing';
        state.note = CONFIG.topCopy;
        state.buses = Array.from({ length: 3 }, (_, bay) => {
          const color = CONFIG.queue[state.queueIndex++];
          return color ? makeBus(color, bay) : null;
        });
        render();
      }
      function remainingPassengers() {
        return state.lanes.reduce((sum, lane) => sum + lane.length, 0);
      }
      function visibleFrontColors() {
        return state.lanes.map((lane) => lane[0]).filter(Boolean);
      }
      function hasMatchingFront(color) {
        return state.lanes.some((lane) => lane[0] === color);
      }
      function replaceBus(index) {
        const nextColor = CONFIG.queue[state.queueIndex++];
        state.buses[index] = nextColor ? makeBus(nextColor, index) : null;
      }
      function boardBus(bus) {
        if (!bus || bus.departing || state.mode !== 'playing') return;
        let loaded = 0;
        let moved = true;
        while (bus.passengers.length < CONFIG.capacity && moved) {
          moved = false;
          for (const lane of state.lanes) {
            if (!lane.length || lane[0] !== bus.color || bus.passengers.length >= CONFIG.capacity) continue;
            bus.passengers.push(lane.shift());
            loaded += 1;
            moved = true;
          }
        }
        if (!loaded) {
          state.note = CONFIG.emptyCopy.replace('{color}', CONFIG.colors[bus.color].label);
          render();
          return;
        }
        bus.departing = true;
        bus.timer = 320;
        bus.pulse = 1;
        state.trips += 1;
        state.note = CONFIG.colors[bus.color].label + '车带走了 ' + loaded + ' 位' + CONFIG.riderLabel + '。';
        resolveState();
        render();
      }
      function resolveState() {
        const remaining = remainingPassengers();
        if (remaining === 0) {
          state.mode = 'won';
          state.note = CONFIG.winCopy;
          return;
        }
        const activeColors = state.buses.filter(Boolean).filter((bus) => !bus.departing).map((bus) => bus.color);
        const frontColors = visibleFrontColors();
        const canPlay = activeColors.some((color) => frontColors.includes(color));
        const pendingDepartures = state.buses.some((bus) => bus && bus.departing);
        if (!canPlay && !pendingDepartures) {
          state.mode = 'lost';
          state.note = CONFIG.loseCopy;
        }
      }
      function step(ms) {
        let changed = false;
        state.buses.forEach((bus, index) => {
          if (!bus || !bus.departing) return;
          bus.timer -= ms;
          bus.pulse = Math.max(0, bus.pulse - ms / 320);
          changed = true;
          if (bus.timer <= 0) replaceBus(index);
        });
        if (changed) {
          resolveState();
          render();
        }
      }
      function loop(ts) {
        if (!state.lastFrame) state.lastFrame = ts;
        const delta = Math.min(32, ts - state.lastFrame);
        state.lastFrame = ts;
        if (state.buses.some((bus) => bus && bus.departing)) step(delta);
        requestAnimationFrame(loop);
      }
      function pointFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height
        };
      }
      function busRect(index) {
        const x = 24 + index * 118;
        return { x, y: 366, w: 104, h: 126 };
      }
      function busAt(point) {
        return state.buses.find((bus, index) => {
          if (!bus) return false;
          const rect = busRect(index);
          return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
        }) || null;
      }
      function drawPassenger(x, y, color, active) {
        const meta = CONFIG.colors[color];
        ctx.save();
        ctx.globalAlpha = active ? 1 : 0.42;
        ctx.translate(x, y);
        ctx.fillStyle = meta.fill;
        ctx.strokeStyle = meta.edge;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -12, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(-15, 2, 30, 28, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#12202f';
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(meta.glyph, 0, 9);
        ctx.restore();
      }
      function drawQueueLane(lane, index) {
        const x = 62 + index * 82;
        ctx.fillStyle = 'rgba(255,255,255,.06)';
        ctx.strokeStyle = 'rgba(255,255,255,.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 24, 84, 48, 234, 22);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.font = '800 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(CONFIG.laneLabel + ' ' + (index + 1), x, 104);
        lane.forEach((color, pos) => {
          drawPassenger(x, 138 + pos * 48, color, pos === 0 && hasMatchingFront(color));
        });
      }
      function drawBus(bus, index) {
        const rect = busRect(index);
        const meta = CONFIG.colors[bus.color];
        const tilt = bus.departing ? Math.min(22, (1 - bus.timer / 320) * 22) : 0;
        ctx.save();
        ctx.translate(rect.x + tilt, rect.y);
        ctx.fillStyle = CONFIG.bay;
        ctx.beginPath();
        ctx.roundRect(0, 18, rect.w, rect.h - 18, 22);
        ctx.fill();
        ctx.fillStyle = meta.fill;
        ctx.strokeStyle = meta.edge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(6, 0, rect.w - 12, 90, 18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.20)';
        ctx.fillRect(18, 16, 54, 18);
        ctx.fillRect(78, 16, 10, 18);
        ctx.fillStyle = '#0d1a27';
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(meta.label, rect.w / 2, 76);
        ctx.fillStyle = '#fdfdfd';
        ctx.font = '900 12px sans-serif';
        ctx.fillText(bus.departing ? '发车中' : CONFIG.depotLabel, rect.w / 2, 112);
        for (let seat = 0; seat < CONFIG.capacity; seat++) {
          const filled = seat < bus.passengers.length;
          ctx.fillStyle = filled ? meta.edge : 'rgba(255,255,255,.15)';
          ctx.beginPath();
          ctx.roundRect(18 + seat * 20, 126, 14, 22, 6);
          ctx.fill();
        }
        ctx.restore();
      }
      function render() {
        const gradient = ctx.createLinearGradient(0, 0, 0, 560);
        gradient.addColorStop(0, CONFIG.bgTop);
        gradient.addColorStop(1, CONFIG.bgBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        for (let stripe = 0; stripe < 7; stripe++) ctx.fillRect(26 + stripe * 52, 334, 32, 6);
        ctx.fillStyle = CONFIG.curb;
        ctx.fillRect(0, 344, 390, 170);
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.fillRect(0, 354, 390, 3);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(${JSON.stringify(config.title)}, 24, 38);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(CONFIG.topCopy, 24, 58);
        state.lanes.forEach(drawQueueLane);
        ctx.fillStyle = 'rgba(255,255,255,.68)';
        ctx.font = '800 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('可发车位', 24, 360);
        state.buses.forEach((bus, index) => { if (bus) drawBus(bus, index); });
        if (state.mode !== 'playing') {
          ctx.fillStyle = 'rgba(7,12,18,.72)';
          ctx.fillRect(18, 172, 354, 118);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(state.mode === 'won' ? '全部送走' : '站台堵死了', 195, 220);
          ctx.font = '700 14px sans-serif';
          ctx.fillText(state.note, 195, 250);
        }
        document.getElementById('tripText').textContent = '已发 ' + state.trips + ' 车';
        document.getElementById('queueText').textContent = '剩余 ' + remainingPassengers() + ' 位';
        document.getElementById('statusText').textContent = state.note;
      }
      canvas.addEventListener('pointerdown', (event) => {
        const target = busAt(pointFromEvent(event));
        if (target) boardBus(target);
      });
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      requestAnimationFrame(loop);
      window.advanceTime = (ms) => step(Number(ms) || 16);
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with 4 rider lanes and 3 bus bays',
        mode: state.mode,
        trips: state.trips,
        remaining: remainingPassengers(),
        visible_fronts: state.lanes.map((lane) => lane[0] || null),
        active_buses: state.buses.map((bus) => bus ? { color: bus.color, riders: bus.passengers.length, departing: bus.departing } : null),
        queue_index: state.queueIndex
      });
    `,
  };
}

const busJamBaseGame = createBusJamGame({
  id: 'bus-jam-fake',
  file: 'bus-jam-fake.html',
  title: '巴士分流站',
  sourceGame: 'Bus Escape: Traffic Jam / Bus Jam 式乘客分流',
  accent: '#58c7ff',
  summary: '点发同色巴士，让站台前排乘客一车车离开，后排才会继续露出来。',
  topCopy: '热门 Bus Jam 复刻 · 只有排在最前面的乘客能上车',
  buttonCopy: '重开这一站',
  emptyCopy: '{color}车前面还没人，先发别的颜色。',
  winCopy: '这一站已经清空，所有同色巴士都顺利带走了人。',
  loseCopy: '眼前车色全对不上，站台短暂堵死了。',
  laneLabel: '队列',
  riderLabel: '乘客',
  depotLabel: '点击发车',
  bgTop: '#10253c',
  bgBottom: '#0a1421',
  panelTint: '#16344e',
  curb: '#1c2733',
  bay: '#182432',
  capacity: 4,
  colors: {
    amber: { fill: '#ffbf47', edge: '#ffe39d', label: '黄线', glyph: '黄' },
    cyan: { fill: '#59cfff', edge: '#cbf2ff', label: '蓝线', glyph: '蓝' },
    pink: { fill: '#ff7aa8', edge: '#ffd0e2', label: '粉线', glyph: '粉' },
    lime: { fill: '#89d84a', edge: '#ddffb8', label: '绿线', glyph: '绿' },
  },
  lanes: [
    ['amber', 'amber', 'cyan', 'pink'],
    ['cyan', 'lime', 'lime', 'amber'],
    ['pink', 'pink', 'amber', 'lime'],
    ['lime', 'cyan', 'pink', 'cyan'],
  ],
  queue: ['amber', 'pink', 'lime', 'cyan', 'pink', 'lime', 'amber', 'cyan'],
});

const busJamNightRemixGame = createBusJamGame({
  id: 'night-shift-shuttle',
  file: 'night-shift-shuttle.html',
  title: '夜班摆渡车',
  sourceGame: '巴士分流站 Remix',
  accent: '#8be9ff',
  summary: '把通勤站改成夜班园区摆渡：先送走门口这批工牌，后面的工位人流才会露头。',
  topCopy: '夜班园区二创 · 只有最靠门的一排工牌能先上摆渡车',
  buttonCopy: '重开这一班',
  emptyCopy: '{color}车门口还没人，先把别的组送走。',
  winCopy: '夜班门口已经散场，摆渡车把这波工牌全带走了。',
  loseCopy: '门口露出的工牌和当前车色全撞不上，这班先卡住了。',
  laneLabel: '闸口',
  riderLabel: '工牌',
  depotLabel: '点门口发车',
  bgTop: '#0b1a2b',
  bgBottom: '#070d16',
  panelTint: '#12283d',
  curb: '#171f2a',
  bay: '#111b28',
  capacity: 4,
  colors: {
    amber: { fill: '#ffb25b', edge: '#ffe1b6', label: '仓储组', glyph: '仓' },
    cyan: { fill: '#6bc5ff', edge: '#d4efff', label: '研发组', glyph: '研' },
    pink: { fill: '#ff7da0', edge: '#ffd3df', label: '客服组', glyph: '客' },
    lime: { fill: '#8fd966', edge: '#e4ffc8', label: '包装组', glyph: '包' },
  },
  lanes: [
    ['cyan', 'cyan', 'amber', 'pink'],
    ['pink', 'lime', 'lime', 'amber'],
    ['amber', 'pink', 'cyan', 'lime'],
    ['lime', 'amber', 'pink', 'cyan'],
  ],
  queue: ['cyan', 'pink', 'amber', 'lime', 'cyan', 'amber', 'pink', 'lime'],
});

function createSeatAwayGame(config) {
  const theme = {
    topCopy: config.topCopy,
    hint: config.hint,
    exitCopy: config.exitCopy,
    slideCopy: config.slideCopy,
    stuckCopy: config.stuckCopy,
    winCopy: config.winCopy,
    statusNoun: config.statusNoun,
    boardLabel: config.boardLabel,
    exitLabel: config.exitLabel,
    bgTop: config.bgTop,
    bgBottom: config.bgBottom,
    boardFill: config.boardFill,
    boardLine: config.boardLine,
    slotFill: config.slotFill,
    exitGlow: config.exitGlow,
    colors: config.colors,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '挪座',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="moveText">挪动 0</b><span id="leftText">剩余 0</span></div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">${config.buttonCopy}</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const LEVEL = ${JSON.stringify(config.level)};
      const THEME = ${JSON.stringify(theme)};
      const DIRS = {
        up: { dr: -1, dc: 0, arrow: '↑' },
        right: { dr: 0, dc: 1, arrow: '→' },
        down: { dr: 1, dc: 0, arrow: '↓' },
        left: { dr: 0, dc: -1, arrow: '←' },
      };
      const state = { seats: [], moves: 0, cleared: 0, mode: 'playing', note: THEME.hint };
      function reset() {
        state.seats = LEVEL.seats.map((seat) => ({ ...seat, active: true, leaving: 0 }));
        state.moves = 0;
        state.cleared = 0;
        state.mode = 'playing';
        state.note = THEME.hint;
        render();
      }
      function activeSeats() {
        return state.seats.filter((seat) => seat.active);
      }
      function seatAt(row, col, ignoreId) {
        return state.seats.find((seat) => seat.active && seat.id !== ignoreId && seat.row === row && seat.col === col) || null;
      }
      function pathFor(seat) {
        const dir = DIRS[seat.dir];
        let row = seat.row;
        let col = seat.col;
        let distance = 0;
        while (true) {
          const nextRow = row + dir.dr;
          const nextCol = col + dir.dc;
          if (nextRow < 0 || nextRow >= LEVEL.rows || nextCol < 0 || nextCol >= LEVEL.cols) {
            return { type: distance > 0 || true ? 'exit' : 'blocked', row, col, distance };
          }
          if (seatAt(nextRow, nextCol, seat.id)) {
            return distance > 0 ? { type: 'slide', row, col, distance } : { type: 'blocked', row: seat.row, col: seat.col, distance: 0 };
          }
          row = nextRow;
          col = nextCol;
          distance += 1;
        }
      }
      function movable(seat) {
        return state.mode === 'playing' && pathFor(seat).type !== 'blocked';
      }
      function pointFromEvent(event) {
        const box = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - box.left) * canvas.width / box.width,
          y: (event.clientY - box.top) * canvas.height / box.height,
        };
      }
      function seatRect(seat) {
        const cell = LEVEL.cell;
        const boardX = LEVEL.boardX;
        const boardY = LEVEL.boardY;
        return {
          x: boardX + seat.col * cell + 6,
          y: boardY + seat.row * cell + 6,
          w: cell - 12,
          h: cell - 12,
        };
      }
      function seatFromPoint(point) {
        return activeSeats()
          .filter((seat) => {
            const rect = seatRect(seat);
            return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
          })
          .sort((a, b) => b.row - a.row || b.col - a.col)[0] || null;
      }
      function actOnSeat(seat) {
        if (!seat || state.mode !== 'playing') return;
        const outcome = pathFor(seat);
        if (outcome.type === 'blocked') {
          state.note = seat.label + THEME.stuckCopy;
          render();
          return;
        }
        state.moves += 1;
        if (outcome.type === 'slide') {
          seat.row = outcome.row;
          seat.col = outcome.col;
          state.note = seat.label + THEME.slideCopy;
        } else {
          seat.active = false;
          state.cleared += 1;
          state.note = seat.label + THEME.exitCopy;
        }
        if (!activeSeats().length) {
          state.mode = 'won';
          state.note = THEME.winCopy;
        }
        render();
      }
      function drawBoard() {
        const boardW = LEVEL.cols * LEVEL.cell;
        const boardH = LEVEL.rows * LEVEL.cell;
        const boardX = LEVEL.boardX;
        const boardY = LEVEL.boardY;
        const gradient = ctx.createLinearGradient(0, 0, 0, 560);
        gradient.addColorStop(0, THEME.bgTop);
        gradient.addColorStop(1, THEME.bgBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = 'rgba(255,255,255,.06)';
        for (let stripe = 0; stripe < 9; stripe++) ctx.fillRect(22 + stripe * 40, 76 + (stripe % 2) * 4, 24, 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(${JSON.stringify(config.title)}, 24, 38);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.topCopy, 24, 58);
        ctx.fillStyle = THEME.boardFill;
        ctx.strokeStyle = THEME.boardLine;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(boardX - 10, boardY - 10, boardW + 20, boardH + 20, 28);
        ctx.fill();
        ctx.stroke();
        for (let row = 0; row < LEVEL.rows; row++) {
          for (let col = 0; col < LEVEL.cols; col++) {
            const x = boardX + col * LEVEL.cell;
            const y = boardY + row * LEVEL.cell;
            ctx.fillStyle = THEME.slotFill;
            ctx.beginPath();
            ctx.roundRect(x + 5, y + 5, LEVEL.cell - 10, LEVEL.cell - 10, 18);
            ctx.fill();
          }
        }
        LEVEL.exits.forEach((exit) => {
          const glow = ctx.createLinearGradient(exit.x1, exit.y1, exit.x2, exit.y2);
          glow.addColorStop(0, 'rgba(255,255,255,0)');
          glow.addColorStop(1, THEME.exitGlow);
          ctx.strokeStyle = glow;
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(exit.x1, exit.y1);
          ctx.lineTo(exit.x2, exit.y2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.76)';
          ctx.font = '800 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(THEME.exitLabel, exit.lx, exit.ly);
        });
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.font = '800 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(THEME.boardLabel, boardX - 2, boardY - 18);
      }
      function drawSeat(seat) {
        const rect = seatRect(seat);
        const meta = THEME.colors[seat.color];
        const enabled = movable(seat);
        ctx.save();
        ctx.translate(rect.x, rect.y);
        ctx.fillStyle = enabled ? meta.fill : 'rgba(92,96,112,.82)';
        ctx.strokeStyle = enabled ? meta.edge : 'rgba(20,21,29,.9)';
        ctx.lineWidth = enabled ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(0, 18, rect.w, rect.h - 18, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = enabled ? meta.edge : 'rgba(255,255,255,.26)';
        ctx.beginPath();
        ctx.roundRect(8, 0, rect.w - 16, 24, 10);
        ctx.fill();
        ctx.fillStyle = '#0c1320';
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(seat.glyph, rect.w / 2, 17);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px sans-serif';
        ctx.fillText(DIRS[seat.dir].arrow, rect.w / 2, rect.h - 16);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.font = '800 10px sans-serif';
        ctx.fillText(seat.label, rect.w / 2, rect.h - 36);
        ctx.restore();
      }
      function render() {
        drawBoard();
        activeSeats().forEach(drawSeat);
        if (state.mode === 'won') {
          ctx.fillStyle = 'rgba(6,10,18,.74)';
          ctx.fillRect(24, 176, 342, 120);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('全员离场', 195, 220);
          ctx.font = '700 14px sans-serif';
          ctx.fillText(state.note, 195, 250);
        }
        document.getElementById('moveText').textContent = THEME.statusNoun + ' ' + state.moves;
        document.getElementById('leftText').textContent = '剩余 ' + activeSeats().length;
        document.getElementById('statusText').textContent = state.note;
      }
      canvas.addEventListener('pointerdown', (event) => {
        actOnSeat(seatFromPoint(pointFromEvent(event)));
      });
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => render();
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with a 5x5 seat board; row increases downward, col increases rightward',
        mode: state.mode,
        moves: state.moves,
        remaining: activeSeats().length,
        seats: activeSeats().map((seat) => {
          const outcome = pathFor(seat);
          return { id: seat.id, row: seat.row, col: seat.col, dir: seat.dir, label: seat.label, movable: outcome.type !== 'blocked', next: outcome.type };
        }),
      });
    `,
  };
}

const seatAwayBaseGame = createSeatAwayGame({
  id: 'seat-away-fake',
  file: 'seat-away-fake.html',
  title: '挪座离场局',
  sourceGame: 'Seat Away 式箭头挪座解谜',
  accent: '#62d8ff',
  summary: '点一张座椅就沿箭头滑走，能直冲出口的会直接离场，清空整盘即过关。',
  buttonCopy: '重开这一排',
  topCopy: 'Seat Away 热门挪座复刻 · 只许沿箭头滑，腾出离场路线',
  hint: '先点能挪开的前排座位，后面被堵住的出口才会慢慢露出来。',
  exitCopy: ' 顺着通道滑出去了。',
  slideCopy: ' 先挪到空位，给后排让路。',
  stuckCopy: ' 眼前没空位，先挪别的。',
  winCopy: '这一排已经全离场，通道彻底清空了。',
  statusNoun: '挪动',
  boardLabel: '候车区',
  exitLabel: '出口',
  bgTop: '#0f2333',
  bgBottom: '#09121a',
  boardFill: '#15283a',
  boardLine: '#395876',
  slotFill: 'rgba(255,255,255,.06)',
  exitGlow: 'rgba(98,216,255,.82)',
  colors: {
    amber: { fill: '#ffbf52', edge: '#ffe6a8' },
    cyan: { fill: '#67d7ff', edge: '#d5f4ff' },
    pink: { fill: '#ff87b5', edge: '#ffd8e8' },
    lime: { fill: '#9fdf62', edge: '#ebffc7' },
  },
  level: {
    rows: 5,
    cols: 5,
    cell: 62,
    boardX: 40,
    boardY: 120,
    seats: [
      { id: 0, row: 0, col: 1, dir: 'down', color: 'amber', label: 'A1', glyph: '客' },
      { id: 1, row: 1, col: 1, dir: 'right', color: 'cyan', label: 'B2', glyph: '客' },
      { id: 2, row: 1, col: 3, dir: 'up', color: 'pink', label: 'C3', glyph: '客' },
      { id: 3, row: 2, col: 0, dir: 'right', color: 'lime', label: 'D4', glyph: '客' },
      { id: 4, row: 2, col: 2, dir: 'down', color: 'amber', label: 'E5', glyph: '客' },
      { id: 5, row: 3, col: 2, dir: 'left', color: 'pink', label: 'F6', glyph: '客' },
      { id: 6, row: 3, col: 4, dir: 'up', color: 'cyan', label: 'G7', glyph: '客' },
      { id: 7, row: 4, col: 1, dir: 'left', color: 'lime', label: 'H8', glyph: '客' },
    ],
    exits: [
      { x1: 54, y1: 110, x2: 116, y2: 110, lx: 85, ly: 102 },
      { x1: 274, y1: 110, x2: 336, y2: 110, lx: 305, ly: 102 },
      { x1: 338, y1: 176, x2: 338, y2: 238, lx: 352, ly: 208 },
      { x1: 338, y1: 300, x2: 338, y2: 362, lx: 352, ly: 332 },
      { x1: 54, y1: 440, x2: 116, y2: 440, lx: 85, ly: 458 },
    ],
  },
});

const seatAwayOfficeRemixGame = createSeatAwayGame({
  id: 'office-seat-scramble',
  file: 'office-seat-scramble.html',
  title: '工位让一让',
  sourceGame: '挪座离场局 Remix',
  accent: '#8ae8ff',
  summary: '把乘客座位改成工牌工位：工椅只沿箭头滑，先腾出过道，再把整片工位清空。',
  buttonCopy: '重开这一层',
  topCopy: '办公室二创 · 只沿箭头推工椅，把堵住通道的工位挪开',
  hint: '先把能滑开的工椅推走，后排工牌才有路离开这片工位。',
  exitCopy: ' 顺着过道撤出了工位区。',
  slideCopy: ' 先挪到空工位，给同事让出通道。',
  stuckCopy: ' 前面卡着椅子，先处理别的工位。',
  winCopy: '这一层工位已经清空，晚班终于能散场了。',
  statusNoun: '推椅',
  boardLabel: '工位区',
  exitLabel: '走道',
  bgTop: '#0c1d2c',
  bgBottom: '#060b11',
  boardFill: '#132333',
  boardLine: '#34566f',
  slotFill: 'rgba(255,255,255,.05)',
  exitGlow: 'rgba(138,232,255,.88)',
  colors: {
    amber: { fill: '#f6b35b', edge: '#ffe3bd' },
    cyan: { fill: '#6fc7ff', edge: '#d4efff' },
    pink: { fill: '#ff8aa9', edge: '#ffd4e0' },
    lime: { fill: '#8dd56f', edge: '#e0ffc9' },
  },
  level: {
    rows: 5,
    cols: 5,
    cell: 62,
    boardX: 40,
    boardY: 120,
    seats: [
      { id: 0, row: 0, col: 2, dir: 'down', color: 'cyan', label: '研', glyph: '牌' },
      { id: 1, row: 1, col: 0, dir: 'right', color: 'lime', label: '包', glyph: '牌' },
      { id: 2, row: 1, col: 2, dir: 'right', color: 'amber', label: '仓', glyph: '牌' },
      { id: 3, row: 1, col: 4, dir: 'up', color: 'pink', label: '客', glyph: '牌' },
      { id: 4, row: 2, col: 1, dir: 'down', color: 'cyan', label: '研', glyph: '牌' },
      { id: 5, row: 2, col: 3, dir: 'left', color: 'amber', label: '仓', glyph: '牌' },
      { id: 6, row: 3, col: 3, dir: 'up', color: 'pink', label: '客', glyph: '牌' },
      { id: 7, row: 4, col: 1, dir: 'left', color: 'lime', label: '包', glyph: '牌' },
    ],
    exits: [
      { x1: 116, y1: 110, x2: 178, y2: 110, lx: 147, ly: 102 },
      { x1: 240, y1: 110, x2: 302, y2: 110, lx: 271, ly: 102 },
      { x1: 40, y1: 362, x2: 40, y2: 424, lx: 26, ly: 394 },
      { x1: 338, y1: 176, x2: 338, y2: 238, lx: 352, ly: 208 },
      { x1: 214, y1: 440, x2: 276, y2: 440, lx: 245, ly: 458 },
    ],
  },
});

function createColorBlockJamGame(config) {
  const theme = {
    topCopy: config.topCopy,
    hint: config.hint,
    swipeCopy: config.swipeCopy,
    blockedCopy: config.blockedCopy,
    exitCopy: config.exitCopy,
    winCopy: config.winCopy,
    selectCopy: config.selectCopy,
    movesLabel: config.movesLabel,
    leftLabel: config.leftLabel,
    gateLabel: config.gateLabel,
    bgTop: config.bgTop,
    bgBottom: config.bgBottom,
    boardFill: config.boardFill,
    boardLine: config.boardLine,
    slotFill: config.slotFill,
    wallFill: config.wallFill,
    wallEdge: config.wallEdge,
    colors: config.colors,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '彩块出门',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact stack">
        <div class="row"><b id="moveText">${config.movesLabel} 0</b><span id="leftText">${config.leftLabel} 0</span></div>
        <div class="row">
          <button class="choice" type="button" data-dir="up">↑</button>
          <button class="choice" type="button" data-dir="left">←</button>
          <button class="choice" type="button" data-dir="down">↓</button>
          <button class="choice" type="button" data-dir="right">→</button>
        </div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">${config.buttonCopy}</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const LEVEL = ${JSON.stringify(config.level)};
      const THEME = ${JSON.stringify(theme)};
      const DIRS = {
        up: { dr: -1, dc: 0, arrow: '↑' },
        right: { dr: 0, dc: 1, arrow: '→' },
        down: { dr: 1, dc: 0, arrow: '↓' },
        left: { dr: 0, dc: -1, arrow: '←' },
      };
      const state = { blocks: [], selectedId: null, moves: 0, mode: 'playing', note: THEME.hint };
      let pointerStart = null;
      function activeBlocks() {
        return state.blocks.filter((block) => block.active);
      }
      function reset() {
        state.blocks = LEVEL.blocks.map((block) => ({ ...block, active: true }));
        state.selectedId = null;
        state.moves = 0;
        state.mode = 'playing';
        state.note = THEME.hint;
        render();
      }
      function colorMeta(name) {
        return THEME.colors[name] || { fill: '#888', edge: '#fff', gate: '#fff' };
      }
      function selectedBlock() {
        return state.blocks.find((block) => block.id === state.selectedId && block.active) || null;
      }
      function spansOverlap(a1, a2, b1, b2) {
        return a1 <= b2 && b1 <= a2;
      }
      function collides(test, ignoreId) {
        for (const wall of LEVEL.walls) {
          if (
            test.col < wall.col + wall.w &&
            test.col + test.w > wall.col &&
            test.row < wall.row + wall.h &&
            test.row + test.h > wall.row
          ) return true;
        }
        return state.blocks.some((block) => (
          block.active &&
          block.id !== ignoreId &&
          test.col < block.col + block.w &&
          test.col + test.w > block.col &&
          test.row < block.row + block.h &&
          test.row + test.h > block.row
        ));
      }
      function gateFor(block, dirName, row, col) {
        const exits = LEVEL.exits.filter((exit) => exit.color === block.color && exit.side === dirName);
        for (const exit of exits) {
          if (dirName === 'left' && col === 0 && spansOverlap(row, row + block.h - 1, exit.from, exit.to)) return exit;
          if (dirName === 'right' && col + block.w === LEVEL.cols && spansOverlap(row, row + block.h - 1, exit.from, exit.to)) return exit;
          if (dirName === 'up' && row === 0 && spansOverlap(col, col + block.w - 1, exit.from, exit.to)) return exit;
          if (dirName === 'down' && row + block.h === LEVEL.rows && spansOverlap(col, col + block.w - 1, exit.from, exit.to)) return exit;
        }
        return null;
      }
      function outcomeFor(block, dirName) {
        if (!block || state.mode !== 'playing') return { type: 'blocked', row: 0, col: 0, steps: 0 };
        const dir = DIRS[dirName];
        if (!dir) return { type: 'blocked', row: block.row, col: block.col, steps: 0 };
        let row = block.row;
        let col = block.col;
        let steps = 0;
        while (true) {
          const nextRow = row + dir.dr;
          const nextCol = col + dir.dc;
          if (nextRow < 0 || nextCol < 0 || nextRow + block.h > LEVEL.rows || nextCol + block.w > LEVEL.cols) break;
          if (collides({ row: nextRow, col: nextCol, w: block.w, h: block.h }, block.id)) break;
          row = nextRow;
          col = nextCol;
          steps += 1;
        }
        const gate = gateFor(block, dirName, row, col);
        if (gate) return { type: 'exit', row, col, steps, gate };
        if (steps > 0) return { type: 'slide', row, col, steps };
        return { type: 'blocked', row, col, steps: 0 };
      }
      function choose(block) {
        if (!block || state.mode !== 'playing') return;
        state.selectedId = block.id;
        state.note = block.label + THEME.selectCopy;
        render();
      }
      function act(dirName) {
        const block = selectedBlock();
        if (!block) {
          state.note = THEME.hint;
          render();
          return;
        }
        const outcome = outcomeFor(block, dirName);
        if (outcome.type === 'blocked') {
          state.note = block.label + THEME.blockedCopy;
          render();
          return;
        }
        state.moves += 1;
        if (outcome.type === 'slide') {
          block.row = outcome.row;
          block.col = outcome.col;
          state.note = block.label + THEME.swipeCopy.replace('{steps}', String(outcome.steps));
        } else {
          block.row = outcome.row;
          block.col = outcome.col;
          block.active = false;
          state.selectedId = null;
          state.note = block.label + THEME.exitCopy;
        }
        if (!activeBlocks().length) {
          state.mode = 'won';
          state.note = THEME.winCopy;
        }
        render();
      }
      function pointFromEvent(event) {
        const box = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - box.left) * canvas.width / box.width,
          y: (event.clientY - box.top) * canvas.height / box.height,
        };
      }
      function blockRect(block) {
        return {
          x: LEVEL.boardX + block.col * LEVEL.cell,
          y: LEVEL.boardY + block.row * LEVEL.cell,
          w: block.w * LEVEL.cell,
          h: block.h * LEVEL.cell,
        };
      }
      function blockFromPoint(point) {
        return activeBlocks()
          .filter((block) => {
            const rect = blockRect(block);
            return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
          })
          .sort((a, b) => (b.w * b.h) - (a.w * a.h))[0] || null;
      }
      function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, 560);
        gradient.addColorStop(0, THEME.bgTop);
        gradient.addColorStop(1, THEME.bgBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = 'rgba(255,255,255,.05)';
        for (let i = 0; i < 8; i += 1) ctx.fillRect(26, 84 + i * 18, 338, 1);
        ctx.fillStyle = '#fff';
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(${JSON.stringify(config.title)}, 24, 38);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.topCopy, 24, 58);
      }
      function drawBoard() {
        const width = LEVEL.cols * LEVEL.cell;
        const height = LEVEL.rows * LEVEL.cell;
        ctx.fillStyle = THEME.boardFill;
        ctx.strokeStyle = THEME.boardLine;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(LEVEL.boardX - 10, LEVEL.boardY - 10, width + 20, height + 20, 28);
        ctx.fill();
        ctx.stroke();
        for (let row = 0; row < LEVEL.rows; row += 1) {
          for (let col = 0; col < LEVEL.cols; col += 1) {
            const x = LEVEL.boardX + col * LEVEL.cell;
            const y = LEVEL.boardY + row * LEVEL.cell;
            ctx.fillStyle = THEME.slotFill;
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 4, LEVEL.cell - 8, LEVEL.cell - 8, 12);
            ctx.fill();
          }
        }
        for (const wall of LEVEL.walls) {
          const x = LEVEL.boardX + wall.col * LEVEL.cell;
          const y = LEVEL.boardY + wall.row * LEVEL.cell;
          ctx.fillStyle = THEME.wallFill;
          ctx.strokeStyle = THEME.wallEdge;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x + 6, y + 6, wall.w * LEVEL.cell - 12, wall.h * LEVEL.cell - 12, 14);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.56)';
          ctx.font = '900 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(wall.label, x + wall.w * LEVEL.cell / 2, y + wall.h * LEVEL.cell / 2 + 4);
        }
        for (const exit of LEVEL.exits) {
          const meta = colorMeta(exit.color);
          ctx.strokeStyle = meta.gate;
          ctx.lineWidth = 10;
          ctx.beginPath();
          if (exit.side === 'left') {
            const y1 = LEVEL.boardY + exit.from * LEVEL.cell + 8;
            const y2 = LEVEL.boardY + (exit.to + 1) * LEVEL.cell - 8;
            ctx.moveTo(LEVEL.boardX - 14, y1);
            ctx.lineTo(LEVEL.boardX - 14, y2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,.76)';
            ctx.font = '800 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(THEME.gateLabel[exit.color], 18, (y1 + y2) / 2 + 4);
          }
          if (exit.side === 'right') {
            const y1 = LEVEL.boardY + exit.from * LEVEL.cell + 8;
            const y2 = LEVEL.boardY + (exit.to + 1) * LEVEL.cell - 8;
            ctx.moveTo(LEVEL.boardX + LEVEL.cols * LEVEL.cell + 14, y1);
            ctx.lineTo(LEVEL.boardX + LEVEL.cols * LEVEL.cell + 14, y2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,.76)';
            ctx.font = '800 10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(THEME.gateLabel[exit.color], 372, (y1 + y2) / 2 + 4);
          }
          if (exit.side === 'up') {
            const x1 = LEVEL.boardX + exit.from * LEVEL.cell + 8;
            const x2 = LEVEL.boardX + (exit.to + 1) * LEVEL.cell - 8;
            ctx.moveTo(x1, LEVEL.boardY - 14);
            ctx.lineTo(x2, LEVEL.boardY - 14);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,.76)';
            ctx.font = '800 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(THEME.gateLabel[exit.color], (x1 + x2) / 2, LEVEL.boardY - 22);
          }
          if (exit.side === 'down') {
            const x1 = LEVEL.boardX + exit.from * LEVEL.cell + 8;
            const x2 = LEVEL.boardX + (exit.to + 1) * LEVEL.cell - 8;
            ctx.moveTo(x1, LEVEL.boardY + LEVEL.rows * LEVEL.cell + 14);
            ctx.lineTo(x2, LEVEL.boardY + LEVEL.rows * LEVEL.cell + 14);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,.76)';
            ctx.font = '800 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(THEME.gateLabel[exit.color], (x1 + x2) / 2, LEVEL.boardY + LEVEL.rows * LEVEL.cell + 30);
          }
        }
      }
      function drawBlock(block) {
        const rect = blockRect(block);
        const meta = colorMeta(block.color);
        const selected = state.selectedId === block.id;
        ctx.save();
        ctx.translate(rect.x, rect.y);
        ctx.fillStyle = meta.fill;
        ctx.strokeStyle = selected ? '#ffffff' : meta.edge;
        ctx.lineWidth = selected ? 4 : 3;
        ctx.beginPath();
        ctx.roundRect(6, 6, rect.w - 12, rect.h - 12, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.2)';
        ctx.fillRect(16, 16, rect.w - 32, 10);
        ctx.fillStyle = '#081019';
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(block.glyph, rect.w / 2, rect.h / 2 + 6);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.font = '800 10px sans-serif';
        ctx.fillText(block.label, rect.w / 2, rect.h - 16);
        ctx.restore();
      }
      function render() {
        drawBackground();
        drawBoard();
        activeBlocks().forEach(drawBlock);
        if (state.mode === 'won') {
          ctx.fillStyle = 'rgba(6,10,18,.72)';
          ctx.fillRect(28, 196, 334, 104);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('全部出门', 195, 234);
          ctx.font = '700 14px sans-serif';
          ctx.fillText(state.note, 195, 264);
        }
        document.getElementById('moveText').textContent = THEME.movesLabel + ' ' + state.moves;
        document.getElementById('leftText').textContent = THEME.leftLabel + ' ' + activeBlocks().length;
        document.getElementById('statusText').textContent = state.note;
      }
      canvas.addEventListener('pointerdown', (event) => {
        const point = pointFromEvent(event);
        const block = blockFromPoint(point);
        pointerStart = point;
        if (block) choose(block);
      });
      canvas.addEventListener('pointerup', (event) => {
        if (!pointerStart) return;
        const point = pointFromEvent(event);
        const dx = point.x - pointerStart.x;
        const dy = point.y - pointerStart.y;
        pointerStart = null;
        if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
        if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? 'right' : 'left');
        else act(dy > 0 ? 'down' : 'up');
      });
      document.querySelectorAll('[data-dir]').forEach((button) => {
        button.addEventListener('click', () => act(button.dataset.dir));
      });
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => render();
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with a 6x6 block board; row increases downward, col increases rightward',
        mode: state.mode,
        moves: state.moves,
        selected: state.selectedId,
        remaining: activeBlocks().length,
        blocks: activeBlocks().map((block) => ({
          id: block.id,
          label: block.label,
          row: block.row,
          col: block.col,
          w: block.w,
          h: block.h,
          exits: Object.fromEntries(Object.keys(DIRS).map((dir) => [dir, outcomeFor(block, dir).type])),
        })),
      });
    `,
  };
}

const colorBlockJamBaseGame = createColorBlockJamGame({
  id: 'color-block-jam-fake',
  file: 'color-block-jam-fake.html',
  title: '彩块出门局',
  sourceGame: 'Color Block Jam 式同色出口滑块解谜',
  accent: '#62d8ff',
  summary: '选中彩块后朝任意方向一划，让它一路滑到同色出口，清空整盘即过关。',
  buttonCopy: '重开这盘',
  topCopy: 'Color Block Jam 热门复刻 · 把彩块滑到同色门口',
  hint: '先点中一个彩块，再向四个方向滑动；同色出口贴边后会直接出门。',
  selectCopy: ' 已选中，接着朝想走的方向一划。',
  swipeCopy: ' 滑开了 {steps} 格，先给别的块腾路。',
  blockedCopy: ' 这个方向被墙和别块堵死了。',
  exitCopy: ' 对准同色门口，直接滑出去了。',
  winCopy: '整盘彩块都顺利出门了。',
  movesLabel: '步数',
  leftLabel: '剩余',
  gateLabel: { red: '红门', blue: '蓝门', yellow: '黄门', green: '绿门', purple: '紫门', cyan: '青门' },
  bgTop: '#0f2032',
  bgBottom: '#071018',
  boardFill: '#15283d',
  boardLine: '#3d5f83',
  slotFill: 'rgba(255,255,255,.05)',
  wallFill: '#465066',
  wallEdge: '#97a8cb',
  colors: {
    red: { fill: '#ff7b8f', edge: '#ffd6df', gate: 'rgba(255,123,143,.96)' },
    blue: { fill: '#63c7ff', edge: '#d9f2ff', gate: 'rgba(99,199,255,.96)' },
    yellow: { fill: '#ffcf62', edge: '#fff0bc', gate: 'rgba(255,207,98,.96)' },
    green: { fill: '#7ddd86', edge: '#e1ffd8', gate: 'rgba(125,221,134,.96)' },
    purple: { fill: '#bc8dff', edge: '#efe3ff', gate: 'rgba(188,141,255,.96)' },
    cyan: { fill: '#58ead7', edge: '#d7fffa', gate: 'rgba(88,234,215,.96)' },
  },
  level: {
    rows: 6,
    cols: 6,
    cell: 52,
    boardX: 39,
    boardY: 118,
    exits: [
      { side: 'right', color: 'red', from: 0, to: 0 },
      { side: 'up', color: 'blue', from: 2, to: 2 },
      { side: 'down', color: 'yellow', from: 5, to: 5 },
      { side: 'left', color: 'green', from: 4, to: 4 },
      { side: 'right', color: 'purple', from: 3, to: 3 },
      { side: 'up', color: 'cyan', from: 0, to: 0 },
    ],
    walls: [
      { row: 1, col: 1, w: 1, h: 1, label: '箱' },
      { row: 1, col: 4, w: 1, h: 1, label: '锁' },
      { row: 3, col: 1, w: 1, h: 1, label: '箱' },
      { row: 4, col: 3, w: 1, h: 1, label: '锁' },
    ],
    blocks: [
      { id: 0, row: 0, col: 1, w: 2, h: 1, color: 'red', glyph: '红', label: 'R' },
      { id: 1, row: 2, col: 2, w: 1, h: 2, color: 'blue', glyph: '蓝', label: 'B' },
      { id: 2, row: 3, col: 5, w: 1, h: 2, color: 'yellow', glyph: '黄', label: 'Y' },
      { id: 3, row: 4, col: 2, w: 2, h: 1, color: 'green', glyph: '绿', label: 'G' },
      { id: 4, row: 2, col: 4, w: 1, h: 1, color: 'purple', glyph: '紫', label: 'P' },
      { id: 5, row: 2, col: 0, w: 1, h: 1, color: 'cyan', glyph: '青', label: 'C' },
    ],
  },
});

const colorBlockJamOfficeRemixGame = createColorBlockJamGame({
  id: 'office-folder-jam',
  file: 'office-folder-jam.html',
  title: '工位文件归槽',
  sourceGame: '彩块出门局 Remix',
  accent: '#8ae8ff',
  summary: '把彩块改成部门文件夹，往对应收纳槽一路滑走，清空整块工位板就能散场。',
  buttonCopy: '重开这一层',
  topCopy: '办公室二创 · 把文件夹滑进同部门收纳槽',
  hint: '先选中文件夹再划方向；先把大文件夹挪开，后排的小件才有路归槽。',
  selectCopy: ' 已选中，往目标收纳槽方向推。',
  swipeCopy: ' 挪开了 {steps} 格，先把走道腾出来了。',
  blockedCopy: ' 这个方向被柜子和别的文件夹堵住了。',
  exitCopy: ' 已经滑进同部门收纳槽。',
  winCopy: '这一层文件都已经归槽完毕。',
  movesLabel: '挪动',
  leftLabel: '待归',
  gateLabel: { red: '财务', blue: '研发', yellow: '运营', green: '行政', purple: '客服', cyan: '仓配' },
  bgTop: '#0c1b29',
  bgBottom: '#050b12',
  boardFill: '#122436',
  boardLine: '#36556f',
  slotFill: 'rgba(255,255,255,.05)',
  wallFill: '#414b60',
  wallEdge: '#92a3c7',
  colors: {
    red: { fill: '#ff8a9d', edge: '#ffdbe4', gate: 'rgba(255,138,157,.96)' },
    blue: { fill: '#70cfff', edge: '#d8f3ff', gate: 'rgba(112,207,255,.96)' },
    yellow: { fill: '#f7c86e', edge: '#fff0bf', gate: 'rgba(247,200,110,.96)' },
    green: { fill: '#92dd78', edge: '#e5ffd4', gate: 'rgba(146,221,120,.96)' },
    purple: { fill: '#c495ff', edge: '#f0e3ff', gate: 'rgba(196,149,255,.96)' },
    cyan: { fill: '#67e5d0', edge: '#d7fff7', gate: 'rgba(103,229,208,.96)' },
  },
  level: {
    rows: 6,
    cols: 6,
    cell: 52,
    boardX: 39,
    boardY: 118,
    exits: [
      { side: 'right', color: 'red', from: 0, to: 0 },
      { side: 'up', color: 'blue', from: 2, to: 2 },
      { side: 'down', color: 'yellow', from: 5, to: 5 },
      { side: 'left', color: 'green', from: 4, to: 4 },
      { side: 'right', color: 'purple', from: 3, to: 3 },
      { side: 'up', color: 'cyan', from: 0, to: 0 },
    ],
    walls: [
      { row: 1, col: 1, w: 1, h: 1, label: '柜' },
      { row: 1, col: 4, w: 1, h: 1, label: '架' },
      { row: 3, col: 1, w: 1, h: 1, label: '柜' },
      { row: 4, col: 3, w: 1, h: 1, label: '架' },
    ],
    blocks: [
      { id: 0, row: 0, col: 1, w: 2, h: 1, color: 'red', glyph: '财', label: '报表' },
      { id: 1, row: 2, col: 2, w: 1, h: 2, color: 'blue', glyph: '研', label: '需求' },
      { id: 2, row: 3, col: 5, w: 1, h: 2, color: 'yellow', glyph: '运', label: '排期' },
      { id: 3, row: 4, col: 2, w: 2, h: 1, color: 'green', glyph: '行', label: '审批' },
      { id: 4, row: 2, col: 4, w: 1, h: 1, color: 'purple', glyph: '客', label: '回复' },
      { id: 5, row: 2, col: 0, w: 1, h: 1, color: 'cyan', glyph: '仓', label: '拣单' },
    ],
  },
});

function createTapAwayGame(config) {
  const theme = {
    topCopy: config.topCopy,
    hint: config.hint,
    freeCopy: config.freeCopy,
    blockedCopy: config.blockedCopy,
    rotateCopy: config.rotateCopy,
    winCopy: config.winCopy,
    buttonCopy: config.buttonCopy,
    clearedLabel: config.clearedLabel,
    leftLabel: config.leftLabel,
    boardLabel: config.boardLabel,
    bgTop: config.bgTop,
    bgBottom: config.bgBottom,
    panelTint: config.panelTint,
    edge: config.edge,
    shadow: config.shadow,
    colors: config.colors,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '立体解块',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="clearText"></b><span id="leftText"></span></div>
        <p id="statusText">${theme.hint}</p>
        <div class="button-row">
          <button class="choice" id="turnLeftBtn">左转</button>
          <button class="choice" id="turnRightBtn">右转</button>
          <button class="primary" id="resetBtn">${theme.buttonCopy}</button>
        </div>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const THEME = ${JSON.stringify(theme)};
      const LEVEL = ${JSON.stringify(config.level)};
      const DIRS = {
        xp: { x: 1, y: 0, z: 0, arrow: '→' },
        xm: { x: -1, y: 0, z: 0, arrow: '←' },
        yp: { x: 0, y: 1, z: 0, arrow: '↘' },
        ym: { x: 0, y: -1, z: 0, arrow: '↖' },
        zp: { x: 0, y: 0, z: 1, arrow: '↑' },
        zm: { x: 0, y: 0, z: -1, arrow: '↓' },
      };
      const state = { blocks: [], yaw: 0, cleared: 0, mode: 'playing', note: THEME.hint };
      function rotateXY(x, y, turns) {
        const step = ((turns % 4) + 4) % 4;
        if (step === 0) return { x, y };
        if (step === 1) return { x: y, y: -x };
        if (step === 2) return { x: -x, y: -y };
        return { x: -y, y: x };
      }
      function rotatedBlock(block) {
        const centered = rotateXY(block.x - 1, block.y - 1, state.yaw);
        return { x: centered.x, y: centered.y, z: block.z - 1 };
      }
      function screenPoint(block) {
        const r = rotatedBlock(block);
        return {
          x: 195 + (r.x - r.y) * 38,
          y: 270 + (r.x + r.y) * 20 - r.z * 42,
          depth: (r.x + r.y) * 10 + r.z * 18,
        };
      }
      function facePolys(block) {
        const p = screenPoint(block);
        const top = [
          { x: p.x, y: p.y - 28 },
          { x: p.x + 32, y: p.y - 12 },
          { x: p.x, y: p.y + 4 },
          { x: p.x - 32, y: p.y - 12 },
        ];
        const left = [
          { x: p.x - 32, y: p.y - 12 },
          { x: p.x, y: p.y + 4 },
          { x: p.x, y: p.y + 42 },
          { x: p.x - 32, y: p.y + 26 },
        ];
        const right = [
          { x: p.x + 32, y: p.y - 12 },
          { x: p.x, y: p.y + 4 },
          { x: p.x, y: p.y + 42 },
          { x: p.x + 32, y: p.y + 26 },
        ];
        return { top, left, right, center: p };
      }
      function drawPoly(points, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      function pointInPoly(point, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i].x;
          const yi = poly[i].y;
          const xj = poly[j].x;
          const yj = poly[j].y;
          const intersect = ((yi > point.y) !== (yj > point.y)) && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 0.0001) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      }
      function activeBlocks() {
        return state.blocks.filter((block) => block.active);
      }
      function findBlock(x, y, z, ignoreId) {
        return state.blocks.find((block) => block.active && block.id !== ignoreId && block.x === x && block.y === y && block.z === z) || null;
      }
      function clearPath(block) {
        const dir = DIRS[block.dir];
        let x = block.x;
        let y = block.y;
        let z = block.z;
        while (true) {
          x += dir.x;
          y += dir.y;
          z += dir.z;
          if (x < 0 || x > 2 || y < 0 || y > 2 || z < 0 || z > 2) return true;
          if (findBlock(x, y, z, block.id)) return false;
        }
      }
      function blockingCopy(block) {
        const dir = DIRS[block.dir];
        const meta = THEME.colors[block.color];
        return meta.label + THEME.blockedCopy.replace('{arrow}', dir.arrow);
      }
      function reset() {
        state.blocks = LEVEL.blocks.map((block) => ({ ...block, active: true }));
        state.yaw = 0;
        state.cleared = 0;
        state.mode = 'playing';
        state.note = THEME.hint;
        render();
      }
      function turn(delta) {
        state.yaw = (state.yaw + delta + 4) % 4;
        if (state.mode === 'playing') state.note = THEME.rotateCopy;
        render();
      }
      function removeBlock(block) {
        if (state.mode !== 'playing' || !block || !block.active) return;
        if (!clearPath(block)) {
          state.note = blockingCopy(block);
          render();
          return;
        }
        block.active = false;
        state.cleared += 1;
        const meta = THEME.colors[block.color];
        state.note = meta.label + THEME.freeCopy;
        if (!activeBlocks().length) {
          state.mode = 'won';
          state.note = THEME.winCopy;
        }
        render();
      }
      function blockFromPoint(point) {
        return activeBlocks()
          .map((block) => ({ block, polys: facePolys(block) }))
          .filter((entry) => pointInPoly(point, entry.polys.top) || pointInPoly(point, entry.polys.left) || pointInPoly(point, entry.polys.right))
          .sort((a, b) => b.polys.center.depth - a.polys.center.depth || b.polys.center.y - a.polys.center.y)[0]?.block || null;
      }
      function pointFromEvent(event) {
        const box = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - box.left) * canvas.width / box.width,
          y: (event.clientY - box.top) * canvas.height / box.height,
        };
      }
      function drawScene() {
        const gradient = ctx.createLinearGradient(0, 0, 0, 560);
        gradient.addColorStop(0, THEME.bgTop);
        gradient.addColorStop(1, THEME.bgBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = 'rgba(255,255,255,.06)';
        for (let i = 0; i < 7; i += 1) ctx.fillRect(36 + i * 44, 88 + (i % 2) * 4, 22, 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(${JSON.stringify(config.title)}, 24, 38);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.topCopy, 24, 58);
        ctx.fillStyle = THEME.panelTint;
        ctx.strokeStyle = THEME.edge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(40, 98, 310, 332, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.56)';
        ctx.font = '800 12px sans-serif';
        ctx.fillText(THEME.boardLabel, 54, 118);
        ctx.fillStyle = THEME.shadow;
        ctx.beginPath();
        ctx.ellipse(195, 350, 118, 42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      function drawBlock(block) {
        const meta = THEME.colors[block.color];
        const polys = facePolys(block);
        const free = clearPath(block);
        drawPoly(polys.left, free ? meta.left : 'rgba(76,84,96,.92)', THEME.edge);
        drawPoly(polys.right, free ? meta.right : 'rgba(90,96,108,.94)', THEME.edge);
        drawPoly(polys.top, free ? meta.top : 'rgba(108,114,126,.96)', THEME.edge);
        ctx.fillStyle = free ? '#081017' : 'rgba(16,18,24,.82)';
        ctx.font = '900 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(DIRS[block.dir].arrow, polys.center.x, polys.center.y + 2);
        ctx.font = '800 11px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.fillText(meta.glyph, polys.center.x, polys.center.y + 19);
      }
      function render() {
        drawScene();
        activeBlocks()
          .slice()
          .sort((a, b) => screenPoint(a).depth - screenPoint(b).depth || screenPoint(a).y - screenPoint(b).y)
          .forEach(drawBlock);
        if (state.mode === 'won') {
          ctx.fillStyle = 'rgba(6,10,18,.76)';
          ctx.fillRect(38, 188, 314, 110);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('整团拆空', 195, 230);
          ctx.font = '700 14px sans-serif';
          ctx.fillText(state.note, 195, 258);
        }
        document.getElementById('clearText').textContent = THEME.clearedLabel + ' ' + state.cleared;
        document.getElementById('leftText').textContent = THEME.leftLabel + ' ' + activeBlocks().length;
        document.getElementById('statusText').textContent = state.note;
      }
      let dragStart = null;
      canvas.addEventListener('pointerdown', (event) => { dragStart = pointFromEvent(event); });
      canvas.addEventListener('pointerup', (event) => {
        const point = pointFromEvent(event);
        if (!dragStart) return;
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;
        if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
          turn(dx > 0 ? 1 : -1);
        } else if (Math.abs(dy) > 28) {
          turn(dy > 0 ? 2 : 1);
        } else {
          removeBlock(blockFromPoint(point));
        }
        dragStart = null;
      });
      document.getElementById('turnLeftBtn').addEventListener('click', () => turn(-1));
      document.getElementById('turnRightBtn').addEventListener('click', () => turn(1));
      document.getElementById('resetBtn').addEventListener('click', reset);
      window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') turn(-1);
        if (event.key === 'ArrowRight') turn(1);
      });
      reset();
      window.advanceTime = () => render();
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with 3x3x3 isometric cube cluster',
        mode: state.mode,
        yaw: state.yaw,
        cleared: state.cleared,
        remaining: activeBlocks().length,
        blocks: activeBlocks().map((block) => ({
          id: block.id,
          pos: [block.x, block.y, block.z],
          dir: block.dir,
          free: clearPath(block)
        })),
      });
    `,
  };
}

const tapAwayBaseGame = createTapAwayGame({
  id: 'tap-away-fake',
  file: 'tap-away-fake.html',
  title: '立体箭块局',
  sourceGame: 'Tap Away / Block Out - Tap Away 式 3D 箭头出块',
  accent: '#74ddff',
  summary: '点能顺着箭头飞出去的方块，不通就旋转整团找新角度，把 3D 团块拆空。',
  buttonCopy: '重开这一团',
  topCopy: 'Tap Away 热门复刻 · 点掉能沿箭头飞出的立体方块',
  hint: '先看箭头朝向；点能直接飞出外层的块，不通就左右旋转整团换视角。',
  freeCopy: ' 顺着箭头弹出去了。',
  blockedCopy: ' 这面还被别块卡着，先转到别的角度。',
  rotateCopy: '已经换角度了，继续找外层能直接飞走的箭块。',
  winCopy: '这团箭块已经全拆空了。',
  clearedLabel: '已拆',
  leftLabel: '剩余',
  boardLabel: '箭块团',
  bgTop: '#0b2032',
  bgBottom: '#060d15',
  panelTint: '#13283a',
  edge: 'rgba(225,245,255,.82)',
  shadow: 'rgba(0,0,0,.34)',
  colors: {
    cyan: { top: '#8ef3ff', left: '#43bdd3', right: '#67ddec', glyph: '青', label: '青块' },
    amber: { top: '#ffd980', left: '#cf9638', right: '#f5be56', glyph: '黄', label: '黄块' },
    pink: { top: '#ff9fc1', left: '#ca587d', right: '#ea789d', glyph: '粉', label: '粉块' },
    lime: { top: '#bdf48b', left: '#6baa36', right: '#94d65a', glyph: '绿', label: '绿块' },
    violet: { top: '#ccb0ff', left: '#7f67cc', right: '#a086ef', glyph: '紫', label: '紫块' },
  },
  level: {
    blocks: [
      { id: 0, x: 0, y: 0, z: 0, dir: 'xm', color: 'cyan' },
      { id: 1, x: 1, y: 0, z: 0, dir: 'ym', color: 'amber' },
      { id: 2, x: 2, y: 0, z: 0, dir: 'xp', color: 'pink' },
      { id: 3, x: 0, y: 1, z: 0, dir: 'xm', color: 'lime' },
      { id: 4, x: 1, y: 1, z: 0, dir: 'zp', color: 'violet' },
      { id: 5, x: 2, y: 1, z: 0, dir: 'xp', color: 'cyan' },
      { id: 6, x: 0, y: 2, z: 0, dir: 'yp', color: 'amber' },
      { id: 7, x: 1, y: 2, z: 0, dir: 'yp', color: 'pink' },
      { id: 8, x: 2, y: 2, z: 0, dir: 'xp', color: 'lime' },
      { id: 9, x: 0, y: 0, z: 1, dir: 'zm', color: 'violet' },
      { id: 10, x: 2, y: 0, z: 1, dir: 'ym', color: 'cyan' },
      { id: 11, x: 0, y: 2, z: 1, dir: 'xp', color: 'amber' },
      { id: 12, x: 2, y: 2, z: 1, dir: 'xm', color: 'pink' },
      { id: 13, x: 1, y: 1, z: 1, dir: 'zp', color: 'lime' },
      { id: 14, x: 1, y: 1, z: 2, dir: 'zp', color: 'violet' },
    ],
  },
});

const tapAwayWarehouseRemixGame = createTapAwayGame({
  id: 'night-shift-crate-out',
  file: 'night-shift-crate-out.html',
  title: '夜班货架出箱',
  sourceGame: '立体箭块局 Remix',
  accent: '#8ef6d8',
  summary: '把彩色箭块改成夜班货箱：顺着贴纸方向把外层箱子先推出去，再慢慢拆空整架。',
  buttonCopy: '重开这架',
  topCopy: '仓储二创 · 先推出外层货箱，再把中层箱位一点点拆空',
  hint: '先清掉露在外侧的货箱；看贴纸方向判断能不能直接出架，不通就转架子。',
  freeCopy: ' 顺着货道被推出去了。',
  blockedCopy: ' 这条货道还被其他箱子堵住。',
  rotateCopy: '货架角度换好了，继续找现在能直接出架的箱子。',
  winCopy: '这架夜班货箱已经全部出完。',
  clearedLabel: '已出',
  leftLabel: '待出',
  boardLabel: '夜班货架',
  bgTop: '#081d22',
  bgBottom: '#041014',
  panelTint: '#0f2529',
  edge: 'rgba(213,255,241,.84)',
  shadow: 'rgba(0,0,0,.38)',
  colors: {
    cyan: { top: '#8bf0de', left: '#3b9a8b', right: '#61c8b7', glyph: '冷', label: '冷链箱' },
    amber: { top: '#ffd98b', left: '#c18b35', right: '#ebb75b', glyph: '急', label: '急件箱' },
    pink: { top: '#ffa9b7', left: '#c05f72', right: '#df7f92', glyph: '退', label: '退件箱' },
    lime: { top: '#b7f28d', left: '#6f9d3b', right: '#92cb58', glyph: '补', label: '补货箱' },
    violet: { top: '#ccb9ff', left: '#7e6abf', right: '#a18de8', glyph: '夜', label: '夜配箱' },
  },
  level: {
    blocks: [
      { id: 0, x: 0, y: 0, z: 0, dir: 'xm', color: 'cyan' },
      { id: 1, x: 1, y: 0, z: 0, dir: 'ym', color: 'amber' },
      { id: 2, x: 2, y: 0, z: 0, dir: 'xp', color: 'pink' },
      { id: 3, x: 0, y: 1, z: 0, dir: 'xm', color: 'lime' },
      { id: 4, x: 1, y: 1, z: 0, dir: 'zp', color: 'violet' },
      { id: 5, x: 2, y: 1, z: 0, dir: 'xp', color: 'cyan' },
      { id: 6, x: 0, y: 2, z: 0, dir: 'yp', color: 'amber' },
      { id: 7, x: 1, y: 2, z: 0, dir: 'yp', color: 'pink' },
      { id: 8, x: 2, y: 2, z: 0, dir: 'xp', color: 'lime' },
      { id: 9, x: 0, y: 0, z: 1, dir: 'zm', color: 'violet' },
      { id: 10, x: 2, y: 0, z: 1, dir: 'ym', color: 'cyan' },
      { id: 11, x: 0, y: 2, z: 1, dir: 'xp', color: 'amber' },
      { id: 12, x: 2, y: 2, z: 1, dir: 'xm', color: 'pink' },
      { id: 13, x: 1, y: 1, z: 1, dir: 'zp', color: 'lime' },
      { id: 14, x: 1, y: 1, z: 2, dir: 'zp', color: 'violet' },
    ],
  },
});

function createParkingJamGame(config) {
  const theme = {
    topCopy: config.topCopy,
    hint: config.hint,
    moveCopy: config.moveCopy,
    blockedCopy: config.blockedCopy,
    exitCopy: config.exitCopy,
    winCopy: config.winCopy,
    buttonCopy: config.buttonCopy,
    movesLabel: config.movesLabel,
    leftLabel: config.leftLabel,
    boardLabel: config.boardLabel,
    exitLabel: config.exitLabel,
    bgTop: config.bgTop,
    bgBottom: config.bgBottom,
    lotFill: config.lotFill,
    lotLine: config.lotLine,
    slotFill: config.slotFill,
    exitGlow: config.exitGlow,
    colors: config.colors,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '停车解堵',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="moveText">${config.movesLabel} 0</b><span id="leftText">${config.leftLabel} 0</span></div>
        <p id="statusText">${theme.hint}</p>
        <button class="primary" id="resetBtn">${theme.buttonCopy}</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const THEME = ${JSON.stringify(theme)};
      const LEVEL = ${JSON.stringify(config.level)};
      const DIRS = {
        up: { dr: -1, dc: 0, arrow: '↑' },
        right: { dr: 0, dc: 1, arrow: '→' },
        down: { dr: 1, dc: 0, arrow: '↓' },
        left: { dr: 0, dc: -1, arrow: '←' },
      };
      const state = { cars: [], selectedId: null, moves: 0, escaped: 0, mode: 'playing', note: THEME.hint };
      function cloneCars() {
        return LEVEL.cars.map((car) => ({ ...car, active: true }));
      }
      function activeCars() {
        return state.cars.filter((car) => car.active);
      }
      function cellsFor(car, row = car.row, col = car.col) {
        const cells = [];
        for (let step = 0; step < car.len; step += 1) {
          cells.push(car.axis === 'h' ? { row, col: col + step } : { row: row + step, col });
        }
        return cells;
      }
      function occupies(row, col, ignoreId) {
        return state.cars.some((car) => car.active && car.id !== ignoreId && cellsFor(car).some((cell) => cell.row === row && cell.col === col));
      }
      function outcomeFor(car) {
        const dir = DIRS[car.dir];
        let row = car.row;
        let col = car.col;
        let distance = 0;
        while (true) {
          const nextRow = row + dir.dr;
          const nextCol = col + dir.dc;
          const nextCells = cellsFor(car, nextRow, nextCol);
          const outside = nextCells.filter((cell) => cell.row < 0 || cell.row >= LEVEL.rows || cell.col < 0 || cell.col >= LEVEL.cols);
          if (outside.length) {
            return distance >= 0 ? { type: 'exit', row, col, distance: distance + 1 } : { type: 'blocked', row: car.row, col: car.col, distance: 0 };
          }
          if (nextCells.some((cell) => occupies(cell.row, cell.col, car.id))) {
            return distance > 0 ? { type: 'slide', row, col, distance } : { type: 'blocked', row: car.row, col: car.col, distance: 0 };
          }
          row = nextRow;
          col = nextCol;
          distance += 1;
        }
      }
      function reset() {
        state.cars = cloneCars();
        state.selectedId = null;
        state.moves = 0;
        state.escaped = 0;
        state.mode = 'playing';
        state.note = THEME.hint;
        render();
      }
      function carRect(car) {
        const x = LEVEL.boardX + car.col * LEVEL.cell + 6;
        const y = LEVEL.boardY + car.row * LEVEL.cell + 6;
        return car.axis === 'h'
          ? { x, y, w: car.len * LEVEL.cell - 12, h: LEVEL.cell - 12 }
          : { x, y, w: LEVEL.cell - 12, h: car.len * LEVEL.cell - 12 };
      }
      function pointFromEvent(event) {
        const box = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - box.left) * canvas.width / box.width,
          y: (event.clientY - box.top) * canvas.height / box.height,
        };
      }
      function carFromPoint(point) {
        return activeCars()
          .filter((car) => {
            const rect = carRect(car);
            return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
          })
          .sort((a, b) => b.len - a.len)[0] || null;
      }
      function actOnCar(car) {
        if (!car || state.mode !== 'playing') return;
        state.selectedId = car.id;
        const outcome = outcomeFor(car);
        if (outcome.type === 'blocked') {
          state.note = car.label + THEME.blockedCopy;
          render();
          return;
        }
        state.moves += 1;
        if (outcome.type === 'slide') {
          car.row = outcome.row;
          car.col = outcome.col;
          state.note = car.label + THEME.moveCopy;
        } else {
          car.active = false;
          state.escaped += 1;
          state.note = car.label + THEME.exitCopy;
        }
        if (!activeCars().length) {
          state.mode = 'won';
          state.note = THEME.winCopy;
        }
        render();
      }
      function drawBoard() {
        const gradient = ctx.createLinearGradient(0, 0, 0, 560);
        gradient.addColorStop(0, THEME.bgTop);
        gradient.addColorStop(1, THEME.bgBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(${JSON.stringify(config.title)}, 24, 38);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.topCopy, 24, 58);
        const boardW = LEVEL.cols * LEVEL.cell;
        const boardH = LEVEL.rows * LEVEL.cell;
        ctx.fillStyle = THEME.lotFill;
        ctx.strokeStyle = THEME.lotLine;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(LEVEL.boardX - 10, LEVEL.boardY - 10, boardW + 20, boardH + 20, 28);
        ctx.fill();
        ctx.stroke();
        for (let row = 0; row < LEVEL.rows; row += 1) {
          for (let col = 0; col < LEVEL.cols; col += 1) {
            const x = LEVEL.boardX + col * LEVEL.cell;
            const y = LEVEL.boardY + row * LEVEL.cell;
            ctx.fillStyle = THEME.slotFill;
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 4, LEVEL.cell - 8, LEVEL.cell - 8, 12);
            ctx.fill();
          }
        }
        LEVEL.exits.forEach((exit) => {
          const gradient = ctx.createLinearGradient(exit.x1, exit.y1, exit.x2, exit.y2);
          gradient.addColorStop(0, 'rgba(255,255,255,0)');
          gradient.addColorStop(1, THEME.exitGlow);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.moveTo(exit.x1, exit.y1);
          ctx.lineTo(exit.x2, exit.y2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.78)';
          ctx.font = '800 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(THEME.exitLabel, exit.lx, exit.ly);
        });
        ctx.fillStyle = 'rgba(255,255,255,.62)';
        ctx.font = '800 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(THEME.boardLabel, LEVEL.boardX - 2, LEVEL.boardY - 18);
      }
      function drawCar(car) {
        const rect = carRect(car);
        const meta = THEME.colors[car.color];
        const selected = state.selectedId === car.id;
        ctx.save();
        ctx.translate(rect.x, rect.y);
        ctx.fillStyle = meta.fill;
        ctx.strokeStyle = selected ? '#ffffff' : meta.edge;
        ctx.lineWidth = selected ? 3.5 : 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, rect.w, rect.h, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.22)';
        if (car.axis === 'h') {
          ctx.fillRect(12, 8, rect.w - 24, 12);
          ctx.fillRect(12, rect.h - 20, rect.w - 24, 8);
        } else {
          ctx.fillRect(8, 12, 12, rect.h - 24);
          ctx.fillRect(rect.w - 20, 12, 8, rect.h - 24);
        }
        ctx.fillStyle = '#071018';
        ctx.font = '900 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(DIRS[car.dir].arrow, rect.w / 2, rect.h / 2 + 6);
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 10px sans-serif';
        ctx.fillText(car.label, rect.w / 2, rect.h / 2 - 12);
        ctx.restore();
      }
      function render() {
        drawBoard();
        activeCars().forEach(drawCar);
        if (state.mode === 'won') {
          ctx.fillStyle = 'rgba(6,10,18,.74)';
          ctx.fillRect(34, 198, 322, 108);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('整场通车', 195, 240);
          ctx.font = '700 14px sans-serif';
          ctx.fillText(state.note, 195, 268);
        }
        document.getElementById('moveText').textContent = THEME.movesLabel + ' ' + state.moves;
        document.getElementById('leftText').textContent = THEME.leftLabel + ' ' + activeCars().length;
        document.getElementById('statusText').textContent = state.note;
      }
      canvas.addEventListener('pointerdown', (event) => {
        actOnCar(carFromPoint(pointFromEvent(event)));
      });
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => render();
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with a 6x6 parking lot grid',
        mode: state.mode,
        moves: state.moves,
        escaped: state.escaped,
        remaining: activeCars().length,
        cars: activeCars().map((car) => ({ id: car.id, row: car.row, col: car.col, len: car.len, axis: car.axis, dir: car.dir, next: outcomeFor(car).type })),
      });
    `,
  };
}

const parkingJamBaseGame = createParkingJamGame({
  id: 'parking-jam-fake',
  file: 'parking-jam-fake.html',
  title: '停车场解堵局',
  sourceGame: 'Parking Jam 3D 式停车场解堵',
  accent: '#7edcff',
  summary: '点车让它沿车头方向滑到尽头或直接出库，先清挡路车，再把整面停车场慢慢疏通。',
  buttonCopy: '重开这层车位',
  topCopy: 'Parking Jam 热门复刻 · 点车沿车头方向滑出通道',
  hint: '先送走出口边的短车，给后排长车腾道；每辆车只会沿车头方向往前滑。',
  moveCopy: ' 先往前蹭出了一截车位。',
  blockedCopy: ' 车头前还堵着，先挪开挡路车。',
  exitCopy: ' 已经顺着出口开出去了。',
  winCopy: '整面停车场已经被你疏通干净了。',
  movesLabel: '挪车',
  leftLabel: '待出',
  boardLabel: '车位区',
  exitLabel: '出口',
  bgTop: '#0d2030',
  bgBottom: '#08121a',
  lotFill: '#172838',
  lotLine: '#40627e',
  slotFill: 'rgba(255,255,255,.06)',
  exitGlow: 'rgba(126,220,255,.86)',
  colors: {
    coral: { fill: '#ff8f8f', edge: '#ffd4d4' },
    cyan: { fill: '#78dfff', edge: '#d7f5ff' },
    amber: { fill: '#ffc96f', edge: '#ffebbe' },
    lime: { fill: '#a9e46d', edge: '#e8ffcf' },
    violet: { fill: '#c9b2ff', edge: '#efe6ff' },
    pink: { fill: '#ff9bc2', edge: '#ffe1ef' },
  },
  level: {
    rows: 6,
    cols: 6,
    cell: 46,
    boardX: 57,
    boardY: 128,
    cars: [
      { id: 0, row: 0, col: 0, len: 2, axis: 'h', dir: 'right', color: 'coral', label: 'A1' },
      { id: 1, row: 0, col: 3, len: 2, axis: 'v', dir: 'down', color: 'cyan', label: 'B2' },
      { id: 2, row: 1, col: 1, len: 3, axis: 'h', dir: 'right', color: 'amber', label: 'C3' },
      { id: 3, row: 1, col: 5, len: 2, axis: 'v', dir: 'down', color: 'pink', label: 'D4' },
      { id: 4, row: 2, col: 0, len: 2, axis: 'v', dir: 'up', color: 'lime', label: 'E5' },
      { id: 5, row: 2, col: 2, len: 2, axis: 'h', dir: 'right', color: 'violet', label: 'F6' },
      { id: 6, row: 3, col: 1, len: 3, axis: 'v', dir: 'down', color: 'coral', label: 'G7' },
      { id: 7, row: 3, col: 3, len: 2, axis: 'h', dir: 'left', color: 'cyan', label: 'H8' },
      { id: 8, row: 4, col: 4, len: 2, axis: 'v', dir: 'down', color: 'amber', label: 'J9' },
      { id: 9, row: 5, col: 2, len: 2, axis: 'h', dir: 'left', color: 'lime', label: 'K1' },
    ],
    exits: [
      { x1: 57, y1: 243, x2: 39, y2: 243, lx: 30, ly: 247 },
      { x1: 333, y1: 335, x2: 351, y2: 335, lx: 360, ly: 339 },
      { x1: 218, y1: 404, x2: 218, y2: 426, lx: 218, ly: 440 },
    ],
  },
});

const parkingJamOfficeRemixGame = createParkingJamGame({
  id: 'overtime-carpool-jam',
  file: 'overtime-carpool-jam.html',
  title: '下班拼车出库',
  sourceGame: '停车场解堵局 Remix',
  accent: '#9be9d4',
  summary: '把普通车位改成夜班园区拼车口：先放走门口短车，再把后排长车一台台挪出园区。',
  buttonCopy: '重开这一层',
  topCopy: '办公室二创 · 点亮车头，把下班拼车一台台挪出库',
  hint: '先让出口旁的小车先走，后排大车才有路；每台车都只会顺着自己的车头往前开。',
  moveCopy: ' 已经往前蹭出一个车位。',
  blockedCopy: ' 车头前还压着别的班车，先处理前排。',
  exitCopy: ' 已经从园区口顺利出库。',
  winCopy: '这一层下班拼车已经全部放完了。',
  movesLabel: '放车',
  leftLabel: '待放',
  boardLabel: '园区车位',
  exitLabel: '闸口',
  bgTop: '#091c20',
  bgBottom: '#051012',
  lotFill: '#103033',
  lotLine: '#3f726d',
  slotFill: 'rgba(255,255,255,.05)',
  exitGlow: 'rgba(155,233,212,.88)',
  colors: {
    coral: { fill: '#ff9b92', edge: '#ffd8d3' },
    cyan: { fill: '#85e4f2', edge: '#ddfdff' },
    amber: { fill: '#ffd084', edge: '#fff0ce' },
    lime: { fill: '#b4ea86', edge: '#edffd8' },
    violet: { fill: '#d0bcff', edge: '#f1e9ff' },
    pink: { fill: '#ffadc8', edge: '#ffe7ef' },
  },
  level: {
    rows: 6,
    cols: 6,
    cell: 46,
    boardX: 57,
    boardY: 128,
    cars: [
      { id: 0, row: 0, col: 1, len: 2, axis: 'h', dir: 'right', color: 'coral', label: '研组' },
      { id: 1, row: 0, col: 4, len: 2, axis: 'v', dir: 'down', color: 'cyan', label: '包组' },
      { id: 2, row: 1, col: 0, len: 3, axis: 'v', dir: 'up', color: 'amber', label: '客组' },
      { id: 3, row: 1, col: 2, len: 2, axis: 'h', dir: 'right', color: 'violet', label: '运组' },
      { id: 4, row: 2, col: 3, len: 3, axis: 'v', dir: 'down', color: 'lime', label: '仓组' },
      { id: 5, row: 2, col: 5, len: 2, axis: 'v', dir: 'down', color: 'pink', label: '法组' },
      { id: 6, row: 3, col: 1, len: 2, axis: 'h', dir: 'left', color: 'coral', label: '研组' },
      { id: 7, row: 4, col: 0, len: 2, axis: 'h', dir: 'left', color: 'cyan', label: '包组' },
      { id: 8, row: 4, col: 4, len: 2, axis: 'h', dir: 'right', color: 'amber', label: '客组' },
      { id: 9, row: 5, col: 2, len: 2, axis: 'h', dir: 'left', color: 'pink', label: '法组' },
    ],
    exits: [
      { x1: 57, y1: 335, x2: 39, y2: 335, lx: 30, ly: 339 },
      { x1: 333, y1: 243, x2: 351, y2: 243, lx: 360, ly: 247 },
      { x1: 241, y1: 404, x2: 241, y2: 426, lx: 241, ly: 440 },
    ],
  },
});

const trafficBoltJamBaseGame = createParkingJamGame({
  id: 'traffic-bolt-jam',
  file: 'traffic-bolt-jam.html',
  title: '挪车打螺丝',
  sourceGame: '挪车打螺丝 / Parking Jam 式停车解堵',
  accent: '#8be7ff',
  summary: '沿着车头方向一点点挪开堵路车，把卡在厂区出钉通道里的车队整层疏通。',
  buttonCopy: '重开这层通道',
  topCopy: '今日热词复刻 · 先挪门口短车，再放后排长车穿过出钉口',
  hint: '出口附近的小车先走，给后排长车和竖停车让路；每台车都只会顺着自己的车头往前开。',
  moveCopy: ' 已经往前蹭出一段通道。',
  blockedCopy: ' 车头前还压着别的车，先挪开挡路位。',
  exitCopy: ' 已经顺着出钉口滑出去了。',
  winCopy: '这一层挪车打钉通道已经被你彻底疏通了。',
  movesLabel: '挪车',
  leftLabel: '待走',
  boardLabel: '厂区车道',
  exitLabel: '出钉口',
  bgTop: '#0a1f2c',
  bgBottom: '#050d14',
  lotFill: '#153043',
  lotLine: '#4e7891',
  slotFill: 'rgba(255,255,255,.05)',
  exitGlow: 'rgba(139,231,255,.88)',
  colors: {
    coral: { fill: '#ff9d87', edge: '#ffd9cf' },
    cyan: { fill: '#7ce0ff', edge: '#dbf7ff' },
    amber: { fill: '#ffc970', edge: '#ffeec2' },
    lime: { fill: '#afe478', edge: '#ecffd5' },
    violet: { fill: '#cdb6ff', edge: '#f2ebff' },
    pink: { fill: '#ff9ec8', edge: '#ffe3ef' },
  },
  level: {
    rows: 6,
    cols: 6,
    cell: 46,
    boardX: 57,
    boardY: 128,
    cars: [
      { id: 0, row: 0, col: 0, len: 2, axis: 'h', dir: 'right', color: 'coral', label: '钉A' },
      { id: 1, row: 0, col: 4, len: 2, axis: 'v', dir: 'down', color: 'cyan', label: '箱B' },
      { id: 2, row: 1, col: 1, len: 3, axis: 'h', dir: 'right', color: 'amber', label: '钉C' },
      { id: 3, row: 1, col: 5, len: 2, axis: 'v', dir: 'down', color: 'pink', label: '栈D' },
      { id: 4, row: 2, col: 0, len: 2, axis: 'v', dir: 'up', color: 'lime', label: '盒E' },
      { id: 5, row: 2, col: 2, len: 2, axis: 'h', dir: 'right', color: 'violet', label: '钉F' },
      { id: 6, row: 3, col: 1, len: 3, axis: 'v', dir: 'down', color: 'coral', label: '箱G' },
      { id: 7, row: 3, col: 4, len: 2, axis: 'v', dir: 'down', color: 'cyan', label: '钉H' },
      { id: 8, row: 4, col: 2, len: 2, axis: 'h', dir: 'left', color: 'amber', label: '栈J' },
      { id: 9, row: 5, col: 0, len: 2, axis: 'h', dir: 'right', color: 'lime', label: '盒K' },
    ],
    exits: [
      { x1: 57, y1: 243, x2: 39, y2: 243, lx: 30, ly: 247 },
      { x1: 333, y1: 335, x2: 351, y2: 335, lx: 360, ly: 339 },
      { x1: 241, y1: 404, x2: 241, y2: 426, lx: 241, ly: 440 },
    ],
  },
});

const factoryBoltJamRemixGame = createParkingJamGame({
  id: 'factory-bolt-jam',
  file: 'factory-bolt-jam.html',
  title: '夜班进厂通车',
  sourceGame: '挪车打螺丝 Remix',
  accent: '#9ce8c4',
  summary: '把热词盘改成夜班进厂主题：先腾开闸口小车，再把后排班车一辆辆送进厂门。',
  buttonCopy: '重开这一班',
  topCopy: '进厂二创 · 点亮车头，把堵在厂门前的班车一台台放进去',
  hint: '先处理闸口边的小车，后排长车才有路；每台车都只会顺着自己的车头往前滑。',
  moveCopy: ' 已经往前挪出一格厂门通道。',
  blockedCopy: ' 厂门前还堵着别的班车，先挪前排。',
  exitCopy: ' 已经顺着闸口开进去了。',
  winCopy: '这一班车已经全部顺进厂门了。',
  movesLabel: '进车',
  leftLabel: '待进',
  boardLabel: '厂门车道',
  exitLabel: '闸口',
  bgTop: '#081b1d',
  bgBottom: '#041012',
  lotFill: '#123033',
  lotLine: '#4d7c72',
  slotFill: 'rgba(255,255,255,.05)',
  exitGlow: 'rgba(156,232,196,.9)',
  colors: {
    coral: { fill: '#ff9e8d', edge: '#ffddd6' },
    cyan: { fill: '#83def0', edge: '#dbfbff' },
    amber: { fill: '#ffd088', edge: '#fff1d3' },
    lime: { fill: '#b6e88d', edge: '#efffde' },
    violet: { fill: '#cfbeff', edge: '#f4edff' },
    pink: { fill: '#ffabc7', edge: '#ffe6ef' },
  },
  level: {
    rows: 6,
    cols: 6,
    cell: 46,
    boardX: 57,
    boardY: 128,
    cars: [
      { id: 0, row: 0, col: 1, len: 2, axis: 'h', dir: 'right', color: 'coral', label: '夜A' },
      { id: 1, row: 0, col: 4, len: 2, axis: 'v', dir: 'down', color: 'cyan', label: '包B' },
      { id: 2, row: 1, col: 0, len: 3, axis: 'v', dir: 'up', color: 'amber', label: '仓C' },
      { id: 3, row: 1, col: 2, len: 2, axis: 'h', dir: 'right', color: 'pink', label: '研D' },
      { id: 4, row: 2, col: 4, len: 2, axis: 'v', dir: 'down', color: 'lime', label: '客E' },
      { id: 5, row: 3, col: 1, len: 3, axis: 'h', dir: 'left', color: 'violet', label: '夜F' },
      { id: 6, row: 3, col: 5, len: 2, axis: 'v', dir: 'down', color: 'coral', label: '厂G' },
      { id: 7, row: 4, col: 2, len: 2, axis: 'h', dir: 'left', color: 'cyan', label: '包H' },
      { id: 8, row: 4, col: 0, len: 2, axis: 'v', dir: 'up', color: 'amber', label: '仓J' },
      { id: 9, row: 5, col: 3, len: 2, axis: 'h', dir: 'right', color: 'lime', label: '客K' },
    ],
    exits: [
      { x1: 57, y1: 197, x2: 39, y2: 197, lx: 30, ly: 201 },
      { x1: 333, y1: 381, x2: 351, y2: 381, lx: 360, ly: 385 },
      { x1: 195, y1: 404, x2: 195, y2: 426, lx: 195, ly: 440 },
    ],
  },
});

function createHexaSortGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    hint: config.hint,
    winCopy: config.winCopy,
    moveCopy: config.moveCopy,
    blockedCopy: config.blockedCopy,
    clearCopy: config.clearCopy,
    buttonCopy: config.buttonCopy,
    deckLabel: config.deckLabel,
    colors: config.colors,
    bgTop: config.bgTop,
    bgBottom: config.bgBottom,
    boardFill: config.boardFill,
    boardEdge: config.boardEdge,
    slotFill: config.slotFill,
    shadow: config.shadow,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '六角分拣',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="goalText"></b><span id="moveText"></span></div>
        <p id="statusText">${theme.hint}</p>
        <button class="primary" id="resetBtn">${theme.buttonCopy}</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const THEME = ${JSON.stringify(theme)};
      const LEVEL = ${JSON.stringify(config.level)};
      const CAPACITY = LEVEL.capacity;
      const SLOT_POINTS = LEVEL.slots;
      const state = { columns: [], selected: -1, moves: 0, cleared: [], mode: 'playing', note: THEME.hint, pulse: 0 };
      function cloneColumns() {
        return LEVEL.columns.map((column) => column.slice());
      }
      function topColor(index) {
        const column = state.columns[index];
        return column.length ? column[column.length - 1] : null;
      }
      function contiguousTopCount(index) {
        const column = state.columns[index];
        if (!column.length) return 0;
        const color = column[column.length - 1];
        let count = 1;
        for (let i = column.length - 2; i >= 0; i -= 1) {
          if (column[i] !== color) break;
          count += 1;
        }
        return count;
      }
      function isUniform(column) {
        return column.length === CAPACITY && column.every((color) => color === column[0]);
      }
      function checkClear(index) {
        const column = state.columns[index];
        if (!isUniform(column)) return false;
        const color = column[0];
        state.columns[index] = [];
        state.cleared.push(color);
        const meta = THEME.colors[color];
        state.note = meta.label + THEME.clearCopy;
        state.pulse = 1;
        return true;
      }
      function reset() {
        state.columns = cloneColumns();
        state.selected = -1;
        state.moves = 0;
        state.cleared = [];
        state.mode = 'playing';
        state.note = THEME.hint;
        state.pulse = 0;
        render();
      }
      function won() {
        return state.columns.every((column) => column.length === 0);
      }
      function canMove(from, to) {
        if (from === to || from < 0 || to < 0) return false;
        const source = state.columns[from];
        const target = state.columns[to];
        if (!source.length || target.length >= CAPACITY) return false;
        const color = source[source.length - 1];
        if (target.length && target[target.length - 1] !== color) return false;
        return true;
      }
      function moveCount(from, to) {
        if (!canMove(from, to)) return 0;
        const available = CAPACITY - state.columns[to].length;
        return Math.min(contiguousTopCount(from), available);
      }
      function tryMove(from, to) {
        if (!canMove(from, to)) {
          state.note = THEME.blockedCopy;
          state.selected = to;
          render();
          return false;
        }
        const count = moveCount(from, to);
        if (!count) return false;
        const source = state.columns[from];
        const target = state.columns[to];
        const moved = source.splice(source.length - count, count);
        target.push(...moved);
        state.moves += 1;
        const meta = THEME.colors[moved[0]];
        state.note = meta.label + THEME.moveCopy;
        state.selected = -1;
        checkClear(to);
        if (won()) {
          state.mode = 'won';
          state.note = THEME.winCopy;
        }
        render();
        return true;
      }
      function handleSlot(index) {
        if (state.mode !== 'playing') return;
        if (state.selected === -1) {
          if (!state.columns[index].length) return;
          state.selected = index;
          const meta = THEME.colors[topColor(index)];
          state.note = THEME.deckLabel + meta.label;
          render();
          return;
        }
        if (state.selected === index) {
          state.selected = -1;
          state.note = THEME.hint;
          render();
          return;
        }
        tryMove(state.selected, index);
      }
      function pointFromEvent(event) {
        const box = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - box.left) * canvas.width / box.width,
          y: (event.clientY - box.top) * canvas.height / box.height,
        };
      }
      function slotFromPoint(point) {
        return SLOT_POINTS.findIndex((slot) => Math.hypot(point.x - slot.x, point.y - slot.y) <= 42);
      }
      function drawHex(x, y, fill, stroke, label, selected, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(x, y - 18);
        ctx.lineTo(x + 16, y - 9);
        ctx.lineTo(x + 16, y + 9);
        ctx.lineTo(x, y + 18);
        ctx.lineTo(x - 16, y + 9);
        ctx.lineTo(x - 16, y - 9);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = selected ? '#ffffff' : stroke;
        ctx.lineWidth = selected ? 3 : 2;
        ctx.stroke();
        ctx.fillStyle = '#081017';
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 4);
        ctx.restore();
      }
      function drawBoard() {
        const gradient = ctx.createLinearGradient(0, 0, 0, 560);
        gradient.addColorStop(0, THEME.bgTop);
        gradient.addColorStop(1, THEME.bgBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 21px sans-serif';
        ctx.fillText(${JSON.stringify(config.title)}, 24, 38);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.subheading, 24, 58);
        ctx.fillStyle = THEME.boardFill;
        ctx.strokeStyle = THEME.boardEdge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(26, 84, 338, 360, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        for (let i = 0; i < SLOT_POINTS.length; i += 1) {
          const slot = SLOT_POINTS[i];
          ctx.beginPath();
          ctx.arc(slot.x, slot.y + 10, 28, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      function drawColumns() {
        SLOT_POINTS.forEach((slot, index) => {
          ctx.fillStyle = THEME.slotFill;
          ctx.beginPath();
          ctx.roundRect(slot.x - 24, slot.y + 8, 48, 108, 18);
          ctx.fill();
          ctx.fillStyle = THEME.shadow;
          ctx.beginPath();
          ctx.ellipse(slot.x, slot.y + 110, 24, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          const column = state.columns[index];
          column.forEach((color, depth) => {
            const meta = THEME.colors[color];
            const raised = state.selected === index ? 8 + state.pulse * 3 : 0;
            drawHex(
              slot.x,
              slot.y + 90 - depth * 24 - raised,
              meta.fill,
              meta.edge,
              meta.glyph,
              state.selected === index && depth === column.length - 1,
              1
            );
          });
          ctx.fillStyle = 'rgba(255,255,255,.62)';
          ctx.font = '800 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(index + 1), slot.x, slot.y + 136);
        });
        ctx.textAlign = 'left';
      }
      function render() {
        state.pulse = Math.max(0, state.pulse - 0.08);
        drawBoard();
        drawColumns();
        if (state.mode === 'won') {
          ctx.fillStyle = 'rgba(5,8,14,.72)';
          ctx.fillRect(42, 202, 306, 92);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('全部归并', 195, 238);
          ctx.font = '700 14px sans-serif';
          ctx.fillText(state.note, 195, 264);
          ctx.textAlign = 'left';
        }
        document.getElementById('goalText').textContent = '已清 ' + state.cleared.length + ' / ' + LEVEL.targetClears;
        document.getElementById('moveText').textContent = '步数 ' + state.moves;
        document.getElementById('statusText').textContent = state.note;
      }
      canvas.addEventListener('pointerdown', (event) => {
        const index = slotFromPoint(pointFromEvent(event));
        if (index >= 0) handleSlot(index);
      });
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => render();
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with honeycomb stack board',
        mode: state.mode,
        selected: state.selected,
        moves: state.moves,
        cleared: state.cleared,
        columns: state.columns,
        top: state.columns.map((column) => column.length ? column[column.length - 1] : null),
        capacity: CAPACITY,
      });
    `,
  };
}

const hexaSortLevel = {
  capacity: 4,
  targetClears: 5,
  slots: [
    { x: 110, y: 138 },
    { x: 195, y: 138 },
    { x: 280, y: 138 },
    { x: 68, y: 266 },
    { x: 153, y: 266 },
    { x: 238, y: 266 },
    { x: 323, y: 266 },
  ],
  columns: [
    ['cyan', 'pink', 'amber', 'cyan'],
    ['lime', 'violet', 'amber', 'pink'],
    ['violet', 'lime', 'cyan', 'amber'],
    ['pink', 'amber', 'lime', 'violet'],
    ['cyan', 'lime', 'pink', 'violet'],
    [],
    [],
  ],
};

const hexaSortBaseGame = createHexaSortGame({
  id: 'hexa-sort-fake',
  file: 'hexa-sort-fake.html',
  title: '六角叠色局',
  sourceGame: 'Hexa Sort 式六角堆叠分色消层',
  accent: '#7cf0ff',
  summary: '点列子把顶层同色六角块倒去空列或同色列，凑满整列就整柱清空。',
  heading: 'Hexa Sort 热门复刻',
  subheading: '六角堆叠排序 · 只搬运顶层连续同色块 · 满列即清空',
  hint: '先点一列，再点空列或同色顶层列；顶层连续同色会整段一起搬过去。',
  winCopy: '整块六角盘已经整理干净了。',
  moveCopy: ' 顺着槽位并过去了。',
  blockedCopy: '目标列不匹配，必须倒进空列或同色顶层列。',
  clearCopy: ' 凑满一整柱，已经整列消掉。',
  buttonCopy: '重开这盘',
  deckLabel: '已选 ',
  bgTop: '#081726',
  bgBottom: '#040c14',
  boardFill: '#102536',
  boardEdge: 'rgba(219,246,255,.78)',
  slotFill: 'rgba(255,255,255,.08)',
  shadow: 'rgba(0,0,0,.32)',
  colors: {
    cyan: { fill: '#7feeff', edge: '#ddfbff', glyph: '青', label: '青块' },
    pink: { fill: '#ff9ec7', edge: '#ffe0ef', glyph: '粉', label: '粉块' },
    amber: { fill: '#ffd36b', edge: '#fff0c2', glyph: '黄', label: '黄块' },
    lime: { fill: '#b5f574', edge: '#e7ffd0', glyph: '绿', label: '绿块' },
    violet: { fill: '#c8b2ff', edge: '#efe5ff', glyph: '紫', label: '紫块' },
  },
  level: hexaSortLevel,
});

const hexaSortOfficeRemixGame = createHexaSortGame({
  id: 'office-badge-stack',
  file: 'office-badge-stack.html',
  title: '工牌六角归档',
  sourceGame: '六角叠色局 Remix',
  accent: '#9ff0d1',
  summary: '把六角色块改成部门工牌：先给空槽腾位，再把同部门牌叠满一柱整批归档。',
  heading: '办公室六角归档',
  subheading: '工牌分栏二创 · 顶层连续同部门整段搬运 · 满列整批收走',
  hint: '先选一列工牌，再点空列或同部门顶牌列；同部门连在一起会整段搬走。',
  winCopy: '所有部门工牌都已经归档完了。',
  moveCopy: ' 已经整段挪去那一栏。',
  blockedCopy: '归档栏不匹配，只能挪到空栏或同部门顶牌栏。',
  clearCopy: ' 叠满一整栏，已经整批归档。',
  buttonCopy: '重开这一栏',
  deckLabel: '锁定 ',
  bgTop: '#0a1b1b',
  bgBottom: '#051010',
  boardFill: '#10302d',
  boardEdge: 'rgba(220,255,247,.78)',
  slotFill: 'rgba(255,255,255,.08)',
  shadow: 'rgba(0,0,0,.34)',
  colors: {
    cyan: { fill: '#88efe8', edge: '#e2fffc', glyph: '产', label: '产品牌' },
    pink: { fill: '#ffadbc', edge: '#ffe4eb', glyph: '市', label: '市场牌' },
    amber: { fill: '#ffd486', edge: '#fff1cf', glyph: '运', label: '运营牌' },
    lime: { fill: '#b8f08d', edge: '#ecffd7', glyph: '技', label: '技术牌' },
    violet: { fill: '#cfbdff', edge: '#f2eaff', glyph: '客', label: '客服牌' },
  },
  level: hexaSortLevel,
});

function createTripleMatchGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    hint: config.hint,
    trayLabel: config.trayLabel,
    winCopy: config.winCopy,
    loseCopy: config.loseCopy,
    clearCopy: config.clearCopy,
    blockedCopy: config.blockedCopy,
    buttonCopy: config.buttonCopy,
    timerLabel: config.timerLabel,
    targetLabel: config.targetLabel,
    boardTop: config.boardTop,
    boardBottom: config.boardBottom,
    pileGlow: config.pileGlow,
    trayGlow: config.trayGlow,
    chipBg: config.chipBg,
    chipEdge: config.chipEdge,
    types: config.types,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '三连清堆物',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    markup: `
      <section class="panel compact">
        <div class="row"><b id="goalText"></b><span id="timeText"></span></div>
        <p id="statusText">${theme.hint}</p>
      </section>
      <section class="panel compact triple-playfield">
        <div class="triple-targets" id="targetGrid"></div>
        <div class="triple-board" id="tripleBoard" aria-label="堆物盘面"></div>
        <div class="triple-tray-head"><b>${theme.trayLabel}</b><span id="trayCountText"></span></div>
        <div class="triple-tray" id="tray"></div>
      </section>
      <button class="primary" id="resetBtn">${theme.buttonCopy}</button>
    `,
    script: `
      const THEME = ${JSON.stringify(theme)};
      const LEVEL = ${JSON.stringify(config.level)};
      const board = document.getElementById('tripleBoard');
      const targetGrid = document.getElementById('targetGrid');
      const trayEl = document.getElementById('tray');
      board.style.setProperty('--board-top', THEME.boardTop);
      board.style.setProperty('--board-bottom', THEME.boardBottom);
      board.style.setProperty('--pile-glow', THEME.pileGlow);
      trayEl.style.setProperty('--tray-glow', THEME.trayGlow);
      const goalText = document.getElementById('goalText');
      const timeText = document.getElementById('timeText');
      const trayCountText = document.getElementById('trayCountText');
      const statusText = document.getElementById('statusText');
      const state = { items: [], tray: [], remaining: {}, mode: 'playing', note: THEME.hint, matched: 0, timeLeft: LEVEL.timeLimit, lastStamp: 0, raf: 0 };
      function cloneItems() {
        return LEVEL.items.map((item, index) => ({ ...item, id: index, active: true }));
      }
      function buildRemaining() {
        const counts = {};
        Object.keys(THEME.types).forEach((key) => { counts[key] = 0; });
        LEVEL.items.forEach((item) => { counts[item.type] += 1; });
        return counts;
      }
      function overlap(a, b) {
        return Math.abs(a.x - b.x) < 58 && Math.abs(a.y - b.y) < 52;
      }
      function exposed(item) {
        if (!item.active) return false;
        return !state.items.some((other) => other.active && other.layer > item.layer && overlap(item, other));
      }
      function formatTime(value) {
        return value.toFixed(1).replace(/\\.0$/, '') + 's';
      }
      function reset() {
        state.items = cloneItems();
        state.tray = [];
        state.remaining = buildRemaining();
        state.mode = 'playing';
        state.note = THEME.hint;
        state.matched = 0;
        state.timeLeft = LEVEL.timeLimit;
        state.lastStamp = 0;
        if (state.raf) cancelAnimationFrame(state.raf);
        render();
        state.raf = requestAnimationFrame(loop);
      }
      function resolveTriples(type) {
        const hits = [];
        state.tray.forEach((entry, index) => {
          if (entry.type === type) hits.push(index);
        });
        if (hits.length < 3) return false;
        const removed = new Set(hits.slice(0, 3));
        state.tray = state.tray.filter((_, index) => !removed.has(index));
        state.remaining[type] = Math.max(0, state.remaining[type] - 3);
        state.matched += 3;
        state.note = THEME.types[type].label + THEME.clearCopy;
        if (state.matched >= LEVEL.items.length) {
          state.mode = 'won';
          state.note = THEME.winCopy;
        }
        return true;
      }
      function pick(id) {
        if (state.mode !== 'playing') return;
        const item = state.items.find((entry) => entry.id === id);
        if (!item) return;
        if (!exposed(item)) {
          state.note = THEME.blockedCopy;
          render();
          return;
        }
        item.active = false;
        state.tray.push({ type: item.type, id: item.id });
        resolveTriples(item.type);
        if (state.mode === 'playing' && state.tray.length >= LEVEL.traySize) {
          state.mode = 'lost';
          state.note = THEME.loseCopy;
        }
        render();
      }
      function step(ms) {
        if (state.mode !== 'playing') return;
        state.timeLeft = Math.max(0, state.timeLeft - ms / 1000);
        if (state.timeLeft <= 0) {
          state.mode = 'lost';
          state.note = THEME.timerLabel + '耗尽了。';
        }
      }
      function loop(stamp) {
        if (!state.lastStamp) state.lastStamp = stamp;
        const delta = stamp - state.lastStamp;
        state.lastStamp = stamp;
        step(delta);
        render();
        if (state.mode === 'playing') state.raf = requestAnimationFrame(loop);
      }
      function boardItemMarkup(item) {
        const meta = THEME.types[item.type];
        const top = exposed(item);
        const yShift = item.layer * 8;
        return '<button class="triple-item' + (top ? ' top' : ' locked') + '" type="button" data-id="' + item.id + '" style="left:' + item.x + 'px; top:' + (item.y - yShift) + 'px; z-index:' + (item.layer + 1) + ';">' +
          '<span class="triple-item-glyph" style="background:' + meta.fill + '; border-color:' + meta.edge + '; color:' + meta.ink + ';">' + meta.glyph + '</span>' +
          '<span class="triple-item-tag">' + meta.short + '</span>' +
        '</button>';
      }
      function renderTargets() {
        targetGrid.innerHTML = Object.entries(THEME.types).map(([key, meta]) => {
          const left = state.remaining[key];
          return '<span class="triple-chip" style="--chip-fill:' + meta.fill + '; --chip-edge:' + meta.edge + '; --chip-ink:' + meta.ink + ';"><b>' + meta.glyph + '</b><i>' + meta.short + '</i><u>' + left + '</u></span>';
        }).join('');
      }
      function renderBoard() {
        const active = state.items.filter((item) => item.active).sort((a, b) => a.layer - b.layer || a.id - b.id);
        board.innerHTML = active.map(boardItemMarkup).join('');
        board.querySelectorAll('[data-id]').forEach((node) => {
          node.addEventListener('click', () => pick(Number(node.dataset.id)));
        });
      }
      function renderTray() {
        const cells = [];
        for (let i = 0; i < LEVEL.traySize; i += 1) {
          const entry = state.tray[i];
          if (!entry) {
            cells.push('<span class="triple-slot empty"></span>');
            continue;
          }
          const meta = THEME.types[entry.type];
          cells.push('<span class="triple-slot filled" style="background:' + meta.fill + '; border-color:' + meta.edge + '; color:' + meta.ink + ';">' + meta.glyph + '</span>');
        }
        trayEl.innerHTML = cells.join('');
      }
      function render() {
        renderTargets();
        renderBoard();
        renderTray();
        goalText.textContent = THEME.targetLabel + ' ' + state.matched + ' / ' + LEVEL.items.length;
        timeText.textContent = THEME.timerLabel + ' ' + formatTime(state.timeLeft);
        trayCountText.textContent = state.tray.length + ' / ' + LEVEL.traySize;
        statusText.textContent = state.note;
        board.dataset.mode = state.mode;
      }
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = (ms = 0) => {
        step(ms);
        render();
      };
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'DOM pile board with layered absolute-positioned clutter',
        mode: state.mode,
        matched: state.matched,
        tray: state.tray.map((entry) => entry.type),
        remaining: state.remaining,
        time_left: Number(state.timeLeft.toFixed(2)),
        exposed: state.items.filter((item) => exposed(item)).map((item) => ({ id: item.id, type: item.type })),
        active_count: state.items.filter((item) => item.active).length,
      });
    `,
  };
}

const tripleMatchLevel = {
  traySize: 7,
  timeLimit: 75,
  items: [
    { type: 'toy', x: 78, y: 118, layer: 0 },
    { type: 'phone', x: 150, y: 126, layer: 0 },
    { type: 'snack', x: 226, y: 120, layer: 0 },
    { type: 'soap', x: 298, y: 132, layer: 0 },
    { type: 'cup', x: 112, y: 194, layer: 0 },
    { type: 'headset', x: 190, y: 192, layer: 0 },
    { type: 'toy', x: 270, y: 198, layer: 0 },
    { type: 'phone', x: 92, y: 258, layer: 1 },
    { type: 'snack', x: 166, y: 250, layer: 1 },
    { type: 'soap', x: 244, y: 258, layer: 1 },
    { type: 'cup', x: 312, y: 248, layer: 1 },
    { type: 'headset', x: 126, y: 314, layer: 1 },
    { type: 'toy', x: 208, y: 318, layer: 1 },
    { type: 'phone', x: 286, y: 312, layer: 1 },
    { type: 'snack', x: 148, y: 164, layer: 2 },
    { type: 'soap', x: 226, y: 172, layer: 2 },
    { type: 'cup', x: 184, y: 236, layer: 2 },
    { type: 'headset', x: 208, y: 110, layer: 3 },
  ],
};

const tripleMatchBaseGame = createTripleMatchGame({
  id: 'triple-match-fake',
  file: 'triple-match-fake.html',
  title: '杂物三连清',
  sourceGame: 'Triple Match 3D / Match Factory 式堆物三连消',
  accent: '#7dd6ff',
  summary: '从杂乱堆物里只点最上层可见物，送进七格托盘，凑成三件同类立刻清走。',
  heading: 'Triple Match 热门复刻',
  subheading: '堆物找三连 · 上层遮挡 · 七格托盘爆掉就输',
  hint: '只点当前露在最上层的东西；托盘里三件同类会立刻配成一组三连清掉。',
  trayLabel: '收纳托盘',
  winCopy: '这一堆杂物已经被你清干净了。',
  loseCopy: '托盘被杂物塞满，先整理出三连再继续。',
  clearCopy: ' 已经凑成三连清掉。',
  blockedCopy: '这件还压在别的杂物下面，得先把上层拿开。',
  buttonCopy: '重开这一堆',
  timerLabel: '倒计时',
  targetLabel: '已清',
  boardTop: '#0a1625',
  boardBottom: '#08101a',
  pileGlow: 'rgba(125,214,255,.18)',
  trayGlow: 'rgba(255,255,255,.08)',
  chipBg: 'rgba(255,255,255,.08)',
  chipEdge: 'rgba(255,255,255,.14)',
  types: {
    toy: { glyph: '熊', short: '玩具', label: '玩具熊', fill: '#ffb5ca', edge: '#ffe5ee', ink: '#3b0c1d' },
    phone: { glyph: '机', short: '手机', label: '手机壳', fill: '#89e6ff', edge: '#e4fbff', ink: '#082533' },
    snack: { glyph: '饼', short: '零食', label: '零食袋', fill: '#ffd67e', edge: '#fff1ca', ink: '#392100' },
    soap: { glyph: '泡', short: '清洁', label: '泡泡瓶', fill: '#c8b9ff', edge: '#f1eaff', ink: '#241241' },
    cup: { glyph: '杯', short: '杯子', label: '饮料杯', fill: '#9cf0c4', edge: '#e6ffef', ink: '#082d1e' },
    headset: { glyph: '机', short: '耳机', label: '头戴耳机', fill: '#ff9b8d', edge: '#ffe0da', ink: '#3a110d' },
  },
  level: tripleMatchLevel,
});

const tripleMatchOfficeRemixGame = createTripleMatchGame({
  id: 'desk-clutter-triples',
  file: 'desk-clutter-triples.html',
  title: '工位清台局',
  sourceGame: '杂物三连清 Remix',
  accent: '#92f0d9',
  summary: '把大众杂物改成工位杂件：只拿最上层可见工牌、鼠标、咖啡和便签，三件同类立刻归盒。',
  heading: '办公室清台二创',
  subheading: '桌面清理主题 · 露头先拿 · 七格暂存溢出就堵台',
  hint: '先把压在最上层的工位杂件拿走；同类凑三件就会立刻整盒归档。',
  trayLabel: '待归档盒',
  winCopy: '这一张工位桌面已经被你清台完成了。',
  loseCopy: '待归档盒爆满了，先凑出三件同类再继续。',
  clearCopy: ' 已经整盒归档。',
  blockedCopy: '这件工位杂件还被压着，得先清掉上面那层。',
  buttonCopy: '重开这张桌',
  timerLabel: '剩余',
  targetLabel: '已归档',
  boardTop: '#071917',
  boardBottom: '#05100f',
  pileGlow: 'rgba(146,240,217,.18)',
  trayGlow: 'rgba(255,255,255,.08)',
  chipBg: 'rgba(255,255,255,.08)',
  chipEdge: 'rgba(255,255,255,.14)',
  types: {
    toy: { glyph: '牌', short: '工牌', label: '工牌夹', fill: '#91efe6', edge: '#e8fffd', ink: '#072523' },
    phone: { glyph: '鼠', short: '鼠标', label: '鼠标', fill: '#ffd39c', edge: '#fff0da', ink: '#3b2103' },
    snack: { glyph: '签', short: '便签', label: '便签纸', fill: '#ffe989', edge: '#fff7d6', ink: '#423100' },
    soap: { glyph: '杯', short: '咖啡', label: '咖啡杯', fill: '#c9b7ff', edge: '#f1eaff', ink: '#241241' },
    cup: { glyph: '线', short: '充电线', label: '充电线', fill: '#9fe8b2', edge: '#ebfff0', ink: '#112a0f' },
    headset: { glyph: '夹', short: '长尾夹', label: '长尾夹', fill: '#ffb4c2', edge: '#ffe7ee', ink: '#38101f' },
  },
  level: tripleMatchLevel,
});

function createGoodsSortGame(config) {
  const theme = {
    heading: config.heading,
    subheading: config.subheading,
    hint: config.hint,
    trayLabel: config.trayLabel,
    winCopy: config.winCopy,
    loseCopy: config.loseCopy,
    clearCopy: config.clearCopy,
    targetLabel: config.targetLabel,
    shelfLabel: config.shelfLabel,
    buttonCopy: config.buttonCopy,
    shelves: config.shelves,
    laneGlow: config.laneGlow,
    trayGlow: config.trayGlow,
    types: config.types,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '货架三连',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    markup: `
      <section class="panel compact">
        <div class="row"><b id="goodsGoalText"></b><span id="goodsTrayText"></span></div>
        <p id="goodsStatusText">${theme.hint}</p>
      </section>
      <section class="panel compact">
        <div class="triple-targets goods-targets" id="goodsTargetGrid"></div>
        <div class="goods-shelves" id="goodsShelves"></div>
        <div class="triple-tray-head"><b>${theme.trayLabel}</b><span id="goodsShelfText"></span></div>
        <div class="triple-tray" id="goodsTray"></div>
      </section>
      <button class="primary" id="goodsResetBtn">${theme.buttonCopy}</button>
    `,
    script: `
      const THEME = ${JSON.stringify(theme)};
      const LEVEL = ${JSON.stringify(config.level)};
      const targetGrid = document.getElementById('goodsTargetGrid');
      const shelvesEl = document.getElementById('goodsShelves');
      const trayEl = document.getElementById('goodsTray');
      const goalText = document.getElementById('goodsGoalText');
      const trayText = document.getElementById('goodsTrayText');
      const shelfText = document.getElementById('goodsShelfText');
      const statusText = document.getElementById('goodsStatusText');
      const state = { lanes: [], tray: [], remaining: {}, mode: 'playing', note: THEME.hint, cleared: 0 };
      function cloneLanes() {
        return LEVEL.lanes.map((lane, index) => ({ id: index, shelf: lane.shelf, items: lane.items.slice() }));
      }
      function buildRemaining() {
        const counts = {};
        Object.keys(THEME.types).forEach((key) => { counts[key] = 0; });
        LEVEL.lanes.forEach((lane) => {
          lane.items.forEach((type) => { counts[type] += 1; });
        });
        return counts;
      }
      function resolveTriples(type) {
        const hits = [];
        state.tray.forEach((entry, index) => {
          if (entry.type === type) hits.push(index);
        });
        if (hits.length < 3) return false;
        const removed = new Set(hits.slice(0, 3));
        state.tray = state.tray.filter((_, index) => !removed.has(index));
        state.remaining[type] = Math.max(0, state.remaining[type] - 3);
        state.cleared += 3;
        state.note = THEME.types[type].label + THEME.clearCopy;
        if (state.cleared >= LEVEL.totalItems) {
          state.mode = 'won';
          state.note = THEME.winCopy;
        }
        return true;
      }
      function pick(laneId) {
        if (state.mode !== 'playing') return;
        const lane = state.lanes.find((entry) => entry.id === laneId);
        if (!lane || !lane.items.length) return;
        const type = lane.items.shift();
        state.tray.push({ type, laneId });
        resolveTriples(type);
        if (state.mode === 'playing' && state.tray.length >= LEVEL.traySize) {
          state.mode = 'lost';
          state.note = THEME.loseCopy;
        }
        render();
      }
      function reset() {
        state.lanes = cloneLanes();
        state.tray = [];
        state.remaining = buildRemaining();
        state.mode = 'playing';
        state.note = THEME.hint;
        state.cleared = 0;
        render();
      }
      function shelfMarkup(shelfIndex) {
        const lanes = state.lanes.filter((lane) => lane.shelf === shelfIndex);
        return '<section class="goods-shelf"><div class="goods-shelf-head"><b>' + THEME.shelfLabel + ' ' + (shelfIndex + 1) + '</b><span>' + lanes.filter((lane) => lane.items.length).length + ' / ' + lanes.length + '</span></div><div class="goods-lane-grid">' +
          lanes.map((lane) => {
            const front = lane.items[0];
            const meta = front ? THEME.types[front] : null;
            const backCount = Math.max(0, lane.items.length - 1);
            return '<button class="goods-lane' + (front ? '' : ' empty') + '" type="button" data-lane-id="' + lane.id + '" style="--lane-glow:' + (meta ? meta.fill : THEME.laneGlow) + ';">' +
              (front ? '<span class="goods-backdrop"></span><span class="goods-item" style="background:' + meta.fill + '; border-color:' + meta.edge + '; color:' + meta.ink + ';"><b>' + meta.glyph + '</b><i>' + meta.short + '</i></span><u>' + (backCount ? '后排 +' + backCount : '前排') + '</u>' : '<span class="goods-empty-copy">清空</span>') +
            '</button>';
          }).join('') +
        '</div></section>';
      }
      function renderTargets() {
        targetGrid.innerHTML = Object.entries(THEME.types).map(([key, meta]) => {
          return '<span class="triple-chip" style="--chip-fill:' + meta.fill + '; --chip-edge:' + meta.edge + '; --chip-ink:' + meta.ink + ';"><b>' + meta.glyph + '</b><i>' + meta.short + '</i><u>' + state.remaining[key] + '</u></span>';
        }).join('');
      }
      function renderShelves() {
        shelvesEl.innerHTML = THEME.shelves.map((_, shelfIndex) => shelfMarkup(shelfIndex)).join('');
        shelvesEl.querySelectorAll('[data-lane-id]').forEach((node) => {
          node.addEventListener('click', () => pick(Number(node.dataset.laneId)));
        });
      }
      function renderTray() {
        const cells = [];
        for (let i = 0; i < LEVEL.traySize; i += 1) {
          const entry = state.tray[i];
          if (!entry) {
            cells.push('<span class="triple-slot empty"></span>');
            continue;
          }
          const meta = THEME.types[entry.type];
          cells.push('<span class="triple-slot filled" style="background:' + meta.fill + '; border-color:' + meta.edge + '; color:' + meta.ink + ';">' + meta.glyph + '</span>');
        }
        trayEl.innerHTML = cells.join('');
      }
      function render() {
        renderTargets();
        renderShelves();
        renderTray();
        goalText.textContent = THEME.targetLabel + ' ' + state.cleared + ' / ' + LEVEL.totalItems;
        trayText.textContent = '暂存 ' + state.tray.length + ' / ' + LEVEL.traySize;
        shelfText.textContent = '剩余前排 ' + state.lanes.filter((lane) => lane.items.length).length;
        statusText.textContent = state.note;
        shelvesEl.dataset.mode = state.mode;
      }
      document.getElementById('goodsResetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'DOM shelves with front-item picking and 7-slot tray',
        mode: state.mode,
        cleared: state.cleared,
        tray: state.tray.map((entry) => entry.type),
        remaining: state.remaining,
        lanes: state.lanes.map((lane) => ({ shelf: lane.shelf, front: lane.items[0] || null, depth: lane.items.length })),
      });
    `,
  };
}

const goodsSortLevel = {
  traySize: 7,
  totalItems: 18,
  lanes: [
    { shelf: 0, items: ['cola', 'bread'] },
    { shelf: 0, items: ['cola', 'milk'] },
    { shelf: 0, items: ['cola', 'soap'] },
    { shelf: 1, items: ['bread', 'ramen'] },
    { shelf: 1, items: ['bread', 'chips'] },
    { shelf: 1, items: ['milk', 'ramen'] },
    { shelf: 2, items: ['milk', 'soap'] },
    { shelf: 2, items: ['soap', 'chips'] },
    { shelf: 2, items: ['ramen', 'chips'] },
  ],
};

const goodsSortBaseGame = createGoodsSortGame({
  id: 'goods-sort-fake',
  file: 'goods-sort-fake.html',
  title: '货架清货局',
  sourceGame: 'Goods Sort / 货架理货式前排取货三连清',
  accent: '#78e9ff',
  summary: '只点每条货道最前排的商品送进七格暂存，三件同类立刻清货，后排商品会往前露出。',
  heading: 'Goods Sort 热门复刻',
  subheading: '前排理货 · 七格暂存 · 同类三件立刻清掉',
  hint: '先拿每条货道最前排那件；同类凑三件会立刻整批清货，后排商品才会补到前面。',
  trayLabel: '收银暂存',
  winCopy: '整面货架已经被你清空了。',
  loseCopy: '暂存台塞满了，先凑出三件同类再继续。',
  clearCopy: ' 已经凑成三件清货。',
  targetLabel: '已清',
  shelfLabel: '货架',
  buttonCopy: '重开这面货架',
  shelves: ['饮料', '零食', '日用'],
  laneGlow: 'rgba(120,233,255,.18)',
  trayGlow: 'rgba(255,255,255,.08)',
  types: {
    cola: { glyph: '汽', short: '汽水', label: '汽水瓶', fill: '#8fe5ff', edge: '#ebfbff', ink: '#082634' },
    bread: { glyph: '包', short: '面包', label: '面包袋', fill: '#ffd08a', edge: '#fff0d6', ink: '#402300' },
    milk: { glyph: '奶', short: '牛奶', label: '牛奶盒', fill: '#f5f1ff', edge: '#ffffff', ink: '#34294b' },
    soap: { glyph: '皂', short: '香皂', label: '香皂盒', fill: '#c9bbff', edge: '#f1ebff', ink: '#24153f' },
    ramen: { glyph: '面', short: '泡面', label: '泡面杯', fill: '#ffb299', edge: '#ffe4db', ink: '#3d130c' },
    chips: { glyph: '片', short: '薯片', label: '薯片桶', fill: '#9ce7b0', edge: '#e7fff0', ink: '#10301c' },
  },
  level: goodsSortLevel,
});

const goodsSortOfficeRemixGame = createGoodsSortGame({
  id: 'office-snack-stock',
  file: 'office-snack-stock.html',
  title: '茶水间补货局',
  sourceGame: '货架清货局 Remix',
  accent: '#9df0d4',
  summary: '把超市货架换成办公室茶水间：前排先拿咖啡、饼干、杯面和酸奶，三件同类立刻整盒补走。',
  heading: '茶水间理货二创',
  subheading: '办公室零食柜 · 前排先取 · 三件同类整盒补货',
  hint: '先从每条茶水间货道的前排拿起；同类凑三件就会整盒补走，后排库存自然补位。',
  trayLabel: '补货暂存',
  winCopy: '这面茶水间柜已经被你理顺了。',
  loseCopy: '补货暂存台爆满了，先整走三件同类再继续。',
  clearCopy: ' 已经整盒补走。',
  targetLabel: '已补',
  shelfLabel: '柜层',
  buttonCopy: '重开这面柜',
  shelves: ['咖啡层', '零食层', '冷藏层'],
  laneGlow: 'rgba(157,240,212,.18)',
  trayGlow: 'rgba(255,255,255,.08)',
  types: {
    cola: { glyph: '啡', short: '咖啡', label: '冷萃咖啡', fill: '#9ae7df', edge: '#ebfffc', ink: '#082826' },
    bread: { glyph: '干', short: '饼干', label: '曲奇盒', fill: '#ffd89b', edge: '#fff3dd', ink: '#3c2505' },
    milk: { glyph: '奶', short: '酸奶', label: '酸奶杯', fill: '#f4f0ff', edge: '#ffffff', ink: '#34294b' },
    soap: { glyph: '茶', short: '茶包', label: '茶包盒', fill: '#cbbdff', edge: '#f3edff', ink: '#24153f' },
    ramen: { glyph: '面', short: '杯面', label: '杯面桶', fill: '#ffb9a0', edge: '#ffe6dd', ink: '#43160f' },
    chips: { glyph: '汽', short: '气泡水', label: '气泡水罐', fill: '#a5ecbf', edge: '#edfff2', ink: '#0f2f19' },
  },
  level: goodsSortLevel,
});

function createLoopSortGame(config) {
  const theme = {
    topCopy: config.topCopy,
    hint: config.hint,
    injectCopy: config.injectCopy,
    blockedCopy: config.blockedCopy,
    emptyCopy: config.emptyCopy,
    clearCopy: config.clearCopy,
    jamCopy: config.jamCopy,
    winCopy: config.winCopy,
    stepCopy: config.stepCopy,
    buttonCopy: config.buttonCopy,
    stepLabel: config.stepLabel,
    clearedLabel: config.clearedLabel,
    queueLabel: config.queueLabel,
    loopLabel: config.loopLabel,
    bgTop: config.bgTop,
    bgBottom: config.bgBottom,
    panelTint: config.panelTint,
    beltFill: config.beltFill,
    beltEdge: config.beltEdge,
    truckFill: config.truckFill,
    truckEdge: config.truckEdge,
    shadow: config.shadow,
    colors: config.colors,
    trucks: config.trucks,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '环带分拣',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="clearText"></b><span id="queueText"></span></div>
        <div class="tray" id="truckRack"></div>
        <p id="statusText">${theme.hint}</p>
        <div class="button-row">
          <button class="choice" id="stepBtn">${theme.stepLabel}</button>
          <button class="primary" id="resetBtn">${theme.buttonCopy}</button>
        </div>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const THEME = ${JSON.stringify(theme)};
      const LEVEL = ${JSON.stringify(config.level)};
      const BELT_POINTS = [
        { x: 126, y: 146 }, { x: 171, y: 146 }, { x: 216, y: 146 }, { x: 261, y: 146 },
        { x: 291, y: 191 }, { x: 291, y: 236 }, { x: 291, y: 281 },
        { x: 261, y: 326 }, { x: 216, y: 326 }, { x: 171, y: 326 }, { x: 126, y: 326 },
        { x: 96, y: 281 }, { x: 96, y: 236 }, { x: 96, y: 191 }
      ];
      const TRUCK_POINTS = [
        { x: 195, y: 76, w: 116, h: 42 },
        { x: 324, y: 236, w: 42, h: 116 },
        { x: 195, y: 396, w: 116, h: 42 },
        { x: 66, y: 236, w: 42, h: 116 }
      ];
      const state = { belt: [], trucks: [], cleared: 0, moves: 0, mode: 'playing', note: THEME.hint };
      function cloneTruck(truck) {
        return { id: truck.id, entry: truck.entry, queue: truck.queue.slice() };
      }
      function cloneLevel() {
        return {
          target: LEVEL.target,
          trucks: LEVEL.trucks.map(cloneTruck),
        };
      }
      function colorMeta(key) {
        return THEME.colors[key];
      }
      function hasQueue() {
        return state.trucks.some((truck) => truck.queue.length);
      }
      function beltFillCount() {
        return state.belt.filter(Boolean).length;
      }
      function checkWinOrJam() {
        if (!hasQueue() && beltFillCount() === 0) {
          state.mode = 'won';
          state.note = THEME.winCopy;
          return;
        }
        if (hasQueue() && beltFillCount() === BELT_POINTS.length) {
          state.mode = 'lost';
          state.note = THEME.jamCopy;
        }
      }
      function markMatches() {
        const filled = state.belt.map((cell) => cell && cell.color);
        const marks = new Set();
        let i = 0;
        while (i < filled.length) {
          if (!filled[i]) {
            i += 1;
            continue;
          }
          let j = i + 1;
          while (j < filled.length && filled[j] === filled[i]) j += 1;
          if (j - i >= 3) {
            for (let k = i; k < j; k += 1) marks.add(k);
          }
          i = j;
        }
        if (filled[0] && filled[filled.length - 1]) {
          let head = 0;
          while (head < filled.length && filled[head] === filled[0]) head += 1;
          let tail = filled.length - 1;
          while (tail >= 0 && filled[tail] === filled[0]) tail -= 1;
          const wrapCount = head + (filled.length - 1 - tail);
          if (wrapCount >= 3) {
            for (let k = 0; k < head; k += 1) marks.add(k);
            for (let k = tail + 1; k < filled.length; k += 1) marks.add(k);
          }
        }
        return marks;
      }
      function resolveMatches() {
        let clearedNow = 0;
        while (true) {
          const marks = markMatches();
          if (!marks.size) break;
          marks.forEach((index) => {
            if (state.belt[index]) {
              state.belt[index] = null;
              clearedNow += 1;
              state.cleared += 1;
            }
          });
        }
        if (clearedNow) state.note = THEME.clearCopy.replace('{count}', String(clearedNow));
        checkWinOrJam();
      }
      function reset() {
        const level = cloneLevel();
        state.belt = Array.from({ length: BELT_POINTS.length }, () => null);
        state.trucks = level.trucks;
        state.cleared = 0;
        state.moves = 0;
        state.mode = 'playing';
        state.note = THEME.hint;
        render();
      }
      function stepLoop() {
        if (state.mode !== 'playing') return;
        state.belt.unshift(state.belt.pop());
        state.note = THEME.stepCopy;
        resolveMatches();
        render();
      }
      function inject(index) {
        if (state.mode !== 'playing') return;
        const truck = state.trucks[index];
        if (!truck || !truck.queue.length) {
          state.note = THEME.emptyCopy;
          render();
          return;
        }
        if (state.belt[truck.entry]) {
          state.note = THEME.blockedCopy;
          render();
          return;
        }
        const color = truck.queue.shift();
        state.belt[truck.entry] = { color };
        state.moves += 1;
        state.note = colorMeta(color).label + THEME.injectCopy;
        resolveMatches();
        render();
      }
      function drawRounded(x, y, w, h, r, fill, stroke, lineWidth = 2) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      function drawBoard() {
        const bg = ctx.createLinearGradient(0, 0, 0, 560);
        bg.addColorStop(0, THEME.bgTop);
        bg.addColorStop(1, THEME.bgBottom);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#fff';
        ctx.font = '900 21px sans-serif';
        ctx.fillText(${JSON.stringify(config.title)}, 24, 38);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.topCopy, 24, 58);
        drawRounded(54, 106, 282, 260, 30, THEME.panelTint, THEME.beltEdge, 3);
        ctx.fillStyle = 'rgba(255,255,255,.56)';
        ctx.font = '800 12px sans-serif';
        ctx.fillText(THEME.loopLabel, 68, 126);
        ctx.fillStyle = THEME.shadow;
        ctx.beginPath();
        ctx.ellipse(195, 236, 128, 104, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      function drawCell(index) {
        const point = BELT_POINTS[index];
        const cell = state.belt[index];
        drawRounded(point.x - 18, point.y - 18, 36, 36, 12, cell ? colorMeta(cell.color).fill : THEME.beltFill, cell ? colorMeta(cell.color).edge : THEME.beltEdge);
        ctx.fillStyle = cell ? colorMeta(cell.color).ink : 'rgba(255,255,255,.16)';
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell ? colorMeta(cell.color).glyph : '·', point.x, point.y + 1);
      }
      function drawConnectors() {
        ctx.strokeStyle = 'rgba(255,255,255,.22)';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        for (let i = 0; i < BELT_POINTS.length; i += 1) {
          const a = BELT_POINTS[i];
          const b = BELT_POINTS[(i + 1) % BELT_POINTS.length];
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      function drawTruck(index) {
        const point = TRUCK_POINTS[index];
        const truck = state.trucks[index];
        const active = truck && truck.queue.length;
        drawRounded(point.x - point.w / 2, point.y - point.h / 2, point.w, point.h, 20, active ? THEME.truckFill : 'rgba(255,255,255,.06)', active ? THEME.truckEdge : 'rgba(255,255,255,.12)', active ? 2.5 : 2);
        ctx.fillStyle = '#fff';
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const meta = active ? colorMeta(truck.queue[0]) : null;
        const label = THEME.trucks[index];
        if (point.w > point.h) {
          ctx.fillText(label, point.x - 26, point.y);
          ctx.fillStyle = meta ? meta.fill : 'rgba(255,255,255,.2)';
          ctx.beginPath();
          ctx.arc(point.x + 16, point.y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = meta ? meta.ink : '#fff';
          ctx.font = '900 11px sans-serif';
          ctx.fillText(meta ? meta.glyph : '空', point.x + 16, point.y + 1);
          ctx.fillStyle = 'rgba(255,255,255,.76)';
          ctx.font = '800 10px sans-serif';
          ctx.fillText('x' + (truck ? truck.queue.length : 0), point.x + 42, point.y + 1);
        } else {
          ctx.save();
          ctx.translate(point.x, point.y);
          ctx.rotate(Math.PI / 2);
          ctx.fillText(label, -26, 0);
          ctx.fillStyle = meta ? meta.fill : 'rgba(255,255,255,.2)';
          ctx.beginPath();
          ctx.arc(16, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = meta ? meta.ink : '#fff';
          ctx.font = '900 11px sans-serif';
          ctx.fillText(meta ? meta.glyph : '空', 16, 1);
          ctx.fillStyle = 'rgba(255,255,255,.76)';
          ctx.font = '800 10px sans-serif';
          ctx.fillText('x' + (truck ? truck.queue.length : 0), 42, 1);
          ctx.restore();
        }
      }
      function truckButtonMarkup(truck, index) {
        const meta = truck && truck.queue.length ? colorMeta(truck.queue[0]) : null;
        return '<button class="chip' + (meta ? '' : ' picked') + '" data-truck-index="' + index + '" style="' + (meta ? '--chip-fill:' + meta.fill + '; --chip-edge:' + meta.edge + '; --chip-ink:' + meta.ink + ';' : '') + '">' +
          '<b>' + THEME.trucks[index] + '</b><small>' + (meta ? meta.label + ' x' + truck.queue.length : '已空') + '</small></button>';
      }
      function renderRack() {
        const rack = document.getElementById('truckRack');
        rack.innerHTML = state.trucks.map(truckButtonMarkup).join('');
        rack.querySelectorAll('[data-truck-index]').forEach((button) => {
          button.addEventListener('click', () => inject(Number(button.dataset.truckIndex)));
        });
      }
      function render() {
        drawBoard();
        drawConnectors();
        for (let i = 0; i < BELT_POINTS.length; i += 1) drawCell(i);
        for (let i = 0; i < TRUCK_POINTS.length; i += 1) drawTruck(i);
        renderRack();
        document.getElementById('clearText').textContent = THEME.clearedLabel + ' ' + state.cleared + ' / ' + LEVEL.target;
        document.getElementById('queueText').textContent = THEME.queueLabel + ' ' + state.trucks.reduce((sum, truck) => sum + truck.queue.length, 0);
        document.getElementById('statusText').textContent = state.note;
      }
      document.getElementById('stepBtn').addEventListener('click', stepLoop);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(stepLoop, 900);
      window.advanceTime = (ms) => {
        const steps = Math.max(1, Math.round(ms / 900));
        for (let i = 0; i < steps; i += 1) stepLoop();
      };
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with 14-slot rectangular conveyor loop and 4 truck injectors',
        mode: state.mode,
        cleared: state.cleared,
        moves: state.moves,
        queued: state.trucks.reduce((sum, truck) => sum + truck.queue.length, 0),
        belt: state.belt.map((cell) => cell ? cell.color : null),
        trucks: state.trucks.map((truck) => ({ entry: truck.entry, next: truck.queue[0] || null, left: truck.queue.length })),
      });
    `,
  };
}

const loopSortLevel = {
  target: 12,
  trucks: [
    { id: 'north', entry: 1, queue: ['coral', 'mint', 'amber'] },
    { id: 'east', entry: 5, queue: ['coral', 'violet', 'mint'] },
    { id: 'south', entry: 8, queue: ['amber', 'coral', 'violet'] },
    { id: 'west', entry: 12, queue: ['mint', 'amber', 'violet'] },
  ],
};

const loopSortBaseGame = createLoopSortGame({
  id: 'loop-sort-fake',
  file: 'loop-sort-fake.html',
  title: '环带理货局',
  sourceGame: 'Loop Sort 式卡车放货环带三连清',
  accent: '#86efff',
  summary: '点四侧卡车把色块送上环形传送带，沿带转一圈后凑成三连立刻清空，别让整圈堵死。',
  topCopy: 'Loop Sort 热门复刻 · 点车放货，让环带自己转出三连',
  hint: '先观察哪一侧放出来更容易连成三件；入口被占时先等环带转一步。',
  injectCopy: ' 已经压上环带入口。',
  blockedCopy: '这个入口位还被上一块货挡着。',
  emptyCopy: '这辆车已经没货了。',
  clearCopy: '环带连成 {count} 格，已经整批清走。',
  jamCopy: '整圈都堵满了，这轮传送带已经卡死。',
  winCopy: '四车货都顺完了，整圈传送带也已经清空。',
  stepCopy: '环带自动前进了一格，继续等三连露头。',
  buttonCopy: '重开这圈',
  stepLabel: '传送一步',
  clearedLabel: '已清',
  queueLabel: '待放货',
  loopLabel: '环形传送带',
  bgTop: '#081c2d',
  bgBottom: '#040b12',
  panelTint: '#112537',
  beltFill: 'rgba(255,255,255,.08)',
  beltEdge: 'rgba(220,244,255,.72)',
  truckFill: 'rgba(134,239,255,.14)',
  truckEdge: 'rgba(134,239,255,.52)',
  shadow: 'rgba(0,0,0,.34)',
  trucks: ['北车', '东车', '南车', '西车'],
  colors: {
    coral: { fill: '#ff9d7b', edge: '#ffe1d5', ink: '#401308', glyph: '橙', label: '橙箱' },
    mint: { fill: '#98efc8', edge: '#e8fff3', ink: '#0d2f1e', glyph: '绿', label: '绿箱' },
    amber: { fill: '#ffd67d', edge: '#fff1cc', ink: '#422700', glyph: '黄', label: '黄箱' },
    violet: { fill: '#c7b0ff', edge: '#f0e9ff', ink: '#28184a', glyph: '紫', label: '紫箱' },
  },
  level: loopSortLevel,
});

const loopSortOfficeRemixGame = createLoopSortGame({
  id: 'office-loop-sort',
  file: 'office-loop-sort.html',
  title: '夜班传单回路',
  sourceGame: '环带理货局 Remix',
  accent: '#9cefd8',
  summary: '把货箱换成邮件、审批、报销和排班单，还是四侧投件上环带，凑成三件同类就整批清走。',
  topCopy: '办公室二创 · 四边投单，让夜班回路自己把同类整走',
  hint: '先找哪一侧投进去能最快凑出三件同类；入口堵住时先让回路转一步。',
  injectCopy: ' 已经塞进夜班回路入口。',
  blockedCopy: '这个投递口还堵着旧单据。',
  emptyCopy: '这条投递线已经暂时清空。',
  clearCopy: '夜班回路连成 {count} 份，已经整批处理掉。',
  jamCopy: '整圈回路都被堆单塞满了，这班已经卡死。',
  winCopy: '所有夜班单据都流完了，整圈回路也已经清空。',
  stepCopy: '夜班回路又前进了一格，继续等同类单据贴到一起。',
  buttonCopy: '重开这一圈',
  stepLabel: '回路一步',
  clearedLabel: '已处理',
  queueLabel: '待投单',
  loopLabel: '夜班回路',
  bgTop: '#071816',
  bgBottom: '#030d0c',
  panelTint: '#102625',
  beltFill: 'rgba(255,255,255,.08)',
  beltEdge: 'rgba(218,255,244,.72)',
  truckFill: 'rgba(156,239,216,.14)',
  truckEdge: 'rgba(156,239,216,.52)',
  shadow: 'rgba(0,0,0,.36)',
  trucks: ['邮件线', '审批线', '报销线', '排班线'],
  colors: {
    coral: { fill: '#ffa188', edge: '#ffe4db', ink: '#421208', glyph: '邮', label: '邮件单' },
    mint: { fill: '#97efc6', edge: '#e9fff3', ink: '#0c2d1c', glyph: '审', label: '审批单' },
    amber: { fill: '#ffd98a', edge: '#fff3d6', ink: '#412600', glyph: '报', label: '报销单' },
    violet: { fill: '#cbb6ff', edge: '#f2edff', ink: '#2a194a', glyph: '班', label: '排班单' },
  },
  level: loopSortLevel,
});

function createHexaAwayGame(config) {
  const theme = {
    topCopy: config.topCopy,
    hint: config.hint,
    freeCopy: config.freeCopy,
    blockedCopy: config.blockedCopy,
    rotateCopy: config.rotateCopy,
    winCopy: config.winCopy,
    buttonCopy: config.buttonCopy,
    clearedLabel: config.clearedLabel,
    leftLabel: config.leftLabel,
    boardLabel: config.boardLabel,
    bgTop: config.bgTop,
    bgBottom: config.bgBottom,
    panelTint: config.panelTint,
    edge: config.edge,
    shadow: config.shadow,
    colors: config.colors,
  };
  return {
    id: config.id,
    file: config.file,
    title: config.title,
    kind: '六角弹出',
    sourceGame: config.sourceGame,
    accent: config.accent,
    summary: config.summary,
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="clearText"></b><span id="leftText"></span></div>
        <p id="statusText">${theme.hint}</p>
        <div class="button-row">
          <button class="choice" id="turnLeftBtn">左转</button>
          <button class="choice" id="turnRightBtn">右转</button>
          <button class="primary" id="resetBtn">${theme.buttonCopy}</button>
        </div>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const THEME = ${JSON.stringify(theme)};
      const LEVEL = ${JSON.stringify(config.level)};
      const DIRS = {
        xp: { q: 1, r: 0, z: 0, arrow: '→' },
        xm: { q: -1, r: 0, z: 0, arrow: '←' },
        rp: { q: 0, r: 1, z: 0, arrow: '↘' },
        rm: { q: 0, r: -1, z: 0, arrow: '↖' },
        qp: { q: 1, r: -1, z: 0, arrow: '↗' },
        qm: { q: -1, r: 1, z: 0, arrow: '↙' },
        zp: { q: 0, r: 0, z: 1, arrow: '↑' },
      };
      const state = { tiles: [], yaw: 0, cleared: 0, mode: 'playing', note: THEME.hint };
      function rotateQR(q, r, turns) {
        const step = ((turns % 6) + 6) % 6;
        let cq = q;
        let cr = r;
        for (let i = 0; i < step; i += 1) {
          const nextQ = -cr;
          const nextR = cq + cr;
          cq = nextQ;
          cr = nextR;
        }
        return { q: cq, r: cr };
      }
      function rotatedTile(tile) {
        const centered = rotateQR(tile.q, tile.r, state.yaw);
        return { q: centered.q, r: centered.r, z: tile.z };
      }
      function screenPoint(tile) {
        const r = rotatedTile(tile);
        return {
          x: 195 + (r.q * 34 + r.r * 17),
          y: 286 + r.r * 28 - r.z * 40,
          depth: r.z * 20 + r.r * 8 + r.q * 4,
        };
      }
      function facePolys(tile) {
        const p = screenPoint(tile);
        const top = [
          { x: p.x, y: p.y - 18 },
          { x: p.x + 16, y: p.y - 9 },
          { x: p.x + 16, y: p.y + 9 },
          { x: p.x, y: p.y + 18 },
          { x: p.x - 16, y: p.y + 9 },
          { x: p.x - 16, y: p.y - 9 },
        ];
        const left = [
          { x: p.x - 16, y: p.y - 9 },
          { x: p.x, y: p.y + 18 },
          { x: p.x, y: p.y + 42 },
          { x: p.x - 16, y: p.y + 33 },
          { x: p.x - 16, y: p.y + 9 },
        ];
        const right = [
          { x: p.x + 16, y: p.y - 9 },
          { x: p.x + 16, y: p.y + 9 },
          { x: p.x, y: p.y + 42 },
          { x: p.x, y: p.y + 18 },
        ];
        return { top, left, right, center: p };
      }
      function drawPoly(points, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      function pointInPoly(point, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i].x;
          const yi = poly[i].y;
          const xj = poly[j].x;
          const yj = poly[j].y;
          const intersect = ((yi > point.y) !== (yj > point.y)) && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 0.0001) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      }
      function activeTiles() {
        return state.tiles.filter((tile) => tile.active);
      }
      function findTile(q, r, z, ignoreId) {
        return state.tiles.find((tile) => tile.active && tile.id !== ignoreId && tile.q === q && tile.r === r && tile.z === z) || null;
      }
      function clearPath(tile) {
        const dir = DIRS[tile.dir];
        let q = tile.q;
        let r = tile.r;
        let z = tile.z;
        while (true) {
          q += dir.q;
          r += dir.r;
          z += dir.z;
          if (Math.abs(q) > 2 || Math.abs(r) > 2 || Math.abs(q + r) > 2 || z < 0 || z > 2) return true;
          if (findTile(q, r, z, tile.id)) return false;
        }
      }
      function blockingCopy(tile) {
        const dir = DIRS[tile.dir];
        const meta = THEME.colors[tile.color];
        return meta.label + THEME.blockedCopy.replace('{arrow}', dir.arrow);
      }
      function reset() {
        state.tiles = LEVEL.tiles.map((tile) => ({ ...tile, active: true }));
        state.yaw = 0;
        state.cleared = 0;
        state.mode = 'playing';
        state.note = THEME.hint;
        render();
      }
      function turn(delta) {
        state.yaw = (state.yaw + delta + 6) % 6;
        if (state.mode === 'playing') state.note = THEME.rotateCopy;
        render();
      }
      function removeTile(tile) {
        if (state.mode !== 'playing' || !tile || !tile.active) return;
        if (!clearPath(tile)) {
          state.note = blockingCopy(tile);
          render();
          return;
        }
        tile.active = false;
        state.cleared += 1;
        const meta = THEME.colors[tile.color];
        state.note = meta.label + THEME.freeCopy;
        if (!activeTiles().length) {
          state.mode = 'won';
          state.note = THEME.winCopy;
        }
        render();
      }
      function tileFromPoint(point) {
        return activeTiles()
          .map((tile) => ({ tile, polys: facePolys(tile) }))
          .filter((entry) => pointInPoly(point, entry.polys.top) || pointInPoly(point, entry.polys.left) || pointInPoly(point, entry.polys.right))
          .sort((a, b) => b.polys.center.depth - a.polys.center.depth || b.polys.center.y - a.polys.center.y)[0]?.tile || null;
      }
      function pointFromEvent(event) {
        const box = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - box.left) * canvas.width / box.width,
          y: (event.clientY - box.top) * canvas.height / box.height,
        };
      }
      function drawScene() {
        const gradient = ctx.createLinearGradient(0, 0, 0, 560);
        gradient.addColorStop(0, THEME.bgTop);
        gradient.addColorStop(1, THEME.bgBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(${JSON.stringify(config.title)}, 24, 38);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 12px sans-serif';
        ctx.fillText(THEME.topCopy, 24, 58);
        ctx.fillStyle = THEME.panelTint;
        ctx.strokeStyle = THEME.edge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(34, 96, 322, 334, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.56)';
        ctx.font = '800 12px sans-serif';
        ctx.fillText(THEME.boardLabel, 50, 118);
        ctx.fillStyle = THEME.shadow;
        ctx.beginPath();
        ctx.ellipse(195, 362, 118, 42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      function drawTile(tile) {
        const meta = THEME.colors[tile.color];
        const polys = facePolys(tile);
        const free = clearPath(tile);
        drawPoly(polys.left, free ? meta.left : 'rgba(70,78,90,.92)', THEME.edge);
        drawPoly(polys.right, free ? meta.right : 'rgba(84,92,104,.94)', THEME.edge);
        drawPoly(polys.top, free ? meta.top : 'rgba(102,110,122,.96)', THEME.edge);
        ctx.fillStyle = free ? '#081017' : 'rgba(16,18,24,.82)';
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(DIRS[tile.dir].arrow, polys.center.x, polys.center.y + 4);
        ctx.font = '800 10px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.fillText(meta.glyph, polys.center.x, polys.center.y + 19);
      }
      function render() {
        drawScene();
        activeTiles()
          .slice()
          .sort((a, b) => screenPoint(a).depth - screenPoint(b).depth || screenPoint(a).r - screenPoint(b).r)
          .forEach(drawTile);
        if (state.mode === 'won') {
          ctx.fillStyle = 'rgba(6,10,18,.76)';
          ctx.fillRect(38, 198, 314, 110);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('整盘弹空', 195, 240);
          ctx.font = '700 14px sans-serif';
          ctx.fillText(state.note, 195, 268);
        }
        document.getElementById('clearText').textContent = THEME.clearedLabel + ' ' + state.cleared;
        document.getElementById('leftText').textContent = THEME.leftLabel + ' ' + activeTiles().length;
        document.getElementById('statusText').textContent = state.note;
      }
      let dragStart = null;
      canvas.addEventListener('pointerdown', (event) => { dragStart = pointFromEvent(event); });
      canvas.addEventListener('pointerup', (event) => {
        const point = pointFromEvent(event);
        if (!dragStart) return;
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;
        if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
          turn(dx > 0 ? 1 : -1);
        } else if (Math.abs(dy) > 28) {
          turn(dy > 0 ? 3 : 2);
        } else {
          removeTile(tileFromPoint(point));
        }
        dragStart = null;
      });
      document.getElementById('turnLeftBtn').addEventListener('click', () => turn(-1));
      document.getElementById('turnRightBtn').addEventListener('click', () => turn(1));
      document.getElementById('resetBtn').addEventListener('click', reset);
      window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') turn(-1);
        if (event.key === 'ArrowRight') turn(1);
      });
      reset();
      window.advanceTime = () => render();
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with axial hex prism cluster',
        mode: state.mode,
        yaw: state.yaw,
        cleared: state.cleared,
        remaining: activeTiles().length,
        tiles: activeTiles().map((tile) => ({
          id: tile.id,
          pos: [tile.q, tile.r, tile.z],
          dir: tile.dir,
          free: clearPath(tile)
        })),
      });
    `,
  };
}

const hexaAwayLevel = {
  tiles: [
    { id: 0, q: 0, r: 0, z: 2, dir: 'zp', color: 'violet' },
    { id: 1, q: -1, r: 0, z: 1, dir: 'xm', color: 'cyan' },
    { id: 2, q: 0, r: -1, z: 1, dir: 'rm', color: 'amber' },
    { id: 3, q: 1, r: -1, z: 1, dir: 'qp', color: 'pink' },
    { id: 4, q: 1, r: 0, z: 1, dir: 'xp', color: 'lime' },
    { id: 5, q: 0, r: 1, z: 1, dir: 'rp', color: 'violet' },
    { id: 6, q: -1, r: 1, z: 1, dir: 'qm', color: 'cyan' },
    { id: 7, q: -1, r: 0, z: 0, dir: 'qm', color: 'amber' },
    { id: 8, q: 0, r: -1, z: 0, dir: 'rm', color: 'lime' },
    { id: 9, q: 1, r: -1, z: 0, dir: 'qp', color: 'violet' },
    { id: 10, q: 1, r: 0, z: 0, dir: 'xp', color: 'cyan' },
    { id: 11, q: 0, r: 1, z: 0, dir: 'rp', color: 'pink' },
    { id: 12, q: -1, r: 1, z: 0, dir: 'xm', color: 'amber' },
  ],
};

const hexaAwayBaseGame = createHexaAwayGame({
  id: 'hexa-away-fake',
  file: 'hexa-away-fake.html',
  title: '六角弹出盘',
  sourceGame: 'Hexa Away 式六边形箭头弹出解块',
  accent: '#7cf0ff',
  summary: '点能顺着箭头直接飞出边界的六角块，不通就转盘换角度，把整团六角块弹空。',
  buttonCopy: '重开这盘',
  topCopy: 'Hexa Away 热门复刻 · 点掉能顺着箭头飞走的六角块',
  hint: '先找边缘能直接弹出的六角块；点不动就左右转盘，换出新的空边。',
  freeCopy: ' 顺着空边弹走了。',
  blockedCopy: ' 这条箭路还被别的六角块卡住。',
  rotateCopy: '六角盘已经转过，继续找新露出的空边。',
  winCopy: '整盘六角块已经被你弹空了。',
  clearedLabel: '已弹',
  leftLabel: '剩余',
  boardLabel: '六角团',
  bgTop: '#0b2032',
  bgBottom: '#050d16',
  panelTint: '#13283a',
  edge: 'rgba(225,245,255,.82)',
  shadow: 'rgba(0,0,0,.34)',
  colors: {
    cyan: { top: '#8ef3ff', left: '#43bdd3', right: '#67ddec', glyph: '青', label: '青块' },
    amber: { top: '#ffd980', left: '#cf9638', right: '#f5be56', glyph: '黄', label: '黄块' },
    pink: { top: '#ff9fc1', left: '#ca587d', right: '#ea789d', glyph: '粉', label: '粉块' },
    lime: { top: '#bdf48b', left: '#6baa36', right: '#94d65a', glyph: '绿', label: '绿块' },
    violet: { top: '#ccb0ff', left: '#7f67cc', right: '#a086ef', glyph: '紫', label: '紫块' },
  },
  level: hexaAwayLevel,
});

const hexaAwayOfficeRemixGame = createHexaAwayGame({
  id: 'office-stamp-away',
  file: 'office-stamp-away.html',
  title: '工单盖章弹出',
  sourceGame: '六角弹出盘 Remix',
  accent: '#95efd4',
  summary: '把六角箭块改成待盖章工单：顺着箭头把外层工单先弹走，再逐层清空审批盘。',
  buttonCopy: '重开审批盘',
  topCopy: '办公室二创 · 把能直接流转出去的工单先盖走',
  hint: '先处理边缘能直接流转的工单；箭路被卡住时，转盘换一个审批角度。',
  freeCopy: ' 已经顺着流程流转走了。',
  blockedCopy: ' 这条审批线还被别的工单挡着。',
  rotateCopy: '审批盘角度换好了，继续找能直接流转的工单。',
  winCopy: '这一盘待盖章工单已经全部流转完了。',
  clearedLabel: '已盖',
  leftLabel: '待盖',
  boardLabel: '审批盘',
  bgTop: '#081d21',
  bgBottom: '#041014',
  panelTint: '#10272a',
  edge: 'rgba(215,255,241,.84)',
  shadow: 'rgba(0,0,0,.38)',
  colors: {
    cyan: { top: '#8bf0de', left: '#3b9a8b', right: '#61c8b7', glyph: '采', label: '采购单' },
    amber: { top: '#ffd98b', left: '#c18b35', right: '#ebb75b', glyph: '差', label: '差旅单' },
    pink: { top: '#ffa9b7', left: '#c05f72', right: '#df7f92', glyph: '报', label: '报销单' },
    lime: { top: '#b7f28d', left: '#6f9d3b', right: '#92cb58', glyph: '补', label: '补签单' },
    violet: { top: '#ccb9ff', left: '#7e6abf', right: '#a18de8', glyph: '审', label: '审批单' },
  },
  level: hexaAwayLevel,
});

const deterministicRemixes = [
  {
    game: loopSortOfficeRemixGame,
    id: 'remix-office-loop-sort',
    slug: 'office-loop-sort',
    title: '夜班传单回路',
    source_file: 'loop-sort-fake.html',
    parent_slug: 'loop-sort-fake',
    lineage: ['loop-sort-fake', 'office-loop-sort'],
    prompt: { text: '把 Loop Sort 式卡车放货环带三连清改成办公室夜班传单主题，货箱换成邮件、审批、报销和排班单，保留四侧投放、环带前进和三件即清。', voice_transcript: '' },
    summary: '办公室主题的 Loop Sort 二创：把夜班单据从四侧投上回路，等同类三件沿环带贴到一起后整批清走。',
    accent: '#9cefd8',
    glyph: '环',
    agent_description: {
      one_liner: '办公室主题的 Loop Sort 二创：把夜班单据从四侧投上回路，等同类三件沿环带贴到一起后整批清走。',
      core_loop: '玩家面对一圈不断前进的夜班传单回路，四侧各有一条投递线；每次点击任意一条投递线，最前面的单据就会压进对应入口格，然后随着整圈回路持续前进；只要三份同类单据在环带上连成一段，就会立刻整批处理掉；如果整圈先被不同单据堵满，这班夜路就算彻底卡死。',
      controls: '单指点击底部四个投递按钮把对应单据塞进入口；点击“回路一步”手动推进一格；点击“重开这一圈”恢复固定投递序列。',
      mechanics: [
        '四侧投递：不是直接拖拽排序，而是从四个入口选择哪一边先把单据送上回路，保留这条玩法最关键的入口判断',
        '环带自走：单据上带后会沿整圈持续前进，玩家要预判它下一次转到哪一侧时会和谁贴在一起',
        '三件即清：任意连续三件同类单据会立刻整批处理掉，留下空格继续接下一批',
        '入口堵塞：如果某个入口格被旧单据占住，这条投递线暂时无法再发，迫使玩家等回路先转开',
        '短局堵环：12 份固定单据、14 格回路，几十秒就能完整打一轮，也足够制造一两次明显卡顿'
      ],
      visual_language: '把糖果色货箱换成冷绿夜班文书，深色玻璃回路板配发光入口，仍保持离线单文件、手机竖屏与轻量画布渲染。',
      state_model: 'state.belt 记录 14 格回路上当前每格的单据颜色或空位；state.trucks 保存四条投递线剩余序列和入口索引；state.cleared 统计已处理件数；state.moves 统计投递次数；state.mode 在 playing/won/lost 间切换。',
      share_hook: '“把一整圈夜班堆单顺空了”比普通货箱分拣更贴合办公室梗，也方便继续扩到客服、物流或审批题材。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入第二套投递序列 seed', '加入冰格或门帘这类单个障碍', '加入限步达成文案']
    },
  },
  {
    game: hexaAwayOfficeRemixGame,
    id: 'remix-office-stamp-away',
    slug: 'office-stamp-away',
    title: '工单盖章弹出',
    source_file: 'hexa-away-fake.html',
    parent_slug: 'hexa-away-fake',
    lineage: ['hexa-away-fake', 'office-stamp-away'],
    prompt: { text: '把 Hexa Away 式六角箭头弹出盘改成办公室审批主题，六角块换成采购、报销、差旅等工单，保留只能顺箭头流转和转盘换角度。', voice_transcript: '' },
    summary: '办公室主题的 Hexa Away 二创：先把边缘工单流转走，再逐层清空整张审批盘。',
    accent: '#95efd4',
    glyph: '章',
    agent_description: {
      one_liner: '办公室主题的 Hexa Away 二创：先把边缘工单流转走，再逐层清空整张审批盘。',
      core_loop: '玩家面对一团堆叠的六角审批工单，只能点击那些能顺着箭头直接流转出边界的单据；如果某张单据的箭路被其他工单挡住，就要先转动整盘审批视角，换出新的空边；当所有工单都被流转走，这轮审批盘才算彻底清空。',
      controls: '单指点击可直接流转的六角工单；左右按钮或左右划动旋转整盘；点击“重开审批盘”恢复固定布局。',
      mechanics: [
        '顺箭头弹出：每张工单只有在箭头指向的整条路径都畅通时才能直接流转走，复刻这个玩法最关键的判断压力',
        '转盘换边：玩家需要不断旋转六角团，找出不同视角下新露出的可弹出边缘块',
        '六角布局：不是立方方块，而是蜂窝式六边形堆叠，视觉上和当前库里的 Tap Away 家族拉开差异',
        '短局固定盘：十几块工单、一个固定 seed，几十秒就能完整刷完一盘',
        '逐层露出：外层先走，中心与上层块随后变成可操作目标，维持连锁揭示节奏'
      ],
      visual_language: '冷绿夜班办公室配色，把彩色六角块换成不同流程单据，玻璃审批板承接画布场景，继续保持离线单文件和手机竖屏。',
      state_model: 'state.tiles 记录每张工单的轴坐标、高度、箭头方向和激活状态；state.yaw 记录当前六向旋转；state.cleared 统计已流转工单数；state.mode 在 playing/won 间切换。',
      share_hook: '“把整盘待审批工单一把盖空了”天然适合办公室二创梗图。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入第二套 hex seed', '加入一步提示按钮', '加入限旋转挑战文案']
    },
  },
  {
    game: tripleMatchOfficeRemixGame,
    id: 'remix-desk-clutter-triples',
    slug: 'desk-clutter-triples',
    title: '工位清台局',
    source_file: 'triple-match-fake.html',
    parent_slug: 'triple-match-fake',
    lineage: ['triple-match-fake', 'desk-clutter-triples'],
    prompt: { text: '把 Triple Match 3D / Match Factory 式堆物三连清改成办公室清台主题，杂物换成工牌、鼠标、咖啡、便签和线材，保留顶层遮挡、七格托盘和三件即消。', voice_transcript: '' },
    summary: '办公室主题的堆物三连清二创：先拿露头杂件，再把同类工位物凑成三件整盒归档。',
    accent: '#92f0d9',
    glyph: '台',
    agent_description: {
      one_liner: '办公室主题的堆物三连清二创：先拿露头杂件，再把同类工位物凑成三件整盒归档。',
      core_loop: '玩家面对一团堆在工位桌面的杂件，只能先点当前露在最上层的工牌、鼠标、便签、咖啡杯、线材和长尾夹；每点一件就会掉进下方七格待归档盒，任意同类累计到三件会立刻整盒归档清掉；如果暂存盒先被不同杂件塞满，或者倒计时先归零，这张桌面就算清台失败。',
      controls: '单指点击当前可见的最上层杂件；点击“重开这张桌”恢复固定堆物布局。',
      mechanics: [
        '顶层遮挡：被更高层杂件压住的东西不能直接拿，必须先剥掉上层，保留这个赛道最关键的视觉搜索压力',
        '七格托盘：所有点击物都会先进七格暂存，三件同类才会立刻消掉，不同类堆太多就直接输',
        '三件即清：不需要拖拽或交换，只要凑够三件同类就立刻给出很强的整理反馈',
        '隐藏露出：下层物件随着上层清掉逐渐露头，维持“越清越能看见新东西”的节奏',
        '短局计时：单局几十秒内必须把整桌清掉，复刻热门堆物三连盘常见的时间压迫'
      ],
      visual_language: '把大众生活杂物换成工位清台主题，深青桌面配冷色玻璃盒与高对比标签，继续保持离线单文件、手机竖屏和轻量 DOM 交互。',
      state_model: 'state.items 记录每件杂件的类型、层级、坐标和是否仍在桌面上；state.tray 保存当前七格待归档盒；state.remaining 保存每个类型还剩多少件未清；state.timeLeft 是本局剩余时间；state.mode 在 playing/won/lost 间切换。',
      share_hook: '“这张工位桌我一把清台了”比普通日用品更适合办公室梗图和后续同主题扩展。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入第二套堆物 seed', '加入风扇或磁吸类最小辅助道具', '加入连清统计文案']
    },
  },
  {
    game: goodsSortOfficeRemixGame,
    id: 'remix-office-snack-stock',
    slug: 'office-snack-stock',
    title: '茶水间补货局',
    source_file: 'goods-sort-fake.html',
    parent_slug: 'goods-sort-fake',
    lineage: ['goods-sort-fake', 'office-snack-stock'],
    prompt: { text: '把 Goods Sort 式货架理货盘改成办公室茶水间补货主题，商品换成冷萃、茶包、饼干、杯面和气泡水，保留前排取货、后排补位和七格三件即清。', voice_transcript: '' },
    summary: '办公室茶水间主题的货架理货二创：只拿前排零食饮料，三件同类立刻整盒补走。',
    accent: '#9df0d4',
    glyph: '柜',
    agent_description: {
      one_liner: '办公室茶水间主题的货架理货二创：只拿前排零食饮料，三件同类立刻整盒补走。',
      core_loop: '玩家面对三层茶水间零食柜，只能点击每条货道最前排可见的一件补给，把它送进下方七格补货暂存台；任意同类累计到三件会立刻整盒补走清空；前排拿走后，后排库存会自动补到最前面；如果暂存台先被不同物件塞满，这面柜就算整理失败。',
      controls: '单指点击任意货道当前最前排的一件；点击“重开这面柜”恢复固定补货布局。',
      mechanics: [
        '前排可拿：每条货道永远只暴露一件前排货，必须先处理近端库存，保留货架理货类最关键的拿取节奏',
        '后排补位：前排一走，后排自然露出，形成持续的小揭示反馈',
        '七格暂存：拿起的补给先进七格暂存，三件同类才会整盒补走，不同品类堆太多就会堵台',
        '三件即清：没有拖拽换位，纯点击选择，尽量用最小交互复刻热门理货盘的短线判断',
        '短局货架：18 件物品、9 条货道，十几秒到几十秒就能完整刷完一轮'
      ],
      visual_language: '把大众超市货架换成夜间办公室茶水间，深色柜体配冷绿灯箱、简化零食饮料图标和玻璃感暂存条，继续保持离线单文件与竖屏 DOM 结构。',
      state_model: 'state.lanes 记录每条货道所属柜层和从前到后的库存序列；state.tray 保存当前七格补货暂存；state.remaining 保存各品类剩余件数；state.cleared 统计已整盒补走数量；state.mode 在 playing/won/lost 间切换。',
      share_hook: '“把茶水间零食柜一把理顺了”比普通商超货架更适合办公室梗图和后续同题材二创。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入第二套货道 seed', '加入限步目标', '加入补货连击文案']
    },
  },
  {
    game: hexaSortOfficeRemixGame,
    id: 'remix-office-badge-stack',
    slug: 'office-badge-stack',
    title: '工牌六角归档',
    source_file: 'hexa-sort-fake.html',
    parent_slug: 'hexa-sort-fake',
    lineage: ['hexa-sort-fake', 'office-badge-stack'],
    prompt: { text: '把 Hexa Sort 式六角堆叠分色盘改成办公室归档主题，六角块换成不同部门工牌，保留整段搬运和满柱整批清空。', voice_transcript: '' },
    summary: '办公室主题的 Hexa Sort 二创：先腾空归档栏，再把同部门工牌叠满一柱整批收走。',
    accent: '#9ff0d1',
    glyph: '档',
    agent_description: {
      one_liner: '办公室主题的 Hexa Sort 二创：先腾空归档栏，再把同部门工牌叠满一柱整批收走。',
      core_loop: '玩家面对七根蜂巢式归档栏，只能搬运每栏最上方连续相同部门的一段工牌；把它们倒进空栏，或倒到同部门顶牌上继续叠高；任意一栏叠满四张同部门工牌就会整栏直接归档消失，直到五个部门都被清空。',
      controls: '单指先点源栏锁定，再点空栏或同部门顶牌栏执行搬运；再次点同一栏取消选择；点击“重开这一栏”恢复固定盘面。',
      mechanics: [
        '顶层连续搬运：不是一张一张挪，而是顶层连着的同部门整段一起滑走，复刻 Hexa Sort 最关键的爽点',
        '空栏缓冲：两根空栏负责中转，玩家先腾位再归并，形成连续短线决策',
        '满柱即清：四张同部门叠满整栏会直接整批归档，给出很强的节奏反馈',
        '蜂巢布局：七栏按六角蜂窝排开，不再是试管或直排瓶子，视觉和操作都更贴近这个玩法族',
        '固定短局：五种部门牌、两根缓冲栏，几十秒到一两分钟就能完整复盘一轮'
      ],
      visual_language: '冷绿办公夜班配色，六角工牌取代普通色块，归档栏像玻璃文件槽，仍保持单文件竖屏与纯画布渲染。',
      state_model: 'state.columns 记录七个归档栏自底向上的部门牌序列；state.selected 记录当前源栏；state.cleared 保存已整批归档的部门；state.moves 统计搬运步数；state.mode 在 playing/won 间切换。',
      share_hook: '“我把五个部门的工牌一把归完了”很像办公室梗图，也方便继续往归档、排班、审批主题扩。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入更多蜂巢盘面 seed', '加入一步撤回', '加入限步三星文案']
    },
  },
  {
    game: tapAwayWarehouseRemixGame,
    id: 'remix-night-shift-crate-out',
    slug: 'night-shift-crate-out',
    title: '夜班货架出箱',
    source_file: 'tap-away-fake.html',
    parent_slug: 'tap-away-fake',
    lineage: ['tap-away-fake', 'night-shift-crate-out'],
    prompt: { text: '把 Tap Away 式 3D 箭头出块改成夜班仓储主题，彩块换成不同标签货箱，保留旋转货架和顺着箭头推出外层箱子的节奏。', voice_transcript: '' },
    summary: '夜班仓储主题的 3D 出块二创：先推出外层货箱，再靠旋转货架把整架清空。',
    accent: '#8ef6d8',
    glyph: '箱',
    agent_description: {
      one_liner: '夜班仓储主题的 3D 出块二创：先推出外层货箱，再靠旋转货架把整架清空。',
      core_loop: '玩家面对一团堆在夜班货架上的立体货箱，只要某个箱子的贴纸箭头方向没有别箱阻挡，点它就会顺着货道直接推出货架；中层和内层暂时被外壳包住时，需要先左右旋转货架，换一个角度继续拆露在外面的箱子，直到 15 个货箱全部出完。',
      controls: '单指点货箱尝试推出；左右滑动或点“左转 / 右转”旋转货架；点击“重开这架”恢复固定堆叠。',
      mechanics: [
        '箭头即出路：每个货箱都绑定一个固定推出方向，只要那条线上没有别箱就会立刻出架',
        '外层先拆：内层货箱天然被外层包住，必须先清掉包壳，保留 Tap Away 最核心的剥层爽点',
        '旋转找角度：不能平移整团，只能旋转视角重新判断哪些货箱已经露在边缘',
        '无时间压力：没有计时和道具，只靠顺序与空间判断制造短线策略',
        '固定短局：单团 15 箱，十几秒到几十秒就能完整复盘一轮'
      ],
      visual_language: '把高饱和彩色方块换成冷色夜班货箱、仓储标签和低照度货架，继续保持离线单文件、手机竖屏和纯画布渲染。',
      state_model: 'state.blocks 保存每个货箱的 3D 坐标、箭头方向、颜色标签和是否仍在架上；state.yaw 记录当前货架旋转角度；state.cleared 记录已推出数量；state.mode 在 playing/won 间切换。',
      share_hook: '“这一架终于拆空了”比普通方块更像打工人夜班梗图，也方便继续往仓储题材扩。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入第二套更厚的 3x3x3 牌面', '加入上下倾斜视角切换', '加入最少步数或最快清架文案']
    },
  },
  {
    game: colorBlockJamOfficeRemixGame,
    id: 'remix-office-folder-jam',
    slug: 'office-folder-jam',
    title: '工位文件归槽',
    source_file: 'color-block-jam-fake.html',
    parent_slug: 'color-block-jam-fake',
    lineage: ['color-block-jam-fake', 'office-folder-jam'],
    prompt: { text: '把 Color Block Jam 式彩块滑门谜题改成办公室文件归档主题，彩块换成不同部门文件夹，出口换成收纳槽。', voice_transcript: '' },
    summary: '办公室主题的彩块滑门二创：先给大文件夹让路，再把所有部门件滑进对应收纳槽。',
    accent: '#8ae8ff',
    glyph: '档',
    agent_description: {
      one_liner: '办公室主题的彩块滑门二创：先给大文件夹让路，再把所有部门件滑进对应收纳槽。',
      core_loop: '玩家面对一块被柜体挡住的 6x6 工位归档板，先选中文件夹，再朝四个方向一划；文件夹会沿空路一直滑到停点，若正好贴到同部门收纳槽边缘就会直接归档离场；把大文件夹先挪走、为后排小件腾出通道，直到整盘文件都滑进各自槽位。',
      controls: '单指点中文件夹后朝四个方向滑动，或使用下方方向按钮微调；点击“重开这一层”恢复固定牌面。',
      mechanics: [
        '任意方向滑动：不同于固定箭头位移，这类彩块可以朝四个方向尝试，直到撞到柜体或别的文件夹才停下',
        '同色门口离场：只有对应部门文件夹贴到自己的收纳槽边缘时才会立刻消失，保留 Color Block Jam 的核心目标',
        '尺寸差异：盘里同时有长条夹和小件夹，必须先处理占位最大的长条件',
        '固定障碍：柜体不会移动，只负责制造窄通道和卡位，强化短线空间规划',
        '短局复玩：单盘几步到十几步即可解完，天然适合快速连刷和再二创'
      ],
      visual_language: '把亮色彩块换成冷色办公室文件夹与收纳槽，深蓝背景配玻璃感面板，仍保持离线单文件和手机竖屏的轻量节奏。',
      state_model: 'state.blocks 保存每个文件夹的行列位置、尺寸、颜色和是否已归档；state.selectedId 记录当前被选中的文件夹；state.moves 统计推档次数；state.mode 在 playing/won 间切换。',
      share_hook: '“把一层文件一次性归槽完了”很像办公室段子截图，也适合作为同一玩法线的轻主题二创。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入更多固定盘面 seed', '加入一步撤回', '加入更长的双格和三格文件夹组合']
    },
  },
  {
    game: subwaySnakeRemixGame,
    id: 'remix-subway-snake-shift',
    slug: 'subway-snake-shift',
    title: '地铁刷卡蛇',
    source_file: 'snake-battle-fake.html',
    parent_slug: 'snake-battle-fake',
    lineage: ['snake-battle-fake', 'subway-snake-shift'],
    prompt: { text: '把贪吃蛇大作战式冲榜局改成地铁通勤主题，光豆换成刷卡点，冲刺掉出票根，整体更像晚高峰换乘。', voice_transcript: '' },
    summary: '通勤主题的蛇局二创：单指变道、长按冲刺、吃刷卡点把列车长龙冲进榜单。',
    accent: '#5dc2ff',
    glyph: '蛇',
    agent_description: {
      one_liner: '通勤主题的蛇局二创：单指变道、长按冲刺、吃刷卡点把列车长龙冲进榜单。',
      core_loop: '玩家操控一列蛇形通勤列车在竖屏大厅内单指变道，持续吃掉散落的刷卡点来增长车厢长度；长按冲刺可以快速抢点，但尾部会不断掉出票根，既可能被自己回收，也会给对手留下可抢资源；只要把列车长度冲到 40 就算通勤通关。',
      controls: '手指在画布上拖动决定车头朝向；长按“长按冲刺”按钮或空格键进入加速；点击“重开”立即重置一局。',
      mechanics: [
        '单指转向：车头始终朝最近指针方向平滑扭动，保留热门蛇局最核心的低门槛手感',
        '冲刺掉尾：长按冲刺显著提速，但会把尾部长度逐段抖成票根豆点，形成经典风险换速度',
        '撞身判负：只要蛇头蹭到任意蛇身就会立刻出局，逼玩家在换乘口做极短决策',
        'Bot 冲榜：四条 AI 列车也会抢点、撞线、爆豆，场面始终维持轻度 io 压迫',
        '短局目标：长度冲到 40 即胜，适合十几秒到几十秒的碎片复玩'
      ],
      visual_language: '深蓝换乘大厅、荧蓝轨道网格、暖黄刷卡点与橙色票根，蛇身更像一串发光车厢，整体比原型更偏通勤夜色。',
      state_model: 'state.player 保存玩家列车的头部坐标、角度、长度与轨迹；state.bots 是四条 AI 列车；state.pellets 是大厅内散落的刷卡点与票根；state.mode 在 playing/won/lost 之间切换。',
      share_hook: '“晚高峰我把地铁蛇冲到榜一了”这类结果文案天然适合截图传播。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入换乘高峰时段速度波动', '加入站台广播倒计时', '加入双蛇交错的更密车流 seed']
    },
  },
  {
    game: screwRemixGame,
    id: 'remix-night-shift-screws',
    slug: 'night-shift-screws',
    title: '夜班拆钉台',
    source_file: 'screw-sorter.html',
    parent_slug: 'screw-sorter',
    lineage: ['screw-sorter', 'night-shift-screws'],
    prompt: { text: '改成夜班工位主题，板材换成工牌和键帽，反馈更冷更硬。', voice_transcript: '' },
    summary: '夜班工位主题的拧钉排序局：拆挡板、收同色、避免夜班盒爆仓。',
    accent: '#22f4ee',
    glyph: '改',
    agent_description: {
      one_liner: '夜班工位主题的拧钉排序局：拆挡板、收同色、避免夜班盒爆仓。',
      core_loop: '玩家先拆最上层可点击的彩钉，让被工牌和键帽压住的下层螺丝逐步露出；每拆下一枚都会进入下方六格夜班盒，凑满三枚同类自动归档清除；如果盒子被不同颜色塞满则失败，拆空全部层板即通关。',
      controls: '触摸点击高亮可拆的螺丝；不可点击被上层挡住的螺丝；点击“重开这一板”重置关卡。',
      mechanics: [
        '层叠遮挡：只有不被更高层板件覆盖的螺丝可以拆除',
        '三枚归档：同类螺丝进入六格盒后，累计三枚自动清空',
        '有限槽位：不同类颜色混装会快速占满盒子，迫使玩家规划顺序',
        '板件剥离：拆空某层板件上的螺丝后，该板件视觉上退出场景，露出更深层',
        '短局复玩：单局目标明确，适合十几秒到几十秒反复尝试'
      ],
      visual_language: '冷色夜班工位风，深蓝背景加霓虹冷光，板件替换成工牌压板、键帽挡片与主控底板，收纳盒字符也改成工位符号。',
      state_model: 'state.screws 记录每枚螺丝的层级、颜色、位置与激活状态；state.tray 为六格夜班盒；state.mode 为 playing/won/lost；state.removed 记录已归档数量。',
      share_hook: '结果文案天然适合截图分享，比如“我把夜班拆钉台一板清空了”或“夜班盒又爆仓了”。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保留 printer artifact 元数据与页面契约'],
      next_evolution_hooks: ['加入限时夜班倒计时', '加入特殊锁钉与万能空槽', '加入每日板面 seed 与排行榜文案']
    },
  },
  {
    game: screwBoxRemixGame,
    id: 'remix-parcel-screw-boxes',
    slug: 'parcel-screw-boxes',
    title: '分拨拆钉台',
    source_file: 'screw-box-blitz.html',
    parent_slug: 'screw-box-blitz',
    lineage: ['screw-box-blitz', 'parcel-screw-boxes'],
    prompt: { text: '把同色彩盒拆钉局改成快递分拨台主题，盒子换成包裹框，保留三枚同色立即出库的节奏。', voice_transcript: '' },
    summary: '快递分拨主题的彩盒拆钉二创：先拆挡板，再把同色封签塞进对应包裹框。',
    accent: '#ffb347',
    glyph: '箱',
    agent_description: {
      one_liner: '快递分拨主题的彩盒拆钉二创：先拆挡板，再把同色封签塞进对应包裹框。',
      core_loop: '玩家先从上层可点击位置拆出封签钉，露出被包材压住的下层钉件；每枚钉件会进入对应颜色的包裹框，同色累计到三枚就会立刻整框出库清空；如果四个包裹框总待处理量堆到六枚，分拨台就会堵塞失败。',
      controls: '触摸点击发亮的可拆封签钉；被高层包材遮挡的钉件不能点；点击“重开这一局”恢复固定板面。',
      mechanics: [
        '层叠遮挡：只有最上层不被遮住的钉件才能被拆出',
        '同色入框：拆下来的钉件直接进入对应颜色的包裹框，不再进入混合暂存栏',
        '三枚即出库：任意颜色累计到三枚会立刻清空该框，形成明确节奏点',
        '六格堵塞失败：所有包裹框的待处理量合计到六枚时失败，逼玩家按颜色规划顺序',
        '短局强复盘：板面固定、反馈清晰，适合反复优化拆钉路径'
      ],
      visual_language: '把工业拆板主题换成快递分拨台：暖橙背景、纸箱色挡板、四色包裹框，钉件标签则改成急件与色签的分拨符号。',
      state_model: 'state.screws 记录每枚钉件的层级、颜色、位置与激活状态；state.bins 记录四个包裹框当前各自待处理数量；state.mode 为 playing/won/lost；state.removed 记录已出库数量。',
      share_hook: '“这车封签又把分拨台堵死了”这类失败文案很适合做梗图，成功清空时也有明确的收尾截图点。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保留 printer artifact 元数据与页面契约'],
      next_evolution_hooks: ['加入万能快递框', '加入限时快件倒计时', '加入第二块更密的分拨板面']
    },
  },
  {
    game: screwdomOfficeRemixGame,
    id: 'remix-office-pin-pile',
    slug: 'office-pin-pile',
    title: '工位夹签归档',
    source_file: 'screwdom-fake.html',
    parent_slug: 'screwdom-fake',
    lineage: ['screwdom-fake', 'office-pin-pile'],
    prompt: { text: '把 Screwdom 式针位堆叠拆钉改成办公室归档主题，钉帽换成部门夹签，底部箱位换成归档框。', voice_transcript: '' },
    summary: '办公室主题的针位拆钉二创：只处理每根柱子的顶层夹签，三张同部门立刻整框归档。',
    accent: '#97f0ff',
    glyph: '签',
    agent_description: {
      one_liner: '办公室主题的针位拆钉二创：只处理每根柱子的顶层夹签，三张同部门立刻整框归档。',
      core_loop: '玩家面对五根竖向夹签柱，只能处理每根柱子最上层那张部门夹签；第一次点击用于锁定当前顶层颜色，第二次点击同一根柱子就把它送进底部对应部门归档框；只要某个部门累计到三张就会立刻整框归档清空，而如果四个框位累计待处理量涨到六张则失败。',
      controls: '单指点击任意夹签柱最上层标签进行“选中 -> 拆下”两段操作；点到空白区域会取消选中；点击“重开这一盘”恢复固定牌面。',
      mechanics: [
        '只拆顶层：任何时候都只能操作每根柱子最上面露出的那张夹签，保留 Screwdom 最核心的顺序压力',
        '同色整框：底部每个部门框最多先暂存两张，第三张入框时立即整框清空，形成明确节奏点',
        '有限待处理：四个部门框的待清总量达到六张就失败，迫使玩家提前规划颜色顺序',
        '纯针位堆叠：没有额外道具、移动或 meta，只靠竖向堆叠和底部箱位制造短线策略',
        '固定短局：五根柱、十七张夹签的固定牌面几十秒内即可复盘一轮'
      ],
      visual_language: '深蓝办公室夜班底色，竖向针柱和部门夹签取代工业螺丝模型，底部四个归档框保持纯色和大字标签，继续遵守单文件竖屏契约。',
      state_model: 'state.pins 保存五根夹签柱当前的颜色栈；state.selected 记录是否已锁定某根柱子的顶层；state.bins 保存四个部门框当前待清数量；state.removed 记录已归档总数；state.mode 为 playing/won/lost。',
      share_hook: '“这盘归档又被客服签卡死了”这种结果文案很像办公室段子，适合继续往工位主题扩。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入第二块更深的夹签柱牌面', '加入一步撤销', '加入每日固定 seed 与最优步数文案']
    },
  },
  {
    game: officePixelRemixGame,
    id: 'remix-overtime-pixel-loop',
    slug: 'overtime-pixel-loop',
    title: '加班像素回路',
    source_file: 'pixel-loop-fake.html',
    parent_slug: 'pixel-loop-fake',
    lineage: ['pixel-loop-fake', 'overtime-pixel-loop'],
    prompt: { text: '把 Pixel Flow 式像素环流局改成夜班工位主题，彩块换成邮件、表格、会议和报销，保留实时堵槽压力。', voice_transcript: '' },
    summary: '夜班工位主题的像素环流二创：处理头同色消件，五个夜班槽一旦报废就会堵死全局。',
    accent: '#6ee7ff',
    glyph: '班',
    agent_description: {
      one_liner: '夜班工位主题的像素环流二创：处理头同色消件，五个夜班槽一旦报废就会堵死全局。',
      core_loop: '玩家面对一条绕着像素任务板循环移动的杂务环带，持续把当前处理头部署到下方空槽；已部署处理头会自动拦截同色工单并点亮中间像素板，电量耗尽后会变成废槽，需要玩家手动清走；在堆单上限与五格废槽之间维持平衡，直到整块像素板被点亮。',
      controls: '点击下方空槽部署当前处理头；点击已报废槽位可立刻清槽；点击“重开这一环”恢复固定循环序列。',
      mechanics: [
        '实时环带：工单沿固定路径持续绕圈，拖久就会形成稳定压迫',
        '同色自动拦截：处理头只会清掉自己颜色的工单，玩家要先分配有限槽位',
        '五格堵槽：每个处理头只有固定电量，用尽会占住槽位，全部报废会直接失败',
        '像素点亮：每次正确拦截都会把中间任务板点亮一格，形成清晰的进度反馈',
        '固定序列短局：颜色与来件顺序是确定的，天然适合反复复盘最优部署节奏'
      ],
      visual_language: '夜班工位主题，深蓝黑底、冷青发光环带，中间像素板像发亮任务屏，颜色字块全部原创且无外部素材。',
      state_model: 'state.carriers 保存环带工单的颜色与位置；state.slots 记录五个处理槽的颜色、电量与报废状态；state.nextColor 为待部署处理头；state.overflow 是漏件计数；state.painted 记录已点亮像素格。',
      share_hook: '“我把整块加班像素屏一把点亮了”这种结果很适合做短视频封面或截图。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入更长的环带与多层像素图', '加入一次性清槽道具', '加入每日工单 seed 与极限分数']
    },
  },
  {
    game: lunchMergeRemixGame,
    id: 'remix-lunchbox-merge-pot',
    slug: 'lunchbox-merge-pot',
    title: '午饭合成锅',
    source_file: 'brainrot-merge-pot.html',
    parent_slug: 'brainrot-merge-pot',
    lineage: ['brainrot-merge-pot', 'lunchbox-merge-pot'],
    prompt: { text: '把脑腐梗怪改成午饭配菜版，保留合成大西瓜式掉落手感和翻锅警戒线。', voice_transcript: '' },
    summary: '午饭配菜主题的掉落合成锅：同类碰撞升级，越堆越大，别越过打包线。',
    accent: '#5eead4',
    glyph: '饭',
    agent_description: {
      one_liner: '午饭配菜主题的掉落合成锅：同类碰撞升级，越堆越大，别越过打包线。',
      core_loop: '玩家在锅口上方左右瞄准，把当前配菜球投进容器；球体会在重力与碰撞下滚动堆叠，两颗同级食材接触后合成为更大一级；持续叠高直到触碰上方打包线即失败，分数来自每次升级合成。',
      controls: '手指在锅口上方移动改变预览落点；点击屏幕把当前食材投下；点“重开这一锅”重置局面。',
      mechanics: [
        '顶部投放：始终只有一个当前球与一个下一球提示，决策节奏非常快',
        '刚体堆叠：球体受重力、边界与相互挤压影响，会自然滚动寻找缝隙',
        '同级升级：只有相同等级球体能合成为更大一档，形成连锁空间管理',
        '翻锅失败：稳定堆叠高度越过警戒线并维持一段时间即结束',
        '短回合复玩：单局几十秒即可结束，天然适合反复开新局冲更高合成链'
      ],
      visual_language: '便当午饭主题，冷青锅体配暖色食材，顶部虚线改成打包线，所有球面只用单字标签和纯色圆形表达，保持离线单文件的轻量感。',
      state_model: 'state.pieces 保存所有活跃球体的 tier、位置、速度与合成冷却；state.next 是下一个食材等级；state.hold 记录危险线停留时长；state.mode 为 aiming/falling/lost。',
      share_hook: '“今天午饭合成到盒饭王了吗”这种结果文案天然能截图传播。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入连续合成 bonus', '加入每日固定投放序列', '加入锅体皮肤与结果卡']
    },
  },
  {
    game: officeRaiderRemixGame,
    id: 'remix-office-raider-yard',
    slug: 'office-raider-yard',
    title: '工位摸鱼盘',
    source_file: 'brainrot-raider-yard.html',
    parent_slug: 'brainrot-raider-yard',
    lineage: ['brainrot-raider-yard', 'office-raider-yard'],
    prompt: { text: '把偷家脑腐怪改成工位杂物主题，保留生单位、拖拽合成、产币和定时防偷。', voice_transcript: '' },
    summary: '工位杂物主题的偷家合成盘：摆物件、拖同类升级、挂机摸鱼，还得拦住巡查经理。',
    accent: '#22f4ee',
    glyph: '盘',
    agent_description: {
      one_liner: '工位杂物主题的偷家合成盘：摆物件、拖同类升级、挂机摸鱼，还得拦住巡查经理。',
      core_loop: '玩家用摸鱼币不断往工位盘里摆进便签、咖啡杯和表格等低阶杂物，再把两个同类拖到一起升级成更值钱的大件；工位会持续自动产出摸鱼币，但每隔一段时间巡查经理都会来收走最低阶物件，玩家必须在倒计时结束前按下拦截按钮，否则节奏会被打断。',
      controls: '点击“摆一件”消耗货币生成新物件；按住并拖动物件，把同级物件拖到一起完成合成；巡查经理弹窗出现时点“拦截小偷”；点击“重开这块场”重置局面。',
      mechanics: [
        '生成单位：花费随场上单位数上涨，逼玩家平衡扩张速度',
        '拖拽合成：只有同级物件可以合成，合成后会直接抬高秒产',
        '挂机产币：每个物件每秒稳定产出，形成明确的养成坡度',
        '定时防偷：巡查经理总是盯最低阶物件，形成轻度实时打断',
        '格子解锁：随着合成次数增长，工位盘会逐步开放更多位置'
      ],
      visual_language: '夜班工位主题，深青背景加冷色霓虹，圆形单位改成工位杂物徽章，保持离线单文件和手机竖屏的轻量手感。',
      state_model: 'state.units 保存每个单位的 tier 与 slot；state.coins 与 totalIncome 组成养成经济；state.raid 记录当前巡查事件；state.slotCount 控制已解锁工位数。',
      share_hook: '“经理一来我就被偷走三杯咖啡”这种结果文案很适合做轻吐槽截图。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入更强偷家事件', '加入随机 buff 物件', '加入结果卡和最高摸鱼币排行']
    },
  },
  {
    game: officeEggRemixGame,
    id: 'remix-office-egg-run',
    slug: 'office-egg-run',
    title: '快递柜摸鱼蛋',
    source_file: 'brainrot-egg-run.html',
    parent_slug: 'brainrot-egg-run',
    lineage: ['brainrot-egg-run', 'office-egg-run'],
    prompt: { text: '把 Collect Brainrot Egg 的买蛋-拖回基地-孵化产币-偷蛋窗口改成办公室快递盲盒题材，保持单屏小循环。', voice_transcript: '' },
    summary: '办公室快递盲盒二创：拿盒、拖回工位拆、持续产币，再截胡隔壁加急件。',
    accent: '#34d399',
    glyph: '件',
    agent_description: {
      one_liner: '办公室快递盲盒二创：拿盒、拖回工位拆、持续产币，再截胡隔壁加急件。',
      core_loop: '玩家先花摸鱼币从快递柜传送带拿盲盒，把盒子直接拖回下方空工位开始拆；拆开的办公室摆件会持续产出摸鱼币，用于购买更高一级的盒子；与此同时，隔壁工区会周期性刷新一颗可截胡的加急件，玩家需要在窗口打开时点按钮把它拖走，补足高阶收益。',
      controls: '点击“拿一盒”购买当前盒子；按住传送带或截胡区里的盒子并拖到下方空工位；窗口亮起时点击“截胡隔壁件”抢下高阶包裹；点击“重开这条线”恢复开局。',
      mechanics: [
        '双传送带来源：上方固定是自购快递柜，另一条则是周期性出现的截胡窗口',
        '拖回工位：盒子必须放进空工位里才会开始拆，保留原作“买回来还得带回家”的手感',
        '定时孵化产币：每个工位都有独立拆盒进度，完成后转成稳定秒产摆件',
        '高阶解锁：随着场上摆件增加，自购盒子和截胡件会逐步升阶，复刻增长斜坡',
        '满位取舍：三格工位很快会塞满，错过腾位时截胡件会直接折现，形成短期策略点'
      ],
      visual_language: '办公室快递柜主题，深青背景配薄荷绿高光，蛋和怪物都改成快递盒与工位摆件，用纯色图形和单字符号保持离线单文件轻量感。',
      state_model: 'state.eggs 保存传送带或工位中的盲盒、来源与拆盒进度；state.units 记录已拆出的摆件 tier 与工位位置；state.coins 和 incomeTotal 构成养成经济；state.raidTimer 驱动隔壁加急件窗口。',
      share_hook: '“工位满了只能眼看加急件折现”这种办公室失败瞬间很适合截图传播。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入工位扩容槽位', '加入随机主管巡楼打断', '加入盲盒图鉴和最高摸鱼币成绩']
    },
  },
  {
    game: courierArrowRemixGame,
    id: 'remix-courier-arrow-rush',
    slug: 'courier-arrow-rush',
    title: '快递箭阵',
    source_file: 'arrow-escape-fake.html',
    parent_slug: 'arrow-escape-fake',
    lineage: ['arrow-escape-fake', 'courier-arrow-rush'],
    prompt: { text: '把拔箭逃生改成快递分拣主题，保留从外层剥到内层的单指解谜节奏。', voice_transcript: '' },
    summary: '快递分拣主题的箭块解谜：外层先出站，给中间箭道腾路线。',
    accent: '#fbbf24',
    glyph: '站',
    agent_description: {
      one_liner: '快递分拣主题的箭块解谜：外层先出站，给中间箭道腾路线。',
      core_loop: '玩家点击一枚朝出口方向没有阻挡的箭块，它会立刻从站台飞出；外层箭先清走后，中层与内层才会逐步露出通路；误点被挡住的箭会消耗一次容错，三次用完即失败。',
      controls: '单指点击箭块尝试出站；按钮“重开这一局”重置固定棋盘。',
      mechanics: [
        '单向出站：箭块只能沿自己的朝向笔直离场，不允许转弯',
        '外层剥离：外缘可行动作会逐步打开内层路径，形成连续爽点',
        '有限容错：错误点击会立刻消耗机会，逼玩家先看后点',
        '固定短局：同一面板十几秒到几十秒就能跑完一局，很适合连刷'
      ],
      visual_language: '分拣站台主题，蜂蜜黄与深棕色面板，箭块像站内分流牌，整体保留单屏轻量气质。',
      state_model: 'state.tiles 保存每枚箭块的网格坐标、朝向与激活状态；state.hearts 记录剩余容错；state.cleared 记录已出站数量；state.mode 为 playing/won/lost。',
      share_hook: '“我一把没压单清完快递箭阵”这种结果很适合截图。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入每日面板 seed', '加入传送带障碍', '加入连清评级文案']
    },
  },
  {
    game: officeHopRemixGame,
    id: 'remix-office-hop-stack',
    slug: 'office-hop-stack',
    title: '工牌踩箱梯',
    source_file: 'emoji-gator-hop.html',
    parent_slug: 'emoji-gator-hop',
    lineage: ['emoji-gator-hop', 'office-hop-stack'],
    prompt: { text: '把 TikTok 隐藏表情跳跃游戏改成夜班工位主题，保留自动弹跳、易碎台、危险台和表情/道具冲刺。', voice_transcript: '' },
    summary: '夜班工位主题的纵向跳跃二创：托盘接跳、破箱会塌、咖啡徽章给一次猛冲。',
    accent: '#7dd3fc',
    glyph: '梯',
    agent_description: {
      one_liner: '夜班工位主题的纵向跳跃二创：托盘接跳、破箱会塌、咖啡徽章给一次猛冲。',
      core_loop: '玩家控制一个工牌徽章在一串向上排列的文件托盘和纸箱间自动回弹，只需要左右接下一个落点；普通托盘稳定回弹，破箱只会承重一次，灰色危险托盘会直接让本局结束，而漂浮的咖啡徽章会把角色猛冲到更高的楼层。',
      controls: '单指左右拖动控制落点，角色落到平台就会自动弹起；点击“重开这一跳”回到固定开局节奏。',
      mechanics: [
        '自动弹跳：保留社交 App 彩蛋小游戏那种零学习成本，上手即玩',
        '纵向追镜头：镜头始终追着最高点走，失误掉屏就结束，短局复玩很强',
        '一次性破箱：黄箱踩过就塌，逼玩家及时横移换线',
        '危险托盘：灰色骷髅托盘碰到即死，保留原始玩法的明确惩罚点',
        '加速徽章：漂浮咖啡徽章提供强上冲，复刻原作里表情/道具触发的爽点'
      ],
      visual_language: '把绿色鳄梯换成冷色工位托盘和纸箱，角色改成工牌徽章，保持单屏纵向跳跃和社交彩蛋游戏的轻量感。',
      state_model: 'state.player 保存横向位置、纵向速度和当前冲刺尾迹；state.platforms 记录不同平台类型与是否已损坏；state.pickups 记录漂浮咖啡徽章；state.cameraY 决定纵向追踪镜头；state.score 与 combo 管理当前高度与连踩表现。',
      share_hook: '“夜班工牌连踩 80 层才掉下去”这种成绩天然适合截图分享。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入每日固定平台 seed', '加入好友最高层文案', '加入冲刺后短暂无敌特效']
    },
  },
  {
    game: milkTeaSortRemixGame,
    id: 'remix-milk-tea-sorter',
    slug: 'milk-tea-sorter',
    title: '奶茶封杯局',
    source_file: 'marble-sort-fake.html',
    parent_slug: 'marble-sort-fake',
    lineage: ['marble-sort-fake', 'milk-tea-sorter'],
    prompt: { text: '把 Marble Sort 式分色瓶改成奶茶备料台，保留选杯换杯的单指 sorting 节奏。', voice_transcript: '' },
    summary: '奶茶备料主题的换杯分拣局：把同料倒进空杯或同料顶层，直到每杯单色。',
    accent: '#f59e0b',
    glyph: '茶',
    agent_description: {
      one_liner: '奶茶备料主题的换杯分拣局：把同料倒进空杯或同料顶层，直到每杯单色。',
      core_loop: '玩家先点选一个顶部有配料的杯子，再点目标空杯或同色顶层杯，把顶部连续同类一次性倒过去；随着杯中层次逐步变纯，每个杯子最终只保留一种配料并装满四层即可过关。',
      controls: '单指点击杯子进行“选源杯 -> 选目标杯”；再次点击源杯可取消；点击“重开这一局”恢复固定牌面。',
      mechanics: [
        '单指换杯：一来一回只有两次点击，门槛极低',
        '连续倒料：源杯顶部连续同色会被成组移动，保留 Marble Sort 的真实手感',
        '目标约束：只能倒进空杯，或倒到同色顶层且有剩余容量的杯子',
        '固定短局：一面固定牌几十步内即可解完，天然适合碎片时间反复开局',
        '完成判定：所有非空杯都变成满四层单色后立刻通关'
      ],
      visual_language: '暖色奶茶门店备料台，玻璃试管替成封杯杯体，配料只用单字与纯色圆点表示，不使用任何外部素材。',
      state_model: 'state.tubes 是每个杯子的颜色栈；state.selected 记录当前源杯；state.moves 记录完成的倒料手数；state.mode 为 playing/won。',
      share_hook: '“今天把奶茶备料一把理顺了”这种结果很适合做短视频封面或截图。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入更多关卡 seed', '加入撤回一步', '加入封杯连击评级']
    },
  },
  {
    game: officeWoolRemixGame,
    id: 'remix-office-loom-sort',
    slug: 'office-loom-sort',
    title: '工位理线板',
    source_file: 'wool-sort-fake.html',
    parent_slug: 'wool-sort-fake',
    lineage: ['wool-sort-fake', 'office-loom-sort'],
    prompt: { text: '把 Wool Sort 式绕线分拣改成夜班工位理线主题，保留同色绕线和逐步显图，但把绣片换成工牌面板。', voice_transcript: '' },
    summary: '夜班工位主题的绕线分拣二创：先把四路线束理顺，再让工牌像素图完整亮出来。',
    accent: '#60a5fa',
    glyph: '线',
    agent_description: {
      one_liner: '夜班工位主题的绕线分拣二创：先把四路线束理顺，再让工牌像素图完整亮出来。',
      core_loop: '玩家先点选一卷顶部可见的线束，再把顶部连续同色的一组绕进空卷轴或同色顶层卷轴；只要某个卷轴被整理成满四层单色，这一路就会被视为归束完成，同时点亮上方工牌面板里对应颜色的像素绣块；当所有非空卷轴都变成单色满卷，整块图案也随之亮满，当前短局结束。',
      controls: '单指点击执行“选源卷轴 -> 选目标卷轴”；再次点击同一卷轴可取消；点击“重开这一绷”恢复固定牌面。',
      mechanics: [
        '单指绕线：操作门槛与热门 sort puzzle 一样低，保持两次点击完成一次转移',
        '连续同色搬运：源卷顶部连续同色会被整段搬走，完整保留原玩法最关键的读顶层手感',
        '目标约束：只能绕进空卷轴，或绕到同色顶层且仍有剩余容量的卷轴',
        '显图反馈：每理顺一路颜色，就会同步亮起一部分工牌像素图，强化“排序不只是清关而是在补图”的爽点',
        '固定短局：固定六卷牌面几十步内可解完，天然适合反复优化路径'
      ],
      visual_language: '深蓝夜班工位色板，卷轴像收线盘，预览区不再是手工绣片而是发光工牌像素面板，整体更像办公桌面的冷色收线工具。',
      state_model: 'state.spools 记录六个卷轴当前的颜色栈；state.selected 记录当前源卷轴；state.moves 记录排线手数；state.stitched 保存已经因归束而点亮的像素格；state.mode 在 playing/won 间切换。',
      share_hook: '“终于把工位理线板一次收干净了”这种结果文案很像打工人梗图，适合继续往办公室题材扩。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入更多像素图 seed', '加入撤回一步', '加入更长的五色线束局']
    },
  },
  {
    game: meetingGridlockGame,
    id: 'remix-meeting-gridlock',
    slug: 'meeting-gridlock',
    title: '会议室别挨着',
    source_file: 'zen-logic-fake.html',
    parent_slug: 'zen-logic-fake',
    lineage: ['zen-logic-fake', 'meeting-gridlock'],
    prompt: { text: '把佛系逻辑羊盘改成会议室座位安排：保留每行每列每色块唯一、且不能相邻的硬约束。', voice_transcript: '' },
    summary: '会议室座位版逻辑盘：按行列和分区排人，每块区域只能坐一位，还不能挨着。',
    accent: '#7cc8ff',
    glyph: '座',
    agent_description: {
      one_liner: '会议室座位版逻辑盘：按行列和分区排人，每块区域只能坐一位，还不能挨着。',
      core_loop: '玩家面对一个被划成六块区域的 6x6 座位盘，需要把六位参会人安排进不同格子里；每一行、每一列、每个色块区域都只能出现一位，而且任何两位都不能横竖或斜角相邻，直到整盘约束同时成立。',
      controls: '点击空格放下一位参会人；再点已放的人即可撤回；点到冲突格只会给出冲突原因，不会落子；点击“重开这盘”恢复空盘。',
      mechanics: [
        '行列唯一：每一行、每一列最终都只能保留一位参会人',
        '色块唯一：每个彩色分区也只能放一位，直接复刻热门逻辑盘的区域约束',
        '斜角禁贴：八方向相邻都算冲突，保留原作最关键的高压限制',
        '自动排除：已放角色会自动让同行、同列、同区和相邻格变灰，形成扫雷式排除反馈',
        '唯一候选提示：当某行、某列或某分区只剩一个可放点时，会被高亮提示，复刻“只剩一格就该落子”的爽点'
      ],
      visual_language: '把柔和小羊盘换成会议室座位图：冷色背景、彩色会议分区、圆点头像符号，仍旧保持单屏竖版和极简离线风格。',
      state_model: 'state.queens 保存当前已放角色的行列位置；forced 记录由行列分区推导出的唯一候选格；state.note 记录最近一次冲突或撤回提示；state.mode 在 playing/won 间切换。',
      share_hook: '“终于把这 6 个人排开了”天然像办公室梗图，适合做轻度传播和再二创。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入每日盘面 seed', '加入手动叉号笔记层', '加入完成步数或误触统计']
    },
  },
  {
    game: busJamNightRemixGame,
    id: 'remix-night-shift-shuttle',
    slug: 'night-shift-shuttle',
    title: '夜班摆渡车',
    source_file: 'bus-jam-fake.html',
    parent_slug: 'bus-jam-fake',
    lineage: ['bus-jam-fake', 'night-shift-shuttle'],
    prompt: { text: '把 Bus Jam 式乘客分流改成夜班园区摆渡车，乘客换成工牌队列，整体更冷更硬。', voice_transcript: '' },
    summary: '夜班园区主题的 Bus Jam 二创：点发对应班车，把门口这排工牌快速分流送走。',
    accent: '#8be9ff',
    glyph: '班',
    agent_description: {
      one_liner: '夜班园区主题的 Bus Jam 二创：点发对应班车，把门口这排工牌快速分流送走。',
      core_loop: '玩家面对四列堵在夜班园区门口的工牌队列，只能处理每列最靠门的那张；下方三辆不同组别的摆渡车持续轮换，点中某辆车后，它会立刻带走当前所有能直接上车的同组工牌，前排一空，后排人才会继续露头。',
      controls: '单指点击底部摆渡车发车；如果当前门口没有对应颜色的工牌，这辆车不会动；点击“重开这一班”恢复固定牌面。',
      mechanics: [
        '前排可见约束：只有每列最靠门的那张工牌是可操作对象，完整保留 Bus Jam 的“先清前排再露后排”压力',
        '同色批量上车：一辆摆渡车发出后，会把当前所有能直接登车的同组工牌连续带走，形成爽快的链式揭露',
        '三车轮换：底部始终只给三辆当前车，旧车发走后新车顶上，保留对颜色次序的短线决策',
        '堵死判负：如果露出来的工牌颜色和眼前三辆车全部不匹配，整站会直接卡死失败',
        '固定短局：单局十几秒到几十秒，天然适合碎片时间复玩和截图传播'
      ],
      visual_language: '把明亮通勤站换成冷色夜班园区：深蓝门岗、低饱和车灯、工牌标签替代普通乘客，整体更像凌晨换班的摆渡口。',
      state_model: 'state.lanes 保存四列门口队伍；state.buses 保存当前三个车位里的班车颜色、已载人数与发车动画；state.queueIndex 指向后续进站车辆；state.mode 在 playing/won/lost 间切换。',
      share_hook: '“夜班门口又堵住了”或者“这班摆渡我一把清完”都很像办公室段子，适合拿来做封面和二创。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入更长的发车队列', '加入每日门口 seed', '加入一键提示下一辆该先发哪台']
    },
  },
  {
    game: seatAwayOfficeRemixGame,
    id: 'remix-office-seat-scramble',
    slug: 'office-seat-scramble',
    title: '工位让一让',
    source_file: 'seat-away-fake.html',
    parent_slug: 'seat-away-fake',
    lineage: ['seat-away-fake', 'office-seat-scramble'],
    prompt: { text: '把 Seat Away 式挪座局改成办公室散场主题，乘客换成工牌，座椅换成工位椅，保留只沿箭头滑出通道的短线决策。', voice_transcript: '' },
    summary: '办公室主题的挪座二创：顺着箭头推开工椅，让整片工位区快速散场。',
    accent: '#8ae8ff',
    glyph: '座',
    agent_description: {
      one_liner: '办公室主题的挪座二创：顺着箭头推开工椅，让整片工位区快速散场。',
      core_loop: '玩家面对一块 5x5 的拥挤工位盘，每张工牌工椅都只允许沿箭头方向直线滑动；如果前方一路通到边缘，工位就会直接撤出场外，否则只能先滑到最近空位，为别的工位腾出通道；把整盘工位全部送出走道就算过关。',
      controls: '单指点击任意工位椅触发滑动；能直通边缘的会直接离场，被堵住但前方有空位的会先滑到空位；点击“重开这一层”恢复固定牌面。',
      mechanics: [
        '单向滑动：每张工椅都绑定一个固定箭头，只能沿这一方向直线移动',
        '直通即离场：如果从当前位置到边缘没有阻挡，这张椅子会直接滑出工位区',
        '先挪后通：被其他椅子挡住时，只能先滑到最近空位，慢慢给后排让道',
        '固定短局：固定八张椅子的牌面几十秒内就能反复尝试，天然适合碎片复玩',
        '清盘收尾：全部工椅离场后立刻出现散场提示，形成明确截图点'
      ],
      visual_language: '把原型里的乘客座位换成冷色办公室工位：深蓝地板、发光走道、彩色工牌椅背与极简箭头，整体更像夜班散场前的办公层。',
      state_model: 'state.seats 记录每张工椅的行列位置、箭头方向、标签与是否仍在场内；state.moves 统计推椅次数；state.mode 在 playing/won 间切换；render_game_to_text 会同时给出每张椅子下一步是 blocked/slide/exit。',
      share_hook: '“终于把这一层工位全清空了”天然是打工人梗图文案，也方便继续往更多办公室谜题扩。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入更多固定工位 seed', '加入一步撤回', '加入连续离场的散场连击文案']
    },
  },
  {
    game: parkingJamOfficeRemixGame,
    id: 'remix-overtime-carpool-jam',
    slug: 'overtime-carpool-jam',
    title: '下班拼车出库',
    source_file: 'parking-jam-fake.html',
    parent_slug: 'parking-jam-fake',
    lineage: ['parking-jam-fake', 'overtime-carpool-jam'],
    prompt: { text: '把 Parking Jam 式停车解堵改成办公室下班拼车主题，保留点车顺着车头滑出、先清门口短车再放后排长车的节奏。', voice_transcript: '' },
    summary: '办公室主题的 Parking Jam 二创：先疏通门口短车，再把下班拼车一台台放出园区。',
    accent: '#9be9d4',
    glyph: '车',
    agent_description: {
      one_liner: '办公室主题的 Parking Jam 二创：先疏通门口短车，再把下班拼车一台台放出园区。',
      core_loop: '玩家面对一层被晚班拼车塞满的园区车位，每台车都只会顺着自己的车头方向往前开；如果前方车道完全打通，它就会直接出库，否则会先往前蹭到最近空位，继续给后排班车让路；只有先放掉出口边的小车，后排长车和竖停班车才会逐步得到通道，直到整层全部清空。',
      controls: '单指点击任意拼车，车辆会立刻沿车头方向滑到尽头或直接出库；点击“重开这一层”恢复固定盘面。',
      mechanics: [
        '车头朝向约束：每台车只能顺着自己的朝向前进，保留 Parking Jam 最核心的堵点判断',
        '先滑再出：前方没完全打通时，车辆会先占住最近空位，为下一辆腾出链式通道',
        '长短车混排：两格与三格车辆同时出现，必须先处理占位最恶心的长车或门口短车',
        '多出口压力：盘边不只一个闸口，需要读懂每辆车更接近哪一侧才能快速放行',
        '固定短局：单盘十辆车、几十秒到一两分钟即可通掉，天然适合碎片时间反复试顺序'
      ],
      visual_language: '冷色夜班园区配色，普通车辆换成不同部门的拼车标签，出口做成发光闸口，保持单文件竖屏和纯画布停车场表现。',
      state_model: 'state.cars 记录每台车的行列、长度、朝向、颜色和是否仍在场内；state.selectedId 记录最近一次点中的车辆；state.moves 统计放车次数；state.escaped 统计已出库车辆；state.mode 在 playing/won 间切换。',
      share_hook: '“终于把这层下班拼车都放出去了”很像打工人段子，也方便继续往园区、仓储、校车等题材扩。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入更多固定停车盘面', '加入按出口分类的放行统计', '加入更长的三格班车组合']
    },
  },
  {
    game: factoryBoltJamRemixGame,
    id: 'remix-factory-bolt-jam',
    slug: 'factory-bolt-jam',
    title: '夜班进厂通车',
    source_file: 'traffic-bolt-jam.html',
    parent_slug: 'traffic-bolt-jam',
    lineage: ['traffic-bolt-jam', 'factory-bolt-jam'],
    prompt: { text: '把今天热门“挪车打螺丝”盘改成夜班进厂通车主题，保留点车顺车头挪位、先清门口短车再放后排长车。', voice_transcript: '' },
    summary: '进厂主题的挪车二创：先疏通闸口，再把班车一台台送进厂门。',
    accent: '#9ce8c4',
    glyph: '厂',
    agent_description: {
      one_liner: '进厂主题的挪车二创：先疏通闸口，再把班车一台台送进厂门。',
      core_loop: '玩家面对一层堵在厂门前的夜班班车，每台车都只会沿着自己的车头方向往前开；如果前方一路通到闸口，它就会直接滑进去，否则只能先蹭到最近空位，继续给别的班车腾路；只有先处理门口那几台短车和竖停小车，后排长车才会逐步打开通道，直到整层车都顺利进厂。',
      controls: '单指点击任意班车触发滑动；能直通闸口的会直接进厂，否则先滑到最近空位；点击“重开这一班”恢复固定盘面。',
      mechanics: [
        '车头朝向约束：每台车只能沿着自己的车头方向前进，保留热点挪车盘最关键的堵点判断',
        '先滑后通：当前路没完全打通时，车辆会先占住最近空位，制造连续腾位链条',
        '长短车混排：两格与三格班车并存，必须先动门口小车，后排长车才会真正松动',
        '多闸口读盘：三个不同边缘闸口同时存在，要读懂哪台车离哪个出口最近',
        '短局高复玩：固定十车盘面，几十秒到一两分钟就能完整试一轮，很适合碎片时间反复找顺序'
      ],
      visual_language: '把泛用停车场换成低照度夜班厂门，普通车辆换成班组标签和冷绿闸口灯，保留单文件竖屏与纯画布堵车解盘手感。',
      state_model: 'state.cars 记录每台车的行列、长度、朝向、标签和是否仍在场内；state.moves 统计进车次数；state.escaped 统计已进厂车辆；state.mode 在 playing/won 间切换；render_game_to_text 给出每台车当前下一步是 blocked/slide/exit。',
      share_hook: '“终于把这一班车全送进厂门了”天然带打工人梗感，也方便继续往园区、仓储、校门口等题材扩。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入第二套厂门盘面 seed', '加入按闸口分类的放行统计', '加入一步撤回或提示']
    },
  },
  {
    game: gooseRushRemixGame,
    id: 'remix-midnight-goose-rush',
    slug: 'midnight-goose-rush',
    title: '夜宵颠锅抓鸽王',
    source_file: 'goose-ladle.html',
    parent_slug: 'goose-ladle',
    lineage: ['goose-ladle', 'midnight-goose-rush'],
    prompt: { text: '把锅底三消做得更贴近抓大鹅的节奏：第一锅热身，第二锅立刻上强度，再把颠锅和露鹅做得更显眼。', voice_transcript: '' },
    summary: '夜宵锅主题的抓鹅二创版：先过热身锅，再进高压第二锅把鸽王抓出来。',
    accent: '#f97316',
    glyph: '锅',
    agent_description: {
      one_liner: '夜宵锅主题的抓鹅二创版：先过热身锅，再进高压第二锅把鸽王抓出来。',
      core_loop: '玩家先在第一锅里快速理解“三个相同即消除”的规则，捞出第一只鸽子后立刻进入第二锅，物件数量和遮挡层级同步上升，必须靠更谨慎的点选和有限次数的颠锅把锅底鸽王翻出来。',
      controls: '触摸点击最上层食材；当锅底露出鸽子时直接点它过关；点击“颠锅”打乱食材并压低部分遮挡层；第一锅结束后继续点同一按钮进入第二锅。',
      mechanics: [
        '两段式难度：第一锅是十几件食材的热身局，第二锅直接切到满盘高遮挡局',
        '七格暂存栏：点到的食材先进入下方格子，凑满三个同类立刻消除',
        '锅底目标：并非必须清空所有物件，只要让底部鸽子暴露并被点击就算过锅',
        '有限颠锅：每锅可用次数固定，颠锅会重排可见物并下压几件上层食材',
        '倒计时压迫：热身锅和第二锅各自独立计时，第二锅在更短容错里放大失误感'
      ],
      visual_language: '夜宵摊锅底气质，暖橙锅面配深棕背景，食材图标都压成简化单色图形，保持离线单文件的轻量感，同时把露鹅提示做成更醒目的锅底字幕。',
      state_model: 'state.levelIndex 标记当前是第几锅；state.tiles 记录现存食材的图标、坐标、层级和激活状态；state.tray 为七格暂存栏；state.timeLeft 与 state.shakes 管理每锅的高压资源；state.mode 在 playing/between/won/lost 间切换。',
      share_hook: '“第一锅随便过，第二锅卡成狗”是这个类型天然的传播点，这版结果文案就围绕两锅反差来写。',
      known_constraints: ['离线单文件', '移动竖屏优先', '无外链素材', '保持 printer artifact 契约'],
      next_evolution_hooks: ['加入每日锅面 seed', '加入省份/好友对战文案', '加入锅内食材轻微物理滚动以更贴近原作颠锅感']
    },
  },
];

const games = [
  screwBaseGame,
  screwBoxBaseGame,
  screwdomBaseGame,
  brainrotMergeGame,
  brainrotRaiderGame,
  brainrotEggGame,
  arrowEscapeGame,
  emojiHopperGame,
  zenLogicBaseGame,
  marbleSortGame,
  woolSortBaseGame,
  pixelFlowGame,
  busJamBaseGame,
  seatAwayBaseGame,
  parkingJamBaseGame,
  trafficBoltJamBaseGame,
  colorBlockJamBaseGame,
  tapAwayBaseGame,
  loopSortBaseGame,
  hexaAwayBaseGame,
  hexaSortBaseGame,
  tripleMatchBaseGame,
  {
    id: 'sbti-fake',
    file: 'sbti-fake.html',
    title: '伪 SBTI 崩溃人格测评',
    kind: '测评',
    sourceGame: 'SBTI / MBTI 式社交测评',
    accent: '#ff4f87',
    summary: '八题生成荒诞人格结果卡，适合截图分享。',
    markup: `
      <section class="panel quiz-panel">
        <div class="meter"><i id="progressBar"></i></div>
        <p class="kicker" id="quizStep">QUESTION 1</p>
        <h2 id="questionText"></h2>
        <div class="stack" id="options"></div>
        <div id="resultCard" class="result-card hidden">
          <p class="kicker">RESULT</p>
          <h2 id="resultType"></h2>
          <p id="resultCopy"></p>
          <div class="bars" id="scoreBars"></div>
          <button class="primary" id="restartBtn">重新测</button>
        </div>
      </section>
    `,
    script: `
      const questions = [
        ['群聊突然安静，你会？', [['发更尴尬的表情包','chaos'],['关掉通知','void'],['复盘谁说错话','control'],['问要不要点奶茶','labor']]],
        ['老板说“这个很简单”，你会？', [['写三页风险','control'],['先答应晚上崩','labor'],['假装没看到','void'],['命名为史诗副本','chaos']]],
        ['朋友求你砍一刀，你会？', [['顺手拉三个群','labor'],['研究概率模型','control'],['说手机没电','void'],['成立互害联盟','chaos']]],
        ['外卖迟到 40 分钟，你会？', [['安慰骑手','labor'],['写差评但不发','void'],['复盘调度系统','control'],['当成修行','chaos']]],
        ['你的人生主线像？', [['修所有电脑','labor'],['管理时间线','control'],['脑内开会躺平','void'],['随机事件暴击','chaos']]],
        ['看到限时福利，你会？', [['立刻点进去','chaos'],['看昨天是否也限时','control'],['截图吐槽','void'],['帮家人领','labor']]],
        ['你最不能拒绝？', [['别人说就你会','labor'],['混乱表格','control'],['没人找你的床','void'],['无意义但好笑','chaos']]],
        ['明天世界末日，今晚？', [['列执行表','control'],['帮朋友收尾','labor'],['睡觉','void'],['抽签决定遗言','chaos']]]
      ];
      const types = {
        labor: ['MALO 打工猴', '你会接住别人的烂摊子，还顺手擦干净桌面。优点是可靠，缺点是太可靠。'],
        control: ['CTRL 控场怪', '混乱一出现，你的灵魂就自动打开项目管理软件。你不是想控制大家，只是看不得按钮没对齐。'],
        void: ['DEAD 省电模式', '你不是没有情绪，你只是把它们压缩进“算了”文件夹。'],
        chaos: ['WOW 抽象发生器', '你的人生像没有异常处理的脚本，报错很多，但围观群众确实开心。']
      };
      const state = { index: 0, scores: { labor: 0, control: 0, void: 0, chaos: 0 }, result: null };
      function renderQuiz() {
        const q = questions[state.index];
        document.getElementById('resultCard').classList.add('hidden');
        document.getElementById('quizStep').textContent = 'QUESTION ' + (state.index + 1) + ' / ' + questions.length;
        document.getElementById('questionText').textContent = q[0];
        document.getElementById('progressBar').style.width = (state.index / questions.length * 100) + '%';
        const options = document.getElementById('options');
        options.innerHTML = '';
        q[1].forEach((opt, i) => {
          const button = document.createElement('button');
          button.className = 'choice';
          button.textContent = String.fromCharCode(65 + i) + '. ' + opt[0];
          button.addEventListener('click', () => {
            state.scores[opt[1]] += 1;
            state.index += 1;
            state.index >= questions.length ? showResult() : renderQuiz();
          });
          options.appendChild(button);
        });
      }
      function showResult() {
        let winner = 'labor';
        Object.keys(state.scores).forEach((key) => { if (state.scores[key] > state.scores[winner]) winner = key; });
        state.result = winner;
        document.getElementById('progressBar').style.width = '100%';
        document.getElementById('questionText').textContent = '测评结束';
        document.getElementById('options').innerHTML = '';
        document.getElementById('resultCard').classList.remove('hidden');
        document.getElementById('resultType').textContent = types[winner][0];
        document.getElementById('resultCopy').textContent = types[winner][1];
        document.getElementById('scoreBars').innerHTML = Object.keys(state.scores).map((key) => '<span><b>' + key + '</b><i style="width:' + (state.scores[key] * 18 + 18) + '%"></i></span>').join('');
      }
      document.getElementById('restartBtn').addEventListener('click', () => {
        state.index = 0; state.result = null;
        Object.keys(state.scores).forEach((key) => state.scores[key] = 0);
        renderQuiz();
      });
      renderQuiz();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({ coordinate_system: 'DOM quiz flow', mode: state.result ? 'result' : 'question', index: state.index, scores: state.scores, result: state.result });
    `,
  },
  {
    id: 'sheep-stack',
    file: 'sheep-stack.html',
    title: '羊块堆堆消',
    kind: '消除',
    sourceGame: '羊了个羊式堆叠三消',
    accent: '#30b36b',
    summary: '只点亮牌，三张同图标入槽即消，槽满失败。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="tray" id="tray"></div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">重开今日关</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      window.__SHEEP_DEBUG_LEVEL__ = ${JSON.stringify(sheepLevel)};
      const SHEEP_LEVEL = window.__SHEEP_DEBUG_LEVEL__;
      const SHEEP_TILE_W = SHEEP_LEVEL.tileWidth;
      const SHEEP_TILE_H = SHEEP_LEVEL.tileHeight;
      const iconSet = {
        bag: { label: '包', emoji: '🛍️', color: '#ef6f6c' },
        tea: { label: '茶', emoji: '🧋', color: '#9b6a44' },
        melon: { label: '瓜', emoji: '🍉', color: '#2ea44f' },
        shoe: { label: '鞋', emoji: '👟', color: '#4d7cff' },
        cake: { label: '饼', emoji: '🥮', color: '#c88b32' },
        fish: { label: '鱼', emoji: '🐟', color: '#3aa7c9' }
      };
      const state = { tiles: [], tray: [], mode: 'playing', removed: 0 };
      function reset() {
        state.tiles = []; state.tray = []; state.mode = 'playing'; state.removed = 0;
        state.tiles = SHEEP_LEVEL.tiles.map((tile) => ({ ...tile, active: true }));
        render();
      }
      function rect(tile) {
        return { left: tile.x, top: tile.y, right: tile.x + SHEEP_TILE_W, bottom: tile.y + SHEEP_TILE_H };
      }
      function overlaps(a, b) {
        const ra = rect(a);
        const rb = rect(b);
        const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        return w > 0 && h > 0;
      }
      function free(tile) {
        return tile.active && !state.tiles.some((other) => other.active && other.z > tile.z && overlaps(tile, other));
      }
      function pick(tile) {
        if (!tile || state.mode !== 'playing' || !free(tile)) return;
        tile.active = false;
        state.tray.push(tile.icon);
        if (state.tray.filter((item) => item === tile.icon).length >= 3) {
          let count = 3;
          state.tray = state.tray.filter((item) => item !== tile.icon || count-- <= 0);
          state.removed += 3;
        }
        if (state.tiles.every((tile) => !tile.active)) state.mode = 'won';
        if (state.mode !== 'won' && state.tray.length >= 7) state.mode = 'lost';
        render();
      }
      function pointer(ev) {
        const rect = canvas.getBoundingClientRect();
        const x = (ev.clientX - rect.left) * canvas.width / rect.width;
        const y = (ev.clientY - rect.top) * canvas.height / rect.height;
        const top = state.tiles
          .filter((tile) => tile.active && x >= tile.x && x <= tile.x + SHEEP_TILE_W && y >= tile.y && y <= tile.y + SHEEP_TILE_H)
          .sort((a, b) => b.z - a.z)[0];
        pick(top);
      }
      canvas.addEventListener('pointerdown', pointer);
      function drawTileIcon(icon, cx, cy, enabled) {
        const color = iconSet[icon].color;
        ctx.save();
        ctx.globalAlpha = enabled ? 1 : 0.48;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';
        if (icon === 'bag') {
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.roundRect(cx - 14, cy - 8, 28, 22, 6); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy - 8, 9, Math.PI, 0); ctx.stroke();
        } else if (icon === 'tea') {
          ctx.fillStyle = '#fff4dc';
          ctx.beginPath(); ctx.roundRect(cx - 13, cy - 13, 26, 28, 5); ctx.fill(); ctx.stroke();
          ctx.fillStyle = color; ctx.fillRect(cx - 10, cy + 1, 20, 10);
          ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(cx + 8, cy - 18); ctx.lineTo(cx + 15, cy - 5); ctx.stroke();
        } else if (icon === 'melon') {
          ctx.fillStyle = '#2ea44f'; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ff6670'; ctx.beginPath(); ctx.arc(cx, cy, 11, 0.1, Math.PI - 0.1); ctx.fill();
          ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx - 4, cy + 3, 1.8, 0, Math.PI * 2); ctx.arc(cx + 4, cy + 5, 1.8, 0, Math.PI * 2); ctx.fill();
        } else if (icon === 'shoe') {
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.moveTo(cx - 17, cy + 8); ctx.lineTo(cx - 6, cy - 7); ctx.lineTo(cx + 8, cy - 3); ctx.quadraticCurveTo(cx + 20, cy + 3, cx + 18, cy + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - 2, cy - 1); ctx.lineTo(cx + 8, cy + 2); ctx.stroke();
        } else if (icon === 'cake') {
          ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffe3a3'; ctx.beginPath(); ctx.arc(cx - 5, cy - 4, 3, 0, Math.PI * 2); ctx.arc(cx + 6, cy + 3, 3, 0, Math.PI * 2); ctx.fill();
        } else if (icon === 'fish') {
          ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(cx - 2, cy, 15, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 23, cy - 9); ctx.lineTo(cx + 23, cy + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx - 8, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      function render() {
        ctx.fillStyle = '#09070d'; ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#22f4ee'; ctx.font = '800 16px sans-serif'; ctx.fillText(state.mode === 'playing' ? '点亮牌进槽' : (state.mode === 'won' ? '今日羊群代表' : '槽满了'), 18, 28);
        state.tiles.filter((tile) => tile.active).sort((a, b) => a.z - b.z).forEach((tile) => {
          const ok = free(tile);
          ctx.fillStyle = ok ? '#ff5d9b' : '#241624';
          ctx.strokeStyle = ok ? '#ffffff' : '#5d4b59';
          ctx.lineWidth = ok ? 2 : 1;
          ctx.beginPath(); ctx.roundRect(tile.x, tile.y, SHEEP_TILE_W, SHEEP_TILE_H, 8); ctx.fill(); ctx.stroke();
          drawTileIcon(tile.icon, tile.x + SHEEP_TILE_W / 2, tile.y + SHEEP_TILE_H / 2, ok);
        });
        document.getElementById('tray').innerHTML = Array.from({ length: 7 }, (_, i) => '<span>' + (state.tray[i] ? iconSet[state.tray[i]].emoji : '') + '</span>').join('');
        document.getElementById('statusText').textContent = '剩余 ' + state.tiles.filter((tile) => tile.active).length + ' · 可点 ' + state.tiles.filter(free).length + ' · 已消 ' + state.removed;
      }
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({ coordinate_system: 'canvas 390x560 origin top-left', mode: state.mode, tray: state.tray, remaining: state.tiles.filter((tile) => tile.active).length, free: state.tiles.filter(free).length, removed: state.removed });
    `,
  },
  {
    id: 'goose-ladle',
    file: 'goose-ladle.html',
    title: '摸鱼捞大鸽',
    kind: '堆叠',
    sourceGame: '抓大鹅式锅底寻物三消',
    accent: '#ff8a3d',
    summary: '先三消清锅面，再把藏在工位火锅底的鸽子捞出来。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="tray" id="tray"></div>
        <p id="statusText"></p>
        <div class="stack">
          <button class="primary" id="shakeBtn">颠锅 x2</button>
          <button class="choice" id="resetBtn">重开这锅</button>
        </div>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      window.__GOOSE_DEBUG_LEVEL__ = ${JSON.stringify(gooseLevel)};
      const GOOSE_LEVEL = window.__GOOSE_DEBUG_LEVEL__;
      const TILE_W = GOOSE_LEVEL.tileWidth;
      const TILE_H = GOOSE_LEVEL.tileHeight;
      const iconSet = {
        keyboard: { label: '键', color: '#6690ff' },
        coffee: { label: '啡', color: '#b06a39' },
        badge: { label: '卡', color: '#ff5c88' },
        mail: { label: '邮', color: '#35b0c9' },
        mouse: { label: '鼠', color: '#8b75ff' },
        battery: { label: '电', color: '#52b96f' }
      };
      const state = { tiles: [], tray: [], mode: 'playing', removed: 0, timeLeft: 52, shakes: 2, rescued: false, pulse: 0 };
      function rect(tile) {
        return { left: tile.x, top: tile.y, right: tile.x + TILE_W, bottom: tile.y + TILE_H };
      }
      function overlapsRect(a, b) {
        const ra = rect(a);
        const rb = rect(b);
        const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        return w > 0 && h > 0;
      }
      function overlapsGoose(tile) {
        const goose = GOOSE_LEVEL.goose;
        const tileCx = tile.x + TILE_W / 2;
        const tileCy = tile.y + TILE_H / 2;
        return Math.abs(tileCx - goose.x) < goose.radius + TILE_W * 0.38 && Math.abs(tileCy - goose.y) < goose.radius + TILE_H * 0.42;
      }
      function gooseFree() {
        return !state.tiles.some((tile) => tile.active && overlapsGoose(tile));
      }
      function free(tile) {
        return tile.active && !state.tiles.some((other) => other.active && other.z > tile.z && overlapsRect(tile, other));
      }
      function reset() {
        state.tiles = GOOSE_LEVEL.tiles.map((tile) => ({ ...tile, active: true }));
        state.tray = [];
        state.mode = 'playing';
        state.removed = 0;
        state.timeLeft = 52;
        state.shakes = 2;
        state.rescued = false;
        state.pulse = 0;
        render();
      }
      function resolveTriples(icon) {
        const count = state.tray.filter((item) => item === icon).length;
        if (count < 3) return;
        let removed = 0;
        state.tray = state.tray.filter((item) => {
          if (item === icon && removed < 3) {
            removed += 1;
            return false;
          }
          return true;
        });
        state.removed += 3;
        state.pulse = 1;
      }
      function pickTile(tile) {
        if (!tile || state.mode !== 'playing' || !free(tile)) return;
        tile.active = false;
        state.tray.push(tile.icon);
        resolveTriples(tile.icon);
        if (state.tray.length >= 7) state.mode = 'lost';
        render();
      }
      function rescueGoose() {
        if (state.mode !== 'playing' || !gooseFree()) return;
        state.rescued = true;
        state.mode = 'won';
        state.pulse = 1;
        render();
      }
      function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = arr[i];
          arr[i] = arr[j];
          arr[j] = tmp;
        }
      }
      function shakePan() {
        if (state.mode !== 'playing' || state.shakes <= 0) return;
        state.shakes -= 1;
        state.timeLeft = Math.max(6, state.timeLeft - 5);
        const layers = [0, 1, 2];
        layers.forEach((z) => {
          const active = state.tiles.filter((tile) => tile.active && tile.z === z);
          const slots = GOOSE_LEVEL.slots.filter((slot) => slot.z === z).map((slot) => ({ x: slot.x, y: slot.y }));
          shuffle(slots);
          active.forEach((tile, index) => {
            tile.x = slots[index].x;
            tile.y = slots[index].y;
          });
        });
        state.tiles
          .filter((tile) => tile.active && tile.z > 0)
          .sort((a, b) => b.z - a.z)
          .slice(0, 3)
          .forEach((tile) => { tile.z -= 1; });
        state.pulse = 1;
        render();
      }
      function pointer(ev) {
        const box = canvas.getBoundingClientRect();
        const x = (ev.clientX - box.left) * canvas.width / box.width;
        const y = (ev.clientY - box.top) * canvas.height / box.height;
        const goose = GOOSE_LEVEL.goose;
        if (gooseFree() && Math.hypot(x - goose.x, y - goose.y) <= goose.radius + 10) {
          rescueGoose();
          return;
        }
        const top = state.tiles
          .filter((tile) => tile.active && x >= tile.x && x <= tile.x + TILE_W && y >= tile.y && y <= tile.y + TILE_H)
          .sort((a, b) => b.z - a.z)[0];
        pickTile(top);
      }
      function step(ms) {
        if (state.mode !== 'playing') {
          render();
          return;
        }
        state.timeLeft = Math.max(0, state.timeLeft - ms / 1000);
        state.pulse = Math.max(0, state.pulse - ms / 900);
        if (state.timeLeft <= 0) state.mode = 'lost';
        render();
      }
      function drawIcon(icon, cx, cy) {
        const meta = iconSet[icon];
        ctx.save();
        ctx.translate(cx, cy);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#17121d';
        if (icon === 'keyboard') {
          ctx.fillStyle = meta.color;
          ctx.beginPath(); ctx.roundRect(-18, -12, 36, 24, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#edf3ff';
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
              ctx.fillRect(-12 + col * 7, -7 + row * 8, 4, 4);
            }
          }
        } else if (icon === 'coffee') {
          ctx.fillStyle = '#fff7ea';
          ctx.beginPath(); ctx.roundRect(-14, -10, 24, 22, 5); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = meta.color;
          ctx.beginPath(); ctx.arc(12, -1, 6, -Math.PI / 2, Math.PI / 2); ctx.stroke();
          ctx.fillStyle = meta.color; ctx.fillRect(-12, 2, 20, 8);
        } else if (icon === 'badge') {
          ctx.fillStyle = meta.color;
          ctx.beginPath(); ctx.roundRect(-13, -15, 26, 24, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.fillRect(-7, -8, 14, 5);
          ctx.fillStyle = '#ffdfe8';
          ctx.fillRect(-4, 0, 8, 14);
        } else if (icon === 'mail') {
          ctx.fillStyle = meta.color;
          ctx.beginPath(); ctx.roundRect(-17, -12, 34, 24, 5); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#fff';
          ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(0, 2); ctx.lineTo(16, -10); ctx.stroke();
        } else if (icon === 'mouse') {
          ctx.fillStyle = meta.color;
          ctx.beginPath(); ctx.roundRect(-11, -16, 22, 32, 11); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#fff';
          ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 1); ctx.stroke();
        } else if (icon === 'battery') {
          ctx.fillStyle = meta.color;
          ctx.beginPath(); ctx.roundRect(-17, -10, 30, 20, 4); ctx.fill(); ctx.stroke();
          ctx.fillRect(14, -5, 4, 10);
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(-2, -7); ctx.lineTo(5, -7); ctx.lineTo(0, 1); ctx.lineTo(7, 1); ctx.lineTo(-2, 12); ctx.lineTo(1, 4); ctx.lineTo(-6, 4);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      function drawGoose() {
        const goose = GOOSE_LEVEL.goose;
        ctx.save();
        ctx.translate(goose.x, goose.y + Math.sin((52 - state.timeLeft) * 3) * 2);
        ctx.globalAlpha = gooseFree() ? 1 : 0.3;
        ctx.fillStyle = gooseFree() ? '#fff3c4' : '#51453e';
        ctx.strokeStyle = '#211410';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 10, 28 + state.pulse * 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(15, -18, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff8a3d';
        ctx.beginPath(); ctx.moveTo(27, -18); ctx.lineTo(40, -13); ctx.lineTo(27, -7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#17121d';
        ctx.beginPath(); ctx.arc(18, -20, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      function render() {
        ctx.fillStyle = '#140d0a';
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#2a140d';
        ctx.beginPath(); ctx.roundRect(20, 18, 350, 64, 22); ctx.fill();
        ctx.fillStyle = '#fff8ef';
        ctx.font = '900 28px sans-serif';
        ctx.fillText(state.mode === 'won' ? '鸽到了' : '摸鱼捞大鸽', 32, 56);
        ctx.fillStyle = '#ffc69f';
        ctx.font = '700 13px sans-serif';
        ctx.fillText('热门锅底三消 · 剩 ' + state.tiles.filter((tile) => tile.active).length + ' 件 · ' + Math.ceil(state.timeLeft) + ' 秒', 32, 77);
        ctx.fillStyle = '#5a2612';
        ctx.beginPath(); ctx.arc(195, 298, 150, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7f3518';
        ctx.beginPath(); ctx.arc(195, 298, 126, 0, Math.PI * 2); ctx.fill();
        drawGoose();
        state.tiles.filter((tile) => tile.active).sort((a, b) => a.z - b.z).forEach((tile) => {
          const enabled = free(tile);
          const depthOffset = tile.z * 5;
          ctx.fillStyle = enabled ? '#ffe9d3' : '#695246';
          ctx.strokeStyle = enabled ? '#ffffff' : '#3d302a';
          ctx.lineWidth = enabled ? 2.2 : 1.2;
          ctx.beginPath(); ctx.roundRect(tile.x, tile.y - depthOffset, TILE_W, TILE_H, 10); ctx.fill(); ctx.stroke();
          drawIcon(tile.icon, tile.x + TILE_W / 2, tile.y + TILE_H / 2 - depthOffset, enabled);
          if (!enabled) {
            ctx.fillStyle = 'rgba(20,13,10,0.18)';
            ctx.fillRect(tile.x + 4, tile.y + 3 - depthOffset, TILE_W - 8, TILE_H - 8);
          }
        });
        if (gooseFree() && !state.rescued && state.mode === 'playing') {
          ctx.fillStyle = '#fff0cc';
          ctx.font = '900 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('锅底露出一只鸽子，点它带走', 195, 470);
          ctx.textAlign = 'left';
        }
        document.getElementById('tray').innerHTML = Array.from({ length: 7 }, (_, i) => '<span>' + (state.tray[i] ? iconSet[state.tray[i]].label : '') + '</span>').join('');
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? '你把锅面清空，还顺手捞走了摸鱼大鸽。'
          : state.mode === 'lost'
            ? (state.timeLeft <= 0 ? '超时翻车 · 鸽子已经飞了。' : '槽位爆了 · 工位杂物塞满了。')
            : '可点 ' + state.tiles.filter(free).length + ' · 已消 ' + state.removed + ' · 颠锅剩 ' + state.shakes;
        document.getElementById('shakeBtn').textContent = '颠锅 x' + state.shakes;
      }
      canvas.addEventListener('pointerdown', pointer);
      document.getElementById('shakeBtn').addEventListener('click', shakePan);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(() => step(200), 200);
      window.advanceTime = (ms) => step(ms);
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 origin top-left',
        mode: state.mode,
        tray: state.tray,
        remaining: state.tiles.filter((tile) => tile.active).length,
        free: state.tiles.filter(free).length,
        removed: state.removed,
        timeLeft: Number(state.timeLeft.toFixed(1)),
        shakes: state.shakes,
        gooseFree: gooseFree(),
        rescued: state.rescued
      });
    `,
  },
  {
    id: 'nostalgia-spotter',
    file: 'nostalgia-spotter.html',
    title: '怀旧穿帮找茬',
    kind: '找茬',
    sourceGame: '找茬大湿怀旧版式年代场景找不合理',
    accent: '#86f77b',
    summary: '在老教室里点出 7 个现代穿帮物件，点错会扣时间。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="countText">已找 0 / 7</b><span id="timerText">90 秒</span></div>
        <div class="chips" id="targetChips"></div>
        <p id="statusText">找出教室里所有不属于那个年代的东西。</p>
        <button class="primary" id="resetBtn">重开这张图</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const SPOTS = [
        { id: 'ring-light', label: '补光灯', x: 304, y: 154, r: 24, draw(cx, cy) {
          ctx.strokeStyle = '#f8fbff'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#445'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(cx, cy + 14); ctx.lineTo(cx - 7, cy + 27); ctx.moveTo(cx, cy + 14); ctx.lineTo(cx + 7, cy + 27); ctx.stroke();
        } },
        { id: 'qr-code', label: '二维码', x: 63, y: 168, r: 19, draw(cx, cy) {
          ctx.fillStyle = '#fff'; ctx.fillRect(cx - 12, cy - 12, 24, 24);
          ctx.fillStyle = '#111';
          [[-8,-8],[2,-8],[-8,2],[5,5],[-1,5],[5,-1],[-4,-1],[2,2]].forEach(([dx, dy]) => ctx.fillRect(cx + dx, cy + dy, 5, 5));
        } },
        { id: 'earbud', label: '耳机', x: 124, y: 362, r: 18, draw(cx, cy) {
          ctx.fillStyle = '#fafafa';
          ctx.beginPath(); ctx.arc(cx, cy - 4, 7, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.roundRect(cx - 3, cy + 2, 6, 12, 4); ctx.fill();
        } },
        { id: 'robot-vacuum', label: '扫地机', x: 322, y: 492, r: 25, draw(cx, cy) {
          ctx.fillStyle = '#20242c'; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#96ffe7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#8cf0d5'; ctx.beginPath(); ctx.arc(cx + 5, cy - 5, 2, 0, Math.PI * 2); ctx.fill();
        } },
        { id: 'energy-drink', label: '能量饮料', x: 219, y: 392, r: 18, draw(cx, cy) {
          ctx.fillStyle = '#2db6ff'; ctx.beginPath(); ctx.roundRect(cx - 8, cy - 15, 16, 30, 6); ctx.fill();
          ctx.fillStyle = '#c7f0ff'; ctx.fillRect(cx - 3, cy - 11, 6, 3);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 4, cy + 4); ctx.lineTo(cx + 4, cy - 6); ctx.lineTo(cx + 1, cy + 9); ctx.stroke();
        } },
        { id: 'selfie-stick', label: '自拍杆', x: 79, y: 438, r: 22, draw(cx, cy) {
          ctx.strokeStyle = '#2d3038'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - 12, cy + 12); ctx.lineTo(cx + 8, cy - 10); ctx.stroke();
          ctx.fillStyle = '#8ec7ff'; ctx.beginPath(); ctx.roundRect(cx + 2, cy - 18, 14, 11, 3); ctx.fill();
        } },
        { id: 'phone', label: '手机', x: 278, y: 332, r: 20, draw(cx, cy) {
          ctx.fillStyle = '#1f2630'; ctx.beginPath(); ctx.roundRect(cx - 10, cy - 16, 20, 32, 5); ctx.fill();
          ctx.fillStyle = '#8be4ff'; ctx.fillRect(cx - 7, cy - 11, 14, 20);
          ctx.fillStyle = '#dae2eb'; ctx.beginPath(); ctx.arc(cx, cy + 12, 2, 0, Math.PI * 2); ctx.fill();
        } },
      ];
      window.__NOSTALGIA_SPOTTER__ = {
        scene: 'late-90s classroom',
        differenceCount: SPOTS.length,
        spots: SPOTS.map(({ id, label, x, y, r }) => ({ id, label, x, y, r })),
      };
      const state = { found: [], foundOrder: [], mistakes: 0, timeLeft: 90, mode: 'playing', pulse: 0, scanlinePhase: 0, flash: 0 };
      function foundSet() {
        return new Set(state.found);
      }
      function reset() {
        state.found = [];
        state.foundOrder = [];
        state.mistakes = 0;
        state.timeLeft = 90;
        state.mode = 'playing';
        state.pulse = 0;
        state.scanlinePhase = 0;
        state.flash = 0;
        render();
      }
      function markFound(spot) {
        if (state.mode !== 'playing' || state.found.includes(spot.id)) return;
        state.found.push(spot.id);
        state.foundOrder.push(spot.id);
        state.pulse = 1;
        if (state.found.length >= SPOTS.length) state.mode = 'won';
        render();
      }
      function miss() {
        if (state.mode !== 'playing') return;
        state.mistakes += 1;
        state.timeLeft = Math.max(0, state.timeLeft - 6);
        state.flash = 1;
        if (state.timeLeft <= 0) state.mode = 'lost';
        render();
      }
      function pointer(ev) {
        const box = canvas.getBoundingClientRect();
        const x = (ev.clientX - box.left) * canvas.width / box.width;
        const y = (ev.clientY - box.top) * canvas.height / box.height;
        const target = SPOTS.find((spot) => !state.found.includes(spot.id) && Math.hypot(x - spot.x, y - spot.y) <= spot.r);
        if (target) markFound(target);
        else miss();
      }
      function step(ms) {
        state.scanlinePhase = (state.scanlinePhase + ms * 0.045) % 560;
        state.pulse = Math.max(0, state.pulse - ms / 700);
        state.flash = Math.max(0, state.flash - ms / 220);
        if (state.mode === 'playing') {
          state.timeLeft = Math.max(0, state.timeLeft - ms / 1000);
          if (state.timeLeft <= 0) state.mode = 'lost';
        }
        render();
      }
      function drawBackground() {
        const wall = ctx.createLinearGradient(0, 0, 0, 560);
        wall.addColorStop(0, '#d8b27d');
        wall.addColorStop(0.56, '#c28c4d');
        wall.addColorStop(1, '#83552a');
        ctx.fillStyle = wall;
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#5a3d1e';
        ctx.fillRect(0, 398, 390, 162);
        ctx.fillStyle = '#325a3d';
        ctx.fillRect(34, 72, 212, 110);
        ctx.strokeStyle = '#d8d4b6'; ctx.lineWidth = 5;
        ctx.strokeRect(34, 72, 212, 110);
        ctx.fillStyle = '#fff6cf'; ctx.font = '900 18px sans-serif';
        ctx.fillText('好好学习  天天向上', 58, 112);
        ctx.font = '700 13px sans-serif';
        ctx.fillText('值日生：小王 / 小李 / 小周', 56, 144);
        ctx.fillStyle = '#bcdcff';
        ctx.fillRect(270, 56, 84, 128);
        ctx.fillStyle = '#f5f1d8';
        ctx.fillRect(276, 62, 72, 116);
        ctx.fillStyle = '#8ec6ff';
        ctx.fillRect(281, 66, 28, 50);
        ctx.fillRect(315, 66, 28, 50);
        ctx.fillRect(281, 122, 28, 50);
        ctx.fillRect(315, 122, 28, 50);
        ctx.fillStyle = '#eef7ff';
        ctx.beginPath(); ctx.arc(324, 42, 18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6b4a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(324, 42); ctx.lineTo(324, 31); ctx.moveTo(324, 42); ctx.lineTo(334, 48); ctx.stroke();
        ctx.fillStyle = '#e6d2a1';
        ctx.fillRect(46, 210, 124, 54);
        ctx.fillRect(218, 224, 124, 54);
        ctx.fillRect(82, 310, 124, 54);
        ctx.fillRect(204, 290, 124, 54);
        ctx.fillRect(46, 414, 136, 60);
        ctx.fillRect(226, 414, 120, 60);
        ctx.fillStyle = '#8e6031';
        [[46,210,124,54],[218,224,124,54],[82,310,124,54],[204,290,124,54],[46,414,136,60],[226,414,120,60]].forEach(([x, y, w, h]) => {
          ctx.fillRect(x + 8, y + h, 10, 34);
          ctx.fillRect(x + w - 18, y + h, 10, 34);
        });
        ctx.fillStyle = '#c23f34';
        ctx.beginPath(); ctx.moveTo(22, 18); ctx.lineTo(110, 18); ctx.lineTo(98, 42); ctx.lineTo(22, 42); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f6ebcc'; ctx.font = '900 13px sans-serif'; ctx.fillText('怀旧找茬专场', 32, 34);
      }
      function drawStudents() {
        const heads = [[118, 281], [266, 296], [156, 381], [278, 362]];
        heads.forEach(([x, y], index) => {
          ctx.fillStyle = '#f1c287';
          ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = ['#26314a','#4a2e22','#303030','#5a3a2d'][index];
          ctx.beginPath(); ctx.arc(x, y - 4, 18, Math.PI, 0); ctx.fill();
          ctx.fillStyle = ['#5fa3ff','#ff8e7d','#7fd17d','#e8c25f'][index];
          ctx.beginPath(); ctx.roundRect(x - 20, y + 14, 40, 30, 10); ctx.fill();
        });
      }
      function drawSpotMarkers() {
        const found = foundSet();
        SPOTS.forEach((spot) => {
          spot.draw(spot.x, spot.y);
          if (found.has(spot.id)) {
            ctx.strokeStyle = '#ff4f87';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(spot.x, spot.y, spot.r + 4 + state.pulse * 3, 0, Math.PI * 2); ctx.stroke();
          }
        });
      }
      function drawHud() {
        ctx.fillStyle = 'rgba(16,8,4,.56)';
        ctx.beginPath(); ctx.roundRect(20, 18, 350, 42, 18); ctx.fill();
        ctx.fillStyle = '#fff8de'; ctx.font = '900 16px sans-serif';
        ctx.fillText('90 年代教室 · 找出现代穿帮', 34, 45);
        if (state.flash > 0) {
          ctx.fillStyle = 'rgba(255,79,135,' + (state.flash * 0.24).toFixed(3) + ')';
          ctx.fillRect(0, 0, 390, 560);
        }
        ctx.fillStyle = 'rgba(255,255,255,.07)';
        for (let i = 0; i < 30; i++) {
          const y = (i * 20 + state.scanlinePhase) % 560;
          ctx.fillRect(0, y, 390, 1);
        }
      }
      function render() {
        drawBackground();
        drawStudents();
        drawSpotMarkers();
        drawHud();
        document.getElementById('countText').textContent = '已找 ' + state.found.length + ' / ' + SPOTS.length;
        document.getElementById('timerText').textContent = Math.ceil(state.timeLeft) + ' 秒';
        document.getElementById('targetChips').innerHTML = SPOTS.map((spot) => {
          const found = state.found.includes(spot.id);
          return '<span class="' + (found ? 'chip active' : 'chip') + '">' + (found ? '已抓' : '待找') + ' ' + spot.label + '</span>';
        }).join('');
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? '你把整张怀旧图的 7 处穿帮都抓出来了。'
          : state.mode === 'lost'
            ? '时间耗尽，现代物件继续混进老照片。'
            : '点错扣 6 秒 · 已点错 ' + state.mistakes + ' 次';
      }
      canvas.addEventListener('pointerdown', pointer);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(() => step(200), 200);
      window.advanceTime = (ms) => step(ms);
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 origin top-left scene hunt',
        mode: state.mode,
        timeLeft: Number(state.timeLeft.toFixed(1)),
        found: state.found,
        foundOrder: state.foundOrder,
        remaining: SPOTS.filter((spot) => !state.found.includes(spot.id)).map((spot) => spot.label),
        mistakes: state.mistakes,
        differenceCount: SPOTS.length,
        scanlinePhase: Number(state.scanlinePhase.toFixed(1))
      });
    `,
  },
  {
    id: 'overtime-blocks',
    file: 'overtime-blocks.html',
    title: '加班方块清仓',
    kind: '拼盘',
    sourceGame: 'Block Blast 式 8x8 方块拼盘',
    accent: '#ff9a3d',
    summary: '三选一摆入 8x8 工位，清行清列打连击，放不下就下班。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="scoreText">得分 0</b><span id="comboText">连击 0</span></div>
        <p id="statusText">选底部方块，再点棋盘空位落下。</p>
        <button class="primary" id="resetBtn">重开这一轮</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const BOARD = 8;
      const CELL = 40;
      const BOARD_X = 35;
      const BOARD_Y = 76;
      const RACK_Y = 430;
      const seedBase = ${Number(generatedAt.slice(0, 10).replace(/-/g, ''))};
      const pieceDefs = [
        { id: 'dot', color: '#ffd166', cells: [[0,0]] },
        { id: 'line2', color: '#9bff7a', cells: [[0,0],[1,0]] },
        { id: 'line3', color: '#67e8f9', cells: [[0,0],[1,0],[2,0]] },
        { id: 'line4', color: '#5ea1ff', cells: [[0,0],[1,0],[2,0],[3,0]] },
        { id: 'square', color: '#ff7aa2', cells: [[0,0],[1,0],[0,1],[1,1]] },
        { id: 'L3', color: '#c084fc', cells: [[0,0],[0,1],[1,1]] },
        { id: 'L4', color: '#ff9f43', cells: [[0,0],[0,1],[0,2],[1,2]] },
        { id: 'zig', color: '#2dd4bf', cells: [[0,0],[1,0],[1,1],[2,1]] },
        { id: 'tee', color: '#f472b6', cells: [[0,0],[1,0],[2,0],[1,1]] },
        { id: 'plus', color: '#facc15', cells: [[1,0],[0,1],[1,1],[2,1],[1,2]] }
      ];
      const state = { board: [], rack: [], selected: -1, hover: null, score: 0, combo: 0, clears: 0, mode: 'playing', rng: seedBase };
      function rand() {
        state.rng = (state.rng * 1664525 + 1013904223) >>> 0;
        return state.rng / 4294967296;
      }
      function clonePiece(def) {
        return { id: def.id, color: def.color, cells: def.cells.map((cell) => cell.slice()) };
      }
      function nextPiece() {
        const bias = state.score > 900 ? 0.2 : 0;
        const pool = pieceDefs.filter((piece) => bias < 0.15 || piece.cells.length <= 4 || rand() > bias);
        return clonePiece(pool[Math.floor(rand() * pool.length)]);
      }
      function refillRack() {
        state.rack = [nextPiece(), nextPiece(), nextPiece()];
        state.selected = state.rack.findIndex(Boolean);
        if (state.selected < 0) state.selected = 0;
      }
      function reset() {
        state.board = Array.from({ length: BOARD }, () => Array(BOARD).fill(null));
        state.score = 0;
        state.combo = 0;
        state.clears = 0;
        state.mode = 'playing';
        state.hover = null;
        state.rng = seedBase;
        refillRack();
        if (!hasAnyMove()) state.mode = 'lost';
        render();
      }
      function rackRects() {
        return Array.from({ length: 3 }, (_, i) => ({ x: 24 + i * 120, y: RACK_Y, w: 102, h: 92 }));
      }
      function boardPoint(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = (clientX - rect.left) * canvas.width / rect.width;
        const y = (clientY - rect.top) * canvas.height / rect.height;
        return { x, y };
      }
      function hoverFromPoint(point, piece) {
        if (!piece) return null;
        const col = Math.floor((point.x - BOARD_X) / CELL);
        const row = Math.floor((point.y - BOARD_Y) / CELL);
        if (row < 0 || col < 0 || row >= BOARD || col >= BOARD) return null;
        return { row, col };
      }
      function fits(piece, row, col) {
        return piece.cells.every(([dx, dy]) => {
          const x = col + dx;
          const y = row + dy;
          return x >= 0 && y >= 0 && x < BOARD && y < BOARD && !state.board[y][x];
        });
      }
      function lineClears() {
        const rows = [];
        const cols = [];
        for (let row = 0; row < BOARD; row++) if (state.board[row].every(Boolean)) rows.push(row);
        for (let col = 0; col < BOARD; col++) {
          let full = true;
          for (let row = 0; row < BOARD; row++) if (!state.board[row][col]) full = false;
          if (full) cols.push(col);
        }
        return { rows, cols };
      }
      function clearLines(rows, cols) {
        rows.forEach((row) => {
          for (let col = 0; col < BOARD; col++) state.board[row][col] = null;
        });
        cols.forEach((col) => {
          for (let row = 0; row < BOARD; row++) state.board[row][col] = null;
        });
      }
      function hasAnyMove() {
        return state.rack.some((piece) => piece && canPlaceAnywhere(piece));
      }
      function canPlaceAnywhere(piece) {
        for (let row = 0; row < BOARD; row++) {
          for (let col = 0; col < BOARD; col++) {
            if (fits(piece, row, col)) return true;
          }
        }
        return false;
      }
      function afterMove() {
        if (state.rack.every((piece) => !piece)) refillRack();
        if (!hasAnyMove()) state.mode = 'lost';
      }
      function placeSelected(row, col) {
        const piece = state.rack[state.selected];
        if (!piece || state.mode !== 'playing' || !fits(piece, row, col)) return false;
        piece.cells.forEach(([dx, dy]) => {
          state.board[row + dy][col + dx] = { color: piece.color, id: piece.id };
        });
        const placedCells = piece.cells.length;
        const { rows, cols } = lineClears();
        const cleared = rows.length + cols.length;
        if (cleared) {
          clearLines(rows, cols);
          state.combo += 1;
          state.clears += cleared;
          state.score += placedCells * 5 + cleared * 80 + state.combo * 25;
        } else {
          state.combo = 0;
          state.score += placedCells * 5;
        }
        state.rack[state.selected] = null;
        const nextIndex = state.rack.findIndex(Boolean);
        state.selected = nextIndex >= 0 ? nextIndex : 0;
        state.hover = null;
        afterMove();
        render();
        return true;
      }
      function pickRack(point) {
        const rects = rackRects();
        const index = rects.findIndex((rect) => point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h);
        if (index >= 0 && state.rack[index]) {
          state.selected = index;
          state.hover = null;
          render();
          return true;
        }
        return false;
      }
      function onPointerMove(event) {
        if (state.mode !== 'playing') return;
        const point = boardPoint(event.clientX, event.clientY);
        const piece = state.rack[state.selected];
        state.hover = hoverFromPoint(point, piece);
        render();
      }
      function onPointerDown(event) {
        const point = boardPoint(event.clientX, event.clientY);
        if (pickRack(point)) return;
        const piece = state.rack[state.selected];
        const hover = hoverFromPoint(point, piece);
        if (hover && piece) {
          placeSelected(hover.row, hover.col);
          return;
        }
        state.hover = null;
        render();
      }
      function drawPiece(piece, ox, oy, scale, alpha, ghost) {
        if (!piece) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        piece.cells.forEach(([dx, dy]) => {
          const x = ox + dx * scale;
          const y = oy + dy * scale;
          ctx.fillStyle = ghost ? 'rgba(255,255,255,.18)' : piece.color;
          ctx.strokeStyle = ghost ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.18)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, scale - 4, scale - 4, 9);
          ctx.fill();
          ctx.stroke();
        });
        ctx.restore();
      }
      function drawBoard() {
        ctx.fillStyle = '#17111d';
        ctx.beginPath();
        ctx.roundRect(20, 60, 350, 350, 28);
        ctx.fill();
        for (let row = 0; row < BOARD; row++) {
          for (let col = 0; col < BOARD; col++) {
            const x = BOARD_X + col * CELL;
            const y = BOARD_Y + row * CELL;
            ctx.fillStyle = 'rgba(255,255,255,.06)';
            ctx.beginPath();
            ctx.roundRect(x, y, CELL - 3, CELL - 3, 10);
            ctx.fill();
            const block = state.board[row][col];
            if (block) drawPiece({ cells: [[0,0]], color: block.color }, x + 2, y + 2, CELL - 1, 1, false);
          }
        }
        const piece = state.rack[state.selected];
        if (piece && state.hover && fits(piece, state.hover.row, state.hover.col)) {
          drawPiece(piece, BOARD_X + state.hover.col * CELL + 2, BOARD_Y + state.hover.row * CELL + 2, CELL, 0.72, true);
        }
      }
      function drawRack() {
        rackRects().forEach((rect, index) => {
          const active = index === state.selected && state.rack[index];
          ctx.fillStyle = active ? 'rgba(255,154,61,.2)' : 'rgba(255,255,255,.06)';
          ctx.strokeStyle = active ? '#ffb36b' : 'rgba(255,255,255,.14)';
          ctx.lineWidth = active ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 22);
          ctx.fill();
          ctx.stroke();
          const piece = state.rack[index];
          if (piece) {
            const width = Math.max(...piece.cells.map(([dx]) => dx)) + 1;
            const height = Math.max(...piece.cells.map(([, dy]) => dy)) + 1;
            const scale = Math.min(22, Math.floor(58 / Math.max(width, height)));
            const ox = rect.x + (rect.w - width * scale) / 2 + 2;
            const oy = rect.y + (rect.h - height * scale) / 2 + 2;
            drawPiece(piece, ox, oy, scale, 1, false);
          } else {
            ctx.fillStyle = 'rgba(255,255,255,.18)';
            ctx.font = '900 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('已用', rect.x + rect.w / 2, rect.y + rect.h / 2 + 4);
            ctx.textAlign = 'left';
          }
        });
      }
      function render() {
        ctx.fillStyle = '#09070d';
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#2a1730';
        ctx.beginPath();
        ctx.roundRect(20, 16, 350, 34, 17);
        ctx.fill();
        ctx.fillStyle = '#fff8ef';
        ctx.font = '900 18px sans-serif';
        ctx.fillText('加班方块清仓', 32, 38);
        ctx.fillStyle = '#ffc78f';
        ctx.font = '700 12px sans-serif';
        ctx.fillText('热门拼盘复刻 · 8x8 工位 · 清行清列', 192, 38);
        drawBoard();
        drawRack();
        ctx.fillStyle = 'rgba(255,255,255,.62)';
        ctx.font = '800 12px sans-serif';
        ctx.fillText('候选方块', 24, 420);
        document.getElementById('scoreText').textContent = '得分 ' + state.score;
        document.getElementById('comboText').textContent = '连击 ' + state.combo;
        document.getElementById('statusText').textContent = state.mode === 'lost'
          ? '三个候选都放不下了，这轮工位已经塞满。'
          : (state.hover && state.rack[state.selected] && fits(state.rack[state.selected], state.hover.row, state.hover.col))
            ? '可落点：第 ' + (state.hover.row + 1) + ' 行，第 ' + (state.hover.col + 1) + ' 列。'
            : '选底部方块，再点棋盘空位落下。已清 ' + state.clears + ' 条线。';
      }
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerdown', onPointerDown);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 with 8x8 board and bottom rack',
        mode: state.mode,
        score: state.score,
        combo: state.combo,
        clears: state.clears,
        selected: state.selected,
        rack: state.rack.map((piece) => piece ? piece.id : null),
        occupied: state.board.flat().filter(Boolean).length
      });
    `,
  },
  {
    id: 'clock-out-jam',
    file: 'clock-out-jam.html',
    title: '下班工牌突围',
    kind: '挪块',
    sourceGame: 'Color Block Jam / Block Jam 式单屏堵塞解谜',
    accent: '#55d6ff',
    summary: '拖开会议和审批，把主工牌一路挪到出口，步数越少越像真会下班。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="row"><b id="moveText">步数 0</b><span id="bestText">目标 9 步内</span></div>
        <p id="statusText">拖动色块，让“下班工牌”从右侧出口溜出去。</p>
        <button class="primary" id="resetBtn">重开这一局</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const BOARD = 6;
      const CELL = 48;
      const BOARD_X = 51;
      const BOARD_Y = 120;
      const EXIT_ROW = 2;
      const palette = {
        badge: { fill: '#61dafb', edge: '#dbf6ff', label: '下班工牌' },
        meet: { fill: '#ff8e72', edge: '#ffd6ca', label: '会议' },
        deck: { fill: '#ffd166', edge: '#fff0bc', label: '汇报' },
        flow: { fill: '#a78bfa', edge: '#ece3ff', label: '审批' },
        sheet: { fill: '#44d39d', edge: '#cbffe8', label: '表格' },
        chat: { fill: '#ff6fae', edge: '#ffd8e8', label: '群聊' },
        bug: { fill: '#7ee081', edge: '#dafcdd', label: '线上 bug' },
      };
      const level = [
        { id: 'badge', type: 'badge', axis: 'h', len: 2, row: 2, col: 1 },
        { id: 'meet', type: 'meet', axis: 'v', len: 3, row: 0, col: 3 },
        { id: 'deck', type: 'deck', axis: 'v', len: 2, row: 0, col: 4 },
        { id: 'flow', type: 'flow', axis: 'h', len: 2, row: 1, col: 1 },
        { id: 'sheet', type: 'sheet', axis: 'v', len: 2, row: 3, col: 2 },
        { id: 'chat', type: 'chat', axis: 'h', len: 2, row: 4, col: 3 },
        { id: 'bug', type: 'bug', axis: 'v', len: 2, row: 3, col: 5 }
      ];
      const state = {
        blocks: [],
        moves: 0,
        mode: 'playing',
        selected: null,
        drag: null
      };
      function cloneBlocks() {
        return level.map((block) => ({ ...block }));
      }
      function reset() {
        state.blocks = cloneBlocks();
        state.moves = 0;
        state.mode = 'playing';
        state.selected = null;
        state.drag = null;
        render();
      }
      function occupancy(ignoreId) {
        const map = Array.from({ length: BOARD }, () => Array(BOARD).fill(null));
        state.blocks.forEach((block) => {
          if (block.id === ignoreId) return;
          for (let i = 0; i < block.len; i++) {
            const row = block.row + (block.axis === 'v' ? i : 0);
            const col = block.col + (block.axis === 'h' ? i : 0);
            map[row][col] = block.id;
          }
        });
        return map;
      }
      function blockRect(block) {
        return {
          x: BOARD_X + block.col * CELL,
          y: BOARD_Y + block.row * CELL,
          w: (block.axis === 'h' ? block.len : 1) * CELL - 6,
          h: (block.axis === 'v' ? block.len : 1) * CELL - 6
        };
      }
      function pointFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height
        };
      }
      function findBlock(point) {
        return state.blocks.findLast((block) => {
          const rect = blockRect(block);
          return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
        }) || null;
      }
      function travelBounds(block) {
        const map = occupancy(block.id);
        let min = 0;
        let max = 0;
        if (block.axis === 'h') {
          let left = block.col - 1;
          while (left >= 0 && !map[block.row][left]) {
            min -= 1;
            left -= 1;
          }
          let right = block.col + block.len;
          while (right < BOARD && !map[block.row][right]) {
            max += 1;
            right += 1;
          }
          if (block.id === 'badge') {
            while (right <= BOARD) {
              if (right === BOARD) {
                max += 1;
                break;
              }
              if (map[block.row][right]) break;
              max += 1;
              right += 1;
            }
          }
        } else {
          let up = block.row - 1;
          while (up >= 0 && !map[up][block.col]) {
            min -= 1;
            up -= 1;
          }
          let down = block.row + block.len;
          while (down < BOARD && !map[down][block.col]) {
            max += 1;
            down += 1;
          }
        }
        return { min, max };
      }
      function applyMove(block, delta) {
        if (!block || !delta || state.mode !== 'playing') return false;
        const bounds = travelBounds(block);
        const step = Math.max(bounds.min, Math.min(bounds.max, delta));
        if (!step) return false;
        if (block.axis === 'h') block.col += step;
        else block.row += step;
        state.moves += Math.abs(step);
        if (block.id === 'badge' && block.col + block.len > BOARD - 1) state.mode = 'won';
        render();
        return true;
      }
      function drawBoard() {
        ctx.fillStyle = '#0e1015';
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#111722';
        ctx.beginPath();
        ctx.roundRect(34, 96, 322, 322, 28);
        ctx.fill();
        ctx.fillStyle = '#17344a';
        ctx.beginPath();
        ctx.roundRect(356, BOARD_Y + EXIT_ROW * CELL + 10, 16, CELL - 20, 8);
        ctx.fill();
        for (let row = 0; row < BOARD; row++) {
          for (let col = 0; col < BOARD; col++) {
            const x = BOARD_X + col * CELL;
            const y = BOARD_Y + row * CELL;
            ctx.fillStyle = row === EXIT_ROW ? 'rgba(97,218,251,.08)' : 'rgba(255,255,255,.05)';
            ctx.beginPath();
            ctx.roundRect(x, y, CELL - 6, CELL - 6, 12);
            ctx.fill();
          }
        }
      }
      function drawHud() {
        ctx.fillStyle = '#1b2434';
        ctx.beginPath();
        ctx.roundRect(24, 20, 342, 52, 22);
        ctx.fill();
        ctx.fillStyle = '#f2f7ff';
        ctx.font = '900 20px sans-serif';
        ctx.fillText('下班工牌突围', 38, 44);
        ctx.fillStyle = '#89dfff';
        ctx.font = '700 12px sans-serif';
        ctx.fillText('热门挪块复刻 · 先把会挪开，再谈下班', 38, 62);
      }
      function drawBlocks() {
        state.blocks.forEach((block) => {
          const meta = palette[block.type];
          const rect = blockRect(block);
          const active = state.selected === block.id;
          ctx.fillStyle = meta.fill;
          ctx.strokeStyle = active ? '#ffffff' : meta.edge;
          ctx.lineWidth = active ? 3 : 2;
          ctx.beginPath();
          ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 14);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.16)';
          ctx.fillRect(rect.x + 8, rect.y + 8, rect.w - 16, 8);
          ctx.fillStyle = '#071018';
          ctx.font = block.id === 'badge' ? '900 14px sans-serif' : '800 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(meta.label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 4);
          ctx.textAlign = 'left';
        });
      }
      function render() {
        drawBoard();
        drawHud();
        drawBlocks();
        document.getElementById('moveText').textContent = '步数 ' + state.moves;
        document.getElementById('bestText').textContent = state.mode === 'won'
          ? (state.moves <= 9 ? '9 步内逃离' : '已逃离，继续卷步数')
          : '目标 9 步内';
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? '你终于把工牌从会议缝里挤出去了。'
          : state.selected
            ? '沿着亮块方向拖动，别让审批再挡道。'
            : '拖动任意色块，给“下班工牌”让出右侧出口。';
      }
      canvas.addEventListener('pointerdown', (event) => {
        const point = pointFromEvent(event);
        const block = findBlock(point);
        state.selected = block ? block.id : null;
        if (!block || state.mode !== 'playing') {
          render();
          return;
        }
        state.drag = {
          id: block.id,
          axis: block.axis,
          startX: point.x,
          startY: point.y
        };
        canvas.setPointerCapture(event.pointerId);
        render();
      });
      canvas.addEventListener('pointerup', (event) => {
        if (!state.drag) return;
        const block = state.blocks.find((item) => item.id === state.drag.id);
        const point = pointFromEvent(event);
        const deltaPx = state.drag.axis === 'h' ? point.x - state.drag.startX : point.y - state.drag.startY;
        const delta = deltaPx > 0 ? Math.floor((deltaPx + CELL * 0.4) / CELL) : Math.ceil((deltaPx - CELL * 0.4) / CELL);
        applyMove(block, delta);
        state.drag = null;
      });
      canvas.addEventListener('pointercancel', () => { state.drag = null; });
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      window.advanceTime = () => {};
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 6x6 sliding block board',
        mode: state.mode,
        moves: state.moves,
        selected: state.selected,
        exit_row: EXIT_ROW,
        badge_col: state.blocks.find((block) => block.id === 'badge')?.col ?? null,
        blocks: state.blocks.map((block) => ({ id: block.id, row: block.row, col: block.col, axis: block.axis, len: block.len }))
      });
    `,
  },
  {
    id: 'meeting-pinball',
    file: 'meeting-pinball.html',
    title: '开会见缝插话',
    kind: '反应',
    sourceGame: '见缝插针 / aa 式旋转插针',
    accent: '#6f55ff',
    summary: '把发言条插进旋转会议盘，不撞车，打完一轮直接升压。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <div class="tray" id="queueBar"></div>
        <p id="statusText"></p>
        <button class="primary" id="resetBtn">重开今日会</button>
      </section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const levels = [
        { shots: 8, speed: 1.4, reverseEvery: 0, starterAngles: [-0.8, 1.3, 2.8] },
        { shots: 10, speed: -1.7, reverseEvery: 0, starterAngles: [-1.1, 0.1, 1.5, 2.8] },
        { shots: 11, speed: 1.9, reverseEvery: 4, starterAngles: [-1.4, -0.1, 1.2, 2.2, 3.2] },
        { shots: 12, speed: -2.2, reverseEvery: 3, starterAngles: [-1.2, -0.4, 0.8, 1.7, 2.5, 3.4] }
      ];
      const state = { mode: 'ready', levelIndex: 0, wheelAngle: 0, rotationSpeed: 0, pins: [], queue: [], activeShot: null, pulse: 0, tick: 0, lastFlipShot: -1 };
      function pinText(id) {
        return ['预算','进度','风险','复盘','排期','同步','对齐','跟进','结论','抄送','审批','补充'][id % 12];
      }
      function buildLevel(index) {
        const level = levels[index];
        state.mode = 'playing';
        state.levelIndex = index;
        state.wheelAngle = -Math.PI / 2;
        state.rotationSpeed = level.speed;
        state.tick = 0;
        state.pulse = 0;
        state.lastFlipShot = -1;
        state.activeShot = null;
        state.pins = level.starterAngles.map((angle, idx) => ({ id: idx, angle, text: pinText(idx) }));
        state.queue = Array.from({ length: level.shots }, (_, i) => ({ id: i + state.pins.length, text: pinText(i + state.pins.length) }));
      }
      function reset() {
        buildLevel(0);
        render();
      }
      function scheduleNextLevel() {
        if (state.levelIndex >= levels.length - 1) {
          state.mode = 'won';
          return;
        }
        buildLevel(state.levelIndex + 1);
      }
      function fire() {
        if (state.mode !== 'playing' || state.activeShot || !state.queue.length) return;
        const next = state.queue.shift();
        state.activeShot = { id: next.id, text: next.text, y: 476, vy: -580 };
      }
      function fail() {
        state.mode = 'lost';
        state.activeShot = null;
        state.pulse = 1;
      }
      function success(angle, shot) {
        state.pins.push({ id: shot.id, angle, text: shot.text });
        state.activeShot = null;
        state.pulse = 1;
        if (!state.queue.length) {
          state.mode = 'transition';
          window.setTimeout(scheduleNextLevel, 520);
        }
      }
      function update(ms) {
        const dt = Math.min(0.032, ms / 1000);
        state.tick += dt;
        state.pulse = Math.max(0, state.pulse - dt * 2.6);
        if (state.mode !== 'playing') {
          render();
          return;
        }
        const level = levels[state.levelIndex];
        if (level.reverseEvery > 0) {
          const inserted = state.pins.length - level.starterAngles.length;
          if (inserted > 0 && inserted % level.reverseEvery === 0 && state.lastFlipShot !== inserted) {
            state.rotationSpeed *= -1;
            state.lastFlipShot = inserted;
          }
        }
        state.wheelAngle += state.rotationSpeed * dt;
        if (state.activeShot) {
          state.activeShot.y += state.activeShot.vy * dt;
          if (state.activeShot.y <= 364) {
            const insertAngle = -Math.PI / 2 - state.wheelAngle;
            const gap = 0.34;
            const collided = state.pins.some((pin) => {
              let diff = Math.atan2(Math.sin(pin.angle - insertAngle), Math.cos(pin.angle - insertAngle));
              diff = Math.abs(diff);
              return diff < gap;
            });
            collided ? fail() : success(insertAngle, state.activeShot);
          }
        }
        render();
      }
      function drawNeedle(x, y, angle, label, active) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.strokeStyle = active ? '#fff7d6' : '#f7f3ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -92);
        ctx.stroke();
        ctx.fillStyle = active ? '#ffcf43' : '#b9a7ff';
        ctx.beginPath();
        ctx.arc(0, 8, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#140f22';
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label.slice(0, 2), 0, 12);
        ctx.restore();
      }
      function drawWheel() {
        const cx = 195;
        const cy = 214;
        const r = 72 + state.pulse * 6;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(state.wheelAngle);
        ctx.fillStyle = '#1d1533';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#6f55ff';
        ctx.stroke();
        ctx.fillStyle = '#f2efff';
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('会议', 0, -4);
        ctx.fillStyle = '#a89ade';
        ctx.font = '700 12px sans-serif';
        ctx.fillText('ROUND ' + (state.levelIndex + 1), 0, 16);
        state.pins.forEach((pin) => drawNeedle(0, 0, pin.angle, pin.text, false));
        ctx.restore();
      }
      function drawLauncher() {
        const baseY = state.activeShot ? state.activeShot.y : 476;
        const shot = state.activeShot || state.queue[0];
        if (!shot) return;
        drawNeedle(195, baseY, 0, shot.text, true);
      }
      function render() {
        ctx.fillStyle = '#0b0814';
        ctx.fillRect(0, 0, 390, 560);
        ctx.fillStyle = '#22163e';
        ctx.beginPath();
        ctx.roundRect(20, 20, 350, 80, 22);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '900 30px sans-serif';
        ctx.fillText(state.mode === 'won' ? '会议结束' : '见缝插话', 28, 55);
        ctx.fillStyle = '#c6bbff';
        ctx.font = '700 14px sans-serif';
        const speedText = Math.abs(state.rotationSpeed).toFixed(1);
        ctx.fillText('ROUND ' + (state.levelIndex + 1) + ' · 转速 ' + speedText, 28, 82);
        drawWheel();
        drawLauncher();
        ctx.fillStyle = '#38275e';
        ctx.beginPath();
        ctx.roundRect(101, 500, 188, 26, 13);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(state.mode === 'lost' ? '话撞上了，重开' : state.mode === 'transition' ? '本轮通过，准备下一会' : state.mode === 'won' ? '全部发完，今日存活' : '点击屏幕发言', 195, 518);
        ctx.textAlign = 'left';
        document.getElementById('queueBar').innerHTML = Array.from({ length: Math.max(8, state.queue.length) }, (_, i) => '<span>' + (state.queue[i] ? '•' : '') + '</span>').join('');
        document.getElementById('statusText').textContent = state.mode === 'won'
          ? '四轮结束 · 你成功把所有废话插进了议程。'
          : state.mode === 'lost'
            ? '碰撞失败 · 同题重复发言会炸。'
            : '待发 ' + state.queue.length + ' · 已插 ' + state.pins.length + ' · 当前轮 ' + (state.levelIndex + 1);
      }
      canvas.addEventListener('pointerdown', fire);
      document.getElementById('resetBtn').addEventListener('click', reset);
      reset();
      setInterval(() => update(16), 16);
      window.advanceTime = (ms) => {
        const steps = Math.max(1, Math.round(ms / 16));
        for (let i = 0; i < steps; i++) update(16);
      };
      window.render_game_to_text = () => JSON.stringify({
        coordinate_system: 'canvas 390x560 origin top-left',
        mode: state.mode,
        level: state.levelIndex + 1,
        queue: state.queue.length,
        pins: state.pins.length,
        activeShot: state.activeShot ? { y: Math.round(state.activeShot.y), text: state.activeShot.text } : null,
        speed: Number(state.rotationSpeed.toFixed(2))
      });
    `,
  },
  {
    id: 'brainrot-clicker',
    file: 'brainrot-clicker.html',
    title: '脑腐咔嗒工厂',
    kind: '点击',
    sourceGame: 'Italian Brainrot / 增量点击器',
    accent: '#f1b900',
    summary: '点出伪意大利动物，升级后 canvas 弹幕越来越吵。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="320" class="play-canvas short"></canvas>
      <button class="big-tap" id="tapBtn"><b id="pointsText">0 脑腐</b><span>CLICK</span></button>
      <section class="panel shop" id="shop"></section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      window.__BRAINROT_DEBUG_CONFIG__ = { genre: 'incremental-clicker', reference: 'Italian Brainrot + clicker loop', canvas: [390, 320], mobilePrimaryAction: 'tap' };
      const names = ['鲨鞋鞋','Tralala','Bombo','Capu','Lirila','Patapim'];
      const upgrades = [['蓝鞋音响',25,1,0.8,'orbit'],['椰壳翻译',90,2,2.2,'bounce'],['披萨雷达',240,4,6,'radar'],['弹幕合唱',700,8,18,'chorus']];
      const upgradeEffects = upgrades.map((u) => u[4]);
      const wordSpots = [{x:24,y:72},{x:260,y:82},{x:18,y:132},{x:278,y:142},{x:30,y:235},{x:250,y:246},{x:92,y:286},{x:210,y:38}];
      const state = { points: 0, click: 1, cps: 0, bought: [0,0,0,0], floatingWords: [{ text: '鲨鞋鞋', x: 24, y: 238, vy: -8, life: 4 }], t: 0 };
      function buy(i) {
        const u = upgrades[i];
        if (state.points < u[1]) return;
        state.points -= u[1]; state.click += u[2]; state.cps += u[3]; state.bought[i] += 1;
        state.floatingWords.push({ text: u[0], x: wordSpots[(state.floatingWords.length + i) % wordSpots.length].x, y: wordSpots[(state.floatingWords.length + i) % wordSpots.length].y, vy: -6, life: 3.5 });
        u[1] = Math.ceil(u[1] * 1.65);
        render();
      }
      function step(ms) {
        const dt = ms / 1000;
        state.t += dt;
        state.points += state.cps * dt;
        state.floatingWords.forEach((word, i) => { word.y += word.vy * dt; word.x += Math.sin(state.t * 2 + i) * 5 * dt; word.life -= dt; });
        state.floatingWords = state.floatingWords.filter((word) => word.life > 0).slice(-14);
        render();
      }
      function tap() {
        state.points += state.click;
        const spot = wordSpots[(state.floatingWords.length + Math.floor(state.points)) % wordSpots.length];
        state.floatingWords.push({ text: names[(state.floatingWords.length + Math.floor(state.points)) % names.length], x: spot.x, y: spot.y, vy: -8, life: 2.7 });
        render();
      }
      function drawMascot() {
        const bob = Math.sin(state.t * 5) * 5;
        ctx.save();
        ctx.translate(195, 160 + bob);
        ctx.fillStyle = '#ff3b86';
        ctx.beginPath(); ctx.ellipse(0, 0, 62, 44, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.stroke();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(-22, -8, 6, 0, Math.PI * 2); ctx.arc(24, -8, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#22f4ee';
        ctx.beginPath(); ctx.moveTo(-9, 4); ctx.lineTo(14, 4); ctx.lineTo(3, 19); ctx.closePath(); ctx.fill();
        for (let i = 0; i < state.bought.length; i++) {
          if (!state.bought[i]) continue;
          ctx.strokeStyle = ['#fff','#22f4ee','#7c5cff','#ff8ab9'][i];
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 72 + i * 12, state.t + i, state.t + i + Math.PI * 1.25);
          ctx.stroke();
        }
        ctx.restore();
      }
      function render() {
        ctx.fillStyle = '#130712'; ctx.fillRect(0,0,390,320);
        state.floatingWords.forEach((word, i) => {
          ctx.globalAlpha = Math.max(0, Math.min(1, word.life / 2.4));
          ctx.fillStyle = i % 2 ? '#fff' : '#22f4ee';
          ctx.font = '800 18px sans-serif';
          ctx.fillText(word.text, word.x, word.y);
          ctx.globalAlpha = 1;
        });
        drawMascot();
        ctx.fillStyle = '#fff'; ctx.font = '900 46px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.floor(state.points), 195, 86); ctx.textAlign = 'left';
        document.getElementById('pointsText').textContent = Math.floor(state.points) + ' 脑腐';
        document.getElementById('shop').innerHTML = '<p class="kicker">' + state.cps.toFixed(1) + ' / 秒</p>' + upgrades.map((u, i) => '<button class="shop-row" data-i="' + i + '"' + (state.points < u[1] ? ' disabled' : '') + '><b>' + u[0] + '</b><span>' + u[1] + ' · Lv.' + state.bought[i] + '</span></button>').join('');
        document.querySelectorAll('.shop-row').forEach((button) => button.addEventListener('click', () => buy(Number(button.dataset.i))));
      }
      document.getElementById('tapBtn').addEventListener('click', tap);
      canvas.addEventListener('pointerdown', tap);
      setInterval(() => step(250), 250);
      render();
      window.advanceTime = (ms) => step(ms);
      window.render_game_to_text = () => JSON.stringify({ coordinate_system: 'canvas 390x320 origin top-left', points: Math.floor(state.points), click: state.click, cps: state.cps, bought: state.bought, floatingWords: state.floatingWords.length, upgradeEffects });
    `,
  },
  {
    id: 'stimulation-fake',
    file: 'stimulation-fake.html',
    title: '刺激值按钮',
    kind: '点击',
    sourceGame: 'Stimulation Clicker 式过载点击器',
    accent: '#7c5cff',
    summary: '每个升级都让手机屏幕更像失控的信息流。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="440" class="play-canvas"></canvas>
      <button class="big-tap dark" id="stimBtn"><b id="stimText">0 stimulation</b><span>给我刺激</span></button>
      <section class="panel shop" id="stimShop"></section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      window.__STIM_DEBUG_CONFIG__ = { genre: 'overload-clicker', reference: 'Stimulation Clicker', canvas: [390, 440], modules: ['video','podcast','dvd','notifications'] };
      const modules = [
        { name: '自动短视频', cost: 30, ps: 1, kind: 'video' },
        { name: '真相播客', cost: 120, ps: 5, kind: 'podcast' },
        { name: '角落 DVD', cost: 300, ps: 0, kind: 'dvd' },
        { name: '红点宇宙', cost: 800, ps: 20, kind: 'notifications' }
      ];
      const state = { stim: 0, click: 1, ps: 0, unlocked: [], chaosLevel: 0, t: 0, dvd: { x: 40, y: 60, vx: 70, vy: 54 } };
      function buy(i) {
        const u = modules[i];
        if (state.unlocked.includes(i) || state.stim < u.cost) return;
        state.stim -= u.cost;
        state.unlocked.push(i);
        state.ps += u.ps;
        state.chaosLevel = state.unlocked.length;
        if (u.kind === 'dvd') state.click += 5;
        render();
      }
      function step(ms) {
        state.t += ms / 1000; state.stim += state.ps * ms / 1000;
        state.dvd.x += state.dvd.vx * ms / 1000; state.dvd.y += state.dvd.vy * ms / 1000;
        if (state.dvd.x < 8 || state.dvd.x > 302) state.dvd.vx *= -1;
        if (state.dvd.y < 40 || state.dvd.y > 360) state.dvd.vy *= -1;
        render();
      }
      function drawModule(kind) {
        if (kind === 'video') {
          ctx.fillStyle = '#050505'; ctx.fillRect(24, 260, 160, 88);
          ctx.fillStyle = '#fff'; ctx.font = '700 14px sans-serif'; ctx.fillText('跑酷录像', 38, 286);
          ctx.fillStyle = '#7c5cff'; ctx.beginPath(); ctx.arc(50 + (state.t * 90) % 115, 316, 10, 0, Math.PI * 2); ctx.fill();
        }
        if (kind === 'podcast') {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
          for (let i = 0; i < 8; i++) {
            ctx.beginPath(); ctx.moveTo(30 + i * 18, 392); ctx.lineTo(30 + i * 18, 392 - 22 - Math.sin(state.t * 4 + i) * 18); ctx.stroke();
          }
          ctx.fillStyle = '#fff'; ctx.font = '700 12px sans-serif'; ctx.fillText('2:17:48 未听完', 190, 397);
        }
        if (kind === 'dvd') {
          ctx.fillStyle = '#7c5cff'; ctx.fillRect(state.dvd.x, state.dvd.y, 76, 40);
          ctx.fillStyle = '#fff'; ctx.font = '900 18px sans-serif'; ctx.fillText('DVD', state.dvd.x + 18, state.dvd.y + 26);
        }
        if (kind === 'notifications') {
          for (let i=0;i<28;i++){ ctx.fillStyle = '#e51c23'; ctx.beginPath(); ctx.arc(320 + Math.sin(state.t+i)*42, 40 + i*13, 10, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font='10px sans-serif'; ctx.fillText('1', 317 + Math.sin(state.t+i)*42, 44 + i*13); }
        }
      }
      function render() {
        ctx.fillStyle = '#100816'; ctx.fillRect(0,0,390,440);
        ctx.fillStyle = '#fff'; ctx.font = '900 40px sans-serif'; ctx.fillText(Math.floor(state.stim), 24, 64);
        state.unlocked.forEach((i) => drawModule(modules[i].kind));
        if (state.chaosLevel >= 2) {
          ctx.fillStyle = 'rgba(124,92,255,.12)';
          for (let i = 0; i < state.chaosLevel * 3; i++) ctx.fillRect((i * 61 + state.t * 23) % 390, (i * 47) % 440, 36, 14);
        }
        document.getElementById('stimText').textContent = Math.floor(state.stim) + ' stimulation';
        document.getElementById('stimShop').innerHTML = '<p class="kicker">' + state.ps + ' / 秒 · chaos ' + state.chaosLevel + '</p>' + modules.map((u, i) => '<button class="shop-row" data-i="' + i + '"' + (state.unlocked.includes(i) || state.stim < u.cost ? ' disabled' : '') + '><b>' + u.name + '</b><span>' + (state.unlocked.includes(i) ? '已开启' : u.cost) + '</span></button>').join('');
        document.querySelectorAll('.shop-row').forEach((button) => button.addEventListener('click', () => buy(Number(button.dataset.i))));
      }
      document.getElementById('stimBtn').addEventListener('click', () => { state.stim += state.click; render(); });
      setInterval(() => step(200), 200);
      render();
      window.advanceTime = (ms) => step(ms);
      window.render_game_to_text = () => JSON.stringify({ coordinate_system: 'canvas 390x440 origin top-left', stim: Math.floor(state.stim), click: state.click, perSecond: state.ps, unlocked: state.unlocked, chaosLevel: state.chaosLevel, modules: state.unlocked.map((i) => modules[i].kind) });
    `,
  },
  {
    id: 'cattle-bump',
    file: 'cattle-bump.html',
    title: '疯羊碰碰场',
    kind: '动作',
    sourceGame: 'Crazy Cattle 3D 的 2D 撞飞版',
    accent: '#ff7a2f',
    summary: '触摸方向推动主羊，撞飞编号羊，留在圆圈里。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact"><p id="hud">拖动屏幕移动</p><button class="primary" id="resetBtn">重开</button></section>
    `,
    script: `
      const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
      const keys = {}; let target = null;
      const state = { mode: 'playing', time: 0, player: null, bots: [] };
      function reset(){ state.mode='playing'; state.time=0; state.player={x:195,y:280,vx:0,vy:0,r:18,alive:true}; state.bots=Array.from({length:6},(_,i)=>({x:80+(i%3)*110,y:145+Math.floor(i/3)*250,vx:i%2?40:-35,vy:i%3?30:-25,r:16,alive:true,id:i+1})); render(); }
      window.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true); window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
      canvas.addEventListener('pointerdown',e=>setTarget(e)); canvas.addEventListener('pointermove',e=>{ if(e.buttons) setTarget(e); }); canvas.addEventListener('pointerup',()=>target=null);
      function setTarget(e){ const r=canvas.getBoundingClientRect(); target={x:(e.clientX-r.left)*390/r.width,y:(e.clientY-r.top)*560/r.height}; }
      function step(ms){ if(state.mode!=='playing'){render();return;} const dt=Math.min(.05,ms/1000); state.time+=dt; const p=state.player; let ax=0,ay=0; if(target){ ax=(target.x-p.x)*6; ay=(target.y-p.y)*6; } if(keys.a||keys.arrowleft)ax-=260;if(keys.d||keys.arrowright)ax+=260;if(keys.w||keys.arrowup)ay-=260;if(keys.s||keys.arrowdown)ay+=260; p.vx=(p.vx+ax*dt)*.985;p.vy=(p.vy+ay*dt)*.985; state.bots.forEach((b,i)=>{ if(!b.alive)return; const a=Math.atan2(p.y-b.y,p.x-b.x)+Math.sin(state.time+i); b.vx=(b.vx+Math.cos(a)*40*dt)*.992; b.vy=(b.vy+Math.sin(a)*40*dt)*.992; }); const all=[p,...state.bots.filter(b=>b.alive)]; all.forEach(o=>{o.x+=o.vx*dt;o.y+=o.vy*dt;}); for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const a=all[i],b=all[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;if(d<a.r+b.r){const nx=dx/d,ny=dy/d,push=(a.r+b.r-d)/2;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;const imp=((a.vx-b.vx)*nx+(a.vy-b.vy)*ny)*.9;a.vx-=nx*imp;a.vy-=ny*imp;b.vx+=nx*imp;b.vy+=ny*imp;}} all.forEach(o=>{ if(Math.hypot(o.x-195,o.y-280)>230)o.alive=false; }); if(!p.alive)state.mode='lost'; if(state.bots.every(b=>!b.alive))state.mode='won'; render(); }
      function sheep(o,fill,label){ if(!o.alive)return; ctx.fillStyle=fill; ctx.beginPath(); ctx.ellipse(o.x,o.y,o.r*1.25,o.r,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#050505'; ctx.beginPath(); ctx.arc(o.x+o.r*.7,o.y-4,4,0,Math.PI*2); ctx.arc(o.x+o.r*.75,o.y+5,4,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.fillText(label,o.x-10,o.y-o.r-6); }
      function render(){ ctx.fillStyle='#10080f';ctx.fillRect(0,0,390,560);ctx.beginPath();ctx.arc(195,280,215,0,Math.PI*2);ctx.fillStyle='#123222';ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#22f4ee';ctx.stroke();state.bots.forEach(b=>sheep(b,'#ffffff','#'+b.id));sheep(state.player,'#ff3b86','YOU');ctx.fillStyle='#fff';ctx.font='800 16px sans-serif';ctx.fillText(state.mode==='playing'?'撞飞所有编号羊':state.mode==='won'?'胜利':'出界',18,30);document.getElementById('hud').textContent=state.mode+' · 对手 '+state.bots.filter(b=>b.alive).length; }
      document.getElementById('resetBtn').addEventListener('click',reset); reset(); setInterval(()=>step(16),16);
      window.advanceTime=(ms)=>{for(let i=0;i<Math.max(1,Math.round(ms/16));i++)step(16);};
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'canvas 390x560 origin top-left',mode:state.mode,player:state.player,botsAlive:state.bots.filter(b=>b.alive).length});
    `,
  },
  {
    id: 'password-hell',
    file: 'password-hell.html',
    title: '密码地狱试炼',
    kind: '解谜',
    sourceGame: 'The Password Game 式规则升级',
    accent: '#00a6d6',
    summary: '移动端输入框挑战，规则一条比一条难受。',
    markup: `
      <section class="panel">
        <label class="field-label">创建合规密码<input id="passwordInput" class="input" autocomplete="off" placeholder="abc123 开始犯错"></label>
        <p class="kicker" id="ruleProgress">RULES 0 / 0</p>
        <div class="rules" id="rules"></div>
      </section>
    `,
    script: `
      const rune = '木';
      const moonPhase = '上弦月';
      const captcha = '7G';
      const progressive = true;
      const state = { value: '', passed: 0, visibleRules: 3, mode: 'typing' };
      const ruleDefs = [
        { text: '至少 8 个字符', test: (v) => v.length >= 8 },
        { text: '包含数字', test: (v) => /\\d/.test(v) },
        { text: '包含大写字母', test: (v) => /[A-Z]/.test(v) },
        { text: '数字之和等于 13', test: (v) => (v.match(/\\d/g) || []).reduce((a, b) => a + Number(b), 0) === 13 },
        { text: '包含今日玄学字：' + rune, test: (v) => v.includes(rune) },
        { text: '不能出现 password 或 1234', test: (v) => !/password|1234/i.test(v) },
        { text: '包含验证码 ' + captcha, test: (v) => v.includes(captcha) },
        { text: '包含月相：' + moonPhase, test: (v) => v.includes(moonPhase) },
        { text: '包含 ? 或 !', test: (v) => /[?!]/.test(v) },
        { text: '长度必须是奇数', test: (v) => v.length % 2 === 1 && v.length > 0 }
      ];
      window.__PASSWORD_RULES__ = ruleDefs.map((rule) => rule.text);
      function render(){
        const box = document.getElementById('rules');
        const results = ruleDefs.map((rule) => rule.test(state.value));
        state.passed = results.filter(Boolean).length;
        if (state.passed === ruleDefs.length) state.visibleRules = ruleDefs.length;
        else if (progressive) state.visibleRules = Math.min(ruleDefs.length, Math.max(3, results.slice(0, state.visibleRules).filter(Boolean).length + 3));
        box.innerHTML = '';
        ruleDefs.slice(0, state.visibleRules).forEach((rule, i) => {
          const ok = results[i];
          box.insertAdjacentHTML('beforeend','<div class="rule '+(ok?'ok':'bad')+'"><b>'+(ok?'✓':'×')+'</b><span>Rule '+(i+1)+': '+rule.text+'</span></div>');
        });
        document.getElementById('ruleProgress').textContent = 'VISIBLE RULES ' + state.visibleRules + ' / ' + ruleDefs.length + ' · moonPhase ' + moonPhase + ' · captcha ' + captcha;
        state.mode = state.passed === ruleDefs.length ? 'won' : 'typing';
        if(state.mode === 'won') box.insertAdjacentHTML('beforeend','<div class="win-note">通过：这个密码已经不适合人类记忆。</div>');
      }
      document.getElementById('passwordInput').addEventListener('input',e=>{state.value=e.target.value;render();}); render();
      window.advanceTime=()=>{};
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM form',mode:state.mode,passed:state.passed,total:ruleDefs.length,visibleRules:state.visibleRules,length:state.value.length,progressive,moonPhase,captcha});
    `,
  },
  {
    id: 'infinite-craft-fake',
    file: 'infinite-craft-fake.html',
    title: '无限乱炖实验室',
    kind: '合成',
    sourceGame: 'Infinite Craft 式元素合成',
    accent: '#34a853',
    summary: '两个词一碰，互联网又多一个概念。',
    markup: `
      <section class="panel craft-machine">
        <div class="slots"><span id="slotA">?</span><b>+</b><span id="slotB">?</span></div>
        <div class="craft-toolbar">
          <button class="primary" id="combineBtn">合成</button>
          <button class="primary" id="stewBtn">乱炖 x5</button>
        </div>
        <p id="craftLog">从四元素开始。</p>
        <div class="craft-stats"><span id="craftStats">4 DISCOVERED</span><span id="craftSpace">6 PAIRS</span></div>
        <div class="craft-history" id="historyRail"></div>
        <label class="field-label">搜索概念<input id="searchInput" class="input" placeholder="水 / 热搜 / SBTI"></label>
      </section>
      <section class="chip-pool" id="pool"></section>
    `,
    script: `
      const key=(a,b)=>[a,b].sort().join('+');
      const saveKey='printer_fake_infinite_craft_v3';
      const recipeList=[
        ['火','水','蒸汽','matter'],['土','水','泥','matter'],['火','风','烟','air'],['火','土','陶','matter'],['水','风','浪','water'],['土','风','尘','air'],
        ['火','泥','砖','city'],['蒸汽','风','云','air'],['云','火','热搜','internet'],['泥','热搜','抽象','meme'],['抽象','水','冷笑话','meme'],
        ['砖','风','房贷','city'],['房贷','热搜','打工人','life'],['冷笑话','火','群聊','internet'],['抽象','群聊','SBTI','meme'],
        ['尘','水','咖啡','life'],['咖啡','打工人','续命','life'],['云','咖啡','电子雨','internet'],['电子雨','群聊','First Discovery','meme'],
        ['SBTI','热搜','人格塌房','meme'],['羊','抽象','羊块宇宙','game'],['土','打工人','工位盆栽','life'],['风','咖啡','凌晨灵感','life'],
        ['水','SBTI','流体人格','meme'],['火','群聊','红温现场','internet']
      ];
      const combos=Object.fromEntries(recipeList.map((row)=>[key(row[0],row[1]),row[2]]));
      window.__CRAFT_RECIPES__ = combos;
      window.__CRAFT_ENGINE__ = { procedural: true, randomStew: true, localStorageKey: saveKey, recipeList: recipeList.length };
      const recipeCache = {};
      let craftHistory = [];
      const itemMeta = {
        水:{family:'water',depth:0},火:{family:'fire',depth:0},风:{family:'air',depth:0},土:{family:'earth',depth:0},
        羊:{family:'game',depth:1},脑腐:{family:'meme',depth:1},群聊:{family:'internet',depth:1}
      };
      const baseItems=['水','火','风','土','羊','脑腐','群聊'];
      const state={items:[...baseItems],selected:[],last:'',query:'',totalCombines:0,autoStewCount:0};
      const families=['meme','life','internet','game','city','food','weather','machine','animal','dream'];
      const prefixes=['赛博','量子','凌晨三点的','反向','会眨眼的','可食用','玄学','自带BGM的','打工版','低电量','全自动','已读不回的'];
      const middles=['奶茶','羊群','工位','热搜','房贷','云朵','表情包','按钮','会议','锦鲤','验证码','小恐龙','圆点','花园'];
      const suffixes=['管理局','模拟器','发生器','宇宙','浓汤','人格','补丁','副本','盲盒','瀑布','电台','协议','考古现场','连锁反应'];
      function hash(text){let h=2166136261;for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
      function depthOf(item){return itemMeta[item]?itemMeta[item].depth:1;}
      function familyOf(item){return itemMeta[item]?itemMeta[item].family:families[hash(item)%families.length];}
      function rememberMeta(item,a,b,family){itemMeta[item]={family,depth:Math.max(depthOf(a),depthOf(b))+1,bornFrom:[a,b]};}
      recipeList.forEach((row)=>{ rememberMeta(row[2],row[0],row[1],row[3]); });
      function restore(){
        try{
          const raw=localStorage.getItem(saveKey);
          if(!raw)return;
          const saved=JSON.parse(raw);
          if(Array.isArray(saved.items)&&saved.items.length>=4)state.items=[...new Set([...baseItems,...saved.items])].slice(0,600);
          if(Array.isArray(saved.history))craftHistory=saved.history.slice(-40);
          if(saved.meta&&typeof saved.meta==='object')Object.assign(itemMeta,saved.meta);
          state.totalCombines=Number(saved.totalCombines)||0;
        }catch{}
      }
      function save(){
        try{localStorage.setItem(saveKey,JSON.stringify({items:state.items.slice(-600),history:craftHistory.slice(-40),meta:itemMeta,totalCombines:state.totalCombines}));}catch{}
      }
      function makeProceduralResult(a,b){
        const k=key(a,b);
        if(recipeCache[k])return recipeCache[k];
        const h=hash(k);
        const family=families[(h+familyOf(a).length+familyOf(b).length)%families.length];
        const p=prefixes[h%prefixes.length];
        const m=middles[(h>>>4)%middles.length];
        const s=suffixes[(h>>>9)%suffixes.length];
        const pattern=h%7;
        let result;
        if(pattern===0)result=p+a;
        else if(pattern===1)result=b+s;
        else if(pattern===2)result=p+m+s;
        else if(pattern===3)result=a+'味'+b;
        else if(pattern===4)result=b+'和'+a+'的孩子';
        else if(pattern===5)result=p+b+'协议';
        else result=a+b+'浓汤';
        if(result.length>12)result=result.slice(0,10)+'*';
        recipeCache[k]=result;
        rememberMeta(result,a,b,family);
        return result;
      }
      function resultFor(a,b){
        const k=key(a,b);
        const explicit=combos[k];
        if(explicit){ if(!itemMeta[explicit])rememberMeta(explicit,a,b,'classic'); return explicit; }
        return makeProceduralResult(a,b);
      }
      function addHistory(a,b,result,isNew,mode){
        craftHistory.push({a,b,result,isNew,mode,depth:depthOf(result)});
        craftHistory=craftHistory.slice(-40);
      }
      function pairSpace(){return Math.max(0,state.items.length*(state.items.length-1)/2);}
      function combinePair(a,b,mode='manual'){
        const result=resultFor(a,b);
        const isNew=!state.items.includes(result);
        if(isNew)state.items.push(result);
        state.totalCombines++;
        state.last=(isNew?'First Discovery：':'再次发现：')+result;
        addHistory(a,b,result,isNew,mode);
        save();
        return result;
      }
      function randomStew(rounds=5){
        state.query='';
        for(let r=0;r<rounds;r++){
          const n=state.items.length;
          const i=(state.totalCombines*17+r*7+state.autoStewCount*13)%n;
          let j=(state.totalCombines*31+r*11+state.autoStewCount*5+3)%n;
          if(i===j)j=(j+1)%n;
          const result=combinePair(state.items[i],state.items[j],'randomStew');
          state.selected=[result];
          state.autoStewCount++;
        }
        document.getElementById('searchInput').value='';
        render();
      }
      function render(){
        document.getElementById('slotA').textContent=state.selected[0]||'?';
        document.getElementById('slotB').textContent=state.selected[1]||'?';
        document.getElementById('craftLog').textContent=state.last||'随便点两个词，或者直接乱炖。';
        document.getElementById('craftStats').textContent=state.items.length+' DISCOVERED · '+state.totalCombines+' MIXES';
        document.getElementById('craftSpace').textContent=Math.floor(pairSpace())+' PAIRS';
        document.getElementById('historyRail').innerHTML=craftHistory.slice(-8).reverse().map((item)=>'<span>'+item.a+' + '+item.b+' = '+item.result+'</span>').join('');
        const shown=state.items.filter((item)=>!state.query||item.includes(state.query)).slice().reverse().slice(0,96);
        document.getElementById('pool').innerHTML=shown.map(item=>'<button class="chip '+(state.selected.includes(item)?'picked':'')+'" data-item="'+item+'">'+item+'<small>Lv.'+depthOf(item)+'</small></button>').join('');
        document.querySelectorAll('.chip').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.dataset.item;if(state.selected.includes(item))state.selected=state.selected.filter(x=>x!==item);else{if(state.selected.length>=2)state.selected.shift();state.selected.push(item);}render();}));
      }
      document.getElementById('searchInput').addEventListener('input',(event)=>{state.query=event.target.value.trim();render();});
      document.getElementById('combineBtn').addEventListener('click',()=>{if(state.selected.length<2){state.last='需要两个元素，或点乱炖。';render();return;}const result=combinePair(state.selected[0],state.selected[1]);state.selected=[result];render();});
      document.getElementById('stewBtn').addEventListener('click',()=>randomStew(5));
      restore();
      render();
      window.randomStew=randomStew;
      window.advanceTime=(ms)=>{ if(ms>=500) randomStew(Math.min(8,Math.max(1,Math.floor(ms/500)))); };
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM infinite craft grid',discovered:state.items.length,pairSpace:Math.floor(pairSpace()),selected:state.selected,last:state.last,recipeCache:Object.keys(recipeCache).length,craftHistory:craftHistory.slice(-5),searchInput:state.query,depth:Math.max(...state.items.map(depthOf)),totalCombines:state.totalCombines,randomStew:state.autoStewCount});
    `,
  },
  {
    id: 'million-checkboxes-fake',
    file: 'million-checkboxes-fake.html',
    title: '四百个勾选框',
    kind: '协作幻觉',
    sourceGame: 'One Million Checkboxes 式集体勾选',
    accent: '#111111',
    summary: '假装全网在线，其实是本地小宇宙。',
    markup: `
      <section class="panel compact"><div class="row"><b id="checkStats">0 / 400</b><button class="primary" id="disturbBtn">随机扰动</button></div></section>
      <section class="checkbox-grid" id="grid"></section>
    `,
    script: `
      window.__CHECKBOX_DEBUG_CONFIG__ = { grid: [20,20], reference: 'One Million Checkboxes', simulatedRemoteUsers: 23 };
      const coloredOutlines = ['#e91e63','#4285f4','#34a853','#fbbc04','#7c5cff'];
      const state={boxes:Array.from({length:400},()=>false),owned:Array.from({length:400},()=>false),ghosts:0,remotePulse:0,personalChecked:0,globalChecked:0};
      function counts(){state.personalChecked=state.boxes.filter((value,i)=>value&&state.owned[i]).length;state.globalChecked=state.boxes.filter(Boolean).length;}
      function render(){
        counts();
        document.getElementById('checkStats').textContent=state.personalChecked+' mine · '+state.globalChecked+' / 400 · remotePulse '+state.remotePulse;
        const grid=document.getElementById('grid');
        if(!grid.children.length){state.boxes.forEach((_,i)=>{const label=document.createElement('label');label.className='fake-check';label.innerHTML='<input type="checkbox"><span></span>';label.querySelector('span').style.borderColor=coloredOutlines[i%coloredOutlines.length];label.querySelector('input').addEventListener('change',e=>{state.boxes[i]=e.target.checked;state.owned[i]=true;render();});grid.appendChild(label);});}
        Array.from(grid.querySelectorAll('input')).forEach((input,i)=>input.checked=state.boxes[i]);
      }
      function disturb(n){for(let k=0;k<n;k++){const i=(state.ghosts*37+k*19+state.remotePulse*11)%state.boxes.length;state.boxes[i]=!state.boxes[i];if(!state.owned[i])state.owned[i]=false;state.ghosts++;}state.remotePulse++;render();}
      document.getElementById('disturbBtn').addEventListener('click',()=>disturb(17)); render();
      window.advanceTime=(ms)=>disturb(Math.max(1,Math.floor(ms/350)));
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM 20x20 checkbox grid',checked:state.globalChecked,ghosts:state.ghosts,personalChecked:state.personalChecked,globalChecked:state.globalChecked,remotePulse:state.remotePulse,coloredOutlines});
    `,
  },
  {
    id: 'dino-fake',
    file: 'dino-fake.html',
    title: '断网小蜥蜴',
    kind: '跑酷',
    sourceGame: 'Google Dino 式离线跑酷',
    accent: '#5f6368',
    summary: '点击跳跃，越过会议、需求和锅。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="520" class="play-canvas"></canvas>
      <section class="panel compact"><p id="hud">点击跳跃</p><button class="primary" id="resetBtn">重开</button></section>
    `,
    script: `
      const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
      window.__DINO_DEBUG_CONFIG__={reference:'Chrome Dino offline runner',canvas:[390,520],jump:true,duck:true,bird:true};
      let hiScore=Number(localStorage.getItem('fakeDinoHiScore')||0);
      const state={mode:'running',y:0,vy:0,ground:405,score:0,speed:220,obstacles:[],clouds:[],ducking:false,spawn:0};
      function reset(){state.mode='running';state.y=state.ground;state.vy=0;state.score=0;state.speed=220;state.spawn=0;state.ducking=false;state.clouds=Array.from({length:4},(_,i)=>({x:50+i*95,y:58+i%2*34,w:42+i*8}));state.obstacles=[{type:'cactus',x:360,w:24,h:46,label:'会'}];render();}
      function jump(){if(state.mode!=='running'){reset();return;}if(state.y>=state.ground){state.vy=state.ducking?-420:-560;state.ducking=false;}}
      function setDucking(on){state.ducking=on&&state.y>=state.ground&&state.mode==='running';render();}
      window.addEventListener('keydown',e=>{if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();jump();}if(e.key==='ArrowDown'||e.key.toLowerCase()==='s')setDucking(true);});
      window.addEventListener('keyup',e=>{if(e.key==='ArrowDown'||e.key.toLowerCase()==='s')setDucking(false);});
      canvas.addEventListener('pointerdown',(e)=>{const r=canvas.getBoundingClientRect();const y=(e.clientY-r.top)*520/r.height;y>360?setDucking(true):jump();});
      canvas.addEventListener('pointerup',()=>setDucking(false));
      function addObstacle(){const bird=state.score>55&&Math.floor(state.score+state.spawn)%4===0;state.obstacles.push(bird?{type:'bird',x:430,w:38,h:24,y:state.ground-42,label:'飞'}:{type:'cactus',x:430,w:24+(Math.floor(state.score)%3)*8,h:38+(Math.floor(state.score)%2)*18,label:['会','需','锅'][Math.floor(state.score)%3]});state.spawn++;}
      function step(ms){if(state.mode!=='running'){render();return;}const dt=ms/1000;state.score+=dt*10;state.speed+=dt*5;state.vy+=1450*dt;state.y=Math.min(state.ground,state.y+state.vy*dt);state.clouds.forEach(c=>{c.x-=state.speed*.15*dt;if(c.x<-70)c.x=430;});state.obstacles.forEach(o=>o.x-=state.speed*dt);if(state.obstacles[0]&&state.obstacles[0].x<-60)state.obstacles.shift();const last=state.obstacles[state.obstacles.length-1];if(!last||last.x<230)addObstacle();const dino={x:58,y:state.ducking?state.y+16:state.y-18,w:state.ducking?52:44,h:state.ducking?28:68};state.obstacles.forEach(o=>{const oy=o.type==='bird'?o.y:state.ground+36-o.h;const hit=dino.x<o.x+o.w&&dino.x+dino.w>o.x&&dino.y<oy+o.h&&dino.y+dino.h>oy;if(hit){state.mode='lost';hiScore=Math.max(hiScore,Math.floor(state.score));localStorage.setItem('fakeDinoHiScore',String(hiScore));}});render();}
      function drawCloud(c){ctx.fillStyle='rgba(34,244,238,.18)';ctx.beginPath();ctx.arc(c.x,c.y,12,0,Math.PI*2);ctx.arc(c.x+14,c.y-5,14,0,Math.PI*2);ctx.arc(c.x+30,c.y,10,0,Math.PI*2);ctx.fillRect(c.x,c.y,38,10);ctx.fill();}
      function render(){ctx.fillStyle='#08070a';ctx.fillRect(0,0,390,520);state.clouds.forEach(drawCloud);ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(18,state.ground+36);ctx.lineTo(370,state.ground+36);ctx.stroke();ctx.fillStyle='#fff';if(state.ducking){ctx.fillRect(58,state.y+10,52,24);ctx.fillRect(94,state.y-2,22,20);}else{ctx.fillRect(58,state.y,34,34);ctx.fillRect(82,state.y-18,20,22);ctx.fillRect(64,state.y+32,8,18);ctx.fillRect(86,state.y+32,8,18);}state.obstacles.forEach(o=>{if(o.type==='bird'){ctx.fillStyle='#22f4ee';ctx.beginPath();ctx.moveTo(o.x,o.y+12);ctx.lineTo(o.x+18,o.y);ctx.lineTo(o.x+38,o.y+12);ctx.lineTo(o.x+18,o.y+24);ctx.closePath();ctx.fill();ctx.fillStyle='#050505';ctx.font='14px sans-serif';ctx.fillText(o.label,o.x+12,o.y+17);}else{ctx.fillStyle='#ff3b86';ctx.fillRect(o.x,state.ground+36-o.h,o.w,o.h);ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.fillText(o.label,o.x+4,state.ground+22);}});ctx.fillStyle='#fff';ctx.font='18px monospace';ctx.fillText('HI '+hiScore.toString().padStart(5,'0')+' '+Math.floor(state.score).toString().padStart(5,'0'),172,36);if(state.mode==='lost'){ctx.font='28px sans-serif';ctx.fillText('GAME OVER',110,230);}document.getElementById('hud').textContent=state.mode+' · score '+Math.floor(state.score)+' · hiScore '+hiScore+(state.ducking?' · ducking':'');}
      document.getElementById('resetBtn').addEventListener('click',reset); reset(); setInterval(()=>step(16),16);
      window.advanceTime=(ms)=>{for(let i=0;i<Math.max(1,Math.round(ms/16));i++)step(16);};
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'canvas 390x520 origin top-left',mode:state.mode,score:Math.floor(state.score),hiScore,y:Math.round(state.y),ducking:state.ducking,clouds:state.clouds.map(c=>Math.round(c.x)),obstacles:state.obstacles.map(o=>({type:o.type,bird:o.type==='bird',x:Math.round(o.x)}))});
    `,
  },
  {
    id: 'garden-idle',
    file: 'garden-idle.html',
    title: '摸鱼花园',
    kind: '放置',
    sourceGame: 'Grow a Garden 式轻放置',
    accent: '#6aa84f',
    summary: '种、等、收，库存刷新让你再来一次。',
    markup: `
      <section class="panel compact"><div class="row"><b>硬币 <span id="coins">20</span></b><button class="primary" id="fastBtn">快进 10 秒</button></div></section>
      <section class="garden-grid" id="garden"></section>
      <section class="panel shop" id="seedShop"></section>
    `,
    script: `
      window.__GARDEN_DEBUG_CONFIG__ = { reference: 'Grow a Garden idle loop', plots: 12, mobilePrimaryAction: 'tap plot' };
      const seeds=[{name:'萝卜',cost:5,grow:6,value:12,rarity:'common'},{name:'奶茶树',cost:16,grow:14,value:38,rarity:'rare'},{name:'玄学藤',cost:40,grow:25,value:96,rarity:'mythic'}];
      const rarity={common:1,rare:1.8,mythic:3.2};
      const state={coins:20,selected:0,plots:Array.from({length:12},()=>null),time:0,stock:[true,true,false],stockTimer:18,harvests:0};
      function stageFor(plot){if(!plot)return 'empty';const s=seeds[plot.seed];if(plot.age>=s.grow)return plot.mutation?'mutated-ready':'ready';if(plot.age>s.grow*.66)return 'tall';if(plot.age>s.grow*.33)return 'sprout';return 'seed';}
      function mutation(seedIndex, plotIndex){return ((state.harvests*17 + plotIndex*11 + seedIndex*23) % 10) === 0;}
      function render(){
        document.getElementById('coins').textContent=Math.floor(state.coins);
        document.getElementById('garden').innerHTML=state.plots.map((p,i)=>{const s=p?seeds[p.seed]:null;const stage=stageFor(p);return '<button class="plot '+(p&&p.age>=s.grow?'ready':'')+'" data-i="'+i+'">'+(p?'<b>'+s.name+(p.mutation?'*':'')+'</b><span>'+stage+' · '+(p.age>=s.grow?'可收':Math.floor(p.age)+'/'+s.grow+'s')+'</span>':'<span>空地</span>')+'</button>';}).join('');
        document.querySelectorAll('.plot').forEach(btn=>btn.addEventListener('click',()=>usePlot(Number(btn.dataset.i))));
        document.getElementById('seedShop').innerHTML='<p class="kicker">种子商店 · stockTimer '+Math.ceil(state.stockTimer)+'s</p>'+seeds.map((s,i)=>'<button class="shop-row '+(state.selected===i?'picked':'')+'" data-i="'+i+'" '+(!state.stock[i]?'disabled':'')+'><b>'+s.name+'</b><span>'+s.rarity+' · '+s.cost+' -> '+s.value+'</span></button>').join('');
        document.querySelectorAll('.shop-row').forEach(btn=>btn.addEventListener('click',()=>{state.selected=Number(btn.dataset.i);render();}));
      }
      function usePlot(i){const p=state.plots[i];if(!p){const s=seeds[state.selected];if(state.coins>=s.cost&&state.stock[state.selected]){state.coins-=s.cost;state.plots[i]={seed:state.selected,age:0,mutation:mutation(state.selected,i)};}}else{const s=seeds[p.seed];if(p.age>=s.grow){state.coins+=Math.floor(s.value*(p.mutation?rarity[s.rarity]:1));state.harvests++;state.plots[i]=null;}}render();}
      function restock(){state.stock=[true,Math.floor(state.time/18)%3!==1,Math.floor(state.time/18)%2===1];state.stockTimer=18;}
      function step(ms){const sec=ms/1000;state.time+=sec;state.stockTimer-=sec;state.plots.forEach(p=>{if(p)p.age+=sec;});if(state.stockTimer<=0)restock();render();}
      document.getElementById('fastBtn').addEventListener('click',()=>step(10000)); setInterval(()=>step(1000),1000); render();
      window.advanceTime=(ms)=>step(ms); window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM 3x4 garden grid',coins:Math.floor(state.coins),selected:seeds[state.selected].name,planted:state.plots.filter(Boolean).length,stockTimer:Math.ceil(state.stockTimer),rarity,plots:state.plots.map((plot)=>({stage:stageFor(plot),mutation:plot?plot.mutation:false}))});
    `,
  },
  {
    id: 'agar-fake',
    file: 'agar-fake.html',
    title: '圆点吞吞.io',
    kind: '.io',
    sourceGame: 'Agar.io 式吞噬成长',
    accent: '#4285f4',
    summary: '拖动移动，吃小点长大，别被大圆点吃掉。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact"><p id="hud">拖动移动</p><div class="row"><button class="primary" id="splitBtn">分裂</button><button class="primary" id="ejectBtn">吐点</button><button class="primary" id="resetBtn">重开</button></div></section>
    `,
    script: `
      const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');const keys={};let target=null;
      const worldWidth=1800,worldHeight=1800;
      window.__AGAR_DEBUG_CONFIG__={reference:'Agar.io large-world cell eating loop',worldWidth,worldHeight,canvas:[390,560],actions:['splitCells','ejectMass']};
      const camera={x:900,y:900,scale:1};
      const state={mode:'playing',cells:[],pellets:[],ejected:[],bots:[],score:0,leaderboard:[]};
      const massOf=(r)=>r*r;
      const radiusFromMass=(m)=>Math.sqrt(Math.max(25,m));
      function seeded(i,max){return (i*9973%max)+20;}
      function reset(){state.mode='playing';state.score=0;state.cells=[{x:900,y:900,r:26,vx:0,vy:0,merge:0,name:'YOU'}];state.ejected=[];state.pellets=Array.from({length:260},(_,i)=>({x:seeded(i,worldWidth-40),y:seeded(i*7,worldHeight-40),r:3+i%4,color:['#7db6ff','#34a853','#fbbc04','#ff6f61'][i%4]}));state.bots=Array.from({length:8},(_,i)=>({x:180+i*190,y:220+(i%4)*320,r:18+i*5,vx:35-i*7,vy:i%2?-28:26,name:['red','lime','moon','doge','bot','cell','io','king'][i]}));render();}
      window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space')splitCells();if(e.key.toLowerCase()==='w')ejectMass();});window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
      canvas.addEventListener('pointerdown',e=>setTarget(e));canvas.addEventListener('pointermove',e=>{if(e.buttons)setTarget(e);});canvas.addEventListener('pointerup',()=>target=null);
      function screenToWorld(sx,sy){return{x:(sx-195)/camera.scale+camera.x,y:(sy-280)/camera.scale+camera.y};}
      function setTarget(e){const r=canvas.getBoundingClientRect();target=screenToWorld((e.clientX-r.left)*390/r.width,(e.clientY-r.top)*560/r.height);}
      function splitCells(){if(state.mode!=='playing')return;const next=[];state.cells.forEach((c)=>{if(c.r<24){next.push(c);return;}const angle=target?Math.atan2(target.y-c.y,target.x-c.x):0;const nr=radiusFromMass(massOf(c.r)/2);c.r=nr;c.vx-=Math.cos(angle)*120;c.vy-=Math.sin(angle)*120;c.merge=4;next.push(c,{x:c.x+Math.cos(angle)*(nr+8),y:c.y+Math.sin(angle)*(nr+8),r:nr,vx:Math.cos(angle)*420,vy:Math.sin(angle)*420,merge:4,name:'YOU'});});state.cells=next.slice(0,8);render();}
      function ejectMass(){if(state.mode!=='playing')return;state.cells.forEach((c)=>{if(c.r<18)return;const angle=target?Math.atan2(target.y-c.y,target.x-c.x):0;c.r=radiusFromMass(massOf(c.r)-45);state.ejected.push({x:c.x+Math.cos(angle)*(c.r+8),y:c.y+Math.sin(angle)*(c.r+8),r:5,vx:Math.cos(angle)*360,vy:Math.sin(angle)*360,life:4,color:'#4285f4'});});render();}
      function centerOfCells(){const total=state.cells.reduce((a,c)=>a+massOf(c.r),0)||1;return{x:state.cells.reduce((a,c)=>a+c.x*massOf(c.r),0)/total,y:state.cells.reduce((a,c)=>a+c.y*massOf(c.r),0)/total,r:radiusFromMass(total/state.cells.length)};}
      function eatPellet(cell,dot){return Math.hypot(cell.x-dot.x,cell.y-dot.y)<cell.r;}
      function step(ms){if(state.mode!=='playing'){render();return;}const dt=ms/1000;const center=centerOfCells();let ax=0,ay=0;if(target){ax=target.x-center.x;ay=target.y-center.y;}if(keys.a||keys.arrowleft)ax-=120;if(keys.d||keys.arrowright)ax+=120;if(keys.w||keys.arrowup)ay-=120;if(keys.s||keys.arrowdown)ay+=120;const len=Math.hypot(ax,ay)||1;state.cells.forEach((c)=>{const speed=Math.max(70,210-c.r*2);c.vx=(c.vx+ax/len*speed)*.82;c.vy=(c.vy+ay/len*speed)*.82;c.x=Math.max(c.r,Math.min(worldWidth-c.r,c.x+c.vx*dt));c.y=Math.max(c.r,Math.min(worldHeight-c.r,c.y+c.vy*dt));c.merge=Math.max(0,c.merge-dt);});state.ejected.forEach(m=>{m.x+=m.vx*dt;m.y+=m.vy*dt;m.vx*=.96;m.vy*=.96;m.life-=dt;});state.ejected=state.ejected.filter(m=>m.life>0);state.bots.forEach((b,i)=>{b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<b.r||b.x>worldWidth-b.r)b.vx*=-1;if(b.y<b.r||b.y>worldHeight-b.r)b.vy*=-1;state.pellets=state.pellets.filter(dot=>{if(Math.hypot(b.x-dot.x,b.y-dot.y)<b.r){b.r+=.08;return false;}return true;});});state.cells.forEach(c=>{state.pellets=state.pellets.filter(dot=>{if(eatPellet(c,dot)){c.r+=.18;state.score++;return false;}return true;});state.ejected=state.ejected.filter(m=>{if(eatPellet(c,m)){c.r+=.45;return false;}return true;});state.bots.forEach((b,i)=>{const d=Math.hypot(c.x-b.x,c.y-b.y);if(d<c.r+b.r*.7){if(c.r>b.r+3){c.r=radiusFromMass(massOf(c.r)+massOf(b.r)*.55);b.r=14+i*3;b.x=seeded(i*13+state.score,worldWidth-80);b.y=seeded(i*17+state.score,worldHeight-80);state.score+=30;}else if(b.r>c.r+3){state.mode='lost';}}});});if(state.pellets.length<180)state.pellets.push({x:seeded(state.score+state.pellets.length*3,worldWidth-40),y:seeded(state.score+state.pellets.length*9,worldHeight-40),r:4,color:'#7db6ff'});updateCamera();render();}
      function updateCamera(){const c=centerOfCells();camera.x+=(c.x-camera.x)*.18;camera.y+=(c.y-camera.y)*.18;const biggest=Math.max(...state.cells.map(cell=>cell.r));camera.scale=Math.max(.38,Math.min(1.05,34/biggest));state.leaderboard=[...state.bots.map(b=>({name:b.name,mass:Math.round(massOf(b.r))})),{name:'YOU',mass:Math.round(state.cells.reduce((a,c)=>a+massOf(c.r),0))}].sort((a,b)=>b.mass-a.mass).slice(0,5);}
      function worldToScreen(x,y){return{x:(x-camera.x)*camera.scale+195,y:(y-camera.y)*camera.scale+280};}
      function drawCircle(obj,color,label){const p=worldToScreen(obj.x,obj.y);const r=obj.r*camera.scale;if(p.x+r<0||p.x-r>390||p.y+r<0||p.y-r>560)return;ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();if(label){ctx.fillStyle='#fff';ctx.font=Math.max(10,14*camera.scale)+'px sans-serif';ctx.textAlign='center';ctx.fillText(label,p.x,p.y+4);ctx.textAlign='left';}}
      function render(){ctx.fillStyle='#080a12';ctx.fillRect(0,0,390,560);ctx.strokeStyle='rgba(34,244,238,.16)';ctx.lineWidth=1;for(let x=Math.floor((camera.x-220/camera.scale)/40)*40;x<camera.x+220/camera.scale;x+=40){const p=worldToScreen(x,0);ctx.beginPath();ctx.moveTo(p.x,0);ctx.lineTo(p.x,560);ctx.stroke();}for(let y=Math.floor((camera.y-310/camera.scale)/40)*40;y<camera.y+310/camera.scale;y+=40){const p=worldToScreen(0,y);ctx.beginPath();ctx.moveTo(0,p.y);ctx.lineTo(390,p.y);ctx.stroke();}state.pellets.forEach(d=>drawCircle(d,d.color));state.ejected.forEach(m=>drawCircle(m,m.color));state.bots.forEach((b,i)=>drawCircle(b,i%2?'#ff3b86':'#22f4ee',b.name));state.cells.forEach(c=>drawCircle(c,'#7c5cff','YOU'));ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(260,12,112,104);ctx.fillStyle='#fff';ctx.font='700 12px sans-serif';ctx.fillText('leaderboard',270,30);state.leaderboard.forEach((row,i)=>ctx.fillText((i+1)+'. '+row.name,270,48+i*14));if(state.mode!=='playing'){ctx.fillStyle='#fff';ctx.font='28px sans-serif';ctx.fillText(state.mode==='won'?'吞完了':'被吞了',145,270);}const playerMass=Math.round(state.cells.reduce((a,c)=>a+massOf(c.r),0));document.getElementById('hud').textContent=state.mode+' · mass '+playerMass+' · cells '+state.cells.length+' · leaderboard '+state.leaderboard.map(x=>x.name).join('/');}
      document.getElementById('splitBtn').addEventListener('click',splitCells);document.getElementById('ejectBtn').addEventListener('click',ejectMass);document.getElementById('resetBtn').addEventListener('click',reset);reset();setInterval(()=>step(16),16);window.advanceTime=(ms)=>{for(let i=0;i<Math.max(1,Math.round(ms/16));i++)step(16);};window.render_game_to_text=()=>JSON.stringify({coordinate_system:'world '+worldWidth+'x'+worldHeight+' with camera projected to canvas 390x560',mode:state.mode,score:state.score,worldWidth,camera,cells:state.cells.map(c=>({x:Math.round(c.x),y:Math.round(c.y),r:Math.round(c.r)})),pellets:state.pellets.length,splitCells:state.cells.length,ejectMass:state.ejected.length,leaderboard:state.leaderboard});
    `,
  },
  snakeBattleBaseGame,
  {
    id: 'qingjiao-sim',
    file: 'qingjiao-sim.html',
    title: '青椒模拟器',
    kind: '经营',
    sourceGame: '青椒模拟器式高校青年教师生存经营',
    accent: '#21c26b',
    summary: '申请教职、招学生、投基金、发论文，在非升即走里保住心态。',
    markup: `
      <section class="panel" id="applyPanel">
        <label class="field-label">学科大类<select id="disciplineSelect" class="input"><option>计算机</option><option>材料</option><option>外语</option><option>医学</option><option>人文社科</option></select></label>
        <label class="field-label">院系气质<select id="schoolSelect" class="input"><option>双一流卷王学院</option><option>地方重点实验室</option><option>新校区交叉中心</option><option>沿海产业学院</option></select></label>
        <button class="primary" id="applyBtn">申请教职</button>
      </section>
      <section class="panel compact">
        <div class="sim-header"><b id="jobTitle">待入职</b><span id="quarterText">申请系统</span></div>
        <div class="stat-grid" id="qjStats"></div>
      </section>
      <section class="panel compact" id="actionPanel"></section>
      <section class="panel compact"><p class="kicker">团队</p><div class="student-list" id="studentList"></div></section>
      <section class="result-card"><p class="kicker">校园动态</p><div class="timeline" id="qjLog"></div></section>
    `,
    script: `
      const disciplineSelect=document.getElementById('disciplineSelect');
      const schoolSelect=document.getElementById('schoolSelect');
      const quarterActions=[
        {id:'fund',label:'投国自然',cost:{mindset:-8,funding:-6},gain:{funding:24,reputation:8},risk:'reject'},
        {id:'paper',label:'改论文',cost:{mindset:-12,funding:-3},gain:{papers:1,reputation:6},risk:'revise'},
        {id:'student',label:'招学生',cost:{funding:-8,mindset:-4},gain:{students:1,papers:.35},risk:'drama'},
        {id:'walk',label:'校园漫步',cost:{funding:0},gain:{mindset:14},risk:'sales'},
        {id:'massage',label:'全身按摩',cost:{funding:-12},gain:{mindset:24},risk:'receipt'},
        {id:'industry',label:'横向项目',cost:{mindset:-6},gain:{funding:18,reputation:2},risk:'scope'}
      ];
      const promotionTrack=[
        {title:'讲师',need:{papers:0,reputation:0}},
        {title:'副教授',need:{papers:3,reputation:22}},
        {title:'特聘教授',need:{papers:8,reputation:55}},
        {title:'院士候选',need:{papers:15,reputation:96}},
        {title:'诺奖传说',need:{papers:24,reputation:150}}
      ];
      const studentNames=['只会开会的博士','夜间爆肝硕士','转码预备役','实验室保安型选手','小红书科研博主','沉默但会写代码的人','永远失联联培生'];
      const randomEvents=[
        {text:'学院突然要求补一版代表作清单。',delta:{mindset:-7,reputation:2}},
        {text:'销售来推 3000 型服务器，报价像科幻小说。',delta:{mindset:-5,funding:-4}},
        {text:'学生把图注写成了表情包。',delta:{mindset:-9,papers:.2}},
        {text:'企业横向款到账，但需求也一起变多了。',delta:{funding:12,mindset:-6}},
        {text:'审稿人 2 说有趣但不够有趣。',delta:{mindset:-8,papers:.25}},
        {text:'学术会议茶歇遇到潜在合作者。',delta:{reputation:5,mindset:3}}
      ];
      window.__QINGJIAO_SIM__={reference:'academic early-career simulator',disciplineSelect:true,quarterActions:quarterActions.map(a=>a.id),promotionTrack:promotionTrack.map(p=>p.title),coreStats:['funding','papers','mindset','reputation','students']};
      const state={mode:'apply',discipline:'计算机',school:'双一流卷王学院',year:1,quarter:1,title:'待入职',funding:28,papers:0,mindset:78,reputation:5,students:[],log:[],ending:null};
      function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
      function seeded(text){let h=53;for(const ch of text)h=(h*33+ch.charCodeAt(0))%99991;return h;}
      function pushLog(text){state.log.unshift('Y'+state.year+'Q'+state.quarter+' · '+text);state.log=state.log.slice(0,8);}
      function applyDelta(delta){Object.entries(delta).forEach(([key,value])=>{if(key==='students')return;state[key]=(state[key]||0)+value;});state.mindset=clamp(state.mindset,0,100);state.funding=clamp(state.funding,0,999);state.reputation=clamp(state.reputation,0,999);state.papers=Math.max(0,Number(state.papers.toFixed(2)));}
      function currentRank(){let rank=promotionTrack[0];for(const item of promotionTrack){if(state.papers>=item.need.papers&&state.reputation>=item.need.reputation)rank=item;}return rank;}
      function updateTitle(){state.title=currentRank().title;}
      function applyJob(){
        state.mode='play';state.discipline=disciplineSelect.value;state.school=schoolSelect.value;state.year=1;state.quarter=1;state.funding=28;state.papers=0;state.mindset=78;state.reputation=5;state.students=[];state.log=[];state.ending=null;updateTitle();
        pushLog('入职 '+state.school+'，方向是'+state.discipline+'，启动经费像试用装。');
        render();
      }
      function recruitStudent(){
        const idx=(state.students.length*3+seeded(state.discipline+state.school))%studentNames.length;
        state.students.push({name:studentNames[idx],mood:62+state.students.length*4,output:.25+state.students.length*.08});
      }
      function resolveRisk(action){
        const tick=seeded(action.id+state.year+'-'+state.quarter+state.discipline)+state.students.length*17+Math.round(state.papers*10);
        if(tick%5!==0)return null;
        const copy={reject:'基金未中，系统建议明年继续努力。',revise:'返修意见要求补实验和补灵魂。',drama:'学生说想 gap 一周整理人生。',sales:'散步时被科研设备销售精准捕获。',receipt:'按摩发票被财务退回。',scope:'企业说只是顺便加一个小需求。'}[action.risk];
        return {text:copy,delta:{mindset:-6,reputation: action.risk==='scope'?2:0}};
      }
      function doAction(id){
        if(state.mode!=='play')return;
        const action=quarterActions.find(item=>item.id===id);
        if(!action)return;
        applyDelta(action.cost||{});
        applyDelta(action.gain||{});
        if(id==='student')recruitStudent();
        state.students.forEach(s=>{s.mood=clamp(s.mood-3+Math.round(state.mindset/40),12,100);state.papers+=s.output*(s.mood/100);});
        const risk=resolveRisk(action);
        if(risk){applyDelta(risk.delta);pushLog(risk.text);}else pushLog(action.label+'完成，CV 多了一行但头发少了一点。');
        const event=randomEvents[(state.year*4+state.quarter+state.students.length)%randomEvents.length];
        applyDelta(event.delta);pushLog(event.text);
        advanceQuarter();
        render();
      }
      function advanceQuarter(){
        state.quarter+=1;
        if(state.quarter>4){state.quarter=1;state.year+=1;pushLog('年度考核：论文 '+state.papers.toFixed(1)+'，经费 '+Math.round(state.funding)+'，心态 '+Math.round(state.mindset)+'。');}
        updateTitle();
        if(state.mindset<=0)finish('心态清零，转岗去图书馆守门。');
        if(state.funding<=0&&state.year>2)finish('经费断供，课题组进入省电模式。');
        if(state.year>6&&state.title==='讲师')finish('非升即走考核失败，被迫体面告别。');
        if(state.title==='诺奖传说')finish('你把评审意见写进获奖感言，青椒人生圆满。');
      }
      function finish(text){state.mode='ended';state.ending=text;pushLog(text);}
      function reset(){state.mode='apply';state.title='待入职';state.log=[];state.students=[];state.ending=null;render();}
      function render(){
        document.getElementById('applyPanel').classList.toggle('hidden',state.mode!=='apply');
        document.getElementById('jobTitle').textContent=state.title;
        document.getElementById('quarterText').textContent=state.mode==='apply'?'申请系统':'第 '+state.year+' 年 Q'+state.quarter;
        document.getElementById('qjStats').innerHTML=[
          ['经费',Math.round(state.funding)],['论文',state.papers.toFixed(1)],['心态',Math.round(state.mindset)],['声望',Math.round(state.reputation)],['学生',state.students.length]
        ].map(([k,v])=>'<span><b>'+v+'</b><i>'+k+'</i></span>').join('');
        const panel=document.getElementById('actionPanel');
        if(state.mode==='apply')panel.innerHTML='<p class="kicker">入职须知</p><p class="summary">选择学科和院系后开始六年考核。目标是升职、发论文、别把心态耗光。</p>';
        else if(state.mode==='ended')panel.innerHTML='<p class="kicker">结局</p><h2>'+state.ending+'</h2><button class="primary" id="qjRestart">重新申请</button>';
        else panel.innerHTML='<p class="kicker">本季度行动</p><div class="action-grid">'+quarterActions.map(a=>'<button class="choice" data-qj-action="'+a.id+'"><b>'+a.label+'</b><span>'+Object.entries(a.gain||{}).map(([k,v])=>k+' '+(v>0?'+':'')+v).join(' · ')+'</span></button>').join('')+'</div>';
        panel.querySelectorAll('[data-qj-action]').forEach(btn=>btn.addEventListener('click',()=>doAction(btn.dataset.qjAction)));
        const restart=document.getElementById('qjRestart');if(restart)restart.addEventListener('click',reset);
        document.getElementById('studentList').innerHTML=state.students.length?state.students.map(s=>'<span><b>'+s.name+'</b><i>心气 '+s.mood+' · 产出 '+s.output.toFixed(2)+'</i></span>').join(''):'<span><b>暂无学生</b><i>先去招生</i></span>';
        document.getElementById('qjLog').innerHTML=(state.log.length?state.log:['等待教职申请。']).map(item=>'<span>'+item+'</span>').join('');
      }
      document.getElementById('applyBtn').addEventListener('click',applyJob);
      render();
      window.advanceTime=(ms)=>{const steps=Math.max(1,Math.floor(ms/1200));for(let i=0;i<steps&&state.mode==='play';i++)doAction(quarterActions[i%quarterActions.length].id);};
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM academic simulator',mode:state.mode,discipline:state.discipline,school:state.school,year:state.year,quarter:state.quarter,title:state.title,funding:state.funding,papers:Number(state.papers.toFixed(2)),mindset:state.mindset,reputation:state.reputation,students:state.students,ending:state.ending,log:state.log});
    `,
  },
  {
    id: 'life-restart-fake',
    file: 'life-restart-fake.html',
    title: '人生重开模拟器',
    kind: '重开',
    sourceGame: 'LifeRestart 式天赋属性人生事件流',
    accent: '#ffcf33',
    summary: '抽天赋、分配属性、逐岁推进，看这一局人生如何离谱收束。',
    markup: `
      <section class="panel" id="lifeSetup">
        <p class="kicker">天赋池</p>
        <div class="chip-pool" id="talentPool"></div>
        <p class="kicker">属性点</p>
        <div class="alloc-grid" id="allocatePoints"></div>
        <button class="primary" id="startLife">开始重开</button>
      </section>
      <section class="panel compact">
        <div class="sim-header"><b id="lifeAge">等待出生</b><span id="lifeRank">未评价</span></div>
        <div class="stat-grid" id="lifeStats"></div>
      </section>
      <section class="panel compact"><button class="primary" id="nextYear">下一岁</button><button class="primary" id="autoLife">自动到结局</button><button class="primary" id="restartLife">重新抽卡</button></section>
      <section class="result-card"><p class="kicker">人生事件</p><div class="timeline" id="eventTimeline"></div></section>
    `,
    script: `
      const talentPool=[
        {id:'rich',name:'家境殷实',desc:'家境+3，快乐+1',delta:{money:3,happy:1}},
        {id:'genius',name:'天赋异禀',desc:'智力+3',delta:{intelligence:3}},
        {id:'fit',name:'身体倍棒',desc:'体质+3',delta:{health:3}},
        {id:'pretty',name:'人见人爱',desc:'魅力+3',delta:{charm:3}},
        {id:'late',name:'大器晚成',desc:'40 岁后全属性补偿',delta:{}},
        {id:'otaku',name:'互联网原住民',desc:'快乐+2，体质-1',delta:{happy:2,health:-1}},
        {id:'lucky',name:'祖传锦鲤',desc:'随机事件更容易变好',delta:{luck:3}},
        {id:'fragile',name:'玻璃心',desc:'快乐-2，魅力+1',delta:{happy:-2,charm:1}}
      ];
      const allocatePoints=['颜值','智力','体质','家境'];
      const statMap={颜值:'charm',智力:'intelligence',体质:'health',家境:'money'};
      const eventTimeline=[
        {age:0,text:'你出生了，全家正在研究你像谁。',effect:{happy:1}},
        {age:3,text:'你学会抢遥控器，人生第一次掌握控制权。',effect:{charm:1}},
        {age:6,text:'你进入小学，作业开始刷新。',effect:{intelligence:1,happy:-1}},
        {age:12,text:'你发现排名是一种大型多人游戏。',effect:{intelligence:1,happy:-2}},
        {age:18,text:'高考结束，你对概率有了全新理解。',effect:{intelligence:2,happy:1}},
        {age:22,text:'毕业时你同时拥有理想和账单。',effect:{money:-1,intelligence:1}},
        {age:28,text:'你开始在工作群里熟练使用收到。',effect:{money:2,happy:-2}},
        {age:35,text:'你意识到体检报告比朋友圈更诚实。',effect:{health:-2,money:1}},
        {age:45,text:'你学会把焦虑包装成稳定。',effect:{happy:-1,money:2}},
        {age:60,text:'你终于拥有了慢下来的资格。',effect:{happy:2,health:-1}},
        {age:75,text:'你开始给年轻人讲你当年也很抽象。',effect:{happy:1,health:-2}},
        {age:90,text:'你把这一生压缩成几句没人能反驳的话。',effect:{happy:2,health:-3}}
      ];
      window.__LIFE_RESTART_SIM__={reference:'life restart simulator clone',talentPool:talentPool.map(t=>t.id),allocatePoints,eventTimeline:eventTimeline.map(e=>e.age),stats:['charm','intelligence','health','money','happy','luck']};
      const state={mode:'setup',age:0,lifespan:80,pointsLeft:20,alloc:{颜值:5,智力:5,体质:5,家境:5},talents:[],stats:{charm:5,intelligence:5,health:5,money:5,happy:5,luck:0},events:[],summaryRank:'未评价'};
      function hash(text){let h=61;for(const ch of text)h=(h*31+ch.charCodeAt(0))%104729;return h;}
      function drawTalents(){
        const seed=hash(new Date().toDateString());
        state.talents=[];
        const used=new Set();
        let cursor=0;
        while(state.talents.length<5&&cursor<talentPool.length*2){
          const talent=talentPool[(seed+cursor*3+cursor*cursor)%talentPool.length];
          if(!used.has(talent.id)){used.add(talent.id);state.talents.push(talent);}
          cursor++;
        }
        talentPool.forEach(talent=>{if(state.talents.length<5&&!used.has(talent.id)){used.add(talent.id);state.talents.push(talent);}});
      }
      function totalAlloc(){return Object.values(state.alloc).reduce((a,b)=>a+b,0);}
      function setAlloc(name,delta){const next=state.alloc[name]+delta;if(next<0||next>10)return;const total=totalAlloc()+delta;if(total>20)return;state.alloc[name]=next;render();}
      function applyEffect(effect){Object.entries(effect||{}).forEach(([key,value])=>{state.stats[key]=(state.stats[key]||0)+value;});Object.keys(state.stats).forEach(key=>state.stats[key]=Math.max(0,Math.min(18,state.stats[key])));}
      function restartLife(){state.mode='setup';state.age=0;state.lifespan=80;state.pointsLeft=20;state.alloc={颜值:5,智力:5,体质:5,家境:5};state.stats={charm:5,intelligence:5,health:5,money:5,happy:5,luck:0};state.events=[];state.summaryRank='未评价';drawTalents();render();}
      function start(){
        state.mode='life';state.age=0;state.events=[];state.stats={charm:state.alloc.颜值,intelligence:state.alloc.智力,health:state.alloc.体质,money:state.alloc.家境,happy:5,luck:0};
        state.talents.forEach(t=>applyEffect(t.delta));
        state.lifespan=62+state.stats.health*3+state.stats.money+state.stats.luck;
        pushEvent('0岁：带着 '+state.talents.map(t=>t.name).join('、')+' 开局。');
        render();
      }
      function pushEvent(text){state.events.unshift(text);state.events=state.events.slice(0,12);}
      function yearlyEvent(){
        const base=eventTimeline.filter(e=>e.age<=state.age).slice(-1)[0]||eventTimeline[0];
        applyEffect(base.effect);
        let text=state.age+'岁：'+base.text;
        if(state.talents.some(t=>t.id==='late')&&state.age===40){applyEffect({charm:2,intelligence:2,health:2,money:2,happy:2});text+=' 大器晚成触发，人生突然开始回本。';}
        if((state.age+state.stats.luck)%9===0){applyEffect({happy:2,money:1});text+=' 锦鲤事件发生，今天没有被生活暴击。';}
        if(state.stats.health<=0){state.lifespan=state.age;text+=' 体质归零，人生提前结算。';}
        pushEvent(text);
      }
      function nextYear(){
        if(state.mode==='setup')start();
        if(state.mode!=='life')return;
        state.age+=1;
        yearlyEvent();
        if(state.age>=state.lifespan||state.stats.health<=0)finish();
        render();
      }
      function finish(){state.mode='ended';const score=state.stats.charm+state.stats.intelligence+state.stats.health+state.stats.money+state.stats.happy+state.stats.luck+Math.floor(state.age/5);state.summaryRank=score>70?'SSR 传奇重开':score>54?'SR 体面人生':score>38?'R 普通但能截图':'N 建议再开';pushEvent('结局：活到 '+state.age+' 岁，评级 '+state.summaryRank+'。');}
      function autoRun(){if(state.mode==='setup')start();let guard=0;while(state.mode==='life'&&guard<110){nextYear();guard++;}render();}
      function render(){
        document.getElementById('lifeSetup').classList.toggle('hidden',state.mode!=='setup');
        document.getElementById('talentPool').innerHTML=state.talents.map(t=>'<button class="chip picked" type="button"><b>'+t.name+'</b><small>'+t.desc+'</small></button>').join('');
        document.getElementById('allocatePoints').innerHTML=allocatePoints.map(name=>'<div class="alloc-row"><span>'+name+'</span><button data-alloc="'+name+'" data-delta="-1">-</button><b>'+state.alloc[name]+'</b><button data-alloc="'+name+'" data-delta="1">+</button></div>').join('');
        document.querySelectorAll('[data-alloc]').forEach(btn=>btn.addEventListener('click',()=>setAlloc(btn.dataset.alloc,Number(btn.dataset.delta))));
        document.getElementById('lifeAge').textContent=state.mode==='setup'?'等待出生':state.age+' 岁';
        document.getElementById('lifeRank').textContent=state.summaryRank;
        document.getElementById('lifeStats').innerHTML=[
          ['颜值',state.stats.charm],['智力',state.stats.intelligence],['体质',state.stats.health],['家境',state.stats.money],['快乐',state.stats.happy],['幸运',state.stats.luck]
        ].map(([k,v])=>'<span><b>'+v+'</b><i>'+k+'</i></span>').join('');
        document.getElementById('nextYear').disabled=state.mode==='ended';
        document.getElementById('eventTimeline').innerHTML=(state.events.length?state.events:['分配属性后开始重开。']).map(item=>'<span>'+item+'</span>').join('');
      }
      document.getElementById('startLife').addEventListener('click',start);
      document.getElementById('nextYear').addEventListener('click',nextYear);
      document.getElementById('autoLife').addEventListener('click',autoRun);
      document.getElementById('restartLife').addEventListener('click',restartLife);
      window.restartLife=restartLife;
      drawTalents();render();
      window.advanceTime=(ms)=>{const steps=Math.max(1,Math.floor(ms/350));for(let i=0;i<steps;i++)nextYear();};
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM life timeline simulator',mode:state.mode,age:state.age,lifespan:state.lifespan,summaryRank:state.summaryRank,talents:state.talents.map(t=>t.name),allocatePoints:state.alloc,stats:state.stats,eventTimeline:state.events});
    `,
  },
  {
    id: 'twitter-governance',
    file: 'twitter-governance.html',
    title: '推特治国',
    kind: '模拟',
    sourceGame: '特朗普式社交媒体治国恶搞模拟',
    accent: '#2aa3ff',
    summary: '刷新闻、语音/文本发帖、给幕僚下命令，用一条条动态维持混乱热度。',
    markup: `
      <section class="x-app" aria-label="X parody governance simulator">
        <header class="x-header">
          <button type="button" aria-label="profile">T</button>
          <b>X</b>
          <button type="button" id="agentBtn">AI</button>
        </header>
        <nav class="x-top-tabs" id="xTopTabs" aria-label="Timeline tabs">
          <button class="active" id="forYouTab" type="button">For you</button>
          <button type="button">Following</button>
        </nav>
        <div class="x-status-strip" id="governStats"></div>
        <section class="x-composer-inline" id="tweetComposer">
          <span class="x-avatar">T</span>
          <div class="x-compose-body">
            <textarea id="tweetInput" maxlength="220" placeholder="What is happening?!"></textarea>
            <div class="x-compose-tools">
              <button type="button" id="voiceBtn">🎙</button>
              <button type="button" id="commandToggle">命令</button>
              <button type="button" id="sendTweet">Post</button>
            </div>
          </div>
        </section>
        <section class="x-timeline" id="xTimeline">
          <div class="news-feed" id="newsFeed"></div>
        </section>
        <section class="x-drawer" id="commandPanel">
          <div class="x-drawer-head"><b>Executive group chat</b><span id="turnText">第 1 小时</span></div>
          <div class="advisor-roster" id="advisorRoster"></div>
          <div class="timeline command-log" id="orderLog"></div>
          <details class="key-drawer">
            <summary>OpenRouter agent · <span id="agentState">LOCAL</span></summary>
            <input id="openRouterKey" type="password" autocomplete="off" placeholder="sk-or-...">
            <input id="openRouterModel" autocomplete="off" value="openai/gpt-4o-mini">
            <button class="primary" id="saveKeyBtn">保存</button>
          </details>
        </section>
        <button class="floating-compose" id="floatingCompose" type="button" aria-label="compose">＋</button>
        <nav class="bottom-nav" id="bottomNav" aria-label="X style bottom navigation">
          <button type="button">⌂</button>
          <button type="button">⌕</button>
          <button type="button">◯</button>
          <button type="button">✉</button>
        </nav>
      </section>
    `,
    script: `
      const OpenRouter={storageKey:'printer_openrouter_key',modelKey:'printer_openrouter_model',endpoint:'https:'+'//openrouter.ai/api/v1/chat/completions'};
      const advisorRoster=[
        {id:'press',name:'新闻秘书',order:'开记者会',gain:{approval:3,chaos:4},tone:'把问题改成口号'},
        {id:'treasury',name:'财政高管',order:'稳住市场',gain:{market:7,budget:-4,chaos:-2},tone:'把曲线画成向上'},
        {id:'security',name:'安全顾问',order:'边境加压',gain:{diplomacy:-5,approval:4,chaos:6},tone:'把地图涂红'},
        {id:'staff',name:'幕僚长',order:'收手机',gain:{chaos:-8,approval:-2,market:2},tone:'降低发帖频率'},
        {id:'campaign',name:'竞选经理',order:'造势巡演',gain:{approval:6,budget:-6,chaos:5},tone:'把每个场馆喊满'}
      ];
      const localNews=[
        '市场等待凌晨动态，期货像心电图。',
        '外媒统计：一个形容词让三国外交部加班。',
        '硅谷高管排队解释自己不是那个意思。',
        '幕僚称总统只是用大写字母表达热情。',
        '电视台把一条短帖拆成六小时特别节目。',
        '民调显示支持者更兴奋，反对者更清醒。',
        '白宫打印机因命令过多进入冷却模式。'
      ];
      window.__TWITTER_GOVERNANCE_SIM__={reference:'Trump social-media governance parody',OpenRouter:{supported:true,endpointParts:['https:','//openrouter.ai/api/v1/chat/completions'],modelDefault:'openai/gpt-4o-mini'},speechRecognition:true,newsAgentLoop:true,tweetComposer:true,commandPanel:true,advisorRoster:advisorRoster.map(a=>a.id),stats:['approval','market','chaos','diplomacy','budget']};
      const state={hour:1,approval:48,market:55,chaos:31,diplomacy:50,budget:72,heat:12,agent:false,agentBusy:false,lastTweet:'',newsFeed:[],orders:[],tweets:[],ending:null};
      const $=(id)=>document.getElementById(id);
      function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
      function esc(value){return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
      function pushNews(text,source='local'){state.newsFeed.unshift({text:String(text).slice(0,160),source,hour:state.hour});state.newsFeed=state.newsFeed.slice(0,9);}
      function pushOrder(text){state.orders.unshift('H'+state.hour+' · '+text);state.orders=state.orders.slice(0,8);}
      function applyDelta(delta){Object.entries(delta||{}).forEach(([key,value])=>{state[key]=clamp((state[key]||0)+value,0,100);});}
      function tweetImpact(text){
        const upper=(text.match(/[A-Z]/g)||[]).length;
        const bangs=(text.match(/[!！]/g)||[]).length;
        const hasMarket=/tax|tariff|关税|股|币|oil|market/i.test(text);
        const hasWar=/wall|border|war|边境|战争|制裁/i.test(text);
        const hasFake=/fake|假|媒体|witch/i.test(text);
        return {approval:2+Math.min(5,bangs),market:hasMarket?-8:1,chaos:6+Math.min(12,upper)+bangs*2,diplomacy:hasWar?-7:(hasFake?-2:0),heat:10+bangs*3};
      }
      function tickConsequences(){
        state.hour+=1;
        state.chaos=clamp(state.chaos-1+Math.round(state.heat/22),0,100);
        state.market=clamp(state.market+(state.chaos>58?-3:1),0,100);
        state.approval=clamp(state.approval+(state.heat>40?1:0)+(state.market<35?-2:0),0,100);
        state.diplomacy=clamp(state.diplomacy+(state.chaos>66?-3:1),0,100);
        state.budget=clamp(state.budget-1,0,100);
        state.heat=clamp(state.heat-5,0,100);
        if(state.chaos>=95)state.ending='信息风暴失控，所有幕僚同时开飞行模式。';
        if(state.approval>=82&&state.market>=55)state.ending='你把混乱包装成增长，粉丝宣布这就是治理。';
        if(state.market<=8)state.ending='市场闪崩，电视台把走势图做成恐怖片。';
        if(state.diplomacy<=5)state.ending='外交群聊全员已读不回。';
      }
      function sendTweet(){
        const input=$('tweetInput');
        const text=input.value.trim();
        if(!text)return;
        state.lastTweet=text;
        state.tweets.unshift(text);
        state.tweets=state.tweets.slice(0,7);
        applyDelta(tweetImpact(text));
        pushNews('特朗普模拟号发帖：'+text,'tweet');
        pushOrder('发帖完成，热度 +'+Math.min(26,10+(text.match(/[!！]/g)||[]).length*3)+'。');
        input.value='';
        tickConsequences();
        if(state.agent)requestAgentNews('tweet');
        render();
      }
      function issueOrder(id){
        const advisor=advisorRoster.find(a=>a.id===id);
        if(!advisor)return;
        applyDelta(advisor.gain);
        state.heat=clamp(state.heat+4,0,100);
        pushOrder(advisor.name+'执行：'+advisor.order+'，'+advisor.tone+'。');
        pushNews(advisor.name+'收到命令：'+advisor.order+'。','order');
        tickConsequences();
        if(state.agent)requestAgentNews('order');
        render();
      }
      function localAgentNews(reason='loop'){
        const base=localNews[(state.hour+state.newsFeed.length+state.chaos)%localNews.length];
        const metric=state.chaos>62?'混乱指数飙升':state.market<35?'市场承压':state.approval>60?'粉丝热情上升':'内阁等待下一条动态';
        pushNews(base+' '+metric+'。',reason==='loop'?'agent':'local');
      }
      function getKey(){return (window.OPENROUTER_API_KEY||localStorage.getItem(OpenRouter.storageKey)||'').trim();}
      function getModel(){return ($('openRouterModel').value||localStorage.getItem(OpenRouter.modelKey)||'openai/gpt-4o-mini').trim();}
      async function askOpenRouter(reason){
        const key=getKey();
        if(!key||key.length<12)return null;
        const model=getModel();
        const payload={
          model,
          messages:[
            {role:'system',content:'你是一个讽刺政治游戏的新闻 Agent。生成虚构、短促、像社交媒体热搜的中文新闻。不要声称是真实新闻，不要给现实投票建议。只输出一句，不超过45字。'},
            {role:'user',content:'状态：支持率'+state.approval+' 市场'+state.market+' 混乱'+state.chaos+' 外交'+state.diplomacy+' 预算'+state.budget+'。最近发帖：'+(state.lastTweet||'无')+'。触发：'+reason}
          ],
          max_tokens:70,
          temperature:.9
        };
        const response=await fetch(OpenRouter.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key,'HTTP-Referer':location.origin,'X-Title':'Printer Fake Game Library'},body:JSON.stringify(payload)});
        if(!response.ok)throw new Error('OpenRouter '+response.status);
        const data=await response.json();
        return data&&data.choices&&data.choices[0]&&data.choices[0].message?data.choices[0].message.content:null;
      }
      async function requestAgentNews(reason='manual'){
        if(state.agentBusy)return;
        state.agentBusy=true;
        render();
        try{
          const text=await askOpenRouter(reason);
          if(text)pushNews(text.replace(/^["“”]+|["“”]+$/g,''),'OpenRouter');
          else localAgentNews(reason);
        }catch(error){
          pushNews('Agent 连接失败，切回本地热搜引擎。','fallback');
          localAgentNews(reason);
        }finally{
          state.agentBusy=false;
          render();
        }
      }
      function newsAgentLoop(){
        if(state.ending)return;
        if(state.agent)requestAgentNews('loop');
        else localAgentNews('loop');
        tickConsequences();
        render();
      }
      let speechRecognition=null;
      const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(SpeechRecognition){
        speechRecognition=new SpeechRecognition();
        speechRecognition.lang='zh-CN';
        speechRecognition.interimResults=false;
        speechRecognition.onresult=(event)=>{const text=event.results&&event.results[0]&&event.results[0][0]?event.results[0][0].transcript:'';$('tweetInput').value=($('tweetInput').value+' '+text).trim();pushOrder('语音输入完成。');render();};
        speechRecognition.onerror=()=>{pushOrder('语音识别失败，改用手打。');render();};
      }
      function startVoice(){
        if(!speechRecognition){pushOrder('当前浏览器不支持 speechRecognition。');render();return;}
        try{speechRecognition.start();pushOrder('正在听写动态。');render();}catch(error){pushOrder('语音通道已占用。');render();}
      }
      function saveKey(){
        const key=$('openRouterKey').value.trim();
        const model=$('openRouterModel').value.trim()||'openai/gpt-4o-mini';
        if(key)localStorage.setItem(OpenRouter.storageKey,key);
        localStorage.setItem(OpenRouter.modelKey,model);
        pushOrder(key?'OpenRouter key 已保存在本机浏览器。':'模型已保存，key 为空时使用本地新闻。');
        render();
      }
      function render(){
        $('turnText').textContent=state.ending?'结局':'第 '+state.hour+' 小时';
        $('agentState').textContent=state.agentBusy?'AGENT...':(state.agent?(getKey()?'OPENROUTER':'LOCAL AGENT'):'LOCAL');
        $('governStats').innerHTML=[
          ['支持',state.approval],['市场',state.market],['混乱',state.chaos],['外交',state.diplomacy],['预算',state.budget],['热度',state.heat]
        ].map(([k,v])=>'<span><b>'+Math.round(v)+'</b><i>'+k+'</i></span>').join('');
        const names={system:['模拟白宫','@parodydesk','T','#1d9bf0'],tweet:['Donald J. Parody','@realParodyDesk','T','#1d9bf0'],order:['Executive Office','@cabinet_room','E','#7856ff'],agent:['Breaking News','@trendwire','B','#00ba7c'],local:['Trend Desk','@local_agent','L','#f91880'],OpenRouter:['AI Wire','@openrouter_agent','AI','#1d9bf0'],fallback:['Signal Lost','@fallback','F','#ffd400'],start:['X','@home','X','#273340']};
        $('newsFeed').innerHTML=(state.newsFeed.length?state.newsFeed:[{text:'凌晨时间线空白，等待第一条动态。',source:'start',hour:1}]).map((item,index)=>{
          const meta=names[item.source]||names.local;
          const replies=Math.max(1,Math.round((state.chaos+index*3)/6));
          const reposts=Math.max(1,Math.round((state.heat+index*5)/5));
          const likes=Math.max(8,Math.round((state.approval+state.heat)*2.1)+index*11);
          const views=Math.max(1,Math.round((likes+reposts)*.42));
          return '<article data-avatar="'+esc(meta[2])+'" style="--tweet-avatar:'+esc(meta[3])+'"><header><b>'+esc(meta[0])+'</b><span>'+esc(meta[1])+'</span><span>·</span><span>'+esc(item.hour)+'h</span></header><p>'+esc(item.text)+'</p><div class="tweet-actions"><span>💬 '+replies+'</span><span>↻ '+reposts+'</span><span>♡ '+likes+'</span><span>▥ '+views+'K</span></div></article>';
        }).join('');
        $('advisorRoster').innerHTML=advisorRoster.map(a=>'<button class="choice" data-order="'+a.id+'"><b>'+a.name+'</b><span>'+a.order+'</span></button>').join('');
        $('advisorRoster').querySelectorAll('[data-order]').forEach(btn=>btn.addEventListener('click',()=>issueOrder(btn.dataset.order)));
        $('orderLog').innerHTML=(state.ending?[state.ending].concat(state.orders):state.orders.length?state.orders:['等待发帖或命令。']).map(item=>'<span>'+esc(item)+'</span>').join('');
        $('agentBtn').textContent=state.agent?'ON':'AI';
        $('sendTweet').disabled=Boolean(state.ending);
      }
      $('sendTweet').addEventListener('click',sendTweet);
      $('tweetInput').addEventListener('keydown',(event)=>{if((event.metaKey||event.ctrlKey)&&event.key==='Enter')sendTweet();});
      $('voiceBtn').addEventListener('click',startVoice);
      $('agentBtn').addEventListener('click',()=>{state.agent=!state.agent;pushOrder(state.agent?'新闻 Agent 已开启。':'新闻 Agent 已关闭。');if(state.agent)requestAgentNews('toggle');render();});
      $('commandToggle').addEventListener('click',()=>$('commandPanel').classList.toggle('is-open'));
      $('floatingCompose').addEventListener('click',()=>{$('tweetInput').focus();window.scrollTo({top:$('tweetComposer').offsetTop-90,behavior:'smooth'});});
      $('saveKeyBtn').addEventListener('click',saveKey);
      $('openRouterModel').value=localStorage.getItem(OpenRouter.modelKey)||'openai/gpt-4o-mini';
      pushNews('模拟账号上线：所有动态均为恶搞，不代表真实发言。','system');
      render();
      const loopTimer=setInterval(newsAgentLoop,7600);
      window.sendTweet=sendTweet;
      window.issueOrder=issueOrder;
      window.newsAgentLoop=newsAgentLoop;
      window.advanceTime=(ms)=>{const steps=Math.max(1,Math.floor(ms/1800));for(let i=0;i<steps;i++)newsAgentLoop();};
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM social timeline simulator',hour:state.hour,agent:state.agent,agentBusy:state.agentBusy,keyPresent:Boolean(getKey()),approval:state.approval,market:state.market,chaos:state.chaos,diplomacy:state.diplomacy,budget:state.budget,heat:state.heat,lastTweet:state.lastTweet,newsFeed:state.newsFeed.slice(0,5),orders:state.orders.slice(0,5),ending:state.ending,advisorRoster:advisorRoster.map(a=>a.id),speechRecognition:Boolean(speechRecognition),loopTimer:Boolean(loopTimer)});
    `,
  },
  {
    id: 'io-arena-template',
    file: 'io-arena-template.html',
    title: '空投乱斗.io 模板',
    kind: '模板',
    sourceGame: 'Wings.io / Starblast.io / 俯视 .io 射击母版',
    accent: '#22f4ee',
    summary: '双摇杆、空投武器、bot、假排行榜和换皮入口，给后续 .io 射击赝品复用。',
    canvas: true,
    markup: `
      <canvas id="gameCanvas" width="390" height="560" class="play-canvas"></canvas>
      <section class="panel compact">
        <p id="hud">双摇杆开打</p>
        <div class="row">
          <button class="primary" id="skinBtn">换皮</button>
          <button class="primary" id="dropBtn">补给</button>
          <button class="primary" id="boostBtn">冲刺</button>
          <button class="primary" id="resetBtn">重开</button>
        </div>
      </section>
    `,
    script: `
      const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
      const controlScheme='dual-thumb touchsticks';
      const skins=[
        {id:'neon',bg:'#05070f',grid:'rgba(34,244,238,.18)',player:'#22f4ee',enemy:'#ff3b86',ally:'#7c5cff',drop:'#ffd15a',overlay:'rgba(0,0,0,.5)'},
        {id:'sunset',bg:'#12060c',grid:'rgba(255,108,168,.16)',player:'#ff9f68',enemy:'#ff4f87',ally:'#7c5cff',drop:'#22f4ee',overlay:'rgba(18,4,10,.56)'},
        {id:'void',bg:'#030303',grid:'rgba(255,255,255,.1)',player:'#7c5cff',enemy:'#22f4ee',ally:'#ff3b86',drop:'#ffe066',overlay:'rgba(0,0,0,.62)'}
      ];
      const weaponDefs={
        blaster:{label:'BLASTER',rate:.16,speed:430,damage:12,pellets:1,spread:.02,life:.95,color:'#ffffff'},
        spread:{label:'SPREAD',rate:.34,speed:380,damage:8,pellets:5,spread:.34,life:.7,color:'#ffd15a'},
        laser:{label:'LASER',rate:.5,speed:760,damage:26,pellets:1,spread:0,life:.28,color:'#22f4ee'},
        rocket:{label:'ROCKET',rate:.68,speed:300,damage:34,pellets:1,spread:.04,life:1.3,color:'#ff7e68',homing:.08}
      };
      const weaponDrops=['spread','laser','rocket'];
      window.__IO_TEMPLATE__={reference:'portrait io arena shooter template',controlScheme,weaponDrops,skins:skins.map((skin)=>skin.id),hooks:['applyArenaSkin','spawnDrop','spawnBot','drawJoystick']};
      const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
      const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
      function makeRng(seed){let value=seed>>>0;return()=>((value=(value*1664525+1013904223)>>>0)/4294967296);}
      let rng=makeRng(37);
      function rand(){return rng();}
      function pick(list){return list[Math.floor(rand()*list.length)%list.length];}
      function applyArenaSkin(next){if(typeof next==='string'){const found=skins.findIndex((skin)=>skin.id===next);if(found>=0)state.skin=found;}else state.skin=(state.skin+1)%skins.length;render();}
      window.applyArenaSkin=applyArenaSkin;
      const botNames=['ACE','MIST','NOVA','BYTE','JOLT','WING','ARC','DRIFT'];
      const controls={
        left:{name:'move',pointerId:null,anchorX:86,anchorY:474,x:86,y:474,dx:0,dy:0,active:false},
        right:{name:'aim',pointerId:null,anchorX:304,anchorY:474,x:304,y:474,dx:0,dy:0,active:false}
      };
      const state={mode:'playing',time:0,score:0,kills:0,streak:0,skin:0,round:1,nextDrop:3.8,bullets:[],drops:[],bots:[],leaderboard:[],player:null,respawnTimer:0};
      function resetStick(stick){stick.pointerId=null;stick.active=false;stick.dx=0;stick.dy=0;stick.x=stick.anchorX;stick.y=stick.anchorY;}
      function pointerPos(event){const rect=canvas.getBoundingClientRect();return{x:(event.clientX-rect.left)*390/rect.width,y:(event.clientY-rect.top)*560/rect.height};}
      function updateStick(stick,x,y){const dx=x-stick.anchorX,dy=y-stick.anchorY;const length=Math.hypot(dx,dy)||1;const radius=Math.min(46,length);stick.x=stick.anchorX+dx/length*radius;stick.y=stick.anchorY+dy/length*radius;stick.dx=dx/length*Math.min(1,length/46);stick.dy=dy/length*Math.min(1,length/46);}
      function assignStick(stick,x,y,pointerId){stick.pointerId=pointerId;stick.active=true;stick.anchorX=x;stick.anchorY=y;updateStick(stick,x,y);}
      function releaseStick(pointerId){Object.values(controls).forEach((stick)=>{if(stick.pointerId===pointerId)resetStick(stick);});}
      canvas.addEventListener('pointerdown',(event)=>{const pos=pointerPos(event);const stick=pos.x<195?controls.left:controls.right;assignStick(stick,pos.x,pos.y,event.pointerId);canvas.setPointerCapture(event.pointerId);});
      canvas.addEventListener('pointermove',(event)=>{const pos=pointerPos(event);Object.values(controls).forEach((stick)=>{if(stick.pointerId===event.pointerId)updateStick(stick,pos.x,pos.y);});});
      canvas.addEventListener('pointerup',(event)=>{releaseStick(event.pointerId);try{canvas.releasePointerCapture(event.pointerId);}catch{}});canvas.addEventListener('pointercancel',(event)=>releaseStick(event.pointerId));
      function spawnBot(index){const side=index%4;const lane=1+index%4;const x=side===0?28:side===1?362:70+lane*52;const y=side===2?70:side===3?214+lane*32:70+lane*82;return{x,y,vx:0,vy:0,angle:Math.PI/2,hp:56,fire:.5+rand(),weapon:pick(['blaster','spread','laser']),weaponTimer:0,name:botNames[index%botNames.length],score:160+index*25,boost:0};}
      window.spawnBot=spawnBot;
      function spawnDrop(forceType){const type=forceType||pick(weaponDrops);state.drops.push({x:58+rand()*274,y:-20,vy:74+rand()*16,wobble:rand()*Math.PI*2,type,state:'descending',lane:Math.floor(rand()*4),life:18});}
      window.spawnDrop=spawnDrop;
      function resetPlayer(){state.player={x:195,y:438,vx:0,vy:0,angle:-Math.PI/2,hp:100,fire:0,weapon:'blaster',weaponTimer:0,boost:0,name:'YOU'};}
      function reset(){rng=makeRng(37);state.mode='playing';state.time=0;state.score=0;state.kills=0;state.streak=0;state.round=1;state.nextDrop=2.8;state.bullets=[];state.drops=[];state.leaderboard=[];state.respawnTimer=0;resetPlayer();state.bots=Array.from({length:6},(_,index)=>spawnBot(index));resetStick(controls.left);resetStick(controls.right);spawnDrop('spread');updateLeaderboard();render();}
      function fireFrom(ship,owner){const def=weaponDefs[ship.weapon]||weaponDefs.blaster;if(ship.fire>0)return;const baseAngle=ship.angle;for(let i=0;i<def.pellets;i++){const offset=def.pellets===1?0:(i-(def.pellets-1)/2)*def.spread;state.bullets.push({x:ship.x+Math.cos(baseAngle)*18,y:ship.y+Math.sin(baseAngle)*18,angle:baseAngle+offset+(rand()-.5)*def.spread*.3,speed:def.speed,damage:def.damage,life:def.life,color:def.color,owner,homing:def.homing||0});}ship.fire=def.rate;}
      function grantDrop(type){state.player.weapon=type;state.player.weaponTimer=12;}
      function hurtPlayer(amount){if(state.respawnTimer>0)return;state.player.hp-=amount;if(state.player.hp<=0){state.streak=0;state.mode='respawn';state.respawnTimer=1.1;}}
      function killBot(index){state.score+=120;state.kills+=1;state.streak=Math.min(9,state.streak+1);state.bots[index]=spawnBot(index+Math.floor(state.time*10));if(state.kills%4===0)state.round+=1;if(state.drops.length<3)spawnDrop();}
      function updatePlayer(dt){const ship=state.player;ship.fire=Math.max(0,ship.fire-dt);ship.boost=Math.max(0,ship.boost-dt);if(state.respawnTimer>0){state.respawnTimer=Math.max(0,state.respawnTimer-dt);if(state.respawnTimer===0){state.mode='playing';resetPlayer();}return;}const move=controls.left;const aim=controls.right;const speed=(ship.boost>0?310:226);ship.vx=(ship.vx+move.dx*speed)*.78;ship.vy=(ship.vy+move.dy*speed)*.78;ship.x=clamp(ship.x+ship.vx*dt,24,366);ship.y=clamp(ship.y+ship.vy*dt,42,534);if(Math.hypot(move.dx,move.dy)>.08)ship.angle=Math.atan2(move.dy,move.dx);if(Math.hypot(aim.dx,aim.dy)>.14){ship.angle=Math.atan2(aim.dy,aim.dx);fireFrom(ship,'player');}if(ship.weapon!=='blaster'){ship.weaponTimer=Math.max(0,ship.weaponTimer-dt);if(ship.weaponTimer===0)ship.weapon='blaster';}state.drops=state.drops.filter((drop)=>{if(drop.state!=='pickup')return true;if(Math.hypot(ship.x-drop.x,ship.y-drop.y)<28){grantDrop(drop.type);state.score+=25;return false;}return true;});}
      function updateBots(dt){state.bots.forEach((bot,index)=>{bot.fire=Math.max(0,bot.fire-dt);const target=state.player;const angle=Math.atan2(target.y-bot.y,target.x-bot.x);const desired=dist(bot,target)>170?1:.45;const strafe=index%2?1:-1;bot.vx=(bot.vx+Math.cos(angle)*desired*110+Math.cos(angle+Math.PI/2)*strafe*34)*.76;bot.vy=(bot.vy+Math.sin(angle)*desired*110+Math.sin(angle+Math.PI/2)*strafe*34)*.76;bot.x=clamp(bot.x+bot.vx*dt,26,364);bot.y=clamp(bot.y+bot.vy*dt,40,538);bot.angle=angle;if(state.respawnTimer===0&&dist(bot,target)<290&&Math.abs(bot.x-target.x)+Math.abs(bot.y-target.y)<340)fireFrom(bot,'bot-'+index);if(bot.weapon!=='blaster'){bot.weaponTimer=Math.max(0,bot.weaponTimer-dt);if(bot.weaponTimer===0)bot.weapon='blaster';}});}
      function updateDrops(dt){state.drops.forEach((drop)=>{drop.wobble+=dt*4;drop.life-=dt;if(drop.state==='descending'){drop.y+=drop.vy*dt;if(drop.y>126+drop.lane*82){drop.state='pickup';drop.y=126+drop.lane*82;}}else drop.y+=Math.sin(drop.wobble)*.2;});state.drops=state.drops.filter((drop)=>drop.life>0);}
      function updateBullets(dt){state.bullets.forEach((bullet)=>{if(bullet.homing&&bullet.owner==='player'&&state.bots.length){let target=state.bots[0];state.bots.forEach((bot)=>{if(dist(bot,bullet)<dist(target,bullet))target=bot;});const targetAngle=Math.atan2(target.y-bullet.y,target.x-bullet.x);bullet.angle+=Math.atan2(Math.sin(targetAngle-bullet.angle),Math.cos(targetAngle-bullet.angle))*bullet.homing;}if(bullet.homing&&bullet.owner!=='player'&&state.respawnTimer===0){const targetAngle=Math.atan2(state.player.y-bullet.y,state.player.x-bullet.x);bullet.angle+=Math.atan2(Math.sin(targetAngle-bullet.angle),Math.cos(targetAngle-bullet.angle))*bullet.homing;}bullet.x+=Math.cos(bullet.angle)*bullet.speed*dt;bullet.y+=Math.sin(bullet.angle)*bullet.speed*dt;bullet.life-=dt;});state.bullets=state.bullets.filter((bullet)=>{if(bullet.life<=0||bullet.x<-20||bullet.x>410||bullet.y<-20||bullet.y>580)return false;if(bullet.owner==='player'){for(let i=0;i<state.bots.length;i++){const bot=state.bots[i];if(Math.hypot(bot.x-bullet.x,bot.y-bullet.y)<15){bot.hp-=bullet.damage;if(bot.hp<=0)killBot(i);else bot.score=Math.max(10,bot.score-8);return false;}}}else if(state.respawnTimer===0&&Math.hypot(state.player.x-bullet.x,state.player.y-bullet.y)<16){hurtPlayer(bullet.damage);return false;}return true;});}
      function updateLeaderboard(){state.leaderboard=[{name:'YOU',value:state.score+state.kills*110+state.player.hp},{name:'DROP',value:state.drops.length*40},...state.bots.map((bot)=>({name:bot.name,value:Math.round(bot.score+bot.hp)}))].sort((a,b)=>b.value-a.value).slice(0,5);}
      function drawArena(){const skin=skins[state.skin];ctx.fillStyle=skin.bg;ctx.fillRect(0,0,390,560);ctx.strokeStyle=skin.grid;ctx.lineWidth=1;for(let x=15;x<390;x+=39){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,560);ctx.stroke();}for(let y=20;y<560;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(390,y);ctx.stroke();}ctx.fillStyle='rgba(255,255,255,.08)';for(let i=0;i<14;i++){ctx.beginPath();ctx.arc((i*29+state.time*12)%390,((i*47+state.time*18)%620)-30,1.2+(i%3)*.6,0,Math.PI*2);ctx.fill();}}
      function drawShip(ship,color,label){ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-12,-10);ctx.lineTo(-6,0);ctx.lineTo(-12,10);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.95)';ctx.fillRect(-14,-2,7,4);ctx.restore();ctx.fillStyle='#fff';ctx.font='800 10px sans-serif';ctx.textAlign='center';ctx.fillText(label,ship.x,ship.y+24);ctx.textAlign='left';}
      function drawDrop(drop){ctx.save();ctx.translate(drop.x,drop.y);ctx.fillStyle='rgba(255,255,255,.86)';if(drop.state==='descending'){ctx.beginPath();ctx.arc(0,-12,12,Math.PI,0);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.65)';ctx.beginPath();ctx.moveTo(-12,-12);ctx.lineTo(-6,2);ctx.moveTo(12,-12);ctx.lineTo(6,2);ctx.stroke();}ctx.fillStyle=skins[state.skin].drop;ctx.fillRect(-10,0,20,16);ctx.fillStyle='#050505';ctx.font='900 9px sans-serif';ctx.textAlign='center';ctx.fillText(drop.type.slice(0,2).toUpperCase(),0,12);ctx.restore();ctx.textAlign='left';}
      function drawBullet(bullet){ctx.strokeStyle=bullet.color;ctx.lineWidth=bullet.owner==='player'?3:2;ctx.beginPath();ctx.moveTo(bullet.x,bullet.y);ctx.lineTo(bullet.x-Math.cos(bullet.angle)*8,bullet.y-Math.sin(bullet.angle)*8);ctx.stroke();}
      function drawJoystick(stick,tint){ctx.save();ctx.globalAlpha=stick.active ? .34 : .14;ctx.strokeStyle=tint;ctx.lineWidth=2;ctx.beginPath();ctx.arc(stick.anchorX,stick.anchorY,32,0,Math.PI*2);ctx.stroke();ctx.fillStyle=tint;ctx.globalAlpha=stick.active ? .28 : .08;ctx.beginPath();ctx.arc(stick.x,stick.y,16,0,Math.PI*2);ctx.fill();ctx.restore();}
      window.drawJoystick=drawJoystick;
      function render(){drawArena();state.drops.forEach(drawDrop);state.bullets.forEach(drawBullet);state.bots.forEach((bot)=>drawShip(bot,skins[state.skin].enemy,bot.name));if(state.respawnTimer===0)drawShip(state.player,skins[state.skin].player,'YOU');drawJoystick(controls.left,'rgba(255,255,255,.85)');drawJoystick(controls.right,skins[state.skin].ally);ctx.fillStyle=skins[state.skin].overlay;ctx.fillRect(248,12,124,110);ctx.fillStyle='#fff';ctx.font='900 12px sans-serif';ctx.fillText('leaderboard',260,30);state.leaderboard.forEach((row,index)=>ctx.fillText((index+1)+'. '+row.name,260,48+index*14));ctx.fillStyle='rgba(0,0,0,.48)';ctx.fillRect(16,12,170,48);ctx.fillStyle='#fff';ctx.font='900 12px sans-serif';ctx.fillText(weaponDefs[state.player.weapon].label,26,31);ctx.fillText('HP '+Math.max(0,Math.ceil(state.player.hp))+'  K '+state.kills+'  x'+Math.max(1,state.streak),26,48);ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(16,66,140,6);ctx.fillStyle=skins[state.skin].player;ctx.fillRect(16,66,140*(state.player.weapon==='blaster'?1:state.player.weaponTimer/12),6);if(state.mode==='respawn'){ctx.fillStyle='rgba(0,0,0,.54)';ctx.fillRect(94,220,202,74);ctx.fillStyle='#fff';ctx.font='900 24px sans-serif';ctx.fillText('REDEPLOY',130,264);}document.getElementById('hud').textContent='round '+state.round+' · '+controlScheme+' · '+weaponDefs[state.player.weapon].label+' · top '+state.leaderboard.map((row)=>row.name).join('/');}
      document.getElementById('skinBtn').addEventListener('click',()=>applyArenaSkin());document.getElementById('dropBtn').addEventListener('click',()=>spawnDrop());document.getElementById('boostBtn').addEventListener('click',()=>{if(state.respawnTimer===0)state.player.boost=.45;});document.getElementById('resetBtn').addEventListener('click',reset);
      function step(ms){const dt=ms/1000;state.time+=dt;state.nextDrop-=dt;if(state.nextDrop<=0){spawnDrop();state.nextDrop=4.4+rand()*2.2;}updatePlayer(dt);updateBots(dt);updateDrops(dt);updateBullets(dt);updateLeaderboard();render();}
      reset();setInterval(()=>step(16),16);window.advanceTime=(ms)=>{for(let i=0;i<Math.max(1,Math.round(ms/16));i++)step(16);};window.render_game_to_text=()=>JSON.stringify({coordinate_system:'portrait canvas arena 390x560 with dual-thumb controls',mode:state.mode,skin:skins[state.skin].id,controlScheme,weapon:state.player.weapon,weaponDrops,player:{x:Math.round(state.player.x),y:Math.round(state.player.y),hp:Math.round(state.player.hp),boost:Number(state.player.boost.toFixed(2)),weaponTimer:Number(state.player.weaponTimer.toFixed(2))},drops:state.drops.map((drop)=>({type:drop.type,state:drop.state,x:Math.round(drop.x),y:Math.round(drop.y)})),score:state.score,kills:state.kills,bullets:state.bullets.length,leaderboard:state.leaderboard,bots:state.bots.length});
    `,
  },
  {
    id: 'mystic-score',
    file: 'mystic-score.html',
    title: '赛博玄学评分器',
    kind: '玄学',
    sourceGame: '玄学运势 / 分享卡测评',
    accent: '#9b59b6',
    summary: '输入名字，生成今日抽象运势卡。',
    markup: `
      <section class="panel">
        <label class="field-label">你的代号<input id="nameInput" class="input" value="无名网友"></label>
        <label class="field-label">今天想相信多少玄学<input id="beliefRange" type="range" min="0" max="100" value="66"></label>
        <button class="primary" id="castBtn">开始测算</button>
      </section>
      <section class="result-card mystic-card" id="card"><p class="kicker">今日结论</p><h2 id="score">--</h2><p id="copy">等待宇宙加载。</p><div id="tags"></div></section>
    `,
    script: `
      const state={name:'无名网友',belief:66,score:null,tags:[],mode:'idle'};const copies=['宜摸鱼，忌解释。','适合重启，不适合硬撑。','今日贵人是自动保存。','别问，问就是水逆缓存。','你不是拖延，你是在等版本稳定。'];
      function hash(t){let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))%9973;return h;}
      function cast(){state.name=document.getElementById('nameInput').value||'无名网友';state.belief=Number(document.getElementById('beliefRange').value);state.score=(hash(state.name)+state.belief*7+425)%101;state.tags=['抽象指数 '+((state.score*3)%100),'好运缓存 '+state.belief+'%',state.score>60?'宜开新坑':'宜装死'];state.mode='ready';render();}
      function render(){document.getElementById('score').textContent=state.score===null?'--':state.score+' 分';document.getElementById('copy').textContent=state.score===null?'等待宇宙加载。':state.name+'：'+copies[state.score%copies.length];document.getElementById('tags').innerHTML=state.tags.map(t=>'<span class="tag">'+t+'</span>').join('');}
      document.getElementById('beliefRange').addEventListener('input',e=>state.belief=Number(e.target.value));document.getElementById('castBtn').addEventListener('click',cast);render();window.advanceTime=()=>{};window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM share card',mode:state.mode,name:state.name,belief:state.belief,score:state.score,tags:state.tags});
    `,
  },
  {
    id: 'tarot-daily',
    file: 'tarot-daily.html',
    title: '打工塔罗三连',
    kind: '塔罗',
    sourceGame: 'Tarot.js / TarotSchema 式三牌阵',
    accent: '#c45cff',
    summary: '输入代号抽三张赛博塔罗，给出今日抽象建议。',
    markup: `
      <section class="panel">
        <label class="field-label">占卜代号<input id="tarotName" class="input" value="夜猫网友"></label>
        <button class="primary" id="drawTarot">抽三张</button>
      </section>
      <section class="oracle-grid" id="tarotSlots"></section>
      <section class="result-card mystic-card">
        <p class="kicker">今日牌面</p>
        <h2 id="tarotHeadline">等待洗牌</h2>
        <p id="tarotCopy">宇宙正在摸鱼。</p>
        <div id="tarotTags"></div>
      </section>
    `,
    script: `
      const deck=[
        {name:'愚者请假',mark:'0',light:'适合开新坑，但别先建十个群。',dark:'冲动会把你带进需求池。'},
        {name:'魔术师改稿',mark:'I',light:'手上工具够了，先交一个能跑的版本。',dark:'别把仪式感当进度。'},
        {name:'女祭司静音',mark:'II',light:'答案藏在未读消息的第二行。',dark:'过度脑补会让缓存爆掉。'},
        {name:'皇帝排期',mark:'IV',light:'今天适合定边界，不适合临时加需求。',dark:'控制欲可能伪装成责任感。'},
        {name:'恋人双开',mark:'VI',light:'选一个方向深挖，不要同时喜欢所有方案。',dark:'暧昧的选择会拖慢加载。'},
        {name:'战车通勤',mark:'VII',light:'向前推进，哪怕姿势很难看。',dark:'速度太快会错过站。'},
        {name:'隐士离线',mark:'IX',light:'断网半小时，脑子会自动修复。',dark:'别把消失当作沟通。'},
        {name:'命运转盘',mark:'X',light:'今天的随机数偏向你。',dark:'不要把锅甩给水逆太久。'},
        {name:'倒吊人等审',mark:'XII',light:'换个角度看，问题只是命名太烂。',dark:'等待不会自动变成策略。'},
        {name:'星星补丁',mark:'XVII',light:'小修小补也能救回体感。',dark:'许愿前先保存。'}
      ];
      const positions=['现状','阻碍','建议'];
      const state={name:'夜猫网友',cards:[],mode:'idle',seed:0};
      function hash(text){let h=17;for(const ch of text)h=(h*33+ch.charCodeAt(0))%104729;return h;}
      function drawCards(){
        state.name=document.getElementById('tarotName').value||'无名网友';
        state.seed=hash(state.name+'-'+new Date().toDateString());
        const pool=deck.map((card)=>({...card}));
        state.cards=[];
        let seed=state.seed;
        for(let i=0;i<3;i++){
          seed=(seed*9301+49297)%233280;
          const index=seed%pool.length;
          const card=pool.splice(index,1)[0];
          seed=(seed*9301+49297)%233280;
          card.reversed=seed%3===0;
          card.position=positions[i];
          state.cards.push(card);
        }
        state.mode='ready';
        render();
      }
      function render(){
        document.getElementById('tarotSlots').innerHTML=positions.map((label,index)=>{
          const card=state.cards[index];
          const name=card?card.name:'牌背';
          const mark=card?(card.reversed?'↯':'✦'):'?';
          const extra=card?(card.reversed?'逆位':'正位'):'待抽';
          return '<article class="oracle-card"><span>'+label+'</span><b>'+mark+'</b><strong>'+name+'</strong><span>'+extra+'</span></article>';
        }).join('');
        if(!state.cards.length){
          document.getElementById('tarotHeadline').textContent='等待洗牌';
          document.getElementById('tarotCopy').textContent='宇宙正在摸鱼。';
          document.getElementById('tarotTags').innerHTML='';
          return;
        }
        const advice=state.cards[2];
        document.getElementById('tarotHeadline').textContent=state.name+'抽到 '+advice.name;
        document.getElementById('tarotCopy').textContent=advice.reversed?advice.dark:advice.light;
        document.getElementById('tarotTags').innerHTML=state.cards.map((card)=>'<span class="tag">'+card.position+'：'+card.name+(card.reversed?'逆':'正')+'</span>').join('');
      }
      document.getElementById('drawTarot').addEventListener('click',drawCards);
      render();
      window.advanceTime=()=>{};
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM tarot spread',mode:state.mode,name:state.name,cards:state.cards.map((card)=>({position:card.position,name:card.name,reversed:card.reversed}))});
    `,
  },
  {
    id: 'bazi-lite',
    file: 'bazi-lite.html',
    title: '八字偏科生成器',
    kind: '算命',
    sourceGame: 'Gmuli-Bazi-Calc 式四柱输入',
    accent: '#e4a63b',
    summary: '生日时辰生成假认真四柱，重点看五行哪里离谱。',
    markup: `
      <section class="panel">
        <label class="field-label">出生时间<input id="birthInput" class="input" type="datetime-local" value="1997-08-08T09:30"></label>
        <label class="field-label">出生地暗号<input id="placeInput" class="input" value="工位东南角"></label>
        <button class="primary" id="castBazi">排个娱乐盘</button>
      </section>
      <section class="result-card mystic-card">
        <p class="kicker">四柱偏科表</p>
        <div class="pillar-grid" id="pillars"></div>
        <div class="element-bars" id="elementBars"></div>
        <p id="baziCopy">等你把生日交给玄学缓存。</p>
        <div id="baziTags"></div>
      </section>
    `,
    script: `
      const stems=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      const branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      const stemElements=['木','木','火','火','土','土','金','金','水','水'];
      const branchElements=['水','土','木','木','土','火','火','土','金','金','土','水'];
      const labels=['年柱','月柱','日柱','时柱'];
      const state={mode:'idle',pillars:[],elements:{木:0,火:0,土:0,金:0,水:0},verdict:''};
      function hash(text){let h=23;for(const ch of text)h=(h*31+ch.charCodeAt(0))%65521;return h;}
      function cast(){
        const birth=document.getElementById('birthInput').value||'1997-08-08T09:30';
        const place=document.getElementById('placeInput').value||'工位';
        const date=new Date(birth);
        const base=Math.abs(Math.floor(date.getTime()/3600000)+hash(place)+date.getMonth()*37+date.getDate()*11);
        state.elements={木:0,火:0,土:0,金:0,水:0};
        state.pillars=labels.map((label,index)=>{
          const stemIndex=(base+index*17)%stems.length;
          const branchIndex=(base+index*19)%branches.length;
          state.elements[stemElements[stemIndex]]+=1;
          state.elements[branchElements[branchIndex]]+=1;
          return {label,stem:stems[stemIndex],branch:branches[branchIndex],element:stemElements[stemIndex]+branchElements[branchIndex]};
        });
        const sorted=Object.entries(state.elements).sort((a,b)=>b[1]-a[1]);
        state.verdict=sorted[0][0]+'过载，'+sorted[sorted.length-1][0]+'缺货';
        state.mode='ready';
        render();
      }
      function render(){
        document.getElementById('pillars').innerHTML=(state.pillars.length?state.pillars:labels.map((label)=>({label,stem:'?',branch:'?',element:'等待'}))).map((pillar)=>'<div class="pillar"><span>'+pillar.label+'</span><b>'+pillar.stem+pillar.branch+'</b><span>'+pillar.element+'</span></div>').join('');
        document.getElementById('elementBars').innerHTML=Object.entries(state.elements).map(([name,value])=>'<div class="element-bar"><span>'+name+'</span><i style="width:'+(18+value*12)+'%"></i><b>'+value+'</b></div>').join('');
        document.getElementById('baziCopy').textContent=state.mode==='ready'?'命盘结论：'+state.verdict+'，今日宜少解释，多截图。':'等你把生日交给玄学缓存。';
        document.getElementById('baziTags').innerHTML=state.mode==='ready'?['假认真排盘','仅供娱乐','适合发群'].map((tag)=>'<span class="tag">'+tag+'</span>').join(''):'';
      }
      document.getElementById('castBazi').addEventListener('click',cast);
      render();
      window.advanceTime=()=>{};
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM bazi board',mode:state.mode,pillars:state.pillars,elements:state.elements,verdict:state.verdict});
    `,
  },
  {
    id: 'astro-wheel',
    file: 'astro-wheel.html',
    title: '星盘甩锅轮',
    kind: '看盘',
    sourceGame: 'CircularNatalHoroscopeJS / AstroChart 式圆盘',
    accent: '#5bbcff',
    summary: '一键画出可分享星盘，把今天的问题甩给相位。',
    canvas: true,
    markup: `
      <canvas id="astroCanvas" width="390" height="330" class="play-canvas short"></canvas>
      <section class="panel compact">
        <label class="field-label">盘主代号<input id="astroName" class="input" value="水逆打工人"></label>
        <button class="primary" id="castAstro">生成甩锅星盘</button>
      </section>
      <section class="result-card mystic-card">
        <p class="kicker">相位摘要</p>
        <h2 id="astroHeadline">等待行星站队</h2>
        <div class="aspect-list" id="aspectList"></div>
      </section>
    `,
    script: `
      const canvas=document.getElementById('astroCanvas');
      const ctx=canvas.getContext('2d');
      const signs=['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
      const bodies=[
        {name:'太阳',mark:'☉',color:'#ffd15a'},
        {name:'月亮',mark:'☾',color:'#d6e6ff'},
        {name:'水星',mark:'☿',color:'#22f4ee'},
        {name:'金星',mark:'♀',color:'#ff88bd'},
        {name:'火星',mark:'♂',color:'#ff674d'},
        {name:'土星',mark:'♄',color:'#b891ff'}
      ];
      const state={mode:'idle',name:'水逆打工人',points:[],aspects:[],spin:0};
      function hash(text){let h=29;for(const ch of text)h=(h*37+ch.charCodeAt(0))%99991;return h;}
      function polar(angle,radius){const rad=(angle-90+state.spin)*Math.PI/180;return {x:195+Math.cos(rad)*radius,y:165+Math.sin(rad)*radius};}
      function cast(){
        state.name=document.getElementById('astroName').value||'无名盘主';
        const seed=hash(state.name+'-'+new Date().toDateString());
        state.points=bodies.map((body,index)=>{
          const angle=(seed+index*53+index*index*7)%360;
          return {...body,angle,sign:signs[Math.floor(angle/30)]};
        });
        state.aspects=[
          state.points[0].name+'落在'+state.points[0].sign+'：今天适合高调装懂',
          state.points[2].name+'刑'+state.points[4].name+'：消息别秒回，先喝水',
          state.points[1].name+'拱'+state.points[5].name+'：拖延会被包装成深思熟虑'
        ];
        state.mode='ready';
        render();
      }
      function draw(){
        ctx.clearRect(0,0,390,330);
        ctx.fillStyle='#06070d';
        ctx.fillRect(0,0,390,330);
        const cx=195,cy=165;
        ctx.strokeStyle='rgba(255,255,255,.18)';
        ctx.lineWidth=1;
        for(const radius of [58,96,132]){
          ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
        }
        for(let i=0;i<12;i++){
          const a=i*30+state.spin;
          const inner=polar(a,58);
          const outer=polar(a,140);
          ctx.beginPath();ctx.moveTo(inner.x,inner.y);ctx.lineTo(outer.x,outer.y);ctx.stroke();
          const label=polar(a+15,116);
          ctx.fillStyle='rgba(255,255,255,.62)';
          ctx.font='11px -apple-system,BlinkMacSystemFont,sans-serif';
          ctx.textAlign='center';
          ctx.fillText(signs[i],label.x,label.y);
        }
        const points=state.points.length?state.points:bodies.map((body,index)=>({...body,angle:index*60,sign:signs[index]}));
        points.forEach((point,index)=>{
          const pos=polar(point.angle,78+index%2*22);
          ctx.fillStyle=point.color;
          ctx.beginPath();ctx.arc(pos.x,pos.y,14,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='#050505';
          ctx.font='18px serif';
          ctx.textAlign='center';
          ctx.fillText(point.mark,pos.x,pos.y+6);
        });
        ctx.fillStyle='#fff';
        ctx.font='900 18px -apple-system,BlinkMacSystemFont,sans-serif';
        ctx.fillText(state.mode==='ready'?state.name:'甩锅星盘',cx,cy+5);
      }
      function render(){
        draw();
        document.getElementById('astroHeadline').textContent=state.mode==='ready'?state.name+'的今日锅位':'等待行星站队';
        document.getElementById('aspectList').innerHTML=(state.aspects.length?state.aspects:['太阳还没上线','月亮正在加载','水星拒绝背锅']).map((item)=>'<span>'+item+'</span>').join('');
      }
      document.getElementById('castAstro').addEventListener('click',cast);
      render();
      window.advanceTime=(ms=0)=>{state.spin=(state.spin+ms/60)%360;draw();};
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'canvas astrology wheel',mode:state.mode,name:state.name,points:state.points.map((point)=>({name:point.name,angle:point.angle,sign:point.sign})),aspects:state.aspects});
    `,
  },
  {
    id: 'yijing-coins',
    file: 'yijing-coins.html',
    title: '六爻离谱铜钱',
    kind: '易经',
    sourceGame: 'I Ching coin divination flow',
    accent: '#d6b45f',
    summary: '点六次摇铜钱，得到一卦适合转发的离谱签文。',
    markup: `
      <section class="panel">
        <label class="field-label">所问之事<input id="wishInput" class="input" value="今天能不能准点下班"></label>
        <button class="primary" id="coinBtn">摇第一爻</button>
        <div class="coin-row" id="coins"><span class="coin">?</span><span class="coin">?</span><span class="coin">?</span></div>
      </section>
      <section class="result-card mystic-card">
        <p class="kicker">本卦</p>
        <h2 id="hexName">未成卦</h2>
        <div class="hex-lines" id="hexLines"></div>
        <p id="hexCopy">六爻未齐，玄学还不敢乱说。</p>
        <div class="cast-log" id="castLog"></div>
      </section>
    `,
    script: `
      const hexNames=['乾为天','坤为地','水雷屯','山水蒙','风天小畜','天泽履','地天泰','天地否','雷火丰','火山旅','泽水困','水风井'];
      const verdicts=['宜先截图，后解释。','看似卡住，其实是在加载隐藏剧情。','贵人会以撤回消息的形式出现。','今天别硬刚，绕路也是一种推进。','大事缓办，小事装忙。','答案在第三个选项，但你会先点错。'];
      const state={mode:'casting',wish:'今天能不能准点下班',lines:[],coins:['?','?','?'],seed:0,result:null};
      function hash(text){let h=41;for(const ch of text)h=(h*31+ch.charCodeAt(0))%99989;return h;}
      function roll(){
        state.seed=(state.seed*9301+49297)%233280;
        return state.seed%2?3:2;
      }
      function castLine(){
        if(state.lines.length>=6){
          state.lines=[];
          state.mode='casting';
          state.result=null;
        }
        state.wish=document.getElementById('wishInput').value||'无名之问';
        if(state.lines.length===0)state.seed=hash(state.wish+'-'+new Date().toDateString());
        const values=[roll(),roll(),roll()];
        state.coins=values.map((value)=>value===3?'字':'背');
        state.lines.push(values.reduce((sum,value)=>sum+value,0));
        if(state.lines.length===6){
          const pattern=state.lines.map((value)=>value%2).join('');
          const index=parseInt(pattern,2)%hexNames.length;
          state.result={name:hexNames[index],copy:verdicts[(index+state.seed)%verdicts.length]};
          state.mode='ready';
        }
        render();
      }
      function render(){
        document.getElementById('coins').innerHTML=state.coins.map((coin)=>'<span class="coin">'+coin+'</span>').join('');
        document.getElementById('coinBtn').textContent=state.lines.length>=6?'重摇一卦':'摇第 '+(state.lines.length+1)+' 爻';
        const shown=state.lines.slice().reverse();
        document.getElementById('hexLines').innerHTML=(shown.length?shown:[0,0,0,0,0,0]).map((value)=>'<div class="hex-line '+(value&&value%2===0?'broken':'solid')+'"><i></i>'+(value&&value%2===0?'<i></i>':'')+'</div>').join('');
        document.getElementById('hexName').textContent=state.result?state.result.name:'未成卦';
        document.getElementById('hexCopy').textContent=state.result?state.wish+'：'+state.result.copy:'六爻未齐，玄学还不敢乱说。';
        document.getElementById('castLog').innerHTML=state.lines.map((line,index)=>'<span>第 '+(index+1)+' 爻：'+(line%2?'阳':'阴')+(line===6||line===9?'，动':'')+'</span>').join('');
      }
      document.getElementById('coinBtn').addEventListener('click',castLine);
      render();
      window.advanceTime=()=>{};
      window.render_game_to_text=()=>JSON.stringify({coordinate_system:'DOM six-line hexagram',mode:state.mode,wish:state.wish,lines:state.lines,result:state.result});
    `,
  },
  goodsSortBaseGame,
];

function artifactFor(game) {
  return {
    generator: 'printer/tools/generate_fake_library.mjs',
    pipeline: 'WebPrinterPipeline-compatible deterministic fake-game generator',
    output_format: 'multi_html',
    intent,
    generated_at: generatedAt,
    game: {
      id: game.id,
      file: game.file,
      cover: coverForFile(game.file),
      title: game.title,
      kind: game.kind,
      source_game: game.sourceGame,
      mobile_portrait: true,
      canvas_playfield: Boolean(game.canvas),
    },
    intent_plan: pipelinePlan,
    complexity: {
      total: game.canvas ? 58 : 44,
      components: 14,
      interactions: game.canvas ? 20 : 12,
      pages: 3,
      data_flow: 9,
    },
  };
}

function commonCss(accent) {
  return `
    :root { --accent: #ff3b86; --cyan: #22f4ee; --violet: #7c5cff; --game-accent: ${accent}; --ink: #fff; --paper: #050505; --panel: rgba(255,255,255,.08); --line: rgba(255,255,255,.14); }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body { margin: 0; min-height: 100%; background: #040404; color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; overflow-x: hidden; }
    body { display: grid; place-items: start center; overscroll-behavior: none; }
    button, input { font: inherit; min-width: 0; }
    button, a, input { touch-action: manipulation; }
    .phone-shell { width: min(100vw, 430px); min-height: 100svh; background:
      radial-gradient(circle at 50% 4%, rgba(255,59,134,.42), transparent 34%),
      radial-gradient(circle at 10% 24%, rgba(34,244,238,.16), transparent 26%),
      linear-gradient(180deg, #160611 0, #080509 42%, #030303 100%); border-left: 1px solid var(--line); border-right: 1px solid var(--line); display: flex; flex-direction: column; overflow: hidden; }
    .app-top { position: sticky; top: 0; z-index: 5; height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 max(14px, env(safe-area-inset-left)); border-bottom: 1px solid rgba(255,255,255,.08); background: linear-gradient(to bottom, rgba(0,0,0,.78), rgba(0,0,0,.28)); color: #fff; backdrop-filter: blur(16px); }
    .brand { color: inherit; text-decoration: none; font-weight: 900; }
    .app-top a:last-child { color: #fff; opacity: .72; text-decoration: none; font-weight: 900; font-size: 13px; }
    .screen { padding: 12px 12px calc(18px + env(safe-area-inset-bottom)); flex: 1; min-width: 0; }
    .play-screen { display: flex; flex-direction: column; min-height: calc(100svh - 50px); min-width: 0; }
    .hero { min-height: 92px; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; padding: 12px 2px; border-bottom: 1px solid rgba(255,255,255,.1); }
    .play-hero { min-height: 88px; }
    .kicker { margin: 0; color: var(--cyan); font-size: 11px; font-weight: 1000; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(34px, 11vw, 54px); line-height: .88; letter-spacing: 0; color: #fff; text-shadow: 0 6px 28px rgba(255,59,134,.2); }
    h2 { margin: 0 0 12px; font-size: clamp(25px, 8vw, 36px); line-height: 1; letter-spacing: 0; }
    .summary { margin: 0; color: rgba(255,255,255,.62); line-height: 1.42; font-size: 13px; }
    .game-stage { display: grid; gap: 10px; padding-top: 10px; touch-action: none; flex: 1; align-content: start; min-width: 0; }
    .game-stage > * { min-width: 0; max-width: 100%; }
    .panel { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); border-radius: 14px; padding: 14px; box-shadow: 0 18px 54px rgba(0,0,0,.28); backdrop-filter: blur(18px); color: #fff; min-width: 0; max-width: 100%; }
    .compact { padding: 12px; }
    .primary { min-height: 54px; border: 0; border-radius: 999px; padding: 0 18px; background: linear-gradient(135deg, var(--accent), #ff6aa8); color: #fff; font-weight: 1000; cursor: pointer; box-shadow: 0 12px 30px rgba(255,59,134,.28); }
    .primary:disabled, button:disabled { opacity: .42; cursor: not-allowed; box-shadow: none; }
    .hidden { display: none !important; }
    .play-canvas { width: 100%; height: auto; border: 1px solid rgba(255,255,255,.16); border-radius: 18px; background: #09070d; display: block; touch-action: none; box-shadow: 0 24px 70px rgba(0,0,0,.34); }
    .play-canvas.short { aspect-ratio: 390 / 320; }
    html.embed-mode, html.embed-mode body { min-height: 100%; background: #000; }
    html.embed-mode body { display: block; overflow: hidden; }
    html.embed-mode .phone-shell { width: 100vw; min-height: 100svh; border: 0; background: #000; box-shadow: none; }
    html.embed-mode .app-top, html.embed-mode .play-hero { display: none; }
    html.embed-mode .screen { padding: 0 10px 10px; }
    html.embed-mode .play-screen { min-height: 100svh; }
    html.embed-mode .game-stage { padding-top: 10px; gap: 8px; }
    html.embed-mode .play-canvas { max-height: calc(100svh - 116px); object-fit: contain; }
    html.embed-mode .panel { box-shadow: none; }
    .stack { display: grid; gap: 10px; }
    .stat-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; color: rgba(255,255,255,.84); font-size: 13px; font-weight: 900; }
    .button-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: center; margin-bottom: 10px; }
    .choice, .shop-row, .chip, .plot { border: 1px solid rgba(255,255,255,.16); border-radius: 14px; background: rgba(255,255,255,.1); color: #fff; min-height: 58px; padding: 12px 14px; text-align: left; font-weight: 850; cursor: pointer; }
    .choice:active, .chip:active, .plot:active, .big-tap:active { transform: scale(.98); }
    .meter { height: 10px; background: rgba(255,255,255,.1); border-radius: 999px; overflow: hidden; margin-bottom: 12px; }
    .meter i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, var(--cyan), var(--accent)); }
    .result-card { background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.14); border-radius: 16px; padding: 14px; color: #fff; }
    .bars { display: grid; gap: 8px; margin: 12px 0; }
    .bars span { display: grid; grid-template-columns: 72px 1fr; align-items: center; gap: 8px; font-size: 12px; }
    .bars i { display: block; height: 9px; border-radius: 999px; background: var(--accent); }
    .tray { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
    .tray span { aspect-ratio: 1; border: 1px dashed rgba(255,255,255,.24); border-radius: 9px; display: grid; place-items: center; background: rgba(255,255,255,.09); font-weight: 900; }
    .triple-playfield { gap: 10px; }
    .triple-targets { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .triple-chip { min-height: 56px; border: 1px solid var(--chip-edge, rgba(255,255,255,.14)); border-radius: 14px; padding: 8px 9px; background: color-mix(in srgb, var(--chip-fill, rgba(255,255,255,.14)), rgba(255,255,255,.08) 76%); color: var(--chip-ink, #fff); display: grid; grid-template-columns: 24px 1fr auto; align-items: center; gap: 6px; }
    .triple-chip b { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 9px; background: rgba(255,255,255,.3); font-size: 13px; }
    .triple-chip i, .triple-chip u { font-style: normal; text-decoration: none; font-weight: 900; }
    .triple-chip i { font-size: 11px; }
    .triple-chip u { font-size: 15px; }
    .triple-board { position: relative; min-height: 346px; border: 1px solid rgba(255,255,255,.16); border-radius: 20px; background: radial-gradient(circle at 50% 16%, var(--pile-glow, rgba(125,214,255,.18)), transparent 34%), linear-gradient(180deg, var(--board-top, #08131f), var(--board-bottom, #050a12)); overflow: hidden; box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 20px 50px rgba(0,0,0,.28); }
    .triple-board::after { content: ""; position: absolute; left: 18px; right: 18px; bottom: 18px; height: 46px; border-radius: 50%; background: rgba(0,0,0,.22); filter: blur(12px); pointer-events: none; }
    .triple-item { position: absolute; width: 68px; height: 76px; margin-left: -34px; margin-top: -38px; border: 0; background: transparent; padding: 0; display: grid; place-items: center; cursor: pointer; }
    .triple-item-glyph { width: 64px; height: 64px; border: 2px solid rgba(255,255,255,.22); border-radius: 18px; display: grid; place-items: center; font-size: 27px; font-weight: 1000; box-shadow: 0 14px 24px rgba(0,0,0,.22); }
    .triple-item-tag { margin-top: -10px; min-width: 42px; border-radius: 999px; padding: 3px 8px; background: rgba(0,0,0,.48); color: rgba(255,255,255,.88); font-size: 10px; font-weight: 900; }
    .triple-item.top .triple-item-glyph { transform: translateY(-4px); box-shadow: 0 18px 28px rgba(0,0,0,.32); }
    .triple-item.locked { cursor: not-allowed; }
    .triple-item.locked .triple-item-glyph { filter: saturate(.55) brightness(.82); opacity: .72; }
    .triple-tray-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin: 10px 0 8px; color: rgba(255,255,255,.84); font-size: 12px; font-weight: 900; }
    .triple-tray { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; padding: 10px; border: 1px solid rgba(255,255,255,.14); border-radius: 16px; background: color-mix(in srgb, var(--tray-glow, rgba(255,255,255,.08)), rgba(255,255,255,.05) 62%); }
    .triple-slot { min-height: 38px; border-radius: 12px; border: 1px dashed rgba(255,255,255,.2); display: grid; place-items: center; font-size: 18px; font-weight: 1000; }
    .triple-slot.empty { background: rgba(255,255,255,.04); }
    .triple-slot.filled { border-style: solid; box-shadow: inset 0 -6px 10px rgba(0,0,0,.12); }
    .goods-targets { margin-bottom: 10px; }
    .goods-shelves { display: grid; gap: 10px; }
    .goods-shelf { border: 1px solid rgba(255,255,255,.14); border-radius: 18px; padding: 10px; background: rgba(255,255,255,.05); box-shadow: inset 0 1px 0 rgba(255,255,255,.04); }
    .goods-shelf-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; color: rgba(255,255,255,.84); font-size: 12px; font-weight: 900; }
    .goods-lane-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .goods-lane { position: relative; min-height: 108px; border: 1px solid rgba(255,255,255,.16); border-radius: 16px; padding: 10px 8px 8px; background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03)); color: #fff; display: grid; align-content: space-between; justify-items: center; gap: 8px; overflow: hidden; cursor: pointer; }
    .goods-lane::after { content: ""; position: absolute; left: 10px; right: 10px; bottom: 10px; height: 9px; border-radius: 999px; background: rgba(0,0,0,.22); filter: blur(7px); }
    .goods-lane.empty { opacity: .56; cursor: default; }
    .goods-backdrop { position: absolute; inset: 0; background: radial-gradient(circle at 50% 18%, color-mix(in srgb, var(--lane-glow), white 18%), transparent 34%); opacity: .8; pointer-events: none; }
    .goods-item { position: relative; z-index: 1; width: 70px; min-height: 72px; border: 2px solid rgba(255,255,255,.18); border-radius: 18px; display: grid; place-items: center; gap: 3px; padding: 8px 6px; box-shadow: 0 16px 24px rgba(0,0,0,.22); }
    .goods-item b { font-size: 26px; line-height: 1; }
    .goods-item i { font-style: normal; font-size: 11px; font-weight: 900; }
    .goods-lane u, .goods-empty-copy { position: relative; z-index: 1; text-decoration: none; font-size: 11px; font-weight: 900; color: rgba(255,255,255,.76); }
    .box-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .color-box { min-height: 78px; border: 1px solid rgba(255,255,255,.16); border-radius: 14px; padding: 10px; background: color-mix(in srgb, var(--box-fill), rgba(255,255,255,.08) 76%); display: grid; gap: 8px; }
    .color-box b { font-size: 13px; }
    .color-box span { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .color-box i { min-height: 28px; border-radius: 10px; display: grid; place-items: center; font-style: normal; font-weight: 1000; background: rgba(0,0,0,.22); color: #fff; }
    .big-tap { min-height: 118px; border: 0; border-radius: 28px; background: linear-gradient(145deg, var(--accent), #ff8ab9); color: #fff; display: grid; place-items: center; gap: 4px; font-weight: 1000; box-shadow: inset 0 -16px 30px rgba(0,0,0,.18), 0 20px 60px rgba(255,59,134,.32); }
    .big-tap.dark { background: linear-gradient(145deg, #151018, #31112a 54%, var(--accent)); color: #fff; }
    .big-tap b { font-size: 32px; }
    .big-tap span { font-size: 12px; letter-spacing: .2em; }
    .shop { display: grid; gap: 8px; }
    .shop-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .shop-row span { color: rgba(255,255,255,.68); font-size: 12px; }
    .field-label { display: grid; gap: 8px; font-weight: 900; }
    .input { width: 100%; min-height: 58px; border: 1px solid rgba(255,255,255,.18); border-radius: 16px; padding: 0 14px; background: rgba(255,255,255,.1); color: #fff; font-size: 20px; font-weight: 900; outline: none; }
    .input:focus { border-color: var(--cyan); box-shadow: 0 0 0 4px rgba(34,244,238,.15); }
    .input::placeholder { color: rgba(255,255,255,.42); }
    .rules { display: grid; gap: 8px; margin-top: 12px; }
    .rule { display: flex; gap: 8px; align-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; padding: 12px; background: rgba(255,59,134,.11); }
    .rule.ok { background: rgba(34,244,238,.12); border-color: rgba(34,244,238,.42); }
    .win-note { padding: 12px; border-radius: 8px; background: var(--accent); color: #fff; font-weight: 900; }
    .slots { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 8px; align-items: center; min-width: 0; }
    .slots span { min-width: 0; min-height: 84px; display: grid; place-items: center; border: 1px dashed rgba(255,255,255,.22); border-radius: 18px; padding: 8px; text-align: center; font-size: clamp(18px, 6vw, 28px); line-height: 1.08; font-weight: 1000; background: rgba(255,255,255,.09); color: #fff; overflow: hidden; overflow-wrap: anywhere; word-break: break-word; }
    .craft-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; margin: 12px 0; min-width: 0; }
    .craft-stats { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px 10px; margin: 10px 0 0; color: var(--cyan); font-size: 12px; font-weight: 1000; letter-spacing: .08em; text-transform: uppercase; min-width: 0; }
    .craft-stats span, #craftLog { min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
    .craft-history { display: flex; gap: 8px; overflow-x: auto; padding: 8px 0 0; scrollbar-width: none; }
    .craft-history::-webkit-scrollbar { display: none; }
    .craft-history span { flex: 0 0 auto; max-width: 270px; overflow: hidden; text-overflow: ellipsis; border: 1px solid rgba(255,255,255,.14); border-radius: 999px; padding: 8px 10px; background: rgba(255,255,255,.08); color: rgba(255,255,255,.82); font-weight: 800; white-space: nowrap; }
    .chip-pool { display: flex; flex-wrap: wrap; gap: 8px; min-width: 0; max-width: 100%; }
    .chip { min-width: 0; min-height: 42px; text-align: center; width: auto; max-width: 100%; overflow-wrap: anywhere; word-break: break-word; white-space: normal; }
    .chip small { display: block; margin-top: 4px; color: rgba(255,255,255,.48); font-size: 10px; font-weight: 900; }
    .picked { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent), transparent 78%); }
    .checkbox-grid { display: grid; grid-template-columns: repeat(20, 1fr); gap: 4px; }
    .fake-check input { position: absolute; opacity: 0; }
    .fake-check span { display: block; aspect-ratio: 1; border: 1px solid rgba(255,255,255,.22); border-radius: 6px; background: rgba(255,255,255,.08); }
    .fake-check input:checked + span { background: var(--accent); border-color: var(--accent); box-shadow: inset 0 0 0 3px #050505; }
    .garden-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .plot { min-height: 98px; background: rgba(255,255,255,.1); text-align: center; display: grid; place-items: center; }
    .plot.ready { background: linear-gradient(145deg, rgba(34,244,238,.25), rgba(255,59,134,.22)); border-color: rgba(34,244,238,.55); }
    .row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .tag { display: inline-flex; margin: 6px 6px 0 0; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; padding: 8px 10px; background: rgba(255,255,255,.08); }
    .mystic-card { background: radial-gradient(circle at 20% 10%, rgba(255,59,134,.34), rgba(255,255,255,.08) 48%); }
    .oracle-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .oracle-card { min-height: 154px; border: 1px solid rgba(255,255,255,.18); border-radius: 16px; padding: 10px; display: grid; align-content: space-between; background: linear-gradient(160deg, color-mix(in srgb, var(--game-accent), #050505 44%), rgba(255,255,255,.08)); color: #fff; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
    .oracle-card b { font-size: 28px; line-height: 1; }
    .oracle-card span { color: rgba(255,255,255,.68); font-size: 11px; font-weight: 900; }
    .oracle-card strong { font-size: 13px; line-height: 1.1; }
    .pillar-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
    .pillar { min-height: 90px; border: 1px solid rgba(255,255,255,.16); border-radius: 14px; padding: 9px 6px; display: grid; place-items: center; gap: 4px; background: rgba(255,255,255,.08); text-align: center; }
    .pillar b { font-size: 28px; line-height: 1; }
    .pillar span { color: rgba(255,255,255,.58); font-size: 10px; font-weight: 1000; }
    .element-bars { display: grid; gap: 7px; margin-top: 12px; }
    .element-bar { display: grid; grid-template-columns: 34px 1fr 30px; align-items: center; gap: 8px; font-size: 12px; font-weight: 900; color: rgba(255,255,255,.76); }
    .element-bar i { height: 9px; border-radius: 999px; background: linear-gradient(90deg, var(--cyan), var(--game-accent)); }
    .aspect-list { display: grid; gap: 8px; margin-top: 10px; }
    .aspect-list span, .cast-log span { display: block; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; padding: 9px 10px; background: rgba(255,255,255,.08); color: rgba(255,255,255,.82); font-size: 12px; font-weight: 850; }
    .coin-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin: 10px 0; }
    .coin { aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.22); background: radial-gradient(circle at 35% 25%, #ffe7a3, #b56d25 64%, #4d2415); color: #2d160c; font-size: 20px; font-weight: 1000; box-shadow: 0 12px 32px rgba(0,0,0,.28); }
    .hex-lines { display: grid; gap: 7px; padding: 8px 0; }
    .hex-line { height: 16px; display: grid; grid-template-columns: 1fr; gap: 8px; }
    .hex-line.broken { grid-template-columns: 1fr 1fr; }
    .hex-line i { display: block; border-radius: 999px; background: linear-gradient(90deg, #ffe7a3, var(--game-accent)); }
    .cast-log { display: grid; gap: 8px; }
    .sim-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; }
    .sim-header b { font-size: 18px; }
    .sim-header span { color: var(--cyan); font-size: 12px; font-weight: 1000; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .stat-grid span { min-height: 58px; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; display: grid; place-items: center; background: rgba(255,255,255,.08); }
    .stat-grid b { font-size: 20px; line-height: 1; }
    .stat-grid i { color: rgba(255,255,255,.58); font-size: 11px; font-style: normal; font-weight: 900; }
    .action-grid { display: grid; gap: 8px; }
    .action-grid .choice { display: grid; gap: 4px; }
    .action-grid .choice span { color: rgba(255,255,255,.62); font-size: 12px; font-weight: 800; overflow-wrap: anywhere; }
    .student-list, .timeline { display: grid; gap: 8px; }
    .student-list span, .timeline span { border: 1px solid rgba(255,255,255,.14); border-radius: 12px; padding: 10px; background: rgba(255,255,255,.08); color: rgba(255,255,255,.84); font-size: 12px; line-height: 1.35; }
    .student-list b { display: block; color: #fff; font-size: 13px; margin-bottom: 3px; }
    .student-list i { color: rgba(255,255,255,.62); font-style: normal; font-weight: 800; }
    .alloc-grid { display: grid; gap: 8px; margin: 10px 0; }
    .alloc-row { display: grid; grid-template-columns: 1fr 44px 44px 44px; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; padding: 8px; background: rgba(255,255,255,.08); }
    .alloc-row span { font-weight: 900; }
    .alloc-row b { text-align: center; font-size: 18px; }
    .alloc-row button { min-height: 40px; border: 0; border-radius: 999px; background: rgba(255,255,255,.14); color: #fff; font-weight: 1000; }
    body[data-game-page="twitter-governance"] { background: #000; }
    body[data-game-page="twitter-governance"] .phone-shell { background: #000; color: #e7e9ea; border-color: rgba(255,255,255,.14); }
    body[data-game-page="twitter-governance"] .app-top,
    body[data-game-page="twitter-governance"] .play-hero { display: none; }
    body[data-game-page="twitter-governance"] .play-screen { padding: 0; min-height: 100svh; background: #000; }
    body[data-game-page="twitter-governance"] .game-stage { display: block; gap: 0; padding-bottom: 78px; }
    .x-app { position: relative; min-height: 100svh; background: #000; color: #e7e9ea; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0; }
    .x-header { position: sticky; top: 0; z-index: 8; height: 50px; display: grid; grid-template-columns: 50px 1fr 50px; align-items: center; border-bottom: 1px solid #2f3336; background: rgba(0,0,0,.88); backdrop-filter: blur(18px); }
    .x-header b { text-align: center; color: #fff; font-size: 24px; line-height: 1; font-weight: 900; }
    .x-header button { width: 36px; height: 36px; margin: auto; border: 0; border-radius: 50%; background: transparent; color: #e7e9ea; font-size: 14px; font-weight: 900; }
    .x-header button:first-child { background: #1d9bf0; color: #001018; }
    .x-header #agentBtn { border: 1px solid #2f3336; font-size: 11px; color: #1d9bf0; }
    .x-top-tabs { position: sticky; top: 50px; z-index: 8; display: grid; grid-template-columns: 1fr 1fr; height: 48px; border-bottom: 1px solid #2f3336; background: rgba(0,0,0,.88); backdrop-filter: blur(18px); }
    .x-top-tabs button { position: relative; border: 0; background: transparent; color: #71767b; font-size: 15px; font-weight: 800; }
    .x-top-tabs .active { color: #e7e9ea; }
    .x-top-tabs .active::after { content: ""; position: absolute; left: 50%; bottom: 0; width: 54px; height: 4px; transform: translateX(-50%); border-radius: 999px; background: #1d9bf0; }
    .x-status-strip { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); border-bottom: 1px solid #2f3336; background: #000; }
    .x-status-strip span { min-width: 0; min-height: 54px; display: grid; place-items: center; gap: 2px; border-right: 1px solid #16181c; }
    .x-status-strip span:last-child { border-right: 0; }
    .x-status-strip b { color: #e7e9ea; font-size: 16px; line-height: 1; }
    .x-status-strip i { color: #71767b; font-size: 10px; font-style: normal; font-weight: 800; }
    .x-composer-inline { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 10px; padding: 12px 14px 10px; border-bottom: 1px solid #2f3336; background: #000; }
    .x-avatar { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; background: #1d9bf0; color: #001018; font-size: 20px; font-weight: 1000; }
    .x-compose-body { min-width: 0; display: grid; gap: 8px; }
    .x-composer-inline textarea { width: 100%; min-height: 64px; border: 0; padding: 8px 0; resize: none; background: transparent; color: #e7e9ea; font: inherit; font-size: 19px; line-height: 1.28; outline: none; }
    .x-composer-inline textarea::placeholder { color: #71767b; }
    .x-compose-tools { display: flex; justify-content: flex-end; align-items: center; gap: 8px; border-top: 1px solid #2f3336; padding-top: 8px; }
    .x-compose-tools button { min-height: 36px; border: 0; border-radius: 999px; padding: 0 13px; background: transparent; color: #1d9bf0; font-weight: 900; }
    .x-compose-tools #sendTweet { min-width: 68px; background: #1d9bf0; color: #fff; }
    .x-compose-tools #commandToggle { background: rgba(29,155,240,.14); }
    .x-timeline { background: #000; }
    .news-feed { display: grid; }
    .news-feed article { position: relative; display: grid; grid-template-columns: 44px minmax(0, 1fr); column-gap: 10px; border-bottom: 1px solid #2f3336; padding: 12px 14px 10px; background: #000; }
    .news-feed article::before { content: attr(data-avatar); width: 40px; height: 40px; grid-row: 1 / span 3; display: grid; place-items: center; border-radius: 50%; background: var(--tweet-avatar, #273340); color: #fff; font-size: 16px; font-weight: 1000; }
    .news-feed header { min-width: 0; display: flex; align-items: baseline; gap: 5px; color: #71767b; font-size: 13px; line-height: 1.2; }
    .news-feed header b { min-width: 0; color: #e7e9ea; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .news-feed header span { flex: 0 0 auto; }
    .news-feed p { grid-column: 2; margin: 3px 0 8px; color: #e7e9ea; font-size: 15px; line-height: 1.34; font-weight: 500; overflow-wrap: anywhere; }
    .tweet-actions { grid-column: 2; display: grid; grid-template-columns: repeat(4, 1fr); color: #71767b; font-size: 12px; font-weight: 800; }
    .tweet-actions span { display: inline-flex; align-items: center; gap: 5px; }
    .x-drawer { display: none; margin: 0; border-bottom: 1px solid #2f3336; padding: 12px 14px; background: #000; }
    .x-drawer.is-open { display: grid; gap: 12px; }
    .x-drawer-head { display: flex; justify-content: space-between; gap: 10px; color: #e7e9ea; }
    .x-drawer-head span { color: #71767b; font-size: 12px; font-weight: 900; }
    .advisor-roster { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .advisor-roster .choice { min-height: 68px; display: grid; align-content: center; gap: 4px; border: 1px solid #2f3336; border-radius: 16px; padding: 10px; background: #000; color: #e7e9ea; text-align: left; }
    .advisor-roster .choice b { font-size: 14px; }
    .advisor-roster .choice span { color: #71767b; font-size: 11px; line-height: 1.2; font-weight: 850; }
    .command-log span { border-color: #2f3336; background: #000; color: #cfd9de; }
    .key-drawer { border: 1px solid #2f3336; border-radius: 16px; padding: 10px 12px; background: #000; }
    .key-drawer summary { color: #71767b; font-size: 12px; font-weight: 1000; cursor: pointer; }
    .key-drawer input { width: 100%; min-height: 42px; margin-top: 8px; border: 1px solid #2f3336; border-radius: 12px; padding: 0 10px; background: #000; color: #e7e9ea; font: inherit; }
    .key-drawer button { margin-top: 8px; width: 100%; background: #1d9bf0; }
    .floating-compose { position: fixed; z-index: 12; right: max(18px, calc((100vw - 430px) / 2 + 18px)); bottom: calc(78px + env(safe-area-inset-bottom)); width: 58px; height: 58px; border: 0; border-radius: 50%; background: #1d9bf0; color: #fff; font-size: 30px; line-height: 1; font-weight: 900; box-shadow: 0 12px 34px rgba(29,155,240,.34); }
    .bottom-nav { position: fixed; left: 50%; bottom: 0; z-index: 10; width: min(100vw, 430px); transform: translateX(-50%); display: grid; grid-template-columns: repeat(4, 1fr); height: calc(58px + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom); border-top: 1px solid #2f3336; background: rgba(0,0,0,.92); backdrop-filter: blur(18px); }
    .bottom-nav button { border: 0; background: transparent; color: #e7e9ea; font-size: 23px; }
    @media (min-width: 700px) { body { padding: 18px 0; } .phone-shell { min-height: calc(100svh - 36px); border-radius: 22px; box-shadow: 0 30px 100px rgba(0,0,0,.22); } }
  `;
}

function gamePage(game) {
  const artifact = artifactFor(game);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <link rel="icon" href="data:,">
  <title>${game.title} - Arcade Atelier</title>
  <script>if (new URLSearchParams(window.location.search).has('embed')) document.documentElement.classList.add('embed-mode');</script>
  <style>${commonCss(game.accent)}</style>
</head>
<body data-printer-artifact="fake-game-library" data-game-page="${game.id}" data-output-format="multi_html">
  <div class="phone-shell">
    <header class="app-top"><a class="brand" href="index.html">Arcade Atelier</a><a href="${game.file}">重载</a></header>
    <main class="screen play-screen">
      <section class="hero play-hero">
        <p class="kicker">${game.kind}</p>
        <h1>${game.title}</h1>
      </section>
      <section class="game-stage">
        ${game.markup}
      </section>
    </main>
  </div>
  <script>
    window.__PRINTER_ARTIFACT__ = ${JSON.stringify(artifact)};
    (() => {
      ${game.script}
    })();
  </script>
</body>
</html>
`;
}

function remixPage(remix) {
  const artifact = {
    ...artifactFor(remix.game),
    parent_file: remix.source_file,
    remix_prompt: remix.prompt.text,
    agent_description_file: remix.slug + '.remix.json',
  };
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <link rel="icon" href="data:,">
  <title>${remix.title} - Arcade Atelier Remix</title>
  <script>if (new URLSearchParams(window.location.search).has('embed')) document.documentElement.classList.add('embed-mode');</script>
  <style>${commonCss(remix.game.accent)}</style>
</head>
<body data-printer-artifact="fake-game-library" data-game-page="${remix.game.id}" data-output-format="multi_html">
  <div class="phone-shell">
    <header class="app-top"><a class="brand" href="index.html">Arcade Atelier</a><a href="${remix.game.file}">重载</a></header>
    <main class="screen play-screen">
      <section class="hero play-hero">
        <p class="kicker">REMIX · ${remix.game.kind}</p>
        <h1>${remix.title}</h1>
      </section>
      <section class="game-stage">
        ${remix.game.markup}
      </section>
    </main>
  </div>
  <script>
    window.__PRINTER_ARTIFACT__ = ${JSON.stringify(artifact)};
    (() => {
      ${remix.game.script}
    })();
  </script>
</body>
</html>
`;
}

function remixDescription(remix) {
  return {
    schema_version: 1,
    id: remix.id,
    slug: remix.slug,
    title: remix.title,
    source_file: remix.source_file,
    parent_slug: remix.parent_slug,
    lineage: remix.lineage,
    created_at: generatedAt,
    prompt: remix.prompt,
    agent_description: remix.agent_description,
    files: {
      html: remix.game.file,
    },
    validation: {
      static_checked: true,
      browser_checked: false,
      notes: [],
    },
  };
}

function syncDeterministicRemixes(manifest) {
  const lockedSlugs = new Set(deterministicRemixes.map((remix) => remix.slug));
  const preserved = (manifest.remixes || []).filter((entry) => !lockedSlugs.has(entry.slug));
  const generated = deterministicRemixes.map((remix) => ({
    id: remix.id,
    slug: remix.slug,
    file: remix.game.file,
    description_file: remix.slug + '.remix.json',
    title: remix.title,
    kind: 'Remix',
    source_file: remix.source_file,
    parent_slug: remix.parent_slug,
    lineage: remix.lineage,
    summary: remix.summary,
    accent: remix.accent,
    glyph: remix.glyph,
    created_at: generatedAt,
    agent_description: remix.agent_description,
    prompt: remix.prompt,
  }));
  manifest.remixes = [...preserved, ...generated];
  for (const remix of deterministicRemixes) {
    fs.writeFileSync(path.join(outputDir, remix.game.file), remixPage(remix), 'utf8');
    writeJson(remix.slug + '.remix.json', remixDescription(remix));
  }
  return manifest;
}

function indexPage() {
  const artifact = {
    generator: 'printer/tools/generate_fake_library.mjs',
    pipeline: 'WebPrinterPipeline-compatible deterministic fake-game generator',
    output_format: 'multi_html',
    intent,
    generated_at: generatedAt,
    intent_plan: pipelinePlan,
    complexity: { total: 78, components: 24, interactions: 26, pages: games.length, data_flow: 20 },
  };
  const coverGlyphs = ['钉','箱','柱','锅','夺','箭','鳄','珠','逻','SBTI','羊','鸽','茬','块','堵','针','脑','刺','撞','密','合','☑','跑','种','io','蛇','青','重','推','战','玄','塔','命','星','卦','柜'];
  const homeItems = games.map((game, i) => ({
    id: game.id,
    instanceId: `${game.id}-0`,
    file: game.file,
    title: game.title,
    sourceTitle: game.title,
    kind: game.kind,
    sourceGame: game.sourceGame,
    summary: game.summary,
    accent: game.accent,
    glyph: coverGlyphs[i] || '游',
    cover: coverForFile(game.file),
    author: '@Atelier',
    likes: 1200 + i * 137,
    saves: 240 + i * 31,
    baseIndex: i,
    loop: 0,
    remixed: false,
  }));
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
  const formatCount = (value) => value >= 10000 ? `${(value / 10000).toFixed(1)}w` : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  const embedSrc = (file) => `${escapeHtml(file)}?embed=1`;
  const feedItemMarkup = (item, i) => {
    const eager = i < 2;
    const frameSrc = embedSrc(item.file);
    return `
        <article class="feed-item" style="--game-accent:${escapeHtml(item.accent)}; --n:${i};" data-instance-id="${escapeHtml(item.instanceId)}" data-src="${escapeHtml(item.file)}">
          <section class="live-card is-playing" aria-label="${escapeHtml(item.title)} HTML 预览">
            <iframe class="html-frame" title="${escapeHtml(item.title)}" src="${eager ? frameSrc : 'about:blank'}" data-src="${frameSrc}" data-loaded="${eager ? 'true' : 'false'}" loading="${eager ? 'eager' : 'lazy'}" sandbox="allow-scripts allow-forms allow-same-origin"></iframe>
          </section>
          <footer class="feed-caption">
            <span class="avatar" aria-hidden="true"></span>
            <h2>${escapeHtml(item.title)}</h2>
          </footer>
          <aside class="feed-actions">
            <button class="action-button" type="button" data-like aria-label="点赞 ${escapeHtml(item.title)}"><b>♡</b><span data-count="like">${formatCount(item.likes)}</span></button>
            <button class="action-button" type="button" data-save aria-label="收藏 ${escapeHtml(item.title)}"><b>☆</b><span data-count="save">${formatCount(item.saves)}</span></button>
            <a class="action-button" href="${escapeHtml(item.file)}" aria-label="打开 ${escapeHtml(item.title)}"><b>▶</b></a>
            <button class="action-button remix-action" type="button" data-remix aria-label="Remix ${escapeHtml(item.title)}"><b>↻</b></button>
            <button class="action-button" type="button" data-jump aria-label="下一个"><b>↓</b></button>
          </aside>
        </article>`;
  };
  const feed = homeItems.map(feedItemMarkup).join('');
  const waterCardMarkup = (item, i) => {
    const coverHeight = 132 + (i % 5) * 18 + (i % 2) * 12;
    const coverImage = item.cover ? `<img class="water-cover-image" src="${escapeHtml(item.cover)}" alt="" loading="lazy" onload="this.closest('.water-cover').classList.add('has-render')" onerror="this.remove()">` : '';
    return `
      <button class="water-card" type="button" data-open-feed="${i}" data-instance-id="${escapeHtml(item.instanceId)}" style="--game-accent:${escapeHtml(item.accent)}; --cover-h:${coverHeight}px;">
        <span class="water-cover">${coverImage}<b>${escapeHtml(item.glyph)}</b><i>${escapeHtml(item.kind)}</i></span>
        <span class="water-title">${escapeHtml(item.title)}</span>
        <span class="water-summary">${escapeHtml(item.summary)}</span>
        <span class="water-meta"><span>${escapeHtml(item.author)}</span><span>♡ ${formatCount(item.likes)}</span></span>
      </button>`;
  };
  const waterfall = homeItems.map(waterCardMarkup).join('');
  const remixTwists = [
    { label: '夜市版', glyph: '夜', accent: '#00c2ff', summary: '把节奏压进霓虹夜场，反馈更密、奖励更亮。', prompt: '霓虹夜市、快反馈、强分享截图' },
    { label: '地铁版', glyph: '站', accent: '#ffcf33', summary: '改成单手通勤节奏，十秒内给出一次明确变化。', prompt: '地铁通勤、单手操作、十秒循环' },
    { label: '反转版', glyph: '反', accent: '#ff5a3d', summary: '保留核心玩法，但把目标和失败条件倒过来。', prompt: '目标反转、失败变奖励、规则逐步变形' },
    { label: '抽卡版', glyph: '抽', accent: '#9b7cff', summary: '每次操作都掉落一个新词条，适合继续二创。', prompt: '词条掉落、稀有度、可截图收集' },
    { label: '双人版', glyph: '双', accent: '#31d07f', summary: '把单人循环变成互相干扰的同屏挑战。', prompt: '双人同屏、轻对抗、短局结算' },
  ];
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="icon" href="data:,">
  <title>Arcade Atelier - Playable Remix Catalog</title>
  <style>
    ${commonCss('#111')}
    html, body { background: #040404; }
    body { place-items: start center; }
    #homeShell { background: #000; color: #fff; border-color: rgba(255,255,255,.1); }
    #homeShell .app-top { display: none; }
    [hidden] { display: none !important; }
    .home-screen { min-height: 100svh; max-height: 100svh; overflow-y: auto; padding: calc(12px + env(safe-area-inset-top)) 12px calc(22px + env(safe-area-inset-bottom)); background: #050505; scrollbar-width: none; }
    .home-screen::-webkit-scrollbar { display: none; }
    .home-head { position: sticky; top: calc(-12px - env(safe-area-inset-top)); z-index: 10; display: grid; gap: 10px; padding: 12px 0 10px; background: linear-gradient(#050505 72%, rgba(5,5,5,0)); }
    .home-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .home-brand { margin: 0; font-size: 20px; line-height: 1; font-weight: 1000; letter-spacing: 0; }
    .home-brand span { color: #ff375f; }
    .start-feed { min-height: 36px; border: 0; border-radius: 999px; padding: 0 14px; background: #fff; color: #050505; font-weight: 1000; }
    .home-search { display: flex; align-items: center; gap: 8px; min-height: 38px; border: 1px solid rgba(255,255,255,.1); border-radius: 999px; padding: 0 13px; background: rgba(255,255,255,.08); color: rgba(255,255,255,.72); font-size: 13px; font-weight: 750; }
    .home-tags { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 1px; scrollbar-width: none; }
    .home-tags::-webkit-scrollbar { display: none; }
    .home-tags span { flex: 0 0 auto; border: 1px solid rgba(255,255,255,.1); border-radius: 999px; padding: 7px 11px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.76); font-size: 12px; font-weight: 850; }
    .home-tags .active { background: rgba(255,55,95,.18); border-color: rgba(255,55,95,.36); color: #fff; }
    .waterfall { column-count: 2; column-gap: 10px; padding: 2px 0 12px; }
    .water-card { width: 100%; margin: 0 0 10px; break-inside: avoid; display: grid; gap: 7px; border: 1px solid rgba(255,255,255,.1); border-radius: 14px; padding: 0 0 10px; overflow: hidden; background: #111; color: #fff; text-align: left; cursor: pointer; box-shadow: 0 14px 42px rgba(0,0,0,.24); }
    .water-card:active { transform: scale(.985); }
    .water-cover { position: relative; height: var(--cover-h); display: grid; place-items: center; overflow: hidden; background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--game-accent), white 12%), transparent 38%), linear-gradient(155deg, color-mix(in srgb, var(--game-accent), #050505 46%), #080808 70%); }
    .water-cover-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; transform: scale(1.01); }
    .water-cover::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(255,255,255,.06), transparent 42%, rgba(0,0,0,.38)); }
    .water-cover b { position: relative; z-index: 1; font-size: clamp(24px, 10vw, 44px); line-height: 1; font-weight: 1000; letter-spacing: 0; text-shadow: 0 10px 28px rgba(0,0,0,.34); }
    .water-cover.has-render b { display: none; }
    .water-cover i { position: absolute; z-index: 1; left: 9px; top: 9px; border-radius: 999px; padding: 4px 7px; background: rgba(0,0,0,.34); color: rgba(255,255,255,.9); font-style: normal; font-size: 10px; font-weight: 900; }
    .water-title { padding: 0 10px; font-size: 13px; line-height: 1.24; font-weight: 950; color: rgba(255,255,255,.94); }
    .water-summary { padding: 0 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: rgba(255,255,255,.58); font-size: 11px; line-height: 1.35; font-weight: 700; }
    .water-meta { padding: 0 10px; display: flex; justify-content: space-between; gap: 8px; color: rgba(255,255,255,.5); font-size: 10px; line-height: 1; font-weight: 850; }
    .feed-screen { padding: 0; height: 100svh; overflow: hidden; }
    .feed-back { position: fixed; z-index: 12; left: max(12px, calc((100vw - 430px) / 2 + 12px)); top: calc(12px + env(safe-area-inset-top)); width: 40px; height: 40px; border: 1px solid rgba(255,255,255,.14); border-radius: 50%; background: rgba(0,0,0,.28); color: #fff; font-size: 26px; line-height: 1; backdrop-filter: blur(12px); }
    .feed { height: 100svh; overflow-y: auto; scroll-snap-type: y mandatory; scrollbar-width: none; background: #000; }
    .feed::-webkit-scrollbar { display: none; }
    .feed-item { position: relative; height: 100svh; min-height: 640px; scroll-snap-align: start; scroll-snap-stop: always; display: grid; place-items: center; overflow: hidden; isolation: isolate; background: #000; }
    .feed-item::before { content: ""; position: absolute; inset: 0; z-index: 0; background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--game-accent), transparent 36%), transparent 54%), #000; opacity: .55; }
    .feed-item::after { content: ""; position: absolute; inset: 0; z-index: 2; background: linear-gradient(to bottom, rgba(0,0,0,.36), transparent 22%, transparent 56%, rgba(0,0,0,.78)); pointer-events: none; }
    .live-card { position: absolute; z-index: 1; inset: 0; overflow: hidden; border: 0; border-radius: 0; background: #000; box-shadow: none; opacity: 1; transform: none; }
    .feed-item.is-active .live-card { transform: none; opacity: 1; border-color: transparent; }
    .html-frame { position: absolute; left: 0; top: 0; width: 100%; height: 100%; border: 0; display: block; background: #000; pointer-events: auto; }
    .feed-caption { position: absolute; z-index: 5; left: 16px; right: 86px; bottom: calc(22px + env(safe-area-inset-bottom)); display: grid; grid-template-columns: 30px 1fr; column-gap: 8px; align-items: center; pointer-events: none; text-shadow: 0 2px 14px rgba(0,0,0,.72); }
    .avatar { position: relative; width: 30px; height: 30px; display: block; border-radius: 50%; background: color-mix(in srgb, var(--game-accent), #111 48%); border: 1px solid rgba(255,255,255,.34); box-shadow: 0 8px 24px rgba(0,0,0,.32); overflow: hidden; }
    .avatar::before { content: ""; position: absolute; left: 10px; top: 7px; width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.92); }
    .avatar::after { content: ""; position: absolute; left: 7px; bottom: 6px; width: 14px; height: 8px; border-radius: 9px 9px 3px 3px; background: rgba(255,255,255,.92); }
    .feed-caption h2 { margin: 0; color: rgba(255,255,255,.92); font-size: 15px; line-height: 1.16; font-weight: 850; letter-spacing: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .feed-actions { position: absolute; z-index: 6; right: 12px; bottom: calc(76px + env(safe-area-inset-bottom)); display: grid; gap: 14px; }
    .action-button { width: 52px; min-height: 50px; border: 0; border-radius: 0; display: grid; place-items: center; align-content: center; gap: 3px; background: transparent; color: #fff; text-decoration: none; cursor: pointer; text-shadow: 0 2px 14px rgba(0,0,0,.68); }
    .action-button b { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: rgba(0,0,0,.26); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(12px); font-size: 24px; line-height: 1; font-weight: 1000; }
    .action-button span { min-height: 10px; color: rgba(255,255,255,.9); font-size: 10px; line-height: 1; font-weight: 1000; letter-spacing: 0; }
    .feed-item.is-liked [data-like] b { background: #ff2f68; border-color: rgba(255,255,255,.24); }
    .feed-item.is-saved [data-save] b { background: #ffb02e; color: #111; border-color: rgba(255,255,255,.24); }
    .remix-action b { background: color-mix(in srgb, var(--game-accent), rgba(0,0,0,.38) 54%); }
    .action-button:active { transform: scale(.96); }
    .swipe-hint, .remix-dock { display: none; }
    .remix-modal { position: fixed; inset: 0; z-index: 30; display: none; place-items: end center; background: rgba(0,0,0,.56); color: #fff; }
    .remix-modal.is-visible { display: grid; }
    .remix-panel { width: min(100vw, 430px); max-height: 92svh; overflow-y: auto; border: 1px solid rgba(255,255,255,.16); border-radius: 22px 22px 0 0; padding: 14px; background: rgba(8,8,10,.94); box-shadow: 0 -24px 90px rgba(0,0,0,.54); backdrop-filter: blur(20px); display: grid; gap: 12px; }
    .remix-head { display: flex; justify-content: space-between; gap: 10px; align-items: start; }
    .remix-head h2 { margin: 0; font-size: 22px; line-height: 1; }
    .remix-close { width: 36px; height: 36px; border: 1px solid rgba(255,255,255,.18); border-radius: 50%; background: rgba(255,255,255,.08); color: #fff; font-size: 18px; font-weight: 1000; }
    .remix-field { display: grid; gap: 7px; color: rgba(255,255,255,.86); font-size: 12px; font-weight: 900; }
    .remix-input, .remix-textarea { width: 100%; border: 1px solid rgba(255,255,255,.18); border-radius: 14px; padding: 11px 12px; background: rgba(255,255,255,.08); color: #fff; font: inherit; outline: none; }
    .remix-textarea { min-height: 96px; resize: vertical; line-height: 1.42; }
    .remix-progress { height: 7px; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.12); }
    .remix-progress[hidden] { display: none; }
    .remix-progress i { display: block; width: 0%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #22f4ee, #ff4f87); transition: width .28s ease; }
    .remix-step { display: grid; gap: 12px; }
    .remix-step[hidden] { display: none; }
    .remix-actions-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .remix-secondary { min-height: 46px; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 0 12px; background: rgba(255,255,255,.08); color: #fff; font-weight: 1000; }
    .remix-preview { width: 100%; height: 380px; border: 1px solid rgba(255,255,255,.16); border-radius: 18px; background: #050505; display: none; }
    .remix-preview.is-visible { display: block; }
    .remix-status { min-height: 18px; margin: 0; color: rgba(255,255,255,.68); font-size: 12px; line-height: 1.35; }
    @media (max-width: 360px) { .feed-actions { right: 8px; } .feed-caption { right: 76px; } .action-button { width: 48px; } .action-button b { width: 42px; height: 42px; } }
    @media (min-width: 700px) { body { padding: 18px 0; } #homeShell { min-height: calc(100svh - 36px); height: calc(100svh - 36px); overflow: hidden; } .feed-screen, .feed, .feed-item { height: calc(100svh - 36px); } .feed-item { min-height: 640px; } }
  </style>
</head>
<body data-printer-artifact="fake-game-library" data-output-format="multi_html">
  <div class="phone-shell" id="homeShell">
    <main class="screen home-screen" id="homeScreen">
      <header class="home-head">
        <div class="home-bar">
          <h1 class="home-brand">Arcade<span> Atelier</span></h1>
          <button class="start-feed" type="button" data-start-feed>开始浏览</button>
        </div>
        <div class="home-search"><span>⌕</span><span>搜索游戏、玩法、Remix</span></div>
        <nav class="home-tags" aria-label="分类">
          <span class="active">推荐</span><span>小游戏</span><span>玄学</span><span>.io</span><span>解谜</span><span>新 Remix</span>
        </nav>
      </header>
      <section class="waterfall" id="waterfall" aria-label="游戏瀑布流">${waterfall}
      </section>
    </main>
    <main class="screen feed-screen" id="feedScreen" hidden>
      <button class="feed-back" type="button" id="feedBack" aria-label="返回首页">‹</button>
      <section class="feed" id="feed">${feed}
      </section>
    </main>
  </div>
  <section class="remix-modal" id="remixModal" aria-hidden="true">
    <div class="remix-panel" role="dialog" aria-modal="true" aria-labelledby="remixTitle">
      <header class="remix-head">
        <div>
          <p class="kicker">REMIX HARNESS</p>
          <h2 id="remixTitle">Remix</h2>
        </div>
        <button class="remix-close" type="button" id="remixClose" aria-label="关闭">×</button>
      </header>
      <label class="remix-field">想怎么调整<textarea class="remix-textarea" id="remixPrompt" placeholder="比如：改成霓虹夜市版，加入连击、倒计时和截图结果卡。"></textarea></label>
      <button class="primary" type="button" id="draftBtn">生成调整</button>
      <div class="remix-progress" id="remixProgress" hidden><i id="remixProgressBar"></i></div>
      <iframe class="remix-preview" id="draftPreview" title="Remix 草稿预览"></iframe>
      <section class="remix-step" id="publishStep" data-remix-stage="name" hidden>
        <label class="remix-field">名字<input class="remix-input" id="remixName" placeholder="给这个调整后的游戏取名"></label>
        <div class="remix-actions-row">
          <button class="remix-secondary" type="button" id="deleteDraftBtn">重新调整</button>
          <button class="primary" type="button" id="publishBtn" disabled>发布</button>
        </div>
      </section>
      <p class="remix-status" id="remixStatus">启动 tools/remix_harness_server.py 后可用真实生成。</p>
    </div>
  </section>
  <script src="remix_manifest.js"></script>
  <script>
    window.__PRINTER_ARTIFACT__ = ${JSON.stringify(artifact)};
    (() => {
      const feed = document.getElementById('feed');
      const homeScreen = document.getElementById('homeScreen');
      const waterfall = document.getElementById('waterfall');
      const feedScreen = document.getElementById('feedScreen');
      const feedBack = document.getElementById('feedBack');
      const baseItems = ${JSON.stringify(homeItems)};
      const remixTwists = ${JSON.stringify(remixTwists)};
      const publishedRemixes = (window.__PRINTER_REMIX_MANIFEST__ && Array.isArray(window.__PRINTER_REMIX_MANIFEST__.remixes)) ? window.__PRINTER_REMIX_MANIFEST__.remixes : [];
      function itemFromManifest(entry, offset = 0) {
        return {
          id: entry.slug || entry.id || ('remix-' + offset),
          instanceId: (entry.slug || entry.id || ('remix-' + offset)) + '-published-0',
          file: entry.file,
          title: entry.title || entry.slug || 'Remix',
          sourceTitle: entry.title || entry.slug || 'Remix',
          kind: entry.kind || 'Remix',
          sourceGame: entry.source_file || entry.parent_slug || 'Remix Harness',
          summary: entry.summary || (entry.agent_description && entry.agent_description.one_liner) || '本地发布的 Remix。',
          accent: entry.accent || '#22f4ee',
          glyph: entry.glyph || '改',
          cover: entry.cover || ('covers/' + String(entry.file || entry.slug || 'remix').replace(/\.html$/, '') + '.png'),
          author: '@Remix',
          likes: 400 + offset * 37,
          saves: 120 + offset * 17,
          baseIndex: baseItems.length + offset,
          loop: 0,
          remixed: true,
          remixPrompt: entry.prompt && entry.prompt.text ? entry.prompt.text : '',
        };
      }
      const manifestItems = publishedRemixes.map(itemFromManifest).filter((item) => item.file);
      let feedItems = baseItems.concat(manifestItems).map((item) => ({ ...item }));
      let nextAppend = feedItems.length;
      let activeIndex = 0;
      let remixCount = 0;
      let scrollFrame = 0;
      let dockTimer = 0;
      let harnessAvailable = false;
      let currentDraft = null;
      let currentRemixArticle = null;
      let currentRemixPromptKey = '';
      const remixPromptByFile = new Map();
      const social = new Map(feedItems.map((item) => [item.instanceId, { liked: false, saved: false, likes: item.likes, saves: item.saves }]));
      const escapeHtml = (value) => {
        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(value).replace(/[&<>"']/g, (char) => entities[char]);
      };
      const formatCount = (value) => value >= 10000 ? (value / 10000).toFixed(1) + 'w' : value >= 1000 ? (value / 1000).toFixed(1) + 'k' : String(value);
      const embedSrc = (value) => escapeHtml(value) + '?embed=1';
      function waterCardMarkup(item, index) {
        const coverHeight = 132 + (index % 5) * 18 + (index % 2) * 12;
        const coverImage = item.cover ? '<img class="water-cover-image" src="' + escapeHtml(item.cover) + '" alt="" loading="lazy" onload="this.closest(\\'.water-cover\\').classList.add(\\'has-render\\')" onerror="this.remove()">' : '';
        return '<button class="water-card" type="button" data-open-feed="' + index + '" data-instance-id="' + escapeHtml(item.instanceId) + '" style="--game-accent:' + escapeHtml(item.accent) + '; --cover-h:' + coverHeight + 'px;">' +
          '<span class="water-cover">' + coverImage + '<b>' + escapeHtml(item.glyph) + '</b><i>' + escapeHtml(item.kind) + '</i></span>' +
          '<span class="water-title">' + escapeHtml(item.title) + '</span>' +
          '<span class="water-summary">' + escapeHtml(item.summary) + '</span>' +
          '<span class="water-meta"><span>' + escapeHtml(item.author) + '</span><span>♡ ' + formatCount(item.likes) + '</span></span>' +
        '</button>';
      }
      function syncWaterfallIndices() {
        if (!waterfall) return;
        waterfall.querySelectorAll('.water-card[data-instance-id]').forEach((card) => {
          const index = feedItems.findIndex((item) => item.instanceId === card.dataset.instanceId);
          if (index >= 0) card.dataset.openFeed = String(index);
        });
      }
      function appendWaterfallCard(item, index) {
        if (!waterfall || !item || !item.file) return;
        waterfall.insertAdjacentHTML('beforeend', waterCardMarkup(item, index));
      }
      function markupFor(item, index) {
        const eager = index < 2 || item.remixed;
        const frameSrc = embedSrc(item.file);
        if (!social.has(item.instanceId)) social.set(item.instanceId, { liked: false, saved: false, likes: item.likes, saves: item.saves });
        const state = social.get(item.instanceId);
        return '<article class="feed-item" style="--game-accent:' + escapeHtml(item.accent) + '; --n:' + (index % baseItems.length) + ';" data-instance-id="' + escapeHtml(item.instanceId) + '" data-src="' + escapeHtml(item.file) + '">' +
          '<section class="live-card is-playing" aria-label="' + escapeHtml(item.title) + ' HTML 预览">' +
            '<iframe class="html-frame" title="' + escapeHtml(item.title) + '" src="' + (eager ? frameSrc : 'about:blank') + '" data-src="' + frameSrc + '" data-loaded="' + (eager ? 'true' : 'false') + '" loading="lazy" sandbox="allow-scripts allow-forms allow-same-origin"></iframe>' +
          '</section>' +
          '<footer class="feed-caption"><span class="avatar" aria-hidden="true"></span><h2>' + escapeHtml(item.title) + '</h2></footer>' +
          '<aside class="feed-actions">' +
            '<button class="action-button" type="button" data-like aria-label="点赞 ' + escapeHtml(item.title) + '"><b>' + (state.liked ? '♥' : '♡') + '</b><span data-count="like">' + formatCount(state.likes) + '</span></button>' +
            '<button class="action-button" type="button" data-save aria-label="收藏 ' + escapeHtml(item.title) + '"><b>' + (state.saved ? '★' : '☆') + '</b><span data-count="save">' + formatCount(state.saves) + '</span></button>' +
            '<a class="action-button" href="' + escapeHtml(item.file) + '" aria-label="打开 ' + escapeHtml(item.title) + '"><b>▶</b></a>' +
            '<button class="action-button remix-action" type="button" data-remix aria-label="Remix ' + escapeHtml(item.title) + '"><b>↻</b></button>' +
            '<button class="action-button" type="button" data-jump aria-label="下一个"><b>↓</b></button>' +
          '</aside>' +
        '</article>';
      }
      if (manifestItems.length) {
        feed.insertAdjacentHTML('beforeend', manifestItems.map((item, index) => markupFor(item, baseItems.length + index)).join(''));
      }
      manifestItems.forEach((item, index) => appendWaterfallCard(item, baseItems.length + index));
      function articleList() {
        return Array.from(feed.querySelectorAll('.feed-item'));
      }
      function currentIndex() {
        const articles = articleList();
        const rootBox = feed.getBoundingClientRect();
        const target = rootBox.top + rootBox.height / 2;
        let bestIndex = 0;
        let bestDelta = Infinity;
        articles.forEach((article, index) => {
          const box = article.getBoundingClientRect();
          const delta = Math.abs(box.top + box.height / 2 - target);
          if (delta < bestDelta) {
            bestDelta = delta;
            bestIndex = index;
          }
        });
        return bestIndex;
      }
      function loadFrame(article) {
        const frame = article && article.querySelector('.html-frame');
        if (!frame) return;
        if (frame.dataset.loaded !== 'true') {
          frame.src = frame.dataset.src;
          frame.dataset.loaded = 'true';
        }
        bridgeFrameGestures(frame);
      }
      function bridgeFrameGestures(frame) {
        if (!frame || frame.dataset.gestureBridge === 'true') return;
        const attach = () => {
          let doc = null;
          try {
            doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
          } catch (error) {
            return;
          }
          if (!doc || doc.__PRINTER_FEED_GESTURE_BRIDGED__) return;
          doc.__PRINTER_FEED_GESTURE_BRIDGED__ = true;
          let lastX = 0;
          let lastY = 0;
          doc.addEventListener('wheel', (event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            event.preventDefault();
            feed.scrollTop += event.deltaY;
          }, { passive: false });
          doc.addEventListener('touchstart', (event) => {
            const touch = event.touches && event.touches[0];
            if (!touch) return;
            lastX = touch.clientX;
            lastY = touch.clientY;
          }, { passive: true });
          doc.addEventListener('touchmove', (event) => {
            const touch = event.touches && event.touches[0];
            if (!touch) return;
            const dx = touch.clientX - lastX;
            const dy = touch.clientY - lastY;
            if (Math.abs(dy) <= Math.abs(dx) + 8) return;
            event.preventDefault();
            feed.scrollTop -= dy;
            lastX = touch.clientX;
            lastY = touch.clientY;
          }, { passive: false });
        };
        frame.dataset.gestureBridge = 'true';
        frame.addEventListener('load', attach);
        attach();
      }
      function loadAround(index) {
        const articles = articleList();
        for (let i = Math.max(0, index - 1); i <= Math.min(articles.length - 1, index + 1); i += 1) {
          loadFrame(articles[i]);
        }
      }
      function openFeedAt(index = 0) {
        homeScreen.hidden = true;
        feedScreen.hidden = false;
        const articles = articleList();
        const safeIndex = Math.max(0, Math.min(index, articles.length - 1));
        window.requestAnimationFrame(() => {
          if (articles[safeIndex]) feed.scrollTop = articles[safeIndex].offsetTop;
          loadAround(safeIndex);
          updateActive();
        });
      }
      function showHome() {
        feedScreen.hidden = true;
        homeScreen.hidden = false;
      }
      function updateActive() {
        activeIndex = currentIndex();
        articleList().forEach((article, index) => article.classList.toggle('is-active', index === activeIndex));
        loadAround(activeIndex);
        ensureTail();
      }
      function loopItem(position) {
        const base = baseItems[position % baseItems.length];
        const loop = Math.floor(position / baseItems.length);
        return {
          ...base,
          instanceId: base.id + '-loop-' + loop,
          loop,
          summary: loop > 0 ? base.summary + ' 第 ' + (loop + 1) + ' 次刷到，仍然可以继续 Remix。' : base.summary,
        };
      }
      function appendMore(count = 8) {
        const start = feedItems.length;
        const html = [];
        for (let offset = 0; offset < count; offset += 1) {
          const item = loopItem(nextAppend);
          nextAppend += 1;
          feedItems.push(item);
          html.push(markupFor(item, start + offset));
        }
        feed.insertAdjacentHTML('beforeend', html.join(''));
      }
      function ensureTail() {
        if (feedItems.length - activeIndex < 5) appendMore();
      }
      function makeRemix(item) {
        const twist = remixTwists[remixCount % remixTwists.length];
        remixCount += 1;
        const sourceTitle = item.sourceTitle || item.title.replace(/ · .*/, '');
        return {
          ...item,
          id: item.id + '-remix-' + remixCount,
          instanceId: item.id + '-remix-' + remixCount,
          title: sourceTitle + ' · ' + twist.label,
          sourceTitle,
          kind: 'Remix',
          summary: twist.summary,
          accent: twist.accent,
          glyph: twist.glyph,
          remixed: true,
          remixPrompt: '把《' + sourceTitle + '》改造成：' + twist.prompt,
        };
      }
      function showRemixDock(item) {
        window.clearTimeout(dockTimer);
        dockTimer = window.setTimeout(() => {}, 240);
      }
      const remixModal = document.getElementById('remixModal');
      const remixTitle = document.getElementById('remixTitle');
      const remixPrompt = document.getElementById('remixPrompt');
      const remixStatus = document.getElementById('remixStatus');
      const remixProgress = document.getElementById('remixProgress');
      const remixProgressBar = document.getElementById('remixProgressBar');
      const draftPreview = document.getElementById('draftPreview');
      const publishStep = document.getElementById('publishStep');
      const remixName = document.getElementById('remixName');
      const publishBtn = document.getElementById('publishBtn');
      const draftBtn = document.getElementById('draftBtn');
      const deleteDraftBtn = document.getElementById('deleteDraftBtn');
      const remixClose = document.getElementById('remixClose');
      let progressTimer = 0;
      let progressStartedAt = 0;
      function localSlug(value) {
        return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'remix';
      }
      function slugForCurrentDraft(name) {
        const derived = localSlug(name);
        if (derived === 'remix' && currentDraft && currentDraft.slug_suggestion) return currentDraft.slug_suggestion;
        return derived;
      }
      function remixPromptKeyFor(item, article) {
        return item.file || article?.dataset?.src || item.instanceId || item.title || 'current';
      }
      function isTextEntryTarget(target) {
        return Boolean(target && target.closest && target.closest('input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]'));
      }
      function setRemixStatus(text) {
        if (remixStatus) remixStatus.textContent = text;
      }
      function setRemixProgress(percent, message) {
        const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
        if (remixProgress) remixProgress.hidden = safePercent <= 0;
        if (remixProgressBar) remixProgressBar.style.width = safePercent + '%';
        if (message) setRemixStatus(message);
      }
      function stopProgressTicker() {
        if (progressTimer) window.clearInterval(progressTimer);
        progressTimer = 0;
      }
      function startProgressTicker() {
        stopProgressTicker();
        progressStartedAt = Date.now();
        progressTimer = window.setInterval(() => {
          const elapsed = Math.max(1, Math.round((Date.now() - progressStartedAt) / 1000));
          const currentWidth = remixProgressBar ? parseFloat(remixProgressBar.style.width || '0') : 0;
          if (currentWidth >= 42 && currentWidth < 92) {
            setRemixStatus('模型生成中... ' + elapsed + 's，通常 20-60s。');
          }
        }, 1000);
      }
      function formatRemixError(error) {
        let message = error && error.message ? error.message : String(error || '');
        try {
          const parsed = JSON.parse(message);
          if (parsed && parsed.detail) message = String(parsed.detail);
        } catch (parseError) {}
        if (message === 'Failed to fetch' || /NetworkError|Load failed|fetch/i.test(message)) {
          harnessAvailable = false;
          return 'Harness 服务未连接。请先运行 python tools/remix_harness_server.py --port 8787，然后刷新页面。';
        }
        if (/model response JSON was incomplete|JSON was incomplete/i.test(message)) {
          return '模型输出被截断。现在已改为更稳的 raw HTML 生成格式；请再点一次生成。';
        }
        return message;
      }
      const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
      async function parseJsonResponse(response) {
        const text = await response.text();
        if (!response.ok) throw new Error(text);
        return text ? JSON.parse(text) : {};
      }
      async function pollDraftJob(jobId, initialJob) {
        let job = initialJob;
        while (true) {
          if (job) {
            setRemixProgress(job.percent || 8, job.message || '正在生成...');
            if (job.status === 'done') return job.draft;
            if (job.status === 'error') throw new Error(job.error || job.message || '生成失败');
          }
          await sleep(850);
          const response = await fetch('/api/remix/draft-jobs/' + encodeURIComponent(jobId), { cache: 'no-store' });
          job = await parseJsonResponse(response);
        }
      }
      async function createDraftWithProgress(payload) {
        setRemixProgress(5, '提交生成任务...');
        const response = await fetch('/api/remix/draft-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.status === 404) {
          setRemixProgress(36, '旧版 Harness 生成中...');
          const fallback = await fetch('/api/remix/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          return parseJsonResponse(fallback);
        }
        const job = await parseJsonResponse(response);
        return pollDraftJob(job.job_id, job);
      }
      function openRemixPanel(article) {
        const item = feedItems[articleList().indexOf(article)] || { file: article.dataset.src, title: article.querySelector('h2')?.textContent || 'Remix' };
        currentRemixArticle = article;
        currentRemixPromptKey = remixPromptKeyFor(item, article);
        currentDraft = null;
        remixTitle.textContent = 'Remix ' + item.title;
        remixPrompt.value = remixPromptByFile.get(currentRemixPromptKey) || '';
        remixName.value = '';
        draftPreview.removeAttribute('src');
        draftPreview.classList.remove('is-visible');
        setRemixProgress(0, '');
        publishStep.hidden = true;
        publishBtn.disabled = true;
        remixModal.classList.add('is-visible');
        remixModal.setAttribute('aria-hidden', 'false');
        setRemixStatus(harnessAvailable ? '输入一句调整，然后生成。' : 'Harness 服务未连接，当前会回退成本地假 Remix。');
      }
      function closeRemixPanel() {
        remixModal.classList.remove('is-visible');
        remixModal.setAttribute('aria-hidden', 'true');
      }
      async function createHarnessDraft() {
        if (!currentRemixArticle) return;
        const item = feedItems[articleList().indexOf(currentRemixArticle)] || { file: currentRemixArticle.dataset.src };
        const promptText = remixPrompt.value.trim();
        if (currentRemixPromptKey) remixPromptByFile.set(currentRemixPromptKey, remixPrompt.value);
        if (!promptText) {
          setRemixStatus('先写一句想怎么调整。');
          remixPrompt.focus();
          return;
        }
        draftBtn.disabled = true;
        publishBtn.disabled = true;
        publishStep.hidden = true;
        setRemixProgress(12, '准备生成调整...');
        startProgressTicker();
        try {
          currentDraft = await createDraftWithProgress({
            source_file: item.file,
            prompt_text: promptText,
            voice_transcript: ''
          });
          draftPreview.src = currentDraft.preview_url;
          draftPreview.classList.add('is-visible');
          remixName.value = currentDraft.title || item.title + ' Remix';
          publishStep.hidden = false;
          publishBtn.disabled = false;
          setRemixProgress(100, '调整完成，取个名字后发布。');
        } catch (error) {
          setRemixStatus('生成失败：' + formatRemixError(error));
        } finally {
          stopProgressTicker();
          draftBtn.disabled = false;
        }
      }
      async function publishHarnessDraft() {
        if (!currentDraft || !currentRemixArticle) return;
        publishBtn.disabled = true;
        setRemixStatus('正在发布到 output...');
        try {
          const title = (remixName.value || currentDraft.title || 'Remix').trim();
          const response = await fetch('/api/remix/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              draft_id: currentDraft.draft_id,
              slug: slugForCurrentDraft(title),
              title,
              agent_description: currentDraft.agent_description || {}
            })
          });
          if (!response.ok) throw new Error(await response.text());
          const result = await response.json();
          const newItem = itemFromManifest(result.manifest_entry || {}, feedItems.length);
          const index = articleList().indexOf(currentRemixArticle);
          feedItems.splice(index + 1, 0, newItem);
          currentRemixArticle.insertAdjacentHTML('afterend', markupFor(newItem, index + 1));
          appendWaterfallCard(newItem, index + 1);
          syncWaterfallIndices();
          const inserted = currentRemixArticle.nextElementSibling;
          window.requestAnimationFrame(() => {
            inserted.scrollIntoView({ behavior: 'smooth', block: 'start' });
            loadFrame(inserted);
            updateActive();
          });
          setRemixStatus('已发布：' + result.file);
          currentDraft = null;
        } catch (error) {
          publishBtn.disabled = false;
          setRemixStatus('发布失败：' + formatRemixError(error));
        }
      }
      async function deleteHarnessDraft() {
        if (!currentDraft) {
          closeRemixPanel();
          return;
        }
        const draftId = currentDraft.draft_id;
        currentDraft = null;
        try {
          await fetch('/api/remix/draft/' + encodeURIComponent(draftId), { method: 'DELETE' });
        } catch (error) {}
        draftPreview.removeAttribute('src');
        draftPreview.classList.remove('is-visible');
        publishStep.hidden = true;
        publishBtn.disabled = true;
        setRemixStatus('已丢弃草稿，可以继续改文本再生成。');
      }
      fetch('/api/remix/sources', { cache: 'no-store' })
        .then((response) => {
          harnessAvailable = response.ok;
          setRemixStatus(harnessAvailable ? 'Harness 服务已连接。' : '启动 tools/remix_harness_server.py 后可用真实生成。');
        })
        .catch(() => {
          harnessAvailable = false;
          setRemixStatus('启动 tools/remix_harness_server.py 后可用真实生成。');
        });
      remixClose.addEventListener('click', closeRemixPanel);
      remixPrompt.addEventListener('input', () => {
        if (currentRemixPromptKey) remixPromptByFile.set(currentRemixPromptKey, remixPrompt.value);
      });
      draftBtn.addEventListener('click', createHarnessDraft);
      publishBtn.addEventListener('click', publishHarnessDraft);
      deleteDraftBtn.addEventListener('click', deleteHarnessDraft);
      homeScreen.addEventListener('click', (event) => {
        const start = event.target.closest('[data-start-feed]');
        const card = event.target.closest('[data-open-feed]');
        if (start) {
          openFeedAt(0);
        } else if (card) {
          openFeedAt(Number(card.dataset.openFeed || 0));
        }
      });
      feedBack.addEventListener('click', showHome);
      function syncArticleSocial(article) {
        const item = feedItems[articleList().indexOf(article)];
        if (!item) return;
        const state = social.get(item.instanceId);
        if (!state) return;
        article.classList.toggle('is-liked', state.liked);
        article.classList.toggle('is-saved', state.saved);
        const likeButton = article.querySelector('[data-like] b');
        const saveButton = article.querySelector('[data-save] b');
        if (likeButton) likeButton.textContent = state.liked ? '♥' : '♡';
        if (saveButton) saveButton.textContent = state.saved ? '★' : '☆';
        const likeCount = article.querySelector('[data-count="like"]');
        const saveCount = article.querySelector('[data-count="save"]');
        if (likeCount) likeCount.textContent = formatCount(state.likes);
        if (saveCount) saveCount.textContent = formatCount(state.saves);
      }
      function insertRemix(article) {
        const index = articleList().indexOf(article);
        const source = feedItems[index] || feedItems[activeIndex] || baseItems[0];
        const remix = makeRemix(source);
        remix.likes = Math.max(1, Math.floor((source.likes || 1) * .42));
        remix.saves = Math.max(1, Math.floor((source.saves || 1) * .48));
        feedItems.splice(index + 1, 0, remix);
        article.insertAdjacentHTML('afterend', markupFor(remix, index + 1));
        showRemixDock(remix);
        const inserted = article.nextElementSibling;
        window.requestAnimationFrame(() => {
          inserted.scrollIntoView({ behavior: 'smooth', block: 'start' });
          loadFrame(inserted);
          updateActive();
        });
      }
      feed.addEventListener('click', (event) => {
        const action = event.target.closest('[data-jump], [data-remix], [data-like], [data-save]');
        if (!action) return;
        const article = action.closest('.feed-item');
        if (action.matches('[data-like], [data-save]')) {
          event.preventDefault();
          event.stopPropagation();
          const item = feedItems[articleList().indexOf(article)];
          const state = item && social.get(item.instanceId);
          if (!state) return;
          if (action.matches('[data-like]')) {
            state.liked = !state.liked;
            state.likes += state.liked ? 1 : -1;
          } else {
            state.saved = !state.saved;
            state.saves += state.saved ? 1 : -1;
          }
          syncArticleSocial(article);
        } else if (action.matches('[data-jump]')) {
          event.preventDefault();
          event.stopPropagation();
          ensureTail();
          const next = Math.min(articleList().length - 1, currentIndex() + 1);
          articleList()[next].scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (action.matches('[data-remix]')) {
          event.preventDefault();
          event.stopPropagation();
          if (harnessAvailable) {
            openRemixPanel(article);
          } else {
            insertRemix(article);
          }
        }
      });
      feed.addEventListener('scroll', () => {
        if (scrollFrame) return;
        scrollFrame = window.requestAnimationFrame(() => {
          scrollFrame = 0;
          updateActive();
        });
      }, { passive: true });
      window.addEventListener('keydown', (event) => {
        if (isTextEntryTarget(event.target)) return;
        if (remixModal.classList.contains('is-visible')) {
          if (event.key === 'Escape') closeRemixPanel();
          return;
        }
        if (feedScreen.hidden) {
          if (event.key === 'Enter') openFeedAt(0);
          return;
        }
        const articles = articleList();
        const current = currentIndex();
        if (event.key === 'ArrowDown') {
          ensureTail();
          articles[Math.min(articles.length - 1, current + 1)].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (event.key === 'ArrowUp') articles[Math.max(0, current - 1)].scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (event.key.toLowerCase() === 'r') {
          if (harnessAvailable) openRemixPanel(articles[current]);
          else insertRemix(articles[current]);
        }
      });
      loadAround(0);
      window.remixCurrent = () => {
        const article = articleList()[currentIndex()];
        if (feedScreen.hidden) openFeedAt(currentIndex());
        if (harnessAvailable) openRemixPanel(article);
        else insertRemix(article);
      };
      window.render_home_to_text = () => JSON.stringify({
        coordinate_system: 'vertical infinite html feed',
        baseItems: baseItems.length,
        items: feedItems.length,
        visibleIndex: activeIndex,
        visibleTitle: feedItems[activeIndex] ? feedItems[activeIndex].title : null,
        remixes: remixCount,
        publishedRemixes: publishedRemixes.length,
        harnessAvailable,
        supportsRemix: true,
      });
    })();
  </script>
</body>
</html>
`;
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(outputDir, file), JSON.stringify(data, null, 2), 'utf8');
}

function ensureRemixManifest() {
  const manifestPath = path.join(outputDir, 'remix_manifest.json');
  let manifest = { schema_version: 1, remixes: [] };
  if (fs.existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (existing && Array.isArray(existing.remixes)) {
        manifest = {
          schema_version: existing.schema_version || 1,
          remixes: existing.remixes,
        };
      }
    } catch {}
  }
  manifest = syncDeterministicRemixes(manifest);
  writeJson('remix_manifest.json', manifest);
  fs.writeFileSync(
    path.join(outputDir, 'remix_manifest.js'),
    'window.__PRINTER_REMIX_MANIFEST__ = ' + JSON.stringify(manifest, null, 2) + ';\n',
    'utf8',
  );
}

fs.writeFileSync(path.join(outputDir, 'index.html'), indexPage(), 'utf8');
for (const game of games) fs.writeFileSync(path.join(outputDir, game.file), gamePage(game), 'utf8');
ensureRemixManifest();

const files = [
  'index.html',
  ...games.map((game) => game.file),
  ...deterministicRemixes.map((remix) => remix.game.file),
  'remix_manifest.json',
  'remix_manifest.js',
];
writeJson('run_report.json', {
  output_format: 'multi_html',
  complexity: { total: 84, components: 26, interactions: 28, pages: games.length, data_flow: 18 },
  intent_plan: pipelinePlan,
  warnings: [],
  files,
  generated_at: generatedAt,
  source: {
    entrypoint: 'printer/web_printer_selenium.py',
    followed_logic: ['parse intent', 'plan intent', 'score complexity', 'generate artifacts', 'write run_report'],
    deterministic_generator: 'printer/tools/generate_fake_library.mjs',
  },
});
writeJson('fake_manifest.json', {
  intent,
  generated_at: generatedAt,
  games: games.map((game) => artifactFor(game).game),
});

console.log(`Generated ${files.length} fake-library files in ${outputDir}`);
