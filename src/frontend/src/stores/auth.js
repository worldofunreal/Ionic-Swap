import { defineStore } from 'pinia';
import { mnemonicToSeedSync, generateMnemonic, validateMnemonic } from 'bip39';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { AuthClient } from '@dfinity/auth-client';
import { ethers } from 'ethers';
import nacl from 'tweetnacl';
import * as bip39 from 'bip39';

let identity = null;

// Derive ICP principal from EVM address signature
function deriveICPPrincipalFromEVM(signature) {
  const encoder = new TextEncoder();
  const encodedSignature = encoder.encode(signature);
  return crypto.subtle.digest('SHA-256', encodedSignature).then(hashBuffer => {
    const seed = new Uint8Array(hashBuffer.slice(0, 32));
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    return Ed25519KeyIdentity.fromKeyPair(keyPair.publicKey, keyPair.secretKey);
  });
}

// Derive EVM address from ICP principal
function deriveEVMAddressFromICP(principal) {
  const principalBytes = principal.toUint8Array();
  return crypto.subtle.digest('SHA-256', principalBytes).then(hashBuffer => {
    const hash = new Uint8Array(hashBuffer);
    // Use the hash as private key to derive EVM address
    const privateKey = ethers.utils.hexlify(hash);
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  });
}

// Generate seed phrase from any input
function generateSeedPhrase(input) {
  const encoder = new TextEncoder();
  const encodedInput = encoder.encode(input);
  return crypto.subtle.digest('SHA-256', encodedInput).then(hashBuffer => {
    const seed = new Uint8Array(hashBuffer.slice(0, 32));
    return bip39.entropyToMnemonic(seed);
  });
}

// Derive keys from seed phrase
function deriveKeysFromSeedPhrase(seedPhrase) {
  const seed = mnemonicToSeedSync(seedPhrase).slice(0, 32);
  return nacl.sign.keyPair.fromSeed(seed);
}

// Create identity from key pair
function createIdentityFromKeyPair(keyPair) {
  return Ed25519KeyIdentity.fromKeyPair(keyPair.publicKey, keyPair.secretKey);
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: false,
    user: null,
    seedPhrase: '',
    loginMethod: null, // 'metamask' or 'internet-identity'
  }),

  getters: {
    getIdentity: () => identity,
    isAuthenticated: (state) => state.authenticated,
    getUser: (state) => state.user,
    getLoginMethod: (state) => state.loginMethod,
  },

  actions: {
    // MetaMask Login Flow
    async loginWithMetaMask() {
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }

        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        const evmAddress = accounts[0];

        // Request signature for authentication
        const message = 'Sign this message to authenticate with Ionic Swap';
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, evmAddress]
        });

        // Derive ICP principal from signature
        const icpIdentity = await deriveICPPrincipalFromEVM(signature);
        const icpPrincipal = icpIdentity.getPrincipal();

        // Generate seed phrase from signature
        const seedPhrase = await generateSeedPhrase(signature);

        // Set up the user object
        const user = {
          evmAddress,
          icpPrincipal: icpPrincipal.toText(),
          loginMethod: 'metamask',
          seedPhrase
        };

        // Store identity and user data
        identity = icpIdentity;
        this.user = user;
        this.authenticated = true;
        this.loginMethod = 'metamask';
        this.seedPhrase = seedPhrase;

        // Save to localStorage
        this.saveStateToLocalStorage();

        console.log('MetaMask login successful:', {
          evmAddress,
          icpPrincipal: icpPrincipal.toText()
        });

        return user;
      } catch (error) {
        console.error('MetaMask login error:', error);
        throw new Error('MetaMask login failed: ' + error.message);
      }
    },

    // Internet Identity Login Flow
    async loginWithInternetIdentity() {
      try {
        const authClient = await AuthClient.create();

        return new Promise((resolve, reject) => {
          authClient.login({
            identityProvider: 'https://identity.ic0.app',
            windowOpenerFeatures:
              `left=${window.screen.width / 2 - 525 / 2},` +
              `top=${window.screen.height / 2 - 705 / 2},` +
              `toolbar=0,location=0,menubar=0,width=525,height=705`,
            onSuccess: async () => {
              try {
                console.log('Internet Identity login success');
                const icpIdentity = authClient.getIdentity();
                const icpPrincipal = icpIdentity.getPrincipal();

                // Derive EVM address from ICP principal
                const evmAddress = await deriveEVMAddressFromICP(icpPrincipal);

                // Generate seed phrase from principal
                const principalBytes = icpPrincipal.toUint8Array();
                const hashBuffer = await crypto.subtle.digest('SHA-256', principalBytes);
                const entropy = new Uint8Array(hashBuffer);
                const seedPhrase = bip39.entropyToMnemonic(entropy);

                // Set up the user object
                const user = {
                  evmAddress,
                  icpPrincipal: icpPrincipal.toText(),
                  loginMethod: 'internet-identity',
                  seedPhrase
                };

                // Store identity and user data
                identity = icpIdentity;
                this.user = user;
                this.authenticated = true;
                this.loginMethod = 'internet-identity';
                this.seedPhrase = seedPhrase;

                // Save to localStorage
                this.saveStateToLocalStorage();

                console.log('Internet Identity login successful:', {
                  evmAddress,
                  icpPrincipal: icpPrincipal.toText()
                });

                resolve(user);
              } catch (error) {
                console.error('Error setting up user after II login:', error);
                reject(new Error('Failed to set up user after login'));
              }
            },
            onError: (error) => {
              console.error('Internet Identity login error:', error);
              reject(new Error('Internet Identity authentication failed'));
            },
          });
        });
      } catch (error) {
        console.error('Internet Identity login error:', error);
        throw new Error('Internet Identity login failed: ' + error.message);
      }
    },

    // Logout
    async logout() {
      // Clear localStorage
      localStorage.removeItem('authStore');
      
      // Reset state
      identity = null;
      this.authenticated = false;
      this.user = null;
      this.loginMethod = null;
      this.seedPhrase = '';
      
      // Reset store
      this.$reset();
      
      console.log('User logged out successfully');
    },

    // Save state to localStorage
    saveStateToLocalStorage() {
      const stateToSave = {
        authenticated: this.authenticated,
        user: this.user,
        loginMethod: this.loginMethod,
        seedPhrase: this.seedPhrase
      };
      
      localStorage.setItem('authStore', JSON.stringify(stateToSave));
      console.log('Auth state saved to localStorage');
    },

    // Load state from localStorage
    async loadStateFromLocalStorage() {
      const stored = localStorage.getItem('authStore');
      if (!stored) {
        console.log('No stored auth data found');
        return false;
      }

      try {
        const parsed = JSON.parse(stored);
        
        // Reconstruct identity if seed phrase exists
        if (parsed.seedPhrase) {
          const keyPair = deriveKeysFromSeedPhrase(parsed.seedPhrase);
          identity = createIdentityFromKeyPair(keyPair);
          console.log('Identity restored from localStorage');
        }

        // Apply stored state
        this.$patch(parsed);
        
        console.log('Auth state loaded from localStorage:', parsed.user);
        return true;
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear invalid state
        localStorage.removeItem('authStore');
        this.$reset();
        identity = null;
        return false;
      }
    },

    // Get current user's EVM address
    getEVMAddress() {
      return this.user?.evmAddress;
    },

    // Get current user's ICP principal
    getICPPrincipal() {
      return this.user?.icpPrincipal;
    },

    // Check if user has both identities
    hasDualIdentity() {
      return this.user?.evmAddress && this.user?.icpPrincipal;
    }
  },
});

export default useAuthStore; 