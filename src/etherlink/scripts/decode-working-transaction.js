const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Decoding Working JavaScript Transaction");
    console.log("==========================================");

    // The working transaction hash from JavaScript test
    const workingTxHash = "0x18725d34d439ca4f48a3f97c4733d61966ceaca14386f20dbfdd6b49cc5b1bb7";
    
    // Get the transaction data from the blockchain
    const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/70b7e4d32357459a9af10d6503eae303');
    const tx = await provider.getTransaction(workingTxHash);
    
    console.log(`📋 Working Transaction:`);
    console.log(`  Hash: ${workingTxHash}`);
    console.log(`  Data: ${tx.data}`);
    console.log(`  Data Length: ${tx.data.length} characters`);
    
    // Decode the transaction data
    const htlcInterface = new ethers.utils.Interface([
        "function createHTLCERC20(address recipient, address token, uint256 amount, bytes32 hashlock, uint256 timelock, uint8 sourceChain, uint8 targetChain, bool isCrossChain, string orderHash, address owner)"
    ]);
    
    try {
        const decoded = htlcInterface.parseTransaction({ data: tx.data });
        console.log(`\n✅ Decoded Successfully:`);
        console.log(`  Function: ${decoded.name}`);
        console.log(`  Recipient: ${decoded.args[0]}`);
        console.log(`  Token: ${decoded.args[1]}`);
        console.log(`  Amount: ${decoded.args[2].toString()}`);
        console.log(`  Hashlock: ${decoded.args[3]}`);
        console.log(`  Timelock: ${decoded.args[4].toString()}`);
        console.log(`  SourceChain: ${decoded.args[5]}`);
        console.log(`  TargetChain: ${decoded.args[6]}`);
        console.log(`  IsCrossChain: ${decoded.args[7]}`);
        console.log(`  OrderHash: "${decoded.args[8]}"`);
        console.log(`  Owner: ${decoded.args[9]}`);
        
        // Re-encode to verify
        const reEncoded = htlcInterface.encodeFunctionData("createHTLCERC20", decoded.args);
        console.log(`\n🔧 Re-encoded Data:`);
        console.log(`  ${reEncoded}`);
        console.log(`  Matches Original: ${reEncoded === tx.data}`);
        
        // Show the exact structure
        console.log(`\n📊 Transaction Structure:`);
        console.log(`  Function Selector: ${tx.data.substring(0, 10)}`);
        console.log(`  Recipient (32 bytes): ${tx.data.substring(10, 74)}`);
        console.log(`  Token (32 bytes): ${tx.data.substring(74, 138)}`);
        console.log(`  Amount (32 bytes): ${tx.data.substring(138, 202)}`);
        console.log(`  Hashlock (32 bytes): ${tx.data.substring(202, 266)}`);
        console.log(`  Timelock (32 bytes): ${tx.data.substring(266, 330)}`);
        console.log(`  SourceChain (32 bytes): ${tx.data.substring(330, 394)}`);
        console.log(`  TargetChain (32 bytes): ${tx.data.substring(394, 458)}`);
        console.log(`  IsCrossChain (32 bytes): ${tx.data.substring(458, 522)}`);
        console.log(`  OrderHash Offset (32 bytes): ${tx.data.substring(522, 586)}`);
        console.log(`  Owner (32 bytes): ${tx.data.substring(586, 650)}`);
        console.log(`  OrderHash Length (32 bytes): ${tx.data.substring(650, 714)}`);
        console.log(`  OrderHash Data: ${tx.data.substring(714)}`);
        
        // Calculate the actual offset
        const orderHashOffset = parseInt(tx.data.substring(522, 586), 16);
        console.log(`\n🔍 Dynamic String Analysis:`);
        console.log(`  OrderHash Offset: ${orderHashOffset} (0x${orderHashOffset.toString(16)})`);
        console.log(`  Expected Offset: 320 (0x140) for 10 parameters`);
        console.log(`  Actual Offset: ${orderHashOffset} (0x${orderHashOffset.toString(16)})`);
        console.log(`  Difference: ${orderHashOffset - 320}`);
        
    } catch (error) {
        console.log(`❌ Failed to decode: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 