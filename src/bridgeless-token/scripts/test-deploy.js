const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing deployment setup...");

    try {
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("✅ Deployer account:", deployer.address);
        console.log("✅ Deployer balance:", ethers.utils.formatEther(await deployer.getBalance()));

        // Test contract factory
        const BridgelessToken = await ethers.getContractFactory("BridgelessToken");
        console.log("✅ Contract factory created successfully");

        // Test deployment
        const bridgelessToken = await BridgelessToken.deploy(
            "Bridgeless Token", // name
            "BLT",              // symbol
            deployer.address    // threshold signer address
        );

        await bridgelessToken.deployed();
        console.log("✅ Contract deployed successfully to:", bridgelessToken.address);

        // Test basic functions
        const name = await bridgelessToken.name();
        const symbol = await bridgelessToken.symbol();
        console.log("✅ Contract name:", name);
        console.log("✅ Contract symbol:", symbol);

        console.log("🎉 All tests passed!");
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
