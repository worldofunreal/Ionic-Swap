// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title BNBToken
 * @notice ERC20 representation of BNB with EIP-2612 permit support
 * @custom:security-contact security@ionic-swap.io
 */
contract BNBToken is ERC20, ERC20Permit {
    uint256 public constant MAX_SUPPLY = 200_000_000 * 10**18; // 200 Million BNB with 18 decimals
    
    constructor() ERC20("BNB", "BNB") ERC20Permit("BNB") {
        // Mint initial supply to deployer (1000 BNB)
        _mint(msg.sender, 1_000 * 10**decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
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
