use candid::Principal;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
};
use std::cell::RefCell;

use crate::user::types::{User, PrincipalList};

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

// User Database Operations
pub struct UserDatabase;

impl UserDatabase {
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
        let current_following = FOLLOWING.with(|following_map| {
            following_map.borrow().get(&follower).map(|list| list.0.clone()).unwrap_or_default()
        });
        
        if current_following.contains(&following) {
            return false;
        }
        
        let mut new_following = current_following;
        new_following.push(following);
        FOLLOWING.with(|following_map| {
            following_map.borrow_mut().insert(follower, PrincipalList(new_following));
        });
        
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
            return false;
        }
        
        let new_following: Vec<Principal> = current_following.into_iter()
            .filter(|&p| p != following)
            .collect();
        FOLLOWING.with(|following_map| {
            following_map.borrow_mut().insert(follower, PrincipalList(new_following));
        });
        
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

    // Asset storage operations
    pub fn store_asset(file_path: String, asset_data: Vec<u8>) {
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
