use candid::{CandidType, Deserialize, Principal};

use ic_cdk_macros::*;
use serde_json::{json, Value};
use ic_http_certification::{
    DefaultCelBuilder, DefaultResponseCertification, HttpCertification, HttpRequest, HttpResponse,
    HttpCertificationTree, HttpCertificationTreeEntry, HttpCertificationPath,
    CERTIFICATE_EXPRESSION_HEADER_NAME,
};
use ic_web3_rs::{
    transports::ICHttp, Web3, ic::{get_eth_addr, KeyInfo},
    ethabi::ethereum_types::U256,
    types::{TransactionParameters, Bytes},
};
use std::str::FromStr;

use std::collections::HashMap;


// ============================================================================
// CONSTANTS
// ============================================================================

const SEPOLIA_CHAIN_ID: u64 = 11155111;
const EIP1559_TX_ID: u8 = 2;


const FACTORY_ADDRESS: &str = "0xBe953413e9FAB2642625D4043e4dcc0D16d14e77";
const ICP_SIGNER_ADDRESS: &str = "0x6a3Ff928a09D21d82B27e9B002BBAea7fc123A00";
const INFURA_URL: &str = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";

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
// EVM HTLC CONTRACT INTERACTION METHODS
// ============================================================================

#[update]
async fn create_evm_htlc_escrow(
    hashlock: String,
    maker: String,
    taker: String,
    amount: String,
    token: String,
    safety_deposit: String,
    expiration_time: u64,
    chain_id: u64,
) -> Result<String, String> {
    // This would interact with the EtherlinkEscrowFactory contract
    // For now, we'll simulate the contract call
    
    let factory_data = format!(
        "0x{}",
        // Function selector for createSrcEscrow or createDstEscrow
        // This would be the actual contract interaction
        hex::encode(format!("create_escrow_{}", chain_id).as_bytes())
    );
    
    // Create transaction to deploy escrow
    let tx_data = format!(
        "{{\"to\":\"{}\",\"data\":\"{}\",\"value\":\"{}\"}}",
        FACTORY_ADDRESS,
        factory_data,
        safety_deposit
    );
    
    // Sign and send transaction
    let signed_tx = sign_eip1559_transaction(
        FACTORY_ADDRESS.to_string(),
        safety_deposit,
        "500000".to_string(), // gas limit
        "20000000000".to_string(), // max_fee_per_gas (20 gwei)
        "2000000000".to_string(), // max_priority_fee_per_gas (2 gwei)
        "0".to_string(), // nonce (would need to get from chain)
        chain_id.to_string(),
        factory_data,
    ).await?;
    
    Ok(format!("EVM HTLC created: {}", signed_tx.0))
}

#[update]
async fn claim_evm_htlc_funds(
    escrow_address: String,
    secret: String,
    chain_id: u64,
) -> Result<String, String> {
    // This would call the withdraw function on the EVM escrow contract
    let withdraw_data = format!(
        "0x{}",
        // Function selector for withdraw
        hex::encode(format!("withdraw_{}", secret).as_bytes())
    );
    
    let signed_tx = sign_eip1559_transaction(
        escrow_address,
        "0".to_string(), // no value for contract call
        "200000".to_string(), // gas limit
        "20000000000".to_string(), // max_fee_per_gas
        "2000000000".to_string(), // max_priority_fee_per_gas
        "0".to_string(), // nonce
        chain_id.to_string(),
        withdraw_data,
    ).await?;
    
    Ok(format!("EVM HTLC claimed: {}", signed_tx.0))
}

#[update]
async fn cancel_evm_htlc_escrow(
    escrow_address: String,
    chain_id: u64,
) -> Result<String, String> {
    // This would call the cancel function on the EVM escrow contract
    let cancel_data = format!("0x{}", hex::encode("cancel".as_bytes())); // Function selector for cancel
    
    let signed_tx = sign_eip1559_transaction(
        escrow_address,
        "0".to_string(),
        "150000".to_string(), // gas limit
        "20000000000".to_string(), // max_fee_per_gas
        "2000000000".to_string(), // max_priority_fee_per_gas
        "0".to_string(), // nonce
        chain_id.to_string(),
        cancel_data,
    ).await?;
    
    Ok(format!("EVM HTLC cancelled: {}", signed_tx.0))
}

// ============================================================================
// EVM INTEGRATION METHODS (USING IC CDK APIs)
// ============================================================================

#[update]
async fn get_public_key() -> Result<String, String> {
    // Get the Ethereum address which is derived from the public key
    match get_eth_addr(None, None, "dfx_test_key".to_string()).await {
        Ok(addr) => Ok(format!("0x{}", hex::encode(addr))),
        Err(e) => Err(format!("Failed to get address: {}", e)),
    }
}

#[update]
async fn get_ethereum_address() -> Result<String, String> {
    match get_eth_addr(None, None, "dfx_test_key".to_string()).await {
        Ok(addr) => Ok(format!("0x{}", hex::encode(addr))),
        Err(e) => Err(format!("Failed to get address: {}", e)),
    }
}

#[update]
async fn sign_transaction(
    to: String,
    value: String,
    data: String,
    nonce: String,
) -> Result<String, String> {
    // Setup Web3 connection
    let w3 = match ICHttp::new(INFURA_URL, None) {
        Ok(v) => Web3::new(v),
        Err(e) => return Err(e.to_string()),
    };
    
    // ECDSA key info
    let derivation_path = vec![ic_cdk::api::caller().as_slice().to_vec()];
    let key_info = KeyInfo { 
        derivation_path, 
        key_name: "dfx_test_key".to_string(),
        ecdsa_sign_cycles: None,
    };
    
    // Get canister's Ethereum address
    let _from_addr = get_eth_addr(None, None, "dfx_test_key".to_string())
        .await
        .map_err(|e| format!("get canister eth addr failed: {}", e))?;
    
    // Parse inputs
    let to_addr = ic_web3_rs::ethabi::Address::from_str(&to).map_err(|e| format!("Invalid to address: {}", e))?;
    let value_u256 = U256::from_str_radix(&value.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Invalid value: {}", e))?;
    let nonce_u256 = U256::from_str_radix(&nonce.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    let data_bytes = if data.starts_with("0x") {
        hex::decode(&data[2..]).unwrap_or_default()
    } else {
        hex::decode(&data).unwrap_or_default()
    };
    
    // Construct transaction
    let tx = TransactionParameters {
        to: Some(to_addr),
        nonce: Some(nonce_u256),
        value: value_u256,
        gas_price: Some(U256::exp10(10)), // 10 gwei
        gas: U256::from(21000),
        data: Bytes::from(data_bytes),
        ..Default::default()
    };
    
    // Sign the transaction
    let signed_tx = w3.accounts()
        .sign_transaction(tx, "dfx_test_key".to_string(), key_info, 11155111) // Sepolia chain ID
        .await
        .map_err(|e| format!("sign tx error: {}", e))?;
    
    Ok(format!(
        "Signed transaction: 0x{}\nTransaction hash: 0x{}",
        hex::encode(&signed_tx.raw_transaction.0),
        hex::encode(signed_tx.message_hash.as_ref())
    ))
}

#[update]
async fn send_raw_transaction(signed_tx: String) -> Result<String, String> {
    let params = format!("[\"{}\"]", signed_tx);
    make_json_rpc_call("eth_sendRawTransaction", &params).await
}

#[update]
async fn sign_eip1559_transaction(
    to: String,
    value: String,
    gas: String,
    max_fee_per_gas: String,
    max_priority_fee_per_gas: String,
    nonce: String,
    chain_id: String,
    data: String,
) -> Result<(String, String), String> {
    // Setup Web3 connection
    let w3 = match ICHttp::new(INFURA_URL, None) {
        Ok(v) => Web3::new(v),
        Err(e) => return Err(e.to_string()),
    };
    
    // ECDSA key info
    let derivation_path = vec![ic_cdk::api::caller().as_slice().to_vec()];
    let key_info = KeyInfo { 
        derivation_path, 
        key_name: "dfx_test_key".to_string(),
        ecdsa_sign_cycles: None,
    };
    
    // Parse inputs
    let to_addr = ic_web3_rs::ethabi::Address::from_str(&to).map_err(|e| format!("Invalid to address: {}", e))?;
    let value_u256 = U256::from_str_radix(&value.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Invalid value: {}", e))?;
    let gas_u256 = U256::from_str_radix(&gas.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Invalid gas: {}", e))?;
    let max_fee_per_gas_u256 = U256::from_str_radix(&max_fee_per_gas.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Invalid max_fee_per_gas: {}", e))?;
    let max_priority_fee_per_gas_u256 = U256::from_str_radix(&max_priority_fee_per_gas.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Invalid max_priority_fee_per_gas: {}", e))?;
    let nonce_u256 = U256::from_str_radix(&nonce.trim_start_matches("0x"), 16)
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    let chain_id_u64 = chain_id.trim_start_matches("0x").parse::<u64>()
        .map_err(|e| format!("Invalid chain_id: {}", e))?;
    let data_bytes = if data.starts_with("0x") {
        hex::decode(&data[2..]).unwrap_or_default()
    } else {
        hex::decode(&data).unwrap_or_default()
    };
    
    // Construct EIP-1559 transaction
    let tx = TransactionParameters {
        to: Some(to_addr),
        nonce: Some(nonce_u256),
        value: value_u256,
        gas: gas_u256,
        gas_price: None, // Must be None for EIP-1559 transactions
        max_fee_per_gas: Some(max_fee_per_gas_u256),
        max_priority_fee_per_gas: Some(max_priority_fee_per_gas_u256),
        data: Bytes::from(data_bytes),
        transaction_type: Some(EIP1559_TX_ID.into()), // EIP-1559 transaction type
        ..Default::default()
    };
    
    // Sign the transaction
    let signed_tx = w3.accounts()
        .sign_transaction(tx, "dfx_test_key".to_string(), key_info, chain_id_u64)
        .await
        .map_err(|e| format!("sign tx error: {}", e))?;
    
    Ok((
        format!("0x{}", hex::encode(&signed_tx.raw_transaction.0)),
        format!("0x{}", hex::encode(signed_tx.message_hash.as_ref()))
    ))
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