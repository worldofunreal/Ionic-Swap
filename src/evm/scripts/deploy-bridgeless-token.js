const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Bridgeless Token System...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    // Deploy the BridgelessToken contract
    console.log("📦 Deploying BridgelessToken...");
    const BridgelessToken = await ethers.getContractFactory("BridgelessToken");
    
    // For now, we'll use the deployer as the threshold signer
    // In production, this should be the ICP canister's Ethereum address
    const thresholdSigner = deployer.address; // TODO: Replace with ICP canister address
    
    const bridgelessToken = await BridgelessToken.deploy(
        "Bridgeless Token", // name
        "BLT",              // symbol
        thresholdSigner     // threshold signer address
    );

    await bridgelessToken.deployed();
    console.log("✅ BridgelessToken deployed to:", bridgelessToken.address);

    // Mint initial supply to the deployer
    const initialSupply = ethers.utils.parseEther("1000000"); // 1 million tokens
    console.log("💰 Minting initial supply...");
    await bridgelessToken.mint(deployer.address, initialSupply);
    console.log("✅ Initial supply minted:", ethers.utils.formatEther(initialSupply), "tokens");

    // Verify the deployment
    console.log("🔍 Verifying deployment...");
    const name = await bridgelessToken.name();
    const symbol = await bridgelessToken.symbol();
    const totalSupply = await bridgelessToken.totalSupply();
    const thresholdSignerAddress = await bridgelessToken.thresholdSigner();

    console.log("📊 Contract Details:");
    console.log("  Name:", name);
    console.log("  Symbol:", symbol);
    console.log("  Total Supply:", ethers.utils.formatEther(totalSupply));
    console.log("  Threshold Signer:", thresholdSignerAddress);
    console.log("  Deployer Balance:", ethers.utils.formatEther(await bridgelessToken.balanceOf(deployer.address)));

    // Check if EVM chain is supported
    const isEvmSupported = await bridgelessToken.isChainSupported("EVM");
    console.log("  EVM Chain Supported:", isEvmSupported);

    // Get EVM ledger address
    const evmLedgerAddress = await bridgelessToken.getLedgerAddress("EVM");
    console.log("  EVM Ledger Address:", evmLedgerAddress);

    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        bridgelessToken: bridgelessToken.address,
        thresholdSigner: thresholdSignerAddress,
        deployer: deployer.address,
        initialSupply: ethers.utils.formatEther(initialSupply),
        deploymentTime: new Date().toISOString(),
    };

    console.log("💾 Deployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Save to file
    const fs = require("fs");
    const path = require("path");
    const deploymentPath = path.join(__dirname, "../deployments/bridgeless-token.json");
    
    // Ensure deployments directory exists
    const deploymentsDir = path.dirname(deploymentPath);
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to:", deploymentPath);

    console.log("🎉 Bridgeless Token System deployment completed!");
    console.log("");
    console.log("📋 Next Steps:");
    console.log("1. Update the threshold signer to the ICP canister's Ethereum address");
    console.log("2. Initialize the ICP canister with the root contract address");
    console.log("3. Create additional chain ledgers as needed");
    console.log("4. Test cross-chain transfer functionality");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
