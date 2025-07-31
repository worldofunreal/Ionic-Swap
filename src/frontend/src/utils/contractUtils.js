// Contract addresses
export const SPIRAL_SEPOLIA = "0xdE7409EDeA573D090c3C6123458D6242E26b425E"; // New SpiralToken
export const HTLC_CONTRACT = "0x5e8b5b36F81A723Cdf42771e7aAc943b360c4751"; // New EtherlinkEscrowFactory

// Network configuration
export const SEPOLIA_CHAIN_ID = 11155111;

// ERC20 ABI with permit support
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function nonces(address) view returns (uint256)",
  "function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s)"
];

// Sepolia network configuration for MetaMask
export const SEPOLIA_NETWORK_CONFIG = {
  chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'SEP',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
}; 