/* ==========================================================
   CAT CLICKER — game.js
   ========================================================== */

// ===================== ADMIN UIDS =====================
const ADMIN_UIDS = [
  "V7fKSuIYmpaJPTturXzJWdScaF32"
];
// ======================================================

// ===================== PROMO CODES ====================
// Награды:
//   fish        — добавить рыбы
//   clickPower  — добавить клик-силы
//   autoClicker — добавить авто-кликеров
//   queueWaves  — массив волн, которые сыграют подряд автоматически
//                 каждая волна: { type: "gold"|"diamond" }
const PROMO_CODES = {
  "RELEASE": {
    fish: 1000,
    message: "Release bonus! +1000 fish"
  },
  "BSJWMQLQIWHSBNDJSJSJSBS": {
    fish: 10000000,
    queueWaves: [
      { type: "diamond" },
      { type: "diamond" },
      { type: "diamond" }
    ],
    message: "MEGA REWARD!\n+10M fish\n+3 diamond waves!"
  }
};
// ======================================================

/* ========== ЗВУКИ ========== */
let audioCtx = null;
let soundEnabled = true;

function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { console.warn("Audio not supported"); }
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

function playWaveSound(type) {
  if (!soundEnabled) return;
  const c = ensureAudio(); if (!c) return;
  const now = c.currentTime;
  const base = type === "gold" ? 440 : 660;
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
  else console.warn("Element not found:", id);
};

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
      size: Math.random() * 2 + 0.5,
      speedY: Math.random() * 1.2 + 0.2,
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

/* ========== ДАННЫЕ ========== */
let score = 0;
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

const scoreText = $("scoreText");
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

const shopItemsData = [
  { name: "Double Fish", desc: "+1 fish per click", basePrice: 10, owned: 0, apply: () => { clickPower++; } },
  { name: "Auto Fisher", desc: "1 fish per second", basePrice: 50, owned: 0, apply: () => { autoClicker++; } },
  { name: "Lucky Paw", desc: "+5 fish per click", basePrice: 200, owned: 0, apply: () => { clickPower += 5; } },
  { name: "Golden Cat", desc: "+25 fish per click", basePrice: 1000, owned: 0, apply: () => { clickPower += 25; } },
  { name: "Fish Factory", desc: "10 fish per second", basePrice: 5000, owned: 0, apply: () => { autoClicker += 10; } }
];

function getPrice(item) {
  return Math.floor(item.basePrice * Math.pow(1.5, item.owned));
}

function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* ========== SAVE / LOAD ========== */
function buildSaveData() {
  return {
    score, clickPower, autoClicker, goldClicks, diamondClicks,
    shopOwned: shopItemsData.map(i => i.owned),
    stats, profile, settings, recoveryCode, usedPromoCodes
  };
}

function applySaveData(data) {
  if (!data) return;
  score = data.score || 0;
  clickPower = data.clickPower || 1;
  autoClicker = data.autoClicker || 0;
  goldClicks = data.goldClicks || 0;
  diamondClicks = data.diamondClicks || 0;
  if (data.shopOwned) {
    data.shopOwned.forEach((count, i) => {
      if (shopItemsData[i]) shopItemsData[i].owned = count;
    });
  }
  if (data.stats) stats = { ...stats, ...data.stats };
  if (data.profile) profile = { ...profile, ...data.profile };
  if (data.settings) settings = { ...settings, ...data.settings };
  if (data.recoveryCode) recoveryCode = data.recoveryCode;
  if (data.usedPromoCodes) usedPromoCodes = data.usedPromoCodes;
  soundEnabled = settings.soundEnabled !== false;
  updateScore();
  updateIncome();
  updateWaveBars();
  applyProfile();
  applySettings();
  updateRecoveryDisplay();
}

function saveGame() {
  const data = buildSaveData();
  localStorage.setItem("catclicker_save", JSON.stringify(data));
  if (currentUser && window.fb) {
    try { window.fb.set(window.fb.ref(window.fb.db, `users/${currentUser.uid}`), data); }
    catch (e) { console.warn("Cloud save failed", e); }
  }
}

function loadGame() {
  const raw = localStorage.getItem("catclicker_save");
  if (!raw) return;
  try { applySaveData(JSON.parse(raw)); } catch (e) {}
}

setInterval(saveGame, 5000);
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
  const perClick = clickPower * waveMultiplier;
  const perSec = autoClicker * waveMultiplier;
  incomeClick.textContent = `+${formatNum(perClick)}/click`;
  incomeSec.textContent = `+${formatNum(perSec)}/sec`;
}

/* ========== КЛИК ========== */
if (catBtn) {
  catBtn.addEventListener("click", () => {
    catBtn.classList.add("clicked");
    setTimeout(() => catBtn.classList.remove("clicked"), 120);
    playCatClick();

    const totalFish = clickPower * waveMultiplier;
    const fishToSpawn = Math.min(MAX_FISH - activeFish, 3);
    for (let i = 0; i < fishToSpawn; i++) {
      setTimeout(() => spawnFlyingFish(), i * 60);
    }

    score += totalFish;
    stats.totalClicks++;
    stats.totalFishEarned += totalFish;

    if (!waveActive) {
      goldClicks++;
      diamondClicks++;
      checkWaves();
    }

    updateScore();
    updateWaveBars();
  });
  catBtn.addEventListener("mousedown", (e) => e.preventDefault());
}

function updateScore() {
  if (scoreText) scoreText.textContent = formatNum(score);
  updateIncome();
  renderShop();
}

/* ========== ВОЛНЫ ========== */
function updateWaveBars() {
  if (goldFill) goldFill.style.width = Math.min((goldClicks / GOLD_REQUIRED) * 100, 100) + "%";
  if (diamondFill) diamondFill.style.width = Math.min((diamondClicks / DIAMOND_REQUIRED) * 100, 100) + "%";
}

function checkWaves() {
  if (diamondClicks >= DIAMOND_REQUIRED) {
    diamondClicks = 0;
    startWave("diamond", 5, 10);
  } else if (goldClicks >= GOLD_REQUIRED) {
    goldClicks = 0;
    startWave("gold", 2, 5);
  }
}

function startWave(type, multiplier, duration) {
  waveActive = true;
  waveMultiplier = multiplier;
  activeWaveType = type;
  if (type === "gold") stats.goldWaves++;
  else stats.diamondWaves++;
  playWaveSound(type);
  if (settings.glowEnabled && waveGlow) waveGlow.className = "wave-glow active " + type;
  if (multBadge) {
    multBadge.textContent = `x${multiplier} ${type === "gold" ? "GOLDEN" : "DIAMOND"} WAVE`;
    multBadge.className = "multiplier-badge active" + (type === "diamond" ? " diamond-text" : "");
  }
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
  updateWaveBars();
}

function endWave(type) {
  waveActive = false;
  waveMultiplier = 1;
  activeWaveType = null;
  if (waveGlow) waveGlow.className = "wave-glow";
  if (multBadge) multBadge.className = "multiplier-badge";
  const bg = type === "gold" ? goldBg : diamondBg;
  if (bg) bg.classList.remove("active-wave");
  const timerEl = type === "gold" ? goldTimer : diamondTimer;
  if (timerEl) timerEl.textContent = "";
  updateIncome();
  updateWaveBars();
}

// Запускает волны одну за другой
function queueWavesSequentially(waves) {
  let idx = 0;
  function next() {
    if (idx >= waves.length) return;
    const w = waves[idx++];
    if (w.type === "gold") {
      startWave("gold", 2, 5);
      setTimeout(next, 5000);
    } else if (w.type === "diamond") {
      startWave("diamond", 5, 10);
      setTimeout(next, 10000);
    }
  }
  if (waveActive) {
    const waitInterval = setInterval(() => {
      if (!waveActive) {
        clearInterval(waitInterval);
        next();
      }
    }, 500);
  } else {
    next();
  }
}

setInterval(() => {
  if (autoClicker > 0) {
    const earned = autoClicker * waveMultiplier;
    score += earned;
    stats.totalFishEarned += earned;
    updateScore();
  }
}, 1000);

/* ========== РЫБКА ========== */
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

/* ========== МЕНЮ ========== */
const overlay = $("overlay");
const shopMenu = $("shopMenu");
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
  if (menu === profileMenu) renderStats();
  if (menu === topMenu) loadTop();
}

function closeAllMenus() {
  if (overlay) overlay.classList.remove("active");
  [shopMenu, settingsMenu, profileMenu, topMenu, adminMenu].forEach(m => {
    if (m) m.classList.remove("active");
  });
}

on("shopBtn", "click", () => openMenu(shopMenu));
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
  for (const item of shopItemsData) {
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

/* ========== НАСТРОЙКИ ========== */
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

on("resetBtn", "click", () => {
  if (confirm("Reset ALL progress? This cannot be undone!")) {
    localStorage.removeItem("catclicker_save");
    location.reload();
  }
});

/* ========== ПРОМОКОДЫ ========== */
function activatePromoCode(rawCode) {
  if (!rawCode) return;
  const code = rawCode.trim().toUpperCase();
  if (!PROMO_CODES[code]) { alert("Invalid code!"); return; }
  if (usedPromoCodes.includes(code)) { alert("Code already used!"); return; }

  const reward = PROMO_CODES[code];
  if (reward.fish) {
    score += reward.fish;
    stats.totalFishEarned += reward.fish;
  }
  if (reward.clickPower) clickPower += reward.clickPower;
  if (reward.autoClicker) autoClicker += reward.autoClicker;

  if (reward.queueWaves && reward.queueWaves.length) {
    queueWavesSequentially(reward.queueWaves);
  }

  usedPromoCodes.push(code);
  playBuySound();
  updateScore();
  saveGame();
  alert("✓ " + (reward.message || "Code activated!"));
  const inp = $("promoInput");
  if (inp) inp.value = "";
}

on("promoBtn", "click", () => {
  const inp = $("promoInput");
  if (inp) activatePromoCode(inp.value);
});

/* ========== СЕКРЕТНЫЙ ВХОД (ТОЛЬКО ДЛЯ АДМИНА) ========== */
// Проверка происходит ДО подсчёта тапов
// Если игрок не админ — счётчик даже не увеличивается
// Это значит что обычные игроки могут жать сколько угодно — ничего не произойдёт
let settingsTapCount = 0;
let settingsTapTimer = null;

if (settingsMenu) {
  const settingsTitle = settingsMenu.querySelector(".menu-title");
  if (settingsTitle) {
    settingsTitle.addEventListener("click", () => {
      // ===== ЗАЩИТА: только админ может открыть =====
      if (!currentUser || !ADMIN_UIDS.includes(currentUser.uid)) {
        return; // не админ — выходим, ничего не делаем
      }
      // ==============================================

      settingsTapCount++;
      clearTimeout(settingsTapTimer);
      settingsTapTimer = setTimeout(() => { settingsTapCount = 0; }, 3000);
      if (settingsTapCount >= 10) {
        settingsTapCount = 0;
        isAdmin = true;
        openMenu(adminMenu);
      }
    });
  }
}

/* ========== АДМИН: СЕБЕ ========== */
// Дополнительная защита: даже если хакер найдёт data-addfish в HTML
// и попробует кликнуть — без isAdmin ничего не сработает
document.querySelectorAll("[data-addfish]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!isAdmin || !currentUser || !ADMIN_UIDS.includes(currentUser.uid)) return;
    const amount = parseInt(btn.dataset.addfish);
    score += amount;
    stats.totalFishEarned += amount;
    updateScore();
    saveGame();
  });
});

function checkAdmin() {
  return isAdmin && currentUser && ADMIN_UIDS.includes(currentUser.uid);
}

on("adminCustomFishBtn", "click", () => {
  if (!checkAdmin()) return;
  const inp = $("adminCustomFish");
  if (!inp) return;
  const v = parseInt(inp.value);
  if (isNaN(v)) { alert("Invalid number"); return; }
  score += v;
  if (v > 0) stats.totalFishEarned += v;
  if (score < 0) score = 0;
  updateScore();
  saveGame();
  inp.value = "";
});

on("adminCustomClickBtn", "click", () => {
  if (!checkAdmin()) return;
  const inp = $("adminCustomClick");
  if (!inp) return;
  const v = parseInt(inp.value);
  if (isNaN(v) || v < 0) { alert("Invalid number"); return; }
  clickPower = v;
  updateIncome();
  saveGame();
  inp.value = "";
});

on("adminCustomAutoBtn", "click", () => {
  if (!checkAdmin()) return;
  const inp = $("adminCustomAuto");
  if (!inp) return;
  const v = parseInt(inp.value);
  if (isNaN(v) || v < 0) { alert("Invalid number"); return; }
  autoClicker = v;
  updateIncome();
  saveGame();
  inp.value = "";
});

on("adminGoldWave", "click", () => {
  if (!checkAdmin()) return;
  if (waveActive) endWave(activeWaveType);
  startWave("gold", 2, 5);
});

on("adminDiamondWave", "click", () => {
  if (!checkAdmin()) return;
  if (waveActive) endWave(activeWaveType);
  startWave("diamond", 5, 10);
});

/* ========== АДМИН: ИГРОКИ ========== */
let cachedAdminPlayers = [];

async function loadAdminPlayers() {
  if (!checkAdmin() || !window.fb) return;
  const list = $("adminPlayersList");
  if (!list) return;
  list.innerHTML = `<div class="top-loading">Loading...</div>`;
  try {
    const snap = await window.fb.get(window.fb.ref(window.fb.db, "leaderboard"));
    const data = snap.val() || {};
    cachedAdminPlayers = Object.entries(data);
    cachedAdminPlayers.sort((a, b) => (b[1].fish || 0) - (a[1].fish || 0));
    renderAdminPlayers();
  } catch (e) {
    list.innerHTML = `<div class="top-loading">Error: ${e.message}</div>`;
  }
}

function renderAdminPlayers(filter = "") {
  const list = $("adminPlayersList");
  if (!list) return;
  list.innerHTML = "";

  const f = filter.toLowerCase().trim();
  const filtered = f
    ? cachedAdminPlayers.filter(([uid, p]) =>
        (p.name || "").toLowerCase().includes(f) || uid.toLowerCase().includes(f))
    : cachedAdminPlayers;

  if (!filtered.length) {
    list.innerHTML = `<div class="top-loading">No players</div>`;
    return;
  }

  filtered.forEach(([uid, p]) => {
    const el = document.createElement("div");
    el.className = "admin-player-card";
    el.innerHTML = `
      <div class="admin-player-head">
        <span class="admin-player-name">${escapeHtml(p.name || "Anon")}</span>
        <span class="admin-player-fish">${formatNum(p.fish || 0)} 🐟</span>
      </div>
      <div class="admin-player-uid">${uid}</div>
      <div class="admin-player-actions">
        <button class="admin-mini-btn ui-click" data-action="addfish">+1K</button>
        <button class="admin-mini-btn ui-click" data-action="addfish10k">+10K</button>
        <button class="admin-mini-btn ui-click" data-action="addfish100k">+100K</button>
        <button class="admin-mini-btn ui-click" data-action="custom">CUSTOM 🐟</button>
        <button class="admin-mini-btn gold-admin ui-click" data-action="goldwave">GOLD</button>
        <button class="admin-mini-btn diamond-admin ui-click" data-action="diamondwave">DIAMOND</button>
        <button class="admin-mini-btn ui-click" data-action="setclick">SET CLICK</button>
        <button class="admin-mini-btn ui-click" data-action="setauto">SET AUTO</button>
        <button class="admin-mini-btn danger-admin ui-click" data-action="del">DELETE</button>
      </div>
    `;
    el.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => handleAdminAction(uid, p, btn.dataset.action, el));
    });
    list.appendChild(el);
  });
}

async function handleAdminAction(targetUid, playerData, action, cardEl) {
  if (!checkAdmin() || !window.fb) return;
  const fb = window.fb;

  try {
    if (action === "del") {
      if (!confirm(`Delete ${playerData.name || "Anon"} from leaderboard?`)) return;
      await fb.remove(fb.ref(fb.db, `leaderboard/${targetUid}`));
      cardEl.remove();
      return;
    }

    let command = null;
    if (action === "addfish") command = { type: "addfish", amount: 1000 };
    else if (action === "addfish10k") command = { type: "addfish", amount: 10000 };
    else if (action === "addfish100k") command = { type: "addfish", amount: 100000 };
    else if (action === "custom") {
      const v = prompt("Amount of fish to add (can be negative):", "1000");
      if (v === null) return;
      const n = parseInt(v);
      if (isNaN(n)) { alert("Invalid"); return; }
      command = { type: "addfish", amount: n };
    }
    else if (action === "goldwave") command = { type: "wave", waveType: "gold" };
    else if (action === "diamondwave") command = { type: "wave", waveType: "diamond" };
    else if (action === "setclick") {
      const v = prompt("Set click power to:", "1");
      if (v === null) return;
      const n = parseInt(v);
      if (isNaN(n) || n < 0) { alert("Invalid"); return; }
      command = { type: "setclick", value: n };
    }
    else if (action === "setauto") {
      const v = prompt("Set auto clicker to:", "0");
      if (v === null) return;
      const n = parseInt(v);
      if (isNaN(n) || n < 0) { alert("Invalid"); return; }
      command = { type: "setauto", value: n };
    }

    if (!command) return;

    if (targetUid === currentUser.uid) {
      applyAdminCommand(command);
      saveGame();
      alert("✓ Applied locally");
      return;
    }

    command.id = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    command.from = currentUser.uid;
    command.timestamp = Date.now();
    await fb.set(fb.ref(fb.db, `commands/${targetUid}/${command.id}`), command);
    alert(`✓ Command sent to ${playerData.name || "Anon"}!`);
  } catch (e) {
    alert("Failed: " + e.message);
  }
}

on("adminViewPlayers", "click", loadAdminPlayers);
on("adminPlayerSearch", "input", (e) => renderAdminPlayers(e.target.value));

on("adminClearTop", "click", async () => {
  if (!checkAdmin() || !window.fb) return;
  if (!confirm("DELETE ALL LEADERBOARD DATA?")) return;
  if (!confirm("ARE YOU SURE?")) return;
  try {
    await window.fb.remove(window.fb.ref(window.fb.db, "leaderboard"));
    const list = $("adminPlayersList");
    if (list) list.innerHTML = `<div class="top-loading">Cleared!</div>`;
    cachedAdminPlayers = [];
  } catch (e) { alert("Failed: " + e.message); }
});

/* ========== ПРИМЕНЕНИЕ КОМАНД ========== */
function applyAdminCommand(cmd) {
  if (!cmd || !cmd.type) return;
  if (cmd.type === "addfish") {
    score += cmd.amount;
    if (cmd.amount > 0) stats.totalFishEarned += cmd.amount;
    if (score < 0) score = 0;
    updateScore();
  }
  else if (cmd.type === "wave") {
    if (waveActive) endWave(activeWaveType);
    if (cmd.waveType === "gold") startWave("gold", 2, 5);
    else if (cmd.waveType === "diamond") startWave("diamond", 5, 10);
  }
  else if (cmd.type === "queueWaves") {
    if (cmd.waves && cmd.waves.length) {
      queueWavesSequentially(cmd.waves);
    }
  }
  else if (cmd.type === "setclick") {
    clickPower = cmd.value;
    updateIncome();
  }
  else if (cmd.type === "setauto") {
    autoClicker = cmd.value;
    updateIncome();
  }
}

function listenForAdminCommands() {
  if (!currentUser || !window.fb) return;
  const fb = window.fb;
  const cmdRef = fb.ref(fb.db, `commands/${currentUser.uid}`);
  fb.onValue(cmdRef, async (snap) => {
    const data = snap.val();
    if (!data) return;
    for (const [cmdId, cmd] of Object.entries(data)) {
      try {
        applyAdminCommand(cmd);
        await fb.remove(fb.ref(fb.db, `commands/${currentUser.uid}/${cmdId}`));
      } catch (e) { console.warn("Cmd apply error", e); }
    }
    saveGame();
  });
}

/* ========== ПРОФИЛЬ ========== */
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
  } catch (e) {
    topList.innerHTML = `<div class="top-loading">Failed to load</div>`;
  }
}

function renderTop(list) {
  const topList = $("topList");
  if (!topList) return;
  topList.innerHTML = "";
  if (!list.length) {
    topList.innerHTML = `<div class="top-loading">No players yet.<br/>Click cat to be first!</div>`;
    return;
  }
  const sorted = [...list].sort((a, b) => (b[currentTopTab] || 0) - (a[currentTopTab] || 0)).slice(0, 50);
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
      uid: currentUser.uid,
      name: profile.name || "Anonymous",
      avatar: profile.avatar || null,
      fish: stats.totalFishEarned,
      clicks: stats.totalClicks,
      time: stats.playTimeSec,
      updated: Date.now()
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

async function restoreFromCode(code) {
  const fb = window.fb;
  if (!fb || !code) return;
  code = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    alert("Invalid code format. Use: XXXX-XXXX");
    return;
  }
  try {
    const snap = await fb.get(fb.ref(fb.db, `recovery/${code}`));
    const targetUid = snap.val();
    if (!targetUid) { alert("Code not found!"); return; }
    const dataSnap = await fb.get(fb.ref(fb.db, `users/${targetUid}`));
    const data = dataSnap.val();
    if (!data) { alert("No data found!"); return; }
    if (!confirm("This will REPLACE your current progress. Continue?")) return;
    applySaveData(data);
    if (currentUser) {
      recoveryCode = code;
      await fb.set(fb.ref(fb.db, `users/${currentUser.uid}`), buildSaveData());
      await fb.set(fb.ref(fb.db, `recovery/${code}`), currentUser.uid);
      updateRecoveryDisplay();
    }
    saveGame();
    alert("Progress restored!");
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
    if (btn) {
      btn.textContent = "COPIED!";
      setTimeout(() => btn.textContent = "COPY CODE", 1500);
    }
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
          const localData = JSON.parse(localStorage.getItem("catclicker_save") || "null");
          const cloudFish = (cloudData.stats && cloudData.stats.totalFishEarned) || 0;
          const localFish = (localData && localData.stats && localData.stats.totalFishEarned) || 0;
          if (cloudFish > localFish) applySaveData(cloudData);
        }
      } catch (e) { console.warn("Cloud load failed", e); }
      await ensureRecoveryCode();
      updateRecoveryDisplay();
      saveGame();
      pushToLeaderboard();
      listenForAdminCommands();
    } else {
      try { await fb.signInAnonymously(fb.auth); }
      catch (e) { console.error("Anon sign-in failed", e); }
    }
  });
}

if (window.fb) initAuth();
else window.addEventListener("firebase-ready", initAuth);

/* ========== СТАРТ ========== */
loadGame();
updateIncome();