const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("🚀 Starting HTLC Flow Test...\n");

    // Get signers
    const [deployer] = await ethers.getSigners();
    
    // For testing, use deployer as both user and resolver
    const user = deployer;
    const resolver = deployer;
    
    console.log("📋 Signers:");
    console.log("  Deployer:", deployer.address);
    console.log("  User:", user.address);
    console.log("  Resolver:", resolver.address);
    console.log("");

    // Load deployed contract addresses
    const htlcDeployment = JSON.parse(fs.readFileSync('./deployments/htlc-sepolia-11155111.json', 'utf8'));
    const spiralDeployment = JSON.parse(fs.readFileSync('./deployments/spiral-token-sepolia-11155111.json', 'utf8'));
    
    const htlcAddress = htlcDeployment.contractAddress;
    const spiralTokenAddress = spiralDeployment.contractAddress;
    
    console.log("📋 Contract Addresses:");
    console.log("  HTLC Contract:", htlcAddress);
    console.log("  SpiralToken:", spiralTokenAddress);
    console.log("");

    // Get contract instances
    const htlcContract = await ethers.getContractAt("EtherlinkHTLC", htlcAddress);
    const spiralToken = await ethers.getContractAt("SpiralToken", spiralTokenAddress);

    // Deploy StardustToken for testing cross-token swaps
    console.log("🔧 Deploying StardustToken for cross-token swap testing...");
    const StardustToken = await ethers.getContractFactory("StardustToken");
    const stardustToken = await StardustToken.deploy();
    await stardustToken.deployed();
    console.log("  StardustToken deployed:", stardustToken.address);
    console.log("");

    // Test parameters
    const userAmount = ethers.utils.parseUnits("1000", 8); // 1000 Spiral tokens
    const resolverAmount = ethers.utils.parseUnits("500", 8); // 500 Stardust tokens
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    console.log("📋 Test Parameters:");
    console.log("  User Amount:", ethers.utils.formatUnits(userAmount, 8), "Spiral");
    console.log("  Resolver Amount:", ethers.utils.formatUnits(resolverAmount, 8), "Stardust");
    console.log("  Timelock:", new Date(timelock * 1000).toISOString());
    console.log("");

    // Step 1: Generate secret and hashlock
    console.log("🔐 Step 1: Generating secret and hashlock...");
    const secret = "htlc_secret_" + Math.random().toString(36).substring(2, 15);
    const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
    console.log("  Secret:", secret);
    console.log("  Hashlock:", hashlock);
    console.log("");

    // Step 2: Fund accounts with tokens
    console.log("💰 Step 2: Funding accounts with tokens...");
    
    // Fund user with Spiral tokens
    const userSpiralBalance = await spiralToken.balanceOf(user.address);
    if (userSpiralBalance.lt(userAmount)) {
        console.log("  Minting Spiral tokens to user...");
        await spiralToken.mint(user.address, userAmount);
    }
    console.log("  User Spiral balance:", ethers.utils.formatUnits(await spiralToken.balanceOf(user.address), 8));

    // Fund resolver with Stardust tokens
    const resolverStardustBalance = await stardustToken.balanceOf(resolver.address);
    if (resolverStardustBalance.lt(resolverAmount)) {
        console.log("  Minting Stardust tokens to resolver...");
        await stardustToken.mint(resolver.address, resolverAmount);
    }
    console.log("  Resolver Stardust balance:", ethers.utils.formatUnits(await stardustToken.balanceOf(resolver.address), 8));
    console.log("");

    // Step 3: Create HTLC for user's Spiral tokens
    console.log("🔒 Step 3: Creating HTLC for user's Spiral tokens...");
    
    // First, approve HTLC contract to spend user's tokens
    console.log("  Approving HTLC contract to spend user's Spiral tokens...");
    await spiralToken.connect(user).approve(htlcAddress, userAmount);
    console.log("  Approval successful");

    // Create HTLC for user's tokens
    const userHtlcTx = await htlcContract.connect(user).createHTLCERC20(
        resolver.address, // recipient
        spiralTokenAddress, // token
        userAmount, // amount
        hashlock, // hashlock
        timelock, // timelock
        1, // sourceChain (Etherlink)
        0, // targetChain (ICP)
        true, // isCrossChain
        "test_order_1" // orderHash
    );
    
    const userHtlcReceipt = await userHtlcTx.wait();
    console.log("  User HTLC created! TX:", userHtlcTx.hash);
    
    // Extract HTLC ID from event
    const userHtlcEvent = userHtlcReceipt.events.find(e => e.event === 'HTLCCreated');
    const userHtlcId = userHtlcEvent.args.htlcId;
    console.log("  User HTLC ID:", userHtlcId);
    console.log("");

    // Step 4: Create HTLC for resolver's Stardust tokens
    console.log("🔒 Step 4: Creating HTLC for resolver's Stardust tokens...");
    
    // Approve HTLC contract to spend resolver's tokens
    console.log("  Approving HTLC contract to spend resolver's Stardust tokens...");
    await stardustToken.connect(resolver).approve(htlcAddress, resolverAmount);
    console.log("  Approval successful");

    // Create HTLC for resolver's tokens
    const resolverHtlcTx = await htlcContract.connect(resolver).createHTLCERC20(
        user.address, // recipient (user gets resolver's tokens)
        stardustToken.address, // token
        resolverAmount, // amount
        hashlock, // same hashlock
        timelock, // same timelock
        1, // sourceChain (Etherlink)
        0, // targetChain (ICP)
        true, // isCrossChain
        "test_order_1" // same orderHash
    );
    
    const resolverHtlcReceipt = await resolverHtlcTx.wait();
    console.log("  Resolver HTLC created! TX:", resolverHtlcTx.hash);
    
    // Extract HTLC ID from event
    const resolverHtlcEvent = resolverHtlcReceipt.events.find(e => e.event === 'HTLCCreated');
    const resolverHtlcId = resolverHtlcEvent.args.htlcId;
    console.log("  Resolver HTLC ID:", resolverHtlcId);
    console.log("");

    // Step 5: Verify HTLC states
    console.log("🔍 Step 5: Verifying HTLC states...");
    
    const userHtlc = await htlcContract.getHTLC(userHtlcId);
    const resolverHtlc = await htlcContract.getHTLC(resolverHtlcId);
    
    console.log("  User HTLC Status:", userHtlc.status);
    console.log("  User HTLC Amount:", ethers.utils.formatUnits(userHtlc.amount, 8));
    console.log("  User HTLC Recipient:", userHtlc.recipient);
    console.log("  Resolver HTLC Status:", resolverHtlc.status);
    console.log("  Resolver HTLC Amount:", ethers.utils.formatUnits(resolverHtlc.amount, 8));
    console.log("  Resolver HTLC Recipient:", resolverHtlc.recipient);
    console.log("");

    // Step 6: Claim HTLCs with secret
    console.log("🔓 Step 6: Claiming HTLCs with secret...");
    
    // Claim user's HTLC (resolver claims user's Spiral tokens)
    console.log("  Resolver claiming user's Spiral tokens...");
    const claimUserHtlcTx = await htlcContract.connect(resolver).claimHTLC(userHtlcId, secret);
    await claimUserHtlcTx.wait();
    console.log("  User HTLC claimed! TX:", claimUserHtlcTx.hash);
    
    // Claim resolver's HTLC (user claims resolver's Stardust tokens)
    console.log("  User claiming resolver's Stardust tokens...");
    const claimResolverHtlcTx = await htlcContract.connect(user).claimHTLC(resolverHtlcId, secret);
    await claimResolverHtlcTx.wait();
    console.log("  Resolver HTLC claimed! TX:", claimResolverHtlcTx.hash);
    console.log("");

    // Step 7: Verify final balances
    console.log("💰 Step 7: Verifying final balances...");
    
    const userFinalSpiral = await spiralToken.balanceOf(user.address);
    const userFinalStardust = await stardustToken.balanceOf(user.address);
    const resolverFinalSpiral = await spiralToken.balanceOf(resolver.address);
    const resolverFinalStardust = await stardustToken.balanceOf(resolver.address);
    
    console.log("  User final Spiral balance:", ethers.utils.formatUnits(userFinalSpiral, 8));
    console.log("  User final Stardust balance:", ethers.utils.formatUnits(userFinalStardust, 8));
    console.log("  Resolver final Spiral balance:", ethers.utils.formatUnits(resolverFinalSpiral, 8));
    console.log("  Resolver final Stardust balance:", ethers.utils.formatUnits(resolverFinalStardust, 8));
    console.log("");

    // Step 8: Verify HTLC final states
    console.log("🔍 Step 8: Verifying HTLC final states...");
    
    const userHtlcFinal = await htlcContract.getHTLC(userHtlcId);
    const resolverHtlcFinal = await htlcContract.getHTLC(resolverHtlcId);
    
    console.log("  User HTLC final status:", userHtlcFinal.status);
    console.log("  Resolver HTLC final status:", resolverHtlcFinal.status);
    console.log("  User HTLC secret revealed:", userHtlcFinal.secret);
    console.log("  Resolver HTLC secret revealed:", resolverHtlcFinal.secret);
    console.log("");

    // Step 9: Test atomic swap verification
    console.log("✅ Step 9: Atomic swap verification...");
    
    const swapSuccessful = 
        userHtlcFinal.status === 1 && // Claimed
        resolverHtlcFinal.status === 1 && // Claimed
        userHtlcFinal.secret === secret &&
        resolverHtlcFinal.secret === secret;
    
    if (swapSuccessful) {
        console.log("  🎉 ATOMIC SWAP SUCCESSFUL!");
        console.log("  Both HTLCs claimed with same secret");
        console.log("  Tokens exchanged atomically");
    } else {
        console.log("  ❌ Atomic swap failed!");
        console.log("  Check HTLC states and secret revelation");
    }
    console.log("");

    console.log("🏁 HTLC Flow Test Complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }); 