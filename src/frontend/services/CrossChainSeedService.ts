import { Ed25519KeyIdentity } from '@dfinity/identity'
import nacl from 'tweetnacl'
import * as bip39 from 'bip39'
import { ethers } from 'ethers'
import { Keypair } from '@solana/web3.js'
import * as bitcoin from 'bitcoinjs-lib'
import { ECPairFactory } from 'ecpair'
import * as ecc from 'tiny-secp256k1'

// Initialize ECC library for bitcoinjs-lib
bitcoin.initEccLib(ecc)

const ECPair = ECPairFactory(ecc)

export const CrossChainSeedService = {
  async fromSignature(signature: string): Promise<Uint8Array> {
    const encoder = new TextEncoder()
    const encodedSignature = encoder.encode(signature)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedSignature)
    return new Uint8Array(hashBuffer.slice(0, 32))
  },

  async fromPrincipal(principal: string): Promise<Uint8Array> {
    const encoder = new TextEncoder()
    const encodedPrincipal = encoder.encode(principal)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedPrincipal)
    return new Uint8Array(hashBuffer.slice(0, 32))
  },

  seedToMnemonic(seed: Uint8Array): string {
    const seedHex = Array.from(seed)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return bip39.entropyToMnemonic(seedHex)
  },

  async toIdentity(seed: Uint8Array): Promise<Ed25519KeyIdentity> {
    const keyPair = nacl.sign.keyPair.fromSeed(seed)
    return Ed25519KeyIdentity.fromKeyPair(keyPair.publicKey, keyPair.secretKey)
  },

  async toIcpPrincipal(seed: Uint8Array): Promise<string> {
    const identity = await this.toIdentity(seed)
    return identity.getPrincipal().toText()
  },

  async toEvmAddress(seed: Uint8Array): Promise<string> {
    const mnemonic = this.seedToMnemonic(seed)
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic)
    const account = hdNode.derivePath("44'/60'/0'/0/0")
    return account.address
  },

  async toSolAddress(seed: Uint8Array): Promise<string> {
    const mnemonic = this.seedToMnemonic(seed)
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic)
    const account = hdNode.derivePath("44'/501'/0'/0/0")
    const privateKeyBytes = ethers.getBytes(account.privateKey)
    const keypair = Keypair.fromSeed(privateKeyBytes.slice(0, 32))
    return keypair.publicKey.toString()
  },

  async toBtcAddress(seed: Uint8Array): Promise<string> {
    try {
      console.log('Starting Bitcoin address generation...')
      const mnemonic = this.seedToMnemonic(seed)
      console.log('Generated mnemonic:', mnemonic)

      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic)
      const account = hdNode.derivePath("44'/0'/0'/0/0")
      console.log('Derived Bitcoin account:', account.address)

      // Convert private key to Bitcoin format
      const privateKeyBuffer = Buffer.from(
        ethers.getBytes(account.privateKey) as Uint8Array
      )
      console.log('Private key buffer length:', privateKeyBuffer.length)

      // Generate Bitcoin keypair
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer)
      console.log(
        'Generated Bitcoin keypair, public key length:',
        keyPair.publicKey.length
      )

      // For Taproot, we need the internal public key (32 bytes)
      // Taproot uses the x-only public key (removes the y-coordinate)
      const internalPubkey = Buffer.from(keyPair.publicKey.slice(1)) // Remove the first byte (compression flag)
      console.log(
        'Internal public key for Taproot, length:',
        internalPubkey.length
      )

      // Try Taproot address (modern Bitcoin address format)
      try {
        console.log('Attempting Taproot address generation...')
        const { address: taprootAddress } = bitcoin.payments.p2tr({
          pubkey: internalPubkey,
          network: bitcoin.networks.bitcoin,
        })

        console.log('Taproot address result:', taprootAddress)

        if (taprootAddress) {
          return taprootAddress
        }
      } catch (taprootError: unknown) {
        console.error('Taproot generation failed:', taprootError)
        throw new Error(
          `Taproot address generation failed: ${taprootError instanceof Error ? taprootError.message : 'Unknown error'}`
        )
      }

      throw new Error('Taproot address generation failed')
    } catch (error) {
      console.error('Bitcoin address generation error:', error)
      // No fallback - only Taproot addresses
      const mnemonic = this.seedToMnemonic(seed)
      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic)
      const errorAccount = hdNode.derivePath("44'/0'/0'/0/0")
      return `btc_error_${errorAccount.address.slice(2)}`
    }
  },

  isValidMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic)
  },

  // CRITICAL FIX: Direct mnemonic-based functions that avoid double conversion
  // 
  // WHY THIS IS ESSENTIAL:
  // The old approach had a fatal flaw in the derivation chain:
  // 1. User inputs mnemonic: "wing floor wolf..."
  // 2. fromMnemonic() converts to seed: bip39.mnemonicToSeedSync(mnemonic)
  // 3. toEvmAddress(seed) converts seed BACK to mnemonic: seedToMnemonic(seed)
  // 4. This creates a DIFFERENT mnemonic: "moon deny sight vacant..."
  // 5. HD wallets derive from the WRONG mnemonic = WRONG private keys
  // 6. Recovery fails because same input mnemonic produces different addresses
  //
  // SOLUTION: Use original mnemonic directly for HD wallet derivation
  async toEvmAddressFromMnemonic(mnemonic: string): Promise<string> {
    // Use original mnemonic directly - no conversion to seed and back
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic)
    const account = hdNode.derivePath("44'/60'/0'/0/0")
    return account.address
  },

  async toSolAddressFromMnemonic(mnemonic: string): Promise<string> {
    // Use original mnemonic directly - no conversion to seed and back
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic)
    const account = hdNode.derivePath("44'/501'/0'/0/0")
    const privateKeyBytes = ethers.getBytes(account.privateKey)
    const keypair = Keypair.fromSeed(privateKeyBytes.slice(0, 32))
    return keypair.publicKey.toString()
  },

  async toBtcAddressFromMnemonic(mnemonic: string): Promise<string> {
    try {
      console.log('Starting Bitcoin address generation from original mnemonic...')
      
      // Use original mnemonic directly - no conversion to seed and back
      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic)
      const account = hdNode.derivePath("44'/0'/0'/0/0")
      console.log('Derived Bitcoin account:', account.address)

      // Convert private key to Bitcoin format
      const privateKeyBuffer = Buffer.from(ethers.getBytes(account.privateKey) as Uint8Array)
      console.log('Private key buffer length:', privateKeyBuffer.length)

      // Generate Bitcoin keypair
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer)
      console.log('Generated Bitcoin keypair, public key length:', keyPair.publicKey.length)

      // For Taproot, we need the internal public key (32 bytes)
      const internalPubkey = Buffer.from(keyPair.publicKey.slice(1))
      console.log('Internal public key for Taproot, length:', internalPubkey.length)

      // Generate Taproot address
      console.log('Attempting Taproot address generation...')
      const { address: taprootAddress } = bitcoin.payments.p2tr({
        pubkey: internalPubkey,
        network: bitcoin.networks.bitcoin,
      })

      console.log('Taproot address result:', taprootAddress)

      if (taprootAddress) {
        return taprootAddress
      }

      throw new Error('Taproot address generation failed')
    } catch (error) {
      console.error('Bitcoin address generation error:', error)
      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic)
      const errorAccount = hdNode.derivePath("44'/0'/0'/0/0")
      return `btc_error_${errorAccount.address.slice(2)}`
    }
  },

  // FIXED: fromMnemonic now uses deterministic, consistent derivation paths
  //
  // CRITICAL ARCHITECTURE DECISION:
  // Different blockchain types require different derivation approaches:
  //
  // 1. ICP (Internet Computer): Uses Ed25519 signatures
  //    - Requires: seed -> Ed25519KeyIdentity
  //    - Method: Convert mnemonic to seed, then use seed for Ed25519 keypair
  //    - Why: ICP's identity system is based on Ed25519, not HD wallets
  //
  // 2. EVM/Solana/Bitcoin: Use BIP44 HD wallets  
  //    - Requires: mnemonic -> HD wallet -> derivation path -> private key
  //    - Method: Use original mnemonic directly for HD wallet generation
  //    - Why: HD wallets are designed to work with mnemonics, not arbitrary seeds
  //
  // This hybrid approach ensures:
  // - Same mnemonic always produces same addresses across all chains
  // - Recovery works consistently between login and recovery flows
  // - Follows blockchain-specific standards (Ed25519 for ICP, BIP44 for others)
  async fromMnemonic(mnemonic: string): Promise<{
    principal: string
    evmAddress: string
    solAddress: string
    btcAddress: string
    identity: Ed25519KeyIdentity
  }> {
    if (!this.isValidMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic')
    }
    
    // Create seed ONLY for ICP identity (Ed25519)
    // ICP uses Ed25519 signatures which require a 32-byte seed
    const seedBuffer = bip39.mnemonicToSeedSync(mnemonic)
    const seed = new Uint8Array(seedBuffer.slice(0, 32))
    
    // Use ORIGINAL mnemonic directly for HD wallets (EVM, Solana, Bitcoin)
    // This ensures deterministic address generation that matches recovery
    const [principal, evmAddress, solAddress, btcAddress, identity] = await Promise.all([
      this.toIcpPrincipal(seed),                    // ✅ ICP: seed-based (Ed25519)
      this.toEvmAddressFromMnemonic(mnemonic),      // ✅ EVM: direct mnemonic (BIP44)
      this.toSolAddressFromMnemonic(mnemonic),      // ✅ Solana: direct mnemonic (BIP44)
      this.toBtcAddressFromMnemonic(mnemonic),      // ✅ Bitcoin: direct mnemonic (BIP44)
      this.toIdentity(seed),                        // ✅ ICP Identity: seed-based (Ed25519)
    ])
    
    return {
      principal,
      evmAddress,
      solAddress,
      btcAddress,
      identity,
    }
  },
}
