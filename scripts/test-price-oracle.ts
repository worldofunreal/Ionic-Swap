import { execSync } from 'child_process';

const CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';

const testPriceOracle = async () => {
    console.log('🔄 Testing Price Oracle...\n');

    try {
        // Test 1: Manual price update
        console.log('📊 Test 1: Manual price update');
        const updateResult = execSync(`dfx canister call ${CANISTER_ID} update_prices`, { 
            encoding: 'utf8',
            cwd: '/home/bizkit/GitHub/Ionic-Swap'
        });
        console.log('Update result:', updateResult);
        console.log('✅ Manual price update completed\n');

        // Test 2: Get current prices
        console.log('💰 Test 2: Get current prices');
        const pricesResult = execSync(`dfx canister call ${CANISTER_ID} get_current_prices`, { 
            encoding: 'utf8',
            cwd: '/home/bizkit/GitHub/Ionic-Swap'
        });
        console.log('Current prices:', pricesResult);
        console.log('✅ Current prices retrieved\n');

        // Test 3: Get specific pair price (BTC)
        console.log('₿ Test 3: Get BTC price');
        const btcResult = execSync(`dfx canister call ${CANISTER_ID} get_pair_price '("BTC")'`, { 
            encoding: 'utf8',
            cwd: '/home/bizkit/GitHub/Ionic-Swap'
        });
        console.log('BTC price:', btcResult);
        console.log('✅ BTC price retrieved\n');

        // Test 4: Get ETH price
        console.log('Ξ Test 4: Get ETH price');
        const ethResult = execSync(`dfx canister call ${CANISTER_ID} get_pair_price '("ETH")'`, { 
            encoding: 'utf8',
            cwd: '/home/bizkit/GitHub/Ionic-Swap'
        });
        console.log('ETH price:', ethResult);
        console.log('✅ ETH price retrieved\n');

        // Test 5: Get SOL price
        console.log('◎ Test 5: Get SOL price');
        const solResult = execSync(`dfx canister call ${CANISTER_ID} get_pair_price '("SOL")'`, { 
            encoding: 'utf8',
            cwd: '/home/bizkit/GitHub/Ionic-Swap'
        });
        console.log('SOL price:', solResult);
        console.log('✅ SOL price retrieved\n');

        // Test 6: Get ICP price
        console.log('∞ Test 6: Get ICP price');
        const icpResult = execSync(`dfx canister call ${CANISTER_ID} get_pair_price '("ICP")'`, { 
            encoding: 'utf8',
            cwd: '/home/bizkit/GitHub/Ionic-Swap'
        });
        console.log('ICP price:', icpResult);
        console.log('✅ ICP price retrieved\n');

        console.log('🎉 All price oracle tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

testPriceOracle();
