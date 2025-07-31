# Cross-Chain Orderbook Canister

This canister implements the core order book and matching engine for the cross-chain limit order protocol, enabling peer-to-peer trading between ICP and EVM chains using HTLC (Hash Time-Locked Contracts).

## Overview

The canister serves as the central order book where users can:
- Place limit orders from both ICP and EVM chains
- Take existing orders to initiate swaps
- Manage HTLC states for cross-chain swaps
- Claim or refund funds based on swap completion

## Core Features

### Order Management
- **ICP Orders**: Users can place orders directly from ICP, locking their ICRC-1 tokens
- **EVM Orders**: Users can submit signed EIP-712 orders from EVM chains
- **Order Book**: Maintains a centralized order book visible to all users
- **Order Taking**: Users can take existing orders to initiate swaps

### HTLC Integration
- **Secret Generation**: Each order uses a cryptographically secure secret
- **Timelock Management**: Automatic expiration handling for swaps
- **State Tracking**: Complete lifecycle management of swap states

### Security Features
- **Signature Verification**: On-chain EIP-712 signature verification for EVM orders
- **Authorization Checks**: Proper access control for all operations
- **Input Validation**: Comprehensive validation of all inputs

## API Reference

### Order Placement
- `placeIcpOrder(tokenSell, amountSell, tokenBuy, amountBuy, hashedSecret)` - Place order from ICP
- `submitEvmOrder(tokenSell, amountSell, tokenBuy, amountBuy, hashedSecret, signature)` - Submit signed order from EVM

### Order Management
- `takeOrder(orderId)` - Take an existing order to initiate swap
- `cancelOrder(orderId)` - Cancel an open order

### Swap Operations
- `claimFunds(swapId, secret)` - Claim funds with the secret
- `refundFunds(swapId)` - Refund funds from expired swap

### Query Methods
- `getOpenOrders()` - Get all open orders
- `getOrder(orderId)` - Get specific order details
- `getSwap(swapId)` - Get swap state
- `getUserOrders(user)` - Get orders for specific user
- `getActiveSwaps()` - Get all active swaps

## Data Structures

### LimitOrder
```motoko
type LimitOrder = {
    orderId: Text;
    owner: Principal;
    tokenSell: Text;
    amountSell: Nat;
    tokenBuy: Text;
    amountBuy: Nat;
    hashedSecret: Text;
    timestamp: Int;
    isEvmUser: Bool;
    status: OrderStatus;
};
```

### HtlcState
```motoko
type HtlcState = {
    swapId: Text;
    initiator: Principal;
    counterparty: Principal;
    hashedSecret: Text;
    timelock: Int;
    status: SwapStatus;
    createdAt: Int;
};
```

## Development Status

### Completed
- [x] Core data structures
- [x] Order placement methods
- [x] Order taking functionality
- [x] Basic HTLC state management
- [x] Query methods
- [x] Error handling

### In Progress
- [x] ICRC-1 token integration
- [ ] EIP-712 signature verification
- [ ] Secret hashing and verification
- [ ] State persistence across upgrades

### Planned
- [ ] Frontend integration
- [ ] EVM contract deployment
- [ ] End-to-end testing
- [ ] Security audit

## Usage Examples

### Placing an ICP Order
```motoko
let result = await orderbook.placeIcpOrder(
    "ICP",           // token to sell
    1000000000,      // amount to sell (1 ICP)
    "ETH",           // token to buy
    1000000000000000000, // amount to buy (1 ETH)
    "0x1234..."      // hashed secret
);
```

### Taking an Order
```motoko
let result = await orderbook.takeOrder("order_1");
```

### Claiming Funds
```motoko
let result = await orderbook.claimFunds(
    "swap_1",
    Blob.fromArray([1, 2, 3, 4]) // secret
);
```

## Security Considerations

1. **Secret Management**: Secrets must be generated cryptographically securely
2. **Signature Verification**: EIP-712 signatures must be properly verified
3. **Timelock Handling**: Proper expiration checks for all time-sensitive operations
4. **Access Control**: All operations must verify caller authorization
5. **Input Validation**: Comprehensive validation of all inputs

## Next Steps

1. ✅ Implement ICRC-1 token integration for actual token transfers
2. Add proper EIP-712 signature verification
3. Implement secret hashing and verification
4. Add state persistence for upgrades
5. Create comprehensive test suite
6. Deploy EVM contracts and integrate
7. Build frontend interface

## Token Integration

The canister now integrates with the ICRC-1 token canister for actual token transfers:

- **Token Locking**: When placing an ICP order, tokens are transferred from the user to the orderbook canister
- **Token Unlocking**: When claiming or refunding, tokens are transferred from the orderbook canister to the appropriate user
- **Admin Setup**: Use `setTokenCanister()` to configure the token canister ID after deployment

### Setup Instructions

1. Deploy both the token and orderbook canisters
2. Call `setTokenCanister(tokenCanisterId)` on the orderbook canister
3. Ensure the orderbook canister has sufficient token balance for operations 