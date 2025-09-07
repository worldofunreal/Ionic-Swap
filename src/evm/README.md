# Token Contracts

Cross-chain token contracts for EVM integration.

## Core Components

- **BridgelessToken** - Cross-chain token implementation
- **SpiralToken** - Spiral token contract
- **StardustToken** - Stardust token contract
- **ERC20** - Standard ERC20 token for testing

## Quick Start

```bash
npm install
cp env.example .env
# Configure PRIVATE_KEY and your RPC_URLs
npx hardhat run scripts/deploy-token.js --network sepolia
```

## Networks

- **Sepolia** (11155111) - Testing
- **Etherlink Testnet** (128123) - Testing  
- **Etherlink Mainnet** (42766) - Production

## Testing

```bash
npx hardhat test
npx hardhat run scripts/deploy-token.js --network hardhat
```