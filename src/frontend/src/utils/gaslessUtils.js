import { ethers } from 'ethers';
import { SPIRAL_TOKEN, SEPOLIA_CHAIN_ID } from './contractUtils.js';

/**
 * Create EIP-2612 permit domain for Spiral token
 */
export const createPermitDomain = () => ({
  name: 'Spiral',
  version: '1',
  chainId: SEPOLIA_CHAIN_ID,
  verifyingContract: SPIRAL_TOKEN
});

/**
 * Create EIP-2612 permit types
 */
export const createPermitTypes = () => ({
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
});

/**
 * Create permit message for signing
 */
export const createPermitMessage = (owner, spender, value, nonce, deadline) => ({
  owner,
  spender,
  value: ethers.utils.parseUnits(value, 8), // Spiral has 8 decimals
  nonce,
  deadline
});

/**
 * Sign EIP-2612 permit message
 */
export const signPermitMessage = async (signer, owner, spender, value, nonce, deadline) => {
  const domain = createPermitDomain();
  const types = createPermitTypes();
  const message = createPermitMessage(owner, spender, value, nonce, deadline);

  console.log('Signing permit message:', { domain, types, message });

  const signature = await signer._signTypedData(domain, types, message);
  const sig = ethers.utils.splitSignature(signature);

  return {
    signature,
    sig,
    domain,
    types,
    message
  };
};

/**
 * Verify EIP-2612 permit signature
 */
export const verifyPermitSignature = (domain, types, message, signature) => {
  try {
    const recoveredAddress = ethers.utils.verifyTypedData(domain, types, message, signature);
    return {
      isValid: true,
      recoveredAddress
    };
  } catch (error) {
    console.error('Signature verification failed:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

/**
 * Create permit data for ICP submission
 */
export const createPermitData = (owner, spender, value, deadline, sig, signature) => ({
  owner,
  spender,
  value: ethers.utils.parseUnits(value, 8).toString(),
  deadline,
  v: sig.v,
  r: sig.r,
  s: sig.s,
  signature
}); 