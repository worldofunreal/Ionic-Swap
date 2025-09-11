import { execSync } from 'child_process';
import { wallets as icpWallets } from './generate-icp-test-wallets';

// Token canister IDs
const SPIRAL_TOKEN = 'uzt4z-lp777-77774-qaabq-cai';
const STD_TOKEN = 'umunu-kh777-77774-qaaca-cai';

const fundIcpTestWallets = async () => {
  console.log('💰 Funding ICP Test Wallets with ICRC Tokens');
  console.log('============================================');
  
  // Use deterministic wallets
  const wallets = [icpWallets.alice, icpWallets.bob, icpWallets.charlie];
  
  // Check current identity (should be bizkit with tokens)
  console.log('\n📊 Checking Current Identity:');
  try {
    const currentIdentity = execSync('dfx identity whoami', { encoding: 'utf8' });
    console.log(`   Current Identity: ${currentIdentity.trim()}`);
  } catch (error) {
    console.log(`   Error getting current identity: ${error}`);
  }
  
  // Check bizkit's token balances
  console.log('\n📊 Checking Bizkit\'s Token Balances:');
  try {
    const bizkitPrincipal = execSync('dfx identity get-principal', { encoding: 'utf8' });
    console.log(`   Bizkit Principal: ${bizkitPrincipal.trim()}`);
    
    // Check SPIRAL balance
    const spiralBalance = execSync(`dfx canister call ${SPIRAL_TOKEN} icrc1_balance_of '(record { owner = principal "${bizkitPrincipal.trim()}"; subaccount = null })'`, { encoding: 'utf8' });
    console.log(`   SPIRAL Balance: ${spiralBalance.trim()}`);
    
    // Check STD balance
    const stdBalance = execSync(`dfx canister call ${STD_TOKEN} icrc1_balance_of '(record { owner = principal "${bizkitPrincipal.trim()}"; subaccount = null })'`, { encoding: 'utf8' });
    console.log(`   STD Balance: ${stdBalance.trim()}`);
  } catch (error) {
    console.log(`   Error checking balances: ${error}`);
  }
  
  // Fund each wallet
  for (const wallet of wallets) {
    console.log(`\n👤 Funding ${wallet.name.toUpperCase()}:`);
    console.log(`   Principal: ${wallet.principal}`);
    console.log(`   ⚠️  NO ICP - Testing true gasless permits!`);
    
    // 1. Fund with SPIRAL tokens
    try {
      console.log('   🪙 Setting up SPIRAL tokens...');
      const transferAmount = 1000000000000; // 1000 SPIRAL tokens (8 decimals)
      
      const spiralResult = execSync(`dfx canister call ${SPIRAL_TOKEN} icrc1_transfer '(record { 
        to = record { owner = principal "${wallet.principal}"; subaccount = null }; 
        amount = ${transferAmount}; 
        fee = null; 
        memo = null; 
        from_subaccount = null; 
        created_at_time = null 
      })'`, { encoding: 'utf8' });
      
      console.log(`   ✅ SPIRAL transferred: ${spiralResult.trim()}`);
    } catch (error) {
      console.log(`   ❌ SPIRAL setup failed: ${error}`);
    }
    
    // 2. Fund with STD tokens
    try {
      console.log('   ⭐ Setting up STD tokens...');
      const transferAmount = 1000000000000; // 1000 STD tokens (8 decimals)
      
      const stdResult = execSync(`dfx canister call ${STD_TOKEN} icrc1_transfer '(record { 
        to = record { owner = principal "${wallet.principal}"; subaccount = null }; 
        amount = ${transferAmount}; 
        fee = null; 
        memo = null; 
        from_subaccount = null; 
        created_at_time = null 
      })'`, { encoding: 'utf8' });
      
      console.log(`   ✅ STD transferred: ${stdResult.trim()}`);
    } catch (error) {
      console.log(`   ❌ STD setup failed: ${error}`);
    }
  }
  
  console.log('\n🎉 Funding Complete!');
  console.log('\n📋 Summary:');
  console.log('   Each wallet should now have:');
  console.log('   - 0 ICP (testing true gasless permits!)');
  console.log('   - 1000 SPIRAL tokens');
  console.log('   - 1000 STD tokens');
  console.log('\n💡 Next Steps:');
  console.log('   1. Verify token balances');
  console.log('   2. Call icrc2_approve to approve canister');
  console.log('   3. Call canister to execute gasless transactions');
  console.log('   4. Canister pays all gas fees!');
};

fundIcpTestWallets().catch(console.error);
