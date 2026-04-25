#!/usr/bin/env python3
"""Writes the new three-screen index.html to output/index.html"""
import os, pathlib

OUTPUT = pathlib.Path(__file__).parent.parent / "output" / "index.html"

HTML = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="icon" href="data:,">
  <title>HTML 刷刷</title>
  <style>
    :root {
      --accent: #ff3b86;
      --cyan: #22f4ee;
      --violet: #7c5cff;
      --nav-h: 56px;
      --topbar-h: 50px;
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body { margin: 0; background: #040404; color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      overscroll-behavior: none; }
    body { display: grid; place-items: start center; }
    button { font: inherit; border: 0; cursor: pointer; }
    button, a, input, textarea { touch-action: manipulation; }

    /* PHONE SHELL */
    .phone-shell {
      position: relative;
      width: min(100vw, 430px);
      height: 100svh;
      background: #000;
      border-left: 1px solid rgba(255,255,255,.12);
      border-right: 1px solid rgba(255,255,255,.12);
      overflow: hidden;
    }
    @media (min-width: 700px) {
      body { padding: 18px 0; }
      .phone-shell { height: calc(100svh - 36px); border-radius: 22px; box-shadow: 0 30px 100px rgba(0,0,0,.22); }
    }

    /* SCREENS */
    .screen {
      position: absolute;
      inset: 0;
      bottom: calc(var(--nav-h) + env(safe-area-inset-bottom));
      display: flex;
      flex-direction: column;
      opacity: 0;
      pointer-events: none;
      transform: translateY(6px);
      transition: opacity .2s ease, transform .2s ease;
      overflow: hidden;
      background: #000;
    }
    .screen.active { opacity: 1; pointer-events: auto; transform: none; }
    #feedScreen { bottom: 0; }

    /* TOP BAR */
    .app-bar {
      flex: 0 0 var(--topbar-h);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background: rgba(0,0,0,.72);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255,255,255,.08);
      z-index: 5;
    }
    .app-bar-title { font-weight: 900; font-size: 18px; }
    .app-bar-btn {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,.1);
      color: #fff; font-size: 16px;
      display: grid; place-items: center;
    }

    /* BOTTOM NAV */
    .bottom-nav {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: calc(var(--nav-h) + env(safe-area-inset-bottom));
      background: rgba(6,6,8,.94);
      backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255,255,255,.1);
      display: flex;
      align-items: flex-start;
      padding-top: 6px;
      z-index: 20;
    }
    .nav-tab {
      flex: 1;
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      background: transparent;
      color: rgba(255,255,255,.38);
      font-size: 10px; font-weight: 900; letter-spacing: .05em;
      border: 0; padding: 0;
      transition: color .15s;
    }
    .nav-tab.active { color: #fff; }
    .nav-tab .ni { font-size: 22px; line-height: 1.2; }
    .nav-tab.nav-mid .ni {
      width: 48px; height: 28px; border-radius: 9px;
      background: linear-gradient(135deg, var(--accent), var(--violet));
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }

    /* HOME: WATERFALL */
    #homeScreen {
      background: radial-gradient(circle at 50% 0, rgba(255,59,134,.15), transparent 40%), #080808;
    }
    .home-searchbar {
      flex: 0 0 auto;
      margin: 9px 12px 4px;
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,.09);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 999px;
      padding: 9px 14px;
      color: rgba(255,255,255,.38);
      font-size: 13px;
    }
    .waterfall-scroll {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: none;
      padding: 4px 10px 8px;
    }
    .waterfall-scroll::-webkit-scrollbar { display: none; }
    .waterfall { columns: 2; column-gap: 10px; }
    .wf-card {
      break-inside: avoid;
      margin-bottom: 10px;
      border-radius: 14px;
      overflow: hidden;
      cursor: pointer;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.1);
      transition: transform .12s;
    }
    .wf-card:active { transform: scale(.97); }
    .wf-thumb {
      display: flex; align-items: center; justify-content: center;
      font-size: 46px; font-weight: 1000;
      color: rgba(255,255,255,.92);
      text-shadow: 0 4px 20px rgba(0,0,0,.5);
    }
    .wf-thumb.h175 { height: 175px; }
    .wf-thumb.h155 { height: 155px; }
    .wf-thumb.h135 { height: 135px; }
    .wf-thumb.h115 { height: 115px; }
    .wf-body { padding: 9px 11px 11px; }
    .wf-kind {
      display: inline-block;
      font-size: 9px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase;
      border-radius: 999px; padding: 2px 7px;
      background: rgba(255,255,255,.12); color: rgba(255,255,255,.68);
      margin-bottom: 4px;
    }
    .wf-title { margin: 0 0 3px; font-size: 12.5px; font-weight: 850; line-height: 1.25; color: #fff; }
    .wf-summary {
      margin: 0 0 7px; font-size: 10.5px; color: rgba(255,255,255,.48); line-height: 1.35;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .wf-stats {
      display: flex; gap: 10px;
      font-size: 10px; font-weight: 900; color: rgba(255,255,255,.46);
    }

    /* FEED SCREEN: DOUYIN MODE */
    #feedScreen { background: #000; }
    .feed-hud {
      position: absolute; top: 0; left: 0; right: 0;
      z-index: 12;
      height: 52px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 14px;
      background: linear-gradient(to bottom, rgba(0,0,0,.5), transparent);
      pointer-events: none;
    }
    .feed-back {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(0,0,0,.32);
      border: 1px solid rgba(255,255,255,.18);
      backdrop-filter: blur(12px);
      color: #fff; font-size: 22px; font-weight: 900;
      display: grid; place-items: center;
      pointer-events: auto;
    }
    .feed-tabs-hud {
      display: flex; gap: 14px;
      font-size: 13px; font-weight: 1000;
    }
    .feed-tabs-hud span { opacity: .44; }
    .feed-tabs-hud span.on { opacity: 1; }
    .feed-wrap {
      position: absolute; inset: 0;
      bottom: calc(var(--nav-h) + env(safe-area-inset-bottom));
      overflow-y: auto;
      scroll-snap-type: y mandatory;
      scrollbar-width: none;
    }
    .feed-wrap::-webkit-scrollbar { display: none; }
    @media (min-width: 700px) {
      .feed-wrap { bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 36px); }
    }

    /* FEED ITEM */
    .feed-item {
      position: relative;
      height: calc(100svh - var(--nav-h) - env(safe-area-inset-bottom));
      scroll-snap-align: start;
      scroll-snap-stop: always;
      display: flex; flex-direction: column;
      background: #000;
      overflow: hidden;
    }
    @media (min-width: 700px) {
      .feed-item { height: calc(100svh - 36px - var(--nav-h) - env(safe-area-inset-bottom)); }
    }

    /* Game zone */
    .game-zone {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #000;
      min-height: 0;
    }
    .game-zone::before {
      content: "";
      position: absolute; inset: 0; z-index: 0;
      background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--game-accent, #333), transparent 36%), transparent 62%);
      opacity: .5; pointer-events: none;
    }
    .game-zone::after {
      content: "";
      position: absolute; left: 0; right: 0; bottom: 0;
      height: 64px; z-index: 1;
      background: linear-gradient(to bottom, transparent, rgba(0,0,0,.55));
      pointer-events: none;
    }
    .html-frame {
      position: absolute;
      left: 0; top: -60px;
      width: 100%; height: calc(100% + 72px);
      border: 0; background: #000;
      pointer-events: none;
    }
    .feed-item.is-playing .html-frame { pointer-events: auto; }
    .game-veil {
      position: absolute; inset: 0; z-index: 4;
      display: flex; align-items: center; justify-content: center;
      background: transparent; cursor: pointer;
      touch-action: pan-y;
    }
    .feed-item.is-playing .game-veil { display: none; }
    .play-btn {
      width: 62px; height: 62px; border-radius: 50%;
      background: rgba(0,0,0,.34);
      border: 1px solid rgba(255,255,255,.22);
      backdrop-filter: blur(14px);
      display: grid; place-items: center;
      padding-left: 4px;
      font-size: 24px; font-weight: 1000; color: #fff;
      box-shadow: 0 8px 32px rgba(0,0,0,.4);
    }

    /* Info strip (bottom swipe area) */
    .info-strip {
      flex: 0 0 auto;
      background: linear-gradient(to bottom, rgba(0,0,0,.82), rgba(0,0,0,.96));
      border-top: 1px solid rgba(255,255,255,.07);
      padding: 8px 14px 10px;
      display: flex; flex-direction: column; gap: 8px;
      touch-action: pan-y;
    }
    .swipe-pill {
      width: 34px; height: 4px; border-radius: 999px;
      background: rgba(255,255,255,.22);
      margin: 0 auto 2px;
    }
    .strip-row {
      display: flex; align-items: flex-start; gap: 8px;
    }
    .strip-info { flex: 1; min-width: 0; }
    .strip-title {
      margin: 0 0 3px;
      font-size: 14.5px; font-weight: 850; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .strip-summary {
      margin: 0;
      font-size: 11px; color: rgba(255,255,255,.54); line-height: 1.35;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .strip-badge {
      flex: 0 0 auto; align-self: flex-start;
      margin-top: 1px;
      font-size: 9px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase;
      border-radius: 999px; padding: 3px 8px;
      background: rgba(255,255,255,.12); color: rgba(255,255,255,.68);
    }
    .strip-actions {
      display: flex; align-items: center; gap: 7px;
    }
    .strip-social {
      display: flex; gap: 6px; flex: 1;
    }
    .soc-btn {
      flex: 1;
      height: 34px; border-radius: 999px;
      border: 1px solid rgba(255,255,255,.16);
      background: rgba(255,255,255,.09);
      color: rgba(255,255,255,.82);
      font-size: 11px; font-weight: 900;
      display: flex; align-items: center; justify-content: center; gap: 4px;
      transition: transform .1s;
    }
    .soc-btn:active { transform: scale(.95); }
    .feed-item.is-liked [data-like] { background: rgba(255,47,104,.28); border-color: rgba(255,47,104,.4); color: #ff2f68; }
    .feed-item.is-saved [data-save] { background: rgba(255,176,46,.22); border-color: rgba(255,176,46,.4); color: #ffb02e; }
    .play-toggle {
      height: 34px; border-radius: 999px;
      padding: 0 14px;
      background: linear-gradient(135deg, var(--accent, #ff3b86), #ff6aa8);
      color: #fff; font-size: 12px; font-weight: 900;
      display: flex; align-items: center; gap: 5px;
      white-space: nowrap; border: 0;
    }
    .feed-item.is-playing .play-toggle {
      background: rgba(255,255,255,.12);
      border: 1px solid rgba(255,255,255,.18);
    }
    .swipe-hint {
      text-align: center;
      font-size: 10px; color: rgba(255,255,255,.28); font-weight: 900;
      letter-spacing: .06em;
    }

    /* PROFILE SCREEN */
    #profileScreen {
      background: radial-gradient(circle at 50% 0, rgba(124,92,255,.15), transparent 36%), #080808;
    }
    .profile-scroll { flex: 1; overflow-y: auto; scrollbar-width: none; }
    .profile-scroll::-webkit-scrollbar { display: none; }
    .profile-hero {
      padding: 24px 20px 16px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .p-avatar {
      width: 78px; height: 78px; border-radius: 50%;
      background: linear-gradient(145deg, var(--violet), var(--accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 34px;
      border: 3px solid rgba(255,255,255,.16);
      box-shadow: 0 12px 40px rgba(0,0,0,.3);
    }
    .p-name { font-size: 17px; font-weight: 900; }
    .p-handle { font-size: 12px; color: rgba(255,255,255,.38); }
    .p-stats {
      display: flex; width: 100%;
      border-top: 1px solid rgba(255,255,255,.09);
      border-bottom: 1px solid rgba(255,255,255,.09);
    }
    .p-stat {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 14px 0;
      border-right: 1px solid rgba(255,255,255,.09);
    }
    .p-stat:last-child { border-right: 0; }
    .p-stat-n { font-size: 20px; font-weight: 900; }
    .p-stat-l { font-size: 11px; color: rgba(255,255,255,.4); font-weight: 900; }
    .p-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,.09); }
    .p-tab {
      flex: 1; height: 40px;
      background: transparent; border: 0;
      border-bottom: 2px solid transparent;
      color: rgba(255,255,255,.42);
      font-size: 13px; font-weight: 900;
      transition: color .15s, border-color .15s;
    }
    .p-tab.active { color: #fff; border-bottom-color: var(--accent); }
    .p-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; padding: 2px; }
    .p-cell {
      aspect-ratio: 1;
      position: relative; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      font-size: 38px; font-weight: 1000;
      cursor: pointer;
    }
    .p-cell-label {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 18px 8px 7px;
      background: linear-gradient(to bottom, transparent, rgba(0,0,0,.78));
      font-size: 11px; font-weight: 850; color: rgba(255,255,255,.9);
    }
    .empty-state {
      grid-column: 1 / -1;
      padding: 48px 20px;
      text-align: center; color: rgba(255,255,255,.3);
      font-size: 13px; line-height: 1.6;
    }
    .empty-state big { display: block; font-size: 44px; margin-bottom: 10px; }

    /* REMIX MODAL */
    .remix-modal { position: fixed; inset: 0; z-index: 40; display: none; place-items: end center; background: rgba(0,0,0,.56); color: #fff; }
    .remix-modal.is-visible { display: grid; }
    .remix-panel { width: min(100vw, 430px); max-height: 92svh; overflow-y: auto; border: 1px solid rgba(255,255,255,.16); border-radius: 22px 22px 0 0; padding: 14px; background: rgba(8,8,10,.94); box-shadow: 0 -24px 90px rgba(0,0,0,.54); backdrop-filter: blur(20px); display: grid; gap: 12px; }
    .remix-head { display: flex; justify-content: space-between; gap: 10px; align-items: start; }
    .remix-head h2 { margin: 0; font-size: 22px; line-height: 1; }
    .remix-close { width: 36px; height: 36px; border: 1px solid rgba(255,255,255,.18); border-radius: 50%; background: rgba(255,255,255,.08); color: #fff; font-size: 18px; font-weight: 1000; }
    .remix-field { display: grid; gap: 7px; color: rgba(255,255,255,.86); font-size: 12px; font-weight: 900; }
    .remix-input, .remix-textarea { width: 100%; border: 1px solid rgba(255,255,255,.18); border-radius: 14px; padding: 11px 12px; background: rgba(255,255,255,.08); color: #fff; font: inherit; outline: none; }
    .remix-textarea { min-height: 96px; resize: vertical; line-height: 1.42; }
    .remix-textarea.description { min-height: 168px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
    .remix-actions-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .remix-actions-row.three { grid-template-columns: 1fr 1fr 1fr; }
    .remix-secondary { min-height: 46px; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 0 12px; background: rgba(255,255,255,.08); color: #fff; font-weight: 1000; }
    .remix-preview { width: 100%; height: 380px; border: 1px solid rgba(255,255,255,.16); border-radius: 18px; background: #050505; display: none; }
    .remix-preview.is-visible { display: block; }
    .remix-status { min-height: 18px; margin: 0; color: rgba(255,255,255,.68); font-size: 12px; line-height: 1.35; }
    .kicker { margin: 0; color: var(--cyan); font-size: 11px; font-weight: 1000; letter-spacing: .12em; text-transform: uppercase; }
    .primary { min-height: 54px; border: 0; border-radius: 999px; padding: 0 18px; background: linear-gradient(135deg, var(--accent), #ff6aa8); color: #fff; font-weight: 1000; cursor: pointer; box-shadow: 0 12px 30px rgba(255,59,134,.28); }
    .primary:disabled { opacity: .42; cursor: not-allowed; box-shadow: none; }
  </style>
</head>
<body>
<div class="phone-shell" id="appShell">

  <!-- HOME SCREEN -->
  <div class="screen active" id="homeScreen">
    <header class="app-bar">
      <span class="app-bar-title">HTML<span style="color:var(--accent)">刷刷</span></span>
      <button class="app-bar-btn" aria-label="搜索">🔍</button>
    </header>
    <div class="home-searchbar">
      <span style="font-size:14px">🔍</span>
      <span>搜索游戏、玩法...</span>
    </div>
    <div class="waterfall-scroll">
      <div class="waterfall" id="waterfall"></div>
    </div>
  </div>

  <!-- FEED SCREEN -->
  <div class="screen" id="feedScreen">
    <div class="feed-hud">
      <button class="feed-back" id="feedBack" aria-label="返回">&#8249;</button>
      <div class="feed-tabs-hud">
        <span class="on">FOR YOU</span>
        <span>REMIX</span>
      </div>
      <div style="width:36px"></div>
    </div>
    <div class="feed-wrap" id="feedWrap"></div>
  </div>

  <!-- PROFILE SCREEN -->
  <div class="screen" id="profileScreen">
    <header class="app-bar">
      <span class="app-bar-title">我的</span>
      <button class="app-bar-btn" aria-label="设置">&#9881;&#65039;</button>
    </header>
    <div class="profile-scroll">
      <div class="profile-hero">
        <div class="p-avatar">&#127918;</div>
        <div class="p-name">玩家 0001</div>
        <div class="p-handle">@htmlssss &middot; HTML刷刷</div>
      </div>
      <div class="p-stats">
        <div class="p-stat"><span class="p-stat-n" id="statPlayed">0</span><span class="p-stat-l">已玩</span></div>
        <div class="p-stat"><span class="p-stat-n" id="statLiked">0</span><span class="p-stat-l">点赞</span></div>
        <div class="p-stat"><span class="p-stat-n" id="statSaved">0</span><span class="p-stat-l">收藏</span></div>
      </div>
      <div class="p-tabs">
        <button class="p-tab active" data-ptab="saved">收藏</button>
        <button class="p-tab" data-ptab="history">历史</button>
      </div>
      <div id="savedGrid" class="p-grid"></div>
      <div id="historyGrid" class="p-grid" style="display:none"></div>
    </div>
  </div>

  <!-- BOTTOM NAV -->
  <nav class="bottom-nav" id="bottomNav">
    <button class="nav-tab active" data-nav="home">
      <span class="ni">&#127968;</span><span>首页</span>
    </button>
    <button class="nav-tab nav-mid" data-nav="feed">
      <span class="ni">&#9654;</span><span>刷刷</span>
    </button>
    <button class="nav-tab" data-nav="profile">
      <span class="ni">&#128100;</span><span>我的</span>
    </button>
  </nav>
</div>

<!-- REMIX MODAL -->
<section class="remix-modal" id="remixModal" aria-hidden="true">
  <div class="remix-panel" role="dialog" aria-modal="true" aria-labelledby="remixTitle">
    <header class="remix-head">
      <div>
        <p class="kicker">REMIX HARNESS</p>
        <h2 id="remixTitle">Remix</h2>
      </div>
      <button class="remix-close" type="button" id="remixClose" aria-label="关闭">&#215;</button>
    </header>
    <label class="remix-field">文本 prompt<textarea class="remix-textarea" id="remixPrompt" placeholder="把这个游戏改成霓虹排队版，增加连击、倒计时和截图结果卡。"></textarea></label>
    <label class="remix-field">语音转录<textarea class="remix-textarea" id="remixTranscript" placeholder="录音或上传音频后，服务端转录会出现在这里，可编辑。"></textarea></label>
    <div class="remix-actions-row three">
      <button class="remix-secondary" type="button" id="recordStart">录音</button>
      <button class="remix-secondary" type="button" id="recordStop" disabled>停止</button>
      <label class="remix-secondary" style="display:grid;place-items:center;cursor:pointer;">上传<input id="audioUpload" type="file" accept="audio/*" hidden></label>
    </div>
    <button class="primary" type="button" id="draftBtn">生成草稿</button>
    <iframe class="remix-preview" id="draftPreview" title="Remix 草稿预览"></iframe>
    <label class="remix-field">发布标题<input class="remix-input" id="publishTitle"></label>
    <label class="remix-field">文件 slug<input class="remix-input" id="publishSlug" placeholder="lowercase-dash-slug"></label>
    <label class="remix-field">Agent description<textarea class="remix-textarea description" id="agentDescription"></textarea></label>
    <div class="remix-actions-row">
      <button class="remix-secondary" type="button" id="deleteDraftBtn">丢弃草稿</button>
      <button class="primary" type="button" id="publishBtn" disabled>发布到 output</button>
    </div>
    <p class="remix-status" id="remixStatus">启动 tools/remix_harness_server.py 后可用真实生成。</p>
  </div>
</section>

<script src="remix_manifest.js"></script>
<script>
  window.__PRINTER_ARTIFACT__ = {"generator":"printer/tools/generate_fake_library.mjs","pipeline":"WebPrinterPipeline-compatible deterministic fake-game generator","output_format":"multi_html","intent":"建立移动端竖屏赝品库：按热门小游戏机制生成离线 HTML，保留交互、节奏和传播点，不复制原站代码或素材。","generated_at":"2026-04-25T04:52:59.729Z","intent_plan":{"summary":"基于游戏参考意图生成移动端竖屏多页面 HTML 赝品库","ui_requirements":["所有游戏优先适配手机竖屏，桌面端居中显示手机 shell","动作和实时反馈类游戏使用 canvas playfield","每个产物必须自包含、无外链、可双击打开"],"technical_requirements":["每个游戏暴露 window.render_game_to_text()","每个游戏暴露 window.advanceTime(ms)","输出 run_report.json 模拟 WebPrinterPipeline 的执行摘要"],"complexity_bias":18,"output_hint":"multi_html","confidence":0.82,"requires_interactivity":true,"interaction_features":["触摸操作","Canvas 游戏循环","本地状态管理","移动端竖屏布局"]},"complexity":{"total":78,"components":24,"interactions":26,"pages":17,"data_flow":20}};
  (() => {
    const BASE = [
      {id:"sbti-fake",              file:"sbti-fake.html",             title:"伪 SBTI 崩溃人格测评",  kind:"测评",   summary:"八题生成荒诞人格结果卡，适合截图分享。",                   accent:"#ff4f87",glyph:"SBTI",likes:1200,saves:240},
      {id:"sheep-stack",            file:"sheep-stack.html",           title:"羊块堆堆消",             kind:"消除",   summary:"只点亮牌，三张同图标入槽即消，槽满失败。",                accent:"#30b36b",glyph:"羊",  likes:1337,saves:271},
      {id:"brainrot-clicker",       file:"brainrot-clicker.html",      title:"脑腐咔嗒工厂",          kind:"点击",   summary:"点出伪意大利动物，升级后 canvas 弹幕越来越吵。",          accent:"#f1b900",glyph:"脑",  likes:1474,saves:302},
      {id:"stimulation-fake",       file:"stimulation-fake.html",      title:"刺激值按钮",            kind:"点击",   summary:"每个升级都让手机屏幕更像失控的信息流。",                  accent:"#7c5cff",glyph:"刺",  likes:1611,saves:333},
      {id:"cattle-bump",            file:"cattle-bump.html",           title:"疯羊碰碰场",            kind:"动作",   summary:"触摸方向推动主羊，撞飞编号羊，留在圆圈里。",              accent:"#ff7a2f",glyph:"撞",  likes:1748,saves:364},
      {id:"password-hell",          file:"password-hell.html",         title:"密码地狱试炼",          kind:"解谜",   summary:"移动端输入框挑战，规则一条比一条难受。",                  accent:"#00a6d6",glyph:"密",  likes:1885,saves:395},
      {id:"infinite-craft-fake",    file:"infinite-craft-fake.html",   title:"无限乱炖实验室",        kind:"合成",   summary:"两个词一碰，互联网又多一个概念。",                        accent:"#34a853",glyph:"合",  likes:2022,saves:426},
      {id:"million-checkboxes-fake",file:"million-checkboxes-fake.html",title:"四百个勾选框",         kind:"协作幻觉",summary:"假装全网在线，其实是本地小宇宙。",                      accent:"#111",   glyph:"☑",  likes:2159,saves:457},
      {id:"dino-fake",              file:"dino-fake.html",             title:"断网小蜥蜴",            kind:"跑酷",   summary:"点击跳跃，越过会议、需求和锅。",                          accent:"#5f6368",glyph:"跑",  likes:2296,saves:488},
      {id:"garden-idle",            file:"garden-idle.html",           title:"摸鱼花园",              kind:"放置",   summary:"种、等、收，库存刷新让你再来一次。",                      accent:"#6aa84f",glyph:"种",  likes:2433,saves:519},
      {id:"agar-fake",              file:"agar-fake.html",             title:"圆点吞吞.io",           kind:".io",    summary:"拖动移动，吃小点长大，别被大圆点吃掉。",                  accent:"#4285f4",glyph:"io",  likes:2570,saves:550},
      {id:"io-arena-template",      file:"io-arena-template.html",     title:"空投乱斗.io 模板",      kind:"模板",   summary:"双摇杆、空投武器、bot、假排行榜和换皮入口。",             accent:"#22f4ee",glyph:"战",  likes:2707,saves:581},
      {id:"mystic-score",           file:"mystic-score.html",          title:"赛博玄学评分器",        kind:"玄学",   summary:"输入名字，生成今日抽象运势卡。",                          accent:"#9b59b6",glyph:"玄",  likes:2844,saves:612},
      {id:"tarot-daily",            file:"tarot-daily.html",           title:"打工塔罗三连",          kind:"塔罗",   summary:"输入代号抽三张赛博塔罗，给出今日抽象建议。",              accent:"#c45cff",glyph:"塔",  likes:2981,saves:643},
      {id:"bazi-lite",              file:"bazi-lite.html",             title:"八字偏科生成器",        kind:"算命",   summary:"生日时辰生成假认真四柱，重点看五行哪里离谱。",            accent:"#e4a63b",glyph:"命",  likes:3118,saves:674},
      {id:"astro-wheel",            file:"astro-wheel.html",           title:"星盘甩锅轮",            kind:"看盘",   summary:"一键画出可分享星盘，把今天的问题甩给相位。",              accent:"#5bbcff",glyph:"星",  likes:3255,saves:705},
      {id:"yijing-coins",           file:"yijing-coins.html",          title:"六爻离谱铜钱",          kind:"易经",   summary:"点六次摇铜钱，得到一卦适合转发的离谱签文。",              accent:"#d6b45f",glyph:"卦",  likes:3392,saves:736},
    ];
    const REMIX_TWISTS = [
      {label:"夜市版",glyph:"夜",accent:"#00c2ff",summary:"把节奏压进霓虹夜场，反馈更密、奖励更亮。",        prompt:"霓虹夜市、快反馈、强分享截图"},
      {label:"地铁版",glyph:"站",accent:"#ffcf33",summary:"改成单手通勤节奏，十秒内给出一次明确变化。",      prompt:"地铁通勤、单手操作、十秒循环"},
      {label:"反转版",glyph:"反",accent:"#ff5a3d",summary:"保留核心玩法，但把目标和失败条件倒过来。",        prompt:"目标反转、失败变奖励、规则逐步变形"},
      {label:"抽卡版",glyph:"抽",accent:"#9b7cff",summary:"每次操作都掉落一个新词条，适合继续二创。",        prompt:"词条掉落、稀有度、可截图收集"},
      {label:"双人版",glyph:"双",accent:"#31d07f",summary:"把单人循环变成互相干扰的同屏挑战。",              prompt:"双人同屏、轻对抗、短局结算"},
    ];
    const THUMB_H = ["h175","h115","h155","h115","h135"];

    const publishedRemixes = (window.__PRINTER_REMIX_MANIFEST__ && Array.isArray(window.__PRINTER_REMIX_MANIFEST__.remixes))
      ? window.__PRINTER_REMIX_MANIFEST__.remixes : [];

    function itemFromManifest(entry, offset) {
      return {
        id: entry.slug || entry.id || ('remix-'+offset),
        instanceId: (entry.slug||entry.id||('remix-'+offset))+'-published-0',
        file: entry.file,
        title: entry.title || entry.slug || 'Remix',
        sourceTitle: entry.title || entry.slug || 'Remix',
        kind: entry.kind || 'Remix',
        summary: entry.summary || (entry.agent_description&&entry.agent_description.one_liner) || '本地发布的 Remix。',
        accent: entry.accent || '#22f4ee',
        glyph: entry.glyph || '改',
        likes: 400+offset*37, saves: 120+offset*17,
        remixed: true, loop: 0,
        remixPrompt: entry.prompt&&entry.prompt.text ? entry.prompt.text : '',
      };
    }

    let feedItems = BASE.map((b,i) => ({...b, instanceId:b.id+'-0', baseIndex:i, loop:0, remixed:false, sourceTitle:b.title}));
    const manifestItems = publishedRemixes.map(itemFromManifest).filter(x=>x.file);
    manifestItems.forEach((x,i) => { x.baseIndex=feedItems.length; feedItems.push(x); });

    let nextAppend = feedItems.length;
    let remixCount = 0, activeIndex = 0, scrollFrame = 0;
    let harnessAvailable = false;
    let mediaRecorder = null, recordedChunks = [];
    let currentDraft = null, currentRemixArticle = null;
    let currentScreen = 'home';
    const playedSet = new Set();
    const social = new Map(feedItems.map(it=>[it.instanceId, {liked:false,saved:false,likes:it.likes,saves:it.saves}]));

    const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const fmt = v => v>=10000?(v/10000).toFixed(1)+'w':v>=1000?(v/1000).toFixed(1)+'k':String(v);
    function ensureSocial(item) {
      if (!social.has(item.instanceId)) social.set(item.instanceId,{liked:false,saved:false,likes:item.likes||0,saves:item.saves||0});
    }

    /* SCREEN NAV */
    const screens = {home:document.getElementById('homeScreen'),feed:document.getElementById('feedScreen'),profile:document.getElementById('profileScreen')};
    const navTabs = document.querySelectorAll('.nav-tab');

    function goTo(name) {
      if (currentScreen===name) return;
      currentScreen=name;
      Object.entries(screens).forEach(([k,el])=>el.classList.toggle('active',k===name));
      navTabs.forEach(t=>t.classList.toggle('active',t.dataset.nav===name));
      if (name==='profile') refreshProfile();
    }
    navTabs.forEach(t=>t.addEventListener('click',()=>goTo(t.dataset.nav)));
    document.getElementById('feedBack').addEventListener('click',()=>goTo('home'));

    /* WATERFALL */
    const waterfall = document.getElementById('waterfall');
    function wfHtml(item,idx) {
      const hc = THUMB_H[idx%THUMB_H.length];
      const bg = 'background:linear-gradient(145deg,color-mix(in srgb,'+esc(item.accent)+',#050505 42%),color-mix(in srgb,'+esc(item.accent)+',#0a0a0a 68%));';
      const s = social.get(item.instanceId)||{likes:item.likes,saves:item.saves};
      return '<div class="wf-card" data-wfidx="'+idx+'"><div class="wf-thumb '+hc+'" style="'+bg+'">'+esc(item.glyph)+'</div><div class="wf-body"><span class="wf-kind">'+esc(item.kind)+'</span><p class="wf-title">'+esc(item.title)+'</p><p class="wf-summary">'+esc(item.summary)+'</p><div class="wf-stats"><span>&#9825; '+fmt(s.likes)+'</span><span>&#9734; '+fmt(s.saves)+'</span></div></div></div>';
    }
    waterfall.innerHTML = feedItems.slice(0,BASE.length).map((it,i)=>wfHtml(it,i)).join('');
    waterfall.addEventListener('click',e=>{
      const card = e.target.closest('[data-wfidx]');
      if (card) openFeedAt(parseInt(card.dataset.wfidx,10));
    });

    /* FEED RENDERING */
    const feedWrap = document.getElementById('feedWrap');
    function feedHtml(item,index) {
      const eager = index<2||item.remixed;
      ensureSocial(item);
      const s = social.get(item.instanceId);
      const bg = 'background:linear-gradient(165deg,color-mix(in srgb,'+esc(item.accent)+',#050505 38%),color-mix(in srgb,'+esc(item.accent)+',#000 72%));';
      return '<article class="feed-item'+(s.liked?' is-liked':'')+(s.saved?' is-saved':'')+'" style="--game-accent:'+esc(item.accent)+';" data-iid="'+esc(item.instanceId)+'" data-fidx="'+index+'"><div class="game-zone" style="'+bg+'"><iframe class="html-frame" src="'+(eager?esc(item.file):'about:blank')+'" data-src="'+esc(item.file)+'" data-loaded="'+eager+'" title="'+esc(item.title)+'" loading="lazy" sandbox="allow-scripts allow-forms"></iframe><div class="game-veil" data-unlock><div class="play-btn">&#9654;</div></div></div><div class="info-strip"><div class="swipe-pill"></div><div class="strip-row"><div class="strip-info"><h3 class="strip-title">'+esc(item.title)+'</h3><p class="strip-summary">'+esc(item.summary)+'</p></div><span class="strip-badge">'+esc(item.kind)+'</span></div><div class="strip-actions"><div class="strip-social"><button class="soc-btn" data-like>'+( s.liked?'&#9829;':'&#9825;')+' <span>'+fmt(s.likes)+'</span></button><button class="soc-btn" data-save>'+(s.saved?'&#9733;':'&#9734;')+' <span>'+fmt(s.saves)+'</span></button><button class="soc-btn" data-remix>&#8635;</button></div><button class="play-toggle" data-play-toggle>&#9654; 开玩</button></div><p class="swipe-hint">&#x2015; 上划换下一个</p></div></article>';
    }
    function renderFeed() { feedWrap.innerHTML = feedItems.map((it,i)=>feedHtml(it,i)).join(''); }
    renderFeed();

    /* OPEN FEED AT INDEX */
    function openFeedAt(idx) {
      goTo('feed');
      requestAnimationFrame(()=>{
        const items = feedWrap.querySelectorAll('.feed-item');
        if (items[idx]) { feedWrap.scrollTop = items[idx].offsetTop; loadAround(idx); updateActive(); }
      });
    }

    /* FRAME LOADING */
    function loadFrame(article) {
      const f = article&&article.querySelector('.html-frame');
      if (!f||f.dataset.loaded==='true') return;
      f.src = f.dataset.src; f.dataset.loaded='true';
    }
    function loadAround(idx) {
      const items=Array.from(feedWrap.querySelectorAll('.feed-item'));
      for (let i=Math.max(0,idx-1);i<=Math.min(items.length-1,idx+1);i++) loadFrame(items[i]);
    }

    /* ACTIVE TRACKING */
    function currentFeedIdx() {
      const items=Array.from(feedWrap.querySelectorAll('.feed-item'));
      const mid=feedWrap.scrollTop+feedWrap.clientHeight/2;
      let best=0,bestD=Infinity;
      items.forEach((el,i)=>{const d=Math.abs(el.offsetTop+el.offsetHeight/2-mid);if(d<bestD){bestD=d;best=i;}});
      return best;
    }
    function updateActive() {
      activeIndex=currentFeedIdx();
      feedWrap.querySelectorAll('.feed-item').forEach((el,i)=>el.classList.toggle('is-active',i===activeIndex));
      loadAround(activeIndex); ensureTail();
    }
    feedWrap.addEventListener('scroll',()=>{
      if (scrollFrame) return;
      scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;updateActive();});
    },{passive:true});

    /* INFINITE LOOP */
    function loopItem(pos) {
      const base=BASE[pos%BASE.length]; const loop=Math.floor(pos/BASE.length);
      return {...base,instanceId:base.id+'-loop-'+loop,loop,sourceTitle:base.title,remixed:false,
              summary:loop>0?base.summary+' 第'+(loop+1)+'次刷到。':base.summary};
    }
    function appendMore(count=6) {
      const html=[];
      for (let i=0;i<count;i++) {
        const item=loopItem(nextAppend++); ensureSocial(item); feedItems.push(item);
        html.push(feedHtml(item,feedItems.length-1));
      }
      feedWrap.insertAdjacentHTML('beforeend',html.join(''));
    }
    function ensureTail() { if (feedItems.length-activeIndex<5) appendMore(); }

    /* FEED EVENTS */
    function syncSocial(article) {
      const s=social.get(article.dataset.iid); if (!s) return;
      article.classList.toggle('is-liked',s.liked);
      article.classList.toggle('is-saved',s.saved);
      const lb=article.querySelector('[data-like]');
      const sb=article.querySelector('[data-save]');
      if (lb) lb.innerHTML=(s.liked?'&#9829;':'&#9825;')+' <span>'+fmt(s.likes)+'</span>';
      if (sb) sb.innerHTML=(s.saved?'&#9733;':'&#9734;')+' <span>'+fmt(s.saves)+'</span>';
    }

    function insertRemixItem(article) {
      const fidx=parseInt(article.dataset.fidx,10);
      const source=feedItems[fidx]||feedItems[activeIndex]||BASE[0];
      const twist=REMIX_TWISTS[remixCount%REMIX_TWISTS.length]; remixCount++;
      const remix={...source,
        id:source.id+'-remix-'+remixCount,instanceId:source.id+'-remix-'+remixCount,
        title:(source.sourceTitle||source.title).replace(/ · .*/,'')+' · '+twist.label,
        sourceTitle:source.sourceTitle||source.title,
        kind:'Remix',summary:twist.summary,accent:twist.accent,glyph:twist.glyph,
        remixed:true,remixPrompt:'改造：'+twist.prompt,loop:0,
        likes:Math.max(1,Math.floor((source.likes||100)*.42)),
        saves:Math.max(1,Math.floor((source.saves||50)*.48)),
      };
      ensureSocial(remix);
      feedItems.splice(fidx+1,0,remix);
      article.insertAdjacentHTML('afterend',feedHtml(remix,fidx+1));
      const inserted=article.nextElementSibling;
      requestAnimationFrame(()=>{inserted.scrollIntoView({behavior:'smooth',block:'start'});loadFrame(inserted);updateActive();});
    }

    feedWrap.addEventListener('click',e=>{
      const btn=e.target.closest('[data-like],[data-save],[data-remix],[data-unlock],[data-play-toggle]');
      if (!btn) return;
      e.preventDefault(); e.stopPropagation();
      const article=btn.closest('.feed-item');
      const iid=article&&article.dataset.iid;
      if (btn.matches('[data-like],[data-save]')) {
        const s=social.get(iid); if (!s) return;
        if (btn.matches('[data-like]')) { s.liked=!s.liked; s.likes+=s.liked?1:-1; }
        else { s.saved=!s.saved; s.saves+=s.saved?1:-1; }
        syncSocial(article);
      } else if (btn.matches('[data-remix]')) {
        if (harnessAvailable) openRemixPanel(article); else insertRemixItem(article);
      } else if (btn.matches('[data-unlock]')) {
        loadFrame(article); article.classList.add('is-playing');
        const tog=article.querySelector('[data-play-toggle]'); if(tog) tog.innerHTML='&#10005; 退出';
        playedSet.add(iid);
      } else if (btn.matches('[data-play-toggle]')) {
        if (article.classList.contains('is-playing')) {
          article.classList.remove('is-playing');
          const tog=article.querySelector('[data-play-toggle]'); if(tog) tog.innerHTML='&#9654; 开玩';
        } else {
          loadFrame(article); article.classList.add('is-playing');
          const tog=article.querySelector('[data-play-toggle]'); if(tog) tog.innerHTML='&#10005; 退出';
          playedSet.add(iid);
        }
      }
    });

    window.addEventListener('keydown',e=>{
      if (currentScreen!=='feed') return;
      const items=Array.from(feedWrap.querySelectorAll('.feed-item')); const cur=currentFeedIdx();
      if (e.key==='ArrowDown'){ensureTail();items[Math.min(items.length-1,cur+1)].scrollIntoView({behavior:'smooth',block:'start'});}
      if (e.key==='ArrowUp') items[Math.max(0,cur-1)].scrollIntoView({behavior:'smooth',block:'start'});
      if (e.key.toLowerCase()==='r'){const a=items[cur];if(harnessAvailable)openRemixPanel(a);else insertRemixItem(a);}
    });
    updateActive();

    /* PROFILE */
    const savedGrid=document.getElementById('savedGrid');
    const historyGrid=document.getElementById('historyGrid');
    function refreshProfile() {
      let liked=0,saved=0;
      social.forEach(s=>{if(s.liked)liked++;if(s.saved)saved++;});
      document.getElementById('statPlayed').textContent=playedSet.size;
      document.getElementById('statLiked').textContent=liked;
      document.getElementById('statSaved').textContent=saved;
      const savedItems=feedItems.filter(it=>{const s=social.get(it.instanceId);return s&&s.saved;});
      if (savedItems.length) {
        savedGrid.innerHTML=savedItems.map(it=>{
          const bg='background:linear-gradient(145deg,color-mix(in srgb,'+esc(it.accent)+',#050505 42%),color-mix(in srgb,'+esc(it.accent)+',#0a0a0a 68%));';
          return '<div class="p-cell" style="'+bg+'" data-open-game="'+esc(it.id)+'">'+esc(it.glyph)+'<div class="p-cell-label">'+esc(it.title)+'</div></div>';
        }).join('');
      } else {
        savedGrid.innerHTML='<div class="empty-state"><big>&#9734;</big>还没有收藏任何游戏<br>在刷刷页面点击 &#9734; 收藏</div>';
      }
      const histItems=feedItems.filter(it=>playedSet.has(it.instanceId));
      if (histItems.length) {
        historyGrid.innerHTML=histItems.map(it=>{
          const bg='background:linear-gradient(145deg,color-mix(in srgb,'+esc(it.accent)+',#050505 42%),color-mix(in srgb,'+esc(it.accent)+',#0a0a0a 68%));';
          return '<div class="p-cell" style="'+bg+'" data-open-game="'+esc(it.id)+'">'+esc(it.glyph)+'<div class="p-cell-label">'+esc(it.title)+'</div></div>';
        }).join('');
      } else {
        historyGrid.innerHTML='<div class="empty-state"><big>&#127918;</big>还没有玩过游戏<br>去刷刷页面开始体验</div>';
      }
    }
    document.querySelectorAll('.p-tab').forEach(tab=>{
      tab.addEventListener('click',()=>{
        document.querySelectorAll('.p-tab').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        const w=tab.dataset.ptab;
        savedGrid.style.display=w==='saved'?'grid':'none';
        historyGrid.style.display=w==='history'?'grid':'none';
      });
    });
    document.getElementById('profileScreen').addEventListener('click',e=>{
      const cell=e.target.closest('[data-open-game]');
      if (!cell) return;
      const idx=feedItems.findIndex(it=>it.id===cell.dataset.openGame);
      if (idx>=0) openFeedAt(idx);
    });

    /* REMIX MODAL */
    const remixModal=document.getElementById('remixModal');
    const remixTitle=document.getElementById('remixTitle');
    const remixPrompt=document.getElementById('remixPrompt');
    const remixTranscript=document.getElementById('remixTranscript');
    const remixStatus=document.getElementById('remixStatus');
    const draftPreview=document.getElementById('draftPreview');
    const publishTitle=document.getElementById('publishTitle');
    const publishSlug=document.getElementById('publishSlug');
    const agentDescription=document.getElementById('agentDescription');
    const publishBtn=document.getElementById('publishBtn');
    const draftBtn=document.getElementById('draftBtn');
    const deleteDraftBtn=document.getElementById('deleteDraftBtn');
    const recordStart=document.getElementById('recordStart');
    const recordStop=document.getElementById('recordStop');
    const audioUpload=document.getElementById('audioUpload');
    const remixClose=document.getElementById('remixClose');

    function localSlug(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'remix';}
    function setRemixStatus(t){if(remixStatus)remixStatus.textContent=t;}
    function openRemixPanel(article) {
      const fidx=parseInt(article.dataset.fidx,10);
      const item=feedItems[fidx]||{file:article.querySelector('iframe')?.dataset.src,title:article.querySelector('.strip-title')?.textContent||'Remix'};
      currentRemixArticle=article; currentDraft=null;
      remixTitle.textContent='Remix '+item.title;
      remixPrompt.value=''; remixTranscript.value=''; publishTitle.value='';
      publishSlug.value=localSlug((item.id||item.title||'remix')+'-remix');
      agentDescription.value=''; draftPreview.removeAttribute('src');
      draftPreview.classList.remove('is-visible'); publishBtn.disabled=true;
      remixModal.classList.add('is-visible'); remixModal.setAttribute('aria-hidden','false');
      setRemixStatus(harnessAvailable?'输入 prompt 或上传语音，然后生成草稿。':'Harness 服务未连接，当前会回退成本地假 Remix。');
    }
    function closeRemixPanel(){remixModal.classList.remove('is-visible');remixModal.setAttribute('aria-hidden','true');}

    async function transcribeBlob(blob,filename) {
      const form=new FormData(); form.append('file',blob,filename||'voice.webm');
      setRemixStatus('正在服务端转录音频...');
      const res=await fetch('/api/remix/transcribe',{method:'POST',body:form});
      if (!res.ok) throw new Error(await res.text());
      const data=await res.json(); remixTranscript.value=data.transcript||'';
      setRemixStatus('转录完成，可继续编辑。');
    }
    async function createHarnessDraft() {
      if (!currentRemixArticle) return;
      const fidx=parseInt(currentRemixArticle.dataset.fidx,10);
      const item=feedItems[fidx]||{file:currentRemixArticle.querySelector('iframe')?.dataset.src};
      draftBtn.disabled=true; publishBtn.disabled=true;
      setRemixStatus('正在生成草稿...');
      try {
        const res=await fetch('/api/remix/draft',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({source_file:item.file,prompt_text:remixPrompt.value,voice_transcript:remixTranscript.value})});
        if (!res.ok) throw new Error(await res.text());
        currentDraft=await res.json();
        draftPreview.src=currentDraft.preview_url; draftPreview.classList.add('is-visible');
        publishTitle.value=currentDraft.title||item.title+' Remix';
        publishSlug.value=currentDraft.slug_suggestion||localSlug(publishTitle.value);
        agentDescription.value=JSON.stringify(currentDraft.agent_description||{},null,2);
        publishBtn.disabled=false; setRemixStatus('草稿已生成，检查预览后可以发布。');
      } catch(err){setRemixStatus('生成失败：'+(err&&err.message?err.message:err));}
      finally{draftBtn.disabled=false;}
    }
    async function publishHarnessDraft() {
      if (!currentDraft||!currentRemixArticle) return;
      publishBtn.disabled=true; setRemixStatus('正在发布到 output...');
      try {
        let desc={};
        try{desc=JSON.parse(agentDescription.value||'{}');}catch(e){throw new Error('Agent description 不是合法 JSON');}
        const res=await fetch('/api/remix/publish',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({draft_id:currentDraft.draft_id,slug:publishSlug.value,title:publishTitle.value,agent_description:desc})});
        if (!res.ok) throw new Error(await res.text());
        const result=await res.json();
        const newItem=itemFromManifest(result.manifest_entry||{},feedItems.length); ensureSocial(newItem);
        const fidx=parseInt(currentRemixArticle.dataset.fidx,10);
        feedItems.splice(fidx+1,0,newItem);
        currentRemixArticle.insertAdjacentHTML('afterend',feedHtml(newItem,fidx+1));
        const inserted=currentRemixArticle.nextElementSibling;
        requestAnimationFrame(()=>{inserted.scrollIntoView({behavior:'smooth',block:'start'});loadFrame(inserted);updateActive();});
        setRemixStatus('已发布：'+result.file); currentDraft=null;
      } catch(err){publishBtn.disabled=false;setRemixStatus('发布失败：'+(err&&err.message?err.message:err));}
    }
    async function deleteHarnessDraft() {
      if (!currentDraft){closeRemixPanel();return;}
      const id=currentDraft.draft_id; currentDraft=null;
      try{await fetch('/api/remix/draft/'+encodeURIComponent(id),{method:'DELETE'});}catch(e){}
      closeRemixPanel();
    }
    fetch('/api/remix/sources',{cache:'no-store'})
      .then(res=>{harnessAvailable=res.ok;setRemixStatus(harnessAvailable?'Harness 服务已连接。':'启动 tools/remix_harness_server.py 后可用真实生成。');})
      .catch(()=>{harnessAvailable=false;});

    remixClose.addEventListener('click',closeRemixPanel);
    draftBtn.addEventListener('click',createHarnessDraft);
    publishBtn.addEventListener('click',publishHarnessDraft);
    deleteDraftBtn.addEventListener('click',deleteHarnessDraft);
    recordStart.addEventListener('click',async()=>{
      try {
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        recordedChunks=[]; mediaRecorder=new MediaRecorder(stream);
        mediaRecorder.addEventListener('dataavailable',e=>{if(e.data.size)recordedChunks.push(e.data);});
        mediaRecorder.addEventListener('stop',async()=>{stream.getTracks().forEach(t=>t.stop());await transcribeBlob(new Blob(recordedChunks,{type:'audio/webm'}),'voice.webm');});
        mediaRecorder.start(); recordStart.disabled=true; recordStop.disabled=false; setRemixStatus('录音中...');
      } catch(err){setRemixStatus('无法录音：'+(err&&err.message?err.message:err));}
    });
    recordStop.addEventListener('click',()=>{
      if(mediaRecorder&&mediaRecorder.state!=='inactive') mediaRecorder.stop();
      recordStart.disabled=false; recordStop.disabled=true;
    });
    audioUpload.addEventListener('change',async()=>{
      const file=audioUpload.files&&audioUpload.files[0]; if(!file) return;
      try{await transcribeBlob(file,file.name||'upload.webm');}catch(err){setRemixStatus('转录失败：'+(err&&err.message?err.message:err));}
    });

    window.remixCurrent=()=>{const a=Array.from(feedWrap.querySelectorAll('.feed-item'))[currentFeedIdx()];if(harnessAvailable)openRemixPanel(a);else insertRemixItem(a);};
    window.render_home_to_text=()=>JSON.stringify({
      coordinate_system:'three-screen: waterfall home + douyin feed + profile',
      screens:['home','feed','profile'], currentScreen,
      baseItems:BASE.length, feedItems:feedItems.length,
      activeFeedIndex:activeIndex,
      activeFeedTitle:feedItems[activeIndex]?feedItems[activeIndex].title:null,
      remixes:remixCount, harnessAvailable,
    });
  })();
</script>
</body>
</html>
"""

OUTPUT.write_text(HTML, encoding='utf-8')
print(f"Written {len(HTML)} chars to {OUTPUT}")
