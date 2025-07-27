import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import JSON "mo:json.mo/lib";
import IC "ic:aaaaa-aa";

actor {
  
  // ============================================================================
  // TYPES AND CONSTANTS
  // ============================================================================
  
  type HttpRequestArgs = IC.http_request_args;
  type HttpResponseResult = IC.http_request_result;
  type HttpHeader = IC.http_header;
  
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
