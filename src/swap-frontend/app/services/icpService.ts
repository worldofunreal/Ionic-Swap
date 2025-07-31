import { useActor } from '../useActor';
import { Principal } from '@dfinity/principal';

export interface ICPHTLCData {
  recipient: Principal;
  amount: bigint;
  tokenCanister: Principal;
  expirationTime: bigint;
  chainType: 'ICP' | 'Base' | 'Ethereum' | 'Polygon' | 'Optimism' | 'Arbitrum';
  ethereumAddress?: string;
}

export interface ICPHTLC {
  id: string;
  status: 'Locked' | 'Claimed' | 'Refunded' | 'Expired';
  hashlock: Uint8Array;
  tokenCanister: Principal;
  recipient: Principal;
  ethereumAddress?: string;
  secret?: string;
  createdAt: bigint;
  sender: Principal;
  chainType: 'ICP' | 'Base' | 'Ethereum' | 'Polygon' | 'Optimism' | 'Arbitrum';
  expirationTime: bigint;
  amount: bigint;
}

export class ICPService {
  private actor: any;

  constructor() {
    const { actor } = useActor();
    this.actor = actor;
  }

  /**
   * Create an HTLC on ICP
   */
  async createHTLC(htlcData: ICPHTLCData): Promise<string> {
    try {
      const result = await this.actor.create_htlc(
        htlcData.recipient,
        htlcData.amount,
        htlcData.tokenCanister,
        htlcData.expirationTime,
        htlcData.chainType,
        htlcData.ethereumAddress ? [htlcData.ethereumAddress] : []
      );

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP HTLC creation error:', error);
      throw error;
    }
  }

  /**
   * Claim an HTLC on ICP
   */
  async claimHTLC(htlcId: string, secret: string): Promise<void> {
    try {
      const result = await this.actor.claim_htlc(htlcId, secret);

      if ('err' in result) {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP HTLC claim error:', error);
      throw error;
    }
  }

  /**
   * Refund an HTLC on ICP
   */
  async refundHTLC(htlcId: string): Promise<void> {
    try {
      const result = await this.actor.refund_htlc(htlcId);

      if ('err' in result) {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP HTLC refund error:', error);
      throw error;
    }
  }

  /**
   * Get HTLC details
   */
  async getHTLC(htlcId: string): Promise<ICPHTLC> {
    try {
      const result = await this.actor.get_htlc(htlcId);

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP get HTLC error:', error);
      throw error;
    }
  }

  /**
   * Get user's HTLCs
   */
  async getUserHTLCs(principal: Principal): Promise<ICPHTLC[]> {
    try {
      return await this.actor.get_htlcs_by_principal(principal);
    } catch (error) {
      console.error('ICP get user HTLCs error:', error);
      throw error;
    }
  }

  /**
   * Set hashlock for an HTLC
   */
  async setHTLCHashlock(htlcId: string, hashlock: Uint8Array): Promise<void> {
    try {
      const result = await this.actor.set_htlc_hashlock(htlcId, hashlock);

      if ('err' in result) {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP set HTLC hashlock error:', error);
      throw error;
    }
  }

  /**
   * Link a 1inch order to an HTLC
   */
  async link1inchOrder(
    htlcId: string,
    oneinchOrder: any,
    isSourceChain: boolean,
    partialFillIndex?: bigint
  ): Promise<void> {
    try {
      const result = await this.actor.link_1inch_order(
        htlcId,
        oneinchOrder,
        isSourceChain,
        partialFillIndex ? [partialFillIndex] : []
      );

      if ('err' in result) {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP link 1inch order error:', error);
      throw error;
    }
  }

  /**
   * Get 1inch order for an HTLC
   */
  async get1inchOrder(htlcId: string): Promise<any> {
    try {
      const result = await this.actor.get_1inch_order(htlcId);

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP get 1inch order error:', error);
      throw error;
    }
  }

  /**
   * Get active orders
   */
  async getActiveOrders(
    page?: bigint,
    limit?: bigint,
    srcChain?: bigint,
    dstChain?: bigint
  ): Promise<string> {
    try {
      const result = await this.actor.get_active_orders(
        page ? [page] : [],
        limit ? [limit] : [],
        srcChain ? [srcChain] : [],
        dstChain ? [dstChain] : []
      );

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP get active orders error:', error);
      throw error;
    }
  }

  /**
   * Get chain configuration
   */
  async getChainConfig(chainId: bigint): Promise<any> {
    try {
      const result = await this.actor.get_chain_config(chainId);

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP get chain config error:', error);
      throw error;
    }
  }

  /**
   * Get EVM balance
   */
  async getEVMBalance(chainId: bigint, address: string): Promise<string> {
    try {
      const result = await this.actor.get_evm_balance(chainId, address);

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP get EVM balance error:', error);
      throw error;
    }
  }

  /**
   * Get EVM block number
   */
  async getEVMBlockNumber(chainId: bigint): Promise<bigint> {
    try {
      const result = await this.actor.get_evm_block_number(chainId);

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP get EVM block number error:', error);
      throw error;
    }
  }

  /**
   * Test EVM RPC connectivity
   */
  async testEVMRPC(chainId: bigint): Promise<string> {
    try {
      const result = await this.actor.test_evm_rpc(chainId);

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP test EVM RPC error:', error);
      throw error;
    }
  }

  /**
   * Test 1inch API connectivity
   */
  async test1inchAPI(): Promise<string> {
    try {
      const result = await this.actor.test_1inch_api();

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP test 1inch API error:', error);
      throw error;
    }
  }

  /**
   * Get available tokens for a chain
   */
  async getTokens(chainId: bigint): Promise<string> {
    try {
      const result = await this.actor.get_tokens(chainId);

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP get tokens error:', error);
      throw error;
    }
  }

  /**
   * Get escrow factory address
   */
  async getEscrowFactoryAddress(chainId: bigint): Promise<string> {
    try {
      const result = await this.actor.get_escrow_factory_address(chainId);

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('ICP get escrow factory address error:', error);
      throw error;
    }
  }

  /**
   * Convert Ethereum address to Principal (if needed)
   */
  static ethereumAddressToPrincipal(address: string): Principal {
    // This is a simplified conversion - in practice you might need a more sophisticated approach
    const addressBytes = new Uint8Array(32);
    const addressHex = address.slice(2); // Remove '0x' prefix
    
    for (let i = 0; i < addressHex.length; i += 2) {
      addressBytes[i / 2] = parseInt(addressHex.substr(i, 2), 16);
    }
    
    return Principal.fromUint8Array(addressBytes);
  }

  /**
   * Convert Principal to Ethereum address (if needed)
   */
  static principalToEthereumAddress(principal: Principal): string {
    const bytes = principal.toUint8Array();
    const addressBytes = bytes.slice(0, 20); // Take first 20 bytes
    return '0x' + Array.from(addressBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export default ICPService; 