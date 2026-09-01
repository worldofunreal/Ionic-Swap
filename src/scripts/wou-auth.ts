/**
 * Ionic Swap — WOU-ID client (derived from worldofunreal.com/src/scripts/wou-auth.ts)
 * Context: ionic_swap, callback: https://ionicswap.com/auth/callback
 */
export const ID_SERVER_URL = 'https://id.worldofunreal.com';
export const AUTH_HUB_CALLBACK_URL = 'https://worldofunreal.com/auth/callback';

export type SocialProvider = 'discord' | 'google' | 'twitter' | 'meta';
export type AuthProvider = SocialProvider | 'email' | 'ethereum' | 'solana' | 'icp' | 'passkey' | 'anonymous' | string;

export interface EmbeddedWallets {
  evm_address: string;
  solana_address: string;
  icp_principal: string;
  btc_bech32_address?: string;
  derived_at: number;
}
export interface LinkedIdentity { provider: AuthProvider; external_id: string; linked_at: number; }
export interface UserProfile { avatar_url?: string; avatar_id?: string; noble_animal?: string; country?: string; bio?: string; custom_attributes?: Record<string, unknown>; }
export interface PlayerAccount {
  id: string; username: string; display_name: string; email?: string; newsletter_opt_in: boolean;
  kind: 'human' | 'bot'; clan_tag?: string; clan_role?: 'owner' | 'elder' | 'member';
  embedded_wallets: EmbeddedWallets; linked_identities: LinkedIdentity[]; profile: UserProfile;
  created_at: number; updated_at: number;
}
export interface AuthResponse { status: string; account: PlayerAccount; session_token: string; is_new_account?: boolean; }

export class WouAuthClient {
  private sessionToken: string | null = null;
  private user: PlayerAccount | null = null;
  private defaultContext = 'ionic_swap';
  constructor() { if (typeof window !== 'undefined') this.initSession(); }

  public initSession(): PlayerAccount | null {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('session_token');
    const accParam = urlParams.get('account');
    if (tokenFromUrl && accParam) {
      try {
        const account = JSON.parse(decodeURIComponent(accParam)) as PlayerAccount;
        this.setSession(tokenFromUrl, account);
        urlParams.delete('session_token'); urlParams.delete('account');
        const cleanSearch = urlParams.toString();
        const newUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        return this.user;
      } catch (e) { console.error('SSO parse fail', e); }
    }
    const savedToken = localStorage.getItem('wou_session_token');
    const savedUser = localStorage.getItem('wou_user_data');
    if (savedToken && savedUser) {
      try { this.sessionToken = savedToken; this.user = JSON.parse(savedUser); } catch { this.logout(); }
    }
    return this.user;
  }
  public setSession(token: string, account: PlayerAccount): void {
    this.sessionToken = token; this.user = account;
    if (typeof window !== 'undefined') {
      localStorage.setItem('wou_session_token', token);
      localStorage.setItem('wou_user_data', JSON.stringify(account));
      window.dispatchEvent(new CustomEvent('wou:auth-state-change', { detail: { authenticated: true, user: account, token } }));
    }
  }
  public logout(): void {
    this.sessionToken = null; this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wou_session_token'); localStorage.removeItem('wou_user_data');
      // legacy key cleanup
      localStorage.removeItem('wou_session');
      window.dispatchEvent(new CustomEvent('wou:auth-state-change', { detail: { authenticated: false, user: null, token: null } }));
    }
  }
  public getUser(): PlayerAccount | null { return this.user; }
  public getSessionToken(): string | null { return this.sessionToken; }
  public isAuthenticated(): boolean { return !!this.sessionToken && !!this.user; }

  public openModal(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wou:open-auth-modal'));
      document.getElementById('wou-auth-modal')?.classList.remove('hidden');
    }
  }
  public closeModal(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wou:close-auth-modal'));
      document.getElementById('wou-auth-modal')?.classList.add('hidden');
    }
  }

  public async requestOtp(email: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${ID_SERVER_URL}/api/v1/auth/otp/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Failed to send code.'); return data;
  }
  public async verifyOtp(email: string, code: string): Promise<AuthResponse> {
    const res = await fetch(`${ID_SERVER_URL}/api/v1/auth/otp/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, account_id: this.user?.id || null, context: this.defaultContext }) });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Invalid code.'); this.setSession(data.session_token, data.account); this.closeModal(); return data;
  }
  public loginWithOAuth(provider: SocialProvider): void {
    const returnTo = typeof window !== 'undefined' ? window.location.href : '';
    const accountId = this.user?.id || '';
    if (typeof window !== 'undefined') sessionStorage.setItem('wou_oauth_provider', provider);
    const stateObj = { returnTo, accountId, provider };
    let statePayload = ''; try { statePayload = btoa(unescape(encodeURIComponent(JSON.stringify(stateObj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch { statePayload = encodeURIComponent(JSON.stringify(stateObj)); }
    const targetUrl = `${ID_SERVER_URL}/api/v1/auth/oauth/login/${provider}?redirect_uri=${encodeURIComponent(AUTH_HUB_CALLBACK_URL)}&state=${encodeURIComponent(statePayload)}`;
    if (typeof window !== 'undefined') window.location.href = targetUrl;
  }
  public async loginWithEthereum(): Promise<AuthResponse> {
    const ethereum = (window as any)?.ethereum; if (!ethereum) throw new Error('MetaMask not found.');
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' }); const publicAddress = accounts[0];
    const cr = await fetch(`${ID_SERVER_URL}/api/v1/auth/web3/challenge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chain: 'ethereum', public_address: publicAddress }) }); const cd = await cr.json(); if (!cr.ok) throw new Error(cd.error || 'Challenge failed.');
    const signature = await ethereum.request({ method: 'personal_sign', params: [cd.message, publicAddress] });
    const vr = await fetch(`${ID_SERVER_URL}/api/v1/auth/web3/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chain: 'ethereum', public_address: publicAddress, signature, message: cd.message, account_id: this.user?.id || null, context: this.defaultContext }) }); const data = await vr.json(); if (!vr.ok) throw new Error(data.error || 'Verify failed.'); this.setSession(data.session_token, data.account); this.closeModal(); return data;
  }
  public async loginWithSolana(): Promise<AuthResponse> {
    const phantom = (window as any)?.phantom?.solana || (window as any)?.solana; if (!phantom || !phantom.isPhantom) throw new Error('Phantom not found.');
    const connectResp = await phantom.connect(); const publicAddress = connectResp.publicKey.toString();
    const cr = await fetch(`${ID_SERVER_URL}/api/v1/auth/web3/challenge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chain: 'solana', public_address: publicAddress }) }); const cd = await cr.json(); if (!cr.ok) throw new Error(cd.error || 'Challenge failed.');
    const messageBytes = new TextEncoder().encode(cd.message); const signedData = await phantom.signMessage(messageBytes, 'utf8');
    let signatureHex = ''; if (signedData.signature) { const sigArr = Array.from(new Uint8Array(signedData.signature)); signatureHex = '0x' + sigArr.map((b: number) => b.toString(16).padStart(2, '0')).join(''); }
    const vr = await fetch(`${ID_SERVER_URL}/api/v1/auth/web3/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chain: 'solana', public_address: publicAddress, signature: signatureHex, message: cd.message, account_id: this.user?.id || null, context: this.defaultContext }) }); const data = await vr.json(); if (!vr.ok) throw new Error(data.error || 'Verify failed.'); this.setSession(data.session_token, data.account); this.closeModal(); return data;
  }
  public async loginWithIcp(): Promise<AuthResponse> {
    const { AuthClient } = await import('@dfinity/auth-client');
    const authClient = await AuthClient.create({ idleOptions: { disableDefaultIdleCallback: true, disableIdle: true } });
    return new Promise((resolve, reject) => {
      authClient.login({
        identityProvider: 'https://id.ai/authorize', maxTimeToLive: BigInt(8) * BigInt(3_600_000_000_000),
        onSuccess: async () => {
          try {
            const principal = authClient.getIdentity().getPrincipal().toText();
            const cr = await fetch(`${ID_SERVER_URL}/api/v1/auth/web3/challenge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chain: 'icp', public_address: principal }) }); const cd = await cr.json(); if (!cr.ok) throw new Error(cd.error || 'Challenge failed.');
            const vr = await fetch(`${ID_SERVER_URL}/api/v1/auth/web3/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chain: 'icp', public_address: principal, signature: 'ICP_DELEGATION_PROVEN', message: cd.message, account_id: this.user?.id || null, context: this.defaultContext }) }); const data = await vr.json(); if (!vr.ok) throw new Error(data.error || 'Verify failed.'); this.setSession(data.session_token, data.account); this.closeModal(); resolve(data);
          } catch (e: any) { reject(new Error(e.message || 'ICP login failed.')); }
        }, onError: (err) => reject(new Error(err || 'ICP cancelled.'))
      });
    });
  }
}

export const wouAuth = new WouAuthClient();
