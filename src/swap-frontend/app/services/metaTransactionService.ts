import { ethers } from 'ethers';
import HTLC_ABI from '../contracts/abi/HTLC.json';
import ERC20_ABI from '../contracts/abi/ERC20.json';

// Contract addresses
const HTLC_CONTRACT_ADDRESS = '0xBe953413e9FAB2642625D4043e4dcc0D16d14e77';
const TEST_TOKEN_ADDRESS = '0xb3684bC4c3AcEDf35bC83E02A954B546103313e1';

// Chain configuration
const SEPOLIA_CHAIN_ID = 11155111;

export interface MetaTransactionData {
  userAddress: string;
  functionSignature: string;
  r: string;
  s: string;
  v: number;
}

export interface HTLCData {
  recipient: string;
  amount: string;
  hashlock: string;
  timelock: number;
  token: string;
  sourceChain: number;
  targetChain: number;
  orderHash: string;
}

export class MetaTransactionService {
  private provider: ethers.BrowserProvider;
  private htlcContract: ethers.Contract;
  private tokenContract: ethers.Contract;

  constructor() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not available');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.htlcContract = new ethers.Contract(HTLC_CONTRACT_ADDRESS, HTLC_ABI, this.provider);
    this.tokenContract = new ethers.Contract(TEST_TOKEN_ADDRESS, ERC20_ABI, this.provider);
  }

  /**
   * Sign a meta-transaction for HTLC creation
   */
  async signCreateHTLCMetaTransaction(
    userAddress: string,
    htlcData: HTLCData
  ): Promise<MetaTransactionData> {
    const signer = await this.provider.getSigner();
    
    // Get current nonce
    const nonce = await (this.htlcContract as any).getNonce(userAddress);
    
    // Encode function data
    const functionSignature = this.htlcContract.interface.encodeFunctionData('createHTLCMeta', [
      userAddress,
      htlcData.recipient,
      ethers.parseEther(htlcData.amount),
      htlcData.hashlock,
      htlcData.timelock,
      htlcData.token,
      htlcData.sourceChain,
      htlcData.targetChain,
      htlcData.orderHash
    ]);

    // Create domain for EIP-712
    const domain = {
      name: "HTLC Meta Transaction",
      version: "1",
      verifyingContract: HTLC_CONTRACT_ADDRESS,
      chainId: SEPOLIA_CHAIN_ID,
    };

    // Create types for EIP-712
    const types = {
      MetaTransaction: [
        { name: "nonce", type: "uint256" },
        { name: "from", type: "address" },
        { name: "functionSignature", type: "bytes" }
      ],
    };

    // Create value for EIP-712
    const value = {
      nonce: nonce.toString(),
      from: userAddress,
      functionSignature: functionSignature,
    };

    // Sign the typed data
    const signature = await signer.signTypedData(domain, types, value);
    const sig = ethers.Signature.from(signature);

    return {
      userAddress,
      functionSignature,
      r: sig.r,
      s: sig.s,
      v: sig.v
    };
  }

  /**
   * Sign a meta-transaction for HTLC claim
   */
  async signClaimHTLCMetaTransaction(
    userAddress: string,
    htlcId: string,
    secret: string
  ): Promise<MetaTransactionData> {
    const signer = await this.provider.getSigner();
    
    // Get current nonce
    const nonce = await (this.htlcContract as any).getNonce(userAddress);
    
    // Encode function data
    const functionSignature = this.htlcContract.interface.encodeFunctionData('claimHTLCMeta', [
      userAddress,
      htlcId,
      secret
    ]);

    // Create domain for EIP-712
    const domain = {
      name: "HTLC Meta Transaction",
      version: "1",
      verifyingContract: HTLC_CONTRACT_ADDRESS,
      chainId: SEPOLIA_CHAIN_ID,
    };

    // Create types for EIP-712
    const types = {
      MetaTransaction: [
        { name: "nonce", type: "uint256" },
        { name: "from", type: "address" },
        { name: "functionSignature", type: "bytes" }
      ],
    };

    // Create value for EIP-712
    const value = {
      nonce: nonce.toString(),
      from: userAddress,
      functionSignature: functionSignature,
    };

    // Sign the typed data
    const signature = await signer.signTypedData(domain, types, value);
    const sig = ethers.Signature.from(signature);

    return {
      userAddress,
      functionSignature,
      r: sig.r,
      s: sig.s,
      v: sig.v
    };
  }

  /**
   * Sign a meta-transaction for HTLC refund
   */
  async signRefundHTLCMetaTransaction(
    userAddress: string,
    htlcId: string
  ): Promise<MetaTransactionData> {
    const signer = await this.provider.getSigner();
    
    // Get current nonce
    const nonce = await (this.htlcContract as any).getNonce(userAddress);
    
    // Encode function data
    const functionSignature = this.htlcContract.interface.encodeFunctionData('refundHTLCMeta', [
      userAddress,
      htlcId
    ]);

    // Create domain for EIP-712
    const domain = {
      name: "HTLC Meta Transaction",
      version: "1",
      verifyingContract: HTLC_CONTRACT_ADDRESS,
      chainId: SEPOLIA_CHAIN_ID,
    };

    // Create types for EIP-712
    const types = {
      MetaTransaction: [
        { name: "nonce", type: "uint256" },
        { name: "from", type: "address" },
        { name: "functionSignature", type: "bytes" }
      ],
    };

    // Create value for EIP-712
    const value = {
      nonce: nonce.toString(),
      from: userAddress,
      functionSignature: functionSignature,
    };

    // Sign the typed data
    const signature = await signer.signTypedData(domain, types, value);
    const sig = ethers.Signature.from(signature);

    return {
      userAddress,
      functionSignature,
      r: sig.r,
      s: sig.s,
      v: sig.v
    };
  }

  /**
   * Execute a meta-transaction (this would be called by a relayer)
   */
  async executeMetaTransaction(metaTxData: MetaTransactionData): Promise<string> {
    const signer = await this.provider.getSigner();
    const contractWithSigner = this.htlcContract.connect(signer);
    
    const tx = await (contractWithSigner as any).executeMetaTransaction(
      metaTxData.userAddress,
      metaTxData.functionSignature,
      metaTxData.r,
      metaTxData.s,
      metaTxData.v,
      { gasLimit: 500000 }
    );

    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Approve tokens for HTLC contract (required for token HTLCs)
   */
  async approveTokens(amount: string): Promise<string> {
    const signer = await this.provider.getSigner();
    const tokenContractWithSigner = this.tokenContract.connect(signer);
    
    const tx = await (tokenContractWithSigner as any).approve(
      HTLC_CONTRACT_ADDRESS,
      ethers.parseEther(amount)
    );

    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Check token allowance
   */
  async getTokenAllowance(userAddress: string): Promise<string> {
    const allowance = await (this.tokenContract as any).allowance(userAddress, HTLC_CONTRACT_ADDRESS);
    return ethers.formatEther(allowance);
  }

  /**
   * Get user's token balance
   */
  async getTokenBalance(userAddress: string): Promise<string> {
    const balance = await (this.tokenContract as any).balanceOf(userAddress);
    return ethers.formatEther(balance);
  }

  /**
   * Get user's ETH balance
   */
  async getEthBalance(userAddress: string): Promise<string> {
    const balance = await this.provider.getBalance(userAddress);
    return ethers.formatEther(balance);
  }

  /**
   * Get HTLC details
   */
  async getHTLC(htlcId: string) {
    return await (this.htlcContract as any).getHTLC(htlcId);
  }

  /**
   * Get user's HTLCs
   */
  async getUserHTLCs(userAddress: string) {
    return await (this.htlcContract as any).getUserHTLCs(userAddress);
  }

  /**
   * Generate a random secret and hashlock
   */
  generateSecretAndHashlock(): { secret: string; hashlock: string } {
    const secret = ethers.randomBytes(32);
    const hashlock = ethers.keccak256(secret);
    
    return {
      secret: ethers.hexlify(secret),
      hashlock: hashlock
    };
  }

  /**
   * Create a hashlock from a secret
   */
  createHashlockFromSecret(secret: string): string {
    return ethers.keccak256(secret);
  }

  /**
   * Verify a secret against a hashlock
   */
  verifySecret(secret: string, hashlock: string): boolean {
    const computedHashlock = ethers.keccak256(secret);
    return computedHashlock === hashlock;
  }
}

export default MetaTransactionService; 