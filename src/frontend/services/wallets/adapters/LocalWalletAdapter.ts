import type { WalletAdapter, CrossChainAuthResult } from '../types'
import { CrossChainSeedService } from '../../CrossChainSeedService'

export class LocalWalletAdapter implements WalletAdapter {
  type = 'local' as const
  capabilities = { icp: true, evm: true, sol: true, btc: true }

  private generateRandomSeed(): string {
    // Generate a cryptographically secure random seed
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    
    // Convert to hex string
    const hexString = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return hexString
  }

  async authenticate(): Promise<CrossChainAuthResult> {
    try {
      console.log('Starting local wallet authentication...')

      // 1. Generate a random seed locally
      const randomSeed = this.generateRandomSeed()
      console.log('Generated random seed:', randomSeed.substring(0, 16) + '...')

      // 2. Create a deterministic signature from the seed for consistency
      const signature = `local-wallet-signature-${randomSeed}`
      console.log('Created deterministic signature from seed')

      // 3. Generate seed from signature (this will be consistent for the same random seed)
      const seed = await CrossChainSeedService.fromSignature(signature)
      console.log('Generated cross-chain seed from signature')

      // 4. Generate all cross-chain addresses from the seed
      const [principal, evmAddress, solAddress, btcAddress] = await Promise.all([
        CrossChainSeedService.toIcpPrincipal(seed),
        CrossChainSeedService.toEvmAddress(seed),
        CrossChainSeedService.toSolAddress(seed),
        CrossChainSeedService.toBtcAddress(seed),
      ])

      console.log('Generated cross-chain addresses from local seed:', {
        principal,
        evmAddress,
        solAddress,
        btcAddress,
      })

      return {
        principal,
        evmAddress,
        solAddress,
        btcAddress,
        nativeWallet: 'local',
        signature,
      }
    } catch (error) {
      console.error('Local wallet authentication error:', error)
      throw new Error(`Local wallet authentication failed: ${error}`)
    }
  }
}
