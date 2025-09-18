import type { WalletAdapter, CrossChainAuthResult } from '../types'
import { CrossChainSeedService } from '../../CrossChainSeedService'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  selectedAddress?: string
  isConnected: () => boolean
  on: (event: string, callback: (data: unknown) => void) => void
  isRabby?: boolean
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
    return typeof window.ethereum !== 'undefined' && window.ethereum.isRabby === true
  }

  private async getEthereumAddress(): Promise<string> {
    if (!(await this.isRabbyInstalled())) {
      throw new Error('Rabby wallet is not installed')
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })

    if (!accounts || accounts.length === 0) {
      throw new Error('Rabby wallet is locked or no accounts found')
    }

    return accounts[0]
  }

  private async signMessage(message: string, address: string): Promise<string> {
    if (!(await this.isRabbyInstalled())) {
      throw new Error('Rabby wallet is not installed')
    }

    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    })

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
