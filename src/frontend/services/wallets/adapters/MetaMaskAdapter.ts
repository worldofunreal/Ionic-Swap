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

export class MetaMaskAdapter implements WalletAdapter {
  type = 'metamask' as const
  capabilities = { icp: false, evm: true, sol: false, btc: false }

  private async isMetaMaskInstalled(): Promise<boolean> {
    if (typeof window.ethereum === 'undefined') {
      return false
    }

    const ethereum = window.ethereum as any
    
    // Handle multi-provider setup (EIP-1193)
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      return ethereum.providers.some((provider: any) => provider.isMetaMask)
    }
    
    // Single provider case - check if it's MetaMask
    return ethereum.isMetaMask === true
  }

  private async getMetaMaskProvider(): Promise<EthereumProvider> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('No Ethereum provider found')
    }

    const ethereum = window.ethereum as any
    
    // Handle multi-provider setup (EIP-1193)
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      const metaMaskProvider = ethereum.providers.find((provider: any) => provider.isMetaMask)
      if (metaMaskProvider) {
        return metaMaskProvider
      }
    }
    
    // Single provider case
    if (ethereum.isMetaMask) {
      return ethereum
    }

    throw new Error('MetaMask provider not found')
  }

  private async getEthereumAddress(): Promise<string> {
    if (!(await this.isMetaMaskInstalled())) {
      throw new Error('MetaMask is not installed')
    }

    const provider = await this.getMetaMaskProvider()

    const accounts = await provider.request({
      method: 'eth_requestAccounts',
    }) as string[]

    if (!accounts || accounts.length === 0) {
      throw new Error('MetaMask is locked or no accounts found')
    }

    return accounts[0]!
  }

  private async signMessage(message: string, address: string): Promise<string> {
    if (!(await this.isMetaMaskInstalled())) {
      throw new Error('MetaMask is not installed')
    }

    const provider = await this.getMetaMaskProvider()

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
      const message = `Login to Ionic Swap - MetaMask - ${evmAddress}`
      const signature = await this.signMessage(message, evmAddress)
      console.log('Signed message with MetaMask')
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
        nativeWallet: 'metamask',
        signature,
      }
    } catch {
      throw new Error(`MetaMask authentication canceled`)
    }
  }
}
