import type { WalletAdapter, CrossChainAuthResult } from '../types'
import { CrossChainSeedService } from '../../CrossChainSeedService'
import * as bip39 from 'bip39'

export class LocalWalletAdapter implements WalletAdapter {
  type = 'local' as const
  capabilities = { icp: true, evm: true, sol: true, btc: true }

  private generateRandomMnemonic(): string {
    // Generate a completely random 12-word mnemonic using bip39
    const mnemonic = bip39.generateMnemonic(128) // 128 bits = 12 words
    console.log('Generated new random Ionic wallet mnemonic')
    return mnemonic
  }

  async authenticate(): Promise<CrossChainAuthResult> {
    try {
      console.log('Starting local wallet authentication...')

      // 1. Generate a completely random BIP39 mnemonic
      const mnemonic = this.generateRandomMnemonic()
      console.log('Using Ionic wallet mnemonic:', mnemonic.split(' ').slice(0, 3).join(' ') + '...')

      // 2. Generate addresses directly from mnemonic (same as recovery flow)
      const recovered = await CrossChainSeedService.fromMnemonic(mnemonic)
      console.log('Generated cross-chain addresses from mnemonic:', {
        principal: recovered.principal,
        evmAddress: recovered.evmAddress,
        solAddress: recovered.solAddress,
        btcAddress: recovered.btcAddress,
      })

      // 3. Create signature for session storage compatibility
      const signature = `local-wallet-mnemonic-${mnemonic}`
      console.log('Created signature for session storage')

      return {
        principal: recovered.principal,
        evmAddress: recovered.evmAddress,
        solAddress: recovered.solAddress,
        btcAddress: recovered.btcAddress,
        nativeWallet: 'local',
        signature,
        mnemonic, // Add mnemonic to result for storage
      }
    } catch (error) {
      console.error('Local wallet authentication error:', error)
      throw new Error(`Local wallet authentication failed: ${error}`)
    }
  }
}