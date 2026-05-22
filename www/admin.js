/* ==========================================================
   CAT CLICKER — admin.js (Admin panel logic)
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (window.gameFns && window.gameState) {
    initAdmin();
  } else {
    window.addEventListener("auth-ready", initAdmin);
    window.addEventListener("firebase-ready", () => {
      if (window.gameFns && window.gameState) initAdmin();
    });
  }
});

function initAdmin() {
  if (window.__adminInitialized) return;
  window.__adminInitialized = true;

  const S = window.gameState;
  const F = window.gameFns;
  const ADMIN_LUCK_DURATION_MS = 10 * 60 * 1000;

  function isRuLocale() {
    const lang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return lang.startsWith("ru") || lang.startsWith("be") || lang.startsWith("uk") || lang.startsWith("kk");
  }

  function pickLocale(ru, en) {
    return isRuLocale() ? ru : en;
  }

  function getCommandMessage(cmd) {
    if (!cmd) return "";
    if (cmd.messageRu || cmd.messageEn) return pickLocale(cmd.messageRu || cmd.messageEn, cmd.messageEn || cmd.messageRu);
    if (cmd.type === "addfish") {
      const amount = cmd.amount || 0;
      return amount >= 0
        ? pickLocale(`🎁 \u0410\u0414\u041C\u0418\u041D \u041E\u0422\u041F\u0420\u0410\u0412\u0418\u041B \u0412\u0410\u041C +${F.formatNum(amount)} \u0420\u042B\u0411\u042B!`, `🎁 Admin sent you +${F.formatNum(amount)} fish!`)
        : pickLocale(`⚠️ \u0410\u0414\u041C\u0418\u041D \u0417\u0410\u0411\u0420\u0410\u041B \u0423 \u0412\u0410\u0421 ${F.formatNum(Math.abs(amount))} \u0420\u042B\u0411\u042B!`, `⚠️ Admin took ${F.formatNum(Math.abs(amount))} fish from you!`);
    }
    if (cmd.type === "addcrystal") {
      const amount = cmd.amount || 0;
      return amount >= 0
        ? pickLocale(`💎 \u0410\u0414\u041C\u0418\u041D \u041E\u0422\u041F\u0420\u0410\u0412\u0418\u041B \u0412\u0410\u041C +${F.formatNum(amount)} \u0410\u041C\u0415\u0422\u0418\u0421\u0422\u041E\u0412!`, `💎 Admin sent you +${F.formatNum(amount)} amethysts!`)
        : pickLocale(`⚠️ \u0410\u0414\u041C\u0418\u041D \u0417\u0410\u0411\u0420\u0410\u041B \u0423 \u0412\u0410\u0421 ${F.formatNum(Math.abs(amount))} \u0410\u041C\u0415\u0422\u0418\u0421\u0422\u041E\u0412!`, `⚠️ Admin took ${F.formatNum(Math.abs(amount))} amethysts from you!`);
    }
    if (cmd.type === "addstell") {
      const amount = cmd.amount || 0;
      return amount >= 0 ? `☄ Admin sent you +${F.formatNum(amount)} Stell!` : `⚠️ Admin took ${F.formatNum(Math.abs(amount))} Stell from you!`;
    }
    if (cmd.type === "wave") {
      const en = { gold: "GOLD WAVE x2 for 5 sec", diamond: "DIAMOND WAVE x5 for 10 sec", rainbow: "RAINBOW WAVE x100 for 5 min", amethyst: "AMETHYST WAVE x100 for 5 min" }[cmd.waveType] || "EVENT";
      return pickLocale(buildAdminWaveMessage(cmd.waveType), `⚡ Admin started ${en}!`);
    }
    if (cmd.type === "setclick") return pickLocale(buildAdminSetClickMessage(cmd.value || 0), `⚡ Admin set your click power to ${F.formatNum(cmd.value || 0)}`);
    if (cmd.type === "setauto") return pickLocale(buildAdminSetAutoMessage(cmd.value || 0), `⚡ Admin set your auto income to ${F.formatNum(cmd.value || 0)}/sec`);
    if (cmd.type === "replaceSave") return pickLocale(buildAdminReplaceSaveMessage(), "⚡ Admin changed your save data!");
    if (cmd.type === "cometevent") return pickLocale("☄ \u0410\u0414\u041C\u0418\u041D \u0417\u0410\u041F\u0423\u0421\u0422\u0418\u041B COMET EVENT!", "☄ Admin started COMET EVENT!");
    if (cmd.type === "grantadmin") return pickLocale("⚡ \u0412\u0410\u041C \u0412\u042B\u0414\u0410\u041D\u0410 \u0410\u0414\u041C\u0418\u041D\u041A\u0410!", "⚡ You have been granted admin rights!");
    if (cmd.type === "revokeadmin") return pickLocale("⚠️ \u0412\u0410\u0428\u0410 \u0410\u0414\u041C\u0418\u041D\u041A\u0410 \u0411\u042B\u041B\u0410 \u0417\u0410\u0411\u0420\u0410\u041D\u0410!", "⚠️ Your admin rights have been revoked!");
    return cmd.message || "";
  }

  const PET_ADMIN_NAMES = {
    random: "RANDOM PET",
    cat: "Cat",
    dog: "Dog",
    slime: "Slime",
    draco: "Draco",
    mooncat: "Moon Cat"
  };

  function getPetAdminName(key) {
    return PET_ADMIN_NAMES[key] || key || "PET";
  }

  function parsePetCount(raw) {
    const n = F.parseNumInput(String(raw || "1"));
    if (isNaN(n) || n <= 0) return 1;
    return Math.min(100, Math.floor(n));
  }

  function getPetApiWithRetry(callback, tries = 20) {
    if (window.petSystemApi && typeof window.petSystemApi.adminAddPets === "function") {
      callback(window.petSystemApi);
      return;
    }
    if (tries <= 0) {
      F.showNotification("Pet system not ready!", "#ff6666", 2500);
      return;
    }
    setTimeout(() => getPetApiWithRetry(callback, tries - 1), 250);
  }

  function applyLocalAddPet(petKey, count) {
    getPetApiWithRetry((api) => {
      api.adminAddPets(petKey || "random", count || 1, { silent: true });
      F.saveGame();
    });
  }

  function applyLocalForcedPetEgg(petKey, count) {
    getPetApiWithRetry((api) => {
      if (typeof api.openForcedPetEgg === "function") api.openForcedPetEgg(petKey, count || 1);
      F.saveGame();
    });
  }

  function applyLocalLuck10(durationMs = ADMIN_LUCK_DURATION_MS) {
    getPetApiWithRetry((api) => {
      api.startAdminLuckEvent(durationMs, { silent: true });
      F.saveGame();
    });
  }

  function getPetCommand(petKey, count) {
    const safeKey = petKey || "random";
    const safeCount = parsePetCount(count);
    return {
      type: "addpet",
      petKey: safeKey,
      count: safeCount,
      messageRu: `🐾 \u0410\u0414\u041C\u0418\u041D \u0412\u042B\u0414\u0410\u041B \u0412\u0410\u041C ${safeCount}x ${getPetAdminName(safeKey)}!`,
      messageEn: `🐾 Admin gave you ${safeCount}x ${getPetAdminName(safeKey)}!`,
      delayMs: 700
    };
  }

  function getForcedPetEggCommand(petKey, count) {
    const safeKey = petKey || "stellangeldemon";
    const safeCount = parsePetCount(count);
    return {
      type: "forcepetegg",
      petKey: safeKey,
      count: safeCount,
      messageRu: `🥚 \u0410\u0414\u041C\u0418\u041D \u0412\u042B\u0414\u0410\u041B \u0412\u0410\u041C ${safeCount}x egg!`,
      messageEn: `🥚 Admin gave you ${safeCount}x special egg!`,
      delayMs: 700
    };
  }

  function getLuck10Command() {
    return {
      type: "luck10",
      durationMs: ADMIN_LUCK_DURATION_MS,
      messageRu: "🍀 \u0410\u0414\u041C\u0418\u041D \u0417\u0410\u041F\u0423\u0421\u0422\u0418\u041B x10 \u0423\u0414\u0410\u0427\u0423 \u041D\u0410 10 \u041C\u0418\u041D\u0423\u0422!",
      messageEn: "🍀 Admin started x10 LUCK for 10 minutes!",
      delayMs: 900
    };
  }

  function getVipCommand() {
    return {
      type: "grantvip",
      messageRu: "⭐ \u0410\u0414\u041C\u0418\u041D \u0412\u042B\u0414\u0410\u041B \u0412\u0410\u041C VIP!",
      messageEn: "⭐ Admin gave you VIP!",
      delayMs: 700
    };
  }

  function getImperialCommand() {
    return {
      type: "grantimperial",
      messageRu: "👑 \u0410\u0414\u041C\u0418\u041D \u0412\u042B\u0414\u0410\u041B \u0412\u0410\u041C IMPERIAL!",
      messageEn: "👑 Admin gave you IMPERIAL!",
      delayMs: 700
    };
  }

  function getWaveMeta(waveType) {
    return {
      gold: { title: "\u0417\u041E\u041B\u041E\u0422\u0423\u042E \u0412\u041E\u041B\u041D\u0423", mult: "x2", time: "5 \u0421\u0415\u041A", color: "#ffd700" },
      diamond: { title: "\u0410\u041B\u041C\u0410\u0417\u041D\u0423\u042E \u0412\u041E\u041B\u041D\u0423", mult: "x5", time: "10 \u0421\u0415\u041A", color: "#00b4ff" },
      rainbow: { title: "\u0420\u0410\u0414\u0423\u0416\u041D\u0423\u042E \u0412\u041E\u041B\u041D\u0423", mult: "x100", time: "5 \u041C\u0418\u041D", color: "#ff66ff" },
      amethyst: { title: "\u0410\u041C\u0415\u0422\u0418\u0421\u0422\u041E\u0412\u042B\u0419 \u0418\u0412\u0415\u041D\u0422", mult: "10%", time: "5 \u041C\u0418\u041D", color: "#c084fc" }
    }[waveType] || { title: "\u0421\u041E\u0411\u042B\u0422\u0418\u0415", mult: "", time: "", color: "#ffd700" };
  }

  function buildAdminFishMessage(amount) {
    if (amount >= 0) return `🎁 \u0410\u0414\u041C\u0418\u041D \u041E\u0422\u041F\u0420\u0410\u0412\u0418\u041B \u0412\u0410\u041C +${F.formatNum(amount)} \u0420\u042B\u0411\u042B!`;
    return `⚠️ \u0410\u0414\u041C\u0418\u041D \u0417\u0410\u0411\u0420\u0410\u041B \u0423 \u0412\u0410\u0421 ${F.formatNum(Math.abs(amount))} \u0420\u042B\u0411\u042B!`;
  }

  function buildAdminCrystalMessage(amount) {
    if (amount >= 0) return `💎 \u0410\u0414\u041C\u0418\u041D \u041E\u0422\u041F\u0420\u0410\u0412\u0418\u041B \u0412\u0410\u041C +${F.formatNum(amount)} \u041A\u0420\u0418\u0421\u0422\u0410\u041B\u041B\u041E\u0412!`;
    return `⚠️ \u0410\u0414\u041C\u0418\u041D \u0417\u0410\u0411\u0420\u0410\u041B \u0423 \u0412\u0410\u0421 ${F.formatNum(Math.abs(amount))} \u041A\u0420\u0418\u0421\u0422\u0410\u041B\u041B\u041E\u0412!`;
  }

  function buildAdminWaveMessage(waveType) {
    const meta = getWaveMeta(waveType);
    return `⚡ \u0410\u0414\u041C\u0418\u041D \u0417\u0410\u041F\u0423\u0421\u0422\u0418\u041B \u0423 \u0412\u0410\u0421 ${meta.title} ${meta.mult} \u041D\u0410 ${meta.time}!`;
  }

  function buildAdminSetClickMessage(value) {
    return `⚡ \u0410\u0414\u041C\u0418\u041D \u0423\u0421\u0422\u0410\u041D\u041E\u0412\u0418\u041B \u0412\u0410\u041C \u0421\u0418\u041B\u0423 \u041A\u041B\u0418\u041A\u0410: ${F.formatNum(value)}`;
  }

  function buildAdminSetAutoMessage(value) {
    return `⚡ \u0410\u0414\u041C\u0418\u041D \u0423\u0421\u0422\u0410\u041D\u041E\u0412\u0418\u041B \u0412\u0410\u041C \u0410\u0412\u0422\u041E\u0414\u041E\u0425\u041E\u0414: ${F.formatNum(value)}/SEC`;
  }

  function buildAdminReplaceSaveMessage() {
    return "⚡ \u0410\u0414\u041C\u0418\u041D \u0418\u0417\u041C\u0415\u041D\u0418\u041B \u0412\u0410\u0428\u0418 \u0414\u0410\u041D\u041D\u042B\u0415 \u0418 \u0421\u041E\u0425\u0420\u0410\u041D\u0415\u041D\u0418\u0415!";
  }

  function getCommandNotifyColor(cmd) {
    if (cmd.type === "wave") return getWaveMeta(cmd.waveType).color;
    if (cmd.type === "addcrystal" || cmd.type === "addpet" || cmd.type === "forcepetegg" || cmd.type === "addstell") return "#c084fc";
    if (cmd.type === "grantvip") return "#ffd700";
    if (cmd.type === "grantimperial") return "#ff3333";
    if (cmd.type === "luck10") return "#ffd700";
    if (cmd.type === "cometevent") return "#c084fc";
    if (cmd.type === "setclick" || cmd.type === "setauto" || cmd.type === "grantadmin") return "#4ade80";
    if (cmd.type === "revokeadmin") return "#ff6666";
    if (cmd.type === "replaceSave") return "#ff9f43";
    return "#ffd700";
  }

  function announceAdminAbuse(text) {
    try {
      if (F.postSystemChat) F.postSystemChat(text || "Admin abuse started!", "admin", { author: "ADMIN ABUSE", admin: true });
    } catch (e) {}
  }

  function getCommandDelay(cmd) {
    if (typeof cmd.delayMs === "number") return cmd.delayMs;
    if (cmd.type === "wave") return 1200;
    if (cmd.type === "luck10") return 900;
    if (cmd.type === "cometevent") return 900;
    if (cmd.type === "addpet" || cmd.type === "forcepetegg" || cmd.type === "grantvip" || cmd.type === "grantimperial") return 700;
    if (cmd.message || cmd.messageRu || cmd.messageEn) return 700;
    return 0;
  }

  /* ========== \u0410\u0414\u041C\u0418\u041D: \u0421\u0415\u0411\u0415 ========== */
  document.querySelectorAll("[data-addfish]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      const amount = parseInt(btn.dataset.addfish);
      S.score += amount;
      S.stats.totalFishEarned += amount;
      F.updateScore();
      F.saveGame();
    });
  });

  document.querySelectorAll("[data-addcrystal]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      const amount = parseInt(btn.dataset.addcrystal);
      S.crystals += amount;
      F.updateScore();
      F.saveGame();
    });
  });

  const adminCustomCrystalBtn = document.getElementById("adminCustomCrystalBtn");
  const adminCustomCrystal = document.getElementById("adminCustomCrystal");
  if (adminCustomCrystalBtn && adminCustomCrystal) {
    adminCustomCrystalBtn.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      const v = F.parseNumInput(adminCustomCrystal.value);
      if (isNaN(v)) { alert("Invalid! Use: 1, 10, 100, 1K..."); return; }
      S.crystals += v;
      if (S.crystals < 0) S.crystals = 0;
      F.updateScore();
      F.saveGame();
      adminCustomCrystal.value = "";
    });
  }

  const adminCustomStellBtn = document.getElementById("adminCustomStellBtn");
  const adminCustomStell = document.getElementById("adminCustomStell");
  if (adminCustomStellBtn && adminCustomStell) {
    adminCustomStellBtn.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      const v = F.parseNumInput(adminCustomStell.value);
      if (isNaN(v)) { alert("Invalid Stell amount"); return; }
      S.stell += v;
      if (S.stell < 0) S.stell = 0;
      F.updateScore();
      F.saveGame();
      adminCustomStell.value = "";
    });
  }
  const adminStellAllBtn = document.getElementById("adminStellAllBtn");
  if (adminStellAllBtn && adminCustomStell) {
    adminStellAllBtn.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      const amount = F.parseNumInput(adminCustomStell.value);
      if (isNaN(amount) || amount === 0) { alert("Invalid Stell amount"); return; }
      if (!confirm(`Send ${F.formatNum(amount)} Stell to ALL players?`)) return;
      await sendCommandToAll({ type: "addstell", amount, delayMs: 700 });
      S.stell += amount;
      if (S.stell < 0) S.stell = 0;
      F.updateScore();
      F.saveGame();
      announceAdminAbuse(`Admin sent ${F.formatNum(amount)} Stell to all players!`);
      alert("✓ Stell sent to all players!");
    });
  }

  const adminCustomFishBtn = document.getElementById("adminCustomFishBtn");
  const adminCustomFish = document.getElementById("adminCustomFish");
  if (adminCustomFishBtn && adminCustomFish) {
    adminCustomFishBtn.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      const v = F.parseNumInput(adminCustomFish.value);
      if (isNaN(v)) { alert("Invalid! Use: 100, 10K, 5M, 1B, 2T, 1Qa"); return; }
      S.score += v;
      if (v > 0) S.stats.totalFishEarned += v;
      if (S.score < 0) S.score = 0;
      F.updateScore();
      F.saveGame();
      adminCustomFish.value = "";
    });
  }

  const adminCustomClickBtn = document.getElementById("adminCustomClickBtn");
  const adminCustomClick = document.getElementById("adminCustomClick");
  if (adminCustomClickBtn && adminCustomClick) {
    adminCustomClickBtn.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      const v = F.parseNumInput(adminCustomClick.value);
      if (isNaN(v) || v < 0) { alert("Invalid! Use: 100, 10K, 5M"); return; }
      S.clickPower = v;
      F.updateIncome();
      F.saveGame();
      adminCustomClick.value = "";
    });
  }

  const adminCustomAutoBtn = document.getElementById("adminCustomAutoBtn");
  const adminCustomAuto = document.getElementById("adminCustomAuto");
  if (adminCustomAutoBtn && adminCustomAuto) {
    adminCustomAutoBtn.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      const v = F.parseNumInput(adminCustomAuto.value);
      if (isNaN(v) || v < 0) { alert("Invalid! Use: 100, 10K, 5M"); return; }
      S.autoClicker = v;
      F.updateIncome();
      F.saveGame();
      adminCustomAuto.value = "";
    });
  }

  const adminGoldWave = document.getElementById("adminGoldWave");
  if (adminGoldWave) {
    adminGoldWave.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      if (S.waveActive) F.endWave(S.activeWaveType);
      F.startWave("gold", 2, 5);
    });
  }

  const adminDiamondWave = document.getElementById("adminDiamondWave");
  if (adminDiamondWave) {
    adminDiamondWave.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      if (S.waveActive) F.endWave(S.activeWaveType);
      F.startWave("diamond", 5, 10);
    });
  }

  const adminRainbowWave = document.getElementById("adminRainbowWave");
  if (adminRainbowWave) {
    adminRainbowWave.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      if (S.waveActive) F.endWave(S.activeWaveType);
      F.startWave("rainbow", 100, 300);
    });
  }

  const adminAmethystWave = document.getElementById("adminAmethystWave");
  if (adminAmethystWave) {
    adminAmethystWave.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      if (S.waveActive) F.endWave(S.activeWaveType);
      F.startWave("amethyst", 1, 300);
    });
  }

  const adminCometEvent = document.getElementById("adminCometEvent");
  if (adminCometEvent) {
    adminCometEvent.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      if (F.forceStartCometEvent) F.forceStartCometEvent();
      announceAdminAbuse("Admin started Comet Event!");
    });
  }

  async function writeCometConfig(cfg) {
    if (!F.checkAdmin() || !window.fb) return;
    try {
      await window.fb.update(window.fb.ref(window.fb.db, "cometConfig"), { ...cfg, updatedBy: S.currentUser.uid, updatedAt: Date.now() });
    } catch (e) { alert("Comet config failed: " + e.message); }
  }
  const adminCometEnableAll = document.getElementById("adminCometEnableAll");
  if (adminCometEnableAll) adminCometEnableAll.addEventListener("click", async () => {
    await writeCometConfig({ enabled: true });
    if (F.setCometSystemEnabled) F.setCometSystemEnabled(true);
    alert("✓ Comet enabled globally");
  });
  const adminCometDisableAll = document.getElementById("adminCometDisableAll");
  if (adminCometDisableAll) adminCometDisableAll.addEventListener("click", async () => {
    await writeCometConfig({ enabled: false });
    if (F.setCometSystemEnabled) F.setCometSystemEnabled(false);
    alert("✓ Comet disabled globally");
  });
  const adminCometResetAll = document.getElementById("adminCometResetAll");
  if (adminCometResetAll) adminCometResetAll.addEventListener("click", async () => {
    await writeCometConfig({ enabled: true, cycleStartedAt: Date.now() });
    if (F.resetCometTimer) F.resetCometTimer();
    alert("✓ Comet timer reset globally");
  });
  const adminCometStartAll = document.getElementById("adminCometStartAll");
  if (adminCometStartAll) adminCometStartAll.addEventListener("click", async () => {
    const startAt = Date.now() - 10 * 60 * 1000;
    await writeCometConfig({ enabled: true, cycleStartedAt: startAt });
    if (F.forceStartCometEvent) F.forceStartCometEvent();
    alert("✓ Comet event started globally");
  });

  const adminGivePetSelf = document.getElementById("adminGivePetSelf");
  const adminPetType = document.getElementById("adminPetType");
  const adminPetCount = document.getElementById("adminPetCount");
  if (adminGivePetSelf && adminPetType && adminPetCount) {
    adminGivePetSelf.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      const petKey = adminPetType.value || "random";
      const count = parsePetCount(adminPetCount.value);
      applyAdminCommand(getPetCommand(petKey, count));
    });
  }

  const adminGivePetAll = document.getElementById("adminGivePetAll");
  if (adminGivePetAll && adminPetType && adminPetCount) {
    adminGivePetAll.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      const petKey = adminPetType.value || "random";
      const count = parsePetCount(adminPetCount.value);
      if (!confirm(`Give ${count}x ${getPetAdminName(petKey)} to ALL players?`)) return;
      await sendCommandToAll(getPetCommand(petKey, count));
      applyAdminCommand(getPetCommand(petKey, count));
      announceAdminAbuse(`Admin gave ${count}x ${getPetAdminName(petKey)} to all players!`);
      alert("✓ Pet sent to all players!");
    });
  }

  const adminEggPetType = document.getElementById("adminEggPetType");
  const adminEggCount = document.getElementById("adminEggCount");
  const adminGiveEggSelf = document.getElementById("adminGiveEggSelf");
  if (adminGiveEggSelf && adminEggPetType && adminEggCount) {
    adminGiveEggSelf.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      applyAdminCommand(getForcedPetEggCommand(adminEggPetType.value, adminEggCount.value));
    });
  }
  const adminGiveEggAll = document.getElementById("adminGiveEggAll");
  if (adminGiveEggAll && adminEggPetType && adminEggCount) {
    adminGiveEggAll.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      const cmd = getForcedPetEggCommand(adminEggPetType.value, adminEggCount.value);
      if (!confirm(`Give ${cmd.count} special egg(s) to ALL players?`)) return;
      await sendCommandToAll(cmd);
      applyAdminCommand(cmd);
      announceAdminAbuse(`Admin gave ${cmd.count} special eggs to all players!`);
      alert("✓ Eggs sent to all players!");
    });
  }

  const adminGiveVipSelf = document.getElementById("adminGiveVipSelf");
  if (adminGiveVipSelf) {
    adminGiveVipSelf.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      applyAdminCommand(getVipCommand());
    });
  }

  const adminGiveVipAll = document.getElementById("adminGiveVipAll");
  if (adminGiveVipAll) {
    adminGiveVipAll.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      if (!confirm("Give VIP to ALL players?")) return;
      await sendCommandToAll(getVipCommand());
      applyAdminCommand(getVipCommand());
      announceAdminAbuse("Admin gave VIP to all players!");
      alert("✓ VIP sent to all players!");
    });
  }

  const adminGiveImperialSelf = document.getElementById("adminGiveImperialSelf");
  if (adminGiveImperialSelf) {
    adminGiveImperialSelf.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      applyAdminCommand(getImperialCommand());
    });
  }

  const adminGiveImperialAll = document.getElementById("adminGiveImperialAll");
  if (adminGiveImperialAll) {
    adminGiveImperialAll.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      if (!confirm("Give IMPERIAL to ALL players?")) return;
      await sendCommandToAll(getImperialCommand());
      applyAdminCommand(getImperialCommand());
      announceAdminAbuse("Admin gave Imperial to all players!");
      alert("✓ Imperial sent to all players!");
    });
  }

  const adminLuck10Self = document.getElementById("adminLuck10Self");
  if (adminLuck10Self) {
    adminLuck10Self.addEventListener("click", () => {
      if (!F.checkAdmin()) return;
      applyAdminCommand(getLuck10Command());
    });
  }

  const adminLuck10All = document.getElementById("adminLuck10All");
  if (adminLuck10All) {
    adminLuck10All.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      if (!confirm("Send x10 LUCK EVENT for 10 minutes to ALL players?")) return;
      await sendCommandToAll(getLuck10Command());
      applyAdminCommand(getLuck10Command());
      alert("✓ x10 luck event sent to all players!");
    });
  }

  const adminCreatePromoBtn = document.getElementById("adminCreatePromoBtn");
  const adminDisablePromoBtn = document.getElementById("adminDisablePromoBtn");
  function readPromoAdminInput() {
    const code = (document.getElementById("adminPromoCode")?.value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const maxUses = F.parseNumInput(document.getElementById("adminPromoMaxUses")?.value || "1");
    const rewards = {
      fish: F.parseNumInput(document.getElementById("adminPromoFish")?.value || "0") || 0,
      crystals: F.parseNumInput(document.getElementById("adminPromoCrystals")?.value || "0") || 0,
      stell: F.parseNumInput(document.getElementById("adminPromoStell")?.value || "0") || 0,
      petKey: document.getElementById("adminPromoPetKey")?.value || "",
      petCount: F.parseNumInput(document.getElementById("adminPromoPetCount")?.value || "1") || 1,
      potionType: document.getElementById("adminPromoPotionType")?.value || "",
      potionMinutes: F.parseNumInput(document.getElementById("adminPromoPotionMinutes")?.value || "0") || 0,
      waveType: document.getElementById("adminPromoWaveType")?.value || "",
      waveCount: F.parseNumInput(document.getElementById("adminPromoWaveCount")?.value || "1") || 1
    };
    rewards.eggPetKey = document.getElementById("adminPromoEggPetKey")?.value || "";
    rewards.eggCount = F.parseNumInput(document.getElementById("adminPromoEggCount")?.value || "1") || 1;
    if (!rewards.petKey) { delete rewards.petKey; delete rewards.petCount; }
    if (!rewards.eggPetKey) { delete rewards.eggPetKey; delete rewards.eggCount; }
    if (!rewards.potionType || rewards.potionMinutes <= 0) { delete rewards.potionType; delete rewards.potionMinutes; }
    if (!rewards.waveType) { delete rewards.waveType; delete rewards.waveCount; }
    Object.keys(rewards).forEach(k => { if ((rewards[k] === 0 || rewards[k] === "") && !["petCount","waveCount"].includes(k)) delete rewards[k]; });
    return { code, maxUses: Math.max(1, maxUses || 1), rewards };
  }
  if (adminCreatePromoBtn) {
    adminCreatePromoBtn.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      const { code, maxUses, rewards } = readPromoAdminInput();
      if (!code) { alert("Enter code"); return; }
      if (!Object.keys(rewards).length) { alert("Add at least one reward"); return; }
      try {
        await window.fb.update(window.fb.ref(window.fb.db, `promoCodes/${code}`), {
          active: true,
          code,
          maxUses,
          rewards,
          message: `Promo ${code} activated!`,
          createdBy: S.currentUser.uid,
          updatedAt: Date.now()
        });
        alert(`✓ Promo ${code} saved!`);
      } catch (e) { alert("Failed: " + e.message); }
    });
  }
  if (adminDisablePromoBtn) {
    adminDisablePromoBtn.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      const code = (document.getElementById("adminPromoCode")?.value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
      if (!code) { alert("Enter code"); return; }
      if (!confirm(`Disable promo ${code}?`)) return;
      try {
        await window.fb.update(window.fb.ref(window.fb.db, `promoCodes/${code}`), { active: false, disabledBy: S.currentUser.uid, disabledAt: Date.now() });
        alert("✓ Promo disabled");
      } catch (e) { alert("Failed: " + e.message); }
    });
  }

  /* ========== \u0410\u0414\u041C\u0418\u041D: REWARD ALL ========== */
  const adminRewardAllBtn = document.getElementById("adminRewardAllBtn");
  const adminRewardAllFish = document.getElementById("adminRewardAllFish");
  if (adminRewardAllBtn && adminRewardAllFish) {
    adminRewardAllBtn.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      const amount = F.parseNumInput(adminRewardAllFish.value);
      if (isNaN(amount) || amount === 0) { alert("Invalid! Use: 100, 10K, 5M, 1B"); return; }
      if (!confirm(`Send +${F.formatNum(amount)} fish to ALL players?`)) return;

      const fb = window.fb;
      try {
        const snap = await fb.get(fb.ref(fb.db, "leaderboard"));
        const data = snap.val() || {};
        const uids = Object.keys(data);
        let sent = 0;

        for (const uid of uids) {
          if (window.BANNED_UIDS && window.BANNED_UIDS.includes(uid)) continue;
          if (uid === S.currentUser.uid) continue;
          const cmd = {
            id: Date.now() + "_" + Math.random().toString(36).slice(2, 8),
            type: "addfish", amount: amount,
            from: S.currentUser.uid, timestamp: Date.now(),
            message: buildAdminFishMessage(amount),
            delayMs: 700
          };
          await fb.set(fb.ref(fb.db, `commands/${uid}/${cmd.id}`), cmd);
          sent++;
        }

        S.score += amount;
        if (amount > 0) S.stats.totalFishEarned += amount;
        F.updateScore();
        F.saveGame();

        alert(`✓ Sent +${F.formatNum(amount)} fish to ${sent} players!`);
        announceAdminAbuse(`Admin sent ${F.formatNum(amount)} fish to all players!`);
        adminRewardAllFish.value = "";
      } catch (e) { alert("Failed: " + e.message); }
    });
  }

  const adminRewardAllCrystalsBtn = document.getElementById("adminRewardAllCrystalsBtn");
  const adminRewardAllCrystals = document.getElementById("adminRewardAllCrystals");
  if (adminRewardAllCrystalsBtn && adminRewardAllCrystals) {
    adminRewardAllCrystalsBtn.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      const amount = F.parseNumInput(adminRewardAllCrystals.value);
      if (isNaN(amount) || amount === 0) { alert("Invalid amount"); return; }
      if (!confirm(`Send +${F.formatNum(amount)} crystals to ALL players?`)) return;

      const fb = window.fb;
      try {
        const snap = await fb.get(fb.ref(fb.db, "leaderboard"));
        const data = snap.val() || {};
        const uids = Object.keys(data);
        let sent = 0;
        for (const uid of uids) {
          if (window.BANNED_UIDS && window.BANNED_UIDS.includes(uid)) continue;
          if (uid === S.currentUser.uid) continue;
          const cmd = {
            id: Date.now() + "_" + Math.random().toString(36).slice(2, 8),
            type: "addcrystal", amount: amount,
            from: S.currentUser.uid, timestamp: Date.now(),
            message: buildAdminCrystalMessage(amount),
            delayMs: 700
          };
          await fb.set(fb.ref(fb.db, `commands/${uid}/${cmd.id}`), cmd);
          sent++;
        }
        S.crystals += amount;
        if (S.crystals < 0) S.crystals = 0;
        F.updateScore();
        F.saveGame();
        alert(`✓ Sent +${F.formatNum(amount)} crystals to ${sent} players!`);
        announceAdminAbuse(`Admin sent ${F.formatNum(amount)} amethysts to all players!`);
        adminRewardAllCrystals.value = "";
      } catch (e) { alert("Failed: " + e.message); }
    });
  }

  const adminRewardAllGold = document.getElementById("adminRewardAllGold");
  if (adminRewardAllGold) {
    adminRewardAllGold.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      if (!confirm("Send GOLD WAVE to ALL players?")) return;
      await sendCommandToAll({ type: "wave", waveType: "gold", message: buildAdminWaveMessage("gold"), delayMs: 1200 });
      if (S.waveActive) F.endWave(S.activeWaveType);
      F.startWave("gold", 2, 5);
    });
  }

  const adminRewardAllDiamond = document.getElementById("adminRewardAllDiamond");
  if (adminRewardAllDiamond) {
    adminRewardAllDiamond.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      if (!confirm("Send DIAMOND WAVE to ALL players?")) return;
      await sendCommandToAll({ type: "wave", waveType: "diamond", message: buildAdminWaveMessage("diamond"), delayMs: 1200 });
      if (S.waveActive) F.endWave(S.activeWaveType);
      F.startWave("diamond", 5, 10);
    });
  }

  const adminRewardAllRainbow = document.getElementById("adminRewardAllRainbow");
  if (adminRewardAllRainbow) {
    adminRewardAllRainbow.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      if (!confirm("Send RAINBOW WAVE x100 (5 min) to ALL players?")) return;
      await sendCommandToAll({ type: "wave", waveType: "rainbow", message: buildAdminWaveMessage("rainbow"), delayMs: 1200 });
      if (S.waveActive) F.endWave(S.activeWaveType);
      F.startWave("rainbow", 100, 300);
    });
  }

  const adminRewardAllAmethyst = document.getElementById("adminRewardAllAmethyst");
  if (adminRewardAllAmethyst) {
    adminRewardAllAmethyst.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      if (!confirm("Send AMETHYST WAVE x100 (5 min) to ALL players?")) return;
      await sendCommandToAll({ type: "wave", waveType: "amethyst", message: buildAdminWaveMessage("amethyst"), delayMs: 1200 });
      if (S.waveActive) F.endWave(S.activeWaveType);
      F.startWave("amethyst", 1, 300);
    });
  }

  const adminRewardAllComet = document.getElementById("adminRewardAllComet");
  if (adminRewardAllComet) {
    adminRewardAllComet.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      if (!confirm("Start COMET EVENT for ALL players?")) return;
      await sendCommandToAll({ type: "cometevent", delayMs: 900 });
      if (F.forceStartCometEvent) F.forceStartCometEvent();
      announceAdminAbuse("Admin started Comet Event for all players!");
      alert("✓ Comet event sent to all players!");
    });
  }

  async function sendCommandToAll(baseCmd) {
    if (!window.fb) return;
    const fb = window.fb;
    try {
      const snap = await fb.get(fb.ref(fb.db, "leaderboard"));
      const data = snap.val() || {};
      const uids = Object.keys(data);
      for (const uid of uids) {
        if (window.BANNED_UIDS && window.BANNED_UIDS.includes(uid)) continue;
        if (uid === S.currentUser.uid) continue;
        const cmd = {
          ...baseCmd,
          id: Date.now() + "_" + Math.random().toString(36).slice(2, 8),
          from: S.currentUser.uid,
          timestamp: Date.now()
        };
        await fb.set(fb.ref(fb.db, `commands/${uid}/${cmd.id}`), cmd);
      }
      if (baseCmd && baseCmd.type === "wave") announceAdminAbuse(`Admin started ${baseCmd.waveType || "special"} wave for all players!`);
    } catch (e) { console.error("Reward all failed", e); }
  }

  /* ========== \u0410\u0414\u041C\u0418\u041D: \u0421\u0418\u041D\u0425\u0420 \u041E\u041D\u0418\u0417\u0410\u0426\u0418\u042F ========== */
  const adminPushSave = document.getElementById("adminPushSave");
  if (adminPushSave) {
    adminPushSave.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      try {
        await window.fb.set(window.fb.ref(window.fb.db, `users/${S.currentUser.uid}`), F.buildSaveData());
        alert("✓ Pushed!");
      } catch (e) { alert("Failed: " + e.message); }
    });
  }

  const adminPullSave = document.getElementById("adminPullSave");
  if (adminPullSave) {
    adminPullSave.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      try {
        const snap = await window.fb.get(window.fb.ref(window.fb.db, `users/${S.currentUser.uid}`));
        const data = snap.val();
        if (!data) { alert("No cloud data"); return; }
        F.applySaveData(data);
        alert("✓ Pulled!");
      } catch (e) { alert("Failed: " + e.message); }
    });
  }

  const adminSyncFromUid = document.getElementById("adminSyncFromUid");
  const adminSyncUid = document.getElementById("adminSyncUid");
  if (adminSyncFromUid && adminSyncUid) {
    adminSyncFromUid.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      const sourceUid = adminSyncUid.value.trim();
      if (!sourceUid) { alert("Enter UID"); return; }
      try {
        const snap = await window.fb.get(window.fb.ref(window.fb.db, `users/${sourceUid}`));
        const data = snap.val();
        if (!data) { alert("No data for this UID"); return; }
        if (!confirm("Replace your progress?")) return;
        const ourCode = S.recoveryCode;
        F.applySaveData(data);
        S.recoveryCode = ourCode;
        F.updateRecoveryDisplay();
        F.saveGame();
        alert("✓ Synced!");
        adminSyncUid.value = "";
      } catch (e) { alert("Failed: " + e.message); }
    });
  }

  /* ========== \u0410\u0414\u041C\u0418\u041D: \u0418\u0413\u0420 \u041E\u041A\u0418 ========== */
  let cachedAdminPlayers = [];
  let cachedAdminRights = {};

  function isUidCurrentlyAdmin(uid) {
    return !!uid && ((F.isUidAdmin && F.isUidAdmin(uid)) || !!cachedAdminRights[uid]);
  }

  async function sendAdminRightsCommand(targetUid, type) {
    if (!window.fb || !targetUid) return false;
    if (targetUid === S.currentUser.uid) {
      applyAdminCommand({ type });
      return true;
    }
    const cmd = {
      id: Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      type,
      from: S.currentUser.uid,
      timestamp: Date.now(),
      delayMs: 500
    };
    await window.fb.set(window.fb.ref(window.fb.db, `commands/${targetUid}/${cmd.id}`), cmd);
    return true;
  }

  async function grantAdminToUid(uid) {
    if (!F.checkAdmin() || !window.fb) return;
    const targetUid = String(uid || "").trim();
    if (!targetUid) { alert("Enter UID"); return; }
    if (!confirm(`Grant admin rights to UID?\n${targetUid}`)) return;

    let cloudOk = false;
    let commandOk = false;
    try {
      await window.fb.set(window.fb.ref(window.fb.db, `admins/${targetUid}`), {
        active: true,
        grantedBy: S.currentUser.uid,
        grantedAt: Date.now()
      });
      cachedAdminRights[targetUid] = true;
      cloudOk = true;
    } catch (e) {
      console.warn("Cloud admin grant denied, using command fallback", e);
    }

    try {
      commandOk = await sendAdminRightsCommand(targetUid, "grantadmin");
    } catch (e) {
      console.warn("Admin grant command failed", e);
    }

    if (!cloudOk && !commandOk) {
      alert("Failed: no permission to write admins path or commands path. Check Firebase rules.");
      return;
    }
    alert(cloudOk
      ? "✓ Admin granted in cloud!"
      : "✓ Admin grant command sent! Player gets admin after opening/refreshing the game.");
    loadAdminPlayers();
  }

  async function revokeAdminFromUid(uid) {
    if (!F.checkAdmin() || !window.fb) return;
    const targetUid = String(uid || "").trim();
    if (!targetUid) { alert("Enter UID"); return; }
    if (targetUid === S.currentUser.uid) {
      if (!confirm("You are revoking admin from yourself. Continue?")) return;
    } else if (!confirm(`Revoke admin rights from UID?\n${targetUid}`)) return;

    let cloudOk = false;
    let commandOk = false;
    try {
      await window.fb.remove(window.fb.ref(window.fb.db, `admins/${targetUid}`));
      delete cachedAdminRights[targetUid];
      cloudOk = true;
    } catch (e) {
      console.warn("Cloud admin revoke denied, using command fallback", e);
    }

    try {
      commandOk = await sendAdminRightsCommand(targetUid, "revokeadmin");
    } catch (e) {
      console.warn("Admin revoke command failed", e);
    }

    if (!cloudOk && !commandOk) {
      alert("Failed: no permission to write admins path or commands path. Check Firebase rules.");
      return;
    }
    alert(cloudOk
      ? "✓ Admin revoked in cloud! Hardcoded owners cannot be revoked by this button."
      : "✓ Revoke command sent! Player loses local admin after opening/refreshing the game.");
    loadAdminPlayers();
  }

  async function loadAdminPlayers() {
    if (!F.checkAdmin() || !window.fb) return;
    const list = document.getElementById("adminPlayersList");
    if (!list) return;
    list.innerHTML = `<div class="top-loading">Loading...</div>`;
    try {
      const [lbRes, usersRes, adminsRes] = await Promise.allSettled([
        window.fb.get(window.fb.ref(window.fb.db, "leaderboard")),
        window.fb.get(window.fb.ref(window.fb.db, "users")),
        window.fb.get(window.fb.ref(window.fb.db, "admins"))
      ]);
      if (lbRes.status !== "fulfilled") throw lbRes.reason;
      const lbData = lbRes.value.val() || {};
      const usersData = usersRes.status === "fulfilled" ? (usersRes.value.val() || {}) : {};
      const adminsData = adminsRes.status === "fulfilled" ? (adminsRes.value.val() || {}) : {};
      if (usersRes.status !== "fulfilled") console.warn("Users read denied; showing leaderboard-only players", usersRes.reason);
      if (adminsRes.status !== "fulfilled") console.warn("Admins read denied; admin badges may be incomplete", adminsRes.reason);
      cachedAdminRights = Object.fromEntries(Object.entries(adminsData).filter(([uid, val]) => val === true || (val && val.active !== false)).map(([uid]) => [uid, true]));

      cachedAdminPlayers = Object.entries(lbData).map(([uid, lb]) => {
        const user = usersData[uid] || {};
        user._adminGranted = isUidCurrentlyAdmin(uid);
        return [uid, lb, user];
      });
      cachedAdminPlayers.sort((a, b) => (b[1].fish || 0) - (a[1].fish || 0));
      renderAdminPlayers();
    } catch (e) {
      if (list) list.innerHTML = `<div class="top-loading">Error: ${e.message}</div>`;
    }
  }

  function renderAdminPlayers(filter = "") {
    const list = document.getElementById("adminPlayersList");
    if (!list) return;
    list.innerHTML = "";

    const f = filter.toLowerCase().trim();
    const filtered = f
      ? cachedAdminPlayers.filter(([uid, lb]) =>
          (lb.name || "").toLowerCase().includes(f) || uid.toLowerCase().includes(f))
      : cachedAdminPlayers;

    if (!filtered.length) {
      list.innerHTML = `<div class="top-loading">No players</div>`;
      return;
    }

    filtered.forEach(([uid, lb, userData]) => {
      const userStats = userData.stats || {};
      const isBanned = window.BANNED_UIDS && window.BANNED_UIDS.includes(uid);
      const isAdminPlayer = isUidCurrentlyAdmin(uid) || !!userData._adminGranted;
      const adminBadge = isAdminPlayer ? " [ADMIN]" : "";
      const el = document.createElement("div");
      el.className = "admin-player-card" + (isBanned ? " admin-banned" : "");
      el.innerHTML = `
        <div class="admin-player-head">
          <span class="admin-player-name">${F.escapeHtml((lb.vip ? "[VIP] " : "") + (lb.name || "Anon") + adminBadge)}${isBanned ? " [BANNED]" : ""}</span>
          <span class="admin-player-fish">${F.formatNum(lb.fish || 0)} 🐟</span>
        </div>
        <div class="admin-player-uid">${uid}</div>
        <div class="admin-player-stats">
          <span>Score: ${F.formatNum(userData.score || 0)}</span>
          <span>Click: ${F.formatNum(userData.clickPower || 1)}</span>
          <span>Auto: ${F.formatNum(userData.autoClicker || 0)}</span>
          <span>Clicks: ${F.formatNum(userStats.totalClicks || 0)}</span>
          <span>Time: ${F.formatTime(userStats.playTimeSec || 0)}</span>
          <span>Rebirths: ${userData.rebirthCount || 0}</span>
          <span>Gold: ${userStats.goldWaves || 0}</span>
          <span>Diamond: ${userStats.diamondWaves || 0}</span>
          <span>Items: ${userStats.itemsBought || 0}</span>
        </div>
        <div class="admin-player-actions">
          <button class="admin-mini-btn ui-click" data-action="addfish">+1K</button>
          <button class="admin-mini-btn ui-click" data-action="addfish10k">+10K</button>
          <button class="admin-mini-btn ui-click" data-action="addfish100k">+100K</button>
          <button class="admin-mini-btn ui-click" data-action="custom">CUSTOM 🐟</button>
          <button class="admin-mini-btn gold-admin ui-click" data-action="goldwave">GOLD</button>
          <button class="admin-mini-btn diamond-admin ui-click" data-action="diamondwave">DIAMOND</button>
          <button class="admin-mini-btn ui-click" data-action="setclick">SET CLICK</button>
          <button class="admin-mini-btn ui-click" data-action="setauto">SET AUTO</button>
          <button class="admin-mini-btn ui-click" data-action="editstats">EDIT STATS</button>
          <button class="admin-mini-btn ui-click" data-action="givepet">GIVE PET</button>
          <button class="admin-mini-btn gold-admin ui-click" data-action="givevip">GIVE VIP</button>
          <button class="admin-mini-btn danger-admin ui-click" data-action="giveimperial">IMPERIAL</button>
          <button class="admin-mini-btn ui-click" data-action="backupdata">BACKUP DATA</button>
          <button class="admin-mini-btn gold-admin ui-click" data-action="luck10">x10 LUCK</button>
          <button class="admin-mini-btn ui-click" data-action="grantadmin">GRANT ADMIN</button>
          <button class="admin-mini-btn danger-admin ui-click" data-action="revokeadmin">REVOKE ADMIN</button>
          <button class="admin-mini-btn danger-admin ui-click" data-action="wipe">WIPE</button>
          <button class="admin-mini-btn danger-admin ui-click" data-action="ban">BAN UID</button>
          <button class="admin-mini-btn danger-admin ui-click" data-action="del">DELETE</button>
        </div>
      `;
      el.querySelectorAll("[data-action]").forEach(btn => {
        btn.addEventListener("click", () => handleAdminAction(uid, lb, userData, btn.dataset.action, el));
      });
      list.appendChild(el);
    });
  }

  async function handleAdminAction(targetUid, lbData, userData, action, cardEl) {
    if (!F.checkAdmin() || !window.fb) return;
    const fb = window.fb;

    try {
      if (action === "del") {
        if (!confirm(`Delete ${lbData.name || "Anon"} from leaderboard?`)) return;
        await fb.remove(fb.ref(fb.db, `leaderboard/${targetUid}`));
        cardEl.remove();
        return;
      }

      if (action === "ban") {
        try { await navigator.clipboard.writeText(targetUid); }
        catch (e) {}
        alert(`UID copied:\n${targetUid}\n\nAdd to BANNED_UIDS in game.js!`);
        return;
      }

      if (action === "grantadmin") {
        await grantAdminToUid(targetUid);
        return;
      }

      if (action === "revokeadmin") {
        await revokeAdminFromUid(targetUid);
        return;
      }

      if (action === "wipe") {
        if (!confirm(`WIPE ${lbData.name || "Anon"}? (leaderboard + data + commands)`)) return;
        await fb.remove(fb.ref(fb.db, `leaderboard/${targetUid}`));
        await fb.remove(fb.ref(fb.db, `users/${targetUid}`));
        await fb.remove(fb.ref(fb.db, `commands/${targetUid}`));
        cardEl.remove();
        alert("✓ Wiped!");
        return;
      }

      if (action === "editstats") {
        openStatsEditor(targetUid, userData);
        return;
      }

      if (action === "givepet") {
        const petKeyRaw = prompt("Pet key: random / cat / dog / slime / draco / mooncat", "random");
        if (petKeyRaw === null) return;
        const petKey = (petKeyRaw || "random").trim().toLowerCase();
        if (!PET_ADMIN_NAMES[petKey]) { alert("Invalid pet key!"); return; }
        const countRaw = prompt("Count:", "1");
        if (countRaw === null) return;
        const count = parsePetCount(countRaw);
        const petCmd = getPetCommand(petKey, count);
        if (targetUid === S.currentUser.uid) {
          applyAdminCommand(petCmd);
          F.saveGame();
          alert("✓ Pet added!");
          return;
        }
        petCmd.id = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
        petCmd.from = S.currentUser.uid;
        petCmd.timestamp = Date.now();
        await fb.set(fb.ref(fb.db, `commands/${targetUid}/${petCmd.id}`), petCmd);
        alert(`✓ Pet sent to ${lbData.name || "Anon"}!`);
        return;
      }

      if (action === "backupdata") {
        openPlayerDataBackup(targetUid, lbData, userData);
        return;
      }

      if (action === "giveimperial") {
        const imperialCmd = getImperialCommand();
        if (targetUid === S.currentUser.uid) {
          applyAdminCommand(imperialCmd);
          F.saveGame();
          alert("✓ Imperial granted!");
          return;
        }
        imperialCmd.id = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
        imperialCmd.from = S.currentUser.uid;
        imperialCmd.timestamp = Date.now();
        await fb.set(fb.ref(fb.db, `commands/${targetUid}/${imperialCmd.id}`), imperialCmd);
        announceAdminAbuse(`Admin gave Imperial to ${lbData.name || "Anon"}!`);
        alert(`✓ Imperial sent to ${lbData.name || "Anon"}!`);
        return;
      }

      if (action === "givevip") {
        const vipCmd = getVipCommand();
        if (targetUid === S.currentUser.uid) {
          applyAdminCommand(vipCmd);
          F.saveGame();
          alert("✓ VIP granted!");
          return;
        }
        vipCmd.id = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
        vipCmd.from = S.currentUser.uid;
        vipCmd.timestamp = Date.now();
        await fb.set(fb.ref(fb.db, `commands/${targetUid}/${vipCmd.id}`), vipCmd);
        announceAdminAbuse(`Admin gave VIP to ${lbData.name || "Anon"}!`);
        alert(`✓ VIP sent to ${lbData.name || "Anon"}!`);
        return;
      }

      if (action === "luck10") {
        const luckCmd = getLuck10Command();
        if (targetUid === S.currentUser.uid) {
          applyAdminCommand(luckCmd);
          F.saveGame();
          alert("✓ Luck event started!");
          return;
        }
        luckCmd.id = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
        luckCmd.from = S.currentUser.uid;
        luckCmd.timestamp = Date.now();
        await fb.set(fb.ref(fb.db, `commands/${targetUid}/${luckCmd.id}`), luckCmd);
        alert(`✓ x10 luck sent to ${lbData.name || "Anon"}!`);
        return;
      }

      let command = null;
      if (action === "addfish") command = { type: "addfish", amount: 1000, message: buildAdminFishMessage(1000), delayMs: 700 };
      else if (action === "addfish10k") command = { type: "addfish", amount: 10000, message: buildAdminFishMessage(10000), delayMs: 700 };
      else if (action === "addfish100k") command = { type: "addfish", amount: 100000, message: buildAdminFishMessage(100000), delayMs: 700 };
      else if (action === "custom") {
        const v = prompt("Amount (use K/M/B/T/Qa):", "1M");
        if (v === null) return;
        const n = F.parseNumInput(v);
        if (isNaN(n)) { alert("Invalid! Use: 100, 10K, 5M, 1B"); return; }
        command = { type: "addfish", amount: n, message: buildAdminFishMessage(n), delayMs: 700 };
      }
      else if (action === "goldwave") command = { type: "wave", waveType: "gold", message: buildAdminWaveMessage("gold"), delayMs: 1200 };
      else if (action === "diamondwave") command = { type: "wave", waveType: "diamond", message: buildAdminWaveMessage("diamond"), delayMs: 1200 };
      else if (action === "setclick") {
        const v = prompt("Set click power (K/M/B):", "1");
        if (v === null) return;
        const n = F.parseNumInput(v);
        if (isNaN(n) || n < 0) { alert("Invalid!"); return; }
        command = { type: "setclick", value: n, message: buildAdminSetClickMessage(n), delayMs: 700 };
      }
      else if (action === "setauto") {
        const v = prompt("Set auto clicker (K/M/B):", "0");
        if (v === null) return;
        const n = F.parseNumInput(v);
        if (isNaN(n) || n < 0) { alert("Invalid!"); return; }
        command = { type: "setauto", value: n, message: buildAdminSetAutoMessage(n), delayMs: 700 };
      }

      if (!command) return;

      if (targetUid === S.currentUser.uid) {
        applyAdminCommand(command);
        F.saveGame();
        alert("✓ Applied!");
        return;
      }

      command.id = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      command.from = S.currentUser.uid;
      command.timestamp = Date.now();
      await fb.set(fb.ref(fb.db, `commands/${targetUid}/${command.id}`), command);
      announceAdminAbuse(`Admin used ${command.type} on ${lbData.name || "Anon"}!`);
      alert(`✓ Sent to ${lbData.name || "Anon"}!`);
    } catch (e) {
      alert("Failed: " + e.message);
    }
  }

  function openPlayerDataBackup(targetUid, lbData, userData) {
    const payload = {
      exportedByAdmin: S.currentUser?.uid || null,
      exportedAt: new Date().toISOString(),
      targetUid,
      leaderboard: lbData || null,
      user: userData || null
    };
    const text = JSON.stringify(payload, null, 2);
    const modal = document.createElement("div");
    modal.className = "admin-stats-modal";
    modal.innerHTML = `
      <div style="color:#ffd700;font-size:9px;margin-bottom:8px;">PLAYER DATA BACKUP</div>
      <div style="color:#888;font-size:6px;line-height:1.5;word-break:break-all;">UID: ${targetUid}</div>
      <textarea id="adminBackupText" readonly style="width:100%;height:320px;background:#0f1020;color:#fff;border:2px solid #3a3a5a;padding:8px;font-family:monospace;font-size:10px;line-height:1.35;">${F.escapeHtml(text)}</textarea>
      <div class="admin-row" style="margin-top:8px;">
        <button class="admin-btn ui-click" id="adminBackupCopy">COPY</button>
        <button class="admin-btn ui-click" id="adminBackupClose">CLOSE</button>
      </div>
    `;
    document.body.appendChild(modal);
    const ta = modal.querySelector("#adminBackupText");
    modal.querySelector("#adminBackupClose").addEventListener("click", () => modal.remove());
    modal.querySelector("#adminBackupCopy").addEventListener("click", async () => {
      try {
        if (navigator.clipboard) await navigator.clipboard.writeText(text);
        else { ta.focus(); ta.select(); document.execCommand("copy"); }
        alert("Copied!");
      } catch (e) { ta.focus(); ta.select(); alert("Select and copy manually"); }
    });
    setTimeout(() => { ta.focus(); ta.select(); }, 80);
  }

  /* ========== \u0410\u0414\u041C\u0418\u041D: \u0420 \u0415\u0414\u0410\u041A\u0422\u041E\u0420  \u0421\u0422\u0410\u0422\u0418\u0421\u0422\u0418\u041A\u0418 ========== */
  function openStatsEditor(targetUid, userData) {
    const data = userData || {};
    const st = data.stats || {};

    const fields = [
      { key: "score", label: "Current Fish", val: data.score || 0 },
      { key: "clickPower", label: "Click Power", val: data.clickPower || 1 },
      { key: "autoClicker", label: "Auto Clicker", val: data.autoClicker || 0 },
      { key: "rebirthCount", label: "Rebirths", val: data.rebirthCount || 0 },
      { key: "rebirthMultiplier", label: "Rebirth Mult", val: data.rebirthMultiplier || 1 },
      { key: "totalClicks", label: "Total Clicks", val: st.totalClicks || 0, stat: true },
      { key: "totalFishEarned", label: "Total Fish Earned", val: st.totalFishEarned || 0, stat: true },
      { key: "playTimeSec", label: "Play Time (sec)", val: st.playTimeSec || 0, stat: true },
      { key: "goldWaves", label: "Gold Waves", val: st.goldWaves || 0, stat: true },
      { key: "diamondWaves", label: "Diamond Waves", val: st.diamondWaves || 0, stat: true },
      { key: "itemsBought", label: "Items Bought", val: st.itemsBought || 0, stat: true }
    ];

    let html = `<div style="color:#ffd700;font-size:9px;margin-bottom:8px;">EDIT: ${F.escapeHtml(data.profile?.name || "Anon")}</div>`;
    fields.forEach(f => {
      html += `<div class="admin-input-row" style="margin-bottom:4px;">
        <span style="color:#aaa;font-size:7px;min-width:100px;">${f.label}</span>
        <input type="text" class="admin-input" id="edit_${f.key}" value="${f.val}" style="font-size:8px;" />
      </div>`;
    });
    html += `<div class="admin-row" style="margin-top:8px;">
      <button class="admin-btn ui-click" id="editStatsSave">SAVE</button>
      <button class="admin-btn ui-click" id="editStatsCancel">CANCEL</button>
    </div>`;

    const modal = document.createElement("div");
    modal.className = "admin-stats-modal";
    modal.innerHTML = html;
    document.body.appendChild(modal);

    document.getElementById("editStatsCancel").addEventListener("click", () => modal.remove());

    document.getElementById("editStatsSave").addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;

      const newData = { ...data };
      if (!newData.stats) newData.stats = {};

      fields.forEach(f => {
        const inp = document.getElementById(`edit_${f.key}`);
        if (!inp) return;
        const v = F.parseNumInput(inp.value);
        if (isNaN(v)) return;
        if (f.stat) newData.stats[f.key] = v;
        else newData[f.key] = v;
      });

      try {
        await window.fb.set(window.fb.ref(window.fb.db, `users/${targetUid}`), newData);

        await window.fb.set(window.fb.ref(window.fb.db, `leaderboard/${targetUid}`), {
          uid: targetUid,
          name: newData.profile?.name || "Anonymous",
          avatar: newData.profile?.avatar || null,
          vip: !!newData.vipActive,
          fish: newData.stats.totalFishEarned || 0,
          clicks: newData.stats.totalClicks || 0,
          time: newData.stats.playTimeSec || 0,
          rebirths: newData.rebirthCount || 0,
          amethysts: newData.crystals || 0,
          eggs: newData.petSystem?.eggsOpenedTotal || 0,
          updated: Date.now()
        });

        if (targetUid === S.currentUser.uid) {
          F.applySaveData(newData);
          F.saveGame();
          await F.pushToLeaderboard();
          S.lastPushedFish = S.stats.totalFishEarned;
        } else {
          const syncCmd = {
            id: Date.now() + "_" + Math.random().toString(36).slice(2, 8),
            type: "replaceSave",
            data: newData,
            from: S.currentUser.uid,
            timestamp: Date.now(),
            message: buildAdminReplaceSaveMessage(),
            delayMs: 900
          };
          await window.fb.set(window.fb.ref(window.fb.db, `commands/${targetUid}/${syncCmd.id}`), syncCmd);
        }

        modal.remove();
        alert("✓ Stats saved!");
        loadAdminPlayers();
      } catch (e) { alert("Failed: " + e.message); }
    });
  }

  const adminViewPlayers = document.getElementById("adminViewPlayers");
  if (adminViewPlayers) adminViewPlayers.addEventListener("click", loadAdminPlayers);

  const adminPlayerSearch = document.getElementById("adminPlayerSearch");
  if (adminPlayerSearch) adminPlayerSearch.addEventListener("input", (e) => renderAdminPlayers(e.target.value));

  const adminGrantUid = document.getElementById("adminGrantUid");
  const adminGrantBtn = document.getElementById("adminGrantBtn");
  const adminRevokeBtn = document.getElementById("adminRevokeBtn");
  if (adminGrantBtn && adminGrantUid) adminGrantBtn.addEventListener("click", () => grantAdminToUid(adminGrantUid.value));
  if (adminRevokeBtn && adminGrantUid) adminRevokeBtn.addEventListener("click", () => revokeAdminFromUid(adminGrantUid.value));

  const adminClearTop = document.getElementById("adminClearTop");
  if (adminClearTop) {
    adminClearTop.addEventListener("click", async () => {
      if (!F.checkAdmin() || !window.fb) return;
      if (!confirm("DELETE ALL LEADERBOARD DATA?")) return;
      if (!confirm("ARE YOU SURE?")) return;
      try {
        await window.fb.remove(window.fb.ref(window.fb.db, "leaderboard"));
        const list = document.getElementById("adminPlayersList");
        if (list) list.innerHTML = `<div class="top-loading">Cleared!</div>`;
        cachedAdminPlayers = [];
      } catch (e) { alert("Failed: " + e.message); }
    });
  }

  /* ========== \u0420\u045F\u0420 \u0418\u041C\u0415\u041D\u0415\u041D\u0418\u0415 \u041A\u041E\u041C\u0410\u041D\u0414 ========== */
  function executeAdminCommand(cmd) {
    if (cmd.type === "addfish") {
      S.score += cmd.amount;
      if (cmd.amount > 0) S.stats.totalFishEarned += cmd.amount;
      if (S.score < 0) S.score = 0;
      F.updateScore();
    }
    else if (cmd.type === "addcrystal") {
      S.crystals += cmd.amount;
      if (S.crystals < 0) S.crystals = 0;
      F.updateScore();
    }
    else if (cmd.type === "addstell") {
      S.stell += cmd.amount;
      if (S.stell < 0) S.stell = 0;
      F.updateScore();
    }
    else if (cmd.type === "addpet") {
      applyLocalAddPet(cmd.petKey || "random", cmd.count || 1);
    }
    else if (cmd.type === "forcepetegg") {
      applyLocalForcedPetEgg(cmd.petKey || "stellangeldemon", cmd.count || 1);
    }
    else if (cmd.type === "luck10") {
      applyLocalLuck10(cmd.durationMs || ADMIN_LUCK_DURATION_MS);
    }
    else if (cmd.type === "grantvip") {
      S.vipActive = true;
      if (F.grantVipPetIfPossible) F.grantVipPetIfPossible();
      F.updateScore();
      F.updateIncome();
      F.saveGame();
    }
    else if (cmd.type === "grantimperial") {
      S.imperialActive = true;
      if (F.grantImperialPetIfPossible) F.grantImperialPetIfPossible();
      F.updateScore();
      F.updateIncome();
      F.saveGame();
    }
    else if (cmd.type === "cometevent") {
      if (F.forceStartCometEvent) F.forceStartCometEvent();
    }
    else if (cmd.type === "wave") {
      if (S.waveActive) F.endWave(S.activeWaveType);
      if (cmd.waveType === "gold") F.startWave("gold", 2, 5);
      else if (cmd.waveType === "diamond") F.startWave("diamond", 5, 10);
      else if (cmd.waveType === "rainbow") F.startWave("rainbow", 100, 300);
      else if (cmd.waveType === "amethyst") F.startWave("amethyst", 1, 300);
    }
    else if (cmd.type === "queueWaves") {
      if (cmd.waves && cmd.waves.length) F.queueWavesSequentially(cmd.waves);
    }
    else if (cmd.type === "setclick") {
      S.clickPower = cmd.value;
      F.updateIncome();
    }
    else if (cmd.type === "setauto") {
      S.autoClicker = cmd.value;
      F.updateIncome();
    }
    else if (cmd.type === "grantadmin") {
      S.localAdminGranted = true;
      F.saveGame();
    }
    else if (cmd.type === "revokeadmin") {
      S.localAdminGranted = false;
      S.isAdmin = false;
      F.saveGame();
    }
    else if (cmd.type === "replaceSave") {
      if (!cmd.data) return;
      F.applySaveData(cmd.data);
      F.saveGame();
      if (S.currentUser) {
        F.pushToLeaderboard();
        S.lastPushedFish = S.stats.totalFishEarned;
      }
    }
  }

  function applyAdminCommand(cmd) {
    if (!cmd || !cmd.type) return;

    const delay = getCommandDelay(cmd);
    const localizedMessage = getCommandMessage(cmd);
    if (localizedMessage) {
      F.playRewardSound();
      F.showNotification(localizedMessage, getCommandNotifyColor(cmd), Math.max(4000, delay + 3200));
    }

    if (delay > 0) setTimeout(() => executeAdminCommand(cmd), delay);
    else executeAdminCommand(cmd);
  }

  function listenForAdminCommands() {
    if (!S.currentUser || !window.fb) return;
    const fb = window.fb;
    const cmdRef = fb.ref(fb.db, `commands/${S.currentUser.uid}`);
    fb.onValue(cmdRef, async (snap) => {
      const data = snap.val();
      if (!data) return;
      const commands = Object.entries(data).sort((a, b) => ((a[1]?.timestamp || 0) - (b[1]?.timestamp || 0)));
      for (const [cmdId, cmd] of commands) {
        try {
          applyAdminCommand(cmd);
          await fb.remove(fb.ref(fb.db, `commands/${S.currentUser.uid}/${cmdId}`));
        } catch (e) { console.warn("Cmd error", e); }
      }
      F.saveGame();
    });
  }

  listenForAdminCommands();
  window.addEventListener("auth-ready", () => {
    listenForAdminCommands();
  });
}