use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, CloseAccount};

// Token Program IDs for validation
const TOKEN_PROGRAM: Pubkey = Pubkey::new_from_array([
    6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172,
    28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169
]); // TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA

const TOKEN_2022_PROGRAM: Pubkey = Pubkey::new_from_array([
    6, 221, 246, 225, 238, 117, 143, 222, 24, 66, 93, 188, 228, 108, 205, 218,
    182, 26, 252, 77, 131, 185, 13, 39, 254, 189, 249, 40, 216, 161, 139, 252
]); // TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb

declare_id!("8ZupVsmaJUKjsPMgqbUXFJNw2uyouPR4kHTVSZ6NhAbk");

// =============================================================================
// CONSTANTS
// =============================================================================

// Treasury wallet that receives the 3% platform fee
// (Set to your treasury wallet public key)
pub const TREASURY_WALLET: Pubkey = Pubkey::new_from_array([/* treasury wallet bytes */
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);

// $OCB token mint address (for token gating)
// (Set to your access token mint address)
pub const OCB_TOKEN_MINT: Pubkey = Pubkey::new_from_array([/* token mint bytes */
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);

// USDC mint address on Solana mainnet
// EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
pub const USDC_MINT: Pubkey = Pubkey::new_from_array([
    198, 250, 122, 243, 190, 219, 173, 58, 61, 101, 243, 106, 171, 201, 116, 49,
    177, 187, 228, 194, 210, 246, 224, 228, 124, 166, 2, 3, 69, 47, 93, 97
]);

// Minimum $OCB tokens required to play (configurable via update_min_token_balance)
pub const MIN_OCB_TOKENS: u64 = 10_000_000_000; // 10,000 tokens x 10^6

// Platform fee percentage (3% = 300 basis points)
pub const FEE_BPS: u64 = 300; // 3%
pub const BPS_DENOMINATOR: u64 = 10_000;

// Minimum wager amount (5 USDC = 5_000_000 with 6 decimals)
pub const MIN_WAGER_USDC: u64 = 5_000_000; // 5 USDC

// Maximum wager amount (10,000 USDC = 10_000_000_000 with 6 decimals)
pub const MAX_WAGER_USDC: u64 = 10_000_000_000; // 10,000 USDC

// Timeout for emergency refund (1.5 hours in seconds)
// If battle stuck "InProgress" for this long, anyone can trigger refund to both players
// Timer starts when opponent joins (battle_started_at), not lobby creation
pub const TIMEOUT_SECONDS: i64 = 5_400; // 1.5 hours

// =============================================================================
// HELPER: Parse raw token account (works with Token and Token-2022)
// =============================================================================

/// Parse a raw token account and return (mint, owner, amount)
/// Works with both standard Token and Token-2022 programs
/// Token account layout (first 72 bytes are identical for both):
///   bytes 0-31:  mint (Pubkey)
///   bytes 32-63: owner (Pubkey)
///   bytes 64-71: amount (u64 little-endian)
fn parse_token_account(account: &AccountInfo) -> Result<(Pubkey, Pubkey, u64)> {
    // Verify account is owned by Token or Token-2022 program
    let owner_program = account.owner;
    require!(
        *owner_program == TOKEN_PROGRAM || *owner_program == TOKEN_2022_PROGRAM,
        WagerError::InvalidTokenProgram
    );

    // Verify minimum data length (token accounts are at least 165 bytes)
    let data = account.try_borrow_data()?;
    require!(data.len() >= 72, WagerError::InvalidTokenAccountData);

    // Parse mint (bytes 0-31)
    let mint = Pubkey::try_from(&data[0..32]).map_err(|_| WagerError::InvalidTokenAccountData)?;

    // Parse owner (bytes 32-63)
    let token_owner = Pubkey::try_from(&data[32..64]).map_err(|_| WagerError::InvalidTokenAccountData)?;

    // Parse amount (bytes 64-71, little-endian u64)
    let amount = u64::from_le_bytes(data[64..72].try_into().map_err(|_| WagerError::InvalidTokenAccountData)?);

    Ok((mint, token_owner, amount))
}

// =============================================================================
// PROGRAM
// =============================================================================

#[program]
pub mod cryptomon_wager {
    use super::*;

    /// Initialize the program's config (run once by admin)
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.treasury = TREASURY_WALLET;
        config.total_fees_collected = 0;
        config.total_battles = 0;
        config.is_paused = false;
        config.ocb_token_mint = OCB_TOKEN_MINT;
        config.min_token_balance = MIN_OCB_TOKENS;
        Ok(())
    }

    /// Create a new battle lobby with USDC wager
    pub fn create_lobby(
        ctx: Context<CreateLobby>,
        lobby_id: [u8; 32],
        wager_amount: u64,
    ) -> Result<()> {
        // Check if program is paused
        require!(!ctx.accounts.config.is_paused, WagerError::ProgramPaused);

        // Validate wager within allowed range
        require!(wager_amount >= MIN_WAGER_USDC, WagerError::WagerTooSmall);
        require!(wager_amount <= MAX_WAGER_USDC, WagerError::WagerTooLarge);

        // Validate USDC account ownership and mint
        require!(
            ctx.accounts.creator_usdc.mint == ctx.accounts.usdc_mint.key(),
            WagerError::InvalidUsdcMint
        );
        require!(
            ctx.accounts.creator_usdc.owner == ctx.accounts.creator.key(),
            WagerError::InvalidTokenOwner
        );

        // Validate OCB token account (works with Token or Token-2022)
        let (ocb_mint, ocb_owner, ocb_amount) = parse_token_account(&ctx.accounts.creator_ocb_token)?;
        require!(
            ocb_mint == ctx.accounts.config.ocb_token_mint,
            WagerError::InvalidOcbMint
        );
        require!(
            ocb_owner == ctx.accounts.creator.key(),
            WagerError::InvalidTokenOwner
        );

        // Validate USDC mint
        require!(
            ctx.accounts.usdc_mint.key() == USDC_MINT,
            WagerError::InvalidUsdcMint
        );

        // Check token gate - player must hold enough $OCB (uses configurable amount)
        require!(
            ocb_amount >= ctx.accounts.config.min_token_balance,
            WagerError::InsufficientOCBTokens
        );

        // Transfer USDC from creator to escrow
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.creator_usdc.to_account_info(),
                to: ctx.accounts.escrow_usdc.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, wager_amount)?;

        // Initialize lobby state
        let lobby = &mut ctx.accounts.lobby;
        lobby.lobby_id = lobby_id;
        lobby.creator = ctx.accounts.creator.key();
        lobby.opponent = Pubkey::default();
        lobby.wager_amount = wager_amount;
        lobby.status = LobbyStatus::WaitingForOpponent;
        lobby.winner = Pubkey::default();
        lobby.created_at = Clock::get()?.unix_timestamp;

        emit!(LobbyCreated {
            lobby_id,
            creator: ctx.accounts.creator.key(),
            wager_amount,
        });

        Ok(())
    }

    /// Join an existing lobby (opponent joins and locks their wager)
    pub fn join_lobby(ctx: Context<JoinLobby>) -> Result<()> {
        // Check if program is paused
        require!(!ctx.accounts.config.is_paused, WagerError::ProgramPaused);

        let lobby = &mut ctx.accounts.lobby;

        // Verify lobby is open
        require!(
            lobby.status == LobbyStatus::WaitingForOpponent,
            WagerError::LobbyNotOpen
        );

        // Check token gate - opponent must hold enough $OCB (works with Token or Token-2022)
        let (ocb_mint, ocb_owner, ocb_amount) = parse_token_account(&ctx.accounts.opponent_ocb_token)?;
        require!(
            ocb_mint == ctx.accounts.config.ocb_token_mint,
            WagerError::InvalidOcbMint
        );
        require!(
            ocb_owner == ctx.accounts.opponent.key(),
            WagerError::InvalidTokenOwner
        );
        require!(
            ocb_amount >= ctx.accounts.config.min_token_balance,
            WagerError::InsufficientOCBTokens
        );

        // Cannot join your own lobby
        require!(
            ctx.accounts.opponent.key() != lobby.creator,
            WagerError::CannotJoinOwnLobby
        );

        // Transfer USDC from opponent to escrow
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.opponent_usdc.to_account_info(),
                to: ctx.accounts.escrow_usdc.to_account_info(),
                authority: ctx.accounts.opponent.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, lobby.wager_amount)?;

        // Update lobby state
        lobby.opponent = ctx.accounts.opponent.key();
        lobby.status = LobbyStatus::InProgress;
        lobby.battle_started_at = Clock::get()?.unix_timestamp;

        emit!(LobbyJoined {
            lobby_id: lobby.lobby_id,
            opponent: ctx.accounts.opponent.key(),
        });

        Ok(())
    }

    /// Settle the battle - called by authorized server/oracle with winner
    pub fn settle_battle(
        ctx: Context<SettleBattle>,
        winner: Pubkey,
    ) -> Result<()> {
        let lobby = &mut ctx.accounts.lobby;
        let config = &mut ctx.accounts.config;

        // Check if program is paused
        require!(!config.is_paused, WagerError::ProgramPaused);

        // Verify battle is in progress
        require!(
            lobby.status == LobbyStatus::InProgress,
            WagerError::BattleNotInProgress
        );

        // Verify winner is one of the players
        require!(
            winner == lobby.creator || winner == lobby.opponent,
            WagerError::InvalidWinner
        );

        // Verify caller is authorized (admin/server)
        require!(
            ctx.accounts.authority.key() == config.admin,
            WagerError::Unauthorized
        );

        // Calculate amounts with checked arithmetic
        let total_pot = lobby.wager_amount.checked_mul(2).ok_or(WagerError::InvalidWagerAmount)?;
        let fee_amount = total_pot.checked_mul(FEE_BPS).ok_or(WagerError::InvalidWagerAmount)?
            .checked_div(BPS_DENOMINATOR).ok_or(WagerError::InvalidWagerAmount)?;
        let winner_amount = total_pot.checked_sub(fee_amount).ok_or(WagerError::InvalidWagerAmount)?;

        // Get escrow signer seeds
        let lobby_id = lobby.lobby_id;
        let bump = ctx.bumps.escrow_usdc;
        let seeds = &[b"escrow", lobby_id.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        // Transfer platform fee to treasury
        let fee_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_usdc.to_account_info(),
                to: ctx.accounts.treasury_usdc.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::transfer(fee_ctx, fee_amount)?;

        // Transfer winnings to winner
        let winner_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_usdc.to_account_info(),
                to: ctx.accounts.winner_usdc.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::transfer(winner_ctx, winner_amount)?;

        // Close escrow token account (recover rent SOL)
        let close_escrow_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_usdc.to_account_info(),
                destination: ctx.accounts.authority.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::close_account(close_escrow_ctx)?;

        // Update lobby state (lobby account closed via `close` attribute on exit)
        lobby.winner = winner;
        lobby.status = LobbyStatus::Settled;

        // Update config stats (checked)
        config.total_fees_collected = config.total_fees_collected.checked_add(fee_amount).unwrap_or(u64::MAX);
        config.total_battles = config.total_battles.checked_add(1).unwrap_or(u64::MAX);

        emit!(BattleSettled {
            lobby_id: lobby.lobby_id,
            winner,
            winner_amount,
            fee_amount,
        });

        Ok(())
    }

    /// Cancel a lobby (only creator, only if no opponent yet)
    pub fn cancel_lobby(ctx: Context<CancelLobby>) -> Result<()> {
        let lobby = &mut ctx.accounts.lobby;

        // Can only cancel if waiting for opponent
        require!(
            lobby.status == LobbyStatus::WaitingForOpponent,
            WagerError::CannotCancelActiveBattle
        );

        // Only creator can cancel
        require!(
            ctx.accounts.creator.key() == lobby.creator,
            WagerError::Unauthorized
        );

        // Refund wager to creator
        let lobby_id = lobby.lobby_id;
        let bump = ctx.bumps.escrow_usdc;
        let seeds = &[b"escrow", lobby_id.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let refund_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_usdc.to_account_info(),
                to: ctx.accounts.creator_usdc.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::transfer(refund_ctx, lobby.wager_amount)?;

        // Close escrow token account (recover rent SOL)
        let close_escrow_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_usdc.to_account_info(),
                destination: ctx.accounts.creator.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::close_account(close_escrow_ctx)?;

        // Update status (lobby account closed via `close` attribute on exit)
        lobby.status = LobbyStatus::Cancelled;

        emit!(LobbyCancelled {
            lobby_id: lobby.lobby_id,
            creator: lobby.creator,
        });

        Ok(())
    }

    /// Forfeit a battle - player voluntarily surrenders, opponent wins
    pub fn forfeit_battle(ctx: Context<ForfeitBattle>) -> Result<()> {
        let lobby = &mut ctx.accounts.lobby;
        let config = &mut ctx.accounts.config;

        // Verify battle is in progress
        require!(
            lobby.status == LobbyStatus::InProgress,
            WagerError::BattleNotInProgress
        );

        // Verify caller is one of the players
        let forfeiter = ctx.accounts.forfeiter.key();
        require!(
            forfeiter == lobby.creator || forfeiter == lobby.opponent,
            WagerError::NotAPlayer
        );

        // Determine winner (the other player)
        let winner = if forfeiter == lobby.creator {
            lobby.opponent
        } else {
            lobby.creator
        };

        // Calculate amounts with checked arithmetic
        let total_pot = lobby.wager_amount.checked_mul(2).ok_or(WagerError::InvalidWagerAmount)?;
        let fee_amount = total_pot.checked_mul(FEE_BPS).ok_or(WagerError::InvalidWagerAmount)?
            .checked_div(BPS_DENOMINATOR).ok_or(WagerError::InvalidWagerAmount)?;
        let winner_amount = total_pot.checked_sub(fee_amount).ok_or(WagerError::InvalidWagerAmount)?;

        // Get escrow signer seeds
        let lobby_id = lobby.lobby_id;
        let bump = ctx.bumps.escrow_usdc;
        let seeds = &[b"escrow", lobby_id.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        // Transfer platform fee to treasury
        let fee_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_usdc.to_account_info(),
                to: ctx.accounts.treasury_usdc.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::transfer(fee_ctx, fee_amount)?;

        // Transfer winnings to winner
        let winner_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_usdc.to_account_info(),
                to: ctx.accounts.winner_usdc.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::transfer(winner_ctx, winner_amount)?;

        // Close escrow token account (recover rent SOL)
        let close_escrow_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_usdc.to_account_info(),
                destination: ctx.accounts.forfeiter.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::close_account(close_escrow_ctx)?;

        // Update lobby state (lobby account closed via `close` attribute on exit)
        lobby.winner = winner;
        lobby.status = LobbyStatus::Settled;

        // Update config stats (checked)
        config.total_fees_collected = config.total_fees_collected.checked_add(fee_amount).unwrap_or(u64::MAX);
        config.total_battles = config.total_battles.checked_add(1).unwrap_or(u64::MAX);

        emit!(BattleForfeited {
            lobby_id: lobby.lobby_id,
            forfeiter,
            winner,
            winner_amount,
            fee_amount,
        });

        Ok(())
    }

    /// Emergency pause (admin only)
    pub fn set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
        ctx.accounts.config.is_paused = paused;
        Ok(())
    }

    /// Admin key rotation - transfer admin to a new wallet
    pub fn update_admin(ctx: Context<AdminOnly>, new_admin: Pubkey) -> Result<()> {
        ctx.accounts.config.admin = new_admin;
        Ok(())
    }

    /// Update token gate mint address (admin only)
    /// Use this to change the required token after launch or token migration
    pub fn update_token_mint(ctx: Context<AdminOnly>, new_token_mint: Pubkey) -> Result<()> {
        ctx.accounts.config.ocb_token_mint = new_token_mint;
        Ok(())
    }

    /// Upgrade config account to new size (admin only)
    pub fn upgrade_config(ctx: Context<UpgradeConfig>) -> Result<()> {
        if ctx.accounts.config.min_token_balance == 0 {
            ctx.accounts.config.min_token_balance = MIN_OCB_TOKENS;
        }
        Ok(())
    }

    /// Update minimum token balance required to play (admin only)
    pub fn update_min_token_balance(ctx: Context<AdminOnly>, new_min_balance: u64) -> Result<()> {
        ctx.accounts.config.min_token_balance = new_min_balance;
        Ok(())
    }

    /// Claim timeout refund - if battle stuck "InProgress" for 1.5+ hours,
    /// anyone can call this to refund BOTH players their full wager (no fees)
    /// This protects players if server crashes or goes down mid-battle
    pub fn claim_timeout(ctx: Context<ClaimTimeout>) -> Result<()> {
        let lobby = &mut ctx.accounts.lobby;

        // Verify battle is in progress (not already settled/cancelled)
        require!(
            lobby.status == LobbyStatus::InProgress,
            WagerError::BattleNotInProgress
        );

        // Check timeout against battle start, not lobby creation
        let current_time = Clock::get()?.unix_timestamp;
        let start_time = if lobby.battle_started_at > 0 { lobby.battle_started_at } else { lobby.created_at };
        let time_elapsed = current_time - start_time;
        require!(
            time_elapsed >= TIMEOUT_SECONDS,
            WagerError::TimeoutNotReached
        );

        // Get escrow signer seeds
        let lobby_id = lobby.lobby_id;
        let bump = ctx.bumps.escrow_usdc;
        let seeds = &[b"escrow", lobby_id.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        // Refund creator - full original wager, no fees
        let refund_creator_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_usdc.to_account_info(),
                to: ctx.accounts.creator_usdc.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::transfer(refund_creator_ctx, lobby.wager_amount)?;

        // Refund opponent - full original wager, no fees
        let refund_opponent_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_usdc.to_account_info(),
                to: ctx.accounts.opponent_usdc.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::transfer(refund_opponent_ctx, lobby.wager_amount)?;

        // Close escrow token account (recover rent SOL)
        let close_escrow_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_usdc.to_account_info(),
                destination: ctx.accounts.caller.to_account_info(),
                authority: ctx.accounts.escrow_usdc.to_account_info(),
            },
            signer,
        );
        token::close_account(close_escrow_ctx)?;

        // Update lobby status (lobby account closed via `close` attribute on exit)
        lobby.status = LobbyStatus::TimedOut;

        emit!(BattleTimedOut {
            lobby_id: lobby.lobby_id,
            creator: lobby.creator,
            opponent: lobby.opponent,
            wager_amount: lobby.wager_amount,
            elapsed_seconds: time_elapsed,
        });

        Ok(())
    }
}

// =============================================================================
// ACCOUNTS
// =============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(lobby_id: [u8; 32], wager_amount: u64)]
pub struct CreateLobby<'info> {
    /// Config needed for is_paused check
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = creator,
        space = 8 + Lobby::INIT_SPACE,
        seeds = [b"lobby", lobby_id.as_ref()],
        bump
    )]
    pub lobby: Box<Account<'info, Lobby>>,

    #[account(
        init,
        payer = creator,
        seeds = [b"escrow", lobby_id.as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = escrow_usdc,
    )]
    pub escrow_usdc: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// Creator's USDC token account
    #[account(mut)]
    pub creator_usdc: Box<Account<'info, TokenAccount>>,

    /// Creator's $OCB token account (for token gate check)
    /// CHECK: Validated manually in create_lobby - supports both Token and Token-2022
    pub creator_ocb_token: UncheckedAccount<'info>,

    /// USDC mint
    pub usdc_mint: Box<Account<'info, token::Mint>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct JoinLobby<'info> {
    /// Config needed for is_paused check
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"lobby", lobby.lobby_id.as_ref()],
        bump
    )]
    pub lobby: Box<Account<'info, Lobby>>,

    #[account(
        mut,
        seeds = [b"escrow", lobby.lobby_id.as_ref()],
        bump
    )]
    pub escrow_usdc: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub opponent: Signer<'info>,

    /// Opponent's USDC token account
    /// Validate mint is USDC and owner is the opponent
    #[account(
        mut,
        constraint = opponent_usdc.mint == USDC_MINT @ WagerError::InvalidUsdcMint,
        constraint = opponent_usdc.owner == opponent.key() @ WagerError::InvalidTokenOwner,
    )]
    pub opponent_usdc: Box<Account<'info, TokenAccount>>,

    /// Opponent's $OCB token account (for token gate check)
    /// CHECK: Validated manually in join_lobby - supports both Token and Token-2022
    pub opponent_ocb_token: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(winner: Pubkey)]
pub struct SettleBattle<'info> {
    #[account(mut, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    /// Close lobby account to recover rent SOL
    #[account(
        mut,
        seeds = [b"lobby", lobby.lobby_id.as_ref()],
        bump,
        close = authority
    )]
    pub lobby: Account<'info, Lobby>,

    #[account(
        mut,
        seeds = [b"escrow", lobby.lobby_id.as_ref()],
        bump
    )]
    pub escrow_usdc: Account<'info, TokenAccount>,

    /// Treasury USDC account (receives platform fee)
    /// Validate mint is USDC and owner is treasury
    #[account(
        mut,
        constraint = treasury_usdc.mint == USDC_MINT @ WagerError::InvalidUsdcMint,
        constraint = treasury_usdc.owner == TREASURY_WALLET @ WagerError::InvalidTokenOwner,
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,

    /// Winner's USDC account
    /// Must verify owner matches the declared winner
    #[account(
        mut,
        constraint = winner_usdc.mint == USDC_MINT @ WagerError::InvalidUsdcMint,
        constraint = winner_usdc.owner == winner @ WagerError::InvalidWinnerAccount,
    )]
    pub winner_usdc: Account<'info, TokenAccount>,

    /// Server/admin authority
    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelLobby<'info> {
    /// Close lobby account to recover rent SOL
    #[account(
        mut,
        seeds = [b"lobby", lobby.lobby_id.as_ref()],
        bump,
        close = creator
    )]
    pub lobby: Account<'info, Lobby>,

    #[account(
        mut,
        seeds = [b"escrow", lobby.lobby_id.as_ref()],
        bump
    )]
    pub escrow_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        constraint = creator_usdc.owner == creator.key(),
    )]
    pub creator_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ForfeitBattle<'info> {
    #[account(mut, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    /// Close lobby account to recover rent SOL
    #[account(
        mut,
        seeds = [b"lobby", lobby.lobby_id.as_ref()],
        bump,
        close = forfeiter
    )]
    pub lobby: Account<'info, Lobby>,

    #[account(
        mut,
        seeds = [b"escrow", lobby.lobby_id.as_ref()],
        bump
    )]
    pub escrow_usdc: Account<'info, TokenAccount>,

    /// Treasury USDC account (receives platform fee)
    /// Validate mint is USDC and owner is treasury
    #[account(
        mut,
        constraint = treasury_usdc.mint == USDC_MINT @ WagerError::InvalidUsdcMint,
        constraint = treasury_usdc.owner == TREASURY_WALLET @ WagerError::InvalidTokenOwner,
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,

    /// Winner's USDC account (opponent of forfeiter)
    /// Must verify owner is the actual winner (opponent of forfeiter)
    #[account(
        mut,
        constraint = winner_usdc.mint == USDC_MINT @ WagerError::InvalidUsdcMint,
        constraint = (
            (forfeiter.key() == lobby.creator && winner_usdc.owner == lobby.opponent) ||
            (forfeiter.key() == lobby.opponent && winner_usdc.owner == lobby.creator)
        ) @ WagerError::InvalidWinnerAccount,
    )]
    pub winner_usdc: Account<'info, TokenAccount>,

    /// The player who is forfeiting
    #[account(mut)]
    pub forfeiter: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        constraint = config.admin == admin.key()
    )]
    pub config: Account<'info, Config>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpgradeConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        realloc = 8 + Config::INIT_SPACE,
        realloc::payer = admin,
        realloc::zero = false,
        constraint = config.admin == admin.key()
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimTimeout<'info> {
    /// Close lobby account to recover rent SOL
    #[account(
        mut,
        seeds = [b"lobby", lobby.lobby_id.as_ref()],
        bump,
        close = caller
    )]
    pub lobby: Account<'info, Lobby>,

    #[account(
        mut,
        seeds = [b"escrow", lobby.lobby_id.as_ref()],
        bump
    )]
    pub escrow_usdc: Account<'info, TokenAccount>,

    /// Creator's USDC account (receives refund)
    #[account(
        mut,
        constraint = creator_usdc.owner == lobby.creator,
    )]
    pub creator_usdc: Account<'info, TokenAccount>,

    /// Opponent's USDC account (receives refund)
    #[account(
        mut,
        constraint = opponent_usdc.owner == lobby.opponent,
    )]
    pub opponent_usdc: Account<'info, TokenAccount>,

    /// Anyone can call this - no signer required for the players
    /// This allows server cron jobs or third parties to trigger refunds
    #[account(mut)]
    pub caller: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// =============================================================================
// STATE
// =============================================================================

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub total_fees_collected: u64,
    pub total_battles: u64,
    pub is_paused: bool,
    /// Configurable token mint for token gating (can be updated by admin)
    pub ocb_token_mint: Pubkey,
    /// Minimum tokens required to play (configurable by admin)
    pub min_token_balance: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Lobby {
    pub lobby_id: [u8; 32],
    pub creator: Pubkey,
    pub opponent: Pubkey,
    pub wager_amount: u64,
    pub status: LobbyStatus,
    pub winner: Pubkey,
    pub created_at: i64,
    /// Track when battle actually started (opponent joined)
    pub battle_started_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum LobbyStatus {
    WaitingForOpponent,
    InProgress,
    Settled,
    Cancelled,
    TimedOut, // Emergency refund - both players got full wager back
}

// =============================================================================
// EVENTS
// =============================================================================

#[event]
pub struct LobbyCreated {
    pub lobby_id: [u8; 32],
    pub creator: Pubkey,
    pub wager_amount: u64,
}

#[event]
pub struct LobbyJoined {
    pub lobby_id: [u8; 32],
    pub opponent: Pubkey,
}

#[event]
pub struct BattleSettled {
    pub lobby_id: [u8; 32],
    pub winner: Pubkey,
    pub winner_amount: u64,
    pub fee_amount: u64,
}

#[event]
pub struct LobbyCancelled {
    pub lobby_id: [u8; 32],
    pub creator: Pubkey,
}

#[event]
pub struct BattleForfeited {
    pub lobby_id: [u8; 32],
    pub forfeiter: Pubkey,
    pub winner: Pubkey,
    pub winner_amount: u64,
    pub fee_amount: u64,
}

#[event]
pub struct BattleTimedOut {
    pub lobby_id: [u8; 32],
    pub creator: Pubkey,
    pub opponent: Pubkey,
    pub wager_amount: u64,
    pub elapsed_seconds: i64,
}

// =============================================================================
// ERRORS
// =============================================================================

#[error_code]
pub enum WagerError {
    #[msg("Insufficient $OCB tokens to play")]
    InsufficientOCBTokens,

    #[msg("Invalid wager amount")]
    InvalidWagerAmount,

    #[msg("Lobby is not open for joining")]
    LobbyNotOpen,

    #[msg("Cannot join your own lobby")]
    CannotJoinOwnLobby,

    #[msg("Battle is not in progress")]
    BattleNotInProgress,

    #[msg("Invalid winner address")]
    InvalidWinner,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Cannot cancel an active battle")]
    CannotCancelActiveBattle,

    #[msg("Program is paused")]
    ProgramPaused,

    #[msg("Not a player in this battle")]
    NotAPlayer,

    #[msg("Wager must be at least 5 USDC")]
    WagerTooSmall,

    #[msg("Timeout period not yet reached (1.5 hours)")]
    TimeoutNotReached,

    #[msg("Invalid USDC mint")]
    InvalidUsdcMint,

    #[msg("Invalid OCB token mint")]
    InvalidOcbMint,

    #[msg("Invalid token account owner")]
    InvalidTokenOwner,

    #[msg("Winner USDC account does not match the actual winner")]
    InvalidWinnerAccount,

    #[msg("Wager exceeds maximum (10,000 USDC)")]
    WagerTooLarge,

    #[msg("Token account not owned by Token or Token-2022 program")]
    InvalidTokenProgram,

    #[msg("Invalid token account data")]
    InvalidTokenAccountData,
}
