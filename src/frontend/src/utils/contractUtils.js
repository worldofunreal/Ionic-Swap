// Contract addresses
export const SPIRAL_TOKEN = "0xdE7409EDeA573D090c3C6123458D6242E26b425E"; // SpiralToken with EIP-2612
export const HTLC_CONTRACT = "0x288AA4c267408adE0e01463fBD5DECC824e96E8D"; // EtherlinkEscrowFactory
export const MINIMAL_FORWARDER = "0x7705a3dBd0F1B0c8e1D4a7b24539195aEB42A0AC"; // MinimalForwarder for gasless transactions

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

// MinimalForwarder ABI for meta-transactions
export const MINIMAL_FORWARDER_ABI = [
  "function getNonce(address from) view returns (uint256)",
  "function verify((address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data, uint256 validUntil), bytes signature) view returns (bool)",
  "function execute(bytes req, bytes signature) payable returns (bool, bytes)"
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