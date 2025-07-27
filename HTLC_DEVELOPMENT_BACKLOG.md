# HTLC Development Backlog
## Ionic-Swap Cross-Chain HTLC Implementation

### Executive Summary
This backlog prioritizes the most technically complex and foundational pieces first, focusing on risk mitigation. The success of the entire project hinges on the core on-chain and cross-chain logic.

**The Hardest Part to Begin With**: The core cross-chain interaction between the ICP canister and the EVM chain, specifically:
1. **ICP Canister's Ethereum Communication**: Implementing HTTPS Outcalls to read EVM state and using Chain-Key Signatures (ckETH) to sign and send transactions to the EVM chain
2. **Core HTLC Logic on Both Chains**: Creating the fundamental lock, claim, and refund functions on both ICP canister (Rust) and EVM contract (Solidity)

---

## Phase 1: The On-Chain Foundation (Highest Priority)
**Goal**: Prove the core HTLC mechanics and cross-chain communication can work in isolation.

### Epic 1: ICP Canister - Core Logic (Team Member 1 - Rust/Motoko)

#### Story 1.1: [P0] Define HTLC State Structure
**Priority**: Critical
**Estimated Time**: 4-6 hours
**Acceptance Criteria**:
- [ ] Create HTLC state struct in `src/fusion_htlc_canister/main.mo`
- [ ] Define fields: `hashed_secret`, `sender`, `recipient`, `amount`, `expiration_time`, `status`
- [ ] Implement stable storage for HTLC state persistence
- [ ] Add proper type definitions for HTLC status enum (`#Locked`, `#Claimed`, `#Refunded`)

**Technical Notes**:
```motoko
type HTLCStatus = {
  #Locked;
  #Claimed;
  #Refunded;
};

type HTLC = {
  id: Text;
  hashed_secret: Blob;
  sender: Principal;
  recipient: Principal;
  amount: Nat;
  token_canister: Principal;
  expiration_time: Int;
  status: HTLCStatus;
  created_at: Int;
};
```

#### Story 1.2: [P0] Implement Basic HTLC Methods
**Priority**: Critical
**Estimated Time**: 8-12 hours
**Acceptance Criteria**:
- [ ] Implement `lock(hashed_secret, recipient, expiration_time, amount, token_canister)` function
- [ ] Implement `claim(htlc_id, secret)` function with proper hash verification
- [ ] Implement `refund(htlc_id)` function with expiration time validation
- [ ] Add proper error handling and validation
- [ ] Implement query methods to retrieve HTLC state

**Technical Requirements**:
- Use `ic_cdk::api::time()` for current time validation
- Implement proper hash verification using SHA256
- Add comprehensive input validation
- Ensure atomic operations for state changes

#### Story 1.3: [P0] ICRC-1/2 Token Integration
**Priority**: Critical
**Estimated Time**: 6-8 hours
**Acceptance Criteria**:
- [ ] Modify lock function to receive and hold ICRC tokens from sender
- [ ] Implement token transfer from sender to canister during lock
- [ ] Implement token transfer from canister to recipient during claim
- [ ] Implement token transfer back to sender during refund
- [ ] Handle token transfer failures gracefully

**Technical Notes**:
- Use ICRC-1 transfer interface for token operations
- Implement proper approval/allowance handling
- Add transaction logging for audit trails

#### Story 1.4: [P1] Write Comprehensive Unit Tests
**Priority**: High
**Estimated Time**: 6-8 hours
**Acceptance Criteria**:
- [ ] Test all success paths for lock, claim, and refund
- [ ] Test failure scenarios (wrong secret, premature refund, etc.)
- [ ] Test token transfer edge cases
- [ ] Test concurrent access scenarios
- [ ] Achieve >90% code coverage

---

### Epic 2: EVM Contract - Core Logic (Team Member 2 - Solidity)

#### Story 2.1: [P0] Create Standalone EVM HTLC Contract
**Priority**: Critical
**Estimated Time**: 8-10 hours
**Acceptance Criteria**:
- [ ] Create `HTLC.sol` contract with core HTLC functionality
- [ ] Implement lock, claim, and refund functions
- [ ] Support both ETH and ERC20 token locking
- [ ] Implement proper access control and security measures
- [ ] Add events for all state changes

**Technical Requirements**:
```solidity
contract HTLC {
    struct HTLCData {
        bytes32 hashedSecret;
        address sender;
        address recipient;
        uint256 amount;
        uint256 expirationTime;
        HTLCStatus status;
        bool isERC20;
        address tokenAddress;
    }
    
    enum HTLCStatus { Locked, Claimed, Refunded }
    
    mapping(bytes32 => HTLCData) public htlcData;
    
    event HTLCLocked(bytes32 indexed htlcId, address indexed sender, address indexed recipient, uint256 amount);
    event HTLCClaimed(bytes32 indexed htlcId, address indexed recipient);
    event HTLCRefunded(bytes32 indexed htlcId, address indexed sender);
}
```

#### Story 2.2: [P0] Set Up Hardhat & Write Unit Tests
**Priority**: Critical
**Estimated Time**: 6-8 hours
**Acceptance Criteria**:
- [ ] Set up Hardhat development environment
- [ ] Create comprehensive test suite for all HTLC functions
- [ ] Test with both ETH and ERC20 tokens
- [ ] Test edge cases and failure scenarios
- [ ] Achieve >95% code coverage

---

### Epic 3: Cross-Chain Communication Primitives (The "Hardest Part" Proof-of-Concept)

#### Story 3.1: [P0] ICP Canister HTTPS Outcall to EVM (Team Member 1)
**Priority**: Critical
**Estimated Time**: 8-12 hours
**Acceptance Criteria**:
- [ ] Create test canister method for HTTPS outcall to Ethereum RPC
- [ ] Successfully retrieve latest block number from Ethereum
- [ ] Implement proper error handling for network failures
- [ ] Add cycles management for outcall costs
- [ ] Test with multiple RPC endpoints (Alchemy, Infura)

**Technical Implementation**:
```motoko
import IC "ic:aaaaa-aa";
import Cycles "mo:base/ExperimentalCycles";
import Text "mo:base/Text";
import Blob "mo:base/Blob";

public func get_ethereum_block_number() : async Text {
    let host : Text = "eth-mainnet.alchemyapi.io";
    let url = "https://" # host # "/v2/YOUR_API_KEY";
    
    let request_headers = [
        { name = "Content-Type"; value = "application/json" },
    ];
    
    let http_request : IC.http_request_args = {
        url = url;
        max_response_bytes = null;
        headers = request_headers;
        body = ?Text.encodeUtf8("{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}");
        method = #post;
        transform = ?{
            function = transform;
            context = Blob.fromArray([]);
        };
    };
    
    Cycles.add<system>(230_949_972_000);
    let http_response : IC.http_request_result = await IC.http_request(http_request);
    
    // Parse response and return block number
    // Implementation details...
};
```

#### Story 3.2: [P0] ICP Canister ckETH Transaction Signing (Team Member 1)
**Priority**: Critical
**Estimated Time**: 12-16 hours
**Acceptance Criteria**:
- [ ] Implement raw Ethereum transaction construction
- [ ] Use `sign_with_ecdsa` management canister function
- [ ] Generate valid signed transaction hex
- [ ] Test transaction signing with testnet
- [ ] Manually broadcast signed transaction to verify functionality

**Technical Requirements**:
- Implement proper nonce management
- Handle gas estimation
- Use correct chain ID for target network
- Implement proper key derivation for ckETH

---

## Phase 2: Connecting the System (Medium Priority)
**Goal**: Automate a single, full swap using a simplified off-chain script.

### Epic 4: The "Resolver" Bot (Simplified) (Team Member 3 - Node.js)

#### Story 4.1: [P1] Create a Monitoring Script
**Priority**: High
**Estimated Time**: 6-8 hours
**Acceptance Criteria**:
- [ ] Create Node.js script that polls ICP canister for new locks
- [ ] Create Node.js script that polls EVM contract for new locks
- [ ] Implement proper error handling and retry logic
- [ ] Add logging for monitoring and debugging
- [ ] Handle network failures gracefully

#### Story 4.2: [P1] Create a Execution Script
**Priority**: High
**Estimated Time**: 8-10 hours
**Acceptance Criteria**:
- [ ] Implement automatic lock creation on Chain B when lock detected on Chain A
- [ ] Use pre-funded wallet for cross-chain operations
- [ ] Implement proper transaction confirmation waiting
- [ ] Add transaction failure recovery mechanisms
- [ ] Implement proper secret management

#### Story 4.3: [P1] First End-to-End Test
**Priority**: High
**Estimated Time**: 4-6 hours
**Acceptance Criteria**:
- [ ] Successfully complete full ICP → EVM swap
- [ ] Successfully complete full EVM → ICP swap
- [ ] Document all manual steps and automation requirements
- [ ] Create test documentation and procedures
- [ ] Identify and document any issues or edge cases

---

## Phase 3: User Interface & Abstractions (Lower Priority)
**Goal**: Build the user-facing application and the advanced features.

### Epic 5: Backend & Relayer (Team Member 3 - Node.js)

#### Story 5.1: [P2] Basic API Endpoints
**Priority**: Medium
**Estimated Time**: 8-10 hours
**Acceptance Criteria**:
- [ ] Create Express.js backend with basic routes
- [ ] Implement GET /orders endpoint
- [ ] Implement GET /htlc/:id endpoint
- [ ] Add proper error handling and validation
- [ ] Implement rate limiting and security measures

#### Story 5.2: [P3] Relayer Logic
**Priority**: Low
**Estimated Time**: 10-12 hours
**Acceptance Criteria**:
- [ ] Implement off-chain order book
- [ ] Add signed intent posting functionality
- [ ] Implement order matching logic
- [ ] Add order validation and verification
- [ ] Implement order cancellation functionality

### Epic 6: Frontend Application (Team Member 3 - React)

#### Story 6.1: [P2] UI Component Shells
**Priority**: Medium
**Estimated Time**: 6-8 hours
**Acceptance Criteria**:
- [ ] Create SwapInterface component
- [ ] Create ChainSelector component
- [ ] Create HTLCStatus component
- [ ] Implement responsive design
- [ ] Add proper loading states and error handling

#### Story 6.2: [P2] Wallet Integration
**Priority**: Medium
**Estimated Time**: 8-10 hours
**Acceptance Criteria**:
- [ ] Integrate Internet Identity for ICP wallet
- [ ] Integrate MetaMask for EVM wallet
- [ ] Implement wallet connection state management
- [ ] Add wallet switching functionality
- [ ] Handle wallet disconnection gracefully

#### Story 6.3: [P3] Connect UI to Backend
**Priority**: Low
**Estimated Time**: 6-8 hours
**Acceptance Criteria**:
- [ ] Wire up frontend to backend API
- [ ] Implement real-time updates
- [ ] Add proper error handling
- [ ] Implement retry logic for failed requests
- [ ] Add proper loading states

### Epic 7: Advanced Canister Features (Team Member 1 - Rust)

#### Story 7.1: [P2] Implement Partial Fill State
**Priority**: Medium
**Estimated Time**: 8-10 hours
**Acceptance Criteria**:
- [ ] Add Orders map to canister state
- [ ] Link orders to individual HTLCs
- [ ] Implement order state management
- [ ] Add order validation logic
- [ ] Implement order expiration handling

#### Story 7.2: [P3] Implement Partial Fill Methods
**Priority**: Low
**Estimated Time**: 10-12 hours
**Acceptance Criteria**:
- [ ] Implement create_order method
- [ ] Implement add_partial_fill method
- [ ] Add partial fill validation
- [ ] Implement order completion logic
- [ ] Add comprehensive testing

---

## Risk Mitigation Strategy

### Technical Risks
1. **Cross-chain Communication**: Mitigated by starting with simple HTTPS outcalls and gradually adding complexity
2. **Transaction Signing**: Mitigated by thorough testing with testnets before mainnet deployment
3. **Token Integration**: Mitigated by using standard ICRC interfaces and comprehensive testing

### Timeline Risks
1. **Scope Creep**: Strict adherence to P0 priorities before moving to P1/P2
2. **Integration Complexity**: Early proof-of-concept for cross-chain communication
3. **Testing Coverage**: Comprehensive unit tests for all critical functions

### Success Metrics
- [ ] P0 stories completed within 2-3 weeks
- [ ] End-to-end swap working within 4-5 weeks
- [ ] Basic UI functional within 6-7 weeks
- [ ] All critical security vulnerabilities addressed
- [ ] >90% test coverage for all critical components

---

## Dependencies and Prerequisites

### Development Environment Setup
- [ ] DFX SDK installed and configured
- [ ] Hardhat development environment set up
- [ ] Node.js and npm installed
- [ ] Git repository properly configured
- [ ] Development wallets funded with test tokens

### External Dependencies
- [ ] Ethereum RPC endpoint access (Alchemy/Infura)
- [ ] Testnet tokens for both ICP and EVM chains
- [ ] Internet Identity integration setup
- [ ] MetaMask development setup

### Documentation Requirements
- [ ] API documentation for all canister methods
- [ ] Contract documentation for EVM functions
- [ ] Deployment procedures and scripts
- [ ] Testing procedures and test cases
- [ ] Security audit checklist

---

## Notes
- All P0 stories must be completed before moving to P1 stories
- Each story should have clear acceptance criteria and be testable
- Regular code reviews and pair programming sessions recommended
- Daily standups to track progress and identify blockers
- Weekly retrospectives to adjust priorities and approach 