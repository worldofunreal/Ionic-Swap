use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use sha2::{Digest, Sha256};

declare_id!("HTLC1111111111111111111111111111111111111");

#[program]
pub mod solana_htlc {
    use super::*;

    /// Create a new HTLC
    pub fn create_htlc(
        ctx: Context<CreateHtlc>,
        amount: u64,
        hashlock: [u8; 32],
        timelock: i64,
        order_id: String,
    ) -> Result<()> {
        let htlc = &mut ctx.accounts.htlc;
        let clock = Clock::get()?;

        // Validate timelock is in the future
        require!(timelock > clock.unix_timestamp, ErrorCode::InvalidTimelock);

        // Initialize HTLC
        htlc.sender = ctx.accounts.sender.key();
        htlc.recipient = ctx.accounts.recipient.key();
        htlc.amount = amount;
        htlc.hashlock = hashlock;
        htlc.timelock = timelock;
        htlc.order_id = order_id;
        htlc.status = HtlcStatus::Created;
        htlc.created_at = clock.unix_timestamp;

        // Transfer tokens to HTLC escrow
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender_token_account.to_account_info(),
                to: ctx.accounts.htlc_token_account.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        emit!(HtlcCreated {
            htlc: ctx.accounts.htlc.key(),
            sender: ctx.accounts.sender.key(),
            recipient: ctx.accounts.recipient.key(),
            amount,
            order_id: order_id.clone(),
        });

        Ok(())
    }

    /// Claim HTLC with secret
    pub fn claim_htlc(ctx: Context<ClaimHtlc>, secret: [u8; 32]) -> Result<()> {
        let htlc = &mut ctx.accounts.htlc;
        let clock = Clock::get()?;

        // Validate HTLC status
        require!(htlc.status == HtlcStatus::Created, ErrorCode::InvalidHtlcStatus);

        // Validate timelock hasn't expired
        require!(clock.unix_timestamp < htlc.timelock, ErrorCode::HtlcExpired);

        // Validate secret matches hashlock
        let secret_hash = Sha256::digest(&secret);
        require!(secret_hash == htlc.hashlock, ErrorCode::InvalidSecret);

        // Update HTLC status
        htlc.status = HtlcStatus::Claimed;
        htlc.claimed_at = Some(clock.unix_timestamp);

        // Transfer tokens to recipient
        let seeds = &[
            b"htlc",
            htlc.key().as_ref(),
            &[ctx.bumps.htlc],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.htlc_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.htlc.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, htlc.amount)?;

        emit!(HtlcClaimed {
            htlc: ctx.accounts.htlc.key(),
            recipient: ctx.accounts.recipient.key(),
            amount: htlc.amount,
            secret,
        });

        Ok(())
    }

    /// Refund expired HTLC
    pub fn refund_htlc(ctx: Context<RefundHtlc>) -> Result<()> {
        let htlc = &mut ctx.accounts.htlc;
        let clock = Clock::get()?;

        // Validate HTLC status
        require!(htlc.status == HtlcStatus::Created, ErrorCode::InvalidHtlcStatus);

        // Validate timelock has expired
        require!(clock.unix_timestamp >= htlc.timelock, ErrorCode::HtlcNotExpired);

        // Update HTLC status
        htlc.status = HtlcStatus::Refunded;
        htlc.refunded_at = Some(clock.unix_timestamp);

        // Transfer tokens back to sender
        let seeds = &[
            b"htlc",
            htlc.key().as_ref(),
            &[ctx.bumps.htlc],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.htlc_token_account.to_account_info(),
                to: ctx.accounts.sender_token_account.to_account_info(),
                authority: ctx.accounts.htlc.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, htlc.amount)?;

        emit!(HtlcRefunded {
            htlc: ctx.accounts.htlc.key(),
            sender: ctx.accounts.sender.key(),
            amount: htlc.amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, hashlock: [u8; 32], timelock: i64, order_id: String)]
pub struct CreateHtlc<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + Htlc::INIT_SPACE,
        seeds = [b"htlc", order_id.as_bytes()],
        bump
    )]
    pub htlc: Account<'info, Htlc>,

    #[account(mut)]
    pub sender: Signer<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub recipient: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = sender
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = sender,
        associated_token::mint = mint,
        associated_token::authority = htlc
    )]
    pub htlc_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, token::Mint>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimHtlc<'info> {
    #[account(mut)]
    pub htlc: Account<'info, Htlc>,

    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = htlc
    )]
    pub htlc_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, token::Mint>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundHtlc<'info> {
    #[account(mut)]
    pub htlc: Account<'info, Htlc>,

    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = htlc
    )]
    pub htlc_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = sender
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, token::Mint>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Htlc {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub hashlock: [u8; 32],
    pub timelock: i64,
    pub order_id: String,
    pub status: HtlcStatus,
    pub created_at: i64,
    pub claimed_at: Option<i64>,
    pub refunded_at: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum HtlcStatus {
    Created,
    Claimed,
    Refunded,
}

#[event]
pub struct HtlcCreated {
    pub htlc: Pubkey,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub order_id: String,
}

#[event]
pub struct HtlcClaimed {
    pub htlc: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub secret: [u8; 32],
}

#[event]
pub struct HtlcRefunded {
    pub htlc: Pubkey,
    pub sender: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid timelock")]
    InvalidTimelock,
    #[msg("Invalid HTLC status")]
    InvalidHtlcStatus,
    #[msg("HTLC has expired")]
    HtlcExpired,
    #[msg("Invalid secret")]
    InvalidSecret,
    #[msg("HTLC not expired")]
    HtlcNotExpired,
}
