/* ==========================================================
   CAT CLICKER — game.js v2.3-fix
   ========================================================== */

const ADMIN_UIDS = [
  "V7fKSuIYmpaJPTturXzJWdScaF32",
  "wN1SFDtgooNQ18CbDiAZVDN5K3e2",
  "CVhqk7CqOeNfvLoy7LjZWHCDlre2"
];
const BANNED_UIDS = [];
const ADMIN_UID_SET = new Set(ADMIN_UIDS);
function isHardcodedAdminUid(uid) {
  const u = String(uid || "").trim();
  return u === "V7fKSuIYmpaJPTturXzJWdScaF32" || u === "wN1SFDtgooNQ18CbDiAZVDN5K3e2" || ADMIN_UID_SET.has(u);
}
function shouldBlockLeaderboardForUid(uid) {
  const u = String(uid || "").trim();
  return !u || isHardcodedAdminUid(u) || remoteAdminUids.includes(u) || localAdminGranted || isAdmin;
}

const PROMO_CODES = {
  "RELEASE": { fish: 1000, message: "Release bonus! +1000 fish" },
  "BSJWMQLQIWHSBNDJSJSJSBS": {
    fish: 10000000,
    queueWaves: [{type:"diamond"},{type:"diamond"},{type:"diamond"}],
    message: "MEGA REWARD!\n+10M fish\n+3 diamond waves!"
  }
};

/* ========== \u0417\u0412\u0423\u041A\u0418 ========== */
let audioCtx = null;
let soundEnabled = true;
let lobbyMusic = null;
let cometMusic = null;
let lobbyMusicUnlocked = false;
let musicUserInteracted = false;
let musicRetryTimer = null;
let lobbyMusicLoadRequested = false;
let cometMusicLoadRequested = false;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
    catch(e){ console.warn("Audio not supported"); }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function ensureLobbyMusic() {
  if (!lobbyMusic) {
    lobbyMusic = new Audio("Lobby.mp3");
    lobbyMusic.loop = true;
    lobbyMusic.volume = 0.14;
    lobbyMusic.preload = "auto";
  }
  return lobbyMusic;
}
function ensureCometMusic() {
  if (!cometMusic) {
    cometMusic = new Audio("CometEvent.mp3");
    cometMusic.loop = true;
    cometMusic.volume = 0.22;
    cometMusic.preload = "auto";
  }
  return cometMusic;
}
function playLobbyMusic() {
  if (!settings || settings.musicEnabled === false || cometEventActive) return;
  if (cometMusic && !cometMusic.paused) cometMusic.pause();
  const music = ensureLobbyMusic();
  if (!music.paused && !music.ended) return;
  try {
    if (!lobbyMusicLoadRequested) { music.load(); lobbyMusicLoadRequested = true; }
  } catch (e) {}
  music.play().then(() => {
    lobbyMusicUnlocked = true;
  }).catch(() => {
    lobbyMusicUnlocked = false;
  });
}
function playCometMusic() {
  if (!settings || settings.musicEnabled === false) return;
  if (lobbyMusic && !lobbyMusic.paused) lobbyMusic.pause();
  const music = ensureCometMusic();
  if (!music.paused && !music.ended) return;
  try {
    if (!cometMusicLoadRequested) { music.load(); cometMusicLoadRequested = true; }
  } catch (e) {}
  music.play().then(() => { lobbyMusicUnlocked = true; }).catch(() => {});
}
function stopLobbyMusic() {
  if (lobbyMusic) lobbyMusic.pause();
  if (cometMusic) cometMusic.pause();
}
function duckLobbyMusic(ms = 260) {
  const music = cometEventActive ? cometMusic : lobbyMusic;
  if (!music || music.paused || settings.musicEnabled === false) return;
  const oldVol = music.volume;
  music.volume = Math.min(oldVol, 0.055);
  setTimeout(() => {
    if (music && settings.musicEnabled !== false) music.volume = oldVol;
  }, ms);
}
function updateLobbyMusic() {
  if (settings.musicEnabled === false) { stopLobbyMusic(); return; }
  if (cometEventActive) playCometMusic();
  else playLobbyMusic();
}
function unlockLobbyMusic() {
  musicUserInteracted = true;
  if (settings && settings.musicEnabled !== false) {
    if (cometEventActive) playCometMusic();
    else playLobbyMusic();
  }
}
["pointerdown", "touchstart", "keydown", "click"].forEach((ev) => {
  document.addEventListener(ev, unlockLobbyMusic, { passive: true });
});
function startMusicRetryLoop() {
  if (musicRetryTimer) return;
  musicRetryTimer = setInterval(() => {
    if (!settings || settings.musicEnabled === false) return;
    if (!musicUserInteracted) return;
    const activeMusic = cometEventActive ? ensureCometMusic() : ensureLobbyMusic();
    if (activeMusic && activeMusic.paused) {
      if (cometEventActive) playCometMusic();
      else playLobbyMusic();
    }
  }, 2000);
}
startMusicRetryLoop();
function playUIClick() {
  if (!soundEnabled) return;
  const c = ensureAudio(); if (!c) return;
  const now = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = "square";
  o.frequency.setValueAtTime(800, now);
  o.frequency.exponentialRampToValueAtTime(400, now + 0.04);
  g.gain.setValueAtTime(0.08, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  o.connect(g); g.connect(c.destination);
  o.start(now); o.stop(now + 0.06);
}
function playCatClick() {
  if (!soundEnabled) return;
  duckLobbyMusic(180);
  const c = ensureAudio(); if (!c) return;
  const now = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(600, now);
  o.frequency.exponentialRampToValueAtTime(900, now + 0.05);
  o.frequency.exponentialRampToValueAtTime(500, now + 0.12);
  g.gain.setValueAtTime(0.24, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  o.connect(g); g.connect(c.destination);
  o.start(now); o.stop(now + 0.15);
  const o2 = c.createOscillator(), g2 = c.createGain();
  o2.type = "square";
  o2.frequency.setValueAtTime(300, now);
  o2.frequency.exponentialRampToValueAtTime(450, now + 0.05);
  g2.gain.setValueAtTime(0.11, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  o2.connect(g2); g2.connect(c.destination);
  o2.start(now); o2.stop(now + 0.1);
}
function playBuySound() {
  if (!soundEnabled) return;
  const c = ensureAudio(); if (!c) return;
  const now = c.currentTime;
  [523, 659, 784].forEach((freq, i) => {
    const o = c.createOscillator(), g = c.createGain();
    const t = now + i * 0.05;
    o.type = "square"; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.2);
  });
}
function playRewardSound() {
  if (!soundEnabled) return;
  const c = ensureAudio(); if (!c) return;
  const now = c.currentTime;
  [440, 554, 659, 880].forEach((freq, i) => {
    const o = c.createOscillator(), g = c.createGain();
    const t = now + i * 0.08;
    o.type = "square"; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.25);
  });
}
function playWaveSound(type) {
  if (!soundEnabled) return;
  const c = ensureAudio(); if (!c) return;
  const now = c.currentTime;
  const base = type === "gold" ? 440 : (type === "diamond" ? 660 : 880);
  for (let i = 0; i < 4; i++) {
    const o = c.createOscillator(), g = c.createGain();
    const t = now + i * 0.06;
    o.type = "square";
    o.frequency.setValueAtTime(base * Math.pow(1.26, i), t);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.15);
  }
}
function playNoiseBurst(c, startTime, duration, gainValue, filterFreq = 1800) {
  const length = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFreq, startTime);
  filter.Q.setValueAtTime(8, startTime);
  gain.gain.setValueAtTime(gainValue, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  src.buffer = buffer;
  src.connect(filter); filter.connect(gain); gain.connect(c.destination);
  src.start(startTime); src.stop(startTime + duration);
}
function playEggCrackSound(intensity = 1) {
  if (!soundEnabled) return;
  duckLobbyMusic(420);
  const c = ensureAudio(); if (!c) return;
  const now = c.currentTime + 0.005;
  const power = Math.max(1, intensity || 1);
  playNoiseBurst(c, now, 0.055, 0.42 * power, 2200);
  playNoiseBurst(c, now + 0.035, 0.045, 0.28 * power, 1200);
  for (let i = 0; i < 4; i++) {
    const t = now + i * 0.026;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = i % 2 ? "sawtooth" : "square";
    osc.frequency.setValueAtTime(900 + Math.random() * 1900, t);
    osc.frequency.exponentialRampToValueAtTime(130 + Math.random() * 180, t + 0.055);
    gain.gain.setValueAtTime(0.22 * power, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.075);
  }
}
function playEggRevealSound(rarity = "Common") {
  if (!soundEnabled) return;
  duckLobbyMusic(750);
  const c = ensureAudio(); if (!c) return;
  const now = c.currentTime + 0.005;
  const rarityBoost = rarity === "Legendary" ? 2.0 : (rarity === "Epic" ? 1.6 : (rarity === "Rare" ? 1.3 : 1.15));
  const notes = rarity === "Legendary" ? [523, 659, 784, 1046, 1318] : [440, 554, 659, 880];
  notes.forEach((freq, i) => {
    const t = now + i * 0.075;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.24 * rarityBoost, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.36);
  });
}
document.addEventListener("click", (e) => {
  unlockLobbyMusic();
  if (e.target.closest(".ui-click")) playUIClick();
}, true);

/* ========== HELPERS ========== */
const $ = (id) => document.getElementById(id);
const on = (id, event, handler) => {
  const el = $(id);
  if (el) el.addEventListener(event, handler);
};

/* ========== \u0423\u0412\u0415\u0414\u041E\u041C\u041B\u0415\u041D\u0418\u042F ========== */
const notificationQueue = [];
let notificationShowing = false;
function showNotification(text, color = "#4ade80", duration = 3000) {
  notificationQueue.push({ text, color, duration });
  if (!notificationShowing) showNextNotification();
}
function showNextNotification() {
  const item = notificationQueue.shift();
  if (!item) { notificationShowing = false; return; }
  notificationShowing = true;
  const { text, color, duration } = item;
  const notif = document.createElement("div");
  notif.className = "game-notification";
  notif.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0);
    z-index: 9999; padding: 20px 30px; background: rgba(0,0,0,0.85);
    border: 3px solid ${color}; color: ${color}; font-family: 'Press Start 2P', cursive;
    font-size: 12px; text-align: center; line-height: 1.6; pointer-events: none;
    white-space: pre-line; box-shadow: 0 0 30px ${color}44, 0 0 60px ${color}22, inset 0 0 30px ${color}11;
    animation: notifPulse ${duration}ms ease-in-out forwards; image-rendering: pixelated;
    max-width: 85vw; word-break: break-word;
  `;
  notif.textContent = text;
  document.body.appendChild(notif);
  setTimeout(() => {
    if (notif.parentNode) notif.remove();
    setTimeout(showNextNotification, 180);
  }, duration);
}
(function injectNotifCSS() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes notifPulse {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      10% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
      20% { transform: translate(-50%, -50%) scale(1); }
      30%, 70% { transform: translate(-50%, -50%) scale(1); opacity: 1; box-shadow: 0 0 30px currentColor, 0 0 60px rgba(255,255,255,0.1); }
      50% { transform: translate(-50%, -50%) scale(1.05); box-shadow: 0 0 50px currentColor, 0 0 100px rgba(255,255,255,0.15); }
      85% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();

/* ========== \u041A\u041E\u0421\u041C\u041E\u0421 ========== */
const spaceCanvas = $("space");
const spaceCtx = spaceCanvas.getContext("2d");
let sw, sh, particles = [];
function resizeSpace() {
  sw = spaceCanvas.width = window.innerWidth;
  sh = spaceCanvas.height = window.innerHeight;
  createParticles();
}
function createParticles() {
  particles = [];
  const count = Math.floor((sw * sh) / 9000);
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * sw, y: Math.random() * sh,
      size: Math.random() * 2 + 0.5, speedY: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.8 + 0.2
    });
  }
}
function drawParticles() {
  spaceCtx.clearRect(0, 0, sw, sh);
  for (const p of particles) {
    spaceCtx.beginPath();
    spaceCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    spaceCtx.fillStyle = `rgba(255,255,255,${p.alpha})`;
    spaceCtx.fill();
    p.y += p.speedY;
    if (p.y > sh + 5) { p.y = -5; p.x = Math.random() * sw; }
  }
  requestAnimationFrame(drawParticles);
}
window.addEventListener("resize", resizeSpace);
resizeSpace();
drawParticles();

/* ========== \u0424\u041E\u0420 \u041C\u0410\u0422\u0418\u0420 \u041E\u0412\u0410\u041D\u0418\u0415 ========== */
const NUM_SUFFIXES = [
  { v: 1e90, s: "Nv" }, { v: 1e87, s: "Ov" }, { v: 1e84, s: "Spv" }, { v: 1e81, s: "Sxv" }, { v: 1e78, s: "Qiv" },
  { v: 1e75, s: "Qav" }, { v: 1e72, s: "Tv" }, { v: 1e69, s: "Dv" }, { v: 1e66, s: "Uv" }, { v: 1e63, s: "Vg" },
  { v: 1e60, s: "Nod" }, { v: 1e57, s: "Ocd" }, { v: 1e54, s: "Spd" }, { v: 1e51, s: "Sxd" }, { v: 1e48, s: "Qid" },
  { v: 1e45, s: "Qad" }, { v: 1e42, s: "Td" }, { v: 1e39, s: "Dd" }, { v: 1e36, s: "Ud" }, { v: 1e33, s: "Dc" },
  { v: 1e30, s: "No" }, { v: 1e27, s: "Oc" }, { v: 1e24, s: "Sp" }, { v: 1e21, s: "Sx" }, { v: 1e18, s: "Qi" },
  { v: 1e15, s: "Qa" }, { v: 1e12, s: "T" }, { v: 1e9, s: "B" }, { v: 1e6, s: "M" }, { v: 1e3, s: "K" }
];
function formatNum(n) {
  n = Number(n) || 0;
  if (n < 0) return "-" + formatNum(-n);
  for (const item of NUM_SUFFIXES) {
    if (n >= item.v) return (n / item.v).toFixed(2).replace(/\.?0+$/, "") + item.s;
  }
  return Math.floor(n).toString();
}
function parseNumInput(str) {
  if (!str) return NaN;
  str = String(str).trim();
  const neg = str.startsWith("-");
  if (neg) str = str.slice(1);
  const upper = str.toUpperCase();
  const sorted = [...NUM_SUFFIXES].sort((a, b) => b.s.length - a.s.length);
  for (const { s, v } of sorted) {
    if (upper.endsWith(s.toUpperCase())) {
      const num = parseFloat(upper.slice(0, -s.length));
      return isNaN(num) ? NaN : Math.floor((neg ? -1 : 1) * num * v);
    }
  }
  const num = parseFloat(upper.replace(/,/g, ""));
  return isNaN(num) ? NaN : Math.floor((neg ? -1 : 1) * num);
}
function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function formatDuration(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function makePlayerId() {
  try {
    if (crypto && crypto.randomUUID) return "player_" + crypto.randomUUID();
  } catch (e) {}
  return "player_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 12);
}
function ensurePlayerId() {
  if (!playerId) playerId = makePlayerId();
  return playerId;
}
function sanitizePlayerName(name) {
  return String(name || "").trim().replace(/\s+/g, " ").slice(0, 10);
}

/* ========== \u0414\u0410\u041D\u041D\u042B\u0415 ========== */
let score = 0;
let crystals = 0;
let stell = 0;
let clickPower = 1;
let autoClicker = 0;
let goldClicks = 0;
let diamondClicks = 0;
let activeFish = 0;
const MAX_FISH = 3;
let waveActive = false;
let waveMultiplier = 1;
let activeWaveType = null;
let activeWaveToken = 0;
let activeWaveTimer = null;
const GOLD_REQUIRED = 100;
const DIAMOND_REQUIRED = 1000;
let stats = {
  totalClicks: 0, totalFishEarned: 0, playTimeSec: 0,
  goldWaves: 0, diamondWaves: 0, itemsBought: 0
};
let profile = { name: "", avatar: null };
let playerId = null;
let settings = { glowEnabled: true, soundEnabled: true, musicEnabled: true };
let currentUser = null;
let recoveryCode = null;
let lastPushedFish = -1;
let lastLeaderboardSignature = "";
let isAdmin = false;
let remoteAdminUids = [];
let adminGrantsListening = false;
let localAdminGranted = false;
let suppressPersistenceForLogout = false;
let usedPromoCodes = [];
let pendingOfflineFish = 0;
let rebirthCount = 0;
let rebirthMultiplier = 1;
let potions = { luck: 0, speed: 0, fish: 0 };
let vipActive = false;
let imperialActive = false;
let currentShopTab = "click";
let lastClickTime = 0;
const CLICK_DELAY = 50;
const SAVE_KEY = "catclicker_save";
const OFFLINE_MIN_SECONDS = 30;
const OFFLINE_MAX_SECONDS = 8 * 3600;
const OFFLINE_EFFICIENCY = 0.1;
const SAVE_FILE_TYPE = "catclicker-save";
const SAVE_FILE_VERSION = 2;
const SAVE_FILE_ENCODING = "base64-json";
const SAVE_FILE_HASH_VERSION = "cc-hash-v1";
const SAVE_FILE_INTEGRITY_KEY = ["cat", "clicker", "arena", "save", "v2", "pets", "vip"].join(":");
const ALLOW_UNSIGNED_SAVE_IMPORT = false;
const AUTO_BACKUP_STORAGE_KEY = "catclicker_auto_backups";
const AUTO_BACKUP_LIMIT = 3;
let lastHiddenAt = null;
let lastResumeHandledAt = 0;
let chatListening = false;
let chatLastSendAt = 0;
let cachedChatMessages = [];
const COMET_COOLDOWN_MS = 10 * 60 * 1000;
const COMET_EVENT_MS = 5 * 60 * 1000;
const COMET_CYCLE_MS = COMET_COOLDOWN_MS + COMET_EVENT_MS;
let cometCycleStartedAt = Date.now();
let cometEventActive = false;
let cometSystemEnabled = true;
let cometConfigListening = false;
let cometSpawnTimer = null;
let activeComets = 0;
const MAX_ACTIVE_COMETS = 1;

const scoreText = $("scoreText");
const crystalText = $("crystalText");
const stellText = $("stellText");
const cometTimer = $("cometTimer");
const cometEventBtn = $("cometEventBtn");
const buyStellEgg1Btn = $("buyStellEgg1");
const buyStellEgg10Btn = $("buyStellEgg10");
const buyStellEgg100Btn = $("buyStellEgg100");
const scoreBar = $("scoreBar");
const catBtn = $("catBtn");
const waveGlow = $("waveGlow");
const multBadge = $("multBadge");
const goldFill = $("goldFill");
const diamondFill = $("diamondFill");
const goldBg = $("goldBg");
const diamondBg = $("diamondBg");
const goldTimer = $("goldTimer");
const diamondTimer = $("diamondTimer");
const incomeClick = $("incomeClick");
const incomeSec = $("incomeSec");
const crystalBar = $("crystalBar");
const potionStatusBar = $("potionStatusBar");

/* ========== \u041C\u0410\u0413\u0410\u0417\u0418\u041D \u0420 \u042B\u0411\u042B ========== */
const shopItemsData = (window.CAT_CLICKER_UPGRADES && Array.isArray(window.CAT_CLICKER_UPGRADES)
  ? window.CAT_CLICKER_UPGRADES
  : [
    { name: "Double Fish", desc: "+1 fish per click", basePrice: 10, owned: 0, category: "click", power: 1 },
    { name: "Auto Fisher", desc: "+1 fish/sec", basePrice: 50, owned: 0, category: "auto", power: 1 }
  ]
).map((item) => ({ owned: 0, ...item }));
function applyUpgradeItem(item) {
  if (item && typeof item.apply === "function") { item.apply(); return; }
  const power = Number(item && item.power) || 0;
  if (item.category === "click") clickPower += power;
  else if (item.category === "auto") autoClicker += power;
}
function getPrice(item) {
  return Math.floor(item.basePrice * Math.pow(1.5, item.owned));
}
function getRebirthCost() {
  return Math.floor(1000000 * Math.pow(10, rebirthCount));
}
function getFishPotionMult() {
  return Date.now() < potions.fish ? 5 : 1;
}
function getSpeedPotionMult() {
  return Date.now() < potions.speed ? 2 : 1;
}
function getPetApi() {
  return window.petSystemApi || null;
}
function getPetFishMult() {
  return getPetApi()?.getFishMultiplier?.() || 1;
}
function getPetAutoSpeedMult() {
  return getPetApi()?.getAutoSpeedMultiplier?.() || 1;
}
function getLuckPotionMult() {
  return Date.now() < potions.luck ? 2 : 1;
}
function getPetLuckMult() {
  return (getPetApi()?.getLuckMultiplier?.() || 1) * getLuckPotionMult();
}
function getPetPassiveCrystalsPerMinute() {
  return getPetApi()?.getPassiveCrystalsPerMinute?.() || 0;
}
function getPetPassiveStellPerMinute() {
  return getPetApi()?.getPassiveStellPerMinute?.() || 0;
}
function getAtomicFishMult() {
  return getPetApi()?.getAtomicFishMultiplier?.() || 1;
}
function getAtomicAutoSpeedMult() {
  return getPetApi()?.getAtomicAutoSpeedMultiplier?.() || 1;
}
function getVipFishMult() {
  return vipActive ? 10 : 1;
}
function getImperialFishMult() {
  // Imperial fish boost comes from the Imperial Cat pet itself.
  // Keep subscription multiplier at x1 to avoid accidental x10000 stacking.
  return 1;
}
function grantVipPetIfPossible() {
  try {
    if (vipActive && getPetApi()?.grantVipPet) getPetApi().grantVipPet();
  } catch (e) { console.warn("VIP pet grant failed", e); }
}
function grantImperialPetIfPossible() {
  try {
    if (imperialActive && getPetApi()?.grantImperialPet) getPetApi().grantImperialPet();
  } catch (e) { console.warn("Imperial pet grant failed", e); }
}
function getEggsOpenedCount() {
  return getPetApi()?.getEggsOpened?.() || 0;
}
function getClickIncome() {
  return clickPower * waveMultiplier * rebirthMultiplier * getFishPotionMult() * getVipFishMult() * getImperialFishMult() * getPetFishMult() * getAtomicFishMult();
}
function getAutoIncome() {
  return autoClicker * waveMultiplier * rebirthMultiplier * getFishPotionMult() * getVipFishMult() * getImperialFishMult() * getSpeedPotionMult() * getPetFishMult() * getPetAutoSpeedMult() * getAtomicAutoSpeedMult();
}

function doRebirth() {
  const cost = getRebirthCost();
  if (score < cost) return;
  rebirthCount++;
  rebirthMultiplier *= 1.5;
  crystals += 10;
  for (let i = 0; i < 10; i++) setTimeout(() => spawnFlyingCrystal(), i * 80);
  score = 0;
  clickPower = 1;
  autoClicker = 0;
  goldClicks = 0;
  diamondClicks = 0;
  if (waveActive) endWave(activeWaveType);
  shopItemsData.forEach(i => { i.owned = 0; });
  updateScore();
  updateWaveBars();
  updateIncome();
  saveGame();
  showNotification("✨ REBIRTH #"+rebirthCount+"!\n+10 Crystals!\nx"+rebirthMultiplier.toFixed(2)+" fish boost!", "#a855f7", 4000);
  postSystemChat(`${getChatName()} made rebirth #${rebirthCount}!`, "system", { author: "REBIRTH" });
}

/* ========== \u0417\u0415\u041B\u042C\u042F ========== */
const potionItemsData = [
  { name: "Luck Potion", desc: "+Luck for 10 min", icon: "LuckPotion.png", price: 3, type: "luck", duration: 10 * 60 * 1000 },
  { name: "Speed Potion", desc: "x2 auto speed 5 min", icon: "SpeedPotion.png", price: 2, type: "speed", duration: 5 * 60 * 1000 },
  { name: "Fish Potion", desc: "x5 fish 30 min", icon: "FishPotion.png", price: 5, type: "fish", duration: 30 * 60 * 1000 }
];

const VIP_PRICE = 1000;
const IMPERIAL_PRICE = 1000000;
function buyVipMembership() {
  if (vipActive) return;
  if (crystals < VIP_PRICE) {
    showNotification("Need 1000 amethysts for VIP!", "#ff6666", 2500);
    return;
  }
  crystals -= VIP_PRICE;
  vipActive = true;
  grantVipPetIfPossible();
  playRewardSound();
  updateScore();
  updateIncome();
  saveGame();
  if (currentUser && !shouldBlockLeaderboardForUid(currentUser.uid)) pushToLeaderboard();
  showNotification("⭐ VIP ACTIVATED!\nx10 fish forever\n+ unique Gold Pegasus!", "#ffd700", 4500);
}

function buyImperialMembership() {
  if (imperialActive) return;
  if (crystals < IMPERIAL_PRICE) {
    showNotification("Need 1M amethysts for Imperial!", "#ff4444", 2500);
    return;
  }
  crystals -= IMPERIAL_PRICE;
  imperialActive = true;
  grantImperialPetIfPossible();
  playRewardSound();
  updateScore();
  updateIncome();
  saveGame();
  if (currentUser && !shouldBlockLeaderboardForUid(currentUser.uid)) pushToLeaderboard();
  showNotification("👑 IMPERIAL ACTIVATED!\nx100 fish\n+ Imperial Cat!", "#ff4444", 5000);
}

function renderPotionShop() {
  const el = $("potionItems");
  if (!el) return;
  el.innerHTML = "";
  const vipCanBuy = crystals >= VIP_PRICE && !vipActive;
  const vipDiv = document.createElement("div");
  vipDiv.className = "potion-item vip-item" + (vipActive ? " active-potion" : "") + (vipCanBuy ? "" : " locked");
  vipDiv.innerHTML = `
    <div class="potion-icon"><img src="GoldPegasus.png" alt="VIP" /></div>
    <div class="potion-info">
      <div class="potion-name">⭐ VIP</div>
      <div class="potion-desc">Permanent x10 fish • unique Gold Pegasus • [VIP] top prefix</div>
      <div class="potion-timer">${vipActive ? "ACTIVE FOREVER" : "Gold Pegasus: x5 fish, +200% luck, x1.5 auto, +5 amethyst/min"}</div>
    </div>
    <div class="potion-price"><img src="CrystalIcon.png" alt="" />${vipActive ? "OWNED" : VIP_PRICE}</div>
  `;
  if (vipCanBuy) vipDiv.addEventListener("click", buyVipMembership);
  el.appendChild(vipDiv);

  const imperialCanBuy = crystals >= IMPERIAL_PRICE && !imperialActive;
  const imperialDiv = document.createElement("div");
  imperialDiv.className = "potion-item imperial-item" + (imperialActive ? " active-potion" : "") + (imperialCanBuy ? "" : " locked");
  imperialDiv.innerHTML = `
    <div class="potion-icon"><img src="ImperialCat.png" alt="Imperial" /></div>
    <div class="potion-info">
      <div class="potion-name">👑 IMPERIAL</div>
      <div class="potion-desc">Permanent x100 fish • Imperial Cat • red name effects</div>
      <div class="potion-timer">${imperialActive ? "ACTIVE FOREVER" : "Imperial Cat: x100 fish, x10 luck, +50 amethyst/min"}</div>
    </div>
    <div class="potion-price"><img src="CrystalIcon.png" alt="" />${imperialActive ? "OWNED" : formatNum(IMPERIAL_PRICE)}</div>
  `;
  if (imperialCanBuy) imperialDiv.addEventListener("click", buyImperialMembership);
  el.appendChild(imperialDiv);

  for (const potion of potionItemsData) {
    const active = Date.now() < potions[potion.type];
    const timeLeft = active ? potions[potion.type] - Date.now() : 0;
    const canBuy = crystals >= potion.price && !active;
    const div = document.createElement("div");
    div.className = "potion-item" + (active ? " active-potion" : "") + (canBuy ? "" : " locked");
    div.innerHTML = `
      <div class="potion-icon"><img src="${potion.icon}" alt="" /></div>
      <div class="potion-info">
        <div class="potion-name">${potion.name}</div>
        <div class="potion-desc">${potion.desc}</div>
        ${active ? `<div class="potion-timer">${formatDuration(timeLeft)} left</div>` : ""}
      </div>
      <div class="potion-price"><img src="CrystalIcon.png" alt="" />${potion.price}</div>
    `;
    if (canBuy) {
      div.addEventListener("click", () => {
        crystals -= potion.price;
        potions[potion.type] = Date.now() + potion.duration;
        playBuySound();
        updateScore();
        renderPotionShop();
        saveGame();
        showNotification("✓ " + potion.name + " activated!", "#c084fc", 3000);
      });
    }
    el.appendChild(div);
  }
}

function getActivePotionEntries() {
  return potionItemsData
    .map((potion) => ({ ...potion, timeLeft: Math.max(0, (potions[potion.type] || 0) - Date.now()) }))
    .filter((potion) => potion.timeLeft > 0);
}
function updatePotionStatusBar() {
  if (!potionStatusBar) return;
  const activePotions = getActivePotionEntries();
  if (!activePotions.length) {
    potionStatusBar.innerHTML = "";
    return;
  }
  potionStatusBar.innerHTML = activePotions.map((potion) => {
    const timeText = `ends in ${formatDuration(potion.timeLeft)}`;
    return `
      <div class="potion-status-chip" data-time="${timeText}">
        <img src="${potion.icon}" alt="${potion.name}" />
        <div>
          <div class="potion-status-name">${potion.name}</div>
          <div class="potion-status-time">${timeText}</div>
        </div>
      </div>
    `;
  }).join("");
}

/* ========== OFFLINE ========== */
const offlinePopup = $("offlinePopup");
const offlineTime = $("offlineTime");
const offlineAmount = $("offlineAmount");
const offlineCollectBtn = $("offlineCollectBtn");

function openOfflinePopup(awaySec, earned) {
  if (!offlinePopup || !offlineTime || !offlineAmount) return;
  offlineTime.textContent = `You were away for ${formatTime(awaySec)}`;
  offlineAmount.textContent = `+${formatNum(earned)}`;
  offlinePopup.classList.add("active");
}
function closeOfflinePopup() {
  if (offlinePopup) offlinePopup.classList.remove("active");
}
if (offlineCollectBtn) {
  offlineCollectBtn.addEventListener("click", () => {
    if (pendingOfflineFish > 0) {
      score += pendingOfflineFish;
      stats.totalFishEarned += pendingOfflineFish;
      pendingOfflineFish = 0;
      updateScore();
      saveGame();
      playRewardSound();
    }
    closeOfflinePopup();
  });
}
function getOfflineMultiplier(data, now = Date.now()) {
  return (data.rebirthMultiplier || 1)
    * (data.vipActive ? 10 : 1)
    * (data.imperialActive ? 100 : 1)
    * ((now < (data.potions?.fish || 0)) ? 5 : 1)
    * ((now < (data.potions?.speed || 0)) ? 2 : 1);
}
function saveHasAtomicPet(data) {
  return Array.isArray(data?.petSystem?.inventory) && data.petSystem.inventory.some(p => p && p.key === "atomicsupercat");
}
function getOfflineRewardData(data, now = Date.now()) {
  if (!data || !data.lastOnline) return { diffSec: 0, offlineSec: 0, earned: 0, crystals: 0, stell: 0 };
  const diffSec = Math.floor((now - data.lastOnline) / 1000);
  if (diffSec < OFFLINE_MIN_SECONDS) return { diffSec, offlineSec: 0, earned: 0, crystals: 0, stell: 0 };
  const offlineSec = Math.min(diffSec, OFFLINE_MAX_SECONDS);
  const earned = Math.floor((data.autoClicker || 0) * offlineSec * getOfflineMultiplier(data, now) * OFFLINE_EFFICIENCY);
  const hasAtomic = saveHasAtomicPet(data);
  const offlineMinutes = Math.floor(offlineSec / 60);
  const offlineCrystals = hasAtomic ? offlineMinutes * 500 : 0;
  const offlineStell = hasAtomic ? offlineMinutes * 100 : 0;
  return { diffSec, offlineSec, earned, crystals: offlineCrystals, stell: offlineStell };
}
function processOfflineProgress(data) {
  const reward = getOfflineRewardData(data);
  if (reward.earned <= 0 && reward.crystals <= 0 && reward.stell <= 0) return false;
  pendingOfflineFish += reward.earned;
  if (reward.crystals > 0) crystals += reward.crystals;
  if (reward.stell > 0) stell += reward.stell;
  openOfflinePopup(reward.offlineSec, pendingOfflineFish);
  if (reward.crystals > 0 || reward.stell > 0) showNotification(`Offline Atomic: +${formatNum(reward.crystals)} amethysts, +${formatNum(reward.stell)} Stell`, "#00ffaa", 3500);
  updateScore();
  return true;
}

/* ========== SAVE / LOAD ========== */
function buildSaveData(lastOnlineOverride = Date.now()) {
  return {
    score, crystals, stell, clickPower, autoClicker, goldClicks, diamondClicks,
    rebirthCount, rebirthMultiplier, potions, vipActive, imperialActive,
    shopOwned: shopItemsData.map(i => i.owned),
    petSystem: window.petSystemApi?.getSaveData?.() || undefined,
    stats, profile, playerId, settings, usedPromoCodes, localAdminGranted, cometCycleStartedAt, cometSystemEnabled,
    lastOnline: lastOnlineOverride
  };
}
function readLocalSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Local save parse failed", e);
    return null;
  }
}
function persistSaveData(data) {
  if (suppressPersistenceForLogout) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  if (currentUser && window.fb) {
    try { window.fb.set(window.fb.ref(window.fb.db, `users/${currentUser.uid}`), data); }
    catch (e) { console.warn("Cloud save failed", e); }
  }
}
function applySaveData(data) {
  if (!data) return;
  score = data.score || 0;
  crystals = data.crystals || 0;
  stell = data.stell || 0;
  clickPower = data.clickPower || 1;
  autoClicker = data.autoClicker || 0;
  goldClicks = data.goldClicks || 0;
  diamondClicks = data.diamondClicks || 0;
  if (data.rebirthCount !== undefined) rebirthCount = data.rebirthCount;
  if (data.rebirthMultiplier !== undefined) rebirthMultiplier = data.rebirthMultiplier;
  if (data.potions) potions = data.potions;
  vipActive = !!data.vipActive;
  imperialActive = !!data.imperialActive;
  if (data.shopOwned) {
    data.shopOwned.forEach((count, i) => {
      if (shopItemsData[i]) shopItemsData[i].owned = count;
    });
  }
  if (data.stats) stats = { ...stats, ...data.stats };
  if (data.profile) profile = { ...profile, ...data.profile };
  if (data.playerId) playerId = data.playerId;
  ensurePlayerId();
  if (data.settings) settings = { ...settings, ...data.settings };
  recoveryCode = null;
  if (data.usedPromoCodes) usedPromoCodes = data.usedPromoCodes;
  localAdminGranted = !!data.localAdminGranted;
  if (data.cometCycleStartedAt) cometCycleStartedAt = data.cometCycleStartedAt;
  if (data.cometSystemEnabled !== undefined) cometSystemEnabled = data.cometSystemEnabled !== false;
  soundEnabled = settings.soundEnabled !== false;
  updateScore();
  updateIncome();
  updateWaveBars();
  applyProfile();
  applySettings();
  updateRecoveryDisplay();
  updatePotionStatusBar();
  try { if (data.petSystem && window.petSystemApi?.applySaveData) window.petSystemApi.applySaveData(data.petSystem); } catch (e) {}
  grantVipPetIfPossible();
  grantImperialPetIfPossible();
}
function saveGame(lastOnlineOverride = Date.now()) {
  persistSaveData(buildSaveData(lastOnlineOverride));
}
function writeAutoBackupSnapshot() {
  try {
    const payload = createSaveFilePayload();
    const backups = JSON.parse(localStorage.getItem(AUTO_BACKUP_STORAGE_KEY) || "[]");
    backups.unshift({ timestamp: Date.now(), payload });
    localStorage.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify(backups.slice(0, AUTO_BACKUP_LIMIT)));
  } catch (e) { console.warn("Auto backup failed", e); }
}
function loadGame() {
  const data = readLocalSave();
  if (!data) return;
  applySaveData(data);
  processOfflineProgress(data);
}
function saveOnBackground() {
  if (suppressPersistenceForLogout) return;
  lastHiddenAt = Date.now();
  saveGame(lastHiddenAt);
}
function resumeFromBackground() {
  const now = Date.now();
  if (now - lastResumeHandledAt < 1500) return;
  lastResumeHandledAt = now;
  const data = readLocalSave() || buildSaveData(lastHiddenAt || now);
  if (!data.lastOnline && lastHiddenAt) data.lastOnline = lastHiddenAt;
  processOfflineProgress(data);
  saveGame(now);
  lastHiddenAt = null;
}
function getLeaderboardSignature() {
  return [
    stats.totalFishEarned,
    stats.totalClicks,
    stats.playTimeSec,
    rebirthCount,
    crystals,
    getEggsOpenedCount(),
    vipActive ? 1 : 0,
    imperialActive ? 1 : 0,
    playerId || "",
    profile.name || "",
    profile.avatar ? 1 : 0,
    isRegisteredUser() ? 1 : 0
  ].join("|");
}
setInterval(() => saveGame(), 5000);
setInterval(() => { stats.playTimeSec++; }, 1000);
setInterval(() => {
  updatePotionStatusBar();
  if (potionMenu && potionMenu.classList.contains("active")) renderPotionShop();
}, 1000);
setInterval(() => {
  const passiveCrystals = getPetPassiveCrystalsPerMinute();
  const passiveStell = getPetPassiveStellPerMinute();
  if (passiveCrystals > 0 || passiveStell > 0) {
    crystals += passiveCrystals;
    stell += passiveStell;
    updateScore();
    saveGame();
  }
  writeAutoBackupSnapshot();
}, 60000);
setInterval(() => {
  const signature = getLeaderboardSignature();
  const uid = currentUser && currentUser.uid;
  if (shouldBlockLeaderboardForUid(uid)) { lastLeaderboardSignature = signature; return; }
  if (currentUser && signature !== lastLeaderboardSignature) {
    pushToLeaderboard();
  }
}, 10000);
setInterval(() => {
  if (currentUser) { try { updateActivePlayerPresence(); } catch (e) {} }
}, 30000);

/* ========== INCOME ========== */
function updateIncome() {
  if (!incomeClick || !incomeSec) return;
  incomeClick.textContent = `+${formatNum(getClickIncome())}/click`;
  incomeSec.textContent = `+${formatNum(getAutoIncome())}/sec`;
}

/* ========== \u041A\u041B\u0418\u041A ========== */
if (catBtn) {
  catBtn.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastClickTime < CLICK_DELAY) return;
    lastClickTime = now;
    catBtn.classList.add("clicked");
    setTimeout(() => catBtn.classList.remove("clicked"), 120);
    playCatClick();
    const totalFish = getClickIncome();
    const fishToSpawn = Math.min(MAX_FISH - activeFish, 3);
    for (let i = 0; i < fishToSpawn; i++) setTimeout(() => spawnFlyingFish(), i * 60);
    score += totalFish;
    stats.totalClicks++;
    try { getPetApi()?.onAtomicClick?.(); } catch (e) {}
    stats.totalFishEarned += totalFish;
    if (activeWaveType === "amethyst" && Math.random() < 0.10) {
      crystals += 1;
      spawnFlyingCrystal();
      showNotification("+1 Amethyst!", "#c084fc", 900);
    }
    if (!waveActive) { goldClicks++; diamondClicks++; checkWaves(); }
    updateScore();
    updateWaveBars();
  });
  catBtn.addEventListener("mousedown", (e) => e.preventDefault());
}
function updateScore() {
  if (scoreText) scoreText.textContent = formatNum(score);
  if (crystalText) crystalText.textContent = formatNum(crystals);
  if (stellText) stellText.textContent = formatNum(stell);
  updateIncome();
  updatePotionStatusBar();
  renderShop();
}

/* ========== COMET EVENT ========== */
function getCometPhase(now = Date.now()) {
  if (!cometCycleStartedAt) cometCycleStartedAt = now;
  let elapsed = (now - cometCycleStartedAt) % COMET_CYCLE_MS;
  if (elapsed < 0) elapsed += COMET_CYCLE_MS;
  if (elapsed < COMET_COOLDOWN_MS) {
    return { active: false, remaining: COMET_COOLDOWN_MS - elapsed, elapsed };
  }
  return { active: true, remaining: COMET_CYCLE_MS - elapsed, elapsed };
}
function formatCometTimer(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function updateCometEvent() {
  if (!cometSystemEnabled) {
    if (cometTimer) cometTimer.style.display = "none";
    if (cometEventBtn) cometEventBtn.style.display = "none";
    if (cometEventActive) { cometEventActive = false; stopCometEventEffects(); updateLobbyMusic(); }
    return;
  }
  if (cometTimer) cometTimer.style.display = "";
  if (cometEventBtn) cometEventBtn.style.display = "";
  const phase = getCometPhase();
  if (cometTimer) {
    cometTimer.textContent = phase.active ? `☄ EVENT ${formatCometTimer(phase.remaining)}` : `☄ ${formatCometTimer(phase.remaining)}`;
    cometTimer.classList.toggle("active", phase.active);
  }
  if (cometEventBtn) cometEventBtn.classList.toggle("active", phase.active);
  if (phase.active !== cometEventActive) {
    cometEventActive = phase.active;
    if (phase.active) startCometEventEffects();
    else stopCometEventEffects();
    updateLobbyMusic();
  }
}
function startCometEventEffects() {
  showNotification("☄ COMET EVENT STARTED!\nClick comets to earn Stell!", "#c084fc", 3500);
  if (settings.musicEnabled !== false) playCometMusic();
  if (cometSpawnTimer) clearInterval(cometSpawnTimer);
  cometSpawnTimer = setInterval(() => {
    if (cometEventActive) spawnFallingComet();
  }, 5000);
  setTimeout(spawnFallingComet, 400);
}
function stopCometEventEffects() {
  if (cometSpawnTimer) { clearInterval(cometSpawnTimer); cometSpawnTimer = null; }
  showNotification("☄ Comet event ended!", "#c084fc", 2500);
  if (cometMusic) cometMusic.pause();
  if (settings.musicEnabled !== false) playLobbyMusic();
}
function forceStartCometEvent() {
  cometSystemEnabled = true;
  cometCycleStartedAt = Date.now() - COMET_COOLDOWN_MS;
  saveGame();
  updateCometEvent();
}
function setCometSystemEnabled(enabled) {
  cometSystemEnabled = enabled !== false;
  if (!cometSystemEnabled) {
    if (cometSpawnTimer) { clearInterval(cometSpawnTimer); cometSpawnTimer = null; }
    document.querySelectorAll(".falling-comet").forEach(c => c.remove());
    activeComets = 0;
  }
  saveGame();
  updateCometEvent();
}
function resetCometTimer() {
  cometCycleStartedAt = Date.now();
  saveGame();
  updateCometEvent();
}
function listenCometConfig() {
  if (cometConfigListening || !window.fb) return;
  cometConfigListening = true;
  try {
    window.fb.onValue(window.fb.ref(window.fb.db, "cometConfig"), (snap) => {
      const cfg = snap.val() || {};
      if (cfg.enabled !== undefined) cometSystemEnabled = cfg.enabled !== false;
      if (cfg.cycleStartedAt) cometCycleStartedAt = cfg.cycleStartedAt;
      updateCometEvent();
    });
  } catch (e) { cometConfigListening = false; console.warn("Comet config listen failed", e); }
}
function setCometImageWithFallback(img) {
  const sources = ["Comet.png", "comet.png", "Comet.PNG"];
  let idx = 0;
  img.onerror = () => {
    idx++;
    if (idx < sources.length) img.src = sources[idx];
    else {
      img.onerror = null;
      img.removeAttribute("src");
      img.classList.add("comet-fallback");
      img.alt = "☄";
    }
  };
  img.src = sources[0];
}
function spawnFallingComet() {
  if (!cometEventActive || activeComets >= MAX_ACTIVE_COMETS) return;
  activeComets++;
  const comet = document.createElement("img");
  setCometImageWithFallback(comet);
  const isFast = Math.random() < 0.25;
  comet.className = "falling-comet" + (isFast ? " fast-comet" : "");
  comet.dataset.rewardMult = isFast ? "2" : "1";
  const size = isFast ? (34 + Math.random() * 44) : (42 + Math.random() * 92);
  const startX = Math.random() * (window.innerWidth - size);
  const endX = startX + (Math.random() - 0.5) * (isFast ? 380 : 220);
  const startY = -size - 30;
  const endY = window.innerHeight + size + 40;
  const duration = isFast ? (1800 + Math.random() * 1400) : (5200 + Math.random() * 4200);
  comet.style.setProperty("--size", `${size}px`);
  comet.style.setProperty("--spin", `${isFast ? 1.8 + Math.random() * 1.8 : 5 + Math.random() * 8}s`);
  comet.style.left = startX + "px";
  comet.style.top = startY + "px";
  document.body.appendChild(comet);
  let collected = false;
  comet.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (collected) return;
    collected = true;
    collectComet(comet);
  });
  const start = performance.now();
  function anim(now) {
    if (collected || !comet.parentNode) return;
    const t = Math.min((now - start) / duration, 1);
    comet.style.left = (startX + (endX - startX) * t) + "px";
    comet.style.top = (startY + (endY - startY) * t) + "px";
    comet.style.opacity = String(1 - Math.max(0, t - 0.82) / 0.18);
    if (t < 1) requestAnimationFrame(anim);
    else { comet.remove(); activeComets = Math.max(0, activeComets - 1); }
  }
  requestAnimationFrame(anim);
  if (getPetApi()?.hasAtomicPet?.()) {
    setTimeout(() => {
      if (!collected && comet.parentNode && cometEventActive) {
        collected = true;
        collectComet(comet);
      }
    }, isFast ? 450 : 900);
  }
}
function collectComet(comet) {
  const rect = comet.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  comet.remove();
  activeComets = Math.max(0, activeComets - 1);
  const mult = Number(comet.dataset.rewardMult || 1) || 1;
  const gained = (1 + Math.floor(Math.random() * 10)) * mult;
  stell += gained;
  updateScore();
  saveGame();
  showNotification(`+${gained} Stell`, "#ff9dfb", 1200);
  shakeCometScreen();
  spawnCometExplosion(x, y);
  playRewardSound();
}
function shakeCometScreen() {
  document.body.classList.remove("comet-shake");
  void document.body.offsetWidth;
  document.body.classList.add("comet-shake");
  setTimeout(() => document.body.classList.remove("comet-shake"), 320);
}
function spawnCometExplosion(x, y) {
  const colors = ["#ff3b00", "#ff7a00", "#ffd24a", "#ff004c", "#b300ff"];
  for (let i = 0; i < 24; i++) {
    const p = document.createElement("span");
    p.className = "comet-fire-particle";
    const a = Math.random() * Math.PI * 2;
    const d = 35 + Math.random() * 110;
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.color = colors[Math.floor(Math.random() * colors.length)];
    p.style.setProperty("--color", p.style.color);
    p.style.setProperty("--dx", `${Math.cos(a) * d}px`);
    p.style.setProperty("--dy", `${Math.sin(a) * d}px`);
    document.body.appendChild(p);
    p.addEventListener("animationend", () => p.remove(), { once: true });
  }
}
setInterval(updateCometEvent, 1000);

const STELL_EGG_COST = 100;
function buyStellEgg(count = 1) {
  const amount = Math.max(1, Math.min(100, parseInt(count, 10) || 1));
  const totalCost = STELL_EGG_COST * amount;
  if (!window.petSystemApi || typeof window.petSystemApi.openStellEgg !== "function") {
    alert("Pet system is not ready yet.");
    return;
  }
  if (stell < totalCost) {
    showNotification(`Need ${formatNum(totalCost)} Stell!`, "#ff66ff", 2200);
    return;
  }
  stell -= totalCost;
  updateScore();
  const res = window.petSystemApi.openStellEgg(amount);
  if (!res || !res.ok) {
    stell += totalCost;
    updateScore();
    alert(res?.error || "Cannot open Stell Egg");
    return;
  }
  saveGame();
}
if (buyStellEgg1Btn) buyStellEgg1Btn.addEventListener("click", () => buyStellEgg(1));
if (buyStellEgg10Btn) buyStellEgg10Btn.addEventListener("click", () => buyStellEgg(10));
if (buyStellEgg100Btn) buyStellEgg100Btn.addEventListener("click", () => buyStellEgg(100));

/* ========== \u0412\u041E\u041B\u041D\u042B ========== */
function updateWaveBars() {
  if (goldFill) goldFill.style.width = Math.min((goldClicks / GOLD_REQUIRED) * 100, 100) + "%";
  if (diamondFill) diamondFill.style.width = Math.min((diamondClicks / DIAMOND_REQUIRED) * 100, 100) + "%";
}
function checkWaves() {
  if (diamondClicks >= DIAMOND_REQUIRED) { diamondClicks = 0; startWave("diamond", 5, 10); }
  else if (goldClicks >= GOLD_REQUIRED) { goldClicks = 0; startWave("gold", 2, 5); }
}
function clearWaveVisuals() {
  if (waveGlow) waveGlow.className = "wave-glow";
  if (multBadge) multBadge.className = "multiplier-badge";
  if (goldBg) goldBg.classList.remove("active-wave");
  if (diamondBg) diamondBg.classList.remove("active-wave");
  if (goldTimer) goldTimer.textContent = "";
  if (diamondTimer) diamondTimer.textContent = "";
}
function startWave(type, multiplier, duration) {
  // Wave bug fix: every wave has a token. Old timers from previous/overlapped waves
  // cannot reset the current multiplier anymore.
  if (activeWaveTimer) {
    clearInterval(activeWaveTimer);
    clearTimeout(activeWaveTimer);
    activeWaveTimer = null;
  }
  clearWaveVisuals();
  const token = ++activeWaveToken;

  waveActive = true;
  waveMultiplier = multiplier;
  activeWaveType = type;
  if (type === "gold") stats.goldWaves++;
  else if (type === "diamond") stats.diamondWaves++;
  playWaveSound(type);
  if (settings.glowEnabled && waveGlow) waveGlow.className = "wave-glow active " + type;
  if (multBadge) {
    multBadge.textContent = type === "amethyst"
      ? "AMETHYST EVENT • 10%/click"
      : `x${multiplier} ${type==="gold"?"GOLDEN":(type==="diamond"?"DIAMOND":(type==="rainbow"?"RAINBOW":"AMETHYST"))} WAVE`;
    let cls = "multiplier-badge active";
    if (type === "diamond") cls += " diamond-text";
    else if (type === "rainbow") cls += " rainbow-text";
    else if (type === "amethyst") cls += " amethyst-text";
    multBadge.className = cls;
  }
  if (type === "gold" || type === "diamond") {
    const bg = type === "gold" ? goldBg : diamondBg;
    if (bg) bg.classList.add("active-wave");
    const timerEl = type === "gold" ? goldTimer : diamondTimer;
    let remaining = duration;
    if (timerEl) timerEl.textContent = remaining + "s";
    updateIncome();
    activeWaveTimer = setInterval(() => {
      if (token !== activeWaveToken) return;
      remaining--;
      if (timerEl) timerEl.textContent = remaining + "s";
      if (remaining <= 0) endWave(type, token);
    }, 1000);
  } else {
    updateIncome();
    activeWaveTimer = setTimeout(() => endWave(type, token), duration * 1000);
  }
  updateWaveBars();
}
function endWave(type, token = null) {
  if (token !== null && token !== activeWaveToken) return;
  activeWaveToken++;
  if (activeWaveTimer) {
    clearInterval(activeWaveTimer);
    clearTimeout(activeWaveTimer);
    activeWaveTimer = null;
  }
  waveActive = false;
  waveMultiplier = 1;
  activeWaveType = null;
  clearWaveVisuals();
  updateIncome();
  updateWaveBars();
}
function queueWavesSequentially(waves) {
  let idx = 0;
  function next() {
    if (idx >= waves.length) return;
    const w = waves[idx++];
    if (w.type === "gold") { startWave("gold", 2, 5); setTimeout(next, 5000); }
    else if (w.type === "diamond") { startWave("diamond", 5, 10); setTimeout(next, 10000); }
  }
  if (waveActive) {
    const waitInterval = setInterval(() => {
      if (!waveActive) { clearInterval(waitInterval); next(); }
    }, 500);
  } else { next(); }
}
setInterval(() => {
  if (autoClicker > 0) {
    const earned = getAutoIncome();
    score += earned;
    stats.totalFishEarned += earned;
    updateScore();
  }
}, 1000);

/* ========== \u0420 \u042B\u0411\u041A\u0410 ========== */
function spawnFlyingFish() {
  if (activeFish >= MAX_FISH || !catBtn || !scoreBar) return;
  activeFish++;
  const fish = document.createElement("img");
  fish.src = "FishIcon1.png";
  fish.classList.add("flying-fish");
  document.body.appendChild(fish);
  const btnRect = catBtn.getBoundingClientRect();
  const angle = Math.random() * Math.PI * 2;
  const offset = 20 + Math.random() * 30;
  const startX = btnRect.left + btnRect.width / 2 - 16 + Math.cos(angle) * offset;
  const startY = btnRect.top + btnRect.height / 2 - 16 + Math.sin(angle) * offset;
  const barRect = scoreBar.getBoundingClientRect();
  const endX = barRect.left + 18 - 16;
  const endY = barRect.top + barRect.height / 2 - 16;
  fish.style.left = startX + "px";
  fish.style.top = startY + "px";
  const arcSide = (Math.random() - 0.5) * 100;
  const arcUp = -(30 + Math.random() * 60);
  const duration = 900 + Math.random() * 300;
  const startTime = performance.now();
  function animateFish(now) {
    const elapsed = now - startTime;
    let t = Math.min(elapsed / duration, 1);
    t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const curve = Math.sin(Math.PI * t);
    fish.style.left = (startX + (endX - startX) * t + arcSide * curve) + "px";
    fish.style.top = (startY + (endY - startY) * t + arcUp * curve) + "px";
    fish.style.transform = `scale(${1 - t * 0.3})`;
    fish.style.opacity = 1 - t * 0.2;
    if (t < 1) { requestAnimationFrame(animateFish); }
    else {
      fish.remove(); activeFish--;
      scoreBar.style.transition = "transform 0.1s ease";
      scoreBar.style.transform = "translateX(-50%) scale(1.1)";
      setTimeout(() => { scoreBar.style.transform = "translateX(-50%) scale(1)"; }, 100);
    }
  }
  requestAnimationFrame(animateFish);
}

/* ========== \u0420\u0459\u0420 \u0418\u0421\u0422\u0410\u041B\u041B\u042B ========== */
function spawnFlyingCrystal() {
  if (!catBtn || !crystalBar) return;
  const crystal = document.createElement("img");
  crystal.src = "CrystalIcon.png";
  crystal.classList.add("flying-crystal");
  document.body.appendChild(crystal);
  const btnRect = catBtn.getBoundingClientRect();
  const startX = btnRect.left + btnRect.width / 2 - 12 + (Math.random() - 0.5) * 40;
  const startY = btnRect.top + btnRect.height / 2 - 12 + (Math.random() - 0.5) * 40;
  const barRect = crystalBar.getBoundingClientRect();
  const endX = barRect.left + 14 - 12;
  const endY = barRect.top + barRect.height / 2 - 12;
  crystal.style.left = startX + "px";
  crystal.style.top = startY + "px";
  const duration = 800 + Math.random() * 200;
  const startTime = performance.now();
  function anim(now) {
    const elapsed = now - startTime;
    let t = Math.min(elapsed / duration, 1);
    t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const curve = Math.sin(Math.PI * t);
    crystal.style.left = (startX + (endX - startX) * t) + "px";
    crystal.style.top = (startY + (endY - startY) * t - 40 * curve) + "px";
    crystal.style.transform = `scale(${1 - t * 0.3})`;
    crystal.style.opacity = 1 - t * 0.2;
    if (t < 1) { requestAnimationFrame(anim); }
    else {
      crystal.remove();
      crystalBar.style.transition = "transform 0.1s ease";
      crystalBar.style.transform = "translateX(-50%) scale(1.2)";
      setTimeout(() => { crystalBar.style.transform = "translateX(-50%) scale(1)"; }, 100);
    }
  }
  requestAnimationFrame(anim);
}

/* ========== \u041C\u0415\u041D\u042E ========== */
const overlay = $("overlay");
const shopMenu = $("shopMenu");
const potionMenu = $("potionMenu");
const settingsMenu = $("settingsMenu");
const profileMenu = $("profileMenu");
const authMenu = $("authMenu");
const chatMenu = $("chatMenu");
const tradeMenu = $("tradeMenu");
const cometEventMenu = $("cometEventMenu");
const topMenu = $("topMenu");
const adminMenu = $("adminMenu");

function openMenu(menu) {
  if (!menu) return;
  closeAllMenus();
  if (overlay) overlay.classList.add("active");
  menu.classList.add("active");
  if (menu === shopMenu) renderShop();
  if (menu === potionMenu) renderPotionShop();
  if (menu === profileMenu) renderStats();
  if (menu === authMenu) renderAuthMenu();
  if (menu === chatMenu) openChat();
  if (menu === tradeMenu) openTrades();
  if (menu === cometEventMenu) updateScore();
  if (menu === topMenu) loadTop();
}
function closeAllMenus() {
  if (overlay) overlay.classList.remove("active");
  [shopMenu, potionMenu, settingsMenu, profileMenu, authMenu, chatMenu, tradeMenu, cometEventMenu, topMenu, adminMenu].forEach(m => {
    if (m) m.classList.remove("active");
  });
}
on("shopBtn", "click", () => openMenu(shopMenu));
on("potionShopBtn", "click", () => openMenu(potionMenu));
on("settingsBtn", "click", () => openMenu(settingsMenu));
on("profileBtn", "click", () => openMenu(profileMenu));
on("accountBtn", "click", () => openMenu(authMenu));
on("adminOpenBtn", "click", () => {
  const uid = currentUser && currentUser.uid;
  if (!uid) {
    alert("Firebase auth is not ready yet. Wait a few seconds and try again.");
    return;
  }
  if (!canUseAdmin(uid)) {
    alert(
      "No admin rights for this UID:\n\n" + uid +
      "\n\nAdd this UID to ADMIN_UIDS in game.js or to Firebase /admins/" + uid + "/active = true"
    );
    return;
  }
  isAdmin = true;
  openMenu(adminMenu);
});
on("chatBtn", "click", () => openMenu(chatMenu));
on("tradeBtn", "click", () => openMenu(tradeMenu));
on("cometEventBtn", "click", () => openMenu(cometEventMenu));
on("topBtn", "click", () => openMenu(topMenu));
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", closeAllMenus);
});
if (overlay) overlay.addEventListener("click", closeAllMenus);

/* ========== \u041C\u0410\u0413\u0410\u0417\u0418\u041D ========== */
const shopItemsEl = $("shopItems");
function renderShop() {
  if (!shopItemsEl) return;
  shopItemsEl.innerHTML = "";
  document.querySelectorAll(".shop-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.shopTab === currentShopTab);
  });
  if (currentShopTab === "rebirth") {
    const cost = getRebirthCost();
    const canBuy = score >= cost;
    const el = document.createElement("div");
    el.className = "shop-item rebirth-item" + (canBuy ? "" : " locked");
    el.innerHTML = `
      <div class="item-info">
        <div class="item-name">✨ REBIRTH #${rebirthCount + 1}</div>
        <div class="item-desc">Reset all. Keep crystals & stats. x${(rebirthMultiplier * 1.5).toFixed(2)} fish!</div>
      </div>
      <div>
        <div class="item-price"><img src="FishIcon1.png" alt="fish" />${formatNum(cost)}</div>
        <div class="item-owned">Done: ${rebirthCount}</div>
      </div>
    `;
    if (canBuy) {
      el.addEventListener("click", () => { doRebirth(); playBuySound(); });
    }
    shopItemsEl.appendChild(el);
    return;
  }
  const items = shopItemsData.filter(i => i.category === currentShopTab);
  for (const item of items) {
    const price = getPrice(item);
    const canBuy = score >= price;
    const el = document.createElement("div");
    el.className = "shop-item" + (canBuy ? "" : " locked");
    el.innerHTML = `
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
      </div>
      <div>
        <div class="item-price"><img src="FishIcon1.png" alt="fish" />${formatNum(price)}</div>
        <div class="item-owned">x${item.owned}</div>
      </div>
    `;
    if (canBuy) {
      el.addEventListener("click", () => {
        score -= price;
        item.owned++;
        applyUpgradeItem(item);
        stats.itemsBought++;
        playBuySound();
        updateScore();
        saveGame();
      });
    }
    shopItemsEl.appendChild(el);
  }
}
document.querySelectorAll(".shop-tab").forEach(tab => {
  tab.addEventListener("click", () => { currentShopTab = tab.dataset.shopTab; renderShop(); });
});

/* ========== \u0420\u045C\u0420\u0452\u0420\u040E\u0420\u045E\u0420 \u041E\u0419\u041A\u0418 ========== */
const glowToggle = $("glowToggle");
const soundToggle = $("soundToggle");
const musicToggle = $("musicToggle");
on("glowToggle", "click", () => {
  settings.glowEnabled = !settings.glowEnabled;
  applySettings(); saveGame();
  if (waveGlow) {
    if (!settings.glowEnabled) waveGlow.className = "wave-glow";
    else if (waveActive && activeWaveType) waveGlow.className = "wave-glow active " + activeWaveType;
  }
});
on("soundToggle", "click", () => {
  settings.soundEnabled = !settings.soundEnabled;
  soundEnabled = settings.soundEnabled;
  applySettings(); saveGame();
});
on("musicToggle", "click", () => {
  musicUserInteracted = true;
  settings.musicEnabled = settings.musicEnabled === false;
  applySettings();
  updateLobbyMusic();
  if (settings.musicEnabled !== false) playLobbyMusic();
  saveGame();
});
function applySettings() {
  if (settings.musicEnabled === undefined) settings.musicEnabled = true;
  if (glowToggle) glowToggle.classList.toggle("on", settings.glowEnabled);
  if (soundToggle) soundToggle.classList.toggle("on", settings.soundEnabled);
  if (musicToggle) musicToggle.classList.toggle("on", settings.musicEnabled !== false);
  const adminOpenRow = $("adminOpenRow");
  if (adminOpenRow) adminOpenRow.style.display = canUseAdmin(currentUser && currentUser.uid) ? "flex" : "none";
  updateLobbyMusic();
}
on("resetBtn", "click", async () => {
  if (!confirm("Reset ALL progress? This cannot be undone!")) return;
  localStorage.removeItem(SAVE_KEY);
  if (currentUser && window.fb) {
    try {
      await window.fb.remove(window.fb.ref(window.fb.db, `users/${currentUser.uid}`));
      await window.fb.remove(window.fb.ref(window.fb.db, `leaderboard/${currentUser.uid}`));
      if (recoveryCode) await window.fb.remove(window.fb.ref(window.fb.db, `recovery/${recoveryCode}`));
    } catch (e) { console.warn("Cloud reset failed", e); }
  }
  location.reload();
});

/* ========== \u0420\u045F\u0420 \u041E\u041C\u041E\u041A\u041E\u0414\u042B ========== */
async function applyPromoReward(reward) {
  if (!reward || typeof reward !== "object") return;
  if (reward.fish) { score += reward.fish; stats.totalFishEarned += reward.fish; }
  if (reward.crystals) crystals += reward.crystals;
  if (reward.stell) stell += reward.stell;
  if (reward.clickPower) clickPower += reward.clickPower;
  if (reward.autoClicker) autoClicker += reward.autoClicker;
  if (reward.petKey) {
    const count = Math.max(1, parseInt(reward.petCount || 1, 10) || 1);
    try { window.petSystemApi?.adminAddPets?.(reward.petKey, count, { silent: true }); } catch (e) {}
  }
  if (reward.eggPetKey) {
    const count = Math.max(1, parseInt(reward.eggCount || 1, 10) || 1);
    try { window.petSystemApi?.openForcedPetEgg?.(reward.eggPetKey, count); } catch (e) {}
  }
  if (reward.potionType && reward.potionMinutes) {
    const type = reward.potionType;
    const dur = Math.max(1, Number(reward.potionMinutes) || 1) * 60 * 1000;
    if (potions[type] !== undefined) potions[type] = Math.max(Date.now(), potions[type] || 0) + dur;
  }
  if (reward.waveType) {
    const count = Math.max(1, parseInt(reward.waveCount || 1, 10) || 1);
    const waves = [];
    for (let i = 0; i < count; i++) waves.push({ type: reward.waveType });
    if (reward.waveType === "comet") forceStartCometEvent();
    else if (reward.waveType === "gold" || reward.waveType === "diamond") queueWavesSequentially(waves);
    else if (reward.waveType === "rainbow") startWave("rainbow", 100, 300);
    else if (reward.waveType === "amethyst") startWave("amethyst", 1, 300);
  }
  if (reward.queueWaves && reward.queueWaves.length) queueWavesSequentially(reward.queueWaves);
}

async function activateDynamicPromoCode(code) {
  if (!window.fb) return false;
  const fb = window.fb;
  const snap = await fb.get(fb.ref(fb.db, `promoCodes/${code}`));
  const promo = snap.val();
  if (!promo || promo.active === false) return false;
  const uid = currentUser?.uid || ensurePlayerId();
  const usedBy = promo.usedBy || {};
  if (usedBy[uid] || usedPromoCodes.includes(code)) { alert("Code already used!"); return true; }
  const maxUses = Number(promo.maxUses || 1);
  const usedCount = Number(promo.usedCount || 0);
  if (maxUses > 0 && usedCount >= maxUses) { alert("Code use limit reached!"); return true; }
  await applyPromoReward(promo.rewards || {});
  usedPromoCodes.push(code);
  updateScore();
  updatePotionStatusBar();
  saveGame();
  try {
    await fb.update(fb.ref(fb.db, `promoCodes/${code}`), { usedCount: usedCount + 1, updatedAt: Date.now() });
    await fb.set(fb.ref(fb.db, `promoCodes/${code}/usedBy/${uid}`), { at: Date.now(), name: profile.name || "Anonymous" });
  } catch (e) { console.warn("Promo usage write failed", e); }
  playRewardSound();
  showNotification("✓ " + (promo.message || "Promo activated!"), "#4ade80", 4000);
  const inp = $("promoInput");
  if (inp) inp.value = "";
  return true;
}

async function activatePromoCode(rawCode) {
  if (!rawCode) return;
  const code = rawCode.trim().toUpperCase();
  try {
    const handledDynamic = await activateDynamicPromoCode(code);
    if (handledDynamic) return;
  } catch (e) { console.warn("Dynamic promo check failed", e); }
  if (!PROMO_CODES[code]) { alert("Invalid code!"); return; }
  if (usedPromoCodes.includes(code)) { alert("Code already used!"); return; }
  const reward = PROMO_CODES[code];
  await applyPromoReward(reward);
  usedPromoCodes.push(code);
  playBuySound();
  updateScore();
  saveGame();
  showNotification("✓ " + (reward.message || "Code activated!"), "#4ade80", 4000);
  const inp = $("promoInput");
  if (inp) inp.value = "";
}
on("promoBtn", "click", async () => {
  const inp = $("promoInput");
  if (inp) await activatePromoCode(inp.value);
});

function isUidAdmin(uid) {
  uid = uid ? String(uid) : "";
  return !!uid && (isHardcodedAdminUid(uid) || remoteAdminUids.includes(uid));
}

function canUseAdmin(uid = currentUser && currentUser.uid) {
  return !!uid && (isUidAdmin(uid) || localAdminGranted);
}

function normalizeAdminList(raw) {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw)
    .filter(([uid, val]) => {
      if (!uid) return false;
      if (val === true) return true;
      if (val && typeof val === "object") return val.active !== false;
      return false;
    })
    .map(([uid]) => uid);
}

function listenForAdminGrants() {
  if (!window.fb || adminGrantsListening) return;
  adminGrantsListening = true;
  try {
    const fb = window.fb;
    fb.onValue(fb.ref(fb.db, "admins"), (snap) => {
      remoteAdminUids = normalizeAdminList(snap.val());

      const uid = currentUser && currentUser.uid;
      const allowed = canUseAdmin(uid);

      if (uid && !allowed) {
        isAdmin = false;
        if (adminMenu && adminMenu.classList.contains("active")) closeAllMenus();
      }

      // Refresh Settings menu so ADMIN PANEL button appears right after /admins loads.
      try { applySettings(); } catch (e) { console.warn("Admin UI refresh failed", e); }

      window.dispatchEvent(new Event("admin-rights-updated"));
    });
  } catch (e) {
    adminGrantsListening = false;
    console.warn("Admin grants listen failed", e);
  }
}

/* ========== \u0421\u0415\u041A\u0420 \u0415\u0422\u041D\u042B\u0419 \u0412\u0425\u041E\u0414 ========== */
let settingsTapCount = 0;
let settingsTapTimer = null;
if (settingsMenu) {
  const settingsTitle = settingsMenu.querySelector(".menu-title");
  if (settingsTitle) {
    settingsTitle.addEventListener("click", () => {
      if (!currentUser || !canUseAdmin(currentUser.uid)) return;
      settingsTapCount++;
      clearTimeout(settingsTapTimer);
      settingsTapTimer = setTimeout(() => { settingsTapCount = 0; }, 3000);
      if (settingsTapCount >= 10) { settingsTapCount = 0; isAdmin = true; openMenu(adminMenu); }
    });
  }
}
function checkAdmin() {
  return isAdmin && currentUser && canUseAdmin(currentUser.uid);
}

/* ========== \u0420\u045F\u0420 \u041E\u0424\u0418\u041B\u042C ========== */
const avatarImg = $("avatarImg");
const avatarInput = $("avatarInput");
const nameInput = $("nameInput");
on("avatarInput", "change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    profile.avatar = ev.target.result;
    if (avatarImg) avatarImg.src = profile.avatar;
    saveGame();
  };
  reader.readAsDataURL(file);
});
on("nameInput", "input", (e) => {
  profile.name = sanitizePlayerName(e.target.value);
  e.target.value = profile.name;
  saveGame();
});
function applyProfile() {
  if (profile.avatar && avatarImg) avatarImg.src = profile.avatar;
  if (profile.name && nameInput) nameInput.value = profile.name;
}
function renderStats() {
  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  set("statTime", formatTime(stats.playTimeSec));
  set("statClicks", formatNum(stats.totalClicks));
  set("statFish", formatNum(stats.totalFishEarned));
  set("statCurrentFish", formatNum(score));
  set("statCrystals", formatNum(crystals));
  set("statRebirths", rebirthCount);
  set("statGoldWaves", stats.goldWaves);
  set("statDiamondWaves", stats.diamondWaves);
  set("statItems", stats.itemsBought);
  /* ---- Pet Stats (Option C) ---- */
  const petStats = window.petSystemApi ? window.petSystemApi.getPetStats() : null;
  if (petStats) {
    set("statPetFishMult", "x" + petStats.fishMult.toFixed(2));
    set("statPetAutoMult", "x" + petStats.autoMult.toFixed(2));
    set("statPetLuckMult", "x" + petStats.luckMult.toFixed(2));
    set("statPetCrystals", "+" + petStats.crystalsPerMin + "/min");
    set("statEquippedPets", petStats.equippedCount + " / 3");
  } else {
    set("statPetFishMult", "x1.00");
    set("statPetAutoMult", "x1.00");
    set("statPetLuckMult", "x1.00");
    set("statPetCrystals", "+0/min");
    set("statEquippedPets", "0 / 3");
  }
}

/* ========== GLOBAL CHAT ========== */
const chatMessagesEl = $("chatMessages");
const chatInput = $("chatInput");
const chatSendBtn = $("chatSendBtn");
const plazaPetSelect = $("plazaPetSelect");
const plazaFishPriceInput = $("plazaFishPriceInput");
const plazaPriceInput = $("plazaPriceInput");
const plazaStellPriceInput = $("plazaStellPriceInput");
const plazaListBtn = $("plazaListBtn");
const plazaListingsEl = $("plazaListings");
const plazaMySalesEl = $("plazaMySales");
const activePlayersListEl = $("activePlayersList");
const tradeRequestsListEl = $("tradeRequestsList");
let tradeListening = false;
let activeTradeTab = "plaza";
let cachedPlazaListings = [];
let cachedActivePlayers = [];
let cachedTradeRequests = [];
let cachedTradeSessions = [];
let activeTradeSessionId = null;
const finalizingTradeSessions = new Set();
const returningTradeSessions = new Set();
const tradeActionCooldowns = {};

function checkTradeCooldown(key, ms = 1200) {
  const now = Date.now();
  const until = tradeActionCooldowns[key] || 0;
  if (now < until) {
    showNotification("Cooldown...", "#ff6666", Math.min(1200, until - now + 200));
    return false;
  }
  tradeActionCooldowns[key] = now + ms;
  return true;
}

function startButtonCooldown(btn, ms = 1200) {
  if (!btn || btn.dataset.cooldown === "1") return;
  const isButton = btn.tagName === "BUTTON" || btn.tagName === "INPUT";
  const oldText = isButton ? btn.textContent : "";
  const oldPointerEvents = btn.style.pointerEvents || "";
  if (isButton) {
    btn.disabled = true;
    btn.textContent = "WAIT...";
  }
  btn.dataset.cooldown = "1";
  btn.style.pointerEvents = "none";
  btn.style.opacity = "0.65";
  setTimeout(() => {
    if (!btn.isConnected) return;
    if (isButton) {
      btn.disabled = false;
      btn.textContent = oldText;
    }
    btn.dataset.cooldown = "";
    btn.style.pointerEvents = oldPointerEvents;
    btn.style.opacity = "";
  }, ms);
}

async function saveCurrentUserDataToCloud() {
  saveGame();
  if (currentUser && window.fb) {
    await window.fb.set(window.fb.ref(window.fb.db, `users/${currentUser.uid}`), buildSaveData());
  }
}

function getOfferId(pet) {
  return String(pet?.offerId || pet?.id || pet?.originalPetId || "");
}

async function processReturnedTradeSessions(allSessions) {
  if (!window.fb || !currentUser) return;
  const myUid = currentUser.uid;
  for (const session of allSessions) {
    if (!session || !["cancelled", "failed"].includes(session.status)) continue;
    if (session.aUid !== myUid && session.bUid !== myUid) continue;
    if (session.returnedFor && session.returnedFor[myUid]) continue;
    if (returningTradeSessions.has(session.id)) continue;

    const myOffers = (session.offers?.[myUid] || []).filter(p => p && p.reserved);
    returningTradeSessions.add(session.id);
    try {
      for (const pet of myOffers) {
        const ret = getPetApiSafe()?.addPetFromTrade?.(pet);
        if (!ret || !ret.ok) console.warn("Trade return pet failed", ret?.error || pet);
      }
      if (myOffers.length) await saveCurrentUserDataToCloud();
      await window.fb.set(window.fb.ref(window.fb.db, `tradeSessions/${session.id}/returnedFor/${myUid}`), true);
      if (myOffers.length) showNotification("Trade cancelled: your pet(s) returned", "#ffd700", 2200);
    } catch (e) {
      console.warn("Trade return processing failed", e);
    } finally {
      returningTradeSessions.delete(session.id);
    }
  }
}

function renderTradeChatMessages(session) {
  const messages = Object.values(session.messages || {})
    .filter(m => m && typeof m === "object")
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .slice(-40);
  if (!messages.length) return `<div class="chat-muted">Trade chat is empty</div>`;
  return messages.map((msg) => {
    const mine = currentUser && msg.uid === currentUser.uid;
    return `
      <div class="chat-line ${mine ? "you" : ""}">
        <div class="chat-meta">
          <span class="chat-author ${mine ? "vip" : ""}">${escapeHtml(mine ? "YOU" : (msg.name || "Player"))}</span>
          <span class="chat-time">${formatChatTime(msg.createdAt)}</span>
        </div>
        <div class="chat-text">${escapeHtml(msg.text || "")}</div>
      </div>
    `;
  }).join("");
}

async function sendTradeChatMessage(session) {
  if (!window.fb || !currentUser || !session) return;
  if (!checkTradeCooldown(`tradechat_${session.id}`, 1200)) return;
  const input = document.getElementById("sessionChatInput");
  const text = cleanChatText(input && input.value);
  if (!text) return;
  const id = makeTradeId();
  const msg = { id, uid: currentUser.uid, name: getPlayerTradeName(), text, createdAt: Date.now() };
  try {
    await window.fb.set(window.fb.ref(window.fb.db, `tradeSessions/${session.id}/messages/${id}`), msg);
    if (input) input.value = "";
  } catch (e) { alert("Trade chat failed: " + e.message); }
}

function cleanChatText(text) {
  return String(text || "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}
function getChatName() {
  return sanitizePlayerName(profile.name) || "Anonymous";
}
function makeChatId() {
  return Date.now() + "_" + Math.random().toString(36).slice(2, 10);
}
function formatChatTime(ts) {
  const d = new Date(ts || Date.now());
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function renderChatMessages(list) {
  if (!chatMessagesEl) return;
  const msgs = (list || []).slice(-80);
  if (!msgs.length) {
    chatMessagesEl.innerHTML = `<div class="chat-muted">No messages yet. Say hello!</div>`;
    return;
  }
  chatMessagesEl.innerHTML = msgs.map((msg) => {
    const cls = ["chat-line", msg.type === "system" ? "system" : "", msg.eventType || "", msg.admin ? "admin" : ""].filter(Boolean).join(" ");
    const authorCls = msg.imperial ? "chat-author imperial" : (msg.vip ? "chat-author vip" : "chat-author");
    const author = msg.type === "system" ? (msg.author || "SYSTEM") : (msg.name || "Anonymous");
    return `
      <div class="${cls}">
        <div class="chat-meta">
          <span class="${authorCls}">${escapeHtml(author)}</span>
          <span class="chat-time">${formatChatTime(msg.createdAt)}</span>
        </div>
        <div class="chat-text">${escapeHtml(msg.text || "")}</div>
      </div>
    `;
  }).join("");
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}
function listenChat() {
  if (chatListening || !window.fb || !chatMessagesEl) return;
  chatListening = true;
  try {
    const fb = window.fb;
    fb.onValue(fb.ref(fb.db, "chatMessages"), (snap) => {
      const data = snap.val() || {};
      cachedChatMessages = Object.values(data)
        .filter((m) => m && typeof m === "object")
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        .slice(-100);
      renderChatMessages(cachedChatMessages);
    });
  } catch (e) {
    chatMessagesEl.innerHTML = `<div class="chat-muted">Chat unavailable: ${escapeHtml(e.message || String(e))}</div>`;
    chatListening = false;
  }
}
function openChat() {
  renderChatMessages(cachedChatMessages);
  listenChat();
  setTimeout(() => { if (chatInput) chatInput.focus(); }, 80);
}
async function sendChatMessage() {
  if (!window.fb || !currentUser) { alert("Chat is not ready yet."); return; }
  const text = cleanChatText(chatInput && chatInput.value);
  if (!text) return;
  const now = Date.now();
  if (now - chatLastSendAt < 2500 && !checkAdmin()) {
    showNotification("Chat cooldown...", "#ff6666", 1600);
    return;
  }
  chatLastSendAt = now;
  const msg = {
    id: makeChatId(),
    type: "user",
    uid: currentUser.uid,
    playerId: ensurePlayerId(),
    name: getChatName(),
    vip: !!vipActive,
    imperial: !!imperialActive,
    text,
    createdAt: now
  };
  try {
    await window.fb.set(window.fb.ref(window.fb.db, `chatMessages/${msg.id}`), msg);
    if (chatInput) chatInput.value = "";
  } catch (e) {
    alert("Chat send failed: " + e.message);
  }
}
async function postSystemChat(text, eventType = "system", extra = {}) {
  if (!window.fb || !currentUser) return;
  const clean = cleanChatText(text);
  if (!clean) return;
  const msg = {
    id: makeChatId(),
    type: "system",
    eventType,
    uid: currentUser.uid,
    author: extra.author || "SYSTEM",
    text: clean,
    playerId: ensurePlayerId(),
    name: getChatName(),
    vip: !!vipActive,
    imperial: !!imperialActive,
    admin: !!extra.admin,
    createdAt: Date.now()
  };
  try {
    await window.fb.set(window.fb.ref(window.fb.db, `chatMessages/${msg.id}`), msg);
  } catch (e) { console.warn("System chat failed", e); }
}
if (chatSendBtn) chatSendBtn.addEventListener("click", sendChatMessage);
if (chatInput) chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); sendChatMessage(); }
});

/* ========== TRADES ========== */
function getPetApiSafe() {
  return window.petSystemApi || null;
}
function getTradablePetsSafe() {
  return getPetApiSafe()?.getTradablePets?.() || [];
}
function makeTradeId() {
  return Date.now() + "_" + Math.random().toString(36).slice(2, 10);
}
function getPlayerTradeName() {
  return getChatName();
}
function setTradeTab(tab) {
  activeTradeTab = tab || "plaza";
  document.querySelectorAll("[data-trade-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.tradeTab === activeTradeTab));
  document.querySelectorAll("[data-trade-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.tradePanel === activeTradeTab));
  renderTradeUi();
}
document.querySelectorAll("[data-trade-tab]").forEach(btn => btn.addEventListener("click", () => setTradeTab(btn.dataset.tradeTab)));
function renderPlazaPetSelect() {
  if (!plazaPetSelect) return;
  const pets = getTradablePetsSafe();
  plazaPetSelect.innerHTML = pets.length
    ? pets.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} • ${escapeHtml(p.rarity)}</option>`).join("")
    : `<option value="">No tradable pets</option>`;
}
function getListingPrices(l) {
  return {
    fish: Number(l?.prices?.fish ?? 0) || 0,
    crystals: Number(l?.prices?.crystals ?? l?.price ?? 0) || 0,
    stell: Number(l?.prices?.stell ?? 0) || 0
  };
}
function formatListingPrice(l) {
  const p = getListingPrices(l);
  const parts = [];
  if (p.fish > 0) parts.push(`${formatNum(p.fish)} fish`);
  if (p.crystals > 0) parts.push(`${formatNum(p.crystals)} amethysts`);
  if (p.stell > 0) parts.push(`${formatNum(p.stell)} Stell`);
  return parts.length ? parts.join(" + ") : "FREE";
}
function renderPlaza() {
  renderPlazaPetSelect();
  if (!currentUser) return;
  const activeListings = cachedPlazaListings.filter(l => l.status === "active" && l.sellerUid !== currentUser.uid).slice(0, 80);
  const mySales = cachedPlazaListings.filter(l => l.sellerUid === currentUser.uid && ["active", "sold"].includes(l.status)).slice(0, 80);
  if (plazaListingsEl) {
    plazaListingsEl.innerHTML = activeListings.length ? activeListings.map(l => `
      <div class="trade-card">
        <div class="trade-pet">${escapeHtml(l.pet?.name || "Pet")} • ${escapeHtml(l.pet?.rarity || "")}</div>
        <div class="trade-meta">Seller: ${escapeHtml(l.sellerName || "Player")}<br/>Price: ${formatListingPrice(l)}</div>
        <button class="recovery-btn ui-click" data-plaza-buy="${l.id}">BUY</button>
      </div>
    `).join("") : `<div class="chat-muted">No pets for sale yet</div>`;
  }
  if (plazaMySalesEl) {
    plazaMySalesEl.innerHTML = mySales.length ? mySales.map(l => `
      <div class="trade-card">
        <div class="trade-pet">${escapeHtml(l.pet?.name || "Pet")} • ${escapeHtml(l.pet?.rarity || "")}</div>
        <div class="trade-meta">Price: ${formatListingPrice(l)} • Status: ${escapeHtml(l.status)}</div>
        <div class="trade-actions">
          ${l.status === "active" ? `<button class="danger-btn ui-click" data-plaza-cancel="${l.id}">CANCEL</button>` : ""}
          ${l.status === "sold" ? `<button class="recovery-btn ui-click" data-plaza-claim="${l.id}">CLAIM ${formatListingPrice(l)}</button>` : ""}
        </div>
      </div>
    `).join("") : `<div class="chat-muted">No active sales</div>`;
  }
}
function renderActivePlayers() {
  if (!activePlayersListEl || !currentUser) return;
  const now = Date.now();
  const players = cachedActivePlayers
    .filter(p => p.uid && p.uid !== currentUser.uid && now - (p.lastSeen || 0) < 120000)
    .sort((a,b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  activePlayersListEl.innerHTML = players.length ? players.map(p => `
    <div class="trade-card active-player-card" data-request-player="${escapeHtml(p.uid)}">
      <div class="trade-pet ${p.imperial ? "imperial-name" : (p.vip ? "vip-name" : "")}">${escapeHtml((p.imperial ? "[Imperial] " : (p.vip ? "[VIP] " : "")) + (p.name || "Player"))}</div>
      <div class="trade-meta">UID: ${escapeHtml(p.uid)}<br/>Click to send trade request</div>
    </div>
  `).join("") : `<div class="chat-muted">No active players right now</div>`;
}
function renderTradeRequests() {
  if (!tradeRequestsListEl || !currentUser) return;
  const pending = cachedTradeRequests.filter(r => r.status === "pending");
  tradeRequestsListEl.innerHTML = pending.length ? pending.map(r => `
    <div class="trade-card">
      <div class="trade-pet">${escapeHtml(r.fromName || "Player")} wants to trade</div>
      <div class="trade-meta">From UID: ${escapeHtml(r.fromUid || "")}</div>
      <div class="trade-actions">
        <button class="recovery-btn ui-click" data-trade-request-accept="${r.id}">ACCEPT</button>
        <button class="danger-btn ui-click" data-trade-request-decline="${r.id}">DECLINE</button>
      </div>
    </div>
  `).join("") : `<div class="chat-muted">No trade requests</div>`;
}
function renderTradeUi() {
  renderPlaza();
  renderActivePlayers();
  renderTradeRequests();
  renderActiveTradeSession();
}
async function updateActivePlayerPresence() {
  if (!window.fb || !currentUser) return;
  try {
    await window.fb.set(window.fb.ref(window.fb.db, `activePlayers/${currentUser.uid}`), {
      uid: currentUser.uid,
      playerId: ensurePlayerId(),
      name: getPlayerTradeName(),
      vip: !!vipActive,
      imperial: !!imperialActive,
      lastSeen: Date.now()
    });
  } catch (e) { console.warn("Presence update failed", e); }
}
function listenTrades() {
  if (tradeListening || !window.fb || !currentUser) return;
  tradeListening = true;
  updateActivePlayerPresence();
  setInterval(updateActivePlayerPresence, 20000);
  try {
    window.fb.onValue(window.fb.ref(window.fb.db, "tradeListings"), (snap) => {
      cachedPlazaListings = Object.values(snap.val() || {}).filter(Boolean).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
      renderTradeUi();
    });
    window.fb.onValue(window.fb.ref(window.fb.db, "activePlayers"), (snap) => {
      cachedActivePlayers = Object.values(snap.val() || {}).filter(Boolean);
      renderTradeUi();
    });
    window.fb.onValue(window.fb.ref(window.fb.db, `tradeRequests/${currentUser.uid}`), (snap) => {
      cachedTradeRequests = Object.values(snap.val() || {}).filter(Boolean).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
      renderTradeUi();
    });
    window.fb.onValue(window.fb.ref(window.fb.db, "tradeSessions"), (snap) => {
      const allSessions = Object.values(snap.val() || {}).filter(Boolean);

      processReturnedTradeSessions(allSessions);

      allSessions.forEach((s) => {
        if (!s || s.status !== "active" || !currentUser) return;
        if (s.aUid !== currentUser.uid && s.bUid !== currentUser.uid) return;
        if (s.completedFor && s.completedFor[s.aUid] && s.completedFor[s.bUid]) {
          window.fb.update(window.fb.ref(window.fb.db, `tradeSessions/${s.id}`), {
            status: "completed",
            completedAt: Date.now()
          }).catch((e) => console.warn("Trade completion cleanup failed", e));
        }
      });

      cachedTradeSessions = allSessions.filter(s =>
        s &&
        s.status === "active" &&
        (s.aUid === currentUser.uid || s.bUid === currentUser.uid) &&
        !(s.completedFor && s.completedFor[currentUser.uid])
      );
      renderTradeUi();
    });
  } catch (e) { tradeListening = false; console.warn("Trade listen failed", e); }
}
function openTrades() {
  setTradeTab(activeTradeTab || "plaza");
  listenTrades();
  renderTradeUi();
}
async function listPetOnPlaza() {
  if (!checkTradeCooldown("plaza_list", 1500)) return;
  if (!window.fb || !currentUser) return alert("Firebase not ready");
  const petId = plazaPetSelect?.value;
  if (!petId) return alert("Choose a pet");
  const fishPrice = Math.max(0, parseNumInput(plazaFishPriceInput?.value || "0"));
  const price = Math.max(0, parseNumInput(plazaPriceInput?.value || "0"));
  const stellPrice = Math.max(0, parseNumInput(plazaStellPriceInput?.value || "0"));
  if ([fishPrice, price, stellPrice].some(isNaN)) return alert("Invalid price");
  const removed = getPetApiSafe()?.removePetForTrade?.(petId);
  if (!removed || !removed.ok) return alert(removed?.error || "Cannot list this pet");
  const id = makeTradeId();
  const listing = { id, sellerUid: currentUser.uid, sellerName: getPlayerTradeName(), pet: removed.pet, price, prices: { fish: fishPrice, crystals: price, stell: stellPrice }, status: "active", createdAt: Date.now() };
  try {
    await saveCurrentUserDataToCloud();
    await window.fb.set(window.fb.ref(window.fb.db, `tradeListings/${id}`), listing);
    renderPlazaPetSelect();
    showNotification("Pet listed!", "#4ade80", 2200);
  } catch (e) {
    getPetApiSafe()?.addPetFromTrade?.(removed.pet);
    try { await saveCurrentUserDataToCloud(); } catch (_) {}
    alert("List failed: " + e.message);
  }
}
async function buyPlazaListing(id) {
  if (!checkTradeCooldown(`plaza_buy_${id}`, 1800)) return;
  if (!window.fb || !currentUser) return;

  const localListing = cachedPlazaListings.find(x => x.id === id);
  if (!localListing || localListing.status !== "active" || localListing.sellerUid === currentUser.uid) return;

  try {
    const snap = await window.fb.get(window.fb.ref(window.fb.db, `tradeListings/${id}`));
    const l = snap.val();
    if (!l || l.status !== "active") return alert("This pet is already sold or unavailable.");
    if (l.sellerUid === currentUser.uid) return alert("You cannot buy your own listing.");

    const prices = getListingPrices(l);
    if (score < prices.fish) return alert("Not enough fish");
    if (crystals < prices.crystals) return alert("Not enough amethysts");
    if (stell < prices.stell) return alert("Not enough Stell");

    const petApi = getPetApiSafe();
    if (!petApi || typeof petApi.addPetFromTrade !== "function") return alert("Pet system is not ready yet.");
    if (typeof petApi.getFreeSlots === "function" && petApi.getFreeSlots() <= 0) return alert("No free pet slots");

    // Server first, local visuals second. If this write is denied, inventory stays unchanged.
    await window.fb.update(window.fb.ref(window.fb.db, `tradeListings/${id}`), {
      status: "sold",
      buyerUid: currentUser.uid,
      buyerName: getPlayerTradeName(),
      soldAt: Date.now()
    });

    const added = petApi.addPetFromTrade(l.pet);
    if (!added || !added.ok) {
      try {
        await window.fb.update(window.fb.ref(window.fb.db, `tradeListings/${id}`), {
          status: "active",
          buyerUid: null,
          buyerName: null,
          soldAt: null
        });
      } catch (rollbackErr) { console.warn("Listing rollback failed", rollbackErr); }
      return alert(added?.error || "Cannot receive pet");
    }

    score -= prices.fish;
    crystals -= prices.crystals;
    stell -= prices.stell;
    updateScore();
    await saveCurrentUserDataToCloud();
    showNotification("Pet bought!", "#4ade80", 2200);
  } catch (e) {
    alert("Buy failed: " + e.message);
  }
}
async function cancelPlazaListing(id) {
  if (!checkTradeCooldown(`plaza_cancel_${id}`, 1500)) return;
  const l = cachedPlazaListings.find(x => x.id === id);
  if (!l || !currentUser || l.sellerUid !== currentUser.uid || l.status !== "active") return;
  try {
    await window.fb.update(window.fb.ref(window.fb.db, `tradeListings/${id}`), { status: "cancelled", cancelledAt: Date.now() });
    const ret = getPetApiSafe()?.addPetFromTrade?.(l.pet);
    if (!ret || !ret.ok) {
      try { await window.fb.update(window.fb.ref(window.fb.db, `tradeListings/${id}`), { status: "active", cancelledAt: null }); } catch (_) {}
      return alert(ret?.error || "Cannot return pet");
    }
    await saveCurrentUserDataToCloud();
  }
  catch (e) { alert("Cancel failed: " + e.message); }
}
async function claimPlazaSale(id) {
  if (!checkTradeCooldown(`plaza_claim_${id}`, 1500)) return;
  const l = cachedPlazaListings.find(x => x.id === id);
  if (!l || !currentUser || l.sellerUid !== currentUser.uid || l.status !== "sold") return;
  const prices = getListingPrices(l);
  try {
    await window.fb.update(window.fb.ref(window.fb.db, `tradeListings/${id}`), { status: "claimed", claimedAt: Date.now() });
    score += prices.fish;
    crystals += prices.crystals;
    stell += prices.stell;
    updateScore();
    await saveCurrentUserDataToCloud();
  }
  catch (e) { alert("Claim failed: " + e.message); }
}
async function sendPlayerTradeRequest(toUid) {
  if (!checkTradeCooldown(`trade_req_${toUid}`, 2500)) return;
  if (!window.fb || !currentUser || !toUid || toUid === currentUser.uid) return;
  const id = makeTradeId();
  const req = { id, fromUid: currentUser.uid, fromName: getPlayerTradeName(), toUid, status: "pending", createdAt: Date.now() };
  try {
    await window.fb.set(window.fb.ref(window.fb.db, `tradeRequests/${toUid}/${id}`), req);
    showNotification("Trade request sent!", "#4ade80", 2200);
  } catch (e) { alert("Request failed: " + e.message); }
}
async function acceptPlayerTradeRequest(id) {
  if (!checkTradeCooldown(`trade_accept_${id}`, 1800)) return;
  const r = cachedTradeRequests.find(x => x.id === id);
  if (!r || !currentUser || r.toUid !== currentUser.uid) return;
  const sessionId = makeTradeId();
  const session = {
    id: sessionId,
    aUid: r.fromUid,
    bUid: currentUser.uid,
    names: { [r.fromUid]: r.fromName || "Player", [currentUser.uid]: getPlayerTradeName() },
    offers: { [r.fromUid]: [], [currentUser.uid]: [] },
    ready: { [r.fromUid]: false, [currentUser.uid]: false },
    completedFor: {},
    returnedFor: {},
    messages: {},
    status: "active",
    createdAt: Date.now()
  };
  try {
    await window.fb.set(window.fb.ref(window.fb.db, `tradeSessions/${sessionId}`), session);
    await window.fb.update(window.fb.ref(window.fb.db, `tradeRequests/${currentUser.uid}/${id}`), { status: "accepted", sessionId, acceptedAt: Date.now() });
    activeTradeSessionId = sessionId;
  } catch (e) { alert("Accept failed: " + e.message); }
}
async function declinePlayerTradeRequest(id) {
  if (!checkTradeCooldown(`trade_decline_${id}`, 1200)) return;
  const r = cachedTradeRequests.find(x => x.id === id);
  if (!r || !currentUser || r.toUid !== currentUser.uid) return;
  try { await window.fb.update(window.fb.ref(window.fb.db, `tradeRequests/${currentUser.uid}/${id}`), { status: "declined", declinedAt: Date.now() }); }
  catch (e) { alert("Decline failed: " + e.message); }
}
function getActiveSession() {
  if (activeTradeSessionId) {
    const picked = cachedTradeSessions.find(s => s.id === activeTradeSessionId);
    if (picked) return picked;
  }
  return cachedTradeSessions[0] || null;
}
function renderActiveTradeSession() {
  const session = getActiveSession();
  const old = document.getElementById("tradeSessionModal");
  if (!session || !currentUser) { if (old) old.remove(); return; }
  activeTradeSessionId = session.id;
  const myUid = currentUser.uid;
  const otherUid = session.aUid === myUid ? session.bUid : session.aUid;
  const completedFor = session.completedFor || {};

  if (completedFor[session.aUid] && completedFor[session.bUid]) {
    if (window.fb) {
      window.fb.update(window.fb.ref(window.fb.db, `tradeSessions/${session.id}`), {
        status: "completed",
        completedAt: Date.now()
      }).catch((e) => console.warn("Trade status complete failed", e));
    }
    activeTradeSessionId = null;
    if (old) old.remove();
    return;
  }

  if (completedFor[myUid]) {
    activeTradeSessionId = null;
    if (old) old.remove();
    return;
  }

  const myOffer = session.offers?.[myUid] || [];
  const theirOffer = session.offers?.[otherUid] || [];
  const pets = getTradablePetsSafe().filter(p => !myOffer.some(o => getOfferId(o) === p.id));
  const ready = session.ready || {};
  let modal = old;
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "tradeSessionModal";
    modal.className = "top-admin-modal trade-session-modal";
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="top-admin-box trade-session-box">
      <div class="top-admin-title">LIVE TRADE WITH ${escapeHtml(session.names?.[otherUid] || "PLAYER")}</div>
      <div class="trade-session-grid">
        <div class="trade-side"><div class="trade-title">YOU ${ready[myUid] ? "✓" : ""}</div><div class="trade-offer-list">${myOffer.map(p => `<div class="trade-pet-chip">${escapeHtml(p.name)} <button data-session-remove="${escapeHtml(getOfferId(p))}">x</button></div>`).join("") || "Empty"}</div></div>
        <div class="trade-side"><div class="trade-title">THEM ${ready[otherUid] ? "✓" : ""}</div><div class="trade-offer-list">${theirOffer.map(p => `<div class="trade-pet-chip">${escapeHtml(p.name)}</div>`).join("") || "Empty"}</div></div>
      </div>
      <select class="name-input" id="sessionPetSelect">${pets.length ? pets.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} • ${escapeHtml(p.rarity)}</option>`).join("") : `<option value="">No pets</option>`}</select>
      <button class="recovery-btn ui-click" id="sessionAddPet">ADD PET</button>
      <div class="trade-actions">
        <button class="recovery-btn ui-click" id="sessionReady">${ready[myUid] ? "UNREADY" : "READY"}</button>
        <button class="danger-btn ui-click" id="sessionDecline">DECLINE</button>
      </div>
      <div class="trade-chat-box">
        <div class="trade-title">TRADE CHAT</div>
        <div class="trade-chat-messages" id="sessionChatMessages">${renderTradeChatMessages(session)}</div>
        <div class="trade-chat-input-row">
          <input type="text" class="name-input" id="sessionChatInput" placeholder="Message..." maxlength="120" />
          <button class="recovery-btn ui-click" id="sessionChatSend">SEND</button>
        </div>
      </div>
    </div>
  `;
  modal.querySelector("#sessionAddPet")?.addEventListener("click", (e) => { startButtonCooldown(e.currentTarget, 1200); addPetToSession(session); });
  modal.querySelector("#sessionReady")?.addEventListener("click", (e) => { startButtonCooldown(e.currentTarget, 1200); toggleSessionReady(session); });
  modal.querySelector("#sessionDecline")?.addEventListener("click", (e) => { startButtonCooldown(e.currentTarget, 1200); declineSession(session); });
  modal.querySelector("#sessionChatSend")?.addEventListener("click", (e) => { startButtonCooldown(e.currentTarget, 1200); sendTradeChatMessage(session); });
  modal.querySelector("#sessionChatInput")?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); sendTradeChatMessage(session); } });
  modal.querySelectorAll("[data-session-remove]").forEach(btn => btn.addEventListener("click", (e) => { startButtonCooldown(e.currentTarget, 1200); removePetFromSession(session, btn.dataset.sessionRemove); }));
  const msgsEl = modal.querySelector("#sessionChatMessages");
  if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
  if (ready[myUid] && ready[otherUid] && !(session.completedFor && session.completedFor[myUid])) finalizeSessionForMe(session);
}
async function addPetToSession(session) {
  if (!checkTradeCooldown(`session_add_${session.id}`, 1200)) return;
  const sel = document.getElementById("sessionPetSelect");
  const petId = sel?.value;
  if (!petId || !currentUser) return;
  const pet = getTradablePetsSafe().find(p => p.id === petId);
  if (!pet) return alert("Pet not found or locked");
  const myUid = currentUser.uid;
  const currentOffer = session.offers?.[myUid] || [];
  if (currentOffer.length >= 8) return alert("Max 8 pets per trade");

  const removed = getPetApiSafe()?.removePetForTrade?.(petId);
  if (!removed || !removed.ok) return alert(removed?.error || "Cannot reserve pet");
  const reservedPet = { ...removed.pet, id: removed.pet.id || petId, offerId: petId, originalPetId: petId, reserved: true };
  const offer = [...currentOffer, reservedPet];
  try {
    await saveCurrentUserDataToCloud();
    await window.fb.set(window.fb.ref(window.fb.db, `tradeSessions/${session.id}/offers/${myUid}`), offer);
    await window.fb.set(window.fb.ref(window.fb.db, `tradeSessions/${session.id}/ready/${myUid}`), false);
  } catch (e) {
    getPetApiSafe()?.addPetFromTrade?.(reservedPet);
    try { await saveCurrentUserDataToCloud(); } catch (_) {}
    alert("Add pet failed: " + e.message);
  }
}
async function removePetFromSession(session, petId) {
  if (!checkTradeCooldown(`session_remove_${session.id}`, 1200)) return;
  const myUid = currentUser.uid;
  const currentOffer = session.offers?.[myUid] || [];
  const pet = currentOffer.find(p => getOfferId(p) === String(petId));
  const offer = currentOffer.filter(p => getOfferId(p) !== String(petId));
  try {
    await window.fb.set(window.fb.ref(window.fb.db, `tradeSessions/${session.id}/offers/${myUid}`), offer);
    await window.fb.set(window.fb.ref(window.fb.db, `tradeSessions/${session.id}/ready/${myUid}`), false);
    if (pet && pet.reserved) {
      const ret = getPetApiSafe()?.addPetFromTrade?.(pet);
      if (!ret || !ret.ok) alert(ret?.error || "Could not return pet locally");
      await saveCurrentUserDataToCloud();
    }
  } catch (e) { alert("Remove pet failed: " + e.message); }
}
async function toggleSessionReady(session) {
  if (!checkTradeCooldown(`session_ready_${session.id}`, 1200)) return;
  const myUid = currentUser.uid;
  const next = !(session.ready && session.ready[myUid]);
  await window.fb.set(window.fb.ref(window.fb.db, `tradeSessions/${session.id}/ready/${myUid}`), next);
}
async function declineSession(session) {
  if (!checkTradeCooldown(`session_decline_${session.id}`, 1500)) return;
  if (!confirm("Decline trade? Your reserved pets will be returned.")) return;
  await window.fb.update(window.fb.ref(window.fb.db, `tradeSessions/${session.id}`), { status: "cancelled", cancelledAt: Date.now(), cancelledBy: currentUser.uid });
  activeTradeSessionId = null;
  const modal = document.getElementById("tradeSessionModal");
  if (modal) modal.remove();
}
async function finalizeSessionForMe(session) {
  const myUid = currentUser.uid;
  if (finalizingTradeSessions.has(session.id)) return;
  finalizingTradeSessions.add(session.id);
  const otherUid = session.aUid === myUid ? session.bUid : session.aUid;
  const myOffer = session.offers?.[myUid] || [];
  const theirOffer = session.offers?.[otherUid] || [];
  try {
    const petApi = getPetApiSafe();
    if (!petApi) return alert("Pet system is not ready");
    if (typeof petApi.getFreeSlots === "function" && petApi.getFreeSlots() < theirOffer.length) {
      alert("Trade failed: not enough free pet slots.");
      await window.fb.update(window.fb.ref(window.fb.db, `tradeSessions/${session.id}`), { status: "failed", failedAt: Date.now(), failedBy: myUid, reason: "no_slots" });
      return;
    }

    // New trades reserve pets when adding them, so we do NOT remove them again here.
    // Legacy sessions may contain unreserved offers; remove those once for compatibility.
    for (const pet of myOffer) {
      if (pet.reserved) continue;
      const removed = petApi.removePetForTrade?.(pet.id);
      if (!removed || !removed.ok) {
        alert("Trade failed: one of your pets is no longer available.");
        await window.fb.update(window.fb.ref(window.fb.db, `tradeSessions/${session.id}`), { status: "failed", failedAt: Date.now(), failedBy: myUid });
        return;
      }
    }

    for (const pet of theirOffer) {
      const added = petApi.addPetFromTrade?.(pet);
      if (!added || !added.ok) {
        alert(added?.error || "Could not receive one pet");
        await window.fb.update(window.fb.ref(window.fb.db, `tradeSessions/${session.id}`), { status: "failed", failedAt: Date.now(), failedBy: myUid });
        return;
      }
    }

    await saveCurrentUserDataToCloud();
    await window.fb.set(window.fb.ref(window.fb.db, `tradeSessions/${session.id}/completedFor/${myUid}`), true);

    try {
      const freshSnap = await window.fb.get(window.fb.ref(window.fb.db, `tradeSessions/${session.id}`));
      const fresh = freshSnap.val() || {};
      const completed = fresh.completedFor || { ...(session.completedFor || {}), [myUid]: true };
      if (completed[otherUid]) {
        await window.fb.update(window.fb.ref(window.fb.db, `tradeSessions/${session.id}`), { status: "completed", completedAt: Date.now() });
      }
    } catch (e) { console.warn("Trade completion status update failed", e); }

    showNotification("Trade completed!", "#4ade80", 2600);
    activeTradeSessionId = null;
    const modal = document.getElementById("tradeSessionModal");
    if (modal) modal.remove();
  } finally {
    finalizingTradeSessions.delete(session.id);
  }
}
if (plazaListBtn) plazaListBtn.addEventListener("click", listPetOnPlaza);
document.addEventListener("click", (e) => {
  const buy = e.target.closest("[data-plaza-buy]");
  const cancel = e.target.closest("[data-plaza-cancel]");
  const claim = e.target.closest("[data-plaza-claim]");
  const reqPlayer = e.target.closest("[data-request-player]");
  const reqAccept = e.target.closest("[data-trade-request-accept]");
  const reqDecline = e.target.closest("[data-trade-request-decline]");
  if (buy) { startButtonCooldown(buy, 1500); buyPlazaListing(buy.dataset.plazaBuy); }
  if (cancel) { startButtonCooldown(cancel, 1500); cancelPlazaListing(cancel.dataset.plazaCancel); }
  if (claim) { startButtonCooldown(claim, 1500); claimPlazaSale(claim.dataset.plazaClaim); }
  if (reqPlayer) { startButtonCooldown(reqPlayer, 1500); sendPlayerTradeRequest(reqPlayer.dataset.requestPlayer); }
  if (reqAccept) { startButtonCooldown(reqAccept, 1500); acceptPlayerTradeRequest(reqAccept.dataset.tradeRequestAccept); }
  if (reqDecline) { startButtonCooldown(reqDecline, 1500); declinePlayerTradeRequest(reqDecline.dataset.tradeRequestDecline); }
});

/* ========== \u0422\u041E\u041F ========== */
let currentTopTab = "fish";
let cachedLeaderboard = [];
let hiddenTopUids = [];
document.querySelectorAll(".top-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".top-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentTopTab = tab.dataset.tab;
    renderTop(cachedLeaderboard);
  });
});
async function loadTop() {
  const topList = $("topList");
  if (!topList) return;
  topList.innerHTML = `<div class="top-loading">Loading...</div>`;
  if (!window.fb) { topList.innerHTML = `<div class="top-loading">Firebase not loaded</div>`; return; }
  try {
    const [lbRes, hiddenRes, adminsRes] = await Promise.allSettled([
      window.fb.get(window.fb.ref(window.fb.db, "leaderboard")),
      window.fb.get(window.fb.ref(window.fb.db, "topHidden")),
      window.fb.get(window.fb.ref(window.fb.db, "admins"))
    ]);
    if (lbRes.status !== "fulfilled") throw lbRes.reason;
    cachedLeaderboard = Object.values(lbRes.value.val() || {});
    hiddenTopUids = hiddenRes.status === "fulfilled" ? Object.keys(hiddenRes.value.val() || {}) : [];
    if (adminsRes.status === "fulfilled") remoteAdminUids = normalizeAdminList(adminsRes.value.val());
    renderTop(cachedLeaderboard);
  } catch (e) { topList.innerHTML = `<div class="top-loading">Failed to load: ${escapeHtml(e.message || String(e))}</div>`; }
}
function renderTop(list) {
  const topList = $("topList");
  if (!topList) return;
  topList.innerHTML = "";
  if (!list.length) {
    topList.innerHTML = `<div class="top-loading">No players yet.<br/>Click cat to be first!</div>`;
    return;
  }
  const adminUidSet = new Set([...(ADMIN_UIDS || []), ...(remoteAdminUids || [])]);
  const filtered = list.filter(p => p && !BANNED_UIDS.includes(p.uid) && !hiddenTopUids.includes(p.uid) && !p.hidden && !p.admin && !adminUidSet.has(p.uid));
  const byIdentity = new Map();
  filtered.forEach((p) => {
    const key = p.playerId || p.uid || ((p.name || "anon") + "_" + (p.avatar ? "avatar" : "noavatar"));
    const old = byIdentity.get(key);
    if (!old) byIdentity.set(key, p);
    else {
      const oldVal = old[currentTopTab] || 0;
      const newVal = p[currentTopTab] || 0;
      if (newVal > oldVal || (newVal === oldVal && (p.updated || 0) > (old.updated || 0))) byIdentity.set(key, p);
    }
  });
  const sorted = [...byIdentity.values()].sort((a, b) => (b[currentTopTab] || 0) - (a[currentTopTab] || 0)).slice(0, 50);
  sorted.forEach((player, idx) => {
    const rank = idx + 1;
    let rankClass = "normal";
    if (rank === 1) rankClass = "gold";
    else if (rank === 2) rankClass = "silver";
    else if (rank === 3) rankClass = "bronze";
    const isYou = currentUser && player.uid === currentUser.uid;
    const el = document.createElement("div");
    el.className = "top-entry" + (isYou ? " you" : "");
    let value;
    if (currentTopTab === "fish") value = formatNum(player.fish || 0);
    else if (currentTopTab === "clicks") value = formatNum(player.clicks || 0);
    else if (currentTopTab === "time") value = formatTime(player.time || 0);
    else if (currentTopTab === "rebirths") value = formatNum(player.rebirths || 0);
    else if (currentTopTab === "amethysts") value = formatNum(player.amethysts || 0);
    else if (currentTopTab === "eggs") value = formatNum(player.eggs || 0);
    else value = formatNum(player.fish || 0);
    const displayName = `${player.imperial ? "[Imperial] " : (player.vip ? "[\u0412\u0438\u043F] " : "")}${player.name || 'Anonymous'}`;
    el.innerHTML = `
      <div class="top-rank ${rankClass}">#${rank}</div>
      <div class="top-avatar"><img src="${player.avatar || 'CatIcon1.png'}" alt="" onerror="this.src='CatIcon1.png'" /></div>
      <div class="top-name ${player.imperial ? "imperial-name" : (player.vip ? "vip-name" : "")}">${escapeHtml(displayName)}</div>
      <div class="top-value">${value}</div>
    `;
    if (canUseAdmin(currentUser && currentUser.uid)) {
      el.style.cursor = "pointer";
      el.title = "Admin actions";
      el.addEventListener("click", () => openTopPlayerAdminModal(player));
    }
    topList.appendChild(el);
  });
}

function closeTopAdminModal() {
  const old = document.getElementById("topAdminModal");
  if (old) old.remove();
}

function openTopPlayerAdminModal(player) {
  if (!canUseAdmin(currentUser && currentUser.uid) || !player) return;
  closeTopAdminModal();
  const modal = document.createElement("div");
  modal.id = "topAdminModal";
  modal.className = "top-admin-modal";
  modal.innerHTML = `
    <div class="top-admin-box">
      <div class="top-admin-title">ADMIN: ${escapeHtml(player.name || "Anonymous")}</div>
      <div class="top-admin-uid">UID: ${escapeHtml(player.uid || "-")}</div>
      <button class="admin-btn ui-click" id="topAdminSet">SET STATS</button>
      <button class="admin-btn danger-admin ui-click" id="topAdminBan">BAN / HIDE FROM TOP</button>
      <button class="admin-btn danger-admin ui-click" id="topAdminDelete">DELETE FROM TOP FOREVER</button>
      <button class="admin-btn ui-click" id="topAdminClose">CLOSE</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("#topAdminClose").addEventListener("click", closeTopAdminModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeTopAdminModal(); });
  modal.querySelector("#topAdminDelete").addEventListener("click", () => adminDeleteTopPlayer(player));
  modal.querySelector("#topAdminBan").addEventListener("click", () => adminHideTopPlayer(player));
  modal.querySelector("#topAdminSet").addEventListener("click", () => adminSetTopPlayerStats(player));
}

async function adminHideTopPlayer(player) {
  if (!canUseAdmin(currentUser && currentUser.uid) || !window.fb || !player.uid) return;
  if (!confirm(`Hide ${player.name || player.uid} from top forever?`)) return;
  try {
    await window.fb.set(window.fb.ref(window.fb.db, `topHidden/${player.uid}`), { hidden: true, by: currentUser.uid, at: Date.now(), name: player.name || "" });
    try { await window.fb.update(window.fb.ref(window.fb.db, `leaderboard/${player.uid}`), { hidden: true, updated: Date.now() }); } catch (e) {}
    try { await window.fb.remove(window.fb.ref(window.fb.db, `leaderboard/${player.uid}`)); } catch (e) {}
    if (!hiddenTopUids.includes(player.uid)) hiddenTopUids.push(player.uid);
    cachedLeaderboard = cachedLeaderboard.filter((p) => p.uid !== player.uid);
    renderTop(cachedLeaderboard);
    closeTopAdminModal();
  } catch (e) { alert("Failed: " + e.message); }
}

async function adminDeleteTopPlayer(player) {
  if (!canUseAdmin(currentUser && currentUser.uid) || !window.fb || !player.uid) return;
  if (!confirm(`DELETE ${player.name || player.uid} from leaderboard and hide forever?`)) return;
  try {
    await window.fb.set(window.fb.ref(window.fb.db, `topHidden/${player.uid}`), { hidden: true, by: currentUser.uid, at: Date.now(), name: player.name || "" });
    await window.fb.remove(window.fb.ref(window.fb.db, `leaderboard/${player.uid}`));
    cachedLeaderboard = cachedLeaderboard.filter((p) => p.uid !== player.uid);
    if (!hiddenTopUids.includes(player.uid)) hiddenTopUids.push(player.uid);
    renderTop(cachedLeaderboard);
    closeTopAdminModal();
  } catch (e) { alert("Failed: " + e.message); }
}

async function adminSetTopPlayerStats(player) {
  if (!canUseAdmin(currentUser && currentUser.uid) || !window.fb || !player.uid) return;
  try {
    const snap = await window.fb.get(window.fb.ref(window.fb.db, `users/${player.uid}`));
    const data = snap.val() || {};
    const scoreVal = prompt("Current fish:", data.score ?? 0);
    if (scoreVal === null) return;
    const crystalsVal = prompt("Amethysts:", data.crystals ?? 0);
    if (crystalsVal === null) return;
    const clickVal = prompt("Click power:", data.clickPower ?? 1);
    if (clickVal === null) return;
    const autoVal = prompt("Auto/sec:", data.autoClicker ?? 0);
    if (autoVal === null) return;
    const totalVal = prompt("Total fish earned:", data.stats?.totalFishEarned ?? player.fish ?? 0);
    if (totalVal === null) return;
    const newData = { ...data, stats: { ...(data.stats || {}) } };
    newData.score = parseNumInput(scoreVal);
    newData.crystals = parseNumInput(crystalsVal);
    newData.clickPower = parseNumInput(clickVal);
    newData.autoClicker = parseNumInput(autoVal);
    newData.stats.totalFishEarned = parseNumInput(totalVal);
    if ([newData.score, newData.crystals, newData.clickPower, newData.autoClicker, newData.stats.totalFishEarned].some(isNaN)) { alert("Invalid number"); return; }
    await window.fb.set(window.fb.ref(window.fb.db, `users/${player.uid}`), newData);
    await window.fb.update(window.fb.ref(window.fb.db, `leaderboard/${player.uid}`), {
      fish: newData.stats.totalFishEarned,
      amethysts: newData.crystals,
      updated: Date.now()
    });
    const cmd = { id: Date.now() + "_" + Math.random().toString(36).slice(2,8), type: "replaceSave", data: newData, from: currentUser.uid, timestamp: Date.now(), delayMs: 500 };
    await window.fb.set(window.fb.ref(window.fb.db, `commands/${player.uid}/${cmd.id}`), cmd);
    closeTopAdminModal();
    loadTop();
    alert("✓ Stats updated");
  } catch (e) { alert("Failed: " + e.message); }
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
async function pushToLeaderboard() {
  if (!currentUser || !window.fb) return;
  const uid = String(currentUser.uid || "").trim();
  if (shouldBlockLeaderboardForUid(uid)) {
    lastLeaderboardSignature = getLeaderboardSignature();
    return;
  }
  if (!isRegisteredUser()) return;
  try {
    const pid = playerId || ensurePlayerId();
    try {
      const hiddenSnap = await window.fb.get(window.fb.ref(window.fb.db, `topHidden/${uid}`));
      if (hiddenSnap.exists()) return;
    } catch (e) {}
    const leaderboardRow = {
      uid: uid,
      playerId: pid,
      name: getRegisteredDisplayName(),
      avatar: profile.avatar || null,
      vip: vipActive,
      imperial: imperialActive,
      admin: canUseAdmin(currentUser.uid),
      fish: stats.totalFishEarned,
      clicks: stats.totalClicks,
      time: stats.playTimeSec,
      rebirths: rebirthCount,
      amethysts: crystals,
      eggs: getEggsOpenedCount(),
      updated: Date.now()
    };
    // Use parent update with dynamic key so Firebase evaluates /leaderboard/$uid rules.
    await window.fb.update(window.fb.ref(window.fb.db, "leaderboard"), {
      [uid]: leaderboardRow
    });
    // Anti-clone cleanup: only cloud admins should try to delete other users' rows.
    // Never remove hardcoded/dynamic admin rows here; it prevents permission_denied spam.
    try {
      const snap = await window.fb.get(window.fb.ref(window.fb.db, "leaderboard"));
      const all = snap.val() || {};
      const requesterUid = uid;
      const requesterCanDeleteOthers = isUidAdmin(requesterUid);
      const protectedUids = new Set([...(ADMIN_UIDS || []), ...(remoteAdminUids || [])]);

      if (requesterCanDeleteOthers) {
        for (const [otherUid, row] of Object.entries(all)) {
          if (otherUid === requesterUid) continue;
          if (!row || row.playerId !== pid) continue;
          if (protectedUids.has(otherUid)) continue;
          try {
            await window.fb.remove(window.fb.ref(window.fb.db, `leaderboard/${otherUid}`));
          } catch (e) {
            console.debug("Clone leaderboard cleanup skipped for", otherUid, e);
          }
        }
      }
    } catch (e) { console.debug("Clone leaderboard cleanup scan skipped", e); }
    lastPushedFish = stats.totalFishEarned;
    lastLeaderboardSignature = getLeaderboardSignature();
  } catch (e) { console.warn("Leaderboard push failed", e); }
}

/* ========== SAVE FILE ========== */
function stableStringify(value) {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  return "{" + Object.keys(value).sort().filter((key) => value[key] !== undefined && typeof value[key] !== "function" && typeof value[key] !== "symbol").map((key) => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
}

function base64EncodeUnicode(str) {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

function base64DecodeUnicode(b64) {
  const clean = String(b64 || "").replace(/\s+/g, "");
  try {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return decodeURIComponent(escape(atob(clean)));
  }
}

function hashString64(str) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + i;
    h2 = Math.imul(h2, 0x85ebca6b);
    h2 ^= h2 >>> 13;
  }
  return ((h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0")).toUpperCase();
}

function makeSaveIntegrityHash(payloadB64, exportedAt, version, ownerUid) {
  return hashString64([
    SAVE_FILE_HASH_VERSION,
    SAVE_FILE_TYPE,
    String(version),
    exportedAt,
    ownerUid || "NO_UID",
    payloadB64,
    SAVE_FILE_INTEGRITY_KEY
  ].join("|"));
}

function createSaveFilePayload() {
  const data = buildSaveData();
  const exportedAt = new Date().toISOString();
  const version = SAVE_FILE_VERSION;
  const ownerUid = currentUser ? currentUser.uid : null;
  data.ownerUid = ownerUid;
  // Protected JSON backups are meant to restore after app reinstall, where Firebase
  // anonymous UID often changes. If the exporter currently has admin rights, store
  // local admin access in the signed payload too.
  data.localAdminGranted = !!(localAdminGranted || (ownerUid && isUidAdmin(ownerUid)) || isAdmin);
  const payload = base64EncodeUnicode(stableStringify(data));
  const hash = makeSaveIntegrityHash(payload, exportedAt, version, ownerUid);
  return {
    type: SAVE_FILE_TYPE,
    version,
    encoding: SAVE_FILE_ENCODING,
    hashVersion: SAVE_FILE_HASH_VERSION,
    ownerUid,
    exportedAt,
    payload,
    hash
  };
}

function createProtectedSavePayloadForData(data, ownerUid = null) {
  const clean = JSON.parse(JSON.stringify(data || {}));
  const exportedAt = new Date().toISOString();
  const version = SAVE_FILE_VERSION;
  clean.ownerUid = ownerUid || clean.ownerUid || null;
  const payload = base64EncodeUnicode(stableStringify(clean));
  const hash = makeSaveIntegrityHash(payload, exportedAt, version, clean.ownerUid);
  return {
    type: SAVE_FILE_TYPE,
    version,
    encoding: SAVE_FILE_ENCODING,
    hashVersion: SAVE_FILE_HASH_VERSION,
    ownerUid: clean.ownerUid,
    exportedAt,
    payload,
    hash
  };
}

function decodeProtectedSave(raw) {
  if (!raw || raw.type !== SAVE_FILE_TYPE || !raw.version || raw.version < 2 || raw.encoding !== SAVE_FILE_ENCODING) return null;
  if (!raw.payload || !raw.hash || !raw.exportedAt) return null;
  const ownerForHash = raw.ownerUid || "NO_UID";
  const expectedHash = makeSaveIntegrityHash(raw.payload, raw.exportedAt, raw.version, ownerForHash);
  if (String(raw.hash).toUpperCase() !== expectedHash) {
    alert("Save file integrity check failed! File was edited or corrupted.");
    return null;
  }
  try {
    const decoded = base64DecodeUnicode(raw.payload);
    const parsed = JSON.parse(decoded);
    // Owner UID is kept only for integrity metadata. Reinstalling the app can create
    // a new anonymous Firebase UID, so protected saves are allowed to transfer to
    // the currently logged-in UID after hash verification.
    return parsed;
  } catch (e) {
    alert("Save file decode failed: " + e.message);
    return null;
  }
}

function sanitizeImportedSaveData(data, trustedProtected) {
  if (!data || typeof data !== "object") return null;
  const clean = JSON.parse(JSON.stringify(data));

  // Admin rights must come from Firebase admins/commands, not from edited save files.
  delete clean.isAdmin;
  delete clean.remoteAdminUids;
  delete clean.currentUser;
  delete clean.ownerUid;
  if (!trustedProtected) delete clean.localAdminGranted;

  const clampFinite = (obj, key, min, max, def) => {
    const n = Number(obj[key]);
    obj[key] = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
  };
  const MAX_VALUE = 1e18;
  clampFinite(clean, "score", 0, MAX_VALUE, 0);
  clampFinite(clean, "crystals", 0, MAX_VALUE, 0);
  clampFinite(clean, "stell", 0, MAX_VALUE, 0);
  clampFinite(clean, "clickPower", 1, MAX_VALUE, 1);
  clampFinite(clean, "autoClicker", 0, MAX_VALUE, 0);
  clampFinite(clean, "rebirthCount", 0, 1000000, 0);
  clampFinite(clean, "rebirthMultiplier", 1, MAX_VALUE, 1);
  if (clean.stats && typeof clean.stats === "object") {
    ["totalClicks", "totalFishEarned", "playTimeSec", "goldWaves", "diamondWaves", "itemsBought"].forEach((key) => clampFinite(clean.stats, key, 0, MAX_VALUE, 0));
  }
  return clean;
}

function normalizeImportedSave(raw) {
  if (!raw || typeof raw !== "object") return null;

  const protectedData = decodeProtectedSave(raw);
  if (protectedData) return sanitizeImportedSaveData(protectedData, true);

  if (raw.type === SAVE_FILE_TYPE && raw.data && typeof raw.data === "object") {
    if (!ALLOW_UNSIGNED_SAVE_IMPORT) {
      alert("This is an old unsigned save file. Export a new protected save first. Import blocked to prevent edited saves.");
      return null;
    }
    return sanitizeImportedSaveData(raw.data, false);
  }

  if ("score" in raw || "stats" in raw || "shopOwned" in raw) {
    if (!ALLOW_UNSIGNED_SAVE_IMPORT) {
      alert("Unsigned raw save import is blocked to prevent edited saves.");
      return null;
    }
    return sanitizeImportedSaveData(raw, false);
  }

  return null;
}
function makeSaveFileName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `catclicker-save-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
}

function triggerSaveDownload(text, fileName) {
  try {
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
    return true;
  } catch (e) {
    console.warn("Blob download failed", e);
  }

  try {
    const a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(text);
    a.download = fileName;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    a.remove();
    return true;
  } catch (e) {
    console.warn("Data-url download failed", e);
    return false;
  }
}

function showExportFallbackDialog(text, fileName) {
  const old = document.getElementById("saveExportFallback");
  if (old) old.remove();

  const wrap = document.createElement("div");
  wrap.id = "saveExportFallback";
  wrap.style.cssText = `
    position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.78);
    display:flex;align-items:center;justify-content:center;padding:14px;
    font-family:'Press Start 2P',system-ui,sans-serif;
  `;
  wrap.innerHTML = `
    <div style="width:min(720px,96vw);max-height:88vh;background:#1a1a2e;border:4px solid #4ade80;box-shadow:8px 8px 0 #000;padding:14px;display:flex;flex-direction:column;gap:10px;">
      <div style="color:#4ade80;font-size:12px;line-height:1.5;">SAVE EXPORT READY</div>
      <div style="color:#aaa;font-size:7px;line-height:1.6;">
        If QuickEdit / Android WebView does not download files, copy this JSON and save it as:<br/>
        <span style="color:#ffd700;word-break:break-all;">${escapeHtml(fileName)}</span>
      </div>
      <textarea id="saveExportText" readonly style="width:100%;height:42vh;min-height:180px;background:#0f1020;color:#fff;border:2px solid #3a3a5a;padding:10px;font-family:monospace;font-size:11px;line-height:1.35;resize:vertical;outline:none;">${escapeHtml(text)}</textarea>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;">
        <button id="saveExportDownloadAgain" class="ui-click" style="padding:12px 8px;background:#1a1a2e;border:2px solid #ffd700;color:#ffd700;font-family:inherit;font-size:8px;cursor:pointer;">DOWNLOAD</button>
        <button id="saveExportCopy" class="ui-click" style="padding:12px 8px;background:#1a1a2e;border:2px solid #4ade80;color:#4ade80;font-family:inherit;font-size:8px;cursor:pointer;">COPY</button>
        <button id="saveExportClose" class="ui-click" style="padding:12px 8px;background:#1a1a2e;border:2px solid #ff6666;color:#ff6666;font-family:inherit;font-size:8px;cursor:pointer;">CLOSE</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  const ta = wrap.querySelector("#saveExportText");
  const copyBtn = wrap.querySelector("#saveExportCopy");
  wrap.querySelector("#saveExportClose").addEventListener("click", () => wrap.remove());
  wrap.querySelector("#saveExportDownloadAgain").addEventListener("click", () => {
    triggerSaveDownload(text, fileName);
    showNotification("Download started. If not, use COPY.", "#ffd700", 2500);
  });
  copyBtn.addEventListener("click", async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        ta.focus();
        ta.select();
        document.execCommand("copy");
      }
      copyBtn.textContent = "COPIED!";
      setTimeout(() => { copyBtn.textContent = "COPY"; }, 1500);
      showNotification("Save copied!", "#4ade80", 2200);
    } catch (e) {
      ta.focus();
      ta.select();
      alert("Copy failed. Select all text and copy manually.");
    }
  });
  setTimeout(() => { ta.focus(); ta.select(); }, 80);
}

function isDownloadHostileEnvironment() {
  const ua = navigator.userAgent || "";
  return location.protocol === "file:" || /Android|; wv\)|Version\/\d+\.\d+.*Chrome\/.*Mobile/i.test(ua) || /QuickEdit/i.test(ua);
}

async function exportSaveToFile() {
  if (!currentUser || !currentUser.uid) {
    alert("Wait until account login finishes, then export again.");
    return;
  }
  const payload = createSaveFilePayload();
  const text = JSON.stringify(payload, null, 2);
  const fileName = makeSaveFileName();

  // QuickEdit / Android WebView often breaks browser download/share APIs with
  // vague errors like "l is not defined". In that environment, use the safe
  // copy/manual-save dialog immediately.
  if (isDownloadHostileEnvironment()) {
    showExportFallbackDialog(text, fileName);
    return;
  }

  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: "Cat Clicker Save", accept: { "application/json": [".json"] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      showNotification("✓ Save exported!", "#4ade80", 2500);
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
    console.warn("File picker export failed", e);
  }

  try {
    if (navigator.share && navigator.canShare && window.File) {
      const file = new File([text], fileName, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Cat Clicker save", text: "Cat Clicker save file" });
        showNotification("✓ Save shared!", "#4ade80", 2500);
        return;
      }
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
    console.warn("Share export failed", e);
  }

  const attempted = triggerSaveDownload(text, fileName);
  if (isDownloadHostileEnvironment() || !attempted) {
    showExportFallbackDialog(text, fileName);
  } else {
    showNotification("✓ Save exported!", "#4ade80", 2500);
  }
}
async function importSaveFromFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const data = normalizeImportedSave(parsed);
    if (!data) { alert("Invalid save file!"); return; }
    if (!confirm("Import save file? This will replace your current progress.")) return;
    const currentCodeBeforeImport = recoveryCode;
    applySaveData(data);
    if (currentCodeBeforeImport) recoveryCode = currentCodeBeforeImport;
    updateRecoveryDisplay();
    saveGame();
    if (currentUser) {
      pushToLeaderboard();
      lastPushedFish = stats.totalFishEarned;
      // recovery codes disabled
    }
    showNotification("✓ Save imported!", "#4ade80", 3000);
  } catch (e) {
    alert("Import failed: " + e.message);
  }
}

/* ========== \u0412\u041E\u0421\u0421\u0422\u0410\u041D\u041E\u0412\u041B\u0415\u041D\u0418\u0415 ========== */
function generateRecoveryCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if (i === 3) code += "-";
  }
  return code;
}
function updateRecoveryDisplay() {
  const el = $("recoveryCode");
  if (el) el.textContent = recoveryCode || "--------";
}
async function ensureRecoveryCode() {
  // Recovery codes are disabled. File export/import is the supported save system.
  return;
}
async function restoreFromCode(rawCode) {
  const fb = window.fb;
  if (!fb || !rawCode) return;
  let code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length === 8) code = code.slice(0, 4) + "-" + code.slice(4);
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    alert("Invalid code format.\nUse: XXXX-XXXX or XXXXXXXX");
    return;
  }
  try {
    const snap = await fb.get(fb.ref(fb.db, `recovery/${code}`));
    const targetUid = snap.val();
    if (!targetUid) { alert("Code not found!\nMake sure you entered it correctly."); return; }
    const dataSnap = await fb.get(fb.ref(fb.db, `users/${targetUid}`));
    const data = dataSnap.val();
    if (!data) { alert("No data found for this code!"); return; }
    if (!confirm("This will REPLACE your current progress. Continue?")) return;
    const ourOwnRecoveryCode = recoveryCode;
    applySaveData(data);
    recoveryCode = ourOwnRecoveryCode;
    updateRecoveryDisplay();
    if (currentUser) await fb.set(fb.ref(fb.db, `users/${currentUser.uid}`), buildSaveData());
    saveGame();
    showNotification("✓ Progress restored!", "#4ade80", 3000);
  } catch (e) {
    console.error(e);
    alert("Restore failed: " + e.message);
  }
}

function isRegisteredUser() {
  return !!(currentUser && !currentUser.isAnonymous);
}
function getRegisteredDisplayName() {
  const n = sanitizePlayerName(profile.name);
  if (n) return n;
  if (currentUser && currentUser.email) return sanitizePlayerName(currentUser.email.split("@")[0]) || "Anonymous";
  return "Anonymous";
}
function renderAuthMenu() {
  try { applySettings(); } catch (e) {}
  const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  const emailInput = $("authEmailInput");
  const nameInp = $("authNameInput");
  const logoutBtn = $("authLogoutBtn");
  const accountBtn = $("accountBtn");
  if (nameInp && profile.name) nameInp.value = profile.name;
  if (emailInput && currentUser && currentUser.email) emailInput.value = currentUser.email;
  if (isRegisteredUser()) {
    setText("authStatusTitle", "SIGNED IN");
    setText("authStatusHint", `Email: ${currentUser.email || "unknown"}. You can appear in TOP.`);
    if (logoutBtn) logoutBtn.style.display = "block";
    if (accountBtn) accountBtn.textContent = "ACCOUNT";
  } else {
    setText("authStatusTitle", "GUEST MODE");
    setText("authStatusHint", "Register or sign in to save account in Firebase and appear in TOP.");
    if (logoutBtn) logoutBtn.style.display = "none";
    if (accountBtn) accountBtn.textContent = "SIGN IN";
  }
}
function getAuthInputs() {
  return {
    name: sanitizePlayerName($("authNameInput")?.value || ""),
    email: ($("authEmailInput")?.value || "").trim(),
    password: $("authPasswordInput")?.value || ""
  };
}
async function registerAccount() {
  if (!window.fb) return;
  const { name, email, password } = getAuthInputs();
  if (!name || !email || password.length < 6) { alert("Enter name, email and password (6+ chars)."); return; }

  const oldUser = currentUser;
  const oldUid = oldUser && oldUser.uid;
  const wasAdminBeforeRegister = canUseAdmin(oldUid);
  const localData = buildSaveData();
  localData.profile = { ...profile, name };
  if (wasAdminBeforeRegister) localData.localAdminGranted = true;

  try {
    let cred;

    // IMPORTANT: if the player is currently a guest/anonymous user, link email+password
    // to that same Firebase user instead of creating a new account. This preserves UID,
    // so hardcoded/Firebase admin rights do not disappear after registration.
    if (oldUser && oldUser.isAnonymous && window.fb.EmailAuthProvider && window.fb.linkWithCredential) {
      const credential = window.fb.EmailAuthProvider.credential(email, password);
      cred = await window.fb.linkWithCredential(oldUser, credential);
    } else {
      cred = await window.fb.createUserWithEmailAndPassword(window.fb.auth, email, password);
    }

    currentUser = cred.user;
    if (wasAdminBeforeRegister) localAdminGranted = true;

    try { await window.fb.updateProfile(cred.user, { displayName: name }); } catch (e) {}
    profile.name = name;
    applySaveData(localData);
    if (wasAdminBeforeRegister) localAdminGranted = true;

    saveGame();

    // Fallback for rare cases where UID still changed: try to migrate admin grant in Firebase.
    // This only succeeds if current rules allow this write.
    if (wasAdminBeforeRegister && oldUid && oldUid !== currentUser.uid) {
      try {
        await window.fb.set(window.fb.ref(window.fb.db, `admins/${currentUser.uid}`), {
          active: true,
          migratedFrom: oldUid,
          grantedAt: Date.now()
        });
      } catch (e) { console.warn("Admin migration to new UID failed", e); }
    }

    try { applySettings(); } catch (e) {}
    await pushToLeaderboard();
    renderAuthMenu();
    showNotification("✓ Registered and signed in!", "#4ade80", 3000);
  } catch (e) {
    if (e && e.code === "auth/email-already-in-use") {
      alert("This email is already registered. Use SIGN IN instead.");
    } else if (e && e.code === "auth/credential-already-in-use") {
      alert("This email is already linked to another account. Use SIGN IN instead.");
    } else {
      alert("Register failed: " + e.message);
    }
  }
}
async function loginAccount() {
  if (!window.fb) return;
  const { email, password } = getAuthInputs();
  if (!email || !password) { alert("Enter email and password."); return; }
  try {
    await window.fb.signInWithEmailAndPassword(window.fb.auth, email, password);
    renderAuthMenu();
    showNotification("✓ Signed in!", "#4ade80", 2500);
  } catch (e) { alert("Sign in failed: " + e.message); }
}
async function forgotPassword() {
  if (!window.fb) return;
  const { email } = getAuthInputs();
  if (!email) { alert("Enter your email first."); return; }
  try {
    await window.fb.sendPasswordResetEmail(window.fb.auth, email);
    alert("Password reset email sent. Firebase cannot send your old password for security reasons.");
  } catch (e) { alert("Reset failed: " + e.message); }
}
async function logoutAccount() {
  if (!window.fb) return;
  if (!confirm("Log out? Local progress on this device will be cleared. Cloud progress and TOP record stay on the account.")) return;
  try {
    // Save the registered account to cloud first. Do not remove leaderboard.
    if (currentUser && !currentUser.isAnonymous) {
      try { await window.fb.set(window.fb.ref(window.fb.db, `users/${currentUser.uid}`), buildSaveData()); } catch (e) { console.warn("Final cloud save before logout failed", e); }
      try { await pushToLeaderboard(); } catch (e) {}
    }
    suppressPersistenceForLogout = true;
    localStorage.removeItem(SAVE_KEY);
    sessionStorage.setItem("catclicker_logged_out", "1");
    await window.fb.signOut(window.fb.auth);
    location.reload();
  } catch (e) {
    suppressPersistenceForLogout = false;
    alert("Logout failed: " + e.message);
  }
}
on("authRegisterBtn", "click", registerAccount);
on("authLoginBtn", "click", loginAccount);
on("authForgotBtn", "click", forgotPassword);
on("authLogoutBtn", "click", logoutAccount);

/* ========== AUTH ========== */
function initAuth() {
  const fb = window.fb;
  if (!fb) return;
  on("copyCodeBtn", "click", () => {
    if (!recoveryCode) { alert("Code not ready yet..."); return; }
    try { navigator.clipboard.writeText(recoveryCode); }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = recoveryCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    const btn = $("copyCodeBtn");
    if (btn) { btn.textContent = "COPIED!"; setTimeout(() => btn.textContent = "COPY CODE", 1500); }
  });
  on("restoreBtn", "click", () => {
    const inp = $("restoreInput");
    if (inp) restoreFromCode(inp.value);
  });
  fb.onAuthStateChanged(fb.auth, async (user) => {
    currentUser = user;
    renderAuthMenu();
    if (user) {
      listenForAdminGrants();
      listenCometConfig();
      try { applySettings(); } catch(e) {}
      try {
        const snap = await fb.get(fb.ref(fb.db, `users/${user.uid}`));
        const cloudData = snap.val();
        if (cloudData) {
          const localData = readLocalSave();
          const hasLocal = !!localData;
          if (!hasLocal) {
            applySaveData(cloudData);
            processOfflineProgress(cloudData);
          } else {
            const cloudFish = (cloudData.stats && cloudData.stats.totalFishEarned) || 0;
            const localFish = (localData && localData.stats && localData.stats.totalFishEarned) || 0;
            if (cloudFish > localFish) {
              applySaveData(cloudData);
              processOfflineProgress(cloudData);
            }
          }
        }
      } catch (e) { console.warn("Cloud load failed", e); }
      updateRecoveryDisplay();
      saveGame();
      if (!shouldBlockLeaderboardForUid(currentUser && currentUser.uid)) pushToLeaderboard();
      try { updateActivePlayerPresence(); } catch (e) {}
      window.dispatchEvent(new Event("auth-ready"));
    } else {
      if (suppressPersistenceForLogout) return;
      try { await fb.signInAnonymously(fb.auth); }
      catch (e) { console.error("Anon sign-in failed", e); }
    }
  });
}
if (window.fb) initAuth();
else window.addEventListener("firebase-ready", initAuth);

/* ========== START ========== */
ensurePlayerId();
loadGame();
ensurePlayerId();
updateIncome();
updatePotionStatusBar();
updateCometEvent();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) saveOnBackground();
  else resumeFromBackground();
});
window.addEventListener("pagehide", saveOnBackground);
window.addEventListener("beforeunload", saveOnBackground);
window.addEventListener("pageshow", (e) => {
  if (e.persisted) resumeFromBackground();
});

// Expose globals for admin.js
window.gameState = {
  get score() { return score; }, set score(v) { score = v; updateScore(); },
  get crystals() { return crystals; }, set crystals(v) { crystals = v; updateScore(); },
  get stell() { return stell; }, set stell(v) { stell = v; updateScore(); },
  get clickPower() { return clickPower; }, set clickPower(v) { clickPower = v; updateIncome(); },
  get autoClicker() { return autoClicker; }, set autoClicker(v) { autoClicker = v; updateIncome(); },
  get goldClicks() { return goldClicks; }, set goldClicks(v) { goldClicks = v; updateWaveBars(); },
  get diamondClicks() { return diamondClicks; }, set diamondClicks(v) { diamondClicks = v; updateWaveBars(); },
  get waveActive() { return waveActive; },
  get waveMultiplier() { return waveMultiplier; },
  get activeWaveType() { return activeWaveType; },
  get stats() { return stats; },
  get profile() { return profile; },
  get playerId() { return playerId; }, set playerId(v) { playerId = v || playerId; },
  get settings() { return settings; },
  get shopItemsData() { return shopItemsData; },
  get currentUser() { return currentUser; },
  get isAdmin() { return isAdmin; }, set isAdmin(v) { isAdmin = v; },
  get remoteAdminUids() { return remoteAdminUids; },
  get localAdminGranted() { return localAdminGranted; }, set localAdminGranted(v) { localAdminGranted = !!v; },
  get recoveryCode() { return recoveryCode; }, set recoveryCode(v) { recoveryCode = v; updateRecoveryDisplay(); },
  get usedPromoCodes() { return usedPromoCodes; },
  get soundEnabled() { return soundEnabled; }, set soundEnabled(v) { soundEnabled = v; },
  get lastPushedFish() { return lastPushedFish; }, set lastPushedFish(v) { lastPushedFish = v; },
  get rebirthCount() { return rebirthCount; }, set rebirthCount(v) { rebirthCount = v; },
  get rebirthMultiplier() { return rebirthMultiplier; }, set rebirthMultiplier(v) { rebirthMultiplier = v; },
  get potions() { return potions; }, set potions(v) { potions = v; },
  get vipActive() { return vipActive; }, set vipActive(v) { vipActive = !!v; updateIncome(); },
  get imperialActive() { return imperialActive; }, set imperialActive(v) { imperialActive = !!v; updateIncome(); }
};
window.gameFns = {
  formatNum, parseNumInput, formatTime, formatDuration, escapeHtml, normalizeImportedSave, createProtectedSavePayloadForData,
  updateScore, updateIncome, updateWaveBars, updateRecoveryDisplay,
  saveGame, buildSaveData, applySaveData,
  startWave, endWave, queueWavesSequentially,
  playRewardSound, playWaveSound, playBuySound, playEggCrackSound, playEggRevealSound, showNotification,
  openMenu, closeAllMenus, renderShop, renderPotionShop, renderStats, loadTop, renderTop, pushToLeaderboard, postSystemChat, forceStartCometEvent, setCometSystemEnabled, resetCometTimer,
  checkAdmin, isUidAdmin, canUseAdmin, spawnFlyingFish, spawnFlyingCrystal,
  getRebirthCost, doRebirth, getClickIncome, getAutoIncome, getPetLuckMult, updatePotionStatusBar, grantVipPetIfPossible, grantImperialPetIfPossible
};