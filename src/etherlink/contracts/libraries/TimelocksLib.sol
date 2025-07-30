// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/**
 * @title TimelocksLib
 * @notice Library for handling timelock stages
 */
library TimelocksLib {
    enum Stage {
        SrcWithdrawal,
        SrcPublicWithdrawal,
        SrcCancellation,
        SrcPublicCancellation,
        DstWithdrawal,
        DstPublicWithdrawal,
        DstCancellation
    }

    struct Timelocks {
        uint32 srcWithdrawalDelay;
        uint32 srcPublicWithdrawalDelay;
        uint32 srcCancellationDelay;
        uint32 srcPublicCancellationDelay;
        uint32 dstWithdrawalDelay;
        uint32 dstPublicWithdrawalDelay;
        uint32 dstCancellationDelay;
        uint256 deployedAt;
    }

    /**
     * @dev Get the start time for a specific stage
     * @param timelocks The timelocks struct
     * @param stage The stage to get the start time for
     * @return The start time for the stage
     */
    function get(Timelocks memory timelocks, Stage stage) internal pure returns (uint256) {
        if (stage == Stage.SrcWithdrawal) {
            return timelocks.deployedAt + timelocks.srcWithdrawalDelay;
        } else if (stage == Stage.SrcPublicWithdrawal) {
            return timelocks.deployedAt + timelocks.srcPublicWithdrawalDelay;
        } else if (stage == Stage.SrcCancellation) {
            return timelocks.deployedAt + timelocks.srcCancellationDelay;
        } else if (stage == Stage.SrcPublicCancellation) {
            return timelocks.deployedAt + timelocks.srcPublicCancellationDelay;
        } else if (stage == Stage.DstWithdrawal) {
            return timelocks.deployedAt + timelocks.dstWithdrawalDelay;
        } else if (stage == Stage.DstPublicWithdrawal) {
            return timelocks.deployedAt + timelocks.dstPublicWithdrawalDelay;
        } else if (stage == Stage.DstCancellation) {
            return timelocks.deployedAt + timelocks.dstCancellationDelay;
        }
        revert("Invalid stage");
    }

    /**
     * @dev Set the deployment timestamp
     * @param timelocks The timelocks struct
     * @param deployedAt The deployment timestamp
     * @return The updated timelocks struct
     */
    function setDeployedAt(Timelocks memory timelocks, uint256 deployedAt) internal pure returns (Timelocks memory) {
        timelocks.deployedAt = deployedAt;
        return timelocks;
    }

    /**
     * @dev Get the rescue start time
     * @param timelocks The timelocks struct
     * @param rescueDelay The rescue delay
     * @return The rescue start time
     */
    function rescueStart(Timelocks memory timelocks, uint256 rescueDelay) internal pure returns (uint256) {
        return timelocks.deployedAt + rescueDelay;
    }
} 