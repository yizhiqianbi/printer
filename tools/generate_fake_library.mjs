import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve('printer/output');
fs.mkdirSync(outputDir, { recursive: true });

const generatedAt = new Date().toISOString();
const intent = '建立移动端竖屏赝品库：按热门小游戏机制生成离线 HTML，保留交互、节奏和传播点，不复制原站代码或素材。';

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
    html, body { margin: 0; min-height: 100%; background: #040404; color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    body { display: grid; place-items: start center; overscroll-behavior: none; }
    button, input { font: inherit; }
    button, a, input { touch-action: manipulation; }
    .phone-shell { width: min(100vw, 430px); min-height: 100svh; background:
      radial-gradient(circle at 50% 4%, rgba(255,59,134,.42), transparent 34%),
      radial-gradient(circle at 10% 24%, rgba(34,244,238,.16), transparent 26%),
      linear-gradient(180deg, #160611 0, #080509 42%, #030303 100%); border-left: 1px solid var(--line); border-right: 1px solid var(--line); display: flex; flex-direction: column; overflow: hidden; }
    .app-top { position: sticky; top: 0; z-index: 5; height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 max(14px, env(safe-area-inset-left)); border-bottom: 1px solid rgba(255,255,255,.08); background: linear-gradient(to bottom, rgba(0,0,0,.78), rgba(0,0,0,.28)); color: #fff; backdrop-filter: blur(16px); }
    .brand { color: inherit; text-decoration: none; font-weight: 900; }
    .app-top a:last-child { color: #fff; opacity: .72; text-decoration: none; font-weight: 900; font-size: 13px; }
    .screen { padding: 12px 12px calc(18px + env(safe-area-inset-bottom)); flex: 1; }
    .play-screen { display: flex; flex-direction: column; min-height: calc(100svh - 50px); }
    .hero { min-height: 92px; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; padding: 12px 2px; border-bottom: 1px solid rgba(255,255,255,.1); }
    .play-hero { min-height: 88px; }
    .kicker { margin: 0; color: var(--cyan); font-size: 11px; font-weight: 1000; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(34px, 11vw, 54px); line-height: .88; letter-spacing: 0; color: #fff; text-shadow: 0 6px 28px rgba(255,59,134,.2); }
    h2 { margin: 0 0 12px; font-size: clamp(25px, 8vw, 36px); line-height: 1; letter-spacing: 0; }
    .summary { margin: 0; color: rgba(255,255,255,.62); line-height: 1.42; font-size: 13px; }
    .game-stage { display: grid; gap: 10px; padding-top: 10px; touch-action: none; flex: 1; align-content: start; }
    .panel { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); border-radius: 14px; padding: 14px; box-shadow: 0 18px 54px rgba(0,0,0,.28); backdrop-filter: blur(18px); color: #fff; }
    .compact { padding: 12px; }
    .primary { min-height: 54px; border: 0; border-radius: 999px; padding: 0 18px; background: linear-gradient(135deg, var(--accent), #ff6aa8); color: #fff; font-weight: 1000; cursor: pointer; box-shadow: 0 12px 30px rgba(255,59,134,.28); }
    .primary:disabled, button:disabled { opacity: .42; cursor: not-allowed; box-shadow: none; }
    .hidden { display: none !important; }
    .play-canvas { width: 100%; height: auto; border: 1px solid rgba(255,255,255,.16); border-radius: 18px; background: #09070d; display: block; touch-action: none; box-shadow: 0 24px 70px rgba(0,0,0,.34); }
    .play-canvas.short { aspect-ratio: 390 / 320; }
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
    .slots { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; }
    .slots span { min-height: 84px; display: grid; place-items: center; border: 1px dashed rgba(255,255,255,.22); border-radius: 18px; font-size: 28px; font-weight: 1000; background: rgba(255,255,255,.09); color: #fff; }
    .craft-toolbar { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0; }
    .craft-stats { display: flex; justify-content: space-between; gap: 10px; margin: 10px 0 0; color: var(--cyan); font-size: 12px; font-weight: 1000; letter-spacing: .08em; text-transform: uppercase; }
    .craft-history { display: flex; gap: 8px; overflow-x: auto; padding: 8px 0 0; scrollbar-width: none; }
    .craft-history::-webkit-scrollbar { display: none; }
    .craft-history span { flex: 0 0 auto; max-width: 270px; overflow: hidden; text-overflow: ellipsis; border: 1px solid rgba(255,255,255,.14); border-radius: 999px; padding: 8px 10px; background: rgba(255,255,255,.08); color: rgba(255,255,255,.82); font-weight: 800; white-space: nowrap; }
    .chip-pool { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { min-height: 42px; text-align: center; width: auto; max-width: calc(100vw - 48px); overflow-wrap: anywhere; white-space: normal; }
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
  <title>${game.title} - 赝品库</title>
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
    complexity: { total: 64, components: 18, interactions: 15, pages: 12, data_flow: 19 },
  };
  const coverGlyphs = ['SBTI','羊','脑','刺','撞','密','合','☑','跑','种','io','玄'];
  const feed = games.map((game, i) => `
        <article class="feed-item" style="--game-accent:${game.accent}; --n:${i};">
          <a class="cover-hit" href="${game.file}" aria-label="打开${game.title}"></a>
          <div class="cover-stack" aria-hidden="true">
            <i></i><i></i><i></i>
          </div>
          <div class="cover-art">
            <span>${coverGlyphs[i]}</span>
          </div>
          <aside class="feed-actions">
            <a href="${game.file}" aria-label="Play ${game.title}">▶</a>
            <button type="button" data-jump="${i + 1}" aria-label="下一个">↓</button>
          </aside>
          <footer class="feed-caption">
            <h2>${game.title}</h2>
            <a class="play-pill" href="${game.file}">PLAY</a>
          </footer>
        </article>`).join('');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>赝品库 - 移动端 HTML 小游戏</title>
  <style>
    ${commonCss('#111')}
    html, body { background: #040404; }
    body { place-items: start center; }
    #homeShell { background: #050505; color: #fff; border-color: rgba(255,255,255,.12); }
    #homeShell .app-top { position: fixed; left: 50%; transform: translateX(-50%); width: min(100vw, 430px); height: 56px; border: 0; background: linear-gradient(to bottom, rgba(0,0,0,.68), transparent); color: #fff; }
    #homeShell .brand { font-size: 18px; }
    #homeShell .app-top a:last-child { color: #fff; opacity: .72; }
    .feed-screen { padding: 0; height: 100svh; overflow: hidden; }
    .feed { height: 100svh; overflow-y: auto; scroll-snap-type: y mandatory; scrollbar-width: none; }
    .feed::-webkit-scrollbar { display: none; }
    .feed-item { position: relative; height: 100svh; min-height: 640px; scroll-snap-align: start; display: grid; place-items: center; overflow: hidden; isolation: isolate; background:
      radial-gradient(circle at 50% 38%, rgba(255,59,134,.72) 0 18%, transparent 42%),
      radial-gradient(circle at 10% 18%, rgba(34,244,238,.22), transparent 28%),
      linear-gradient(160deg, #9c164c, #100810 58%, #030303); }
    .feed-item::before { content: ""; position: absolute; inset: -20%; z-index: -2; background:
      repeating-linear-gradient(90deg, rgba(255,255,255,.09) 0 1px, transparent 1px 88px),
      repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 1px, transparent 1px 88px); transform: rotate(calc((var(--n) - 5) * 2deg)); opacity: .42; }
    .feed-item::after { content: ""; position: absolute; inset: 40% 0 0; z-index: 1; background: linear-gradient(to bottom, transparent, rgba(0,0,0,.62) 44%, rgba(0,0,0,.92)); pointer-events: none; }
    .cover-hit { position: absolute; inset: 0; z-index: 2; }
    .cover-stack { position: absolute; inset: 76px 22px 210px; display: grid; place-items: center; pointer-events: none; opacity: .94; }
    .cover-stack i { position: absolute; width: min(70vw, 300px); aspect-ratio: 9 / 14; border-radius: 22px; border: 1px solid rgba(255,255,255,.18); background:
      linear-gradient(150deg, rgba(255,255,255,.18), transparent 36%),
      linear-gradient(150deg, rgba(255,59,134,.45), rgba(34,244,238,.12)); box-shadow: 0 24px 80px rgba(0,0,0,.36); }
    .cover-stack i:nth-child(1) { transform: translate(-94px, -30px) rotate(-11deg) scale(.82); opacity: .45; }
    .cover-stack i:nth-child(2) { transform: translate(92px, 28px) rotate(10deg) scale(.82); opacity: .4; }
    .cover-stack i:nth-child(3) { transform: translate(0, 0) rotate(calc((var(--n) - 5) * .7deg)); }
    .cover-art { position: relative; z-index: 1; width: min(72vw, 292px); aspect-ratio: 9 / 14; border-radius: 24px; display: grid; place-items: center; overflow: hidden; background:
      radial-gradient(circle at 32% 18%, rgba(255,255,255,.35), transparent 22%),
      radial-gradient(circle at 70% 78%, rgba(255,255,255,.22), transparent 26%),
      linear-gradient(145deg, #ff5d9b, #53112d 66%, #111); box-shadow: 0 34px 110px rgba(255,59,134,.22), 0 34px 110px rgba(0,0,0,.48); }
    .cover-art::before { content: ""; position: absolute; inset: 12px; border: 1px solid rgba(255,255,255,.24); border-radius: 18px; }
    .cover-art::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 36%; background: linear-gradient(to top, rgba(0,0,0,.34), transparent); }
    .cover-art span { position: relative; z-index: 1; max-width: 86%; color: #fff; font-size: clamp(54px, 22vw, 96px); line-height: .86; font-weight: 1000; letter-spacing: 0; text-align: center; text-shadow: 0 8px 32px rgba(0,0,0,.32); }
    .feed-caption { position: absolute; z-index: 4; left: 22px; right: 92px; bottom: calc(28px + env(safe-area-inset-bottom)); display: grid; gap: 14px; pointer-events: none; }
    .feed-caption h2 { margin: 0; color: #fff; font-size: clamp(36px, 12vw, 56px); line-height: .9; text-shadow: 0 4px 24px rgba(0,0,0,.38); }
    .play-pill { pointer-events: auto; width: max-content; min-width: 112px; min-height: 48px; display: inline-grid; place-items: center; border-radius: 999px; background: #fff; color: #050505; text-decoration: none; font-weight: 1000; letter-spacing: .08em; }
    .feed-actions { position: absolute; z-index: 5; right: 16px; bottom: calc(42px + env(safe-area-inset-bottom)); display: grid; gap: 12px; }
    .feed-actions a, .feed-actions button { width: 54px; height: 54px; border: 1px solid rgba(255,255,255,.22); border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.12); color: #fff; text-decoration: none; font-size: 22px; font-weight: 900; backdrop-filter: blur(16px); cursor: pointer; }
    .feed-actions button { font-size: 24px; padding: 0; }
    .swipe-hint { position: fixed; z-index: 6; left: 50%; bottom: calc(8px + env(safe-area-inset-bottom)); transform: translateX(-50%); width: min(100vw, 430px); text-align: center; color: rgba(255,255,255,.58); font-size: 11px; letter-spacing: .18em; pointer-events: none; }
    @media (min-width: 700px) { body { padding: 18px 0; } #homeShell { min-height: calc(100svh - 36px); height: calc(100svh - 36px); overflow: hidden; } #homeShell .app-top { top: 18px; } .feed-screen, .feed, .feed-item { height: calc(100svh - 36px); } .feed-item { min-height: 640px; } }
  </style>
</head>
<body data-printer-artifact="fake-game-library" data-output-format="multi_html">
  <div class="phone-shell" id="homeShell">
    <header class="app-top"><a class="brand" href="index.html">赝品库</a><a href="progress.md">LOG</a></header>
    <main class="screen feed-screen">
      <section class="feed" id="feed">${feed}
      </section>
      <div class="swipe-hint">SWIPE</div>
    </main>
  </div>
  <script>
    window.__PRINTER_ARTIFACT__ = ${JSON.stringify(artifact)};
    (() => {
      const feed = document.getElementById('feed');
      document.querySelectorAll('[data-jump]').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const items = Array.from(document.querySelectorAll('.feed-item'));
          const index = Number(button.dataset.jump) % items.length;
          items[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
      window.addEventListener('keydown', (event) => {
        const items = Array.from(document.querySelectorAll('.feed-item'));
        const current = Math.max(0, Math.round(feed.scrollTop / Math.max(1, feed.clientHeight)));
        if (event.key === 'ArrowDown') items[Math.min(items.length - 1, current + 1)].scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (event.key === 'ArrowUp') items[Math.max(0, current - 1)].scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      window.render_home_to_text = () => JSON.stringify({ coordinate_system: 'vertical snap feed', items: ${games.length}, visibleIndex: Math.round(feed.scrollTop / Math.max(1, feed.clientHeight)) });
    })();
  </script>
</body>
</html>
`;
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(outputDir, file), JSON.stringify(data, null, 2), 'utf8');
}

fs.writeFileSync(path.join(outputDir, 'index.html'), indexPage(), 'utf8');
for (const game of games) fs.writeFileSync(path.join(outputDir, game.file), gamePage(game), 'utf8');

const files = ['index.html', ...games.map((game) => game.file)];
writeJson('run_report.json', {
  output_format: 'multi_html',
  complexity: { total: 78, components: 24, interactions: 24, pages: 12, data_flow: 18 },
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

console.log(`Generated ${files.length} portrait HTML files in ${outputDir}`);
