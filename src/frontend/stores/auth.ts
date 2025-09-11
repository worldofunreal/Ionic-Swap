import { defineStore } from 'pinia'
import type { Ed25519KeyIdentity } from '@dfinity/identity'
import { canisterService, type User } from '@/services/CanisterService'
import { WalletRegistry } from '@/services/wallets/WalletRegistry'
import { CrossChainSeedService } from '@/services/CrossChainSeedService'
import { appCacheService } from '@/services/AppCacheService'
import type { WalletType } from '@/services/wallets/types'

let identity: Ed25519KeyIdentity | null = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: false,
    registered: false,
    player: null as unknown as Record<string, unknown>,
    userProfile: null as User | null,
    principal: '',
    evmAddress: '',
    solAddress: '',
    btcAddress: '',
    nativeWallet: '',
    canisterInitialized: false,
  }),

  getters: {
    // Check if session is valid
    hasValidSession(): boolean {
      const session = appCacheService.getSession()
      return session !== null && session.authenticated
    },
  },

  actions: {
    getIdentity() {
      return identity
    },

    isAuthenticated() {
      return this.authenticated
    },

    isRegistered() {
      return this.registered
    },

    async login(walletType: WalletType) {
      try {
        // Clear any existing session first
        appCacheService.clearSession()

        // 1. Get wallet adapter
        const adapter = WalletRegistry.getAdapter(walletType)

        // 2. Authenticate with wallet (gets all cross-chain addresses)
        const authResult = await adapter.authenticate()

        // 3. Generate seed and identity
        const seed = authResult.signature
          ? await CrossChainSeedService.fromSignature(authResult.signature)
          : await CrossChainSeedService.fromPrincipal(authResult.principal)

        identity = await CrossChainSeedService.toIdentity(seed)

        // 4. Initialize canister service
        if (walletType === 'plug') {
          // Use Plug's native agent for canister calls
          await canisterService.initializeWithPlug()
        } else {
          // Use generated identity for other wallets
          await canisterService.initialize(identity)
        }
        this.canisterInitialized = true

        // 5. Check if user exists in database
        const existingProfile = await canisterService.getMyProfile()

        if (existingProfile) {
          // User exists, load their profile
          this.userProfile = existingProfile
          this.registered = true
          this.authenticated = true

          // Update auth state
          this.principal = authResult.principal
          this.evmAddress = authResult.evmAddress || ''
          this.solAddress = authResult.solAddress || ''
          this.btcAddress = authResult.btcAddress || ''
          this.nativeWallet = authResult.nativeWallet

          // Legacy player object for compatibility
          this.player = {
            username: existingProfile.username,
            displayName:
              existingProfile.display_name.length > 0
                ? existingProfile.display_name[0]
                : null,
            avatarPreset: 1, // Default avatar preset
            avatarUrl:
              existingProfile.avatar_url.length > 0
                ? existingProfile.avatar_url[0]
                : null,
            bannerUrl: null, // Not available in new User type
            ethAddress: authResult.evmAddress,
            principal: authResult.principal,
            walletType: authResult.nativeWallet,
          }

          // Store authentication data for session restoration
          console.log('Storing authentication data for session restoration:')
          console.log('- Principal:', authResult.principal)
          console.log('- EVM Address:', authResult.evmAddress)
          console.log('- Wallet Type:', walletType)

          // For Internet Identity, store principal instead of signature
          const sessionData: Record<string, unknown> = {
            authenticated: true,
            registered: true,
            principal: authResult.principal,
            evmAddress: authResult.evmAddress || '',
            solAddress: authResult.solAddress || '',
            btcAddress: authResult.btcAddress || '',
            nativeWallet: authResult.nativeWallet,
            canisterInitialized: true,
            originalWalletType: walletType, // Store original wallet type
          }

          // Store signature for wallets that have it, principal for Internet Identity
          if (walletType === 'internet-identity') {
            sessionData.originalPrincipal = authResult.principal // Store principal for II
            console.log('- Original Principal (II):', authResult.principal)
          } else {
            sessionData.originalSignature = authResult.signature // Store signature for other wallets
            console.log('- Original Signature:', authResult.signature)
          }

          // Save session to cache
          appCacheService.saveSession(sessionData)

          this.saveStateToLocalStorage()
          return { existing: true, profile: existingProfile }
        } else {
          // New user, needs registration
          this.authenticated = true
          this.registered = false
          this.userProfile = null

          this.principal = authResult.principal
          this.evmAddress = authResult.evmAddress || ''
          this.solAddress = authResult.solAddress || ''
          this.btcAddress = authResult.btcAddress || ''
          this.nativeWallet = authResult.nativeWallet

          this.saveStateToLocalStorage()
          return { existing: false, profile: null }
        }
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },

    async recover(mnemonic: string) {
      try {
        // 1. Recover all addresses from mnemonic
        const recovered = await CrossChainSeedService.fromMnemonic(mnemonic)

        // 2. Set identity
        identity = recovered.identity

        // 3. Initialize canister service
        await canisterService.initialize(identity)
        this.canisterInitialized = true

        // 4. Check if user exists
        const existingProfile = await canisterService.getMyProfile()

        if (existingProfile) {
          this.userProfile = existingProfile
          this.registered = true
          this.authenticated = true

          this.principal = recovered.principal
          this.evmAddress = recovered.evmAddress
          this.solAddress = recovered.solAddress
          this.nativeWallet = 'recovered'

          // Legacy player object
          this.player = {
            username: existingProfile.username,
            displayName:
              existingProfile.display_name.length > 0
                ? existingProfile.display_name[0]
                : null,
            avatarPreset: 1, // Default avatar preset
            avatarUrl:
              existingProfile.avatar_url.length > 0
                ? existingProfile.avatar_url[0]
                : null,
            bannerUrl: null, // Not available in new User type
            ethAddress: recovered.evmAddress,
            principal: recovered.principal,
            walletType: 'recovered',
          }

          this.saveStateToLocalStorage()
          return { existing: true, profile: existingProfile }
        } else {
          throw new Error('No user found with this mnemonic')
        }
      } catch (error) {
        console.error('Recovery failed:', error)
        throw error
      }
    },

    async completeRegistration(profile: User) {
      this.userProfile = profile
      this.registered = true

      // Update legacy player object
      this.player = {
        username: profile.username,
        displayName:
          profile.display_name.length > 0 ? profile.display_name[0] : null,
        avatarPreset: 1, // Default avatar preset
        avatarUrl: profile.avatar_url.length > 0 ? profile.avatar_url[0] : null,
        bannerUrl: null, // Not available in new User type
        ethAddress: this.evmAddress,
        principal: this.principal,
        walletType: this.nativeWallet,
      }

      this.saveStateToLocalStorage()
    },

    async logout() {
      // Clear session from cache
      appCacheService.clearSession()
      localStorage.removeItem('authStore')
      identity = null
      this.authenticated = false
      this.registered = false
      this.userProfile = null
      this.canisterInitialized = false
      this.$reset()
      window.location.href = '/'
    },

    // Restore session from cache
    async restoreSession() {
      const session = appCacheService.getSession()
      if (session && session.authenticated) {
        console.log('Restoring session from cache...')
        console.log('Session data:', session)

        try {
          // Restore basic auth state first
          this.authenticated = session.authenticated
          this.registered = session.registered
          this.principal = session.principal
          this.evmAddress = session.evmAddress
          this.solAddress = session.solAddress
          this.btcAddress = session.btcAddress
          this.nativeWallet = session.nativeWallet
          this.canisterInitialized = session.canisterInitialized

          console.log(
            'Auth state restored - authenticated:',
            this.authenticated,
            'principal:',
            this.principal
          )

          // Recreate authentication data based on wallet type
          if (session.originalSignature) {
            // For wallets with signatures (MetaMask, Phantom, Plug)
            console.log('Recreating mnemonic from stored signature...')
            console.log('Stored signature:', session.originalSignature)

            // Recreate seed from original signature
            const seed = await CrossChainSeedService.fromSignature(
              session.originalSignature
            )

            // Recreate mnemonic from seed
            const mnemonic = CrossChainSeedService.seedToMnemonic(seed)
            console.log('Recreated mnemonic:', mnemonic)

            // Use the seed directly to restore identity (don't call fromMnemonic again!)
            identity = await CrossChainSeedService.toIdentity(seed)

            console.log('Using original stored addresses:')
            console.log('- Principal:', session.principal)
            console.log('- EVM Address:', session.evmAddress)
            console.log('- Solana Address:', session.solAddress)
            console.log('- Bitcoin Address:', session.btcAddress)

            // Initialize canister service based on wallet type
            if (session.originalWalletType === 'plug') {
              // For Plug, we need to reconnect first
              console.log('Reconnecting Plug for session restoration...')
              try {
                // Get Plug adapter and reconnect
                const adapter = WalletRegistry.getAdapter('plug')
                await adapter.authenticate() // This will reconnect Plug

                // Now initialize canister service
                await canisterService.initializeWithPlug()
              } catch {
                console.warn(
                  'Failed to reconnect Plug, trying identity-based initialization...'
                )
                // Fallback to identity-based initialization
                await canisterService.initialize(identity)
              }
            } else {
              await canisterService.initialize(identity)
            }
            this.canisterInitialized = true

            // Get user profile
            const profile = await canisterService.getMyProfile()
            if (profile) {
              this.userProfile = profile
              this.registered = true

              // Update legacy player object
              this.player = {
                username: profile.username,
                displayName:
                  profile.display_name.length > 0
                    ? profile.display_name[0]
                    : null,
                avatarPreset: 1,
                avatarUrl:
                  profile.avatar_url.length > 0 ? profile.avatar_url[0] : null,
                bannerUrl: null,
                ethAddress: this.evmAddress,
                principal: this.principal,
                walletType: this.nativeWallet,
              }

              console.log(
                'Session restored successfully with full functionality'
              )
              return true
            } else {
              // User exists in session but not in database - needs registration
              console.log(
                'User authenticated but not registered, keeping session for registration'
              )
              this.registered = false
              this.userProfile = null
              return true // Return true to keep the session
            }
          } else if (
            session.originalPrincipal &&
            session.originalWalletType === ('internet-identity' as WalletType)
          ) {
            // For Internet Identity, recreate seed from principal
            console.log(
              'Recreating seed from stored principal (Internet Identity)...'
            )
            console.log('Stored principal:', session.originalPrincipal)

            // Recreate seed from original principal
            const seed = await CrossChainSeedService.fromPrincipal(
              session.originalPrincipal
            )

            // Recreate mnemonic from seed
            const mnemonic = CrossChainSeedService.seedToMnemonic(seed)
            console.log('Recreated mnemonic (II):', mnemonic)

            // Use the seed directly to restore identity
            identity = await CrossChainSeedService.toIdentity(seed)

            console.log('Using original stored addresses:')
            console.log('- Principal:', session.principal)
            console.log('- EVM Address:', session.evmAddress)
            console.log('- Solana Address:', session.solAddress)
            console.log('- Bitcoin Address:', session.btcAddress)

            // Initialize canister service based on wallet type
            if (session.originalWalletType === 'plug') {
              // For Plug, we need to reconnect first
              console.log('Reconnecting Plug for session restoration...')
              try {
                // Get Plug adapter and reconnect
                const adapter = WalletRegistry.getAdapter('plug')
                await adapter.authenticate() // This will reconnect Plug

                // Now initialize canister service
                await canisterService.initializeWithPlug()
              } catch {
                console.warn(
                  'Failed to reconnect Plug, trying identity-based initialization...'
                )
                // Fallback to identity-based initialization
                await canisterService.initialize(identity)
              }
            } else {
              await canisterService.initialize(identity)
            }
            this.canisterInitialized = true

            // Get user profile
            const profile = await canisterService.getMyProfile()
            if (profile) {
              this.userProfile = profile
              this.registered = true

              // Update legacy player object
              this.player = {
                username: profile.username,
                displayName:
                  profile.display_name.length > 0
                    ? profile.display_name[0]
                    : null,
                avatarPreset: 1,
                avatarUrl:
                  profile.avatar_url.length > 0 ? profile.avatar_url[0] : null,
                bannerUrl: null,
                ethAddress: this.evmAddress,
                principal: this.principal,
                walletType: this.nativeWallet,
              }

              console.log(
                'Session restored successfully with full functionality'
              )
              return true
            } else {
              // User exists in session but not in database - needs registration
              console.log(
                'User authenticated but not registered, keeping session for registration'
              )
              this.registered = false
              this.userProfile = null
              return true // Return true to keep the session
            }
          } else {
            console.warn(
              'No original signature or principal available for session restoration'
            )
            appCacheService.clearSession()
            return false
          }
        } catch (error) {
          console.warn('Failed to restore session:', error)
          // Clear invalid session
          appCacheService.clearSession()
          return false
        }
      }
      return false
    },

    saveStateToLocalStorage() {
      const replacer = (key: string, value: unknown) => {
        if (typeof value === 'bigint') {
          return value.toString()
        }
        return value
      }
      const serializedState = JSON.stringify(this.$state, replacer)
      localStorage.setItem('authStore', serializedState)
    },

    async loadStateFromLocalStorage() {
      const stored = localStorage.getItem('authStore')
      if (stored) {
        try {
          const parsed = JSON.parse(stored, (key: string, value: unknown) => {
            if (typeof value === 'string' && /^\d+$/.test(value)) {
              try {
                return BigInt(value)
              } catch {
                return value
              }
            }
            return value
          })

          this.$patch(parsed)

          // Try to restore identity if we have a principal
          if (parsed.principal) {
            try {
              // For now, we can't fully restore without the original seed/mnemonic
              // This would need to be enhanced to store the mnemonic securely
              console.warn('Cannot fully restore session without mnemonic')
              return false
            } catch {
              this.$reset()
              localStorage.removeItem('authStore')
              return false
            }
          }

          return true
        } catch {
          this.$reset()
          localStorage.removeItem('authStore')
          return false
        }
      }
      return false
    },
  },
})

export default useAuthStore
