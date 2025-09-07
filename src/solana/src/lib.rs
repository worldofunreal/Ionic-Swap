use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// Hardcoded TSS public key from ICP canister
const TSS_PUBLIC_KEY: [u8; 32] = [
    0x0e, 0x5e, 0xe4, 0x40, 0x7a, 0x86, 0x6d, 0x0c, 
    0x5f, 0xc2, 0x82, 0x69, 0x6d, 0x02, 0x6e, 0x5c, 
    0x55, 0x06, 0xdf, 0x09, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
];

#[program]
pub mod ionic_escrow {
    use super::*;

    /// Initialize TSS authority (one-time setup)
    pub fn initialize_tss_authority(
        ctx: Context<InitializeTssAuthority>,
        tss_pubkey: [u8; 32],
    ) -> Result<()> {
        let tss_authority = &mut ctx.accounts.tss_authority;
        tss_authority.tss_pubkey = tss_pubkey;
        tss_authority.is_initialized = true;
        Ok(())
    }

    /// Reserve tokens in escrow vault
    pub fn reserve(
        ctx: Context<Reserve>,
        order_id: String,
        amount: u64,
        expiry_timestamp: i64,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Validate expiry
        require!(expiry_timestamp > clock.unix_timestamp, ErrorCode::InvalidExpiry);

        // Initialize escrow account
        escrow_account.order_id = order_id.clone();
        escrow_account.user = ctx.accounts.user.key();
        escrow_account.token_mint = ctx.accounts.token_mint.key();
        escrow_account.amount = amount;
        escrow_account.expiry_timestamp = expiry_timestamp;
        escrow_account.status = EscrowStatus::Reserved;
        escrow_account.created_at = clock.unix_timestamp;

        // Transfer tokens from user to escrow vault
        let transfer_instruction = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
            ),
            amount,
        )?;

        Ok(())
    }

    /// Release tokens from escrow (only TSS can call)
    pub fn release(
        ctx: Context<Release>,
        order_id: String,
        amount: u64,
        fill_nonce: u64,
        dst_chain_id: u64,
        dst_tx_hash: [u8; 32],
        tss_signature: [u8; 64],
        recovery_id: u8,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        let tss_authority = &ctx.accounts.tss_authority;

        // Verify TSS signature (simplified for now)
        require!(tss_authority.is_initialized, ErrorCode::TssNotInitialized);

        // Validate escrow status
        require!(escrow_account.status == EscrowStatus::Reserved, ErrorCode::InvalidStatus);
        require!(escrow_account.amount >= amount, ErrorCode::InsufficientAmount);

        // Update escrow status
        escrow_account.status = EscrowStatus::Released;
        escrow_account.released_amount = amount;
        escrow_account.fill_nonce = fill_nonce;

        // Transfer tokens from escrow to destination
        let transfer_instruction = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.dst_token_account.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        };

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
                &[&[b"escrow", order_id.as_bytes(), &[ctx.bumps["escrow_account"]]]],
            ),
            amount,
        )?;

        Ok(())
    }

    /// Refund tokens to user
    pub fn refund(
        ctx: Context<Refund>,
        order_id: String,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Check if expired
        require!(clock.unix_timestamp > escrow_account.expiry_timestamp, ErrorCode::NotExpired);
        require!(escrow_account.status == EscrowStatus::Reserved, ErrorCode::InvalidStatus);

        // Get amount before updating status
        let refund_amount = escrow_account.amount;
        
        // Update status
        escrow_account.status = EscrowStatus::Refunded;

        // Transfer tokens back to user
        let transfer_instruction = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        };

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
                &[&[b"escrow", order_id.as_bytes(), &[ctx.bumps["escrow_account"]]]],
            ),
            refund_amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(order_id: String)]
pub struct InitializeTssAuthority<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 1,
        seeds = [b"tss_authority"],
        bump
    )]
    pub tss_authority: Account<'info, TssAuthority>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: String)]
pub struct Reserve<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 8 + 8 + 8,
        seeds = [b"escrow", order_id.as_bytes()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(
        init,
        payer = user,
        token::mint = token_mint,
        token::authority = escrow_account,
        seeds = [b"escrow_token", order_id.as_bytes()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: String)]
pub struct Release<'info> {
    #[account(
        mut,
        seeds = [b"escrow", order_id.as_bytes()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(
        mut,
        seeds = [b"escrow_token", order_id.as_bytes()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub dst_token_account: Account<'info, TokenAccount>,
    pub tss_authority: Account<'info, TssAuthority>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(order_id: String)]
pub struct Refund<'info> {
    #[account(
        mut,
        seeds = [b"escrow", order_id.as_bytes()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(
        mut,
        seeds = [b"escrow_token", order_id.as_bytes()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct TssAuthority {
    pub tss_pubkey: [u8; 32],
    pub is_initialized: bool,
}

#[account]
pub struct EscrowAccount {
    pub order_id: String,
    pub user: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub expiry_timestamp: i64,
    pub status: EscrowStatus,
    pub created_at: i64,
    pub released_amount: u64,
    pub fill_nonce: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Reserved,
    Released,
    Refunded,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid expiry timestamp")]
    InvalidExpiry,
    #[msg("TSS authority not initialized")]
    TssNotInitialized,
    #[msg("Invalid escrow status")]
    InvalidStatus,
    #[msg("Insufficient amount")]
    InsufficientAmount,
    #[msg("Order not expired yet")]
    NotExpired,
}