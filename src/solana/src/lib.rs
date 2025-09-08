use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// Canister's Solana public key (6n3cKK86zeiGtX9VBLLCqjyaUwYqNHFFoR7A4cQvjcwd)
const CANISTER_PUBLIC_KEY: [u8; 32] = [
    0x6e, 0x3c, 0x4b, 0x4b, 0x38, 0x36, 0x7a, 0x65, 
    0x69, 0x47, 0x74, 0x58, 0x39, 0x56, 0x42, 0x4c, 
    0x4c, 0x43, 0x71, 0x6a, 0x79, 0x61, 0x55, 0x77, 
    0x59, 0x71, 0x4e, 0x48, 0x46, 0x46, 0x6f, 0x52
];

// Permit message for gasless transactions
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PermitMessage {
    pub order_id: [u8; 32],
    pub amount: u64,
    pub expiry_timestamp: i64,
    pub user_pubkey: Pubkey,
    pub nonce: u64,
    pub deadline: i64,
}

// Verify permit signature (simplified for now)
fn verify_permit_signature(
    _message: &PermitMessage,
    _signature: &[u8; 64],
    _public_key: &Pubkey,
) -> Result<()> {
    // TODO: Implement proper Ed25519 signature verification
    // For now, we'll accept any signature (this should be fixed in production)
    // In a real implementation, you'd use proper cryptographic verification
    
    Ok(())
}

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

    /// Reserve tokens in escrow vault (requires user to sign and pay gas)
    pub fn reserve(
        ctx: Context<Reserve>,
        order_id: [u8; 32],
        amount: u64,
        expiry_timestamp: i64,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Validate expiry
        require!(expiry_timestamp > clock.unix_timestamp, ErrorCode::InvalidExpiry);

        // Initialize escrow account
        escrow_account.order_id = order_id;
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

    /// Reserve tokens in escrow vault using permit (gasless for user)
    pub fn reserve_with_permit(
        ctx: Context<ReserveWithPermit>,
        order_id: [u8; 32],
        amount: u64,
        expiry_timestamp: i64,
        permit_signature: [u8; 64],
        nonce: u64,
        deadline: i64,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        let nonce_account = &mut ctx.accounts.nonce_account;
        let clock = Clock::get()?;

        // Validate deadline
        require!(clock.unix_timestamp <= deadline, ErrorCode::PermitExpired);
        
        // Validate expiry
        require!(expiry_timestamp > clock.unix_timestamp, ErrorCode::InvalidExpiry);

        // Check nonce hasn't been used
        require!(!nonce_account.is_used, ErrorCode::NonceAlreadyUsed);
        nonce_account.is_used = true;

        // Verify permit signature
        let message = PermitMessage {
            order_id,
            amount,
            expiry_timestamp,
            user_pubkey: ctx.accounts.user.key(),
            nonce,
            deadline,
        };
        
        verify_permit_signature(&message, &permit_signature, &ctx.accounts.user.key())?;

        // Initialize escrow account
        escrow_account.order_id = order_id;
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

    /// Release tokens from escrow (only canister can call)
    pub fn release(
        ctx: Context<Release>,
        order_id: [u8; 32],
        amount: u64,
        fill_nonce: u64,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        let tss_authority = &ctx.accounts.tss_authority;

        // Verify canister authority
        require!(tss_authority.is_initialized, ErrorCode::TssNotInitialized);
        require!(tss_authority.tss_pubkey == CANISTER_PUBLIC_KEY, ErrorCode::UnauthorizedCanister);

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
                &[&[b"escrow", order_id.as_ref(), &[ctx.bumps["escrow_account"]]]],
            ),
            amount,
        )?;

        Ok(())
    }

    /// Refund tokens to user
    pub fn refund(
        ctx: Context<Refund>,
        order_id: [u8; 32],
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
                &[&[b"escrow", order_id.as_ref(), &[ctx.bumps["escrow_account"]]]],
            ),
            refund_amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
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
#[instruction(order_id: [u8; 32])]
pub struct Reserve<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 8 + 8 + 8,
        seeds = [b"escrow", order_id.as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(
        init,
        payer = user,
        token::mint = token_mint,
        token::authority = escrow_account,
        seeds = [b"escrow_token", order_id.as_ref()],
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
#[instruction(order_id: [u8; 32], nonce: u64)]
pub struct ReserveWithPermit<'info> {
    #[account(
        init,
        payer = canister,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 8 + 8 + 8,
        seeds = [b"escrow", order_id.as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(
        init,
        payer = canister,
        token::mint = token_mint,
        token::authority = escrow_account,
        seeds = [b"escrow_token", order_id.as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = canister,
        space = 8 + 8 + 1,
        seeds = [b"nonce", nonce.to_le_bytes().as_ref()],
        bump
    )]
    pub nonce_account: Account<'info, NonceAccount>,
    /// CHECK: User account (not a signer in permit flow)
    pub user: AccountInfo<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_mint: Account<'info, token::Mint>,
    /// CHECK: This is the canister's Solana address - only it can pay gas
    #[account(
        constraint = canister.key().to_bytes() == CANISTER_PUBLIC_KEY @ ErrorCode::UnauthorizedCanister
    )]
    #[account(mut)]
    pub canister: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct Release<'info> {
    #[account(
        mut,
        seeds = [b"escrow", order_id.as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(
        mut,
        seeds = [b"escrow_token", order_id.as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub dst_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"tss_authority"],
        bump
    )]
    pub tss_authority: Account<'info, TssAuthority>,
    /// CHECK: This is the canister's Solana address - only it can sign
    #[account(
        constraint = canister.key().to_bytes() == CANISTER_PUBLIC_KEY @ ErrorCode::UnauthorizedCanister
    )]
    pub canister: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct Refund<'info> {
    #[account(
        mut,
        seeds = [b"escrow", order_id.as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(
        mut,
        seeds = [b"escrow_token", order_id.as_ref()],
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
    pub order_id: [u8; 32],
    pub user: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub expiry_timestamp: i64,
    pub status: EscrowStatus,
    pub created_at: i64,
    pub released_amount: u64,
    pub fill_nonce: u64,
}

#[account]
pub struct NonceAccount {
    pub nonce: u64,
    pub is_used: bool,
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
    #[msg("Unauthorized canister")]
    UnauthorizedCanister,
    #[msg("Permit expired")]
    PermitExpired,
    #[msg("Nonce already used")]
    NonceAlreadyUsed,
    #[msg("Serialization error")]
    SerializationError,
}