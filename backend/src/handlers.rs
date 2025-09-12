use candid::Principal;
use ic_asset_certification::{Asset, AssetConfig};
use ic_http_certification::{HttpRequest, HttpResponse, StatusCode};
use ic_cdk::api::{data_certificate, certified_data_set};

use crate::errors::Error;
use crate::storage::Database;
use crate::types::*;

// Validation functions
fn validate_username(username: &str) -> Result<(), Error> {
    if username.len() > 16 {
        return Err(Error::InvalidInput("Username must be 16 characters or less".to_string()));
    }
    
    // Allow any Unicode characters except whitespace and problematic characters
    if username.chars().any(|c| c.is_whitespace() || c == '/' || c == '\\' || c == ':' || c == '*' || c == '?' || c == '"' || c == '<' || c == '>' || c == '|') {
        return Err(Error::InvalidInput("Username cannot contain whitespace or special characters".to_string()));
    }
    
    Ok(())
}

fn validate_display_name(display_name: &str) -> Result<(), Error> {
    if display_name.len() > 50 {
        return Err(Error::InvalidInput("Display name must be 50 characters or less".to_string()));
    }
    Ok(())
}

fn validate_bio(bio: &str) -> Result<(), Error> {
    if bio.len() > 160 {
        return Err(Error::InvalidInput("Bio must be 160 characters or less".to_string()));
    }
    Ok(())
}

fn validate_location(location: &str) -> Result<(), Error> {
    if location.len() > 30 {
        return Err(Error::InvalidInput("Location must be 30 characters or less".to_string()));
    }
    Ok(())
}

fn validate_website(website: &str) -> Result<(), Error> {
    if website.len() > 100 {
        return Err(Error::InvalidInput("Website must be 100 characters or less".to_string()));
    }
    
    if !website.starts_with("https://") {
        return Err(Error::InvalidInput("Website must start with https://".to_string()));
    }
    
    Ok(())
}

fn validate_evm_address(address: &str) -> Result<(), Error> {
    if !address.starts_with("0x") {
        return Err(Error::InvalidInput("EVM address must start with 0x".to_string()));
    }
    
    if address.len() != 42 {
        return Err(Error::InvalidInput("EVM address must be 42 characters long (0x + 40 hex chars)".to_string()));
    }
    
    // Check if all characters after 0x are valid hex
    if !address[2..].chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(Error::InvalidInput("EVM address must contain only valid hex characters".to_string()));
    }
    
    Ok(())
}

fn validate_bitcoin_address(address: &str) -> Result<(), Error> {
    if !address.starts_with("bc1") {
        return Err(Error::InvalidInput("Bitcoin address must start with bc1 (Taproot/Bech32)".to_string()));
    }
    
    if address.len() < 42 || address.len() > 62 {
        return Err(Error::InvalidInput("Bitcoin address length must be between 42-62 characters".to_string()));
    }
    
    // Basic alphanumeric check (more detailed validation could be added)
    if !address.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err(Error::InvalidInput("Bitcoin address must contain only alphanumeric characters".to_string()));
    }
    
    Ok(())
}

fn validate_solana_address(address: &str) -> Result<(), Error> {
    if address.len() < 32 || address.len() > 44 {
        return Err(Error::InvalidInput("Solana address must be between 32-44 characters".to_string()));
    }
    
    // Solana addresses are base58 encoded
    let valid_chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    if !address.chars().all(|c| valid_chars.contains(c)) {
        return Err(Error::InvalidInput("Solana address must contain only valid base58 characters".to_string()));
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
) -> Result<User, Error> {
    // Validate username
    validate_username(&username)?;
    
    // Validate wallet addresses if provided
    if let Some(ref addr) = evm_address {
        validate_evm_address(addr)?;
    }
    
    if let Some(ref addr) = bitcoin_address {
        validate_bitcoin_address(addr)?;
    }
    
    if let Some(ref addr) = solana_address {
        validate_solana_address(addr)?;
    }
    
    // Check if user already exists
    if let Some(_) = Database::get_user(caller) {
        return Err(Error::InvalidInput("User already exists".to_string()));
    }
    
    // Check if username is taken (case-insensitive)
    if Database::username_exists(&username) {
        return Err(Error::UsernameTaken);
    }
    
    // Create new user
    let user = User::new(caller, username, evm_address, bitcoin_address, solana_address);
    Database::insert_user(user.clone());
    
    Ok(user)
}

pub fn get_user(principal: Principal) -> Result<User, Error> {
    Database::get_user(principal)
        .ok_or(Error::UserNotFound)
}

pub fn get_user_by_username(username: String) -> Result<User, Error> {
    Database::get_user_by_username(&username)
        .ok_or(Error::UserNotFound)
}

pub async fn update_profile(caller: Principal, update: UserUpdate) -> Result<User, Error> {
    let mut user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    // Validate individual fields if provided
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
    
    // Apply updates
    user.update(update);
    Database::update_user(user.clone());
    
    Ok(user)
}

pub async fn update_display_name(caller: Principal, display_name: String) -> Result<User, Error> {
    validate_display_name(&display_name)?;
    
    let mut user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    user.display_name = Some(display_name);
    user.updated_at = ic_cdk::api::time();
    Database::update_user(user.clone());
    
    Ok(user)
}

pub async fn update_bio(caller: Principal, bio: String) -> Result<User, Error> {
    validate_bio(&bio)?;
    
    let mut user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    user.bio = Some(bio);
    user.updated_at = ic_cdk::api::time();
    Database::update_user(user.clone());
    
    Ok(user)
}

pub async fn update_avatar(caller: Principal, avatar_url: String) -> Result<User, Error> {
    let mut user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    user.avatar_url = Some(avatar_url);
    user.updated_at = ic_cdk::api::time();
    Database::update_user(user.clone());
    
    Ok(user)
}

pub async fn update_banner(caller: Principal, banner_url: String) -> Result<User, Error> {
    let mut user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    user.banner_url = Some(banner_url);
    user.updated_at = ic_cdk::api::time();
    Database::update_user(user.clone());
    
    Ok(user)
}

pub async fn update_location(caller: Principal, location: String) -> Result<User, Error> {
    validate_location(&location)?;
    
    let mut user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    user.location = Some(location);
    user.updated_at = ic_cdk::api::time();
    Database::update_user(user.clone());
    
    Ok(user)
}

pub async fn update_website(caller: Principal, website: String) -> Result<User, Error> {
    validate_website(&website)?;
    
    let mut user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    user.website = Some(website);
    user.updated_at = ic_cdk::api::time();
    Database::update_user(user.clone());
    
    Ok(user)
}

pub async fn update_evm_address(caller: Principal, evm_address: String) -> Result<User, Error> {
    validate_evm_address(&evm_address)?;
    
    let mut user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    user.evm_address = Some(evm_address);
    user.updated_at = ic_cdk::api::time();
    Database::update_user(user.clone());
    
    Ok(user)
}

pub async fn update_bitcoin_address(caller: Principal, bitcoin_address: String) -> Result<User, Error> {
    validate_bitcoin_address(&bitcoin_address)?;
    
    let mut user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    user.bitcoin_address = Some(bitcoin_address);
    user.updated_at = ic_cdk::api::time();
    Database::update_user(user.clone());
    
    Ok(user)
}

pub async fn update_solana_address(caller: Principal, solana_address: String) -> Result<User, Error> {
    validate_solana_address(&solana_address)?;
    
    let mut user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    user.solana_address = Some(solana_address);
    user.updated_at = ic_cdk::api::time();
    Database::update_user(user.clone());
    
    Ok(user)
}

pub fn search_users(query: String, limit: u32) -> Result<Vec<CompactProfile>, Error> {
    let max_limit = std::cmp::min(limit, 50); // Cap at 50 results
    let users = Database::search_users(&query, max_limit);
    let mut profiles = Vec::new();
    
    for user in users {
        profiles.push(CompactProfile {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            bio: user.bio,
            avatar_url: user.avatar_url,
            is_verified: user.is_verified,
            is_following_me: false, // Public endpoint, no follow state
            am_following_them: false, // Public endpoint, no follow state
        });
    }
    
    Ok(profiles)
}

pub fn search_users_personal(query: String, limit: u32, caller: Principal) -> Result<Vec<CompactProfile>, Error> {
    let max_limit = std::cmp::min(limit, 50); // Cap at 50 results
    let users = Database::search_users(&query, max_limit);
    let mut profiles = Vec::new();
    
    for user in users {
        let is_following_me = Database::is_following(user.id, caller);
        let am_following_them = Database::is_following(caller, user.id);
        
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

pub fn get_user_personal(target: Principal, caller: Principal) -> Result<PersonalUser, Error> {
    let user = Database::get_user(target)
        .ok_or(Error::UserNotFound)?;
    
    let is_following_me = Database::is_following(target, caller);
    let am_following_them = Database::is_following(caller, target);
    
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
    
    !Database::username_exists(&username)
}

pub fn get_user_count() -> u64 {
    Database::get_user_count()
}

pub fn get_all_usernames() -> Vec<String> {
    Database::get_all_usernames()
}

// Following/Followers functions
pub async fn follow_user(caller: Principal, target: Principal) -> Result<User, Error> {
    // Check if caller exists
    let mut caller_user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    // Check if target exists
    let target_user = Database::get_user(target)
        .ok_or(Error::UserNotFound)?;
    
    // Can't follow yourself
    if caller == target {
        return Err(Error::InvalidInput("Cannot follow yourself".to_string()));
    }
    
    // Follow the user
    let followed = Database::follow_user(caller, target);
    if !followed {
        return Err(Error::InvalidInput("Already following this user".to_string()));
    }
    
    // Update counts
    caller_user.following_count += 1;
    Database::update_user(caller_user.clone());
    
    // Update target's followers count
    let mut updated_target = target_user;
    updated_target.followers_count += 1;
    Database::update_user(updated_target);
    
    Ok(caller_user)
}

pub async fn unfollow_user(caller: Principal, target: Principal) -> Result<User, Error> {
    // Check if caller exists
    let mut caller_user = Database::get_user(caller)
        .ok_or(Error::UserNotFound)?;
    
    // Check if target exists
    let target_user = Database::get_user(target)
        .ok_or(Error::UserNotFound)?;
    
    // Can't unfollow yourself
    if caller == target {
        return Err(Error::InvalidInput("Cannot unfollow yourself".to_string()));
    }
    
    // Unfollow the user
    let unfollowed = Database::unfollow_user(caller, target);
    if !unfollowed {
        return Err(Error::InvalidInput("Not following this user".to_string()));
    }
    
    // Update counts
    caller_user.following_count -= 1;
    Database::update_user(caller_user.clone());
    
    // Update target's followers count
    let mut updated_target = target_user;
    updated_target.followers_count -= 1;
    Database::update_user(updated_target);
    
    Ok(caller_user)
}

pub fn get_following(user: Principal) -> Vec<CompactProfile> {
    let following_list = Database::get_following_list(user);
    let mut profiles = Vec::new();
    
    for following_id in following_list {
        if let Some(following_user) = Database::get_user(following_id) {
            let is_following_me = Database::is_following(following_id, user);
            
            profiles.push(CompactProfile {
                id: following_user.id,
                username: following_user.username,
                display_name: following_user.display_name,
                bio: following_user.bio,
                avatar_url: following_user.avatar_url,
                is_verified: following_user.is_verified,
                is_following_me,
                am_following_them: true, // This is the following list, so we're following them
            });
        }
    }
    
    profiles
}

pub fn get_followers(user: Principal) -> Vec<CompactProfile> {
    let followers_list = Database::get_followers_list(user);
    let mut profiles = Vec::new();
    
    for follower_id in followers_list {
        if let Some(follower_user) = Database::get_user(follower_id) {
            let am_following_them = Database::is_following(user, follower_id);
            
            profiles.push(CompactProfile {
                id: follower_user.id,
                username: follower_user.username,
                display_name: follower_user.display_name,
                bio: follower_user.bio,
                avatar_url: follower_user.avatar_url,
                is_verified: follower_user.is_verified,
                is_following_me: true, // This is the followers list, so they're following us
                am_following_them,
            });
        }
    }
    
    profiles
}

pub fn is_following(follower: Principal, following: Principal) -> bool {
    Database::is_following(follower, following)
}

// Asset upload handlers

pub async fn init_upload(
    caller: Principal,
    file_path: String,
    file_size: u64,
    chunk_size: Option<u64>,
    file_hash: String,
) -> Result<(), Error> {
    // Validate file path format
    if !file_path.starts_with("/assets/") {
        return Err(Error::InvalidInput("File path must start with /assets/".to_string()));
    }
    
    // Validate file hash format (should be hex)
    if !file_hash.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(Error::InvalidInput("File hash must be valid hex string".to_string()));
    }
    
    // Store upload metadata in database
    Database::init_upload(caller, file_path.clone(), file_size, chunk_size, file_hash);
    
    Ok(())
}

pub async fn store_chunk(
    caller: Principal,
    chunk_id: u64,
    chunk_data: Vec<u8>,
    file_path: String,
) -> Result<(), Error> {
    // Validate chunk size (max 2MB per chunk)
    const MAX_CHUNK_SIZE: usize = 2 * 1024 * 1024; // 2MB
    if chunk_data.len() > MAX_CHUNK_SIZE {
        return Err(Error::InvalidInput("Chunk size exceeds maximum allowed size (2MB)".to_string()));
    }
    
    // Store chunk in database
    Database::store_chunk(caller, chunk_id, chunk_data, file_path);
    
    Ok(())
}

pub async fn finalize_upload(caller: Principal, file_path: String) -> Result<String, Error> {
    // Get the complete file from chunks
    let file_data = Database::get_complete_file(caller, file_path.clone())?;
    
    // Store the complete file in our asset storage
    Database::store_asset(file_path.clone(), file_data.clone());
    
    // Clean up chunks from database
    Database::cleanup_upload(caller, file_path.clone());
    
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
    
    // Format the path to ensure it starts with "/" (like Motoko Utils.format_key)
    let formatted_path = if file_path.starts_with('/') {
        file_path.clone()
    } else {
        format!("/{}", file_path)
    };
    
    // Create asset and certify it with AssetRouter (using owned data to avoid lifetime issues)
    let asset = Asset::new(&formatted_path, file_data);
    
    let asset_config = AssetConfig::File {
        path: formatted_path.clone(),
        content_type: Some(content_type.to_string()),
        headers: vec![
            ("Cache-Control".to_string(), "public, max-age=31536000".to_string()),
        ],
        fallback_for: vec![],
        aliased_by: vec![],
        encodings: vec![],
    };
    
    // Certify the asset with AssetRouter
    crate::ASSET_ROUTER.with_borrow_mut(|asset_router| {
        if let Err(err) = asset_router.certify_assets(vec![asset], vec![asset_config]) {
            ic_cdk::trap(&format!("Failed to certify assets: {}", err));
        }
        certified_data_set(&asset_router.root_hash());
    });
    
    // Return just the file path, not a full URL
    Ok(file_path)
}

pub async fn delete_account(caller: Principal) -> Result<(), Error> {
    // Check if user exists
    let user = Database::get_user(caller).ok_or(Error::UserNotFound)?;
    
    // Remove user from all following/follower relationships
    Database::remove_user_from_following(caller);
    Database::remove_user_from_followers(caller);
    
    // Remove user's username from the username index
    Database::remove_username(user.username);
    
    // Remove user's profile data
    Database::remove_user(caller);
    
    // Remove user's assets
    Database::remove_user_assets(caller);
    
    Ok(())
}

pub fn http_request(req: HttpRequest) -> HttpResponse {
    let path = req.get_path().expect("Failed to parse request path");
    
    // Format the path to ensure it starts with "/" (like Motoko Utils.format_key)
    let formatted_path = if path.starts_with('/') {
        path.clone()
    } else {
        format!("/{}", path)
    };
    
    if formatted_path.starts_with("/assets/") {
        // Try to serve asset using AssetRouter with proper certification
        match crate::ASSET_ROUTER.with_borrow(|asset_router| {
            asset_router.serve_asset(
                &data_certificate().expect("No data certificate available"),
                &req,
            )
        }) {
            Ok(response) => response,
            Err(_) => {
                // Fallback to database lookup if AssetRouter fails
                if let Some(asset_data) = Database::get_asset(&formatted_path) {
                    // Determine content type based on file extension
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
