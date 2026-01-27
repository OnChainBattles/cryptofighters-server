const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || './data';
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');

class PlayerStorage {
  constructor() {
    this.players = {};
    this.load();
  }

  load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(PLAYERS_FILE)) {
        const data = fs.readFileSync(PLAYERS_FILE, 'utf8');
        this.players = JSON.parse(data);
        console.log(`[STORAGE] Loaded ${Object.keys(this.players).length} player profiles`);
      }
    } catch (err) {
      console.error('[STORAGE] Error loading:', err.message);
      this.players = {};
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PLAYERS_FILE, JSON.stringify(this.players, null, 2));
    } catch (err) {
      console.error('[STORAGE] Error saving:', err.message);
    }
  }

  getPlayer(wallet) {
    return this.players[wallet] || null;
  }

  savePlayer(wallet, settings) {
    if (!wallet || wallet.length < 32) {
      throw new Error('Invalid wallet address');
    }

    const existing = this.players[wallet] || {
      wallet,
      createdAt: Date.now()
    };

    this.players[wallet] = {
      ...existing,
      ...settings,
      wallet,
      updatedAt: Date.now()
    };

    this.save();
    return this.players[wallet];
  }

  getSetting(wallet, key) {
    const player = this.players[wallet];
    return player ? player[key] : undefined;
  }

  setSetting(wallet, key, value) {
    if (!this.players[wallet]) {
      this.players[wallet] = {
        wallet,
        createdAt: Date.now()
      };
    }

    this.players[wallet][key] = value;
    this.players[wallet].updatedAt = Date.now();
    this.save();
  }

  getStats() {
    return {
      totalPlayers: Object.keys(this.players).length
    };
  }
}

module.exports = PlayerStorage;
