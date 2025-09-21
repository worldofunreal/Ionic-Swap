export type WalletType =
  | 'metamask'
  | 'phantom'
  | 'internet-identity'
  | 'plug'
  | 'unisat'
  | 'xverse'
  | 'hiro'
  | 'leather'
  | 'rabby'
  | 'magic-eden'
  | 'local'

export interface WalletCapabilities {
  icp: boolean
  evm: boolean
  sol: boolean
  btc: boolean
}

export interface CrossChainAuthResult {
  principal: string
  evmAddress?: string
  solAddress?: string
  btcAddress?: string
  nativeWallet: string
  signature?: string
  mnemonic?: string // Add mnemonic field for local wallet
}

export interface WalletAdapter {
  type: WalletType
  capabilities: WalletCapabilities
  authenticate(): Promise<CrossChainAuthResult>
}
