# EVM Integration Documentation
## Ionic-Swap ICP Canister EVM Integration

### Overview

The Ionic-Swap ICP canister now includes comprehensive EVM (Ethereum Virtual Machine) integration, enabling cross-chain HTLC operations between ICP and various EVM-compatible blockchains including Ethereum, Polygon, and Arbitrum. This integration leverages ICP's HTTPS outcalls and the EVM RPC canister to interact with EVM chains.

### Architecture

#### Core Components

1. **EVM RPC Integration**: Uses the official EVM RPC canister for blockchain communication
2. **Chain Configuration Management**: Configurable settings for different EVM chains
3. **HTLC Interaction Tracking**: Complete audit trail of cross-chain HTLC operations
4. **Transaction Data Generation**: ABI-encoded transaction data for HTLC operations
5. **Error Handling**: Comprehensive error management for cross-chain operations

#### Supported Chains

- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon Mainnet** (Chain ID: 137)
- **Arbitrum One** (Chain ID: 42161)
- **Extensible**: Additional chains can be added via configuration

### Data Structures

#### EvmTransaction
```motoko
type EvmTransaction = {
  to : ?Text; // Recipient address (null for contract creation)
  value : ?Text; // Amount in wei (hex string)
  data : ?Text; // Transaction data (hex string)
  gas_limit : ?Text; // Gas limit (hex string)
  gas_price : ?Text; // Gas price (hex string)
  max_fee_per_gas : ?Text; // EIP-1559 max fee per gas
  max_priority_fee_per_gas : ?Text; // EIP-1559 max priority fee
  nonce : ?Text; // Transaction nonce (hex string)
  chain_id : ?Text; // Chain ID (hex string)
};
```

#### EvmHtlcInteraction
```motoko
type EvmHtlcInteraction = {
  htlc_id : Text; // Our HTLC ID
  evm_htlc_address : Text; // EVM HTLC contract address
  action : {
    #Create; // Create HTLC on EVM
    #Claim; // Claim HTLC on EVM
    #Refund; // Refund HTLC on EVM
  };
  secret : ?Text; // Secret for claim (if applicable)
  transaction_hash : ?Text; // EVM transaction hash after execution
  status : {
    #Pending; // Transaction pending
    #Confirmed; // Transaction confirmed
    #Failed; // Transaction failed
  };
};
```

#### EvmChainConfig
```motoko
type EvmChainConfig = {
  chain_id : Nat; // Chain ID (1 for Ethereum mainnet, 137 for Polygon, etc.)
  rpc_services : EvmRpc.RpcServices; // RPC services configuration
  gas_limit : Nat; // Default gas limit
  gas_price : Nat; // Default gas price in wei
  htlc_contract_address : ?Text; // HTLC contract address on this chain
};
```

### Core Functions

#### EVM RPC Operations

##### `get_evm_block_number(chain_id : Nat) : async Result.Result<Nat, Text>`
Retrieves the latest block number from the specified EVM chain.

**Parameters:**
- `chain_id`: The chain ID (1 for Ethereum, 137 for Polygon, etc.)

**Returns:**
- `#ok(block_number)`: Latest block number as Nat
- `#err(error_message)`: Error description

**Example:**
```bash
dfx canister call fusion_htlc_canister get_evm_block_number "(1)"
```

##### `get_evm_transaction_receipt(chain_id : Nat, tx_hash : Text) : async Result.Result<Text, Text>`
Retrieves transaction receipt details from the EVM chain.

**Parameters:**
- `chain_id`: The chain ID
- `tx_hash`: Transaction hash to query

**Returns:**
- `#ok(receipt_json)`: Transaction receipt as JSON string
- `#err(error_message)`: Error description

##### `get_evm_balance(chain_id : Nat, address : Text) : async Result.Result<Text, Text>`
Gets the balance of an address on the specified EVM chain.

**Parameters:**
- `chain_id`: The chain ID
- `address`: Ethereum address to query

**Returns:**
- `#ok(balance_hex)`: Balance in hex format
- `#err(error_message)`: Error description

#### HTLC Operations

##### `create_evm_htlc(chain_id : Nat, evm_htlc_address : Text, hashlock : Text, recipient : Text, amount : Nat, expiration : Int) : async Result.Result<Text, Text>`
Creates an HTLC on the specified EVM chain.

**Parameters:**
- `chain_id`: Target EVM chain ID
- `evm_htlc_address`: HTLC contract address on the target chain
- `hashlock`: SHA256 hash of the secret (hex string)
- `recipient`: Recipient address on the target chain
- `amount`: Amount in wei (for native tokens) or token units
- `expiration`: Expiration timestamp

**Returns:**
- `#ok(interaction_id)`: Unique interaction ID for tracking
- `#err(error_message)`: Error description

**Example:**
```bash
dfx canister call fusion_htlc_canister create_evm_htlc "(1, \"0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6\", \"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef\", \"0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6\", 1000000000000000000, 1703123456)"
```

##### `claim_evm_htlc(chain_id : Nat, evm_htlc_address : Text, secret : Text) : async Result.Result<Text, Text>`
Claims an HTLC on the specified EVM chain using the secret.

**Parameters:**
- `chain_id`: Target EVM chain ID
- `evm_htlc_address`: HTLC contract address
- `secret`: The secret that unlocks the HTLC

**Returns:**
- `#ok(interaction_id)`: Unique interaction ID for tracking
- `#err(error_message)`: Error description

##### `refund_evm_htlc(chain_id : Nat, evm_htlc_address : Text) : async Result.Result<Text, Text>`
Refunds an expired HTLC on the specified EVM chain.

**Parameters:**
- `chain_id`: Target EVM chain ID
- `evm_htlc_address`: HTLC contract address

**Returns:**
- `#ok(interaction_id)`: Unique interaction ID for tracking
- `#err(error_message)`: Error description

#### Query Functions

##### `get_evm_interaction(interaction_id : Text) : async Result.Result<EvmHtlcInteraction, Text>`
Retrieves details of a specific EVM interaction.

**Parameters:**
- `interaction_id`: The interaction ID to query

**Returns:**
- `#ok(interaction)`: Complete interaction details
- `#err(error_message)`: Error description

##### `get_evm_interactions_by_htlc(htlc_id : Text) : async [EvmHtlcInteraction]`
Retrieves all EVM interactions associated with a specific HTLC.

**Parameters:**
- `htlc_id`: The HTLC ID to query

**Returns:**
- Array of EVM interactions

##### `get_chain_config(chain_id : Nat) : async Result.Result<EvmChainConfig, Text>`
Retrieves the configuration for a specific EVM chain.

**Parameters:**
- `chain_id`: The chain ID to query

**Returns:**
- `#ok(config)`: Chain configuration
- `#err(error_message)`: Error description

#### Configuration Management

##### `update_chain_config(chain_id : Nat, config : EvmChainConfig) : async Result.Result<(), Text>`
Updates the configuration for a specific EVM chain.

**Parameters:**
- `chain_id`: The chain ID to update
- `config`: New chain configuration

**Returns:**
- `#ok(())`: Success
- `#err(error_message)`: Error description

### Testing

#### Automated Test Suite

The EVM integration includes a comprehensive test suite (`test_evm_integration.sh`) that validates:

1. **Canister Deployment**: Verifies the canister is accessible
2. **EVM RPC Connectivity**: Tests connection to EVM chains
3. **Block Number Retrieval**: Validates blockchain data access
4. **Chain Configuration**: Tests configuration management
5. **HTLC Operations**: Simulates HTLC creation, claiming, and refunding
6. **Error Handling**: Validates proper error responses
7. **Multi-Chain Support**: Tests different EVM chains

#### Running Tests

```bash
# Make the test script executable
chmod +x test_evm_integration.sh

# Run the test suite
./test_evm_integration.sh
```

#### Manual Testing

```bash
# Test EVM RPC connectivity
dfx canister call fusion_htlc_canister test_evm_rpc "(1)"

# Get latest block number
dfx canister call fusion_htlc_canister get_evm_block_number "(1)"

# Get chain configuration
dfx canister call fusion_htlc_canister get_chain_config "(1)"

# Create EVM HTLC (simulation)
dfx canister call fusion_htlc_canister create_evm_htlc "(1, \"0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6\", \"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef\", \"0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6\", 1000000000000000000, 1703123456)"
```

### Configuration

#### Default Chain Configurations

The canister comes pre-configured with default settings for major EVM chains:

**Ethereum Mainnet:**
- Chain ID: 1
- Gas Limit: 300,000
- Gas Price: 20 gwei (20,000,000,000 wei)
- RPC Services: EthMainnet

**Polygon Mainnet:**
- Chain ID: 137
- Gas Limit: 300,000
- Gas Price: 30 gwei (30,000,000,000 wei)
- RPC Services: PolygonMainnet

**Arbitrum One:**
- Chain ID: 42161
- Gas Limit: 300,000
- Gas Price: 0.1 gwei (100,000,000 wei)
- RPC Services: ArbitrumOne

#### Custom Configuration

You can update chain configurations using the `update_chain_config` function:

```bash
# Example: Update Ethereum gas price
dfx canister call fusion_htlc_canister update_chain_config "(1, record { chain_id = 1; rpc_services = variant { EthMainnet = null }; gas_limit = 300000; gas_price = 25000000000; htlc_contract_address = null })"
```

### Error Handling

The EVM integration includes comprehensive error handling for:

1. **RPC Errors**: Network failures, invalid responses
2. **Configuration Errors**: Missing or invalid chain configurations
3. **Transaction Errors**: Invalid transaction data, insufficient gas
4. **State Errors**: Invalid interaction states, missing data
5. **Validation Errors**: Invalid parameters, unauthorized operations

### Security Considerations

1. **Authorization**: All HTLC operations require proper authorization
2. **Input Validation**: All parameters are validated before processing
3. **State Management**: Atomic operations ensure data consistency
4. **Error Isolation**: Errors in one operation don't affect others
5. **Audit Trail**: All interactions are logged for transparency

### Performance

1. **Cycles Management**: Proper cycles allocation for RPC calls
2. **Caching**: Chain configurations are cached for efficiency
3. **Batch Operations**: Multiple operations can be batched
4. **Async Processing**: Non-blocking operations for better performance

### Limitations

1. **Transaction Signing**: Currently simulates transaction creation (needs ckETH integration)
2. **Gas Estimation**: Uses default gas limits (needs dynamic estimation)
3. **Contract Addresses**: HTLC contract addresses need to be configured
4. **Cross-Chain Coordination**: Requires additional logic for full automation

### Next Steps

1. **ckETH Integration**: Implement actual transaction signing using Chain-Key signatures
2. **Dynamic Gas Estimation**: Add real-time gas price and limit estimation
3. **Contract Deployment**: Deploy actual HTLC contracts on EVM chains
4. **Cross-Chain Automation**: Implement automated cross-chain HTLC coordination
5. **Transaction Monitoring**: Add comprehensive transaction status tracking
6. **Multi-Token Support**: Extend to support ERC-20 tokens
7. **Advanced Features**: Add support for EIP-1559 transactions, batch operations

### Integration with Existing HTLC System

The EVM integration seamlessly integrates with the existing HTLC system:

1. **Unified Interface**: Same HTLC operations work across ICP and EVM
2. **Shared State**: HTLC state is tracked consistently across chains
3. **Cross-Chain Linking**: HTLCs can be linked between ICP and EVM
4. **Partial Fill Support**: Works with the existing partial fill system
5. **Resolver Integration**: Resolvers can operate across multiple chains

### Conclusion

The EVM integration provides a solid foundation for cross-chain HTLC operations. While some advanced features like actual transaction signing are still in development, the current implementation provides:

- ✅ Complete EVM RPC integration
- ✅ Multi-chain support
- ✅ HTLC operation simulation
- ✅ Comprehensive error handling
- ✅ Full audit trail
- ✅ Extensible architecture

This makes the system ready for hackathon demonstrations and provides a clear path for full production deployment.