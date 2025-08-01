const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Final HTLC Encoding Comparison");
    console.log("==================================");

    // Parameters with correct amounts
    const recipient = "0xf0d056015Bdd86C0EFD07000F75Ea10873A1d0A7";
    const token = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
    const amount = ethers.utils.parseUnits("1000", 8); // 1000 tokens with 8 decimals = 100000000000
    const hashlock = "0x73f84511fa1337d1e9a6907b37f7a9d4ffdabe9eb53cdbee0a8df22c901a186a";
    const timelock = 1754091212; // From the order
    const sourceChain = 1;
    const targetChain = 0;
    const isCrossChain = true;
    const orderHash = ""; // empty string

    console.log("📋 Parameters:");
    console.log(`  Recipient: ${recipient}`);
    console.log(`  Token: ${token}`);
    console.log(`  Amount: ${amount.toString()}`);
    console.log(`  Hashlock: ${hashlock}`);
    console.log(`  Timelock: ${timelock}`);
    console.log(`  SourceChain: ${sourceChain}`);
    console.log(`  TargetChain: ${targetChain}`);
    console.log(`  IsCrossChain: ${isCrossChain}`);
    console.log(`  OrderHash: "${orderHash}"`);

    // Create interface for the function
    const htlcInterface = new ethers.utils.Interface([
        "function createHTLCERC20(address recipient, address token, uint256 amount, bytes32 hashlock, uint256 timelock, uint8 sourceChain, uint8 targetChain, bool isCrossChain, string orderHash)"
    ]);

    // Encode the function call
    const encodedData = htlcInterface.encodeFunctionData("createHTLCERC20", [
        recipient,
        token,
        amount,
        hashlock,
        timelock,
        sourceChain,
        targetChain,
        isCrossChain,
        orderHash
    ]);

    console.log("\n✅ JavaScript Encoded Data:");
    console.log(`  ${encodedData}`);

    // Our Rust encoded data (from the logs - we'll need to check the latest logs)
    console.log("\n🔧 Rust Encoded Data (check latest logs):");
    console.log("  (Check the canister logs for the latest encoding)");

    // Decode JavaScript data to verify
    try {
        const jsDecoded = htlcInterface.parseTransaction({ data: encodedData });
        console.log("\n🔍 JavaScript Decoded:");
        console.log(`  Recipient: ${jsDecoded.args[0]}`);
        console.log(`  Token: ${jsDecoded.args[1]}`);
        console.log(`  Amount: ${jsDecoded.args[2].toString()}`);
        console.log(`  Hashlock: ${jsDecoded.args[3]}`);
        console.log(`  Timelock: ${jsDecoded.args[4].toString()}`);
        console.log(`  SourceChain: ${jsDecoded.args[5]}`);
        console.log(`  TargetChain: ${jsDecoded.args[6]}`);
        console.log(`  IsCrossChain: ${jsDecoded.args[7]}`);
        console.log(`  OrderHash: "${jsDecoded.args[8]}"`);
    } catch (error) {
        console.log("❌ Failed to decode JavaScript data:", error.message);
    }

    console.log("\n📏 Expected Length: 650 characters");
    console.log(`📏 Actual Length: ${encodedData.length} characters`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 