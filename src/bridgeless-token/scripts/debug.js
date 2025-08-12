const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging hardhat setup...");

    try {
        console.log("1. Testing ethers import...");
        console.log("ethers object:", typeof ethers);
        
        console.log("2. Testing hardhat object...");
        console.log("hardhat object:", typeof hre);
        
        console.log("3. Testing getSigners...");
        const signers = await ethers.getSigners();
        console.log("Signers array:", signers);
        console.log("Signers length:", signers.length);
        
        if (signers && signers.length > 0) {
            const deployer = signers[0];
            console.log("4. Testing deployer...");
            console.log("Deployer:", deployer);
            console.log("Deployer address:", deployer.address);
            console.log("Deployer balance:", ethers.utils.formatEther(await deployer.getBalance()));
            
            console.log("5. Testing contract factory...");
            const BridgelessToken = await ethers.getContractFactory("BridgelessToken");
            console.log("Contract factory created successfully");
            
            console.log("6. Testing deployment...");
            const bridgelessToken = await BridgelessToken.deploy(
                "Bridgeless Token",
                "BLT",
                deployer.address
            );
            
            await bridgelessToken.deployed();
            console.log("✅ Contract deployed to:", bridgelessToken.address);
            
            console.log("7. Testing contract functions...");
            const name = await bridgelessToken.name();
            const symbol = await bridgelessToken.symbol();
            console.log("Name:", name);
            console.log("Symbol:", symbol);
            
            console.log("🎉 All tests passed!");
        } else {
            console.log("❌ No signers found");
        }
    } catch (error) {
        console.error("❌ Debug failed:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Debug failed:", error);
        process.exit(1);
    });
