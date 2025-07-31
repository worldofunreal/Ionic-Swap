use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::caller;
use ic_cdk_macros::*;
use serde_json::{json, Value};
use ic_http_certification::{
    DefaultCelBuilder, DefaultResponseCertification, HttpCertification, HttpRequest, HttpResponse,
    HttpCertificationTree, HttpCertificationTreeEntry, HttpCertificationPath,
    CERTIFICATE_EXPRESSION_HEADER_NAME,
};

// ============================================================================
// CONSTANTS
// ============================================================================

const SEPOLIA_CHAIN_ID: u64 = 11155111;
const FACTORY_ADDRESS: &str = "0xBe953413e9FAB2642625D4043e4dcc0D16d14e77";
const ICP_SIGNER_ADDRESS: &str = "0x6a3Ff928a09D21d82B27e9B002BBAea7fc123A00";
const INFURA_URL: &str = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303";

// Function selectors for contract
const ICP_NETWORK_SIGNER_SELECTOR: &str = "0x2a92b710";
const CLAIM_FEE_SELECTOR: &str = "0x99d32fc4";
const REFUND_FEE_SELECTOR: &str = "0x90fe6ddb";
const TOTAL_FEES_SELECTOR: &str = "0x60c6d8ae";

// ============================================================================
// GLOBAL STATE
// ============================================================================

static mut HTTP_CERTIFICATION_TREE: Option<HttpCertificationTree> = None;

// ============================================================================
// HTTP HELPER FUNCTIONS
// ============================================================================

fn get_http_certification_tree() -> &'static mut HttpCertificationTree {
    unsafe {
        if HTTP_CERTIFICATION_TREE.is_none() {
            HTTP_CERTIFICATION_TREE = Some(HttpCertificationTree::default());
        }
        HTTP_CERTIFICATION_TREE.as_mut().unwrap()
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
// EVM INTEGRATION METHODS (PLACEHOLDER)
// ============================================================================

#[update]
async fn get_public_key() -> Result<String, String> {
    // Placeholder - will implement ECDSA public key generation
    Ok("ECDSA public key generation not yet implemented".to_string())
}

#[update]
async fn get_ethereum_address() -> Result<String, String> {
    // Placeholder - will implement public key to address conversion
    Ok("Ethereum address generation not yet implemented".to_string())
}

#[update]
async fn sign_transaction(
    to: String,
    value: String,
    data: String,
    nonce: String,
) -> Result<String, String> {
    // Placeholder - will implement transaction signing
    Ok(format!(
        "Transaction signing not yet implemented - to: {}, value: {}, data: {}, nonce: {}",
        to, value, data, nonce
    ))
}

#[update]
async fn send_raw_transaction(signed_tx: String) -> Result<String, String> {
    let params = format!("[\"{}\"]", signed_tx);
    make_json_rpc_call("eth_sendRawTransaction", &params).await
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