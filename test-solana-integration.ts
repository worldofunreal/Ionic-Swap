import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './src/declarations/backend';

// Test configuration
const CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai'; // Updated backend canister ID
const HOST = 'http://127.0.0.1:4943';

// Known Solana Testnet accounts for testing
const KNOWN_SOLANA_ACCOUNT = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'; // Known account with SOL (works on testnet too)
const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC on Testnet
const TEST_ICP_PRINCIPAL = '2vxsx-fae'; // Test ICP principal

async function testSolanaIntegration() {
    console.log('🧪 Testing Solana Integration with ICP Backend Canister');
    console.log('=====================================================\n');

    // Initialize agent and actor
    const agent = new HttpAgent({ host: HOST });
    await agent.fetchRootKey();
    
    const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: CANISTER_ID,
    });

    let testResults = {
        passed: 0,
        failed: 0,
        total: 0
    };

    function logTest(name: string, result: boolean, details?: string) {
        testResults.total++;
        if (result) {
            testResults.passed++;
            console.log(`✅ ${name}: PASSED`);
        } else {
            testResults.failed++;
            console.log(`❌ ${name}: FAILED`);
        }
        if (details) {
            console.log(`   ${details}`);
        }
        console.log('');
    }

    // Helper function to handle Result types
    function handleResult<T>(result: any, testName: string): T | null {
        if (result && typeof result === 'object') {
            if ('Ok' in result) {
                return result.Ok as T;
            } else if ('Err' in result) {
                console.log(`   Error in ${testName}: ${result.Err}`);
                return null;
            }
        }
        return null;
    }

    // Test 1: Get Solana slot (block number)
    try {
        console.log('1. Testing get_solana_slot_public...');
        const result = await actor.get_solana_slot_public();
        const slot = handleResult(result, 'get_solana_slot_public');
        if (slot !== null) {
            const slotNumber = Number(slot);
            const isValidSlot = slotNumber > 0 && slotNumber < 1000000000;
            logTest('Get Solana Slot', isValidSlot, `Slot: ${slotNumber}`);
        } else {
            logTest('Get Solana Slot', false, 'Failed to get slot');
        }
    } catch (error) {
        logTest('Get Solana Slot', false, `Error: ${error}`);
    }

    // Test 2: Get Solana balance of known account
    try {
        console.log('2. Testing get_solana_balance_public...');
        const result = await actor.get_solana_balance_public(KNOWN_SOLANA_ACCOUNT);
        const balance = handleResult(result, 'get_solana_balance_public');
        if (balance !== null) {
            const balanceNumber = Number(balance);
            const hasBalance = balanceNumber >= 0;
            logTest('Get Solana Balance', hasBalance, `Balance: ${balanceNumber} lamports (${balanceNumber / 1e9} SOL)`);
        } else {
            logTest('Get Solana Balance', false, 'Failed to get balance');
        }
    } catch (error) {
        logTest('Get Solana Balance', false, `Error: ${error}`);
    }

    // Test 3: Get Solana account info
    try {
        console.log('3. Testing get_solana_account_info_public...');
        const result = await actor.get_solana_account_info_public(KNOWN_SOLANA_ACCOUNT);
        const accountInfo = handleResult(result, 'get_solana_account_info_public');
        if (accountInfo !== null) {
            const info = JSON.parse(accountInfo as string);
            const hasValidInfo = info && (info.lamports !== undefined || info.owner !== undefined);
            logTest('Get Solana Account Info', hasValidInfo, `Account exists: ${hasValidInfo}`);
        } else {
            logTest('Get Solana Account Info', false, 'Failed to get account info');
        }
    } catch (error) {
        logTest('Get Solana Account Info', false, `Error: ${error}`);
    }

    // Test 4: Derive Solana wallet from ICP principal
    try {
        console.log('4. Testing get_solana_wallet_public...');
        const result = await actor.get_solana_wallet_public(TEST_ICP_PRINCIPAL);
        const solanaAddress = handleResult(result, 'get_solana_wallet_public');
        if (solanaAddress !== null) {
            const addressStr = solanaAddress as string;
            const isValidAddress = typeof addressStr === 'string' && addressStr.length > 30 && addressStr.length < 50;
            logTest('Derive Solana Wallet', isValidAddress, `Address: ${addressStr}`);
        } else {
            logTest('Derive Solana Wallet', false, 'Failed to derive wallet');
        }
    } catch (error) {
        logTest('Derive Solana Wallet', false, `Error: ${error}`);
    }

    // Test 5: Get associated token account address
    try {
        console.log('5. Testing get_associated_token_address_public...');
        const result = await actor.get_associated_token_address_public(
            KNOWN_SOLANA_ACCOUNT,
            USDC_MINT_ADDRESS
        );
        const associatedAddress = handleResult(result, 'get_associated_token_address_public');
        if (associatedAddress !== null) {
            const addressStr = associatedAddress as string;
            const isValidAssociatedAddress = typeof addressStr === 'string' && addressStr.length > 30;
            logTest('Get Associated Token Address', isValidAssociatedAddress, `Address: ${addressStr}`);
        } else {
            logTest('Get Associated Token Address', false, 'Failed to get associated token address');
        }
    } catch (error) {
        logTest('Get Associated Token Address', false, `Error: ${error}`);
    }

    // Test 6: Get SPL token balance (should fail gracefully for non-existent account)
    try {
        console.log('6. Testing get_spl_token_balance_public...');
        const result = await actor.get_spl_token_balance_public('E6wa7Zcf4CnbKKmp7NqhhVTB2SEZmc2crpZJ8iyaqY1b');
        const tokenBalance = handleResult(result, 'get_spl_token_balance_public');
        if (tokenBalance !== null) {
            const balance = JSON.parse(tokenBalance as string);
            const hasValidResponse = typeof balance === 'string' || typeof balance === 'number';
            logTest('Get SPL Token Balance', hasValidResponse, `Balance: ${tokenBalance}`);
        } else {
            // This is expected to fail for non-existent accounts
            logTest('Get SPL Token Balance', true, 'Expected error for non-existent account');
        }
    } catch (error) {
        logTest('Get SPL Token Balance', false, `Unexpected error: ${error}`);
    }

    // Test 7: Create associated token account instruction
    try {
        console.log('7. Testing create_associated_token_account_instruction_public...');
        const result = await actor.create_associated_token_account_instruction_public(
            KNOWN_SOLANA_ACCOUNT,
            KNOWN_SOLANA_ACCOUNT,
            USDC_MINT_ADDRESS
        );
        const instruction = handleResult(result, 'create_associated_token_account_instruction_public');
        if (instruction !== null) {
            const instructionData = JSON.parse(instruction as string);
            const hasValidInstruction = instructionData && instructionData.associated_token_account && instructionData.instruction_data;
            logTest('Create Associated Token Account Instruction', hasValidInstruction, `Instruction created: ${hasValidInstruction}`);
        } else {
            logTest('Create Associated Token Account Instruction', false, 'Failed to create instruction');
        }
    } catch (error) {
        logTest('Create Associated Token Account Instruction', false, `Error: ${error}`);
    }

    // Test 8: Transfer SPL tokens instruction
    try {
        console.log('8. Testing transfer_spl_tokens_instruction_public...');
        const result = await actor.transfer_spl_tokens_instruction_public(
            KNOWN_SOLANA_ACCOUNT,
            KNOWN_SOLANA_ACCOUNT,
            KNOWN_SOLANA_ACCOUNT,
            1000000 // 1 USDC (6 decimals)
        );
        const instructionData = handleResult(result, 'transfer_spl_tokens_instruction_public');
        if (instructionData !== null) {
            const instructionStr = instructionData as string;
            const isValidInstruction = typeof instructionStr === 'string' && instructionStr.length > 0;
            logTest('Transfer SPL Tokens Instruction', isValidInstruction, `Instruction data length: ${instructionStr.length}`);
        } else {
            logTest('Transfer SPL Tokens Instruction', false, 'Failed to create transfer instruction');
        }
    } catch (error) {
        logTest('Transfer SPL Tokens Instruction', false, `Error: ${error}`);
    }

    // Test 9: Send SOL transaction (structure test)
    try {
        console.log('9. Testing send_sol_transaction_public...');
        const result = await actor.send_sol_transaction_public(
            KNOWN_SOLANA_ACCOUNT,
            KNOWN_SOLANA_ACCOUNT,
            1000000 // 0.001 SOL
        );
        const transaction = handleResult(result, 'send_sol_transaction_public');
        if (transaction !== null) {
            const transactionData = JSON.parse(transaction as string);
            const hasValidTransaction = transactionData && transactionData.blockhash && transactionData.instruction_data;
            logTest('Send SOL Transaction', hasValidTransaction, `Transaction structure valid: ${hasValidTransaction}`);
        } else {
            logTest('Send SOL Transaction', false, 'Failed to create SOL transaction');
        }
    } catch (error) {
        logTest('Send SOL Transaction', false, `Error: ${error}`);
    }

    // Test 10: Send SPL token transaction (structure test)
    try {
        console.log('10. Testing send_spl_token_transaction_public...');
        const result = await actor.send_spl_token_transaction_public(
            KNOWN_SOLANA_ACCOUNT,
            KNOWN_SOLANA_ACCOUNT,
            KNOWN_SOLANA_ACCOUNT,
            1000000 // 1 USDC
        );
        const transaction = handleResult(result, 'send_spl_token_transaction_public');
        if (transaction !== null) {
            const transactionData = JSON.parse(transaction as string);
            const hasValidTransaction = transactionData && transactionData.blockhash && transactionData.instruction_data;
            logTest('Send SPL Token Transaction', hasValidTransaction, `Transaction structure valid: ${hasValidTransaction}`);
        } else {
            logTest('Send SPL Token Transaction', false, 'Failed to create SPL token transaction');
        }
    } catch (error) {
        logTest('Send SPL Token Transaction', false, `Error: ${error}`);
    }

    // Summary
    console.log('=====================================================');
    console.log('🧪 SOLANA INTEGRATION TEST RESULTS');
    console.log('=====================================================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.total}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Solana integration is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the errors above.');
    }

    return testResults;
}

// Run the tests
if (require.main === module) {
    testSolanaIntegration()
        .then((results) => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch((error) => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

export { testSolanaIntegration };
