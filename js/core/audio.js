/* 放置王國 MEGA IDLE — WebAudio synthesized SFX + chiptune music (slice B8: extend freely) */
"use strict";
MG.core = MG.core || {};
MG.core.audio = (function () {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let musicTimer = null, musicStep = 0, musicNextT = 0, currentTrack = null, currentTrackName = null;
  let suggestedTrack = null;
  const lastSfx = {};
  // NOTE(n): n 為 MIDI 音名編號（69 = A4 = 440Hz）
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  function initVolumes() {
    const st = MG.game && MG.game.state && MG.game.state.settings;
    if (!st) return;
    if (typeof st.sfxVol !== "number") st.sfxVol = 0.9;
    if (typeof st.musicVol !== "number") st.musicVol = 0.35;
  }
  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
      sfxGain = ctx.createGain(); sfxGain.connect(master);
      musicGain = ctx.createGain(); musicGain.connect(master);
      initVolumes();
      if (MG.game && MG.game.state) {
        sfxGain.gain.value = MG.game.state.settings.sfxVol;
        musicGain.gain.value = MG.game.state.settings.musicVol;
      } else {
        sfxGain.gain.value = 0.9; musicGain.gain.value = 0.35;
      }
      return true;
    } catch (e) { return false; }
  }
  function unlock() { if (ensure() && ctx.state === "suspended") ctx.resume(); }
  // 防音效刷屏：同一個 key 在 ms 毫秒內只允許播一次
  function gate(key, ms) {
    const now = performance.now();
    if (now - (lastSfx[key] || 0) < ms) return false;
    lastSfx[key] = now;
    return true;
  }
  function tone(opts) {
    if (!ensure() || !MG.game.state.settings.sound) return;
    const { f = 440, f2, d = 0.08, type = "square", vol = 0.25, slide = 0, delay = 0 } = opts;
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + d);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(20, f + slide), t0 + d);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g); g.connect(sfxGain);
    o.start(t0); o.stop(t0 + d + 0.02);
  }
  function noise(d = 0.1, vol = 0.2, delay = 0) {
    if (!ensure() || !MG.game.state.settings.sound) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.floor(ctx.sampleRate * d);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = vol;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 2000;
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t0);
  }
  const SFX = {
    click: () => tone({ f: 660, d: 0.04, type: "square", vol: 0.12 }),
    hover: () => tone({ f: 520, d: 0.03, type: "triangle", vol: 0.07 }),
    tabSwitch: () => tone({ f: 440, f2: 620, d: 0.05, type: "triangle", vol: 0.1 }),
    formation: () => { tone({ f: 380, d: 0.05, type: "triangle", vol: 0.12 }); tone({ f: 570, d: 0.07, type: "triangle", vol: 0.12, delay: 0.05 }); },
    coin: () => { if (!gate("coin", 100)) return; tone({ f: 880, d: 0.06, type: "square", vol: 0.14 }); tone({ f: 1320, d: 0.09, type: "square", vol: 0.12, delay: 0.05 }); },
    buy: () => { tone({ f: 520, d: 0.07, type: "triangle", vol: 0.22 }); tone({ f: 780, d: 0.1, type: "triangle", vol: 0.2, delay: 0.06 }); },
    equip: () => { tone({ f: 500, d: 0.05, type: "square", vol: 0.15 }); tone({ f: 750, d: 0.08, type: "square", vol: 0.15, delay: 0.04 }); },
    levelup: () => { [523, 659, 784, 1047].forEach((f, i) => tone({ f, d: 0.1, type: "square", vol: 0.16, delay: i * 0.07 })); },
    hit: () => { if (gate("hit", 125)) tone({ f: 180, f2: 90, d: 0.05, type: "square", vol: 0.18 }); },
    crit: () => { tone({ f: 220, f2: 110, d: 0.07, type: "sawtooth", vol: 0.2 }); noise(0.04, 0.12); },
    hurt: () => tone({ f: 300, f2: 140, d: 0.12, type: "sawtooth", vol: 0.16 }),
    // 魔物擊殺：低沉悶響 + 金幣叮噹
    kill: () => {
      noise(0.12, 0.22);
      tone({ f: 220, f2: 55, d: 0.2, type: "sawtooth", vol: 0.18 });
      tone({ f: 988, d: 0.05, type: "square", vol: 0.1, delay: 0.06 });
      tone({ f: 1319, d: 0.08, type: "square", vol: 0.1, delay: 0.11 });
    },
    death: () => SFX.kill(),
    // 寶箱拾取：上揚鈴聲
    loot: () => { [784, 988, 1175, 1568].forEach((f, i) => tone({ f, d: 0.12, type: "triangle", vol: 0.16, delay: i * 0.06 })); },
    // 首領擊殺：盛大勝利（低鳴 + 上行號角 + 煙火）
    bossDeath: () => {
      [110, 110, 147, 196].forEach((f, i) => tone({ f, d: 0.24, type: "sawtooth", vol: 0.22, delay: i * 0.14 }));
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, d: 0.16, type: "triangle", vol: 0.18, delay: 0.5 + i * 0.08 }));
      noise(0.35, 0.2, 0.55);
    },
    victory: () => SFX.bossDeath(),
    // 區域通關：勝利號角
    regionClear: () => {
      [392, 392, 523, 659, 784].forEach((f, i) => tone({ f, d: i < 2 ? 0.16 : 0.22, type: "triangle", vol: 0.2, delay: i * 0.11 }));
      tone({ f: 1047, d: 0.4, type: "square", vol: 0.12, delay: 0.55 });
    },
    error: () => { tone({ f: 220, d: 0.12, type: "square", vol: 0.15 }); tone({ f: 174, d: 0.16, type: "square", vol: 0.15, delay: 0.1 }); },
    // 建築未解鎖：低沉悶響
    locked: () => {
      tone({ f: 160, f2: 90, d: 0.12, type: "square", vol: 0.16 });
      tone({ f: 110, f2: 80, d: 0.1, type: "sawtooth", vol: 0.1, delay: 0.1 });
    },
    recruit: () => { [262, 330, 392, 523, 659, 784].forEach((f, i) => tone({ f, d: 0.09, type: "triangle", vol: 0.18, delay: i * 0.06 })); },
    enhance: () => { tone({ f: 400, f2: 800, d: 0.12, type: "square", vol: 0.18 }); noise(0.06, 0.1); },
    // 合成製作：敲擊 + 亮音
    craft: () => {
      noise(0.08, 0.16);
      tone({ f: 330, f2: 165, d: 0.09, type: "square", vol: 0.16 });
      tone({ f: 660, d: 0.12, type: "triangle", vol: 0.16, delay: 0.07 });
    },
    quest: () => { [660, 880, 1100].forEach((f, i) => tone({ f, d: 0.09, type: "triangle", vol: 0.16, delay: i * 0.05 })); },
    questClaim: () => SFX.quest(),
    skill: () => { if (gate("skill", 150)) tone({ f: 900, f2: 300, d: 0.09, type: "sawtooth", vol: 0.12 }); },
    gem: () => { [1047, 1319, 1568].forEach((f, i) => tone({ f, d: 0.1, type: "sine", vol: 0.2, delay: i * 0.05 })); },
    // 鑲嵌寶石：水晶閃光
    gemSocket: () => { [880, 1175, 1568, 2093].forEach((f, i) => tone({ f, d: 0.09, type: "sine", vol: 0.16, delay: i * 0.04 })); },
    potion: () => { tone({ f: 300, f2: 600, d: 0.15, type: "triangle", vol: 0.2 }); },
    // 飲用藥水：咕嚕吞飲
    potionDrink: () => {
      tone({ f: 400, f2: 150, d: 0.14, type: "triangle", vol: 0.16 });
      noise(0.1, 0.08, 0.05);
    },
    building: () => { tone({ f: 392, d: 0.08, type: "triangle", vol: 0.2 }); tone({ f: 523, d: 0.1, type: "triangle", vol: 0.2, delay: 0.07 }); },
    awaken: () => { [131, 196, 262, 392, 523, 784].forEach((f, i) => tone({ f, d: 0.2, type: "sawtooth", vol: 0.15, delay: i * 0.12 })); },
    boss: () => { [110, 110, 147, 196].forEach((f, i) => tone({ f, d: 0.22, type: "sawtooth", vol: 0.22, delay: i * 0.16 })); noise(0.3, 0.2, 0.5); }
  };
  /* ---- music: tiny chiptune sequencer (陣列存 MIDI 音名編號，0 = 休止) ---- */
  const TRACKS = {
    // 標題：寧靜分解和弦（Am–F–C–G）
    title: { bpm: 76, loop: 32,
      bass: [45,0,0,0, 45,0,0,0, 41,0,0,0, 41,0,0,0, 48,0,0,0, 48,0,0,0, 43,0,0,0, 43,0,0,0],
      lead: [57,60,64,69, 64,60,57,0, 53,57,60,65, 60,57,53,0, 60,64,67,72, 67,64,60,0, 55,59,62,67, 62,59,55,0],
      counter: [0,0,0,0, 0,0,64,0, 0,0,0,0, 0,0,60,0, 0,0,0,0, 0,0,72,0, 0,0,0,0, 0,0,67,0],
      leadType: "triangle", leadVol: 0.09, bassVol: 0.13, counterType: "triangle", counterVol: 0.06 },
    // 城鎮：安詳旋律 + 偶爾和聲迴響（C–Am–F–G）
    town: { bpm: 92, loop: 32,
      bass: [48,0,0,0, 48,0,0,0, 45,0,0,0, 45,0,0,0, 41,0,0,0, 41,0,0,0, 43,0,0,0, 43,0,0,0],
      lead: [72,0,76,0, 79,0,76,0, 69,0,72,0, 76,0,72,0, 65,0,69,0, 72,0,69,0, 67,0,71,0, 74,0,71,0],
      counter: [0,0,0,0, 0,64,0,0, 0,0,0,0, 0,0,64,0, 0,0,0,0, 0,65,0,0, 0,0,0,0, 0,62,0,0],
      leadType: "square", leadVol: 0.06, bassVol: 0.15, counterType: "triangle", counterVol: 0.055 },
    // 戰鬥：驅動節奏（Am–D–C–E–F）
    battle: { bpm: 132, loop: 32,
      bass: [45,0,0,0, 45,0,50,0, 48,48,48,48, 48,0,52,0, 45,0,0,0, 45,0,50,0, 53,53,53,53, 52,52,52,52],
      lead: [69,0,69,0, 72,0,0,0, 69,0,72,0, 64,0,67,0, 69,0,69,0, 72,0,0,0, 76,0,74,0, 72,0,0,0],
      counter: [0,0,0,0, 0,60,0,62, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,60,0,62, 0,0,0,0, 0,0,64,0],
      leadType: "square", leadVol: 0.07, bassVol: 0.16, counterType: "triangle", counterVol: 0.06 }
  };
  function startMusic(name) {
    if (!ensure() || !MG.game.state.settings.music) return;
    stopMusic();
    currentTrackName = TRACKS[name] ? name : "town";
    currentTrack = TRACKS[currentTrackName];
    musicStep = 0; musicNextT = ctx.currentTime + 0.1;
    musicTimer = setInterval(scheduleMusic, 90);
  }
  function scheduleMusic() {
    if (!ctx || !MG.game.state.settings.music) return;
    const tr = currentTrack; if (!tr) return;
    const spb = 60 / tr.bpm / 2; // 八分音符
    while (musicNextT < ctx.currentTime + 0.25) {
      const i = musicStep % tr.loop;
      const t0 = musicNextT;
      if (tr.bass && tr.bass[i]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = NOTE(tr.bass[i]);
        g.gain.setValueAtTime(tr.bassVol || 0.15, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + spb * 0.92);
        o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0 + spb);
      }
      if (tr.lead && tr.lead[i]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = tr.leadType || "square"; o.frequency.value = NOTE(tr.lead[i]);
        g.gain.setValueAtTime(tr.leadVol || 0.06, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + spb * 0.88);
        o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0 + spb);
      }
      // 偶爾出現的對位旋律（稀疏）
      if (tr.counter && tr.counter[i]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = tr.counterType || "triangle"; o.frequency.value = NOTE(tr.counter[i]);
        g.gain.setValueAtTime(tr.counterVol || 0.05, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + spb * 0.8);
        o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0 + spb);
      }
      musicStep++; musicNextT += spb;
    }
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } currentTrack = null; }
  function setMusic(name) { if (name) startMusic(name); else stopMusic(); }
  // 設定重新套用：切回目前曲目（含戰鬥曲）
  function refreshMusic() {
    if (MG.game && MG.game.state) {
      if (MG.game.state.settings.music) {
        if (!musicTimer && currentTrackName) startMusic(currentTrackName);
      } else stopMusic();
    }
  }
  // 供副本畫面呼叫的曲目建議鉤子：若音樂正在播放則立即切換
  function suggestTrack(name) {
    if (TRACKS[name]) { suggestedTrack = name; if (musicTimer) startMusic(name); }
  }
  // 音量控制：0..1 夾取，並寫回 state.settings 持久化
  function setSfxVol(v) {
    const n = Number(v);
    const vol = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
    if (MG.game && MG.game.state) MG.game.state.settings.sfxVol = vol;
    if (sfxGain) sfxGain.gain.value = vol;
    return vol;
  }
  function setMusicVol(v) {
    const n = Number(v);
    const vol = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
    if (MG.game && MG.game.state) MG.game.state.settings.musicVol = vol;
    if (musicGain) musicGain.gain.value = vol;
    return vol;
  }
  return { ensure, unlock, tone, noise, SFX, startMusic, stopMusic, setMusic, refreshMusic, suggestTrack, setSfxVol, setMusicVol };
})();
