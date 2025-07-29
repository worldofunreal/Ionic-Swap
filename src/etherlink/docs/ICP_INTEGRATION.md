# EVM-ICP Integration Documentation

## Overview

This document explains how the Etherlink HTLC contract integrates with the ICP canister for cross-chain atomic swaps. The integration enables seamless communication between EVM chains (Etherlink) and the Internet Computer Protocol (ICP).

## Architecture

### Components

1. **Etherlink HTLC Contract** (`EtherlinkHTLC.sol`): Smart contract on Etherlink for HTLC operations
2. **ICP Canister** (`fusion_htlc_canister`): Motoko canister on ICP for HTLC management
3. **ICP Client** (`icp-client.js`): JavaScript client for EVM-ICP communication
4. **Integration Test** (`integration-test.js`): End-to-end testing of the cross-chain workflow

### Communication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Etherlink     │    │   ICP Client    │    │   ICP Canister  │
│   HTLC Contract │◄──►│   (JavaScript)  │◄──►│   (Motoko)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup

### 1. Environment Configuration

Add the following to your `.env` file:

```bash
# ICP Integration
ICP_CANISTER_ID=your_icp_canister_id_here
DFX_NETWORK=local  # or "ic" for mainnet

# EVM Configuration
CHAIN_ID=42766  # Etherlink mainnet (use 97 for BSC testnet)
```

### 2. Install Dependencies

```bash
npm install @dfinity/agent @dfinity/candid
```

### 3. Deploy ICP Canister

```bash
# From project root
dfx deploy fusion_htlc_canister
```

## Usage

### ICP Client

The `ICPClient` class provides methods to interact with the ICP canister:

```javascript
const { ICPClient } = require("./scripts/icp-client");

// Initialize client
const icpClient = new ICPClient(ICP_CANISTER_ID);

// Test connectivity
await icpClient.testConnectivity();

// Create HTLC on ICP
const htlcId = await icpClient.createICPHTLC(
    recipient,
    amount,
    tokenCanister,
    expirationTime,
    chainType,
    ethereumAddress
);

// Set hashlock
await icpClient.setICPHTLCHashlock(htlcId, hashlock);

// Create HTLC on EVM through ICP
const interactionId = await icpClient.createEVMHTLC(
    chainId,
    evmHtlcAddress,
    hashlock,
    recipient,
    amount,
    expiration
);
```

### Complete Workflow Example

```javascript
const { ethers } = require("hardhat");
const { ICPClient } = require("./scripts/icp-client");

async function crossChainSwap() {
    // 1. Initialize clients
    const icpClient = new ICPClient(ICP_CANISTER_ID);
    const [deployer] = await ethers.getSigners();
    
    // 2. Deploy Etherlink contract
    const EtherlinkHTLC = await ethers.getContractFactory("EtherlinkHTLC");
    const etherlinkHTLC = await EtherlinkHTLC.deploy(deployer.address);
    await etherlinkHTLC.deployed();
    
    // 3. Generate swap data
    const secret = ethers.utils.randomBytes(32);
    const hashlock = ethers.utils.keccak256(ethers.utils.hexlify(secret));
    const recipient = ethers.Wallet.createRandom().address;
    const amount = ethers.utils.parseEther("0.1");
    const expiration = Math.floor(Date.now() / 1000) + 3600;
    
    // 4. Create HTLC on ICP
    const icpHtlcId = await icpClient.createICPHTLC(
        deployer.address,
        amount.toString(),
        "0x0000000000000000000000000000000000000000",
        expiration,
        { "Ethereum": null },
        recipient
    );
    
    // 5. Set hashlock
    await icpClient.setICPHTLCHashlock(icpHtlcId, hashlock);
    
    // 6. Create HTLC on EVM through ICP
    const evmInteractionId = await icpClient.createEVMHTLC(
        42766, // Etherlink
        etherlinkHTLC.address,
        hashlock,
        recipient,
        amount.toString(),
        expiration
    );
    
    // 7. Monitor status
    const status = await icpClient.monitorHTLCStatus(icpHtlcId, 42766, etherlinkHTLC.address);
    console.log("Swap status:", status);
}
```

## API Reference

### ICPClient Methods

#### Core HTLC Operations

- `createICPHTLC(recipient, amount, tokenCanister, expirationTime, chainType, ethereumAddress)`
  - Creates an HTLC on the ICP canister
  - Returns: HTLC ID

- `setICPHTLCHashlock(htlcId, hashlock)`
  - Sets the hashlock for an ICP HTLC
  - Returns: boolean success

- `createEVMHTLC(chainId, evmHtlcAddress, hashlock, recipient, amount, expiration)`
  - Creates an HTLC on EVM chain through ICP
  - Returns: Interaction ID

- `claimEVMHTLC(chainId, evmHtlcAddress, secret)`
  - Claims an HTLC on EVM chain through ICP
  - Returns: Interaction ID

- `refundEVMHTLC(chainId, evmHtlcAddress)`
  - Refunds an HTLC on EVM chain through ICP
  - Returns: Interaction ID

#### Query Operations

- `getICPHTLC(htlcId)`
  - Gets HTLC details from ICP canister
  - Returns: HTLC object

- `getEVMInteraction(interactionId)`
  - Gets EVM interaction details
  - Returns: Interaction object

- `getEVMInteractionsByHTLC(htlcId)`
  - Gets all EVM interactions for an HTLC
  - Returns: Array of interactions

- `monitorHTLCStatus(htlcId, chainId, evmHtlcAddress)`
  - Monitors HTLC status across both chains
  - Returns: Status object

#### 1inch Integration

- `link1inchOrder(htlcId, oneinchOrder, isSourceChain, partialFillIndex)`
  - Links a 1inch order to an HTLC
  - Returns: boolean success

- `get1inchOrder(htlcId)`
  - Gets linked 1inch order for an HTLC
  - Returns: Order object

- `parseOrderSecretsForHTLC(orderHash)`
  - Parses order secrets for HTLC claim
  - Returns: Parsed secrets

#### Testing & Connectivity

- `testConnectivity()`
  - Tests ICP canister connectivity
  - Returns: boolean success

- `testEVMConnectivity(chainId)`
  - Tests EVM RPC connectivity through ICP
  - Returns: Test result

- `getChainConfig(chainId)`
  - Gets EVM chain configuration
  - Returns: Chain config object

## Integration with 1inch Fusion+

The system integrates with 1inch Fusion+ for order management:

```javascript
// Create mock 1inch order
const oneinchOrder = {
    order_hash: "0x...",
    maker: deployer.address,
    taker: recipient,
    src_chain_id: 1, // Ethereum
    dst_chain_id: 42766, // Etherlink
    maker_asset: "0x0000000000000000000000000000000000000000", // ETH
    taker_asset: "0x0000000000000000000000000000000000000000", // ETH
    making_amount: amount.toString(),
    taking_amount: amount.toString(),
    hashlock: hashlock,
    timelock: expiration,
    secret_hashes: [hashlock],
    fills: []
};

// Link order to HTLC
await icpClient.link1inchOrder(icpHtlcId, oneinchOrder, true);

// Get linked order
const linkedOrder = await icpClient.get1inchOrder(icpHtlcId);
```

## Testing

### Run Integration Test

```bash
npm run integration-test
```

### Run Individual Tests

```bash
# Test ICP connectivity
npm run test-icp

# Test contract functionality
npm test

# Test with coverage
npm run test:coverage
```

## Deployment

### 1. Deploy to BSC Testnet

```bash
# Deploy Etherlink contract
npm run deploy:bsc

# Set up environment
export ICP_CANISTER_ID="your_deployed_canister_id"
export CHAIN_ID=97  # BSC testnet

# Run integration test
npm run integration-test
```

### 2. Deploy to Etherlink Mainnet

```bash
# Deploy Etherlink contract
npm run deploy:etherlink

# Set up environment
export ICP_CANISTER_ID="your_deployed_canister_id"
export CHAIN_ID=42766  # Etherlink mainnet

# Run integration test
npm run integration-test
```

## Error Handling

The ICP client includes comprehensive error handling:

```javascript
try {
    const result = await icpClient.createICPHTLC(...);
    if (result) {
        console.log("✅ HTLC created successfully");
    } else {
        console.error("❌ Failed to create HTLC");
    }
} catch (error) {
    console.error("❌ Error:", error.message);
}
```

## Troubleshooting

### Common Issues

1. **ICP Canister Connection Failed**
   - Check canister ID is correct
   - Ensure canister is deployed and running
   - Verify network configuration

2. **EVM RPC Connection Failed**
   - Check chain ID is correct
   - Verify RPC endpoint is accessible
   - Ensure sufficient cycles for ICP canister

3. **Transaction Failures**
   - Check gas settings
   - Verify contract addresses
   - Ensure sufficient test tokens

### Debug Commands

```bash
# Check ICP canister status
dfx canister status fusion_htlc_canister

# Test ICP connectivity
dfx canister call fusion_htlc_canister greet "test"

# Check EVM RPC connectivity
dfx canister call fusion_htlc_canister test_evm_rpc "(1)"

# View canister logs
dfx canister call fusion_htlc_canister get_cycles_balance
```

## Security Considerations

1. **Private Key Management**: Never expose private keys in code
2. **Canister Authentication**: Use proper authentication for canister calls
3. **Input Validation**: Validate all inputs before sending to canister
4. **Error Handling**: Implement proper error handling for all operations
5. **Transaction Monitoring**: Monitor all cross-chain transactions

## Next Steps

1. **ckETH Integration**: Implement actual transaction signing using Chain-Key signatures
2. **Dynamic Gas Estimation**: Add real-time gas price and limit estimation
3. **Advanced Monitoring**: Implement comprehensive transaction monitoring
4. **Security Audit**: Conduct formal security audit of the integration
5. **Production Deployment**: Deploy to production networks with proper security measures

## Resources

- [ICP Chain Fusion Documentation](https://internetcomputer.org/docs/building-apps/chain-fusion/ethereum/overview)
- [EVM RPC Canister Documentation](https://internetcomputer.org/docs/current/developer-docs/integrations/evm-rpc)
- [1inch Fusion+ Documentation](https://docs.1inch.dev/)
- [Etherlink Documentation](https://docs.etherlink.com/) 