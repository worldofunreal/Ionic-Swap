# Solana Token Deployment Guide

This guide walks you through deploying the Ionic Solana token step by step.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Solana CLI installed
- [ ] Rust and Cargo installed
- [ ] Solana BPF tools installed
- [ ] A Solana wallet/keypair
- [ ] Testnet SOL (for fees)
- [ ] Node.js and npm installed

## Step 1: Environment Setup

### Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### Install Solana BPF Tools
```bash
solana-install init
```

## Step 2: Wallet Setup

### Create a New Keypair
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

### Configure Solana for Devnet
```bash
solana config set --url https://api.devnet.solana.com
```

### Get Testnet SOL
```bash
solana airdrop 2
```

## Step 3: Project Setup

### Navigate to Solana Directory
```bash
cd src/solana
```

### Install Dependencies
```bash
npm install
```

### Test Your Setup
```bash
npm run test:setup
```

This will verify that everything is properly configured.

## Step 4: Build the Program

### Build in Release Mode
```bash
npm run build:release
```

This creates the optimized program binary.

## Step 5: Deploy the Program

### Deploy to Devnet
```bash
npm run deploy:devnet
```

This will:
- Build the program
- Deploy it to Solana devnet
- Save deployment info to `deployment.json`

**Expected Output:**
```
✅ Program deployed successfully!
📋 Program ID: <your_program_id>
🔗 Transaction: https://explorer.solana.com/tx/<tx_hash>?cluster=devnet
```

## Step 6: Create the Token

### Create Ionic Token
```bash
npm run create-token
```

This will:
- Create a mint account
- Initialize the token with metadata
- Create associated token account
- Mint initial supply
- Save token info to `token-info.json`

**Expected Output:**
```
🎉 Token created successfully!
📋 Mint Address: <mint_address>
🏦 Associated Token Account: <ata_address>
🔗 Explorer: https://explorer.solana.com/address/<mint_address>?cluster=devnet
```

## Step 7: Verify Deployment

### Check Token on Explorer
1. Open the explorer link from the output
2. Verify the token details match your configuration
3. Check that the initial supply was minted

### Verify Token Info
```bash
cat token-info.json
```

This should show:
- Mint address
- Associated token account
- Token metadata
- Initial supply

## Step 8: Test Token Operations

### Check Token Balance
```bash
solana account <associated_token_account>
```

### Transfer Tokens (Optional)
```bash
npm run transfer-tokens
```

## Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Clean and rebuild
cargo clean
cargo build-bpf --release
```

**Deployment Failures:**
```bash
# Check balance
solana balance

# Airdrop more SOL if needed
solana airdrop 2
```

**Transaction Failures:**
```bash
# Check transaction status
solana confirm <transaction_signature>

# Verify account exists
solana account <account_address>
```

### Getting Help

- Check the logs for specific error messages
- Verify all prerequisites are installed
- Ensure you have sufficient SOL for fees
- Check Solana network status

## Next Steps

After successful deployment:

1. **Integration**: Add the token to your frontend
2. **Testing**: Test cross-chain swaps
3. **Documentation**: Update project documentation
4. **Mainnet**: Deploy to mainnet when ready

## Configuration Files

The deployment creates several important files:

- `deployment.json`: Program deployment information
- `token-info.json`: Token configuration and addresses
- `env.example`: Environment variable template

## Security Notes

- Keep your keypair secure
- Never commit private keys to version control
- Use environment variables for sensitive data
- Test thoroughly on devnet before mainnet

## Support

For issues or questions:
- Check the main README.md
- Review Solana documentation
- Check project issues on GitHub
