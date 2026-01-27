const crypto = require('crypto');

class Lobby {
  constructor(data) {
    this.id = data.id || crypto.randomBytes(16).toString('hex');
    this.creatorWallet = data.creatorWallet;
    this.creatorSocketId = data.creatorSocketId;
    this.creatorTeam = data.creatorTeam;
    this.lobbyName = data.lobbyName;
    this.wagerAmount = data.wagerAmount;
    this.createdAt = Date.now();
    this.onChainLobbyId = data.onChainLobbyId || null;

    this.opponentWallet = null;
    this.opponentSocketId = null;
    this.opponentTeam = null;

    this.status = 'waiting';
  }

  toPublic() {
    return {
      id: this.id,
      lobbyName: this.lobbyName,
      creatorWallet: this.creatorWallet,
      wagerAmount: this.wagerAmount,
      createdAt: this.createdAt,
      status: this.status,
      hasOpponent: !!this.opponentWallet,
      onChainLobbyId: this.onChainLobbyId
    };
  }

  toFull() {
    return {
      id: this.id,
      lobbyName: this.lobbyName,
      wagerAmount: this.wagerAmount,
      creatorWallet: this.creatorWallet,
      creatorSocketId: this.creatorSocketId,
      creatorTeam: this.creatorTeam,
      opponentWallet: this.opponentWallet,
      opponentSocketId: this.opponentSocketId,
      opponentTeam: this.opponentTeam,
      status: this.status,
      onChainLobbyId: this.onChainLobbyId
    };
  }
}

class LobbyManager {
  constructor() {
    this.lobbies = new Map();
    this.walletToLobby = new Map();
  }

  createLobby(data) {
    if (this.walletToLobby.has(data.creatorWallet)) {
      const existingLobbyId = this.walletToLobby.get(data.creatorWallet);
      const existingLobby = this.lobbies.get(existingLobbyId);
      // Only auto-cancel if waiting AND no on-chain funds locked
      if (existingLobby && existingLobby.status === 'waiting' && !existingLobby.onChainLobbyId) {
        this.cancelLobby(existingLobbyId, data.creatorWallet);
      } else if (existingLobby && existingLobby.onChainLobbyId) {
        console.log(`[LOBBY] Existing lobby ${existingLobbyId} has on-chain funds - not auto-cancelling`);
      }
    }

    const lobby = new Lobby(data);
    this.lobbies.set(lobby.id, lobby);
    this.walletToLobby.set(data.creatorWallet, lobby.id);

    return lobby;
  }

  joinLobby(lobbyId, data) {
    const lobby = this.lobbies.get(lobbyId);

    if (!lobby) {
      return { success: false, error: 'Lobby not found' };
    }

    if (lobby.status !== 'waiting') {
      return { success: false, error: 'Lobby is no longer available' };
    }

    if (lobby.creatorWallet === data.opponentWallet) {
      return { success: false, error: 'Cannot join your own lobby' };
    }

    if (this.walletToLobby.has(data.opponentWallet)) {
      const existingLobbyId = this.walletToLobby.get(data.opponentWallet);
      if (existingLobbyId !== lobbyId) {
        const existingLobby = this.lobbies.get(existingLobbyId);
        if (existingLobby && existingLobby.status === 'waiting') {
          this.cancelLobby(existingLobbyId, data.opponentWallet);
        }
      }
    }

    lobby.opponentWallet = data.opponentWallet;
    lobby.opponentSocketId = data.opponentSocketId;
    lobby.opponentTeam = data.opponentTeam;
    lobby.status = 'ready';

    this.walletToLobby.set(data.opponentWallet, lobby.id);

    return { success: true, lobby };
  }

  cancelLobby(lobbyId, walletAddress) {
    const lobby = this.lobbies.get(lobbyId);

    if (!lobby) {
      return { success: false, error: 'Lobby not found' };
    }

    if (lobby.creatorWallet !== walletAddress) {
      return { success: false, error: 'Only creator can cancel' };
    }

    if (lobby.status !== 'waiting') {
      return { success: false, error: 'Cannot cancel - opponent already joined' };
    }

    lobby.status = 'cancelled';
    this.walletToLobby.delete(walletAddress);
    this.lobbies.delete(lobbyId);

    return { success: true };
  }

  getOpenLobbies() {
    const openLobbies = [];
    for (const lobby of this.lobbies.values()) {
      if (lobby.status === 'waiting') {
        openLobbies.push(lobby.toPublic());
      }
    }
    openLobbies.sort((a, b) => b.createdAt - a.createdAt);
    return openLobbies;
  }

  getLobby(lobbyId) {
    return this.lobbies.get(lobbyId);
  }

  getLobbyByWallet(walletAddress) {
    const lobbyId = this.walletToLobby.get(walletAddress);
    if (lobbyId) {
      return this.lobbies.get(lobbyId);
    }
    return null;
  }

  startBattle(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      lobby.status = 'in_battle';
    }
  }

  completeLobby(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      lobby.status = 'completed';
      this.walletToLobby.delete(lobby.creatorWallet);
      this.walletToLobby.delete(lobby.opponentWallet);
      setTimeout(() => {
        this.lobbies.delete(lobbyId);
      }, 60000);
    }
  }

  handleDisconnect(walletAddress) {
    const lobbyId = this.walletToLobby.get(walletAddress);
    if (lobbyId) {
      const lobby = this.lobbies.get(lobbyId);
      // Only auto-cancel if: waiting status, creator disconnected, AND no on-chain funds locked
      // If onChainLobbyId exists, USDC is locked - don't auto-cancel or funds get stuck
      if (lobby && lobby.status === 'waiting' && lobby.creatorWallet === walletAddress && !lobby.onChainLobbyId) {
        this.cancelLobby(lobbyId, walletAddress);
      } else if (lobby && lobby.onChainLobbyId) {
        console.log(`[LOBBY] Creator disconnected but lobby ${lobbyId} has on-chain funds - keeping lobby active`);
      }
    }
  }

  getStats() {
    let waiting = 0;
    let inBattle = 0;

    for (const lobby of this.lobbies.values()) {
      if (lobby.status === 'waiting') waiting++;
      if (lobby.status === 'in_battle') inBattle++;
    }

    return { waiting, inBattle, total: this.lobbies.size };
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000;

    for (const [lobbyId, lobby] of this.lobbies) {
      if (lobby.status === 'waiting' && now - lobby.createdAt > maxAge) {
        console.log(`[CLEANUP] Removing stale lobby: ${lobbyId}`);
        this.walletToLobby.delete(lobby.creatorWallet);
        this.lobbies.delete(lobbyId);
      }
    }
  }
}

module.exports = LobbyManager;
