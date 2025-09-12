// Polyfills for browser compatibility
import { Buffer } from 'buffer'
import process from 'process'

// Configure global polyfills for browser environment
if (typeof window !== 'undefined') {
  // Make Buffer available globally
  ;(window as Window & { Buffer: typeof Buffer }).Buffer = Buffer

  // Make process available globally
  ;(window as Window & { process: typeof process }).process = process

  // Configure global object
  if (typeof (window as Window & { global: Window }).global === 'undefined') {
    ;(window as Window & { global: Window }).global = window
  }

  // Configure crypto for Solana Web3.js
  if (typeof window.crypto === 'undefined') {
    // Use the browser's crypto API
    ;(window as Window & { crypto: Crypto; msCrypto?: Crypto }).crypto =
      window.crypto || (window as Window & { msCrypto?: Crypto }).msCrypto
  }

  // Configure other Node.js globals that might be needed
  if (
    typeof (window as Window & { setImmediate: typeof setTimeout })
      .setImmediate === 'undefined'
  ) {
    ;(window as Window & { setImmediate: typeof setTimeout }).setImmediate =
      setTimeout
  }

  if (
    typeof (window as Window & { clearImmediate: typeof clearTimeout })
      .clearImmediate === 'undefined'
  ) {
    ;(
      window as Window & { clearImmediate: typeof clearTimeout }
    ).clearImmediate = clearTimeout
  }
}

export default defineNuxtPlugin(() => {
  // Plugin is loaded
  console.log('Polyfills plugin loaded')
})
