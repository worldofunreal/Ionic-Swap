import { Actor, HttpAgent } from '@dfinity/agent'
import type { Identity } from '@dfinity/agent'
import { idlFactory } from '../../declarations/marketplace'
import type {
  _SERVICE,
  Account,
  ManageAskRequest,
  ManageBidRequest,
  AskInfoRequest,
  BalanceRequest,
  AskInfoResponse,
  BalanceResult,
  ManageAskResponse,
  ManageBidResponse,
  AskFeature,
  BidFeature,
} from '../../declarations/marketplace/marketplace.did'
// Get marketplace canister ID
const getMarketplaceCanisterId = () => {
  // In development, use local canister ID
  if (process.env.NODE_ENV === 'development') {
    return 'uzt4z-lp777-77774-qaabq-cai' // From your .dfx/local/canister_ids.json
  }
  // In production, use mainnet canister ID
  return 'your-mainnet-marketplace-id'
}

class MarketplaceService {
  private agent: HttpAgent | null = null
  private marketplaceActor: _SERVICE | null = null
  private identity: Identity | undefined = undefined

  async initialize(identity?: Identity): Promise<void> {
    try {
      this.identity = identity

      // Create HttpAgent with identity
      this.agent = new HttpAgent({
        host:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:4943'
            : 'https://ic0.app',
        identity: this.identity,
      })

      // Fetch root key for local development
      if (process.env.NODE_ENV === 'development') {
        await this.agent.fetchRootKey()
      }

      // Create Actor using generated IDL factory
      this.marketplaceActor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: getMarketplaceCanisterId(),
      })

      console.log('MarketplaceService initialized successfully')
    } catch (error) {
      console.error('Failed to initialize MarketplaceService:', error)
      throw error
    }
  }

  // Health check - returns string
  async healthCheck(): Promise<string> {
    if (!this.marketplaceActor) {
      throw new Error('Marketplace canister is not deployed or not initialized')
    }
    return await this.marketplaceActor.health_check()
  }

  // Get metadata - returns array of [string, string] tuples
  async getMetadata(): Promise<[string, string][]> {
    if (!this.marketplaceActor) {
      throw new Error('Marketplace canister is not deployed or not initialized')
    }
    return await this.marketplaceActor.get_metadata()
  }

  // Get approved tokens - returns Principal array or null
  async getApprovedTokens(): Promise<string[] | null> {
    if (!this.marketplaceActor) {
      throw new Error('Marketplace actor not initialized')
    }
    const result = await this.marketplaceActor.icrc8_approved_tokens()
    return result[0] ? result[0].map(principal => principal.toString()) : null
  }

  // Set metadata - returns Ok/Err result
  async setMetadata(
    key: string,
    value: string
  ): Promise<{ Ok: null } | { Err: string }> {
    if (!this.marketplaceActor) {
      throw new Error('Marketplace actor not initialized')
    }
    return await this.marketplaceActor.set_metadata(key, value)
  }

  // ICRC-8 Ask operations
  async manageAsk(
    requests: ManageAskRequest[]
  ): Promise<[[] | [ManageAskRequest], [] | [ManageAskResponse]][]> {
    if (!this.marketplaceActor) {
      throw new Error('Marketplace actor not initialized')
    }

    // Convert to optional array format expected by canister
    const optionalRequests = requests.map(req => [req] as [ManageAskRequest])
    return await this.marketplaceActor.icrc8_ask(optionalRequests)
  }

  // ICRC-8 Bid operations
  async manageBid(
    requests: ManageBidRequest[]
  ): Promise<[[] | [ManageBidRequest], [] | [ManageBidResponse]][]> {
    if (!this.marketplaceActor) {
      throw new Error('Marketplace actor not initialized')
    }

    // Convert to optional array format expected by canister
    const optionalRequests = requests.map(req => [req] as [ManageBidRequest])
    return await this.marketplaceActor.icrc8_bid(optionalRequests)
  }

  // Get ask information
  async getAskInfo(
    requests: AskInfoRequest[]
  ): Promise<[[] | [AskInfoRequest], [] | [AskInfoResponse]][]> {
    if (!this.marketplaceActor) {
      throw new Error('Marketplace actor not initialized')
    }

    // Convert to optional array format expected by canister
    const optionalRequests = requests.map(req => [req] as [AskInfoRequest])
    return await this.marketplaceActor.icrc8_ask_info(optionalRequests)
  }

  // Get balance information
  async getBalanceOf(
    accounts: [Account, BalanceRequest[] | null][]
  ): Promise<[Account, BalanceResult[]][]> {
    if (!this.marketplaceActor) {
      throw new Error('Marketplace actor not initialized')
    }

    // Convert to optional array format expected by canister
    const optionalRequests = accounts.map(
      ([account, requests]) =>
        [
          account,
          requests ? [requests.map(req => [req] as [BalanceRequest])] : [],
        ] as [Account, [] | [[BalanceRequest][]]]
    )

    return await this.marketplaceActor.icrc8_balance_of(optionalRequests)
  }

  // Helper method to create a new ask
  async createNewAsk(
    features: AskFeature[]
  ): Promise<ManageAskResponse | null> {
    const newAskRequest: ManageAskRequest = {
      NewAsk: features.map(f => [f] as [AskFeature]),
    }
    const result = await this.manageAsk([newAskRequest])

    if (result[0] && result[0][1] && result[0][1][0]) {
      return result[0][1][0]
    }

    return null
  }

  // Helper method to end an ask
  async endAsk(askId: bigint): Promise<ManageAskResponse | null> {
    const endAskRequest: ManageAskRequest = { EndAsk: askId }
    const result = await this.manageAsk([endAskRequest])

    if (result[0] && result[0][1] && result[0][1][0]) {
      return result[0][1][0]
    }

    return null
  }

  // Helper method to create a new bid
  async createNewBid(
    askId: bigint,
    features: BidFeature[]
  ): Promise<ManageBidResponse | null> {
    const newBidRequest: ManageBidRequest = {
      NewBid: {
        ask_id: askId,
        feature: features.map(f => [f] as [BidFeature]),
      },
    }
    const result = await this.manageBid([newBidRequest])

    if (result[0] && result[0][1] && result[0][1][0]) {
      return result[0][1][0]
    }

    return null
  }
}

export const marketplaceService = new MarketplaceService()
