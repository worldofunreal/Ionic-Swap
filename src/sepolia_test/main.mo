import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Blob "mo:base/Blob";
import Error "mo:base/Error";
import IC "ic:aaaaa-aa";

actor {
  
  // ============================================================================
  // CONSTANTS
  // ============================================================================
  
  // Sepolia configuration
  let SEPOLIA_CHAIN_ID : Nat = 11155111;
  let FACTORY_ADDRESS : Text = "0xBe953413e9FAB2642625D4043e4dcc0D16d14e77";
  let ICP_SIGNER_ADDRESS : Text = "0x6a3Ff928a09D21d82B27e9B002BBAea7fc123A00";
  
  // HTTP cycles for JSON-RPC calls
  let HTTP_CYCLES : Nat = 230_949_972_000; // Same as main canister
  
  // Function selectors for your contract
  let ICP_NETWORK_SIGNER_SELECTOR : Text = "0x2a92b710"; // icpNetworkSigner()
  let CLAIM_FEE_SELECTOR : Text = "0x99d32fc4"; // claimFee()
  let REFUND_FEE_SELECTOR : Text = "0x90fe6ddb"; // refundFee()
  let TOTAL_FEES_SELECTOR : Text = "0x60c6d8ae"; // totalFeesCollected()
  
  // ============================================================================
  // HTTP TYPES
  // ============================================================================
  
  type HttpRequestArgs = IC.http_request_args;
  type HttpResponseResult = IC.http_request_result;
  type HttpHeader = IC.http_header;
  
  // ============================================================================
  // HTTP HELPER FUNCTIONS
  // ============================================================================
  
  public query func transform({
    context : Blob;
    response : HttpResponseResult;
  }) : async HttpResponseResult {
    {
      response with headers = []; // Remove headers to avoid consensus issues
    };
  };
  
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
  // JSON-RPC METHODS
  // ============================================================================
  
  /// Make a JSON-RPC call to Sepolia via Infura
  private func makeJsonRpcCall(method : Text, params : Text) : async Result.Result<Text, Text> {
    let url = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";
    let json_request = "{\"jsonrpc\":\"2.0\",\"method\":\"" # method # "\",\"params\":" # params # ",\"id\":1}";
    
    let request_headers = [
      { name = "Content-Type"; value = "application/json" },
      { name = "User-Agent"; value = "ionic-swap-sepolia-test" },
    ];
    
    let http_request = createHttpRequest(url, "POST", ?json_request, request_headers);
    
    try {
      Cycles.add<system>(HTTP_CYCLES);
      let http_response = await IC.http_request(http_request);
      
      switch (decodeHttpResponse(http_response)) {
        case (#ok(response_text)) { #ok(response_text) };
        case (#err(error)) { #err("Failed to decode response: " # error) };
      };
    } catch (error) {
      #err("HTTP request failed: " # Error.message(error));
    };
  };
  
  /// Get latest block number from Sepolia
  public func get_sepolia_block_number() : async Result.Result<Text, Text> {
    await makeJsonRpcCall("eth_blockNumber", "[]");
  };
  
  /// Get transaction receipt from Sepolia
  public func get_transaction_receipt(tx_hash : Text) : async Result.Result<Text, Text> {
    await makeJsonRpcCall("eth_getTransactionReceipt", "[\"" # tx_hash # "\"]");
  };
  
  /// Get balance of an address on Sepolia
  public func get_balance(address : Text) : async Result.Result<Text, Text> {
    await makeJsonRpcCall("eth_getBalance", "[\"" # address # "\", \"latest\"]");
  };
  
  // ============================================================================
  // CONTRACT INTERACTION METHODS
  // ============================================================================
  
  /// Call icpNetworkSigner() on your factory contract
  public func get_icp_network_signer() : async Result.Result<Text, Text> {
    let params = "[{\"to\":\"" # FACTORY_ADDRESS # "\",\"data\":\"" # ICP_NETWORK_SIGNER_SELECTOR # "\"}, \"latest\"]";
    await makeJsonRpcCall("eth_call", params);
  };
  
  /// Call claimFee() on your factory contract
  public func get_claim_fee() : async Result.Result<Text, Text> {
    let params = "[{\"to\":\"" # FACTORY_ADDRESS # "\",\"data\":\"" # CLAIM_FEE_SELECTOR # "\"}, \"latest\"]";
    await makeJsonRpcCall("eth_call", params);
  };
  
  /// Call refundFee() on your factory contract
  public func get_refund_fee() : async Result.Result<Text, Text> {
    let params = "[{\"to\":\"" # FACTORY_ADDRESS # "\",\"data\":\"" # REFUND_FEE_SELECTOR # "\"}, \"latest\"]";
    await makeJsonRpcCall("eth_call", params);
  };
  
  /// Call totalFeesCollected() on your factory contract
  public func get_total_fees() : async Result.Result<Text, Text> {
    let params = "[{\"to\":\"" # FACTORY_ADDRESS # "\",\"data\":\"" # TOTAL_FEES_SELECTOR # "\"}, \"latest\"]";
    await makeJsonRpcCall("eth_call", params);
  };
  
  // ============================================================================
  // TESTING METHODS
  // ============================================================================
  
  /// Test all contract functions
  public func test_all_contract_functions() : async Result.Result<Text, Text> {
    var result = "=== Sepolia Contract Test Results ===\n";
    
    // Test ICP Network Signer
    switch (await get_icp_network_signer()) {
      case (#ok(response)) { result := result # "✅ ICP Network Signer: " # response # "\n"; };
      case (#err(error)) { result := result # "❌ ICP Network Signer: " # error # "\n"; };
    };
    
    // Test Claim Fee
    switch (await get_claim_fee()) {
      case (#ok(response)) { result := result # "✅ Claim Fee: " # response # "\n"; };
      case (#err(error)) { result := result # "❌ Claim Fee: " # error # "\n"; };
    };
    
    // Test Refund Fee
    switch (await get_refund_fee()) {
      case (#ok(response)) { result := result # "✅ Refund Fee: " # response # "\n"; };
      case (#err(error)) { result := result # "❌ Refund Fee: " # error # "\n"; };
    };
    
    // Test Total Fees
    switch (await get_total_fees()) {
      case (#ok(response)) { result := result # "✅ Total Fees: " # response # "\n"; };
      case (#err(error)) { result := result # "❌ Total Fees: " # error # "\n"; };
    };
    
    #ok(result);
  };
  
  /// Test basic RPC functionality
  public func test_basic_rpc() : async Result.Result<Text, Text> {
    var result = "=== Basic RPC Test Results ===\n";
    
    // Test block number
    switch (await get_sepolia_block_number()) {
      case (#ok(block_number)) { result := result # "✅ Latest Block: " # block_number # "\n"; };
      case (#err(error)) { result := result # "❌ Block Number: " # error # "\n"; };
    };
    
    // Test balance
    switch (await get_balance(ICP_SIGNER_ADDRESS)) {
      case (#ok(balance)) { result := result # "✅ ICP Signer Balance: " # balance # "\n"; };
      case (#err(error)) { result := result # "❌ Balance: " # error # "\n"; };
    };
    
    #ok(result);
  };
  
  /// Test your deployment transaction
  public func test_deployment_transaction() : async Result.Result<Text, Text> {
    let deployment_tx = "0x632b719a0b30557774ad8e4a7025ccb75497bf38818cd16c9263c03b641c7338";
    
    switch (await get_transaction_receipt(deployment_tx)) {
      case (#ok(receipt)) {
        #ok("✅ Deployment Transaction Receipt:\n" # receipt);
      };
      case (#err(error)) {
        #err("❌ Failed to get deployment receipt: " # error);
      };
    };
  };
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
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
  
  /// Get contract information
  public query func get_contract_info() : async Text {
    "Factory Address: " # FACTORY_ADDRESS # "\n" #
    "ICP Signer: " # ICP_SIGNER_ADDRESS # "\n" #
    "Chain ID: " # Nat.toText(SEPOLIA_CHAIN_ID);
  };
}; 