import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { fetchICRCBalance, approveICRCToken } from '../../utils/icrc';
import { useAuth } from '../../contexts/AuthContext';
import TokenSelector from './TokenSelector';
import AmountInput from './AmountInput';
import SwapSummary from './SwapSummary';
import NotificationManager from '../ui/NotificationManager';

const SwapForm = ({
  sourceToken,
  destinationToken,
  onSourceTokenChange,
  onDestinationTokenChange,
  amount,
  onAmountChange,
  destinationAddress,
  onDestinationAddressChange,
  user,
  actor
}) => {
  const { getIdentity } = useAuth();
  const [sourceBalance, setSourceBalance] = useState('0');
  const [destinationBalance, setDestinationBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [sourceAmount, setSourceAmount] = useState('');
  const [destinationAmount, setDestinationAmount] = useState('');
  const [swapStatus, setSwapStatus] = useState('idle'); // idle, processing, success, error
  const [swapProgress, setSwapProgress] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Stop polling when starting a new swap
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Poll order status until resolved
  const startOrderPolling = (orderId, sourceToken, destinationToken, sourceAmount, destinationAmount, direction) => {
    // Start polling for order status
    
    // Add notification for this order
    const notificationId = `order-${orderId}`;
    setNotifications(prev => [...prev, {
      id: notificationId,
      orderId,
      sourceToken: sourceToken?.symbol || 'SPIRAL',
      destinationToken: destinationToken?.symbol || 'STARDUST',
      sourceAmount,
      destinationAmount,
      direction,
      status: 'waiting',
      duration: null // No auto-close
    }]);
    
    const interval = setInterval(async () => {
      try {
        const orderDetails = await actor.get_atomic_swap_order(orderId);
        if (orderDetails && orderDetails.length > 0 && orderDetails[0]) {
          const order = orderDetails[0];
          // Check order pairing status
          
          // Check if order has been paired (counter_order_id is not null and not empty array)
          if (order.counter_order_id && order.counter_order_id.length > 0) {
            // Order paired, stopping polling
            clearInterval(interval);
            setPollingInterval(null);
            setSwapStatus('success');
            setSwapProgress('Swap completed successfully!');
            
            // Update notification to success
            setNotifications(prev => prev.map(notif => 
              notif.orderId === orderId 
                ? { ...notif, status: 'completed' }
                : notif
            ));
            
            await fetchBalances();
          }
        }
      } catch (error) {
        console.error('Error polling order status:', error);
      }
    }, 1000); // Check every second
    
    setPollingInterval(interval);
    setSwapProgress('Order created successfully! Waiting for counter-order... (Polling for updates)');
  };

  // Close notification handler
  const handleCloseNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  // Get nonce from ERC20 token contract
  const getNonce = async (tokenAddress, userAddress) => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not connected');
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const nonce = await tokenContract.nonces(userAddress);
      return nonce;
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw error;
    }
  };

  // Token addresses (from our test script)
  const SPIRAL_TOKEN = '0xdE7409EDeA573D090c3C6123458D6242E26b425E';
  const STARDUST_TOKEN = '0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90';
  const HTLC_CONTRACT = '0x7cFC05b92549ae96D758516B9A2b50D114d6ad0d'; // Updated to match test script
  
  // Debug function to check contract deployment
  const checkContractDeployment = async (contractAddress) => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const code = await provider.getCode(contractAddress);
        return code !== '0x';
      }
      return false;
    } catch (error) {
      console.error('Error checking contract deployment:', error);
      return false;
    }
  };

  // Debug function to get contract info
  const getContractInfo = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        
        return {
          chainId: network.chainId,
          chainName: network.name,
          htlcDeployed: await checkContractDeployment(HTLC_CONTRACT),
          spiralDeployed: await checkContractDeployment(SPIRAL_TOKEN),
          stardustDeployed: await checkContractDeployment(STARDUST_TOKEN),
          userAddress: user?.evmAddress,
          userBalance: user?.evmAddress ? await provider.getBalance(user.evmAddress) : null
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting contract info:', error);
      return null;
    }
  };

  // Debug function to calculate event signature
  const calculateEventSignature = () => {
    try {
      const eventSignature = "HTLCCreated(bytes32,address,address,uint256,bytes32,uint256,address,uint8,uint8,bool)";
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
      console.log('Calculated HTLCCreated event signature:', hash);
      console.log('Backend expects:', '0x84531b127d0bd83b1d32956f33727af69ab12eef7ff40a6ee1fdd2b64cb104dd');
      console.log('Match:', hash === '0x84531b127d0bd83b1d32956f33727af69ab12eef7ff40a6ee1fdd2b64cb104dd');
      return hash;
    } catch (error) {
      console.error('Error calculating event signature:', error);
      return null;
    }
  };

  // Debug function to check transaction receipt
  const checkTransactionReceipt = async (txHash) => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const receipt = await provider.getTransactionReceipt(txHash);
        console.log('Transaction Receipt:', receipt);
        
        if (receipt && receipt.logs) {
          console.log('Transaction Logs:');
          receipt.logs.forEach((log, index) => {
            console.log(`Log ${index}:`, {
              address: log.address,
              topics: log.topics,
              data: log.data
            });
          });
        }
        
        return receipt;
      }
      return null;
    } catch (error) {
      console.error('Error checking transaction receipt:', error);
      return null;
    }
  };

  // Debug function to test HTLC contract
  const testHTLCContract = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Simple ABI for basic HTLC functions
        const htlcAbi = [
          'function htlcCounter() view returns (uint256)',
          'function icpNetworkSigner() view returns (address)',
          'function claimFee() view returns (uint256)',
          'function refundFee() view returns (uint256)'
        ];
        
        const htlcContract = new ethers.Contract(HTLC_CONTRACT, htlcAbi, provider);
        
        const counter = await htlcContract.htlcCounter();
        const signer = await htlcContract.icpNetworkSigner();
        const claimFee = await htlcContract.claimFee();
        const refundFee = await htlcContract.refundFee();
        
        console.log('HTLC Contract Test Results:');
        console.log('  HTLC Counter:', counter.toString());
        console.log('  ICP Network Signer:', signer);
        console.log('  Claim Fee:', ethers.utils.formatEther(claimFee));
        console.log('  Refund Fee:', ethers.utils.formatEther(refundFee));
        
        return {
          counter: counter.toString(),
          signer,
          claimFee: ethers.utils.formatEther(claimFee),
          refundFee: ethers.utils.formatEther(refundFee)
        };
      }
      return null;
    } catch (error) {
      console.error('Error testing HTLC contract:', error);
      return null;
    }
  };

  // ICRC Canister IDs - Local development
  const SPIRAL_ICRC_CANISTER_ID = 'umunu-kh777-77774-qaaca-cai';
  const STARDUST_ICRC_CANISTER_ID = 'ulvla-h7777-77774-qaacq-cai';
  const BACKEND_CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';

  // Default tokens
  const defaultSourceToken = {
    id: 'spiral-sepolia',
    symbol: 'SPIRAL',
    name: 'Spiral Token',
    icon: '🌀',
    network: 'Sepolia',
    type: 'evm',
    address: SPIRAL_TOKEN
  };

  const defaultDestinationToken = {
    id: 'stardust-icp',
    symbol: 'STARDUST',
    name: 'Stardust Token',
    icon: '⭐',
    network: 'ICP',
    type: 'icrc',
    canisterId: STARDUST_ICRC_CANISTER_ID
  };

  // ERC20 ABI for balanceOf and nonces
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function nonces(address owner) view returns (uint256)'
  ];

  // Set default tokens if none provided
  useEffect(() => {
    if (!sourceToken) {
      onSourceTokenChange(defaultSourceToken);
    }
    if (!destinationToken) {
      onDestinationTokenChange(defaultDestinationToken);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBalances();
    }
  }, [user, sourceToken, destinationToken]);

  // Fetch balances immediately when component mounts
  useEffect(() => {
    if (user) {
      fetchBalances();
    }
  }, [user]);

  const fetchBalances = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch source balance
      if (sourceToken?.type === 'evm') {
        // Source is Sepolia (EVM)
        if (user.evmAddress && window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const contract = new ethers.Contract(sourceToken.address, erc20Abi, provider);
          const tokenBalance = await contract.balanceOf(user.evmAddress);
          const formattedBalance = ethers.utils.formatUnits(tokenBalance, 8);
          setSourceBalance(parseFloat(formattedBalance).toFixed(2));
        }
      } else if (sourceToken?.type === 'icrc') {
        // Source is ICP
        if (user.icpPrincipal) {
          const identity = getIdentity();
          if (identity) {
            const balance = await fetchICRCBalance(sourceToken.canisterId, user.icpPrincipal, identity);
            setSourceBalance(balance);
          }
        }
      }

      // Fetch destination balance
      if (destinationToken?.type === 'evm') {
        // Destination is Sepolia (EVM)
        if (user.evmAddress && window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const contract = new ethers.Contract(destinationToken.address, erc20Abi, provider);
          const tokenBalance = await contract.balanceOf(user.evmAddress);
          const formattedBalance = ethers.utils.formatUnits(tokenBalance, 8);
          setDestinationBalance(parseFloat(formattedBalance).toFixed(2));
        }
      } else if (destinationToken?.type === 'icrc') {
        // Destination is ICP
        if (user.icpPrincipal) {
          const identity = getIdentity();
          if (identity) {
            const balance = await fetchICRCBalance(destinationToken.canisterId, user.icpPrincipal, identity);
            setDestinationBalance(balance);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSwapDirection = () => {
    if (sourceToken?.type === 'evm' && destinationToken?.type === 'icrc') {
      return 'evm-to-icp';
    } else if (sourceToken?.type === 'icrc' && destinationToken?.type === 'evm') {
      return 'icp-to-evm';
    }
    return null;
  };

  // EIP-2612 permit helpers (from test script)
  const createPermitDomain = (tokenAddress) => {
    // Determine token name based on address
    let tokenName = 'Spiral'; // Default
    if (tokenAddress.toLowerCase() === STARDUST_TOKEN.toLowerCase()) {
      tokenName = 'Stardust';
    }
    
    return {
      name: tokenName,
      version: '1',
      chainId: 11155111, // Sepolia
      verifyingContract: tokenAddress
    };
  };

  const createPermitTypes = () => ({
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  });

  const createPermitMessage = (owner, spender, value, nonce, deadline) => ({
    owner,
    spender,
    value: ethers.utils.parseUnits(value, 8), // Both tokens have 8 decimals
    nonce,
    deadline
  });

  const signPermitMessage = async (signer, owner, spender, value, nonce, deadline, tokenAddress) => {
    const domain = createPermitDomain(tokenAddress);
    const types = createPermitTypes();
    const message = createPermitMessage(owner, spender, value, nonce, deadline);

    console.log('🔍 Signing permit message:', { domain, types, message, tokenAddress });

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

  const handleSwap = async () => {
    if (!actor || !user) {
      alert('Please connect your wallet first');
      return;
    }

    if (!sourceAmount || !destinationAmount) {
      alert('Please enter amounts for both sides of the swap');
      return;
    }

    // Validate amounts
    const sourceAmountNum = parseFloat(sourceAmount);
    const destinationAmountNum = parseFloat(destinationAmount);
    
    if (sourceAmountNum <= 0 || destinationAmountNum <= 0) {
      alert('Please enter valid amounts greater than 0');
      return;
    }

    // Check if user has sufficient balance
    const sourceBalanceNum = parseFloat(sourceBalance);
    if (sourceAmountNum > sourceBalanceNum) {
      alert(`Insufficient balance. You have ${sourceBalance} ${sourceToken?.symbol}, but trying to swap ${sourceAmount} ${sourceToken?.symbol}`);
      return;
    }

    setSwapStatus('processing');
    setSwapProgress('Initializing swap...');

    try {
      const direction = getSwapDirection();
      console.log('Starting swap:', { direction, sourceAmount, destinationAmount });

      // Check if contracts are deployed
      if (direction === 'evm-to-icp') {
        setSwapProgress('Checking contract deployments...');
        const htlcDeployed = await checkContractDeployment(HTLC_CONTRACT);
        const tokenDeployed = await checkContractDeployment(sourceToken.address);
        
        if (!htlcDeployed) {
          throw new Error('HTLC contract is not deployed at the expected address. Please check deployment.');
        }
        if (!tokenDeployed) {
          throw new Error('Token contract is not deployed at the expected address. Please check deployment.');
        }
        console.log('All contracts are deployed');
      }

      // Note: Nonce is already initialized by the backend
      console.log('Proceeding with swap - nonce should already be initialized');

      if (direction === 'evm-to-icp') {
        await handleEvmToIcpSwap();
      } else if (direction === 'icp-to-evm') {
        await handleIcpToEvmSwap();
      } else {
        throw new Error('Invalid swap direction');
      }

    } catch (error) {
      console.error('Swap failed:', error);
      setSwapStatus('error');
      setSwapProgress(`Swap failed: ${error.message}`);
      alert(`Swap failed: ${error.message}`);
    }
  };

  const handleEvmToIcpSwap = async () => {
    try {
      // Stop any existing polling
      stopPolling();
      // Step 2: Create EIP-2612 permit for EVM tokens
      setSwapProgress('Creating permit for EVM tokens...');
      
      if (!window.ethereum) {
        throw new Error('MetaMask not connected');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Get nonce from token contract
      const tokenContract = new ethers.Contract(sourceToken.address, erc20Abi, provider);
      const nonce = await tokenContract.nonces(user.evmAddress);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      // Sign the permit - use human-readable amount like in test script
      const permitResult = await signPermitMessage(
        signer,
        user.evmAddress,
        HTLC_CONTRACT,
        sourceAmount, // Human-readable amount (e.g., "10")
        nonce,
        deadline,
        sourceToken.address
      );

      console.log('Permit signed successfully');
      console.log('🔍 Amounts being used:');
      console.log('  Source amount (human):', sourceAmount);
      console.log('  Source amount (raw):', ethers.utils.parseUnits(sourceAmount, 8).toString());
      console.log('  Destination amount (human):', destinationAmount);
      console.log('  Destination amount (raw):', ethers.utils.parseUnits(destinationAmount, 8).toString());

      // Step 3: Create EVM→ICP order
      setSwapProgress('Creating EVM→ICP order...');
      
      console.log('🔍 EVM→ICP Order Creation Debug:');
      console.log('  User EVM Address:', user.evmAddress);
      console.log('  Source Token Address:', sourceToken.address);
      console.log('  Destination Token Canister:', destinationToken.canisterId);
      console.log('  Source Amount:', ethers.utils.parseUnits(sourceAmount, 8).toString());
      console.log('  Destination Amount:', ethers.utils.parseUnits(destinationAmount, 8).toString());
      console.log('  ICP Destination Principal:', user.icpPrincipal);
      
      const permitRequest = {
        owner: user.evmAddress,
        spender: HTLC_CONTRACT,
        value: ethers.utils.parseUnits(sourceAmount, 8).toString(),
        nonce: nonce.toString(),
        deadline: deadline.toString(),
        v: permitResult.sig.v.toString(),
        r: permitResult.sig.r,
        s: permitResult.sig.s,
        signature: permitResult.signature
      };

      const orderResult = await actor.create_evm_to_icp_order(
        user.evmAddress,
        sourceToken.address,
        destinationToken.canisterId,
        ethers.utils.parseUnits(sourceAmount, 8).toString(),
        ethers.utils.parseUnits(destinationAmount, 8).toString(),
        user.icpPrincipal,
        BigInt(3600), // 1 hour timelock
        permitRequest
      );

      if ('Err' in orderResult) {
        const errorMsg = orderResult.Err;
        console.error('Order creation failed:', errorMsg);
        
        // Try to extract transaction hash from any response
        const txHashMatch = errorMsg.match(/0x[a-fA-F0-9]{64}/);
        const txHash = txHashMatch ? txHashMatch[0] : null;
        
        if (txHash) {
          console.log('🔍 Transaction hash found:', txHash);
          console.log('🔍 Check transaction at: https://sepolia.etherscan.io/tx/' + txHash);
        }
        
        // Provide more specific error messages
        if (errorMsg.includes('HTLCCreated event not found')) {
          
          let debugInfo = 'HTLC creation failed: Transaction may have failed or event not emitted.\n\n';
          debugInfo += 'Possible causes:\n';
          debugInfo += '1. HTLC contract not deployed at expected address\n';
          debugInfo += '2. Insufficient token balance\n';
          debugInfo += '3. Network connectivity issues\n';
          debugInfo += '4. Contract interaction failed\n';
          debugInfo += '5. Event signature mismatch\n\n';
          debugInfo += 'Please check:\n';
          debugInfo += '- Token balance is sufficient\n';
          debugInfo += '- You are connected to Sepolia testnet\n';
          debugInfo += '- Try the debug button to check contract deployment\n';
          
          if (txHash) {
            debugInfo += `- Transaction hash: ${txHash}\n`;
            debugInfo += '- Check transaction receipt for actual events emitted';
            
            // Automatically check the transaction receipt
            setTimeout(() => {
              checkTransactionReceipt(txHash);
            }, 1000);
          }
          
          throw new Error(debugInfo);
        } else if (errorMsg.includes('permit')) {
          throw new Error('Permit execution failed: Please ensure you have sufficient tokens and try again.');
        } else {
          throw new Error(`Failed to create order: ${errorMsg}`);
        }
      }

      const orderId = orderResult.Ok.split("Order ID: ")[1].split(",")[0];
      setOrderId(orderId);
      console.log('Order created:', orderId);
      
      // Extract and log transaction hash from successful response
      const txHashMatch = orderResult.Ok.match(/0x[a-fA-F0-9]{64}/);
      if (txHashMatch) {
        const txHash = txHashMatch[0];
        console.log('🔍 Transaction hash:', txHash);
        console.log('🔍 Check transaction at: https://sepolia.etherscan.io/tx/' + txHash);
      }

      // Step 4: Note about ICRC-2 allowance for ICP user
      setSwapProgress('Note: ICP user needs to approve tokens...');
      
      // For EVM→ICP swaps, the ICP user (destination) needs to approve tokens
      // This would normally be done by the ICP user's wallet
      // For now, we'll continue without this step as it requires the ICP user's action
      console.log('ICRC-2 allowance step (requires ICP user action)');

      // Step 5: Check order status after creation
      setSwapProgress('Checking order status...');
      
      // Get order details to check status
      const orderDetails = await actor.get_atomic_swap_order(orderId);
      console.log('Raw order details:', orderDetails);
      
      if (orderDetails && orderDetails.length > 0 && orderDetails[0]) {
        const order = orderDetails[0];
        console.log('Order counter_order_id:', order.counter_order_id);
        console.log('Order counter_order_id type:', typeof order.counter_order_id);
        console.log('Order counter_order_id length:', order.counter_order_id?.length);
        
        // Check if order has been paired (counter_order_id is not null and not empty array)
        if (order.counter_order_id && order.counter_order_id.length > 0) {
          setSwapStatus('success');
          setSwapProgress('Swap completed successfully!');
          console.log('Swap completed automatically!');
          
          // Update notification to success
          setNotifications(prev => prev.map(notif => 
            notif.orderId === orderId 
              ? { ...notif, status: 'completed' }
              : notif
          ));
          
          // Refresh balances
          await fetchBalances();
        } else {
          setSwapStatus('idle'); // Reset to idle so user can continue swapping
          setSwapProgress('');
          console.log('Order created, waiting for counter-order');
          // Start polling for order completion
          startOrderPolling(orderId, sourceToken, destinationToken, sourceAmount, destinationAmount, getSwapDirection());
        }
      } else {
        setSwapStatus('idle'); // Reset to idle so user can continue swapping
        setSwapProgress('');
        console.log('Order created, waiting for counter-order');
        // Start polling for order completion
        startOrderPolling(orderId, sourceToken, destinationToken, sourceAmount, destinationAmount, getSwapDirection());
      }

    } catch (error) {
      throw error;
    }
  };

  const handleIcpToEvmSwap = async () => {
    try {
      // Stop any existing polling
      stopPolling();
      // Step 1: Create ICRC-2 allowance for ICP tokens
      setSwapProgress('Creating ICRC-2 allowance...');
      
      const identity = getIdentity();
      if (!identity) {
        throw new Error('ICP identity not available');
      }

      // Approve the backend canister to spend ICP tokens
      const approvalAmount = ethers.utils.parseUnits(sourceAmount, 8).toString();
      const approvalResult = await approveICRCToken(
        sourceToken.canisterId,
        BACKEND_CANISTER_ID,
        approvalAmount,
        identity
      );

      if ('Err' in approvalResult) {
        throw new Error(`Failed to approve ICP tokens: ${approvalResult.Err}`);
      }

      console.log('ICRC-2 allowance created successfully');

      // Step 2: Create ICP→EVM order
      setSwapProgress('Creating ICP→EVM order...');
      
      console.log('🔍 ICP→EVM Order Creation Debug:');
      console.log('  User Principal:', user.icpPrincipal);
      console.log('  Source Token Canister:', sourceToken.canisterId);
      console.log('  Destination Token Address:', destinationToken.address);
      console.log('  Source Amount:', ethers.utils.parseUnits(sourceAmount, 8).toString());
      console.log('  Destination Amount:', ethers.utils.parseUnits(destinationAmount, 8).toString());
      console.log('  EVM Destination Address:', user.evmAddress);
      
      const orderResult = await actor.create_icp_to_evm_order(
        user.icpPrincipal,
        sourceToken.canisterId,
        destinationToken.address,
        ethers.utils.parseUnits(sourceAmount, 8).toString(),
        ethers.utils.parseUnits(destinationAmount, 8).toString(),
        user.evmAddress, // Use the user's EVM address from AuthContext
        BigInt(3600) // 1 hour timelock
      );

      if ('Err' in orderResult) {
        throw new Error(`Failed to create order: ${orderResult.Err}`);
      }

      const orderId = orderResult.Ok.split("Order ID: ")[1].split(",")[0];
      setOrderId(orderId);
      console.log('Order created:', orderId);

      // Step 3: Check order status after creation
      setSwapProgress('Checking order status...');
      
      // Get order details to check status
      const orderDetails = await actor.get_atomic_swap_order(orderId);
      console.log('Raw order details:', orderDetails);
      
      if (orderDetails && orderDetails.length > 0 && orderDetails[0]) {
        const order = orderDetails[0];
        console.log('Order counter_order_id:', order.counter_order_id);
        console.log('Order counter_order_id type:', typeof order.counter_order_id);
        console.log('Order counter_order_id length:', order.counter_order_id?.length);
        
        // Check if order has been paired (counter_order_id is not null and not empty array)
        if (order.counter_order_id && order.counter_order_id.length > 0) {
          setSwapStatus('success');
          setSwapProgress('Swap completed successfully!');
          console.log('Swap completed automatically!');
          
          // Update notification to success
          setNotifications(prev => prev.map(notif => 
            notif.orderId === orderId 
              ? { ...notif, status: 'completed' }
              : notif
          ));
          
          // Refresh balances
          await fetchBalances();
        } else {
          setSwapStatus('idle'); // Reset to idle so user can continue swapping
          setSwapProgress('');
          console.log('Order created, waiting for counter-order');
          // Start polling for order completion
          startOrderPolling(orderId, sourceToken, destinationToken, sourceAmount, destinationAmount, getSwapDirection());
        }
      } else {
        setSwapStatus('idle'); // Reset to idle so user can continue swapping
        setSwapProgress('');
        console.log('Order created, waiting for counter-order');
        // Start polling for order completion
        startOrderPolling(orderId, sourceToken, destinationToken, sourceAmount, destinationAmount, getSwapDirection());
      }

    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Notification Manager */}
      {notifications.length > 0 && (
        <NotificationManager
          notifications={notifications}
          onCloseNotification={handleCloseNotification}
        />
      )}
      
      {/* Main Swap Card */}
      <div className="bg-neutral-800/10 rounded-xl border border-neutral-700 p-4 space-y-0">
        {/* You Send Section */}
        <div className="space-y-1 mb-0">
          <div className="flex items-center bg-neutral-700/10 rounded-lg p-3 pt-4 border border-neutral-600 relative">
            {/* Balance on top right */}
            <div className="absolute top-1 right-2 flex items-center space-x-2">
              <div className="text-xs text-neutral-400">
                <span className="font-medium text-white">{loading ? 'Loading...' : `${sourceBalance} ${sourceToken?.symbol || 'SPIRAL'}`}</span>
              </div>
              <button
                type="button"
                onClick={() => setSourceAmount(sourceBalance)}
                disabled={loading}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  loading 
                    ? 'bg-neutral-600 text-neutral-500 cursor-not-allowed' 
                    : 'bg-neutral-600 hover:bg-neutral-500 text-white'
                }`}
              >
                Max
              </button>
            </div>
            
            {/* Token Selection - 50% width */}
            <div className="w-1/2 pr-2">
              <TokenSelector
                value={sourceToken}
                onChange={onSourceTokenChange}
                user={user}
              />
            </div>
            
            {/* Amount Input - 50% width, positioned at bottom */}
            <div className="w-1/2 pl-2 absolute bottom-2 right-2">
              <AmountInput
                value={sourceAmount}
                onChange={setSourceAmount}
                token={sourceToken?.symbol || 'SPIRAL'}
                user={user}
              />
            </div>
          </div>
        </div>

        {/* Swap Direction Indicator */}
        <div className="justify-center flex space-y-1">
          <div className="mt-1 mb-1 w-6 h-6 z-20 bg-neutral-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>

        {/* You Get Section */}
        <div className="">
          <div className="flex items-center bg-neutral-700/10 rounded-lg p-3 pt-4 border border-neutral-600 relative">
            {/* Balance on top right */}
            <div className="absolute top-1 right-2 flex items-center space-x-2">
              <div className="text-xs text-neutral-400">
                <span className="font-medium text-white">{loading ? 'Loading...' : `${destinationBalance} ${destinationToken?.symbol || 'STARDUST'}`}</span>
              </div>
              <button
                type="button"
                onClick={() => setDestinationAmount(destinationBalance)}
                disabled={loading}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  loading 
                    ? 'bg-neutral-600 text-neutral-500 cursor-not-allowed' 
                    : 'bg-neutral-600 hover:bg-neutral-500 text-white'
                }`}
              >
                Max
              </button>
            </div>
            
            {/* Token Selection - 50% width */}
            <div className="w-1/2 pr-2">
              <TokenSelector
                value={destinationToken}
                onChange={onDestinationTokenChange}
                user={user}
              />
            </div>
            
            {/* Amount Input - 50% width, positioned at bottom */}
            <div className="w-1/2 pl-2 absolute bottom-2 right-2">
              <AmountInput
                value={destinationAmount}
                onChange={setDestinationAmount}
                token={destinationToken?.symbol || 'STARDUST'}
                user={user}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Swap Status Display */}
      {swapStatus !== 'idle' && (
        <div className={`bg-neutral-800/10 rounded-xl border p-4 ${
          swapStatus === 'success' ? 'border-green-500' : 
          swapStatus === 'error' ? 'border-red-500' : 
          'border-blue-500'
        }`}>
          <div className="flex items-center space-x-2">
            {swapStatus === 'processing' && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
            {swapStatus === 'success' && (
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {swapStatus === 'error' && (
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="text-sm text-white">{swapProgress}</span>
          </div>
          {orderId && (
            <div className="mt-2 text-xs text-neutral-400">
              Order ID: {orderId}
            </div>
          )}
        </div>
      )}

      {/* Swap Summary */}
      <SwapSummary
        direction={getSwapDirection()}
        sourceToken={sourceToken?.symbol || 'SPIRAL'}
        destinationToken={destinationToken?.symbol || 'STARDUST'}
        sourceAmount={sourceAmount}
        destinationAmount={destinationAmount}
        destinationAddress={user?.evmAddress || user?.icpPrincipal || ''}
        onSwap={handleSwap}
        isLoading={loading || swapStatus === 'processing'}
        swapStatus={swapStatus}
      />
    </div>
  );
};

export default SwapForm; 