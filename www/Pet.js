(function () {
  const LOCAL_SAVE_KEY = "catclicker_save";
  const MAX_PETS = 100;
  const MAX_EQUIPPED = 3;
  const EGG_COST = 10;

  const RARITY_META = {
    Common: { color: "#9ca3af", badge: "COMMON", glow: "#9ca3af" },
    Rare: { color: "#60a5fa", badge: "RARE", glow: "#60a5fa" },
    Epic: { color: "#c084fc", badge: "EPIC", glow: "#c084fc" },
    Legendary: { color: "#fbbf24", badge: "LEGENDARY", glow: "#ffd700" },
    VIP: { color: "#ffd700", badge: "VIP", glow: "#ffd700" }
  };

  /* ---- \u0420\u0435\u0434\u043A\u043E\u0441\u0442\u043D\u044B\u0435 \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u0438 \u0434\u043B\u044F \u044D\u043A\u0438\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u043F\u0435\u0442\u043E\u0432 ---- */
  const RARITY_STATS = {
    Common: { fishMult: 0, autoMult: 0, luckMult: 0, crystalsPerMin: 0 },
    Rare: { fishMult: 0.5, autoMult: 0.5, luckMult: 0.25, crystalsPerMin: 0 },
    Epic: { fishMult: 1.0, autoMult: 1.0, luckMult: 0.5, crystalsPerMin: 2 },
    Legendary: { fishMult: 2.0, autoMult: 2.0, luckMult: 1.0, crystalsPerMin: 5 },
    VIP: { fishMult: 4.0, autoMult: 0.5, luckMult: 2.0, crystalsPerMin: 5 }
  };

  const PET_POOL = [
    { key: "cat", name: "Cat", rarity: "Common", icon: "CatPet.png", weight: 40, sellPrice: 3 },
    { key: "dog", name: "Dog", rarity: "Common", icon: "DogPet.png", weight: 40, sellPrice: 3 },
    { key: "slime", name: "Slime", rarity: "Rare", icon: "SlimePet.png", weight: 12, sellPrice: 8 },
    { key: "draco", name: "Draco", rarity: "Epic", icon: "DracoPet.PNG", weight: 6, sellPrice: 20 },
    { key: "mooncat", name: "Moon Cat", rarity: "Legendary", icon: "MoonCatPet.png", weight: 2, sellPrice: 60 }
  ];

  const SPECIAL_PETS = [
    { key: "goldpegasus", name: "Gold Pegasus", rarity: "VIP", icon: "GoldPegasus.png", weight: 0, sellPrice: 0, unsellable: true, locked: true, vipOnly: true }
  ];

  const state = {
    activeTab: "eggs",
    inventory: [],
    selectedPetId: null,
    hatch: null,
    eggsOpenedTotal: 0,
    skipHatchAnimation: false,
    adminLuckUntil: 0
  };

  const refs = {};
  let equippedBarRefs = {};

  /* ==========================================================
     \u041F\u0423\u0411\u041B\u0418\u0427\u041D\u042B\u0419 API — window.petSystemApi
     ========================================================== */
  function buildPetApi() {
    const api = {
      getFishMultiplier() {
        return 1 + state.inventory
          .filter(p => p.equipped || p.vipOnly)
          .reduce((sum, p) => sum + (RARITY_STATS[p.rarity]?.fishMult || 0), 0);
      },
      getAutoSpeedMultiplier() {
        return 1 + state.inventory
          .filter(p => p.equipped || p.vipOnly)
          .reduce((sum, p) => sum + (RARITY_STATS[p.rarity]?.autoMult || 0), 0);
      },
      getLuckMultiplier() {
        return 1 + state.inventory
          .filter(p => p.equipped || p.vipOnly)
          .reduce((sum, p) => sum + (RARITY_STATS[p.rarity]?.luckMult || 0), 0);
      },
      getPassiveCrystalsPerMinute() {
        return state.inventory
          .filter(p => p.equipped || p.vipOnly)
          .reduce((sum, p) => sum + (RARITY_STATS[p.rarity]?.crystalsPerMin || 0), 0);
      },
      getEggsOpened() {
        return state.eggsOpenedTotal;
      },
      getEquippedPets() {
        return state.inventory.filter(p => p.equipped);
      },
      getPetPool() {
        return PET_POOL.map(p => ({ key: p.key, name: p.name, rarity: p.rarity, icon: p.icon }));
      },
      adminAddPets(petKey = "random", count = 1, options = {}) {
        return adminAddPets(petKey, count, options);
      },
      startAdminLuckEvent(durationMs = 10 * 60 * 1000, options = {}) {
        return startAdminLuckEvent(durationMs, options);
      },
      grantVipPet() {
        return grantVipPet();
      },
      hasVipPet() {
        return state.inventory.some(p => p.key === "goldpegasus");
      },
      getAdminLuckMultiplier() {
        return getAdminLuckMultiplier();
      },
      /** \u0414\u043B\u044F \u043F\u0440\u043E\u0444\u0438\u043B\u044F — \u0441\u0432\u043E\u0434\u043A\u0430 \u0432\u0441\u0435\u0445 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0431\u043E\u043D\u0443\u0441\u043E\u0432 */
      getPetStats() {
        const equipped = state.inventory.filter(p => p.equipped);
        return {
          equippedCount: equipped.length,
          equippedPets: equipped.map(p => ({ name: p.name, rarity: p.rarity, icon: p.icon })),
          fishMult: api.getFishMultiplier(),
          autoMult: api.getAutoSpeedMultiplier(),
          luckMult: api.getLuckMultiplier(),
          adminLuckMult: getAdminLuckMultiplier(),
          crystalsPerMin: api.getPassiveCrystalsPerMinute()
        };
      }
    };
    window.petSystemApi = api;
    return api;
  }

  /* ==========================================================
     \u0418\u041D\u0418\u0426\u0418\u0410\u041B\u0418\u0417\u0410\u0426\u0418\u042F
     ========================================================== */
  function initPetSystem() {
    if (window.__petSystemInitialized) return;
    if (!window.gameFns || !window.gameState) return;
    window.__petSystemInitialized = true;

    injectStyles();
    buildUi();
    buildEquippedBar();
    patchCoreFunctions();
    loadPetStateFromCurrentSave();
    bindUi();
    renderAll();
    buildPetApi();
    if (window.gameState && window.gameState.vipActive) grantVipPet();
    if (!window.__petLuckTimerStarted) {
      window.__petLuckTimerStarted = true;
      setInterval(() => {
        if (refs && refs.eggMetaText) renderEggShop();
      }, 1000);
    }
  }

  /* ==========================================================
     \u0421\u0422\u0418\u041B\u0418
     ========================================================== */
  function injectStyles() {
    if (document.getElementById("petSystemStyles")) return;
    const style = document.createElement("style");
    style.id = "petSystemStyles";
    style.textContent = `
      .pet-menu {
        width: min(980px, 96vw);
        max-height: 84vh;
      }
      .pet-menu .menu-content {
        padding-top: 12px;
      }
      .pet-action-btn,
      .pet-slot,
      .pet-detail-btn,
      .pet-hatch-btn,
      .pet-hatch-image {
        outline: none;
        -webkit-tap-highlight-color: transparent;
      }
      .pet-action-btn,
      .pet-slot,
      .pet-detail-btn,
      .pet-hatch-btn {
        appearance: none;
        border-radius: 0;
      }
      .pet-action-btn:focus,
      .pet-action-btn:focus-visible,
      .pet-slot:focus,
      .pet-slot:focus-visible,
      .pet-detail-btn:focus,
      .pet-detail-btn:focus-visible,
      .pet-hatch-btn:focus,
      .pet-hatch-btn:focus-visible,
      .pet-hatch-image:focus,
      .pet-hatch-image:focus-visible {
        outline: none;
        box-shadow: none;
      }
      .pet-tabs {
        margin-top: 10px;
      }
      .pet-tab-panel {
        display: none;
      }
      .pet-tab-panel.active {
        display: block;
      }
      .pet-shop-layout {
        display: flex;
        flex-direction: column;
        gap: 18px;
        align-items: center;
      }
      .pet-egg-showcase {
        width: 100%;
        min-height: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        background: linear-gradient(180deg, #2a2140, #171225);
        border: 2px solid #3a3a5a;
        padding: 20px;
        image-rendering: pixelated;
        overflow: hidden;
        position: relative;
      }
      .pet-egg-showcase::before {
        content: "";
        position: absolute;
        inset: -25%;
        background: radial-gradient(circle, rgba(192,132,252,0.22), transparent 60%);
        animation: petAuraFloat 4s ease-in-out infinite;
        pointer-events: none;
      }
      .pet-egg-hero {
        width: min(260px, 60vw);
        aspect-ratio: 1 / 1;
        object-fit: contain;
        image-rendering: pixelated;
        animation: petEggWobble 2.2s ease-in-out infinite, petEggPulse 1.8s ease-in-out infinite;
        filter: drop-shadow(0 0 22px rgba(192,132,252,0.35));
        user-select: none;
        pointer-events: none;
        position: relative;
        z-index: 1;
      }
      .pet-egg-title {
        color: #fff;
        font-size: 12px;
        text-align: center;
        position: relative;
        z-index: 1;
      }
      .pet-egg-subtitle {
        color: #aaa;
        font-size: 7px;
        text-align: center;
        line-height: 1.6;
        position: relative;
        z-index: 1;
      }
      .pet-cost-row {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #c084fc;
        font-size: 10px;
        position: relative;
        z-index: 1;
      }
      .pet-cost-row img {
        width: 28px;
        height: 28px;
        image-rendering: pixelated;
      }
      .pet-buy-row {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .pet-action-btn {
        padding: 14px 10px;
        border: 2px solid #c084fc;
        background: #1a1a2e;
        color: #c084fc;
        font-family: inherit;
        font-size: 9px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .pet-action-btn:hover {
        background: #c084fc;
        color: #000;
      }
      .pet-action-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .pet-info-grid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
      }
      .pet-pool-card {
        background: #221a35;
        border: 2px solid #3a3a5a;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .pet-pool-card img {
        width: 68px;
        height: 68px;
        object-fit: contain;
        image-rendering: pixelated;
      }
      .pet-pool-name {
        color: #fff;
        font-size: 8px;
        text-align: center;
      }
      .pet-rarity-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 8px;
        border: 1px solid currentColor;
        font-size: 6px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      .pet-pool-chance {
        color: #aaa;
        font-size: 7px;
      }
      .pet-inventory-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.95fr);
        gap: 14px;
      }
      .pet-inventory-panel,
      .pet-detail-panel {
        background: #221a35;
        border: 2px solid #3a3a5a;
        padding: 12px;
      }
      .pet-panel-title {
        color: #fff;
        font-size: 10px;
        margin-bottom: 10px;
      }
      .pet-panel-sub {
        color: #888;
        font-size: 6px;
        margin-bottom: 8px;
      }
      .pet-inventory-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        max-height: 52vh;
        overflow-y: auto;
        padding-right: 4px;
      }
      .pet-inventory-grid::-webkit-scrollbar { width: 8px; }
      .pet-inventory-grid::-webkit-scrollbar-track { background: #171225; }
      .pet-inventory-grid::-webkit-scrollbar-thumb { background: #c084fc; }
      .pet-slot {
        min-height: 84px;
        border: 2px solid #3a3a5a;
        background: #171225;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        padding: 6px;
        transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
      }
      .pet-slot:hover {
        border-color: #fff;
        transform: translateY(-2px);
      }
      .pet-slot.empty {
        cursor: default;
        opacity: 0.45;
      }
      .pet-slot.selected {
        border-color: #c084fc;
        box-shadow: 0 0 16px rgba(192,132,252,0.25);
      }
      .pet-slot.equipped {
        border-color: #4ade80;
      }
      .pet-slot.locked::before {
        content: "🔒";
        position: absolute;
        top: 3px;
        left: 4px;
        font-size: 12px;
        line-height: 1;
      }
      .pet-slot.equipped::after {
        content: "E";
        position: absolute;
        top: 4px;
        right: 6px;
        color: #4ade80;
        font-size: 10px;
      }
      .pet-slot img {
        width: 58px;
        height: 58px;
        object-fit: contain;
        image-rendering: pixelated;
        pointer-events: none;
      }
      .pet-slot-empty-text {
        color: #4a445f;
        font-size: 14px;
      }
      .pet-detail-empty {
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: #777;
        font-size: 8px;
        line-height: 1.7;
      }
      .pet-detail-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .pet-detail-top {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .pet-detail-top img {
        width: 88px;
        height: 88px;
        object-fit: contain;
        image-rendering: pixelated;
        background: #171225;
        border: 2px solid #3a3a5a;
        padding: 6px;
      }
      .pet-detail-name {
        color: #fff;
        font-size: 11px;
        line-height: 1.5;
      }
      .pet-detail-meta {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .pet-detail-line {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        background: #171225;
        border: 1px solid #3a3a5a;
        font-size: 7px;
      }
      .pet-detail-line .label { color: #888; }
      .pet-detail-line .value { color: #fff; text-align: right; }
      .pet-boost-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .pet-boost-item {
        padding: 8px 10px;
        background: #171225;
        border: 1px solid #3a3a5a;
        color: #9ca3af;
        font-size: 7px;
      }
      .pet-detail-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .pet-detail-btn {
        padding: 12px 8px;
        border: 2px solid #3a3a5a;
        background: #171225;
        color: #fff;
        font-family: inherit;
        font-size: 8px;
        cursor: pointer;
      }
      .pet-detail-btn.sell {
        border-color: #ff6666;
        color: #ff6666;
      }
      .pet-detail-btn.sell:hover {
        background: #ff6666;
        color: #fff;
      }
      .pet-detail-btn.lock {
        border-color: #ffd700;
        color: #ffd700;
      }
      .pet-detail-btn.lock:hover {
        background: #ffd700;
        color: #000;
      }
      .pet-detail-btn.equip {
        border-color: #4ade80;
        color: #4ade80;
      }
      .pet-detail-btn.equip:hover {
        background: #4ade80;
        color: #000;
      }
      .pet-hatch-overlay {
        position: fixed;
        inset: 0;
        background: radial-gradient(circle at center, rgba(75, 32, 126, 0.22), rgba(0,0,0,0.96));
        z-index: 300;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        overflow: hidden;
      }
      .pet-hatch-overlay.active {
        display: flex;
      }
      .pet-hatch-overlay.reveal-pulse {
        animation: petOverlayPulse 0.35s ease-out;
      }
      .pet-hatch-flash {
        position: fixed;
        inset: 0;
        background: #fff;
        opacity: 0;
        pointer-events: none;
        z-index: 1;
      }
      .pet-hatch-flash.active {
        animation: petFlashBlast 0.42s ease-out forwards;
      }
      .pet-hatch-flash.legendary-flash {
        background: #ffd700;
        animation: petLegendaryFlash 0.7s ease-out forwards;
      }
      .pet-hatch-modal {
        width: min(520px, 94vw);
        background: linear-gradient(180deg, #1d1530, #0e0b18);
        border: 3px solid #c084fc;
        box-shadow: 0 0 32px rgba(192,132,252,0.28), 8px 8px 0 #000;
        padding: 18px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
        position: relative;
        overflow: hidden;
        z-index: 2;
      }
      .pet-hatch-modal::before {
        content: "";
        position: absolute;
        inset: -20%;
        background: radial-gradient(circle, rgba(192,132,252,0.18), transparent 55%);
        animation: petAuraFloat 3.8s ease-in-out infinite;
        pointer-events: none;
      }
      .pet-hatch-modal.shake {
        animation: petHatchModalShake 0.32s linear;
      }
      .pet-hatch-modal.legendary-shake {
        animation: petLegendaryShake 0.5s ease-out;
      }
      .pet-hatch-counter {
        color: #888;
        font-size: 7px;
        letter-spacing: 1px;
        position: relative;
        z-index: 2;
      }
      .pet-hatch-stage {
        color: #fff;
        font-size: 10px;
        position: relative;
        z-index: 2;
      }
      .pet-hatch-tap {
        color: #ffd700;
        font-size: 10px;
        min-height: 18px;
        position: relative;
        z-index: 2;
      }
      .pet-hatch-image-wrap {
        width: 100%;
        min-height: 280px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 2;
        overflow: visible;
      }
      .pet-hatch-aura {
        position: absolute;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.24), rgba(192,132,252,0.18), transparent 68%);
        filter: blur(8px);
        animation: petAuraPulse 1.6s ease-in-out infinite;
        pointer-events: none;
      }
      .pet-hatch-aura.rarity-rare {
        background: radial-gradient(circle, rgba(96,165,250,0.35), rgba(96,165,250,0.15), transparent 68%);
      }
      .pet-hatch-aura.rarity-epic {
        background: radial-gradient(circle, rgba(192,132,252,0.45), rgba(192,132,252,0.2), transparent 68%);
      }
      .pet-hatch-aura.rarity-legendary {
        background: radial-gradient(circle, rgba(255,215,0,0.5), rgba(255,215,0,0.25), transparent 68%);
        animation: petLegendaryAura 1s ease-in-out infinite;
      }
      .pet-hatch-particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: visible;
      }
      .pet-hatch-particle {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 10px;
        height: 10px;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
        box-shadow: 0 0 10px currentColor;
      }
      .pet-hatch-particle.burst-rare {
        animation: petRareBurst 0.9s ease-out forwards;
      }
      .pet-hatch-particle.burst-epic {
        animation: petEpicBurst 1.1s ease-out forwards;
      }
      .pet-hatch-particle.burst-legendary {
        animation: petLegendaryBurst 1.4s ease-out forwards;
      }
      .pet-hatch-particle.burst-common {
        animation: petCommonBurst 0.6s ease-out forwards;
      }
      .pet-hatch-image {
        width: min(300px, 72vw);
        aspect-ratio: 1 / 1;
        object-fit: contain;
        image-rendering: pixelated;
        cursor: pointer;
        user-select: none;
        position: relative;
        z-index: 2;
        transition: filter 0.18s ease, transform 0.18s ease;
      }
      .pet-hatch-image.egg {
        animation: petEggWobble 1.05s ease-in-out infinite, petEggPulse 0.92s ease-in-out infinite;
        filter: drop-shadow(0 0 16px rgba(255,255,255,0.15)) drop-shadow(0 0 28px rgba(192,132,252,0.35));
      }
      .pet-hatch-image.tap-burst {
        animation: petEggTapBurst 0.18s ease-out;
      }
      .pet-hatch-image.stage-two {
        filter: drop-shadow(0 0 18px rgba(255,255,255,0.22)) drop-shadow(0 0 34px rgba(255,215,0,0.3));
      }
      .pet-hatch-image.stage-three {
        filter: drop-shadow(0 0 24px rgba(255,255,255,0.24)) drop-shadow(0 0 44px rgba(255,100,100,0.34));
      }
      .pet-hatch-image.final-crack {
        animation: petEggFinalCrack 0.3s ease-out;
      }
      .pet-hatch-image.final-crack-legendary {
        animation: petEggLegendaryCrack 0.5s ease-out;
      }
      .pet-hatch-image.pet {
        filter: drop-shadow(0 0 18px rgba(255,255,255,0.22)) drop-shadow(0 0 40px rgba(255,255,255,0.18));
      }
      .pet-hatch-image.reveal-pop {
        animation: petPetReveal 0.52s cubic-bezier(.18,.89,.32,1.3);
      }
      .pet-hatch-image.reveal-legendary {
        animation: petLegendaryReveal 0.8s cubic-bezier(.18,.89,.32,1.3);
      }
      .pet-hatch-result {
        display: none;
        width: 100%;
        flex-direction: column;
        gap: 10px;
        align-items: center;
        position: relative;
        z-index: 2;
      }
      .pet-hatch-result.active {
        display: flex;
      }
      .pet-hatch-name {
        color: #fff;
        font-size: 12px;
      }
      .pet-hatch-actions {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .pet-hatch-btn {
        padding: 12px 8px;
        font-family: inherit;
        font-size: 8px;
        border: 2px solid #3a3a5a;
        background: #171225;
        color: #fff;
        cursor: pointer;
      }
      .pet-hatch-btn.keep {
        border-color: #888;
        color: #ddd;
      }
      .pet-hatch-btn.keep:hover {
        background: #888;
        color: #000;
      }
      .pet-hatch-btn.sell {
        border-color: #ff6666;
        color: #ff6666;
      }
      .pet-hatch-btn.sell:hover {
        background: #ff6666;
        color: #fff;
      }
      .pet-hatch-btn.equip {
        border-color: #4ade80;
        color: #4ade80;
      }
      .pet-hatch-btn.equip:hover {
        background: #4ade80;
        color: #000;
      }


      .pet-action-btn.skip-active {
        border-color: #4ade80;
        color: #4ade80;
        box-shadow: 0 0 12px rgba(74,222,128,0.22);
      }
      .pet-action-btn.skip-active:hover {
        background: #4ade80;
        color: #000;
      }
      .pet-luck-line {
        color: #ffd700;
        font-size: 8px;
        line-height: 1.6;
        text-align: center;
        min-height: 12px;
        text-shadow: 0 0 8px rgba(255,215,0,0.45);
      }
      .pet-bulk-result {
        display: none;
        width: 100%;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        position: relative;
        z-index: 2;
      }
      .pet-bulk-result.active {
        display: flex;
      }
      .pet-bulk-title {
        color: #ffd700;
        font-size: 11px;
        text-align: center;
      }
      .pet-bulk-grid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 8px;
        max-height: 260px;
        overflow-y: auto;
        padding: 4px;
      }
      .pet-bulk-card {
        background: #171225;
        border: 2px solid #3a3a5a;
        padding: 8px 4px;
        min-height: 92px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
      }
      .pet-bulk-card img {
        width: 46px;
        height: 46px;
        object-fit: contain;
        image-rendering: pixelated;
      }
      .pet-bulk-name {
        color: #fff;
        font-size: 6px;
        line-height: 1.3;
        text-align: center;
        word-break: break-word;
      }
      .pet-bulk-rarity {
        font-size: 5px;
        text-align: center;
      }
      @media (max-width: 560px) {
        .pet-bulk-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          max-height: 300px;
        }
      }

      /* ---- \u042D\u041A\u0418\u041F\u0418\u0420\u041E\u0412\u0410\u041D\u041D\u042B\u0415 \u041F\u0415\u0422\u042B \u041D\u0410 \u0413\u041B\u0410\u0412\u041D\u041E\u041C \u042D\u041A\u0420\u0410\u041D\u0415 ---- */
      .equipped-bar {
        position: fixed;
        left: 50%;
        bottom: 82px;
        transform: translateX(-50%);
        z-index: 10;
        display: flex;
        gap: 8px;
        align-items: center;
        pointer-events: none;
      }
      .equipped-slot {
        width: 58px;
        height: 58px;
        border: 2px solid #3a3a5a;
        background: rgba(23, 18, 37, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        image-rendering: pixelated;
        transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
      }
      .equipped-slot.filled {
        border-color: #4ade80;
        pointer-events: auto;
        cursor: pointer;
        animation: equippedSlotGlow 2s ease-in-out infinite;
      }
      .equipped-slot.filled:hover {
        transform: scale(1.08);
      }
      .equipped-slot img {
        width: 44px;
        height: 44px;
        object-fit: contain;
        image-rendering: pixelated;
        pointer-events: none;
      }
      .equipped-slot .eq-empty-icon {
        color: #4a445f;
        font-size: 16px;
        opacity: 0.4;
      }
      .equipped-slot .eq-rarity-glow {
        position: absolute;
        inset: -3px;
        border: 2px solid transparent;
        pointer-events: none;
        animation: eqRarityPulse 1.5s ease-in-out infinite;
      }
      @keyframes equippedSlotGlow {
        0%, 100% { box-shadow: 0 0 6px rgba(74, 222, 128, 0.2); }
        50% { box-shadow: 0 0 14px rgba(74, 222, 128, 0.4); }
      }
      @keyframes eqRarityPulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }

      /* ---- \u0410\u041D\u0418\u041C\u0410\u0426\u0418\u0418 \u0420\u0415\u0414\u041A\u041E\u0421\u0422\u0415\u0419 ---- */
      @keyframes petCommonBurst {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(0.2) rotate(0deg); }
        100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.6) rotate(var(--rot)); }
      }
      @keyframes petRareBurst {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(0.2) rotate(0deg); }
        40% { opacity: 1; }
        100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.1) rotate(var(--rot)); }
      }
      @keyframes petEpicBurst {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(0.2) rotate(0deg); }
        30% { opacity: 1; transform: translate(-50%, -50%) scale(0.6) rotate(0deg); }
        100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.4) rotate(var(--rot)); }
      }
      @keyframes petLegendaryBurst {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(0.2) rotate(0deg); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(0.8) rotate(0deg); }
        100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.8) rotate(var(--rot)); }
      }
      @keyframes petEggWobble {
        0%, 100% { transform: rotate(-5deg) translateY(0px); }
        25% { transform: rotate(-1.5deg) translateY(-3px); }
        50% { transform: rotate(5deg) translateY(-6px); }
        75% { transform: rotate(1deg) translateY(-2px); }
      }
      @keyframes petEggPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes petAuraFloat {
        0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
        50% { transform: translateY(-8px) scale(1.06); opacity: 1; }
      }
      @keyframes petAuraPulse {
        0%, 100% { transform: scale(0.95); opacity: 0.65; }
        50% { transform: scale(1.12); opacity: 1; }
      }
      @keyframes petEggTapBurst {
        0% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.12) rotate(4deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      @keyframes petEggFinalCrack {
        0% { transform: scale(1) rotate(0deg); }
        30% { transform: scale(1.18) rotate(-8deg); }
        60% { transform: scale(0.92) rotate(8deg); }
        100% { transform: scale(1.04) rotate(0deg); }
      }
      @keyframes petEggLegendaryCrack {
        0% { transform: scale(1) rotate(0deg); }
        20% { transform: scale(1.28) rotate(-12deg); }
        40% { transform: scale(0.85) rotate(12deg); }
        70% { transform: scale(1.12) rotate(-4deg); }
        100% { transform: scale(1.04) rotate(0deg); }
      }
      @keyframes petPetReveal {
        0% { transform: scale(0.18) rotate(-18deg); opacity: 0; }
        60% { transform: scale(1.16) rotate(4deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes petLegendaryReveal {
        0% { transform: scale(0.05) rotate(-30deg); opacity: 0; filter: brightness(4); }
        40% { transform: scale(1.3) rotate(6deg); opacity: 1; filter: brightness(1.6); }
        70% { transform: scale(0.9) rotate(-3deg); filter: brightness(1); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1); }
      }
      @keyframes petHatchModalShake {
        0%, 100% { transform: translate(0, 0); }
        20% { transform: translate(-6px, 2px); }
        40% { transform: translate(7px, -2px); }
        60% { transform: translate(-4px, -1px); }
        80% { transform: translate(5px, 2px); }
      }
      @keyframes petLegendaryShake {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-10px, 4px); }
        25% { transform: translate(12px, -6px); }
        40% { transform: translate(-8px, 3px); }
        55% { transform: translate(10px, -4px); }
        70% { transform: translate(-5px, 2px); }
        85% { transform: translate(6px, -2px); }
      }
      @keyframes petLegendaryFlash {
        0% { opacity: 0; }
        10% { opacity: 0.9; }
        25% { opacity: 0.5; }
        40% { opacity: 0.85; }
        55% { opacity: 0.3; }
        70% { opacity: 0.7; }
        85% { opacity: 0.1; }
        100% { opacity: 0; }
      }
      @keyframes petLegendaryAura {
        0%, 100% { transform: scale(0.9); opacity: 0.5; filter: blur(8px); }
        50% { transform: scale(1.25); opacity: 1; filter: blur(12px); }
      }
      @keyframes petFlashBlast {
        0% { opacity: 0; }
        15% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes petOverlayPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
      @media (max-width: 900px) {
        .pet-inventory-layout {
          grid-template-columns: 1fr;
        }
        .pet-detail-actions,
        .pet-hatch-actions {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 560px) {
        .pet-inventory-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          max-height: 42vh;
        }
        .pet-detail-top {
          flex-direction: column;
          text-align: center;
        }
        .pet-buy-row {
          grid-template-columns: 1fr;
        }
        .equipped-slot {
          width: 48px;
          height: 48px;
        }
        .equipped-slot img {
          width: 36px;
          height: 36px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ==========================================================
     UI: \u041C\u0415\u041D\u042E \u041F\u0415\u0422\u041E\u0412
     ========================================================== */
  function buildUi() {
    const bottomButtons = document.querySelector(".bottom-buttons");
    if (!bottomButtons || document.getElementById("petShopBtn")) return;

    const petBtn = document.createElement("button");
    petBtn.className = "bottom-btn ui-click";
    petBtn.id = "petShopBtn";
    petBtn.innerHTML = `<img src="ShopPet.png" alt="Pets" />`;
    bottomButtons.appendChild(petBtn);

    const petMenu = document.createElement("div");
    petMenu.className = "menu pet-menu";
    petMenu.id = "petMenu";
    petMenu.innerHTML = `
      <div class="menu-header">
        <div class="menu-title">PET SHOP</div>
        <button class="close-btn ui-click" id="petMenuClose"><img src="CloseIcon.png" alt="Close" /></button>
      </div>
      <div class="shop-tabs pet-tabs">
        <button class="shop-tab active ui-click" data-pet-tab="eggs">EGGS</button>
        <button class="shop-tab ui-click" data-pet-tab="inventory">INVENTORY</button>
      </div>
      <div class="menu-content">
        <div class="pet-tab-panel active" data-pet-panel="eggs">
          <div class="pet-shop-layout">
            <div class="pet-egg-showcase">
              <img class="pet-egg-hero" src="Egg1.png" alt="Egg" />
              <div class="pet-egg-title">EGG #1</div>
              <div class="pet-egg-subtitle">Tap open eggs and collect pets.<br/>Cost: 10 amethysts each.</div>
              <div class="pet-cost-row"><img src="CrystalIcon.png" alt="Amethyst" /><span>10 AMETHYSTS</span></div>
            </div>
            <div class="pet-buy-row">
              <button class="pet-action-btn ui-click" id="buyPetEgg1">BUY 1 EGG</button>
              <button class="pet-action-btn ui-click" id="buyPetEgg10">BUY 10 EGGS</button>
              <button class="pet-action-btn ui-click" id="petSkipHatchBtn">SKIP ANIMATION: OFF</button>
            </div>
            <div class="pet-luck-line" id="petLuckLine"></div>
            <div class="pet-egg-subtitle" id="petEggMetaText"></div>
            <div class="pet-info-grid" id="petPoolGrid"></div>
          </div>
        </div>
        <div class="pet-tab-panel" data-pet-panel="inventory">
          <div class="pet-inventory-layout">
            <div class="pet-inventory-panel">
              <div class="pet-panel-title">INVENTORY</div>
              <div class="pet-panel-sub" id="petInventoryCount">0 / 100 slots used</div>
              <div class="pet-inventory-grid" id="petInventoryGrid"></div>
            </div>
            <div class="pet-detail-panel" id="petDetailPanel"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(petMenu);

    const hatchOverlay = document.createElement("div");
    hatchOverlay.className = "pet-hatch-overlay";
    hatchOverlay.id = "petHatchOverlay";
    hatchOverlay.innerHTML = `
      <div class="pet-hatch-flash" id="petHatchFlash"></div>
      <div class="pet-hatch-modal" id="petHatchModal">
        <div class="pet-hatch-counter" id="petHatchCounter">EGG 1 / 1</div>
        <div class="pet-hatch-stage" id="petHatchStage">MYSTERY EGG</div>
        <div class="pet-hatch-image-wrap" id="petHatchImageWrap">
          <div class="pet-hatch-aura" id="petHatchAura"></div>
          <div class="pet-hatch-particles" id="petHatchParticles"></div>
          <img class="pet-hatch-image egg" id="petHatchImage" src="Egg1.png" alt="Egg" tabindex="0" />
        </div>
        <div class="pet-hatch-tap" id="petHatchTap">Tap!</div>
        <div class="pet-hatch-result" id="petHatchResult">
          <div class="pet-hatch-name" id="petHatchName"></div>
          <div class="pet-rarity-badge" id="petHatchRarity"></div>
          <div class="pet-hatch-actions">
            <button class="pet-hatch-btn equip ui-click" id="petHatchEquipBtn">EQUIP</button>
            <button class="pet-hatch-btn sell ui-click" id="petHatchSellBtn">SELL</button>
            <button class="pet-hatch-btn keep ui-click" id="petHatchKeepBtn">KEEP</button>
          </div>
        </div>
        <div class="pet-bulk-result" id="petBulkResult">
          <div class="pet-bulk-title" id="petBulkTitle">PETS HATCHED</div>
          <div class="pet-bulk-grid" id="petBulkGrid"></div>
          <div class="pet-hatch-actions">
            <button class="pet-hatch-btn equip ui-click" id="petBulkEquipBestBtn">EQUIP BEST</button>
            <button class="pet-hatch-btn keep ui-click" id="petBulkCloseBtn">KEEP ALL</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(hatchOverlay);

    refs.button = petBtn;
    refs.menu = petMenu;
    refs.close = petMenu.querySelector("#petMenuClose");
    refs.tabButtons = Array.from(petMenu.querySelectorAll("[data-pet-tab]"));
    refs.tabPanels = Array.from(petMenu.querySelectorAll("[data-pet-panel]"));
    refs.buy1 = petMenu.querySelector("#buyPetEgg1");
    refs.buy10 = petMenu.querySelector("#buyPetEgg10");
    refs.skipHatchBtn = petMenu.querySelector("#petSkipHatchBtn");
    refs.poolGrid = petMenu.querySelector("#petPoolGrid");
    refs.inventoryGrid = petMenu.querySelector("#petInventoryGrid");
    refs.inventoryCount = petMenu.querySelector("#petInventoryCount");
    refs.detailPanel = petMenu.querySelector("#petDetailPanel");
    refs.eggMetaText = petMenu.querySelector("#petEggMetaText");
    refs.luckLine = petMenu.querySelector("#petLuckLine");
    refs.hatchOverlay = hatchOverlay;
    refs.hatchFlash = hatchOverlay.querySelector("#petHatchFlash");
    refs.hatchModal = hatchOverlay.querySelector("#petHatchModal");
    refs.hatchAura = hatchOverlay.querySelector("#petHatchAura");
    refs.hatchImageWrap = hatchOverlay.querySelector("#petHatchImageWrap");
    refs.hatchParticles = hatchOverlay.querySelector("#petHatchParticles");
    refs.hatchCounter = hatchOverlay.querySelector("#petHatchCounter");
    refs.hatchStage = hatchOverlay.querySelector("#petHatchStage");
    refs.hatchImage = hatchOverlay.querySelector("#petHatchImage");
    refs.hatchTap = hatchOverlay.querySelector("#petHatchTap");
    refs.hatchResult = hatchOverlay.querySelector("#petHatchResult");
    refs.hatchName = hatchOverlay.querySelector("#petHatchName");
    refs.hatchRarity = hatchOverlay.querySelector("#petHatchRarity");
    refs.hatchEquipBtn = hatchOverlay.querySelector("#petHatchEquipBtn");
    refs.hatchSellBtn = hatchOverlay.querySelector("#petHatchSellBtn");
    refs.hatchKeepBtn = hatchOverlay.querySelector("#petHatchKeepBtn");
    refs.bulkResult = hatchOverlay.querySelector("#petBulkResult");
    refs.bulkTitle = hatchOverlay.querySelector("#petBulkTitle");
    refs.bulkGrid = hatchOverlay.querySelector("#petBulkGrid");
    refs.bulkEquipBestBtn = hatchOverlay.querySelector("#petBulkEquipBestBtn");
    refs.bulkCloseBtn = hatchOverlay.querySelector("#petBulkCloseBtn");
  }

  /* ==========================================================
     UI: \u042D\u041A\u0418\u041F\u0418\u0420\u041E\u0412\u0410\u041D\u041D\u042B\u0415 \u041F\u0415\u0422\u042B \u041D\u0410 \u0413\u041B\u0410\u0412\u041D\u041E\u041C \u042D\u041A\u0420\u0410\u041D\u0415 (Option A)
     ========================================================== */
  function buildEquippedBar() {
    // \u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u043C \u044D\u043A\u0440\u0430\u043D\u0435 \u041D\u0415 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u043C 3 \u0441\u043B\u043E\u0442\u0430 \u044D\u043A\u0438\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u043F\u0438\u0442\u043E\u043C\u0446\u0435\u0432.
    // \u0421\u043B\u043E\u0442\u044B \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u043D\u0443\u0442\u0440\u0438 PET SHOP -> INVENTORY.
    const oldBar = document.getElementById("equippedBar");
    if (oldBar) oldBar.remove();

    equippedBarRefs = {
      bar: null,
      slots: []
    };
  }

  function updateEquippedBar() {
    // \u041D\u0438\u0436\u043D\u044F\u044F \u043F\u043E\u043B\u043E\u0441\u043A\u0430 \u044D\u043A\u0438\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u043F\u0438\u0442\u043E\u043C\u0446\u0435\u0432 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u0430; \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C \u0444\u0443\u043D\u043A\u0446\u0438\u044E \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0439
    // \u0434\u043B\u044F \u0441\u0442\u0430\u0440\u044B\u0445 \u0432\u044B\u0437\u043E\u0432\u043E\u0432 renderAll()/equip, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u043B\u043E\u043C\u0430\u0442\u044C \u0431\u043E\u043D\u0443\u0441\u044B \u043F\u0438\u0442\u043E\u043C\u0446\u0435\u0432.
    if (!equippedBarRefs || !Array.isArray(equippedBarRefs.slots) || equippedBarRefs.slots.length === 0) return;

    const equipped = state.inventory.filter(p => p.equipped);
    equippedBarRefs.slots.forEach((slot, i) => {
      const pet = equipped[i];
      if (pet) {
        const rarity = RARITY_META[pet.rarity] || RARITY_META.Common;
        slot.className = `equipped-slot filled`;
        slot.innerHTML = `
          <img src="${pet.icon}" alt="${pet.name}" title="${pet.name} (${pet.rarity})" />
          <div class="eq-rarity-glow" style="border-color:${rarity.color};"></div>
        `;
      } else {
        slot.className = `equipped-slot`;
        slot.innerHTML = `<span class="eq-empty-icon">+</span>`;
      }
    });
  }

  /* ==========================================================
     \u0411\u0418\u041D\u0414\u0418\u041D\u0413 UI
     ========================================================== */
  function bindUi() {
    refs.button.addEventListener("click", openPetMenu);
    refs.close.addEventListener("click", () => window.gameFns.closeAllMenus());

    refs.tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeTab = btn.dataset.petTab;
        renderTabs();
      });
    });

    refs.buy1.addEventListener("click", () => buyEggs(1));
    refs.buy10.addEventListener("click", () => buyEggs(10));
    refs.skipHatchBtn.addEventListener("click", toggleSkipHatchAnimation);

    refs.inventoryGrid.addEventListener("click", (e) => {
      const slot = e.target.closest("[data-pet-id]");
      if (!slot) return;
      state.selectedPetId = slot.dataset.petId;
      renderInventory();
    });

    refs.hatchImage.addEventListener("click", onHatchTap);
    refs.hatchImage.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onHatchTap();
      }
    });
    refs.hatchEquipBtn.addEventListener("click", onHatchEquip);
    refs.hatchSellBtn.addEventListener("click", onHatchSell);
    refs.hatchKeepBtn.addEventListener("click", advanceHatchSequence);
    refs.bulkEquipBestBtn.addEventListener("click", equipBestBulkPets);
    refs.bulkCloseBtn.addEventListener("click", () => {
      closeHatchOverlay();
      renderInventory();
      renderEggShop();
      updateEquippedBar();
    });
  }

  /* ==========================================================
     \u041F\u0410\u0422\u0427 \u041A\u041E\u0420-\u0424\u0423\u041D\u041A\u0426\u0418\u0419
     ========================================================== */
  function patchCoreFunctions() {
    if (window.__petCorePatched) return;

    const originalBuild = window.buildSaveData;
    const originalApply = window.applySaveData;
    const originalCloseAllMenus = window.closeAllMenus;

    window.buildSaveData = function (lastOnlineOverride) {
      const data = originalBuild(lastOnlineOverride);
      data.petSystem = serializePetState();
      return data;
    };

    window.applySaveData = function (data) {
      originalApply(data);
      loadPetState(data && data.petSystem);
      renderAll();
    };

    window.closeAllMenus = function () {
      originalCloseAllMenus();
      closePetMenu();
      closeHatchOverlay();
    };

    if (window.gameFns) {
      window.gameFns.buildSaveData = window.buildSaveData;
      window.gameFns.applySaveData = window.applySaveData;
      window.gameFns.closeAllMenus = window.closeAllMenus;
    }

    window.__petCorePatched = true;
  }

  /* ==========================================================
     \u0417\u0410\u0413\u0420\u0423\u0417\u041A\u0410 / \u0421\u041E\u0425\u0420\u0410\u041D\u0415\u041D\u0418\u0415
     ========================================================== */
  function loadPetStateFromCurrentSave() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_SAVE_KEY) || "null");
      loadPetState(parsed && parsed.petSystem);
    } catch (e) {
      loadPetState(null);
    }
  }

  function serializePetState() {
    return {
      activeTab: state.activeTab,
      selectedPetId: state.selectedPetId,
      inventory: state.inventory.map((pet) => ({ ...pet })),
      eggsOpenedTotal: state.eggsOpenedTotal,
      skipHatchAnimation: state.skipHatchAnimation,
      adminLuckUntil: state.adminLuckUntil
    };
  }

  function loadPetState(raw) {
    const safeInventory = Array.isArray(raw && raw.inventory)
      ? raw.inventory.slice(0, MAX_PETS).map(normalizePet).filter(Boolean)
      : [];

    let equippedCount = 0;
    safeInventory.forEach((pet) => {
      if (pet.equipped) {
        equippedCount += 1;
        if (equippedCount > MAX_EQUIPPED) pet.equipped = false;
      }
    });

    state.inventory = safeInventory;
    state.activeTab = (raw && raw.activeTab) || state.activeTab || "eggs";
    const selectedExists = safeInventory.some((pet) => pet.id === (raw && raw.selectedPetId));
    state.selectedPetId = selectedExists ? raw.selectedPetId : (safeInventory[0] ? safeInventory[0].id : null);
    state.eggsOpenedTotal = raw && raw.eggsOpenedTotal || 0;
    state.skipHatchAnimation = !!(raw && raw.skipHatchAnimation);
    state.adminLuckUntil = raw && raw.adminLuckUntil || 0;
  }

  function normalizePet(pet) {
    if (!pet || typeof pet !== "object") return null;
    const definition = [...PET_POOL, ...SPECIAL_PETS].find((item) => item.key === pet.key) || [...PET_POOL, ...SPECIAL_PETS].find((item) => item.name === pet.name);
    if (!definition) return null;
    return {
      id: pet.id || makePetId(),
      key: definition.key,
      name: definition.name,
      rarity: definition.rarity,
      icon: definition.icon,
      sellPrice: Number.isFinite(pet.sellPrice) ? pet.sellPrice : definition.sellPrice,
      equipped: !!pet.equipped,
      locked: !!pet.locked || !!definition.locked,
      unsellable: !!pet.unsellable || !!definition.unsellable,
      vipOnly: !!pet.vipOnly || !!definition.vipOnly,
      createdAt: pet.createdAt || Date.now()
    };
  }

  function renderAll() {
    renderTabs();
    renderEggShop();
    renderInventory();
    renderPoolCards();
    updateEquippedBar();
  }

  function renderTabs() {
    refs.tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.petTab === state.activeTab));
    refs.tabPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.petPanel === state.activeTab));
  }

  function renderEggShop() {
    const freeSlots = getFreeSlots();
    const crystals = window.gameState.crystals;
    refs.buy1.disabled = crystals < EGG_COST || freeSlots < 1 || !!state.hatch;
    refs.buy10.disabled = crystals < EGG_COST * 10 || freeSlots < 10 || !!state.hatch;
    if (refs.skipHatchBtn) {
      refs.skipHatchBtn.textContent = `SKIP ANIMATION: ${state.skipHatchAnimation ? "ON" : "OFF"}`;
      refs.skipHatchBtn.classList.toggle("skip-active", state.skipHatchAnimation);
    }
    const luck = getCurrentLuckMultiplier();
    if (refs.luckLine) {
      const left = Math.max(0, (state.adminLuckUntil || 0) - Date.now());
      refs.luckLine.textContent = luck > 1
        ? `LUCK x${formatLuck(luck)}${left > 0 ? ` • admin event ${formatDurationShort(left)} left` : ""}`
        : "";
    }
    refs.eggMetaText.textContent = `You have ${formatNum(crystals)} amethysts • ${state.inventory.length}/${MAX_PETS} slots used • Equip up to ${MAX_EQUIPPED} pets`;
  }

  function renderPoolCards() {
    const totalWeight = PET_POOL.reduce((sum, pet) => sum + pet.weight, 0);
    refs.poolGrid.innerHTML = "";
    PET_POOL.forEach((pet) => {
      const card = document.createElement("div");
      card.className = "pet-pool-card";
      const rarity = RARITY_META[pet.rarity];
      card.innerHTML = `
        <img src="${pet.icon}" alt="${pet.name}" />
        <div class="pet-pool-name">${pet.name}</div>
        <div class="pet-rarity-badge" style="color:${rarity.color}">${rarity.badge}</div>
        <div class="pet-pool-chance">${((pet.weight / totalWeight) * 100).toFixed(0)}% chance</div>
      `;
      refs.poolGrid.appendChild(card);
    });
  }

  function renderInventory() {
    if (!state.selectedPetId && state.inventory[0]) state.selectedPetId = state.inventory[0].id;
    refs.inventoryCount.textContent = `${state.inventory.length} / ${MAX_PETS} slots used • ${getEquippedCount()} / ${MAX_EQUIPPED} equipped`;
    refs.inventoryGrid.innerHTML = "";

    const visibleSlots = Math.max(MAX_PETS, state.inventory.length);
    for (let i = 0; i < visibleSlots; i++) {
      const pet = state.inventory[i];
      const slot = document.createElement("button");
      slot.type = "button";
      if (!pet) {
        slot.className = "pet-slot empty";
        slot.innerHTML = `<span class="pet-slot-empty-text">+</span>`;
      } else {
        slot.className = `pet-slot ${pet.equipped ? "equipped" : ""} ${pet.locked ? "locked" : ""} ${state.selectedPetId === pet.id ? "selected" : ""}`.trim();
        slot.dataset.petId = pet.id;
        slot.title = `${pet.name} • ${pet.rarity}`;
        slot.innerHTML = `<img src="${pet.icon}" alt="${pet.name}" />`;
      }
      refs.inventoryGrid.appendChild(slot);
    }

    renderPetDetails();
  }

  function renderPetDetails() {
    const pet = getSelectedPet();
    if (!pet) {
      refs.detailPanel.innerHTML = `<div class="pet-detail-empty">Select a pet in your inventory.<br/>You can store up to ${MAX_PETS} pets.</div>`;
      return;
    }

    const rarity = RARITY_META[pet.rarity] || RARITY_META.Common;
    const stats = RARITY_STATS[pet.rarity] || RARITY_STATS.Common;

    const boostLines = [];
    if (stats.fishMult > 0) boostLines.push(`🐟 Fish +${(stats.fishMult * 100).toFixed(0)}%`);
    if (stats.autoMult > 0) boostLines.push(`⚡ Auto +${(stats.autoMult * 100).toFixed(0)}%`);
    if (stats.luckMult > 0) boostLines.push(`🍀 Luck +${(stats.luckMult * 100).toFixed(0)}%`);
    if (stats.crystalsPerMin > 0) boostLines.push(`💎 +${stats.crystalsPerMin} crystals/min`);
    if (!boostLines.length) boostLines.push("Cosmetic only");

    refs.detailPanel.innerHTML = `
      <div class="pet-detail-card">
        <div class="pet-panel-title">PET DETAILS</div>
        <div class="pet-detail-top">
          <img src="${pet.icon}" alt="${pet.name}" />
          <div class="pet-detail-meta">
            <div class="pet-detail-name">${escapeHtml(pet.name)}</div>
            <div class="pet-rarity-badge" style="color:${rarity.color}">${rarity.badge}</div>
          </div>
        </div>
        <div class="pet-detail-line"><span class="label">Rarity</span><span class="value">${pet.rarity}</span></div>
        <div class="pet-detail-line"><span class="label">Sell Price</span><span class="value">${pet.unsellable ? "Not sellable" : `${formatNum(pet.sellPrice)} amethysts`}</span></div>
        <div class="pet-detail-line"><span class="label">Status</span><span class="value">${pet.equipped ? "Equipped" : "In inventory"}${pet.locked ? " • Locked" : ""}${pet.unsellable ? " • Unique" : ""}</span></div>
        <div>
          <div class="pet-panel-title" style="font-size:8px;margin-bottom:6px;">BOOSTS</div>
          <div class="pet-boost-list">
            ${boostLines.map((line) => `<div class="pet-boost-item">${escapeHtml(line)}</div>`).join("")}
          </div>
        </div>
        <div class="pet-detail-actions">
          <button class="pet-detail-btn equip ui-click" id="petDetailEquipBtn">${pet.equipped ? "UNEQUIP" : "EQUIP"}</button>
          <button class="pet-detail-btn lock ui-click" id="petDetailLockBtn">${pet.unsellable ? "LOCKED" : (pet.locked ? "UNLOCK" : "LOCK")}</button>
          <button class="pet-detail-btn sell ui-click" id="petDetailSellBtn">${pet.unsellable ? "UNSELLABLE" : "SELL"}</button>
        </div>
      </div>
    `;

    refs.detailPanel.querySelector("#petDetailEquipBtn").addEventListener("click", () => toggleEquipSelectedPet());
    refs.detailPanel.querySelector("#petDetailLockBtn").addEventListener("click", () => toggleLockSelectedPet());
    refs.detailPanel.querySelector("#petDetailSellBtn").addEventListener("click", () => sellSelectedPet());
  }

  function openPetMenu() {
    renderAll();
    window.gameFns.openMenu(refs.menu);
    renderTabs();
  }

  function closePetMenu() {
    if (refs.menu) refs.menu.classList.remove("active");
  }

  function buyEggs(count) {
    const totalCost = EGG_COST * count;
    if (state.hatch) return;
    if (getFreeSlots() < count) {
      notify(`Need ${count} free pet slots!`, "#ff6666");
      return;
    }
    if (window.gameState.crystals < totalCost) {
      notify(`Not enough amethysts! Need ${formatNum(totalCost)}.`, "#ff6666");
      return;
    }

    window.gameState.crystals = Math.max(0, window.gameState.crystals - totalCost);
    saveAll();

    state.hatch = {
      total: count,
      index: 0,
      currentPet: null,
      crackStage: 1,
      revealing: false,
      bulkPets: []
    };
    openHatchOverlay();
    if (state.skipHatchAnimation) {
      revealInstantHatches(count);
    } else {
      prepareNextHatchEgg();
    }
    renderEggShop();
  }

  function openHatchOverlay() {
    clearHatchParticles();
    refs.hatchOverlay.classList.add("active");
  }

  function closeHatchOverlay() {
    refs.hatchOverlay.classList.remove("active");
    refs.hatchOverlay.classList.remove("reveal-pulse");
    refs.hatchFlash.classList.remove("active");
    refs.hatchFlash.classList.remove("legendary-flash");
    if (refs.bulkResult) refs.bulkResult.classList.remove("active");
    clearHatchParticles();
    state.hatch = null;
  }

  function prepareNextHatchEgg() {
    if (!state.hatch) return;
    state.hatch.index += 1;
    state.hatch.currentPet = null;
    state.hatch.crackStage = 1;
    state.hatch.revealing = false;
    refs.hatchCounter.textContent = `EGG ${state.hatch.index} / ${state.hatch.total}`;
    refs.hatchStage.textContent = "MYSTERY EGG";
    refs.hatchTap.textContent = "Tap!";
    refs.hatchImage.src = "Egg1.png";
    refs.hatchImage.className = "pet-hatch-image egg";
    refs.hatchImageWrap.style.display = "flex";
    refs.hatchImage.style.display = "block";
    refs.hatchResult.classList.remove("active");
    if (refs.bulkResult) refs.bulkResult.classList.remove("active");
    refs.hatchFlash.classList.remove("active");
    refs.hatchFlash.classList.remove("legendary-flash");
    refs.hatchOverlay.classList.remove("reveal-pulse");
    refs.hatchModal.className = "pet-hatch-modal";
    refs.hatchAura.className = "pet-hatch-aura";
    clearHatchParticles();
  }

  function onHatchTap() {
    if (!state.hatch || state.hatch.currentPet || state.hatch.revealing) return;

    if (state.hatch.crackStage === 1) {
      state.hatch.crackStage = 2;
      refs.hatchImage.src = "Egg2.png";
      refs.hatchImage.className = "pet-hatch-image egg stage-two";
      refs.hatchTap.textContent = "Tap!";
      refs.hatchStage.textContent = "THE SHELL IS CRACKING";
      animateEggCrack(16, ["#c084fc", "#ffffff", "#fbbf24"], false, "common");
      return;
    }

    if (state.hatch.crackStage === 2) {
      state.hatch.crackStage = 3;
      refs.hatchImage.src = "Egg3.png";
      refs.hatchImage.className = "pet-hatch-image egg stage-three";
      refs.hatchTap.textContent = "Tap!";
      refs.hatchStage.textContent = "ALMOST THERE";
      animateEggCrack(24, ["#ffffff", "#ffd700", "#fb7185", "#c084fc"], false, "common");
      return;
    }

    // \u0424\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u0440\u0430\u043A — \u0443\u0437\u043D\u0430\u0451\u043C \u0440\u0435\u0434\u043A\u043E\u0441\u0442\u044C \u0437\u0430\u0440\u0430\u043D\u0435\u0435
    state.hatch.revealing = true;
    const upcomingPet = createRolledPet();
    state.hatch._upcomingPet = upcomingPet;

    const rarityKey = upcomingPet.rarity;
    const isLegendary = rarityKey === "Legendary";

    refs.hatchTap.textContent = "";
    refs.hatchStage.textContent = isLegendary ? "⚡ THE LEGENDARY EGG IS BREAKING ⚡" : "THE EGG IS BREAKING";

    if (isLegendary) {
      refs.hatchImage.className = "pet-hatch-image egg stage-three final-crack-legendary";
      animateEggCrack(40, ["#ffd700", "#ffffff", "#ffaa00", "#fff4b0"], true, "legendary");
      refs.hatchModal.className = "pet-hatch-modal legendary-shake";
      triggerLegendaryFlash();
    } else if (rarityKey === "Epic") {
      refs.hatchImage.className = "pet-hatch-image egg stage-three final-crack";
      animateEggCrack(34, ["#c084fc", "#ffffff", "#a855f7", "#e8d5ff"], true, "epic");
    } else if (rarityKey === "Rare") {
      refs.hatchImage.className = "pet-hatch-image egg stage-three final-crack";
      animateEggCrack(30, ["#60a5fa", "#ffffff", "#93c5fd", "#bfdbfe"], true, "rare");
    } else {
      refs.hatchImage.className = "pet-hatch-image egg stage-three final-crack";
      animateEggCrack(22, ["#ffffff", "#d1d5db", "#9ca3af"], true, "common");
    }

    setTimeout(() => revealHatchedPet(upcomingPet), isLegendary ? 380 : 230);
  }

  function triggerLegendaryFlash() {
    refs.hatchFlash.className = "pet-hatch-flash legendary-flash";
    // \u0414\u0432\u043E\u0439\u043D\u0430\u044F \u0432\u0441\u043F\u044B\u0448\u043A\u0430
    setTimeout(() => {
      refs.hatchFlash.classList.remove("legendary-flash");
      void refs.hatchFlash.offsetWidth;
      refs.hatchFlash.className = "pet-hatch-flash legendary-flash";
    }, 300);
  }

  function animateEggCrack(particleCount, palette, isFinal, rarityClass) {
    animateOnce(refs.hatchImage, "tap-burst");
    animateOnce(refs.hatchModal, "shake");
    if (isFinal) animateOnce(refs.hatchOverlay, "reveal-pulse");
    spawnHatchParticles(particleCount, palette, isFinal ? 1.3 : 1, rarityClass || "common");
  }

  /* ==========================================================
     \u0425\u0415\u0422\u0427-\u0410\u041D\u0406\u041C\u0410\u0426\u0418\u0418 \u041F\u041E \u0420\u0415\u0414\u041A\u041E\u0421\u0422\u0418 (Option B)
     ========================================================== */
  function spawnHatchParticles(count, palette, intensity, rarityClass) {
    if (!refs.hatchParticles) return;
    const colors = Array.isArray(palette) && palette.length ? palette : ["#ffffff", "#c084fc", "#ffd700"];
    const boost = intensity || 1;

    let burstClass = "burst-common";
    let sizeMin = 6, sizeMax = 10;
    if (rarityClass === "rare") { burstClass = "burst-rare"; sizeMin = 7; sizeMax = 12; }
    else if (rarityClass === "epic") { burstClass = "burst-epic"; sizeMin = 8; sizeMax = 14; }
    else if (rarityClass === "legendary") { burstClass = "burst-legendary"; sizeMin = 10; sizeMax = 18; }

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("span");
      particle.className = `pet-hatch-particle ${burstClass}`;
      const angle = Math.random() * Math.PI * 2;
      const distance = (70 + Math.random() * 140) * boost;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const size = sizeMin + Math.random() * (sizeMax - sizeMin);
      particle.style.setProperty("--dx", `${dx}px`);
      particle.style.setProperty("--dy", `${dy}px`);
      particle.style.setProperty("--rot", `${Math.random() * 540 - 270}deg`);
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.color = particle.style.background;
      particle.style.borderRadius = rarityClass === "legendary" && Math.random() > 0.3
        ? "0"  // \u0437\u0432\u0451\u0437\u0434\u043E\u0447\u043A\u0438 \u0434\u043B\u044F \u043B\u0435\u0433\u0435\u043D\u0434\u0430\u0440\u043E\u043A
        : (Math.random() > 0.35 ? "50%" : "2px");
      refs.hatchParticles.appendChild(particle);
      particle.addEventListener("animationend", () => particle.remove(), { once: true });
    }

    // \u0414\u043B\u044F \u043B\u0435\u0433\u0435\u043D\u0434\u0430\u0440\u043E\u043A — \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u043C \u0437\u0432\u0435\u0437\u0434\u044B
    if (rarityClass === "legendary") {
      for (let i = 0; i < 6; i++) {
        const star = document.createElement("span");
        star.className = "pet-hatch-particle burst-legendary";
        const angle2 = Math.random() * Math.PI * 2;
        const dist2 = (50 + Math.random() * 80) * boost;
        star.style.setProperty("--dx", `${Math.cos(angle2) * dist2}px`);
        star.style.setProperty("--dy", `${Math.sin(angle2) * dist2}px`);
        star.style.setProperty("--rot", `${Math.random() * 720}deg`);
        star.style.width = "14px";
        star.style.height = "14px";
        star.style.background = "transparent";
        star.style.border = "none";
        star.style.boxShadow = "none";
        star.textContent = "✦";
        star.style.color = "#ffd700";
        star.style.fontSize = "14px";
        star.style.display = "flex";
        star.style.alignItems = "center";
        star.style.justifyContent = "center";
        refs.hatchParticles.appendChild(star);
        star.addEventListener("animationend", () => star.remove(), { once: true });
      }
    }
  }

  function clearHatchParticles() {
    if (refs.hatchParticles) refs.hatchParticles.innerHTML = "";
  }

  function revealHatchedPet(pet) {
    if (!state.hatch) return;
    // \u0415\u0441\u043B\u0438 pet \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u043D — \u0441\u043E\u0437\u0434\u0430\u0451\u043C \u043D\u043E\u0432\u044B\u0439 (\u043D\u043E \u043C\u044B \u043F\u0435\u0440\u0435\u0434\u0430\u0451\u043C \u0438\u0437 onHatchTap)
    const finalPet = pet || state.hatch._upcomingPet || createRolledPet();
    state.inventory.push(finalPet);
    state.selectedPetId = finalPet.id;
    state.hatch.currentPet = finalPet;
    state.hatch.revealing = false;
    state.eggsOpenedTotal = (state.eggsOpenedTotal || 0) + 1;

    const rarityMeta = RARITY_META[finalPet.rarity] || RARITY_META.Common;
    const isLegendary = finalPet.rarity === "Legendary";

    // \u041C\u0435\u043D\u044F\u0435\u043C \u0430\u0443\u0440\u0443 \u043F\u043E\u0434 \u0440\u0435\u0434\u043A\u043E\u0441\u0442\u044C
    refs.hatchAura.className = `pet-hatch-aura rarity-${finalPet.rarity.toLowerCase()}`;

    refs.hatchImage.src = finalPet.icon;
    refs.hatchImage.className = isLegendary
      ? "pet-hatch-image pet reveal-legendary"
      : "pet-hatch-image pet reveal-pop";
    refs.hatchStage.textContent = "YOU HATCHED";
    refs.hatchTap.textContent = "";
    refs.hatchName.textContent = finalPet.name;
    refs.hatchRarity.textContent = rarityMeta.badge;
    refs.hatchRarity.style.color = rarityMeta.color;
    refs.hatchResult.classList.add("active");
    refs.hatchEquipBtn.textContent = state.hatch.index < state.hatch.total ? "EQUIP & NEXT" : "EQUIP";
    refs.hatchSellBtn.textContent = state.hatch.index < state.hatch.total ? "SELL & NEXT" : "SELL";
    refs.hatchKeepBtn.textContent = state.hatch.index < state.hatch.total ? "KEEP & NEXT" : "KEEP";

    // \u0424\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0447\u0430\u0441\u0442\u0438\u0446\u044B \u043F\u043E \u0440\u0435\u0434\u043A\u043E\u0441\u0442\u0438
    const rarityClass = finalPet.rarity.toLowerCase();
    spawnHatchParticles(
      isLegendary ? 40 : (finalPet.rarity === "Epic" ? 32 : (finalPet.rarity === "Rare" ? 28 : 20)),
      [rarityMeta.color, "#ffffff", "#ffd700"],
      1.2,
      rarityClass
    );

    saveAll();
    renderInventory();
    updateEquippedBar();

    // BUY 10: \u0438\u0433\u0440\u043E\u043A \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u0435\u0440\u0432\u043E\u0435 \u044F\u0439\u0446\u043E, \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u0432\u044B\u043F\u0430\u0434\u0430\u044E\u0442 \u0441\u0440\u0430\u0437\u0443 \u0441\u043F\u0438\u0441\u043A\u043E\u043C.
    if (state.hatch && state.hatch.total > 1 && state.hatch.index < state.hatch.total) {
      setTimeout(() => {
        if (!state.hatch || state.hatch.index >= state.hatch.total) return;
        const firstStillExists = state.inventory.some((p) => p.id === finalPet.id);
        revealRemainingHatchesInstantly(firstStillExists ? [finalPet] : []);
      }, 900);
    }
  }

  function onHatchEquip() {
    const pet = state.hatch && state.hatch.currentPet;
    if (!pet) return;
    const success = setPetEquipped(pet.id, true);
    if (!success) return;
    saveAll();
    renderInventory();
    updateEquippedBar();
    advanceHatchSequence();
  }

  function onHatchSell() {
    const pet = state.hatch && state.hatch.currentPet;
    if (!pet) return;
    sellPetById(pet.id, { silent: true });
    advanceHatchSequence();
  }

  function advanceHatchSequence() {
    if (!state.hatch) return;
    if (state.hatch.index < state.hatch.total) {
      revealRemainingHatchesInstantly();
      return;
    }
    closeHatchOverlay();
    renderInventory();
    renderEggShop();
    updateEquippedBar();
  }

  function revealInstantHatches(count) {
    if (!state.hatch) return;
    const pets = [];
    const amount = Math.min(count, getFreeSlots());
    for (let i = 0; i < amount; i++) {
      const pet = createRolledPet();
      state.inventory.push(pet);
      pets.push(pet);
    }
    if (pets.length) state.selectedPetId = pets[pets.length - 1].id;
    state.eggsOpenedTotal = (state.eggsOpenedTotal || 0) + pets.length;
    state.hatch.index = state.hatch.total;
    state.hatch.bulkPets = pets;
    saveAll();
    renderInventory();
    updateEquippedBar();
    showBulkHatchResults(pets, `PETS HATCHED (${pets.length})`);
  }

  function revealRemainingHatchesInstantly(extraPets = []) {
    if (!state.hatch) return;
    const remaining = Math.max(0, state.hatch.total - state.hatch.index);
    if (remaining <= 0) {
      closeHatchOverlay();
      renderInventory();
      renderEggShop();
      updateEquippedBar();
      return;
    }

    const pets = [];
    const amount = Math.min(remaining, getFreeSlots());
    for (let i = 0; i < amount; i++) {
      const pet = createRolledPet();
      state.inventory.push(pet);
      pets.push(pet);
    }
    if (pets.length) state.selectedPetId = pets[pets.length - 1].id;
    state.eggsOpenedTotal = (state.eggsOpenedTotal || 0) + pets.length;
    const shownPets = [...(Array.isArray(extraPets) ? extraPets : []), ...pets];
    state.hatch.index = state.hatch.total;
    state.hatch.bulkPets = shownPets;
    saveAll();
    renderInventory();
    updateEquippedBar();
    showBulkHatchResults(shownPets, `PETS HATCHED (${shownPets.length})`);
  }

  function showBulkHatchResults(pets, title) {
    if (!refs.bulkResult || !refs.bulkGrid) return;
    clearHatchParticles();
    refs.hatchCounter.textContent = title || `PETS HATCHED (${pets.length})`;
    refs.hatchStage.textContent = "RESULTS";
    refs.hatchTap.textContent = "";
    refs.hatchImageWrap.style.display = "none";
    refs.hatchResult.classList.remove("active");
    refs.bulkTitle.textContent = title || `PETS HATCHED (${pets.length})`;
    refs.bulkGrid.innerHTML = pets.map((pet) => {
      const rarity = RARITY_META[pet.rarity] || RARITY_META.Common;
      return `
        <div class="pet-bulk-card" style="border-color:${rarity.color};box-shadow:0 0 12px ${rarity.color}33;">
          <img src="${pet.icon}" alt="${pet.name}" />
          <div class="pet-bulk-name">${escapeHtml(pet.name)}</div>
          <div class="pet-bulk-rarity" style="color:${rarity.color};">${rarity.badge}</div>
        </div>
      `;
    }).join("");
    refs.bulkResult.classList.add("active");
    refs.hatchOverlay.classList.add("active");
    renderEggShop();
  }

  function equipBestBulkPets() {
    const pets = state.hatch && Array.isArray(state.hatch.bulkPets) ? state.hatch.bulkPets : [];
    if (!pets.length) return;
    const rarityPower = { Common: 1, Rare: 2, Epic: 3, Legendary: 4 };
    const sorted = [...pets].sort((a, b) => (rarityPower[b.rarity] || 0) - (rarityPower[a.rarity] || 0));
    let equipped = 0;
    for (const pet of sorted) {
      if (getEquippedCount() >= MAX_EQUIPPED) break;
      if (setPetEquipped(pet.id, true)) equipped++;
    }
    saveAll();
    renderInventory();
    updateEquippedBar();
    notify(equipped > 0 ? `Equipped ${equipped} best pet(s)!` : `No free equip slots!`, equipped > 0 ? "#4ade80" : "#ff6666");
  }

  function animateOnce(el, className) {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
    const cleanup = () => el.classList.remove(className);
    el.addEventListener("animationend", cleanup, { once: true });
  }

  function createRolledPet() {
    return createPetFromDefinition(rollPetDefinition());
  }

  function createPetFromDefinition(definition) {
    return {
      id: makePetId(),
      key: definition.key,
      name: definition.name,
      rarity: definition.rarity,
      icon: definition.icon,
      sellPrice: definition.sellPrice,
      equipped: false,
      locked: !!definition.locked,
      unsellable: !!definition.unsellable,
      vipOnly: !!definition.vipOnly,
      createdAt: Date.now()
    };
  }

  function getPetDefinitionByKey(petKey) {
    return [...PET_POOL, ...SPECIAL_PETS].find((pet) => pet.key === petKey) || null;
  }

  function rollPetDefinition() {
    const luck = Math.max(1, getCurrentLuckMultiplier());
    const weightedPool = PET_POOL.map((pet) => ({
      pet,
      weight: pet.rarity === "Common" ? pet.weight : pet.weight * luck
    }));
    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const item of weightedPool) {
      roll -= item.weight;
      if (roll <= 0) return item.pet;
    }
    return PET_POOL[PET_POOL.length - 1];
  }

  function grantVipPet() {
    const existing = state.inventory.find((pet) => pet.key === "goldpegasus");
    if (existing) {
      existing.locked = true;
      existing.unsellable = true;
      existing.vipOnly = true;
      saveAll();
      renderAll();
      return { added: false, pet: existing };
    }
    const definition = getPetDefinitionByKey("goldpegasus");
    if (!definition) return { added: false, pet: null };
    const pet = createPetFromDefinition(definition);
    state.inventory.push(pet);
    state.selectedPetId = pet.id;
    saveAll();
    renderAll();
    return { added: true, pet };
  }

  function adminAddPets(petKey = "random", count = 1, options = {}) {
    const amount = Math.max(1, Math.min(MAX_PETS, parseInt(count, 10) || 1));
    const pets = [];
    for (let i = 0; i < amount && getFreeSlots() > 0; i++) {
      const definition = petKey === "random"
        ? rollPetDefinition()
        : getPetDefinitionByKey(petKey);
      if (!definition) break;
      if (definition.vipOnly && state.inventory.some(p => p.key === definition.key)) continue;
      const pet = createPetFromDefinition(definition);
      state.inventory.push(pet);
      pets.push(pet);
    }
    if (pets.length) {
      state.selectedPetId = pets[pets.length - 1].id;
      saveAll();
      renderAll();
      if (!options.silent) notify(`Admin gave you ${pets.length} pet(s)!`, "#c084fc");
    } else {
      if (!options.silent) notify("No free pet slots or invalid pet!", "#ff6666");
    }
    return { added: pets.length, pets: pets.map(p => ({ name: p.name, rarity: p.rarity, key: p.key })) };
  }

  function startAdminLuckEvent(durationMs = 10 * 60 * 1000, options = {}) {
    const duration = Math.max(1000, Number(durationMs) || (10 * 60 * 1000));
    state.adminLuckUntil = Math.max(state.adminLuckUntil || 0, Date.now() + duration);
    saveAll();
    renderEggShop();
    if (!options.silent) notify(`ADMIN LUCK EVENT!\nx10 luck for ${formatDurationShort(duration)}`, "#ffd700");
    return { activeUntil: state.adminLuckUntil, multiplier: getAdminLuckMultiplier() };
  }

  function getAdminLuckMultiplier() {
    return Date.now() < (state.adminLuckUntil || 0) ? 10 : 1;
  }

  function getCurrentLuckMultiplier() {
    let luck = 1;
    try {
      if (window.gameFns && typeof window.gameFns.getPetLuckMult === "function") {
        luck *= window.gameFns.getPetLuckMult() || 1;
      }
    } catch (e) {}
    luck *= getAdminLuckMultiplier();
    return Math.max(1, luck || 1);
  }

  function toggleSkipHatchAnimation() {
    state.skipHatchAnimation = !state.skipHatchAnimation;
    saveAll();
    renderEggShop();
    notify(`Pet hatch animation skip: ${state.skipHatchAnimation ? "ON" : "OFF"}`, state.skipHatchAnimation ? "#4ade80" : "#c084fc");
  }

  function getSelectedPet() {
    return state.inventory.find((pet) => pet.id === state.selectedPetId) || null;
  }

  function getFreeSlots() {
    return MAX_PETS - state.inventory.length;
  }

  function getEquippedCount() {
    return state.inventory.filter((pet) => pet.equipped).length;
  }

  function setPetEquipped(id, shouldEquip) {
    const pet = state.inventory.find((item) => item.id === id);
    if (!pet) return false;
    if (!shouldEquip) {
      pet.equipped = false;
      return true;
    }
    if (pet.equipped) return true;
    if (getEquippedCount() >= MAX_EQUIPPED) {
      notify(`You can equip only ${MAX_EQUIPPED} pets!`, "#ff6666");
      return false;
    }
    pet.equipped = true;
    return true;
  }

  function toggleEquipSelectedPet() {
    const pet = getSelectedPet();
    if (!pet) return;
    const next = !pet.equipped;
    const success = setPetEquipped(pet.id, next);
    if (!success) return;
    if (!next) pet.equipped = false;
    saveAll();
    renderInventory();
    updateEquippedBar();
  }

  function toggleLockSelectedPet() {
    const pet = getSelectedPet();
    if (!pet) return;
    if (pet.unsellable) { notify("This unique pet cannot be unlocked or sold!", "#ffd700"); return; }
    pet.locked = !pet.locked;
    saveAll();
    renderInventory();
  }

  function sellSelectedPet() {
    const pet = getSelectedPet();
    if (!pet) return;
    sellPetById(pet.id);
  }

  function sellPetById(id, options = {}) {
    const index = state.inventory.findIndex((pet) => pet.id === id);
    if (index === -1) return false;
    const pet = state.inventory[index];
    if (pet.unsellable) {
      notify("This unique pet cannot be sold!", "#ffd700");
      return false;
    }
    if (pet.locked) {
      notify("Unlock the pet before selling!", "#ff6666");
      return false;
    }
    if (pet.equipped) pet.equipped = false;
    state.inventory.splice(index, 1);
    window.gameState.crystals += pet.sellPrice;
    if (state.selectedPetId === id) {
      state.selectedPetId = state.inventory[index]
        ? state.inventory[index].id
        : (state.inventory[index - 1] ? state.inventory[index - 1].id : (state.inventory[0] ? state.inventory[0].id : null));
    }
    saveAll();
    renderInventory();
    renderEggShop();
    updateEquippedBar();
    if (!options.silent) notify(`Sold ${pet.name} for +${formatNum(pet.sellPrice)} amethysts!`, "#c084fc");
    return true;
  }

  function saveAll() {
    if (window.gameFns && typeof window.gameFns.saveGame === "function") {
      window.gameFns.saveGame();
    }
  }

  function notify(text, color) {
    if (window.gameFns && typeof window.gameFns.showNotification === "function") {
      window.gameFns.showNotification(text, color || "#c084fc", 2600);
    }
  }

  function formatNum(n) {
    return window.gameFns && window.gameFns.formatNum ? window.gameFns.formatNum(n) : String(n);
  }

  function formatLuck(n) {
    return Number(n).toFixed(2).replace(/\.?0+$/, "");
  }

  function formatDurationShort(ms) {
    if (window.gameFns && window.gameFns.formatDuration) return window.gameFns.formatDuration(ms);
    const sec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function makePetId() {
    return `pet_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function escapeHtml(text) {
    return window.gameFns && window.gameFns.escapeHtml ? window.gameFns.escapeHtml(text) : String(text);
  }

  function whenReady() {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initPetSystem, { once: true });
    else initPetSystem();
  }

  whenReady();
  window.addEventListener("firebase-ready", initPetSystem);
  window.addEventListener("auth-ready", initPetSystem);
})();