use candid::{CandidType, Deserialize, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use serde::Serialize;
use std::borrow::Cow;

// Newtype wrapper for Vec<Principal> to implement Storable
#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq, Serialize)]
pub struct PrincipalList(pub Vec<Principal>);

impl Storable for PrincipalList {
    const BOUND: Bound = Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }
    
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct User {
    pub id: Principal,
    pub username: String,
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
    pub created_at: u64,
    pub updated_at: u64,
    pub is_verified: bool,
    pub evm_address: Option<String>,
    pub bitcoin_address: Option<String>,
    pub solana_address: Option<String>,
    pub following_count: u32,
    pub followers_count: u32,
}

impl Storable for User {
    const BOUND: Bound = Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }
    
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserUpdate {
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
    pub evm_address: Option<String>,
    pub bitcoin_address: Option<String>,
    pub solana_address: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CompactProfile {
    pub id: Principal,
    pub username: String,
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub is_verified: bool,
    pub is_following_me: bool,
    pub am_following_them: bool,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PersonalUser {
    pub id: Principal,
    pub username: String,
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
    pub created_at: u64,
    pub updated_at: u64,
    pub is_verified: bool,
    pub evm_address: Option<String>,
    pub bitcoin_address: Option<String>,
    pub solana_address: Option<String>,
    pub following_count: u32,
    pub followers_count: u32,
    pub is_following_me: bool,
    pub am_following_them: bool,
}

impl User {
    pub fn new(
        id: Principal, 
        username: String, 
        evm_address: Option<String>,
        bitcoin_address: Option<String>,
        solana_address: Option<String>
    ) -> Self {
        let now = ic_cdk::api::time();
        Self {
            id,
            username,
            display_name: None,
            bio: None,
            avatar_url: None,
            banner_url: None,
            location: None,
            website: None,
            created_at: now,
            updated_at: now,
            is_verified: false,
            evm_address,
            bitcoin_address,
            solana_address,
            following_count: 0,
            followers_count: 0,
        }
    }

    pub fn update(&mut self, update: UserUpdate) {
        if let Some(display_name) = update.display_name {
            self.display_name = Some(display_name);
        }
        if let Some(bio) = update.bio {
            self.bio = Some(bio);
        }
        if let Some(avatar_url) = update.avatar_url {
            self.avatar_url = Some(avatar_url);
        }
        if let Some(banner_url) = update.banner_url {
            self.banner_url = Some(banner_url);
        }
        if let Some(location) = update.location {
            self.location = Some(location);
        }
        if let Some(website) = update.website {
            self.website = Some(website);
        }
        if let Some(evm_address) = update.evm_address {
            self.evm_address = Some(evm_address);
        }
        if let Some(bitcoin_address) = update.bitcoin_address {
            self.bitcoin_address = Some(bitcoin_address);
        }
        if let Some(solana_address) = update.solana_address {
            self.solana_address = Some(solana_address);
        }
        self.updated_at = ic_cdk::api::time();
    }
}
