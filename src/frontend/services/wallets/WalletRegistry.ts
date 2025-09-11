import type { WalletAdapter, WalletType, WalletCapabilities } from './types'
import { MetaMaskAdapter } from './adapters/MetaMaskAdapter'
import { PhantomAdapter } from './adapters/PhantomAdapter'
import { InternetIdentityAdapter } from './adapters/InternetIdentityAdapter'
import { PlugAdapter } from './adapters/PlugAdapter'

const adapters = new Map<WalletType, WalletAdapter>()

// Register all available wallet adapters
adapters.set('metamask', new MetaMaskAdapter())
adapters.set('phantom', new PhantomAdapter())
adapters.set('internet-identity', new InternetIdentityAdapter())
adapters.set('plug', new PlugAdapter())

export const WalletRegistry = {
  register(adapter: WalletAdapter): void {
    adapters.set(adapter.type, adapter)
  },

  getAdapter(type: WalletType): WalletAdapter {
    const adapter = adapters.get(type)
    if (!adapter) {
      throw new Error(`Wallet adapter not found for type: ${type}`)
    }
    return adapter
  },

  getAvailableWallets(): WalletAdapter[] {
    return Array.from(adapters.values())
  },

  getCapabilities(type: WalletType): WalletCapabilities {
    const adapter = this.getAdapter(type)
    return adapter.capabilities
  },

  isWalletAvailable(type: WalletType): boolean {
    return adapters.has(type)
  },

  getWalletsByCapability(
    capability: keyof WalletCapabilities
  ): WalletAdapter[] {
    return this.getAvailableWallets().filter(
      adapter => adapter.capabilities[capability]
    )
  },

  // Get wallets that can sign on a specific chain
  getWalletsForChain(chain: 'icp' | 'evm' | 'sol'): WalletAdapter[] {
    return this.getWalletsByCapability(chain)
  },
}
