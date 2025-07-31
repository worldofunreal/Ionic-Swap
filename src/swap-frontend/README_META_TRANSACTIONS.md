# EIP-2771 Meta-Transaction Implementation for Cross-Chain HTLC

This implementation provides gasless transactions for the cross-chain HTLC system using EIP-2771 meta-transactions, with support for both Ethereum (Sepolia) and Internet Computer (ICP) networks.

## 🏗️ Architecture Overview

### Components

1. **MetaTransaction Contract** (`MetaTransaction.sol`)
   - EIP-2771 compliant meta-transaction implementation
   - Handles signature verification and nonce management
   - Supports EIP-712 typed data signing

2. **HTLC Contract with Meta-Transactions** (`EtherlinkHTLCWithMetaTx.sol`)
   - Extends the base HTLC functionality with meta-transaction support
   - Provides gasless versions of create, claim, and refund operations
   - Inherits from MetaTransaction contract

3. **Frontend Services**
   - `MetaTransactionService`: Handles EIP-712 signing and meta-transaction creation
   - `RelayerService`: Executes meta-transactions on behalf of users
   - `ICPService`: Manages ICP/Internet Identity integration

4. **React Components**
   - Updated `page.tsx` with HTLC management UI
   - MetaMask and Internet Identity wallet integration
   - Real-time balance and allowance tracking

## 🚀 Features

### Gasless Transactions
- **Create HTLC**: Users can create HTLCs without paying gas fees
- **Claim HTLC**: Claim HTLCs using the secret without gas costs
- **Refund HTLC**: Refund expired HTLCs gaslessly

### Cross-Chain Support
- **Ethereum (Sepolia)**: Meta-transactions with EIP-2771
- **Internet Computer**: Native ICP HTLC operations
- **Token Support**: ERC-20 tokens and native ETH

### Wallet Integration
- **MetaMask**: For Ethereum operations
- **Internet Identity**: For ICP operations
- **Automatic Balance Tracking**: Real-time updates

## 📋 Prerequisites

### Smart Contracts
1. Deploy `MetaTransaction.sol` to Sepolia
2. Deploy `EtherlinkHTLCWithMetaTx.sol` to Sepolia
3. Deploy HTLC canister to ICP

### Environment Setup
1. Configure RPC endpoints
2. Set up relayer with private key
3. Configure ICP canister ID

### Dependencies
```bash
npm install ethers@^6.15.0
npm install @dfinity/auth-client@^3.1.0
npm install @dfinity/agent@^3.1.0
```

## 🔧 Configuration

### Contract Addresses
Update `src/swap-frontend/app/config/constants.ts`:

```typescript
export const HTLC_CONTRACT_ADDRESS = '0xBe953413e9FAB2642625D4043e4dcc0D16d14e77';
export const TEST_TOKEN_ADDRESS = '0xb3684bC4c3AcEDf35bC83E02A954B546103313e1';
```

### RPC Configuration
```typescript
export const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/your-project-id';
export const RELAYER_PRIVATE_KEY = 'your-relayer-private-key-here';
```

### ICP Configuration
```typescript
export const ICP_CANISTER_ID = 'your-htlc-canister-id-here';
```

## 🎯 Usage

### 1. Connect Wallets
```typescript
// Connect MetaMask
const connectEthWallet = async () => {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  setEthAddress(accounts[0]);
};

// Connect Internet Identity
const connectICWallet = async () => {
  const authClient = await AuthClient.create();
  await authClient.login({
    identityProvider: "https://identity.ic0.app",
    onSuccess: () => {
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal().toString();
      setIcpAddress(principal);
    }
  });
};
```

### 2. Generate Secret and Hashlock
```typescript
const generateSecretAndHashlock = () => {
  const { secret, hashlock } = metaTxService.generateSecretAndHashlock();
  setSecret(secret);
  setHashlock(hashlock);
};
```

### 3. Approve Tokens (for ERC-20)
```typescript
const approveTokens = async () => {
  const txHash = await metaTxService.approveTokens(amount);
  console.log('Tokens approved:', txHash);
};
```

### 4. Create HTLC (Gasless)
```typescript
const createHTLCGasless = async () => {
  const htlcData = {
    recipient: ethAddress,
    amount: amount,
    hashlock: hashlock,
    timelock: Math.floor(Date.now() / 1000) + 3600,
    token: '0x0000000000000000000000000000000000000000', // ETH
    sourceChain: 1, // Ethereum
    targetChain: 0, // ICP
    orderHash: ''
  };

  const metaTxData = await metaTxService.signCreateHTLCMetaTransaction(ethAddress, htlcData);
  const result = await relayMetaTransaction(HTLC_CONTRACT_ADDRESS, metaTxData);
  
  if (result.success) {
    console.log('HTLC created:', result.transactionHash);
  }
};
```

### 5. Claim HTLC (Gasless)
```typescript
const claimHTLCGasless = async () => {
  const metaTxData = await metaTxService.signClaimHTLCMetaTransaction(ethAddress, htlcId, secret);
  const result = await relayMetaTransaction(HTLC_CONTRACT_ADDRESS, metaTxData);
  
  if (result.success) {
    console.log('HTLC claimed:', result.transactionHash);
  }
};
```

### 6. ICP HTLC Operations
```typescript
// Create HTLC on ICP
const createHTLCOnICP = async () => {
  const htlcData = {
    recipient: Principal.fromText(icpAddress),
    amount: BigInt(parseFloat(amount) * 1e8),
    tokenCanister: Principal.anonymous(),
    expirationTime: BigInt(Math.floor(Date.now() / 1000) + 3600),
    chainType: 'ICP',
    ethereumAddress: ethAddress
  };

  const htlcId = await icpService.createHTLC(htlcData);
  console.log('ICP HTLC created:', htlcId);
};

// Claim HTLC on ICP
const claimHTLCOnICP = async () => {
  await icpService.claimHTLC(htlcId, secret);
  console.log('ICP HTLC claimed successfully');
};
```

## 🔐 Security Considerations

### Meta-Transaction Security
1. **Nonce Management**: Each user has a unique nonce to prevent replay attacks
2. **Signature Verification**: EIP-712 typed data signing ensures message integrity
3. **Domain Separation**: Contract-specific domain prevents cross-contract attacks

### Relayer Security
1. **Private Key Management**: Store relayer private keys securely
2. **Gas Estimation**: Proper gas estimation prevents transaction failures
3. **Error Handling**: Comprehensive error handling for failed transactions

### User Security
1. **Secret Management**: Secrets should be generated securely and stored safely
2. **Wallet Integration**: Use official wallet providers (MetaMask, Internet Identity)
3. **Transaction Verification**: Always verify transaction details before signing

## 🧪 Testing

### Local Development
```bash
# Start development server
npm run dev

# Test MetaMask connection
# Test Internet Identity connection
# Test HTLC creation and claiming
```

### Contract Testing
```bash
# Deploy contracts to Sepolia testnet
npx hardhat deploy --network sepolia

# Test meta-transactions
npx hardhat test test/meta-transactions.test.js
```

### Integration Testing
```bash
# Test cross-chain HTLC flow
npm run test:integration

# Test relayer functionality
npm run test:relayer
```

## 📊 Monitoring

### Transaction Monitoring
- Track meta-transaction success rates
- Monitor gas costs and relayer balance
- Alert on failed transactions

### User Analytics
- Track wallet connection rates
- Monitor HTLC creation and claiming patterns
- Analyze cross-chain transaction flows

## 🚨 Troubleshooting

### Common Issues

1. **MetaMask Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Check if user rejected the connection request
   - Verify network is set to Sepolia

2. **Internet Identity Connection Failed**
   - Check if Internet Identity service is accessible
   - Verify canister ID configuration
   - Ensure proper authentication flow

3. **Meta-Transaction Failed**
   - Check relayer balance and gas prices
   - Verify signature validity
   - Ensure nonce is correct

4. **Token Approval Failed**
   - Check token balance
   - Verify contract address
   - Ensure sufficient gas for approval

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG_MODE = true;
```

## 🔄 Future Enhancements

1. **Batch Meta-Transactions**: Support for multiple operations in a single meta-transaction
2. **Advanced Relayer**: Implement a more sophisticated relayer with queue management
3. **Cross-Chain Relayers**: Support for relayers on multiple chains
4. **Gas Estimation**: Dynamic gas estimation based on network conditions
5. **Transaction Batching**: Batch multiple HTLC operations for efficiency

## 📚 References

- [EIP-2771: Secure Protocol for Native Meta Transactions](https://eips.ethereum.org/EIPS/eip-2771)
- [EIP-712: Ethereum Typed Structured Data Hashing and Signing](https://eips.ethereum.org/EIPS/eip-712)
- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [MetaMask Documentation](https://docs.metamask.io/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 