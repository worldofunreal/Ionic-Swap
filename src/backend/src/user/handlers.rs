use candid::Principal;
use ic_asset_certification::AssetRouter;
use ic_http_certification::{HttpRequest, HttpResponse, HttpCertificationTree, StatusCode};
use ic_cdk::api::data_certificate;
use std::rc::Rc;
use std::cell::RefCell;

use crate::user::errors::UserError;
use crate::user::storage::UserDatabase;
use crate::user::types::*;
use crate::icp::faucet;

// HTTP certification tree for asset certification
thread_local! {
    static HTTP_TREE: Rc<RefCell<HttpCertificationTree>> = Default::default();
    
    // Asset router for serving certified assets
    static ASSET_ROUTER: RefCell<AssetRouter<'static>> = RefCell::new(
        AssetRouter::with_tree(HTTP_TREE.with(|tree| tree.clone()))
    );
}

// Validation functions
pub fn validate_username(username: &str) -> Result<(), UserError> {
    if username.len() > 16 {
        return Err(UserError::InvalidInput("Username must be 16 characters or less".to_string()));
    }
    
    if username.chars().any(|c| c.is_whitespace() || c == '/' || c == '\\' || c == ':' || c == '*' || c == '?' || c == '"' || c == '<' || c == '>' || c == '|') {
        return Err(UserError::InvalidInput("Username cannot contain whitespace or special characters".to_string()));
    }
    
    Ok(())
}

pub fn validate_display_name(display_name: &str) -> Result<(), UserError> {
    if display_name.len() > 50 {
        return Err(UserError::InvalidInput("Display name must be 50 characters or less".to_string()));
    }
    Ok(())
}

pub fn validate_bio(bio: &str) -> Result<(), UserError> {
    if bio.len() > 160 {
        return Err(UserError::InvalidInput("Bio must be 160 characters or less".to_string()));
    }
    Ok(())
}

pub fn validate_location(location: &str) -> Result<(), UserError> {
    if location.len() > 30 {
        return Err(UserError::InvalidInput("Location must be 30 characters or less".to_string()));
    }
    Ok(())
}

pub fn validate_website(website: &str) -> Result<(), UserError> {
    if website.len() > 100 {
        return Err(UserError::InvalidInput("Website must be 100 characters or less".to_string()));
    }
    
    if !website.starts_with("https://") {
        return Err(UserError::InvalidInput("Website must start with https://".to_string()));
    }
    
    Ok(())
}

pub fn validate_evm_address(address: &str) -> Result<(), UserError> {
    if !address.starts_with("0x") {
        return Err(UserError::InvalidInput("EVM address must start with 0x".to_string()));
    }
    
    if address.len() != 42 {
        return Err(UserError::InvalidInput("EVM address must be 42 characters long (0x + 40 hex chars)".to_string()));
    }
    
    if !address[2..].chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(UserError::InvalidInput("EVM address must contain only valid hex characters".to_string()));
    }
    
    Ok(())
}

pub fn validate_bitcoin_address(address: &str) -> Result<(), UserError> {
    if !address.starts_with("bc1") {
        return Err(UserError::InvalidInput("Bitcoin address must start with bc1 (Taproot/Bech32)".to_string()));
    }
    
    if address.len() < 42 || address.len() > 62 {
        return Err(UserError::InvalidInput("Bitcoin address length must be between 42-62 characters".to_string()));
    }
    
    if !address.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err(UserError::InvalidInput("Bitcoin address must contain only alphanumeric characters".to_string()));
    }
    
    Ok(())
}

pub fn validate_solana_address(address: &str) -> Result<(), UserError> {
    if address.len() < 32 || address.len() > 44 {
        return Err(UserError::InvalidInput("Solana address must be between 32-44 characters".to_string()));
    }
    
    let valid_chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    if !address.chars().all(|c| valid_chars.contains(c)) {
        return Err(UserError::InvalidInput("Solana address must contain only valid base58 characters".to_string()));
    }
    
    Ok(())
}

// Handler functions
pub async fn signup(
    caller: Principal, 
    username: String,
    evm_address: Option<String>,
    bitcoin_address: Option<String>,
    solana_address: Option<String>
) -> Result<User, UserError> {
    validate_username(&username)?;
    
    if let Some(ref addr) = evm_address {
        validate_evm_address(addr)?;
    }
    
    if let Some(ref addr) = bitcoin_address {
        validate_bitcoin_address(addr)?;
    }
    
    if let Some(ref addr) = solana_address {
        validate_solana_address(addr)?;
    }
    
    if let Some(_) = UserDatabase::get_user(caller) {
        return Err(UserError::InvalidInput("User already exists".to_string()));
    }
    
    if UserDatabase::username_exists(&username) {
        return Err(UserError::UsernameTaken);
    }
    
    let user = User::new(caller, username, evm_address, bitcoin_address, solana_address);
    UserDatabase::insert_user(user.clone());
    
    // Automatically claim faucet tokens for new users
    match faucet::claim_faucet().await {
        Ok(message) => {
            ic_cdk::println!("✅ New user {} automatically received faucet tokens: {}", caller, message);
            
            // Record initial portfolio snapshot (2M USDT)
            let timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert to seconds
            let initial_portfolio_value = 2_000_000.0; // 2M USDT from faucet
            crate::storage::PortfolioStorage::store_portfolio_point(caller, timestamp, initial_portfolio_value);
            ic_cdk::println!("📊 Recorded initial portfolio snapshot: {} USDT", initial_portfolio_value);
        }
        Err(error) => {
            // Log the error but don't fail the signup
            ic_cdk::println!("⚠️ Failed to claim faucet for new user {}: {}", caller, error);
        }
    }
    
    Ok(user)
}

pub fn get_user(principal: Principal) -> Result<User, UserError> {
    UserDatabase::get_user(principal)
        .ok_or(UserError::UserNotFound)
}

pub fn get_user_by_username(username: String) -> Result<User, UserError> {
    UserDatabase::get_user_by_username(&username)
        .ok_or(UserError::UserNotFound)
}

pub async fn update_username(caller: Principal, new_username: String) -> Result<User, UserError> {
    // Validate the new username
    validate_username(&new_username)?;
    
    // Check if username is available
    if UserDatabase::username_exists(&new_username) {
        return Err(UserError::UsernameTaken);
    }
    
    // Get the current user
    let mut user = UserDatabase::get_user(caller)
        .ok_or(UserError::UserNotFound)?;
    
    // Remove old username mapping
    let old_username = user.username.clone();
    UserDatabase::remove_username_mapping(&old_username);
    
    // Update the username and timestamp
    user.username = new_username.clone();
    user.updated_at = ic_cdk::api::time();
    
    // Use insert_user to properly set both user record and new username mapping
    UserDatabase::insert_user(user.clone());
    
    Ok(user)
}

pub async fn update_profile(caller: Principal, update: UserUpdate) -> Result<User, UserError> {
    let mut user = UserDatabase::get_user(caller)
        .ok_or(UserError::UserNotFound)?;
    
    if let Some(ref display_name) = update.display_name {
        validate_display_name(display_name)?;
    }
    
    if let Some(ref bio) = update.bio {
        validate_bio(bio)?;
    }
    
    if let Some(ref location) = update.location {
        validate_location(location)?;
    }
    
    if let Some(ref website) = update.website {
        validate_website(website)?;
    }
    
    if let Some(ref evm_address) = update.evm_address {
        validate_evm_address(evm_address)?;
    }
    
    if let Some(ref bitcoin_address) = update.bitcoin_address {
        validate_bitcoin_address(bitcoin_address)?;
    }
    
    if let Some(ref solana_address) = update.solana_address {
        validate_solana_address(solana_address)?;
    }
    
    user.update(update);
    UserDatabase::update_user(user.clone());
    
    Ok(user)
}

pub fn search_users(query: String, limit: u32) -> Result<Vec<CompactProfile>, UserError> {
    let max_limit = std::cmp::min(limit, 50);
    let users = UserDatabase::search_users(&query, max_limit);
    let mut profiles = Vec::new();
    
    for user in users {
        profiles.push(CompactProfile {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            bio: user.bio,
            avatar_url: user.avatar_url,
            is_verified: user.is_verified,
            is_following_me: false,
            am_following_them: false,
        });
    }
    
    Ok(profiles)
}

pub fn search_users_personal(query: String, limit: u32, caller: Principal) -> Result<Vec<CompactProfile>, UserError> {
    let max_limit = std::cmp::min(limit, 50);
    let users = UserDatabase::search_users(&query, max_limit);
    let mut profiles = Vec::new();
    
    for user in users {
        let is_following_me = UserDatabase::is_following(user.id, caller);
        let am_following_them = UserDatabase::is_following(caller, user.id);
        
        profiles.push(CompactProfile {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            bio: user.bio,
            avatar_url: user.avatar_url,
            is_verified: user.is_verified,
            is_following_me,
            am_following_them,
        });
    }
    
    Ok(profiles)
}

pub fn get_user_personal(target: Principal, caller: Principal) -> Result<PersonalUser, UserError> {
    let user = UserDatabase::get_user(target)
        .ok_or(UserError::UserNotFound)?;
    
    let is_following_me = UserDatabase::is_following(target, caller);
    let am_following_them = UserDatabase::is_following(caller, target);
    
    Ok(PersonalUser {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        banner_url: user.banner_url,
        location: user.location,
        website: user.website,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_verified: user.is_verified,
        evm_address: user.evm_address,
        bitcoin_address: user.bitcoin_address,
        solana_address: user.solana_address,
        following_count: user.following_count,
        followers_count: user.followers_count,
        is_following_me,
        am_following_them,
    })
}

pub fn is_username_available(username: String) -> bool {
    if let Err(_) = validate_username(&username) {
        return false;
    }
    
    !UserDatabase::username_exists(&username)
}

pub fn get_user_count() -> u64 {
    UserDatabase::get_user_count()
}

pub fn get_all_usernames() -> Vec<String> {
    UserDatabase::get_all_usernames()
}

// Following/Followers functions
pub async fn follow_user(caller: Principal, target: Principal) -> Result<User, UserError> {
    let mut caller_user = UserDatabase::get_user(caller)
        .ok_or(UserError::UserNotFound)?;
    
    let target_user = UserDatabase::get_user(target)
        .ok_or(UserError::UserNotFound)?;
    
    if caller == target {
        return Err(UserError::InvalidInput("Cannot follow yourself".to_string()));
    }
    
    let followed = UserDatabase::follow_user(caller, target);
    if !followed {
        return Err(UserError::InvalidInput("Already following this user".to_string()));
    }
    
    caller_user.following_count += 1;
    UserDatabase::update_user(caller_user.clone());
    
    let mut updated_target = target_user;
    updated_target.followers_count += 1;
    UserDatabase::update_user(updated_target);
    
    Ok(caller_user)
}

pub async fn unfollow_user(caller: Principal, target: Principal) -> Result<User, UserError> {
    let mut caller_user = UserDatabase::get_user(caller)
        .ok_or(UserError::UserNotFound)?;
    
    let target_user = UserDatabase::get_user(target)
        .ok_or(UserError::UserNotFound)?;
    
    if caller == target {
        return Err(UserError::InvalidInput("Cannot unfollow yourself".to_string()));
    }
    
    let unfollowed = UserDatabase::unfollow_user(caller, target);
    if !unfollowed {
        return Err(UserError::InvalidInput("Not following this user".to_string()));
    }
    
    caller_user.following_count -= 1;
    UserDatabase::update_user(caller_user.clone());
    
    let mut updated_target = target_user;
    updated_target.followers_count -= 1;
    UserDatabase::update_user(updated_target);
    
    Ok(caller_user)
}

pub fn get_following(user: Principal) -> Vec<CompactProfile> {
    let following_list = UserDatabase::get_following_list(user);
    let mut profiles = Vec::new();
    
    for following_id in following_list {
        if let Some(following_user) = UserDatabase::get_user(following_id) {
            let is_following_me = UserDatabase::is_following(following_id, user);
            
            profiles.push(CompactProfile {
                id: following_user.id,
                username: following_user.username,
                display_name: following_user.display_name,
                bio: following_user.bio,
                avatar_url: following_user.avatar_url,
                is_verified: following_user.is_verified,
                is_following_me,
                am_following_them: true,
            });
        }
    }
    
    profiles
}

pub fn get_followers(user: Principal) -> Vec<CompactProfile> {
    let followers_list = UserDatabase::get_followers_list(user);
    let mut profiles = Vec::new();
    
    for follower_id in followers_list {
        if let Some(follower_user) = UserDatabase::get_user(follower_id) {
            let am_following_them = UserDatabase::is_following(user, follower_id);
            
            profiles.push(CompactProfile {
                id: follower_user.id,
                username: follower_user.username,
                display_name: follower_user.display_name,
                bio: follower_user.bio,
                avatar_url: follower_user.avatar_url,
                is_verified: follower_user.is_verified,
                is_following_me: true,
                am_following_them,
            });
        }
    }
    
    profiles
}

pub fn is_following(follower: Principal, following: Principal) -> bool {
    UserDatabase::is_following(follower, following)
}

// Asset upload handlers
pub async fn init_upload(
    caller: Principal,
    file_path: String,
    file_size: u64,
    chunk_size: Option<u64>,
    file_hash: String,
) -> Result<(), UserError> {
    if !file_path.starts_with("/assets/") {
        return Err(UserError::InvalidInput("File path must start with /assets/".to_string()));
    }
    
    if !file_hash.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(UserError::InvalidInput("File hash must be valid hex string".to_string()));
    }
    
    // For now, just validate - actual chunk storage would be implemented here
    println!("Init upload: {} by {} (size: {}, hash: {})", file_path, caller, file_size, file_hash);
    if let Some(chunk_size) = chunk_size {
        println!("Chunk size: {}", chunk_size);
    }
    
    Ok(())
}

pub async fn store_chunk(
    caller: Principal,
    chunk_id: u64,
    chunk_data: Vec<u8>,
    file_path: String,
) -> Result<(), UserError> {
    const MAX_CHUNK_SIZE: usize = 2 * 1024 * 1024; // 2MB
    if chunk_data.len() > MAX_CHUNK_SIZE {
        return Err(UserError::InvalidInput("Chunk size exceeds maximum allowed size (2MB)".to_string()));
    }
    
    // For now, just validate - actual chunk storage would be implemented here
    let chunk_size = chunk_data.len();
    println!("Store chunk {} for {} by {} (size: {})", chunk_id, file_path, caller, chunk_size);
    
    Ok(())
}

pub async fn finalize_upload(caller: Principal, file_path: String) -> Result<String, UserError> {
    // For now, just return the file path - actual file reconstruction would be implemented here
    println!("Finalize upload: {} by {}", file_path, caller);
    
    // Determine content type based on file extension
    let content_type = if file_path.ends_with(".webp") {
        "image/webp"
    } else if file_path.ends_with(".jpg") || file_path.ends_with(".jpeg") {
        "image/jpeg"
    } else if file_path.ends_with(".png") {
        "image/png"
    } else if file_path.ends_with(".gif") {
        "image/gif"
    } else {
        "application/octet-stream"
    };
    
    let formatted_path = if file_path.starts_with('/') {
        file_path.clone()
    } else {
        format!("/{}", file_path)
    };
    
    // For now, just return the path - actual asset certification would be implemented here
    println!("Content type: {}", content_type);
    println!("Formatted path: {}", formatted_path);
    
    Ok(file_path)
}

pub async fn delete_account(caller: Principal) -> Result<(), UserError> {
    let _user = UserDatabase::get_user(caller).ok_or(UserError::UserNotFound)?;
    
    // Remove user from all following/follower relationships
    // This would be implemented with proper cleanup functions
    
    // Remove user's username from the username index
    // This would be implemented with proper cleanup functions
    
    // Remove user's profile data
    // This would be implemented with proper cleanup functions
    
    // Remove user's assets
    // This would be implemented with proper cleanup functions
    
    println!("Delete account for user: {}", caller);
    Ok(())
}

pub fn http_request(req: HttpRequest) -> HttpResponse {
    let path = req.get_path().expect("Failed to parse request path");
    
    let formatted_path = if path.starts_with('/') {
        path.clone()
    } else {
        format!("/{}", path)
    };
    
    if formatted_path.starts_with("/assets/") {
        // Try to serve asset using AssetRouter
        match ASSET_ROUTER.with_borrow(|asset_router| {
            asset_router.serve_asset(
                &data_certificate().expect("No data certificate available"),
                &req,
            )
        }) {
            Ok(response) => response,
            Err(_) => {
                // Fallback to database lookup
                if let Some(asset_data) = UserDatabase::get_asset(&formatted_path) {
                    let content_type = if formatted_path.ends_with(".webp") {
                        "image/webp"
                    } else if formatted_path.ends_with(".jpg") || formatted_path.ends_with(".jpeg") {
                        "image/jpeg"
                    } else if formatted_path.ends_with(".png") {
                        "image/png"
                    } else if formatted_path.ends_with(".gif") {
                        "image/gif"
                    } else {
                        "application/octet-stream"
                    };
                    
                    HttpResponse::builder()
                        .with_status_code(StatusCode::OK)
                        .with_body(asset_data)
                        .with_headers(vec![
                            ("Content-Type".to_string(), content_type.to_string()),
                            ("Cache-Control".to_string(), "public, max-age=31536000".to_string()),
                        ])
                        .build()
                } else {
                    HttpResponse::builder()
                        .with_status_code(StatusCode::NOT_FOUND)
                        .with_body(b"Asset not found".to_vec())
                        .with_headers(vec![("Content-Type".to_string(), "text/plain".to_string())])
                        .build()
                }
            }
        }
    } else {
        HttpResponse::builder()
            .with_status_code(StatusCode::NOT_FOUND)
            .with_body(b"Not found".to_vec())
            .with_headers(vec![("Content-Type".to_string(), "text/plain".to_string())])
            .build()
    }
}

// Privacy settings functions
pub fn get_privacy_settings(caller: Principal) -> Result<PrivacySettings, UserError> {
    let user = UserDatabase::get_user(caller)
        .ok_or(UserError::UserNotFound)?;
    
    Ok(user.privacy_settings.unwrap_or_default())
}

pub fn update_privacy_settings(caller: Principal, privacy_settings: PrivacySettings) -> Result<User, UserError> {
    let mut user = UserDatabase::get_user(caller)
        .ok_or(UserError::UserNotFound)?;
    
    user.update_privacy_settings(privacy_settings);
    UserDatabase::update_user(user.clone());
    
    Ok(user)
}
