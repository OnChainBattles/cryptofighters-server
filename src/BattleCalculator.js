// ============================================
// SERVER-SIDE BATTLE CALCULATOR
// Authoritative damage calculations - clients cannot cheat
// ============================================

// ============================================
// MOVE DATABASE - Server's authoritative move data
// Keys are crypto-themed to match display names shown in Cryptodex
// ============================================
const MOVE_DATA = {
  // Normal/HODLers moves
  'tackle': { name: 'Tackle', type: 'HODLers', power: 40, accuracy: 100, damageClass: 'physical' },
  'para-slam': { name: 'Para Slam', type: 'HODLers', power: 85, accuracy: 100, damageClass: 'physical' },
  'double-edge': { name: 'Double Edge', type: 'HODLers', power: 120, accuracy: 100, damageClass: 'physical' },
  'hyper-beam': { name: 'Hyper Beam', type: 'HODLers', power: 150, accuracy: 90, damageClass: 'special' },
  'hodl-slam': { name: 'HODL Slam', type: 'HODLers', power: 102, accuracy: 100, damageClass: 'physical' },
  'facade': { name: 'Facade', type: 'HODLers', power: 70, accuracy: 100, damageClass: 'physical' },
  'explosion': { name: 'Explosion', type: 'HODLers', power: 250, accuracy: 100, damageClass: 'physical' },
  'rapid-spin': { name: 'Rapid Spin', type: 'HODLers', power: 20, accuracy: 100, damageClass: 'physical' },
  'speed-moon': { name: 'Speed Moon', type: 'HODLers', power: 80, accuracy: 100, damageClass: 'physical', priority: 2 },
  'flinch-scam': { name: 'Flinch Scam', type: 'HODLers', power: 40, accuracy: 100, damageClass: 'physical', priority: 3 },
  'quick-moon': { name: 'Quick Moon', type: 'HODLers', power: 40, accuracy: 100, damageClass: 'physical', priority: 1 },
  'random-mint': { name: 'Random Mint', type: 'HODLers', power: 80, accuracy: 100, damageClass: 'special' },

  // Pump (Fire) moves
  'ember': { name: 'Ember', type: 'Pump', power: 40, accuracy: 100, damageClass: 'special' },
  'flamethrower': { name: 'Flamethrower', type: 'Pump', power: 95, accuracy: 100, damageClass: 'special' },
  'pump-blast': { name: 'Pump Blast', type: 'Pump', power: 120, accuracy: 85, damageClass: 'special' },
  'overheat': { name: 'Overheat', type: 'Pump', power: 140, accuracy: 90, damageClass: 'special' },
  'fire-punch': { name: 'Fire Punch', type: 'Pump', power: 75, accuracy: 100, damageClass: 'physical' },
  'pump-blitz': { name: 'Pump Blitz', type: 'Pump', power: 120, accuracy: 100, damageClass: 'physical' },
  'pump-wave': { name: 'Pump Wave', type: 'Pump', power: 100, accuracy: 90, damageClass: 'special' },
  'lava-plume': { name: 'Lava Plume', type: 'Pump', power: 80, accuracy: 100, damageClass: 'special' },

  // Liquid (Water) moves
  'water-gun': { name: 'Water Gun', type: 'Liquid', power: 40, accuracy: 100, damageClass: 'special' },
  'liquid-surf': { name: 'Liquid Surf', type: 'Liquid', power: 95, accuracy: 100, damageClass: 'special' },
  'liquid-surge': { name: 'Liquid Surge', type: 'Liquid', power: 120, accuracy: 80, damageClass: 'special' },
  'liquid-climb': { name: 'Liquid Climb', type: 'Liquid', power: 80, accuracy: 100, damageClass: 'physical' },
  'aqua-tail': { name: 'Aqua Tail', type: 'Liquid', power: 90, accuracy: 90, damageClass: 'physical' },
  'liquid-jet': { name: 'Liquid Jet', type: 'Liquid', power: 40, accuracy: 100, damageClass: 'physical', priority: 1 },
  'scald': { name: 'Scald', type: 'Liquid', power: 80, accuracy: 100, damageClass: 'special' },
  'liquid-pulse': { name: 'Liquid Pulse', type: 'Liquid', power: 60, accuracy: 100, damageClass: 'special' },

  // Electric moves
  'node-strike': { name: 'Node Strike', type: 'Electric', power: 95, accuracy: 100, damageClass: 'special' },
  'thunder': { name: 'Thunder', type: 'Electric', power: 120, accuracy: 70, damageClass: 'special' },
  'thunder-punch': { name: 'Thunder Punch', type: 'Electric', power: 75, accuracy: 100, damageClass: 'physical' },
  'volt-tackle': { name: 'Volt Tackle', type: 'Electric', power: 120, accuracy: 100, damageClass: 'physical' },
  'discharge': { name: 'Discharge', type: 'Electric', power: 80, accuracy: 100, damageClass: 'special' },
  'zap-lock': { name: 'Zap Lock', type: 'Electric', power: 0, accuracy: 100, damageClass: 'status' },

  // Grass moves
  'razor-leaf': { name: 'Razor Leaf', type: 'Grass', power: 55, accuracy: 95, damageClass: 'physical' },
  'solar-beam': { name: 'Solar Beam', type: 'Grass', power: 120, accuracy: 100, damageClass: 'special' },
  'yield-bomb': { name: 'Yield Bomb', type: 'Grass', power: 80, accuracy: 100, damageClass: 'physical' },
  'yield-storm': { name: 'Yield Storm', type: 'Grass', power: 140, accuracy: 90, damageClass: 'special' },
  'yield-ball': { name: 'Yield Ball', type: 'Grass', power: 80, accuracy: 100, damageClass: 'special' },
  'yield-knot': { name: 'Yield Knot', type: 'Grass', power: 80, accuracy: 100, damageClass: 'special' },
  'yield-hammer': { name: 'Yield Hammer', type: 'Grass', power: 120, accuracy: 100, damageClass: 'physical' },
  'power-whip': { name: 'Power Whip', type: 'Grass', power: 120, accuracy: 85, damageClass: 'physical' },
  'yield-blade': { name: 'Yield Blade', type: 'Grass', power: 90, accuracy: 100, damageClass: 'physical' },
  'giga-drain': { name: 'Giga Drain', type: 'Grass', power: 75, accuracy: 100, damageClass: 'special' },
  'sleep-scam': { name: 'Sleep Scam', type: 'Grass', power: 0, accuracy: 100, damageClass: 'status' },
  'sleep-scam-75': { name: 'Sleep Scam', type: 'Grass', power: 0, accuracy: 75, damageClass: 'status' },
  'leech-seed': { name: 'Leech Seed', type: 'Grass', power: 0, accuracy: 90, damageClass: 'status' },

  // Chill (Ice) moves
  'chill-ray': { name: 'Chill Ray', type: 'Chill', power: 95, accuracy: 100, damageClass: 'special' },
  'chill-storm': { name: 'Chill Storm', type: 'Chill', power: 120, accuracy: 70, damageClass: 'special' },
  'chill-punch': { name: 'Chill Punch', type: 'Chill', power: 75, accuracy: 100, damageClass: 'physical' },
  'chill-shard': { name: 'Chill Shard', type: 'Chill', power: 40, accuracy: 100, damageClass: 'physical', priority: 1 },
  'avalanche': { name: 'Avalanche', type: 'Chill', power: 60, accuracy: 100, damageClass: 'physical' },
  'chill-spear': { name: 'Chill Spear', type: 'Chill', power: 25, accuracy: 100, damageClass: 'physical' },
  'chill-bite': { name: 'Chill Bite', type: 'Chill', power: 65, accuracy: 95, damageClass: 'physical' },

  // Brawler (Fighting) moves
  'pri-brawl': { name: 'Pri Brawl', type: 'Brawler', power: 40, accuracy: 100, damageClass: 'physical', priority: 1 },
  'brawl-crash': { name: 'Brawl Crash', type: 'Brawler', power: 120, accuracy: 100, damageClass: 'physical' },
  'chop-brawl': { name: 'Chop Brawl', type: 'Brawler', power: 100, accuracy: 80, damageClass: 'physical' },
  'brick-break': { name: 'Brick Break', type: 'Brawler', power: 75, accuracy: 100, damageClass: 'physical' },
  'brawl-blast': { name: 'Brawl Blast', type: 'Brawler', power: 120, accuracy: 70, damageClass: 'special' },
  'power-brawl': { name: 'Power Brawl', type: 'Brawler', power: 120, accuracy: 100, damageClass: 'physical' },
  'hammer-arm': { name: 'Hammer Arm', type: 'Brawler', power: 100, accuracy: 90, damageClass: 'physical' },
  'drain-punch': { name: 'Drain Punch', type: 'Brawler', power: 60, accuracy: 100, damageClass: 'physical' },
  'vacuum-wave': { name: 'Vacuum Wave', type: 'Brawler', power: 40, accuracy: 100, damageClass: 'special', priority: 1 },
  'force-palm': { name: 'Force Palm', type: 'Brawler', power: 60, accuracy: 100, damageClass: 'physical' },
  'brawl-sphere': { name: 'Brawl Sphere', type: 'Brawler', power: 90, accuracy: 100, damageClass: 'special' },
  'sky-uppercut': { name: 'Sky Uppercut', type: 'Brawler', power: 85, accuracy: 90, damageClass: 'physical' },

  // Poison moves
  'toxic-blast': { name: 'Toxic Blast', type: 'Poison', power: 90, accuracy: 100, damageClass: 'special' },
  'toxic-jab': { name: 'Toxic Jab', type: 'Poison', power: 80, accuracy: 100, damageClass: 'physical' },
  'cross-poison': { name: 'Cross Poison', type: 'Poison', power: 70, accuracy: 100, damageClass: 'physical' },
  'gunk-shot': { name: 'Gunk Shot', type: 'Poison', power: 120, accuracy: 70, damageClass: 'physical' },
  'toxic-spikes': { name: 'Toxic Spikes', type: 'Poison', power: 0, accuracy: 100, damageClass: 'status' },
  'gas-fee': { name: 'Gas Fee', type: 'Poison', power: 0, accuracy: 90, damageClass: 'status' },

  // Based (Ground) moves
  'rug-pull': { name: 'Rug Pull', type: 'Based', power: 100, accuracy: 100, damageClass: 'physical' },
  'base-surge': { name: 'Base Surge', type: 'Based', power: 90, accuracy: 100, damageClass: 'special' },
  'dig': { name: 'Dig', type: 'Based', power: 80, accuracy: 100, damageClass: 'physical' },
  'mud-shot': { name: 'Mud Shot', type: 'Based', power: 55, accuracy: 95, damageClass: 'special' },
  'bone-rush': { name: 'Bone Rush', type: 'Based', power: 25, accuracy: 90, damageClass: 'physical' },
  'stealth-rock': { name: 'Stealth Rock', type: 'Rockstar', power: 0, accuracy: 100, damageClass: 'status' },

  // Airdrop (Flying) moves
  'aerial-ace': { name: 'Aerial Ace', type: 'Airdrop', power: 60, accuracy: 100, damageClass: 'physical' },
  'airdrop-slash': { name: 'Airdrop Slash', type: 'Airdrop', power: 75, accuracy: 95, damageClass: 'special' },
  'crash-down': { name: 'Crash Down', type: 'Airdrop', power: 120, accuracy: 100, damageClass: 'physical' },
  'drill-peck': { name: 'Drill Peck', type: 'Airdrop', power: 80, accuracy: 100, damageClass: 'physical' },
  'fly': { name: 'Fly', type: 'Airdrop', power: 90, accuracy: 95, damageClass: 'physical' },
  'pivot-flip': { name: 'Pivot Flip', type: 'Bug', power: 70, accuracy: 100, damageClass: 'physical' },
  'chill-perch': { name: 'Chill Perch', type: 'Airdrop', power: 0, accuracy: 100, damageClass: 'status' },

  // Oracle (Psychic) moves
  'oracle-blast': { name: 'Oracle Blast', type: 'Oracle', power: 90, accuracy: 100, damageClass: 'special' },
  'psyshock': { name: 'Psyshock', type: 'Oracle', power: 80, accuracy: 100, damageClass: 'special' },
  'oracle-head': { name: 'Oracle Head', type: 'Oracle', power: 80, accuracy: 90, damageClass: 'physical' },
  'psycho-cut': { name: 'Psycho Cut', type: 'Oracle', power: 70, accuracy: 100, damageClass: 'physical' },
  'extrasensory': { name: 'Extrasensory', type: 'Oracle', power: 80, accuracy: 100, damageClass: 'special' },
  'trick': { name: 'Trick', type: 'Oracle', power: 0, accuracy: 100, damageClass: 'status' },
  'oracle-boost': { name: 'Oracle Boost', type: 'Oracle', power: 0, accuracy: 100, damageClass: 'status' },
  'reflect': { name: 'Reflect', type: 'Oracle', power: 0, accuracy: 100, damageClass: 'status' },
  'light-screen': { name: 'Light Screen', type: 'Oracle', power: 0, accuracy: 100, damageClass: 'status' },
  'deep-chill': { name: 'Deep Chill', type: 'Oracle', power: 0, accuracy: 100, damageClass: 'status' },

  // Bug moves
  'bug-scissor': { name: 'Bug Scissor', type: 'Bug', power: 80, accuracy: 100, damageClass: 'physical' },
  'exploit-buzz': { name: 'Exploit Buzz', type: 'Bug', power: 90, accuracy: 100, damageClass: 'special' },
  'bug-horn': { name: 'Bug Horn', type: 'Bug', power: 120, accuracy: 85, damageClass: 'physical' },
  'signal-beam': { name: 'Signal Beam', type: 'Bug', power: 75, accuracy: 100, damageClass: 'special' },
  'solid-punch': { name: 'Solid Punch', type: 'Solid', power: 40, accuracy: 100, damageClass: 'physical', priority: 1 },

  // Rockstar (Rock) moves
  'rock-slide': { name: 'Rock Slide', type: 'Rockstar', power: 75, accuracy: 90, damageClass: 'physical' },
  'diamond-edge': { name: 'Diamond Edge', type: 'Rockstar', power: 100, accuracy: 80, damageClass: 'physical' },
  'rock-blast': { name: 'Rock Blast', type: 'Rockstar', power: 25, accuracy: 90, damageClass: 'physical' },
  'head-smash': { name: 'Head Smash', type: 'Rockstar', power: 150, accuracy: 80, damageClass: 'physical' },
  'power-gem': { name: 'Power Gem', type: 'Rockstar', power: 70, accuracy: 100, damageClass: 'special' },
  'ancient-power': { name: 'Ancient Power', type: 'Rockstar', power: 60, accuracy: 100, damageClass: 'special' },

  // Shadow (Ghost) moves
  'shadow-chain': { name: 'Shadow Chain', type: 'Shadow', power: 80, accuracy: 100, damageClass: 'special' },
  'shadow-claw': { name: 'Shadow Claw', type: 'Shadow', power: 70, accuracy: 100, damageClass: 'physical' },
  'shadow-sneak': { name: 'Shadow Sneak', type: 'Shadow', power: 40, accuracy: 100, damageClass: 'physical', priority: 1 },
  'shadow-punch': { name: 'Shadow Punch', type: 'Shadow', power: 60, accuracy: 100, damageClass: 'physical' },
  'destiny-bond': { name: 'Destiny Bond', type: 'Shadow', power: 0, accuracy: 100, damageClass: 'status' },
  'burn-wick': { name: 'Burn Wick', type: 'Pump', power: 0, accuracy: 75, damageClass: 'status' },

  // Dragon moves
  'dragon-claw': { name: 'Dragon Claw', type: 'Dragon', power: 80, accuracy: 100, damageClass: 'physical' },
  'whale-pulse': { name: 'Whale Pulse', type: 'Dragon', power: 90, accuracy: 100, damageClass: 'special' },
  'whale-meteor': { name: 'Whale Meteor', type: 'Dragon', power: 140, accuracy: 90, damageClass: 'special' },
  'whale-rage': { name: 'Whale Rage', type: 'Dragon', power: 120, accuracy: 100, damageClass: 'physical' },
  'whale-pump': { name: 'Whale Pump', type: 'Dragon', power: 0, accuracy: 100, damageClass: 'status' },

  // Night (Dark) moves
  'rug-bite': { name: 'Rug Bite', type: 'Night', power: 80, accuracy: 100, damageClass: 'physical' },
  'night-pulse': { name: 'Night Pulse', type: 'Night', power: 80, accuracy: 100, damageClass: 'special' },
  'pursuit': { name: 'Pursuit', type: 'Night', power: 40, accuracy: 100, damageClass: 'physical' },
  'revenge-rug': { name: 'Revenge Rug', type: 'Night', power: 60, accuracy: 100, damageClass: 'physical', priority: 1 },
  'night-slash': { name: 'Night Slash', type: 'Night', power: 70, accuracy: 100, damageClass: 'physical' },
  'night-bite': { name: 'Night Bite', type: 'Night', power: 60, accuracy: 100, damageClass: 'physical' },
  'payback-rug': { name: 'Payback Rug', type: 'Night', power: 50, accuracy: 100, damageClass: 'physical' },
  'knock-off': { name: 'Knock Off', type: 'Night', power: 20, accuracy: 100, damageClass: 'physical' },
  'fud-taunt': { name: 'FUD Taunt', type: 'Night', power: 0, accuracy: 100, damageClass: 'status' },

  // Solid (Steel) moves
  'vault-ram': { name: 'Vault Ram', type: 'Solid', power: 80, accuracy: 100, damageClass: 'physical' },
  'solid-beam': { name: 'Solid Beam', type: 'Solid', power: 80, accuracy: 100, damageClass: 'special' },
  'solid-meteor': { name: 'Solid Meteor', type: 'Solid', power: 100, accuracy: 85, damageClass: 'physical' },
  'iron-tail': { name: 'Iron Tail', type: 'Solid', power: 100, accuracy: 75, damageClass: 'physical' },
  'spin-zap': { name: 'Spin Zap', type: 'Solid', power: 1, accuracy: 100, damageClass: 'physical' },
  'metal-claw': { name: 'Metal Claw', type: 'Solid', power: 50, accuracy: 95, damageClass: 'physical' },

  // Hidden Power variants
  'hidden-power': { name: 'Hidden Power', type: 'HODLers', power: 70, accuracy: 100, damageClass: 'special' },
  'hp-pump': { name: 'HP Pump', type: 'Pump', power: 70, accuracy: 100, damageClass: 'special' },
  'hp-chill': { name: 'HP Chill', type: 'Chill', power: 70, accuracy: 100, damageClass: 'special' },
  'hp-yield': { name: 'HP Yield', type: 'Grass', power: 70, accuracy: 100, damageClass: 'special' },

  // Status/support moves
  'hodl-fork': { name: 'HODL Fork', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'egg-fork': { name: 'Egg Fork', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'wish-pump': { name: 'Wish Pump', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'hodl-guard': { name: 'HODL Guard', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status', priority: 4 },
  'substitute': { name: 'Substitute', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'blade-boost': { name: 'Blade Boost', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'plot-pump': { name: 'Plot Pump', type: 'Night', power: 0, accuracy: 100, damageClass: 'status' },
  'agility': { name: 'Agility', type: 'Oracle', power: 0, accuracy: 100, damageClass: 'status' },
  'baton-pass': { name: 'Baton Pass', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'spikes': { name: 'Spikes', type: 'Based', power: 0, accuracy: 100, damageClass: 'status' },
  'encore': { name: 'Encore', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'trick-room': { name: 'Trick Room', type: 'Oracle', power: 0, accuracy: 100, damageClass: 'status' },
  'sleep-yawn': { name: 'Sleep Yawn', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'heal-bell': { name: 'Heal Bell', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'aromatherapy': { name: 'Aromatherapy', type: 'Grass', power: 0, accuracy: 100, damageClass: 'status' },
  'phaze-roar': { name: 'Phaze Roar', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'roar': { name: 'Roar', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'lazy-fork': { name: 'Lazy Fork', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
  'toss-dump': { name: 'Toss Dump', type: 'Brawler', power: 1, accuracy: 100, damageClass: 'physical' },
  'night-shade': { name: 'Night Shade', type: 'Shadow', power: 1, accuracy: 100, damageClass: 'special' },
  'sketch': { name: 'Sketch', type: 'HODLers', power: 0, accuracy: 100, damageClass: 'status' },
};

// ============================================
// STATUS EFFECT CHANCES (uses display names from MOVE_DATA)
// ============================================
const STATUS_MOVES = {
  // Fire moves - burn
  'Flamethrower': { status: 'burned', chance: 0.10 },
  'Pump Blast': { status: 'burned', chance: 0.10 },
  'Fire Punch': { status: 'burned', chance: 0.10 },
  'Pump Wave': { status: 'burned', chance: 0.10 },
  'Lava Plume': { status: 'burned', chance: 0.30 },
  'Scald': { status: 'burned', chance: 0.30 },
  'Burn Wick': { status: 'burned', chance: 1.0 },

  // Electric moves - paralysis
  'Node Strike': { status: 'paralyzed', chance: 0.10 },
  'Thunder': { status: 'paralyzed', chance: 0.30 },
  'Thunder Punch': { status: 'paralyzed', chance: 0.10 },
  'Discharge': { status: 'paralyzed', chance: 0.30 },
  'Para Slam': { status: 'paralyzed', chance: 0.30 },
  'Force Palm': { status: 'paralyzed', chance: 0.30 },
  'Zap Lock': { status: 'paralyzed', chance: 1.0 },

  // Poison moves - poison
  'Toxic Blast': { status: 'poisoned', chance: 0.30 },
  'Toxic Jab': { status: 'poisoned', chance: 0.30 },
  'Cross Poison': { status: 'poisoned', chance: 0.10 },
  'Gunk Shot': { status: 'poisoned', chance: 0.30 },
  'Gas Fee': { status: 'badly_poisoned', chance: 1.0 },

  // Ice moves - freeze
  'Chill Ray': { status: 'frozen', chance: 0.10 },
  'Chill Storm': { status: 'frozen', chance: 0.10 },
  'Chill Punch': { status: 'frozen', chance: 0.10 },

  // Sleep moves
  'Sleep Scam': { status: 'asleep', chance: 1.0 },
};

// ============================================
// STAT BOOST MOVES (status moves that change stat stages)
// ============================================
const STAT_BOOST_MOVES = {
  'Blade Boost': { target: 'self', changes: { attack: 2 } },           // Swords Dance
  'Plot Pump': { target: 'self', changes: { spAttack: 2 } },           // Nasty Plot
  'Agility': { target: 'self', changes: { speed: 2 } },                // Agility
  'Oracle Boost': { target: 'self', changes: { spAttack: 1, spDefense: 1 } }, // Calm Mind
  'Whale Pump': { target: 'self', changes: { attack: 1, speed: 1 } },  // Dragon Dance
};

// Moves that lower user's stats after use (side effects on damaging moves)
const STAT_DROP_MOVES = {
  'Overheat': { changes: { spAttack: -2 } },        // Overheat lowers user SpAtk by 2
  'Power Brawl': { changes: { defense: -1, spDefense: -1 } }, // Close Combat
  'Hammer Arm': { changes: { speed: -1 } },          // Hammer Arm lowers speed
};

// ============================================
// RECOIL MOVES (attacker takes % of damage dealt)
// ============================================
const RECOIL_MOVES = {
  'Double Edge': 0.33,    // 33% recoil
  'Volt Tackle': 0.33,
  'Pump Blitz': 0.33,     // Flare Blitz
  'Crash Down': 0.33,     // Brave Bird
  'Head Smash': 0.50,     // 50% recoil
};

// Explosion: KO self after dealing damage
const SELF_KO_MOVES = ['Explosion'];

// ============================================
// DRAIN MOVES (attacker heals % of damage dealt)
// ============================================
const DRAIN_MOVES = {
  'Giga Drain': 0.50,     // Heal 50% of damage
  'Drain Punch': 0.50,
};

// ============================================
// SELF-HEAL MOVES (heal % of max HP)
// ============================================
const SELF_HEAL_MOVES = {
  'Deep Chill': 0.50,     // Roost - heal 50% max HP
  'Chill Perch': 0.50,    // Also Roost
  'Wish Pump': 0.50,      // Simplified Wish - instant 50% heal
};

// ============================================
// MULTI-HIT MOVES (hit 2-5 times)
// ============================================
const MULTI_HIT_MOVES = ['Chill Spear', 'Bone Rush', 'Rock Blast'];

// ============================================
// FIXED DAMAGE MOVES (always deal exactly 100)
// ============================================
const FIXED_DAMAGE_MOVES = ['Toss Dump', 'Night Shade'];

// ============================================
// PROTECT MOVES
// ============================================
const PROTECT_MOVES = ['HODL Guard'];

// ============================================
// TYPE CHART
// ============================================
const TYPE_CHART = {
  HODLers: { Rockstar: 0.5, Shadow: 0, Solid: 0.5 },
  Pump: { Pump: 0.5, Liquid: 0.5, Grass: 2, Chill: 2, Bug: 2, Rockstar: 0.5, Dragon: 0.5, Solid: 2 },
  Liquid: { Pump: 2, Liquid: 0.5, Grass: 0.5, Based: 2, Rockstar: 2, Dragon: 0.5 },
  Electric: { Liquid: 2, Electric: 0.5, Grass: 0.5, Based: 0, Airdrop: 2, Dragon: 0.5 },
  Grass: { Pump: 0.5, Liquid: 2, Grass: 0.5, Poison: 0.5, Based: 2, Airdrop: 0.5, Bug: 0.5, Rockstar: 2, Dragon: 0.5, Solid: 0.5 },
  Chill: { Pump: 0.5, Liquid: 0.5, Grass: 2, Chill: 0.5, Based: 2, Airdrop: 2, Dragon: 2, Solid: 0.5 },
  Brawler: { HODLers: 2, Chill: 2, Poison: 0.5, Airdrop: 0.5, Oracle: 0.5, Bug: 0.5, Rockstar: 2, Shadow: 0, Night: 2, Solid: 2, Dog: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Based: 0.5, Rockstar: 0.5, Shadow: 0.5, Solid: 0, Dog: 2 },
  Based: { Pump: 2, Electric: 2, Grass: 0.5, Poison: 2, Airdrop: 0, Bug: 0.5, Rockstar: 2, Solid: 2 },
  Airdrop: { Electric: 0.5, Grass: 2, Brawler: 2, Bug: 2, Rockstar: 0.5, Solid: 0.5 },
  Oracle: { Brawler: 2, Poison: 2, Oracle: 0.5, Night: 0, Solid: 0.5 },
  Bug: { Pump: 0.5, Grass: 2, Brawler: 0.5, Poison: 0.5, Airdrop: 0.5, Oracle: 2, Shadow: 0.5, Night: 2, Solid: 0.5, Dog: 0.5 },
  Rockstar: { Pump: 2, Chill: 2, Brawler: 0.5, Based: 0.5, Airdrop: 2, Bug: 2, Solid: 0.5 },
  Shadow: { HODLers: 0, Oracle: 2, Shadow: 2, Night: 0.5, Solid: 0.5 },
  Dragon: { Dragon: 2, Solid: 0.5, Dog: 0 },
  Night: { Brawler: 0.5, Oracle: 2, Shadow: 2, Night: 0.5, Dog: 0.5 },
  Solid: { Pump: 0.5, Liquid: 0.5, Electric: 0.5, Chill: 2, Rockstar: 2, Solid: 0.5, Dog: 2 },
  Dog: { Pump: 0.5, Brawler: 2, Poison: 0.5, Dragon: 2, Night: 2, Solid: 0.5 }
};

// ============================================
// MOVE DATA LOOKUP - Converts move name string to full move object
// ============================================
function getMoveData(moveName) {
  if (!moveName) return null;

  // If already an object with required properties, return as-is
  if (typeof moveName === 'object' && moveName.name && moveName.type !== undefined) {
    return moveName;
  }

  // Normalize: lowercase and convert spaces to hyphens for kebab-case lookup
  const moveKey = String(moveName).toLowerCase().replace(/\s+/g, '-');

  // Direct lookup
  if (MOVE_DATA[moveKey]) {
    return { ...MOVE_DATA[moveKey] };
  }

  // Try without hyphens
  const noHyphenKey = String(moveName).toLowerCase().replace(/[\s-]/g, '');
  for (const key in MOVE_DATA) {
    if (key.replace(/-/g, '') === noHyphenKey) {
      return { ...MOVE_DATA[key] };
    }
  }

  // Try matching by display name
  for (const key in MOVE_DATA) {
    if (MOVE_DATA[key].name && MOVE_DATA[key].name.toLowerCase() === String(moveName).toLowerCase()) {
      return { ...MOVE_DATA[key] };
    }
  }

  // Fallback for unknown moves - log warning and return basic move
  console.warn(`[BATTLE] Unknown move: "${moveName}" - using fallback`);
  return {
    name: String(moveName),
    type: 'HODLers',
    power: 50,
    accuracy: 100,
    damageClass: 'physical'
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getTypeEffectiveness(moveType, defenderTypes) {
  let multiplier = 1;
  defenderTypes.forEach(defType => {
    if (TYPE_CHART[moveType] && TYPE_CHART[moveType][defType] !== undefined) {
      multiplier *= TYPE_CHART[moveType][defType];
    }
  });
  return multiplier;
}

function hasSTAB(attackerTypes, moveType) {
  return attackerTypes.includes(moveType);
}

function getStatStageMultiplier(stage) {
  stage = Math.max(-6, Math.min(6, stage || 0));
  if (stage >= 0) {
    return (2 + stage) / 2;
  } else {
    return 2 / (2 - stage);
  }
}

// ============================================
// DAMAGE CALCULATION
// ============================================
function calculateDamage(attacker, defender, move) {
  // Ensure move is an object (look up if it's a string)
  const moveData = getMoveData(move);
  if (!moveData) {
    console.error('[BATTLE] Cannot calculate damage - invalid move:', move);
    return { damage: 0, effectiveness: 1, isCrit: false };
  }

  if (moveData.damageClass === 'status' || moveData.power === 0) {
    return { damage: 0, effectiveness: 1, isCrit: false };
  }

  const level = 100;
  const attackerStats = attacker.stats;
  const defenderStats = defender.stats;

  const attackerStages = attacker.statStages || { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
  const defenderStages = defender.statStages || { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };

  let attack, defense;
  if (moveData.damageClass === 'physical') {
    attack = Math.floor(attackerStats.attack * getStatStageMultiplier(attackerStages.attack));
    defense = Math.floor(defenderStats.defense * getStatStageMultiplier(defenderStages.defense));
  } else {
    attack = Math.floor(attackerStats.spAttack * getStatStageMultiplier(attackerStages.spAttack));
    defense = Math.floor(defenderStats.spDefense * getStatStageMultiplier(defenderStages.spDefense));
  }

  // Burn halves physical attack
  if (attacker.status === 'burned' && moveData.damageClass === 'physical') {
    attack = Math.floor(attack * 0.5);
  }

  let damage = Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * moveData.power * attack / defense) / 50) + 2;

  // Critical hit (1/16 chance)
  const isCrit = Math.random() < (1 / 16);
  if (isCrit) {
    damage = Math.floor(damage * 2);
  }

  // STAB bonus
  if (hasSTAB(attacker.types, moveData.type)) {
    damage = Math.floor(damage * 1.5);
  }

  // Type effectiveness
  const effectiveness = getTypeEffectiveness(moveData.type, defender.types);
  damage = Math.floor(damage * effectiveness);

  // Random roll (85-100%)
  const randomRoll = (Math.floor(Math.random() * 16) + 85) / 100;
  damage = Math.floor(damage * randomRoll);

  // Minimum 1 damage if not immune
  if (damage === 0 && effectiveness > 0) {
    damage = 1;
  }

  return { damage, effectiveness, isCrit };
}

// ============================================
// TURN ORDER DETERMINATION
// ============================================
function determineOrder(move1, fighter1, move2, fighter2) {
  // Convert move names to objects for priority check
  const moveData1 = getMoveData(move1);
  const moveData2 = getMoveData(move2);

  const priority1 = moveData1?.priority || 0;
  const priority2 = moveData2?.priority || 0;

  if (priority1 !== priority2) {
    return priority1 > priority2 ? 'first' : 'second';
  }

  const speed1 = fighter1.stats.speed * getStatStageMultiplier(fighter1.statStages?.speed || 0);
  const speed2 = fighter2.stats.speed * getStatStageMultiplier(fighter2.statStages?.speed || 0);

  if (speed1 !== speed2) {
    return speed1 > speed2 ? 'first' : 'second';
  }

  return Math.random() < 0.5 ? 'first' : 'second';
}

// ============================================
// TURN PROCESSING
// ============================================
function processTurn(creatorData, opponentData) {
  const result = {
    actions: [],
    creatorDamageDealt: 0,
    opponentDamageDealt: 0
  };

  // Reset protect at start of each turn (protect only lasts one turn)
  const creatorFighterForReset = creatorData.team[creatorData.player.activeFighterIndex];
  const opponentFighterForReset = opponentData.team[opponentData.player.activeFighterIndex];
  if (creatorFighterForReset) creatorFighterForReset.isProtected = false;
  if (opponentFighterForReset) opponentFighterForReset.isProtected = false;

  // Handle switches first
  if (creatorData.move.type === 'switch') {
    creatorData.player.activeFighterIndex = creatorData.move.fighterIndex;
    result.actions.push({
      player: 'creator',
      type: 'switch',
      fighterIndex: creatorData.move.fighterIndex,
      fighterName: creatorData.team[creatorData.move.fighterIndex].name
    });
  }

  if (opponentData.move.type === 'switch') {
    opponentData.player.activeFighterIndex = opponentData.move.fighterIndex;
    result.actions.push({
      player: 'opponent',
      type: 'switch',
      fighterIndex: opponentData.move.fighterIndex,
      fighterName: opponentData.team[opponentData.move.fighterIndex].name
    });
  }

  // If both switched, no attacks
  if (creatorData.move.type === 'switch' && opponentData.move.type === 'switch') {
    return result;
  }

  const creatorFighter = creatorData.team[creatorData.player.activeFighterIndex];
  const opponentFighter = opponentData.team[opponentData.player.activeFighterIndex];

  // Get move NAME (string) from fighter's moves array, then look up full data
  const creatorMoveName = creatorData.move.type === 'move'
    ? creatorFighter.moves[creatorData.move.moveIndex]
    : null;
  const opponentMoveName = opponentData.move.type === 'move'
    ? opponentFighter.moves[opponentData.move.moveIndex]
    : null;

  // Convert move names to full move objects using server's authoritative MOVE_DATA
  const creatorMove = creatorMoveName ? getMoveData(creatorMoveName) : null;
  const opponentMove = opponentMoveName ? getMoveData(opponentMoveName) : null;

  if (creatorMove) {
    console.log(`[BATTLE] Creator using: ${creatorMove.name} (${creatorMove.type}, ${creatorMove.power} power)`);
  }
  if (opponentMove) {
    console.log(`[BATTLE] Opponent using: ${opponentMove.name} (${opponentMove.type}, ${opponentMove.power} power)`);
  }

  if (creatorMove && opponentMove) {
    const order = determineOrder(creatorMove, creatorFighter, opponentMove, opponentFighter);

    if (order === 'first') {
      // Creator attacks first
      const creatorCanMove = canMove(creatorFighter);
      if (creatorCanMove.canMove) {
        if (creatorCanMove.wokeUp) {
          result.actions.push({ player: 'creator', type: 'status_change', change: 'woke_up' });
        }
        if (creatorCanMove.thawed) {
          result.actions.push({ player: 'creator', type: 'status_change', change: 'thawed' });
        }
        result.actions.push(executeAttack('creator', creatorFighter, creatorMove, opponentFighter, result));
      } else {
        result.actions.push({ player: 'creator', type: 'cant_move', reason: creatorCanMove.reason });
      }

      // Opponent attacks second (if alive)
      if (opponentFighter.currentHp > 0) {
        const opponentCanMove = canMove(opponentFighter);
        if (opponentCanMove.canMove) {
          if (opponentCanMove.wokeUp) {
            result.actions.push({ player: 'opponent', type: 'status_change', change: 'woke_up' });
          }
          if (opponentCanMove.thawed) {
            result.actions.push({ player: 'opponent', type: 'status_change', change: 'thawed' });
          }
          result.actions.push(executeAttack('opponent', opponentFighter, opponentMove, creatorFighter, result));
        } else {
          result.actions.push({ player: 'opponent', type: 'cant_move', reason: opponentCanMove.reason });
        }
      }
    } else {
      // Opponent attacks first
      const opponentCanMove = canMove(opponentFighter);
      if (opponentCanMove.canMove) {
        if (opponentCanMove.wokeUp) {
          result.actions.push({ player: 'opponent', type: 'status_change', change: 'woke_up' });
        }
        if (opponentCanMove.thawed) {
          result.actions.push({ player: 'opponent', type: 'status_change', change: 'thawed' });
        }
        result.actions.push(executeAttack('opponent', opponentFighter, opponentMove, creatorFighter, result));
      } else {
        result.actions.push({ player: 'opponent', type: 'cant_move', reason: opponentCanMove.reason });
      }

      // Creator attacks second (if alive)
      if (creatorFighter.currentHp > 0) {
        const creatorCanMove = canMove(creatorFighter);
        if (creatorCanMove.canMove) {
          if (creatorCanMove.wokeUp) {
            result.actions.push({ player: 'creator', type: 'status_change', change: 'woke_up' });
          }
          if (creatorCanMove.thawed) {
            result.actions.push({ player: 'creator', type: 'status_change', change: 'thawed' });
          }
          result.actions.push(executeAttack('creator', creatorFighter, creatorMove, opponentFighter, result));
        } else {
          result.actions.push({ player: 'creator', type: 'cant_move', reason: creatorCanMove.reason });
        }
      }
    }
  } else if (creatorMove) {
    const creatorCanMove = canMove(creatorFighter);
    if (creatorCanMove.canMove) {
      result.actions.push(executeAttack('creator', creatorFighter, creatorMove, opponentFighter, result));
    } else {
      result.actions.push({ player: 'creator', type: 'cant_move', reason: creatorCanMove.reason });
    }
  } else if (opponentMove) {
    const opponentCanMove = canMove(opponentFighter);
    if (opponentCanMove.canMove) {
      result.actions.push(executeAttack('opponent', opponentFighter, opponentMove, creatorFighter, result));
    } else {
      result.actions.push({ player: 'opponent', type: 'cant_move', reason: opponentCanMove.reason });
    }
  }

  return result;
}

// ============================================
// ATTACK EXECUTION
// ============================================
function executeAttack(attackerLabel, attacker, move, defender, result) {
  // Ensure move is an object
  const moveData = getMoveData(move);
  if (!moveData) {
    console.error('[BATTLE] executeAttack called with invalid move:', move);
    return {
      player: attackerLabel,
      type: 'attack',
      move: 'Unknown',
      missed: true,
      damage: 0
    };
  }

  // --- PROTECT CHECK ---
  if (defender.isProtected) {
    console.log(`[BATTLE] ${moveData.name} blocked by Protect!`);
    return {
      player: attackerLabel,
      type: 'attack',
      move: moveData.name,
      moveType: moveData.type,
      damage: 0,
      effectiveness: 1,
      isCrit: false,
      blocked: true,
      targetHpRemaining: defender.currentHp,
      targetFainted: false,
      statusApplied: null
    };
  }

  // --- STATUS MOVE HANDLING (stat boosts, heals, protect) ---
  if (moveData.damageClass === 'status' || moveData.power === 0) {
    return executeStatusMove(attackerLabel, attacker, defender, moveData);
  }

  // --- ACCURACY CHECK ---
  const accuracy = moveData.accuracy || 100;
  const hits = Math.random() * 100 < accuracy;

  if (!hits) {
    return {
      player: attackerLabel,
      type: 'attack',
      move: moveData.name,
      missed: true,
      damage: 0
    };
  }

  // --- FIXED DAMAGE MOVES ---
  let damage, effectiveness, isCrit;
  if (FIXED_DAMAGE_MOVES.includes(moveData.name)) {
    damage = 100;
    effectiveness = 1;
    isCrit = false;
  } else {
    ({ damage, effectiveness, isCrit } = calculateDamage(attacker, defender, moveData));
  }

  // --- MULTI-HIT MOVES ---
  let totalDamage = damage;
  let hitCount = 1;
  if (MULTI_HIT_MOVES.includes(moveData.name)) {
    // 2-5 hits: 35% for 2, 35% for 3, 15% for 4, 15% for 5
    const roll = Math.random();
    if (roll < 0.35) hitCount = 2;
    else if (roll < 0.70) hitCount = 3;
    else if (roll < 0.85) hitCount = 4;
    else hitCount = 5;
    // First hit already calculated, do remaining hits
    for (let i = 1; i < hitCount; i++) {
      const extraHit = calculateDamage(attacker, defender, moveData);
      totalDamage += extraHit.damage;
    }
    console.log(`[BATTLE] ${moveData.name} hit ${hitCount} times for ${totalDamage} total damage`);
  }

  // Apply damage
  defender.currentHp = Math.max(0, defender.currentHp - totalDamage);

  if (attackerLabel === 'creator') {
    result.creatorDamageDealt += totalDamage;
  } else {
    result.opponentDamageDealt += totalDamage;
  }

  // --- DRAIN MOVES (heal attacker) ---
  let healAmount = 0;
  if (DRAIN_MOVES[moveData.name]) {
    healAmount = Math.floor(totalDamage * DRAIN_MOVES[moveData.name]);
    attacker.currentHp = Math.min(attacker.maxHp || attacker.stats.hp, attacker.currentHp + healAmount);
    console.log(`[BATTLE] ${moveData.name} healed attacker for ${healAmount} HP`);
  }

  // --- RECOIL MOVES (damage attacker) ---
  let recoilDamage = 0;
  if (RECOIL_MOVES[moveData.name]) {
    recoilDamage = Math.floor(totalDamage * RECOIL_MOVES[moveData.name]);
    attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);
    console.log(`[BATTLE] ${moveData.name} recoil: ${recoilDamage} damage to attacker (HP: ${attacker.currentHp})`);
  }

  // --- SELF-KO MOVES (Explosion) ---
  if (SELF_KO_MOVES.includes(moveData.name)) {
    attacker.currentHp = 0;
    console.log(`[BATTLE] ${moveData.name} KO'd the attacker`);
  }

  // --- STAT DROP SIDE EFFECTS ---
  let statChanges = null;
  if (STAT_DROP_MOVES[moveData.name]) {
    const drops = STAT_DROP_MOVES[moveData.name].changes;
    if (!attacker.statStages) attacker.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    const actualChanges = {};
    for (const [stat, change] of Object.entries(drops)) {
      const oldVal = attacker.statStages[stat] || 0;
      attacker.statStages[stat] = Math.max(-6, Math.min(6, oldVal + change));
      actualChanges[stat] = attacker.statStages[stat] - oldVal;
    }
    statChanges = { target: 'self', changes: actualChanges };
    console.log(`[BATTLE] ${moveData.name} stat drops applied to attacker:`, actualChanges);
  }

  // --- STATUS EFFECT APPLICATION ---
  let statusApplied = null;
  if (defender.currentHp > 0 && !defender.status) {
    const statusData = STATUS_MOVES[moveData.name];
    if (statusData && Math.random() < statusData.chance) {
      defender.status = statusData.status;
      if (statusData.status === 'badly_poisoned') {
        defender.toxicCounter = 1;
      }
      if (statusData.status === 'asleep') {
        defender.sleepTurns = Math.floor(Math.random() * 3) + 1;
      }
      statusApplied = statusData.status;
    }
  }

  return {
    player: attackerLabel,
    type: 'attack',
    move: moveData.name,
    moveType: moveData.type,
    damage: totalDamage,
    effectiveness,
    isCrit,
    hitCount: hitCount > 1 ? hitCount : undefined,
    recoilDamage: recoilDamage > 0 ? recoilDamage : undefined,
    healAmount: healAmount > 0 ? healAmount : undefined,
    selfKO: SELF_KO_MOVES.includes(moveData.name) || undefined,
    blocked: false,
    targetHpRemaining: defender.currentHp,
    targetFainted: defender.currentHp <= 0,
    attackerFainted: attacker.currentHp <= 0,
    statusApplied,
    statChanges
  };
}

// ============================================
// STATUS MOVE EXECUTION (non-damaging moves)
// ============================================
function executeStatusMove(attackerLabel, attacker, defender, moveData) {
  const actionResult = {
    player: attackerLabel,
    type: 'attack',
    move: moveData.name,
    moveType: moveData.type,
    damage: 0,
    effectiveness: 1,
    isCrit: false,
    targetHpRemaining: defender.currentHp,
    targetFainted: false,
    statusApplied: null,
    statChanges: null,
    healAmount: 0,
    protected: false,
    failed: false
  };

  // --- PROTECT ---
  if (PROTECT_MOVES.includes(moveData.name)) {
    // Consecutive protect has 50% fail chance each time
    if (attacker.lastMoveWasProtect) {
      if (Math.random() < 0.5) {
        actionResult.failed = true;
        console.log(`[BATTLE] ${moveData.name} failed (consecutive use)`);
        return actionResult;
      }
    }
    attacker.isProtected = true;
    attacker.lastMoveWasProtect = true;
    actionResult.protected = true;
    console.log(`[BATTLE] ${attacker.name || attackerLabel} used Protect!`);
    return actionResult;
  }

  // Not a protect move - reset consecutive protect tracking
  attacker.lastMoveWasProtect = false;

  // --- STAT BOOST MOVES ---
  if (STAT_BOOST_MOVES[moveData.name]) {
    const boost = STAT_BOOST_MOVES[moveData.name];
    if (!attacker.statStages) attacker.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    const changes = {};
    for (const [stat, change] of Object.entries(boost.changes)) {
      const oldVal = attacker.statStages[stat] || 0;
      attacker.statStages[stat] = Math.max(-6, Math.min(6, oldVal + change));
      changes[stat] = attacker.statStages[stat] - oldVal; // actual change applied
    }
    actionResult.statChanges = { target: 'self', changes };
    console.log(`[BATTLE] ${moveData.name} boosted stats:`, changes, 'New stages:', attacker.statStages);
    return actionResult;
  }

  // --- SELF-HEAL MOVES ---
  if (SELF_HEAL_MOVES[moveData.name]) {
    const maxHp = attacker.maxHp || attacker.stats.hp;
    const healAmount = Math.floor(maxHp * SELF_HEAL_MOVES[moveData.name]);
    const oldHp = attacker.currentHp;
    attacker.currentHp = Math.min(maxHp, attacker.currentHp + healAmount);
    actionResult.healAmount = attacker.currentHp - oldHp;
    console.log(`[BATTLE] ${moveData.name} healed ${actionResult.healAmount} HP (${oldHp} -> ${attacker.currentHp})`);
    return actionResult;
  }

  // --- STATUS-INFLICTING MOVES (burn/paralyze/poison/sleep/freeze via status moves) ---
  if (!defender.status) {
    const statusData = STATUS_MOVES[moveData.name];
    if (statusData && Math.random() < statusData.chance) {
      defender.status = statusData.status;
      if (statusData.status === 'badly_poisoned') {
        defender.toxicCounter = 1;
      }
      if (statusData.status === 'asleep') {
        defender.sleepTurns = Math.floor(Math.random() * 3) + 1;
      }
      actionResult.statusApplied = statusData.status;
      console.log(`[BATTLE] ${moveData.name} applied ${statusData.status} to defender`);
    }
  }

  return actionResult;
}

// ============================================
// STATUS CHECKS
// ============================================
function canMove(fighter) {
  if (!fighter.status) return { canMove: true };

  if (fighter.status === 'paralyzed') {
    if (Math.random() < 0.25) {
      return { canMove: false, reason: 'paralyzed' };
    }
  }

  if (fighter.status === 'asleep') {
    if (fighter.sleepTurns > 0) {
      fighter.sleepTurns--;
      if (fighter.sleepTurns === 0) {
        fighter.status = null;
        return { canMove: true, wokeUp: true };
      }
      return { canMove: false, reason: 'asleep' };
    }
  }

  if (fighter.status === 'frozen') {
    if (Math.random() < 0.20) {
      fighter.status = null;
      return { canMove: true, thawed: true };
    }
    return { canMove: false, reason: 'frozen' };
  }

  return { canMove: true };
}

// ============================================
// END-OF-TURN EFFECTS
// ============================================
function processEndOfTurn(fighter) {
  const effects = [];

  if (!fighter || fighter.currentHp <= 0) return effects;

  if (fighter.status === 'burned') {
    const burnDamage = Math.max(1, Math.floor(fighter.maxHp / 8));
    fighter.currentHp = Math.max(0, fighter.currentHp - burnDamage);
    effects.push({
      type: 'burn_damage',
      damage: burnDamage,
      hpRemaining: fighter.currentHp,
      fainted: fighter.currentHp <= 0
    });
  }

  if (fighter.status === 'poisoned') {
    const poisonDamage = Math.max(1, Math.floor(fighter.maxHp / 8));
    fighter.currentHp = Math.max(0, fighter.currentHp - poisonDamage);
    effects.push({
      type: 'poison_damage',
      damage: poisonDamage,
      hpRemaining: fighter.currentHp,
      fainted: fighter.currentHp <= 0
    });
  }

  if (fighter.status === 'badly_poisoned') {
    const toxicMultiplier = Math.min(fighter.toxicCounter || 1, 15);
    const toxicDamage = Math.max(1, Math.floor((fighter.maxHp * toxicMultiplier) / 16));
    fighter.currentHp = Math.max(0, fighter.currentHp - toxicDamage);
    fighter.toxicCounter = (fighter.toxicCounter || 1) + 1;
    effects.push({
      type: 'toxic_damage',
      damage: toxicDamage,
      hpRemaining: fighter.currentHp,
      fainted: fighter.currentHp <= 0
    });
  }

  return effects;
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  MOVE_DATA,
  TYPE_CHART,
  getMoveData,
  getTypeEffectiveness,
  calculateDamage,
  processTurn,
  determineOrder,
  canMove,
  processEndOfTurn
};
