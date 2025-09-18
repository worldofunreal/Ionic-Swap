use crate::oracle::aggregator::update_all_prices;
use std::time::Duration;
use std::sync::{Mutex, OnceLock};

// Store the timer ID so we can clear it later
static TIMER_ID: OnceLock<Mutex<Option<ic_cdk_timers::TimerId>>> = OnceLock::new();

/// Start the price update scheduler (runs every 5 seconds - CoinGecko only)
pub async fn start_price_scheduler() -> Result<String, String> {
    TIMER_ID.get_or_init(|| Mutex::new(None));
    
    // Check if scheduler is already running
    {
        let stored_id = TIMER_ID.get().unwrap().lock().unwrap();
        if stored_id.is_some() {
            ic_cdk::println!("⚠️ Price scheduler is already running");
            return Ok("Price scheduler is already running - no action needed".to_string());
        }
    }
    
    ic_cdk::println!("🚀 Starting price update scheduler (5 second intervals - CoinGecko only)...");
    
    // Use IC's built-in timer system
    let timer_id = ic_cdk_timers::set_timer_interval(
        Duration::from_secs(5), // Every 5 seconds
        || {
            ic_cdk::futures::spawn_017_compat(async {
                match update_all_prices().await {
                    Ok(result) => {
                        ic_cdk::println!("⏰ Auto-updated prices: {} pairs, {} sources", 
                            result.pairs_updated.len(), result.successful_sources);
                    },
                    Err(e) => {
                        ic_cdk::println!("❌ Auto price update failed: {}", e);
                    }
                }
            });
        }
    );
    
    // Store the timer ID
    {
        let mut stored_id = TIMER_ID.get().unwrap().lock().unwrap();
        *stored_id = Some(timer_id);
    }
    
    Ok("Price scheduler started successfully - updates every 5 seconds (CoinGecko only)".to_string())
}

/// Stop the price update scheduler
pub async fn stop_price_scheduler() -> Result<String, String> {
    TIMER_ID.get_or_init(|| Mutex::new(None));
    
    let timer_id = {
        let mut stored_id = TIMER_ID.get().unwrap().lock().unwrap();
        stored_id.take()
    };
    
    if let Some(id) = timer_id {
        ic_cdk_timers::clear_timer(id);
        ic_cdk::println!("🛑 Price scheduler stopped");
        Ok("Price scheduler stopped successfully".to_string())
    } else {
        Ok("No active scheduler to stop".to_string())
    }
}
