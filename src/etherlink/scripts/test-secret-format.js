const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Testing secret format for HTLC claim...\n");

    // Get signers
    const [deployer] = await ethers.getSigners();
    const user = deployer;
    const resolver = deployer;

    // Load deployed contract addresses
    const htlcDeployment = JSON.parse(require('fs').readFileSync('./deployments/htlc-sepolia-11155111.json', 'utf8'));
    const htlcAddress = htlcDeployment.contractAddress;
    
    console.log("📋 HTLC Contract Address:", htlcAddress);

    // Get contract instance
    const htlcContract = await ethers.getContractAt("EtherlinkHTLC", htlcAddress);

    // Test different secret formats
    const secretBytes = ethers.utils.randomBytes(32);
    const secretHex = ethers.utils.hexlify(secretBytes);
    const secretString = "test_secret_123"; // Simple string for testing
    
    console.log("📋 Secret Formats:");
    console.log("  Secret (bytes):", secretBytes);
    console.log("  Secret (hex):", secretHex);
    console.log("  Secret (string):", secretString);
    console.log("");

    // Calculate hashlock using different methods
    const hashlock1 = ethers.utils.keccak256(secretBytes);
    const hashlock2 = ethers.utils.keccak256(secretHex);
    const hashlock3 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretString));
    
    console.log("📋 Hashlock Calculations:");
    console.log("  Hashlock (from bytes):", hashlock1);
    console.log("  Hashlock (from hex):", hashlock2);
    console.log("  Hashlock (from string):", hashlock3);
    console.log("");

    // Use the string hashlock for creating HTLC (this is what the contract expects)
    const userAmount = ethers.utils.parseUnits("100", 8);
    const timelock = Math.floor(Date.now() / 1000) + 3600;
    const hashlock = hashlock3; // Use string hashlock

    console.log("🔒 Creating HTLC with string hashlock...");
    
    const spiralToken = await ethers.getContractAt("SpiralToken", "0xdE7409EDeA573D090c3C6123458D6242E26b425E");
    await spiralToken.connect(user).approve(htlcAddress, userAmount);
    
    const userHtlcTx = await htlcContract.connect(user).createHTLCERC20(
        resolver.address, // recipient
        spiralToken.address, // token
        userAmount, // amount
        hashlock, // hashlock
        timelock, // timelock
        1, // sourceChain (Etherlink)
        0, // targetChain (ICP)
        true, // isCrossChain
        "test_secret_format" // orderHash
    );
    
    const userHtlcReceipt = await userHtlcTx.wait();
    const userHtlcEvent = userHtlcReceipt.events.find(e => e.event === 'HTLCCreated');
    const userHtlcId = userHtlcEvent.args.htlcId;
    
    console.log("  HTLC created! ID:", userHtlcId);
    console.log("");

    // Try claiming with different secret formats
    console.log("🔓 Testing claim with different secret formats...");
    
    // Test 1: Hex string
    console.log("  Test 1: Hex string");
    try {
        const claimTx1 = await htlcContract.connect(resolver).claimHTLC(userHtlcId, secretHex);
        await claimTx1.wait();
        console.log("    ✅ Claim successful with hex string!");
        return;
    } catch (error) {
        console.log("    ❌ Claim failed with hex string:", error.message);
    }
    
    // Test 2: UTF-8 string
    console.log("  Test 2: UTF-8 string");
    try {
        const claimTx2 = await htlcContract.connect(resolver).claimHTLC(userHtlcId, secretString);
        await claimTx2.wait();
        console.log("    ✅ Claim successful with UTF-8 string!");
        return;
    } catch (error) {
        console.log("    ❌ Claim failed with UTF-8 string:", error.message);
    }
    
    // Test 3: Raw bytes as string
    console.log("  Test 3: Raw bytes as string");
    try {
        const claimTx3 = await htlcContract.connect(resolver).claimHTLC(userHtlcId, secretBytes.toString());
        await claimTx3.wait();
        console.log("    ✅ Claim successful with raw bytes string!");
        return;
    } catch (error) {
        console.log("    ❌ Claim failed with raw bytes string:", error.message);
    }
    
    console.log("❌ All secret formats failed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }); 