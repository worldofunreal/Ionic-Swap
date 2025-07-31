// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { TimelocksLib } from "../libraries/TimelocksLib.sol";

/**
 * @title IBaseEscrow
 * @notice Interface for base escrow functionality
 */
interface IBaseEscrow {
    struct Immutables {
        bytes32 orderHash;
        bytes32 hashlock;
        address maker;
        address taker;
        address token;
        uint256 amount;
        uint256 safetyDeposit;
        TimelocksLib.Timelocks timelocks;
    }



    /**
     * @notice Withdraw tokens from escrow
     * @param secret The secret that unlocks the escrow
     * @param immutables The immutable parameters
     */
    function withdraw(bytes32 secret, Immutables calldata immutables) external;

    /**
     * @notice Cancel escrow and refund tokens
     * @param immutables The immutable parameters
     */
    function cancel(Immutables calldata immutables) external;

    /**
     * @notice Rescue funds that are stuck in the contract
     * @param token The token address to rescue
     * @param amount The amount to rescue
     * @param immutables The immutable parameters
     */
    function rescueFunds(address token, uint256 amount, Immutables calldata immutables) external;

    event EscrowWithdrawal(bytes32 indexed secret);
    event EscrowCancelled();
    event FundsRescued(address indexed token, uint256 amount);
} 