import type { WalletAdapter, CrossChainAuthResult } from '../types'
import { CrossChainSeedService } from '../../CrossChainSeedService'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  selectedAddress?: string
  isConnected: () => boolean
  on: (event: string, callback: (data: unknown) => void) => void
}

interface MagicEdenEthereumProvider extends EthereumProvider {
  isMagicEden: boolean
}

interface SolanaProvider {
  connect: () => Promise<{ publicKey: { toBase58(): string } }>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
  isConnected: boolean
  publicKey?: { toBase58(): string }
}

interface MagicEdenSolanaProvider extends SolanaProvider {
  isMagicEden: boolean
}

interface MagicEdenBitcoinProvider {
  isMagicEden: boolean
  requestAccounts: () => Promise<BtcAccount[]>
  connect: (request: string) => Promise<{ addresses: BtcAccount[] }>
  signMessage: (
    address: string,
    message: Uint8Array
  ) => Promise<{ signature: Uint8Array }>
  signPSBT: (
    psbt: Uint8Array,
    options: Record<string, unknown>
  ) => Promise<Uint8Array>
  on: (event: string, callback: (data: unknown) => void) => void
}

declare global {
  interface Window {
    magicEden?: {
      ethereum?: MagicEdenEthereumProvider
      solana?: MagicEdenSolanaProvider
      bitcoin?: MagicEdenBitcoinProvider
    }
  }
}

type BtcAccount = {
  address: string
  addressType: 'p2tr' | 'p2wpkh' | 'p2sh' | 'p2pkh'
  publicKey: string
  purpose: 'payment' | 'ordinals'
}

export class MagicEdenAdapter implements WalletAdapter {
  type = 'magic-eden' as const
  capabilities = { icp: false, evm: true, sol: true, btc: true }

  private async isMagicEdenInstalled(): Promise<boolean> {
    return !!(window.magicEden && (window.magicEden.ethereum?.isMagicEden || window.magicEden.solana?.isMagicEden))
  }

  private async connectSolanaWallet(): Promise<string> {
    if (!(await this.isMagicEdenInstalled())) {
      throw new Error('Magic Eden wallet is not installed')
    }

    try {
      // Try Magic Eden's dedicated Solana provider first
      if (window.magicEden?.solana?.isMagicEden) {
        const response = await window.magicEden.solana.connect()
        return response.publicKey.toString()
      }
      
      // Fallback to window.solana if it's Magic Eden
      if (window.solana && (window.solana as any)?.isMagicEden) {
        const response = await window.solana.connect()
        return response.publicKey.toString()
      }

      throw new Error('Magic Eden Solana provider not found')
    } catch {
      throw new Error('Could not connect to Magic Eden Wallet')
    }
  }

  private async signMessage(message: string): Promise<Uint8Array> {
    if (!(await this.isMagicEdenInstalled())) {
      throw new Error('Magic Eden wallet is not installed')
    }

    try {
      const encodedMessage = new TextEncoder().encode(message)
      
      // Try Magic Eden's dedicated Solana provider first
      if (window.magicEden?.solana?.isMagicEden) {
        if (!window.magicEden.solana.isConnected) {
          await this.connectSolanaWallet()
        }
        const signedMessage = await window.magicEden.solana.signMessage(
          encodedMessage
        )
        return signedMessage.signature
      }
      
      // Fallback to window.solana if it's Magic Eden
      if (window.solana && (window.solana as any)?.isMagicEden) {
        if (!window.solana.isConnected) {
          await this.connectSolanaWallet()
        }
        const signedMessage = await window.solana.signMessage(
          encodedMessage
        )
        return signedMessage.signature
      }

      throw new Error('Magic Eden Solana provider not found')
    } catch {
      throw new Error('Error signing message with Magic Eden Wallet')
    }
  }

  private async getEvmAddress(): Promise<string | undefined> {
    try {
      console.log('Checking Magic Eden EVM capabilities...')

      // Check for Magic Eden's EVM provider
      const magicEdenProvider = window.magicEden?.ethereum
      const ethereumProvider = window.ethereum

      console.log('window.magicEden.ethereum:', magicEdenProvider)
      console.log('window.ethereum:', ethereumProvider)

      // Try Magic Eden's dedicated EVM provider first
      if (magicEdenProvider?.isMagicEden) {
        console.log('Found Magic Eden EVM provider')
        try {
          // Request accounts to get the EVM address
          const accounts = await magicEdenProvider.request({
            method: 'eth_requestAccounts',
          })
          console.log('Magic Eden EVM accounts:', accounts)
          return (accounts as string[])[0] || undefined
        } catch (error) {
          console.log('Magic Eden EVM connection failed:', error)
        }
      }

      // Try window.ethereum if it's Magic Eden
      if (ethereumProvider && (ethereumProvider as any)?.isMagicEden) {
        console.log('Found Magic Eden as default EVM provider')
        try {
          const accounts = await ethereumProvider.request({
            method: 'eth_requestAccounts',
          })
          console.log('Default EVM accounts:', accounts)
          return (accounts as string[])[0] || undefined
        } catch (error) {
          console.log('Default EVM connection failed:', error)
        }
      }

      console.log('No Magic Eden EVM provider found')
      return undefined
    } catch (error) {
      console.error('Error getting Magic Eden EVM address:', error)
      return undefined
    }
  }

  private async getBtcAddress(): Promise<string | undefined> {
    try {
      console.log('Checking Magic Eden Bitcoin capabilities...')

      // Check for Magic Eden's Bitcoin provider
      const bitcoinProvider = window.magicEden?.bitcoin

      console.log('window.magicEden.bitcoin:', bitcoinProvider)

      if (bitcoinProvider?.isMagicEden) {
        console.log('Found Magic Eden Bitcoin provider')
        try {
          // According to Magic Eden docs, we should try the direct requestAccounts first
          // and only use the sats-connect format if that doesn't work
          console.log('Trying direct requestAccounts method first...')
          
          try {
            const accounts = await bitcoinProvider.requestAccounts()
            console.log('Direct requestAccounts response:', accounts)
            
            if (accounts && Array.isArray(accounts) && accounts.length > 0) {
              // Success with direct method, use these accounts
              const addresses = accounts
              console.log('Bitcoin addresses from requestAccounts:', addresses)

              // Log all addresses for debugging
              addresses.forEach((addr, index) => {
                console.log(`Bitcoin Address ${index}:`, {
                  address: addr.address,
                  addressType: addr.addressType,
                  purpose: addr.purpose
                })
              })

              // Find payment address (native segwit for BTC transactions)
              const paymentAddress = addresses.find(
                addr => addr.purpose === 'payment'
              )
              
              if (paymentAddress) {
                console.log('Selected payment address:', paymentAddress.address, `(${paymentAddress.addressType})`)
                return paymentAddress.address
              }

              // Fallback to ordinals address if no payment address
              const ordinalsAddress = addresses.find(
                addr => addr.purpose === 'ordinals'
              )
              
              if (ordinalsAddress) {
                console.log('Using ordinals address as fallback:', ordinalsAddress.address, `(${ordinalsAddress.addressType})`)
                return ordinalsAddress.address
              }

              // Last resort: use first address
              const firstAddress = addresses[0]
              if (firstAddress?.address) {
                console.log('Using first address as fallback:', firstAddress.address, `(${firstAddress.addressType})`)
                return firstAddress.address
              }
            }
          } catch (directError) {
            console.log('Direct requestAccounts failed, trying sats-connect format:', directError)
            
            // Fall back to sats-connect format
            const payload = {
              purposes: ['payment', 'ordinals'],
              message: 'Address for receiving Bitcoin payments and ordinals',
              network: {
                type: 'Mainnet',
              },
            }

            // Create proper JWT token format
            const header = { typ: 'JWT', alg: 'none' }
            const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '')
            const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '')
            const request = `${encodedHeader}.${encodedPayload}.`

            console.log('Trying sats-connect format with token:', request.substring(0, 50) + '...')
            
            const response = await bitcoinProvider.connect(request)
            console.log('Magic Eden Bitcoin connect response:', response)

            if (response && response.addresses && Array.isArray(response.addresses)) {
              const addresses = response.addresses
              console.log('Bitcoin addresses from connect:', addresses)

              // Same address selection logic as above
              const paymentAddress = addresses.find(addr => addr.purpose === 'payment')
              if (paymentAddress) {
                console.log('Selected payment address:', paymentAddress.address, `(${paymentAddress.addressType})`)
                return paymentAddress.address
              }

              const ordinalsAddress = addresses.find(addr => addr.purpose === 'ordinals')
              if (ordinalsAddress) {
                console.log('Using ordinals address as fallback:', ordinalsAddress.address, `(${ordinalsAddress.addressType})`)
                return ordinalsAddress.address
              }

              const firstAddress = addresses[0]
              if (firstAddress?.address) {
                console.log('Using first address as fallback:', firstAddress.address, `(${firstAddress.addressType})`)
                return firstAddress.address
              }
            }
          }

          console.log('Both methods failed or returned no addresses')
          return undefined
        } catch (error) {
          console.log('Magic Eden Bitcoin connection failed:', error)
          console.error('Bitcoin connection error details:', error)
          
          // Check for user rejection
          if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as Error).message.toLowerCase()
            if (errorMessage.includes('user rejected') || errorMessage.includes('cancelled')) {
              console.log('User rejected Bitcoin connection request')
            } else if (errorMessage.includes('already pending')) {
              console.log('Bitcoin connection request already pending')
            }
          }
          
          return undefined
        }
      }

      console.log('No Magic Eden Bitcoin provider found')
      return undefined
    } catch (error) {
      console.error('Error getting Magic Eden Bitcoin address:', error)
      return undefined
    }
  }

  async authenticate(): Promise<CrossChainAuthResult> {
    try {
      // 1. Connect to Magic Eden and get native SOL address
      const solAddress = await this.connectSolanaWallet()
      console.log('Got Magic Eden SOL address:', solAddress)

      // 2. Sign a deterministic message to create a secret signature
      const message = `Login to Ionic Swap - Magic Eden - ${solAddress}`
      const signature = await this.signMessage(message)
      console.log('Signed message with Magic Eden')

      // 3. Generate seed from signature (SECURE - only Magic Eden can create this)
      const seed = await CrossChainSeedService.fromSignature(
        signature.toString()
      )
      console.log('Generated seed from signature')

      // 4. Generate all cross-chain addresses from the secret signature
      const [principal, evmAddress, generatedSolAddress, btcAddress] =
        await Promise.all([
          CrossChainSeedService.toIcpPrincipal(seed),
          CrossChainSeedService.toEvmAddress(seed),
          CrossChainSeedService.toSolAddress(seed),
          CrossChainSeedService.toBtcAddress(seed),
        ])
      console.log('Generated cross-chain addresses from signature:', {
        principal,
        evmAddress,
        generatedSolAddress,
        btcAddress,
        nativeSolAddress: solAddress,
      })

      // 5. Try to get native EVM address if Magic Eden supports it
      let nativeEvmAddress: string | undefined
      try {
        const evmResult = await this.getEvmAddress()
        nativeEvmAddress = evmResult || undefined
        console.log('Got native Magic Eden EVM address:', nativeEvmAddress)
      } catch {
        console.log('Magic Eden EVM not available, using generated EVM address')
      }

      // 6. Try to get native Bitcoin address if Magic Eden supports it
      let nativeBtcAddress: string | undefined
      try {
        const btcResult = await this.getBtcAddress()
        nativeBtcAddress = btcResult || undefined
        console.log('Got native Magic Eden Bitcoin address:', nativeBtcAddress)
      } catch {
        console.log(
          'Magic Eden Bitcoin not available, using generated Bitcoin address'
        )
      }

      console.log('Final cross-chain addresses:', {
        principal,
        evmAddress: nativeEvmAddress || evmAddress,
        solAddress,
        btcAddress: nativeBtcAddress || btcAddress,
      })

      return {
        principal, // Generated from signature (secure)
        evmAddress: nativeEvmAddress || evmAddress, // Prefer native, fallback to generated
        solAddress: solAddress, // Use native SOL address (Magic Eden's strength)
        btcAddress: nativeBtcAddress || btcAddress, // Prefer native, fallback to generated
        nativeWallet: 'magic-eden',
        signature: signature.toString(), // The secret signature
      }
    } catch (error) {
      console.error('Magic Eden authentication error:', error)
      throw new Error(`Magic Eden authentication failed: ${error}`)
    }
  }
}
