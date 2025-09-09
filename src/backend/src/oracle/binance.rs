use crate::oracle::types::PriceData;

/// Fetch prices from Binance Public API
pub async fn get_binance_prices() -> Result<Vec<PriceData>, String> {
    let url = "https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22%2C%22ETHUSDT%22%2C%22SOLUSDT%22%2C%22ICPUSDT%22%5D";
    
    let request = ic_http_certification::HttpRequest::get(url)
        .with_headers(vec![
            ("User-Agent".to_string(), "ionic-swap-oracle".to_string()),
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
    ic_cdk::println!("   🔍 Binance raw response: {}", debug_response);
    
    let json: serde_json::Value = serde_json::from_str(&response_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let mut prices = Vec::new();
    let timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    
    // Parse Binance response
    if let Some(tickers) = json.as_array() {
        for ticker in tickers {
            if let (Some(symbol), Some(price_str)) = (ticker["symbol"].as_str(), ticker["price"].as_str()) {
                if let Ok(price) = price_str.parse::<f64>() {
                    let base_symbol = match symbol {
                        "BTCUSDT" => "BTC",
                        "ETHUSDT" => "ETH", 
                        "SOLUSDT" => "SOL",
                        "ICPUSDT" => "ICP",
                        _ => continue,
                    };
                    prices.push(PriceData { 
                        symbol: base_symbol.to_string(), 
                        price, 
                        timestamp, 
                        source: "Binance".to_string() 
                    });
                }
            }
        }
    }
    
    Ok(prices)
}
