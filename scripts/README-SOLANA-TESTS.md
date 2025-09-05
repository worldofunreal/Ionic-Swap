# Solana Cross-Chain Test Suite

This test suite comprehensively tests the Solana cross-chain functionality implemented in the Ionic Swap backend canister.

## 🧪 Test Coverage

### 1. Solana HTLC Tests (`test-solana-htlc.cjs`)
- **Solana HTLC Creation**: Tests creating SPL token HTLCs
- **Solana HTLC Claiming**: Tests claiming HTLCs with secrets
- **Solana HTLC Refunding**: Tests refunding expired HTLCs
- **Solana HTLC Status**: Tests HTLC status queries
- **Solana Wallet**: Tests Solana address derivation from ICP principals
- **Solana RPC**: Tests Solana network interactions (balance, slot, SPL tokens)

### 2. Solana Cross-Chain Tests (`test-solana-to-evm.cjs`)
- **Solana → EVM Swaps**: Tests SPL token to ERC20 token swaps
- **EVM → Solana Swaps**: Tests ERC20 token to SPL token swaps
- **ICP → Solana Swaps**: Tests ICRC token to SPL token swaps
- **Solana → ICP Swaps**: Tests SPL token to ICRC token swaps

### 3. Order Pairing Tests (`test-order-pairing.cjs`)
- **EVM ↔ ICP Pairing**: Tests automatic pairing of EVM and ICP orders
- **EVM ↔ Solana Pairing**: Tests automatic pairing of EVM and Solana orders
- **ICP ↔ Solana Pairing**: Tests automatic pairing of ICP and Solana orders
- **Order Compatibility**: Tests order compatibility checking
- **Status Tracking**: Tests order status management

## 🚀 Quick Start

### Prerequisites
1. **dfx running**: `dfx start`
2. **Backend deployed**: `dfx deploy backend`
3. **Node.js dependencies**: `npm install` (in project root)

### Run All Tests
```bash
node scripts/run-solana-tests.cjs
```

### Run Specific Test
```bash
node scripts/run-solana-tests.cjs --test "Solana HTLC"
```

### List Available Tests
```bash
node scripts/run-solana-tests.cjs --list
```

## ⚙️ Configuration

### Update Test Configuration
Edit `test-config.json` to update:
- Backend canister ID
- RPC endpoints
- Token addresses
- Test user addresses
- Test amounts

### Key Configuration Fields
```json
{
  "backend": {
    "canisterId": "your-canister-id",
    "localHost": "http://127.0.0.1:4943"
  },
  "tokens": {
    "spiral": {
      "evm": "0x...",
      "icp": "canister-id",
      "solana": "mint-address"
    }
  },
  "users": {
    "evm": ["0x..."],
    "icp": ["principal-id"],
    "solana": ["base58-address"]
  }
}
```

## 🔧 Test Scripts

### Individual Test Scripts
- `test-solana-htlc.cjs` - HTLC functionality tests
- `test-solana-to-evm.cjs` - Cross-chain swap tests
- `test-order-pairing.cjs` - Order pairing tests

### Test Runner
- `run-solana-tests.cjs` - Comprehensive test runner with reporting

## 📊 Expected Test Results

### Successful Test Output
```
🧪 Starting Solana HTLC comprehensive tests...

📋 Step 1: Getting canister's Solana address...
✅ Canister Solana address: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM

📋 Step 2: Creating Solana HTLC...
✅ Solana HTLC created: Solana HTLC created successfully! HTLC ID: solana_htlc_test_order_123

🎉 All Solana HTLC tests completed successfully!
```

### Test Summary
```
============================================================
  TEST SUMMARY
============================================================

📊 Results:
  ✅ Passed: 3
  ❌ Failed: 0
  📈 Total: 3

🎉 All tests passed! Solana cross-chain functionality is working correctly.
```

## 🐛 Troubleshooting

### Common Issues

#### 1. dfx Not Running
```
❌ dfx is not running. Please start dfx with: dfx start
```
**Solution**: Start dfx with `dfx start`

#### 2. Canister Not Deployed
```
❌ Backend canister is not deployed. Please deploy with: dfx deploy backend
```
**Solution**: Deploy the backend with `dfx deploy backend`

#### 3. Invalid Token Addresses
```
⚠️ HTLC creation failed (expected without real order)
```
**Solution**: Update `test-config.json` with actual testnet token addresses

#### 4. RPC Connection Issues
```
⚠️ Balance query failed: Connection refused
```
**Solution**: Update RPC endpoints in `test-config.json`

### Debug Mode
Add `--verbose` flag to see detailed output:
```bash
node scripts/run-solana-tests.cjs --verbose
```

## 🔍 Test Details

### HTLC Test Flow
1. **Create Order**: Creates a test order for HTLC creation
2. **Create HTLC**: Creates Solana HTLC with SPL tokens
3. **Check Status**: Verifies HTLC status
4. **Test Claiming**: Tests HTLC claiming with secrets
5. **Test Refunding**: Tests HTLC refunding after expiration

### Cross-Chain Test Flow
1. **Create Orders**: Creates orders for different swap directions
2. **Check Pairing**: Verifies automatic order pairing
3. **Verify HTLCs**: Checks HTLC creation on both chains
4. **Test Completion**: Tests swap completion flow

### Order Pairing Test Flow
1. **Create Compatible Orders**: Creates orders that should pair
2. **Verify Pairing**: Checks if orders are automatically paired
3. **Test Compatibility**: Tests order compatibility logic
4. **Status Tracking**: Verifies order status updates

## 📝 Notes

- Tests use mock data where real blockchain interactions aren't available
- Some tests may fail without actual testnet tokens and addresses
- The test suite is designed to verify the backend logic, not end-to-end blockchain functionality
- Update configuration with real testnet data for complete testing

## 🎯 Next Steps

After successful testing:
1. **Implement Full Transaction Signing**: Add IC ECDSA signing for Solana transactions
2. **End-to-End Testing**: Test with real testnet tokens and addresses
3. **Performance Testing**: Test with larger amounts and multiple concurrent swaps
4. **Security Testing**: Test edge cases and error conditions
