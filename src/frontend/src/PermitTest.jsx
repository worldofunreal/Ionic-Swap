import { useState } from 'react';
import { ethers } from 'ethers';
import { SPIRAL_TOKEN, HTLC_CONTRACT, SEPOLIA_CHAIN_ID } from './utils/contractUtils.js';
import { createPermitDomain, createPermitTypes, createPermitMessage } from './utils/gaslessUtils.js';

const PermitTest = ({ signer, userAddress }) => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testDirectPermit = async () => {
    if (!signer || !userAddress) {
      setTestResult('Wallet not connected');
      return;
    }

    try {
      setLoading(true);
      setTestResult('Testing direct permit...');

      // Create token contract instance
      const tokenContract = new ethers.Contract(
        SPIRAL_TOKEN,
        [
          'function nonces(address owner) view returns (uint256)',
          'function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s)',
          'function DOMAIN_SEPARATOR() view returns (bytes32)'
        ],
        signer
      );

      // Create permit parameters with current nonce
      const amount = "234234"; // Use same amount as ICP gasless approval
      const nonce = await tokenContract.nonces(userAddress);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      console.log('🔍 Current nonce:', nonce.toString());
      console.log('🔍 Deadline:', deadline);

      // Get domain separator from contract
      const domainSeparator = await tokenContract.DOMAIN_SEPARATOR();
      console.log('🔍 Contract domain separator:', domainSeparator);

      // Create permit message using exact same domain as working script
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
        nonce: nonce,
        deadline: deadline
      };

      console.log('🔍 Domain:', domain);
      console.log('🔍 Types:', types);
      console.log('🔍 Message:', message);

      // Calculate our domain separator
      const ourDomainSeparator = ethers.utils._TypedDataEncoder.hashDomain(domain);
      console.log('🔍 Our domain separator:', ourDomainSeparator);
      console.log('🔍 Domain separator match:', ourDomainSeparator === domainSeparator);

      // Sign the permit
      const signature = await signer._signTypedData(domain, types, message);
      const sig = ethers.utils.splitSignature(signature);

      console.log('🔍 Signature:', signature);
      console.log('🔍 Sig components:', sig);

      // Encode permit call
      const permitData = tokenContract.interface.encodeFunctionData('permit', [
        userAddress,
        HTLC_CONTRACT,
        ethers.utils.parseUnits(amount, 8),
        deadline,
        sig.v,
        sig.r,
        sig.s
      ]);

      console.log('🔍 Permit data:', permitData);

      // Send the transaction directly
      const tx = await tokenContract.permit(
        userAddress,
        HTLC_CONTRACT,
        ethers.utils.parseUnits(amount, 8),
        deadline,
        sig.v,
        sig.r,
        sig.s,
        { gasLimit: 100000 }
      );

      console.log('🔍 Transaction sent:', tx.hash);
      setTestResult(`Direct permit successful! TX: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('🔍 Transaction confirmed:', receipt);
      setTestResult(`Direct permit confirmed! TX: ${tx.hash}`);

    } catch (error) {
      console.error('Direct permit failed:', error);
      setTestResult(`Direct permit failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px', borderRadius: '8px' }}>
      <h3>Permit Test (Direct from Wallet)</h3>
      <p>This will send a permit directly from your wallet to test the signature format.</p>
      <button 
        onClick={testDirectPermit} 
        disabled={loading || !signer}
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        {loading ? 'Testing...' : 'Test Direct Permit'}
      </button>
      {testResult && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <strong>Result:</strong> {testResult}
        </div>
      )}
    </div>
  );
};

export default PermitTest; 