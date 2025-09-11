import type { WalletAdapter, CrossChainAuthResult } from '../types'
import { CrossChainSeedService } from '../../CrossChainSeedService'

declare global {
  interface Window {
    solana?: any
    phantom?: {
      ethereum?: {
        isPhantom: boolean
        request: (args: { method: string; params?: any[] }) => Promise<any>
        selectedAddress?: string
        isConnected: () => boolean
        on: (event: string, callback: (data: any) => void) => void
      }
      bitcoin?: {
        isPhantom: boolean
        requestAccounts: () => Promise<BtcAccount[]>
        signMessage: (address: string, message: Uint8Array) => Promise<{ signature: Uint8Array }>
        signPSBT: (psbt: Uint8Array, options: any) => Promise<Uint8Array>
        on: (event: string, callback: (data: any) => void) => void
      }
    }
    ethereum?: any
  }
}

type BtcAccount = {
  address: string
  addressType: "p2tr" | "p2wpkh" | "p2sh" | "p2pkh"
  publicKey: string
  purpose: "payment" | "ordinals"
}

export class PhantomAdapter implements WalletAdapter {
  type = 'phantom' as const
  capabilities = { icp: false, evm: true, sol: true, btc: true }

  private async isPhantomInstalled(): Promise<boolean> {
    return !!(window.solana && window.solana.isPhantom)
  }

  private async connectWallet(): Promise<string> {
    if (!(await this.isPhantomInstalled())) {
      throw new Error('Phantom wallet is not installed')
    }

    try {
      const response = await window.solana.connect()
      return response.publicKey.toString()
    } catch {
      throw new Error('Could not connect to Phantom Wallet')
    }
  }

  private async signMessage(message: string): Promise<Uint8Array> {
    if (!window.solana || !window.solana.isConnected) {
      await this.connectWallet()
    }

    try {
      const encodedMessage = new TextEncoder().encode(message)
      const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8')
      return signedMessage.signature
    } catch {
      throw new Error('Error signing message with Phantom Wallet')
    }
  }

  private async getEvmAddress(): Promise<string | undefined> {
    try {
      console.log('Checking Phantom EVM capabilities...')
      
      // Check for Phantom's EVM provider
      const phantomProvider = window.phantom?.ethereum
      const ethereumProvider = window.ethereum
      
      console.log('window.phantom.ethereum:', phantomProvider)
      console.log('window.ethereum:', ethereumProvider)
      
      // Try Phantom's dedicated EVM provider first
      if (phantomProvider?.isPhantom) {
        console.log('Found Phantom EVM provider')
        try {
          // Request accounts to get the EVM address
          const accounts = await phantomProvider.request({ 
            method: "eth_requestAccounts" 
          })
          console.log('Phantom EVM accounts:', accounts)
          return accounts[0] || undefined
        } catch (error) {
          console.log('Phantom EVM connection failed:', error)
        }
      }
      
      // Try window.ethereum if it's Phantom
      if (ethereumProvider?.isPhantom) {
        console.log('Found Phantom as default EVM provider')
        try {
          const accounts = await ethereumProvider.request({ 
            method: "eth_requestAccounts" 
          })
          console.log('Default EVM accounts:', accounts)
          return accounts[0] || undefined
        } catch (error) {
          console.log('Default EVM connection failed:', error)
        }
      }
      
      console.log('No Phantom EVM provider found')
      return undefined
    } catch (error) {
      console.error('Error getting Phantom EVM address:', error)
      return undefined
    }
  }

  private async getBtcAddress(): Promise<string | undefined> {
    try {
      console.log('Checking Phantom Bitcoin capabilities...')
      
      // Check for Phantom's Bitcoin provider
      const bitcoinProvider = window.phantom?.bitcoin
      
      console.log('window.phantom.bitcoin:', bitcoinProvider)
      
      if (bitcoinProvider?.isPhantom) {
        console.log('Found Phantom Bitcoin provider')
        try {
          // Request accounts to get Bitcoin addresses
          const accounts = await bitcoinProvider.requestAccounts()
          console.log('Phantom Bitcoin accounts:', accounts)
          
          // Return the first payment address, or first address if no payment address found
          const paymentAddress = accounts.find(account => account.purpose === 'payment')
          const firstAddress = accounts[0]
          
          const selectedAddress = paymentAddress?.address || firstAddress?.address
          console.log('Selected Bitcoin address:', selectedAddress)
          
          return selectedAddress || undefined
        } catch (error) {
          console.log('Phantom Bitcoin connection failed:', error)
        }
      }
      
      console.log('No Phantom Bitcoin provider found')
      return undefined
    } catch (error) {
      console.error('Error getting Phantom Bitcoin address:', error)
      return undefined
    }
  }

  async authenticate(): Promise<CrossChainAuthResult> {
    try {
      // 1. Connect to Phantom and get native SOL address
      const solAddress = await this.connectWallet()
      console.log('Got Phantom SOL address:', solAddress)

      // 2. Sign a deterministic message to create a secret signature
      const message = `Login to NFTropoly - Phantom - ${solAddress}`
      const signature = await this.signMessage(message)
      console.log('Signed message with Phantom')

      // 3. Generate seed from signature (SECURE - only Phantom can create this)
      const seed = await CrossChainSeedService.fromSignature(signature.toString())
      console.log('Generated seed from signature')

      // 4. Generate all cross-chain addresses from the secret signature
      const [principal, evmAddress, generatedSolAddress, btcAddress] = await Promise.all([
        CrossChainSeedService.toIcpPrincipal(seed),
        CrossChainSeedService.toEvmAddress(seed),
        CrossChainSeedService.toSolAddress(seed),
        CrossChainSeedService.toBtcAddress(seed)
      ])
      console.log('Generated cross-chain addresses from signature:', { 
        principal, 
        evmAddress, 
        generatedSolAddress,
        btcAddress,
        nativeSolAddress: solAddress
      })

      // 5. Try to get native EVM address if Phantom supports it
      let nativeEvmAddress: string | undefined
      try {
        const evmResult = await this.getEvmAddress()
        nativeEvmAddress = evmResult || undefined
        console.log('Got native Phantom EVM address:', nativeEvmAddress)
      } catch (error) {
        console.log('Phantom EVM not available, using generated EVM address')
      }

      // 6. Try to get native Bitcoin address if Phantom supports it
      let nativeBtcAddress: string | undefined
      try {
        const btcResult = await this.getBtcAddress()
        nativeBtcAddress = btcResult || undefined
        console.log('Got native Phantom Bitcoin address:', nativeBtcAddress)
      } catch (error) {
        console.log('Phantom Bitcoin not available, using generated Bitcoin address')
      }

      console.log('Final cross-chain addresses:', { 
        principal, 
        evmAddress: nativeEvmAddress || evmAddress, 
        solAddress, 
        btcAddress: nativeBtcAddress || btcAddress
      })

      return {
        principal, // Generated from signature (secure)
        evmAddress: nativeEvmAddress || evmAddress, // Prefer native, fallback to generated
        solAddress: solAddress, // Use native SOL address (Phantom's strength)
        btcAddress: nativeBtcAddress || btcAddress, // Prefer native, fallback to generated
        nativeWallet: 'phantom',
        signature: signature.toString() // The secret signature
      }
    } catch (error) {
      console.error('Phantom authentication error:', error)
      throw new Error(`Phantom authentication failed: ${error}`)
    }
  }
}
