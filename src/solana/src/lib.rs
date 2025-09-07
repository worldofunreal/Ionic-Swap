use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod token_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let token_account = &mut ctx.accounts.token_account;
        token_account.owner = ctx.accounts.owner.key();
        token_account.balance = 0;
        Ok(())
    }

    pub fn mint(ctx: Context<Mint>, amount: u64) -> Result<()> {
        let token_account = &mut ctx.accounts.token_account;
        token_account.balance += amount;
        Ok(())
    }

    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        let from_account = &mut ctx.accounts.from_account;
        let to_account = &mut ctx.accounts.to_account;

        require!(from_account.balance >= amount, ErrorCode::InsufficientBalance);

        from_account.balance -= amount;
        to_account.balance += amount;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 8)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Mint<'info> {
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub from_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_account: Account<'info, TokenAccount>,
    pub from_authority: Signer<'info>,
}

#[account]
pub struct TokenAccount {
    pub owner: Pubkey,
    pub balance: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient balance")]
    InsufficientBalance,
}