const ethers = require('ethers');

// Function signature: executePermitAndTransfer(address,address,address,uint256,uint256,uint8,bytes32,bytes32)
const functionSignature = "executePermitAndTransfer(address,address,address,uint256,uint256,uint8,bytes32,bytes32)";

// Calculate the function selector (first 4 bytes of keccak256 hash)
const functionSelector = ethers.utils.id(functionSignature).slice(0, 10);

console.log('Function signature:', functionSignature);
console.log('Function selector:', functionSelector); 