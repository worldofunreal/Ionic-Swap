const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying All ERC20 Tokens to Sepolia...");
  console.log("==========================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("🔑 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const tokens = [
    { name: "BitcoinToken", symbol: "BTC", decimals: 8 },
    { name: "XRPToken", symbol: "XRP", decimals: 6 },
    { name: "TetherToken", symbol: "USDT", decimals: 6 },
    { name: "BNBToken", symbol: "BNB", decimals: 18 },
    { name: "DogecoinToken", symbol: "DOGE", decimals: 8 },
    { name: "CardanoToken", symbol: "ADA", decimals: 6 },
    { name: "TronToken", symbol: "TRX", decimals: 6 },
  ];

  const deployedTokens = {};

  for (const token of tokens) {
    try {
      console.log(`\n🪙 Deploying ${token.name} (${token.symbol})...`);
      
      const TokenContract = await hre.ethers.getContractFactory(token.name);
      const tokenContract = await TokenContract.deploy();
      
      await tokenContract.deployed();
      const address = tokenContract.address;
      
      console.log(`   ✅ ${token.symbol} deployed to: ${address}`);
      
      // Get initial balance of deployer
      const balance = await tokenContract.balanceOf(deployer.address);
      const formattedBalance = hre.ethers.utils.formatUnits(balance, token.decimals);
      console.log(`   💰 Deployer balance: ${formattedBalance} ${token.symbol}`);
      
      deployedTokens[token.symbol] = {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        address: address,
        deployerBalance: formattedBalance
      };
      
      // Wait a bit between deployments
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`   ❌ Failed to deploy ${token.name}:`, error.message);
    }
  }

  // Save deployment info
  const fs = require('fs');
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    network: hre.network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    tokens: deployedTokens
  };

  fs.writeFileSync(
    './deployments/all-tokens-sepolia.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🎉 All Token Deployments Complete!");
  console.log("==================================");
  console.log(`📁 Deployment info saved to: ./deployments/all-tokens-sepolia.json`);
  
  console.log("\n📋 Deployment Summary:");
  console.log(`   Network: ${hre.network.name}`);
  console.log(`   Chain ID: ${deploymentInfo.chainId}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Tokens Deployed: ${Object.keys(deployedTokens).length}`);
  
  console.log("\n🪙 Token Addresses:");
  Object.entries(deployedTokens).forEach(([symbol, info]) => {
    console.log(`   ${symbol}: ${info.address}`);
  });

  console.log("\n🔗 Etherscan URLs:");
  Object.entries(deployedTokens).forEach(([symbol, info]) => {
    console.log(`   ${symbol}: https://sepolia.etherscan.io/address/${info.address}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
