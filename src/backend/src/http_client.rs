use candid::Principal;
use ic_http_certification::{
    DefaultCelBuilder, DefaultResponseCertification, HttpCertification, HttpRequest, HttpResponse,
    HttpCertificationTree, HttpCertificationTreeEntry, HttpCertificationPath,
    CERTIFICATE_EXPRESSION_HEADER_NAME,
};
use serde_json::{json, Value};
use crate::constants::INFURA_URL;

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

pub async fn make_json_rpc_call(method: &str, params: &str) -> Result<String, String> {
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

pub async fn get_sepolia_block_number() -> Result<String, String> {
    make_json_rpc_call("eth_blockNumber", "[]").await
}

pub async fn get_transaction_receipt(tx_hash: String) -> Result<String, String> {
    let params = format!("[\"{}\"]", tx_hash);
    make_json_rpc_call("eth_getTransactionReceipt", &params).await
}

pub async fn get_balance(address: String) -> Result<String, String> {
    let params = format!("[\"{}\", \"latest\"]", address);
    make_json_rpc_call("eth_getBalance", &params).await
}

pub async fn get_transaction_count(address: String) -> Result<String, String> {
    let params = format!("[\"{}\", \"latest\"]", address);
    make_json_rpc_call("eth_getTransactionCount", &params).await
}

pub async fn get_gas_price() -> Result<String, String> {
    make_json_rpc_call("eth_gasPrice", "[]").await
}

pub async fn get_latest_block() -> Result<String, String> {
    make_json_rpc_call("eth_getBlockByNumber", "[\"latest\", false]").await
}

// ============================================================================
// CONTRACT INTERACTION METHODS
// ============================================================================

pub async fn get_icp_network_signer() -> Result<String, String> {
    use crate::constants::{FACTORY_ADDRESS, ICP_NETWORK_SIGNER_SELECTOR};
    let params = format!(
        "[{{\"to\":\"{}\",\"data\":\"{}\"}}, \"latest\"]",
        FACTORY_ADDRESS, ICP_NETWORK_SIGNER_SELECTOR
    );
    make_json_rpc_call("eth_call", &params).await
}

pub async fn get_claim_fee() -> Result<String, String> {
    use crate::constants::{FACTORY_ADDRESS, CLAIM_FEE_SELECTOR};
    let params = format!(
        "[{{\"to\":\"{}\",\"data\":\"{}\"}}, \"latest\"]",
        FACTORY_ADDRESS, CLAIM_FEE_SELECTOR
    );
    make_json_rpc_call("eth_call", &params).await
}

pub async fn get_refund_fee() -> Result<String, String> {
    use crate::constants::{FACTORY_ADDRESS, REFUND_FEE_SELECTOR};
    let params = format!(
        "[{{\"to\":\"{}\",\"data\":\"{}\"}}, \"latest\"]",
        FACTORY_ADDRESS, REFUND_FEE_SELECTOR
    );
    make_json_rpc_call("eth_call", &params).await
}

pub async fn get_total_fees() -> Result<String, String> {
    use crate::constants::{FACTORY_ADDRESS, TOTAL_FEES_SELECTOR};
    let params = format!(
        "[{{\"to\":\"{}\",\"data\":\"{}\"}}, \"latest\"]",
        FACTORY_ADDRESS, TOTAL_FEES_SELECTOR
    );
    make_json_rpc_call("eth_call", &params).await
} 