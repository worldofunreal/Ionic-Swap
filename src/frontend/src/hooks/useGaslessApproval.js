import { useState } from 'react';
import { ethers } from 'ethers';
import { SPIRAL_SEPOLIA, HTLC_CONTRACT } from '../utils/contractUtils.js';
import { 
  signPermitMessage, 
  verifyPermitSignature
} from '../utils/gaslessUtils.js';

export const useGaslessApproval = (signer, userAddress, tokenContract, getNonce) => {
  const [approvalStatus, setApprovalStatus] = useState('idle');
  const [error, setError] = useState('');

  const gaslessApprove = async (amount, backendActor) => {
    if (!signer || !userAddress || !tokenContract || !getNonce) {
      setError('Wallet or token contract not initialized');
      return false;
    }

    try {
      setApprovalStatus('approving');
      setError('');

      // Get current nonce for permit
      const nonce = await getNonce();
      console.log('Current nonce:', nonce.toString());

      // Set deadline (1 hour from now)
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      console.log('Deadline:', deadline);

      // Sign the permit message
      const { signature, sig, domain, types, message } = await signPermitMessage(
        signer,
        userAddress,
        HTLC_CONTRACT,
        amount,
        nonce,
        deadline
      );

      console.log('Permit signature:', signature);

      // Verify signature before submitting
      const verification = verifyPermitSignature(domain, types, message, signature);
      if (!verification.isValid) {
        throw new Error(`Signature verification failed: ${verification.error}`);
      }

      console.log('✅ User signed permit, submitting to ICP canister...');
      console.log('This is TRUE gasless - user only signs, ICP handles permit execution!');
      
      // Create permit data for ICP submission
      const permitData = {
        token_address: SPIRAL_SEPOLIA,
        owner: userAddress,
        spender: HTLC_CONTRACT,
        value: ethers.utils.parseUnits(amount, 8).toString(),
        deadline: deadline,
        v: sig.v,
        r: sig.r,
        s: sig.s,
        signature: signature
      };

      // Submit to ICP canister
              const result = await backendActor.submit_permit_signature(permitData);

      if (result.Ok) {
        setApprovalStatus('approved');
        console.log('✅ TRUE Gasless approval submitted to ICP!');
        console.log('ICP canister will handle permit execution');
        return true;
      } else {
        throw new Error('Failed to submit permit signature to ICP');
      }
      
    } catch (err) {
      console.error('Gasless approval failed:', err);
      setError(err.message);
      setApprovalStatus('error');
      return false;
    }
  };

  return {
    approvalStatus,
    error,
    gaslessApprove
  };
}; 