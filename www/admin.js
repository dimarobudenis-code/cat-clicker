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

  function getWaveMeta(waveType) {
    return {
      gold: { title: "ЗОЛОТУЮ ВОЛНУ", mult: "x2", time: "5 СЕК", color: "#ffd700" },
      diamond: { title: "АЛМАЗНУЮ ВОЛНУ", mult: "x5", time: "10 СЕК", color: "#00b4ff" },
      rainbow: { title: "РАДУЖНУЮ ВОЛНУ", mult: "x100", time: "5 МИН", color: "#ff66ff" },
      amethyst: { title: "АМЕТИСТОВУЮ ВОЛНУ", mult: "x100", time: "5 МИН", color: "#c084fc" }
    }[waveType] || { title: "СОБЫТИЕ", mult: "", time: "", color: "#ffd700" };
  }

  function buildAdminFishMessage(amount) {
    if (amount >= 0) return `🎁 АДМИН ОТПРАВИЛ ВАМ +${F.formatNum(amount)} РЫБЫ!`;
    return `⚠️ АДМИН ЗАБРАЛ У ВАС ${F.formatNum(Math.abs(amount))} РЫБЫ!`;
  }

  function buildAdminCrystalMessage(amount) {
    if (amount >= 0) return `💎 АДМИН ОТПРАВИЛ ВАМ +${F.formatNum(amount)} КРИСТАЛЛОВ!`;
    return `⚠️ АДМИН ЗАБРАЛ У ВАС ${F.formatNum(Math.abs(amount))} КРИСТАЛЛОВ!`;
  }

  function buildAdminWaveMessage(waveType) {
    const meta = getWaveMeta(waveType);
    return `⚡ АДМИН ЗАПУСТИЛ У ВАС ${meta.title} ${meta.mult} НА ${meta.time}!`;
  }

  function buildAdminSetClickMessage(value) {
    return `⚡ АДМИН УСТАНОВИЛ ВАМ СИЛУ КЛИКА: ${F.formatNum(value)}`;
  }

  function buildAdminSetAutoMessage(value) {
    return `⚡ АДМИН УСТАНОВИЛ ВАМ АВТОДОХОД: ${F.formatNum(value)}/SEC`;
  }

  function getCommandNotifyColor(cmd) {
    if (cmd.type === "wave") return getWaveMeta(cmd.waveType).color;
    if (cmd.type === "addcrystal") return "#c084fc";
    if (cmd.type === "setclick" || cmd.type === "setauto") return "#4ade80";
    return "#ffd700";
  }

  function getCommandDelay(cmd) {
    if (typeof cmd.delayMs === "number") return cmd.delayMs;
    if (cmd.type === "wave") return 1200;
    if (cmd.message) return 700;
    return 0;
  }

  /* ========== АДМИН: СЕБЕ ========== */
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
      F.startWave("amethyst", 100, 300);
    });
  }

  /* ========== АДМИН: REWARD ALL ========== */
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
      F.startWave("amethyst", 100, 300);
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
    } catch (e) { console.error("Reward all failed", e); }
  }

  /* ========== АДМИН: СИНХР ОНИЗАЦИЯ ========== */
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

  /* ========== АДМИН: ИГР ОКИ ========== */
  let cachedAdminPlayers = [];

  async function loadAdminPlayers() {
    if (!F.checkAdmin() || !window.fb) return;
    const list = document.getElementById("adminPlayersList");
    if (!list) return;
    list.innerHTML = `<div class="top-loading">Loading...</div>`;
    try {
      const [lbSnap, usersSnap] = await Promise.all([
        window.fb.get(window.fb.ref(window.fb.db, "leaderboard")),
        window.fb.get(window.fb.ref(window.fb.db, "users"))
      ]);
      const lbData = lbSnap.val() || {};
      const usersData = usersSnap.val() || {};

      cachedAdminPlayers = Object.entries(lbData).map(([uid, lb]) => {
        const user = usersData[uid] || {};
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
      const el = document.createElement("div");
      el.className = "admin-player-card" + (isBanned ? " admin-banned" : "");
      el.innerHTML = `
        <div class="admin-player-head">
          <span class="admin-player-name">${F.escapeHtml(lb.name || "Anon")}${isBanned ? " [BANNED]" : ""}</span>
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
      alert(`✓ Sent to ${lbData.name || "Anon"}!`);
    } catch (e) {
      alert("Failed: " + e.message);
    }
  }

  /* ========== АДМИН: Р ЕДАКТОР  СТАТИСТИКИ ========== */
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
          fish: newData.stats.totalFishEarned || 0,
          clicks: newData.stats.totalClicks || 0,
          time: newData.stats.playTimeSec || 0,
          updated: Date.now()
        });

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

  /* ========== РџР ИМЕНЕНИЕ КОМАНД ========== */
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
    else if (cmd.type === "wave") {
      if (S.waveActive) F.endWave(S.activeWaveType);
      if (cmd.waveType === "gold") F.startWave("gold", 2, 5);
      else if (cmd.waveType === "diamond") F.startWave("diamond", 5, 10);
      else if (cmd.waveType === "rainbow") F.startWave("rainbow", 100, 300);
      else if (cmd.waveType === "amethyst") F.startWave("amethyst", 100, 300);
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
  }

  function applyAdminCommand(cmd) {
    if (!cmd || !cmd.type) return;

    const delay = getCommandDelay(cmd);
    if (cmd.message) {
      F.playRewardSound();
      F.showNotification(cmd.message, getCommandNotifyColor(cmd), Math.max(4000, delay + 3200));
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