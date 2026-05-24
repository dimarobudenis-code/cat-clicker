/* ==========================================================
   CAT CLICKER — Upgrades module
   All click and auto upgrades are stored here.
   Fields:
   - category: "click" or "auto"
   - power: how much this upgrade adds to clickPower / autoClicker
   - basePrice: first purchase price
   ========================================================== */
(function () {
  const upgrades = [
    // Original click upgrades
    { name: "Double Fish", desc: "+1 fish per click", basePrice: 10, owned: 0, category: "click", power: 1 },
    { name: "Lucky Paw", desc: "+5 fish per click", basePrice: 200, owned: 0, category: "click", power: 5 },
    { name: "Golden Cat", desc: "+25 fish per click", basePrice: 1000, owned: 0, category: "click", power: 25 },
    { name: "Diamond Paw", desc: "+100 fish per click", basePrice: 10000, owned: 0, category: "click", power: 100 },
    { name: "Emerald Claw", desc: "+500 fish per click", basePrice: 100000, owned: 0, category: "click", power: 500 },
    { name: "Cosmic Touch", desc: "+2K fish per click", basePrice: 1000000, owned: 0, category: "click", power: 2000 },
    { name: "Godlike Tap", desc: "+10K fish per click", basePrice: 50000000, owned: 0, category: "click", power: 10000 },
    { name: "Infinity Finger", desc: "+50K fish per click", basePrice: 500000000, owned: 0, category: "click", power: 50000 },
    { name: "Universe Splitter", desc: "+200K fish per click", basePrice: 5000000000, owned: 0, category: "click", power: 200000 },
    { name: "Multiverse Cat", desc: "+1M fish per click", basePrice: 50000000000, owned: 0, category: "click", power: 1000000 },

    // Original auto upgrades
    { name: "Auto Fisher", desc: "+1 fish/sec", basePrice: 50, owned: 0, category: "auto", power: 1 },
    { name: "Fish Farm", desc: "+10 fish/sec", basePrice: 5000, owned: 0, category: "auto", power: 10 },
    { name: "Fish Factory", desc: "+50 fish/sec", basePrice: 50000, owned: 0, category: "auto", power: 50 },
    { name: "Fish Mine", desc: "+200 fish/sec", basePrice: 500000, owned: 0, category: "auto", power: 200 },
    { name: "Fish Dimension", desc: "+1K fish/sec", basePrice: 5000000, owned: 0, category: "auto", power: 1000 },
    { name: "Time Warp", desc: "+5K fish/sec", basePrice: 50000000, owned: 0, category: "auto", power: 5000 },
    { name: "Galaxy Net", desc: "+25K fish/sec", basePrice: 500000000, owned: 0, category: "auto", power: 25000 },
    { name: "Universe Harvester", desc: "+100K fish/sec", basePrice: 5000000000, owned: 0, category: "auto", power: 100000 },
    { name: "Void Collector", desc: "+500K fish/sec", basePrice: 50000000000, owned: 0, category: "auto", power: 500000 },
    { name: "Infinity Stream", desc: "+2M fish/sec", basePrice: 500000000000, owned: 0, category: "auto", power: 2000000 }
  ];

  const clickNames = [
    "Nebula Paw", "Solar Scratch", "Lunar Tap", "Meteor Claw", "Star Whisker",
    "Plasma Toe", "Quantum Paw", "Hyper Click", "Nova Strike", "Comet Swipe",
    "Astro Fang", "Void Tap", "Photon Claw", "Gravity Paw", "Stellar Bite",
    "Galaxy Paw", "Wormhole Tap", "Cosmic Fang", "Supernova Hit", "Time Claw",
    "Reality Scratch", "Dimension Paw", "Dark Matter Tap", "Light Speed Claw", "Omega Swipe",
    "Alpha Paw", "Celestial Tap", "Eclipse Claw", "Orbit Scratch", "Singularity Paw",
    "Mythic Tap", "Arcane Claw", "Crystal Paw", "Dragon Scratch", "Phoenix Tap",
    "Royal Claw", "King Paw", "Emperor Tap", "Ancient Scratch", "Prismatic Claw",
    "Astral Paw", "Eternal Tap", "Divine Scratch", "Heavenly Claw", "God Paw",
    "Infinity Tap II", "Universe Claw II", "Multiverse Paw II", "Omni Tap", "Final Claw"
  ];

  const autoNames = [
    "Tiny Net", "Better Net", "Golden Net", "Crystal Net", "Nebula Net",
    "Solar Boat", "Lunar Boat", "Meteor Boat", "Star Boat", "Plasma Boat",
    "Quantum Fisher", "Hyper Fisher", "Nova Fisher", "Comet Fisher", "Astro Fisher",
    "Void Farm", "Photon Farm", "Gravity Farm", "Stellar Farm", "Galaxy Farm",
    "Wormhole Factory", "Cosmic Factory", "Supernova Factory", "Time Factory", "Reality Factory",
    "Dimension Mine", "Dark Matter Mine", "Light Speed Mine", "Omega Mine", "Alpha Mine",
    "Celestial Drill", "Eclipse Drill", "Orbit Drill", "Singularity Drill", "Mythic Drill",
    "Arcane Fleet", "Crystal Fleet", "Dragon Fleet", "Phoenix Fleet", "Royal Fleet",
    "King Harbor", "Emperor Harbor", "Ancient Harbor", "Prismatic Harbor", "Astral Harbor",
    "Eternal Stream", "Divine Stream", "Heavenly Stream", "Omni Stream", "Final Stream"
  ];

  const FORMAT_SUFFIXES = [
    { v: 1e150, s: "Nqg" }, { v: 1e147, s: "Oqg" }, { v: 1e144, s: "Spqg" }, { v: 1e141, s: "Sxqg" }, { v: 1e138, s: "Qiqg" },
  { v: 1e135, s: "Qaqg" }, { v: 1e132, s: "Tqg" }, { v: 1e129, s: "Dqg" }, { v: 1e126, s: "Uqg" }, { v: 1e123, s: "Qg" },
  { v: 1e120, s: "Ntg" }, { v: 1e117, s: "Otg" }, { v: 1e114, s: "Sptg" }, { v: 1e111, s: "Sxtg" }, { v: 1e108, s: "Qitg" },
  { v: 1e105, s: "Qatg" }, { v: 1e102, s: "Ttg" }, { v: 1e99, s: "Dtg" }, { v: 1e96, s: "Utg" }, { v: 1e93, s: "Tg" },
  { v: 1e90, s: "Nv" }, { v: 1e87, s: "Ov" }, { v: 1e84, s: "Spv" }, { v: 1e81, s: "Sxv" }, { v: 1e78, s: "Qiv" },
    { v: 1e75, s: "Qav" }, { v: 1e72, s: "Tv" }, { v: 1e69, s: "Dv" }, { v: 1e66, s: "Uv" }, { v: 1e63, s: "Vg" },
    { v: 1e60, s: "Nod" }, { v: 1e57, s: "Ocd" }, { v: 1e54, s: "Spd" }, { v: 1e51, s: "Sxd" }, { v: 1e48, s: "Qid" },
    { v: 1e45, s: "Qad" }, { v: 1e42, s: "Td" }, { v: 1e39, s: "Dd" }, { v: 1e36, s: "Ud" }, { v: 1e33, s: "Dc" },
    { v: 1e30, s: "No" }, { v: 1e27, s: "Oc" }, { v: 1e24, s: "Sp" }, { v: 1e21, s: "Sx" }, { v: 1e18, s: "Qi" },
    { v: 1e15, s: "Qa" }, { v: 1e12, s: "T" }, { v: 1e9, s: "B" }, { v: 1e6, s: "M" }, { v: 1e3, s: "K" }
  ];

  function fmt(n) {
    n = Number(n) || 0;
    if (n < 0) return "-" + fmt(-n);
    for (const item of FORMAT_SUFFIXES) {
      if (n >= item.v) return (n / item.v).toFixed(1).replace(/\.0$/, "") + item.s;
    }
    return String(Math.floor(n));
  }

  for (let i = 0; i < 50; i++) {
    const power = Math.floor(2500000 * Math.pow(1.42, i));
    const basePrice = Math.floor(150000000000 * Math.pow(1.62, i));
    upgrades.push({
      name: clickNames[i],
      desc: `+${fmt(power)} fish per click`,
      basePrice,
      owned: 0,
      category: "click",
      power
    });
  }

  for (let i = 0; i < 50; i++) {
    const power = Math.floor(5000000 * Math.pow(1.40, i));
    const basePrice = Math.floor(300000000000 * Math.pow(1.60, i));
    upgrades.push({
      name: autoNames[i],
      desc: `+${fmt(power)} fish/sec`,
      basePrice,
      owned: 0,
      category: "auto",
      power
    });
  }


  // Extra expansion: 100 new late-game upgrades (50 click + 50 auto)
  const extraClickPrefixes = ["Abyssal", "Radiant", "Chrono", "Paradox", "Eldritch", "Nebular", "Celestial", "Quantum", "Omega", "Eternal"];
  const extraClickCores = ["Paw", "Claw", "Tap", "Scratch", "Fang"];
  const extraAutoPrefixes = ["Abyss", "Radiant", "Chrono", "Paradox", "Eldritch", "Nebula", "Celestial", "Quantum", "Omega", "Eternal"];
  const extraAutoCores = ["Fleet", "Harvester", "Engine", "Portal", "Reactor"];

  for (let i = 0; i < 50; i++) {
    const tier = 50 + i;
    const name = `${extraClickPrefixes[Math.floor(i / extraClickCores.length)]} ${extraClickCores[i % extraClickCores.length]} ${tier + 1}`;
    const power = Math.floor(2500000 * Math.pow(1.42, tier));
    const basePrice = Math.floor(150000000000 * Math.pow(1.62, tier));
    upgrades.push({
      name,
      desc: `+${fmt(power)} fish per click`,
      basePrice,
      owned: 0,
      category: "click",
      power
    });
  }

  for (let i = 0; i < 50; i++) {
    const tier = 50 + i;
    const name = `${extraAutoPrefixes[Math.floor(i / extraAutoCores.length)]} ${extraAutoCores[i % extraAutoCores.length]} ${tier + 1}`;
    const power = Math.floor(5000000 * Math.pow(1.40, tier));
    const basePrice = Math.floor(300000000000 * Math.pow(1.60, tier));
    upgrades.push({
      name,
      desc: `+${fmt(power)} fish/sec`,
      basePrice,
      owned: 0,
      category: "auto",
      power
    });
  }


  // Mega expansion: 500 new endgame upgrades (250 click + 250 auto)
  const megaClickPrefixes = [
    "Voidborn", "Starforged", "Reality", "Infinity", "Omniversal", "Transcendent", "Primordial", "Astral", "Hypernova", "Singularity",
    "Cataclysm", "Aether", "Runic", "Spectral", "Titan", "Leviathan", "Seraphic", "Infernal", "Galactic", "Nebular",
    "Quantum", "Chrono", "Parallax", "Celestial", "Absolute"
  ];
  const megaClickCores = ["Paw", "Claw", "Tap", "Scratch", "Fang", "Swipe", "Pulse", "Strike", "Bite", "Nova"];
  const megaAutoPrefixes = [
    "Void", "Starforge", "Reality", "Infinity", "Omni", "Transcendent", "Primordial", "Astral", "Hypernova", "Singularity",
    "Cataclysm", "Aether", "Runic", "Spectral", "Titan", "Leviathan", "Seraph", "Inferno", "Galaxy", "Nebula",
    "Quantum", "Chrono", "Parallax", "Celestial", "Absolute"
  ];
  const megaAutoCores = ["Fleet", "Harvester", "Engine", "Portal", "Reactor", "Factory", "Drill", "Stream", "Collector", "Generator"];

  for (let i = 0; i < 250; i++) {
    const tier = 100 + i;
    const name = `${megaClickPrefixes[Math.floor(i / megaClickCores.length)]} ${megaClickCores[i % megaClickCores.length]} ${tier + 1}`;
    const power = Math.floor(2500000 * Math.pow(1.42, tier));
    const basePrice = Math.floor(150000000000 * Math.pow(1.62, tier));
    upgrades.push({
      name,
      desc: `+${fmt(power)} fish per click`,
      basePrice,
      owned: 0,
      category: "click",
      power
    });
  }

  for (let i = 0; i < 250; i++) {
    const tier = 100 + i;
    const name = `${megaAutoPrefixes[Math.floor(i / megaAutoCores.length)]} ${megaAutoCores[i % megaAutoCores.length]} ${tier + 1}`;
    const power = Math.floor(5000000 * Math.pow(1.40, tier));
    const basePrice = Math.floor(300000000000 * Math.pow(1.60, tier));
    upgrades.push({
      name,
      desc: `+${fmt(power)} fish/sec`,
      basePrice,
      owned: 0,
      category: "auto",
      power
    });
  }


  // Ultra expansion: 500 more upgrades for super-late game (250 click + 250 auto)
  const ultraClickPrefixes = [
    "Robo", "Cyber", "Neon", "Plasma", "Nano", "Mecha", "Digital", "Hologram", "Ion", "Laser",
    "Cosmo", "Stellar", "Lunar", "Solar", "Nova", "Quasar", "Pulsar", "Nebula", "Orbit", "Comet",
    "Eclipse", "Zenith", "Apex", "Mythos", "Overdrive"
  ];
  const ultraClickCores = ["Paw", "Claw", "Tap", "Scratch", "Fang", "Swipe", "Pulse", "Strike", "Bite", "Circuit"];
  const ultraAutoPrefixes = [
    "Robo", "Cyber", "Neon", "Plasma", "Nano", "Mecha", "Digital", "Holo", "Ion", "Laser",
    "Cosmo", "Stellar", "Lunar", "Solar", "Nova", "Quasar", "Pulsar", "Nebula", "Orbit", "Comet",
    "Eclipse", "Zenith", "Apex", "Mythos", "Overdrive"
  ];
  const ultraAutoCores = ["Fleet", "Harvester", "Engine", "Portal", "Reactor", "Factory", "Drill", "Stream", "Collector", "Server"];

  for (let i = 0; i < 250; i++) {
    const tier = 350 + i;
    const name = `${ultraClickPrefixes[Math.floor(i / ultraClickCores.length)]} ${ultraClickCores[i % ultraClickCores.length]} ${tier + 1}`;
    const power = Math.floor(2500000 * Math.pow(1.42, tier));
    const basePrice = Math.floor(150000000000 * Math.pow(1.62, tier));
    upgrades.push({
      name,
      desc: `+${fmt(power)} fish per click`,
      basePrice,
      owned: 0,
      category: "click",
      power
    });
  }

  for (let i = 0; i < 250; i++) {
    const tier = 350 + i;
    const name = `${ultraAutoPrefixes[Math.floor(i / ultraAutoCores.length)]} ${ultraAutoCores[i % ultraAutoCores.length]} ${tier + 1}`;
    const power = Math.floor(5000000 * Math.pow(1.40, tier));
    const basePrice = Math.floor(300000000000 * Math.pow(1.60, tier));
    upgrades.push({
      name,
      desc: `+${fmt(power)} fish/sec`,
      basePrice,
      owned: 0,
      category: "auto",
      power
    });
  }

  window.CAT_CLICKER_UPGRADES = upgrades;
})();
