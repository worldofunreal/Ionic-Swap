# Etherlink HTLC Contracts

This directory contains the Etherlink HTLC contracts based on the 1inch Fusion+ atomic swap pattern, adapted for cross-chain swaps between Etherlink and ICP.

## Architecture Overview

The contracts follow the 1inch pattern with the following key components:

### Core Contracts

1. **EtherlinkEscrowFactory** - Main factory contract that deploys proxy escrows
2. **EtherlinkEscrowSrc** - Source escrow implementation (Etherlink side)
3. **EtherlinkEscrowDst** - Destination escrow implementation (Etherlink side)
4. **BaseEscrow** - Abstract base contract with core functionality
5. **Escrow** - Abstract escrow contract with address validation

### Libraries

- **ImmutablesLib** - Handles immutable escrow parameters
- **TimelocksLib** - Manages timelock stages and delays
- **ProxyHashLib** - Computes proxy bytecode hashes

### Interfaces

- **IBaseEscrow** - Base escrow interface
- **IEscrowFactory** - Factory interface
- **IEscrowSrc** - Source escrow interface
- **IEscrowDst** - Destination escrow interface
- **IEscrow** - General escrow interface

## Key Features

### 1. ICP Integration
- ICP canister can be the owner of EVM contracts
- ICP makes RPC calls to create and manage escrows
- Chain-Key signature verification support

### 2. Deterministic Addresses
- All escrow addresses are computed deterministically
- Uses Create2 for predictable deployment
- Same parameters always result in the same address

### 3. Timelock Stages
- **Source Withdrawal** - Private withdrawal period
- **Source Public Withdrawal** - Public withdrawal period
- **Source Cancellation** - Private cancellation period
- **Source Public Cancellation** - Public cancellation period
- **Destination Withdrawal** - Private withdrawal period
- **Destination Public Withdrawal** - Public withdrawal period
- **Destination Cancellation** - Cancellation period

### 4. Fee Structure
- Configurable claim and refund fees
- Fees collected by ICP network signer
- Emergency withdrawal capabilities

## Deployment

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp env.example .env
```

3. Configure your `.env` file:
```bash
# Required
PRIVATE_KEY=your_deployer_private_key_here
ICP_NETWORK_SIGNER_ADDRESS=0x1234567890123456789012345678901234567890

# Optional
NETWORK=sepolia
RESCUE_DELAY_SRC=86400
RESCUE_DELAY_DST=86400
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy to Etherlink Testnet

```bash
npx hardhat run scripts/deploy.js --network etherlinkTestnet
```

### Deploy to Etherlink Mainnet

```bash
npx hardhat run scripts/deploy.js --network etherlinkMainnet
```

## Testing

### Run Local Tests

```bash
npx hardhat test
```

### Test Contract Functionality

```bash
npx hardhat run scripts/test-contracts.js --network hardhat
```

## Usage

### For ICP Canister Integration

1. **Deploy Factory**: Deploy `EtherlinkEscrowFactory` with ICP signer address
2. **Create Source Escrow**: ICP calls `createSrcEscrow()` with order parameters
3. **Create Destination Escrow**: Taker calls `createDstEscrow()` with matching parameters
4. **Withdraw**: Use secret to withdraw funds from escrows
5. **Cancel**: Cancel escrows after timelock expiration

### Example Workflow

```javascript
// 1. Deploy factory
const factory = await EtherlinkEscrowFactory.deploy(icpSigner, 86400, 86400);

// 2. Create source escrow (ICP calls this)
await factory.connect(icpSigner).createSrcEscrow(immutables, dstComplement, {
    value: safetyDeposit
});

// 3. Create destination escrow (taker calls this)
await factory.connect(taker).createDstEscrow(dstImmutables, srcCancellationTime, {
    value: amount + safetyDeposit
});

// 4. Withdraw with secret
await escrowSrc.connect(taker).withdraw(secret, immutables);
await escrowDst.connect(maker).withdraw(secret, dstImmutables);
```

## Security Considerations

1. **Access Control**: Only ICP network signer can create source escrows
2. **Timelocks**: Strict timelock enforcement prevents premature actions
3. **Deterministic Addresses**: Prevents address spoofing attacks
4. **Secret Verification**: Hashlock verification ensures only valid secrets work
5. **Emergency Functions**: ICP signer can rescue stuck funds

## Integration with ICP

The ICP canister should:

1. **Monitor Orders**: Watch for new orders in the orderbook
2. **Create Escrows**: Call `createSrcEscrow()` when orders are matched
3. **Manage Secrets**: Generate and distribute secrets securely
4. **Execute Claims**: Call withdrawal functions with valid secrets
5. **Handle Cancellations**: Cancel escrows if needed

## Network Configuration

### Supported Networks

- **Sepolia** (Chain ID: 11155111) - For testing
- **Etherlink Testnet** (Chain ID: 128123) - For testing
- **Etherlink Mainnet** (Chain ID: 42766) - For production

### RPC Endpoints

- Sepolia: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
- Etherlink Testnet: `https://node.ghostnet.tezos.marigold.dev`
- Etherlink Mainnet: `https://node.mainnet.tezos.marigold.dev`

## Contract Verification

### Sepolia
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <ICP_SIGNER> <RESCUE_DELAY_SRC> <RESCUE_DELAY_DST>
```

### Etherlink Testnet
```bash
npx hardhat verify --network etherlinkTestnet <CONTRACT_ADDRESS> <ICP_SIGNER> <RESCUE_DELAY_SRC> <RESCUE_DELAY_DST>
```

## License

MIT License - see LICENSE file for details. 