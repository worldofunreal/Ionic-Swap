# Ionic Swap Frontend

A cross-chain atomic swap interface for swapping tokens between EVM (Sepolia) and ICP networks.

## Features

- **Cross-Chain Swaps**: Swap tokens between EVM (Sepolia) and ICP networks
- **Gasless Approvals**: EIP-2612 permit support for EVM tokens
- **Atomic Swaps**: Secure HTLC-based atomic swaps
- **Real-time Status**: Live swap progress tracking
- **Balance Checking**: Automatic balance validation

## Supported Tokens

### EVM (Sepolia)
- **SPIRAL Token**: `0xdE7409EDeA573D090c3C6123458D6242E26b425E`
- **STARDUST Token**: `0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90`

### ICP
- **SPIRAL Token**: `umunu-kh777-77774-qaaca-cai`
- **STARDUST Token**: `ulvla-h7777-77774-qaacq-cai`

## Swap Flow

### EVM → ICP Swap
1. **Connect Wallets**: Connect both MetaMask (EVM) and Internet Identity (ICP)
2. **Select Tokens**: Choose source EVM token and destination ICP token
3. **Enter Amounts**: Specify amounts for both sides of the swap
4. **Sign Permit**: Sign EIP-2612 permit for EVM token approval
5. **Create Order**: Backend creates EVM→ICP swap order
6. **Wait for Counter-Order**: System waits for matching ICP→EVM order
7. **Complete Swap**: Atomic swap executes automatically when compatible order found

### ICP → EVM Swap
1. **Connect Wallets**: Connect both Internet Identity (ICP) and MetaMask (EVM)
2. **Select Tokens**: Choose source ICP token and destination EVM token
3. **Enter Amounts**: Specify amounts for both sides of the swap
4. **Approve Tokens**: Approve ICRC-2 allowance for ICP tokens
5. **Create Order**: Backend creates ICP→EVM swap order
6. **Wait for Counter-Order**: System waits for matching EVM→ICP order
7. **Complete Swap**: Atomic swap executes automatically when compatible order found

## Prerequisites

- **MetaMask**: Connected to Sepolia testnet
- **Internet Identity**: Authenticated with ICP identity
- **Test Tokens**: SPIRAL and STARDUST tokens on both networks
- **Backend Canister**: Running backend canister with HTLC contracts deployed

## Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Connect Wallets**:
   - Connect MetaMask to Sepolia testnet
   - Authenticate with Internet Identity

4. **Test Swap**:
   - Select tokens and amounts
   - Click "Create Swap Order"
   - Follow the prompts to sign permits/approvals

## Architecture

### Components
- **SwapForm**: Main swap interface with token selection and amount input
- **SwapSummary**: Order summary and swap execution button
- **TokenSelector**: Token selection dropdown
- **AmountInput**: Amount input with balance display

### Key Functions
- **EIP-2612 Permit**: Gasless token approval for EVM tokens
- **ICRC-2 Approval**: Token approval for ICP tokens
- **Order Creation**: Backend canister integration for swap orders
- **Order Pairing**: Automatic detection of compatible orders
- **Swap Completion**: Atomic swap execution

### Error Handling
- Balance validation
- Network connectivity checks
- Transaction failure recovery
- User-friendly error messages

## Security Features

- **HTLC Contracts**: Secure hash time-locked contracts
- **Atomic Execution**: All-or-nothing swap execution
- **Timelock Protection**: Automatic refund after expiration
- **Signature Verification**: EIP-2612 permit validation

## Troubleshooting

### Common Issues
1. **"MetaMask not connected"**: Ensure MetaMask is connected to Sepolia
2. **"Insufficient balance"**: Check token balances on both networks
3. **"Permit signing failed"**: Ensure you're signing with the correct account
4. **"Order creation failed"**: Check backend canister status

### Debug Information
- Check browser console for detailed error messages
- Verify canister IDs and contract addresses
- Ensure all dependencies are properly installed

## Future Enhancements

- **Order Book**: Display available swap orders
- **Price Oracle**: Real-time exchange rates
- **Multi-Token Support**: Additional token pairs
- **Mobile Support**: Responsive design for mobile devices
- **Advanced Features**: Partial fills, order cancellation 