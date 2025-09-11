// Polyfills for browser compatibility
import { Buffer } from 'buffer'
import process from 'process'

// Configure global polyfills for browser environment
if (typeof window !== 'undefined') {
  // Make Buffer available globally
  ;(window as any).Buffer = Buffer

  // Make process available globally
  ;(window as any).process = process

  // Configure global object
  if (typeof (window as any).global === 'undefined') {
    ;(window as any).global = window
  }

  // Configure crypto for Solana Web3.js
  if (typeof window.crypto === 'undefined') {
    // Use the browser's crypto API
    ;(window as any).crypto = window.crypto || (window as any).msCrypto
  }

  // Configure other Node.js globals that might be needed
  if (typeof (window as any).setImmediate === 'undefined') {
    ;(window as any).setImmediate = setTimeout
  }

  if (typeof (window as any).clearImmediate === 'undefined') {
    ;(window as any).clearImmediate = clearTimeout
  }
}

export default defineNuxtPlugin(() => {
  // Plugin is loaded
  console.log('Polyfills plugin loaded')
})
