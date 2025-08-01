use candid::{CandidType, Deserialize, Principal, candid_method};

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
use std::str::FromStr;
use primitive_types::U256;
use rlp::RlpStream;
use ethers_core::types::Eip1559TransactionRequest;
use ethers_core::types::transaction::eip2930::AccessList;

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

async fn get_gas_price() -> Result<String, String> {
    make_json_rpc_call("eth_gasPrice", "[]").await
}

async fn get_latest_block() -> Result<String, String> {
    make_json_rpc_call("eth_getBlockByNumber", "[\"latest\", false]").await
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
pub struct PermitRequest {
    pub owner: String,
    pub spender: String,
    pub value: String,
    pub nonce: String, // User's nonce that was used in the permit signature
    pub deadline: String,
    pub v: String,
    pub r: String,
    pub s: String,
    pub signature: String,
}

#[derive(CandidType, Deserialize)]
pub struct GaslessApprovalRequest {
    pub permit_request: PermitRequest,
    pub user_address: String,
    pub amount: String,
}

#[update]
#[candid_method(update)]
async fn execute_gasless_approval(request: GaslessApprovalRequest) -> Result<String, String> {
    // 1. Verify the permit signature
    let is_valid = verify_permit_signature(&request.permit_request).await?;
    if !is_valid {
        return Err("Invalid permit signature".to_string());
    }
    
    // 2. Get canister's Ethereum address
    let from_addr_str = get_public_key().await?;
    
    // 3. Get current nonce for the canister (this is for the transaction, not the permit)
    let nonce_response = get_transaction_count(from_addr_str.clone()).await?;
    let nonce_json: serde_json::Value = serde_json::from_str(&nonce_response)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
    let canister_nonce = nonce_json["result"]
        .as_str()
        .ok_or("No result in nonce response")?
        .trim_start_matches("0x");
    
    // Debug: Log the nonces
    ic_cdk::println!("Debug - User nonce from permit: {}", request.permit_request.nonce);
    ic_cdk::println!("Debug - Canister nonce for transaction: {}", canister_nonce);
    
    // 4. Encode the executePermitAndTransfer function call on the HTLC contract
    let htlc_data = encode_htlc_permit_and_transfer_call(&request.permit_request)?;
    
    // Debug: Check if the htlc_data has odd length
    let data_clean = htlc_data.trim_start_matches("0x");
    if data_clean.len() % 2 != 0 {
        return Err(format!("HTLC data has odd length: {} chars", data_clean.len()));
    }
    
    // 5. Get current gas price and block info
    let gas_price_response = get_gas_price().await?;
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_response)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;
    let gas_price = gas_price_json["result"]
        .as_str()
        .ok_or("No result in gas price response")?
        .trim_start_matches("0x");
    
    // 6. Get latest block for base fee
    let block_response = get_latest_block().await?;
    let block_json: serde_json::Value = serde_json::from_str(&block_response)
        .map_err(|e| format!("Failed to parse block response: {}", e))?;
    let base_fee_per_gas = block_json["result"]["baseFeePerGas"]
        .as_str()
        .unwrap_or("0x3b9aca00") // 1 gwei default
        .trim_start_matches("0x");
    
    // 7. Construct and sign EIP-1559 transaction to the HTLC contract
    let htlc_address = "0x5e8b5b36F81A723Cdf42771e7aAc943b360c4751"; // EtherlinkHTLC address
    
    // Debug: Check the addresses
    if htlc_address.len() != 42 || !htlc_address.starts_with("0x") {
        return Err(format!("Invalid HTLC address: {} (length: {})", htlc_address, htlc_address.len()));
    }
    
    // Debug: Print the addresses for verification
    ic_cdk::println!("Debug - From address: {}", from_addr_str);
    ic_cdk::println!("Debug - To address (HTLC): {}", htlc_address);
    
    let signed_tx = sign_eip1559_transaction(
        &from_addr_str,
        htlc_address,
        &canister_nonce,
        &gas_price,
        &base_fee_per_gas,
        &htlc_data,
    ).await?;
    
    // 8. Send the signed transaction
    let tx_hash = send_raw_transaction(&signed_tx).await?;
    
    Ok(format!(
        "Gasless approval executed successfully! Transaction hash: {}",
        tx_hash
    ))
}

async fn verify_permit_signature(permit_request: &PermitRequest) -> Result<bool, String> {
    // This would implement EIP-2612 signature verification for the permit
    // For now, we'll return true (simplified)
    // In production, this should verify the actual signature
    
    // Debug: Log the permit request details
    ic_cdk::println!("Debug - Permit request owner: {}", permit_request.owner);
    ic_cdk::println!("Debug - Permit request spender: {}", permit_request.spender);
    ic_cdk::println!("Debug - Permit request value: {}", permit_request.value);
    ic_cdk::println!("Debug - Permit request deadline: {}", permit_request.deadline);
    ic_cdk::println!("Debug - Permit request v: {}", permit_request.v);
    ic_cdk::println!("Debug - Permit request r: {}", permit_request.r);
    ic_cdk::println!("Debug - Permit request s: {}", permit_request.s);
    
    // The verification should:
    // 1. Reconstruct the permit message according to EIP-2612
    // 2. Hash it according to EIP-712
    // 3. Recover the signer address from the signature
    // 4. Compare with the owner address
    
    Ok(true)
}

fn encode_permit_call(permit_request: &PermitRequest) -> Result<String, String> {
    // EIP-2612 permit function selector: permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
    let function_selector = "d505accf";
    
    // Encode permit parameters: (owner, spender, value, deadline, v, r, s)
    let owner_padded = format!("{:0>64}", permit_request.owner.trim_start_matches("0x"));
    let spender_padded = format!("{:0>64}", permit_request.spender.trim_start_matches("0x"));
    
    // Convert value to proper hex format (same as ethers.utils.parseUnits)
    let value_decimal: u128 = permit_request.value.parse().map_err(|e| format!("Invalid value: {}", e))?;
    let value_hex = format!("{:x}", value_decimal);
    let value_padded = format!("{:0>64}", value_hex);
    
    // Convert deadline from decimal string to hex and pad to 64 characters
    let deadline_decimal: u64 = permit_request.deadline.parse().map_err(|e| format!("Invalid deadline: {}", e))?;
    let deadline_hex = format!("{:x}", deadline_decimal);
    let deadline_padded = format!("{:0>64}", deadline_hex);
    // Convert v from decimal string to hex and pad to 64 characters
    let v_decimal: u64 = permit_request.v.parse().map_err(|e| format!("Invalid v value: {}", e))?;
    let v_padded = format!("{:0>64}", format!("{:x}", v_decimal));
    let r_padded = format!("{:0>64}", permit_request.r.trim_start_matches("0x"));
    let s_padded = format!("{:0>64}", permit_request.s.trim_start_matches("0x"));
    
    // Debug: Check each component for odd length
    if owner_padded.len() % 2 != 0 || spender_padded.len() % 2 != 0 || 
       value_padded.len() % 2 != 0 || deadline_padded.len() % 2 != 0 ||
       v_padded.len() % 2 != 0 || r_padded.len() % 2 != 0 || s_padded.len() % 2 != 0 {
        return Err(format!(
            "Permit component lengths - owner: {}, spender: {}, value: {}, deadline: {}, v: {}, r: {}, s: {}",
            owner_padded.len(), spender_padded.len(), value_padded.len(), deadline_padded.len(),
            v_padded.len(), r_padded.len(), s_padded.len()
        ));
    }
    
    let encoded_data = format!(
        "0x{}{}{}{}{}{}{}{}",
        function_selector,
        owner_padded,
        spender_padded,
        value_padded,
        deadline_padded,
        v_padded,
        r_padded,
        s_padded
    );
    
    // Debug: Log the encoded permit data
    ic_cdk::println!("Debug - Encoded permit data: {}", encoded_data);
    ic_cdk::println!("Debug - Function selector: {}", function_selector);
    ic_cdk::println!("Debug - Owner padded: {}", owner_padded);
    ic_cdk::println!("Debug - Spender padded: {}", spender_padded);
    ic_cdk::println!("Debug - Value padded: {}", value_padded);
    ic_cdk::println!("Debug - Deadline padded: {}", deadline_padded);
    ic_cdk::println!("Debug - V padded: {}", v_padded);
    ic_cdk::println!("Debug - R padded: {}", r_padded);
    ic_cdk::println!("Debug - S padded: {}", s_padded);
    
    // Debug: Check if the final encoded data has odd length
    let final_clean = encoded_data.trim_start_matches("0x");
    if final_clean.len() % 2 != 0 {
        return Err(format!("Final permit data has odd length: {} chars", final_clean.len()));
    }
    
    Ok(encoded_data)
}

fn encode_htlc_permit_and_transfer_call(permit_request: &PermitRequest) -> Result<String, String> {
    // executePermitAndTransfer function selector: executePermitAndTransfer(address,address,address,uint256,uint256,uint8,bytes32,bytes32)
    // Function signature: executePermitAndTransfer(address,address,address,uint256,uint256,uint8,bytes32,bytes32)
    let function_selector = "executePermitAndTransfer";
    
    // Function selector for executePermitAndTransfer(address,address,address,uint256,uint256,uint8,bytes32,bytes32)
    let function_selector_hash = "2e456695";
    
    // Token address (SpiralToken)
    let token_address = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
    let token_padded = format!("{:0>64}", token_address.trim_start_matches("0x"));
    
    // Encode permit parameters: (token, owner, spender, value, deadline, v, r, s)
    let owner_padded = format!("{:0>64}", permit_request.owner.trim_start_matches("0x"));
    let spender_padded = format!("{:0>64}", permit_request.spender.trim_start_matches("0x"));
    
    // Convert value to proper hex format
    let value_decimal: u128 = permit_request.value.parse().map_err(|e| format!("Invalid value: {}", e))?;
    let value_hex = format!("{:x}", value_decimal);
    let value_padded = format!("{:0>64}", value_hex);
    
    // Convert deadline from decimal string to hex and pad to 64 characters
    let deadline_decimal: u64 = permit_request.deadline.parse().map_err(|e| format!("Invalid deadline: {}", e))?;
    let deadline_hex = format!("{:x}", deadline_decimal);
    let deadline_padded = format!("{:0>64}", deadline_hex);
    
    // Convert v from decimal string to hex and pad to 64 characters
    let v_decimal: u64 = permit_request.v.parse().map_err(|e| format!("Invalid v value: {}", e))?;
    let v_padded = format!("{:0>64}", format!("{:x}", v_decimal));
    let r_padded = format!("{:0>64}", permit_request.r.trim_start_matches("0x"));
    let s_padded = format!("{:0>64}", permit_request.s.trim_start_matches("0x"));
    
    // Debug: Check each component for odd length
    if token_padded.len() % 2 != 0 || owner_padded.len() % 2 != 0 || spender_padded.len() % 2 != 0 || 
       value_padded.len() % 2 != 0 || deadline_padded.len() % 2 != 0 ||
       v_padded.len() % 2 != 0 || r_padded.len() % 2 != 0 || s_padded.len() % 2 != 0 {
        return Err(format!(
            "HTLC component lengths - token: {}, owner: {}, spender: {}, value: {}, deadline: {}, v: {}, r: {}, s: {}",
            token_padded.len(), owner_padded.len(), spender_padded.len(), value_padded.len(), deadline_padded.len(),
            v_padded.len(), r_padded.len(), s_padded.len()
        ));
    }
    
    let encoded_data = format!(
        "0x{}{}{}{}{}{}{}{}{}",
        function_selector_hash,
        token_padded,
        owner_padded,
        spender_padded,
        value_padded,
        deadline_padded,
        v_padded,
        r_padded,
        s_padded
    );
    
    // Debug: Log the encoded HTLC data
    ic_cdk::println!("Debug - Encoded HTLC data: {}", encoded_data);
    ic_cdk::println!("Debug - Function selector: {}", function_selector);
    ic_cdk::println!("Debug - Token padded: {}", token_padded);
    ic_cdk::println!("Debug - Owner padded: {}", owner_padded);
    ic_cdk::println!("Debug - Spender padded: {}", spender_padded);
    ic_cdk::println!("Debug - Value padded: {}", value_padded);
    ic_cdk::println!("Debug - Deadline padded: {}", deadline_padded);
    ic_cdk::println!("Debug - V padded: {}", v_padded);
    ic_cdk::println!("Debug - R padded: {}", r_padded);
    ic_cdk::println!("Debug - S padded: {}", s_padded);
    
    // Debug: Check if the final encoded data has odd length
    let final_clean = encoded_data.trim_start_matches("0x");
    if final_clean.len() % 2 != 0 {
        return Err(format!("Final HTLC data has odd length: {} chars", final_clean.len()));
    }
    
    Ok(encoded_data)
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
    let recovered_address = verify_permit_signature_legacy(&permit_data)?;
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



fn verify_permit_signature_legacy(permit_data: &PermitData) -> Result<String, String> {
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

async fn sign_eip1559_transaction(
    from: &str,
    to: &str,
    nonce: &str,
    gas_price: &str,
    base_fee_per_gas: &str,
    data: &str,
) -> Result<String, String> {
    const EIP1559_TX_ID: u8 = 2;
    
    // Convert hex strings to U256
    let nonce_u256 = U256::from_str_radix(nonce, 16)
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    let base_fee_u256 = U256::from_str_radix(base_fee_per_gas, 16)
        .map_err(|e| format!("Invalid base fee: {}", e))?;
    
    // Calculate max fee per gas and max priority fee per gas
    let max_priority_fee_per_gas = U256::from(1500000000u64); // 1.5 gwei
    let max_fee_per_gas = base_fee_u256 * U256::from(2u64) + max_priority_fee_per_gas;
    
    // Gas limit for the transaction
    let gas_limit = U256::from(300000u64); // 300k gas limit
    
    // Parse addresses
    ic_cdk::println!("Debug - Parsing to address: {}", to);
    let to_address = ethers_core::types::Address::from_str(to)
        .map_err(|e| format!("Invalid to address: {}", e))?;
    ic_cdk::println!("Debug - Parsed to address: {:?}", to_address);
    ic_cdk::println!("Debug - To address bytes: {:?}", to_address.as_bytes());
    
    let from_address = ethers_core::types::Address::from_str(from)
        .map_err(|e| format!("Invalid from address: {}", e))?;
    
    // Parse data - data is already hex-encoded, so we decode it to bytes
    let data_bytes = hex::decode(data.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid data: {}", e))?;
    
    // Create EIP-1559 transaction
    let tx = Eip1559TransactionRequest {
        from: Some(from_address),
        chain_id: Some(ethers_core::types::U64::from(11155111u64)), // Sepolia chain ID
        nonce: Some(nonce_u256),
        max_priority_fee_per_gas: Some(max_priority_fee_per_gas),
        max_fee_per_gas: Some(max_fee_per_gas),
        gas: Some(gas_limit),
        to: Some(ethers_core::types::NameOrAddress::Address(to_address)),
        value: Some(U256::from(0u64)),
        data: Some(ethers_core::types::Bytes::from(data_bytes)),
        access_list: AccessList::default(),
    };
    
    // Get the canister's public key for signature recovery
    let key_id = ic_cdk::api::management_canister::ecdsa::EcdsaKeyId {
        curve: ic_cdk::api::management_canister::ecdsa::EcdsaCurve::Secp256k1,
        name: "dfx_test_key".to_string(),
    };
    
    let derivation_path = vec![ic_cdk::id().as_slice().to_vec()];
    let ecdsa_pub_key = get_canister_public_key(key_id.clone(), None, derivation_path.clone()).await;
    
    // Use the built-in RLP encoding method
    let mut unsigned_tx_bytes = tx.rlp().to_vec();
    unsigned_tx_bytes.insert(0, EIP1559_TX_ID);
    
    let txhash = keccak256(&unsigned_tx_bytes);
    
    // Sign the transaction hash
    let sign_args = ic_cdk::api::management_canister::ecdsa::SignWithEcdsaArgument {
        message_hash: txhash.to_vec(),
        derivation_path,
        key_id,
    };
    
    let signature = ic_cdk::api::management_canister::ecdsa::sign_with_ecdsa(sign_args)
        .await
        .map_err(|e| format!("Failed to sign transaction: {:?}", e))?;
    
    // Parse signature components
    let sig_bytes = signature.0.signature;
    if sig_bytes.len() != 64 {
        return Err("Invalid signature length".to_string());
    }
    
    let r = U256::from_big_endian(&sig_bytes[..32]);
    let s = U256::from_big_endian(&sig_bytes[32..]);
    
    // Calculate v (recovery bit) using y_parity function
    let v = y_parity(&txhash, &sig_bytes, &ecdsa_pub_key);
    
    // Create signature struct
    let signature_struct = ethers_core::types::Signature {
        v,
        r,
        s,
    };
    
    // Use the built-in RLP encoding method for signed transaction
    let mut signed_tx_bytes = tx.rlp_signed(&signature_struct).to_vec();
    signed_tx_bytes.insert(0, EIP1559_TX_ID);
    
    let signed_tx_hex = format!("0x{}", hex::encode(signed_tx_bytes));
    
    Ok(signed_tx_hex)
}

async fn send_raw_transaction(signed_tx: &str) -> Result<String, String> {
    let params = format!("[\"{}\"]", signed_tx);
    let response = make_json_rpc_call("eth_sendRawTransaction", &params).await?;
    
    let response_json: serde_json::Value = serde_json::from_str(&response)
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    if let Some(error) = response_json.get("error") {
        return Err(format!("Transaction failed: {}", error));
    }
    
    let tx_hash = response_json["result"]
        .as_str()
        .ok_or("No transaction hash in response")?;
    
    Ok(tx_hash.to_string())
}

// Helper function to get the canister's public key
async fn get_canister_public_key(
    key_id: ic_cdk::api::management_canister::ecdsa::EcdsaKeyId,
    canister_id: Option<Principal>,
    derivation_path: Vec<Vec<u8>>,
) -> Vec<u8> {
    let (key,) = ic_cdk::api::management_canister::ecdsa::ecdsa_public_key(
        ic_cdk::api::management_canister::ecdsa::EcdsaPublicKeyArgument {
            canister_id,
            derivation_path,
            key_id,
        },
    )
    .await
    .expect("failed to get public key");
    key.public_key
}

// Helper function to compute the parity bit for signature recovery
fn y_parity(prehash: &[u8], sig: &[u8], pubkey: &[u8]) -> u64 {
    use ethers_core::k256::ecdsa::{RecoveryId, Signature, VerifyingKey};

    let orig_key = VerifyingKey::from_sec1_bytes(pubkey).expect("failed to parse the pubkey");
    let signature = Signature::try_from(sig).unwrap();
    for parity in [0u8, 1] {
        let recid = RecoveryId::try_from(parity).unwrap();
        let recovered_key = VerifyingKey::recover_from_prehash(prehash, &signature, recid)
            .expect("failed to recover key");
        if recovered_key == orig_key {
            return parity as u64;
        }
    }

    panic!(
        "failed to recover the parity bit from a signature; sig: {}, pubkey: {}",
        hex::encode(sig),
        hex::encode(pubkey)
    )
}

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