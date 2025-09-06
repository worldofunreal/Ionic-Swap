# 🚰 TESTNET FAUCETS & TOKENS GUIDE

This guide shows you how to get testnet tokens for all the networks we're deploying to.

## **🌐 ETHEREUM TESTNETS**

### **Sepolia Testnet**
- **Faucet**: https://sepoliafaucet.com/
- **Alternative**: https://faucet.sepolia.dev/
- **RPC**: https://sepolia.infura.io/v3/YOUR-PROJECT-ID
- **Explorer**: https://sepolia.etherscan.io/
- **Chain ID**: 11155111

### **Holesky Testnet**
- **Faucet**: https://holesky-faucet.pk910.de/
- **Alternative**: https://faucet.holesky.ethpandaops.io/
- **RPC**: https://holesky.infura.io/v3/YOUR-PROJECT-ID
- **Explorer**: https://holesky.etherscan.io/
- **Chain ID**: 17000

## **🔷 POLYGON TESTNETS**

### **Mumbai Testnet**
- **Faucet**: https://faucet.polygon.technology/
- **Alternative**: https://mumbaifaucet.com/
- **RPC**: https://polygon-mumbai.infura.io/v3/YOUR-PROJECT-ID
- **Explorer**: https://mumbai.polygonscan.com/
- **Chain ID**: 80001

### **Amoy Testnet**
- **Faucet**: https://faucet.polygon.technology/
- **RPC**: https://polygon-amoy.infura.io/v3/YOUR-PROJECT-ID
- **Explorer**: https://amoy.polygonscan.com/
- **Chain ID**: 80002

## **🟡 BSC TESTNETS**

### **BSC Testnet**
- **Faucet**: https://testnet.binance.org/faucet-smart
- **Alternative**: https://faucet.quicknode.com/binance-smart-chain
- **RPC**: https://data-seed-prebsc-1-s1.binance.org:8545
- **Explorer**: https://testnet.bscscan.com/
- **Chain ID**: 97

### **Chapel Testnet**
- **Faucet**: Same as BSC Testnet
- **RPC**: https://data-seed-prebsc-1-s1.binance.org:8545
- **Explorer**: https://testnet.bscscan.com/
- **Chain ID**: 97

## **🔵 ARBITRUM TESTNETS**

### **Arbitrum Sepolia**
- **Faucet**: https://faucet.quicknode.com/arbitrum/sepolia
- **Alternative**: https://bridge.arbitrum.io/
- **RPC**: https://sepolia-rollup.arbitrum.io/rpc
- **Explorer**: https://sepolia.arbiscan.io/
- **Chain ID**: 421614

### **Arbitrum Goerli**
- **Faucet**: https://goerlifaucet.com/
- **RPC**: https://goerli-rollup.arbitrum.io/rpc
- **Explorer**: https://goerli.arbiscan.io/
- **Chain ID**: 421613

## **🟠 OPTIMISM TESTNETS**

### **Optimism Sepolia**
- **Faucet**: https://faucet.quicknode.com/optimism/sepolia
- **Alternative**: https://app.optimism.io/bridge
- **RPC**: https://sepolia.optimism.io
- **Explorer**: https://sepolia-optimism.etherscan.io/
- **Chain ID**: 11155420

### **Optimism Goerli**
- **Faucet**: https://goerlifaucet.com/
- **RPC**: https://goerli.optimism.io
- **Explorer**: https://goerli-optimism.etherscan.io/
- **Chain ID**: 420

## **🔵 BASE TESTNETS**

### **Base Sepolia**
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Alternative**: https://bridge.base.org/
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org/
- **Chain ID**: 84532

### **Base Goerli**
- **Faucet**: https://goerlifaucet.com/
- **RPC**: https://goerli.base.org
- **Explorer**: https://goerli.basescan.org/
- **Chain ID**: 84531

## **🟣 SOLANA TESTNETS**

### **Solana Devnet**
- **Faucet**: https://faucet.solana.com/
- **Alternative**: https://solfaucet.com/
- **RPC**: https://api.devnet.solana.com
- **Explorer**: https://explorer.solana.com/?cluster=devnet

### **Solana Testnet**
- **Faucet**: https://faucet.solana.com/
- **RPC**: https://api.testnet.solana.com
- **Explorer**: https://explorer.solana.com/?cluster=testnet

## **🚀 DEPLOYMENT COMMANDS**

### **Deploy to Specific Testnet**
```bash
# Deploy to Mumbai
npx hardhat run scripts/deploy-testnet.js --network mumbai

# Deploy to BSC Testnet
npx hardhat run scripts/deploy-testnet.js --network bscTestnet

# Deploy to Arbitrum Sepolia
npx hardhat run scripts/deploy-testnet.js --network arbitrumSepolia

# Deploy to Optimism Sepolia
npx hardhat run scripts/deploy-testnet.js --network optimismSepolia

# Deploy to Base Sepolia
npx hardhat run scripts/deploy-testnet.js --network baseSepolia
```

### **Deploy to All Testnets**
```bash
# This will attempt to deploy to all configured networks
npx hardhat run scripts/deploy-all-testnets.js
```

## **💰 REQUIRED TESTNET TOKENS**

### **Ethereum Networks (Sepolia, Holesky)**
- **ETH** for gas fees (0.01-0.1 ETH recommended)

### **Polygon Networks (Mumbai, Amoy)**
- **MATIC** for gas fees (1-10 MATIC recommended)

### **BSC Networks**
- **BNB** for gas fees (0.01-0.1 BNB recommended)

### **L2 Networks (Arbitrum, Optimism, Base)**
- **ETH** for gas fees (0.001-0.01 ETH recommended)

### **Solana Networks**
- **SOL** for transaction fees (0.1-1 SOL recommended)

## **⚠️ IMPORTANT NOTES**

1. **Keep Private Keys Secure**: Never commit private keys to git
2. **Use Test Wallets**: Create separate wallets for testing
3. **Monitor Gas Fees**: Gas prices vary significantly between networks
4. **Network Stability**: Testnets may have downtime or resets
5. **Token Limits**: Faucets have daily limits and may require social verification

## **🔧 TROUBLESHOOTING**

### **Common Issues**
- **Insufficient Balance**: Get more tokens from faucet
- **Network Congestion**: Wait or increase gas price
- **RPC Errors**: Check RPC endpoint and try alternatives
- **Contract Verification**: Use appropriate explorer API keys

### **Getting Help**
- Check network status on respective explorers
- Join Discord/Telegram communities for each network
- Use alternative RPC endpoints if main ones are down


