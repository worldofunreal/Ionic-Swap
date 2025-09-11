// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title USDCToken
 * @notice ERC20 representation of USDC with EIP-2612 permit support
 * @custom:security-contact security@ionic-swap.io
 */
contract USDCToken is ERC20, ERC20Permit {
    uint256 public constant MAX_SUPPLY = 1_000_000_000_000 * 10**6; // 1 Trillion USDC with 6 decimals
    
    constructor() ERC20("USD Coin", "USDC") ERC20Permit("USD Coin") {
        // Mint initial supply to deployer (10000 USDC)
        _mint(msg.sender, 10_000 * 10**decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
    
    /**
     * @dev Mints new tokens
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
