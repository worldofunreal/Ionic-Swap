import React, { createContext, useContext, useState, useEffect } from 'react';
import { mnemonicToSeedSync, generateMnemonic, validateMnemonic } from 'bip39';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { AuthClient } from '@dfinity/auth-client';
import { ethers } from 'ethers';
import nacl from 'tweetnacl';
import * as bip39 from 'bip39';

const AuthContext = createContext();

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
    // Convert to Buffer for bip39
    const buffer = Buffer.from(seed);
    return bip39.entropyToMnemonic(buffer);
  });
}

// Derive keys from seed phrase
function deriveKeysFromSeedPhrase(seedPhrase) {
  const seed = mnemonicToSeedSync(seedPhrase);
  const seedArray = new Uint8Array(seed.slice(0, 32));
  return nacl.sign.keyPair.fromSeed(seedArray);
}

// Create identity from key pair
function createIdentityFromKeyPair(keyPair) {
  return Ed25519KeyIdentity.fromKeyPair(keyPair.publicKey, keyPair.secretKey);
}

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [loginMethod, setLoginMethod] = useState(null);

  // Load state from localStorage
  const loadStateFromLocalStorage = async () => {
    const stored = localStorage.getItem('authStore');
    if (!stored) {
      console.log('No stored auth data found');
      return false;
    }

    try {
      const parsed = JSON.parse(stored);

      // Reconstruct identity if seed phrase exists
      if (parsed.seedPhrase) {
        try {
          const keyPair = deriveKeysFromSeedPhrase(parsed.seedPhrase);
          identity = createIdentityFromKeyPair(keyPair);
          console.log('Identity restored from localStorage');
        } catch (error) {
          console.error('Error reconstructing identity from seed phrase:', error);
          // Clear invalid state
          localStorage.removeItem('authStore');
          return false;
        }
      }

      // Apply stored state
      setAuthenticated(parsed.authenticated);
      setUser(parsed.user);
      setLoginMethod(parsed.loginMethod);
      setSeedPhrase(parsed.seedPhrase);

      console.log('Auth state loaded from localStorage:', parsed.user);
      return true;
    } catch (error) {
      console.error('Error loading auth state:', error);
      // Clear invalid state
      localStorage.removeItem('authStore');
      setAuthenticated(false);
      setUser(null);
      setLoginMethod(null);
      setSeedPhrase('');
      identity = null;
      return false;
    }
  };

  // Save state to localStorage
  const saveStateToLocalStorage = () => {
    const stateToSave = {
      authenticated,
      user,
      loginMethod,
      seedPhrase
    };

    localStorage.setItem('authStore', JSON.stringify(stateToSave));
    console.log('Auth state saved to localStorage');
  };

  // MetaMask Login Flow
  const loginWithMetaMask = async () => {
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

      // Generate seed phrase from signature
      const generatedSeedPhrase = await generateSeedPhrase(signature);

      // Create identity from seed phrase
      const keyPair = deriveKeysFromSeedPhrase(generatedSeedPhrase);
      const seedBasedIdentity = createIdentityFromKeyPair(keyPair);

      // Set up the user object
      const userData = {
        evmAddress,
        icpPrincipal: seedBasedIdentity.getPrincipal().toText(),
        loginMethod: 'metamask',
        seedPhrase: generatedSeedPhrase
      };

      // Store seed-based identity and user data
      identity = seedBasedIdentity;
      setUser(userData);
      setAuthenticated(true);
      setLoginMethod('metamask');
      setSeedPhrase(generatedSeedPhrase);

      // Save to localStorage
      saveStateToLocalStorage();

      console.log('MetaMask login successful:', {
        evmAddress,
        icpPrincipal: seedBasedIdentity.getPrincipal().toText()
      });

      return userData;
    } catch (error) {
      console.error('MetaMask login error:', error);
      throw new Error('MetaMask login failed: ' + error.message);
    }
  };

  // Internet Identity Login Flow
  const loginWithInternetIdentity = async () => {
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
              const buffer = Buffer.from(entropy);
              const generatedSeedPhrase = bip39.entropyToMnemonic(buffer);

              // Create identity from seed phrase instead of using AuthClient identity
              const keyPair = deriveKeysFromSeedPhrase(generatedSeedPhrase);
              const seedBasedIdentity = createIdentityFromKeyPair(keyPair);

              // Set up the user object
              const userData = {
                evmAddress,
                icpPrincipal: seedBasedIdentity.getPrincipal().toText(),
                loginMethod: 'internet-identity',
                seedPhrase: generatedSeedPhrase
              };

              // Store seed-based identity and user data
              identity = seedBasedIdentity;
              setUser(userData);
              setAuthenticated(true);
              setLoginMethod('internet-identity');
              setSeedPhrase(generatedSeedPhrase);

              // Save to localStorage
              saveStateToLocalStorage();

              console.log('Internet Identity login successful:', {
                evmAddress,
                icpPrincipal: seedBasedIdentity.getPrincipal().toText()
              });

              resolve(userData);
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
  };

  // Logout
  const logout = async () => {
    // Clear localStorage
    localStorage.removeItem('authStore');

    // Reset state
    identity = null;
    setAuthenticated(false);
    setUser(null);
    setLoginMethod(null);
    setSeedPhrase('');

    console.log('User logged out successfully');
  };

  // Get current user's EVM address
  const getEVMAddress = () => {
    return user?.evmAddress;
  };

  // Get current user's ICP principal
  const getICPPrincipal = () => {
    return user?.icpPrincipal;
  };

  // Check if user has both identities
  const hasDualIdentity = () => {
    return user?.evmAddress && user?.icpPrincipal;
  };

  // Get identity
  const getIdentity = () => {
    return identity;
  };

  useEffect(() => {
    loadStateFromLocalStorage();
  }, []);

  useEffect(() => {
    if (authenticated) {
      saveStateToLocalStorage();
    }
  }, [authenticated, user, loginMethod, seedPhrase]);

  const value = {
    authenticated,
    user,
    loginMethod,
    loginWithMetaMask,
    loginWithInternetIdentity,
    logout,
    getEVMAddress,
    getICPPrincipal,
    hasDualIdentity,
    getIdentity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 