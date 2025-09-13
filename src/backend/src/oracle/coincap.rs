use crate::oracle::types::PriceData;

/// Fetch prices from CoinCap API
pub async fn get_coincap_prices() -> Result<Vec<PriceData>, String> {
    let url = "https://rest.coincap.io/v3/assets?limit=100";
    
    let request = ic_http_certification::HttpRequest::get(url)
        .with_headers(vec![
            ("User-Agent".to_string(), "ionic-swap-oracle".to_string()),
            ("Authorization".to_string(), "Bearer eec5088149ee346f59d528c5c10b7a76cceca2a92dd67585b7b542d53fbdba8e".to_string()),
        ])
        .build();
    
    let response = crate::http_client::make_http_request_non_replicated(request).await?;
    let response_str = String::from_utf8(response.body().to_vec())
        .map_err(|e| format!("Failed to decode response: {}", e))?;
    
    // Debug: Log the raw response (first 200 chars)
    let debug_response = if response_str.len() > 200 {
        format!("{}...", &response_str[..200])
    } else {
        response_str.clone()
    };
    ic_cdk::println!("   🔍 CoinCap raw response: {}", debug_response);
    
    let json: serde_json::Value = serde_json::from_str(&response_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let mut prices = Vec::new();
    let timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    
    // Parse CoinCap response
    if let Some(assets) = json["data"].as_array() {
        for asset in assets {
            if let (Some(symbol), Some(price_str)) = (asset["symbol"].as_str(), asset["priceUsd"].as_str()) {
                if let Ok(price) = price_str.parse::<f64>() {
                    if symbol == "BTC" || symbol == "ETH" || symbol == "SOL" || symbol == "ICP" || 
                       symbol == "ADA" || symbol == "XRP" || symbol == "BNB" || symbol == "DOGE" || symbol == "TRX" {
                        prices.push(PriceData { 
                            symbol: symbol.to_string(), 
                            price, 
                            timestamp, 
                            source: "CoinCap".to_string() 
                        });
                    }
                }
            }
        }
    }
    
    Ok(prices)
}
