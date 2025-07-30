// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Create2 } from "@openzeppelin/contracts/utils/Create2.sol";
import { Address, AddressLib } from "./libraries/AddressLib.sol";
import { SafeERC20 } from "./libraries/SafeERC20.sol";

import { ImmutablesLib } from "./libraries/ImmutablesLib.sol";
import { TimelocksLib } from "./libraries/TimelocksLib.sol";

import { IEscrowFactory } from "./interfaces/IEscrowFactory.sol";
import { IBaseEscrow } from "./interfaces/IBaseEscrow.sol";
import { EtherlinkEscrowSrc } from "./EtherlinkEscrowSrc.sol";
import { EtherlinkEscrowDst } from "./EtherlinkEscrowDst.sol";
import { ProxyHashLib } from "./libraries/ProxyHashLib.sol";

/**
 * @title Etherlink Escrow Factory contract
 * @notice Contract to create escrow contracts for cross-chain atomic swap between Etherlink and ICP
 * @custom:security-contact security@ionic-swap.io
 */
contract EtherlinkEscrowFactory is IEscrowFactory {
    using AddressLib for Address;
    using Clones for address;
    using ImmutablesLib for IBaseEscrow.Immutables;
    using SafeERC20 for IERC20;
    using TimelocksLib for TimelocksLib.Timelocks;

    /// @notice See {IEscrowFactory-ESCROW_SRC_IMPLEMENTATION}.
    address public immutable ESCROW_SRC_IMPLEMENTATION;
    /// @notice See {IEscrowFactory-ESCROW_DST_IMPLEMENTATION}.
    address public immutable ESCROW_DST_IMPLEMENTATION;
    bytes32 internal immutable _PROXY_SRC_BYTECODE_HASH;
    bytes32 internal immutable _PROXY_DST_BYTECODE_HASH;

    // ICP Network signer for Chain-Key signature verification
    address public immutable icpNetworkSigner;
    
    // Fee structure
    uint256 public claimFee = 0.001 ether; // 0.1% fee for successful claims
    uint256 public refundFee = 0.0005 ether; // 0.05% fee for refunds
    
    // Fee collection
    uint256 public totalFeesCollected;

    constructor(address _icpNetworkSigner, uint32 rescueDelaySrc, uint32 rescueDelayDst) {
        require(_icpNetworkSigner != address(0), "Invalid ICP network signer");
        icpNetworkSigner = _icpNetworkSigner;
        
        ESCROW_SRC_IMPLEMENTATION = address(new EtherlinkEscrowSrc(rescueDelaySrc, IERC20(address(0)))); // No access token for Etherlink
        ESCROW_DST_IMPLEMENTATION = address(new EtherlinkEscrowDst(rescueDelayDst, IERC20(address(0)))); // No access token for Etherlink
        
        _PROXY_SRC_BYTECODE_HASH = ProxyHashLib.computeProxyBytecodeHash(ESCROW_SRC_IMPLEMENTATION);
        _PROXY_DST_BYTECODE_HASH = ProxyHashLib.computeProxyBytecodeHash(ESCROW_DST_IMPLEMENTATION);
    }

    /**
     * @notice Creates a new escrow contract for maker on the source chain (Etherlink)
     * @dev This function is called by the ICP canister to create escrows on Etherlink
     * @param immutables The immutable values for the escrow
     * @param dstImmutablesComplement Additional immutable values for destination
     */
    function createSrcEscrow(
        IBaseEscrow.Immutables calldata immutables,
        DstImmutablesComplement calldata dstImmutablesComplement
    ) external payable {
        require(msg.sender == icpNetworkSigner, "Only ICP network signer can create escrows");
        require(msg.value >= immutables.safetyDeposit, "Insufficient safety deposit");

        IBaseEscrow.Immutables memory srcImmutables = immutables;
        srcImmutables.timelocks = srcImmutables.timelocks.setDeployedAt(block.timestamp);

        bytes32 salt = srcImmutables.hashMem();
        address escrow = _deployEscrow(salt, msg.value, ESCROW_SRC_IMPLEMENTATION);
        
        if (srcImmutables.token != address(0)) {
            // For ERC20 tokens, the ICP canister should have already approved the transfer
            IERC20(srcImmutables.token).safeTransferFrom(msg.sender, escrow, srcImmutables.amount);
        }

        emit SrcEscrowCreated(srcImmutables, dstImmutablesComplement);
    }

    /**
     * @notice See {IEscrowFactory-createDstEscrow}.
     */
    function createDstEscrow(IBaseEscrow.Immutables calldata dstImmutables, uint256 srcCancellationTimestamp) external payable {
        address token = dstImmutables.token;
        uint256 nativeAmount = dstImmutables.safetyDeposit;
        if (token == address(0)) {
            nativeAmount += dstImmutables.amount;
        }
        if (msg.value != nativeAmount) revert InsufficientEscrowBalance();

        IBaseEscrow.Immutables memory immutables = dstImmutables;
        immutables.timelocks = immutables.timelocks.setDeployedAt(block.timestamp);
        // Check that the escrow cancellation will start not later than the cancellation time on the source chain.
        if (immutables.timelocks.get(TimelocksLib.Stage.DstCancellation) > srcCancellationTimestamp) revert InvalidCreationTime();

        bytes32 salt = immutables.hashMem();
        address escrow = _deployEscrow(salt, msg.value, ESCROW_DST_IMPLEMENTATION);
        if (token != address(0)) {
            IERC20(token).safeTransferFrom(msg.sender, escrow, immutables.amount);
        }

        emit DstEscrowCreated(escrow, dstImmutables.hashlock, dstImmutables.taker);
    }

    /**
     * @notice See {IEscrowFactory-addressOfEscrowSrc}.
     */
    function addressOfEscrowSrc(IBaseEscrow.Immutables calldata immutables) external view returns (address) {
        return Create2.computeAddress(immutables.hash(), _PROXY_SRC_BYTECODE_HASH);
    }

    /**
     * @notice See {IEscrowFactory-addressOfEscrowDst}.
     */
    function addressOfEscrowDst(IBaseEscrow.Immutables calldata immutables) external view returns (address) {
        return Create2.computeAddress(immutables.hash(), _PROXY_DST_BYTECODE_HASH);
    }

    /**
     * @notice Deploys a new escrow contract.
     * @param salt The salt for the deterministic address computation.
     * @param value The value to be sent to the escrow contract.
     * @param implementation Address of the implementation.
     * @return escrow The address of the deployed escrow contract.
     */
    function _deployEscrow(bytes32 salt, uint256 value, address implementation) internal returns (address escrow) {
        escrow = implementation.cloneDeterministic(salt);
    }

    /**
     * @dev Update fee structure (only ICP network signer)
     * @param newClaimFee New claim fee (in basis points)
     * @param newRefundFee New refund fee (in basis points)
     */
    function updateFees(uint256 newClaimFee, uint256 newRefundFee) external {
        require(msg.sender == icpNetworkSigner, "Only ICP network signer can update fees");
        require(newClaimFee <= 0.01 ether, "Claim fee too high"); // Max 1%
        require(newRefundFee <= 0.005 ether, "Refund fee too high"); // Max 0.5%
        
        claimFee = newClaimFee;
        refundFee = newRefundFee;
    }

    /**
     * @dev Withdraw collected fees (only ICP network signer)
     */
    function withdrawFees() external {
        require(msg.sender == icpNetworkSigner, "Only ICP network signer can withdraw fees");
        require(totalFeesCollected > 0, "No fees to withdraw");
        
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        
        (bool success, ) = icpNetworkSigner.call{value: amount}("");
        require(success, "Fee withdrawal failed");
    }

    /**
     * @dev Emergency withdrawal of stuck tokens (only ICP network signer)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external {
        require(msg.sender == icpNetworkSigner, "Only ICP network signer can withdraw");
        if (token == address(0)) {
            (bool success, ) = icpNetworkSigner.call{value: amount}("");
            require(success, "ETH withdrawal failed");
        } else {
            IERC20(token).safeTransfer(icpNetworkSigner, amount);
        }
    }

    receive() external payable {
        // Allow contract to receive ETH
    }
} 