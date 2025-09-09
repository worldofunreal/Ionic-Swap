use crate::oracle::types::PriceData;

/// Fetch prices from CoinGecko API
pub async fn get_coingecko_prices() -> Result<Vec<PriceData>, String> {
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,internet-computer&vs_currencies=usd";
    
    let request = ic_http_certification::HttpRequest::get(url)
        .with_headers(vec![
            ("User-Agent".to_string(), "ionic-swap-oracle".to_string()),
            ("x-cg-demo-api-key".to_string(), "CG-PX6UAudGfavT5WuYtopQg7fc".to_string()),
        ])
        .build();
    
    let response = match crate::http_client::make_http_request_non_replicated(request).await {
        Ok(resp) => resp,
        Err(e) => {
            ic_cdk::println!("   ❌ CoinGecko HTTP request failed: {}", e);
            return Err(format!("CoinGecko HTTP error: {}", e));
        }
    };
    let response_str = String::from_utf8(response.body().to_vec())
        .map_err(|e| format!("Failed to decode response: {}", e))?;
    
    // Debug: Log the raw response (first 200 chars)
    let debug_response = if response_str.len() > 200 {
        format!("{}...", &response_str[..200])
    } else {
        response_str.clone()
    };
    ic_cdk::println!("   🔍 CoinGecko raw response: {}", debug_response);
    
    let json: serde_json::Value = serde_json::from_str(&response_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let mut prices = Vec::new();
    let timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    
    // Parse CoinGecko response
    if let Some(bitcoin) = json["bitcoin"]["usd"].as_f64() {
        prices.push(PriceData { symbol: "BTC".to_string(), price: bitcoin, timestamp, source: "CoinGecko".to_string() });
    }
    if let Some(ethereum) = json["ethereum"]["usd"].as_f64() {
        prices.push(PriceData { symbol: "ETH".to_string(), price: ethereum, timestamp, source: "CoinGecko".to_string() });
    }
    if let Some(solana) = json["solana"]["usd"].as_f64() {
        prices.push(PriceData { symbol: "SOL".to_string(), price: solana, timestamp, source: "CoinGecko".to_string() });
    }
    if let Some(icp) = json["internet-computer"]["usd"].as_f64() {
        prices.push(PriceData { symbol: "ICP".to_string(), price: icp, timestamp, source: "CoinGecko".to_string() });
    }
    
    Ok(prices)
}
