# Etherlink HTLC Integration for Ionic-Swap

## Overview

This directory contains the Etherlink integration for the Ionic-Swap cross-chain HTLC system. The Etherlink HTLC contract enables atomic swaps between Etherlink and ICP via 1inch Fusion+ integration.

## 🎯 **Your Role: Etherlink Integration Developer**

You are responsible for implementing the **EVM side** of the cross-chain swap system, specifically targeting **Etherlink** (which is EVM-compatible) but testing on **BSC** first.

## 📁 Project Structure

```
src/etherlink/
├── contracts/
│   ├── EtherlinkHTLC.sol      # Main HTLC contract for Etherlink
│   └── MockERC20.sol          # Mock ERC20 token for testing
├── test/
│   └── EtherlinkHTLC.test.js  # Comprehensive test suite
├── scripts/
│   └── deploy.js              # Deployment script
├── deployments/               # Deployment artifacts (auto-generated)
├── docs/                      # Documentation
├── package.json               # Dependencies and scripts
├── hardhat.config.js          # Hardhat configuration
└── env.example               # Environment configuration template
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd src/etherlink
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
# Add your private keys, API keys, and RPC URLs
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### 5. Deploy to Local Network

```bash
# Start local Hardhat node
npm run node

# In another terminal, deploy contracts
npm run deploy:local
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Private Key for Contract Deployment and Testing
PRIVATE_KEY=your_private_key_here

# RPC Endpoints
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org/
ETHERLINK_MAINNET_RPC_URL=https://mainnet-rpc.etherlink.com/

# API Keys
BSCSCAN_API_KEY=your_bscscan_api_key_here
ETHERLINK_API_KEY=your_etherlink_api_key_here

# 1inch Fusion+ API
ONEINCH_API_KEY=your_1inch_api_key_here

# ICP Integration
ICP_NETWORK_SIGNER_ADDRESS=your_icp_network_signer_address_here
```

### Network Configuration

The project supports multiple networks:

- **Hardhat Local**: Chain ID 1337 (for development)
- **BSC Testnet**: Chain ID 97 (for initial testing)
- **BSC Mainnet**: Chain ID 56 (for production testing)
- **Etherlink Mainnet**: Chain ID 42766 (target deployment)
- **Etherlink Testnet**: Chain ID 128123 (when available)

## 📋 Your Tasks

### **Phase 1: Development Setup** ✅ **COMPLETED**

- [x] Set up project structure
- [x] Create Hardhat configuration
- [x] Set up environment configuration
- [x] Create main HTLC contract
- [x] Create deployment script
- [x] Create comprehensive test suite

### **Phase 2: Testing and Deployment**

#### **Step 1: Local Testing**
```bash
# Run comprehensive test suite
npm test

# Check test coverage
npm run test:coverage
```

#### **Step 2: BSC Testnet Deployment** (Next Priority)
```bash
# Deploy to BSC testnet for initial testing
npm run deploy:bsc

# Verify contract on BSCScan
npm run verify:bsc
```

#### **Step 3: Etherlink Deployment** (Final Goal)
```bash
# Deploy to Etherlink mainnet
npm run deploy:etherlink

# Verify contract on Etherlink Explorer
npm run verify:etherlink
```

### **Phase 3: Integration Testing**

#### **Step 1: Cross-Chain Testing**
- Test HTLC creation on Etherlink
- Test HTLC claiming with secrets
- Test refund functionality
- Test cross-chain swap operations

#### **Step 2: 1inch Fusion+ Integration**
- Test order hash linking
- Test cross-chain order management
- Test partial fill scenarios

#### **Step 3: ICP Integration**
- Coordinate with ICP canister team
- Test cross-chain communication
- Test Chain-Key signature verification

## 🧪 Testing

### Test Coverage

The test suite covers:

- ✅ **Deployment**: Contract initialization and configuration
- ✅ **ETH HTLC**: Create, claim, and refund ETH HTLCs
- ✅ **ERC20 HTLC**: Create, claim, and refund ERC20 HTLCs
- ✅ **Cross-Chain Swaps**: Create and complete cross-chain swaps
- ✅ **Query Functions**: Get HTLC details and user data
- ✅ **Admin Functions**: Fee updates, signer updates, pause/unpause
- ✅ **Fee Collection**: Fee calculation and withdrawal
- ✅ **Emergency Functions**: Emergency token withdrawal
- ✅ **Events**: All contract events
- ✅ **Error Handling**: Invalid inputs and unauthorized operations

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/EtherlinkHTLC.test.js

# Run tests with gas reporting
REPORT_GAS=true npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Local Development

```bash
# Start local node
npm run node

# Deploy to local network
npx hardhat run scripts/deploy.js --network hardhat
```

### BSC Testnet (Recommended First Step)

```bash
# Deploy to BSC testnet
npm run deploy:bsc

# Verify on BSCScan
npm run verify:bsc
```

### Etherlink Mainnet

```bash
# Deploy to Etherlink mainnet
npm run deploy:etherlink

# Verify on Etherlink Explorer
npm run verify:etherlink
```

## 📊 Contract Features

### Core HTLC Functionality

- **ETH HTLCs**: Lock, claim, and refund ETH with timeouts
- **ERC20 HTLCs**: Lock, claim, and refund ERC20 tokens
- **Cross-Chain Support**: Integration with ICP and other chains
- **1inch Fusion+**: Order hash linking and management

### Security Features

- **Reentrancy Protection**: Prevents reentrancy attacks
- **Access Control**: Owner-only admin functions
- **Pausable**: Emergency pause functionality
- **Fee Management**: Configurable claim and refund fees
- **Emergency Withdrawal**: Owner can withdraw stuck tokens

### Gas Optimization

- **Etherlink Optimized**: Designed for Etherlink's gas model
- **Efficient Storage**: Optimized data structures
- **Batch Operations**: Support for multiple operations

## 🔗 Integration Points

### ICP Canister Integration

The Etherlink contract integrates with the ICP canister through:

1. **Chain-Key Signatures**: ICP network signer verification
2. **Cross-Chain Swaps**: Coordinated HTLC operations
3. **1inch Fusion+**: Shared order management
4. **Event Emission**: Cross-chain event synchronization

### 1inch Fusion+ Integration

- **Order Hash Linking**: HTLCs linked to 1inch orders
- **Cross-Chain Orders**: Support for cross-chain order types
- **Partial Fills**: Integration with partial fill system

## 📈 Monitoring and Analytics

### Events

The contract emits comprehensive events for monitoring:

- `HTLCCreated`: New HTLC creation
- `HTLCClaimed`: Successful HTLC claims
- `HTLCRefunded`: HTLC refunds
- `CrossChainSwapCreated`: Cross-chain swap creation
- `CrossChainSwapCompleted`: Cross-chain swap completion
- `FeesUpdated`: Fee structure updates
- `FeesCollected`: Fee withdrawals

### Query Functions

- `getHTLC(htlcId)`: Get HTLC details
- `getCrossChainSwap(swapId)`: Get cross-chain swap details
- `getUserHTLCs(user)`: Get user's HTLCs
- `getUserCrossChainSwaps(user)`: Get user's cross-chain swaps
- `getHTLCByOrderHash(orderHash)`: Get HTLC by 1inch order hash

## 🛠️ Development Workflow

### 1. Local Development

```bash
# Start development
npm run node
npm test
npm run compile
```

### 2. Testnet Deployment

```bash
# Deploy to BSC testnet
npm run deploy:bsc

# Test functionality
# Verify contract
npm run verify:bsc
```

### 3. Mainnet Deployment

```bash
# Deploy to Etherlink mainnet
npm run deploy:etherlink

# Verify contract
npm run verify:etherlink
```

## 🔍 Troubleshooting

### Common Issues

1. **Compilation Errors**: Check Solidity version compatibility
2. **Test Failures**: Verify environment setup and dependencies
3. **Deployment Failures**: Check network configuration and gas settings
4. **Verification Failures**: Ensure constructor arguments match deployment

### Debug Commands

```bash
# Check contract size
npx hardhat size-contracts

# Run specific test
npx hardhat test --grep "Should create an ETH HTLC"

# Debug deployment
npx hardhat run scripts/deploy.js --network hardhat --verbose
```

## 📚 Resources

### Documentation

- [Etherlink Documentation](https://docs.etherlink.com/)
- [1inch Fusion+ Documentation](https://docs.1inch.dev/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs/)

### Useful Commands

```bash
# Clean build artifacts
npm run clean

# Generate documentation
npx hardhat docgen

# Flatten contracts
npx hardhat flatten contracts/EtherlinkHTLC.sol > EtherlinkHTLC_flattened.sol
```

## 🎯 Next Steps

### Immediate Tasks

1. **Run Tests**: Execute the comprehensive test suite
2. **BSC Testnet**: Deploy to BSC testnet for initial validation
3. **Integration Testing**: Test with ICP canister integration
4. **Etherlink Deployment**: Deploy to Etherlink mainnet

### Future Enhancements

1. **Gas Optimization**: Further optimize for Etherlink
2. **Advanced Features**: Add support for more token types
3. **Monitoring**: Implement comprehensive monitoring
4. **Security Audit**: Conduct formal security audit

## 🤝 Team Coordination

### With ICP Team

- Coordinate on Chain-Key signature implementation
- Test cross-chain communication
- Validate HTLC synchronization

### With Frontend Team

- Provide contract addresses and ABIs
- Coordinate on user interface integration
- Test end-to-end workflows

---

**Status**: ✅ **Development Setup Complete** | 🔄 **Ready for Testing** | 📋 **Next: BSC Testnet Deployment** 