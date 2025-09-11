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
      const privateKeyBuffer = Buffer.from(ethers.getBytes(account.privateKey) as Uint8Array)
      console.log('Private key buffer length:', privateKeyBuffer.length)
      
      // Generate Bitcoin keypair
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer)
      console.log('Generated Bitcoin keypair, public key length:', keyPair.publicKey.length)
      
      // For Taproot, we need the internal public key (32 bytes)
      // Taproot uses the x-only public key (removes the y-coordinate)
      const internalPubkey = Buffer.from(keyPair.publicKey.slice(1)) // Remove the first byte (compression flag)
      console.log('Internal public key for Taproot, length:', internalPubkey.length)
      
      // Try Taproot address (modern Bitcoin address format)
      try {
        console.log('Attempting Taproot address generation...')
        const { address: taprootAddress } = bitcoin.payments.p2tr({
          pubkey: internalPubkey,
          network: bitcoin.networks.bitcoin
        })
        
        console.log('Taproot address result:', taprootAddress)
        
        if (taprootAddress) {
          return taprootAddress
        }
      } catch (taprootError: any) {
        console.error('Taproot generation failed:', taprootError)
        throw new Error(`Taproot address generation failed: ${taprootError.message}`)
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
    const seedBuffer = bip39.mnemonicToSeedSync(mnemonic)
    const seed = new Uint8Array(seedBuffer.slice(0, 32))
    const [principal, evmAddress, solAddress, btcAddress, identity] = await Promise.all([
      this.toIcpPrincipal(seed),
      this.toEvmAddress(seed),
      this.toSolAddress(seed),
      this.toBtcAddress(seed),
      this.toIdentity(seed)
    ])
    return {
      principal,
      evmAddress,
      solAddress,
      btcAddress,
      identity
    }
  }
}