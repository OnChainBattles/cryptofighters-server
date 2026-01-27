// CryptoFighters Database - 95 Fighters
// Stats are pre-calculated competitive battle stats (Level 100, optimal builds)
// Move keys are crypto-themed to match display names in Cryptodex
const FIGHTER_DATA = [
    // Satoshi (Jirachi #385) - Special Wall / Support
    {
        id: 385,
        cryptoIndex: 1,
        name: "Satoshi",
        types: ["Solid", "Oracle"],
        stats: { hp: 404, attack: 236, defense: 236, spAttack: 212, spDefense: 315, speed: 244 },
        moves: ["vault-ram", "pivot-flip", "fud-taunt", "zap-lock"],
        spritesFront: "Sprites/Satoshi.png",
        spritesBack: "Sprites/Satoshi.png",
        spritesEnemy: "Sprites/Satoshi Enemy.png"
    },
    // Shillin (Tyranitar #248) - Choice Band
    {
        id: 248,
        cryptoIndex: 2,
        name: "Shillin",
        types: ["Rockstar", "Night"],
        stats: { hp: 373, attack: 403, defense: 256, spAttack: 195, spDefense: 236, speed: 176 },
        moves: ["diamond-edge", "rug-bite", "rug-pull", "revenge-rug"],
        spritesFront: "Sprites/Shillin.png",
        spritesBack: "Sprites/Shillin.png",
        spritesEnemy: "Sprites/Shillin Enemy.png"
    },
    // CZ (Latias #380) - Calm Mind
    {
        id: 380,
        cryptoIndex: 3,
        name: "CZ",
        types: ["Dragon", "Oracle"],
        stats: { hp: 364, attack: 176, defense: 216, spAttack: 257, spDefense: 296, speed: 350 },
        moves: ["whale-pulse", "oracle-blast", "oracle-boost", "hodl-fork"],
        spritesFront: "Sprites/CZ.png",
        spritesBack: "Sprites/CZ.png",
        spritesEnemy: "Sprites/CZ Enemy.png"
    },
    // Moon (Breloom #286) - Spore Lead
    {
        id: 286,
        cryptoIndex: 4,
        name: "Moon",
        types: ["Grass", "Brawler"],
        stats: { hp: 227, attack: 394, defense: 196, spAttack: 126, spDefense: 156, speed: 239 },
        moves: ["pri-brawl", "sleep-scam", "yield-bomb", "diamond-edge"],
        spritesFront: "Sprites/Moon.png",
        spritesBack: "Sprites/Moon.png",
        spritesEnemy: "Sprites/Moon Enemy.png"
    },
    // Books (Heatran #485) - Special Attacker
    {
        id: 485,
        cryptoIndex: 5,
        name: "Books",
        types: ["Pump", "Solid"],
        stats: { hp: 288, attack: 194, defense: 248, spAttack: 394, spDefense: 248, speed: 253 },
        moves: ["pump-blast", "base-surge", "solid-beam", "fud-taunt"],
        spritesFront: "Sprites/Books.png",
        spritesBack: "Sprites/Books.png",
        spritesEnemy: "Sprites/Books Enemy.png"
    },
    // Doge (Clefable #36) - Calm Mind Tank
    {
        id: 36,
        cryptoIndex: 6,
        name: "Doge",
        types: ["Dog"],
        stats: { hp: 394, attack: 140, defense: 245, spAttack: 226, spDefense: 217, speed: 138 },
        moves: ["chill-ray", "egg-fork", "toss-dump", "zap-lock"],
        spritesFront: "Sprites/Doge.png",
        spritesBack: "Sprites/Doge.png",
        spritesEnemy: "Sprites/Doge Enemy.png"
    },
    // Jason AI (Gyarados #130) - Dragon Dance Sweeper
    {
        id: 130,
        cryptoIndex: 7,
        name: "Jason AI",
        types: ["Liquid", "Airdrop"],
        stats: { hp: 297, attack: 349, defense: 194, spAttack: 126, spDefense: 236, speed: 261 },
        moves: ["liquid-climb", "rug-pull", "chill-bite", "whale-pump"],
        spritesFront: "Sprites/Jason AI.png",
        spritesBack: "Sprites/Jason AI.png",
        spritesEnemy: "Sprites/Jason AI Enemy.png"
    },
    // Ruslan (Skarmory #227) - Physical Wall
    {
        id: 227,
        cryptoIndex: 8,
        name: "Ruslan",
        types: ["Solid", "Airdrop"],
        stats: { hp: 334, attack: 178, defense: 416, spAttack: 86, spDefense: 177, speed: 158 },
        moves: ["crash-down", "fud-taunt", "chill-perch", "phaze-roar"],
        spritesFront: "Sprites/Ruslan.png",
        spritesBack: "Sprites/Ruslan.png",
        spritesEnemy: "Sprites/Ruslan Enemy.png"
    },
    // Alon (Starmie #121) - Offensive Spinner
    {
        id: 121,
        cryptoIndex: 9,
        name: "Alon",
        types: ["Liquid", "Oracle"],
        stats: { hp: 227, attack: 156, defense: 206, spAttack: 299, spDefense: 206, speed: 361 },
        moves: ["liquid-surge", "node-strike", "chill-ray", "hodl-fork"],
        spritesFront: "Sprites/Alon.png",
        spritesBack: "Sprites/Alon.png",
        spritesEnemy: "Sprites/Alon Enemy.png"
    },
    // Musk (Zapdos #145) - SubRoost
    {
        id: 145,
        cryptoIndex: 10,
        name: "Musk",
        types: ["Electric", "Airdrop"],
        stats: { hp: 383, attack: 198, defense: 282, spAttack: 277, spDefense: 216, speed: 244 },
        moves: ["node-strike", "pump-wave", "chill-perch", "hp-yield"],
        spritesFront: "Sprites/Musk.png",
        spritesBack: "Sprites/Musk.png",
        spritesEnemy: "Sprites/Musk Enemy.png"
    },
    // Izadi (Metagross #376) - Choice Band
    {
        id: 376,
        cryptoIndex: 11,
        name: "Izadi",
        types: ["Solid", "Oracle"],
        stats: { hp: 364, attack: 403, defense: 296, spAttack: 195, spDefense: 216, speed: 178 },
        moves: ["solid-meteor", "rug-pull", "oracle-head", "solid-punch"],
        spritesFront: "Sprites/Izadi.png",
        spritesBack: "Sprites/Izadi.png",
        spritesEnemy: "Sprites/Izadi Enemy.png"
    },
    // Elja (Flygon #330) - Choice Scarf
    {
        id: 330,
        cryptoIndex: 12,
        name: "Elja",
        types: ["Based", "Dragon"],
        stats: { hp: 267, attack: 299, defense: 196, spAttack: 176, spDefense: 196, speed: 299 },
        moves: ["rug-pull", "whale-rage", "pivot-flip", "diamond-edge"],
        spritesFront: "Sprites/Elja.png",
        spritesBack: "Sprites/Elja.png",
        spritesEnemy: "Sprites/Elja Enemy.png"
    },
    // Jawdropper (Gengar #94) - Life Orb Attacker
    {
        id: 94,
        cryptoIndex: 13,
        name: "Jawdropper",
        types: ["Shadow", "Poison"],
        stats: { hp: 227, attack: 135, defense: 156, spAttack: 359, spDefense: 186, speed: 350 },
        moves: ["shadow-chain", "brawl-blast", "node-strike", "hp-pump"],
        spritesFront: "Sprites/Jawdropper.png",
        spritesBack: "Sprites/Jawdropper.png",
        spritesEnemy: "Sprites/Jawdropper Enemy.png"
    },
    // Trump (Gliscor #472) - Swords Dance
    {
        id: 472,
        cryptoIndex: 14,
        name: "Trump",
        types: ["Based", "Airdrop"],
        stats: { hp: 354, attack: 237, defense: 286, spAttack: 95, spDefense: 186, speed: 295 },
        moves: ["rug-pull", "chill-bite", "chill-perch", "blade-boost"],
        spritesFront: "Sprites/Trump.png",
        spritesBack: "Sprites/Trump.png",
        spritesEnemy: "Sprites/Trump Enemy.png"
    },
    // Amp (Hippowdon #450) - Physical Wall
    {
        id: 450,
        cryptoIndex: 15,
        name: "Amp",
        types: ["Based"],
        stats: { hp: 420, attack: 260, defense: 372, spAttack: 152, spDefense: 181, speed: 110 },
        moves: ["rug-pull", "chill-bite", "lazy-fork", "fud-taunt"],
        spritesFront: "Sprites/Amp.png",
        spritesBack: "Sprites/Amp.png",
        spritesEnemy: "Sprites/Amp Enemy.png"
    },
    // Gorl (Bronzong #437) - Tank
    {
        id: 437,
        cryptoIndex: 16,
        name: "Gorl",
        types: ["Solid", "Oracle"],
        stats: { hp: 338, attack: 214, defense: 310, spAttack: 176, spDefense: 297, speed: 59 },
        moves: ["fud-taunt", "spin-zap", "rug-pull", "oracle-head"],
        spritesFront: "Sprites/Gorl.png",
        spritesBack: "Sprites/Gorl.png",
        spritesEnemy: "Sprites/Gorl Enemy.png"
    },
    // Jana (Infernape #392) - Mixed Attacker
    {
        id: 392,
        cryptoIndex: 17,
        name: "Jana",
        types: ["Pump", "Brawler"],
        stats: { hp: 258, attack: 307, defense: 178, spAttack: 245, spDefense: 156, speed: 346 },
        moves: ["brawl-crash", "pump-blast", "yield-knot", "diamond-edge"],
        spritesFront: "Sprites/Jana.png",
        spritesBack: "Sprites/Jana.png",
        spritesEnemy: "Sprites/Jana Enemy.png"
    },
    // Swapicorn (Empoleon #395) - Special Tank
    {
        id: 395,
        cryptoIndex: 18,
        name: "Swapicorn",
        types: ["Liquid", "Solid"],
        stats: { hp: 372, attack: 177, defense: 212, spAttack: 355, spDefense: 239, speed: 138 },
        moves: ["liquid-surge", "chill-ray", "yield-knot", "fud-taunt"],
        spritesFront: "Sprites/Swapicorn.png",
        spritesBack: "Sprites/Swapicorn.png",
        spritesEnemy: "Sprites/Swapicorn Enemy.png"
    },
    // Sr Pepe (Swampert #260) - Defensive
    {
        id: 260,
        cryptoIndex: 19,
        name: "Sr Pepe",
        types: ["Liquid", "Based"],
        stats: { hp: 404, attack: 258, defense: 280, spAttack: 195, spDefense: 216, speed: 124 },
        moves: ["rug-pull", "liquid-climb", "chill-ray", "fud-taunt"],
        spritesFront: "Sprites/Sr Pepe.png",
        spritesBack: "Sprites/Sr Pepe.png",
        spritesEnemy: "Sprites/Sr Pepe Enemy.png"
    },
    // Solano (Dragonite #149) - Dragon Dance Sweeper
    {
        id: 149,
        cryptoIndex: 20,
        name: "Solano",
        types: ["Dragon", "Airdrop"],
        stats: { hp: 289, attack: 403, defense: 226, spAttack: 206, spDefense: 236, speed: 259 },
        moves: ["whale-rage", "speed-moon", "rug-pull", "whale-pump"],
        spritesFront: "Sprites/Solano.png",
        spritesBack: "Sprites/Solano.png",
        spritesEnemy: "Sprites/Solano Enemy.png"
    },
    // Scooter (Celebi #251) - Nasty Plot
    {
        id: 251,
        cryptoIndex: 21,
        name: "Scooter",
        types: ["Oracle", "Grass"],
        stats: { hp: 307, attack: 196, defense: 236, spAttack: 299, spDefense: 236, speed: 328 },
        moves: ["yield-storm", "base-surge", "hodl-fork", "plot-pump"],
        spritesFront: "Sprites/Scooter.png",
        spritesBack: "Sprites/Scooter.png",
        spritesEnemy: "Sprites/Scooter Enemy.png"
    },
    // Sailor (Suicune #245) - Calm Mind
    {
        id: 245,
        cryptoIndex: 22,
        name: "Sailor",
        types: ["Liquid"],
        stats: { hp: 404, attack: 151, defense: 329, spAttack: 198, spDefense: 267, speed: 188 },
        moves: ["liquid-surf", "chill-ray", "oracle-boost", "deep-chill"],
        spritesFront: "Sprites/Sailor.png",
        spritesBack: "Sprites/Sailor.png",
        spritesEnemy: "Sprites/Sailor Enemy.png"
    },
    // Fun (Scizor #212) - Choice Band
    {
        id: 212,
        cryptoIndex: 23,
        name: "Fun",
        types: ["Bug", "Solid"],
        stats: { hp: 343, attack: 394, defense: 236, spAttack: 115, spDefense: 198, speed: 148 },
        moves: ["solid-punch", "pivot-flip", "power-brawl", "revenge-rug"],
        spritesFront: "Sprites/Fun.png",
        spritesBack: "Sprites/Fun.png",
        spritesEnemy: "Sprites/Fun Enemy.png"
    },
    // Gainzy (Azelf #482) - Lead
    {
        id: 482,
        cryptoIndex: 24,
        name: "Gainzy",
        types: ["Oracle"],
        stats: { hp: 257, attack: 256, defense: 176, spAttack: 349, spDefense: 176, speed: 361 },
        moves: ["oracle-blast", "pump-blast", "plot-pump", "fud-taunt"],
        spritesFront: "Sprites/Gainzy.png",
        spritesBack: "Sprites/Gainzy.png",
        spritesEnemy: "Sprites/Gainzy Enemy.png"
    },
    // ASTERoid (Magneton #82) - Magnet Pull Trapper
    {
        id: 82,
        cryptoIndex: 25,
        name: "ASTERoid",
        types: ["Electric", "Solid"],
        stats: { hp: 207, attack: 126, defense: 226, spAttack: 339, spDefense: 176, speed: 239 },
        moves: ["node-strike", "solid-beam", "hp-pump", "rug-pull"],
        spritesFront: "Sprites/ASTERoid.png",
        spritesBack: "Sprites/ASTERoid.png",
        spritesEnemy: "Sprites/ASTERoid Enemy.png"
    },
    // Tommy B (Magnezone #462) - Choice Specs
    {
        id: 462,
        cryptoIndex: 26,
        name: "Tommy B",
        types: ["Electric", "Solid"],
        stats: { hp: 247, attack: 146, defense: 266, spAttack: 394, spDefense: 198, speed: 219 },
        moves: ["node-strike", "solid-beam", "hp-pump", "rug-pull"],
        spritesFront: "Sprites/Tommy B.png",
        spritesBack: "Sprites/Tommy B.png",
        spritesEnemy: "Sprites/Tommy B Enemy.png"
    },
    // Top G (Lucario #448) - Swords Dance
    {
        id: 448,
        cryptoIndex: 27,
        name: "Top G",
        types: ["Brawler", "Solid"],
        stats: { hp: 247, attack: 319, defense: 176, spAttack: 257, spDefense: 176, speed: 279 },
        moves: ["brawl-crash", "speed-moon", "chill-punch", "blade-boost"],
        spritesFront: "Sprites/Top G.png",
        spritesBack: "Sprites/Top G.png",
        spritesEnemy: "Sprites/Top G Enemy.png"
    },
    // Hyper (Kingdra #230) - Rain Dance
    {
        id: 230,
        cryptoIndex: 28,
        name: "Hyper",
        types: ["Liquid", "Dragon"],
        stats: { hp: 262, attack: 327, defense: 226, spAttack: 195, spDefense: 226, speed: 265 },
        moves: ["liquid-climb", "whale-rage", "whale-pump", "hodl-guard"],
        spritesFront: "Sprites/Hyper.png",
        spritesBack: "Sprites/Hyper.png",
        spritesEnemy: "Sprites/Hyper Enemy.png"
    },
    // Solo (Donphan #232) - Rapid Spinner
    {
        id: 232,
        cryptoIndex: 29,
        name: "Solo",
        types: ["Based"],
        stats: { hp: 384, attack: 278, defense: 372, spAttack: 136, spDefense: 157, speed: 116 },
        moves: ["rug-pull", "chill-shard", "hodl-fork", "fud-taunt"],
        spritesFront: "Sprites/Solo.png",
        spritesBack: "Sprites/Solo.png",
        spritesEnemy: "Sprites/Solo Enemy.png"
    },
    // Fart (Nidoqueen #31) - Tank
    {
        id: 31,
        cryptoIndex: 30,
        name: "Fart",
        types: ["Poison", "Based"],
        stats: { hp: 384, attack: 189, defense: 210, spAttack: 283, spDefense: 207, speed: 170 },
        moves: ["base-surge", "chill-ray", "toxic-blast", "fud-taunt"],
        spritesFront: "Sprites/Fart.png",
        spritesBack: "Sprites/Fart.png",
        spritesEnemy: "Sprites/Fart Enemy.png"
    },
    // Trevv (Roserade #407) - Sleep Lead
    {
        id: 407,
        cryptoIndex: 31,
        name: "Trevv",
        types: ["Grass", "Poison"],
        stats: { hp: 227, attack: 146, defense: 166, spAttack: 349, spDefense: 246, speed: 279 },
        moves: ["yield-storm", "toxic-blast", "sleep-scam-75", "hp-pump"],
        spritesFront: "Sprites/Trevv.png",
        spritesBack: "Sprites/Trevv.png",
        spritesEnemy: "Sprites/Trevv Enemy.png"
    },
    // Pancake (Milotic #350) - Special Wall
    {
        id: 350,
        cryptoIndex: 32,
        name: "Pancake",
        types: ["Liquid"],
        stats: { hp: 394, attack: 121, defense: 257, spAttack: 226, spDefense: 287, speed: 180 },
        moves: ["liquid-surf", "chill-ray", "hodl-fork", "gas-fee"],
        spritesFront: "Sprites/Pancake.png",
        spritesBack: "Sprites/Pancake.png",
        spritesEnemy: "Sprites/Pancake Enemy.png"
    },
    // PizzaStool (Aerodactyl #142) - Lead
    {
        id: 142,
        cryptoIndex: 33,
        name: "PizzaStool",
        types: ["Rockstar", "Airdrop"],
        stats: { hp: 267, attack: 309, defense: 166, spAttack: 156, spDefense: 186, speed: 394 },
        moves: ["diamond-edge", "rug-pull", "fud-taunt", "chill-bite"],
        spritesFront: "Sprites/PizzaStool.png",
        spritesBack: "Sprites/PizzaStool.png",
        spritesEnemy: "Sprites/PizzaStool Enemy.png"
    },
    // West (Rhyperior #464) - Tank
    {
        id: 464,
        cryptoIndex: 34,
        name: "West",
        types: ["Based", "Rockstar"],
        stats: { hp: 399, attack: 416, defense: 296, spAttack: 115, spDefense: 175, speed: 96 },
        moves: ["rug-pull", "diamond-edge", "bug-horn", "fud-taunt"],
        spritesFront: "Sprites/West.png",
        spritesBack: "Sprites/West.png",
        spritesEnemy: "Sprites/West Enemy.png"
    },
    // Wynn (Uxie #480) - Defensive Lead
    {
        id: 480,
        cryptoIndex: 35,
        name: "Wynn",
        types: ["Oracle"],
        stats: { hp: 354, attack: 151, defense: 359, spAttack: 166, spDefense: 297, speed: 208 },
        moves: ["fud-taunt", "zap-lock", "pivot-flip", "oracle-blast"],
        spritesFront: "Sprites/Wynn.png",
        spritesBack: "Sprites/Wynn.png",
        spritesEnemy: "Sprites/Wynn enemy.png"
    },
    // Doge Diamond (Blissey #242) - Special Wall
    {
        id: 242,
        cryptoIndex: 36,
        name: "Doge Diamond",
        types: ["HODLers"],
        stats: { hp: 714, attack: 25, defense: 119, spAttack: 167, spDefense: 307, speed: 128 },
        moves: ["egg-fork", "toss-dump", "gas-fee", "zap-lock"],
        spritesFront: "Sprites/Doge Diamond.png",
        spritesBack: "Sprites/Doge Diamond.png",
        spritesEnemy: "Sprites/Doge Diamond Enemy.png"
    },
    // Bambino (Forretress #205) - Hazard Setter
    {
        id: 205,
        cryptoIndex: 37,
        name: "Bambino",
        types: ["Bug", "Solid"],
        stats: { hp: 354, attack: 216, defense: 416, spAttack: 136, spDefense: 157, speed: 72 },
        moves: ["fud-taunt", "hodl-fork", "spin-zap", "rug-pull"],
        spritesFront: "Sprites/Bambino.png",
        spritesBack: "Sprites/Bambino.png",
        spritesEnemy: "Sprites/Bambino Enemy.png"
    },
    // Rida (Quagsire #195) - Physical Wall
    {
        id: 195,
        cryptoIndex: 38,
        name: "Rida",
        types: ["Liquid", "Based"],
        stats: { hp: 394, attack: 206, defense: 269, spAttack: 166, spDefense: 167, speed: 63 },
        moves: ["rug-pull", "liquid-climb", "hodl-fork", "gas-fee"],
        spritesFront: "Sprites/Rida.png",
        spritesBack: "Sprites/Rida.png",
        spritesEnemy: "Sprites/Rida Enemy.png"
    },
    // Bark (Togekiss #468) - ParaFlinch
    {
        id: 468,
        cryptoIndex: 39,
        name: "Bark",
        types: ["Dog", "Airdrop"],
        stats: { hp: 374, attack: 106, defense: 226, spAttack: 277, spDefense: 266, speed: 259 },
        moves: ["airdrop-slash", "brawl-sphere", "chill-perch", "zap-lock"],
        spritesFront: "Sprites/Bark.png",
        spritesBack: "Sprites/Bark.png",
        spritesEnemy: "Sprites/Bark Enemy.png"
    },
    // Peng (Mamoswine #473) - Physical Sweeper
    {
        id: 473,
        cryptoIndex: 40,
        name: "Peng",
        types: ["Chill", "Based"],
        stats: { hp: 327, attack: 359, defense: 196, spAttack: 176, spDefense: 156, speed: 259 },
        moves: ["rug-pull", "chill-shard", "diamond-edge", "power-brawl"],
        spritesFront: "Sprites/Peng.png",
        spritesBack: "Sprites/Peng.png",
        spritesEnemy: "Sprites/Peng Enemy.png"
    },
    // Frank (Abomasnow #460) - Mixed Attacker
    {
        id: 460,
        cryptoIndex: 41,
        name: "Frank",
        types: ["Grass", "Chill"],
        stats: { hp: 366, attack: 326, defense: 186, spAttack: 220, spDefense: 227, speed: 108 },
        moves: ["chill-storm", "yield-hammer", "rug-pull", "chill-shard"],
        spritesFront: "Sprites/Frank.png",
        spritesBack: "Sprites/Frank.png",
        spritesEnemy: "Sprites/Frank Enemy.png"
    },
    // Mika (Raikou #243) - Calm Mind
    {
        id: 243,
        cryptoIndex: 42,
        name: "Mika",
        types: ["Electric"],
        stats: { hp: 287, attack: 176, defense: 186, spAttack: 329, spDefense: 236, speed: 361 },
        moves: ["node-strike", "shadow-chain", "oracle-boost", "hp-chill"],
        spritesFront: "Sprites/Mika.png",
        spritesBack: "Sprites/Mika.png",
        spritesEnemy: "Sprites/Mika Enemy.png"
    },
    // Andreessen (Heracross #214) - Choice Scarf
    {
        id: 214,
        cryptoIndex: 43,
        name: "Andreessen",
        types: ["Bug", "Brawler"],
        stats: { hp: 267, attack: 349, defense: 186, spAttack: 86, spDefense: 226, speed: 269 },
        moves: ["bug-horn", "brawl-crash", "diamond-edge", "revenge-rug"],
        spritesFront: "Sprites/Andreessen.png",
        spritesBack: "Sprites/Andreessen.png",
        spritesEnemy: "Sprites/Andreessen Enemy.png"
    },
    // Stacy (Cresselia #488) - Calm Mind Wall
    {
        id: 488,
        cryptoIndex: 44,
        name: "Stacy",
        types: ["Oracle"],
        stats: { hp: 444, attack: 140, defense: 339, spAttack: 166, spDefense: 297, speed: 188 },
        moves: ["oracle-blast", "chill-ray", "deep-chill", "oracle-boost"],
        spritesFront: "Sprites/Stacy.png",
        spritesBack: "Sprites/Stacy.png",
        spritesEnemy: "Sprites/Stacy Enemy.png"
    },
    // WallStreet (Smeargle #235) - Spore Lead
    {
        id: 235,
        cryptoIndex: 45,
        name: "WallStreet",
        types: ["HODLers"],
        stats: { hp: 318, attack: 46, defense: 107, spAttack: 46, spDefense: 126, speed: 249 },
        moves: ["sleep-scam", "fud-taunt", "speed-moon", "rug-pull"],
        spritesFront: "Sprites/Wallstreet.png",
        spritesBack: "Sprites/Wallstreet.png",
        spritesEnemy: "Sprites/Wallstreet Enemy.png"
    },
    // Scrooge (Gastrodon #423) - Bulky Water
    {
        id: 423,
        cryptoIndex: 46,
        name: "Scrooge",
        types: ["Liquid", "Based"],
        stats: { hp: 426, attack: 202, defense: 172, spAttack: 317, spDefense: 201, speed: 95 },
        moves: ["liquid-surf", "base-surge", "chill-ray", "hodl-fork"],
        spritesFront: "Sprites/Scrooge.png",
        spritesBack: "Sprites/Scrooge.png",
        spritesEnemy: "Sprites/Scrooge Enemy.png"
    },
    // Toly (Gallade #475) - Swords Dance
    {
        id: 475,
        cryptoIndex: 47,
        name: "Toly",
        types: ["Oracle", "Brawler"],
        stats: { hp: 243, attack: 349, defense: 166, spAttack: 166, spDefense: 266, speed: 259 },
        moves: ["brawl-crash", "oracle-head", "chill-punch", "blade-boost"],
        spritesFront: "Sprites/Toly.png",
        spritesBack: "Sprites/Toly.png",
        spritesEnemy: "Sprites/Toly Enemy.png"
    },
    // BIG CUZ (Weavile #461) - Physical Sweeper
    {
        id: 461,
        cryptoIndex: 48,
        name: "BIG CUZ",
        types: ["Night", "Chill"],
        stats: { hp: 247, attack: 339, defense: 166, spAttack: 95, spDefense: 206, speed: 383 },
        moves: ["chill-shard", "revenge-rug", "night-slash", "chill-punch"],
        spritesFront: "Sprites/BIG CUZ.png",
        spritesBack: "Sprites/BIG CUZ.png",
        spritesEnemy: "Sprites/BIG CUZ Enemy.png"
    },
    // Pranksy (Crobat #169) - Fast Support
    {
        id: 169,
        cryptoIndex: 49,
        name: "Pranksy",
        types: ["Poison", "Airdrop"],
        stats: { hp: 350, attack: 278, defense: 196, spAttack: 176, spDefense: 196, speed: 361 },
        moves: ["crash-down", "pivot-flip", "chill-perch", "fud-taunt"],
        spritesFront: "Sprites/Pranksy.png",
        spritesBack: "Sprites/Pranksy.png",
        spritesEnemy: "Sprites/Pranksy Enemy.png"
    },
    // Bundler (Qwilfish #211) - Spikes Lead
    {
        id: 211,
        cryptoIndex: 50,
        name: "Bundler",
        types: ["Liquid", "Poison"],
        stats: { hp: 334, attack: 228, defense: 206, spAttack: 146, spDefense: 146, speed: 269 },
        moves: ["fud-taunt", "rug-pull", "liquid-climb", "toxic-jab"],
        spritesFront: "Sprites/Bundler.png",
        spritesBack: "Sprites/Bundler.png",
        spritesEnemy: "Sprites/Bundler Enemy.png"
    },
    // Bitboy (Jolteon #135) - Special Sweeper
    {
        id: 135,
        cryptoIndex: 51,
        name: "Bitboy",
        types: ["Electric"],
        stats: { hp: 237, attack: 135, defense: 156, spAttack: 319, spDefense: 226, speed: 394 },
        moves: ["node-strike", "shadow-chain", "hp-yield", "pivot-flip"],
        spritesFront: "Sprites/Bitboy.png",
        spritesBack: "Sprites/Bitboy.png",
        spritesEnemy: "Sprites/Bitboy Enemy.png"
    },
    // Yield Farm (Ludicolo #272) - Rain Sweeper
    {
        id: 272,
        cryptoIndex: 52,
        name: "Yield Farm",
        types: ["Liquid", "Grass"],
        stats: { hp: 267, attack: 146, defense: 176, spAttack: 313, spDefense: 236, speed: 239 },
        moves: ["liquid-surf", "chill-ray", "yield-ball", "brawl-blast"],
        spritesFront: "Sprites/Yield Farm.png",
        spritesBack: "Sprites/Yield Farm.png",
        spritesEnemy: "Sprites/Yield Farm Enemy.png"
    },
    // PNUT (Shaymin #492) - Special Attacker
    {
        id: 492,
        cryptoIndex: 53,
        name: "PNUT",
        types: ["Grass"],
        stats: { hp: 307, attack: 196, defense: 236, spAttack: 299, spDefense: 236, speed: 328 },
        moves: ["yield-ball", "base-surge", "hp-pump", "deep-chill"],
        spritesFront: "Sprites/PNUT.png",
        spritesBack: "Sprites/PNUT.png",
        spritesEnemy: "Sprites/PNUT Enemy.png"
    },
    // White Whale (Tentacruel #73) - Rapid Spinner
    {
        id: 73,
        cryptoIndex: 54,
        name: "White Whale",
        types: ["Liquid", "Poison"],
        stats: { hp: 364, attack: 156, defense: 166, spAttack: 197, spDefense: 276, speed: 328 },
        moves: ["liquid-surge", "gas-fee", "hodl-fork", "chill-ray"],
        spritesFront: "Sprites/White Whale.png",
        spritesBack: "Sprites/White Whale.png",
        spritesEnemy: "Sprites/White Whale Enemy.png"
    },
    // Nietzschean (Vaporeon #134) - Wish Support
    {
        id: 134,
        cryptoIndex: 55,
        name: "Nietzschean",
        types: ["Liquid"],
        stats: { hp: 464, attack: 130, defense: 219, spAttack: 246, spDefense: 227, speed: 148 },
        moves: ["liquid-surf", "chill-ray", "hodl-fork", "hodl-guard"],
        spritesFront: "Sprites/Nietzschean.png",
        spritesBack: "Sprites/Nietzschean.png",
        spritesEnemy: "Sprites/Nietzschean Enemy.png"
    },
    // Mikol (Moltres #146) - Life Orb
    {
        id: 146,
        cryptoIndex: 56,
        name: "Mikol",
        types: ["Pump", "Airdrop"],
        stats: { hp: 287, attack: 206, defense: 216, spAttack: 349, spDefense: 206, speed: 279 },
        moves: ["pump-blast", "airdrop-slash", "chill-perch", "hp-yield"],
        spritesFront: "Sprites/Mikol.png",
        spritesBack: "Sprites/Mikol.png",
        spritesEnemy: "Sprites/Mikol Enemy.png"
    },
    // Ace (Hariyama #297) - Bulky Attacker
    {
        id: 297,
        cryptoIndex: 57,
        name: "Ace",
        types: ["Brawler"],
        stats: { hp: 492, attack: 394, defense: 158, spAttack: 86, spDefense: 156, speed: 116 },
        moves: ["brawl-crash", "solid-punch", "chill-punch", "flinch-scam"],
        spritesFront: "Sprites/Ace.png",
        spritesBack: "Sprites/Ace.png",
        spritesEnemy: "Sprites/Ace Enemy.png"
    },
    // Bullish (RegiSolid #379) - Tank
    {
        id: 379,
        cryptoIndex: 58,
        name: "Bullish",
        types: ["Solid"],
        stats: { hp: 364, attack: 186, defense: 336, spAttack: 156, spDefense: 399, speed: 138 },
        moves: ["vault-ram", "rug-pull", "deep-chill", "zap-lock"],
        spritesFront: "Sprites/Bullish.png",
        spritesBack: "Sprites/Bullish.png",
        spritesEnemy: "Sprites/Bullish Enemy.png"
    },
    // Hash (Kabutops #141) - Swords Dance
    {
        id: 141,
        cryptoIndex: 59,
        name: "Hash",
        types: ["Rockstar", "Liquid"],
        stats: { hp: 227, attack: 329, defense: 246, spAttack: 166, spDefense: 176, speed: 259 },
        moves: ["diamond-edge", "liquid-climb", "liquid-jet", "blade-boost"],
        spritesFront: "Sprites/Hash.png",
        spritesBack: "Sprites/Hash.png",
        spritesEnemy: "Sprites/Hash Enemy.png"
    },
    // Alpha (Cloyster #91) - Physical Wall
    {
        id: 91,
        cryptoIndex: 60,
        name: "Alpha",
        types: ["Liquid", "Chill"],
        stats: { hp: 314, attack: 228, defense: 496, spAttack: 186, spDefense: 95, speed: 158 },
        moves: ["chill-spear", "rock-blast", "hodl-fork", "rug-pull"],
        spritesFront: "Sprites/Alpha.png",
        spritesBack: "Sprites/Alpha.png",
        spritesEnemy: "Sprites/Alpha Enemy.png"
    },
    // Yazan (Camerupt #323) - Trick Room
    {
        id: 323,
        cryptoIndex: 61,
        name: "Yazan",
        types: ["Pump", "Based"],
        stats: { hp: 344, attack: 226, defense: 176, spAttack: 343, spDefense: 187, speed: 72 },
        moves: ["pump-blast", "base-surge", "rug-pull", "fud-taunt"],
        spritesFront: "Sprites/Yazan.png",
        spritesBack: "Sprites/Yazan.png",
        spritesEnemy: "Sprites/Yazan Enemy.png"
    },
    // JChains (Hitmontop #237) - Rapid Spinner
    {
        id: 237,
        cryptoIndex: 62,
        name: "JChains",
        types: ["Brawler"],
        stats: { hp: 314, attack: 327, defense: 226, spAttack: 75, spDefense: 257, speed: 158 },
        moves: ["brawl-crash", "pri-brawl", "hodl-fork", "diamond-edge"],
        spritesFront: "Sprites/JChains.png",
        spritesBack: "Sprites/JChains.png",
        spritesEnemy: "Sprites/JChains Enemy.png"
    },
    // Threadguy (Cradily #346) - Tank
    {
        id: 346,
        cryptoIndex: 63,
        name: "Threadguy",
        types: ["Rockstar", "Grass"],
        stats: { hp: 376, attack: 198, defense: 230, spAttack: 169, spDefense: 315, speed: 124 },
        moves: ["yield-bomb", "diamond-edge", "hodl-fork", "fud-taunt"],
        spritesFront: "Sprites/Threadguy.png",
        spritesBack: "Sprites/Threadguy.png",
        spritesEnemy: "Sprites/Threadguy Enemy.png"
    },
    // Altstein (Omastar #139) - Rain Sweeper
    {
        id: 139,
        cryptoIndex: 64,
        name: "Altstein",
        types: ["Rockstar", "Liquid"],
        stats: { hp: 247, attack: 126, defense: 286, spAttack: 363, spDefense: 176, speed: 209 },
        moves: ["liquid-surge", "chill-ray", "liquid-surf", "fud-taunt"],
        spritesFront: "Sprites/Altstein.png",
        spritesBack: "Sprites/Altstein.png",
        spritesEnemy: "Sprites/Altstein Enemy.png"
    },
    // Cozy (Mesprit #481) - Lead
    {
        id: 481,
        cryptoIndex: 65,
        name: "Cozy",
        types: ["Oracle"],
        stats: { hp: 364, attack: 216, defense: 246, spAttack: 247, spDefense: 246, speed: 259 },
        moves: ["oracle-blast", "chill-ray", "pivot-flip", "fud-taunt"],
        spritesFront: "Sprites/Cozy.png",
        spritesBack: "Sprites/Cozy.png",
        spritesEnemy: "Sprites/Cozy Enemy.png"
    },
    // Heavy (Venusaur #3) - Sleep Powder
    {
        id: 3,
        cryptoIndex: 66,
        name: "Heavy",
        types: ["Grass", "Poison"],
        stats: { hp: 364, attack: 170, defense: 202, spAttack: 333, spDefense: 237, speed: 178 },
        moves: ["sleep-scam-75", "yield-storm", "toxic-blast", "rug-pull"],
        spritesFront: "Sprites/Heavy.png",
        spritesBack: "Sprites/Heavy.png",
        spritesEnemy: "Sprites/Heavy Enemy.png"
    },
    // Drainer (Yanmega #469) - Speed Boost
    {
        id: 469,
        cryptoIndex: 67,
        name: "Drainer",
        types: ["Bug", "Airdrop"],
        stats: { hp: 279, attack: 168, defense: 208, spAttack: 365, spDefense: 128, speed: 289 },
        moves: ["exploit-buzz", "airdrop-slash", "pivot-flip", "hp-pump"],
        spritesFront: "Sprites/Drainer.png",
        spritesBack: "Sprites/Drainer.png",
        spritesEnemy: "Sprites/Drainer Enemy.png"
    },
    // Gake (Feraligatr #160) - Dragon Dance
    {
        id: 160,
        cryptoIndex: 68,
        name: "Gake",
        types: ["Liquid"],
        stats: { hp: 277, attack: 309, defense: 236, spAttack: 176, spDefense: 202, speed: 255 },
        moves: ["liquid-climb", "liquid-jet", "chill-punch", "whale-pump"],
        spritesFront: "Sprites/Gake.png",
        spritesBack: "Sprites/Gake.png",
        spritesEnemy: "Sprites/Gake Enemy.png"
    },
    // Armstrong (Claydol #344) - Spinner
    {
        id: 344,
        cryptoIndex: 69,
        name: "Armstrong",
        types: ["Based", "Oracle"],
        stats: { hp: 324, attack: 140, defense: 309, spAttack: 156, spDefense: 277, speed: 168 },
        moves: ["base-surge", "chill-ray", "hodl-fork", "fud-taunt"],
        spritesFront: "Sprites/Armstrong.png",
        spritesBack: "Sprites/Armstrong.png",
        spritesEnemy: "Sprites/Armstrong Enemy.png"
    },
    // Oates (Snorlax #143) - Curse
    {
        id: 143,
        cryptoIndex: 70,
        name: "Oates",
        types: ["HODLers"],
        stats: { hp: 524, attack: 356, defense: 166, spAttack: 136, spDefense: 257, speed: 66 },
        moves: ["para-slam", "rug-pull", "rug-bite", "deep-chill"],
        spritesFront: "Sprites/Oates.png",
        spritesBack: "Sprites/Oates.png",
        spritesEnemy: "Sprites/Oates Enemy.png"
    },
    // Faucet (Staraptor #398) - Choice Band
    {
        id: 398,
        cryptoIndex: 71,
        name: "Faucet",
        types: ["HODLers", "Airdrop"],
        stats: { hp: 277, attack: 339, defense: 176, spAttack: 106, spDefense: 156, speed: 299 },
        moves: ["crash-down", "brawl-crash", "pivot-flip", "hodl-slam"],
        spritesFront: "Sprites/Faucet.png",
        spritesBack: "Sprites/Faucet.png",
        spritesEnemy: "Sprites/Faucet Enemy.png"
    },
    // Zesty (Umbreon #197) - Wish Support
    {
        id: 197,
        cryptoIndex: 72,
        name: "Zesty",
        types: ["Night"],
        stats: { hp: 394, attack: 166, defense: 256, spAttack: 118, spDefense: 361, speed: 168 },
        moves: ["payback-rug", "gas-fee", "deep-chill", "hodl-guard"],
        spritesFront: "Sprites/Zesty.png",
        spritesBack: "Sprites/Zesty.png",
        spritesEnemy: "Sprites/Zesty Enemy.png"
    },
    // Toony (Steelix #208) - Physical Wall
    {
        id: 208,
        cryptoIndex: 73,
        name: "Toony",
        types: ["Solid", "Based"],
        stats: { hp: 354, attack: 206, defense: 436, spAttack: 115, spDefense: 194, speed: 98 },
        moves: ["rug-pull", "diamond-edge", "rug-bite", "fud-taunt"],
        spritesFront: "Sprites/Toony.png",
        spritesBack: "Sprites/Toony.png",
        spritesEnemy: "Sprites/Toony Enemy.png"
    },
    // Donnie (Spiritomb #442) - Defensive
    {
        id: 442,
        cryptoIndex: 74,
        name: "Donnie",
        types: ["Shadow", "Night"],
        stats: { hp: 314, attack: 184, defense: 315, spAttack: 189, spDefense: 253, speed: 86 },
        moves: ["shadow-chain", "night-pulse", "burn-wick", "deep-chill"],
        spritesFront: "Sprites/Donnie.png",
        spritesBack: "Sprites/Donnie.png",
        spritesEnemy: "Sprites/Donnie Enemy.png"
    },
    // Sir Doge (Azumarill #184) - Belly Drum
    {
        id: 184,
        cryptoIndex: 75,
        name: "Sir Doge",
        types: ["Liquid", "Dog"],
        stats: { hp: 404, attack: 200, defense: 196, spAttack: 136, spDefense: 197, speed: 116 },
        moves: ["liquid-climb", "liquid-jet", "chill-punch", "hodl-slam"],
        spritesFront: "Sprites/Sir Doge.png",
        spritesBack: "Sprites/Sir Doge.png",
        spritesEnemy: "Sprites/Sir Doge Enemy.png"
    },
    // ETF (Porygon2 #233) - Trick Room
    {
        id: 233,
        cryptoIndex: 76,
        name: "ETF",
        types: ["HODLers"],
        stats: { hp: 374, attack: 176, defense: 216, spAttack: 343, spDefense: 227, speed: 108 },
        moves: ["chill-ray", "node-strike", "hodl-fork", "zap-lock"],
        spritesFront: "Sprites/ETF.png",
        spritesBack: "Sprites/ETF.png",
        spritesEnemy: "Sprites/ETF Enemy.png"
    },
    // Vitalik (Honchkrow #430) - Mixed Attacker
    {
        id: 430,
        cryptoIndex: 77,
        name: "Vitalik",
        types: ["Night", "Airdrop"],
        stats: { hp: 306, attack: 349, defense: 110, spAttack: 247, spDefense: 110, speed: 241 },
        moves: ["revenge-rug", "crash-down", "power-brawl", "pump-wave"],
        spritesFront: "Sprites/Vitalik.png",
        spritesBack: "Sprites/Vitalik.png",
        spritesEnemy: "Sprites/Vitalik Enemy.png"
    },
    // Tima (Slowbro #80) - Physical Wall
    {
        id: 80,
        cryptoIndex: 78,
        name: "Tima",
        types: ["Liquid", "Oracle"],
        stats: { hp: 394, attack: 151, defense: 319, spAttack: 226, spDefense: 197, speed: 66 },
        moves: ["liquid-surf", "oracle-blast", "lazy-fork", "zap-lock"],
        spritesFront: "Sprites/Tima.png",
        spritesBack: "Sprites/Tima.png",
        spritesEnemy: "Sprites/Tima Enemy.png"
    },
    // Mother (Walrein #365) - Bulky
    {
        id: 365,
        cryptoIndex: 79,
        name: "Mother",
        types: ["Chill", "Liquid"],
        stats: { hp: 424, attack: 176, defense: 216, spAttack: 323, spDefense: 217, speed: 148 },
        moves: ["chill-ray", "liquid-surf", "gas-fee", "hodl-guard"],
        spritesFront: "Sprites/Mother.png",
        spritesBack: "Sprites/Mother.png",
        spritesEnemy: "Sprites/Mother Enemy.png"
    },
    // Bankman (Dusknoir #477) - Spinblocker
    {
        id: 477,
        cryptoIndex: 80,
        name: "Bankman",
        types: ["Shadow"],
        stats: { hp: 294, attack: 238, defense: 406, spAttack: 146, spDefense: 306, speed: 106 },
        moves: ["shadow-sneak", "rug-pull", "chill-punch", "burn-wick"],
        spritesFront: "Sprites/Bankman.png",
        spritesBack: "Sprites/Bankman.png",
        spritesEnemy: "Sprites/Bankman Enemy.png"
    },
    // Colombo (Electivire #466) - Mixed Attacker
    {
        id: 466,
        cryptoIndex: 81,
        name: "Colombo",
        types: ["Electric"],
        stats: { hp: 257, attack: 345, defense: 170, spAttack: 226, spDefense: 206, speed: 289 },
        moves: ["node-strike", "chop-brawl", "chill-punch", "rug-pull"],
        spritesFront: "Sprites/Colombo.png",
        spritesBack: "Sprites/Colombo.png",
        spritesEnemy: "Sprites/Colombo Enemy.png"
    },
    // Max Bidder (Porygon-Z #474) - Nasty Plot
    {
        id: 474,
        cryptoIndex: 82,
        name: "Max Bidder",
        types: ["HODLers"],
        stats: { hp: 277, attack: 176, defense: 176, spAttack: 369, spDefense: 186, speed: 279 },
        moves: ["random-mint", "chill-ray", "node-strike", "plot-pump"],
        spritesFront: "Sprites/Max Bidder.png",
        spritesBack: "Sprites/Max Bidder.png",
        spritesEnemy: "Sprites/Max Bidder Enemy.png"
    },
    // Orangie (Articuno #144) - Defensive
    {
        id: 144,
        cryptoIndex: 83,
        name: "Orangie",
        types: ["Chill", "Airdrop"],
        stats: { hp: 384, attack: 176, defense: 236, spAttack: 227, spDefense: 350, speed: 188 },
        moves: ["chill-ray", "chill-perch", "gas-fee", "hp-yield"],
        spritesFront: "Sprites/Orangie.png",
        spritesBack: "Sprites/Orangie.png",
        spritesEnemy: "Sprites/Orangie Enemy.png"
    },
    // Nicky (Flareon #136) - Physical Attacker
    {
        id: 136,
        cryptoIndex: 84,
        name: "Nicky",
        types: ["Pump"],
        stats: { hp: 237, attack: 394, defense: 156, spAttack: 195, spDefense: 256, speed: 199 },
        moves: ["pump-blitz", "power-brawl", "quick-moon", "night-bite"],
        spritesFront: "Sprites/Nicky.png",
        spritesBack: "Sprites/Nicky.png",
        spritesEnemy: "Sprites/Nicky Enemy.png"
    },
    // Lunix (Espeon #196) - Baton Pass
    {
        id: 196,
        cryptoIndex: 85,
        name: "Lunix",
        types: ["Oracle"],
        stats: { hp: 237, attack: 135, defense: 156, spAttack: 359, spDefense: 226, speed: 350 },
        moves: ["oracle-blast", "shadow-chain", "oracle-boost", "pivot-flip"],
        spritesFront: "Sprites/Lunix.png",
        spritesBack: "Sprites/Lunix.png",
        spritesEnemy: "Sprites/Lunix Enemy.png"
    },
    // Martin (Leafeon #470) - Swords Dance
    {
        id: 470,
        cryptoIndex: 86,
        name: "Martin",
        types: ["Grass"],
        stats: { hp: 237, attack: 319, defense: 296, spAttack: 156, spDefense: 166, speed: 289 },
        moves: ["yield-blade", "bug-scissor", "blade-boost", "hodl-slam"],
        spritesFront: "Sprites/Martin.png",
        spritesBack: "Sprites/Martin.png",
        spritesEnemy: "Sprites/Martin Enemy.png"
    },
    // Q (Glaceon #471) - Choice Specs
    {
        id: 471,
        cryptoIndex: 87,
        name: "Q",
        types: ["Chill"],
        stats: { hp: 237, attack: 126, defense: 256, spAttack: 394, spDefense: 226, speed: 199 },
        moves: ["chill-ray", "shadow-chain", "hp-yield", "liquid-pulse"],
        spritesFront: "Sprites/Q.png",
        spritesBack: "Sprites/Q.png",
        spritesEnemy: "Sprites/Q Enemy.png"
    },
    // Miner (Lanturn #171) - Bulky Water
    {
        id: 171,
        cryptoIndex: 88,
        name: "Miner",
        types: ["Liquid", "Electric"],
        stats: { hp: 454, attack: 122, defense: 152, spAttack: 285, spDefense: 189, speed: 152 },
        moves: ["node-strike", "liquid-surf", "chill-ray", "zap-lock"],
        spritesFront: "Sprites/Miner.png",
        spritesBack: "Sprites/Miner.png",
        spritesEnemy: "Sprites/Miner Enemy.png"
    },
    // Davis (Rotom #479) - Choice Scarf
    {
        id: 479,
        cryptoIndex: 89,
        name: "Davis",
        types: ["Electric", "Shadow"],
        stats: { hp: 207, attack: 106, defense: 190, spAttack: 289, spDefense: 190, speed: 281 },
        moves: ["node-strike", "shadow-chain", "hp-chill", "fud-taunt"],
        spritesFront: "Sprites/Davis.png",
        spritesBack: "Sprites/Davis.png",
        spritesEnemy: "Sprites/Davis Enemy.png"
    },
    // Gordon (Salamence #373) - Dragon Dance
    {
        id: 373,
        cryptoIndex: 90,
        name: "Gordon",
        types: ["Dragon", "Airdrop"],
        stats: { hp: 297, attack: 369, defense: 196, spAttack: 246, spDefense: 196, speed: 299 },
        moves: ["whale-rage", "rug-pull", "pump-blast", "whale-pump"],
        spritesFront: "Sprites/Gordon.png",
        spritesBack: "Sprites/Gordon.png",
        spritesEnemy: "Sprites/Gordon Enemy.png"
    },
    // Ansem (Garchomp #445) - Swords Dance
    {
        id: 445,
        cryptoIndex: 91,
        name: "Ansem",
        types: ["Dragon", "Based"],
        stats: { hp: 323, attack: 359, defense: 226, spAttack: 176, spDefense: 206, speed: 303 },
        moves: ["whale-rage", "rug-pull", "diamond-edge", "blade-boost"],
        spritesFront: "Sprites/Ansem.png",
        spritesBack: "Sprites/Ansem.png",
        spritesEnemy: "Sprites/Ansem Enemy.png"
    },
    // Niki (Deoxys-Speed #386) - Lead
    {
        id: 386,
        cryptoIndex: 92,
        name: "Niki",
        types: ["Oracle"],
        stats: { hp: 207, attack: 196, defense: 216, spAttack: 289, spDefense: 216, speed: 504 },
        moves: ["oracle-blast", "power-brawl", "chill-ray", "fud-taunt"],
        spritesFront: "Sprites/Niki.png",
        spritesBack: "Sprites/Niki.png",
        spritesEnemy: "Sprites/Niki Enemy.png"
    },
    // WASO BEECONNEE (Mew #151) - All Rounder
    {
        id: 151,
        cryptoIndex: 93,
        name: "WASO BEECONNEE",
        types: ["Oracle"],
        stats: { hp: 404, attack: 196, defense: 236, spAttack: 237, spDefense: 236, speed: 328 },
        moves: ["oracle-blast", "pump-blast", "chill-ray", "egg-fork"],
        spritesFront: "Sprites/WASO BEECONNEE.png",
        spritesBack: "Sprites/WASO BEECONNEE.png",
        spritesEnemy: "Sprites/WASO BEECONNEE Enemy.png"
    },
    // 36 (Latios #381) - Choice Specs
    {
        id: 381,
        cryptoIndex: 94,
        name: "36",
        types: ["Dragon", "Oracle"],
        stats: { hp: 267, attack: 186, defense: 196, spAttack: 359, spDefense: 256, speed: 350 },
        moves: ["whale-meteor", "liquid-surf", "node-strike", "oracle-blast"],
        spritesFront: "Sprites/36.png",
        spritesBack: "Sprites/36.png",
        spritesEnemy: "Sprites/36 Enemy.png"
    },
    // Liberty (Rayquaza #384) - Dragon Dance
    {
        id: 384,
        cryptoIndex: 95,
        name: "Liberty",
        types: ["Dragon", "Airdrop"],
        stats: { hp: 317, attack: 399, defense: 216, spAttack: 336, spDefense: 216, speed: 289 },
        moves: ["whale-rage", "speed-moon", "rug-pull", "whale-pump"],
        spritesFront: "Sprites/Liberty.png",
        spritesBack: "Sprites/Liberty.png",
        spritesEnemy: "Sprites/Liberty Enemy.png"
    }
];

module.exports = FIGHTER_DATA;
