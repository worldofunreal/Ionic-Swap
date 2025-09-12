use candid::Principal;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
};
use std::cell::RefCell;
use std::collections::HashMap;

use crate::types::{User, PrincipalList};

type Memory = VirtualMemory<DefaultMemoryImpl>;

const USERS_MEMORY_ID: MemoryId = MemoryId::new(0);
const USERNAMES_MEMORY_ID: MemoryId = MemoryId::new(1);
const FOLLOWING_MEMORY_ID: MemoryId = MemoryId::new(2);
const FOLLOWERS_MEMORY_ID: MemoryId = MemoryId::new(3);
const ASSETS_MEMORY_ID: MemoryId = MemoryId::new(4);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    static USERS: RefCell<StableBTreeMap<Principal, User, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(USERS_MEMORY_ID)))
    );

    static USERNAMES: RefCell<StableBTreeMap<String, Principal, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(USERNAMES_MEMORY_ID)))
    );

    static FOLLOWING: RefCell<StableBTreeMap<Principal, PrincipalList, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(FOLLOWING_MEMORY_ID)))
    );

    static FOLLOWERS: RefCell<StableBTreeMap<Principal, PrincipalList, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(FOLLOWERS_MEMORY_ID)))
    );

    static ASSETS: RefCell<StableBTreeMap<String, Vec<u8>, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|mm| mm.borrow().get(ASSETS_MEMORY_ID)))
    );
}

pub struct Database;

impl Database {
    pub fn new() -> Self {
        Self
    }



    pub fn init(&mut self) {
        // Database is initialized automatically by thread_local!
    }

    pub fn pre_upgrade(&self) {
        // Stable structures handle persistence automatically
    }

    pub fn post_upgrade(&mut self) {
        // Stable structures handle restoration automatically
    }

    // User operations
    pub fn insert_user(user: User) {
        USERS.with(|users| {
            users.borrow_mut().insert(user.id, user.clone());
        });
        USERNAMES.with(|usernames| {
            usernames.borrow_mut().insert(user.username.clone(), user.id);
        });
    }

    pub fn get_user(principal: Principal) -> Option<User> {
        USERS.with(|users| {
            users.borrow().get(&principal)
        })
    }

    pub fn get_user_by_username(username: &str) -> Option<User> {
        USERNAMES.with(|usernames| {
            if let Some(principal) = usernames.borrow().get(&username.to_string()) {
                USERS.with(|users| {
                    users.borrow().get(&principal)
                })
            } else {
                None
            }
        })
    }

    pub fn update_user(user: User) {
        USERS.with(|users| {
            users.borrow_mut().insert(user.id, user);
        });
    }

    pub fn username_exists(username: &str) -> bool {
        let username_lower = username.to_lowercase();
        USERNAMES.with(|usernames| {
            usernames.borrow().iter().any(|entry| {
                entry.key().to_lowercase() == username_lower
            })
        })
    }

    pub fn get_user_count() -> u64 {
        USERS.with(|users| {
            users.borrow().len() as u64
        })
    }

    pub fn get_all_usernames() -> Vec<String> {
        USERNAMES.with(|usernames| {
            usernames.borrow().iter().map(|entry| entry.key().clone()).collect()
        })
    }

    pub fn search_users(query: &str, limit: u32) -> Vec<User> {
        let query_lower = query.to_lowercase();
        let mut results = Vec::new();
        let mut count = 0;

        USERS.with(|users| {
            for entry in users.borrow().iter() {
                if count >= limit {
                    break;
                }

                let user = entry.value();
                let username_match = user.username.to_lowercase().contains(&query_lower);
                let display_name_match = user.display_name
                    .as_ref()
                    .map(|name| name.to_lowercase().contains(&query_lower))
                    .unwrap_or(false);

                if username_match || display_name_match {
                    results.push(user.clone());
                    count += 1;
                }
            }
        });

        results
    }

    // Following/Followers operations
    pub fn follow_user(follower: Principal, following: Principal) -> bool {
        // Check if already following
        let current_following = FOLLOWING.with(|following_map| {
            following_map.borrow().get(&follower).map(|list| list.0.clone()).unwrap_or_default()
        });
        
        if current_following.contains(&following) {
            return false; // Already following
        }
        
        // Add to follower's FOLLOWING list
        let mut new_following = current_following;
        new_following.push(following);
        FOLLOWING.with(|following_map| {
            following_map.borrow_mut().insert(follower, PrincipalList(new_following));
        });
        
        // Add to following's FOLLOWERS list
        let current_followers = FOLLOWERS.with(|followers_map| {
            followers_map.borrow().get(&following).map(|list| list.0.clone()).unwrap_or_default()
        });
        let mut new_followers = current_followers;
        new_followers.push(follower);
        FOLLOWERS.with(|followers_map| {
            followers_map.borrow_mut().insert(following, PrincipalList(new_followers));
        });
        
        true
    }

    pub fn unfollow_user(follower: Principal, following: Principal) -> bool {
        let current_following = FOLLOWING.with(|following_map| {
            following_map.borrow().get(&follower).map(|list| list.0.clone()).unwrap_or_default()
        });
        
        if !current_following.contains(&following) {
            return false; // Not following
        }
        
        // Remove from follower's FOLLOWING list
        let new_following: Vec<Principal> = current_following.into_iter()
            .filter(|&p| p != following)
            .collect();
        FOLLOWING.with(|following_map| {
            following_map.borrow_mut().insert(follower, PrincipalList(new_following));
        });
        
        // Remove from following's FOLLOWERS list
        let current_followers = FOLLOWERS.with(|followers_map| {
            followers_map.borrow().get(&following).map(|list| list.0.clone()).unwrap_or_default()
        });
        let new_followers: Vec<Principal> = current_followers.into_iter()
            .filter(|&p| p != follower)
            .collect();
        FOLLOWERS.with(|followers_map| {
            followers_map.borrow_mut().insert(following, PrincipalList(new_followers));
        });
        
        true
    }

    pub fn get_following_list(user: Principal) -> Vec<Principal> {
        FOLLOWING.with(|following_map| {
            following_map.borrow().get(&user).map(|list| list.0.clone()).unwrap_or_default()
        })
    }

    pub fn is_following(follower: Principal, following: Principal) -> bool {
        let following_list = Self::get_following_list(follower);
        following_list.contains(&following)
    }

    pub fn get_followers_list(user: Principal) -> Vec<Principal> {
        FOLLOWERS.with(|followers_map| {
            followers_map.borrow().get(&user).map(|list| list.0.clone()).unwrap_or_default()
        })
    }

    // Account deletion operations
    pub fn remove_user_from_following(user: Principal) {
        // Remove user from all following lists
        FOLLOWING.with(|following_map| {
            let mut following_map = following_map.borrow_mut();
            let keys: Vec<Principal> = following_map.iter().map(|entry| entry.key().clone()).collect();
            for key in keys {
                if let Some(following_list) = following_map.get(&key) {
                    let mut principals = following_list.0.clone();
                    principals.retain(|&p| p != user);
                    following_map.insert(key, PrincipalList(principals));
                }
            }
        });
    }

    pub fn remove_user_from_followers(user: Principal) {
        // Remove user from all followers lists
        FOLLOWERS.with(|followers_map| {
            let mut followers_map = followers_map.borrow_mut();
            let keys: Vec<Principal> = followers_map.iter().map(|entry| entry.key().clone()).collect();
            for key in keys {
                if let Some(followers_list) = followers_map.get(&key) {
                    let mut principals = followers_list.0.clone();
                    principals.retain(|&p| p != user);
                    followers_map.insert(key, PrincipalList(principals));
                }
            }
        });
    }

    pub fn remove_username(username: String) {
        USERNAMES.with(|usernames| {
            usernames.borrow_mut().remove(&username);
        });
    }

    pub fn remove_user(user: Principal) {
        USERS.with(|users| {
            users.borrow_mut().remove(&user);
        });
    }

    pub fn remove_user_assets(user: Principal) {
        // Remove all assets associated with the user
        // This is a simplified implementation - in production you might want to
        // track which assets belong to which user
        ASSETS.with(|assets| {
            let mut assets = assets.borrow_mut();
            let keys: Vec<String> = assets.iter().map(|entry| entry.key().clone()).collect();
            for key in keys {
                if key.contains(&user.to_string()) {
                    assets.remove(&key);
                }
            }
        });
    }

    // Upload storage operations
    // Note: For simplicity, we'll use in-memory storage for uploads
    // In production, you'd want to use stable storage
    
    // Temporary storage for chunks during upload (using thread_local for simplicity)
    thread_local! {
        static CHUNKS: RefCell<HashMap<String, Vec<Vec<u8>>>> = RefCell::new(HashMap::new());
    }
    
    pub fn init_upload(
        caller: Principal,
        file_path: String,
        file_size: u64,
        chunk_size: Option<u64>,
        file_hash: String,
    ) {
        // Initialize empty chunk storage for this file
        Self::CHUNKS.with(|chunks| {
            chunks.borrow_mut().insert(file_path.clone(), vec![]);
        });
        println!("Init upload: {} by {} (size: {}, hash: {})", file_path, caller, file_size, file_hash);
        if let Some(chunk_size) = chunk_size {
            println!("Chunk size: {}", chunk_size);
        }
    }

    pub fn store_chunk(
        caller: Principal,
        chunk_id: u64,
        chunk_data: Vec<u8>,
        file_path: String,
    ) {
        let chunk_size = chunk_data.len();
        // Store chunk data
        Self::CHUNKS.with(|chunks| {
            if let Some(file_chunks) = chunks.borrow_mut().get_mut(&file_path) {
                // Ensure we have enough space for this chunk
                while file_chunks.len() <= chunk_id as usize {
                    file_chunks.push(vec![]);
                }
                file_chunks[chunk_id as usize] = chunk_data;
            }
        });
        println!("Store chunk {} for {} by {} (size: {})", chunk_id, file_path, caller, chunk_size);
    }

    pub fn get_complete_file(caller: Principal, file_path: String) -> Result<Vec<u8>, crate::errors::Error> {
        // Reconstruct file from chunks
        let complete_file = Self::CHUNKS.with(|chunks| {
            if let Some(file_chunks) = chunks.borrow().get(&file_path) {
                // Concatenate all chunks
                let mut result = Vec::new();
                for chunk in file_chunks {
                    result.extend_from_slice(chunk);
                }
                result
            } else {
                vec![]
            }
        });
        
        println!("Get complete file: {} by {} (size: {})", file_path, caller, complete_file.len());
        Ok(complete_file)
    }

    pub fn cleanup_upload(caller: Principal, file_path: String) {
        // Clean up chunks after successful upload
        println!("Cleanup upload: {} by {}", file_path, caller);
    }

    // Asset storage operations
    pub fn store_asset(file_path: String, asset_data: Vec<u8>) {
        // Store the complete asset in stable storage
        ASSETS.with(|assets| {
            assets.borrow_mut().insert(file_path, asset_data);
        });
    }

    pub fn get_asset(file_path: &str) -> Option<Vec<u8>> {
        ASSETS.with(|assets| {
            assets.borrow().get(&file_path.to_string())
        })
    }
}
