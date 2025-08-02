# HTLC Contracts

Cross-chain atomic swap contracts for EVM ↔ ICP integration, based on 1inch Fusion+ pattern.

## Backend Architecture

### Core Components

- **EscrowFactory** - Deploys proxy escrows with deterministic addresses
- **EscrowSrc/Dst** - Source/destination escrow implementations
- **BaseEscrow** - Abstract base with core HTLC functionality
- **Libraries** - ImmutablesLib, TimelocksLib, ProxyHashLib for parameter management

### How It Works

1. **ICP Integration**: ICP canister acts as network signer, creating source escrows via RPC calls
2. **Deterministic Deployment**: Create2 pattern ensures predictable escrow addresses
3. **Timelock Stages**: Enforced withdrawal/cancellation periods prevent premature actions
4. **Secret Verification**: Hashlock ensures atomic execution across chains

### Workflow

```
ICP Canister → createSrcEscrow() → Taker → createDstEscrow() → 
Secret Reveal → withdraw() on both chains
```

## Quick Start

```bash
npm install
cp env.example .env
# Configure PRIVATE_KEY and your RPC_URLs
npx hardhat run scripts/deploy.js --network (eg. sepolia)
```

## Networks

- **Sepolia** (11155111) - Testing
- **Etherlink Testnet** (128123) - Testing  
- ** Mainnet** (42766) - Production

## Testing

```bash
npx hardhat test
npx hardhat run scripts/test-contracts.js --network hardhat
``` 