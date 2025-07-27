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
  
  // HTLC Order Mapping - Links HTLCs to 1inch orders
  type HTLCOrder = {
    htlc_id : Text; // Our HTLC ID
    oneinch_order : OneInchOrder; // Associated 1inch order
    is_source_chain : Bool; // True if ICP is source, false if destination
    partial_fill_index : ?Nat; // Index for partial fills
  };
  
  // ============================================================================
  // STABLE STORAGE
  // ============================================================================
  
  // HTLC storage
  stable var htlc_counter : Nat = 0;
  stable var htlc_entries : [(Text, HTLC)] = [];
  stable var htlc_orders : [(Text, HTLCOrder)] = [];
  
  // ============================================================================
  // RUNTIME STORAGE
  // ============================================================================
  
  // HTLC storage using HashMap for efficient lookups
  private var htlc_store = HashMap.HashMap<Text, HTLC>(0, Text.equal, Text.hash);
  private var htlc_order_store = HashMap.HashMap<Text, HTLCOrder>(0, Text.equal, Text.hash);
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  system func postupgrade() {
    // Restore HTLC data from stable storage
    htlc_store := HashMap.fromIter<Text, HTLC>(htlc_entries.vals(), htlc_entries.size(), Text.equal, Text.hash);
    htlc_order_store := HashMap.fromIter<Text, HTLCOrder>(htlc_orders.vals(), htlc_orders.size(), Text.equal, Text.hash);
    
    // Clear stable storage
    htlc_entries := [];
    htlc_orders := [];
  };
  
  system func preupgrade() {
    // Save HTLC data to stable storage
    htlc_entries := Iter.toArray(htlc_store.entries());
    htlc_orders := Iter.toArray(htlc_order_store.entries());
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
  
  /// Link an HTLC to a 1inch Fusion+ order
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
          return #err("Only the HTLC sender can link 1inch orders");
        };
        
        let htlc_order : HTLCOrder = {
          htlc_id = htlc_id;
          oneinch_order = oneinch_order;
          is_source_chain = is_source_chain;
          partial_fill_index = partial_fill_index;
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
  // EXISTING 1INCH API METHODS (keeping for compatibility)
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
  // HELPER FUNCTIONS
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
  // TESTING AND DEBUGGING METHODS
  // ============================================================================
  
  /// Simple test method to verify the canister is working
  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
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
  
  /// Get current canister cycles balance
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
