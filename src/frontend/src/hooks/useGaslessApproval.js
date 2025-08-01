import { useState } from 'react';
import { ethers } from 'ethers';
import { SPIRAL_SEPOLIA, HTLC_CONTRACT, MINIMAL_FORWARDER, MINIMAL_FORWARDER_ABI } from '../utils/contractUtils.js';
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

      // Use ICP canister as EIP-2771 relayer for TRUE gasless approval
      console.log('🚀 Using ICP canister as EIP-2771 relayer for TRUE gasless approval...');
      
      // Connect to MinimalForwarder contract (only for nonce)
      const forwarderContract = new ethers.Contract(
        MINIMAL_FORWARDER,
        MINIMAL_FORWARDER_ABI,
        signer
      );

      // Get forwarder nonce
      const forwarderNonce = await forwarderContract.getNonce(userAddress);
      console.log('🔍 DEBUG: Forwarder nonce:', forwarderNonce.toString());

      // Get token nonce for permit
      const tokenNonce = await getNonce();
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      console.log('🔍 DEBUG: Token nonce:', tokenNonce.toString());
      console.log('🔍 DEBUG: Deadline:', deadline);
      
      // Sign the permit message first
      const { signature, sig } = await signPermitMessage(
        signer,
        userAddress,
        HTLC_CONTRACT,
        amount,
        tokenNonce,
        deadline
      );

      console.log('✅ Permit signature created:', signature);
      console.log('🔍 DEBUG: Permit sig v:', sig.v);
      console.log('🔍 DEBUG: Permit sig r:', sig.r);
      console.log('🔍 DEBUG: Permit sig s:', sig.s);

      // Encode permit function call
      const permitInterface = new ethers.utils.Interface([
        "function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s)"
      ]);
      
      const permitData = permitInterface.encodeFunctionData("permit", [
        userAddress,
        HTLC_CONTRACT,
        ethers.utils.parseUnits(amount, 8),
        deadline,
        sig.v,
        sig.r,
        sig.s
      ]);

      console.log('🔍 DEBUG: Permit data length:', permitData.length);
      console.log('🔍 DEBUG: Permit data:', permitData);

      // Create forward request
      const forwardRequest = {
        from: userAddress,
        to: SPIRAL_SEPOLIA,
        value: "0",
        gas: "200000",
        nonce: forwarderNonce.toString(),
        data: permitData,
        validUntil: deadline.toString()
      };

      console.log('📝 Creating forward request...');
      console.log('🔍 DEBUG: Forward request:', forwardRequest);

      // Sign the forward request
      const forwarderSignature = await signer._signTypedData(
        {
          name: "MinimalForwarder",
          version: "0.0.1",
          chainId: 11155111,
          verifyingContract: MINIMAL_FORWARDER
        },
        {
          ForwardRequest: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "gas", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "data", type: "bytes" },
            { name: "validUntil", type: "uint256" }
          ]
        },
        forwardRequest
      );

      console.log('✅ Forward request signed, submitting to ICP canister...');
      console.log('🔍 DEBUG: Forwarder signature:', forwarderSignature);

      // Submit to ICP canister for execution (ICP pays gas for execute() call)
      const result = await backendActor.execute_gasless_approval({
        forward_request: forwardRequest,
        forward_signature: forwarderSignature,
        user_address: userAddress,
        amount: amount
      });

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