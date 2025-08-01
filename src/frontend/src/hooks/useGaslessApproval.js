import { useState } from 'react';
import { ethers } from 'ethers';
import { SPIRAL_TOKEN, HTLC_CONTRACT } from '../utils/contractUtils.js';
import { 
  signPermitMessage, 
  verifyPermitSignature
} from '../utils/gaslessUtils.js';

export const useGaslessApproval = (signer, userAddress, tokenContract, getNonce) => {
  const [approvalStatus, setApprovalStatus] = useState('idle');
  const [error, setError] = useState('');

  const gaslessApprove = async (amount, backendActor) => {
    if (!signer || !userAddress || !tokenContract || !getNonce || !backendActor) {
      setError('Wallet, token contract, or backend actor not initialized');
      return false;
    }

    try {
      setApprovalStatus('approving');
      setError('');

      // Use ICP canister to directly call permit on the token contract
      console.log('🚀 Using ICP canister to directly call permit on token contract...');
      
      // Get current nonce RIGHT BEFORE signing to ensure it's fresh (same as PermitTest.jsx)
      const tokenNonce = await tokenContract.nonces(userAddress);
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      console.log('🔍 DEBUG: Current token nonce:', tokenNonce.toString());
      console.log('🔍 DEBUG: Deadline:', deadline);
      
      // Sign the permit message using the exact same domain structure as the working test
      const domain = {
        name: 'Spiral',
        version: '1',
        chainId: 11155111,
        verifyingContract: SPIRAL_TOKEN
      };
      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };
      const message = {
        owner: userAddress,
        spender: HTLC_CONTRACT,
        value: ethers.utils.parseUnits(amount, 8),
        nonce: tokenNonce,
        deadline: deadline
      };

      const signature = await signer._signTypedData(domain, types, message);
      const sig = ethers.utils.splitSignature(signature);

      console.log('✅ Permit signature created:', signature);
      console.log('🔍 DEBUG: Permit sig v:', sig.v);
      console.log('🔍 DEBUG: Permit sig r:', sig.r);
      console.log('🔍 DEBUG: Permit sig s:', sig.s);

      // Create permit request for ICP canister
      const permitRequest = {
        owner: userAddress,
        spender: HTLC_CONTRACT,
        value: ethers.utils.parseUnits(amount, 8).toString(),
        nonce: tokenNonce.toString(), // Send the user's nonce that was used in the signature
        deadline: deadline.toString(),
        v: sig.v.toString(),
        r: sig.r.toString(),
        s: sig.s.toString(),
        signature: signature
      };

      console.log('📝 Creating permit request...');
      console.log('🔍 DEBUG: Permit request:', permitRequest);
      console.log('🔍 DEBUG: sig.r type:', typeof sig.r, 'value:', sig.r);
      console.log('🔍 DEBUG: sig.s type:', typeof sig.s, 'value:', sig.s);
      console.log('🔍 DEBUG: permitRequest.r type:', typeof permitRequest.r, 'value:', permitRequest.r);
      console.log('🔍 DEBUG: permitRequest.s type:', typeof permitRequest.s, 'value:', permitRequest.s);

      // Verify all required fields are present
      const requiredFields = ['owner', 'spender', 'value', 'deadline', 'v', 'r', 's', 'signature'];
      const missingFields = requiredFields.filter(field => !permitRequest.hasOwnProperty(field));
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Submit to ICP canister for direct execution
      const requestData = {
        permit_request: permitRequest,
        user_address: userAddress,
        amount: amount
      };
      
      console.log('🔍 DEBUG: Full request data:', requestData);
      console.log('🔍 DEBUG: permit_request keys:', Object.keys(permitRequest));
      console.log('🔍 DEBUG: requestData keys:', Object.keys(requestData));
      
      const result = await backendActor.execute_gasless_approval(requestData);

      if (result.Ok) {
        setApprovalStatus('approved');
        console.log('✅ TRUE Gasless approval executed by ICP canister!');
        console.log('Result:', result.Ok);
        return true;
      } else {
        throw new Error('Failed to execute gasless approval via ICP canister');
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