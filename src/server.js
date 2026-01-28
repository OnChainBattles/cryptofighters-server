const express = require('express');
const http = require('http');
const crypto = require('crypto');
const { Server } = require('socket.io');
const cors = require('cors');
const nacl = require('tweetnacl');
const { PublicKey } = require('@solana/web3.js');
const BattleManager = require('./BattleManager');
const { validateTeam } = require('./BattleManager');
const LobbyManager = require('./LobbyManager');
const PlayerStorage = require('./PlayerStorage');

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://cryptofighters.onchainbattles.games';
const PROGRAM_ID = process.env.PROGRAM_ID || 'PLACEHOLDER';
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const IS_DEV = process.env.NODE_ENV === 'development';

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = IS_DEV
  ? [FRONTEND_URL, 'http://localhost:5500', 'http://127.0.0.1:5500']
  : [FRONTEND_URL];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const lobbyManager = new LobbyManager();
const battleManager = new BattleManager(io, lobbyManager);
const playerStorage = new PlayerStorage();

// Run lobby cleanup every 60 seconds to remove stale lobbies
setInterval(() => lobbyManager.cleanup(), 60000);

// Verified session tokens: token -> walletAddress (set on successful auth_verify)
const sessionTokens = new Map();

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    name: 'CryptoFighters Battle Server',
    version: '1.0.0',
    lobbies: lobbyManager.getStats(),
    battles: battleManager.getStats()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.get('/lobbies', (req, res) => {
  res.json(lobbyManager.getOpenLobbies());
});

app.get('/player/:wallet', (req, res) => {
  const { wallet } = req.params;

  if (!wallet || wallet.length < 32) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const player = playerStorage.getPlayer(wallet);

  if (!player) {
    return res.json({
      wallet,
      exists: false,
      displayName: null,
      teams: null,
      colorPalette: null,
      settings: null
    });
  }

  res.json({
    ...player,
    exists: true
  });
});

app.post('/player/:wallet', (req, res) => {
  const { wallet } = req.params;
  const settings = req.body;

  if (!wallet || wallet.length < 32) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  // Verify session token matches the wallet
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || sessionTokens.get(token) !== wallet) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const allowedFields = ['displayName', 'teams', 'colorPalette', 'settings'];
    const filteredSettings = {};

    for (const key of allowedFields) {
      if (settings[key] !== undefined) {
        filteredSettings[key] = settings[key];
      }
    }

    // M12: Sanitize displayName - max 20 chars, strip HTML, alphanumeric + spaces only
    if (filteredSettings.displayName !== undefined) {
      if (typeof filteredSettings.displayName !== 'string') {
        return res.status(400).json({ error: 'displayName must be a string' });
      }
      filteredSettings.displayName = filteredSettings.displayName
        .replace(/<[^>]*>/g, '')
        .replace(/[^a-zA-Z0-9 _-]/g, '')
        .trim()
        .slice(0, 20);
    }

    const saved = playerStorage.savePlayer(wallet, filteredSettings);
    console.log(`[STORAGE] Saved settings for ${wallet.slice(0, 8)}...`);

    res.json({
      success: true,
      player: saved
    });
  } catch (err) {
    console.error(`[STORAGE] Error saving:`, err.message);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// C2: RPC proxy - hides Helius API key from client-side code
app.post('/rpc', async (req, res) => {
  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[RPC PROXY] Error:', err.message);
    res.status(502).json({ error: 'RPC request failed' });
  }
});

// Simple per-socket rate limiter: max 30 events per 10 seconds
io.on('connection', (socket) => {
  console.log(`[CONNECT] ${socket.id}`);

  const rateLimit = { count: 0, resetAt: Date.now() + 10000 };
  const originalEmit = socket.onevent;
  socket.onevent = function (packet) {
    const now = Date.now();
    if (now > rateLimit.resetAt) {
      rateLimit.count = 0;
      rateLimit.resetAt = now + 10000;
    }
    rateLimit.count++;
    if (rateLimit.count > 30) {
      console.log(`[RATE] Socket ${socket.id} rate limited`);
      return; // Drop the event
    }
    originalEmit.call(socket, packet);
  };

  // Step 1: Client sends wallet address, server sends back a challenge nonce
  socket.on('authenticate', (data) => {
    const { walletAddress } = data;
    if (!walletAddress) {
      socket.emit('error', { message: 'Wallet address required' });
      return;
    }

    // Generate random nonce for signature challenge
    const nonce = crypto.randomBytes(32).toString('hex');
    socket.authNonce = nonce;
    socket.pendingWallet = walletAddress;

    console.log(`[AUTH] Challenge sent to ${walletAddress.slice(0, 8)}...`);
    socket.emit('auth_challenge', { nonce });
  });

  // Step 2: Client signs the nonce with their wallet and sends signature back
  socket.on('auth_verify', (data) => {
    const { signature } = data;
    if (!socket.authNonce || !socket.pendingWallet) {
      socket.emit('error', { message: 'No pending auth challenge' });
      return;
    }

    try {
      const message = new TextEncoder().encode(`CryptoFighters login: ${socket.authNonce}`);
      const sig = Uint8Array.from(Buffer.from(signature, 'base64'));
      const pubkey = new PublicKey(socket.pendingWallet).toBytes();

      if (!nacl.sign.detached.verify(message, sig, pubkey)) {
        console.log(`[AUTH] Signature verification FAILED for ${socket.pendingWallet.slice(0, 8)}...`);
        socket.emit('error', { message: 'Signature verification failed' });
        return;
      }

      // Verified! Set wallet address
      socket.walletAddress = socket.pendingWallet;
      delete socket.authNonce;
      delete socket.pendingWallet;

      // Generate session token for REST API auth (delete old token first to prevent leaks)
      if (socket.sessionToken) {
        sessionTokens.delete(socket.sessionToken);
      }
      const sessionToken = crypto.randomBytes(32).toString('hex');
      sessionTokens.set(sessionToken, socket.walletAddress);
      socket.sessionToken = sessionToken;

      console.log(`[AUTH] Verified ${socket.id} = ${socket.walletAddress.slice(0, 8)}...`);

      const activeBattle = battleManager.findBattleByWallet(socket.walletAddress);
      if (activeBattle) {
        const opponent = activeBattle.getOpponentWallet(socket.walletAddress);
        console.log(`[AUTH] Sending reconnect_available - lobby: ${activeBattle.lobbyId}`);
        socket.emit('reconnect_available', {
          lobbyId: activeBattle.lobbyId,
          opponent: opponent,
          canReconnect: true
        });
      }

      socket.emit('authenticated', { success: true, sessionToken });
    } catch (e) {
      console.error(`[AUTH] Verification error:`, e.message);
      socket.emit('error', { message: 'Authentication failed' });
    }
  });

  socket.on('create_lobby', (data) => {
    console.log(`[LOBBY] create_lobby received from ${socket.id}, wallet: ${socket.walletAddress?.slice(0,8) || 'NONE'}`);

    if (!socket.walletAddress) {
      console.log(`[LOBBY] REJECTED: Not authenticated`);
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    let { lobbyName, wagerAmount, team, onChainLobbyId } = data;

    // Sanitize lobby name: must be string, max 50 chars, strip HTML
    if (typeof lobbyName === 'string') {
      lobbyName = lobbyName.replace(/<[^>]*>/g, '').trim().slice(0, 50);
    }

    console.log(`[LOBBY] Data: name=${lobbyName}, wager=${wagerAmount}, onChainId=${onChainLobbyId}, teamSize=${team?.length}`);

    if (!lobbyName || !wagerAmount || !team) {
      console.log(`[LOBBY] REJECTED: Missing data`);
      socket.emit('error', { message: 'Missing lobby data' });
      return;
    }

    if (typeof wagerAmount !== 'number' || !Number.isFinite(wagerAmount)) {
      console.log(`[LOBBY] REJECTED: Wager not a valid number`);
      socket.emit('error', { message: 'Invalid wager amount' });
      return;
    }

    if (wagerAmount < 5) {
      console.log(`[LOBBY] REJECTED: Wager too low`);
      socket.emit('error', { message: 'Minimum wager is 5 USDC' });
      return;
    }

    if (wagerAmount > 10000) {
      console.log(`[LOBBY] REJECTED: Wager too high`);
      socket.emit('error', { message: 'Maximum wager is 10,000 USDC' });
      return;
    }

    // M11: Validate onChainLobbyId format (hex string, 64 chars)
    if (onChainLobbyId && !/^[a-f0-9]{1,64}$/i.test(onChainLobbyId)) {
      console.log(`[LOBBY] REJECTED: Invalid onChainLobbyId format`);
      socket.emit('error', { message: 'Invalid on-chain lobby ID' });
      return;
    }

    // H9: Validate team before storing (catch bad teams early, before locking wager)
    const teamValidation = validateTeam(team);
    if (!teamValidation.valid) {
      console.log(`[LOBBY] REJECTED: Invalid team - ${teamValidation.error}`);
      socket.emit('error', { message: `Invalid team: ${teamValidation.error}` });
      return;
    }

    const lobby = lobbyManager.createLobby({
      creatorWallet: socket.walletAddress,
      creatorSocketId: socket.id,
      lobbyName,
      wagerAmount,
      creatorTeam: team,
      onChainLobbyId: onChainLobbyId || null
    });

    socket.join(`lobby:${lobby.id}`);
    socket.emit('lobby_created', { lobby: lobby.toPublic() });
    io.emit('lobbies_updated', lobbyManager.getOpenLobbies());

    console.log(`[LOBBY] Created: ${lobby.id} by ${socket.walletAddress.slice(0, 8)}... - ${wagerAmount} USDC, onChain: ${onChainLobbyId}`);
    console.log(`[LOBBY] Total lobbies now: ${lobbyManager.getStats().total}`);
  });

  socket.on('join_lobby', (data) => {
    console.log(`[LOBBY] join_lobby received from ${socket.id}, wallet: ${socket.walletAddress?.slice(0,8) || 'NONE'}`);
    console.log(`[LOBBY] Current lobbies before join: ${lobbyManager.getStats().total}`);

    if (!socket.walletAddress) {
      console.log(`[LOBBY] JOIN REJECTED: Not authenticated`);
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { lobbyId, team } = data;
    console.log(`[LOBBY] Join request for lobbyId: ${lobbyId}, teamSize: ${team?.length}`);

    if (!lobbyId || !team) {
      console.log(`[LOBBY] JOIN REJECTED: Missing data`);
      socket.emit('error', { message: 'Missing join data' });
      return;
    }

    // H9: Validate team before joining (catch bad teams early)
    const teamValidation = validateTeam(team);
    if (!teamValidation.valid) {
      console.log(`[LOBBY] JOIN REJECTED: Invalid team - ${teamValidation.error}`);
      socket.emit('error', { message: `Invalid team: ${teamValidation.error}` });
      return;
    }

    const result = lobbyManager.joinLobby(lobbyId, {
      opponentWallet: socket.walletAddress,
      opponentSocketId: socket.id,
      opponentTeam: team
    });

    if (!result.success) {
      console.log(`[LOBBY] JOIN FAILED: ${result.error}`);
      socket.emit('error', { message: result.error });
      return;
    }

    const lobby = result.lobby;
    console.log(`[LOBBY] Join successful, lobby status: ${lobby.status}`);
    socket.join(`lobby:${lobby.id}`);

    // Notify creator that opponent joined
    io.to(`lobby:${lobby.id}`).emit('opponent_joined', {
      lobbyId: lobby.id,
      opponent: {
        wallet: lobby.opponentWallet,
        displayName: 'Opponent' // Server doesn't have display names, client can format
      }
    });

    io.emit('lobbies_updated', lobbyManager.getOpenLobbies());

    console.log(`[LOBBY] Joined: ${lobby.id} by ${socket.walletAddress.slice(0, 8)}...`);

    // Give clients more time to be ready before starting battle
    setTimeout(() => {
      const currentLobby = lobbyManager.getLobby(lobby.id);
      if (currentLobby && currentLobby.status === 'ready') {
        console.log(`[LOBBY] Starting battle for ${lobby.id}`);
        battleManager.startBattle(currentLobby);
      } else {
        console.log(`[LOBBY] Skipped battle start - lobby ${lobby.id} status: ${currentLobby?.status || 'not found'}`);
      }
    }, 3000);
  });

  socket.on('cancel_lobby', (data) => {
    const { lobbyId } = data;

    const result = lobbyManager.cancelLobby(lobbyId, socket.walletAddress);

    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }

    socket.leave(`lobby:${lobbyId}`);
    socket.emit('lobby_cancelled', { lobbyId });
    io.emit('lobbies_updated', lobbyManager.getOpenLobbies());

    console.log(`[LOBBY] Cancelled: ${lobbyId}`);
  });

  socket.on('get_lobbies', () => {
    socket.emit('lobbies_list', lobbyManager.getOpenLobbies());
  });

  socket.on('select_move', (data) => {
    if (!socket.walletAddress) return;

    const { lobbyId, moveIndex } = data;
    battleManager.submitMove(lobbyId, socket.walletAddress, { type: 'move', moveIndex });
  });

  socket.on('switch_fighter', (data) => {
    if (!socket.walletAddress) return;

    const { lobbyId, fighterIndex } = data;
    battleManager.submitMove(lobbyId, socket.walletAddress, { type: 'switch', fighterIndex });
  });

  // Forced switch after a fighter faints
  socket.on('select_switch', (data) => {
    if (!socket.walletAddress) return;

    const { lobbyId, fighterIndex } = data;
    console.log(`[SWITCH] ${socket.walletAddress.slice(0,8)}... selected fighter ${fighterIndex}`);
    battleManager.submitSwitch(lobbyId, socket.walletAddress, fighterIndex);
  });

  socket.on('forfeit', (data) => {
    if (!socket.walletAddress) return;

    const { lobbyId } = data;
    battleManager.forfeit(lobbyId, socket.walletAddress);
  });

  socket.on('reconnect_battle', (data) => {
    if (!socket.walletAddress) return;

    const { lobbyId } = data;
    const result = battleManager.reconnect(lobbyId, socket.walletAddress, socket.id);

    if (result.success) {
      socket.join(`lobby:${lobbyId}`);
      socket.emit('battle_state', result.battleState);
      console.log(`[RECONNECT] ${socket.walletAddress.slice(0, 8)}... to ${lobbyId}`);
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[DISCONNECT] ${socket.id} - ${reason}`);

    if (socket.sessionToken) {
      sessionTokens.delete(socket.sessionToken);
    }

    if (socket.walletAddress) {
      battleManager.handleDisconnect(socket.walletAddress);
      lobbyManager.handleDisconnect(socket.walletAddress);
      io.emit('lobbies_updated', lobbyManager.getOpenLobbies());
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('===========================================');
  console.log('  CRYPTOFIGHTERS BATTLE SERVER');
  console.log('===========================================');
  console.log(`  Port: ${PORT}`);
  console.log(`  Frontend: ${FRONTEND_URL}`);
  console.log(`  Program: ${PROGRAM_ID.slice(0, 8)}...`);
  console.log('===========================================');
  console.log('');
});

module.exports = { app, server, io };
