// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title StardustToken
 * @notice ERC20 token with EIP-2612 permit support for testing cross-chain swaps
 * @custom:security-contact security@ionic-swap.io
 */
contract StardustToken is ERC20, ERC20Permit {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**8; // 1 Billion tokens with 8 decimals
    
    constructor() ERC20("Stardust", "STD") ERC20Permit("Stardust") {
        // Mint initial supply to deployer (1 million tokens)
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 8;
    }
    
    /**
     * @dev Mints new tokens (only owner can call this)
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Returns the maximum supply of tokens
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
} 