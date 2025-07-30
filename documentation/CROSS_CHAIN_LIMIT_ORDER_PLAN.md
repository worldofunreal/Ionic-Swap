# Cross-Chain Limit Order Protocol - Technical Blueprint

## Overview
This document outlines the technical implementation plan for building an On-Chain Cross-Chain Limit Order Protocol that enables peer-to-peer trading between ICP and EVM chains using HTLC (Hash Time-Locked Contracts).

## 1. The Main ICP Canister (The Order Book & Matching Engine)

### State / Data Structures
- **Order Book**: A HashMap or Vec to store open limit orders
- **Active Swaps**: A HashMap<SwapId, HtlcState> to manage swap states

```motoko
struct LimitOrder {
    order_id: Text;
    owner: Principal;
    token_sell: Text;
    amount_sell: Nat;
    token_buy: Text;
    amount_buy: Nat;
    hashed_secret: Text;
    timestamp: Int;
    is_evm_user: Bool;
}

struct HtlcState {
    swap_id: Text;
    initiator: Principal;
    counterparty: Principal;
    hashed_secret: Text;
    timelock: Int;
    status: SwapStatus;
}
```

### Core Public Methods
- `place_icp_order(order: LimitOrder)`: ICP user places order, locks ICRC-1 tokens
- `submit_evm_order(order: LimitOrder, signature: Vec<u8>)`: EVM user submits signed order
- `take_order(order_id: OrderId)`: User fills existing order, initiates swap
- `claim_funds(swap_id: SwapId, secret: Vec<u8>)`: Unlocks ICP-side of completed swap
- `refund_funds(swap_id: SwapId)`: Reclaims funds from timed-out swap
- `cancel_order(order_id: OrderId)`: Remove open order if not matched

### Internal Logic
- **On-Chain Signature Verification**: Pure function for EIP-712 signature verification
- **HTLC Management**: Create, update, delete entries in Active Swaps HashMap

## 2. The EVM Components (Solidity)

### HTLC Escrow Contract
Minimal, non-upgradable contract for single swap:

```solidity
contract HTLCEscrow {
    address public token;
    uint256 public amount;
    bytes32 public hashedSecret;
    uint256 public timelock;
    address public recipient;
    address public sender;
    
    function lock() external;
    function claim(bytes32 secret) external;
    function refund() external;
}
```

### HTLC Factory Contract
Deploys escrow contracts:

```solidity
contract HTLCFactory {
    function createEscrow(
        bytes32 hashedSecret,
        address recipient,
        uint256 timelock,
        address token,
        uint256 amount
    ) external returns (address);
}
```

## 3. The User Flow & Client-Side Logic

### Unified UI
- Single-page application served from ICP front-end canister
- Clean interface showing on-chain order book
- Wallet detection (Internet Identity or MetaMask)

### Order Placement
- **ICP User**: UI calls `place_icp_order` on canister
- **EVM User**: UI prompts EIP-712 signature, calls `submit_evm_order`

### Order Taking
- UI allows users to "take" open orders from book
- Triggers on-chain HTLC process

## 4. MVP Swap Lifecycle (ICP → EVM Example)

### Step 1: Order Creation
**User A (ICP)**:
1. Generates secret (S) and hash (H(S))
2. Calls `place_icp_order` with order details (sell ICP for ETH, using H(S))
3. Canister locks ICP in HTLC state and lists order

### Step 2: Order Taking
**User B (EVM)**:
1. Sees User A's order in UI
2. Clicks "Take This Swap"
3. UI prompts transaction approval
4. Calls `createEscrow` on EVM Factory contract
5. Deploys new escrow and locks ETH against same H(S)

### Step 3: Claim Process
**User A**:
1. Sees EVM contract is funded
2. Calls `claim()` on EVM escrow contract
3. Reveals secret S to receive ETH

### Step 4: Counter-Claim
**User B (or monitoring process)**:
1. Detects S was revealed on Ethereum chain
2. Calls `claim_funds()` on ICP canister with S
3. Receives locked ICP

## Implementation Checklist

### Phase 1: Core Canister Development
- [ ] Create new canister in dfx.json
- [ ] Implement data structures (LimitOrder, HtlcState)
- [ ] Implement core public methods
- [ ] Add on-chain signature verification
- [ ] Implement HTLC management logic

### Phase 2: EVM Contract Development
- [ ] Develop HTLC Escrow contract
- [ ] Develop HTLC Factory contract
- [ ] Deploy contracts to testnet
- [ ] Test contract interactions

### Phase 3: Frontend Development
- [ ] Create unified UI
- [ ] Implement wallet detection
- [ ] Add order placement flows
- [ ] Add order taking functionality

### Phase 4: Integration & Testing
- [ ] End-to-end testing of swap lifecycle
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation

## Security Considerations
- EIP-712 signature verification must be robust
- HTLC timelocks must be appropriate for both chains
- Secret generation must be cryptographically secure
- Front-running protection mechanisms
- Rate limiting for order placement

## Next Steps
1. Create new canister in dfx.json
2. Begin implementing core canister functionality
3. Develop EVM contracts in parallel
4. Build frontend interface
5. Integrate and test complete flow 