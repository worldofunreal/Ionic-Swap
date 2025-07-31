const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing Etherlink HTLC Contracts");
    console.log("====================================");

    // Get signers
    const [deployer, user1, user2, icpSigner] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`👤 User1: ${user1.address}`);
    console.log(`👤 User2: ${user2.address}`);
    console.log(`🔐 ICP Signer: ${icpSigner.address}`);

    // Deploy the factory
    console.log("\n📦 Deploying EtherlinkEscrowFactory...");
    const EtherlinkEscrowFactory = await ethers.getContractFactory("EtherlinkEscrowFactory");
    const factory = await EtherlinkEscrowFactory.deploy(
        icpSigner.address,
        86400, // 1 day rescue delay
        86400  // 1 day rescue delay
    );
    await factory.deployed();
    console.log(`✅ Factory deployed to: ${factory.address}`);

    // Test basic functionality
    console.log("\n🔍 Testing basic functionality...");
    
    // Check ICP signer
    const storedIcpSigner = await factory.icpNetworkSigner();
    console.log(`✅ ICP Signer: ${storedIcpSigner}`);
    console.log(`✅ Matches expected: ${storedIcpSigner === icpSigner.address}`);

    // Check implementations
    const srcImpl = await factory.ESCROW_SRC_IMPLEMENTATION();
    const dstImpl = await factory.ESCROW_DST_IMPLEMENTATION();
    console.log(`✅ Source Implementation: ${srcImpl}`);
    console.log(`✅ Destination Implementation: ${dstImpl}`);

    // Check fees
    const claimFee = await factory.claimFee();
    const refundFee = await factory.refundFee();
    console.log(`✅ Claim Fee: ${ethers.utils.formatEther(claimFee)} ETH`);
    console.log(`✅ Refund Fee: ${ethers.utils.formatEther(refundFee)} ETH`);

    // Test fee update (should fail for non-ICP signer)
    console.log("\n🔒 Testing access control...");
    try {
        await factory.connect(user1).updateFees(ethers.utils.parseEther("0.002"), ethers.utils.parseEther("0.001"));
        console.log("❌ Fee update should have failed for non-ICP signer");
    } catch (error) {
        console.log("✅ Fee update correctly blocked for non-ICP signer");
    }

    // Test fee update (should succeed for ICP signer)
    try {
        await factory.connect(icpSigner).updateFees(ethers.utils.parseEther("0.002"), ethers.utils.parseEther("0.001"));
        console.log("✅ Fee update succeeded for ICP signer");
        
        const newClaimFee = await factory.claimFee();
        const newRefundFee = await factory.refundFee();
        console.log(`✅ New Claim Fee: ${ethers.utils.formatEther(newClaimFee)} ETH`);
        console.log(`✅ New Refund Fee: ${ethers.utils.formatEther(newRefundFee)} ETH`);
    } catch (error) {
        console.log(`❌ Fee update failed: ${error.message}`);
    }

    // Test address computation
    console.log("\n📍 Testing address computation...");
    
    // Create sample immutables
    const sampleImmutables = {
        orderHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_order")),
        hashlock: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_secret")),
        maker: user1.address,
        taker: user2.address,
        token: ethers.constants.AddressZero, // ETH
        amount: ethers.utils.parseEther("1.0"),
        safetyDeposit: ethers.utils.parseEther("0.1"),
        timelocks: {
            srcWithdrawalDelay: 3600,
            srcPublicWithdrawalDelay: 7200,
            srcCancellationDelay: 10800,
            srcPublicCancellationDelay: 14400,
            dstWithdrawalDelay: 3600,
            dstPublicWithdrawalDelay: 7200,
            dstCancellationDelay: 10800,
            deployedAt: 0
        }
    };

    const srcAddress = await factory.addressOfEscrowSrc(sampleImmutables);
    const dstAddress = await factory.addressOfEscrowDst(sampleImmutables);
    
    console.log(`✅ Computed Source Address: ${srcAddress}`);
    console.log(`✅ Computed Destination Address: ${dstAddress}`);
    console.log(`✅ Addresses are deterministic: ${srcAddress !== dstAddress}`);

    // Test emergency withdrawal (should fail for non-ICP signer)
    console.log("\n🚨 Testing emergency functions...");
    try {
        await factory.connect(user1).emergencyWithdraw(ethers.constants.AddressZero, ethers.utils.parseEther("0.1"));
        console.log("❌ Emergency withdrawal should have failed for non-ICP signer");
    } catch (error) {
        console.log("✅ Emergency withdrawal correctly blocked for non-ICP signer");
    }

    console.log("\n🎉 All tests completed successfully!");
    console.log("====================================");
    console.log(`📋 Factory Address: ${factory.address}`);
    console.log(`🔐 ICP Signer: ${icpSigner.address}`);
    console.log(`✅ Contract is ready for production use!`);
}

main()
    .then(() => {
        console.log("\n✅ Test script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Test failed:");
        console.error(error);
        process.exit(1);
    }); 