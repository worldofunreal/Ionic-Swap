// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { IBaseEscrow } from "./IBaseEscrow.sol";

/**
 * @title IEscrowSrc
 * @notice Interface for source escrow functionality
 */
interface IEscrowSrc is IBaseEscrow {
    /**
     * @notice Withdraw tokens to a specific address
     * @param secret The secret that unlocks the escrow
     * @param target The address to transfer tokens to
     * @param immutables The immutable parameters
     */
    function withdrawTo(bytes32 secret, address target, Immutables calldata immutables) external;

    /**
     * @notice Public withdraw function
     * @param secret The secret that unlocks the escrow
     * @param immutables The immutable parameters
     */
    function publicWithdraw(bytes32 secret, Immutables calldata immutables) external;

    /**
     * @notice Public cancel function
     * @param immutables The immutable parameters
     */
    function publicCancel(Immutables calldata immutables) external;
} 