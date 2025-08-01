const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Comparing HTLC Encoding");
    console.log("===========================");

    // Parameters from our successful JavaScript test
    const recipient = "0xf0d056015Bdd86C0EFD07000F75Ea10873A1d0A7";
    const token = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
    const amount = ethers.utils.parseUnits("1000", 8); // 1000 tokens
    const hashlock = "0xe239c33fbe9c1751eb2d65550e9139b3d9034c598c1cf29fdbeec0b6f93817f5";
    const timelock = 1754074015;
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

    // Our Rust encoded data (from the logs)
    const rustEncodedData = "0xe69d84af000000000000000000000000f0d056015Bdd86C0EFD07000F75Ea10873A1d0A7000000000000000000000000dE7409EDeA573D090c3C6123458D6242E26b425E00000000000000000000000000000000000000000000000000000001000000007a3a01024b5d68dd17b95ebee68dccfc1c900a8b9971cb6da728f0b6b75e45ae00000000000000000000000000000000000000000000000000000000688d0c53000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000006f726465725f31";

    console.log("\n🔧 Rust Encoded Data (from logs):");
    console.log(`  ${rustEncodedData}`);

    // Compare lengths
    console.log("\n📏 Comparison:");
    console.log(`  JavaScript length: ${encodedData.length} characters`);
    console.log(`  Rust length: ${rustEncodedData.length} characters`);
    console.log(`  Match: ${encodedData === rustEncodedData ? "✅ YES" : "❌ NO"}`);

    // Decode both to see the differences
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

    try {
        const rustDecoded = htlcInterface.parseTransaction({ data: rustEncodedData });
        console.log("\n🔍 Rust Decoded:");
        console.log(`  Recipient: ${rustDecoded.args[0]}`);
        console.log(`  Token: ${rustDecoded.args[1]}`);
        console.log(`  Amount: ${rustDecoded.args[2].toString()}`);
        console.log(`  Hashlock: ${rustDecoded.args[3]}`);
        console.log(`  Timelock: ${rustDecoded.args[4].toString()}`);
        console.log(`  SourceChain: ${rustDecoded.args[5]}`);
        console.log(`  TargetChain: ${rustDecoded.args[6]}`);
        console.log(`  IsCrossChain: ${rustDecoded.args[7]}`);
        console.log(`  OrderHash: "${rustDecoded.args[8]}"`);
    } catch (error) {
        console.log("❌ Failed to decode Rust data:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 