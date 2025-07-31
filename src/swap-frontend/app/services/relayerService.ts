import { ethers } from 'ethers';
import { MetaTransactionData } from './metaTransactionService';

// Relayer configuration
const RELAYER_PRIVATE_KEY = process.env.NEXT_PUBLIC_RELAYER_PRIVATE_KEY || '';
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/your-project-id';

export interface RelayerResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class RelayerService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor() {
    if (!RELAYER_PRIVATE_KEY) {
      throw new Error('Relayer private key not configured');
    }

    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.wallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, this.provider);
  }

  /**
   * Execute a meta-transaction on behalf of a user
   */
  async executeMetaTransaction(
    contractAddress: string,
    metaTxData: MetaTransactionData
  ): Promise<RelayerResponse> {
    try {
      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        ['function executeMetaTransaction(address,bytes,bytes32,bytes32,uint8)'],
        this.wallet
      );

      // Execute the meta-transaction
      const tx = await contract.executeMetaTransaction(
        metaTxData.userAddress,
        metaTxData.functionSignature,
        metaTxData.r,
        metaTxData.s,
        metaTxData.v,
        {
          gasLimit: 500000,
          maxFeePerGas: ethers.parseUnits('20', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
        }
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Relayer execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get relayer balance
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Get gas price estimate
   */
  async getGasPrice(): Promise<string> {
    const gasPrice = await this.provider.getFeeData();
    return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
  }

  /**
   * Check if relayer has sufficient balance for gas
   */
  async hasSufficientBalance(): Promise<boolean> {
    const balance = await this.getBalance();
    const gasPrice = await this.getGasPrice();
    const estimatedGasCost = parseFloat(gasPrice) * 500000 / 1e9; // 500k gas limit
    return parseFloat(balance) > estimatedGasCost;
  }
}

// API endpoint for relayer service
export async function relayMetaTransaction(
  contractAddress: string,
  metaTxData: MetaTransactionData
): Promise<RelayerResponse> {
  try {
    const relayer = new RelayerService();
    
    // Check if relayer has sufficient balance
    const hasBalance = await relayer.hasSufficientBalance();
    if (!hasBalance) {
      return {
        success: false,
        error: 'Relayer has insufficient balance for gas fees'
      };
    }

    // Execute the meta-transaction
    return await relayer.executeMetaTransaction(contractAddress, metaTxData);
  } catch (error) {
    console.error('Relayer service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default RelayerService; 