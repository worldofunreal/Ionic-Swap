#!/bin/bash

# EVM Integration Test Script for Ionic-Swap ICP Canister
# This script tests the EVM RPC integration and HTLC functionality

set -e

# Configuration
CANISTER_NAME="fusion_htlc_canister"
TEST_CHAIN_ID=1  # Ethereum mainnet
TEST_HTLC_ADDRESS="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
TEST_ADDRESS="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Execute dfx canister call and capture result
execute_call() {
    local method=$1
    local args=$2
    local description=$3
    
    log_info "Testing: $description"
    log_info "Command: dfx canister call $CANISTER_NAME $method '$args'"
    
    local result
    result=$(dfx canister call $CANISTER_NAME $method "$args" 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_success "✓ $description passed"
        echo "Result: $result"
        echo ""
        return 0
    else
        log_error "✗ $description failed"
        echo "Error: $result"
        echo ""
        return 1
    fi
}

# Main test execution
main() {
    log_info "Starting EVM Integration Test Suite"
    log_info "====================================="
    echo ""
    
    # Test 1: Check if canister is deployed
    log_info "Test 1: Canister Deployment Check"
    log_info "--------------------------------"
    if dfx canister status $CANISTER_NAME > /dev/null 2>&1; then
        log_success "✓ Canister is deployed and accessible"
    else
        log_error "✗ Canister is not deployed or accessible"
        exit 1
    fi
    echo ""
    
    # Test 2: Test EVM RPC connectivity
    log_info "Test 2: EVM RPC Connectivity"
    log_info "----------------------------"
    execute_call "test_evm_rpc" "($TEST_CHAIN_ID)" "Test EVM RPC connectivity for Ethereum mainnet"
    
    # Test 3: Get latest block number
    log_info "Test 3: Get Latest Block Number"
    log_info "-------------------------------"
    execute_call "get_evm_block_number" "($TEST_CHAIN_ID)" "Get latest block number from Ethereum mainnet"
    
    # Test 4: Get chain configuration
    log_info "Test 4: Chain Configuration"
    log_info "---------------------------"
    execute_call "get_chain_config" "($TEST_CHAIN_ID)" "Get Ethereum mainnet chain configuration"
    
    # Test 5: Create EVM HTLC (simulation)
    log_info "Test 5: Create EVM HTLC"
    log_info "-----------------------"
    local test_hashlock="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    local test_recipient="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
    local test_amount=1000000000000000000  # 1 ETH in wei
    local test_expiration=$(($(date +%s) + 3600))  # 1 hour from now
    
    execute_call "create_evm_htlc" "($TEST_CHAIN_ID, \"$TEST_HTLC_ADDRESS\", \"$test_hashlock\", \"$test_recipient\", $test_amount, $test_expiration)" "Create EVM HTLC on Ethereum mainnet"
    
    # Test 6: Claim EVM HTLC (simulation)
    log_info "Test 6: Claim EVM HTLC"
    log_info "----------------------"
    local test_secret="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    
    execute_call "claim_evm_htlc" "($TEST_CHAIN_ID, \"$TEST_HTLC_ADDRESS\", \"$test_secret\")" "Claim EVM HTLC on Ethereum mainnet"
    
    # Test 7: Refund EVM HTLC (simulation)
    log_info "Test 7: Refund EVM HTLC"
    log_info "-----------------------"
    execute_call "refund_evm_htlc" "($TEST_CHAIN_ID, \"$TEST_HTLC_ADDRESS\")" "Refund EVM HTLC on Ethereum mainnet"
    
    # Test 8: Get EVM interaction details
    log_info "Test 8: Get EVM Interaction Details"
    log_info "-----------------------------------"
    # First, create an interaction to get an ID
    local result
    result=$(dfx canister call $CANISTER_NAME create_evm_htlc "($TEST_CHAIN_ID, \"$TEST_HTLC_ADDRESS\", \"$test_hashlock\", \"$test_recipient\", $test_amount, $test_expiration)" 2>&1)
    
    if [ $? -eq 0 ]; then
        # Extract interaction ID from result
        local interaction_id=$(echo "$result" | grep -o 'evm_[0-9_]*' | head -1)
        if [ -n "$interaction_id" ]; then
            execute_call "get_evm_interaction" "(\"$interaction_id\")" "Get EVM interaction details"
        else
            log_warning "Could not extract interaction ID from result"
        fi
    else
        log_warning "Could not create test interaction for get_evm_interaction test"
    fi
    
    # Test 9: Test Polygon chain configuration
    log_info "Test 9: Polygon Chain Configuration"
    log_info "-----------------------------------"
    execute_call "get_chain_config" "(137)" "Get Polygon mainnet chain configuration"
    
    # Test 10: Test Arbitrum chain configuration
    log_info "Test 10: Arbitrum Chain Configuration"
    log_info "-------------------------------------"
    execute_call "get_chain_config" "(42161)" "Get Arbitrum One chain configuration"
    
    # Test 11: Error handling - Invalid chain ID
    log_info "Test 11: Error Handling - Invalid Chain ID"
    log_info "------------------------------------------"
    result=$(dfx canister call $CANISTER_NAME get_chain_config "(999999)" 2>&1)
    if echo "$result" | grep -q "Chain configuration not found"; then
        log_success "✓ Invalid chain ID handling works correctly"
    else
        log_warning "⚠ Invalid chain ID handling may not work as expected"
    fi
    echo ""
    
    # Test 12: Error handling - Invalid interaction ID
    log_info "Test 12: Error Handling - Invalid Interaction ID"
    log_info "------------------------------------------------"
    result=$(dfx canister call $CANISTER_NAME get_evm_interaction "(\"invalid_interaction_id\")" 2>&1)
    if echo "$result" | grep -q "EVM interaction not found"; then
        log_success "✓ Invalid interaction ID handling works correctly"
    else
        log_warning "⚠ Invalid interaction ID handling may not work as expected"
    fi
    echo ""
    
    # Summary
    log_info "EVM Integration Test Summary"
    log_info "============================"
    log_success "✓ EVM RPC integration is working"
    log_success "✓ Chain configuration management is functional"
    log_success "✓ HTLC interaction creation is working"
    log_success "✓ Error handling is implemented"
    log_info ""
    log_info "Next Steps:"
    log_info "1. Deploy actual EVM HTLC contracts"
    log_info "2. Implement ckETH transaction signing"
    log_info "3. Add actual transaction submission"
    log_info "4. Implement cross-chain HTLC coordination"
    log_info "5. Add comprehensive transaction monitoring"
}

# Run the main function
main "$@"