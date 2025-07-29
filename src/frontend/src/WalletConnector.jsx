import { AuthClient } from '@dfinity/auth-client';

export const connectEthereum = async () => {
  if(window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return window.ethereum.selectedAddress;
  }
  throw new Error('Ethereum wallet not detected');
};

export const connectICP = async () => {
  const authClient = await AuthClient.create();
  const isAuthenticated = await authClient.isAuthenticated();
  
  if(!isAuthenticated) {
    await authClient.login({
      identityProvider: 'https://identity.ic0.app',
      maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000) // 7 days
    });
  }
  
  return authClient.getIdentity().getPrincipal().toString();
};