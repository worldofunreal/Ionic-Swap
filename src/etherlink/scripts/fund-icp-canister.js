const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("💰 Funding ICP Canister for Testing");
  console.log("=====================================");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deployer: ${deployer.address}`);

  // ICP canister address
  const icpCanisterAddress = "0xeA1e8F475e61Ff78b2986860E86A18F261078725";
  console.log(`🎯 ICP Canister Address: ${icpCanisterAddress}`);

  // Load deployed contract addresses
  const spiralDeployment = JSON.parse(fs.readFileSync('./deployments/spiral-token-sepolia-11155111.json', 'utf8'));
  const spiralTokenAddress = spiralDeployment.contractAddress;
  const stardustTokenAddress = "0x6ca99fc9bDed10004FE9CC6ce40914b98490Dc90"; // StardustToken on Sepolia

  console.log(`📋 Contract Addresses:`);
  console.log(`  SpiralToken: ${spiralTokenAddress}`);
  console.log(`  StardustToken: ${stardustTokenAddress}`);

  // Load token contracts
  const SpiralToken = await ethers.getContractFactory("SpiralToken");
  const StardustToken = await ethers.getContractFactory("StardustToken");
  
  const spiralToken = SpiralToken.attach(spiralTokenAddress);
  const stardustToken = StardustToken.attach(stardustTokenAddress);

  // Check current balances
  const deployerSpiralBalance = await spiralToken.balanceOf(deployer.address);
  const deployerStardustBalance = await stardustToken.balanceOf(deployer.address);
  const icpSpiralBalance = await spiralToken.balanceOf(icpCanisterAddress);
  const icpStardustBalance = await stardustToken.balanceOf(icpCanisterAddress);

  console.log(`\n💰 Current Balances:`);
  console.log(`  Deployer Spiral: ${ethers.utils.formatUnits(deployerSpiralBalance, 8)}`);
  console.log(`  Deployer Stardust: ${ethers.utils.formatUnits(deployerStardustBalance, 8)}`);
  console.log(`  ICP Canister Spiral: ${ethers.utils.formatUnits(icpSpiralBalance, 8)}`);
  console.log(`  ICP Canister Stardust: ${ethers.utils.formatUnits(icpStardustBalance, 8)}`);

  // Fund amounts
  const spiralAmount = ethers.utils.parseUnits("10000", 8); // 10,000 Spiral
  const stardustAmount = ethers.utils.parseUnits("10000", 8); // 10,000 Stardust

  console.log(`\n🎁 Funding ICP Canister:`);
  console.log(`  Spiral Amount: ${ethers.utils.formatUnits(spiralAmount, 8)}`);
  console.log(`  Stardust Amount: ${ethers.utils.formatUnits(stardustAmount, 8)}`);

  // Transfer Spiral tokens
  console.log(`\n📤 Transferring Spiral tokens to ICP canister...`);
  const spiralTx = await spiralToken.transfer(icpCanisterAddress, spiralAmount);
  await spiralTx.wait();
  console.log(`✅ Spiral transfer successful! TX: ${spiralTx.hash}`);

  // Transfer Stardust tokens
  console.log(`\n📤 Transferring Stardust tokens to ICP canister...`);
  const stardustTx = await stardustToken.transfer(icpCanisterAddress, stardustAmount);
  await stardustTx.wait();
  console.log(`✅ Stardust transfer successful! TX: ${stardustTx.hash}`);

  // Check final balances
  const finalIcpSpiralBalance = await spiralToken.balanceOf(icpCanisterAddress);
  const finalIcpStardustBalance = await stardustToken.balanceOf(icpCanisterAddress);

  console.log(`\n💰 Final ICP Canister Balances:`);
  console.log(`  Spiral: ${ethers.utils.formatUnits(finalIcpSpiralBalance, 8)}`);
  console.log(`  Stardust: ${ethers.utils.formatUnits(finalIcpStardustBalance, 8)}`);

  console.log(`\n🎉 ICP Canister funded successfully!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 