// Contract addresses
export const SPIRAL_SEPOLIA = "0x8528A46CcDdbC488Fa6D82580fE3844abA4B5D83";
export const HTLC_CONTRACT = "0xBe953413e9FAB2642625D4043e4dcc0D16d14e77";
export const FORWARDER_CONTRACT = "0xb68126CF8BB3EB1f0C6CC8EB5aDf860751A8fc98";

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