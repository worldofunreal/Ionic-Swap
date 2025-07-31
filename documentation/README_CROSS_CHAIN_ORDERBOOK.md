# Cross-Chain Orderbook Protocol

A decentralized cross-chain limit order protocol built on the Internet Computer (ICP) using HTLCs for atomic swaps.

## 🎯 Project Overview

This project implements an on-chain cross-chain limit order protocol that enables users to place limit orders for cross-chain token swaps. The protocol uses Hash Time-Locked Contracts (HTLCs) to ensure atomic swaps between ICP and EVM chains.

## 🏗️ Architecture

### Core Components

1. **Cross-Chain Orderbook Canister** (`cross_chain_orderbook`)
   - Written in Motoko
   - Manages order book and matching engine
   - Handles ICRC-2 token transfers
   - Stores active swaps and HTLC states

2. **Token Canister** (`token`)
   - ICRC-1/ICRC-2 compliant token
   - Supports approve/transfer_from flow
   - Used for ICP-side token operations

3. **EVM Components** (Future)
   - HTLC Escrow contracts
   - HTLC Factory contracts
   - EIP-712 signature verification

## ✅ Current Status

### Implemented Features
- ✅ ICRC-2 token integration
- ✅ Order placement and management
- ✅ Token locking mechanism
- ✅ Order book state management
- ✅ Comprehensive test suite

### Test Results
- ✅ **Order Placement**: Successfully places orders with token locking
- ✅ **Token Transfers**: ICRC-2 transfer_from working correctly
- ✅ **Balance Tracking**: Accurate balance changes verified
- ✅ **Order Management**: Orders stored and retrievable

## 🚀 Quick Start

### Prerequisites
```bash
# Install dfx
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Start local network
dfx start --background

# Create identities (if needed)
dfx identity new alice
dfx identity new bob
```

### Deployment
```bash
# Deploy canisters
dfx deploy token
dfx deploy cross_chain_orderbook

# Configure orderbook
dfx canister call cross_chain_orderbook setTokenCanister '(principal "ulvla-h7777-77774-qaacq-cai")'
```

### Testing
```bash
# Run full integration test
./test_cross_chain_orderbook.sh test

# Check balances
./test_cross_chain_orderbook.sh balance

# View orders
./test_cross_chain_orderbook.sh orders

# Cleanup
./test_cross_chain_orderbook.sh cleanup
```

## 📋 API Reference

### Order Management

#### Place ICP Order
```bash
dfx canister call cross_chain_orderbook placeIcpOrder '("SPIRAL", 50000000, "ETH", 500000000000000000, "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")'
```

#### Get Open Orders
```bash
dfx canister call cross_chain_orderbook getOpenOrders
```

#### Get User Orders
```bash
dfx canister call cross_chain_orderbook getUserOrders '(principal "4sgyd-owy2w-hltyd-xupdz-sdcvu-njjdc-6tbtp-klj7a-po3va-gkk4g-zqe")'
```

#### Cancel Order
```bash
dfx canister call cross_chain_orderbook cancelOrder '("order_15")'
```

### Token Management

#### Approve Orderbook
```bash
dfx canister call token icrc2_approve '(record { spender = record { owner = principal "ucwa4-rx777-77774-qaada-cai"; subaccount = null }; amount = 100000000 })'
```

#### Check Allowance
```bash
dfx canister call token icrc2_allowance '(record { account = record { owner = principal "4sgyd-owy2w-hltyd-xupdz-sdcvu-njjdc-6tbtp-klj7a-po3va-gkk4g-zqe"; subaccount = null }; spender = record { owner = principal "ucwa4-rx777-77774-qaada-cai"; subaccount = null } })'
```

## 🔧 Configuration

### Canister IDs (Local Development)
- **Token Canister**: `ulvla-h7777-77774-qaacq-cai`
- **Orderbook Canister**: `ucwa4-rx777-77774-qaada-cai`
- **Alice Principal**: `4sgyd-owy2w-hltyd-xupdz-sdcvu-njjdc-6tbtp-klj7a-po3va-gkk4g-zqe`
- **Bizkit Principal**: `vam5o-bdiga-izgux-6cjaz-53tck-eezzo-fezki-t2sh6-xefok-dkdx7-pae`

### Post-Deployment Setup
```bash
# Set token canister ID (required after each deployment)
dfx canister call cross_chain_orderbook setTokenCanister '(principal "ulvla-h7777-77774-qaacq-cai")'

# Verify configuration
dfx canister call cross_chain_orderbook getTokenCanister
```

## 📊 Test Results

### Successful Integration Test
```
Order Details:
- Order ID: order_15
- Token Sell: SPIRAL (50,000,000 units = 0.5 tokens)
- Token Buy: ETH (500,000,000,000,000,000 wei = 0.5 ETH)
- Owner: Alice
- Status: Open
- Hashed Secret: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

Balance Changes:
- Alice: 1,999,990,000 → 1,949,970,000 (-50,000,000)
- Orderbook: 1,000,000,000 → 1,050,000,000 (+50,000,000)
```

## 🚨 Known Issues & Solutions

### Issue 1: InsufficientFunds Error
**Problem**: Order placement fails with InsufficientFunds
**Solution**: Ensure token canister ID is set after deployment
```bash
dfx canister call cross_chain_orderbook setTokenCanister '(principal "ulvla-h7777-77774-qaacq-cai")'
```

### Issue 2: ICRC-2 Transfer Complexity
**Problem**: Complex memo handling and spender field conflicts
**Solution**: Simplified to use `null` memo and proper spender context

### Issue 3: Allowance Verification
**Problem**: Allowance showing 0 in transfer_from despite approval
**Solution**: Ensure proper spender context and subaccount handling

## 🔄 User Flow

### ICP User Order Placement
1. **Approve**: User approves orderbook canister to spend tokens
2. **Place Order**: User calls `placeIcpOrder` with order details
3. **Token Lock**: Tokens transferred from user to orderbook canister
4. **Order Created**: Order stored in orderbook with unique ID

### EVM User Order Placement (Future)
1. **Sign Message**: User signs EIP-712 structured message
2. **Submit Order**: Frontend calls `submitEvmOrder` with signature
3. **Verify Signature**: Canister verifies EIP-712 signature on-chain
4. **Order Created**: Order stored in orderbook

### Order Matching (Future)
1. **Take Order**: User calls `takeOrder` with order ID
2. **HTLC Creation**: HTLC state created for both chains
3. **Fund Locking**: Funds locked in HTLC contracts
4. **Secret Reveal**: Initiator reveals secret to claim funds
5. **Counter-Claim**: Counter-party claims funds with revealed secret

## 📁 Project Structure

```
src/
├── cross_chain_orderbook/
│   ├── main.mo                 # Main orderbook canister
│   ├── cross_chain_orderbook.did  # Candid interface
│   └── README.md              # Canister documentation
├── token/
│   └── Token.mo               # ICRC-1/ICRC-2 token canister
└── EVM/
    └── contracts/             # Future EVM contracts

test_cross_chain_orderbook.sh  # Integration test script
CROSS_CHAIN_ORDERBOOK_TEST_RESULTS.md  # Test documentation
TEST_SETUP_GUIDE.md           # Setup guide
```

## 🎯 Next Steps

### Immediate (Next Sprint)
1. **Order Matching**: Implement `takeOrder` functionality
2. **HTLC Management**: Add `claimFunds` and `refundFunds`
3. **EVM Integration**: Implement `submitEvmOrder` with EIP-712
4. **Order Cancellation**: Test and verify `cancelOrder`

### Medium Term
1. **EIP-712 Verification**: On-chain signature verification
2. **Secret Management**: Hash generation and verification
3. **State Persistence**: Stable storage across upgrades
4. **Error Handling**: Comprehensive error management

### Long Term
1. **Frontend Interface**: React/TypeScript UI
2. **EVM Contracts**: HTLC escrow and factory contracts
3. **Multi-Chain Support**: Additional EVM chains
4. **Performance Optimization**: Order book efficiency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [Motoko Language Guide](https://internetcomputer.org/docs/current/motoko/main/language-manual)
- [ICRC-1 Token Standard](https://github.com/dfinity/ICRC-1)
- [ICRC-2 Token Standard](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-2/)
- [HTLC Documentation](https://en.bitcoin.it/wiki/Hash_Time_Locked_Contracts)

---

**Status**: ✅ **CORE FUNCTIONALITY COMPLETE** - Ready for order matching and HTLC implementation 