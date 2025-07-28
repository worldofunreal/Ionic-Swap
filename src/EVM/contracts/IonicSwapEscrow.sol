// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title IonicSwapEscrow
 * @dev Unified contract for cross-chain atomic swaps between Ethereum and ICP
 * Combines HTLC functionality with Chain-Key signature verification
 * Extends 1inch Fusion+ by creating a new asset type: "Proof of ICP Lock"
 */
contract IonicSwapEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============================================================================
    // STRUCTS AND TYPES
    // ============================================================================
    
    // Basic HTLC structure (for standard HTLC operations)
    struct HTLC {
        address sender;
        address recipient;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        bool withdrawn;
        bool refunded;
        string secret;
        address token; // ERC20 token address (address(0) for ETH)
    }
    
    // Cross-chain swap structure (for ICP integration)
    struct CrossChainSwap {
        address maker;           // User creating the swap
        address taker;           // User filling the swap
        uint256 amount;          // Amount of ETH/ERC20 tokens
        bytes32 hashlock;        // Hash of the secret
        uint256 timelock;        // Expiration timestamp
        bool claimed;            // Whether the swap was claimed
        bool refunded;           // Whether the swap was refunded
        string secret;           // The secret (only available after claim)
        address token;           // ERC20 token address (address(0) for ETH)
        bytes32 icpProof;        // Chain-Key signature proof from ICP
        bool isCrossChain;       // True if this is a cross-chain swap
    }
    
    // 1inch Fusion+ Order structure
    struct OneInchOrder {
        string orderHash;        // 1inch order hash
        address maker;           // Maker address
        address taker;           // Taker address
        string makerAsset;       // Maker token address
        string takerAsset;       // Taker token address
        string makingAmount;     // Maker amount
        string takingAmount;     // Taker amount
        uint256 srcChainId;      // Source chain ID
        uint256 dstChainId;      // Destination chain ID
        uint256 timelock;        // Order timelock
    }

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    // ICP Network signer for Chain-Key signature verification
    address public icpNetworkSigner;
    
    // Storage mappings
    mapping(bytes32 => HTLC) public htlcContracts;
    mapping(bytes32 => CrossChainSwap) public crossChainSwaps;
    mapping(address => bytes32[]) public userHTLCs;
    mapping(address => bytes32[]) public userCrossChainSwaps;
    mapping(string => bytes32) public oneInchOrderToSwap; // Links 1inch orders to swaps
    
    // Counters
    uint256 public htlcCounter;
    uint256 public crossChainSwapCounter;

    // ============================================================================
    // EVENTS
    // ============================================================================
    
    // HTLC Events
    event HTLCCreated(
        bytes32 indexed htlcId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        address token
    );
    
    event HTLCWithdrawn(
        bytes32 indexed htlcId,
        string secret
    );
    
    event HTLCRefunded(
        bytes32 indexed htlcId
    );
    
    // Cross-chain Swap Events
    event CrossChainSwapCreated(
        bytes32 indexed swapId,
        address indexed maker,
        address indexed taker,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        address token,
        string oneInchOrderHash
    );
    
    event CrossChainSwapClaimed(
        bytes32 indexed swapId,
        string secret,
        bytes32 icpProof
    );
    
    event CrossChainSwapRefunded(
        bytes32 indexed swapId
    );
    
    // Admin Events
    event ICPNetworkSignerUpdated(
        address indexed oldSigner,
        address indexed newSigner
    );

    // ============================================================================
    // MODIFIERS
    // ============================================================================
    
    // HTLC Modifiers
    modifier htlcExists(bytes32 htlcId) {
        require(htlcContracts[htlcId].sender != address(0), "HTLC does not exist");
        _;
    }

    modifier notWithdrawn(bytes32 htlcId) {
        require(!htlcContracts[htlcId].withdrawn, "HTLC already withdrawn");
        _;
    }

    modifier notRefunded(bytes32 htlcId) {
        require(!htlcContracts[htlcId].refunded, "HTLC already refunded");
        _;
    }

    modifier notExpired(bytes32 htlcId) {
        require(block.timestamp < htlcContracts[htlcId].timelock, "HTLC expired");
        _;
    }

    modifier onlyRecipient(bytes32 htlcId) {
        require(msg.sender == htlcContracts[htlcId].recipient, "Only recipient can withdraw");
        _;
    }

    modifier onlySender(bytes32 htlcId) {
        require(msg.sender == htlcContracts[htlcId].sender, "Only sender can refund");
        _;
    }
    
    // Cross-chain Swap Modifiers
    modifier swapExists(bytes32 swapId) {
        require(crossChainSwaps[swapId].maker != address(0), "Swap does not exist");
        _;
    }

    modifier notClaimed(bytes32 swapId) {
        require(!crossChainSwaps[swapId].claimed, "Swap already claimed");
        _;
    }

    modifier notSwapRefunded(bytes32 swapId) {
        require(!crossChainSwaps[swapId].refunded, "Swap already refunded");
        _;
    }

    modifier notSwapExpired(bytes32 swapId) {
        require(block.timestamp < crossChainSwaps[swapId].timelock, "Swap expired");
        _;
    }

    modifier onlyTaker(bytes32 swapId) {
        require(msg.sender == crossChainSwaps[swapId].taker, "Only taker can claim");
        _;
    }

    modifier onlyMaker(bytes32 swapId) {
        require(msg.sender == crossChainSwaps[swapId].maker, "Only maker can refund");
        _;
    }

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    constructor(address _icpNetworkSigner) {
        icpNetworkSigner = _icpNetworkSigner;
    }

    // ============================================================================
    // BASIC HTLC FUNCTIONS (Standard HTLC operations)
    // ============================================================================
    
    /**
     * @dev Create a new HTLC for ERC20 tokens
     * @param recipient The address that can claim the HTLC
     * @param amount The amount of tokens to lock
     * @param hashlock The hash of the secret
     * @param timelock The expiration time
     * @param token The ERC20 token address
     */
    function createHTLC(
        address recipient,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        address token
    ) external nonReentrant returns (bytes32 htlcId) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(hashlock != bytes32(0), "Invalid hashlock");

        htlcId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            amount,
            hashlock,
            timelock,
            block.timestamp,
            htlcCounter
        ));
        htlcCounter++;

        require(htlcContracts[htlcId].sender == address(0), "HTLC already exists");

        // Transfer tokens from sender to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Create HTLC
        htlcContracts[htlcId] = HTLC({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            hashlock: hashlock,
            timelock: timelock,
            withdrawn: false,
            refunded: false,
            secret: "",
            token: token
        });

        userHTLCs[msg.sender].push(htlcId);
        userHTLCs[recipient].push(htlcId);

        emit HTLCCreated(htlcId, msg.sender, recipient, amount, hashlock, timelock, token);
    }

    /**
     * @dev Create a new HTLC for native ETH
     * @param recipient The address that can claim the HTLC
     * @param hashlock The hash of the secret
     * @param timelock The expiration time
     */
    function createHTLCETH(
        address recipient,
        bytes32 hashlock,
        uint256 timelock
    ) external payable nonReentrant returns (bytes32 htlcId) {
        require(recipient != address(0), "Invalid recipient");
        require(msg.value > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(hashlock != bytes32(0), "Invalid hashlock");

        htlcId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            msg.value,
            hashlock,
            timelock,
            block.timestamp,
            htlcCounter
        ));
        htlcCounter++;

        require(htlcContracts[htlcId].sender == address(0), "HTLC already exists");

        // Create HTLC (ETH is already transferred to contract)
        htlcContracts[htlcId] = HTLC({
            sender: msg.sender,
            recipient: recipient,
            amount: msg.value,
            hashlock: hashlock,
            timelock: timelock,
            withdrawn: false,
            refunded: false,
            secret: "",
            token: address(0)
        });

        userHTLCs[msg.sender].push(htlcId);
        userHTLCs[recipient].push(htlcId);

        emit HTLCCreated(htlcId, msg.sender, recipient, msg.value, hashlock, timelock, address(0));
    }

    /**
     * @dev Withdraw HTLC with the secret
     * @param htlcId The HTLC ID
     * @param secret The secret that matches the hashlock
     * @param token The ERC20 token address (use address(0) for ETH)
     */
    function withdrawHTLC(
        bytes32 htlcId,
        string calldata secret,
        address token
    ) external htlcExists(htlcId) notWithdrawn(htlcId) notRefunded(htlcId) notExpired(htlcId) onlyRecipient(htlcId) nonReentrant {
        HTLC storage htlc = htlcContracts[htlcId];
        
        // Verify the secret matches the hashlock
        require(keccak256(abi.encodePacked(secret)) == htlc.hashlock, "Invalid secret");

        htlc.withdrawn = true;
        htlc.secret = secret;

        if (token == address(0)) {
            // Withdraw ETH
            (bool success, ) = htlc.recipient.call{value: htlc.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Withdraw ERC20 tokens
            IERC20(token).safeTransfer(htlc.recipient, htlc.amount);
        }

        emit HTLCWithdrawn(htlcId, secret);
    }

    /**
     * @dev Refund HTLC after expiration
     * @param htlcId The HTLC ID
     * @param token The ERC20 token address (use address(0) for ETH)
     */
    function refundHTLC(
        bytes32 htlcId,
        address token
    ) external htlcExists(htlcId) notWithdrawn(htlcId) notRefunded(htlcId) onlySender(htlcId) nonReentrant {
        HTLC storage htlc = htlcContracts[htlcId];
        
        require(block.timestamp >= htlc.timelock, "HTLC not expired");

        htlc.refunded = true;

        if (token == address(0)) {
            // Refund ETH
            (bool success, ) = htlc.sender.call{value: htlc.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Refund ERC20 tokens
            IERC20(token).safeTransfer(htlc.sender, htlc.amount);
        }

        emit HTLCRefunded(htlcId);
    }

    // ============================================================================
    // CROSS-CHAIN SWAP FUNCTIONS (ICP Integration with Chain-Key signatures)
    // ============================================================================
    
    /**
     * @dev Create a cross-chain swap for ETH with 1inch Fusion+ integration
     * @param taker The address that can claim the swap
     * @param hashlock The hash of the secret
     * @param timelock The expiration timestamp
     * @param oneInchOrderHash The 1inch Fusion+ order hash
     */
    function createCrossChainSwapETH(
        address taker,
        bytes32 hashlock,
        uint256 timelock,
        string calldata oneInchOrderHash
    ) external payable nonReentrant returns (bytes32 swapId) {
        require(taker != address(0), "Invalid taker");
        require(msg.value > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(hashlock != bytes32(0), "Invalid hashlock");
        require(bytes(oneInchOrderHash).length > 0, "Invalid 1inch order hash");

        swapId = keccak256(abi.encodePacked(
            msg.sender,
            taker,
            msg.value,
            hashlock,
            timelock,
            block.timestamp,
            crossChainSwapCounter
        ));
        crossChainSwapCounter++;

        require(crossChainSwaps[swapId].maker == address(0), "Swap already exists");

        // Create the cross-chain swap
        crossChainSwaps[swapId] = CrossChainSwap({
            maker: msg.sender,
            taker: taker,
            amount: msg.value,
            hashlock: hashlock,
            timelock: timelock,
            claimed: false,
            refunded: false,
            secret: "",
            token: address(0),
            icpProof: bytes32(0),
            isCrossChain: true
        });

        // Link to 1inch order
        oneInchOrderToSwap[oneInchOrderHash] = swapId;

        userCrossChainSwaps[msg.sender].push(swapId);
        userCrossChainSwaps[taker].push(swapId);

        emit CrossChainSwapCreated(swapId, msg.sender, taker, msg.value, hashlock, timelock, address(0), oneInchOrderHash);
    }

    /**
     * @dev Create a cross-chain swap for ERC20 tokens with 1inch Fusion+ integration
     * @param taker The address that can claim the swap
     * @param amount The amount of tokens to lock
     * @param hashlock The hash of the secret
     * @param timelock The expiration timestamp
     * @param token The ERC20 token address
     * @param oneInchOrderHash The 1inch Fusion+ order hash
     */
    function createCrossChainSwapERC20(
        address taker,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        address token,
        string calldata oneInchOrderHash
    ) external nonReentrant returns (bytes32 swapId) {
        require(taker != address(0), "Invalid taker");
        require(amount > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(hashlock != bytes32(0), "Invalid hashlock");
        require(token != address(0), "Invalid token address");
        require(bytes(oneInchOrderHash).length > 0, "Invalid 1inch order hash");

        swapId = keccak256(abi.encodePacked(
            msg.sender,
            taker,
            amount,
            hashlock,
            timelock,
            block.timestamp,
            crossChainSwapCounter
        ));
        crossChainSwapCounter++;

        require(crossChainSwaps[swapId].maker == address(0), "Swap already exists");

        // Transfer tokens from maker to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Create the cross-chain swap
        crossChainSwaps[swapId] = CrossChainSwap({
            maker: msg.sender,
            taker: taker,
            amount: amount,
            hashlock: hashlock,
            timelock: timelock,
            claimed: false,
            refunded: false,
            secret: "",
            token: token,
            icpProof: bytes32(0),
            isCrossChain: true
        });

        // Link to 1inch order
        oneInchOrderToSwap[oneInchOrderHash] = swapId;

        userCrossChainSwaps[msg.sender].push(swapId);
        userCrossChainSwaps[taker].push(swapId);

        emit CrossChainSwapCreated(swapId, msg.sender, taker, amount, hashlock, timelock, token, oneInchOrderHash);
    }

    /**
     * @dev Claim a cross-chain swap with Chain-Key signature proof
     * @param swapId The swap ID
     * @param secret The secret that matches the hashlock
     * @param icpProof The Chain-Key signature proof from ICP
     * @param signature The signature of the ICP proof
     */
    function claimCrossChainSwap(
        bytes32 swapId,
        string calldata secret,
        bytes32 icpProof,
        bytes calldata signature
    ) external swapExists(swapId) notClaimed(swapId) notSwapRefunded(swapId) notSwapExpired(swapId) onlyTaker(swapId) nonReentrant {
        CrossChainSwap storage swap = crossChainSwaps[swapId];
        
        // Verify the secret matches the hashlock
        require(keccak256(abi.encodePacked(secret)) == swap.hashlock, "Invalid secret");

        // Verify the Chain-Key signature proof
        require(verifyICPProof(swapId, icpProof, signature), "Invalid ICP proof");

        swap.claimed = true;
        swap.secret = secret;
        swap.icpProof = icpProof;

        // Transfer assets to taker
        if (swap.token == address(0)) {
            // Transfer ETH
            (bool success, ) = swap.taker.call{value: swap.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Transfer ERC20 tokens
            IERC20(swap.token).safeTransfer(swap.taker, swap.amount);
        }

        emit CrossChainSwapClaimed(swapId, secret, icpProof);
    }

    /**
     * @dev Refund a cross-chain swap after expiration
     * @param swapId The swap ID
     */
    function refundCrossChainSwap(
        bytes32 swapId
    ) external swapExists(swapId) notClaimed(swapId) notSwapRefunded(swapId) onlyMaker(swapId) nonReentrant {
        CrossChainSwap storage swap = crossChainSwaps[swapId];
        
        require(block.timestamp >= swap.timelock, "Swap not expired");

        swap.refunded = true;

        // Refund assets to maker
        if (swap.token == address(0)) {
            // Refund ETH
            (bool success, ) = swap.maker.call{value: swap.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Refund ERC20 tokens
            IERC20(swap.token).safeTransfer(swap.maker, swap.amount);
        }

        emit CrossChainSwapRefunded(swapId);
    }

    // ============================================================================
    // CHAIN-KEY SIGNATURE VERIFICATION
    // ============================================================================
    
    /**
     * @dev Verify Chain-Key signature proof from ICP
     * @param swapId The swap ID
     * @param icpProof The proof from ICP
     * @param signature The Chain-Key signature
     */
    function verifyICPProof(
        bytes32 swapId,
        bytes32 icpProof,
        bytes calldata signature
    ) public view returns (bool) {
        // Construct the message that should have been signed by ICP
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(
                swapId,
                icpProof,
                "ICP_LOCK_VERIFICATION"
            ))
        ));

        // Recover the signer from the signature
        address signer = messageHash.recover(signature);
        
        // Verify the signer is the ICP network
        return signer == icpNetworkSigner;
    }

    // ============================================================================
    // QUERY FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Get HTLC details
     * @param htlcId The HTLC ID
     */
    function getHTLC(bytes32 htlcId) external view returns (HTLC memory) {
        return htlcContracts[htlcId];
    }

    /**
     * @dev Get cross-chain swap details
     * @param swapId The swap ID
     */
    function getCrossChainSwap(bytes32 swapId) external view returns (CrossChainSwap memory) {
        return crossChainSwaps[swapId];
    }

    /**
     * @dev Get user's HTLCs
     * @param user The user address
     */
    function getUserHTLCs(address user) external view returns (bytes32[] memory) {
        return userHTLCs[user];
    }

    /**
     * @dev Get user's cross-chain swaps
     * @param user The user address
     */
    function getUserCrossChainSwaps(address user) external view returns (bytes32[] memory) {
        return userCrossChainSwaps[user];
    }

    /**
     * @dev Get swap ID from 1inch order hash
     * @param oneInchOrderHash The 1inch order hash
     */
    function getSwapFromOneInchOrder(string calldata oneInchOrderHash) external view returns (bytes32) {
        return oneInchOrderToSwap[oneInchOrderHash];
    }

    /**
     * @dev Check if HTLC is expired
     * @param htlcId The HTLC ID
     */
    function isHTLCExpired(bytes32 htlcId) external view returns (bool) {
        return block.timestamp >= htlcContracts[htlcId].timelock;
    }

    /**
     * @dev Check if cross-chain swap is expired
     * @param swapId The swap ID
     */
    function isCrossChainSwapExpired(bytes32 swapId) external view returns (bool) {
        return block.timestamp >= crossChainSwaps[swapId].timelock;
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Update the ICP network signer (only owner)
     * @param newSigner The new ICP network signer address
     */
    function updateICPNetworkSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer address");
        address oldSigner = icpNetworkSigner;
        icpNetworkSigner = newSigner;
        emit ICPNetworkSignerUpdated(oldSigner, newSigner);
    }

    /**
     * @dev Emergency withdraw function for owner (only for stuck tokens)
     * @param token The token address
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // ============================================================================
    // FALLBACK FUNCTIONS
    // ============================================================================
    
    // Allow contract to receive ETH
    receive() external payable {}
} 