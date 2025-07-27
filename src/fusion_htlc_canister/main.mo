import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
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
  
  // ============================================================================
  // RUNTIME STORAGE
  // ============================================================================
  
  // HTLC storage using HashMap for efficient lookups
  private var htlc_store = HashMap.HashMap<Text, HTLC>(0, Text.equal, Text.hash);
  private var htlc_order_store = HashMap.HashMap<Text, HTLCOrder>(0, Text.equal, Text.hash);
  
  // Partial fills and resolvers storage
  private var partial_fill_store = HashMap.HashMap<Text, PartialFill>(0, Text.equal, Text.hash);
  private var resolver_store = HashMap.HashMap<Text, Resolver>(0, Text.equal, Text.hash);
  
  // ============================================================================
  // UPGRADE FUNCTIONS
  // ============================================================================
  
  system func postupgrade() {
    // Restore HTLC data from stable storage
    htlc_store := HashMap.fromIter<Text, HTLC>(htlc_entries.vals(), htlc_entries.size(), Text.equal, Text.hash);
    htlc_order_store := HashMap.fromIter<Text, HTLCOrder>(htlc_orders.vals(), htlc_orders.size(), Text.equal, Text.hash);
    partial_fill_store := HashMap.fromIter<Text, PartialFill>(partial_fill_entries.vals(), partial_fill_entries.size(), Text.equal, Text.hash);
    resolver_store := HashMap.fromIter<Text, Resolver>(resolver_entries.vals(), resolver_entries.size(), Text.equal, Text.hash);
    
    // Clear stable storage
    htlc_entries := [];
    htlc_orders := [];
    partial_fill_entries := [];
    resolver_entries := [];
  };
  
  system func preupgrade() {
    // Save HTLC data to stable storage
    htlc_entries := Iter.toArray(htlc_store.entries());
    htlc_orders := Iter.toArray(htlc_order_store.entries());
    partial_fill_entries := Iter.toArray(partial_fill_store.entries());
    resolver_entries := Iter.toArray(resolver_store.entries());
  };
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  // Generate unique HTLC ID
  private func generate_htlc_id() : Text {
    htlc_counter += 1;
    "htlc_" # Nat.toText(htlc_counter) # "_" # Int.toText(Time.now());
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
  // CORE HTLC METHODS
  // ============================================================================
  
  /// Create a new HTLC
  public shared({ caller }) func create_htlc(
    recipient : Principal,
    amount : Nat,
    token_canister : Principal,
    expiration_time : Int,
    chain_type : ChainType,
    ethereum_address : ?Text
  ) : async Result.Result<Text, Text> {
    
    if (amount == 0) {
      return #err("Amount must be greater than 0");
    };
    
    if (expiration_time <= Time.now()) {
      return #err("Expiration time must be in the future");
    };
    
    let htlc_id = generate_htlc_id();
    
    let htlc : HTLC = {
      id = htlc_id;
      hashlock = Blob.fromArray([]); // Will be set later
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
    
    htlc_store.put(htlc_id, htlc);
    #ok(htlc_id);
  };
  
  /// Set the hashlock for an HTLC
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
        
        // In a real implementation, you would hash the secret and compare with hashlock
        // For now, we'll just accept any non-empty secret
        if (Text.size(secret) == 0) {
          return #err("Secret cannot be empty");
        };
        
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
    
    // Build query parameters manually
    let page_param = switch (page) {
      case (?p) { "page=" # Nat.toText(p) };
      case (null) { "page=1" };
    };
    
    let limit_param = switch (limit) {
      case (?l) { "limit=" # Nat.toText(l) };
      case (null) { "limit=100" };
    };
    
    let src_param = switch (src_chain) {
      case (?src) { "srcChain=" # Nat.toText(src) };
      case (null) { "" };
    };
    
    let dst_param = switch (dst_chain) {
      case (?dst) { "dstChain=" # Nat.toText(dst) };
      case (null) { "" };
    };
    
    // Build URL with query parameters
    let url = base_url # "?" # page_param # "&" # limit_param;
    
    let headers = [
      { name = "Authorization"; value = "Bearer " # INCH_API_KEY },
      { name = "Accept"; value = "application/json" },
    ];
    
    let request = createHttpRequest(url, "GET", null, headers);
    
    let response = await (with cycles = DEFAULT_HTTP_CYCLES) IC.http_request(request);
    
    switch (decodeHttpResponse(response)) {
      case (#ok(text)) { #ok(text) };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Get orders by maker address
  public func get_orders_by_maker(maker_address : Text) : async Result.Result<Text, Text> {
    let base_url = INCH_API_ENDPOINTS.fusion_plus_orders # "/order/maker/" # maker_address;
    
    let headers = [
      { name = "Authorization"; value = "Bearer " # INCH_API_KEY },
      { name = "Accept"; value = "application/json" },
    ];
    
    let request = createHttpRequest(base_url, "GET", null, headers);
    
    let response = await (with cycles = DEFAULT_HTTP_CYCLES) IC.http_request(request);
    
    switch (decodeHttpResponse(response)) {
      case (#ok(text)) { #ok(text) };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Get order secrets
  public func get_order_secrets(order_hash : Text) : async Result.Result<Text, Text> {
    let url = INCH_API_ENDPOINTS.fusion_plus_orders # "/order/secrets/" # order_hash;
    
    let headers = [
      { name = "Authorization"; value = "Bearer " # INCH_API_KEY },
      { name = "Accept"; value = "application/json" },
    ];
    
    let request = createHttpRequest(url, "GET", null, headers);
    
    let response = await (with cycles = DEFAULT_HTTP_CYCLES) IC.http_request(request);
    
    switch (decodeHttpResponse(response)) {
      case (#ok(text)) { #ok(text) };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Get escrow factory address
  public func get_escrow_factory_address(chain_id : Nat) : async Result.Result<Text, Text> {
    let url = INCH_API_ENDPOINTS.fusion_plus_orders # "/order/escrow?chainId=" # Nat.toText(chain_id);
    
    let headers = [
      { name = "Authorization"; value = "Bearer " # INCH_API_KEY },
      { name = "Accept"; value = "application/json" },
    ];
    
    let request = createHttpRequest(url, "GET", null, headers);
    
    let response = await (with cycles = DEFAULT_HTTP_CYCLES) IC.http_request(request);
    
    switch (decodeHttpResponse(response)) {
      case (#ok(text)) { #ok(text) };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Get tokens for a chain
  public func get_tokens(chain_id : Nat) : async Result.Result<Text, Text> {
    let url = INCH_API_ENDPOINTS.swap_v5 # "/" # Nat.toText(chain_id) # "/tokens";
    
    let headers = [
      { name = "Authorization"; value = "Bearer " # INCH_API_KEY },
      { name = "Accept"; value = "application/json" },
    ];
    
    let request = createHttpRequest(url, "GET", null, headers);
    
    let response = await (with cycles = DEFAULT_HTTP_CYCLES) IC.http_request(request);
    
    switch (decodeHttpResponse(response)) {
      case (#ok(text)) { #ok(text) };
      case (#err(error)) { #err(error) };
    };
  };
  
  // ============================================================================
  // TESTING AND DEBUGGING METHODS
  // ============================================================================
  
  /// Simple greeting function for testing
  public query func greet(name : Text) : async Text {
    "Hello, " # name # "!";
  };
  
  /// Test HTTP request
  public func test_http_request() : async Result.Result<Text, Text> {
    let url = "https://httpbin.org/get";
    let headers = [{ name = "User-Agent"; value = "ICP-Canister" }];
    
    let request = createHttpRequest(url, "GET", null, headers);
    
    let response = await (with cycles = DEFAULT_HTTP_CYCLES) IC.http_request(request);
    
    switch (decodeHttpResponse(response)) {
      case (#ok(text)) { #ok(text) };
      case (#err(error)) { #err(error) };
    };
  };
  
  /// Test 1inch API
  public func test_1inch_api() : async Result.Result<Text, Text> {
    await get_tokens(1); // Get tokens for Ethereum mainnet
  };
  
  /// Test get active orders
  public func test_get_active_orders() : async Result.Result<Text, Text> {
    await get_active_orders(?1, ?10, ?1, ?137); // Page 1, limit 10, Ethereum to Polygon
  };
  
  /// Get cycles balance
  public query func get_cycles_balance() : async Nat {
    Cycles.balance();
  };
  
  /// Deposit cycles to the canister
  public func deposit_cycles() : async Nat {
    Cycles.add<system>(1_000_000_000_000); // 1 trillion cycles
    Cycles.balance();
  };
};
