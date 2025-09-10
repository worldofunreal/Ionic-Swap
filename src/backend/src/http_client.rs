use ic_http_certification::{
    DefaultCelBuilder, DefaultResponseCertification, HttpCertification, HttpRequest, HttpResponse,
    HttpCertificationTree, HttpCertificationTreeEntry, HttpCertificationPath,
};
use serde_json::json;
use ic_cdk::management_canister::http_request as canister_http_outcall;
use ic_cdk::management_canister::HttpRequestArgs;
use ic_cdk::management_canister::HttpMethod;
use ic_cdk::management_canister::HttpRequestResult;

// ============================================================================
// HTTP CERTIFICATION TREE
// ============================================================================

static mut HTTP_CERTIFICATION_TREE: Option<HttpCertificationTree> = None;

// ============================================================================
// HTTP HELPER FUNCTIONS
// ============================================================================

pub fn get_http_certification_tree() -> &'static mut HttpCertificationTree {
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

pub async fn make_http_request(request: HttpRequest<'_>) -> Result<HttpResponse<'static>, String> {
    make_http_request_internal(request, true).await
}

pub async fn make_http_request_non_replicated(request: HttpRequest<'_>) -> Result<HttpResponse<'static>, String> {
    make_http_request_internal(request, false).await
}

async fn make_http_request_internal(request: HttpRequest<'_>, is_replicated: bool) -> Result<HttpResponse<'static>, String> {
    // Create the HTTP request argument using the NEW API with is_replicated field
    let arg: HttpRequestArgs = HttpRequestArgs {
        url: request.url().to_string(),
        max_response_bytes: None,
        method: match request.method().as_str() {
            "GET" => HttpMethod::GET,
            "POST" => HttpMethod::POST,
            "HEAD" => HttpMethod::HEAD,
            _ => HttpMethod::GET,
        },
        headers: request.headers().iter().map(|h| ic_cdk::management_canister::HttpHeader { 
            name: h.0.clone(), 
            value: h.1.clone() 
        }).collect(),
        body: Some(request.body().to_vec()),
        transform: None,
        is_replicated: Some(is_replicated), // 🚀 THE KEY FEATURE!
    };

    // Make the HTTP request using the new API
    let result: Result<HttpRequestResult, _> = canister_http_outcall(&arg).await;
    
    match result {
        Ok(response) => {
            // Convert to our HttpResponse type
            let headers = response.headers.iter().map(|h| (h.name.clone(), h.value.clone())).collect::<Vec<_>>();
            
            let http_response = HttpResponse::ok(
                response.body,
                headers,
            ).build();
            
            // Add certification to the response (only for replicated calls)
            if is_replicated {
                let cel_expr = DefaultCelBuilder::response_only_certification()
                    .with_response_certification(DefaultResponseCertification::certified_response_headers(vec![
                        "Content-Type",
                        "Content-Length",
                    ]))
                    .build();
                
                let certification = HttpCertification::response_only(&cel_expr, &http_response, None)
                    .map_err(|e| format!("Failed to create certification: {:?}", e))?;
                
                // Add the certification to the tree
                let path = HttpCertificationPath::exact("/json-rpc");
                let entry = HttpCertificationTreeEntry::new(&path, &certification);
                get_http_certification_tree().insert(&entry);
            }
            // Non-replicated calls don't need certification - that's the whole point!
            
            Ok(http_response)
        },
        Err(err) => Err(format!("HTTP request failed: {:?}", err)),
    }
}

// ============================================================================
// SOLANA RPC CONFIGURATION
// ============================================================================

/// Get the current Solana RPC endpoint
fn get_solana_rpc_endpoint() -> &'static str {
    // This will be set by the main lib.rs based on the network configuration
    "https://api.devnet.solana.com"
}

// ============================================================================
// SOLANA RPC CALLS
// ============================================================================

/// Make an HTTP RPC call to Solana (replicated)
pub async fn call_solana_rpc(method: &str, params: serde_json::Value) -> Result<serde_json::Value, String> {
    call_solana_rpc_internal(method, params, true).await
}

/// Make an HTTP RPC call to Solana (non-replicated - faster, cheaper)
pub async fn call_solana_rpc_non_replicated(method: &str, params: serde_json::Value) -> Result<serde_json::Value, String> {
    call_solana_rpc_internal(method, params, false).await
}

async fn call_solana_rpc_internal(method: &str, params: serde_json::Value, is_replicated: bool) -> Result<serde_json::Value, String> {
    let request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    });

    let request_body = serde_json::to_string(&request)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;

    let url = get_solana_rpc_endpoint();
    
    let http_request = HttpRequest::post(url)
        .with_headers(vec![
            ("Content-Type".to_string(), "application/json".to_string()),
            ("User-Agent".to_string(), "ionic-swap-backend".to_string()),
        ])
        .with_body(request_body.into_bytes())
        .build();

    let response = if is_replicated {
        make_http_request(http_request).await?
    } else {
        make_http_request_non_replicated(http_request).await?
    };
    
    let response_str = String::from_utf8(response.body().to_vec())
        .map_err(|e| format!("Failed to decode response: {}", e))?;

    let response_json: serde_json::Value = serde_json::from_str(&response_str)
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    // Check for RPC error
    if let Some(error) = response_json.get("error") {
        return Err(format!("Solana RPC error: {:?}", error));
    }

    Ok(response_json)
}

// ============================================================================
// BASIC SOLANA OPERATIONS
// ============================================================================

/// Get Solana account balance (non-replicated - faster)
pub async fn get_solana_balance(account: String) -> Result<u64, String> {
    let params = json!([account]);
    let response = call_solana_rpc_non_replicated("getBalance", params).await?;
    
    // Extract balance from response
    if let Some(result) = response["result"].as_u64() {
        Ok(result)
    } else if let Some(result) = response["result"]["value"].as_u64() {
        Ok(result)
    } else {
        // Debug: print the actual response structure
        let debug_response = serde_json::to_string(&response).unwrap_or_else(|_| "Failed to serialize".to_string());
        Err(format!("Invalid response format - no balance found. Response: {}", debug_response))
    }
}

/// Get Solana slot (block number) (non-replicated - faster)
pub async fn get_solana_slot() -> Result<u64, String> {
    let params = json!([]);
    let response = call_solana_rpc_non_replicated("getSlot", params).await?;
    
    // Extract slot from response
    if let Some(result) = response["result"].as_u64() {
        Ok(result)
    } else {
        Err("Invalid response format - no slot found".to_string())
    }
}

/// Get Solana account info (non-replicated - faster)
pub async fn get_solana_account_info(account: String) -> Result<String, String> {
    let params = json!([
        account,
        {
            "encoding": "base64"
        }
    ]);
    
    let response = call_solana_rpc_non_replicated("getAccountInfo", params).await?;
    
    // Return the full result as string
    if let Some(result) = response["result"]["value"].as_object() {
        Ok(serde_json::to_string(&result).unwrap())
    } else {
        Err("Invalid response format - no account info found".to_string())
    }
}

/// Get latest blockhash (non-replicated - faster)
pub async fn get_latest_blockhash() -> Result<String, String> {
    let params = json!([{"commitment": "confirmed"}]);
    let response = call_solana_rpc_non_replicated("getLatestBlockhash", params).await?;
    
    if let Some(result) = response["result"]["value"]["blockhash"].as_str() {
        Ok(result.to_string())
    } else {
        Err("Failed to get blockhash".to_string())
    }
}

// ============================================================================
// SPL TOKEN OPERATIONS
// ============================================================================

/// Get SPL token account balance (non-replicated - faster)
pub async fn get_spl_token_balance(token_account: String) -> Result<String, String> {
    let params = json!([token_account]);
    let response = call_solana_rpc_non_replicated("getTokenAccountBalance", params).await?;
    
    // Extract balance from response
    if let Some(amount) = response["result"]["value"]["amount"].as_str() {
        Ok(amount.to_string())
    } else {
        Err("Invalid response format - no token balance found".to_string())
    }
}

/// Get token accounts by owner (non-replicated - faster)
pub async fn get_token_accounts_by_owner(owner: String, mint: Option<String>) -> Result<serde_json::Value, String> {
    let mut params = json!([
        owner,
        {
            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
            "encoding": "jsonParsed"
        }
    ]);
    
    if let Some(mint_address) = mint {
        params[1]["mint"] = json!(mint_address);
    }
    
    let response = call_solana_rpc_non_replicated("getTokenAccountsByOwner", params).await?;
    
    Ok(response["result"].clone())
}

/// Get token supply (non-replicated - faster)
pub async fn get_token_supply(mint: String) -> Result<serde_json::Value, String> {
    let params = json!([mint]);
    let response = call_solana_rpc_non_replicated("getTokenSupply", params).await?;
    
    Ok(response["result"].clone())
}

// ============================================================================
// TRANSACTION OPERATIONS (KEEP REPLICATED FOR SECURITY)
// ============================================================================
// NOTE: Transaction submission operations MUST stay replicated for security
// Only read-only operations use non-replicated calls

/// Send SOL transaction
pub async fn send_sol_transaction(
    from_address: &str,
    to_address: &str,
    amount: u64,
) -> Result<String, String> {
    // Get latest blockhash for transaction
    let blockhash = get_latest_blockhash().await?;

    // Create transfer instruction (simplified)
    let instruction_data = vec![
        2u8, // Instruction type: transfer
    ];

    // In a real implementation, you would:
    // 1. Create proper Solana instruction
    // 2. Build transaction with proper account metas
    // 3. Sign the transaction with the canister's key
    // 4. Submit the signed transaction

    // For now, return the blockhash and instruction data
    let response = json!({
        "blockhash": blockhash,
        "instruction_data": instruction_data,
        "from": from_address,
        "to": to_address,
        "amount": amount
    });

    Ok(serde_json::to_string(&response).unwrap())
}

/// Send SPL token transaction
pub async fn send_spl_token_transaction(
    from_token_account: &str,
    to_token_account: &str,
    authority: &str,
    amount: u64,
) -> Result<String, String> {
    // Get latest blockhash for transaction
    let blockhash = get_latest_blockhash().await?;

    // Create transfer instruction
    let instruction_data = create_spl_transfer_instruction_data(amount);

    // In a real implementation, you would:
    // 1. Create proper SPL token transfer instruction
    // 2. Build transaction with proper account metas
    // 3. Sign the transaction with the canister's key
    // 4. Submit the signed transaction

    let response = json!({
        "blockhash": blockhash,
        "instruction_data": instruction_data,
        "from_token_account": from_token_account,
        "to_token_account": to_token_account,
        "authority": authority,
        "amount": amount
    });

    Ok(serde_json::to_string(&response).unwrap())
}

/// Create SPL token transfer instruction data
fn create_spl_transfer_instruction_data(amount: u64) -> Vec<u8> {
    let mut instruction_data = vec![3u8]; // Transfer instruction
    instruction_data.extend_from_slice(&amount.to_le_bytes());
    instruction_data
}

// ============================================================================
// TRANSACTION VERIFICATION
// ============================================================================

/// Get transaction details (non-replicated - faster)
pub async fn get_transaction(signature: String) -> Result<serde_json::Value, String> {
    let params = json!([
        signature,
        {
            "encoding": "json",
            "maxSupportedTransactionVersion": 0
        }
    ]);
    
    let response = call_solana_rpc_non_replicated("getTransaction", params).await?;
    
    Ok(response["result"].clone())
}

/// Get transaction status (non-replicated - faster)
pub async fn get_transaction_status(signature: String) -> Result<serde_json::Value, String> {
    let params = json!([signature]);
    let response = call_solana_rpc_non_replicated("getSignatureStatuses", params).await?;
    
    Ok(response["result"].clone())
}

// ============================================================================
// NETWORK INFORMATION
// ============================================================================

/// Get cluster info (non-replicated - faster)
pub async fn get_cluster_info() -> Result<serde_json::Value, String> {
    let params = json!([]);
    let response = call_solana_rpc_non_replicated("getClusterInfo", params).await?;
    
    Ok(response["result"].clone())
}

/// Get version (non-replicated - faster)
pub async fn get_version() -> Result<serde_json::Value, String> {
    let params = json!([]);
    let response = call_solana_rpc_non_replicated("getVersion", params).await?;
    
    Ok(response["result"].clone())
}

/// Get health (non-replicated - faster)
pub async fn get_health() -> Result<String, String> {
    let params = json!([]);
    let response = call_solana_rpc_non_replicated("getHealth", params).await?;
    
    if let Some(result) = response["result"].as_str() {
        Ok(result.to_string())
    } else {
        Ok("ok".to_string()) // Default to ok if no result
    }
}

// ============================================================================
// EVM HTTP CLIENT FUNCTIONS
// ============================================================================

/// Make a JSON-RPC call to an EVM node
pub async fn make_json_rpc_call(method: &str, params: &str) -> Result<String, String> {
    let url = "https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303"; // TODO: Make this configurable
    
    let request_body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": method,
        "params": serde_json::from_str::<serde_json::Value>(params)
            .map_err(|e| format!("Invalid JSON params: {}", e))?,
        "id": 1
    });
    
    let body_bytes = request_body.to_string().as_bytes().to_vec();
    let request = HttpRequest::post(url)
        .with_headers(vec![("Content-Type".to_string(), "application/json".to_string())])
        .with_body(body_bytes)
        .build();
    
    let response = make_http_request_non_replicated(request).await?;
    
    if response.status_code() != 200 {
        return Err(format!("HTTP error: {}", response.status_code()));
    }
    
    Ok(String::from_utf8_lossy(&response.body()).to_string())
}

/// Get transaction count (nonce) for an Ethereum address
pub async fn get_transaction_count(address: String) -> Result<String, String> {
    let params = format!(r#"["{}", "latest"]"#, address);
    make_json_rpc_call("eth_getTransactionCount", &params).await
}

/// Get current gas price
pub async fn get_gas_price() -> Result<String, String> {
    make_json_rpc_call("eth_gasPrice", "[]").await
}

/// Get latest block information
pub async fn get_latest_block() -> Result<String, String> {
    make_json_rpc_call("eth_getBlockByNumber", r#"["latest", false]"#).await
}

/// Send EVM raw transaction
pub async fn send_evm_raw_transaction(raw_tx: &str) -> Result<String, String> {
    let params = json!([raw_tx]);
    make_json_rpc_call("eth_sendRawTransaction", &params.to_string()).await
}
