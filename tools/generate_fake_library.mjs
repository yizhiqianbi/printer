import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve('printer/output');
fs.mkdirSync(outputDir, { recursive: true });

const generatedAt = new Date().toISOString();
const intent = '建立移动端竖屏赝品库：按热门小游戏机制生成离线 HTML，保留交互、节奏和传播点，不复制原站代码或素材。';

const coverForFile = (file) => 'covers/' + path.basename(file, '.html') + '.png';

const pipelinePlan = {
  summary: '基于游戏参考意图生成移动端竖屏多页面 HTML 赝品库',
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

const games = [
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
  <title>${game.title} - 赝品库</title>
  <script>if (new URLSearchParams(window.location.search).has('embed')) document.documentElement.classList.add('embed-mode');</script>
  <style>${commonCss(game.accent)}</style>
</head>
<body data-printer-artifact="fake-game-library" data-game-page="${game.id}" data-output-format="multi_html">
  <div class="phone-shell">
    <header class="app-top"><a class="brand" href="index.html">赝品库</a><a href="${game.file}">重载</a></header>
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
  const coverGlyphs = ['SBTI','羊','脑','刺','撞','密','合','☑','跑','种','io','青','重','推','战','玄','塔','命','星','卦'];
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
    glyph: coverGlyphs[i],
    cover: coverForFile(game.file),
    author: '@赝品库',
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
  <title>HTML 刷刷 - 赝品库 Remix Feed</title>
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
    .home-brand { margin: 0; font-size: 22px; line-height: 1; font-weight: 1000; letter-spacing: 0; }
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
          <h1 class="home-brand">HTML<span>刷刷</span></h1>
          <button class="start-feed" type="button" data-start-feed>开始刷刷</button>
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
  } else {
    writeJson('remix_manifest.json', manifest);
  }
  fs.writeFileSync(
    path.join(outputDir, 'remix_manifest.js'),
    'window.__PRINTER_REMIX_MANIFEST__ = ' + JSON.stringify(manifest, null, 2) + ';\n',
    'utf8',
  );
}

fs.writeFileSync(path.join(outputDir, 'index.html'), indexPage(), 'utf8');
for (const game of games) fs.writeFileSync(path.join(outputDir, game.file), gamePage(game), 'utf8');
ensureRemixManifest();

const files = ['index.html', ...games.map((game) => game.file), 'remix_manifest.json', 'remix_manifest.js'];
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
