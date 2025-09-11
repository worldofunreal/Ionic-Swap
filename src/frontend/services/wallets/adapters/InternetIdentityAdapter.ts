import type { WalletAdapter, CrossChainAuthResult } from '../types'
import { CrossChainSeedService } from '../../CrossChainSeedService'
import { AuthClient } from '@dfinity/auth-client'

export class InternetIdentityAdapter implements WalletAdapter {
  type = 'internet-identity' as const
  capabilities = { icp: true, evm: false, sol: false, btc: false }

  private async createAuthClient(): Promise<AuthClient> {
    return await AuthClient.create({
      idleOptions: {
        disableDefaultIdleCallback: true,
        disableIdle: true,
      },
    })
  }

  private async authenticateWithII(): Promise<string> {
    const authClient = await this.createAuthClient()
    
    return new Promise((resolve, reject) => {
      authClient.login({
        identityProvider: 'https://identity.ic0.app', // Always use mainnet
        onSuccess: () => {
          const identity = authClient.getIdentity()
          const principal = identity.getPrincipal().toText()
          resolve(principal)
        },
        onError: (error) => {
          reject(new Error(`Internet Identity authentication failed: ${error}`))
        },
      })
    })
  }

  async authenticate(): Promise<CrossChainAuthResult> {
    try {
      // 1. Get ICP principal (native)
      const principal = await this.authenticateWithII()

      // 2. Generate seed from principal
      const seed = await CrossChainSeedService.fromPrincipal(principal)

      // 3. Generate EVM and SOL addresses from ICP principal
                   const [evmAddress, solAddress, btcAddress] = await Promise.all([
               CrossChainSeedService.toEvmAddress(seed),
               CrossChainSeedService.toSolAddress(seed),
               CrossChainSeedService.toBtcAddress(seed)
             ])

      return {
        principal, // Native ICP principal
        evmAddress, // Generated from ICP principal
        solAddress, // Generated from ICP principal
        btcAddress, // Generated from ICP principal
        nativeWallet: 'internet-identity'
      }
    } catch (error) {
      throw new Error(`Internet Identity authentication failed: ${error}`)
    }
  }
}
