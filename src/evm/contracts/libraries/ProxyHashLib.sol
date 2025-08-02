// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/**
 * @title ProxyHashLib
 * @notice Library for computing proxy bytecode hashes
 */
library ProxyHashLib {
    /**
     * @dev Computes the bytecode hash for a proxy contract
     * @param implementation The implementation address
     * @return The computed bytecode hash
     */
    function computeProxyBytecodeHash(address implementation) internal pure returns (bytes32) {
        bytes memory bytecode = abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        );
        return keccak256(bytecode);
    }
} 