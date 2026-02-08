# CryptoFighters Smart Contract

On-chain USDC wager escrow for PvP battles on Solana.

**Program ID:** `8ZupVsmaJUKjsPMgqbUXFJNw2uyouPR4kHTVSZ6NhAbk`

Verify on Solana Explorer: https://explorer.solana.com/address/8ZupVsmaJUKjsPMgqbUXFJNw2uyouPR4kHTVSZ6NhAbk

## How It Works

CryptoFighters is a PvP battle game where players wager USDC. The smart contract handles all funds on-chain - **the server never touches your money.**

### Battle Flow

1. **Player A creates a lobby** - USDC is transferred from their wallet into a program-owned escrow account (PDA)
2. **Player B joins** - Their USDC is also locked in the same escrow
3. **Battle happens** - Server calculates the battle (authoritative, turn-based)
4. **Settlement** - Server calls `settle_battle` with the winner. Contract pays out:
   - **97% to the winner**
   - **3% platform fee** to treasury

All transfers are on-chain SPL token operations. The escrow is a Program Derived Address (PDA) - no one holds the private key, only the program can move the funds.

### Token Gate

Players must hold a minimum amount of $OCB tokens to create or join a lobby. This is verified on-chain during `create_lobby` and `join_lobby`. The required token and minimum balance are configurable by the admin without redeploying.

### Player Protections

- **Cancel anytime** - If no opponent has joined, the creator can cancel and get a full refund
- **Forfeit** - A player can forfeit mid-battle. Opponent wins, same 97/3 split applies
- **Timeout refund** - If a battle is stuck "In Progress" for 1.5+ hours (server crash, etc.), **anyone** can trigger `claim_timeout` to refund BOTH players their full wager with zero fees
- **Wager limits** - Min 5 USDC, max 10,000 USDC
- **Emergency pause** - Admin can pause the program to prevent new lobbies during maintenance

### Security

- Escrow accounts are PDAs seeded by lobby ID - no private key exists
- All USDC mint addresses are validated on-chain (prevents fake token attacks)
- Winner USDC account ownership is verified before payout
- Token gate supports both SPL Token and Token-2022 programs
- Checked arithmetic throughout (no overflow/underflow)
- Lobby and escrow accounts are closed after settlement (rent SOL recovered)
- Built with [Anchor](https://www.anchor-lang.com/) framework

### Contract Instructions

| Instruction | Who Can Call | Description |
|---|---|---|
| `create_lobby` | Any player | Lock USDC, create escrow PDA |
| `join_lobby` | Any player | Lock matching USDC in escrow |
| `settle_battle` | Admin/server | Pay winner 97%, treasury 3% |
| `cancel_lobby` | Lobby creator | Refund if no opponent joined |
| `forfeit_battle` | Either player | Surrender, opponent wins |
| `claim_timeout` | Anyone | Refund both after 1.5hr stuck |
| `set_paused` | Admin | Emergency pause/unpause |
| `update_token_mint` | Admin | Change token gate token |
| `update_min_token_balance` | Admin | Change minimum tokens required |

### Account Structure

**Config PDA** (`seeds = ["config"]`):
- Admin wallet, treasury wallet, total fees/battles, pause state, token gate settings

**Lobby PDA** (`seeds = ["lobby", lobby_id]`):
- Creator, opponent, wager amount, status, winner, timestamps

**Escrow PDA** (`seeds = ["escrow", lobby_id]`):
- USDC token account owned by the program - holds both players' wagers

## Source Code

The full contract source is in [lib.rs](./lib.rs). Built with Anchor on Solana.

## Tech Stack

- **Smart Contract:** Rust + Anchor (Solana)
- **Wager Currency:** USDC (SPL Token)
- **Access Token:** $OCB (SPL Token / Token-2022)
- **Game Client:** HTML5 + JavaScript
- **Battle Server:** Node.js + Socket.io
