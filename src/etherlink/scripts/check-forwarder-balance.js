const { ethers } = require('hardhat');

async function main() {
  console.log('💰 Checking MinimalForwarder Balance...\n');

  // Contract addresses
  const MINIMAL_FORWARDER = "0x7705a3dBd0F1B0c8e1D4a7b24539195aEB42A0AC";

  // Get provider
  const provider = ethers.provider;

  // Check MinimalForwarder balance
  const forwarderBalance = await provider.getBalance(MINIMAL_FORWARDER);
  console.log('MinimalForwarder ETH balance:', ethers.utils.formatEther(forwarderBalance), 'ETH');

  // Get MinimalForwarder contract
  const forwarder = await ethers.getContractAt('MinimalForwarder', MINIMAL_FORWARDER);
  
  // Check deployer
  const deployer = await forwarder.deployer();
  console.log('MinimalForwarder deployer:', deployer);

  // Check if we can fund the forwarder
  const [signer] = await ethers.getSigners();
  const signerBalance = await provider.getBalance(signer.address);
  console.log('Signer balance:', ethers.utils.formatEther(signerBalance), 'ETH');

  if (forwarderBalance.eq(0)) {
    console.log('\n⚠️  MinimalForwarder has no funds!');
    console.log('To make it truly gasless, we need to fund the MinimalForwarder.');
    
    // Fund the forwarder with some ETH
    const fundAmount = ethers.utils.parseEther("0.1"); // 0.1 ETH
    if (signerBalance.gt(fundAmount)) {
      console.log(`\n💰 Funding MinimalForwarder with ${ethers.utils.formatEther(fundAmount)} ETH...`);
      
      const tx = await signer.sendTransaction({
        to: MINIMAL_FORWARDER,
        value: fundAmount
      });
      
      await tx.wait();
      console.log('✅ MinimalForwarder funded!');
      
      const newBalance = await provider.getBalance(MINIMAL_FORWARDER);
      console.log('New balance:', ethers.utils.formatEther(newBalance), 'ETH');
    } else {
      console.log('❌ Signer has insufficient funds to pay for gas');
    }
  } else {
    console.log('✅ MinimalForwarder has funds for gas payments');
  }

  console.log('\n📝 Analysis:');
  console.log('The MinimalForwarder contract is designed to pay for gas, but someone needs to:');
  console.log('1. Call the execute() function (which costs gas)');
  console.log('2. Have the MinimalForwarder contract pay for the actual transaction gas');
  console.log('');
  console.log('For true gasless transactions, we need:');
  console.log('- MinimalForwarder to have ETH balance');
  console.log('- Someone (not the user) to call execute() and pay the gas for that call');
  console.log('- The user only signs the message (no gas cost)');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }); 