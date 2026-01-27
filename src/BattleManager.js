const BattleCalculator = require('./BattleCalculator');
const FIGHTER_DATA = require('./fighter-data');
const fs = require('fs');
const path = require('path');

// Build a lookup map for fast validation
const VALID_FIGHTERS = new Map();
FIGHTER_DATA.forEach(f => {
  VALID_FIGHTERS.set(f.name, f);
});

// Build reverse lookup: display name -> kebab-case key
// e.g., "Chill Ray" -> "ice-beam", "Vault Ram" -> "iron-head"
const DISPLAY_NAME_TO_KEY = new Map();
for (const [key, move] of Object.entries(BattleCalculator.MOVE_DATA)) {
  // Map display name to key
  DISPLAY_NAME_TO_KEY.set(move.name.toLowerCase(), key);
  // Also map the kebab-case key to itself
  DISPLAY_NAME_TO_KEY.set(key.toLowerCase(), key);
  // Also map without hyphens/spaces
  DISPLAY_NAME_TO_KEY.set(key.replace(/-/g, '').toLowerCase(), key);
  DISPLAY_NAME_TO_KEY.set(move.name.replace(/\s/g, '').toLowerCase(), key);
}

const TURN_TIMEOUT = 60000;
const SWITCH_TIMEOUT = 30000; // 30 seconds to pick replacement fighter
const DISCONNECT_TIMEOUT = 60000; // 60 seconds to reconnect before forfeit
const MAX_MISSED_TURNS = 2;
const MAX_TURNS = 100; // Prevent infinite battles
const TEAM_SIZE = 3;

// Convert any move name format to kebab-case key
// Handles: "Chill Ray" (display), "ice-beam" (kebab), "icebeam" (normalized)
function getMoveKey(moveName) {
  if (!moveName) return null;
  const normalized = String(moveName).toLowerCase();
  // Try exact match first
  if (DISPLAY_NAME_TO_KEY.has(normalized)) {
    return DISPLAY_NAME_TO_KEY.get(normalized);
  }
  // Try without spaces/hyphens
  const stripped = normalized.replace(/[\s-]/g, '');
  if (DISPLAY_NAME_TO_KEY.has(stripped)) {
    return DISPLAY_NAME_TO_KEY.get(stripped);
  }
  return null;
}

// Validate a fighter against the database
// Client can send moves as display names ("Chill Ray") or kebab-case ("ice-beam")
// Server validates against fighter's allowed move list and stores kebab-case keys
function validateFighter(clientFighter) {
  const validFighter = VALID_FIGHTERS.get(clientFighter.name);
  if (!validFighter) {
    return { valid: false, error: `Unknown fighter: ${clientFighter.name}` };
  }

  // Validate moves - each move must be in the fighter's allowed move list
  const clientMoves = clientFighter.moves || [];
  if (clientMoves.length === 0 || clientMoves.length > 4) {
    return { valid: false, error: `${clientFighter.name} must have 1-4 moves` };
  }

  // Build allowed moves set from server's fighter data (kebab-case keys)
  const allowedMoves = new Set(validFighter.moves.map(m => m.toLowerCase()));

  // Validate each move and convert to kebab-case key
  const validatedMoves = [];
  for (const move of clientMoves) {
    // Extract move name from string or object format
    let moveName;
    if (typeof move === 'string') {
      moveName = move;
    } else if (move && typeof move.name === 'string') {
      moveName = move.name;
    } else {
      console.error('[VALIDATION] Invalid move format:', JSON.stringify(move));
      return { valid: false, error: `${clientFighter.name} has invalid move data` };
    }

    // Convert to kebab-case key (handles "Chill Ray" -> "ice-beam")
    const moveKey = getMoveKey(moveName);
    if (!moveKey) {
      console.error(`[VALIDATION] Unknown move: "${moveName}"`);
      return { valid: false, error: `Unknown move: ${moveName}` };
    }

    // Check if fighter can learn this move
    let finalKey = moveKey.toLowerCase();
    if (!allowedMoves.has(finalKey)) {
      // Handle duplicate display names (e.g., "Sleep Scam" maps to both "sleep-scam" and "sleep-scam-75")
      // Check if any of the fighter's allowed moves share the same display name
      const resolvedDisplayName = BattleCalculator.MOVE_DATA[moveKey]?.name;
      let matchedKey = null;
      if (resolvedDisplayName) {
        for (const allowedKey of allowedMoves) {
          const allowedMove = BattleCalculator.MOVE_DATA[allowedKey];
          if (allowedMove && allowedMove.name === resolvedDisplayName) {
            matchedKey = allowedKey;
            break;
          }
        }
      }
      if (!matchedKey) {
        console.error(`[VALIDATION] ${clientFighter.name} cannot learn ${moveName} (key: ${moveKey})`);
        console.error(`[VALIDATION] Allowed moves: ${Array.from(allowedMoves).join(', ')}`);
        return { valid: false, error: `${clientFighter.name} cannot learn ${moveName}` };
      }
      console.log(`[VALIDATION] Resolved duplicate name: "${resolvedDisplayName}" -> ${matchedKey} (was ${moveKey})`);
      finalKey = matchedKey;
    }

    // Store the kebab-case key for battle calculations
    validatedMoves.push(finalKey);
  }

  // Use server's authoritative stats (prevents stat hacking)
  // Moves stored as kebab-case keys for MOVE_DATA lookup during battle
  return {
    valid: true,
    fighter: {
      name: validFighter.name,
      types: validFighter.types,
      stats: { ...validFighter.stats },
      moves: validatedMoves, // Kebab-case keys for MOVE_DATA lookup
      sprite: clientFighter.sprite || validFighter.spritesFront
    }
  };
}

// Validate an entire team
function validateTeam(team) {
  if (!Array.isArray(team) || team.length !== TEAM_SIZE) {
    return { valid: false, error: `Team must have exactly ${TEAM_SIZE} fighters` };
  }

  const validatedTeam = [];
  const seenNames = new Set();

  for (const fighter of team) {
    if (!fighter || !fighter.name) {
      return { valid: false, error: 'Invalid fighter data' };
    }

    // No duplicate fighters
    if (seenNames.has(fighter.name)) {
      return { valid: false, error: `Duplicate fighter: ${fighter.name}` };
    }
    seenNames.add(fighter.name);

    const result = validateFighter(fighter);
    if (!result.valid) {
      return result;
    }
    validatedTeam.push(result.fighter);
  }

  return { valid: true, team: validatedTeam };
}

class Battle {
  constructor(lobby, validatedCreatorTeam, validatedOpponentTeam) {
    this.lobbyId = lobby.id;
    this.onChainLobbyId = lobby.onChainLobbyId;
    this.wagerAmount = lobby.wagerAmount;
    this.startedAt = Date.now();

    // Initialize teams with currentHp set to max HP from (validated) stats
    const initializeTeam = (team) => {
      return team.map(fighter => ({
        ...fighter,
        currentHp: fighter.stats.hp, // Initialize HP to max
        maxHp: fighter.stats.hp
      }));
    };

    this.creator = {
      wallet: lobby.creatorWallet,
      socketId: lobby.creatorSocketId,
      team: initializeTeam(validatedCreatorTeam),
      activeFighterIndex: 0,
      connected: true,
      missedTurns: 0,
      pendingMove: null,
      disconnectTimeUsed: 0,
      disconnectedAt: null
    };

    this.opponent = {
      wallet: lobby.opponentWallet,
      socketId: lobby.opponentSocketId,
      team: initializeTeam(validatedOpponentTeam),
      activeFighterIndex: 0,
      connected: true,
      missedTurns: 0,
      pendingMove: null,
      disconnectTimeUsed: 0,
      disconnectedAt: null
    };

    this.turnNumber = 1;
    this.turnTimer = null;
    this.turnStartTime = null;
    this.status = 'active';
    this.winner = null;
    this.turnLog = [];

    // Track switch state - when a fighter faints, that player must pick replacement
    this.pendingSwitch = null; // { wallet: string, timer: timeout }
  }

  getPlayer(walletAddress) {
    if (this.creator.wallet === walletAddress) return this.creator;
    if (this.opponent.wallet === walletAddress) return this.opponent;
    return null;
  }

  getOpponentWallet(walletAddress) {
    if (this.creator.wallet === walletAddress) return this.opponent.wallet;
    if (this.opponent.wallet === walletAddress) return this.creator.wallet;
    return null;
  }

  getOpponentOf(walletAddress) {
    if (this.creator.wallet === walletAddress) return this.opponent;
    if (this.opponent.wallet === walletAddress) return this.creator;
    return null;
  }

  bothMovesReady() {
    return this.creator.pendingMove !== null && this.opponent.pendingMove !== null;
  }

  getStateForPlayer(walletAddress) {
    const isCreator = this.creator.wallet === walletAddress;
    const player = isCreator ? this.creator : this.opponent;
    const enemy = isCreator ? this.opponent : this.creator;

    return {
      lobbyId: this.lobbyId,
      turnNumber: this.turnNumber,
      turnTimeRemaining: this.turnStartTime
        ? Math.max(0, TURN_TIMEOUT - (Date.now() - this.turnStartTime))
        : TURN_TIMEOUT,

      myTeam: player.team.map((f, i) => ({
        ...f,
        isActive: i === player.activeFighterIndex,
        isFainted: f.currentHp <= 0
      })),
      myActiveFighterIndex: player.activeFighterIndex,

      enemyTeam: enemy.team.map((f, i) => ({
        name: f.name,
        types: f.types,
        currentHp: f.currentHp,
        maxHp: f.stats.hp,
        isActive: i === enemy.activeFighterIndex,
        isFainted: f.currentHp <= 0,
        sprite: f.sprite
      })),
      enemyActiveFighterIndex: enemy.activeFighterIndex,
      enemyWallet: enemy.wallet,

      hasSubmittedMove: player.pendingMove !== null,
      enemyHasSubmittedMove: enemy.pendingMove !== null,
      status: this.status,
      winner: this.winner,
      wagerAmount: this.wagerAmount,
      // Switch state - if a switch is pending
      pendingSwitch: this.pendingSwitch ? {
        iNeedToSwitch: isCreator ? this.pendingSwitch.creatorNeedsSwitch && !this.pendingSwitch.creatorSwitched : this.pendingSwitch.opponentNeedsSwitch && !this.pendingSwitch.opponentSwitched,
        enemyNeedsToSwitch: isCreator ? this.pendingSwitch.opponentNeedsSwitch && !this.pendingSwitch.opponentSwitched : this.pendingSwitch.creatorNeedsSwitch && !this.pendingSwitch.creatorSwitched,
        aliveFighters: player.team.map((f, i) => ({ index: i, name: f.name, hp: f.currentHp, types: f.types })).filter(f => f.hp > 0 && f.index !== player.activeFighterIndex)
      } : null
    };
  }

  getActiveFighter(walletAddress) {
    const player = this.getPlayer(walletAddress);
    if (!player) return null;
    return player.team[player.activeFighterIndex];
  }

  isTeamEliminated(team) {
    return team.every(f => f.currentHp <= 0);
  }

  checkWinner() {
    const creatorEliminated = this.isTeamEliminated(this.creator.team);
    const opponentEliminated = this.isTeamEliminated(this.opponent.team);

    // Note: With current pure attack system, simultaneous elimination is impossible
    // (faster fighter attacks first, if they KO, defender never counter-attacks)
    // This check is defensive for future features like recoil/status damage
    if (creatorEliminated && opponentEliminated) {
      console.log('[BATTLE] UNEXPECTED: Both teams eliminated simultaneously!');
      return this.opponent.wallet; // Fallback
    }

    if (creatorEliminated) {
      return this.opponent.wallet;
    }
    if (opponentEliminated) {
      return this.creator.wallet;
    }
    return null;
  }
}

class BattleManager {
  constructor(io, lobbyManager) {
    this.io = io;
    this.lobbyManager = lobbyManager;
    this.battles = new Map();
    this.walletToBattle = new Map();

    setInterval(() => this.cleanup(), 60000);
  }

  startBattle(lobby) {
    // Validate teams - use server's authoritative stats
    const creatorValidation = validateTeam(lobby.creatorTeam);
    if (!creatorValidation.valid) {
      console.error(`[BATTLE] Creator team validation failed: ${creatorValidation.error}`);
      const creatorSocket = this.io.sockets.sockets.get(lobby.creatorSocketId);
      if (creatorSocket) creatorSocket.emit('error', { message: `Invalid team: ${creatorValidation.error}` });
      this.lobbyManager.cancelLobby(lobby.id, lobby.creatorWallet);
      return;
    }

    const opponentValidation = validateTeam(lobby.opponentTeam);
    if (!opponentValidation.valid) {
      console.error(`[BATTLE] Opponent team validation failed: ${opponentValidation.error}`);
      const opponentSocket = this.io.sockets.sockets.get(lobby.opponentSocketId);
      if (opponentSocket) opponentSocket.emit('error', { message: `Invalid team: ${opponentValidation.error}` });
      // Refund would happen on-chain since battle never started
      return;
    }

    console.log(`[BATTLE] Teams validated - using server-authoritative stats`);

    const battle = new Battle(lobby, creatorValidation.team, opponentValidation.team);
    this.battles.set(lobby.id, battle);
    this.walletToBattle.set(lobby.creatorWallet, lobby.id);
    this.walletToBattle.set(lobby.opponentWallet, lobby.id);
    this.lobbyManager.startBattle(lobby.id);

    console.log(`[BATTLE] Started: ${lobby.id}`);
    console.log(`[BATTLE] Added to walletToBattle - creator: ${lobby.creatorWallet}`);
    console.log(`[BATTLE] Added to walletToBattle - opponent: ${lobby.opponentWallet}`);

    this.sendBattleState(battle, 'battle_start');
    this.startTurn(battle);
  }

  startTurn(battle) {
    // Prevent infinite battles
    if (battle.turnNumber > MAX_TURNS) {
      console.log(`[BATTLE] Max turns (${MAX_TURNS}) reached for ${battle.lobbyId} - ending as draw`);
      // Higher total HP remaining wins; if equal, creator wins as tiebreaker
      const creatorHp = battle.creator.team.reduce((sum, f) => sum + f.currentHp, 0);
      const opponentHp = battle.opponent.team.reduce((sum, f) => sum + f.currentHp, 0);
      const winner = creatorHp >= opponentHp ? battle.creator.wallet : battle.opponent.wallet;
      this.endBattle(battle, winner, 'max_turns');
      return;
    }

    battle.turnStartTime = Date.now();
    battle.creator.pendingMove = null;
    battle.opponent.pendingMove = null;

    this.sendBattleState(battle, 'turn_start');

    battle.turnTimer = setTimeout(() => {
      this.handleTurnTimeout(battle);
    }, TURN_TIMEOUT);
  }

  handleTurnTimeout(battle) {
    console.log(`[BATTLE] Turn ${battle.turnNumber} timeout for ${battle.lobbyId}`);

    const creatorMissed = !battle.creator.pendingMove;
    const opponentMissed = !battle.opponent.pendingMove;

    if (creatorMissed) {
      battle.creator.missedTurns++;
      console.log(`[BATTLE] Creator missed turn (${battle.creator.missedTurns}/${MAX_MISSED_TURNS})`);
    }

    if (opponentMissed) {
      battle.opponent.missedTurns++;
      console.log(`[BATTLE] Opponent missed turn (${battle.opponent.missedTurns}/${MAX_MISSED_TURNS})`);
    }

    // Check forfeits AFTER counting both - check both-AFK fairly
    const creatorForfeited = battle.creator.missedTurns >= MAX_MISSED_TURNS;
    const opponentForfeited = battle.opponent.missedTurns >= MAX_MISSED_TURNS;

    if (creatorForfeited && opponentForfeited) {
      // Both AFK - higher total HP wins, creator wins ties
      const creatorHp = battle.creator.team.reduce((sum, f) => sum + f.currentHp, 0);
      const opponentHp = battle.opponent.team.reduce((sum, f) => sum + f.currentHp, 0);
      const winner = creatorHp >= opponentHp ? battle.creator.wallet : battle.opponent.wallet;
      this.endBattle(battle, winner, 'both_timeout');
      return;
    }
    if (creatorForfeited) {
      this.endBattle(battle, battle.opponent.wallet, 'timeout_forfeit');
      return;
    }
    if (opponentForfeited) {
      this.endBattle(battle, battle.creator.wallet, 'timeout_forfeit');
      return;
    }

    // Auto-move for anyone who missed
    if (creatorMissed) {
      battle.creator.pendingMove = { type: 'move', moveIndex: 0, auto: true };
    }
    if (opponentMissed) {
      battle.opponent.pendingMove = { type: 'move', moveIndex: 0, auto: true };
    }

    this.processTurn(battle);
  }

  submitMove(lobbyId, walletAddress, move) {
    const battle = this.battles.get(lobbyId);
    if (!battle || battle.status !== 'active') return;

    // Block moves if waiting for switch
    if (battle.pendingSwitch) {
      console.log(`[BATTLE] Move rejected - waiting for switch`);
      return;
    }

    const player = battle.getPlayer(walletAddress);
    if (!player) return;

    if (player.pendingMove) return;

    const activeFighter = player.team[player.activeFighterIndex];

    if (move.type === 'move') {
      const idx = Number(move.moveIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= activeFighter.moves.length) {
        return;
      }
      move.moveIndex = idx;
    } else if (move.type === 'switch') {
      const idx = Number(move.fighterIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= player.team.length) {
        return;
      }
      if (idx === player.activeFighterIndex) {
        return;
      }
      if (player.team[idx].currentHp <= 0) {
        return;
      }
      move.fighterIndex = idx;
    }

    player.pendingMove = move;
    player.missedTurns = 0;

    this.sendBattleState(battle, 'move_submitted');

    if (battle.bothMovesReady()) {
      clearTimeout(battle.turnTimer);
      this.processTurn(battle);
    }
  }

  processTurn(battle) {
    const creatorMove = battle.creator.pendingMove;
    const opponentMove = battle.opponent.pendingMove;

    const creatorFighterIndex = battle.creator.activeFighterIndex;
    const opponentFighterIndex = battle.opponent.activeFighterIndex;
    const creatorFighter = battle.creator.team[creatorFighterIndex];
    const opponentFighter = battle.opponent.team[opponentFighterIndex];

    console.log(`[BATTLE] Turn ${battle.turnNumber} - Processing`);
    console.log(`[BATTLE] Creator: ${creatorFighter.name} (HP: ${creatorFighter.currentHp})`);
    console.log(`[BATTLE] Opponent: ${opponentFighter.name} (HP: ${opponentFighter.currentHp})`);

    const result = BattleCalculator.processTurn(
      { move: creatorMove, fighter: creatorFighter, team: battle.creator.team, player: battle.creator },
      { move: opponentMove, fighter: opponentFighter, team: battle.opponent.team, player: battle.opponent }
    );

    battle.turnLog.push({
      turn: battle.turnNumber,
      creatorMove,
      opponentMove,
      result
    });

    console.log(`[BATTLE] After attacks - Creator: ${creatorFighter.currentHp} HP, Opponent: ${opponentFighter.currentHp} HP`);

    // Process end-of-turn effects (burn/poison damage)
    // Only apply to fighters still alive after attacks
    const endOfTurnEffects = { creator: [], opponent: [] };

    if (creatorFighter.currentHp > 0) {
      endOfTurnEffects.creator = BattleCalculator.processEndOfTurn(creatorFighter);
      if (endOfTurnEffects.creator.length > 0) {
        console.log(`[BATTLE] Creator end-of-turn:`, endOfTurnEffects.creator);
      }
    }
    if (opponentFighter.currentHp > 0) {
      endOfTurnEffects.opponent = BattleCalculator.processEndOfTurn(opponentFighter);
      if (endOfTurnEffects.opponent.length > 0) {
        console.log(`[BATTLE] Opponent end-of-turn:`, endOfTurnEffects.opponent);
      }
    }

    console.log(`[BATTLE] After end-of-turn - Creator: ${creatorFighter.currentHp} HP, Opponent: ${opponentFighter.currentHp} HP`);

    // Send turn_result FIRST (before checking faints) - now includes end-of-turn effects
    this.sendTurnResult(battle, creatorMove, opponentMove, result, endOfTurnEffects);

    // Check for winner (team fully eliminated)
    const winner = battle.checkWinner();
    if (winner) {
      console.log(`[BATTLE] Winner found: ${winner.slice(0,8)}...`);
      this.endBattle(battle, winner, 'knockout');
      return;
    }

    // Check for faints - player must choose replacement (could be from attack OR end-of-turn damage)
    const creatorFainted = creatorFighter.currentHp <= 0;
    const opponentFainted = opponentFighter.currentHp <= 0;

    if (creatorFainted || opponentFainted) {
      // Someone fainted - they must pick a replacement
      this.handleFaintedFighters(battle, creatorFainted, opponentFainted);
    } else {
      // No faints - proceed to next turn
      battle.turnNumber++;
      this.startTurn(battle);
    }
  }

  // Send turn result to both players
  sendTurnResult(battle, creatorMove, opponentMove, result, endOfTurnEffects = { creator: [], opponent: [] }) {
    const creatorSocket = this.io.sockets.sockets.get(battle.creator.socketId);
    const opponentSocket = this.io.sockets.sockets.get(battle.opponent.socketId);

    const transformActionsForPlayer = (actions, isCreator) => {
      return actions.map(action => ({
        ...action,
        isMyAction: isCreator ? action.player === 'creator' : action.player === 'opponent'
      }));
    };

    const creatorFainted = battle.creator.team[battle.creator.activeFighterIndex].currentHp <= 0;
    const opponentFainted = battle.opponent.team[battle.opponent.activeFighterIndex].currentHp <= 0;

    // Get current status effects for display
    const creatorStatus = battle.creator.team[battle.creator.activeFighterIndex].status || null;
    const opponentStatus = battle.opponent.team[battle.opponent.activeFighterIndex].status || null;

    if (creatorSocket) {
      creatorSocket.emit('turn_result', {
        turnNumber: battle.turnNumber,
        myMove: creatorMove,
        enemyMove: opponentMove,
        actions: transformActionsForPlayer(result.actions || [], true),
        myState: battle.getStateForPlayer(battle.creator.wallet),
        myFighterFainted: creatorFainted,
        enemyFighterFainted: opponentFainted,
        // End-of-turn effects
        myEndOfTurn: endOfTurnEffects.creator,
        enemyEndOfTurn: endOfTurnEffects.opponent,
        // Status effects
        myStatus: creatorStatus,
        enemyStatus: opponentStatus
      });
    }

    if (opponentSocket) {
      opponentSocket.emit('turn_result', {
        turnNumber: battle.turnNumber,
        myMove: opponentMove,
        enemyMove: creatorMove,
        actions: transformActionsForPlayer(result.actions || [], false),
        myState: battle.getStateForPlayer(battle.opponent.wallet),
        myFighterFainted: opponentFainted,
        enemyFighterFainted: creatorFainted,
        // End-of-turn effects (swapped for opponent's perspective)
        myEndOfTurn: endOfTurnEffects.opponent,
        enemyEndOfTurn: endOfTurnEffects.creator,
        // Status effects (swapped for opponent's perspective)
        myStatus: opponentStatus,
        enemyStatus: creatorStatus
      });
    }
  }

  // Handle fainted fighters - request replacement picks
  handleFaintedFighters(battle, creatorFainted, opponentFainted) {
    console.log(`[BATTLE] Handling faints - Creator: ${creatorFainted}, Opponent: ${opponentFainted}`);

    // Track who needs to switch
    battle.pendingSwitch = {
      creatorNeedsSwitch: creatorFainted,
      opponentNeedsSwitch: opponentFainted,
      creatorSwitched: !creatorFainted, // Already done if didn't faint
      opponentSwitched: !opponentFainted
    };

    // Send switch_required to fainted players
    if (creatorFainted) {
      const aliveFighters = battle.creator.team
        .map((f, i) => ({ index: i, name: f.name, hp: f.currentHp }))
        .filter(f => f.hp > 0);

      const creatorSocket = this.io.sockets.sockets.get(battle.creator.socketId);
      if (creatorSocket) {
        creatorSocket.emit('switch_required', {
          reason: 'fainted',
          availableFighters: aliveFighters,
          timeLimit: SWITCH_TIMEOUT
        });
        console.log(`[BATTLE] Sent switch_required to creator. Options:`, aliveFighters.map(f => f.name));
      }
    }

    if (opponentFainted) {
      const aliveFighters = battle.opponent.team
        .map((f, i) => ({ index: i, name: f.name, hp: f.currentHp }))
        .filter(f => f.hp > 0);

      const opponentSocket = this.io.sockets.sockets.get(battle.opponent.socketId);
      if (opponentSocket) {
        opponentSocket.emit('switch_required', {
          reason: 'fainted',
          availableFighters: aliveFighters,
          timeLimit: SWITCH_TIMEOUT
        });
        console.log(`[BATTLE] Sent switch_required to opponent. Options:`, aliveFighters.map(f => f.name));
      }
    }

    // Tell non-fainted player to wait
    if (creatorFainted && !opponentFainted) {
      const opponentSocket = this.io.sockets.sockets.get(battle.opponent.socketId);
      if (opponentSocket) {
        opponentSocket.emit('waiting_for_switch', { message: 'Opponent is choosing a replacement...' });
      }
    }
    if (opponentFainted && !creatorFainted) {
      const creatorSocket = this.io.sockets.sockets.get(battle.creator.socketId);
      if (creatorSocket) {
        creatorSocket.emit('waiting_for_switch', { message: 'Opponent is choosing a replacement...' });
      }
    }

    // Start switch timeout
    battle.switchTimer = setTimeout(() => {
      this.handleSwitchTimeout(battle);
    }, SWITCH_TIMEOUT);
  }

  // Handle switch submission
  submitSwitch(lobbyId, walletAddress, fighterIndex) {
    const battle = this.battles.get(lobbyId);
    if (!battle || battle.status !== 'active') return;

    if (!battle.pendingSwitch) {
      console.log(`[BATTLE] No pending switch for lobby ${lobbyId}`);
      return;
    }

    const isCreator = battle.creator.wallet === walletAddress;
    const player = isCreator ? battle.creator : battle.opponent;

    // Validate that this player actually needs to switch
    const needsSwitch = isCreator ? battle.pendingSwitch.creatorNeedsSwitch : battle.pendingSwitch.opponentNeedsSwitch;
    const alreadySwitched = isCreator ? battle.pendingSwitch.creatorSwitched : battle.pendingSwitch.opponentSwitched;

    if (!needsSwitch) {
      console.log(`[BATTLE] Player ${walletAddress.slice(0,8)}... doesn't need to switch`);
      return;
    }
    if (alreadySwitched) {
      console.log(`[BATTLE] Player ${walletAddress.slice(0,8)}... already switched`);
      return;
    }

    // Validate fighter index
    const idx = Number(fighterIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= player.team.length) {
      console.log(`[BATTLE] Invalid fighter index ${fighterIndex}`);
      return;
    }
    fighterIndex = idx;
    if (player.team[fighterIndex].currentHp <= 0) {
      console.log(`[BATTLE] Fighter at index ${fighterIndex} is fainted`);
      return;
    }

    // Clear stat stages on the outgoing fighter
    const outgoing = player.team[player.activeFighterIndex];
    if (outgoing) {
      outgoing.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
      outgoing.lastMoveWasProtect = false;
    }

    // Perform the switch
    const oldIndex = player.activeFighterIndex;
    player.activeFighterIndex = fighterIndex;
    console.log(`[BATTLE] ${isCreator ? 'Creator' : 'Opponent'} switched from index ${oldIndex} to ${fighterIndex} (${player.team[fighterIndex].name})`);

    // Mark switch as done
    if (isCreator) {
      battle.pendingSwitch.creatorSwitched = true;
    } else {
      battle.pendingSwitch.opponentSwitched = true;
    }

    // Notify both players of the switch
    this.notifySwitchComplete(battle, walletAddress, fighterIndex);

    // Check if all switches are done
    if (battle.pendingSwitch.creatorSwitched && battle.pendingSwitch.opponentSwitched) {
      clearTimeout(battle.switchTimer);
      battle.pendingSwitch = null;
      battle.turnNumber++;
      this.startTurn(battle);
    } else {
      // One player switched but other still needs to - tell the one who switched to wait
      const switcherSocket = this.io.sockets.sockets.get(player.socketId);
      if (switcherSocket) {
        switcherSocket.emit('waiting_for_switch', { message: 'Waiting for opponent to choose...' });
      }
    }
  }

  // Notify both players that a switch happened
  notifySwitchComplete(battle, switcherWallet, newFighterIndex) {
    const isCreator = battle.creator.wallet === switcherWallet;
    const switcher = isCreator ? battle.creator : battle.opponent;
    const newFighter = switcher.team[newFighterIndex];

    const creatorSocket = this.io.sockets.sockets.get(battle.creator.socketId);
    const opponentSocket = this.io.sockets.sockets.get(battle.opponent.socketId);

    // Tell creator
    if (creatorSocket) {
      creatorSocket.emit('fighter_switched', {
        isMine: isCreator,
        fighterIndex: newFighterIndex,
        fighterName: newFighter.name,
        myState: battle.getStateForPlayer(battle.creator.wallet)
      });
    }

    // Tell opponent
    if (opponentSocket) {
      opponentSocket.emit('fighter_switched', {
        isMine: !isCreator,
        fighterIndex: newFighterIndex,
        fighterName: newFighter.name,
        myState: battle.getStateForPlayer(battle.opponent.wallet)
      });
    }
  }

  // Handle switch timeout - auto-pick first alive fighter
  handleSwitchTimeout(battle) {
    if (!battle.pendingSwitch) return;

    console.log(`[BATTLE] Switch timeout for ${battle.lobbyId}`);

    // Auto-switch anyone who hasn't switched yet
    if (battle.pendingSwitch.creatorNeedsSwitch && !battle.pendingSwitch.creatorSwitched) {
      const aliveIndex = battle.creator.team.findIndex((f, i) =>
        i !== battle.creator.activeFighterIndex && f.currentHp > 0
      );
      if (aliveIndex !== -1) {
        battle.creator.activeFighterIndex = aliveIndex;
        console.log(`[BATTLE] Auto-switched creator to ${battle.creator.team[aliveIndex].name}`);
        this.notifySwitchComplete(battle, battle.creator.wallet, aliveIndex);
      }
    }

    if (battle.pendingSwitch.opponentNeedsSwitch && !battle.pendingSwitch.opponentSwitched) {
      const aliveIndex = battle.opponent.team.findIndex((f, i) =>
        i !== battle.opponent.activeFighterIndex && f.currentHp > 0
      );
      if (aliveIndex !== -1) {
        battle.opponent.activeFighterIndex = aliveIndex;
        console.log(`[BATTLE] Auto-switched opponent to ${battle.opponent.team[aliveIndex].name}`);
        this.notifySwitchComplete(battle, battle.opponent.wallet, aliveIndex);
      }
    }

    battle.pendingSwitch = null;
    battle.turnNumber++;
    this.startTurn(battle);
  }

  forfeit(lobbyId, walletAddress) {
    const battle = this.battles.get(lobbyId);
    if (!battle || battle.status !== 'active') return;

    const opponent = battle.getOpponentWallet(walletAddress);
    if (!opponent) return; // Non-participant tried to forfeit
    this.endBattle(battle, opponent, 'forfeit');
  }

  endBattle(battle, winnerWallet, reason) {
    // Prevent double endBattle calls from concurrent code paths
    if (battle.status === 'finished') return;

    clearTimeout(battle.turnTimer);
    clearTimeout(battle.switchTimer); // Also clear switch timer if pending

    // Clear disconnect timers for both players to prevent double endBattle calls
    if (battle.creator.disconnectTimer) {
      clearTimeout(battle.creator.disconnectTimer);
      battle.creator.disconnectTimer = null;
    }
    if (battle.opponent.disconnectTimer) {
      clearTimeout(battle.opponent.disconnectTimer);
      battle.opponent.disconnectTimer = null;
    }

    battle.pendingSwitch = null;
    battle.status = 'finished';
    battle.winner = winnerWallet;

    console.log(`[BATTLE] Ended: ${battle.lobbyId} - Winner: ${winnerWallet.slice(0, 8)}... (${reason})`);

    this.io.to(`lobby:${battle.lobbyId}`).emit('battle_end', {
      winner: winnerWallet,
      reason,
      creatorWallet: battle.creator.wallet,
      opponentWallet: battle.opponent.wallet,
      wagerAmount: battle.wagerAmount
    });

    this.lobbyManager.completeLobby(battle.lobbyId);

    this.settleBattleOnChain(battle).catch(err => {
      console.error(`[SETTLEMENT] Failed for ${battle.lobbyId}:`, err.message);
      console.log(`[SETTLEMENT] Manual settlement needed - Winner: ${winnerWallet}, Lobby: ${battle.lobbyId}`);
    });

    setTimeout(() => {
      this.walletToBattle.delete(battle.creator.wallet);
      this.walletToBattle.delete(battle.opponent.wallet);
      this.battles.delete(battle.lobbyId);
    }, 30000);
  }

  sendBattleState(battle, eventName) {
    const creatorSocket = this.io.sockets.sockets.get(battle.creator.socketId);
    if (creatorSocket) {
      creatorSocket.emit(eventName, battle.getStateForPlayer(battle.creator.wallet));
    }

    const opponentSocket = this.io.sockets.sockets.get(battle.opponent.socketId);
    if (opponentSocket) {
      opponentSocket.emit(eventName, battle.getStateForPlayer(battle.opponent.wallet));
    }
  }

  reconnect(lobbyId, walletAddress, newSocketId) {
    const battle = this.battles.get(lobbyId);
    if (!battle) {
      return { success: false, error: 'Battle not found' };
    }

    if (battle.status !== 'active') {
      return { success: false, error: 'Battle already ended' };
    }

    const player = battle.getPlayer(walletAddress);
    if (!player) {
      return { success: false, error: 'Not a player in this battle' };
    }

    // Cancel disconnect forfeit timer
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
      console.log(`[BATTLE] Cancelled disconnect forfeit timer`);
    }

    // Track cumulative disconnect time
    if (player.disconnectedAt) {
      const elapsed = Date.now() - player.disconnectedAt;
      player.disconnectTimeUsed = (player.disconnectTimeUsed || 0) + elapsed;
      const remaining = DISCONNECT_TIMEOUT - player.disconnectTimeUsed;
      console.log(`[BATTLE] Player used ${Math.round(elapsed/1000)}s disconnect time. Total: ${Math.round(player.disconnectTimeUsed/1000)}s. Remaining: ${Math.round(remaining/1000)}s`);
    }

    player.socketId = newSocketId;
    player.connected = true;
    player.disconnectedAt = null;

    console.log(`[BATTLE] Player reconnected: ${walletAddress.slice(0, 8)}...`);

    // Notify opponent that player reconnected
    const opponent = battle.getOpponentOf(walletAddress);
    if (opponent && opponent.connected) {
      const opponentSocket = this.io.sockets.sockets.get(opponent.socketId);
      if (opponentSocket) {
        opponentSocket.emit('opponent_reconnected');
        console.log(`[BATTLE] Notified opponent of reconnection`);
      }
    }

    // Resume turn timer if it was paused
    if (battle.turnTimerPaused) {
      battle.turnTimerPaused = false;
      // DON'T call startTurn() - that resets BOTH players' pendingMove
      // Instead restart the timer with REMAINING time, not full timer
      const elapsed = Date.now() - (battle.turnStartTime || Date.now());
      const remaining = Math.max(5000, TURN_TIMEOUT - elapsed); // at least 5 seconds
      battle.turnTimer = setTimeout(() => {
        this.handleTurnTimeout(battle);
      }, remaining);
      const playerSocket = this.io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        playerSocket.emit('turn_start', {
          turnNumber: battle.turnNumber,
          myState: battle.getStateForPlayer(walletAddress),
          timeLimit: remaining
        });
      }
      console.log(`[BATTLE] Turn timer resumed with ${Math.round(remaining/1000)}s remaining (without resetting moves)`);

      // If both moves are now ready (opponent submitted while disconnected), process immediately
      if (battle.bothMovesReady()) {
        clearTimeout(battle.turnTimer);
        this.processTurn(battle);
      }
    }

    return {
      success: true,
      battleState: battle.getStateForPlayer(walletAddress)
    };
  }

  handleDisconnect(walletAddress) {
    const lobbyId = this.walletToBattle.get(walletAddress);
    if (!lobbyId) return;

    const battle = this.battles.get(lobbyId);
    if (!battle || battle.status !== 'active') return;

    const player = battle.getPlayer(walletAddress);
    if (player) {
      player.connected = false;
      player.disconnectedAt = Date.now();
      console.log(`[BATTLE] Player disconnected: ${walletAddress.slice(0, 8)}...`);

      // Pause turn timer while waiting for reconnect
      if (battle.turnTimer) {
        clearTimeout(battle.turnTimer);
        battle.turnTimerPaused = true;
        console.log(`[BATTLE] Turn timer paused during disconnect`);
      }

      // Notify opponent of disconnect (show remaining time)
      const opponent = battle.getOpponentOf(walletAddress);
      const timeRemaining = Math.round((DISCONNECT_TIMEOUT - (player.disconnectTimeUsed || 0)) / 1000);
      if (opponent) {
        const opponentSocket = this.io.sockets.sockets.get(opponent.socketId);
        if (opponentSocket) {
          // If during switch phase, update the waiting message
          if (battle.pendingSwitch) {
            opponentSocket.emit('opponent_disconnected_switch', {
              message: `Opponent disconnected! Auto-forfeit in ${timeRemaining}s...`
            });
          } else {
            opponentSocket.emit('opponent_disconnected', {
              timeRemaining: timeRemaining
            });
          }
        }
      }

      // Start disconnect timeout - use REMAINING time (cumulative across all disconnects)
      const timeUsed = player.disconnectTimeUsed || 0;
      const remainingTime = DISCONNECT_TIMEOUT - timeUsed;
      console.log(`[BATTLE] Disconnect timer: ${Math.round(remainingTime/1000)}s remaining (used ${Math.round(timeUsed/1000)}s of ${DISCONNECT_TIMEOUT/1000}s)`);

      if (remainingTime <= 0) {
        // Already used all disconnect time - forfeit immediately
        console.log(`[BATTLE] No disconnect time remaining - instant forfeit for ${walletAddress.slice(0, 8)}...`);
        this.endBattle(battle, opponent.wallet, 'disconnect_forfeit');
        return;
      }

      player.disconnectTimer = setTimeout(() => {
        // Check if still disconnected
        if (!player.connected && battle.status === 'active') {
          console.log(`[BATTLE] Disconnect timeout - forfeiting ${walletAddress.slice(0, 8)}... (used all ${DISCONNECT_TIMEOUT/1000}s)`);
          this.endBattle(battle, opponent.wallet, 'disconnect_forfeit');
        }
      }, remainingTime);
    }
  }

  findBattleByWallet(walletAddress) {
    const lobbyId = this.walletToBattle.get(walletAddress);
    if (lobbyId) {
      const battle = this.battles.get(lobbyId);
      if (battle && battle.status === 'active') {
        return battle;
      }
    }
    return null;
  }

  getStats() {
    return {
      active: this.battles.size,
      players: this.walletToBattle.size
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [lobbyId, battle] of this.battles) {
      if (battle.status === 'finished' && now - battle.startedAt > 60000) {
        this.walletToBattle.delete(battle.creator.wallet);
        this.walletToBattle.delete(battle.opponent.wallet);
        this.battles.delete(lobbyId);
      }
    }
  }

  async settleBattleOnChain(battle) {
    if (battle.settling) {
      console.log(`[SETTLEMENT] Already settling ${battle.lobbyId} - skipping duplicate`);
      return;
    }
    battle.settling = true;

    if (!battle.onChainLobbyId) {
      console.log(`[SETTLEMENT] Skipped - No on-chain lobby ID`);
      return;
    }

    if (!process.env.PROGRAM_ID || process.env.PROGRAM_ID === 'PLACEHOLDER') {
      console.log(`[SETTLEMENT] Skipped - No program ID configured`);
      return;
    }

    const { Connection, PublicKey, Keypair, Transaction, TransactionInstruction } = require('@solana/web3.js');

    try {
      const adminSecret = JSON.parse(process.env.ADMIN_KEYPAIR || '[]');
      if (adminSecret.length === 0) {
        throw new Error('ADMIN_KEYPAIR not configured');
      }
      const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(adminSecret));

      const connection = new Connection(
        process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
        'confirmed'
      );

      const programId = new PublicKey(process.env.PROGRAM_ID);
      const winnerPubkey = new PublicKey(battle.winner);

      const lobbyIdStr = battle.onChainLobbyId;
      const lobbyIdBytes = Buffer.alloc(32);
      Buffer.from(lobbyIdStr).copy(lobbyIdBytes);

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        programId
      );

      const [lobbyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('lobby'), lobbyIdBytes],
        programId
      );

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), lobbyIdBytes],
        programId
      );

      const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

      const [winnerUsdc] = PublicKey.findProgramAddressSync(
        [winnerPubkey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const TREASURY_WALLET = new PublicKey('HNxESrceECsTBb89GQ1ea3N4GwaLkEQ6FZUzsC9vbqwQ');
      const [treasuryUsdc] = PublicKey.findProgramAddressSync(
        [TREASURY_WALLET.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Calculate discriminator dynamically (first 8 bytes of sha256("global:settle_battle"))
      const crypto = require('crypto');
      const discriminator = crypto.createHash('sha256').update('global:settle_battle').digest().slice(0, 8);

      const instructionData = Buffer.concat([
        discriminator,
        winnerPubkey.toBuffer()
      ]);

      // Account order MUST match the contract's SettleBattle struct:
      // 1. config, 2. lobby, 3. escrow_usdc, 4. treasury_usdc, 5. winner_usdc, 6. authority, 7. token_program
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: configPda, isSigner: false, isWritable: true },
          { pubkey: lobbyPda, isSigner: false, isWritable: true },
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: treasuryUsdc, isSigner: false, isWritable: true },
          { pubkey: winnerUsdc, isSigner: false, isWritable: true },
          { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: programId,
        data: instructionData,
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = adminKeypair.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      transaction.sign(adminKeypair);

      const signature = await connection.sendRawTransaction(transaction.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      console.log(`[SETTLEMENT] Battle ${battle.onChainLobbyId} settled on-chain`);
      console.log(`[SETTLEMENT] Winner: ${battle.winner}`);
      console.log(`[SETTLEMENT] Pot: ${battle.wagerAmount * 2} USDC`);
      console.log(`[SETTLEMENT] Transaction: ${signature}`);

    } catch (error) {
      console.error(`[SETTLEMENT] Error:`, error.message);
      console.log(`[SETTLEMENT] Manual settlement needed:`);
      console.log(`  Lobby ID: ${battle.onChainLobbyId}`);
      console.log(`  Winner: ${battle.winner}`);
      console.log(`  Wager: ${battle.wagerAmount} USDC`);

      // Persist failed settlement to file so it can be retried
      this.saveFailedSettlement(battle);

      throw error;
    }
  }

  saveFailedSettlement(battle) {
    try {
      const filePath = path.join(__dirname, '..', 'failed-settlements.json');
      let existing = [];
      if (fs.existsSync(filePath)) {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      existing.push({
        lobbyId: battle.lobbyId,
        onChainLobbyId: battle.onChainLobbyId,
        winner: battle.winner,
        creatorWallet: battle.creator.wallet,
        opponentWallet: battle.opponent.wallet,
        wagerAmount: battle.wagerAmount,
        failedAt: new Date().toISOString()
      });
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
      console.log(`[SETTLEMENT] Failed settlement saved to failed-settlements.json (${existing.length} total)`);
    } catch (e) {
      console.error(`[SETTLEMENT] Could not save failed settlement:`, e.message);
    }
  }
}

module.exports = BattleManager;
