const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Funding User with Tokens");
    console.log("============================");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Deployer Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

    // User address (default Hardhat account)
    const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    console.log(`👤 User: ${userAddress}`);

    // Token addresses
    const spiralTokenAddress = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
    const stardustTokenAddress = "0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90";

    // Load token contracts
    const spiralToken = await ethers.getContractAt("MockERC20", spiralTokenAddress);
    const stardustToken = await ethers.getContractAt("MockERC20", stardustTokenAddress);

    // Check deployer balances
    const deployerSpiralBalance = await spiralToken.balanceOf(deployer.address);
    const deployerStardustBalance = await stardustToken.balanceOf(deployer.address);
    
    console.log(`📊 Deployer Spiral Balance: ${ethers.utils.formatUnits(deployerSpiralBalance, 8)}`);
    console.log(`📊 Deployer Stardust Balance: ${ethers.utils.formatUnits(deployerStardustBalance, 8)}`);

    // Check user balances
    const userSpiralBalance = await spiralToken.balanceOf(userAddress);
    const userStardustBalance = await stardustToken.balanceOf(userAddress);
    
    console.log(`📊 User Spiral Balance: ${ethers.utils.formatUnits(userSpiralBalance, 8)}`);
    console.log(`📊 User Stardust Balance: ${ethers.utils.formatUnits(userStardustBalance, 8)}`);

    // Transfer tokens to user
    const transferAmount = ethers.utils.parseUnits("10000", 8); // 10,000 tokens each

    console.log("\n💸 Transferring tokens to user...");

    // Transfer Spiral tokens
    if (deployerSpiralBalance.gte(transferAmount)) {
        const spiralTx = await spiralToken.transfer(userAddress, transferAmount);
        await spiralTx.wait();
        console.log(`✅ Transferred ${ethers.utils.formatUnits(transferAmount, 8)} Spiral tokens to user`);
        console.log(`   Transaction: ${spiralTx.hash}`);
    } else {
        console.log(`❌ Deployer doesn't have enough Spiral tokens (needs ${ethers.utils.formatUnits(transferAmount, 8)})`);
    }

    // Transfer Stardust tokens
    if (deployerStardustBalance.gte(transferAmount)) {
        const stardustTx = await stardustToken.transfer(userAddress, transferAmount);
        await stardustTx.wait();
        console.log(`✅ Transferred ${ethers.utils.formatUnits(transferAmount, 8)} Stardust tokens to user`);
        console.log(`   Transaction: ${stardustTx.hash}`);
    } else {
        console.log(`❌ Deployer doesn't have enough Stardust tokens (needs ${ethers.utils.formatUnits(transferAmount, 8)})`);
    }

    // Check final balances
    const finalUserSpiralBalance = await spiralToken.balanceOf(userAddress);
    const finalUserStardustBalance = await stardustToken.balanceOf(userAddress);
    
    console.log("\n📊 Final User Balances:");
    console.log(`   Spiral: ${ethers.utils.formatUnits(finalUserSpiralBalance, 8)}`);
    console.log(`   Stardust: ${ethers.utils.formatUnits(finalUserStardustBalance, 8)}`);

    console.log("\n🎉 Token funding completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 