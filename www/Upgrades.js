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

  function fmt(n) {
    if (n >= 1e15) return (n / 1e15).toFixed(1).replace(/\.0$/, "") + "Qa";
    if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
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

  window.CAT_CLICKER_UPGRADES = upgrades;
})();
