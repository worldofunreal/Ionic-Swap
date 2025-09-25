import { Actor, HttpAgent } from '@dfinity/agent'
import type { Identity } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '../../declarations/backend'
import type {
  _SERVICE as BackendService,
  User,
  UserResult,
  UserUpdate,
  CompactProfile,
  PersonalUser,
  SwapTransaction,
  PortfolioData,
  PortfolioPoint,
} from '../../declarations/backend/backend.did'
import { appCacheService } from './AppCacheService'

// Get canister ID from runtime config
const getBackendCanisterId = () => {
  // Get canister ID from environment
  return process.env.CANISTER_ID_BACKEND || 'uxrrr-q7777-77774-qaaaq-cai'
}

// Export types from the backend canister
export type {
  User,
  UserUpdate,
  CompactProfile,
  PersonalUser,
  SwapTransaction,
  PortfolioData,
  PortfolioPoint,
  PrivacySettings,
  VisibilityLevel,
} from '../../declarations/backend/backend.did'

// Helper function to handle user result variants
const handleUserResult = (result: any): User => {
  if ('Ok' in result) {
    return result.Ok
  } else {
    throw new Error(`Backend error: ${JSON.stringify(result.Err)}`)
  }
}

class CanisterService {
  private agent: HttpAgent | null = null
  private backendActor: BackendService | null = null
  private identity: Identity | null = null

  // Initialize the service with an identity
  async initialize(identity?: Identity) {
    try {
      this.identity = identity || null

      // Determine if we're in production (using VPS proxy) or local development
      const isProduction = process.env.NODE_ENV === 'production'
      const host = isProduction 
        ? 'https://ionicswap.com:7777' // Use VPS dfx local with HTTPS
        : 'http://127.0.0.1:4943' // Use local development

      // Create HTTP agent with proper configuration
      this.agent = new HttpAgent({
        host,
        identity: this.identity || undefined,
        verifyQuerySignatures: false,
        verifyUpdateSignatures: false,
      })

      // Fetch the replica's root key
      console.log(`Using ${isProduction ? 'VPS proxy' : 'local development'} agent...`)
      await this.agent.fetchRootKey()

      // Create backend actor
      this.backendActor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: getBackendCanisterId(),
      })

      console.log('CanisterService initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize CanisterService:', error)
      throw error
    }
  }

  // Initialize the service anonymously for public access (SSR)
  async initializeAnonymous(): Promise<boolean> {
    try {
      // Determine if we're in production (using VPS proxy) or local development
      const isProduction = process.env.NODE_ENV === 'production'
      const host = isProduction 
        ? 'https://ionicswap.com:7777' // Use VPS dfx local with HTTPS
        : 'http://127.0.0.1:4943' // Use local development

      // Create HTTP agent without identity for anonymous access
      this.agent = new HttpAgent({
        host,
        verifyQuerySignatures: false,
        verifyUpdateSignatures: false,
      })

      // Fetch the replica's root key
      console.log(`Using ${isProduction ? 'VPS proxy' : 'local development'} agent (anonymous)...`)
      await this.agent.fetchRootKey()

      // Create backend actor for anonymous queries
      this.backendActor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: getBackendCanisterId(),
      })

      console.log('CanisterService initialized anonymously for public access')
      return true
    } catch (error) {
      console.error('Failed to initialize CanisterService anonymously:', error)
      throw error
    }
  }

  // Initialize the service with Plug's createActor method
  async initializeWithPlug() {
    try {
      // Check if Plug is available and connected
      if (!window.ic?.plug?.createActor) {
        throw new Error('Plug createActor not available')
      }

      // Debug: Check what agent Plug is using
      if (window.ic?.plug?.agent) {
        console.log('Plug agent host:', window.ic.plug.agent._host)
        console.log('Plug agent identity:', window.ic.plug.agent._identity)
      }

      // Use Plug's createActor method to create the backend actor
      this.backendActor = await window.ic.plug.createActor({
        canisterId: getBackendCanisterId(),
        interfaceFactory: idlFactory,
      })

      console.log('CanisterService initialized with Plug createActor')
      return true
    } catch (error) {
      console.error('Failed to initialize CanisterService with Plug:', error)
      throw error
    }
  }

  // Check if service is initialized
  isInitialized(): boolean {
    return this.backendActor !== null
  }

  // Check if service is initialized with identity (authenticated)
  isAuthenticated(): boolean {
    return this.backendActor !== null && this.identity !== null
  }

  // Get public profile by username (works without authentication)
  async getPublicProfile(username: string): Promise<User | null> {
    if (!this.backendActor) {
      // Try to initialize anonymously if not initialized
      try {
        await this.initializeAnonymous()
      } catch (error) {
        console.error('Failed to initialize for public profile fetch:', error)
        throw new Error('Service not available')
      }
    }

    // Check cache first
    const cached = appCacheService.getCachedProfile(username, 'username')
    if (cached) {
      console.log('Returning cached public profile for username:', username)
      return cached
    }

    try {
      // Fetch fresh data
      console.log('Fetching fresh public profile for username:', username)
      if (!this.backendActor) {
        throw new Error('Service not available')
      }
      const result = await this.backendActor.get_user_by_username(username)
      const user = handleUserResult(result)

      // Cache the result
      appCacheService.setCachedProfile(username, user, 'username')

      return user
    } catch (error) {
      console.error('Error getting public profile:', error)
      // If user not found, return null
      if (error instanceof Error && error.message.includes('UserNotFound')) {
        return null
      }
      // If profile is private, throw a specific error
      if (error instanceof Error && error.message.includes('ProfilePrivate')) {
        throw new Error('PROFILE_PRIVATE')
      }
      throw error
    }
  }

  // Get all usernames for sitemap generation
  async getAllUsernames(): Promise<string[]> {
    if (!this.backendActor) {
      // Try to initialize anonymously if not initialized
      try {
        await this.initializeAnonymous()
      } catch (error) {
        console.error('Failed to initialize for usernames fetch:', error)
        throw new Error('Service not available')
      }
    }

    try {
      console.log('Fetching all usernames for sitemap')
      if (!this.backendActor) {
        throw new Error('Service not available')
      }
      const usernames = await this.backendActor.get_all_usernames()
      return usernames
    } catch (error) {
      console.error('Error getting all usernames:', error)
      throw error
    }
  }

  // Check if user exists by querying their profile
  async getMyProfile(): Promise<User | null> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      // Get the caller's principal
      let caller = this.identity?.getPrincipal()
      if (!caller && this.agent) {
        caller = this.agent.getPrincipal()
      }
      if (!caller && window.ic?.plug?.agent) {
        // For Plug, get principal from Plug's agent
        try {
          caller = await window.ic.plug.agent.getPrincipal()
          console.log('Got principal from Plug agent:', caller)
        } catch (error) {
          console.warn('Failed to get principal from Plug agent:', error)
        }
      }
      if (!caller) {
        throw new Error('No principal available')
      }

      // Ensure caller is a proper Principal object
      let principal: Principal

      console.log('Processing caller principal:', caller)
      console.log('Caller type:', typeof caller)
      console.log(
        'Caller has toText:',
        caller && typeof caller.toText === 'function'
      )

      if (caller && typeof caller.toText === 'function') {
        principal = caller
      } else if (typeof caller === 'string') {
        principal = Principal.fromText(caller)
      } else if (caller && caller._isPrincipal) {
        // Handle Plug's principal format - try to convert to string first
        console.log('Converting Plug principal format')
        try {
          const principalText = caller.toString()
          principal = Principal.fromText(principalText)
        } catch (error) {
          console.error('Failed to convert Plug principal:', error)
          throw new Error('Invalid principal format')
        }
      } else {
        console.error('Invalid principal format:', caller)
        throw new Error('Invalid principal format')
      }

      const principalText = principal.toText()

      // Check cache first
      const cached = appCacheService.getCachedProfile(
        principalText,
        'principal'
      )
      if (cached) {
        console.log('Returning cached profile for principal:', principalText)

        // If cache is stale, refresh in background
        if (appCacheService.isProfileStale(principalText, 'principal')) {
          this.refreshProfileInBackground(principal, principalText)
        }

        return cached
      }

      // Fetch fresh data
      console.log('Fetching fresh profile for principal:', principalText)
      const result = await this.backendActor.get_user(principal)
      const user = handleUserResult(result)

      // Cache the result
      appCacheService.setCachedProfile(principalText, user, 'principal')

      return user
    } catch (error) {
      // If user not found, return null (this is expected for new users)
      if (
        error instanceof Error &&
        (error.message.includes('UserNotFound') ||
          error.message.includes('{"UserNotFound":null}'))
      ) {
        return null
      }

      // Only log actual errors
      console.error('Error getting user profile:', error)
      throw error
    }
  }

  // Background refresh method
  private async refreshProfileInBackground(
    principal: Principal,
    principalText: string
  ): Promise<void> {
    if (!this.backendActor) return

    try {
      console.log('Refreshing profile in background for:', principalText)
      const result = await this.backendActor.get_user(principal)
      const user = handleUserResult(result)
      appCacheService.setCachedProfile(principalText, user, 'principal')
      console.log('Background refresh completed for:', principalText)
    } catch (error) {
      console.warn('Background refresh failed for:', principalText, error)
    }
  }

  // Sign up a new user
  async signup(
    username: string,
    evmAddress?: string,
    bitcoinAddress?: string,
    solanaAddress?: string
  ): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.signup(
        username,
        evmAddress ? [evmAddress] : [],
        bitcoinAddress ? [bitcoinAddress] : [],
        solanaAddress ? [solanaAddress] : []
      )
      const user = handleUserResult(result)

      // Invalidate cache for this user
      appCacheService.invalidateUserCache(user)

      return user
    } catch (error) {
      console.error('Error signing up user:', error)
      throw error
    }
  }

  // Public method to clear all cache
  clearAllCache(): void {
    appCacheService.clearAllCache()
  }

  // Clear all cache (useful when follow state changes)
  clearCache(): void {
    appCacheService.clearAllCache()
  }

  // Public method to get cache stats (for debugging)
  getCacheStats(): {
    profileSize: number
    profileKeys: string[]
    hasSession: boolean
    sessionExpiresAt?: number
  } {
    return appCacheService.getCacheStats()
  }

  // Check if username is available
  async isUsernameAvailable(username: string): Promise<boolean> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.is_username_available(username)
      return result
    } catch (error) {
      console.error('Error checking username availability:', error)
      throw error
    }
  }

  // Update user profile
  async updateProfile(update: UserUpdate): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.update_profile(update)
      const user = handleUserResult(result)

      // Invalidate cache for this user
      appCacheService.invalidateUserCache(user)

      return user
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  // Individual update methods
  async updateDisplayName(displayName: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.update_display_name(displayName)
      const user = handleUserResult(result)

      // Invalidate cache for this user
      appCacheService.invalidateUserCache(user)

      return user
    } catch (error) {
      console.error('Error updating display name:', error)
      throw error
    }
  }

  async updateBio(bio: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.update_bio(bio)
      return handleUserResult(result)
    } catch (error) {
      console.error('Error updating bio:', error)
      throw error
    }
  }

  async updateAvatar(avatarUrl: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.update_avatar(avatarUrl)
      return handleUserResult(result)
    } catch (error) {
      console.error('Error updating avatar:', error)
      throw error
    }
  }

  async updateBanner(bannerUrl: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.update_banner(bannerUrl)
      return handleUserResult(result)
    } catch (error) {
      console.error('Error updating banner:', error)
      throw error
    }
  }

  async updateLocation(location: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.update_location(location)
      return handleUserResult(result)
    } catch (error) {
      console.error('Error updating location:', error)
      throw error
    }
  }

  async updateWebsite(website: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.update_website(website)
      return handleUserResult(result)
    } catch (error) {
      console.error('Error updating website:', error)
      throw error
    }
  }

  async updateEvmAddress(evmAddress: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.update_evm_address(evmAddress)
      return handleUserResult(result)
    } catch (error) {
      console.error('Error updating EVM address:', error)
      throw error
    }
  }

  async updateBitcoinAddress(bitcoinAddress: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result =
        await this.backendActor.update_bitcoin_address(bitcoinAddress)
      return handleUserResult(result)
    } catch (error) {
      console.error('Error updating Bitcoin address:', error)
      throw error
    }
  }

  async updateSolanaAddress(solanaAddress: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result =
        await this.backendActor.update_solana_address(solanaAddress)
      return handleUserResult(result)
    } catch (error) {
      console.error('Error updating Solana address:', error)
      throw error
    }
  }

  async updateUsername(newUsername: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      // First check if username is available
      const isAvailable = await this.isUsernameAvailable(newUsername)
      if (!isAvailable) {
        throw new Error('Username is already taken')
      }

      // Update username
      const result = await this.backendActor.update_username(newUsername)
      const user = handleUserResult(result)

      // Invalidate cache for this user
      appCacheService.invalidateUserCache(user)

      return user
    } catch (error) {
      console.error('Error updating username:', error)
      throw error
    }
  }

  async deleteAccount(): Promise<void> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      await this.backendActor.delete_account()
      // Clear all user-related cache after account deletion
      appCacheService.clearAllCache()
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }

  // Following/Followers methods
  async followUser(targetPrincipal: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const targetPrincipalObj = Principal.fromText(targetPrincipal)
      const result = await this.backendActor.follow_user(targetPrincipalObj)

      if ('Ok' in result) {
        // Clear cache for both users since follow state changed
        appCacheService.invalidateUserCache(result.Ok)
        return result.Ok
      } else {
        throw new Error(`Backend error: ${JSON.stringify(result.Err)}`)
      }
    } catch (error) {
      console.error('Error following user:', error)
      throw error
    }
  }

  async unfollowUser(targetPrincipal: string): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const targetPrincipalObj = Principal.fromText(targetPrincipal)
      const result = await this.backendActor.unfollow_user(targetPrincipalObj)

      if ('Ok' in result) {
        // Clear cache for both users since follow state changed
        appCacheService.invalidateUserCache(result.Ok)
        return result.Ok
      } else {
        throw new Error(`Backend error: ${JSON.stringify(result.Err)}`)
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
      throw error
    }
  }

  async getFollowing(user: string): Promise<CompactProfile[]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const userPrincipal = Principal.fromText(user)
      const result = await this.backendActor.get_following(userPrincipal)
      return result
    } catch (error) {
      console.error('Error getting following list:', error)
      throw error
    }
  }

  async getFollowers(user: string): Promise<CompactProfile[]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const userPrincipal = Principal.fromText(user)
      const result = await this.backendActor.get_followers(userPrincipal)
      return result
    } catch (error) {
      console.error('Error getting followers list:', error)
      throw error
    }
  }

  async isFollowing(follower: string, following: string): Promise<boolean> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const followerPrincipal = Principal.fromText(follower)
      const followingPrincipal = Principal.fromText(following)
      const result = await this.backendActor.is_following(
        followerPrincipal,
        followingPrincipal
      )
      return result
    } catch (error) {
      console.error('Error checking following status:', error)
      throw error
    }
  }

  // Search users (public - returns CompactProfile)
  async searchUsers(
    searchTerm: string,
    limit: number = 10
  ): Promise<CompactProfile[]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.search_users(searchTerm, limit)
      if ('Ok' in result) {
        return result.Ok
      } else {
        throw new Error(`Backend error: ${JSON.stringify(result.Err)}`)
      }
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
    }
  }

  // Personal search with follow state (don't cache this data)
  async searchUsersPersonal(
    searchTerm: string,
    limit: number,
    callerPrincipal: string
  ): Promise<CompactProfile[]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const callerPrincipalObj = Principal.fromText(callerPrincipal)
      const result = await this.backendActor.search_users_personal(
        searchTerm,
        limit,
        callerPrincipalObj
      )

      if ('Ok' in result) {
        return result.Ok
      } else {
        throw new Error(`Backend error: ${JSON.stringify(result.Err)}`)
      }
    } catch (error) {
      console.error('Error searching users personally:', error)
      throw error
    }
  }

  // Personal user lookup with follow state (don't cache this data)
  async getUserPersonal(
    targetPrincipal: string,
    callerPrincipal: string
  ): Promise<PersonalUser | null> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const targetPrincipalObj = Principal.fromText(targetPrincipal)
      const callerPrincipalObj = Principal.fromText(callerPrincipal)
      const result = await this.backendActor.get_user_personal(
        targetPrincipalObj,
        callerPrincipalObj
      )

      if ('Ok' in result) {
        return result.Ok
      } else {
        if (result.Err.UserNotFound) {
          return null
        }
        if (result.Err.ProfilePrivate) {
          throw new Error('PROFILE_PRIVATE')
        }
        throw new Error(`Backend error: ${JSON.stringify(result.Err)}`)
      }
    } catch (error) {
      console.error('Error getting user personally:', error)
      throw error
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<User | null> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    // Check cache first
    const cached = appCacheService.getCachedProfile(username, 'username')
    if (cached) {
      console.log('Returning cached profile for username:', username)

      // If cache is stale, refresh in background
      if (appCacheService.isProfileStale(username, 'username')) {
        this.refreshUserByUsernameInBackground(username)
      }

      return cached
    }

    try {
      // Fetch fresh data
      console.log('Fetching fresh profile for username:', username)
      const result = await this.backendActor.get_user_by_username(username)
      const user = handleUserResult(result)

      // Cache the result
      appCacheService.setCachedProfile(username, user, 'username')

      return user
    } catch (error) {
      console.error('Error getting user by username:', error)
      // If user not found, return null
      if (error instanceof Error && error.message.includes('UserNotFound')) {
        return null
      }
      // If profile is private, throw a specific error
      if (error instanceof Error && error.message.includes('ProfilePrivate')) {
        throw new Error('PROFILE_PRIVATE')
      }
      throw error
    }
  }

  // Background refresh method for username lookup
  private async refreshUserByUsernameInBackground(
    username: string
  ): Promise<void> {
    if (!this.backendActor) return

    try {
      console.log('Refreshing profile in background for username:', username)
      const result = await this.backendActor.get_user_by_username(username)
      const user = handleUserResult(result)
      appCacheService.setCachedProfile(username, user, 'username')
      console.log('Background refresh completed for username:', username)
    } catch (error) {
      console.warn('Background refresh failed for username:', username, error)
    }
  }

  // Get user by principal
  async getUser(principal: string): Promise<User | null> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    // Check cache first
    const cached = appCacheService.getCachedProfile(principal, 'principal')
    if (cached) {
      console.log('Returning cached profile for principal:', principal)

      // If cache is stale, refresh in background
      if (appCacheService.isProfileStale(principal, 'principal')) {
        this.refreshUserByPrincipalInBackground(principal)
      }

      return cached
    }

    try {
      // Fetch fresh data
      console.log('Fetching fresh profile for principal:', principal)
      const userPrincipal = Principal.fromText(principal)
      const result = await this.backendActor.get_user(userPrincipal)
      const user = handleUserResult(result)

      // Cache the result
      appCacheService.setCachedProfile(principal, user, 'principal')

      return user
    } catch (error) {
      console.error('Error getting user:', error)
      // If user not found, return null
      if (error instanceof Error && error.message.includes('UserNotFound')) {
        return null
      }
      // If profile is private, throw a specific error
      if (error instanceof Error && error.message.includes('ProfilePrivate')) {
        throw new Error('PROFILE_PRIVATE')
      }
      throw error
    }
  }

  // Background refresh method for principal lookup
  private async refreshUserByPrincipalInBackground(
    principal: string
  ): Promise<void> {
    if (!this.backendActor) return

    try {
      console.log('Refreshing profile in background for principal:', principal)
      const userPrincipal = Principal.fromText(principal)
      const result = await this.backendActor.get_user(userPrincipal)
      const user = handleUserResult(result)
      appCacheService.setCachedProfile(principal, user, 'principal')
      console.log('Background refresh completed for principal:', principal)
    } catch (error) {
      console.warn('Background refresh failed for principal:', principal, error)
    }
  }

  // Get user count
  async getUserCount(): Promise<bigint> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_user_count()
      return result
    } catch (error) {
      console.error('Error getting user count:', error)
      throw error
    }
  }

  // Update identity (for when user switches wallets)
  async updateIdentity(identity: Identity) {
    this.identity = identity
    await this.initialize(identity)
  }

  // Asset upload methods - upload to backend canister
  async initUpload(
    filePath: string,
    fileSize: bigint,
    chunkSize: bigint | null,
    fileHash: string
  ): Promise<void> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.init_upload(
        filePath,
        fileSize,
        chunkSize ? [chunkSize] : [],
        fileHash
      )

      if ('Err' in result) {
        throw new Error(
          `Upload initialization failed: ${JSON.stringify(result.Err)}`
        )
      }
    } catch (error) {
      console.error('Error initializing upload:', error)
      throw error
    }
  }

  async storeChunk(
    chunkId: bigint,
    chunkData: number[],
    filePath: string
  ): Promise<void> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.store_chunk(
        chunkId,
        chunkData,
        filePath
      )

      if ('Err' in result) {
        throw new Error(`Chunk upload failed: ${JSON.stringify(result.Err)}`)
      }
    } catch (error) {
      console.error('Error storing chunk:', error)
      throw error
    }
  }

  async finalizeUpload(filePath: string): Promise<string> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.finalize_upload(filePath)

      if ('Err' in result) {
        throw new Error(
          `Upload finalization failed: ${JSON.stringify(result.Err)}`
        )
      }

      return result.Ok
    } catch (error) {
      console.error('Error finalizing upload:', error)
      throw error
    }
  }

  // Get user token balances
  async getUserBalances(userPrincipal: string): Promise<Record<string, number>> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      // Convert string to Principal
      const principal = Principal.fromText(userPrincipal)
      const result = await this.backendActor.get_user_balances(principal)
      
      // Convert array of [string, bigint] to Record<string, number>
      const balances: Record<string, number> = {}
      if (Array.isArray(result)) {
        result.forEach(([symbol, amount]) => {
          balances[symbol] = Number(amount)
        })
      }
      
      return balances
    } catch (error) {
      console.error('Error getting user balances:', error)
      throw error
    }
  }

  // Get faucet claim info for a user
  async getFaucetClaim(userPrincipal: string): Promise<any> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      // Convert string to Principal
      const principal = Principal.fromText(userPrincipal)
      const result = await this.backendActor.get_faucet_claim(principal)
      return result
    } catch (error) {
      console.error('Error getting faucet claim:', error)
      throw error
    }
  }

  // Get all internal tokens
  async getAllInternalTokens(): Promise<any[]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_all_internal_tokens()
      return result
    } catch (error) {
      console.error('Error getting internal tokens:', error)
      throw error
    }
  }

  // Execute market swap
  async marketSwap(request: {
    from_token: string
    to_token: string
    amount: bigint
  }): Promise<{ Ok?: any; Err?: string }> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.market_swap(request)
      return result
    } catch (error) {
      console.error('Error executing market swap:', error)
      throw error
    }
  }

  // Get user swap transaction history
  async getUserSwapHistory(userPrincipal: string): Promise<SwapTransaction[]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const principal = Principal.fromText(userPrincipal)
      const result = await this.backendActor.get_user_swap_history(principal)
      return result
    } catch (error) {
      console.error('Error getting user swap history:', error)
      throw error
    }
  }

  // Get user swap transaction history with pagination
  async getUserSwapHistoryPaginated(
    userPrincipal: string,
    limit: number,
    offset: number
  ): Promise<SwapTransaction[]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const principal = Principal.fromText(userPrincipal)
      const result = await this.backendActor.get_user_swap_history_paginated(
        principal,
        limit,
        offset
      )
      return result
    } catch (error) {
      console.error('Error getting paginated user swap history:', error)
      throw error
    }
  }

  // Get user transaction count
  async getUserTransactionCount(userPrincipal: string): Promise<number> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const principal = Principal.fromText(userPrincipal)
      const result = await this.backendActor.get_user_transaction_count(principal)
      return result
    } catch (error) {
      console.error('Error getting user transaction count:', error)
      throw error
    }
  }

  // Portfolio data methods
  async getPortfolioData(userPrincipal: string): Promise<PortfolioData> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const principal = Principal.fromText(userPrincipal)
      const result = await this.backendActor.get_portfolio_data(principal)
      return result
    } catch (error) {
      console.error('Error getting portfolio data:', error)
      throw error
    }
  }

  // Get asset URL
  getAssetUrl(filePath: string): string {
    const backendCanisterId = getBackendCanisterId()
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (isProduction) {
      return `https://ionicswap.com:7777${filePath}`
    } else {
      return `http://${backendCanisterId}.localhost:4943${filePath}`
    }
  }

  // ============================================================================
  // LIQUIDITY STAKING OPERATIONS
  // ============================================================================

  // Get all liquidity pools
  async getAllLiquidityPools(): Promise<any[]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_all_liquidity_pools()
      return result
    } catch (error) {
      console.error('Error getting all liquidity pools:', error)
      throw error
    }
  }

  // Get liquidity pool info for a specific token
  async getLiquidityPoolInfo(tokenSymbol: string): Promise<any | null> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_liquidity_pool_info(tokenSymbol)
      // The backend returns Option<PoolInfo> which becomes null | PoolInfo in JS
      return result || null
    } catch (error) {
      console.error('Error getting liquidity pool info:', error)
      throw error
    }
  }

  // Get user's liquidity positions
  async getLiquidityPositions(userPrincipal: Principal): Promise<any[]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_liquidity_positions(userPrincipal)
      return result
    } catch (error) {
      console.error('Error getting liquidity positions:', error)
      throw error
    }
  }

  // Get liquidity system statistics with USDT conversion
  async getLiquiditySystemStats(): Promise<[bigint, bigint, number, number]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_liquidity_system_stats()
      return result
    } catch (error) {
      console.error('Error getting liquidity system stats:', error)
      throw error
    }
  }

  // Get liquidity configuration
  async getLiquidityConfig(): Promise<any> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_liquidity_config()
      return result
    } catch (error) {
      console.error('Error getting liquidity config:', error)
      throw error
    }
  }

  // Get user's liquidity transactions
  async getLiquidityTransactions(userPrincipal: Principal): Promise<any[]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_liquidity_transactions(userPrincipal)
      return result
    } catch (error) {
      console.error('Error getting liquidity transactions:', error)
      throw error
    }
  }

  // Stake tokens in liquidity pool
  async stakeTokens(tokenSymbol: string, amount: bigint, dissolveDelaySeconds: bigint): Promise<string> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.stake_tokens(tokenSymbol, amount, dissolveDelaySeconds)
      
      if (result.Ok) {
        return result.Ok
      } else {
        throw new Error(result.Err)
      }
    } catch (error) {
      console.error('Error staking tokens:', error)
      throw error
    }
  }

  // Claim accumulated fees from a liquidity position
  async claimFees(positionId: string): Promise<string> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.claim_fees(positionId)
      
      if (result.Ok) {
        return result.Ok
      } else {
        throw new Error(result.Err)
      }
    } catch (error) {
      console.error('Error claiming fees:', error)
      throw error
    }
  }

  // Start dissolving a position
  async startDissolving(positionId: string): Promise<string> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.start_dissolving(positionId)
      if (result.Ok) {
        return result.Ok
      } else {
        throw new Error(result.Err)
      }
    } catch (error) {
      console.error('Error starting dissolving:', error)
      throw error
    }
  }

  // Cancel dissolving (return to Locked)
  async cancelDissolving(positionId: string): Promise<string> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.cancel_dissolving(positionId)
      if (result.Ok) {
        return result.Ok
      } else {
        throw new Error(result.Err)
      }
    } catch (error) {
      console.error('Error cancelling dissolving:', error)
      throw error
    }
  }

  // Withdraw available amount from a dissolving or dissolved position
  async withdraw(positionId: string, amount: bigint): Promise<string> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.withdraw(positionId, amount)
      if (result.Ok) {
        return result.Ok
      } else {
        throw new Error(result.Err)
      }
    } catch (error) {
      console.error('Error withdrawing position amount:', error)
      throw error
    }
  }

  // Withdraw the full currently available amount from a position
  async withdrawAvailable(positionId: string): Promise<string> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.withdraw_available(positionId)
      if (result.Ok) {
        return result.Ok
      } else {
        throw new Error(result.Err)
      }
    } catch (error) {
      console.error('Error withdrawing available amount:', error)
      throw error
    }
  }

  // Add more tokens to an existing position
  async addToPosition(positionId: string, amount: bigint): Promise<string> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.add_to_position(positionId, amount)
      if (result.Ok) {
        return result.Ok
      } else {
        throw new Error(result.Err)
      }
    } catch (error) {
      console.error('Error adding to position:', error)
      throw error
    }
  }

  // Compound claimable fees into the staked position
  async compoundFees(positionId: string): Promise<string> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.compound_fees(positionId)
      if (result.Ok) {
        return result.Ok
      } else {
        throw new Error(result.Err)
      }
    } catch (error) {
      console.error('Error compounding fees:', error)
      throw error
    }
  }

  // Get fee analytics for a token and time period
  async getFeeAnalytics(
    tokenSymbol: string | null,
    startTime: bigint,
    endTime: bigint
  ): Promise<[bigint, bigint, bigint, bigint, bigint]> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_fee_analytics(
        tokenSymbol ? [tokenSymbol] : [],
        startTime,
        endTime
      )
      return result
    } catch (error) {
      console.error('Error getting fee analytics:', error)
      throw error
    }
  }

  // Privacy settings methods
  async getPrivacySettings(): Promise<PrivacySettings> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_privacy_settings()
      if ('Ok' in result) {
        return result.Ok
      } else {
        throw new Error(`Backend error: ${JSON.stringify(result.Err)}`)
      }
    } catch (error) {
      console.error('Error getting privacy settings:', error)
      throw error
    }
  }

  async updatePrivacySettings(settings: PrivacySettings): Promise<User> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.update_privacy_settings(settings)
      if ('Ok' in result) {
        // Invalidate cache for this user since privacy settings changed
        const user = result.Ok
        appCacheService.invalidateUserCache(user)
        return user
      } else {
        throw new Error(`Backend error: ${JSON.stringify(result.Err)}`)
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      throw error
    }
  }

  // Get current volatility for a token
  async getTokenVolatility(tokenSymbol: string): Promise<number> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.get_token_volatility(tokenSymbol)
      return result
    } catch (error) {
      console.error('Error getting token volatility:', error)
      throw error
    }
  }

  // Set liquidity configuration (admin function)
  async setLiquidityConfig(config: any): Promise<{ Ok?: string; Err?: string }> {
    if (!this.backendActor) {
      throw new Error('CanisterService not initialized')
    }

    try {
      const result = await this.backendActor.set_liquidity_config(config)
      return result
    } catch (error) {
      console.error('Error setting liquidity config:', error)
      throw error
    }
  }
}

// Export a singleton instance
export const canisterService = new CanisterService()
export default canisterService