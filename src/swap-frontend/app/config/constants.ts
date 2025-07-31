// Contract addresses
export const HTLC_CONTRACT_ADDRESS = '0xBe953413e9FAB2642625D4043e4dcc0D16d14e77';
export const TEST_TOKEN_ADDRESS = '0xb3684bC4c3AcEDf35bC83E02A954B546103313e1';

// Chain configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/your-project-id';

// Relayer configuration (for production, use a secure relayer)
export const RELAYER_PRIVATE_KEY = 'your-relayer-private-key-here';

// ICP configuration
export const ICP_NETWORK = 'ic';
export const ICP_CANISTER_ID = 'your-htlc-canister-id-here';

// 1inch configuration
export const ONEINCH_API_KEY = 'your-1inch-api-key-here';

// Token configuration
export const ETHEREUM_TOKENS = [
  { 
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', 
    symbol: 'ETH', 
    decimals: 18,
    logo: '🔵',
    name: 'Ethereum',
    chain: 'Ethereum'
  },
  { 
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
    symbol: 'DAI', 
    decimals: 18,
    logo: '🟡',
    name: 'Dai Stablecoin',
    chain: 'Ethereum'
  },
  { 
    address: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C', 
    symbol: 'USDC', 
    decimals: 6,
    logo: '🔵',
    name: 'USD Coin',
    chain: 'Ethereum'
  }
];

export const ICP_TOKENS = [
  { 
    address: 'anonymous', 
    symbol: 'ICP', 
    decimals: 8,
    logo: '🟣',
    name: 'Internet Computer',
    chain: 'ICP'
  },
  { 
    address: 'anonymous', 
    symbol: 'XTC', 
    decimals: 12,
    logo: '🟠',
    name: 'Cycles Token',
    chain: 'ICP'
  }
];

// Chain types for HTLC
export const CHAIN_TYPES = {
  ICP: 0,
  Ethereum: 1,
  Polygon: 2,
  Optimism: 3,
  Arbitrum: 4,
  Base: 5
} as const;

// Gas limits
export const GAS_LIMITS = {
  CREATE_HTLC: 500000,
  CLAIM_HTLC: 300000,
  REFUND_HTLC: 200000,
  APPROVE_TOKENS: 100000
};

// Timeouts
export const TIMEOUTS = {
  HTLC_EXPIRY: 3600, // 1 hour in seconds
  TRANSACTION_TIMEOUT: 300000, // 5 minutes in milliseconds
  RELAYER_TIMEOUT: 60000 // 1 minute in milliseconds
}; 