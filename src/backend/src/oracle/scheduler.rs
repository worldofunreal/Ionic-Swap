use crate::oracle::aggregator::update_all_prices;

/// Start the price update scheduler (runs every second)
pub async fn start_price_scheduler() -> Result<String, String> {
    ic_cdk::println!("🚀 Starting price update scheduler...");
    
    // Spawn the scheduler task
    tokio::spawn(async {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1));
        loop {
            interval.tick().await;
            
            match update_all_prices().await {
                Ok(result) => {
                    ic_cdk::println!("⏰ Scheduled price update: {} pairs, {} sources", 
                        result.pairs_updated.len(), result.successful_sources);
                },
                Err(e) => {
                    ic_cdk::println!("❌ Scheduled price update failed: {}", e);
                }
            }
        }
    });
    
    Ok("Price scheduler started successfully".to_string())
}

/// Stop the price update scheduler (placeholder for future implementation)
pub async fn stop_price_scheduler() -> Result<String, String> {
    // TODO: Implement scheduler stopping logic
    Ok("Price scheduler stop requested".to_string())
}
