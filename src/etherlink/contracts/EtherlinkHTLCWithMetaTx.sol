// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MetaTransaction.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract EtherlinkHTLCWithMetaTx is MetaTransaction, ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============================================================================
    // STRUCTS AND TYPES
    // ============================================================================
    
    enum HTLCStatus { 
        Locked, 
        Claimed, 
        Refunded, 
        Expired 
    }
    
    enum ChainType { 
        Etherlink, 
        ICP, 
        Ethereum, 
        Polygon, 
        BSC 
    }
    
    struct HTLC {
        address sender;           // Address that locked the funds
        address recipient;        // Address that can claim the funds
        uint256 amount;          // Amount of tokens/ETH locked
        bytes32 hashlock;        // Hash of the secret
        uint256 timelock;        // Expiration timestamp
        HTLCStatus status;       // Current status of the HTLC
        string secret;           // The secret (only available after claim)
        address token;           // ERC20 token address (address(0) for ETH)
        ChainType sourceChain;   // Chain where the HTLC was created
        ChainType targetChain;   // Chain where the corresponding HTLC exists
        bool isCrossChain;       // True if this is part of a cross-chain swap
        string orderHash;        // 1inch Fusion+ order hash (if applicable)
        uint256 createdAt;       // Block timestamp when HTLC was created
    }

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    // ICP Network signer for Chain-Key signature verification
    address public icpNetworkSigner;
    
    // Fee structure
    uint256 public claimFee = 0.001 ether; // 0.1% fee for successful claims
    uint256 public refundFee = 0.0005 ether; // 0.05% fee for refunds
    
    // Storage mappings
    mapping(bytes32 => HTLC) public htlcContracts;
    mapping(address => bytes32[]) public userHTLCs;
    mapping(string => bytes32) public orderHashToHtlc; // Links 1inch orders to HTLCs
    
    // Counters
    uint256 public htlcCounter;
    
    // Fee collection
    uint256 public totalFeesCollected;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    event HTLCCreated(
        bytes32 indexed htlcId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        address token,
        ChainType sourceChain,
        ChainType targetChain,
        string orderHash
    );
    
    event HTLCClaimed(
        bytes32 indexed htlcId,
        address indexed recipient,
        string secret,
        uint256 amount
    );
    
    event HTLCRefunded(
        bytes32 indexed htlcId,
        address indexed sender,
        uint256 amount
    );
    
    event HTLCExpired(
        bytes32 indexed htlcId,
        address indexed sender,
        uint256 amount
    );

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    constructor(address _icpNetworkSigner) {
        icpNetworkSigner = _icpNetworkSigner;
    }

    // ============================================================================
    // MODIFIERS
    // ============================================================================
    
    modifier onlyHTLCExists(bytes32 htlcId) {
        require(htlcContracts[htlcId].sender != address(0), "HTLC does not exist");
        _;
    }
    
    modifier onlyHTLCSender(bytes32 htlcId) {
        require(htlcContracts[htlcId].sender == msg.sender, "Only sender can perform this action");
        _;
    }
    
    modifier onlyHTLCRecipient(bytes32 htlcId) {
        require(htlcContracts[htlcId].recipient == msg.sender, "Only recipient can perform this action");
        _;
    }
    
    modifier onlyHTLCLocked(bytes32 htlcId) {
        require(htlcContracts[htlcId].status == HTLCStatus.Locked, "HTLC is not locked");
        _;
    }
    
    modifier onlyHTLCNotExpired(bytes32 htlcId) {
        require(block.timestamp < htlcContracts[htlcId].timelock, "HTLC has expired");
        _;
    }
    
    modifier onlyHTLCExpired(bytes32 htlcId) {
        require(block.timestamp >= htlcContracts[htlcId].timelock, "HTLC has not expired yet");
        _;
    }

    // ============================================================================
    // CORE HTLC FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Create a new HTLC
     * @param recipient The address that can claim the funds
     * @param amount The amount of tokens/ETH to lock
     * @param hashlock The hash of the secret
     * @param timelock The expiration timestamp
     * @param token The ERC20 token address (address(0) for ETH)
     * @param sourceChain The source chain type
     * @param targetChain The target chain type
     * @param orderHash The 1inch order hash (optional)
     */
    function createHTLC(
        address recipient,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        address token,
        ChainType sourceChain,
        ChainType targetChain,
        string calldata orderHash
    ) external payable nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(hashlock != bytes32(0), "Invalid hashlock");
        
        bytes32 htlcId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            amount,
            hashlock,
            timelock,
            token,
            sourceChain,
            targetChain,
            orderHash,
            block.timestamp
        ));
        
        require(htlcContracts[htlcId].sender == address(0), "HTLC already exists");
        
        // Transfer tokens/ETH
        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH not accepted for token HTLC");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        // Create HTLC
        htlcContracts[htlcId] = HTLC({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            hashlock: hashlock,
            timelock: timelock,
            status: HTLCStatus.Locked,
            secret: "",
            token: token,
            sourceChain: sourceChain,
            targetChain: targetChain,
            isCrossChain: sourceChain != targetChain,
            orderHash: orderHash,
            createdAt: block.timestamp
        });
        
        userHTLCs[msg.sender].push(htlcId);
        if (bytes(orderHash).length > 0) {
            orderHashToHtlc[orderHash] = htlcId;
        }
        
        htlcCounter++;
        
        emit HTLCCreated(
            htlcId,
            msg.sender,
            recipient,
            amount,
            hashlock,
            timelock,
            token,
            sourceChain,
            targetChain,
            orderHash
        );
    }
    
    /**
     * @dev Claim an HTLC with the secret
     * @param htlcId The HTLC ID
     * @param secret The secret that unlocks the HTLC
     */
    function claimHTLC(bytes32 htlcId, string calldata secret) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyHTLCExists(htlcId)
        onlyHTLCRecipient(htlcId)
        onlyHTLCLocked(htlcId)
        onlyHTLCNotExpired(htlcId)
    {
        HTLC storage htlc = htlcContracts[htlcId];
        require(keccak256(abi.encodePacked(secret)) == htlc.hashlock, "Invalid secret");
        
        htlc.status = HTLCStatus.Claimed;
        htlc.secret = secret;
        
        // Calculate fee
        uint256 fee = (htlc.amount * claimFee) / 1 ether;
        uint256 amountToTransfer = htlc.amount - fee;
        totalFeesCollected += fee;
        
        // Transfer funds
        if (htlc.token == address(0)) {
            payable(htlc.recipient).transfer(amountToTransfer);
        } else {
            IERC20(htlc.token).safeTransfer(htlc.recipient, amountToTransfer);
        }
        
        emit HTLCClaimed(htlcId, htlc.recipient, secret, amountToTransfer);
    }
    
    /**
     * @dev Refund an expired HTLC
     * @param htlcId The HTLC ID
     */
    function refundHTLC(bytes32 htlcId) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyHTLCExists(htlcId)
        onlyHTLCSender(htlcId)
        onlyHTLCLocked(htlcId)
        onlyHTLCExpired(htlcId)
    {
        HTLC storage htlc = htlcContracts[htlcId];
        
        htlc.status = HTLCStatus.Refunded;
        
        // Calculate fee
        uint256 fee = (htlc.amount * refundFee) / 1 ether;
        uint256 amountToTransfer = htlc.amount - fee;
        totalFeesCollected += fee;
        
        // Transfer funds back to sender
        if (htlc.token == address(0)) {
            payable(htlc.sender).transfer(amountToTransfer);
        } else {
            IERC20(htlc.token).safeTransfer(htlc.sender, amountToTransfer);
        }
        
        emit HTLCRefunded(htlcId, htlc.sender, amountToTransfer);
    }

    // ============================================================================
    // META-TRANSACTION FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Create HTLC via meta-transaction (gasless)
     * @param userAddress The address of the user
     * @param recipient The address that can claim the funds
     * @param amount The amount of tokens/ETH to lock
     * @param hashlock The hash of the secret
     * @param timelock The expiration timestamp
     * @param token The ERC20 token address (address(0) for ETH)
     * @param sourceChain The source chain type
     * @param targetChain The target chain type
     * @param orderHash The 1inch order hash (optional)
     */
    function createHTLCMeta(
        address userAddress,
        address recipient,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        address token,
        ChainType sourceChain,
        ChainType targetChain,
        string calldata orderHash
    ) external payable nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(hashlock != bytes32(0), "Invalid hashlock");
        
        bytes32 htlcId = keccak256(abi.encodePacked(
            userAddress,
            recipient,
            amount,
            hashlock,
            timelock,
            token,
            sourceChain,
            targetChain,
            orderHash,
            block.timestamp
        ));
        
        require(htlcContracts[htlcId].sender == address(0), "HTLC already exists");
        
        // Transfer tokens/ETH (user must have approved tokens or sent ETH)
        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH not accepted for token HTLC");
            IERC20(token).safeTransferFrom(userAddress, address(this), amount);
        }
        
        // Create HTLC
        htlcContracts[htlcId] = HTLC({
            sender: userAddress,
            recipient: recipient,
            amount: amount,
            hashlock: hashlock,
            timelock: timelock,
            status: HTLCStatus.Locked,
            secret: "",
            token: token,
            sourceChain: sourceChain,
            targetChain: targetChain,
            isCrossChain: sourceChain != targetChain,
            orderHash: orderHash,
            createdAt: block.timestamp
        });
        
        userHTLCs[userAddress].push(htlcId);
        if (bytes(orderHash).length > 0) {
            orderHashToHtlc[orderHash] = htlcId;
        }
        
        htlcCounter++;
        
        emit HTLCCreated(
            htlcId,
            userAddress,
            recipient,
            amount,
            hashlock,
            timelock,
            token,
            sourceChain,
            targetChain,
            orderHash
        );
    }
    
    /**
     * @dev Claim HTLC via meta-transaction (gasless)
     * @param userAddress The address of the user
     * @param htlcId The HTLC ID
     * @param secret The secret that unlocks the HTLC
     */
    function claimHTLCMeta(
        address userAddress,
        bytes32 htlcId,
        string calldata secret
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyHTLCExists(htlcId)
        onlyHTLCLocked(htlcId)
        onlyHTLCNotExpired(htlcId)
    {
        HTLC storage htlc = htlcContracts[htlcId];
        require(htlc.recipient == userAddress, "Only recipient can claim");
        require(keccak256(abi.encodePacked(secret)) == htlc.hashlock, "Invalid secret");
        
        htlc.status = HTLCStatus.Claimed;
        htlc.secret = secret;
        
        // Calculate fee
        uint256 fee = (htlc.amount * claimFee) / 1 ether;
        uint256 amountToTransfer = htlc.amount - fee;
        totalFeesCollected += fee;
        
        // Transfer funds
        if (htlc.token == address(0)) {
            payable(htlc.recipient).transfer(amountToTransfer);
        } else {
            IERC20(htlc.token).safeTransfer(htlc.recipient, amountToTransfer);
        }
        
        emit HTLCClaimed(htlcId, htlc.recipient, secret, amountToTransfer);
    }
    
    /**
     * @dev Refund HTLC via meta-transaction (gasless)
     * @param userAddress The address of the user
     * @param htlcId The HTLC ID
     */
    function refundHTLCMeta(
        address userAddress,
        bytes32 htlcId
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyHTLCExists(htlcId)
        onlyHTLCLocked(htlcId)
        onlyHTLCExpired(htlcId)
    {
        HTLC storage htlc = htlcContracts[htlcId];
        require(htlc.sender == userAddress, "Only sender can refund");
        
        htlc.status = HTLCStatus.Refunded;
        
        // Calculate fee
        uint256 fee = (htlc.amount * refundFee) / 1 ether;
        uint256 amountToTransfer = htlc.amount - fee;
        totalFeesCollected += fee;
        
        // Transfer funds back to sender
        if (htlc.token == address(0)) {
            payable(htlc.sender).transfer(amountToTransfer);
        } else {
            IERC20(htlc.token).safeTransfer(htlc.sender, amountToTransfer);
        }
        
        emit HTLCRefunded(htlcId, htlc.sender, amountToTransfer);
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Get HTLC details
     * @param htlcId The HTLC ID
     * @return HTLC The HTLC struct
     */
    function getHTLC(bytes32 htlcId) external view returns (HTLC memory) {
        return htlcContracts[htlcId];
    }
    
    /**
     * @dev Get user's HTLCs
     * @param user The user address
     * @return bytes32[] Array of HTLC IDs
     */
    function getUserHTLCs(address user) external view returns (bytes32[] memory) {
        return userHTLCs[user];
    }
    
    /**
     * @dev Get HTLC ID from order hash
     * @param orderHash The 1inch order hash
     * @return bytes32 The HTLC ID
     */
    function getHTLCFromOrderHash(string calldata orderHash) external view returns (bytes32) {
        return orderHashToHtlc[orderHash];
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Update ICP network signer
     * @param newSigner The new signer address
     */
    function updateICPSigner(address newSigner) external onlyOwner {
        icpNetworkSigner = newSigner;
    }
    
    /**
     * @dev Update claim fee
     * @param newFee The new fee (in wei)
     */
    function updateClaimFee(uint256 newFee) external onlyOwner {
        claimFee = newFee;
    }
    
    /**
     * @dev Update refund fee
     * @param newFee The new fee (in wei)
     */
    function updateRefundFee(uint256 newFee) external onlyOwner {
        refundFee = newFee;
    }
    
    /**
     * @dev Withdraw collected fees
     * @param amount The amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner {
        require(amount <= totalFeesCollected, "Insufficient fees");
        totalFeesCollected -= amount;
        payable(owner()).transfer(amount);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============================================================================
    // EMERGENCY FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Emergency function to recover stuck tokens
     * @param token The token address
     * @param amount The amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
} 