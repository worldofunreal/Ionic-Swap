const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Verifying HTLC Encoding");
    console.log("===========================");

    // Parameters from our latest test
    const recipient = "0xf0d056015Bdd86C0EFD07000F75Ea10873A1d0A7";
    const token = "0xdE7409EDeA573D090c3C6123458D6242E26b425E";
    const amount = "100000000000"; // This should be the correct amount now
    const hashlock = "0x73f84511fa1337d1e9a6907b37f7a9d4ffdabe9eb53cdbee0a8df22c901a186a";
    const timelock = 1754091212;
    const sourceChain = 1;
    const targetChain = 0;
    const isCrossChain = true;
    const orderHash = ""; // empty string

    console.log("📋 Parameters:");
    console.log(`  Recipient: ${recipient}`);
    console.log(`  Token: ${token}`);
    console.log(`  Amount: ${amount}`);
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

    console.log("\n✅ Expected JavaScript Encoding:");
    console.log(`  ${encodedData}`);

    // Expected encoding from our comparison
    const expectedEncoding = "0xe69d84af000000000000000000000000f0d056015bdd86c0efd07000f75ea10873a1d0a7000000000000000000000000de7409edea573d090c3c6123458d6242e26b425e000000000000000000000000000000000000000000000000000000174876e80073f84511fa1337d1e9a6907b37f7a9d4ffdabe9eb53cdbee0a8df22c901a186a00000000000000000000000000000000000000000000000000000000688d4ecc000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000";

    console.log("\n🔧 Expected Encoding (from comparison):");
    console.log(`  ${expectedEncoding}`);

    // Compare
    console.log("\n📏 Comparison:");
    console.log(`  Generated length: ${encodedData.length} characters`);
    console.log(`  Expected length: ${expectedEncoding.length} characters`);
    console.log(`  Match: ${encodedData === expectedEncoding ? "✅ YES" : "❌ NO"}`);

    if (encodedData !== expectedEncoding) {
        console.log("\n🔍 Differences:");
        for (let i = 0; i < Math.min(encodedData.length, expectedEncoding.length); i++) {
            if (encodedData[i] !== expectedEncoding[i]) {
                console.log(`  Position ${i}: '${encodedData[i]}' vs '${expectedEncoding[i]}'`);
                break;
            }
        }
    }

    // Decode to verify parameters
    try {
        const decoded = htlcInterface.parseTransaction({ data: encodedData });
        console.log("\n🔍 Decoded Parameters:");
        console.log(`  Recipient: ${decoded.args[0]}`);
        console.log(`  Token: ${decoded.args[1]}`);
        console.log(`  Amount: ${decoded.args[2].toString()}`);
        console.log(`  Hashlock: ${decoded.args[3]}`);
        console.log(`  Timelock: ${decoded.args[4].toString()}`);
        console.log(`  SourceChain: ${decoded.args[5]}`);
        console.log(`  TargetChain: ${decoded.args[6]}`);
        console.log(`  IsCrossChain: ${decoded.args[7]}`);
        console.log(`  OrderHash: "${decoded.args[8]}"`);
    } catch (error) {
        console.log("❌ Failed to decode:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 