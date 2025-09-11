use crate::tokens::types::*;

// ============================================================================
// ICP TOKEN DEFINITIONS (Local Network)
// ============================================================================

/// Get ICP token deployment information
pub fn get_icp_token(symbol: &str) -> Option<ChainToken> {
    let token_data = match symbol {
        "BTC" => ("ulvla-h7777-77774-qaacq-cai", 8),
        "ETH" => ("ufxgi-4p777-77774-qaadq-cai", 18),
        "XRP" => ("v27v7-7x777-77774-qaaha-cai", 6),
        "USDT" => ("ucwa4-rx777-77774-qaada-cai", 6),
        "BNB" => ("vpyes-67777-77774-qaaeq-cai", 18),
        "SOL" => ("vizcg-th777-77774-qaaea-cai", 9),
        "USDC" => ("vb2j2-fp777-77774-qaafq-cai", 6),
        "DOGE" => ("vg3po-ix777-77774-qaafa-cai", 8),
        "ADA" => ("vt46d-j7777-77774-qaagq-cai", 6),
        "TRX" => ("vu5yx-eh777-77774-qaaga-cai", 6),
        _ => return None,
    };

    let (canister_id, decimals) = token_data;
    let candid_ui_url = format!("http://127.0.0.1:4943/?canisterId=u6s2n-gx777-77774-qaaba-cai&id={}", canister_id);

    let chain_token = ChainToken::new(
        ChainType::ICP,
        canister_id.to_string(),
        decimals,
        true, // is_deployed
    )
    .with_explorer_url(candid_ui_url.clone())
    .with_additional_info(ChainSpecificInfo::ICP {
        canister_id: canister_id.to_string(),
        icrc2_supported: true, // All our tokens support ICRC-2
        candid_ui_url,
    });

    Some(chain_token)
}

/// Get all ICP token addresses
pub fn get_all_icp_tokens() -> Vec<(String, ChainToken)> {
    let symbols = ["BTC", "ETH", "XRP", "USDT", "BNB", "SOL", "USDC", "DOGE", "ADA", "TRX"];
    
    symbols.iter()
        .filter_map(|&symbol| {
            get_icp_token(symbol).map(|token| (symbol.to_string(), token))
        })
        .collect()
}

/// Check if token is deployed on ICP
pub fn is_icp_token_deployed(symbol: &str) -> bool {
    get_icp_token(symbol).is_some()
}

/// Get ICP canister ID for token
pub fn get_icp_canister_id(symbol: &str) -> Option<String> {
    get_icp_token(symbol).map(|token| token.address)
}

// ============================================================================
// ICP NETWORK CONFIGURATION
// ============================================================================

pub const ICP_NETWORK_NAME: &str = "Local";
pub const ICP_REPLICA_URL: &str = "http://127.0.0.1:4943";
pub const ICP_CANDID_UI_URL: &str = "http://127.0.0.1:4943/?canisterId=u6s2n-gx777-77774-qaaba-cai";
pub const ICP_DEPLOYER_PRINCIPAL: &str = "vam5o-bdiga-izgux-6cjaz-53tck-eezzo-fezki-t2sh6-xefok-dkdx7-pae";

/// Get network information for ICP deployments
pub fn get_icp_network_info() -> IcpNetworkInfo {
    IcpNetworkInfo {
        name: ICP_NETWORK_NAME.to_string(),
        network_type: "local".to_string(),
        replica_url: ICP_REPLICA_URL.to_string(),
        candid_ui_url: ICP_CANDID_UI_URL.to_string(),
        deployer_principal: ICP_DEPLOYER_PRINCIPAL.to_string(),
        is_testnet: true,
    }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

#[derive(Debug, Clone)]
pub struct IcpNetworkInfo {
    pub name: String,
    pub network_type: String,
    pub replica_url: String,
    pub candid_ui_url: String,
    pub deployer_principal: String,
    pub is_testnet: bool,
}

// ============================================================================
// TOKEN METADATA
// ============================================================================

/// Get additional metadata for ICP tokens
pub fn get_icp_token_metadata(symbol: &str) -> Option<IcpTokenMetadata> {
    let metadata = match symbol {
        "BTC" => IcpTokenMetadata {
            symbol: "BTC".to_string(),
            name: "Bitcoin".to_string(),
            max_supply: Some(21_000_000),
            initial_supply: 1_000,
            transfer_fee: 10_000, // 0.0001 tokens
            minting_account: ICP_DEPLOYER_PRINCIPAL.to_string(),
            archive_controller: ICP_DEPLOYER_PRINCIPAL.to_string(),
            icrc2_enabled: true,
        },
        "ETH" => IcpTokenMetadata {
            symbol: "ETH".to_string(),
            name: "Ethereum".to_string(),
            max_supply: Some(120_000_000),
            initial_supply: 1_000,
            transfer_fee: 10_000_000_000_000_000, // 0.01 ETH
            minting_account: ICP_DEPLOYER_PRINCIPAL.to_string(),
            archive_controller: ICP_DEPLOYER_PRINCIPAL.to_string(),
            icrc2_enabled: true,
        },
        "XRP" => IcpTokenMetadata {
            symbol: "XRP".to_string(),
            name: "XRP".to_string(),
            max_supply: Some(100_000_000_000),
            initial_supply: 1_000,
            transfer_fee: 10_000, // 0.01 XRP
            minting_account: ICP_DEPLOYER_PRINCIPAL.to_string(),
            archive_controller: ICP_DEPLOYER_PRINCIPAL.to_string(),
            icrc2_enabled: true,
        },
        "USDT" => IcpTokenMetadata {
            symbol: "USDT".to_string(),
            name: "Tether".to_string(),
            max_supply: Some(1_000_000_000_000),
            initial_supply: 1_000,
            transfer_fee: 10_000, // 0.01 USDT
            minting_account: ICP_DEPLOYER_PRINCIPAL.to_string(),
            archive_controller: ICP_DEPLOYER_PRINCIPAL.to_string(),
            icrc2_enabled: true,
        },
        "BNB" => IcpTokenMetadata {
            symbol: "BNB".to_string(),
            name: "BNB".to_string(),
            max_supply: Some(200_000_000),
            initial_supply: 1_000,
            transfer_fee: 10_000_000_000_000_000, // 0.01 BNB
            minting_account: ICP_DEPLOYER_PRINCIPAL.to_string(),
            archive_controller: ICP_DEPLOYER_PRINCIPAL.to_string(),
            icrc2_enabled: true,
        },
        "SOL" => IcpTokenMetadata {
            symbol: "SOL".to_string(),
            name: "Solana".to_string(),
            max_supply: Some(1_000_000_000),
            initial_supply: 1_000,
            transfer_fee: 100_000_000, // 0.1 SOL
            minting_account: ICP_DEPLOYER_PRINCIPAL.to_string(),
            archive_controller: ICP_DEPLOYER_PRINCIPAL.to_string(),
            icrc2_enabled: true,
        },
        "USDC" => IcpTokenMetadata {
            symbol: "USDC".to_string(),
            name: "USD Coin".to_string(),
            max_supply: Some(1_000_000_000_000),
            initial_supply: 1_000,
            transfer_fee: 10_000, // 0.01 USDC
            minting_account: ICP_DEPLOYER_PRINCIPAL.to_string(),
            archive_controller: ICP_DEPLOYER_PRINCIPAL.to_string(),
            icrc2_enabled: true,
        },
        "DOGE" => IcpTokenMetadata {
            symbol: "DOGE".to_string(),
            name: "Dogecoin".to_string(),
            max_supply: Some(1_000_000_000_000),
            initial_supply: 1_000,
            transfer_fee: 10_000, // 0.0001 DOGE
            minting_account: ICP_DEPLOYER_PRINCIPAL.to_string(),
            archive_controller: ICP_DEPLOYER_PRINCIPAL.to_string(),
            icrc2_enabled: true,
        },
        "ADA" => IcpTokenMetadata {
            symbol: "ADA".to_string(),
            name: "Cardano".to_string(),
            max_supply: Some(45_000_000_000),
            initial_supply: 1_000,
            transfer_fee: 10_000, // 0.01 ADA
            minting_account: ICP_DEPLOYER_PRINCIPAL.to_string(),
            archive_controller: ICP_DEPLOYER_PRINCIPAL.to_string(),
            icrc2_enabled: true,
        },
        "TRX" => IcpTokenMetadata {
            symbol: "TRX".to_string(),
            name: "TRON".to_string(),
            max_supply: Some(1_000_000_000_000),
            initial_supply: 1_000,
            transfer_fee: 10_000, // 0.01 TRX
            minting_account: ICP_DEPLOYER_PRINCIPAL.to_string(),
            archive_controller: ICP_DEPLOYER_PRINCIPAL.to_string(),
            icrc2_enabled: true,
        },
        _ => return None,
    };

    Some(metadata)
}

#[derive(Debug, Clone)]
pub struct IcpTokenMetadata {
    pub symbol: String,
    pub name: String,
    pub max_supply: Option<u64>,
    pub initial_supply: u64,
    pub transfer_fee: u64,
    pub minting_account: String,
    pub archive_controller: String,
    pub icrc2_enabled: bool,
}

// ============================================================================
// ICRC STANDARD FUNCTIONS
// ============================================================================

/// Get ICRC-1 metadata for a token
pub fn get_icrc1_metadata(symbol: &str) -> Option<Icrc1Metadata> {
    let token = get_icp_token(symbol)?;
    let metadata = get_icp_token_metadata(symbol)?;

    Some(Icrc1Metadata {
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: token.decimals,
        fee: metadata.transfer_fee,
        minting_account: metadata.minting_account,
        max_supply: metadata.max_supply,
    })
}

#[derive(Debug, Clone)]
pub struct Icrc1Metadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub fee: u64,
    pub minting_account: String,
    pub max_supply: Option<u64>,
}
