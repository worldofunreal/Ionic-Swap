import type { WalletAdapter, CrossChainAuthResult } from '../types'
import { CrossChainSeedService } from '../../CrossChainSeedService'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  selectedAddress?: string
  isConnected: () => boolean
  on: (event: string, callback: (data: unknown) => void) => void
  isMetaMask?: boolean
  isRabby?: boolean
  providers?: EthereumProvider[]
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export class RabbyAdapter implements WalletAdapter {
  type = 'rabby' as const
  capabilities = { icp: false, evm: true, sol: false, btc: false }

  private async isRabbyInstalled(): Promise<boolean> {
    if (typeof window.ethereum === 'undefined') {
      return false
    }

    const ethereum = window.ethereum as any
    
    // Handle multi-provider setup (EIP-1193)
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      return ethereum.providers.some((provider: any) => provider.isRabby)
    }
    
    // Single provider case - check if it's Rabby
    return ethereum.isRabby === true
  }

  private async getRabbyProvider(): Promise<EthereumProvider> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('No Ethereum provider found')
    }

    const ethereum = window.ethereum as any
    
    // Handle multi-provider setup
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      const rabbyProvider = ethereum.providers.find((provider: any) => provider.isRabby)
      if (rabbyProvider) {
        return rabbyProvider
      }
    }
    
    // Single provider case
    if (ethereum.isRabby) {
      return ethereum
    }

    throw new Error('Rabby wallet is not installed')
  }

  private async getEthereumAddress(): Promise<string> {
    if (!(await this.isRabbyInstalled())) {
      throw new Error('Rabby wallet is not installed')
    }

    const provider = await this.getRabbyProvider()

    const accounts = await provider.request({
      method: 'eth_requestAccounts',
    }) as string[]

    if (!accounts || accounts.length === 0) {
      throw new Error('Rabby wallet is locked or no accounts found')
    }

    return accounts[0]!
  }

  private async signMessage(message: string, address: string): Promise<string> {
    if (!(await this.isRabbyInstalled())) {
      throw new Error('Rabby wallet is not installed')
    }

    const provider = await this.getRabbyProvider()

    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, address],
    }) as string

    return signature
  }

  async authenticate(): Promise<CrossChainAuthResult> {
    try {
      const evmAddress = await this.getEthereumAddress()
      // 2. Sign a deterministic message to create a secret signature
      const message = `Login to Ionic Swap - Rabby - ${evmAddress}`
      const signature = await this.signMessage(message, evmAddress)
      console.log('Signed message with Rabby wallet')
      const seed = await CrossChainSeedService.fromSignature(signature)

      const [principal, solAddress, btcAddress] = await Promise.all([
        CrossChainSeedService.toIcpPrincipal(seed),
        CrossChainSeedService.toSolAddress(seed),
        CrossChainSeedService.toBtcAddress(seed),
      ])

      return {
        principal,
        evmAddress,
        solAddress,
        btcAddress,
        nativeWallet: 'rabby',
        signature,
      }
    } catch {
      throw new Error(`Rabby wallet authentication canceled`)
    }
  }
}
