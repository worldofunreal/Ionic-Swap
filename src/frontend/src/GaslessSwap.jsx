import { useState, useEffect } from 'react';
import { useActor } from './useActor';

// Custom hooks
import { useWalletConnection } from './hooks/useWalletConnection';
import { useTokenContract } from './hooks/useTokenContract';
import { useGaslessApproval } from './hooks/useGaslessApproval';
import { useSwapIntent } from './hooks/useSwapIntent';

// UI Components
import NetworkSelector from './components/NetworkSelector';
import TokenBalance from './components/TokenBalance';
import StatusDisplay from './components/StatusDisplay';
import GaslessApprovalButton from './components/GaslessApprovalButton';
import SwapIntentForm from './components/SwapIntentForm';
import PermitTest from './PermitTest';

const GaslessSwap = () => {
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  
  const { actor: backendActor } = useActor();

  // Custom hooks for business logic
  const {
    provider,
    signer,
    userAddress,
    isCorrectNetwork,
    error: walletError,
    connectWallet,
    checkAndSwitchNetwork
  } = useWalletConnection();

  const {
    tokenContract,
    tokenName,
    tokenBalance,
    error: tokenError,
    getNonce
  } = useTokenContract(provider, signer, userAddress);

  const {
    approvalStatus,
    error: approvalError,
    gaslessApprove
  } = useGaslessApproval(signer, userAddress, tokenContract, getNonce);

  const {
    intentStatus,
    error: intentError,
    submitGaslessSwapIntent
  } = useSwapIntent(signer, userAddress);

  // Auto-connect wallet on mount
  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
    }
  }, []);

  // Handle approval using ICP canister as EIP-2771 relayer
  const handleApprove = async () => {
    if (!amount) return;
    await gaslessApprove(amount, backendActor);
  };

  // Handle swap intent submission
  const handleSubmitIntent = async () => {
    if (!amount) return;
    await submitGaslessSwapIntent(amount, backendActor);
  };

  // Combine all errors
  const error = walletError || tokenError || approvalError || intentError;



  return (
    <div className="gasless-swap-container">
      <h2>Gasless Swap Interface</h2>
      
      <NetworkSelector 
        isCorrectNetwork={isCorrectNetwork}
        error={walletError}
        onConnectWallet={connectWallet}
        onSwitchNetwork={checkAndSwitchNetwork}
      />
      
      <div className="swap-form">
        <TokenBalance 
          tokenName={tokenName}
          tokenBalance={tokenBalance}
          amount={amount}
          onAmountChange={setAmount}
          isDisabled={approvalStatus !== 'idle' || !isCorrectNetwork}
        />

        <StatusDisplay 
          approvalStatus={approvalStatus}
          intentStatus={intentStatus}
          isCorrectNetwork={isCorrectNetwork}
          txHash={txHash}
          error={error}
        />

        <div className="button-group">
          <GaslessApprovalButton 
            amount={amount}
            isCorrectNetwork={isCorrectNetwork}
            approvalStatus={approvalStatus}
            onApprove={handleApprove}
          />
          
          <SwapIntentForm 
            approvalStatus={approvalStatus}
            intentStatus={intentStatus}
            onSubmitIntent={handleSubmitIntent}
          />
        </div>
      </div>

      <PermitTest signer={signer} userAddress={userAddress} />

      <div className="info-panel">
        <h3>How it works:</h3>
        <ol>
          <li><strong>Network Check:</strong> Ensures MetaMask is on Sepolia network</li>
          <li><strong>TRUE Gasless Approval:</strong> User signs EIP-2612 permit + EIP-2771 forward request, ICP canister calls execute()</li>
          <li><strong>Intent Submission:</strong> Signs swap intent off-chain with EIP-712</li>
          <li><strong>Cross-chain Execution:</strong> ICP canister processes the swap (next stage)</li>
        </ol>
        <p><strong>Note:</strong> This is TRUE gasless - user only signs messages, ICP canister pays ALL gas fees!</p>
        <p><strong>EIP-2771 Flow:</strong> User signs → ICP calls execute() → MinimalForwarder pays for permit() → TRUE gasless!</p>
      </div>
    </div>
  );
};

export default GaslessSwap; 