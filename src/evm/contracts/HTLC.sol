// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract HTLCContract is ReentrancyGuard, Ownable, Pausable {
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
        EVM, 
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
    
    struct CrossChainSwap {
        bytes32 htlcId;          // HTLC ID on this chain
        bytes32 remoteHtlcId;    // HTLC ID on the remote chain
        address maker;           // User creating the swap
        address taker;           // User filling the swap
        uint256 amount;          // Amount of tokens
        bytes32 hashlock;        // Hash of the secret
        uint256 timelock;        // Expiration timestamp
        bool claimed;            // Whether the swap was claimed
        bool refunded;           // Whether the swap was refunded
        ChainType sourceChain;   // Source chain
        ChainType targetChain;   // Target chain
        string orderHash;        // 1inch Fusion+ order hash
        uint256 createdAt;       // Creation timestamp
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
    mapping(bytes32 => CrossChainSwap) public crossChainSwaps;
    mapping(address => bytes32[]) public userHTLCs;
    mapping(address => bytes32[]) public userCrossChainSwaps;
    mapping(string => bytes32) public orderHashToHtlc; // Links 1inch orders to HTLCs
    
    // Counters
    uint256 public htlcCounter;
    uint256 public crossChainSwapCounter;
    
    // Fee collection
    uint256 public totalFeesCollected;
    
    // Gas payment - contract holds ETH for gas
    receive() external payable {}
    
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
        bool isCrossChain
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
    
    event CrossChainSwapCreated(
        bytes32 indexed htlcId,
        bytes32 indexed remoteHtlcId,
        address indexed maker,
        address taker,
        uint256 amount,
        ChainType sourceChain,
        ChainType targetChain,
        string orderHash
    );
    
    event CrossChainSwapCompleted(
        bytes32 indexed htlcId,
        bytes32 indexed remoteHtlcId,
        address indexed taker,
        string secret
    );
    
    event FeesUpdated(
        uint256 newClaimFee,
        uint256 newRefundFee
    );
    
    event FeesCollected(
        address indexed collector,
        uint256 amount
    );

    // ============================================================================
    // MODIFIERS
    // ============================================================================
    
    modifier onlyHTLCSender(bytes32 htlcId) {
        require(htlcContracts[htlcId].sender == msg.sender, "Only HTLC sender can perform this action");
        _;
    }
    
    modifier onlyHTLCRecipient(bytes32 htlcId) {
        require(htlcContracts[htlcId].recipient == msg.sender, "Only HTLC recipient can perform this action");
        _;
    }
    
    modifier htlcExists(bytes32 htlcId) {
        require(htlcContracts[htlcId].sender != address(0), "HTLC does not exist");
        _;
    }
    
    modifier htlcNotExpired(bytes32 htlcId) {
        require(block.timestamp < htlcContracts[htlcId].timelock, "HTLC has expired");
        _;
    }
    
    modifier htlcExpired(bytes32 htlcId) {
        require(block.timestamp >= htlcContracts[htlcId].timelock, "HTLC has not expired yet");
        _;
    }

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    constructor(address _icpNetworkSigner) {
        // For testing purposes, allow any address (including zero address)
        icpNetworkSigner = _icpNetworkSigner;
        htlcCounter = 0;
        crossChainSwapCounter = 0;
        totalFeesCollected = 0;
    }

    // ============================================================================
    // CORE HTLC FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Create an ETH HTLC
     * @param recipient Address that can claim the HTLC
     * @param hashlock Hash of the secret
     * @param timelock Expiration timestamp
     * @param sourceChain Source chain type
     * @param targetChain Target chain type
     * @param isCrossChain Whether this is part of a cross-chain swap
     * @param orderHash 1inch Fusion+ order hash (optional)
     */
    function createHTLCETH(
        address recipient,
        bytes32 hashlock,
        uint256 timelock,
        ChainType sourceChain,
        ChainType targetChain,
        bool isCrossChain,
        string memory orderHash
    ) external payable nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient address");
        require(msg.value > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(hashlock != bytes32(0), "Invalid hashlock");
        
        bytes32 htlcId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            msg.value,
            hashlock,
            timelock,
            block.timestamp,
            htlcCounter
        ));
        
        htlcContracts[htlcId] = HTLC({
            sender: msg.sender,
            recipient: recipient,
            amount: msg.value,
            hashlock: hashlock,
            timelock: timelock,
            status: HTLCStatus.Locked,
            secret: "",
            token: address(0),
            sourceChain: sourceChain,
            targetChain: targetChain,
            isCrossChain: isCrossChain,
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
            msg.value,
            hashlock,
            timelock,
            address(0),
            sourceChain,
            targetChain,
            isCrossChain
        );
    }
    
    /**
     * @dev Create an ERC20 HTLC
     * @param recipient Address that can claim the HTLC
     * @param token ERC20 token address
     * @param amount Amount of tokens to lock
     * @param hashlock Hash of the secret
     * @param timelock Expiration timestamp
     * @param sourceChain Source chain type
     * @param targetChain Target chain type
     * @param isCrossChain Whether this is part of a cross-chain swap
     * @param orderHash 1inch Fusion+ order hash (optional)
     * @param owner Address to transfer tokens from (if address(0), uses msg.sender)
     */
    function createHTLCERC20(
        address recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        ChainType sourceChain,
        ChainType targetChain,
        bool isCrossChain,
        string memory orderHash,
        address owner
    ) external nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient address");
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(hashlock != bytes32(0), "Invalid hashlock");
        
        // Transfer tokens from owner (if provided) or msg.sender to contract
        address tokenOwner = owner != address(0) ? owner : msg.sender;
        IERC20(token).safeTransferFrom(tokenOwner, address(this), amount);
        
        bytes32 htlcId = keccak256(abi.encodePacked(
            tokenOwner,
            recipient,
            token,
            amount,
            hashlock,
            timelock,
            block.timestamp,
            htlcCounter
        ));
        
        htlcContracts[htlcId] = HTLC({
            sender: tokenOwner,
            recipient: recipient,
            amount: amount,
            hashlock: hashlock,
            timelock: timelock,
            status: HTLCStatus.Locked,
            secret: "",
            token: token,
            sourceChain: sourceChain,
            targetChain: targetChain,
            isCrossChain: isCrossChain,
            orderHash: orderHash,
            createdAt: block.timestamp
        });
        
        userHTLCs[tokenOwner].push(htlcId);
        
        if (bytes(orderHash).length > 0) {
            orderHashToHtlc[orderHash] = htlcId;
        }
        
        htlcCounter++;
        
        emit HTLCCreated(
            htlcId,
            tokenOwner,
            recipient,
            amount,
            hashlock,
            timelock,
            token,
            sourceChain,
            targetChain,
            isCrossChain
        );
    }
    
    /**
     * @dev Claim an HTLC with the secret
     * @param htlcId ID of the HTLC to claim
     * @param secret The secret that unlocks the HTLC
     */
    function claimHTLC(bytes32 htlcId, string memory secret) 
        external 
        nonReentrant 
        htlcExists(htlcId) 
        onlyHTLCRecipient(htlcId) 
        htlcNotExpired(htlcId) 
    {
        HTLC storage htlc = htlcContracts[htlcId];
        require(htlc.status == HTLCStatus.Locked, "HTLC is not in locked state");
        require(keccak256(abi.encodePacked(secret)) == htlc.hashlock, "Invalid secret");
        
        htlc.status = HTLCStatus.Claimed;
        htlc.secret = secret;
        
        uint256 feeAmount = (htlc.amount * claimFee) / 1 ether;
        uint256 transferAmount = htlc.amount - feeAmount;
        
        totalFeesCollected += feeAmount;
        
        if (htlc.token == address(0)) {
            // ETH HTLC
            (bool success, ) = msg.sender.call{value: transferAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 HTLC
            IERC20(htlc.token).safeTransfer(msg.sender, transferAmount);
        }
        
        emit HTLCClaimed(htlcId, msg.sender, secret, transferAmount);
    }
    
    /**
     * @dev Claim an HTLC with the secret (gasless version for ICP canister)
     * @param htlcId ID of the HTLC to claim
     * @param secret The secret that unlocks the HTLC
     * @param recipient The address that should receive the funds
     */
    function claimHTLCByICP(bytes32 htlcId, string memory secret, address recipient) 
        external 
        nonReentrant 
        htlcExists(htlcId) 
        htlcNotExpired(htlcId) 
    {
        // TODO: Add security check for ICP network signer in production
        // require(msg.sender == icpNetworkSigner, "Only ICP network signer can call this");
        
        HTLC storage htlc = htlcContracts[htlcId];
        require(htlc.recipient == recipient, "Invalid recipient");
        require(htlc.status == HTLCStatus.Locked, "HTLC is not in locked state");
        require(keccak256(abi.encodePacked(secret)) == htlc.hashlock, "Invalid secret");
        
        htlc.status = HTLCStatus.Claimed;
        htlc.secret = secret;
        
        uint256 feeAmount = (htlc.amount * claimFee) / 1 ether;
        uint256 transferAmount = htlc.amount - feeAmount;
        
        totalFeesCollected += feeAmount;
        
        if (htlc.token == address(0)) {
            // ETH HTLC
            (bool success, ) = recipient.call{value: transferAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 HTLC
            IERC20(htlc.token).safeTransfer(recipient, transferAmount);
        }
        
        emit HTLCClaimed(htlcId, recipient, secret, transferAmount);
    }
    
    /**
     * @dev Refund an expired HTLC
     * @param htlcId ID of the HTLC to refund
     */
    function refundHTLC(bytes32 htlcId) 
        external 
        nonReentrant 
        htlcExists(htlcId) 
        onlyHTLCSender(htlcId) 
        htlcExpired(htlcId) 
    {
        HTLC storage htlc = htlcContracts[htlcId];
        require(htlc.status == HTLCStatus.Locked, "HTLC is not in locked state");
        
        htlc.status = HTLCStatus.Refunded;
        
        uint256 feeAmount = (htlc.amount * refundFee) / 1 ether;
        uint256 transferAmount = htlc.amount - feeAmount;
        
        totalFeesCollected += feeAmount;
        
        if (htlc.token == address(0)) {
            // ETH HTLC
            (bool success, ) = msg.sender.call{value: transferAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 HTLC
            IERC20(htlc.token).safeTransfer(msg.sender, transferAmount);
        }
        
        emit HTLCRefunded(htlcId, msg.sender, transferAmount);
    }

    // ============================================================================
    // CROSS-CHAIN SWAP FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Create a cross-chain swap
     * @param taker Address of the taker
     * @param amount Amount of tokens
     * @param hashlock Hash of the secret
     * @param timelock Expiration timestamp
     * @param targetChain Target chain
     * @param orderHash 1inch Fusion+ order hash
     * @param remoteHtlcId HTLC ID on the remote chain
     */
    function createCrossChainSwap(
        address taker,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        ChainType targetChain,
        string memory orderHash,
        bytes32 remoteHtlcId
    ) external payable nonReentrant whenNotPaused {
        require(taker != address(0), "Invalid taker address");
        require(amount > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(hashlock != bytes32(0), "Invalid hashlock");
        require(bytes(orderHash).length > 0, "Order hash is required");
        
        bytes32 htlcId = keccak256(abi.encodePacked(
            msg.sender,
            taker,
            amount,
            hashlock,
            timelock,
            block.timestamp,
            crossChainSwapCounter
        ));
        
        crossChainSwaps[htlcId] = CrossChainSwap({
            htlcId: htlcId,
            remoteHtlcId: remoteHtlcId,
            maker: msg.sender,
            taker: taker,
            amount: amount,
            hashlock: hashlock,
            timelock: timelock,
            claimed: false,
            refunded: false,
            sourceChain: ChainType.EVM,
            targetChain: targetChain,
            orderHash: orderHash,
            createdAt: block.timestamp
        });
        
        userCrossChainSwaps[msg.sender].push(htlcId);
        orderHashToHtlc[orderHash] = htlcId;
        
        crossChainSwapCounter++;
        
        emit CrossChainSwapCreated(
            htlcId,
            remoteHtlcId,
            msg.sender,
            taker,
            amount,
            ChainType.EVM,
            targetChain,
            orderHash
        );
    }
    
    /**
     * @dev Complete a cross-chain swap
     * @param htlcId ID of the cross-chain swap
     * @param secret The secret that unlocks the swap
     */
    function completeCrossChainSwap(bytes32 htlcId, string memory secret) 
        external 
        nonReentrant 
    {
        CrossChainSwap storage swap = crossChainSwaps[htlcId];
        require(swap.maker != address(0), "Cross-chain swap does not exist");
        require(swap.taker == msg.sender, "Only taker can complete the swap");
        require(!swap.claimed && !swap.refunded, "Swap already completed");
        require(block.timestamp < swap.timelock, "Swap has expired");
        require(keccak256(abi.encodePacked(secret)) == swap.hashlock, "Invalid secret");
        
        swap.claimed = true;
        
        emit CrossChainSwapCompleted(htlcId, swap.remoteHtlcId, msg.sender, secret);
    }

    // ============================================================================
    // QUERY FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Get HTLC details
     * @param htlcId ID of the HTLC
     * @return HTLC struct
     */
    function getHTLC(bytes32 htlcId) external view returns (HTLC memory) {
        return htlcContracts[htlcId];
    }
    
    /**
     * @dev Get cross-chain swap details
     * @param htlcId ID of the cross-chain swap
     * @return CrossChainSwap struct
     */
    function getCrossChainSwap(bytes32 htlcId) external view returns (CrossChainSwap memory) {
        return crossChainSwaps[htlcId];
    }
    
    /**
     * @dev Get all HTLCs for a user
     * @param user User address
     * @return Array of HTLC IDs
     */
    function getUserHTLCs(address user) external view returns (bytes32[] memory) {
        return userHTLCs[user];
    }
    
    /**
     * @dev Get all cross-chain swaps for a user
     * @param user User address
     * @return Array of cross-chain swap IDs
     */
    function getUserCrossChainSwaps(address user) external view returns (bytes32[] memory) {
        return userCrossChainSwaps[user];
    }
    
    /**
     * @dev Get HTLC ID by order hash
     * @param orderHash 1inch Fusion+ order hash
     * @return HTLC ID
     */
    function getHTLCByOrderHash(string memory orderHash) external view returns (bytes32) {
        return orderHashToHtlc[orderHash];
    }

    // ============================================================================
    // GASLESS PERMIT EXECUTION
    // ============================================================================
    
    /**
     * @dev Execute EIP-2612 permit and transfer tokens
     * @param token Token contract address
     * @param owner Token owner (user who signed permit)
     * @param spender Spender address (this contract)
     * @param value Amount to approve and transfer
     * @param deadline Permit deadline
     * @param v Signature component v
     * @param r Signature component r
     * @param s Signature component s
     */
    function executePermitAndTransfer(
        address token,
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v, bytes32 r, bytes32 s
    ) external {
        // Anyone can call this for now (open access control)
        // Later: require(msg.sender == ICP_CANISTER_ADDRESS, "Only canister");
        
        // Execute permit on token contract
        IERC20Permit(token).permit(owner, spender, value, deadline, v, r, s);
        
        // Transfer tokens to this contract (HTLC pays gas)
        IERC20(token).safeTransferFrom(owner, address(this), value);
        
        emit PermitExecuted(token, owner, spender, value);
    }
    
    event PermitExecuted(
        address indexed token,
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Update fee structure (owner only)
     * @param newClaimFee New claim fee (in basis points)
     * @param newRefundFee New refund fee (in basis points)
     */
    function updateFees(uint256 newClaimFee, uint256 newRefundFee) external onlyOwner {
        require(newClaimFee <= 0.01 ether, "Claim fee too high"); // Max 1%
        require(newRefundFee <= 0.005 ether, "Refund fee too high"); // Max 0.5%
        
        claimFee = newClaimFee;
        refundFee = newRefundFee;
        
        emit FeesUpdated(newClaimFee, newRefundFee);
    }
    
    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        require(totalFeesCollected > 0, "No fees to withdraw");
        
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Fee withdrawal failed");
        
        emit FeesCollected(owner(), amount);
    }
    
    /**
     * @dev Update ICP network signer (owner only)
     * @param newSigner New ICP network signer address
     */
    function updateICPSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer address");
        icpNetworkSigner = newSigner;
    }
    
    /**
     * @dev Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============================================================================
    // EMERGENCY FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Emergency withdrawal of stuck tokens (owner only)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "ETH withdrawal failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

} 