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
  UserResult,
  UserUpdate,
  CompactProfile,
  PersonalUser,
} from '../../declarations/backend/backend.did'

// Helper function to handle UserResult
const handleUserResult = (result: UserResult): User => {
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

      // Create HTTP agent with proper configuration
      this.agent = new HttpAgent({
        host: 'http://127.0.0.1:4943', // Use local development
        identity: this.identity || undefined,
      })

      // For local development, fetch the local replica's root key
      console.log('Using local development agent...')
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
      // Create HTTP agent without identity for anonymous access
      this.agent = new HttpAgent({
        host: 'http://127.0.0.1:4943', // Use local development
      })

      // For local development, fetch the local replica's root key
      console.log('Using local development agent (anonymous)...')
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

  // Get asset URL
  getAssetUrl(filePath: string): string {
    const backendCanisterId = getBackendCanisterId()
    return `http://${backendCanisterId}.localhost:4943${filePath}`
  }
}

// Export a singleton instance
export const canisterService = new CanisterService()
export default canisterService