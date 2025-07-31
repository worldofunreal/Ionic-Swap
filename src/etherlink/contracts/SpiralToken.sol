// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SpiralToken
 * @notice Simple ERC20 token for testing
 * @custom:security-contact security@ionic-swap.io
 */
contract SpiralToken is ERC20 {
    constructor() ERC20("Spiral", "SPIRAL") {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**decimals()); // 1 million tokens
    }

    function decimals() public view virtual override returns (uint8) {
        return 8;
    }
} 