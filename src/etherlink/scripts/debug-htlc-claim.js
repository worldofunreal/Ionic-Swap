const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging HTLC claim failure...\n");

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

    // Use the same parameters from the test
    const userAmount = ethers.utils.parseUnits("1000", 8);
    const timelock = Math.floor(Date.now() / 1000) + 3600;
    const secret = ethers.utils.randomBytes(32);
    const hashlock = ethers.utils.keccak256(secret);

    console.log("📋 Test Parameters:");
    console.log("  Secret:", ethers.utils.hexlify(secret));
    console.log("  Hashlock:", hashlock);
    console.log("");

    // Create HTLC for user's tokens
    console.log("🔒 Creating test HTLC...");
    
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
        "test_order_debug" // orderHash
    );
    
    const userHtlcReceipt = await userHtlcTx.wait();
    const userHtlcEvent = userHtlcReceipt.events.find(e => e.event === 'HTLCCreated');
    const userHtlcId = userHtlcEvent.args.htlcId;
    
    console.log("  HTLC created! ID:", userHtlcId);
    console.log("");

    // Get HTLC details
    console.log("🔍 HTLC Details:");
    const htlc = await htlcContract.getHTLC(userHtlcId);
    console.log("  Sender:", htlc.sender);
    console.log("  Recipient:", htlc.recipient);
    console.log("  Amount:", ethers.utils.formatUnits(htlc.amount, 8));
    console.log("  Hashlock:", htlc.hashlock);
    console.log("  Status:", htlc.status);
    console.log("  Timelock:", new Date(htlc.timelock * 1000).toISOString());
    console.log("");

    // Check if resolver is the recipient
    console.log("🔍 Recipient Check:");
    console.log("  Resolver address:", resolver.address);
    console.log("  HTLC recipient:", htlc.recipient);
    console.log("  Is resolver recipient?", resolver.address.toLowerCase() === htlc.recipient.toLowerCase());
    console.log("");

    // Check secret verification
    console.log("🔍 Secret Verification:");
    const secretString = ethers.utils.hexlify(secret);
    const secretHash = ethers.utils.keccak256(secret);
    console.log("  Secret (hex):", secretString);
    console.log("  Secret hash:", secretHash);
    console.log("  HTLC hashlock:", htlc.hashlock);
    console.log("  Hashes match?", secretHash === htlc.hashlock);
    console.log("");

    // Try to claim
    console.log("🔓 Attempting to claim HTLC...");
    try {
        const claimTx = await htlcContract.connect(resolver).claimHTLC(userHtlcId, secretString);
        await claimTx.wait();
        console.log("✅ Claim successful! TX:", claimTx.hash);
    } catch (error) {
        console.log("❌ Claim failed:");
        console.log("  Error:", error.message);
        
        // Try to decode the error
        if (error.data) {
            console.log("  Error data:", error.data);
        }
        
        // Check if it's a revert with reason
        if (error.reason) {
            console.log("  Reason:", error.reason);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Debug failed:", error);
        process.exit(1);
    }); 