# Ionic Swap Solana Token

A Solana SPL Token implementation for the Ionic Swap cross-chain platform. This token follows Solana's SPL Token standard and integrates with the existing EVM and ICP token ecosystem.

## Overview

The Ionic Solana Token is designed to be part of the bridgeless multi-chain token architecture, allowing seamless cross-chain swaps between:
- **EVM chains** (Ethereum, Polygon, BSC)
- **ICP** (Internet Computer)
- **Solana**

## Token Specifications

- **Name**: Ionic Token
- **Symbol**: IONIC
- **Decimals**: 8
- **Initial Supply**: 100,000,000 tokens
- **Standard**: SPL Token (Solana Program Library)
- **Network**: Solana Devnet/Testnet

## Prerequisites

### 1. Install Solana CLI Tools

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Add to PATH (add this to your ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version
```

### 2. Install Rust and Cargo

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add to PATH
source ~/.cargo/env

# Install Solana BPF tools
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana-install init
```

### 3. Set Up Solana Wallet

```bash
# Create a new keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Set Solana to devnet
solana config set --url https://api.devnet.solana.com

# Get testnet SOL
solana airdrop 2
```

### 4. Install Node.js Dependencies

```bash
cd src/solana
npm install
```

## Quick Start

### 1. Build the Program

```bash
# Build in release mode
npm run build:release
```

### 2. Deploy to Devnet

```bash
# Deploy the program
npm run deploy:devnet

# This will create a deployment.json file with the program ID
```

### 3. Create the Token

```bash
# Create the Ionic token
npm run create-token

# Or with custom parameters
npm run create-token -- --name "Ionic Token" --symbol "IONIC" --decimals 8 --initial-supply 100000000000000000
```

## Scripts

### Deployment Scripts

- `npm run build` - Build the program in debug mode
- `npm run build:release` - Build the program in release mode
- `npm run deploy:devnet` - Deploy to Solana devnet
- `npm run deploy:testnet` - Deploy to Solana testnet

### Token Management Scripts

- `npm run create-token` - Create and initialize the Ionic token
- `npm run mint-tokens` - Mint additional tokens (requires mint authority)
- `npm run transfer-tokens` - Transfer tokens between accounts

## Project Structure

```
src/solana/
├── src/
│   └── lib.rs              # Main Solana program
├── scripts/
│   ├── deploy.js           # Program deployment script
│   ├── create-token.js     # Token creation script
│   ├── mint-tokens.js      # Token minting script
│   └── transfer-tokens.js  # Token transfer script
├── Cargo.toml              # Rust dependencies
├── package.json            # Node.js dependencies
└── README.md               # This file
```

## Token Features

### SPL Token Standard Compliance
- Full compatibility with Solana's SPL Token standard
- Support for Associated Token Accounts (ATA)
- Metadata support for token information

### Cross-Chain Integration
- Designed to work with Ionic Swap's bridgeless architecture
- Compatible with EVM and ICP token standards
- Supports atomic cross-chain swaps

### Security Features
- Mint authority control
- Freeze authority (optional)
- Transfer restrictions
- Supply limits

## Testing

### Local Testing

```bash
# Run unit tests
cargo test

# Run integration tests
cargo test --test integration_tests
```

### Devnet Testing

```bash
# Deploy to devnet
npm run deploy:devnet

# Create token on devnet
npm run create-token

# Test transfers
npm run transfer-tokens
```

## Integration with Ionic Swap

The Solana token integrates with the existing Ionic Swap platform:

1. **Frontend Integration**: Add Solana wallet connection (Phantom, Solflare)
2. **Backend Integration**: Add Solana HTLC contracts
3. **Cross-Chain Swaps**: Enable EVM ↔ Solana and ICP ↔ Solana swaps

### Frontend Changes Needed

```javascript
// Add Solana wallet connection
import { Connection, PublicKey } from '@solana/web3.js';
import { Token } from '@solana/spl-token';

// Add to token list
const tokens = [
  // ... existing tokens
  {
    id: 'ionic-solana',
    symbol: 'IONIC',
    name: 'Ionic Token',
    icon: '⚡',
    network: 'Solana',
    type: 'spl',
    mintAddress: 'YOUR_MINT_ADDRESS'
  }
];
```

## Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   # Make sure Rust is up to date
   rustup update
   
   # Clean and rebuild
   cargo clean
   cargo build-bpf --release
   ```

2. **Deployment Failures**
   ```bash
   # Check SOL balance
   solana balance
   
   # Airdrop more SOL if needed
   solana airdrop 2
   ```

3. **Transaction Failures**
   ```bash
   # Check transaction logs
   solana confirm <transaction_signature>
   
   # Verify account exists
   solana account <account_address>
   ```

### Getting Help

- Check Solana documentation: https://docs.solana.com/
- SPL Token documentation: https://spl.solana.com/token
- Ionic Swap documentation: [Project README](../README.md)

## License

MIT License - see [LICENSE](../../LICENSE) for details.
