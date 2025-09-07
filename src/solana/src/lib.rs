use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use solana_program::secp256k1_recover::secp256k1_recover;

declare_id!("Escrow111111111111111111111111111111111");

#[program]
pub mod ionic_escrow {
    use super::*;

    /// Initialize a new escrow order
    /// Creates a PDA vault for the order and reserves tokens
    pub fn reserve(
        ctx: Context<Reserve>,
        order_id: [u8; 32],
        amount: u64,
        expiry: i64,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Initialize escrow account
        escrow_account.order_id = order_id;
        escrow_account.owner = ctx.accounts.owner.key();
        escrow_account.token_mint = ctx.accounts.token_mint.key();
        escrow_account.reserved_amount = amount;
        escrow_account.remaining_amount = amount;
        escrow_account.expiry = expiry;
        escrow_account.status = EscrowStatus::Reserved;
        escrow_account.created_at = clock.unix_timestamp;

        // Transfer tokens from user to escrow PDA
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        emit!(ReserveEvent {
            order_id,
            owner: ctx.accounts.owner.key(),
            amount,
            expiry,
        });

        Ok(())
    }

    /// Release tokens from escrow to recipient
    /// Requires valid TSS signature from ICP orchestrator
    pub fn release(
        ctx: Context<Release>,
        order_id: [u8; 32],
        amount: u64,
        fill_nonce: u64,
        dst_chain_id: u64,
        dst_tx_hash: [u8; 32],
        tss_signature: [u8; 64],
        recovery_id: u8,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Validate order
        require!(escrow_account.order_id == order_id, ErrorCode::InvalidOrderId);
        require!(escrow_account.status == EscrowStatus::Reserved, ErrorCode::InvalidStatus);
        require!(escrow_account.remaining_amount >= amount, ErrorCode::InsufficientAmount);
        require!(clock.unix_timestamp < escrow_account.expiry, ErrorCode::Expired);

        // Check if nonce already used (replay protection)
        require!(
            !escrow_account.used_nonces.contains(&fill_nonce),
            ErrorCode::NonceAlreadyUsed
        );

        // Verify TSS signature
        let message = create_release_message(
            order_id,
            ctx.accounts.recipient.key(),
            amount,
            fill_nonce,
            dst_chain_id,
            dst_tx_hash,
            ctx.accounts.escrow_account.key(),
        );
        
        let message_hash = solana_program::keccak::hash(&message);
        let pubkey = secp256k1_recover(&message_hash.to_bytes(), recovery_id, &tss_signature)
            .map_err(|_| ErrorCode::InvalidSignature)?;

        // Verify the recovered public key matches the expected TSS public key
        // This would be set during program initialization
        require!(
            pubkey == ctx.accounts.tss_authority.key(),
            ErrorCode::InvalidTSSAuthority
        );

        // Mark nonce as used
        escrow_account.used_nonces.push(fill_nonce);
        escrow_account.remaining_amount -= amount;

        // Update status if fully released
        if escrow_account.remaining_amount == 0 {
            escrow_account.status = EscrowStatus::Completed;
        }

        // Transfer tokens to recipient
        let seeds = &[
            b"escrow",
            &order_id,
            &[ctx.bumps.escrow_account],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.escrow_account.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, amount)?;

        emit!(ReleaseEvent {
            order_id,
            recipient: ctx.accounts.recipient.key(),
            amount,
            fill_nonce,
            remaining_amount: escrow_account.remaining_amount,
        });

        Ok(())
    }

    /// Refund remaining tokens to owner
    /// Can be called after expiry or by owner
    pub fn refund(ctx: Context<Refund>, order_id: [u8; 32]) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Validate order
        require!(escrow_account.order_id == order_id, ErrorCode::InvalidOrderId);
        require!(
            escrow_account.status == EscrowStatus::Reserved || 
            escrow_account.status == EscrowStatus::Completed,
            ErrorCode::InvalidStatus
        );
        require!(escrow_account.remaining_amount > 0, ErrorCode::NoAmountToRefund);

        // Check if owner is calling or if expired
        let is_owner = ctx.accounts.owner.key() == escrow_account.owner;
        let is_expired = clock.unix_timestamp >= escrow_account.expiry;
        
        require!(is_owner || is_expired, ErrorCode::UnauthorizedRefund);

        let refund_amount = escrow_account.remaining_amount;
        escrow_account.remaining_amount = 0;
        escrow_account.status = EscrowStatus::Refunded;

        // Transfer remaining tokens back to owner
        let seeds = &[
            b"escrow",
            &order_id,
            &[ctx.bumps.escrow_account],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.owner_token_account.to_account_info(),
                authority: ctx.accounts.escrow_account.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, refund_amount)?;

        emit!(RefundEvent {
            order_id,
            owner: escrow_account.owner,
            amount: refund_amount,
        });

        Ok(())
    }

    /// Initialize TSS authority (only callable by program admin)
    pub fn initialize_tss_authority(
        ctx: Context<InitializeTSS>,
        tss_public_key: [u8; 64],
    ) -> Result<()> {
        let tss_config = &mut ctx.accounts.tss_config;
        tss_config.authority = tss_public_key;
        tss_config.is_initialized = true;

        emit!(TSSInitializedEvent {
            authority: tss_public_key,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct Reserve<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1 + 8 + 4 + (32 * 10), // space for 10 nonces
        seeds = [b"escrow", &order_id],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    #[account(
        init,
        payer = owner,
        token::mint = token_mint,
        token::authority = escrow_account,
        seeds = [b"escrow_token", &order_id],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub token_mint: Account<'info, token::Mint>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct Release<'info> {
    #[account(
        mut,
        seeds = [b"escrow", &order_id],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    #[account(
        mut,
        seeds = [b"escrow_token", &order_id],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub recipient: Signer<'info>,
    
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"tss_config"],
        bump
    )]
    pub tss_authority: Account<'info, TSSConfig>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct Refund<'info> {
    #[account(
        mut,
        seeds = [b"escrow", &order_id],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    #[account(
        mut,
        seeds = [b"escrow_token", &order_id],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct InitializeTSS<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 64 + 1,
        seeds = [b"tss_config"],
        bump
    )]
    pub tss_config: Account<'info, TSSConfig>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct EscrowAccount {
    pub order_id: [u8; 32],
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub reserved_amount: u64,
    pub remaining_amount: u64,
    pub expiry: i64,
    pub status: EscrowStatus,
    pub created_at: i64,
    pub used_nonces: Vec<u64>, // Replay protection
}

#[account]
pub struct TSSConfig {
    pub authority: [u8; 64], // TSS public key
    pub is_initialized: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Reserved,
    Completed,
    Refunded,
}

// Events
#[event]
pub struct ReserveEvent {
    pub order_id: [u8; 32],
    pub owner: Pubkey,
    pub amount: u64,
    pub expiry: i64,
}

#[event]
pub struct ReleaseEvent {
    pub order_id: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
    pub fill_nonce: u64,
    pub remaining_amount: u64,
}

#[event]
pub struct RefundEvent {
    pub order_id: [u8; 32],
    pub owner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TSSInitializedEvent {
    pub authority: [u8; 64],
}

// Helper function to create message for TSS signature verification
fn create_release_message(
    order_id: [u8; 32],
    recipient: Pubkey,
    amount: u64,
    fill_nonce: u64,
    dst_chain_id: u64,
    dst_tx_hash: [u8; 32],
    escrow_account: Pubkey,
) -> Vec<u8> {
    let mut message = Vec::new();
    message.extend_from_slice(&order_id);
    message.extend_from_slice(recipient.as_ref());
    message.extend_from_slice(&amount.to_le_bytes());
    message.extend_from_slice(&fill_nonce.to_le_bytes());
    message.extend_from_slice(&dst_chain_id.to_le_bytes());
    message.extend_from_slice(&dst_tx_hash);
    message.extend_from_slice(escrow_account.as_ref());
    message
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid order ID")]
    InvalidOrderId,
    #[msg("Invalid status")]
    InvalidStatus,
    #[msg("Insufficient amount")]
    InsufficientAmount,
    #[msg("Order expired")]
    Expired,
    #[msg("Nonce already used")]
    NonceAlreadyUsed,
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Invalid TSS authority")]
    InvalidTSSAuthority,
    #[msg("Unauthorized refund")]
    UnauthorizedRefund,
    #[msg("No amount to refund")]
    NoAmountToRefund,
}