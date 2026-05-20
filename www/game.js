/* ==========================================================
   CAT CLICKER — game.js v2.3-fix
   ========================================================== */

const ADMIN_UIDS = [
  "V7fKSuIYmpaJPTturXzJWdScaF32",
  "wN1SFDtgooNQ18CbDiAZVDN5K3e2"
];
const BANNED_UIDS = [];

const PROMO_CODES = {
  "RELEASE": { fish: 1000, message: "Release bonus! +1000 fish" },
  "BSJWMQLQIWHSBNDJSJSJSBS": {
    fish: 10000000,
    queueWaves: [{type:"diamond"},{type:"diamond"},{type:"diamond"}],
    message: "MEGA REWARD!\n+10M fish\n+3 diamond waves!"
  }
};

/* ========== ЗВУКИ ========== */
let audioCtx = null;
let soundEnabled = true;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
    catch(e){ console.warn("Audio not supported"); }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
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
  const c = ensureAudio(); if (!c) return;
  const now = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(600, now);
  o.frequency.exponentialRampToValueAtTime(900, now + 0.05);
  o.frequency.exponentialRampToValueAtTime(500, now + 0.12);
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  o.connect(g); g.connect(c.destination);
  o.start(now); o.stop(now + 0.15);
  const o2 = c.createOscillator(), g2 = c.createGain();
  o2.type = "square";
  o2.frequency.setValueAtTime(300, now);
  o2.frequency.exponentialRampToValueAtTime(450, now + 0.05);
  g2.gain.setValueAtTime(0.06, now);
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
document.addEventListener("click", (e) => {
  if (e.target.closest(".ui-click")) playUIClick();
}, true);

/* ========== HELPERS ========== */
const $ = (id) => document.getElementById(id);
const on = (id, event, handler) => {
  const el = $(id);
  if (el) el.addEventListener(event, handler);
};

/* ========== УВЕДОМЛЕНИЯ ========== */
function showNotification(text, color = "#4ade80", duration = 3000) {
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
  setTimeout(() => { if (notif.parentNode) notif.remove(); }, duration);
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

/* ========== КОСМОС ========== */
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

/* ========== ФОР МАТИР ОВАНИЕ ========== */
function formatNum(n) {
  if (n < 0) return "-" + formatNum(-n);
  if (n >= 1e15) return (n / 1e15).toFixed(1) + "Qa";
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}
function parseNumInput(str) {
  if (!str) return NaN;
  str = str.trim().toUpperCase();
  const suffixes = { K: 1e3, M: 1e6, B: 1e9, T: 1e12, QA: 1e15 };
  for (const [s, mult] of Object.entries(suffixes)) {
    if (str.endsWith(s)) {
      const num = parseFloat(str.slice(0, -s.length));
      return isNaN(num) ? NaN : Math.floor(num * mult);
    }
  }
  return parseInt(str);
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

/* ========== ДАННЫЕ ========== */
let score = 0;
let crystals = 0;
let clickPower = 1;
let autoClicker = 0;
let goldClicks = 0;
let diamondClicks = 0;
let activeFish = 0;
const MAX_FISH = 3;
let waveActive = false;
let waveMultiplier = 1;
let activeWaveType = null;
const GOLD_REQUIRED = 100;
const DIAMOND_REQUIRED = 1000;
let stats = {
  totalClicks: 0, totalFishEarned: 0, playTimeSec: 0,
  goldWaves: 0, diamondWaves: 0, itemsBought: 0
};
let profile = { name: "", avatar: null };
let settings = { glowEnabled: true, soundEnabled: true };
let currentUser = null;
let recoveryCode = null;
let lastPushedFish = -1;
let isAdmin = false;
let usedPromoCodes = [];
let pendingOfflineFish = 0;
let rebirthCount = 0;
let rebirthMultiplier = 1;
let potions = { luck: 0, speed: 0, fish: 0 };
let currentShopTab = "click";
let lastClickTime = 0;
const CLICK_DELAY = 50;
const SAVE_KEY = "catclicker_save";
const OFFLINE_MIN_SECONDS = 30;
const OFFLINE_MAX_SECONDS = 8 * 3600;
const OFFLINE_EFFICIENCY = 0.1;
let lastHiddenAt = null;
let lastResumeHandledAt = 0;

const scoreText = $("scoreText");
const crystalText = $("crystalText");
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

/* ========== МАГАЗИН Р ЫБЫ ========== */
const shopItemsData = [
  { name: "Double Fish", desc: "+1 fish per click", basePrice: 10, owned: 0, category: "click", apply: () => clickPower += 1 },
  { name: "Lucky Paw", desc: "+5 fish per click", basePrice: 200, owned: 0, category: "click", apply: () => clickPower += 5 },
  { name: "Golden Cat", desc: "+25 fish per click", basePrice: 1000, owned: 0, category: "click", apply: () => clickPower += 25 },
  { name: "Diamond Paw", desc: "+100 fish per click", basePrice: 10000, owned: 0, category: "click", apply: () => clickPower += 100 },
  { name: "Emerald Claw", desc: "+500 fish per click", basePrice: 100000, owned: 0, category: "click", apply: () => clickPower += 500 },
  { name: "Cosmic Touch", desc: "+2K fish per click", basePrice: 1000000, owned: 0, category: "click", apply: () => clickPower += 2000 },
  { name: "Godlike Tap", desc: "+10K fish per click", basePrice: 50000000, owned: 0, category: "click", apply: () => clickPower += 10000 },
  { name: "Infinity Finger", desc: "+50K fish per click", basePrice: 500000000, owned: 0, category: "click", apply: () => clickPower += 50000 },
  { name: "Universe Splitter", desc: "+200K fish per click", basePrice: 5000000000, owned: 0, category: "click", apply: () => clickPower += 200000 },
  { name: "Multiverse Cat", desc: "+1M fish per click", basePrice: 50000000000, owned: 0, category: "click", apply: () => clickPower += 1000000 },

  { name: "Auto Fisher", desc: "+1 fish/sec", basePrice: 50, owned: 0, category: "auto", apply: () => autoClicker += 1 },
  { name: "Fish Farm", desc: "+10 fish/sec", basePrice: 5000, owned: 0, category: "auto", apply: () => autoClicker += 10 },
  { name: "Fish Factory", desc: "+50 fish/sec", basePrice: 50000, owned: 0, category: "auto", apply: () => autoClicker += 50 },
  { name: "Fish Mine", desc: "+200 fish/sec", basePrice: 500000, owned: 0, category: "auto", apply: () => autoClicker += 200 },
  { name: "Fish Dimension", desc: "+1K fish/sec", basePrice: 5000000, owned: 0, category: "auto", apply: () => autoClicker += 1000 },
  { name: "Time Warp", desc: "+5K fish/sec", basePrice: 50000000, owned: 0, category: "auto", apply: () => autoClicker += 5000 },
  { name: "Galaxy Net", desc: "+25K fish/sec", basePrice: 500000000, owned: 0, category: "auto", apply: () => autoClicker += 25000 },
  { name: "Universe Harvester", desc: "+100K fish/sec", basePrice: 5000000000, owned: 0, category: "auto", apply: () => autoClicker += 100000 },
  { name: "Void Collector", desc: "+500K fish/sec", basePrice: 50000000000, owned: 0, category: "auto", apply: () => autoClicker += 500000 },
  { name: "Infinity Stream", desc: "+2M fish/sec", basePrice: 500000000000, owned: 0, category: "auto", apply: () => autoClicker += 2000000 }
];

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
function getClickIncome() {
  return clickPower * waveMultiplier * rebirthMultiplier * getFishPotionMult();
}
function getAutoIncome() {
  return autoClicker * waveMultiplier * rebirthMultiplier * getFishPotionMult() * getSpeedPotionMult();
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
}

/* ========== ЗЕЛЬЯ ========== */
const potionItemsData = [
  { name: "Luck Potion", desc: "+Luck for 10 min", icon: "LuckPotion.png", price: 3, type: "luck", duration: 10 * 60 * 1000 },
  { name: "Speed Potion", desc: "x2 auto speed 5 min", icon: "SpeedPotion.png", price: 2, type: "speed", duration: 5 * 60 * 1000 },
  { name: "Fish Potion", desc: "x5 fish 30 min", icon: "FishPotion.png", price: 5, type: "fish", duration: 30 * 60 * 1000 }
];

function renderPotionShop() {
  const el = $("potionItems");
  if (!el) return;
  el.innerHTML = "";
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
    * ((now < (data.potions?.fish || 0)) ? 5 : 1)
    * ((now < (data.potions?.speed || 0)) ? 2 : 1);
}
function getOfflineRewardData(data, now = Date.now()) {
  if (!data || !data.lastOnline) return { diffSec: 0, offlineSec: 0, earned: 0 };
  const diffSec = Math.floor((now - data.lastOnline) / 1000);
  if (diffSec < OFFLINE_MIN_SECONDS) return { diffSec, offlineSec: 0, earned: 0 };
  const offlineSec = Math.min(diffSec, OFFLINE_MAX_SECONDS);
  const earned = Math.floor((data.autoClicker || 0) * offlineSec * getOfflineMultiplier(data, now) * OFFLINE_EFFICIENCY);
  return { diffSec, offlineSec, earned };
}
function processOfflineProgress(data) {
  const reward = getOfflineRewardData(data);
  if (reward.earned <= 0) return false;
  pendingOfflineFish += reward.earned;
  openOfflinePopup(reward.offlineSec, pendingOfflineFish);
  return true;
}

/* ========== SAVE / LOAD ========== */
function buildSaveData(lastOnlineOverride = Date.now()) {
  return {
    score, crystals, clickPower, autoClicker, goldClicks, diamondClicks,
    rebirthCount, rebirthMultiplier, potions,
    shopOwned: shopItemsData.map(i => i.owned),
    stats, profile, settings, recoveryCode, usedPromoCodes,
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
  clickPower = data.clickPower || 1;
  autoClicker = data.autoClicker || 0;
  goldClicks = data.goldClicks || 0;
  diamondClicks = data.diamondClicks || 0;
  if (data.rebirthCount !== undefined) rebirthCount = data.rebirthCount;
  if (data.rebirthMultiplier !== undefined) rebirthMultiplier = data.rebirthMultiplier;
  if (data.potions) potions = data.potions;
  if (data.shopOwned) {
    data.shopOwned.forEach((count, i) => {
      if (shopItemsData[i]) shopItemsData[i].owned = count;
    });
  }
  if (data.stats) stats = { ...stats, ...data.stats };
  if (data.profile) profile = { ...profile, ...data.profile };
  if (data.settings) settings = { ...settings, ...data.settings };
  if (data.recoveryCode !== undefined) recoveryCode = data.recoveryCode;
  if (data.usedPromoCodes) usedPromoCodes = data.usedPromoCodes;
  soundEnabled = settings.soundEnabled !== false;
  updateScore();
  updateIncome();
  updateWaveBars();
  applyProfile();
  applySettings();
  updateRecoveryDisplay();
}
function saveGame(lastOnlineOverride = Date.now()) {
  persistSaveData(buildSaveData(lastOnlineOverride));
}
function loadGame() {
  const data = readLocalSave();
  if (!data) return;
  applySaveData(data);
  processOfflineProgress(data);
}
function saveOnBackground() {
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
setInterval(() => saveGame(), 5000);
setInterval(() => { stats.playTimeSec++; }, 1000);
setInterval(() => {
  if (currentUser && stats.totalFishEarned !== lastPushedFish) {
    pushToLeaderboard();
    lastPushedFish = stats.totalFishEarned;
  }
}, 10000);

/* ========== INCOME ========== */
function updateIncome() {
  if (!incomeClick || !incomeSec) return;
  incomeClick.textContent = `+${formatNum(getClickIncome())}/click`;
  incomeSec.textContent = `+${formatNum(getAutoIncome())}/sec`;
}

/* ========== КЛИК ========== */
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
    stats.totalFishEarned += totalFish;
    if (!waveActive) { goldClicks++; diamondClicks++; checkWaves(); }
    updateScore();
    updateWaveBars();
  });
  catBtn.addEventListener("mousedown", (e) => e.preventDefault());
}
function updateScore() {
  if (scoreText) scoreText.textContent = formatNum(score);
  if (crystalText) crystalText.textContent = formatNum(crystals);
  updateIncome();
  renderShop();
}

/* ========== ВОЛНЫ ========== */
function updateWaveBars() {
  if (goldFill) goldFill.style.width = Math.min((goldClicks / GOLD_REQUIRED) * 100, 100) + "%";
  if (diamondFill) diamondFill.style.width = Math.min((diamondClicks / DIAMOND_REQUIRED) * 100, 100) + "%";
}
function checkWaves() {
  if (diamondClicks >= DIAMOND_REQUIRED) { diamondClicks = 0; startWave("diamond", 5, 10); }
  else if (goldClicks >= GOLD_REQUIRED) { goldClicks = 0; startWave("gold", 2, 5); }
}
function startWave(type, multiplier, duration) {
  waveActive = true;
  waveMultiplier = multiplier;
  activeWaveType = type;
  if (type === "gold") stats.goldWaves++;
  else if (type === "diamond") stats.diamondWaves++;
  playWaveSound(type);
  if (settings.glowEnabled && waveGlow) waveGlow.className = "wave-glow active " + type;
  if (multBadge) {
    multBadge.textContent = `x${multiplier} ${type==="gold"?"GOLDEN":(type==="diamond"?"DIAMOND":(type==="rainbow"?"RAINBOW":"AMETHYST"))} WAVE`;
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
    const interval = setInterval(() => {
      remaining--;
      if (timerEl) timerEl.textContent = remaining + "s";
      if (remaining <= 0) { clearInterval(interval); endWave(type); }
    }, 1000);
  } else {
    updateIncome();
    setTimeout(() => endWave(type), duration * 1000);
  }
  updateWaveBars();
}
function endWave(type) {
  waveActive = false;
  waveMultiplier = 1;
  activeWaveType = null;
  if (waveGlow) waveGlow.className = "wave-glow";
  if (multBadge) multBadge.className = "multiplier-badge";
  if (type === "gold" || type === "diamond") {
    const bg = type === "gold" ? goldBg : diamondBg;
    if (bg) bg.classList.remove("active-wave");
    const timerEl = type === "gold" ? goldTimer : diamondTimer;
    if (timerEl) timerEl.textContent = "";
  }
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

/* ========== Р ЫБКА ========== */
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

/* ========== РљР ИСТАЛЛЫ ========== */
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

/* ========== МЕНЮ ========== */
const overlay = $("overlay");
const shopMenu = $("shopMenu");
const potionMenu = $("potionMenu");
const settingsMenu = $("settingsMenu");
const profileMenu = $("profileMenu");
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
  if (menu === topMenu) loadTop();
}
function closeAllMenus() {
  if (overlay) overlay.classList.remove("active");
  [shopMenu, potionMenu, settingsMenu, profileMenu, topMenu, adminMenu].forEach(m => {
    if (m) m.classList.remove("active");
  });
}
on("shopBtn", "click", () => openMenu(shopMenu));
on("potionShopBtn", "click", () => openMenu(potionMenu));
on("settingsBtn", "click", () => openMenu(settingsMenu));
on("profileBtn", "click", () => openMenu(profileMenu));
on("topBtn", "click", () => openMenu(topMenu));
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", closeAllMenus);
});
if (overlay) overlay.addEventListener("click", closeAllMenus);

/* ========== МАГАЗИН ========== */
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
        item.apply();
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

/* ========== РќРђРЎРўР ОЙКИ ========== */
const glowToggle = $("glowToggle");
const soundToggle = $("soundToggle");
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
function applySettings() {
  if (glowToggle) glowToggle.classList.toggle("on", settings.glowEnabled);
  if (soundToggle) soundToggle.classList.toggle("on", settings.soundEnabled);
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

/* ========== РџР ОМОКОДЫ ========== */
function activatePromoCode(rawCode) {
  if (!rawCode) return;
  const code = rawCode.trim().toUpperCase();
  if (!PROMO_CODES[code]) { alert("Invalid code!"); return; }
  if (usedPromoCodes.includes(code)) { alert("Code already used!"); return; }
  const reward = PROMO_CODES[code];
  if (reward.fish) { score += reward.fish; stats.totalFishEarned += reward.fish; }
  if (reward.clickPower) clickPower += reward.clickPower;
  if (reward.autoClicker) autoClicker += reward.autoClicker;
  if (reward.queueWaves && reward.queueWaves.length) queueWavesSequentially(reward.queueWaves);
  usedPromoCodes.push(code);
  playBuySound();
  updateScore();
  saveGame();
  showNotification("✓ " + (reward.message || "Code activated!"), "#4ade80", 4000);
  const inp = $("promoInput");
  if (inp) inp.value = "";
}
on("promoBtn", "click", () => {
  const inp = $("promoInput");
  if (inp) activatePromoCode(inp.value);
});

/* ========== СЕКР ЕТНЫЙ ВХОД ========== */
let settingsTapCount = 0;
let settingsTapTimer = null;
if (settingsMenu) {
  const settingsTitle = settingsMenu.querySelector(".menu-title");
  if (settingsTitle) {
    settingsTitle.addEventListener("click", () => {
      if (!currentUser || !ADMIN_UIDS.includes(currentUser.uid)) return;
      settingsTapCount++;
      clearTimeout(settingsTapTimer);
      settingsTapTimer = setTimeout(() => { settingsTapCount = 0; }, 3000);
      if (settingsTapCount >= 10) { settingsTapCount = 0; isAdmin = true; openMenu(adminMenu); }
    });
  }
}
function checkAdmin() {
  return isAdmin && currentUser && ADMIN_UIDS.includes(currentUser.uid);
}

/* ========== РџР ОФИЛЬ ========== */
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
  profile.name = e.target.value;
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
}

/* ========== ТОП ========== */
let currentTopTab = "fish";
let cachedLeaderboard = [];
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
    const snap = await window.fb.get(window.fb.ref(window.fb.db, "leaderboard"));
    cachedLeaderboard = Object.values(snap.val() || {});
    renderTop(cachedLeaderboard);
  } catch (e) { topList.innerHTML = `<div class="top-loading">Failed to load</div>`; }
}
function renderTop(list) {
  const topList = $("topList");
  if (!topList) return;
  topList.innerHTML = "";
  if (!list.length) {
    topList.innerHTML = `<div class="top-loading">No players yet.<br/>Click cat to be first!</div>`;
    return;
  }
  const filtered = list.filter(p => !BANNED_UIDS.includes(p.uid));
  const sorted = [...filtered].sort((a, b) => (b[currentTopTab] || 0) - (a[currentTopTab] || 0)).slice(0, 50);
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
    else value = formatTime(player.time || 0);
    el.innerHTML = `
      <div class="top-rank ${rankClass}">#${rank}</div>
      <div class="top-avatar"><img src="${player.avatar || 'CatIcon1.png'}" alt="" onerror="this.src='CatIcon1.png'" /></div>
      <div class="top-name">${escapeHtml(player.name || 'Anonymous')}</div>
      <div class="top-value">${value}</div>
    `;
    topList.appendChild(el);
  });
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
async function pushToLeaderboard() {
  if (!currentUser || !window.fb) return;
  try {
    await window.fb.set(window.fb.ref(window.fb.db, `leaderboard/${currentUser.uid}`), {
      uid: currentUser.uid, name: profile.name || "Anonymous", avatar: profile.avatar || null,
      fish: stats.totalFishEarned, clicks: stats.totalClicks, time: stats.playTimeSec, updated: Date.now()
    });
  } catch (e) { console.warn("Leaderboard push failed", e); }
}

/* ========== ВОССТАНОВЛЕНИЕ ========== */
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
  if (recoveryCode || !currentUser || !window.fb) return;
  const fb = window.fb;
  if (recoveryCode) {
    try { await fb.remove(fb.ref(fb.db, `recovery/${recoveryCode}`)); } catch(e){}
  }
  for (let i = 0; i < 5; i++) {
    const code = generateRecoveryCode();
    try {
      const snap = await fb.get(fb.ref(fb.db, `recovery/${code}`));
      if (!snap.exists()) {
        await fb.set(fb.ref(fb.db, `recovery/${code}`), currentUser.uid);
        recoveryCode = code;
        updateRecoveryDisplay();
        saveGame();
        return;
      }
    } catch (e) { console.warn("Recovery code gen error", e); }
  }
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
    if (user) {
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
      if (!recoveryCode) await ensureRecoveryCode();
      updateRecoveryDisplay();
      saveGame();
      pushToLeaderboard();
      window.dispatchEvent(new Event("auth-ready"));
    } else {
      try { await fb.signInAnonymously(fb.auth); }
      catch (e) { console.error("Anon sign-in failed", e); }
    }
  });
}
if (window.fb) initAuth();
else window.addEventListener("firebase-ready", initAuth);

/* ========== START ========== */
loadGame();
updateIncome();

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
  get clickPower() { return clickPower; }, set clickPower(v) { clickPower = v; updateIncome(); },
  get autoClicker() { return autoClicker; }, set autoClicker(v) { autoClicker = v; updateIncome(); },
  get goldClicks() { return goldClicks; }, set goldClicks(v) { goldClicks = v; updateWaveBars(); },
  get diamondClicks() { return diamondClicks; }, set diamondClicks(v) { diamondClicks = v; updateWaveBars(); },
  get waveActive() { return waveActive; },
  get waveMultiplier() { return waveMultiplier; },
  get activeWaveType() { return activeWaveType; },
  get stats() { return stats; },
  get profile() { return profile; },
  get settings() { return settings; },
  get shopItemsData() { return shopItemsData; },
  get currentUser() { return currentUser; },
  get isAdmin() { return isAdmin; }, set isAdmin(v) { isAdmin = v; },
  get recoveryCode() { return recoveryCode; }, set recoveryCode(v) { recoveryCode = v; updateRecoveryDisplay(); },
  get usedPromoCodes() { return usedPromoCodes; },
  get soundEnabled() { return soundEnabled; }, set soundEnabled(v) { soundEnabled = v; },
  get lastPushedFish() { return lastPushedFish; }, set lastPushedFish(v) { lastPushedFish = v; },
  get rebirthCount() { return rebirthCount; }, set rebirthCount(v) { rebirthCount = v; },
  get rebirthMultiplier() { return rebirthMultiplier; }, set rebirthMultiplier(v) { rebirthMultiplier = v; },
  get potions() { return potions; }, set potions(v) { potions = v; }
};
window.gameFns = {
  formatNum, parseNumInput, formatTime, formatDuration, escapeHtml,
  updateScore, updateIncome, updateWaveBars, updateRecoveryDisplay,
  saveGame, buildSaveData, applySaveData,
  startWave, endWave, queueWavesSequentially,
  playRewardSound, playWaveSound, playBuySound, showNotification,
  openMenu, closeAllMenus, renderShop, renderPotionShop, renderStats, loadTop, renderTop, pushToLeaderboard,
  checkAdmin, spawnFlyingFish, spawnFlyingCrystal,
  getRebirthCost, doRebirth, getClickIncome, getAutoIncome
};