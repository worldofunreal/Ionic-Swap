use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
    clock::Clock,
    program::invoke,
};
use spl_token::{
    instruction as token_instruction,
    state::Mint,
};
use sha2::{Digest, Sha256};

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

#[derive(BorshSerialize, BorshDeserialize, Debug)]
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

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub enum HtlcStatus {
    Created,
    Claimed,
    Refunded,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum HtlcInstruction {
    CreateHtlc {
        amount: u64,
        hashlock: [u8; 32],
        timelock: i64,
        order_id: String,
    },
    ClaimHtlc {
        secret: [u8; 32],
    },
    RefundHtlc,
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = HtlcInstruction::try_from_slice(instruction_data)?;

    match instruction {
        HtlcInstruction::CreateHtlc { amount, hashlock, timelock, order_id } => {
            msg!("Instruction: CreateHtlc");
            process_create_htlc(program_id, accounts, amount, hashlock, timelock, order_id)
        }
        HtlcInstruction::ClaimHtlc { secret } => {
            msg!("Instruction: ClaimHtlc");
            process_claim_htlc(program_id, accounts, secret)
        }
        HtlcInstruction::RefundHtlc => {
            msg!("Instruction: RefundHtlc");
            process_refund_htlc(program_id, accounts)
        }
    }
}

fn process_create_htlc(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    hashlock: [u8; 32],
    timelock: i64,
    order_id: String,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let sender = next_account_info(account_info_iter)?;
    let htlc_account = next_account_info(account_info_iter)?;
    let sender_token_account = next_account_info(account_info_iter)?;
    let htlc_token_account = next_account_info(account_info_iter)?;
    let mint_account = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !sender.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Get current time
    let clock = Clock::get()?;
    
    // Validate timelock is in the future
    if timelock <= clock.unix_timestamp {
        return Err(ProgramError::InvalidArgument);
    }

    // Create HTLC account
    let htlc = Htlc {
        sender: *sender.key,
        recipient: *sender.key, // For simplicity, using sender as recipient
        amount,
        hashlock,
        timelock,
        order_id: order_id.clone(),
        status: HtlcStatus::Created,
        created_at: clock.unix_timestamp,
        claimed_at: None,
        refunded_at: None,
    };

    // Serialize and store HTLC
    let htlc_data = borsh::to_vec(&htlc).map_err(|_| ProgramError::InvalidAccountData)?;
    let space = htlc_data.len();
    let lamports = Rent::get()?.minimum_balance(space);

    // Create HTLC account
    let create_account_ix = system_instruction::create_account(
        sender.key,
        htlc_account.key,
        lamports,
        space as u64,
        _program_id,
    );

    invoke(
        &create_account_ix,
        &[sender.clone(), htlc_account.clone(), system_program.clone()],
    )?;

    // Store HTLC data
    let mut htlc_data = htlc_account.try_borrow_mut_data()?;
    htlc_data[..space].copy_from_slice(&borsh::to_vec(&htlc).map_err(|_| ProgramError::InvalidAccountData)?);

    // Transfer tokens to HTLC
    let transfer_ix = token_instruction::transfer(
        token_program.key,
        sender_token_account.key,
        htlc_token_account.key,
        sender.key,
        &[],
        amount,
    )?;

    invoke(
        &transfer_ix,
        &[
            sender_token_account.clone(),
            htlc_token_account.clone(),
            sender.clone(),
            token_program.clone(),
        ],
    )?;

    msg!("HTLC created successfully");
    msg!("Amount: {}", amount);
    msg!("Order ID: {}", order_id);
    Ok(())
}

fn process_claim_htlc(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    secret: [u8; 32],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let recipient = next_account_info(account_info_iter)?;
    let htlc_account = next_account_info(account_info_iter)?;
    let htlc_token_account = next_account_info(account_info_iter)?;
    let recipient_token_account = next_account_info(account_info_iter)?;
    let mint_account = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !recipient.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Deserialize HTLC
    let htlc_data = htlc_account.try_borrow_data()?;
    let mut htlc: Htlc = Htlc::try_from_slice(&htlc_data)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Validate HTLC status
    if htlc.status != HtlcStatus::Created {
        return Err(ProgramError::InvalidAccountData);
    }

    // Validate timelock hasn't expired
    let clock = Clock::get()?;
    if clock.unix_timestamp >= htlc.timelock {
        return Err(ProgramError::InvalidArgument);
    }

    // Validate secret matches hashlock
    let secret_hash = Sha256::digest(&secret);
    if secret_hash.as_slice() != &htlc.hashlock {
        return Err(ProgramError::InvalidArgument);
    }

    // Update HTLC status
    htlc.status = HtlcStatus::Claimed;
    htlc.claimed_at = Some(clock.unix_timestamp);

    // Store updated HTLC
    let mut htlc_data = htlc_account.try_borrow_mut_data()?;
    let serialized = borsh::to_vec(&htlc).map_err(|_| ProgramError::InvalidAccountData)?;
    htlc_data[..serialized.len()].copy_from_slice(&serialized);

    // Transfer tokens to recipient
    let transfer_ix = token_instruction::transfer(
        token_program.key,
        htlc_token_account.key,
        recipient_token_account.key,
        recipient.key,
        &[],
        htlc.amount,
    )?;

    invoke(
        &transfer_ix,
        &[
            htlc_token_account.clone(),
            recipient_token_account.clone(),
            recipient.clone(),
            token_program.clone(),
        ],
    )?;

    msg!("HTLC claimed successfully");
    msg!("Amount: {}", htlc.amount);
    Ok(())
}

fn process_refund_htlc(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let sender = next_account_info(account_info_iter)?;
    let htlc_account = next_account_info(account_info_iter)?;
    let htlc_token_account = next_account_info(account_info_iter)?;
    let sender_token_account = next_account_info(account_info_iter)?;
    let mint_account = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !sender.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Deserialize HTLC
    let htlc_data = htlc_account.try_borrow_data()?;
    let mut htlc: Htlc = Htlc::try_from_slice(&htlc_data)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Validate HTLC status
    if htlc.status != HtlcStatus::Created {
        return Err(ProgramError::InvalidAccountData);
    }

    // Validate timelock has expired
    let clock = Clock::get()?;
    if clock.unix_timestamp < htlc.timelock {
        return Err(ProgramError::InvalidArgument);
    }

    // Update HTLC status
    htlc.status = HtlcStatus::Refunded;
    htlc.refunded_at = Some(clock.unix_timestamp);

    // Store updated HTLC
    let mut htlc_data = htlc_account.try_borrow_mut_data()?;
    let serialized = borsh::to_vec(&htlc).map_err(|_| ProgramError::InvalidAccountData)?;
    htlc_data[..serialized.len()].copy_from_slice(&serialized);

    // Transfer tokens back to sender
    let transfer_ix = token_instruction::transfer(
        token_program.key,
        htlc_token_account.key,
        sender_token_account.key,
        sender.key,
        &[],
        htlc.amount,
    )?;

    invoke(
        &transfer_ix,
        &[
            htlc_token_account.clone(),
            sender_token_account.clone(),
            sender.clone(),
            token_program.clone(),
        ],
    )?;

    msg!("HTLC refunded successfully");
    msg!("Amount: {}", htlc.amount);
    Ok(())
}
