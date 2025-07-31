// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title MetaTransaction
 * @dev EIP-2771 meta-transaction implementation for gasless transactions
 */
contract MetaTransaction is EIP712 {
    using ECDSA for bytes32;

    struct MetaTx {
        uint256 nonce;
        address from;
        bytes functionSignature;
    }

    mapping(address => uint256) private _nonces;
    
    bytes32 private constant META_TX_TYPEHASH = keccak256(
        "MetaTransaction(uint256 nonce,address from,bytes functionSignature)"
    );

    event MetaTransactionExecuted(
        address indexed userAddress,
        address indexed relayerAddress,
        bytes functionSignature
    );

    constructor() EIP712("HTLC Meta Transaction", "1") {}

    /**
     * @dev Execute a meta-transaction
     * @param userAddress The address of the user
     * @param functionSignature The function signature to execute
     * @param sigR Signature R component
     * @param sigS Signature S component
     * @param sigV Signature V component
     * @return bytes The return data from the function call
     */
    function executeMetaTransaction(
        address userAddress,
        bytes calldata functionSignature,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) public returns (bytes memory) {
        MetaTx memory metaTx = MetaTx({
            nonce: _nonces[userAddress],
            from: userAddress,
            functionSignature: functionSignature
        });

        require(
            _verify(userAddress, metaTx, sigR, sigS, sigV),
            "MetaTransaction: Invalid signature"
        );

        _nonces[userAddress]++;

        // Append userAddress at the end to extract it from calling context
        (bool success, bytes memory returnData) = address(this).call(
            abi.encodePacked(functionSignature, userAddress)
        );

        require(success, "MetaTransaction: Function call failed");

        emit MetaTransactionExecuted(
            userAddress,
            msg.sender,
            functionSignature
        );

        return returnData;
    }

    /**
     * @dev Get the current nonce for a user
     * @param user The address of the user
     * @return uint256 The current nonce
     */
    function getNonce(address user) public view returns (uint256) {
        return _nonces[user];
    }

    /**
     * @dev Verify the signature for a meta-transaction
     * @param userAddress The address of the user
     * @param metaTx The meta-transaction data
     * @param sigR Signature R component
     * @param sigS Signature S component
     * @param sigV Signature V component
     * @return bool True if signature is valid
     */
    function _verify(
        address userAddress,
        MetaTx memory metaTx,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) internal view returns (bool) {
        address signer = ecrecover(
            toTypedDataHash(metaTx),
            sigV,
            sigR,
            sigS
        );
        return signer == userAddress;
    }

    /**
     * @dev Hash the meta-transaction data
     * @param metaTx The meta-transaction data
     * @return bytes32 The hash of the meta-transaction
     */
    function toTypedDataHash(MetaTx memory metaTx) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    META_TX_TYPEHASH,
                    metaTx.nonce,
                    metaTx.from,
                    keccak256(metaTx.functionSignature)
                )
            )
        );
    }

    /**
     * @dev Function to receive ETH when msg.data is not empty
     */
    receive() external payable {}

    /**
     * @dev Function to receive ETH when msg.data is empty
     */
    fallback() external payable {}
} 