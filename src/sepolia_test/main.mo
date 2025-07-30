import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Result "mo:base/Result";

// EVM RPC Integration
import EvmRpc "canister:evm_rpc";

actor {
  
  // ============================================================================
  // CONSTANTS
  // ============================================================================
  
  // Sepolia configuration
  let SEPOLIA_CHAIN_ID : Nat = 11155111;
  let FACTORY_ADDRESS : Text = "0xBe953413e9FAB2642625D4043e4dcc0D16d14e77";
  let ICP_SIGNER_ADDRESS : Text = "0x6a3Ff928a09D21D82B27e9B002BBAea7fc123A00";
  
  // EVM RPC cycles
  let EVM_RPC_CYCLES : Nat = 2_000_000_000; // 2B cycles for RPC calls
  
  // Function selectors for your contract
  let ICP_NETWORK_SIGNER_SELECTOR : Text = "0x2a92b710"; // icpNetworkSigner()
  let CLAIM_FEE_SELECTOR : Text = "0x99d32fc4"; // claimFee()
  let REFUND_FEE_SELECTOR : Text = "0x90fe6ddb"; // refundFee()
  let TOTAL_FEES_SELECTOR : Text = "0x60c6d8ae"; // totalFeesCollected()
  
  // ============================================================================
  // EVM RPC METHODS
  // ============================================================================
  
  /// Get latest block number from Sepolia using custom Infura RPC
  public func get_sepolia_block_number() : async Result.Result<Text, Text> {
    let json_request = "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}";
    
    let result = await (with cycles = EVM_RPC_CYCLES) EvmRpc.request(
      #Custom({
        url = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";
        headers = null;
      }),
      json_request,
      10000
    );
    
    switch (result) {
      case (#Ok response) {
        #ok("Block Number Response: " # response);
      };
      case (#Err error) {
        #err("RPC error: " # debug_show(error));
      };
    };
  };
  
  /// Get transaction receipt from Sepolia
  public func get_transaction_receipt(tx_hash : Text) : async Result.Result<Text, Text> {
    let result = await (with cycles = EVM_RPC_CYCLES) EvmRpc.eth_getTransactionReceipt(#EthSepolia(?[#Alchemy]), null, tx_hash);
    
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
  
  /// Get balance of an address on Sepolia (using eth_call to a dummy contract)
  public func get_balance(_address : Text) : async Result.Result<Text, Text> {
    // Note: EVM RPC canister doesn't have eth_getBalance
    // We'll use eth_call to get the balance instead
    // For native ETH balance, we need to use a different approach
    #err("eth_getBalance not available in EVM RPC canister. Use eth_call for contract balances instead.");
  };
  
  // ============================================================================
  // CONTRACT INTERACTION METHODS
  // ============================================================================
  
  /// Call icpNetworkSigner() on your factory contract using custom Infura RPC
  public func get_icp_network_signer() : async Result.Result<Text, Text> {
    let json_request = "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"" # FACTORY_ADDRESS # "\",\"data\":\"" # ICP_NETWORK_SIGNER_SELECTOR # "\"}, \"latest\"],\"id\":1}";
    
    let result = await (with cycles = EVM_RPC_CYCLES) EvmRpc.request(
      #Custom({
        url = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";
        headers = null;
      }),
      json_request,
      10000
    );
    
    switch (result) {
      case (#Ok response) {
        #ok("ICP Network Signer Response: " # response);
      };
      case (#Err error) {
        #err("RPC error: " # debug_show(error));
      };
    };
  };
  
  /// Call claimFee() on your factory contract using custom Infura RPC
  public func get_claim_fee() : async Result.Result<Text, Text> {
    let json_request = "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"" # FACTORY_ADDRESS # "\",\"data\":\"" # CLAIM_FEE_SELECTOR # "\"}, \"latest\"],\"id\":1}";
    
    let result = await (with cycles = EVM_RPC_CYCLES) EvmRpc.request(
      #Custom({
        url = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";
        headers = null;
      }),
      json_request,
      10000
    );
    
    switch (result) {
      case (#Ok response) {
        #ok("Claim Fee Response: " # response);
      };
      case (#Err error) {
        #err("RPC error: " # debug_show(error));
      };
    };
  };
  
  /// Call refundFee() on your factory contract using custom Infura RPC
  public func get_refund_fee() : async Result.Result<Text, Text> {
    let json_request = "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"" # FACTORY_ADDRESS # "\",\"data\":\"" # REFUND_FEE_SELECTOR # "\"}, \"latest\"],\"id\":1}";
    
    let result = await (with cycles = EVM_RPC_CYCLES) EvmRpc.request(
      #Custom({
        url = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";
        headers = null;
      }),
      json_request,
      10000
    );
    
    switch (result) {
      case (#Ok response) {
        #ok("Refund Fee Response: " # response);
      };
      case (#Err error) {
        #err("RPC error: " # debug_show(error));
      };
    };
  };
  
  /// Call totalFeesCollected() on your factory contract using custom Infura RPC
  public func get_total_fees() : async Result.Result<Text, Text> {
    let json_request = "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"" # FACTORY_ADDRESS # "\",\"data\":\"" # TOTAL_FEES_SELECTOR # "\"}, \"latest\"],\"id\":1}";
    
    let result = await (with cycles = EVM_RPC_CYCLES) EvmRpc.request(
      #Custom({
        url = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";
        headers = null;
      }),
      json_request,
      10000
    );
    
    switch (result) {
      case (#Ok response) {
        #ok("Total Fees Response: " # response);
      };
      case (#Err error) {
        #err("RPC error: " # debug_show(error));
      };
    };
  };
  
  // ============================================================================
  // TESTING METHODS
  // ============================================================================
  
  /// Test all contract functions
  public func test_all_contract_functions() : async Result.Result<Text, Text> {
    var result = "=== Sepolia Contract Test Results ===\n";
    
    // Test ICP Network Signer
    switch (await get_icp_network_signer()) {
      case (#ok(response)) { result := result # "✅ " # response # "\n"; };
      case (#err(error)) { result := result # "❌ ICP Network Signer: " # error # "\n"; };
    };
    
    // Test Claim Fee
    switch (await get_claim_fee()) {
      case (#ok(response)) { result := result # "✅ " # response # "\n"; };
      case (#err(error)) { result := result # "❌ Claim Fee: " # error # "\n"; };
    };
    
    // Test Refund Fee
    switch (await get_refund_fee()) {
      case (#ok(response)) { result := result # "✅ " # response # "\n"; };
      case (#err(error)) { result := result # "❌ Refund Fee: " # error # "\n"; };
    };
    
    // Test Total Fees
    switch (await get_total_fees()) {
      case (#ok(response)) { result := result # "✅ " # response # "\n"; };
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
    
    // Note: eth_getBalance not available in EVM RPC canister
    result := result # "ℹ️  Balance checks not available (eth_getBalance not supported)\n";
    
    #ok(result);
  };
  
  /// Test your deployment transaction
  public func test_deployment_transaction() : async Result.Result<Text, Text> {
    let deployment_tx = "0x7b4752abc5cb9421d6c0f991d81f4c9d7af84f49c0fb9a3b07a8a0940131ef17";
    
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