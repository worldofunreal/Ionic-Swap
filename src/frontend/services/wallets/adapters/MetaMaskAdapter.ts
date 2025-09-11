import type { WalletAdapter, CrossChainAuthResult } from '../types'
import { CrossChainSeedService } from '../../CrossChainSeedService'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  selectedAddress?: string
  isConnected: () => boolean
  on: (event: string, callback: (data: unknown) => void) => void
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
    return typeof window.ethereum !== 'undefined'
  }

  private async getEthereumAddress(): Promise<string> {
    if (!(await this.isMetaMaskInstalled())) {
      throw new Error('MetaMask is not installed')
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })

    if (!accounts || accounts.length === 0) {
      throw new Error('MetaMask is locked or no accounts found')
    }

    return accounts[0]
  }

  private async signMessage(message: string, address: string): Promise<string> {
    if (!(await this.isMetaMaskInstalled())) {
      throw new Error('MetaMask is not installed')
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
      const message = `Login to NFTropoly - MetaMask - ${evmAddress}`
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
