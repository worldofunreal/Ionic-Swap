// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { IBaseEscrow } from "./IBaseEscrow.sol";

/**
 * @title IEscrowDst
 * @notice Interface for destination escrow functionality
 */
interface IEscrowDst is IBaseEscrow {
    /**
     * @notice Public withdraw function
     * @param secret The secret that unlocks the escrow
     * @param immutables The immutable parameters
     */
    function publicWithdraw(bytes32 secret, Immutables calldata immutables) external;
} 