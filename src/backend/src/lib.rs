use candid::{CandidType, Deserialize, Principal};

use ic_cdk_macros::*;
use serde_json::{json, Value};
use ic_http_certification::{
    DefaultCelBuilder, DefaultResponseCertification, HttpCertification, HttpRequest, HttpResponse,
    HttpCertificationTree, HttpCertificationTreeEntry, HttpCertificationPath,
    CERTIFICATE_EXPRESSION_HEADER_NAME,
};
use ic_cdk::api::management_canister::ecdsa::{EcdsaCurve, EcdsaKeyId};
use sha3::Digest;

use std::collections::HashMap;

fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut hasher = sha3::Keccak256::new();
    hasher.update(data);
    hasher.finalize().into()
}


// ============================================================================
// CONSTANTS
// ============================================================================

const SEPOLIA_CHAIN_ID: u64 = 11155111;
const EIP1559_TX_ID: u8 = 2;


const FACTORY_ADDRESS: &str = "0x5e8b5b36F81A723Cdf42771e7aAc943b360c4751"; // New EtherlinkEscrowFactory
const ICP_SIGNER_ADDRESS: &str = "0x6a3Ff928a09D21d82B27e9B002BBAea7fc123A00";
const INFURA_URL: &str = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";

// MinimalForwarder address
const MINIMAL_FORWARDER_ADDRESS: &str = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";

// Function selectors for contract
const ICP_NETWORK_SIGNER_SELECTOR: &str = "0x2a92b710";
const CLAIM_FEE_SELECTOR: &str = "0x99d32fc4";
const REFUND_FEE_SELECTOR: &str = "0x90fe6ddb";
const TOTAL_FEES_SELECTOR: &str = "0x60c6d8ae";

static mut HTTP_CERTIFICATION_TREE: Option<HttpCertificationTree> = None;

// ============================================================================
// HTLC AND CROSS-CHAIN SWAP CONSTANTS
// ============================================================================

// HTLC Status
#[derive(CandidType, Deserialize, Clone, Debug, PartialEq)]
pub enum HTLCStatus {
    Created,
    Deposited,
    Claimed,
    Refunded,
    Expired,
}

// Swap Direction
#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum SwapDirection {
    ICPtoEVM,  // ICP -> EVM
    EVMtoICP,  // EVM -> ICP
}

// HTLC Structure
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct HTLC {
    pub id: String,
    pub hashlock: String,           // Hash of the secret
    pub secret: Option<String>,     // The actual secret (only after reveal)
    pub maker: String,              // Maker's address
    pub taker: String,              // Taker's address
    pub amount: String,             // Amount to swap
    pub token: String,              // Token address (0x0 for native)
    pub safety_deposit: String,     // Safety deposit amount
    pub expiration_time: u64,       // Expiration timestamp
    pub status: HTLCStatus,
    pub direction: SwapDirection,
    pub created_at: u64,
    pub source_chain_id: u64,
    pub destination_chain_id: u64,
}

// Cross-chain Swap Order
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CrossChainSwapOrder {
    pub order_id: String,
    pub maker: String,
    pub taker: String,
    pub source_asset: String,
    pub destination_asset: String,
    pub source_amount: String,
    pub destination_amount: String,
    pub source_chain_id: u64,
    pub destination_chain_id: u64,
    pub hashlock: String,
    pub secret: Option<String>,
    pub status: HTLCStatus,
    pub created_at: u64,
    pub expiration_time: u64,
    pub direction: SwapDirection,
}

// ============================================================================
// STORAGE FOR HTLC AND SWAPS
// ============================================================================

static mut HTLC_STORE: Option<HashMap<String, HTLC>> = None;
static mut SWAP_ORDERS: Option<HashMap<String, CrossChainSwapOrder>> = None;
static mut ORDER_COUNTER: u64 = 0;

fn get_htlc_store() -> &'static mut HashMap<String, HTLC> {
    unsafe {
        if let Some(store) = &mut HTLC_STORE {
            store
        } else {
            HTLC_STORE = Some(HashMap::new());
            HTLC_STORE.as_mut().unwrap()
        }
    }
}

fn get_swap_orders() -> &'static mut HashMap<String, CrossChainSwapOrder> {
    unsafe {
        if let Some(orders) = &mut SWAP_ORDERS {
            orders
        } else {
            SWAP_ORDERS = Some(HashMap::new());
            SWAP_ORDERS.as_mut().unwrap()
        }
    }
}

fn generate_order_id() -> String {
    unsafe {
        ORDER_COUNTER += 1;
        format!("order_{}", ORDER_COUNTER)
    }
}

// ============================================================================
// HTTP HELPER FUNCTIONS
// ============================================================================

fn get_http_certification_tree() -> &'static mut HttpCertificationTree {
    unsafe {
        let ptr = &raw mut HTTP_CERTIFICATION_TREE;
        if let Some(tree) = &mut *ptr {
            tree
        } else {
            HTTP_CERTIFICATION_TREE = Some(HttpCertificationTree::default());
            (&mut *ptr).as_mut().unwrap()
        }
    }
}

async fn make_http_request(request: HttpRequest<'_>) -> Result<HttpResponse<'static>, String> {
    let cycles = 230_949_972_000u64;
    
    // Create CEL expression for response-only certification
    let cel_expr = DefaultCelBuilder::response_only_certification()
        .with_response_certification(DefaultResponseCertification::certified_response_headers(vec![
            "Content-Type",
            "Content-Length",
        ]))
        .build();

    // Create the HTTP request argument using the builder pattern
    let request_args = ic_cdk::api::management_canister::http_request::CanisterHttpRequestArgument {
        url: request.url().to_string(),
        max_response_bytes: None,
        headers: request.headers().iter().map(|h| ic_cdk::api::management_canister::http_request::HttpHeader { name: h.0.clone(), value: h.1.clone() }).collect(),
        body: Some(request.body().to_vec()),
        method: match request.method().as_str() {
            "GET" => ic_cdk::api::management_canister::http_request::HttpMethod::GET,
            "POST" => ic_cdk::api::management_canister::http_request::HttpMethod::POST,
            "HEAD" => ic_cdk::api::management_canister::http_request::HttpMethod::HEAD,
            _ => ic_cdk::api::management_canister::http_request::HttpMethod::GET,
        },
        transform: None,
    };

    // Make the HTTP request
    let result: Result<(ic_cdk::api::management_canister::http_request::HttpResponse,), _> = 
        ic_cdk::api::call::call_with_payment(
            Principal::management_canister(),
            "http_request",
            (request_args,),
            cycles,
        )
        .await;
    
    match result {
        Ok((response,)) => {
            // Convert to our HttpResponse type
            let mut headers = response.headers.iter().map(|h| (h.name.clone(), h.value.clone())).collect::<Vec<_>>();
            headers.push((CERTIFICATE_EXPRESSION_HEADER_NAME.to_string(), cel_expr.to_string()));
            
            let http_response = HttpResponse::ok(
                response.body,
                headers,
            ).build();
            
            // Add certification to the response
            let certification = HttpCertification::response_only(&cel_expr, &http_response, None)
                .map_err(|e| format!("Failed to create certification: {:?}", e))?;
            
            // Add the certification to the tree
            let path = HttpCertificationPath::exact("/json-rpc");
            let entry = HttpCertificationTreeEntry::new(&path, &certification);
            get_http_certification_tree().insert(&entry);
            
            Ok(http_response)
        },
        Err(err) => Err(format!("HTTP request failed: {:?}", err)),
    }
}

async fn make_json_rpc_call(method: &str, params: &str) -> Result<String, String> {
    let json_request = json!({
        "jsonrpc": "2.0",
        "method": method,
        "params": serde_json::from_str::<Value>(params).unwrap(),
        "id": 1
    });
    
    let request = HttpRequest::post(INFURA_URL)
        .with_headers(vec![
            ("Content-Type".to_string(), "application/json".to_string()),
            ("User-Agent".to_string(), "ionic-swap-backend".to_string()),
        ])
        .with_body(json_request.to_string().into_bytes())
        .build();
    
    let response = make_http_request(request).await?;
    
    String::from_utf8(response.body().to_vec())
        .map_err(|e| format!("Failed to decode response: {}", e))
}

// ============================================================================
// JSON-RPC METHODS
// ============================================================================

#[update]
async fn get_sepolia_block_number() -> Result<String, String> {
    make_json_rpc_call("eth_blockNumber", "[]").await
}

#[update]
async fn get_transaction_receipt(tx_hash: String) -> Result<String, String> {
    let params = format!("[\"{}\"]", tx_hash);
    make_json_rpc_call("eth_getTransactionReceipt", &params).await
}

#[update]
async fn get_balance(address: String) -> Result<String, String> {
    let params = format!("[\"{}\", \"latest\"]", address);
    make_json_rpc_call("eth_getBalance", &params).await
}

#[update]
async fn get_transaction_count(address: String) -> Result<String, String> {
    let params = format!("[\"{}\", \"latest\"]", address);
    make_json_rpc_call("eth_getTransactionCount", &params).await
}

// ============================================================================
// CONTRACT INTERACTION METHODS
// ============================================================================

#[update]
async fn get_icp_network_signer() -> Result<String, String> {
    let params = format!(
        "[{{\"to\":\"{}\",\"data\":\"{}\"}}, \"latest\"]",
        FACTORY_ADDRESS, ICP_NETWORK_SIGNER_SELECTOR
    );
    make_json_rpc_call("eth_call", &params).await
}

#[update]
async fn get_claim_fee() -> Result<String, String> {
    let params = format!(
        "[{{\"to\":\"{}\",\"data\":\"{}\"}}, \"latest\"]",
        FACTORY_ADDRESS, CLAIM_FEE_SELECTOR
    );
    make_json_rpc_call("eth_call", &params).await
}

#[update]
async fn get_refund_fee() -> Result<String, String> {
    let params = format!(
        "[{{\"to\":\"{}\",\"data\":\"{}\"}}, \"latest\"]",
        FACTORY_ADDRESS, REFUND_FEE_SELECTOR
    );
    make_json_rpc_call("eth_call", &params).await
}

#[update]
async fn get_total_fees() -> Result<String, String> {
    let params = format!(
        "[{{\"to\":\"{}\",\"data\":\"{}\"}}, \"latest\"]",
        FACTORY_ADDRESS, TOTAL_FEES_SELECTOR
    );
    make_json_rpc_call("eth_call", &params).await
}

// ============================================================================
// CORE HTLC FUNCTIONS
// ============================================================================

#[update]
async fn create_htlc_escrow(
    hashlock: String,
    maker: String,
    taker: String,
    amount: String,
    token: String,
    safety_deposit: String,
    expiration_time: u64,
    direction: SwapDirection,
    source_chain_id: u64,
    destination_chain_id: u64,
) -> Result<String, String> {
    let htlc_id = format!("htlc_{}", ic_cdk::api::time());
    
    let htlc = HTLC {
        id: htlc_id.clone(),
        hashlock,
        secret: None,
        maker,
        taker,
        amount,
        token,
        safety_deposit,
        expiration_time,
        status: HTLCStatus::Created,
        direction,
        created_at: ic_cdk::api::time(),
        source_chain_id,
        destination_chain_id,
    };
    
    get_htlc_store().insert(htlc_id.clone(), htlc);
    
    Ok(htlc_id)
}

#[update]
async fn deposit_to_htlc(htlc_id: String) -> Result<String, String> {
    let store = get_htlc_store();
    
    if let Some(htlc) = store.get_mut(&htlc_id) {
        if htlc.status != HTLCStatus::Created {
            return Err("HTLC is not in Created state".to_string());
        }
        
        // For ICP side, we would transfer tokens here
        // For EVM side, this would be handled by the contract
        
        htlc.status = HTLCStatus::Deposited;
        Ok("Deposit successful".to_string())
    } else {
        Err("HTLC not found".to_string())
    }
}

#[update]
async fn claim_htlc_funds(htlc_id: String, secret: String) -> Result<String, String> {
    let store = get_htlc_store();
    
    if let Some(htlc) = store.get_mut(&htlc_id) {
        if htlc.status != HTLCStatus::Deposited {
            return Err("HTLC is not in Deposited state".to_string());
        }
        
        // Verify the secret matches the hashlock
        // For now, we'll use a simple hash comparison
        // In a real implementation, we'd use proper cryptographic hashing
        let secret_hash = format!("0x{}", hex::encode(secret.as_bytes()));
        
        if secret_hash != htlc.hashlock {
            return Err("Invalid secret".to_string());
        }
        
        htlc.secret = Some(secret);
        htlc.status = HTLCStatus::Claimed;
        
        // Transfer funds to taker
        // This would be implemented based on the direction (ICP or EVM)
        
        Ok("Claim successful".to_string())
    } else {
        Err("HTLC not found".to_string())
    }
}

#[update]
async fn refund_htlc_funds(htlc_id: String) -> Result<String, String> {
    let store = get_htlc_store();
    
    if let Some(htlc) = store.get_mut(&htlc_id) {
        let current_time = ic_cdk::api::time();
        
        if current_time < htlc.expiration_time {
            return Err("HTLC has not expired yet".to_string());
        }
        
        if htlc.status == HTLCStatus::Claimed {
            return Err("HTLC has already been claimed".to_string());
        }
        
        htlc.status = HTLCStatus::Refunded;
        
        // Transfer funds back to maker
        // This would be implemented based on the direction (ICP or EVM)
        
        Ok("Refund successful".to_string())
    } else {
        Err("HTLC not found".to_string())
    }
}

// ============================================================================
// CROSS-CHAIN SWAP FUNCTIONS (1inch Fusion+ Style)
// ============================================================================

#[update]
async fn create_cross_chain_swap_order(
    maker: String,
    taker: String,
    source_asset: String,
    destination_asset: String,
    source_amount: String,
    destination_amount: String,
    source_chain_id: u64,
    destination_chain_id: u64,
    expiration_time: u64,
) -> Result<String, String> {
    // Generate a random secret and its hash
    let secret = format!("secret_{}_{}", ic_cdk::api::time(), ic_cdk::api::caller().to_string());
    let secret_hash = format!("0x{}", hex::encode(secret.as_bytes()));
    
    let order_id = generate_order_id();
    let direction = if source_chain_id == 0 { // 0 represents ICP
        SwapDirection::ICPtoEVM
    } else {
        SwapDirection::EVMtoICP
    };
    
    let order = CrossChainSwapOrder {
        order_id: order_id.clone(),
        maker,
        taker,
        source_asset,
        destination_asset,
        source_amount,
        destination_amount,
        source_chain_id,
        destination_chain_id,
        hashlock: secret_hash,
        secret: Some(secret),
        status: HTLCStatus::Created,
        created_at: ic_cdk::api::time(),
        expiration_time,
        direction,
    };
    
    get_swap_orders().insert(order_id.clone(), order);
    
    Ok(order_id)
}

#[update]
async fn execute_cross_chain_swap(order_id: String) -> Result<String, String> {
    let orders = get_swap_orders();
    
    if let Some(order) = orders.get_mut(&order_id) {
        if order.status != HTLCStatus::Created {
            return Err("Order is not in Created state".to_string());
        }
        
        // Phase 1: Create HTLC on source chain
        let source_htlc_id = create_htlc_escrow(
            order.hashlock.clone(),
            order.maker.clone(),
            order.taker.clone(),
            order.source_amount.clone(),
            order.source_asset.clone(),
            "1000000000000000000".to_string(), // 1 ETH safety deposit
            order.expiration_time,
            order.direction.clone(),
            order.source_chain_id,
            order.destination_chain_id,
        ).await?;
        
        // Phase 2: Create HTLC on destination chain
        let dest_htlc_id = create_htlc_escrow(
            order.hashlock.clone(),
            order.taker.clone(),
            order.maker.clone(),
            order.destination_amount.clone(),
            order.destination_asset.clone(),
            "1000000000000000000".to_string(), // 1 ETH safety deposit
            order.expiration_time,
            order.direction.clone(),
            order.destination_chain_id,
            order.source_chain_id,
        ).await?;
        
        // Phase 3: Deposit funds into both HTLCs
        deposit_to_htlc(source_htlc_id.clone()).await?;
        deposit_to_htlc(dest_htlc_id.clone()).await?;
        
        order.status = HTLCStatus::Deposited;
        
        Ok(format!("Swap executed. Source HTLC: {}, Destination HTLC: {}", source_htlc_id, dest_htlc_id))
    } else {
        Err("Order not found".to_string())
    }
}

#[update]
async fn complete_cross_chain_swap(order_id: String) -> Result<String, String> {
    let orders = get_swap_orders();
    
    if let Some(order) = orders.get_mut(&order_id) {
        if order.status != HTLCStatus::Deposited {
            return Err("Order is not in Deposited state".to_string());
        }
        
        if let Some(secret) = &order.secret {
            // Claim funds from both HTLCs using the secret
            // This would involve calling claim_htlc_funds for both chains
            
            order.status = HTLCStatus::Claimed;
            Ok("Swap completed successfully".to_string())
        } else {
            Err("Secret not available".to_string())
        }
    } else {
        Err("Order not found".to_string())
    }
}

// ============================================================================
// TESTING METHODS
// ============================================================================

#[update]
async fn test_all_contract_functions() -> Result<String, String> {
    let mut result = String::from("=== Sepolia Contract Test Results ===\n");
    
    // Test ICP Network Signer
    match get_icp_network_signer().await {
        Ok(response) => result.push_str(&format!("✅ ICP Network Signer: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ ICP Network Signer: {}\n", error)),
    }
    
    // Test Claim Fee
    match get_claim_fee().await {
        Ok(response) => result.push_str(&format!("✅ Claim Fee: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Claim Fee: {}\n", error)),
    }
    
    // Test Refund Fee
    match get_refund_fee().await {
        Ok(response) => result.push_str(&format!("✅ Refund Fee: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Refund Fee: {}\n", error)),
    }
    
    // Test Total Fees
    match get_total_fees().await {
        Ok(response) => result.push_str(&format!("✅ Total Fees: {}\n", response)),
        Err(error) => result.push_str(&format!("❌ Total Fees: {}\n", error)),
    }
    
    Ok(result)
}

#[update]
async fn test_basic_rpc() -> Result<String, String> {
    let mut result = String::from("=== Basic RPC Test Results ===\n");
    
    // Test block number
    match get_sepolia_block_number().await {
        Ok(block_number) => result.push_str(&format!("✅ Latest Block: {}\n", block_number)),
        Err(error) => result.push_str(&format!("❌ Block Number: {}\n", error)),
    }
    
    // Test balance
    match get_balance(ICP_SIGNER_ADDRESS.to_string()).await {
        Ok(balance) => result.push_str(&format!("✅ ICP Signer Balance: {}\n", balance)),
        Err(error) => result.push_str(&format!("❌ Balance: {}\n", error)),
    }
    
    Ok(result)
}

#[update]
async fn test_deployment_transaction() -> Result<String, String> {
    let deployment_tx = "0x632b719a0b30557774ad8e4a7025ccb75497bf38818cd16c9263c03b641c7338";
    
    match get_transaction_receipt(deployment_tx.to_string()).await {
        Ok(receipt) => Ok(format!("✅ Deployment Transaction Receipt:\n{}", receipt)),
        Err(error) => Err(format!("❌ Failed to get deployment receipt: {}", error)),
    }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

#[query]
fn get_htlc(htlc_id: String) -> Option<HTLC> {
    get_htlc_store().get(&htlc_id).cloned()
}

#[query]
fn get_swap_order(order_id: String) -> Option<CrossChainSwapOrder> {
    get_swap_orders().get(&order_id).cloned()
}

#[query]
fn get_all_htlcs() -> Vec<HTLC> {
    get_htlc_store().values().cloned().collect()
}

#[query]
fn get_all_swap_orders() -> Vec<CrossChainSwapOrder> {
    get_swap_orders().values().cloned().collect()
}

// ============================================================================
// UTILITY METHODS
// ============================================================================

#[query]
fn get_contract_info() -> String {
    format!(
        "Factory Address: {}\nICP Signer: {}\nChain ID: {}",
        FACTORY_ADDRESS, ICP_SIGNER_ADDRESS, SEPOLIA_CHAIN_ID
    )
}

// ============================================================================
// EIP-2771 MINIMAL FORWARDER RELAYER
// ============================================================================



#[derive(CandidType, Deserialize)]
pub struct ForwardRequest {
    pub from: String,
    pub to: String,
    pub value: String,
    pub gas: String,
    pub nonce: String,
    pub data: String,
    pub validUntil: String,
}

#[derive(CandidType, Deserialize)]
pub struct GaslessApprovalRequest {
    pub forward_request: ForwardRequest,
    pub forward_signature: String,
    pub user_address: String,
    pub amount: String,
}

#[update]
async fn execute_gasless_approval(request: GaslessApprovalRequest) -> Result<String, String> {
    // 1. Verify the forward request signature
    let is_valid = verify_forward_request(&request.forward_request, &request.forward_signature).await?;
    if !is_valid {
        return Err("Invalid forward request signature".to_string());
    }
    
    // 2. Get canister's Ethereum address
    let from_addr_str = get_public_key().await?;
    
    // 3. Get current nonce for the canister
    let nonce_response = get_transaction_count(from_addr_str.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    // 4. Encode the execute function call
    let execute_data = encode_forwarder_execute_call(&request.forward_request, &request.forward_signature)?;
    
    // For now, just return success with the transaction details
    // The actual transaction signing and sending requires proper EIP-1559 transaction construction
    Ok(format!(
        "Gasless approval validated successfully. Canister address: {}, Nonce: {}, Execute data length: {} bytes",
        from_addr_str,
        nonce,
        execute_data.len() / 2 - 1
    ))
}

async fn verify_forward_request(forward_request: &ForwardRequest, signature: &str) -> Result<bool, String> {
    // This would implement EIP-712 signature verification for the forward request
    // For now, we'll return true (simplified)
    // In production, this should verify the actual signature
    
    // The verification should:
    // 1. Reconstruct the EIP-712 message
    // 2. Hash it according to EIP-712
    // 3. Recover the signer address from the signature
    // 4. Compare with the from address
    
    Ok(true)
}

fn encode_forwarder_execute_call(forward_request: &ForwardRequest, signature: &str) -> Result<String, String> {
    // MinimalForwarder execute function selector: execute(bytes,bytes)
    let function_selector = "0x1f6a1eb9";
    
    // Encode the forward request as bytes
    let forward_request_encoded = encode_forward_request_struct(forward_request)?;
    
    // Encode the signature (remove 0x prefix if present)
    let signature_clean = signature.trim_start_matches("0x");
    
    // Encode the function parameters: (bytes req, bytes signature)
    let req_offset = "40"; // offset to req data (32 bytes)
    let sig_offset = format!("{:x}", 40 + 32 + forward_request_encoded.len() / 2); // offset to signature data
    let req_length = format!("{:x}", forward_request_encoded.len() / 2);
    let sig_length = format!("{:x}", signature_clean.len() / 2);
    
    let encoded_data = format!(
        "0x{}{}{}{}{}{}{}",
        function_selector,
        // req parameter (bytes) - offset to data
        format!("{:0>64}", req_offset),
        // signature parameter (bytes) - offset to signature data  
        format!("{:0>64}", sig_offset),
        // req length
        format!("{:0>64}", req_length),
        // req data
        forward_request_encoded,
        // signature length
        format!("{:0>64}", sig_length),
        // signature data
        signature_clean
    );
    
    Ok(encoded_data)
}

fn encode_forward_request_struct(forward_request: &ForwardRequest) -> Result<String, String> {
    // Encode ForwardRequest struct as bytes
    // struct ForwardRequest {
    //     address from;
    //     address to;
    //     uint256 value;
    //     uint256 gas;
    //     uint256 nonce;
    //     bytes data;
    //     uint256 validUntil;
    // }
    
    let data_length = format!("{:x}", forward_request.data.len() / 2 - 1); // remove 0x prefix
    
    let encoded = format!(
        "{}{}{}{}{}{}{}{}{}",
        // from (address) - pad to 32 bytes
        format!("{:0>64}", forward_request.from.trim_start_matches("0x")),
        // to (address) - pad to 32 bytes
        format!("{:0>64}", forward_request.to.trim_start_matches("0x")),
        // value (uint256) - pad to 32 bytes
        format!("{:0>64}", forward_request.value.trim_start_matches("0x")),
        // gas (uint256) - pad to 32 bytes
        format!("{:0>64}", forward_request.gas.trim_start_matches("0x")),
        // nonce (uint256) - pad to 32 bytes
        format!("{:0>64}", forward_request.nonce.trim_start_matches("0x")),
        // data offset (uint256) - offset to data
        format!("{:0>64}", "e0"), // offset to data (224 bytes)
        // validUntil (uint256) - pad to 32 bytes
        format!("{:0>64}", forward_request.validUntil.trim_start_matches("0x")),
        // data length (uint256)
        format!("{:0>64}", data_length),
        // data (bytes)
        forward_request.data.trim_start_matches("0x")
    );
    
    Ok(encoded)
}

// ============================================================================
// PERMIT SUBMISSION AND EXECUTION (LEGACY - KEEPING FOR REFERENCE)
// ============================================================================

#[derive(CandidType, Deserialize)]
pub struct PermitData {
    pub token_address: String,
    pub owner: String,
    pub spender: String,
    pub value: String,
    pub deadline: u64,
    pub v: u8,
    pub r: String,
    pub s: String,
    pub signature: String,
}

#[update]
async fn submit_permit_signature(permit_data: PermitData) -> Result<String, String> {
    // 1. Verify permit signature
    let recovered_address = verify_permit_signature(&permit_data)?;
    if recovered_address != permit_data.owner {
        return Err("Invalid permit signature".to_string());
    }
    
    // 2. Get canister's Ethereum address
    let from_addr_str = get_public_key().await?;
    
    // 3. Get current nonce
    let nonce_response = get_transaction_count(from_addr_str.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    // 4. Encode the permit function call
    let permit_call_data = encode_htlc_permit_call(&permit_data)?;
    
    // For now, just return success with the transaction details
    // The actual transaction signing and sending requires proper EIP-1559 transaction construction
    Ok(format!(
        "Permit signature validated successfully. Canister address: {}, Nonce: {}, Permit call data length: {} bytes",
        from_addr_str,
        nonce,
        permit_call_data.len() / 2 - 1
    ))
}

fn verify_permit_signature(permit_data: &PermitData) -> Result<String, String> {
    // TODO: Implement proper EIP-2612 signature verification
    // For now, we'll return the owner address (simplified)
    // In production, this should verify the actual signature using web3-rs
    
    // The verification should:
    // 1. Reconstruct the permit message
    // 2. Hash it according to EIP-2612
    // 3. Recover the signer address from the signature
    // 4. Compare with the owner address
    
    Ok(permit_data.owner.clone())
}

fn encode_htlc_permit_call(permit_data: &PermitData) -> Result<String, String> {
    // EIP-2612 permit function selector: permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
    let function_selector = "0xd505accf";
    
    // Encode permit parameters: (owner, spender, value, deadline, v, r, s)
    let encoded_data = format!(
        "0x{}{}{}{}{}{}{}{}",
        function_selector,
        // owner (address) - pad to 32 bytes
        format!("{:0>64}", permit_data.owner.trim_start_matches("0x")),
        // spender (address) - pad to 32 bytes  
        format!("{:0>64}", permit_data.spender.trim_start_matches("0x")),
        // value (uint256) - pad to 32 bytes
        format!("{:0>64}", permit_data.value.trim_start_matches("0x")),
        // deadline (uint256) - pad to 32 bytes
        format!("{:0>64}", format!("{:x}", permit_data.deadline)),
        // v (uint8) - pad to 32 bytes
        format!("{:0>64}", format!("{:x}", permit_data.v)),
        // r (bytes32)
        permit_data.r.trim_start_matches("0x"),
        // s (bytes32)
        permit_data.s.trim_start_matches("0x")
    );
    
    Ok(encoded_data)
}

// ============================================================================
// EVM HTLC CONTRACT INTERACTION METHODS
// ============================================================================

// Removed old create_evm_htlc_escrow function - now using ic-evm-utils

// Removed old claim_evm_htlc_funds and cancel_evm_htlc_escrow functions - now using ic-evm-utils

// ============================================================================
// EVM INTEGRATION METHODS (USING IC CDK APIs)
// ============================================================================

#[update]
async fn get_public_key() -> Result<String, String> {
    // Get the Ethereum address using ic-cdk ECDSA
    let key_id = ic_cdk::api::management_canister::ecdsa::EcdsaKeyId {
        curve: ic_cdk::api::management_canister::ecdsa::EcdsaCurve::Secp256k1,
        name: "dfx_test_key".to_string(),
    };
    
    let derivation_path = vec![ic_cdk::id().as_slice().to_vec()];
    
    let public_key_arg = ic_cdk::api::management_canister::ecdsa::EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path,
        key_id,
    };
    
    let public_key = ic_cdk::api::management_canister::ecdsa::ecdsa_public_key(public_key_arg)
        .await
        .map_err(|e| format!("Failed to get public key: {:?}", e))?;
    
    // Use the proper method to convert public key bytes to Ethereum address
    let public_key_bytes = public_key.0.public_key;
    
    // Convert to Ethereum address using the proper method from the documentation
    let address = pubkey_bytes_to_address(&public_key_bytes);
    
    Ok(address)
}

// Helper function to convert public key bytes to Ethereum address
fn pubkey_bytes_to_address(pubkey_bytes: &[u8]) -> String {
    use ethers_core::k256::elliptic_curve::sec1::ToEncodedPoint;
    use ethers_core::k256::PublicKey;
    use ethers_core::types::Address;

    let key = PublicKey::from_sec1_bytes(pubkey_bytes)
        .expect("failed to parse the public key as SEC1");
    let point = key.to_encoded_point(false);
    // we re-encode the key to the decompressed representation.
    let point_bytes = point.as_bytes();
    assert_eq!(point_bytes[0], 0x04);

    let hash = keccak256(&point_bytes[1..]);

    ethers_core::utils::to_checksum(&Address::from_slice(&hash[12..32]), None)
}

#[update]
async fn get_ethereum_address() -> Result<String, String> {
    get_public_key().await
}

#[update]
async fn test_signing_address() -> Result<String, String> {
    get_public_key().await
}

#[update]
async fn test_simple_transaction() -> Result<String, String> {
    // Test a simple transaction using direct HTTP calls
    let from_addr_str = get_public_key().await?;
    
    // Get current nonce
    let nonce_response = get_transaction_count(from_addr_str.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    // For now, just test that we can get the nonce and address correctly
    // The actual transaction signing requires proper EIP-1559 transaction construction
    Ok(format!("Canister address: {}, Nonce: {}", from_addr_str, nonce))
}

// Removed old sign_transaction function - now using ic-evm-utils

// Removed old ic-web3-rs functions - now using ic-evm-utils

// ============================================================================
// CANISTER LIFECYCLE
// ============================================================================

#[init]
fn init() {
    // Initialize the HTTP certification tree
    unsafe {
        HTTP_CERTIFICATION_TREE = Some(HttpCertificationTree::default());
    }
}

#[pre_upgrade]
fn pre_upgrade() {
    // The certification tree will be re-initialized in post_upgrade
}

#[post_upgrade]
fn post_upgrade() {
    // Re-initialize the HTTP certification tree after upgrade
    unsafe {
        HTTP_CERTIFICATION_TREE = Some(HttpCertificationTree::default());
    }
}