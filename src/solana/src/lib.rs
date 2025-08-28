use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};
use spl_token::{
    instruction as token_instruction,
    state::Mint,
};


// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program state structures
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct TokenMetadata {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
    pub total_supply: u64,
    pub mint_authority: Pubkey,
    pub freeze_authority: Option<Pubkey>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum TokenInstruction {
    /// Initialize a new token mint
    /// Accounts expected:
    /// 0. `[signer]` The account of the person initializing the mint
    /// 1. `[writable]` The mint account to initialize
    /// 2. `[]` The rent sysvar
    /// 3. `[]` The token program
    InitializeMint {
        decimals: u8,
        mint_authority: Pubkey,
        freeze_authority: Option<Pubkey>,
        name: String,
        symbol: String,
        uri: String,
    },
    
    /// Mint tokens to an account
    /// Accounts expected:
    /// 0. `[signer]` The mint authority
    /// 1. `[writable]` The mint account
    /// 2. `[writable]` The destination account
    /// 3. `[]` The token program
    MintTo {
        amount: u64,
    },
    
    /// Transfer tokens between accounts
    /// Accounts expected:
    /// 0. `[signer]` The source account owner
    /// 1. `[writable]` The source account
    /// 2. `[writable]` The destination account
    /// 3. `[]` The token program
    Transfer {
        amount: u64,
    },
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = TokenInstruction::try_from_slice(instruction_data)?;

    match instruction {
        TokenInstruction::InitializeMint {
            decimals,
            mint_authority,
            freeze_authority,
            name,
            symbol,
            uri,
        } => {
            msg!("Instruction: InitializeMint");
            process_initialize_mint(
                program_id,
                accounts,
                decimals,
                mint_authority,
                freeze_authority,
                name,
                symbol,
                uri,
            )
        }
        TokenInstruction::MintTo { amount } => {
            msg!("Instruction: MintTo");
            process_mint_to(program_id, accounts, amount)
        }
        TokenInstruction::Transfer { amount } => {
            msg!("Instruction: Transfer");
            process_transfer(program_id, accounts, amount)
        }
    }
}

fn process_initialize_mint(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    decimals: u8,
    mint_authority: Pubkey,
    freeze_authority: Option<Pubkey>,
    name: String,
    symbol: String,
    _uri: String,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer = next_account_info(account_info_iter)?;
    let mint_account = next_account_info(account_info_iter)?;
    let rent = &Rent::from_account_info(next_account_info(account_info_iter)?)?;
    let token_program = next_account_info(account_info_iter)?;

    if !payer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if !mint_account.is_writable {
        return Err(ProgramError::InvalidAccountData);
    }

    // Initialize the mint account
    let mint_authority_pubkey = mint_authority;
    let freeze_authority_pubkey = freeze_authority;

    let space = Mint::LEN;
    let lamports = rent.minimum_balance(space);

    // Create the mint account
    let create_account_ix = system_instruction::create_account(
        payer.key,
        mint_account.key,
        lamports,
        space as u64,
        &spl_token::id(),
    );

    solana_program::program::invoke(
        &create_account_ix,
        &[payer.clone(), mint_account.clone()],
    )?;

    // Initialize the mint
    let init_mint_ix = token_instruction::initialize_mint(
        &spl_token::id(),
        mint_account.key,
        &mint_authority_pubkey,
        freeze_authority_pubkey.as_ref(),
        decimals,
    )?;

    solana_program::program::invoke(
        &init_mint_ix,
        &[
            mint_account.clone(),
            token_program.clone(),
        ],
    )?;

    msg!("Mint initialized successfully");
    msg!("Mint address: {}", mint_account.key);
    msg!("Name: {}", name);
    msg!("Symbol: {}", symbol);
    msg!("Decimals: {}", decimals);

    Ok(())
}

fn process_mint_to(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let mint_authority = next_account_info(account_info_iter)?;
    let mint_account = next_account_info(account_info_iter)?;
    let destination_account = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !mint_authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Mint tokens
    let mint_to_ix = token_instruction::mint_to(
        &spl_token::id(),
        mint_account.key,
        destination_account.key,
        mint_authority.key,
        &[],
        amount,
    )?;

    solana_program::program::invoke(
        &mint_to_ix,
        &[
            mint_account.clone(),
            destination_account.clone(),
            mint_authority.clone(),
            token_program.clone(),
        ],
    )?;

    msg!("Minted {} tokens", amount);
    Ok(())
}

fn process_transfer(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let source_owner = next_account_info(account_info_iter)?;
    let source_account = next_account_info(account_info_iter)?;
    let destination_account = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !source_owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Transfer tokens
    let transfer_ix = token_instruction::transfer(
        &spl_token::id(),
        source_account.key,
        destination_account.key,
        source_owner.key,
        &[],
        amount,
    )?;

    solana_program::program::invoke(
        &transfer_ix,
        &[
            source_account.clone(),
            destination_account.clone(),
            source_owner.clone(),
            token_program.clone(),
        ],
    )?;

    msg!("Transferred {} tokens", amount);
    Ok(())
}
