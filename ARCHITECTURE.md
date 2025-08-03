# Cross-Chain Swap Architecture

## Overview
A unified orderbook system for atomic cross-chain swaps between ICP and EVM chains with automatic token escrow.

## Core Components

### Order Creation
- **ICP→EVM Orders**: User specifies EVM destination address. Canister automatically pulls ICRC tokens into escrow.
- **EVM→ICP Orders**: User provides signed permit. Canister automatically executes permit and creates EVM HTLC to hold ERC20 tokens.

### Token Flow
1. **Order Creation**: Tokens automatically locked in escrow (ICP tokens in canister, ERC20 tokens in EVM HTLC)
2. **Manual Pairing**: Users find compatible orders for swapping
3. **Manual Withdrawal**: User provides secret to claim tokens at their specified destination

### Key Features
- **Automatic Escrow**: No manual token locking required
- **Destination Addresses**: Users specify where they want their swapped tokens
- **Manual Pairing**: Clean separation between order creation and matching
- **Manual Withdrawal**: Users control when to complete the swap
- **Unified Orderbook**: Single system handles both ICP→EVM and EVM→ICP directions

### Security
- Tokens locked in escrow during order creation
- Secret-based withdrawal prevents unauthorized access
- Timelock protection for refund scenarios
- Canister acts as trusted intermediary for both chains 