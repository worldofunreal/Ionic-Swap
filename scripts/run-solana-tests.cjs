#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Test configuration
const TESTS = [
    {
        name: "Solana HTLC Tests",
        file: "test-solana-htlc.cjs",
        description: "Tests Solana HTLC creation, claiming, refunding, and RPC functionality"
    },
    {
        name: "Solana Cross-Chain Tests",
        file: "test-solana-to-evm.cjs",
        description: "Tests all Solana cross-chain swap directions (Solana ↔ EVM, Solana ↔ ICP)"
    },
    {
        name: "Order Pairing Tests",
        file: "test-order-pairing.cjs",
        description: "Tests automatic order pairing and compatibility checking"
    }
];

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
    log(`\n${'='.repeat(60)}`, colors.cyan);
    log(`  ${message}`, colors.bright);
    log(`${'='.repeat(60)}`, colors.cyan);
}

function logTestStart(test) {
    log(`\n🧪 ${test.name}`, colors.yellow);
    log(`📝 ${test.description}`, colors.blue);
    log(`📁 Running: ${test.file}`, colors.blue);
}

function logTestResult(test, success, output) {
    if (success) {
        log(`✅ ${test.name} - PASSED`, colors.green);
    } else {
        log(`❌ ${test.name} - FAILED`, colors.red);
        if (output) {
            log(`📋 Output:`, colors.red);
            console.log(output);
        }
    }
}

// Check if dfx is running
function checkDfxRunning() {
    try {
        execSync('dfx ping', { stdio: 'pipe' });
        return true;
    } catch (error) {
        return false;
    }
}

// Check if backend canister is deployed
async function checkCanisterDeployed() {
    try {
        const { execSync } = require('child_process');
        const result = execSync('dfx canister id backend', { stdio: 'pipe' });
        return result.toString().trim();
    } catch (error) {
        return null;
    }
}

// Run a single test
function runTest(test) {
    const testPath = path.join(__dirname, test.file);
    
    try {
        logTestStart(test);
        
        // Run the test
        const output = execSync(`node "${testPath}"`, { 
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 60000 // 60 second timeout
        });
        
        logTestResult(test, true, output);
        return { success: true, output };
        
    } catch (error) {
        logTestResult(test, false, error.stdout || error.stderr || error.message);
        return { success: false, error: error.message, output: error.stdout || error.stderr };
    }
}

// Run all tests
async function runAllTests() {
    logHeader("SOLANA CROSS-CHAIN TEST SUITE");
    
    // Check prerequisites
    log("\n🔍 Checking prerequisites...", colors.blue);
    
    if (!checkDfxRunning()) {
        log("❌ dfx is not running. Please start dfx with: dfx start", colors.red);
        process.exit(1);
    }
    log("✅ dfx is running", colors.green);
    
    const canisterId = await checkCanisterDeployed();
    if (!canisterId) {
        log("❌ Backend canister is not deployed. Please deploy with: dfx deploy backend", colors.red);
        process.exit(1);
    }
    log(`✅ Backend canister is deployed: ${canisterId}`, colors.green);
    
    // Run tests
    logHeader("RUNNING TESTS");
    
    const results = [];
    let passed = 0;
    let failed = 0;
    
    for (const test of TESTS) {
        const result = runTest(test);
        results.push({ test, result });
        
        if (result.success) {
            passed++;
        } else {
            failed++;
        }
        
        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    logHeader("TEST SUMMARY");
    
    log(`\n📊 Results:`, colors.bright);
    log(`  ✅ Passed: ${passed}`, colors.green);
    log(`  ❌ Failed: ${failed}`, colors.red);
    log(`  📈 Total: ${TESTS.length}`, colors.blue);
    
    if (failed > 0) {
        log(`\n❌ Failed Tests:`, colors.red);
        results
            .filter(r => !r.result.success)
            .forEach(r => {
                log(`  • ${r.test.name}`, colors.red);
                log(`    Error: ${r.result.error}`, colors.red);
            });
    }
    
    if (passed === TESTS.length) {
        log(`\n🎉 All tests passed! Solana cross-chain functionality is working correctly.`, colors.green);
    } else {
        log(`\n⚠️ Some tests failed. Please check the output above for details.`, colors.yellow);
    }
    
    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    logHeader("SOLANA CROSS-CHAIN TEST SUITE");
    log("\n📋 Usage:", colors.bright);
    log("  node run-solana-tests.cjs [options]", colors.blue);
    log("\n🔧 Options:", colors.bright);
    log("  --help, -h     Show this help message", colors.blue);
    log("  --list, -l     List available tests", colors.blue);
    log("  --test <name>  Run a specific test", colors.blue);
    log("\n📝 Available Tests:", colors.bright);
    TESTS.forEach(test => {
        log(`  • ${test.name}`, colors.blue);
        log(`    ${test.description}`, colors.blue);
    });
    process.exit(0);
}

if (args.includes('--list') || args.includes('-l')) {
    logHeader("AVAILABLE TESTS");
    TESTS.forEach((test, index) => {
        log(`\n${index + 1}. ${test.name}`, colors.yellow);
        log(`   📁 File: ${test.file}`, colors.blue);
        log(`   📝 Description: ${test.description}`, colors.blue);
    });
    process.exit(0);
}

if (args.includes('--test')) {
    const testIndex = args.indexOf('--test');
    const testName = args[testIndex + 1];
    
    if (!testName) {
        log("❌ Please specify a test name after --test", colors.red);
        process.exit(1);
    }
    
    const test = TESTS.find(t => t.name.toLowerCase().includes(testName.toLowerCase()));
    if (!test) {
        log(`❌ Test not found: ${testName}`, colors.red);
        log("📋 Available tests:", colors.blue);
        TESTS.forEach(t => log(`  • ${t.name}`, colors.blue));
        process.exit(1);
    }
    
    logHeader(`RUNNING SINGLE TEST: ${test.name}`);
    const result = runTest(test);
    process.exit(result.success ? 0 : 1);
}

// Run all tests by default
runAllTests().catch(error => {
    log(`\n❌ Test runner failed: ${error.message}`, colors.red);
    process.exit(1);
});
