# Solana Escrow Workflow - Reserve → Execute → Settle (MVP)

## Overview

This document outlines the MVP workflow for Solana token swaps using the ICP canister as orchestrator with its own Solana liquidity. The canister provides instant fills by using its own token reserves while settling asynchronously.

## Architecture Components

### 1. ICP Canister (Orchestrator)
- **TSS Public Key**: `0x0e5Ee4407a866D0C5FC282696d026E5C5506dF09`
- **Solana Address**: `4YicBFKxoMNqaqrjDKXdrBzXSAQT4Sqa4o9SPhnAJjvY`
- **Role**: Order matcher, liquidity provider, settlement coordinator

### 2. Solana Escrow Program
- **Program ID**: `[TO_BE_DEPLOYED]` (will be real 64-char base58 string)
- **Functions**: 
  - `reserve()`: User locks tokens in vault
  - `release()`: Canister pulls tokens from vault to its account
  - `refund()`: User gets tokens back via ICP (only if swap not completed)
  - `initialize_tss_authority()`: One-time setup of TSS public key
- **Role**: Secure token vault per order, gated by ICP TSS signatures

### 3. User (Trader)
- **Role**: Initiates swaps, provides source tokens, receives destination tokens
- **Interaction**: Sets delegate authority, signs swap intent on ICP

## Token Setup

### Supported Tokens (Devnet)
- **Spiral Token**: `HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK` (8 decimals)
- **Stardust Token**: `A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH` (8 decimals)
- **SOL**: Native Solana token
- **Deployer**: `6bve2yBseLPuiAhj47CW8agLo4xKzkxAmtLKEnACwcES`

### Canister Liquidity Requirements
The ICP canister must maintain liquidity pools:
```
Canister Solana Account: 4YicBFKxoMNqaqrjDKXdrBzXSAQT4Sqa4o9SPhnAJjvY
├── SOL: [CHECK_BALANCE] (for gas and direct swaps)
├── Spiral: [TRANSFER_FROM_DEPLOYER] (for Spiral → Stardust swaps)
└── Stardust: [TRANSFER_FROM_DEPLOYER] (for Stardust → Spiral swaps)
```

### Exchange Rate & Fees
- **Exchange Rate**: 1:1 for testing (no slippage)
- **Fee**: 0.1% per transaction (deducted from user's tokens)
- **No Expiry**: Canister provides instant fills

## Detailed Workflow

### Phase 1: Setup & Funding

#### 1.1 Fund ICP Canister
```bash
# Check deployer SOL balance first
solana balance 6bve2yBseLPuiAhj47CW8agLo4xKzkxAmtLKEnACwcES

# Fund canister with SOL (if deployer has enough)
solana transfer 4YicBFKxoMNqaqrjDKXdrBzXSAQT4Sqa4o9SPhnAJjvY 10

# Fund canister with Spiral tokens
spl-token transfer HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK 1000000 4YicBFKxoMNqaqrjDKXdrBzXSAQT4Sqa4o9SPhnAJjvY

# Fund canister with Stardust tokens  
spl-token transfer A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH 1000000 4YicBFKxoMNqaqrjDKXdrBzXSAQT4Sqa4o9SPhnAJjvY
```

#### 1.2 Fund Test User
```bash
# Fund user with SOL
solana transfer <USER_ADDRESS> 1

# Fund user with Spiral tokens
spl-token transfer HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK 1000 <USER_ADDRESS>
```

### Phase 2: Reserve (User → Vault)

#### 2.1 User Sets Delegate Authority
**Example**: User wants to swap 100 Spiral for Stardust

```javascript
// User sets delegate authority for canister to pull tokens
await splToken.setAuthority(
  userTokenAccount,
  canisterAddress, // 4YicBFKxoMNqaqrjDKXdrBzXSAQT4Sqa4o9SPhnAJjvY
  amount: 100
);
```

#### 2.2 User Signs Swap Intent on ICP
```javascript
// User calls ICP canister with swap intent
const swapRequest = {
  sourceToken: "HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK", // Spiral
  destinationToken: "A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH", // Stardust
  amount: 100,
  userAddress: "USER_SOLANA_ADDRESS"
};

await canister.createSwapOrder(swapRequest);
```

#### 2.3 Canister Validates & Creates Vault
```rust
// ICP canister validates user has sufficient allowance
let allowance = check_user_allowance(user_address, source_token, 100);
if allowance < 100 {
    return Err("Insufficient allowance");
}

// Create escrow vault
let order_id = generate_order_id();
escrow_program.reserve(
    order_id,
    100, // amount (no expiry for MVP)
);
```

#### 2.4 Canister Pulls Tokens to Vault
```rust
// ICP canister signs transaction to pull tokens from user to vault
let transfer_tx = create_transfer_instruction(
    user_token_account,
    escrow_token_account,
    user_authority: user_address,
    amount: 100
);

// Canister signs and submits transaction
let tx_hash = sign_and_send_solana_transaction(transfer_tx);
log_transfer_result(tx_hash);
```

**Result**: 100 Spiral tokens are now locked in the escrow vault, owned by the canister.

### Phase 3: Execute (Fast Fill)

#### 3.1 Canister Provides Immediate Fill
```rust
// ICP canister immediately transfers Stardust to user (1:1 rate + 0.1% fee)
let fee = 100 * 0.001; // 0.1% fee = 0.1 tokens
let fill_amount = 100 - fee; // 99.9 Stardust tokens

let fill_tx = create_transfer_instruction(
    canister_stardust_account,
    user_stardust_account,
    canister_authority: canister_address,
    amount: fill_amount
);

let fill_tx_hash = sign_and_send_solana_transaction(fill_tx);
log_fill_result(fill_tx_hash, fill_amount);
```

**Result**: User receives 99.9 Stardust tokens immediately (fast fill with 0.1% fee).

### Phase 4: Settle (Vault → Canister)

#### 4.1 Canister Pulls Tokens from Vault (Background)
```rust
// ICP canister signs release transaction to pull tokens from vault
let release_tx = escrow_program.release(
    order_id,
    amount: 100,
    fill_nonce: 1,
    dst_chain_id: 0, // Solana
    dst_tx_hash: fill_transaction_hash,
    tss_signature: canister_signature,
    recovery_id: 0
);

// Retry logic for failed settlements
let mut retry_count = 0;
let max_retries = 3;

loop {
    match sign_and_send_solana_transaction(release_tx.clone()) {
        Ok(tx_hash) => {
            log_settlement_success(tx_hash);
            break;
        }
        Err(e) => {
            retry_count += 1;
            if retry_count >= max_retries {
                log_settlement_failure(e);
                break;
            }
            // Wait and retry
            std::thread::sleep(Duration::from_secs(5));
        }
    }
}
```

#### 4.2 Tokens Move to Canister
**Result**: 100 Spiral tokens move from vault to canister's account, replenishing its liquidity.

## Security Model

### Access Control
- **Vault Owner**: ICP Canister (4YicBFKxoMNqaqrjDKXdrBzXSAQT4Sqa4o9SPhnAJjvY)
- **Vault Controller**: Only ICP canister can call `release()` and `refund()`
- **User Access**: Users can only call `reserve()` and approve token transfers

### TSS Signature Verification
```rust
// Every release requires valid TSS signature
let message = create_release_message(
    order_id,
    recipient: canister_address,
    amount,
    fill_nonce,
    dst_chain_id,
    dst_tx_hash,
    escrow_account
);

let signature = tss_sign(message);
verify_signature(signature, tss_public_key, message);
```

### Replay Protection
- Each release uses unique `fill_nonce`
- Nonces are stored in escrow account
- Duplicate nonces are rejected

## Error Handling & Recovery

### Failed Reserve
- User can cancel before approval
- No tokens locked

### Failed Execute
- Vault remains locked
- User can request refund after expiry
- Canister can retry execution

### Failed Settle
- Tokens remain in vault
- Canister can retry settlement
- Automatic refund after expiry

## Liquidity Management

### Canister Liquidity Monitoring
```rust
// Monitor canister balances
let sol_balance = get_sol_balance(canister_address);
let spiral_balance = get_spl_balance(canister_address, spiral_mint);
let stardust_balance = get_spl_balance(canister_address, stardust_mint);

// Rebalance if needed
if spiral_balance < minimum_threshold {
    // Trigger liquidity rebalancing
    rebalance_liquidity();
}
```

### Partial Fill Support
```rust
// Support multiple fills per order
let fill_1 = release(50, nonce: 1);  // First 50 tokens
let fill_2 = release(30, nonce: 2);  // Next 30 tokens  
let fill_3 = release(20, nonce: 3);  // Final 20 tokens
```

## Testing Scenarios (MVP)

### Test 1: Basic Swap
1. Fund canister with 1000 Spiral, 1000 Stardust
2. Fund user with 100 Spiral
3. User sets delegate authority for canister
4. User signs swap intent on ICP: 100 Spiral → 99.9 Stardust
5. Verify: User has 99.9 Stardust, canister has 1100 Spiral

### Test 2: Insufficient Allowance
1. User tries to swap 100 Spiral but hasn't set delegate
2. System returns "Insufficient allowance" error
3. Verify: No tokens moved, proper error handling

### Test 3: Failed Settlement
1. User swaps 100 Spiral → 99.9 Stardust
2. Canister provides fill but settlement fails
3. Canister retries 3 times, logs failure
4. Verify: User has Stardust, canister can retry later

### Test 4: Insufficient Canister Liquidity
1. User tries to swap 2000 Spiral (more than canister has)
2. System rejects swap before creating vault
3. Verify: No vault created, proper error handling

## Next Steps (MVP)

1. **Deploy Escrow Program**: Deploy the Solana escrow program to devnet
2. **Initialize TSS Authority**: Set up TSS public key in escrow program
3. **Check Deployer Balance**: Verify deployer has enough SOL and tokens
4. **Fund Canister**: Transfer SOL and SPL tokens to canister
5. **Implement ICP Functions**: Add swap order creation and validation
6. **Test Basic Flow**: Implement and test the complete workflow
7. **Add Error Handling**: Implement comprehensive error handling and logging

## Questions for You

1. **Deployer Balance**: Should I check the deployer's SOL balance first?
2. **ICP Functions**: Do you want me to implement the ICP canister functions for swap orders?
3. **Error Handling**: Any specific error messages or logging format you prefer?
4. **Testing**: Should I create a test script to verify the complete flow?
