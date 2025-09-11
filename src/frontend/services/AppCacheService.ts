import type { User } from '../../declarations/backend/backend.did'

// Cache interface for profile data
interface ProfileCache {
  data: User
  timestamp: number
  expiresAt: number
}

// Session cache interface
interface SessionCache {
  authenticated: boolean
  registered: boolean
  principal: string
  evmAddress: string
  solAddress: string
  btcAddress: string
  nativeWallet: string
  canisterInitialized: boolean
  mnemonic?: string // Optional mnemonic for session restoration
  originalSignature?: string // Original signature for wallet-specific restoration
  originalPrincipal?: string // Original principal for Internet Identity restoration
  originalWalletType?: string // Original wallet type used for authentication
  timestamp: number
  expiresAt: number
}

class AppCacheService {
  // Profile cache storage
  private profileCache = new Map<string, ProfileCache>()
  private sessionCache: SessionCache | null = null

  // Cache settings
  private profileCacheExpiryTime = 5 * 60 * 1000 // 5 minutes
  private sessionCacheExpiryTime = 24 * 60 * 60 * 1000 // 24 hours
  private backgroundRefreshTime = 30 * 1000 // 30 seconds

  constructor() {
    // Load session from localStorage on initialization (client-side only)
    if (typeof window !== 'undefined') {
      this.loadSessionFromStorage()
    }
  }

  // ===== SESSION MANAGEMENT =====

  // Save session to localStorage
  private saveSessionToStorage(session: SessionCache): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('nftropoly_session', JSON.stringify(session))
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error)
    }
  }

  // Load session from localStorage
  private loadSessionFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('nftropoly_session')
      if (stored) {
        const session = JSON.parse(stored) as SessionCache
        if (this.isSessionValid(session)) {
          this.sessionCache = session
          console.log('Session loaded from localStorage')
        } else {
          console.log('Stored session expired, clearing')
          localStorage.removeItem('nftropoly_session')
        }
      }
    } catch (error) {
      console.warn('Failed to load session from localStorage:', error)
      localStorage.removeItem('nftropoly_session')
    }
  }

  // Check if session is valid
  private isSessionValid(session: SessionCache): boolean {
    return Date.now() < session.expiresAt
  }

  // Save current session
  saveSession(sessionData: Partial<SessionCache>): void {
    const now = Date.now()
    this.sessionCache = {
      authenticated: false,
      registered: false,
      principal: '',
      evmAddress: '',
      solAddress: '',
      btcAddress: '',
      nativeWallet: '',
      canisterInitialized: false,
      timestamp: now,
      expiresAt: now + this.sessionCacheExpiryTime,
      ...sessionData,
    }

    this.saveSessionToStorage(this.sessionCache)
    console.log('Session saved to cache and localStorage')
  }

  // Get current session
  getSession(): SessionCache | null {
    return this.sessionCache
  }

  // Clear session
  clearSession(): void {
    this.sessionCache = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nftropoly_session')
    }
    console.log('Session cleared from cache and localStorage')
  }

  // Update session data
  updateSession(updates: Partial<SessionCache>): void {
    if (this.sessionCache) {
      this.sessionCache = { ...this.sessionCache, ...updates }
      this.saveSessionToStorage(this.sessionCache)
      console.log('Session updated')
    }
  }

  // ===== PROFILE CACHE MANAGEMENT =====

  private getCacheKey(
    identifier: string,
    type: 'username' | 'principal' = 'username'
  ): string {
    return `${type}:${identifier}`
  }

  private isCacheValid(cache: ProfileCache): boolean {
    return Date.now() < cache.expiresAt
  }

  private isCacheStale(cache: ProfileCache): boolean {
    return Date.now() > cache.timestamp + this.backgroundRefreshTime
  }

  private setCache(key: string, data: User): void {
    const now = Date.now()
    this.profileCache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.profileCacheExpiryTime,
    })
  }

  private getCache(key: string): ProfileCache | null {
    const cache = this.profileCache.get(key)
    if (!cache) return null

    if (!this.isCacheValid(cache)) {
      this.profileCache.delete(key)
      return null
    }

    return cache
  }

  private clearCache(): void {
    this.profileCache.clear()
  }

  // Public profile cache methods
  getCachedProfile(
    identifier: string,
    type: 'username' | 'principal' = 'username'
  ): User | null {
    const cacheKey = this.getCacheKey(identifier, type)
    const cached = this.getCache(cacheKey)

    if (cached) {
      console.log(`Returning cached profile for ${type}:`, identifier)
      return cached.data
    }

    return null
  }

  setCachedProfile(
    identifier: string,
    data: User,
    type: 'username' | 'principal' = 'username'
  ): void {
    const cacheKey = this.getCacheKey(identifier, type)
    this.setCache(cacheKey, data)
    console.log(`Cached profile for ${type}:`, identifier)
  }

  isProfileStale(
    identifier: string,
    type: 'username' | 'principal' = 'username'
  ): boolean {
    const cacheKey = this.getCacheKey(identifier, type)
    const cached = this.getCache(cacheKey)

    if (!cached) return true

    return this.isCacheStale(cached)
  }

  invalidateUserCache(user: User): void {
    // Clear cache entries for this user by principal and username
    if (user.id) {
      const principalKey = this.getCacheKey(user.id.toText(), 'principal')
      this.profileCache.delete(principalKey)
    }

    if (user.username) {
      const usernameKey = this.getCacheKey(user.username, 'username')
      this.profileCache.delete(usernameKey)
    }

    console.log(
      'Invalidated cache for user:',
      user.username || user.id?.toText()
    )
  }

  // ===== GENERAL CACHE MANAGEMENT =====

  clearAllCache(): void {
    this.clearCache()
    this.clearSession()
    console.log('All app cache cleared')
  }

  getCacheStats(): {
    profileSize: number
    profileKeys: string[]
    hasSession: boolean
    sessionExpiresAt?: number
  } {
    return {
      profileSize: this.profileCache.size,
      profileKeys: Array.from(this.profileCache.keys()),
      hasSession: this.sessionCache !== null,
      sessionExpiresAt: this.sessionCache?.expiresAt,
    }
  }

  // Get all cached profiles (for debugging)
  getAllCachedProfiles(): User[] {
    return Array.from(this.profileCache.values()).map(cache => cache.data)
  }

  // Check if a profile is cached
  isProfileCached(
    identifier: string,
    type: 'username' | 'principal' = 'username'
  ): boolean {
    const cacheKey = this.getCacheKey(identifier, type)
    return this.getCache(cacheKey) !== null
  }

  // ===== UTILITY METHODS =====

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.sessionCache?.authenticated === true
  }

  // Get user principal
  getPrincipal(): string | null {
    return this.sessionCache?.principal || null
  }

  // Get wallet addresses
  getWalletAddresses(): {
    evmAddress: string
    solAddress: string
    btcAddress: string
    nativeWallet: string
  } {
    return {
      evmAddress: this.sessionCache?.evmAddress || '',
      solAddress: this.sessionCache?.solAddress || '',
      btcAddress: this.sessionCache?.btcAddress || '',
      nativeWallet: this.sessionCache?.nativeWallet || '',
    }
  }
}

// Export a singleton instance
export const appCacheService = new AppCacheService()
export default appCacheService
