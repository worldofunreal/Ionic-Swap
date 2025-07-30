// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { Address, AddressLib } from "./AddressLib.sol";

import { IBaseEscrow } from "../interfaces/IBaseEscrow.sol";

/**
 * @title ImmutablesLib
 * @notice Library for handling immutable escrow parameters
 */
library ImmutablesLib {
    using AddressLib for Address;

    /**
     * @dev Computes the hash of the immutable parameters
     * @param immutables The immutable parameters
     * @return The computed hash
     */
    function hash(IBaseEscrow.Immutables calldata immutables) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            immutables.orderHash,
            immutables.hashlock,
            immutables.maker,
            immutables.taker,
            immutables.token,
            immutables.amount,
            immutables.safetyDeposit,
            immutables.timelocks
        ));
    }

    /**
     * @dev Computes the hash of the immutable parameters for memory
     * @param immutables The immutable parameters
     * @return The computed hash
     */
    function hashMem(IBaseEscrow.Immutables memory immutables) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            immutables.orderHash,
            immutables.hashlock,
            immutables.maker,
            immutables.taker,
            immutables.token,
            immutables.amount,
            immutables.safetyDeposit,
            immutables.timelocks
        ));
    }
} 