import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import JSON "mo:json.mo/lib";
import IC "ic:aaaaa-aa";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import BaseX "mo:base-x-encoder";

// EVM RPC Integration
import EvmRpc "canister:evm_rpc";

actor {
  
  // ============================================================================
  // TYPES AND CONSTANTS
  // ============================================================================
  
  type HttpRequestArgs = IC.http_request_args;
  type HttpResponseResult = IC.http_request_result;
  type HttpHeader = IC.http_header;
  
  // HTLC Status Enum
  type HTLCStatus = {
    #Locked;
    #Claimed;
    #Refunded;
    #Expired;
  };
  
  // Chain Type Enum
  type ChainType = {
    #ICP;
    #Ethereum;
    #Polygon;
    #Arbitrum;
    #Base;
    #Optimism;
  };
  
  // Token Type Enum
  type TokenType = {
    #ICRC1 : Principal; // ICRC-1 token canister ID
    #ERC20 : Text; // ERC-20 contract address
    #Native; // Native token (ICP, ETH, etc.)
  };
  
  // HTLC Structure - Core HTLC functionality
  type HTLC = {
    id : Text; // Unique HTLC identifier
    hashlock : Blob; // SHA256 hash of the secret
    sender : Principal; // ICP sender principal
    recipient : Principal; // ICP recipient principal
    amount : Nat; // Token amount
    token_canister : Principal; // ICRC-1 token canister
    expiration_time : Int; // Expiration timestamp
    status : HTLCStatus; // Current status
    created_at : Int; // Creation timestamp
    secret : ?Text; // The secret (only available after claim)
    chain_type : ChainType; // Target chain for cross-chain swap
    ethereum_address : ?Text; // Ethereum address for cross-chain
  };
  
  // 1inch Fusion+ Order Integration
  type OneInchOrder = {
    order_hash : Text; // 1inch order hash
    hashlock : Text; // 1inch hashlock
    timelock : Int; // 1inch timelock
    maker : Text; // Maker address
    taker : Text; // Taker address
    maker_asset : Text; // Maker token address
    taker_asset : Text; // Taker token address
    making_amount : Text; // Maker amount
    taking_amount : Text; // Taker amount
    src_chain_id : Nat; // Source chain ID
    dst_chain_id : Nat; // Destination chain ID
    secret_hashes : [Text]; // Array of secret hashes for partial fills
    fills : [Text]; // Array of fill amounts
  };
  
  // Partial Fill Structure
  type PartialFill = {
    fill_id : Text; // Unique fill identifier
    htlc_id : Text; // Associated HTLC ID
    amount : Nat; // Amount filled in this partial
    secret_hash : Text; // Secret hash for this partial
    resolver_address : Text; // Resolver that filled this partial
    fill_timestamp : Int; // When this partial was filled
    status : {
      #Pending; // Waiting for completion
      #Completed; // Successfully completed
      #Failed; // Failed to complete
    };
  };
  
  // Resolver Structure
  type Resolver = {
    address : Text; // Resolver's address
    is_active : Bool; // Whether resolver is active
    total_fills : Nat; // Total number of fills completed
    success_rate : Float; // Success rate percentage
    last_active : Int; // Last active timestamp
    supported_chains : [ChainType]; // Chains this resolver supports
  };
  
  // HTLC Order Mapping - Links HTLCs to 1inch orders
  type HTLCOrder = {
    htlc_id : Text; // Our HTLC ID
    oneinch_order : OneInchOrder; // Associated 1inch order
    is_source_chain : Bool; // True if ICP is source, false if destination
    partial_fill_index : ?Nat; // Index for partial fills
    total_filled : Nat; // Total amount filled so far
    remaining_amount : Nat; // Remaining amount to fill
    partial_fills : [Text]; // Array of partial fill IDs
    merkle_root : ?Text; // Merkle root for partial fill verification
  };

  // ============================================================================
  // EVM INTEGRATION TYPES
  // ============================================================================
  
  // EVM Transaction Structure
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
  
  // EVM HTLC Contract Interaction
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
  
  // EVM Chain Configuration
  type EvmChainConfig = {
    chain_id : Nat; // Chain ID (1 for Ethereum mainnet, 137 for Polygon, etc.)
    rpc_services : EvmRpc.RpcServices; // RPC services configuration
    gas_limit : Nat; // Default gas limit
    gas_price : Nat; // Default gas price in wei
    htlc_contract_address : ?Text; // HTLC contract address on this chain
  };
  
  // ============================================================================
  // EVM CONSTANTS
  // ============================================================================
  
  // Default EVM configurations
  let ETHEREUM_MAINNET : EvmChainConfig = {
    chain_id = 1;
    rpc_services = #EthMainnet(null);
    gas_limit = 300_000;
    gas_price = 20_000_000_000; // 20 gwei
    htlc_contract_address = null;
  };
  
  let POLYGON_MAINNET : EvmChainConfig = {
    chain_id = 137;
    rpc_services = #EthMainnet(null); // Use EthMainnet for now, will be updated when Polygon is supported
    gas_limit = 300_000;
    gas_price = 30_000_000_000; // 30 gwei
    htlc_contract_address = null;
  };
  
  let ARBITRUM_ONE : EvmChainConfig = {
    chain_id = 42161;
    rpc_services = #EthMainnet(null); // Use EthMainnet for now, will be updated when Arbitrum is supported
    gas_limit = 300_000;
    gas_price = 100_000_000; // 0.1 gwei
    htlc_contract_address = null;
  };

  let SEPOLIA_TESTNET : EvmChainConfig = {
    chain_id = 11155111; // Sepolia chain ID
    rpc_services = #EthSepolia(null); // Use Sepolia RPC
    gas_limit = 300_000;
    gas_price = 1_500_000_000; // 1.5 gwei (typical for Sepolia)
    htlc_contract_address = null;
  };
  
  // EVM RPC cycles for different operations
  let EVM_RPC_CYCLES : Nat = 2_000_000_000; // 2B cycles for RPC calls
  let EVM_TX_CYCLES : Nat = 5_000_000_000; // 5B cycles for transaction submission
  
  // ============================================================================
  // STABLE STORAGE
  // ============================================================================
  
  // HTLC storage
  stable var htlc_counter : Nat = 0;
  stable var htlc_entries : [(Text, HTLC)] = [];
  stable var htlc_orders : [(Text, HTLCOrder)] = [];
  
  // Partial fills and resolvers storage
  stable var partial_fill_counter : Nat = 0;
  stable var partial_fill_entries : [(Text, PartialFill)] = [];
  stable var resolver_entries : [(Text, Resolver)] = [];
  
  // EVM integration storage
  stable var evm_interaction_counter : Nat = 0;
  stable var evm_interaction_entries : [(Text, EvmHtlcInteraction)] = [];
  stable var evm_chain_configs : [(Nat, EvmChainConfig)] = [];
  
  // ============================================================================
  // RUNTIME STORAGE
  // ============================================================================
  
  // HTLC storage using HashMap for efficient lookups
  private var htlc_store = HashMap.HashMap<Text, HTLC>(0, Text.equal, Text.hash);
  private var htlc_order_store = HashMap.HashMap<Text, HTLCOrder>(0, Text.equal, Text.hash);
  
  // Partial fills and resolvers storage
  private var partial_fill_store = HashMap.HashMap<Text, PartialFill>(0, Text.equal, Text.hash);
  private var resolver_store = HashMap.HashMap<Text, Resolver>(0, Text.equal, Text.hash);
  
  // EVM integration storage
  private var evm_interaction_store = HashMap.HashMap<Text, EvmHtlcInteraction>(0, Text.equal, Text.hash);
  private var evm_chain_config_store = HashMap.HashMap<Nat, EvmChainConfig>(0, Nat.equal, Hash.hash);
  
  // ============================================================================
  // UPGRADE FUNCTIONS
  // ============================================================================
  
  system func postupgrade() {
    // Restore HTLC data from stable storage
    htlc_store := HashMap.fromIter<Text, HTLC>(htlc_entries.vals(), htlc_entries.size(), Text.equal, Text.hash);
    htlc_order_store := HashMap.fromIter<Text, HTLCOrder>(htlc_orders.vals(), htlc_orders.size(), Text.equal, Text.hash);
    partial_fill_store := HashMap.fromIter<Text, PartialFill>(partial_fill_entries.vals(), partial_fill_entries.size(), Text.equal, Text.hash);
    resolver_store := HashMap.fromIter<Text, Resolver>(resolver_entries.vals(), resolver_entries.size(), Text.equal, Text.hash);
    
    // Restore EVM data from stable storage
    evm_interaction_store := HashMap.fromIter<Text, EvmHtlcInteraction>(evm_interaction_entries.vals(), evm_interaction_entries.size(), Text.equal, Text.hash);
    evm_chain_config_store := HashMap.fromIter<Nat, EvmChainConfig>(evm_chain_configs.vals(), evm_chain_configs.size(), Nat.equal, Hash.hash);
    
    // Initialize default chain configs if empty
    if (evm_chain_config_store.size() == 0) {
      evm_chain_config_store.put(1, ETHEREUM_MAINNET);
      evm_chain_config_store.put(11155111, SEPOLIA_TESTNET);
      evm_chain_config_store.put(137, POLYGON_MAINNET);
      evm_chain_config_store.put(42161, ARBITRUM_ONE);
    };
    
    // Clear stable storage
    htlc_entries := [];
    htlc_orders := [];
    partial_fill_entries := [];
    resolver_entries := [];
    evm_interaction_entries := [];
    evm_chain_configs := [];
  };
  
  system func preupgrade() {
    // Save HTLC data to stable storage
    htlc_entries := Iter.toArray(htlc_store.entries());
    htlc_orders := Iter.toArray(htlc_order_store.entries());
    partial_fill_entries := Iter.toArray(partial_fill_store.entries());
    resolver_entries := Iter.toArray(resolver_store.entries());
    
    // Save EVM data to stable storage
    evm_interaction_entries := Iter.toArray(evm_interaction_store.entries());
    evm_chain_configs := Iter.toArray(evm_chain_config_store.entries());
  };
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  // Generate unique HTLC ID
  private func generate_htlc_id() : Text {
    htlc_counter += 1;
    "htlc_" # Nat.toText(htlc_counter) # "_" # Int.toText(Time.now());
  };
  
  // Validate HTLC parameters
  private func validate_htlc_params(
    recipient : Principal,
    amount : Nat,
    expiration_time : Int
  ) : Result.Result<(), Text> {
    if (amount == 0) {
      return #err("Amount must be greater than 0");
    };
    
    if (expiration_time <= Time.now()) {
      return #err("Expiration time must be in the future");
    };
    
    if (Principal.isAnonymous(recipient)) {
      return #err("Recipient cannot be anonymous");
    };
    
    #ok(());
  };
  
  // Check if HTLC has expired
  private func is_expired(htlc : HTLC) : Bool {
    Time.now() > htlc.expiration_time;
  };
  
  // Generate unique partial fill ID
  private func generate_partial_fill_id() : Text {
    partial_fill_counter += 1;
    "fill_" # Nat.toText(partial_fill_counter) # "_" # Int.toText(Time.now());
  };
  
  // Calculate Merkle root for partial fills (simplified)
  private func calculate_merkle_root(fills : [PartialFill]) : Text {
    // In a real implementation, this would calculate the actual Merkle root
    // For now, we'll use a simple hash of all fill IDs
    let fill_ids = Buffer.Buffer<Text>(0);
    for (fill in fills.vals()) {
      fill_ids.add(fill.fill_id);
    };
    "merkle_" # Nat.toText(fill_ids.size()) # "_" # Int.toText(Time.now());
  };
  
  // Validate partial fill amount
  private func validate_partial_fill_amount(
    htlc_amount : Nat,
    total_filled : Nat,
    fill_amount : Nat
  ) : Result.Result<(), Text> {
    if (fill_amount == 0) {
      return #err("Fill amount must be greater than 0");
    };
    
    if (total_filled + fill_amount > htlc_amount) {
      return #err("Fill amount would exceed total HTLC amount");
    };
    
    #ok(());
  };
  
  // ============================================================================
  // 1INCH API CONFIGURATION
  // ============================================================================
  
  // 1inch API endpoints
  let INCH_API_ENDPOINTS = {
    fusion_plus_orders = "https://api.1inch.dev/fusion-plus/orders/v1.0";
    swap_v5 = "https://api.1inch.dev/swap/v5.2";
    web3 = "https://api.1inch.dev/web3";
  };
  
  // Your 1inch API key (replace with actual key)
  let INCH_API_KEY = "CIIO5z3j5w1PvatqNxqunlzNE2hbHB6D";
  
  // Default cycles for HTTP requests (adjust based on your needs)
  let DEFAULT_HTTP_CYCLES : Nat = 230_949_972_000;
  
  // ============================================================================
  // TRANSFORM FUNCTION FOR HTTP RESPONSES
  // ============================================================================
  
  public query func transform({
    context : Blob;
    response : HttpResponseResult;
  }) : async HttpResponseResult {
    {
      response with headers = []; // Remove headers to avoid consensus issues
    };
  };
  
  // ============================================================================
  // HTTP HELPER FUNCTIONS
  // ============================================================================
  
  private func createHttpRequest(
    url : Text,
    method : Text,
    body : ?Text,
    headers : [HttpHeader]
  ) : HttpRequestArgs {
    {
      url = url;
      max_response_bytes = null;
      headers = headers;
      body = switch (body) {
        case (?b) { ?Text.encodeUtf8(b) };
        case (null) { null };
      };
      method = switch (method) {
        case ("GET") { #get };
        case ("POST") { #post };
        case ("HEAD") { #head };
        case (_) { #get };
      };
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
      is_replicated = null;
    };
  };
  
  private func decodeHttpResponse(response : HttpResponseResult) : Result.Result<Text, Text> {
    switch (Text.decodeUtf8(response.body)) {
      case (?text) { #ok(text) };
      case (null) { #err("Failed to decode response body") };
    };
  };
  
  // ============================================================================
  // EVM HELPER FUNCTIONS
  // ============================================================================
  
  // Generate unique EVM interaction ID
  private func generate_evm_interaction_id() : Text {
    evm_interaction_counter += 1;
    "evm_" # Nat.toText(evm_interaction_counter) # "_" # Int.toText(Time.now());
  };
  
  // Convert Nat to hex string
  private func nat_to_hex(n : Nat) : Text {
    let hex_chars = "0123456789abcdef";
    var result = "";
    var num = n;
    
    if (num == 0) {
      return "0x0";
    };
    
    while (num > 0) {
      let digit = num % 16;
      // Convert digit to hex character using array indexing
      let hex_char = if (digit < 10) {
        Nat.toText(digit);
      } else {
        switch (digit) {
          case (10) { "a" };
          case (11) { "b" };
          case (12) { "c" };
          case (13) { "d" };
          case (14) { "e" };
          case (15) { "f" };
          case (_) { "0" };
        };
      };
      result := hex_char # result;
      num := num / 16;
    };
    
    "0x" # result;
  };
  
  // Convert hex string to Nat
  private func hex_to_nat(hex : Text) : Result.Result<Nat, Text> {
    if (Text.size(hex) < 2 or not Text.startsWith(hex, #text("0x"))) {
      return #err("Invalid hex format");
    };
    
    // Use BaseX library to decode hex
    let format = { prefix = #single("0x") };
    switch (BaseX.fromHex(hex, format)) {
      case (#ok(bytes)) {
        // Convert bytes to Nat (big-endian)
        var result : Nat = 0;
        for (byte in bytes.vals()) {
          result := result * 256 + Nat8.toNat(byte);
        };
        #ok(result);
      };
      case (#err(error)) {
        #err("Failed to decode hex: " # error);
      };
    };
  };
  
  // Get chain configuration for a specific chain ID
  private func get_chain_config_internal(chain_id : Nat) : Result.Result<EvmChainConfig, Text> {
    switch (evm_chain_config_store.get(chain_id)) {
      case (?config) { #ok(config) };
      case (null) { #err("Chain configuration not found for chain ID: " # Nat.toText(chain_id)) };
    };
  };
  
  // Get current nonce for an address
  private func get_nonce(address : Text, chain_config : EvmChainConfig) : async Result.Result<Nat, Text> {
    // Simplified - just return 0 for now
    #ok(0);
  };
  
  // Get current gas price
  private func get_gas_price(chain_config : EvmChainConfig) : async Result.Result<Nat, Text> {
    // Simplified - just return the default gas price
    #ok(chain_config.gas_price);
  };
  
  // Create EVM transaction data for HTLC operations
  private func create_htlc_transaction_data(
    action : {
      #Create;
      #Claim;
      #Refund;
    },
    htlc_data : {
      hashlock : Text;
      sender : Text;
      recipient : Text;
      amount : Text;
      expiration : Text;
      secret : ?Text;
    }
  ) : Result.Result<Text, Text> {
    // This is a simplified version - in a real implementation,
    // you would encode the actual HTLC contract function calls
    switch (action) {
      case (#Create) {
        // createHTLC(hashlock, recipient, expiration)
        let data = "0x" # 
          "createHTLC" # 
          htlc_data.hashlock # 
          htlc_data.recipient # 
          htlc_data.expiration;
        #ok(data);
      };
      case (#Claim) {
        // claimHTLC(secret)
        switch (htlc_data.secret) {
          case (?secret) {
            let data = "0x" # "claimHTLC" # secret;
            #ok(data);
          };
          case (null) { #err("Secret required for claim") };
        };
      };
      case (#Refund) {
        // refundHTLC()
        #ok("0xrefundHTLC");
      };
    };
  };
  
  // ============================================================================
  // CORE HTLC METHODS
  // ============================================================================
  
  /// Create a new HTLC lock
  public shared({ caller }) func create_htlc(
    recipient : Principal,
    amount : Nat,
    token_canister : Principal,
    expiration_time : Int,
    chain_type : ChainType,
    ethereum_address : ?Text
  ) : async Result.Result<Text, Text> {
    
    // Validate parameters
    switch (validate_htlc_params(recipient, amount, expiration_time)) {
      case (#err(error)) { return #err(error) };
      case (#ok()) { };
    };
    
    // Generate unique HTLC ID
    let htlc_id = generate_htlc_id();
    
    // Create HTLC structure (hashlock will be set when secret is provided)
    let htlc : HTLC = {
      id = htlc_id;
      hashlock = Blob.fromArray([]); // Will be set when secret is provided
      sender = caller;
      recipient = recipient;
      amount = amount;
      token_canister = token_canister;
      expiration_time = expiration_time;
      status = #Locked;
      created_at = Time.now();
      secret = null;
      chain_type = chain_type;
      ethereum_address = ethereum_address;
    };
    
    // Store HTLC
    htlc_store.put(htlc_id, htlc);
    
    #ok(htlc_id);
  };
  
  /// Set the hashlock for an HTLC (called after secret is generated)
  public shared({ caller }) func set_htlc_hashlock(
    htlc_id : Text,
    hashlock : Blob
  ) : async Result.Result<(), Text> {
    
    switch (htlc_store.get(htlc_id)) {
      case (?htlc) {
        if (htlc.sender != caller) {
          return #err("Only the sender can set the hashlock");
        };
        
        if (htlc.status != #Locked) {
          return #err("HTLC is not in locked state");
        };
        
        // Update hashlock
        let updated_htlc : HTLC = {
          htlc with hashlock = hashlock;
        };
        
        htlc_store.put(htlc_id, updated_htlc);
        #ok(());
      };
      case (null) {
        #err("HTLC not found");
      };
    };
  };
  
  /// Claim an HTLC with the secret
  public shared({ caller }) func claim_htlc(
    htlc_id : Text,
    secret : Text
  ) : async Result.Result<(), Text> {
    
    switch (htlc_store.get(htlc_id)) {
      case (?htlc) {
        if (htlc.recipient != caller) {
          return #err("Only the recipient can claim the HTLC");
        };
        
        if (htlc.status != #Locked) {
          return #err("HTLC is not in locked state");
        };
        
        if (is_expired(htlc)) {
          return #err("HTLC has expired");
        };
        
        // TODO: Verify hashlock matches secret hash
        // For now, we'll just update the status
        
        let updated_htlc : HTLC = {
          htlc with 
          status = #Claimed;
          secret = ?secret;
        };
        
        htlc_store.put(htlc_id, updated_htlc);
        #ok(());
      };
      case (null) {
        #err("HTLC not found");
      };
    };
  };
  
  /// Refund an expired HTLC
  public shared({ caller }) func refund_htlc(htlc_id : Text) : async Result.Result<(), Text> {
    
    switch (htlc_store.get(htlc_id)) {
      case (?htlc) {
        if (htlc.sender != caller) {
          return #err("Only the sender can refund the HTLC");
        };
        
        if (htlc.status != #Locked) {
          return #err("HTLC is not in locked state");
        };
        
        if (not is_expired(htlc)) {
          return #err("HTLC has not expired yet");
        };
        
        let updated_htlc : HTLC = {
          htlc with status = #Refunded;
        };
        
        htlc_store.put(htlc_id, updated_htlc);
        #ok(());
      };
      case (null) {
        #err("HTLC not found");
      };
    };
  };
  
  /// Get HTLC details
  public query func get_htlc(htlc_id : Text) : async Result.Result<HTLC, Text> {
    switch (htlc_store.get(htlc_id)) {
      case (?htlc) { #ok(htlc) };
      case (null) { #err("HTLC not found") };
    };
  };
  
  /// Get all HTLCs for a principal
  public query func get_htlcs_by_principal(principal : Principal) : async [HTLC] {
    let result = Buffer.Buffer<HTLC>(0);
    
    for ((_, htlc) in htlc_store.entries()) {
      if (htlc.sender == principal or htlc.recipient == principal) {
        result.add(htlc);
      };
    };
    
    Buffer.toArray(result);
  };
  
  // ============================================================================
  // 1INCH INTEGRATION METHODS
  // ============================================================================
  
  /// Link a 1inch order to an HTLC
  public shared({ caller }) func link_1inch_order(
    htlc_id : Text,
    oneinch_order : OneInchOrder,
    is_source_chain : Bool,
    partial_fill_index : ?Nat
  ) : async Result.Result<(), Text> {
    
    // Verify HTLC exists and caller is the sender
    switch (htlc_store.get(htlc_id)) {
      case (?htlc) {
        if (htlc.sender != caller) {
          return #err("Only the sender can link 1inch orders");
        };
        
        let htlc_order : HTLCOrder = {
          htlc_id = htlc_id;
          oneinch_order = oneinch_order;
          is_source_chain = is_source_chain;
          partial_fill_index = partial_fill_index;
          total_filled = 0;
          remaining_amount = htlc.amount;
          partial_fills = [];
          merkle_root = null;
        };
        
        htlc_order_store.put(htlc_id, htlc_order);
        #ok(());
      };
      case (null) {
        #err("HTLC not found");
      };
    };
  };
  
  /// Get linked 1inch order for an HTLC
  public query func get_1inch_order(htlc_id : Text) : async Result.Result<HTLCOrder, Text> {
    switch (htlc_order_store.get(htlc_id)) {
      case (?htlc_order) { #ok(htlc_order) };
      case (null) { #err("No 1inch order linked to this HTLC") };
    };
  };
  
  // ============================================================================
  // PARTIAL FILLS AND RESOLVER METHODS
  // ============================================================================
  
  /// Register a new resolver
  public shared({ caller }) func register_resolver(
    address : Text,
    supported_chains : [ChainType]
  ) : async Result.Result<(), Text> {
    
    if (Text.size(address) == 0) {
      return #err("Resolver address cannot be empty");
    };
    
    let resolver : Resolver = {
      address = address;
      is_active = true;
      total_fills = 0;
      success_rate = 100.0; // Start with 100% success rate
      last_active = Time.now();
      supported_chains = supported_chains;
    };
    
    resolver_store.put(address, resolver);
    #ok(());
  };
  
  /// Update resolver status
  public shared({ caller }) func update_resolver_status(
    address : Text,
    is_active : Bool
  ) : async Result.Result<(), Text> {
    
    switch (resolver_store.get(address)) {
      case (?resolver) {
        let updated_resolver : Resolver = {
          resolver with 
          is_active = is_active;
          last_active = Time.now();
        };
        
        resolver_store.put(address, updated_resolver);
        #ok(());
      };
      case (null) {
        #err("Resolver not found");
      };
    };
  };
  
  /// Create a partial fill for an HTLC
  public shared({ caller }) func create_partial_fill(
    htlc_id : Text,
    amount : Nat,
    secret_hash : Text,
    resolver_address : Text
  ) : async Result.Result<Text, Text> {
    
    // Verify HTLC exists and is in locked state
    switch (htlc_store.get(htlc_id)) {
      case (?htlc) {
        if (htlc.status != #Locked) {
          return #err("HTLC is not in locked state");
        };
        
        // Verify resolver exists and is active
        switch (resolver_store.get(resolver_address)) {
          case (?resolver) {
            if (not resolver.is_active) {
              return #err("Resolver is not active");
            };
          };
          case (null) {
            return #err("Resolver not found");
          };
        };
        
        // Get current order state
        switch (htlc_order_store.get(htlc_id)) {
          case (?htlc_order) {
            // Validate fill amount
            switch (validate_partial_fill_amount(htlc.amount, htlc_order.total_filled, amount)) {
              case (#err(error)) { return #err(error) };
              case (#ok()) { };
            };
            
            // Create partial fill
            let fill_id = generate_partial_fill_id();
            let partial_fill : PartialFill = {
              fill_id = fill_id;
              htlc_id = htlc_id;
              amount = amount;
              secret_hash = secret_hash;
              resolver_address = resolver_address;
              fill_timestamp = Time.now();
              status = #Pending;
            };
            
            // Store partial fill
            partial_fill_store.put(fill_id, partial_fill);
            
            // Update HTLC order
            let updated_order : HTLCOrder = {
              htlc_order with
              total_filled = htlc_order.total_filled + amount;
              remaining_amount = htlc_order.remaining_amount - amount;
              partial_fills = Array.append(htlc_order.partial_fills, [fill_id]);
            };
            
            htlc_order_store.put(htlc_id, updated_order);
            
            #ok(fill_id);
          };
          case (null) {
            #err("No 1inch order linked to this HTLC");
          };
        };
      };
      case (null) {
        #err("HTLC not found");
      };
    };
  };
  
  /// Complete a partial fill
  public shared({ caller }) func complete_partial_fill(
    fill_id : Text,
    secret : Text
  ) : async Result.Result<(), Text> {
    
    switch (partial_fill_store.get(fill_id)) {
      case (?partial_fill) {
        if (partial_fill.status != #Pending) {
          return #err("Partial fill is not in pending state");
        };
        
        // Update partial fill status
        let updated_fill : PartialFill = {
          partial_fill with status = #Completed;
        };
        
        partial_fill_store.put(fill_id, updated_fill);
        
        // Update resolver stats
        switch (resolver_store.get(partial_fill.resolver_address)) {
          case (?resolver) {
            let updated_resolver : Resolver = {
              resolver with
              total_fills = resolver.total_fills + 1;
              last_active = Time.now();
            };
            
            resolver_store.put(partial_fill.resolver_address, updated_resolver);
          };
          case (null) { };
        };
        
        #ok(());
      };
      case (null) {
        #err("Partial fill not found");
      };
    };
  };
  
  /// Get partial fill details
  public query func get_partial_fill(fill_id : Text) : async Result.Result<PartialFill, Text> {
    switch (partial_fill_store.get(fill_id)) {
      case (?partial_fill) { #ok(partial_fill) };
      case (null) { #err("Partial fill not found") };
    };
  };
  
  /// Get all partial fills for an HTLC
  public query func get_htlc_partial_fills(htlc_id : Text) : async Result.Result<[PartialFill], Text> {
    let result = Buffer.Buffer<PartialFill>(0);
    
    for ((_, partial_fill) in partial_fill_store.entries()) {
      if (partial_fill.htlc_id == htlc_id) {
        result.add(partial_fill);
      };
    };
    
    #ok(Buffer.toArray(result));
  };
  
  /// Get resolver details
  public query func get_resolver(address : Text) : async Result.Result<Resolver, Text> {
    switch (resolver_store.get(address)) {
      case (?resolver) { #ok(resolver) };
      case (null) { #err("Resolver not found") };
    };
  };
  
  /// Get all active resolvers
  public query func get_active_resolvers() : async [Resolver] {
    let result = Buffer.Buffer<Resolver>(0);
    
    for ((_, resolver) in resolver_store.entries()) {
      if (resolver.is_active) {
        result.add(resolver);
      };
    };
    
    Buffer.toArray(result);
  };
  
  /// Get resolvers supporting a specific chain
  public query func get_resolvers_for_chain(chain_type : ChainType) : async [Resolver] {
    let result = Buffer.Buffer<Resolver>(0);
    
    for ((_, resolver) in resolver_store.entries()) {
      if (resolver.is_active) {
        var found = false;
        for (supported_chain in resolver.supported_chains.vals()) {
          if (supported_chain == chain_type and not found) {
            result.add(resolver);
            found := true;
          };
        };
      };
    };
    
    Buffer.toArray(result);
  };
  
  // ============================================================================
  // 1INCH FUSION+ API COMMUNICATION
  // ============================================================================
  
  /// Get active cross-chain swap orders
  public func get_active_orders(
    page : ?Nat,
    limit : ?Nat,
    src_chain : ?Nat,
    dst_chain : ?Nat
  ) : async Result.Result<Text, Text> {
    let base_url = INCH_API_ENDPOINTS.fusion_plus_orders # "/order/active";
    
    // Build query parameters
    let query_params = Buffer.Buffer<Text>(0);
    
    switch (page) {
      case (?p) { query_params.add("page=" # Nat.toText(p)) };
      case (null) { query_params.add("page=1") };
    };
    
    switch (limit) {
      case (?l) { query_params.add("limit=" # Nat.toText(l)) };
      case (null) { query_params.add("limit=100") };
    };
    
    switch (src_chain) {
      case (?sc) { query_params.add("srcChain=" # Nat.toText(sc)) };
      case (null) { };
    };
    
    switch (dst_chain) {
      case (?dc) { query_params.add("dstChain=" # Nat.toText(dc)) };
      case (null) { };
    };
    
    let url = base_url # "?" # Text.join("&", query_params.vals());
    
    let request_headers = [
      { name = "accept"; value = "application/json" },
      { name = "Authorization"; value = "Bearer " # INCH_API_KEY },
      { name = "User-Agent"; value = "ionic-swap-htlc" },
    ];
    
    let http_request = createHttpRequest(url, "GET", null, request_headers);
    
    try {
      Cycles.add<system>(DEFAULT_HTTP_CYCLES);
      let http_response = await IC.http_request(http_request);
      
      switch (decodeHttpResponse(http_response)) {
        case (#ok(response_text)) { #ok(response_text) };
        case (#err(error)) { #err("Failed to decode response: " # error) };
      };
    } catch (error) {
      #err("HTTP request failed: " # Error.message(error));
    };
  };
  
  /// Get orders by maker address
  public func get_orders_by_maker(
    maker_address : Text,
    page : ?Nat,
    limit : ?Nat,
    src_chain_id : ?Nat,
    dst_chain_id : ?Nat
  ) : async Result.Result<Text, Text> {
    let base_url = INCH_API_ENDPOINTS.fusion_plus_orders # "/order/maker/" # maker_address;
    
    // Build query parameters
    let query_params = Buffer.Buffer<Text>(0);
    
    switch (page) {
      case (?p) { query_params.add("page=" # Nat.toText(p)) };
      case (null) { };
    };
    
    switch (limit) {
      case (?l) { query_params.add("limit=" # Nat.toText(l)) };
      case (null) { };
    };
    
    switch (src_chain_id) {
      case (?sc) { query_params.add("srcChainId=" # Nat.toText(sc)) };
      case (null) { };
    };
    
    switch (dst_chain_id) {
      case (?dc) { query_params.add("dstChainId=" # Nat.toText(dc)) };
      case (null) { };
    };
    
    let url = if (query_params.size() > 0) {
      base_url # "?" # Text.join("&", query_params.vals());
    } else {
      base_url;
    };
    
    let request_headers = [
      { name = "accept"; value = "application/json" },
      { name = "Authorization"; value = "Bearer " # INCH_API_KEY },
      { name = "User-Agent"; value = "ionic-swap-htlc" },
    ];
    
    let http_request = createHttpRequest(url, "GET", null, request_headers);
    
    try {
      Cycles.add<system>(DEFAULT_HTTP_CYCLES);
      let http_response = await IC.http_request(http_request);
      
      switch (decodeHttpResponse(http_response)) {
        case (#ok(response_text)) { #ok(response_text) };
        case (#err(error)) { #err("Failed to decode response: " # error) };
      };
    } catch (error) {
      #err("HTTP request failed: " # Error.message(error));
    };
  };
  
  /// Get secrets and data for withdrawal and cancellation
  public func get_order_secrets(order_hash : Text) : async Result.Result<Text, Text> {
    let url = INCH_API_ENDPOINTS.fusion_plus_orders # "/order/secrets/" # order_hash;
    
    let request_headers = [
      { name = "accept"; value = "application/json" },
      { name = "Authorization"; value = "Bearer " # INCH_API_KEY },
      { name = "User-Agent"; value = "ionic-swap-htlc" },
    ];
    
    let http_request = createHttpRequest(url, "GET", null, request_headers);
    
    try {
      Cycles.add<system>(DEFAULT_HTTP_CYCLES);
      let http_response = await IC.http_request(http_request);
      
      switch (decodeHttpResponse(http_response)) {
        case (#ok(response_text)) { #ok(response_text) };
        case (#err(error)) { #err("Failed to decode response: " # error) };
      };
    } catch (error) {
      #err("HTTP request failed: " # Error.message(error));
    };
  };
  
  /// Get escrow factory contract address
  public func get_escrow_factory_address(chain_id : Nat) : async Result.Result<Text, Text> {
    let url = INCH_API_ENDPOINTS.fusion_plus_orders # "/order/escrow?chainId=" # Nat.toText(chain_id);
    
    let request_headers = [
      { name = "accept"; value = "application/json" },
      { name = "Authorization"; value = "Bearer " # INCH_API_KEY },
      { name = "User-Agent"; value = "ionic-swap-htlc" },
    ];
    
    let http_request = createHttpRequest(url, "GET", null, request_headers);
    
    try {
      Cycles.add<system>(DEFAULT_HTTP_CYCLES);
      let http_response = await IC.http_request(http_request);
      
      switch (decodeHttpResponse(http_response)) {
        case (#ok(response_text)) { #ok(response_text) };
        case (#err(error)) { #err("Failed to decode response: " # error) };
      };
    } catch (error) {
      #err("HTTP request failed: " # Error.message(error));
    };
  };
  
  /// Get available tokens for a specific chain
  public func get_tokens(chain_id : Nat) : async Result.Result<Text, Text> {
    let url = INCH_API_ENDPOINTS.swap_v5 # "/" # Nat.toText(chain_id) # "/tokens";
    
    let request_headers = [
      { name = "accept"; value = "application/json" },
      { name = "Authorization"; value = "Bearer " # INCH_API_KEY },
      { name = "User-Agent"; value = "ionic-swap-htlc" },
    ];
    
    let http_request = createHttpRequest(url, "GET", null, request_headers);
    
    try {
      Cycles.add<system>(DEFAULT_HTTP_CYCLES);
      let http_response = await IC.http_request(http_request);
      
      switch (decodeHttpResponse(http_response)) {
        case (#ok(response_text)) { #ok(response_text) };
        case (#err(error)) { #err("Failed to decode response: " # error) };
      };
    } catch (error) {
      #err("HTTP request failed: " # Error.message(error));
    };
  };
  
  // ============================================================================
  // HELPER METHODS FOR HTLC INTEGRATION
  // ============================================================================
  
  /// Parse order secrets response to extract secret for HTLC claim
  public func parse_order_secrets_for_htlc(order_hash : Text) : async Result.Result<Text, Text> {
    switch (await get_order_secrets(order_hash)) {
      case (#ok(response_text)) {
        // Parse the JSON response to extract the first secret
        switch (JSON.parse(response_text)) {
          case (?json) {
            // For now, we'll return the raw response since the JSON library doesn't have get methods
            // In a full implementation, you'd parse the JSON structure manually
            #ok(response_text);
          };
          case (null) { #err("Failed to parse JSON response") };
        };
      };
      case (#err(error)) { #err("Failed to get order secrets: " # error) };
    };
  };
  
  /// Check if an order is active and can be filled
  public func is_order_active(order_hash : Text) : async Result.Result<Bool, Text> {
    switch (await get_active_orders(?1, ?500, null, null)) {
      case (#ok(response_text)) {
        // Parse the JSON response to check if the order is in the active list
        switch (JSON.parse(response_text)) {
          case (?json) {
            // For now, we'll just check if the response contains the order hash
            // In a full implementation, you'd parse the items array and check each order
            if (Text.contains(response_text, #text(order_hash))) {
              #ok(true);
            } else {
              #ok(false);
            };
          };
          case (null) { #err("Failed to parse JSON response") };
        };
      };
      case (#err(error)) { #err("Failed to get active orders: " # error) };
    };
  };
  
  // ============================================================================
  // EVM INTEGRATION METHODS
  // ============================================================================
  
  /// Get latest block number from EVM chain
  public func get_evm_block_number(chain_id : Nat) : async Result.Result<Nat, Text> {
    switch (get_chain_config_internal(chain_id)) {
      case (#ok(config)) {
        Cycles.add<system>(EVM_RPC_CYCLES);
        
        let result = await EvmRpc.eth_getBlockByNumber(config.rpc_services, null, #Latest);
        
        switch (result) {
          case (#Consistent(#Ok block)) {
            #ok(block.number);
          };
          case (#Consistent(#Err error)) {
            #err("RPC error: " # debug_show(error));
          };
          case (#Inconsistent(_)) {
            #err("Inconsistent RPC results");
          };
        };
      };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Get transaction receipt from EVM chain
  public func get_evm_transaction_receipt(chain_id : Nat, tx_hash : Text) : async Result.Result<Text, Text> {
    switch (get_chain_config_internal(chain_id)) {
      case (#ok(config)) {
        Cycles.add<system>(EVM_RPC_CYCLES);
        
        let result = await EvmRpc.eth_getTransactionReceipt(config.rpc_services, null, tx_hash);
        
        switch (result) {
          case (#Consistent(#Ok receipt)) {
            #ok(debug_show(receipt));
          };
          case (#Consistent(#Err error)) {
            #err("RPC error: " # debug_show(error));
          };
          case (#Inconsistent(_)) {
            #err("Inconsistent RPC results");
          };
        };
      };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Get balance of an address on EVM chain
  public func get_evm_balance(chain_id : Nat, address : Text) : async Result.Result<Text, Text> {
    switch (get_chain_config_internal(chain_id)) {
      case (#ok(config)) {
        Cycles.add<system>(EVM_RPC_CYCLES);
        
        let result = await EvmRpc.eth_call(
          config.rpc_services,
          null,
          {
            block = null;
            transaction = {
              to = ?address;
              input = ?"0x70a082310000000000000000000000000000000000000000000000000000000000000000"; // balanceOf(address) - simplified
              accessList = null;
              blobVersionedHashes = null;
              blobs = null;
              chainId = null;
              from = null;
              gas = null;
              gasPrice = null;
              maxFeePerBlobGas = null;
              maxFeePerGas = null;
              maxPriorityFeePerGas = null;
              nonce = null;
              type_ = null;
              value = null;
            };
          }
        );
        
        switch (result) {
          case (#Consistent(#Ok response)) {
            #ok(response);
          };
          case (#Consistent(#Err error)) {
            #err("RPC error: " # debug_show(error));
          };
          case (#Inconsistent(_)) {
            #err("Inconsistent RPC results");
          };
        };
      };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Create HTLC on EVM chain
  public shared({ caller }) func create_evm_htlc(
    chain_id : Nat,
    evm_htlc_address : Text,
    hashlock : Text,
    recipient : Text,
    amount : Nat,
    expiration : Int
  ) : async Result.Result<Text, Text> {
    switch (get_chain_config_internal(chain_id)) {
      case (#ok(config)) {
        // Create transaction data for HTLC creation
        let tx_data = create_htlc_transaction_data(
          #Create,
          {
            hashlock = hashlock;
            sender = "0x" # Principal.toText(caller); // Convert principal to address format
            recipient = recipient;
            amount = nat_to_hex(amount);
            expiration = nat_to_hex(if (expiration > 0) { Int.abs(expiration) } else { 0 });
            secret = null;
          }
        );
        
        switch (tx_data) {
          case (#ok(data)) {
            // Create EVM interaction record
            let interaction_id = generate_evm_interaction_id();
            let interaction : EvmHtlcInteraction = {
              htlc_id = interaction_id;
              evm_htlc_address = evm_htlc_address;
              action = #Create;
              secret = null;
              transaction_hash = null;
              status = #Pending;
            };
            
            evm_interaction_store.put(interaction_id, interaction);
            
            // For now, return the interaction ID
            // In a full implementation, you would:
            // 1. Get the current nonce
            // 2. Get current gas price
            // 3. Sign the transaction using ckETH
            // 4. Submit the raw transaction
            // 5. Update the interaction with the transaction hash
            
            #ok(interaction_id);
          };
          case (#err(error)) { #err("Failed to create transaction data: " # error) };
        };
      };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Claim HTLC on EVM chain
  public shared({ caller }) func claim_evm_htlc(
    chain_id : Nat,
    evm_htlc_address : Text,
    secret : Text
  ) : async Result.Result<Text, Text> {
    switch (get_chain_config_internal(chain_id)) {
      case (#ok(config)) {
        // Create transaction data for HTLC claim
        let tx_data = create_htlc_transaction_data(
          #Claim,
          {
            hashlock = ""; // Not needed for claim
            sender = "0x" # Principal.toText(caller);
            recipient = evm_htlc_address;
            amount = "0x0";
            expiration = "0x0";
            secret = ?secret;
          }
        );
        
        switch (tx_data) {
          case (#ok(data)) {
            // Create EVM interaction record
            let interaction_id = generate_evm_interaction_id();
            let interaction : EvmHtlcInteraction = {
              htlc_id = interaction_id;
              evm_htlc_address = evm_htlc_address;
              action = #Claim;
              secret = ?secret;
              transaction_hash = null;
              status = #Pending;
            };
            
            evm_interaction_store.put(interaction_id, interaction);
            
            // For now, return the interaction ID
            // In a full implementation, you would submit the transaction
            
            #ok(interaction_id);
          };
          case (#err(error)) { #err("Failed to create transaction data: " # error) };
        };
      };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Refund HTLC on EVM chain
  public shared({ caller }) func refund_evm_htlc(
    chain_id : Nat,
    evm_htlc_address : Text
  ) : async Result.Result<Text, Text> {
    switch (get_chain_config_internal(chain_id)) {
      case (#ok(config)) {
        // Create transaction data for HTLC refund
        let tx_data = create_htlc_transaction_data(
          #Refund,
          {
            hashlock = "";
            sender = "0x" # Principal.toText(caller);
            recipient = evm_htlc_address;
            amount = "0x0";
            expiration = "0x0";
            secret = null;
          }
        );
        
        switch (tx_data) {
          case (#ok(data)) {
            // Create EVM interaction record
            let interaction_id = generate_evm_interaction_id();
            let interaction : EvmHtlcInteraction = {
              htlc_id = interaction_id;
              evm_htlc_address = evm_htlc_address;
              action = #Refund;
              secret = null;
              transaction_hash = null;
              status = #Pending;
            };
            
            evm_interaction_store.put(interaction_id, interaction);
            
            // For now, return the interaction ID
            // In a full implementation, you would submit the transaction
            
            #ok(interaction_id);
          };
          case (#err(error)) { #err("Failed to create transaction data: " # error) };
        };
      };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Get EVM interaction details
  public query func get_evm_interaction(interaction_id : Text) : async Result.Result<EvmHtlcInteraction, Text> {
    switch (evm_interaction_store.get(interaction_id)) {
      case (?interaction) { #ok(interaction) };
      case (null) { #err("EVM interaction not found") };
    };
  };
  
  /// Get all EVM interactions for an HTLC
  public query func get_evm_interactions_by_htlc(htlc_id : Text) : async [EvmHtlcInteraction] {
    let interactions = Buffer.Buffer<EvmHtlcInteraction>(0);
    
    for ((id, interaction) in evm_interaction_store.entries()) {
      if (Text.contains(id, #text(htlc_id))) {
        interactions.add(interaction);
      };
    };
    
    Buffer.toArray(interactions);
  };
  
  /// Update chain configuration
  public shared({ caller }) func update_chain_config(
    chain_id : Nat,
    config : EvmChainConfig
  ) : async Result.Result<(), Text> {
    // In a real implementation, you would add authorization checks here
    evm_chain_config_store.put(chain_id, config);
    #ok(());
  };
  
  /// Get chain configuration
  public query func get_chain_config(chain_id : Nat) : async Result.Result<EvmChainConfig, Text> {
    switch (evm_chain_config_store.get(chain_id)) {
      case (?config) { #ok(config) };
      case (null) { #err("Chain configuration not found") };
    };
  };
  
  /// Test EVM RPC connectivity
  public func test_evm_rpc(chain_id : Nat) : async Result.Result<Text, Text> {
    switch (await get_evm_block_number(chain_id)) {
      case (#ok(block_number)) {
        #ok("EVM RPC working - Latest block: " # Nat.toText(block_number));
      };
      case (#err(error)) { #err("EVM RPC test failed: " # error) };
    };
  };
  
  // ============================================================================
  // TESTING AND DEBUGGING METHODS
  // ============================================================================
  
  /// Simple greeting function for testing
  public query func greet(name : Text) : async Text {
    "Hello, " # name # "!";
  };
  
  /// Test method to check if we can make a basic HTTP request
  public func test_http_request() : async Result.Result<Text, Text> {
    let url = "https://httpbin.org/get";
    let request_headers = [
      { name = "User-Agent"; value = "ionic-swap-htlc-test" },
    ];
    
    let http_request = createHttpRequest(url, "GET", null, request_headers);
    
    try {
      Cycles.add<system>(DEFAULT_HTTP_CYCLES);
      let http_response = await IC.http_request(http_request);
      
      switch (decodeHttpResponse(http_response)) {
        case (#ok(response_text)) { #ok(response_text) };
        case (#err(error)) { #err("Failed to decode response: " # error) };
      };
    } catch (error) {
      #err("HTTP request failed: " # Error.message(error));
    };
  };
  
  /// Test 1inch API connectivity
  public func test_1inch_api() : async Result.Result<Text, Text> {
    // Test with a simple token request for Ethereum mainnet
    await get_tokens(1);
  };
  
  /// Test getting active orders (limited to first page)
  public func test_get_active_orders() : async Result.Result<Text, Text> {
    await get_active_orders(?1, ?10, null, null);
  };
  
  /// Get cycles balance
  public query func get_cycles_balance() : async Nat {
    Cycles.balance();
  };
  
  /// Deposit cycles into the canister
  public shared func deposit_cycles() : async () {
    let amount = Cycles.available();
    let accepted = Cycles.accept<system>(amount);
    assert (accepted == amount);
  };
};
