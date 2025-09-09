use crate::oracle::types::PriceData;

/// Fetch prices from CryptoCompare API
pub async fn get_cryptocompare_prices() -> Result<Vec<PriceData>, String> {
    let url = "https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,SOL,ICP&tsyms=USDT";
    
    let request = ic_http_certification::HttpRequest::get(url)
        .with_headers(vec![
            ("User-Agent".to_string(), "ionic-swap-oracle".to_string()),
        ])
        .build();
    
    let response = crate::http_client::make_http_request_non_replicated(request).await?;
    let response_str = String::from_utf8(response.body().to_vec())
        .map_err(|e| format!("Failed to decode response: {}", e))?;
    
    let json: serde_json::Value = serde_json::from_str(&response_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let mut prices = Vec::new();
    let timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    
    // Parse CryptoCompare response
    for symbol in ["BTC", "ETH", "SOL", "ICP"] {
        if let Some(price) = json[symbol]["USDT"].as_f64() {
            prices.push(PriceData { 
                symbol: symbol.to_string(), 
                price, 
                timestamp, 
                source: "CryptoCompare".to_string() 
            });
        }
    }
    
    Ok(prices)
}
