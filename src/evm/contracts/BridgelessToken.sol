// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title BridgelessToken
 * @dev Root ERC20 token with multi-chain ledger management capabilities
 * This contract acts as the immutable source of truth for cross-chain token operations
 */
contract BridgelessToken is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // ============================================================================
    // EVENTS
    // ============================================================================

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    event ChainCreated(string indexed chainId, address indexed ledgerAddress, bytes initData);
    event CrossChainTransferAuthorized(
        bytes32 indexed transferId,
        uint256 amount,
        string targetChain,
        address recipient,
        uint256 timestamp
    );
    event LedgerUpdated(string indexed chainId, address indexed oldLedger, address indexed newLedger);
    event ThresholdSignerUpdated(address indexed oldSigner, address indexed newSigner);

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    // Standard ERC20 mappings
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Multi-chain ledger registry
    mapping(string => address) public chainLedgers;
    mapping(string => bool) public supportedChains;
    
    // Cross-chain transfer tracking
    mapping(bytes32 => bool) public processedTransfers;
    mapping(bytes32 => CrossChainTransfer) public transferDetails;
    
    // Threshold signature management
    address public thresholdSigner;
    mapping(bytes32 => bool) public usedSignatures;
    
    // ============================================================================
    // STRUCTS
    // ============================================================================

    struct CrossChainTransfer {
        uint256 amount;
        string targetChain;
        address recipient;
        uint256 timestamp;
        bool processed;
    }

    struct ChainInitData {
        string chainType; // "EVM", "ICP", "COSMOS", etc.
        bytes initParams;
        address ledgerAddress;
    }

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    constructor(
        string memory _name,
        string memory _symbol,
        address _thresholdSigner
    ) {
        name = _name;
        symbol = _symbol;
        thresholdSigner = _thresholdSigner;
        
        // Mark this chain as supported
        supportedChains["EVM"] = true;
        chainLedgers["EVM"] = address(this);
    }

    // ============================================================================
    // CHAIN MANAGEMENT FUNCTIONS (OWNER ONLY)
    // ============================================================================

    /**
     * @dev Create a new chain ledger for the token
     * @param chainId Unique identifier for the chain
     * @param initData Initialization data for the chain
     */
    function createChain(string calldata chainId, ChainInitData calldata initData) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(bytes(chainId).length > 0, "Chain ID cannot be empty");
        require(!supportedChains[chainId], "Chain already exists");
        require(initData.ledgerAddress != address(0), "Invalid ledger address");
        
        // Register the new chain
        supportedChains[chainId] = true;
        chainLedgers[chainId] = initData.ledgerAddress;
        
        emit ChainCreated(chainId, initData.ledgerAddress, abi.encode(initData));
    }

    /**
     * @dev Update ledger address for an existing chain
     * @param chainId Chain identifier
     * @param newLedgerAddress New ledger contract address
     */
    function updateLedger(string calldata chainId, address newLedgerAddress) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(supportedChains[chainId], "Chain not supported");
        require(newLedgerAddress != address(0), "Invalid ledger address");
        
        address oldLedger = chainLedgers[chainId];
        chainLedgers[chainId] = newLedgerAddress;
        
        emit LedgerUpdated(chainId, oldLedger, newLedgerAddress);
    }

    /**
     * @dev Update the threshold signer address
     * @param newSigner New threshold signer address
     */
    function updateThresholdSigner(address newSigner) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(newSigner != address(0), "Invalid signer address");
        
        address oldSigner = thresholdSigner;
        thresholdSigner = newSigner;
        
        emit ThresholdSignerUpdated(oldSigner, newSigner);
    }

    // ============================================================================
    // CROSS-CHAIN TRANSFER AUTHORIZATION
    // ============================================================================

    /**
     * @dev Authorize a cross-chain transfer with threshold signature
     * @param transferId Unique transfer identifier
     * @param amount Amount to transfer
     * @param targetChain Target chain identifier
     * @param recipient Recipient address on target chain
     * @param signature Threshold signature authorizing the transfer
     */
    function authorizeCrossChainTransfer(
        bytes32 transferId,
        uint256 amount,
        string calldata targetChain,
        address recipient,
        bytes calldata signature
    ) 
        external 
        nonReentrant 
    {
        require(!processedTransfers[transferId], "Transfer already processed");
        require(supportedChains[targetChain], "Target chain not supported");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        
        // Verify threshold signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            transferId,
            amount,
            targetChain,
            recipient,
            block.timestamp
        ));
        
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        
        require(signer == thresholdSigner, "Invalid threshold signature");
        require(!usedSignatures[messageHash], "Signature already used");
        
        // Mark signature as used
        usedSignatures[messageHash] = true;
        
        // Record the transfer
        transferDetails[transferId] = CrossChainTransfer({
            amount: amount,
            targetChain: targetChain,
            recipient: recipient,
            timestamp: block.timestamp,
            processed: true
        });
        
        processedTransfers[transferId] = true;
        
        emit CrossChainTransferAuthorized(transferId, amount, targetChain, recipient, block.timestamp);
    }

    // ============================================================================
    // STANDARD ERC20 FUNCTIONS
    // ============================================================================

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        
        balanceOf[to] += amount;
        totalSupply += amount;
        
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        require(to != address(0), "Cannot transfer to zero address");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(to != address(0), "Cannot transfer to zero address");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }

    // ============================================================================
    // QUERY FUNCTIONS
    // ============================================================================

    /**
     * @dev Get ledger address for a specific chain
     * @param chainId Chain identifier
     * @return Ledger contract address
     */
    function getLedgerAddress(string calldata chainId) external view returns (address) {
        return chainLedgers[chainId];
    }

    /**
     * @dev Check if a chain is supported
     * @param chainId Chain identifier
     * @return True if chain is supported
     */
    function isChainSupported(string calldata chainId) external view returns (bool) {
        return supportedChains[chainId];
    }

    /**
     * @dev Get transfer details
     * @param transferId Transfer identifier
     * @return Transfer details struct
     */
    function getTransferDetails(bytes32 transferId) external view returns (CrossChainTransfer memory) {
        return transferDetails[transferId];
    }

    /**
     * @dev Check if a transfer has been processed
     * @param transferId Transfer identifier
     * @return True if transfer has been processed
     */
    function isTransferProcessed(bytes32 transferId) external view returns (bool) {
        return processedTransfers[transferId];
    }

    // ============================================================================
    // EMERGENCY FUNCTIONS (OWNER ONLY)
    // ============================================================================

    /**
     * @dev Emergency function to pause cross-chain transfers
     * This can be used in case of security issues
     */
    function emergencyPause() external onlyOwner {
        // Implementation would depend on specific requirements
        // For now, this is a placeholder
    }

    /**
     * @dev Emergency function to resume cross-chain transfers
     */
    function emergencyResume() external onlyOwner {
        // Implementation would depend on specific requirements
        // For now, this is a placeholder
    }
}
