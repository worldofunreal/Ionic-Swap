// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title MinimalForwarder
 * @notice EIP-2771 meta-transaction forwarder
 * @dev Allows gasless transactions by having the forwarder pay gas
 */
contract MinimalForwarder is EIP712 {
    using ECDSA for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
        uint256 validUntil;
    }

    bytes32 private constant _TYPEHASH =
        keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 validUntil)");

    mapping(address => uint256) private _nonces;

    event MetaTransactionExecuted(address indexed from, address indexed to, bytes data);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    address public immutable deployer;

    constructor() EIP712("MinimalForwarder", "0.0.1") {
        deployer = msg.sender;
    }

    // Allow contract to receive ETH for gas payments
    receive() external payable {}

    // Emergency withdrawal function - only deployer can call
    function withdrawFunds(address payable recipient, uint256 amount) external {
        require(msg.sender == deployer, "MinimalForwarder: only deployer can withdraw");
        require(amount <= address(this).balance, "MinimalForwarder: insufficient balance");
        recipient.transfer(amount);
        emit FundsWithdrawn(recipient, amount);
    }

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function verify(ForwardRequest memory req, bytes calldata signature) public view returns (bool) {
        // Use proper EIP-712 verification
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                _TYPEHASH,
                req.from,
                req.to,
                req.value,
                req.gas,
                req.nonce,
                keccak256(req.data),
                req.validUntil
            ))
        );
        address signer = digest.recover(signature);
        return _nonces[req.from] == req.nonce && signer == req.from;
    }

    function execute(bytes calldata req, bytes calldata signature) public payable returns (bool, bytes memory) {
        ForwardRequest memory request = abi.decode(req, (ForwardRequest));
        require(verify(request, signature), "MinimalForwarder: signature does not match request");
        require(request.validUntil == 0 || block.timestamp <= request.validUntil, "MinimalForwarder: request expired");

        _nonces[request.from] = request.nonce + 1;

        (bool success, bytes memory returndata) = request.to.call{gas: request.gas, value: request.value}(
            abi.encodePacked(request.data, request.from)
        );

        if (success) {
            emit MetaTransactionExecuted(request.from, request.to, request.data);
        }

        return (success, returndata);
    }
} 