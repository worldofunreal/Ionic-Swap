# Ionic Swap 🔄

**A Unified Cross-Chain Atomic Swap Platform for ICP and EVM Chains**

Ionic Swap is a gasless cross-chain atomic swap platform, inspired in 1inch Fusion+ atomic swaps that enables trustless token exchanges between EVMs and ICP. The platform uses a fully on-chain architecture with Hash Time-Locked Contracts (HTLCs), an on-chain relayer and resolver to ensure atomic, secure, and transparent cross-chain transactions.

## 🌟 Key Features

### 🔐 **Trustless Atomic Swaps**
- **No Centralized Intermediary**: All swaps are executed through smart contracts and HTLCs
- **Atomic Execution**: Either both parties receive their tokens or neither does
- **Time-Locked Security**: Automatic refund mechanisms if swaps aren't completed within specified timeframes

### 🔄 **Bidirectional Cross-Chain Support**
- **ICP → EVM**: Swap ICRC tokens for ERC20 tokens on EVM chains
- **EVM → ICP**: Swap ERC20 tokens for ICRC tokens on ICP
- **Supported Chains**: Internet Computer, Etherlink, Ethereum, Polygon, BSC

### 💰 **Automatic Escrow System**
- **Instant Token Locking**: Tokens are automatically locked in escrow when orders are created
- **No Manual Deposits**: Users don't need to manually transfer tokens to escrow contracts
- **Destination Addresses**: Users specify where they want their swapped tokens delivered

### 🎯 **Unified Limit Order Protocol**
- **Single Interface**: One system handles both ICP→EVM and EVM→ICP directions
- **Manual Pairing**: Users can browse and select compatible orders
- **Real-Time Matching**: Automatic order compatibility checking

### ⚡ **Gasless Operations**
- **Permit-Based Approvals**: EVM and ICP users can approve tokens without paying gas fees

## 🏗️ Architecture

### **Backend (ICP Canister)**
- **Rust-based canister** running on the Internet Computer
- **HTLC Management**: Creates and manages HTLCs on both ICP and EVM chains
- **Order Coordination**: Handles cross-chain swap coordination and validation
- **Token Operations**: Manages ICRC token transfers and approvals
- **EVM Integration**: Interacts with EVM chains through HTTP outcall capabilities

### **Frontend (React + Vite)**
- **Modern Web Interface**: Built with React, Tailwind CSS, and Vite
- **Wallet Integration**: Supports Internet Identity and MetaMask providing both with a 0x or PID
- **Real-Time Updates**: Live order status and transaction tracking

### **Smart Contracts (EVM)**
- **HTLC Contracts**: Secure token locking and release mechanisms
- **Escrow System**: Automated token escrow for cross-chain swaps
- **Factory Pattern**: Deployable escrow contracts for scalability
- **Security Features**: Reentrancy protection, timelock validation, and access controls

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm >= 7.0.0
- DFX (Internet Computer SDK)
- MetaMask or Internet Identity wallet

### Installation

1. **Install DFX (Internet Computer SDK)**
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

2. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ionic-Swap
   ```

3. **Install dependencies**
   ```bash
   npm install
   cd src/frontend && npm install
   cd ../../src/evm && npm install
   ```

### 🏃‍♂️ Quick Start

#### **Start the Backend (ICP Canister)**
```bash
# Start DFX local replica
dfx start

# Deploy the backend canister
dfx deploy backend

# Deploy ICRC tokens and set up initial distribution
chmod +x scripts/deploy-icrc-tokens.sh
./scripts/deploy-icrc-tokens.sh
```

#### **Start the Frontend**
```bash
cd src/frontend
npm i
npm start
```

### 🧪 Testing

#### **Run Full Swap Test**
```bash
# Test EVM-to-EVM atomic swap functionality
node scripts/test-evm-to-evm.cjs
```

**Note**: The EVM contracts are already deployed on Sepolia and working with the frontend/backend. No additional deployment is required for testing.

### 📋 Development Workflow

1. **Start DFX** (if not already running)
   ```bash
   dfx start
   ```

2. **Deploy Backend and ICP Tokens**
   ```bash
   dfx deploy backend && chmod +x scripts/deploy-icrc-tokens.sh && ./deploy-icrc-tokens.sh
   ```

3. **Start Frontend**
   ```bash
   cd src/frontend && npm start
   ```

4. **Run Tests**
   ```bash
   node scripts/test-evm-to-evm.cjs
   ```

## 📖 How It Works

### 1. **Order Creation**
- **ICP → EVM**: User specifies EVM destination address and amount. Canister automatically pulls ICRC tokens into escrow.
- **EVM → ICP**: User provides signed permit. Canister executes permit and creates EVM HTLC to hold ERC20 tokens.

### 2. **Token Escrow**
- Tokens are automatically locked in escrow contracts
- ICP tokens are held in the canister
- EVM tokens are held in HTLC contracts
- Users specify destination addresses for their swapped tokens

### 3. **Order Matching**
- Users browse available orders in the unified orderbook
- System automatically checks order compatibility
- Manual pairing allows users to select their preferred swap partner

### 4. **Swap Execution**
- When compatible orders are paired, HTLCs are created on both chains
- Users provide secrets to claim tokens at their specified destinations
- Atomic execution ensures both parties receive their tokens simultaneously

### 5. **Completion & Refunds**
- Successful swaps release tokens to destination addresses
- Expired orders automatically refund tokens to original owners
- Time-locked security prevents indefinite token locking

## 🔧 Technical Components

### **Core Smart Contracts**
- `HTLC.sol`: Main HTLC contract for EVM chains
- `Escrow.sol`: Base escrow functionality
- `EscrowFactory.sol`: Factory for deploying escrow contracts
- `SpiralToken.sol` / `StardustToken.sol`: Example ERC20 tokens

### **ICP Canister Functions**
- `create_icp_to_evm_order()`: Create ICP→EVM swap orders
- `create_evm_to_icp_order()`: Create EVM→ICP swap orders
- `execute_atomic_swap()`: Execute paired swap orders
- `claim_evm_htlc()`: Claim tokens from EVM HTLCs
- `refund_icp_htlc_public()`: Refund expired ICP HTLCs

### **Frontend Components**
- `SwapForm.jsx`: Main swap interface
- `OrdersPage.jsx`: Orderbook and order management
- `HistoryPage.jsx`: Transaction history and status
- `ConnectWallet.jsx`: Wallet connection interface

## 🛡️ Security Features

### **HTLC Security**
- **Hash-Locked**: Tokens can only be claimed with the correct secret
- **Time-Locked**: Automatic refunds after expiration
- **Atomic**: Either both parties succeed or both fail

### **Smart Contract Security**
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Access Controls**: Owner-only functions for critical operations
- **Input Validation**: Comprehensive parameter validation
- **Emergency Pause**: Ability to pause operations if needed

### **Cross-Chain Security**
- **Canister Verification**: ICP canister acts as trusted coordinator
- **Signature Verification**: Chain-key signatures for cross-chain operations
- **Transaction Validation**: Comprehensive transaction receipt verification

## 📊 Supported Tokens

### **ICP Tokens (ICRC-1)**
- **Spiral Token**: Example ICRC-1 token on ICP
- **Stardust Token**: Example ICRC-1 token on ICP
- **Any ICRC-1 Token**: Platform supports any ICRC-1 compliant token

### **EVM Tokens (ERC-20)**
- **Spiral Token**: ERC-20 version on EVM chains
- **Stardust Token**: ERC-20 version on EVM chains
- **Any ERC-20 Token**: Platform supports any ERC-20 compliant token

## 🌐 Supported Networks

### **ICP Networks**
- **Mainnet**: Production Internet Computer network
- **Local Development**: Internet Computer test network

### **EVM Networks**
- **Etherlink**: High-performance EVM chain
- **Ethereum**: Mainnet and testnets
- **Polygon**: Layer 2 scaling solution
- **BSC**: Binance Smart Chain

## 🔄 Swap Process Example

### **ICP → EVM Swap**
1. User connects Internet Identity wallet
2. Selects ICP→EVM direction
3. Chooses source ICRC token and amount
4. Specifies EVM destination address
5. Creates swap order (tokens automatically locked in canister)
6. Waits for compatible EVM→ICP order
7. Provides secret to claim EVM tokens at destination

### **EVM → ICP Swap**
1. User connects MetaMask wallet
2. Selects EVM→ICP direction
3. Signs permit for token approval
4. Chooses source ERC-20 token and amount
5. Specifies ICP destination principal
6. Creates swap order (tokens automatically locked in HTLC)
7. Waits for compatible ICP→EVM order
8. Provides secret to claim ICP tokens at destination

## 🛠️ Development

### **Local Development**
```bash
# Start local replica
dfx start --background

# Deploy to local network
dfx deploy

# Run tests
npm test
```

### **Testing**
```bash
# Test EVM contracts
cd src/evm
npx hardhat test

# Test ICP canister
dfx canister call backend test_all_contract_functions
```

### **Deployment Scripts**
- `scripts/deploy-icrc-tokens.sh`: Deploy ICRC tokens to ICP
- `scripts/setup-token-distribution.sh`: Setup initial token distribution
- `scripts/transfer-icrc-tokens.sh`: Transfer tokens between accounts

## 📈 Roadmap

### **Phase 1: Core Functionality** ✅
- [x] Basic HTLC implementation
- [x] Cross-chain swap coordination
- [x] Frontend interface
- [x] Wallet integration

### **Phase 2: Enhanced Features** 🚧
- [ ] Automated order matching
- [ ] Advanced order types (limit orders, stop-loss)
- [ ] Multi-hop swaps
- [ ] Liquidity pools

### **Phase 3: Advanced Features** 📋
- [ ] Cross-chain NFT swaps
- [ ] DeFi protocol integration
- [ ] Mobile application
- [ ] BTC, SOL and other non-EVM integrations.


### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/ionic-swap/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/ionic-swap/discussions)

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Users should conduct their own security audits and testing before using this platform for significant transactions.

---

**Built with ❤️ for the ETHGlobal Unite Defi Hackathon** 