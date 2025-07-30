# Cross-Chain Orderbook Test Setup Guide

## Quick Start

### Prerequisites
- dfx installed and running (`dfx start --background`)
- Both `token` and `cross_chain_orderbook` canisters deployed
- `alice` and `bizkit` identities available

### 1. Deploy Canisters (if not already done)
```bash
# Deploy token canister
dfx deploy token

# Deploy orderbook canister
dfx deploy cross_chain_orderbook

# Configure orderbook with token canister ID
dfx canister call cross_chain_orderbook setTokenCanister '(principal "ulvla-h7777-77774-qaacq-cai")'
```

### 2. Run the Test Script

#### Full Integration Test
```bash
./test_cross_chain_orderbook.sh test
```

#### Check Balances
```bash
./test_cross_chain_orderbook.sh balance
```

#### View Open Orders
```bash
./test_cross_chain_orderbook.sh orders
```

#### Cleanup (Cancel All Orders)
```bash
./test_cross_chain_orderbook.sh cleanup
```

#### Help
```bash
./test_cross_chain_orderbook.sh help
```

## Manual Testing Steps

### 1. Setup (as bizkit)
```bash
dfx identity use bizkit
dfx canister call cross_chain_orderbook setTokenCanister '(principal "ulvla-h7777-77774-qaacq-cai")'
```

### 2. Mint Tokens (as bizkit)
```bash
dfx canister call token mint '(record { to = record { owner = principal "4sgyd-owy2w-hltyd-xupdz-sdcvu-njjdc-6tbtp-klj7a-po3va-gkk4g-zqe"; subaccount = null }; amount = 1000000000 })'
```

### 3. Approve Orderbook (as alice)
```bash
dfx identity use alice
dfx canister call token icrc2_approve '(record { spender = record { owner = principal "ucwa4-rx777-77774-qaada-cai"; subaccount = null }; amount = 100000000 })'
```

### 4. Place Order (as alice)
```bash
dfx canister call cross_chain_orderbook placeIcpOrder '("SPIRAL", 50000000, "ETH", 500000000000000000, "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")'
```

### 5. Verify Results
```bash
# Check open orders
dfx canister call cross_chain_orderbook getOpenOrders

# Check balances
dfx canister call token icrc1_balance_of '(record { owner = principal "4sgyd-owy2w-hltyd-xupdz-sdcvu-njjdc-6tbtp-klj7a-po3va-gkk4g-zqe"; subaccount = null })'
dfx canister call token icrc1_balance_of '(record { owner = principal "ucwa4-rx777-77774-qaada-cai"; subaccount = null })'
```

## Expected Results

### Successful Test Output
```
=== Cross-Chain Orderbook Integration Test ===

[INFO] Checking if dfx is running...
[SUCCESS] dfx is running
[INFO] Configuring orderbook canister...
[SUCCESS] Orderbook canister configured
[INFO] Verifying orderbook configuration...
[SUCCESS] Orderbook configuration verified
[INFO] Checking initial balances...
[INFO] Checking balance for alice (4sgyd-owy2w-hltyd-xupdz-sdcvu-njjdc-6tbtp-klj7a-po3va-gkk4g-zqe)...
[SUCCESS] Balance: 1949970000 tokens
[INFO] Approving orderbook canister to spend 100000000 tokens as alice...
[SUCCESS] Approved 100000000 tokens for orderbook canister
[INFO] Checking allowance for alice...
[SUCCESS] Allowance: 100000000 tokens
[INFO] Placing order as alice...
[INFO] Selling: 50000000 SPIRAL
[INFO] Buying: 500000000000000000 ETH
[SUCCESS] Order placed successfully: order_16
[INFO] Getting open orders...
[SUCCESS] Found 1 open orders
[SUCCESS] Order verified in open orders
[INFO] Checking balance changes...
[SUCCESS] Alice transferred: 50000000 tokens
[SUCCESS] Orderbook received: 50000000 tokens

=== Integration Test Completed Successfully ===
Order ID: order_16
Tokens Locked: 50000000
```

## Troubleshooting

### Common Issues

#### 1. "dfx is not running"
```bash
dfx start --background
```

#### 2. "InsufficientFunds" error
- Check if token canister ID is set: `dfx canister call cross_chain_orderbook getTokenCanister`
- Set it if null: `dfx canister call cross_chain_orderbook setTokenCanister '(principal "ulvla-h7777-77774-qaacq-cai")'`

#### 3. "InsufficientAllowance" error
- Check allowance: `dfx canister call token icrc2_allowance '(record { account = record { owner = principal "4sgyd-owy2w-hltyd-xupdz-sdcvu-njjdc-6tbtp-klj7a-po3va-gkk4g-zqe"; subaccount = null }; spender = record { owner = principal "ucwa4-rx777-77774-qaada-cai"; subaccount = null } })'`
- Approve more tokens if needed

#### 4. "Only controllers can call install_code"
- Switch to controller identity: `dfx identity use bizkit`

## Canister IDs (Local Development)

- **Token Canister**: `ulvla-h7777-77774-qaacq-cai`
- **Orderbook Canister**: `ucwa4-rx777-77774-qaada-cai`
- **Alice Principal**: `4sgyd-owy2w-hltyd-xupdz-sdcvu-njjdc-6tbtp-klj7a-po3va-gkk4g-zqe`
- **Bizkit Principal**: `vam5o-bdiga-izgux-6cjaz-53tck-eezzo-fezki-t2sh6-xefok-dkdx7-pae`

## Next Steps

After successful testing:
1. Test order matching functionality
2. Test HTLC claim/refund processes
3. Test EVM order submission
4. Implement EIP-712 signature verification
5. Add secret hashing and verification 