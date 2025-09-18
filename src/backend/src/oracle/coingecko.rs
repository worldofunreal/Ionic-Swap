use crate::oracle::types::PriceData;

/// Fetch prices from CoinGecko API
pub async fn get_coingecko_prices() -> Result<Vec<PriceData>, String> {
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,internet-computer,cardano,ripple,binancecoin,dogecoin,tron&vs_currencies=usd";
    
    let request = ic_http_certification::HttpRequest::get(url)
        .with_headers(vec![
            ("User-Agent".to_string(), "ionic-swap-oracle".to_string()),
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
    if let Some(cardano) = json["cardano"]["usd"].as_f64() {
        prices.push(PriceData { symbol: "ADA".to_string(), price: cardano, timestamp, source: "CoinGecko".to_string() });
    }
    if let Some(ripple) = json["ripple"]["usd"].as_f64() {
        prices.push(PriceData { symbol: "XRP".to_string(), price: ripple, timestamp, source: "CoinGecko".to_string() });
    }
    if let Some(binancecoin) = json["binancecoin"]["usd"].as_f64() {
        prices.push(PriceData { symbol: "BNB".to_string(), price: binancecoin, timestamp, source: "CoinGecko".to_string() });
    }
    if let Some(dogecoin) = json["dogecoin"]["usd"].as_f64() {
        prices.push(PriceData { symbol: "DOGE".to_string(), price: dogecoin, timestamp, source: "CoinGecko".to_string() });
    }
    if let Some(tron) = json["tron"]["usd"].as_f64() {
        prices.push(PriceData { symbol: "TRX".to_string(), price: tron, timestamp, source: "CoinGecko".to_string() });
    }
    
    Ok(prices)
}
