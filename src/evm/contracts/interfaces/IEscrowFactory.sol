// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { IBaseEscrow } from "./IBaseEscrow.sol";

/**
 * @title IEscrowFactory
 * @notice Interface for escrow factory functionality
 */
interface IEscrowFactory {
    struct DstImmutablesComplement {
        address maker;
        uint256 amount;
        address token;
        uint256 safetyDeposit;
        uint256 chainId;
    }



    /**
     * @notice Create destination escrow
     * @param dstImmutables The destination immutable parameters
     * @param srcCancellationTimestamp The source cancellation timestamp
     */
    function createDstEscrow(IBaseEscrow.Immutables calldata dstImmutables, uint256 srcCancellationTimestamp) external payable;

    /**
     * @notice Get the address of a source escrow
     * @param immutables The immutable parameters
     * @return The computed escrow address
     */
    function addressOfEscrowSrc(IBaseEscrow.Immutables calldata immutables) external view returns (address);

    /**
     * @notice Get the address of a destination escrow
     * @param immutables The immutable parameters
     * @return The computed escrow address
     */
    function addressOfEscrowDst(IBaseEscrow.Immutables calldata immutables) external view returns (address);

    event SrcEscrowCreated(IBaseEscrow.Immutables indexed immutables, DstImmutablesComplement indexed dstImmutablesComplement);
    event DstEscrowCreated(address indexed escrow, bytes32 indexed hashlock, address indexed taker);

    error InsufficientEscrowBalance();
    error InvalidCreationTime();
} 