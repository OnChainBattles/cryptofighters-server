# CryptoFighters Battle Server

The official backend powering [CryptoFighters](https://cryptofighters.onchainbattles.games) - a PvP crypto battle game on Solana where you wager USDC on real-time monster fights.

## What is CryptoFighters?

CryptoFighters is a turn-based PvP battle game with crypto-themed monsters. Players pick teams of 3 fighters and battle for USDC stakes. All battle logic runs on this server to ensure fair, cheat-proof gameplay.

**Live Game:** https://cryptofighters.onchainbattles.games

## How Wagering Works

```
1. CREATE LOBBY    Player creates arena, locks USDC in smart contract
2. JOIN LOBBY      Opponent joins, locks matching USDC
3. BATTLE          Real-time PvP with 60-second turn timers
4. SETTLEMENT      Winner gets 97% of pot, 3% goes to treasury
```

All funds are held in a Solana smart contract - not on this server. We can't touch your USDC.

## Security Architecture

| What | How It's Secured |
|------|------------------|
| **Damage Calculation** | Server-only. Clients just send "use move 2" |
| **Critical Hits & RNG** | Server-controlled randomness |
| **Fighter Stats** | Server validates against database (no stat hacking) |
| **Move Validation** | Each fighter can only use their allowed moves |
| **USDC Wagers** | Smart contract escrow (not this server) |
| **Status Effects** | Burn, poison, paralysis - all server-authoritative |

### Anti-Cheat Features

- **Stats Enforcement**: Client sends team, server replaces stats with database values
- **Move Verification**: Each move validated against fighter's allowed moveset
- **No Client HP**: Server tracks all HP - clients only display what server says
- **Reconnect Protection**: Disconnect doesn't lose your battle - reconnect within 60s

## Token Gate ($OCB)

PvP battles require holding **10,000 $OCB tokens** in your wallet. This keeps the community engaged and prevents spam accounts.

## Tech Stack

- **Runtime**: Node.js
- **WebSockets**: Socket.io
- **Blockchain**: Solana (Anchor framework)
- **Hosting**: Railway (auto-deploys from GitHub)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Server status & stats |
| `GET /health` | Health check |
| `GET /lobbies` | List open arenas |
| `GET /player/:wallet` | Get player settings |

## WebSocket Events

### Client -> Server
- `authenticate` - Connect wallet
- `create_lobby` - Create new arena
- `join_lobby` - Join existing arena
- `select_move` - Submit attack (index 0-3)
- `switch_fighter` - Switch active fighter
- `select_switch` - Pick replacement after faint
- `forfeit` - Surrender battle

### Server -> Client
- `battle_start` - Battle begins
- `turn_start` - Your turn (60s timer)
- `turn_result` - Turn outcome with damage/effects
- `switch_required` - Must pick replacement fighter
- `battle_end` - Battle finished, winner announced

## Status Effects

All effects are server-authoritative:

| Effect | Damage | Special |
|--------|--------|---------|
| **Burned** | 12.5% HP/turn | Halves physical attack |
| **Poisoned** | 12.5% HP/turn | Constant damage |
| **Toxic** | Increases each turn | 1/16 -> 2/16 -> ... |
| **Paralyzed** | - | 25% chance can't move |
| **Frozen** | - | Can't move, 20% thaw chance |
| **Asleep** | - | 1-3 turns |

## Environment Variables

```
PORT=3001
FRONTEND_URL=https://cryptofighters.onchainbattles.games
PROGRAM_ID=<Solana program address>
ADMIN_KEYPAIR=<JSON array for settlements>
RPC_ENDPOINT=<Solana RPC URL>
```

## Smart Contract

Program: `6zNPdXCr31A713L1yBSDiW384mHLZUS1HsKqk8RiKJxW` (Mainnet)

The contract handles:
- USDC escrow on lobby create/join
- Automatic settlement (97% winner, 3% treasury)
- Emergency timeout refunds (3 hours)
- Cancel/forfeit with proper refunds

## Links

- **Play**: https://cryptofighters.onchainbattles.games
- **Token**: $OCB on pump.fun
- **Contract**: [View on Solscan](https://solscan.io/account/6zNPdXCr31A713L1yBSDiW384mHLZUS1HsKqk8RiKJxW)

## License

Proprietary - OnChainBattles 2026
