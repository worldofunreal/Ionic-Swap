use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    clock::Clock,
    sysvar::Sysvar,
};

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Htlc {
    pub sender: [u8; 32],
    pub recipient: [u8; 32],
    pub amount: u64,
    pub hashlock: [u8; 32],
    pub timelock: i64,
    pub status: u8, // 0=Created, 1=Claimed, 2=Refunded
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum HtlcInstruction {
    CreateHtlc {
        amount: u64,
        hashlock: [u8; 32],
        timelock: i64,
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
        HtlcInstruction::CreateHtlc { amount, hashlock, timelock } => {
            create_htlc(program_id, accounts, amount, hashlock, timelock)
        }
        HtlcInstruction::ClaimHtlc { secret } => {
            claim_htlc(program_id, accounts, secret)
        }
        HtlcInstruction::RefundHtlc => {
            refund_htlc(program_id, accounts)
        }
    }
}

fn create_htlc(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    hashlock: [u8; 32],
    timelock: i64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let sender = next_account_info(accounts_iter)?;
    let htlc_account = next_account_info(accounts_iter)?;
    
    // Verify sender is signer
    if !sender.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Get current time
    let clock = Clock::get()?;
    
    // Validate timelock is in the future
    if timelock <= clock.unix_timestamp {
        return Err(ProgramError::InvalidArgument);
    }
    
    // Create HTLC
    let htlc = Htlc {
        sender: sender.key.to_bytes(),
        recipient: sender.key.to_bytes(), // Simplified
        amount,
        hashlock,
        timelock,
        status: 0, // Created
    };
    
    // Serialize and store HTLC
    let htlc_data = borsh::to_vec(&htlc).map_err(|_| ProgramError::InvalidAccountData)?;
    htlc_account.try_borrow_mut_data()?[..htlc_data.len()].copy_from_slice(&htlc_data);
    
    msg!("HTLC created with amount: {}", amount);
    Ok(())
}

fn claim_htlc(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    secret: [u8; 32],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let _claimant = next_account_info(accounts_iter)?;
    let htlc_account = next_account_info(accounts_iter)?;
    
    // Deserialize HTLC
    let htlc_data = &htlc_account.try_borrow_data()?;
    let mut htlc: Htlc = Htlc::try_from_slice(htlc_data)?;
    
    // Check if already claimed or refunded
    if htlc.status != 0 {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify secret matches hashlock
    let mut hasher = solana_program::keccak::Hasher::default();
    hasher.hash(&secret);
    let computed_hash = hasher.result();
    
    if computed_hash.to_bytes() != htlc.hashlock {
        return Err(ProgramError::InvalidArgument);
    }
    
    // Mark as claimed
    htlc.status = 1;
    
    // Update account data
    let htlc_data = borsh::to_vec(&htlc).map_err(|_| ProgramError::InvalidAccountData)?;
    htlc_account.try_borrow_mut_data()?[..htlc_data.len()].copy_from_slice(&htlc_data);
    
    msg!("HTLC claimed successfully");
    Ok(())
}

fn refund_htlc(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let _refunder = next_account_info(accounts_iter)?;
    let htlc_account = next_account_info(accounts_iter)?;
    
    // Deserialize HTLC
    let htlc_data = &htlc_account.try_borrow_data()?;
    let mut htlc: Htlc = Htlc::try_from_slice(htlc_data)?;
    
    // Check if already claimed or refunded
    if htlc.status != 0 {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Check if timelock has expired
    let clock = Clock::get()?;
    if clock.unix_timestamp < htlc.timelock {
        return Err(ProgramError::InvalidArgument);
    }
    
    // Mark as refunded
    htlc.status = 2;
    
    // Update account data
    let htlc_data = borsh::to_vec(&htlc).map_err(|_| ProgramError::InvalidAccountData)?;
    htlc_account.try_borrow_mut_data()?[..htlc_data.len()].copy_from_slice(&htlc_data);
    
    msg!("HTLC refunded successfully");
    Ok(())
}