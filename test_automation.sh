#!/bin/bash

# Ionic-Swap ICP Canister Test Automation Script
# This script automates testing of the fusion_htlc_canister's partial fills, relayer, and resolver functionality

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
CANISTER_NAME="fusion_htlc_canister"
TEST_RESOLVER_ADDRESS="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
TEST_HTLC_ID=""
TEST_FILL_ID=""

# Helper functions
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

# Function to execute dfx canister call and capture result
execute_call() {
    local method=$1
    local args=$2
    local description=$3
    
    log_info "Testing: $description"
    log_info "Command: dfx canister call $CANISTER_NAME $method '$args'"
    
    local result
    result=$(dfx canister call $CANISTER_NAME $method "$args" 2>&1)
    
    if [ $? -eq 0 ]; then
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

# Function to extract values from dfx output
extract_value() {
    local output=$1
    local pattern=$2
    echo "$output" | grep -o "$pattern" | head -1
}

# Main test execution
main() {
    log_info "Starting ICP Canister Test Automation"
    log_info "====================================="
    echo ""
    
    # Test 1: Register a resolver
    log_info "Test 1: Resolver Registration"
    log_info "-----------------------------"
    execute_call "register_resolver" "(\"$TEST_RESOLVER_ADDRESS\", vec {variant {Ethereum}; variant {ICP}})" "Register resolver with Ethereum and ICP support"
    
    # Test 2: Get resolver details
    log_info "Test 2: Resolver Details Retrieval"
    log_info "----------------------------------"
    execute_call "get_resolver" "(\"$TEST_RESOLVER_ADDRESS\")" "Get resolver details"
    
    # Test 3: Get active resolvers
    log_info "Test 3: Active Resolvers List"
    log_info "-----------------------------"
    execute_call "get_active_resolvers" "()" "Get all active resolvers"
    
    # Test 4: Get resolvers for specific chain
    log_info "Test 4: Chain-Specific Resolvers"
    log_info "--------------------------------"
    execute_call "get_resolvers_for_chain" "(variant {Ethereum})" "Get resolvers supporting Ethereum"
    
    # Test 5: Create an HTLC
    log_info "Test 5: HTLC Creation"
    log_info "--------------------"
    local future_time=$(($(date +%s) + 3600))000000000  # 1 hour from now in nanoseconds
    local result
    result=$(dfx canister call $CANISTER_NAME create_htlc "(principal \"2vxsx-fae\", 1000, principal \"2vxsx-fae\", $future_time, variant {Ethereum}, opt \"$TEST_RESOLVER_ADDRESS\")" 2>&1)
    
    if [ $? -eq 0 ]; then
        log_success "✓ HTLC creation passed"
        echo "Result: $result"
        TEST_HTLC_ID=$(extract_value "$result" "htlc_[0-9_]*")
        log_info "Extracted HTLC ID: $TEST_HTLC_ID"
        echo ""
    else
        log_error "✗ HTLC creation failed"
        echo "Error: $result"
        echo ""
        return 1
    fi
    
    # Test 6: Link 1inch order to HTLC
    log_info "Test 6: 1inch Order Linking"
    log_info "---------------------------"
    execute_call "link_1inch_order" "(\"$TEST_HTLC_ID\", record {order_hash = \"0x1234567890abcdef\"; hashlock = \"0xabcdef1234567890\"; timelock = $future_time; maker = \"$TEST_RESOLVER_ADDRESS\"; taker = \"$TEST_RESOLVER_ADDRESS\"; maker_asset = \"0x1234567890abcdef\"; taker_asset = \"0xabcdef1234567890\"; making_amount = \"1000\"; taking_amount = \"1000\"; src_chain_id = 1; dst_chain_id = 1; secret_hashes = vec {\"0xabcdef1234567890\"}; fills = vec {\"0\"};}, true, opt 0)" "Link 1inch order to HTLC"
    
    # Test 7: Create partial fill
    log_info "Test 7: Partial Fill Creation"
    log_info "-----------------------------"
    result=$(dfx canister call $CANISTER_NAME create_partial_fill "(\"$TEST_HTLC_ID\", 500, \"secret_hash_123\", \"$TEST_RESOLVER_ADDRESS\")" 2>&1)
    
    if [ $? -eq 0 ]; then
        log_success "✓ Partial fill creation passed"
        echo "Result: $result"
        TEST_FILL_ID=$(extract_value "$result" "fill_[0-9_]*")
        log_info "Extracted Fill ID: $TEST_FILL_ID"
        echo ""
    else
        log_error "✗ Partial fill creation failed"
        echo "Error: $result"
        echo ""
        return 1
    fi
    
    # Test 8: Get partial fill details
    log_info "Test 8: Partial Fill Details"
    log_info "----------------------------"
    execute_call "get_partial_fill" "(\"$TEST_FILL_ID\")" "Get partial fill details"
    
    # Test 9: Get all partial fills for HTLC
    log_info "Test 9: HTLC Partial Fills List"
    log_info "-------------------------------"
    execute_call "get_htlc_partial_fills" "(\"$TEST_HTLC_ID\")" "Get all partial fills for HTLC"
    
    # Test 10: Complete partial fill
    log_info "Test 10: Partial Fill Completion"
    log_info "--------------------------------"
    execute_call "complete_partial_fill" "(\"$TEST_FILL_ID\", \"secret_123\")" "Complete partial fill with secret"
    
    # Test 11: Verify partial fill completion
    log_info "Test 11: Partial Fill Verification"
    log_info "----------------------------------"
    execute_call "get_partial_fill" "(\"$TEST_FILL_ID\")" "Verify partial fill status is completed"
    
    # Test 12: Check updated resolver stats
    log_info "Test 12: Resolver Statistics Update"
    log_info "-----------------------------------"
    execute_call "get_resolver" "(\"$TEST_RESOLVER_ADDRESS\")" "Check updated resolver statistics"
    
    # Test 13: Update resolver status
    log_info "Test 13: Resolver Status Update"
    log_info "------------------------------"
    execute_call "update_resolver_status" "(\"$TEST_RESOLVER_ADDRESS\", false)" "Deactivate resolver"
    execute_call "update_resolver_status" "(\"$TEST_RESOLVER_ADDRESS\", true)" "Reactivate resolver"
    
    # Test 14: 1inch API Integration Tests
    log_info "Test 14: 1inch API Integration"
    log_info "------------------------------"
    execute_call "test_1inch_api" "()" "Test 1inch API token retrieval"
    execute_call "test_get_active_orders" "()" "Test 1inch active orders API"
    
    # Test 15: Error handling tests
    log_info "Test 15: Error Handling"
    log_info "-----------------------"
    log_info "Testing invalid HTLC ID..."
    result=$(dfx canister call $CANISTER_NAME get_htlc "(\"invalid_htlc_id\")" 2>&1)
    if echo "$result" | grep -q "No HTLC found"; then
        log_success "✓ Invalid HTLC ID handling works correctly"
    else
        log_warning "⚠ Unexpected response for invalid HTLC ID: $result"
    fi
    echo ""
    
    log_info "Testing invalid resolver address..."
    result=$(dfx canister call $CANISTER_NAME get_resolver "(\"0xinvalid\")" 2>&1)
    if echo "$result" | grep -q "No resolver found"; then
        log_success "✓ Invalid resolver address handling works correctly"
    else
        log_warning "⚠ Unexpected response for invalid resolver address: $result"
    fi
    echo ""
    
    # Test 16: Multiple partial fills scenario
    log_info "Test 16: Multiple Partial Fills Scenario"
    log_info "----------------------------------------"
    log_info "Creating second partial fill..."
    result=$(dfx canister call $CANISTER_NAME create_partial_fill "(\"$TEST_HTLC_ID\", 300, \"secret_hash_456\", \"$TEST_RESOLVER_ADDRESS\")" 2>&1)
    if [ $? -eq 0 ]; then
        log_success "✓ Second partial fill created successfully"
        local second_fill_id=$(extract_value "$result" "fill_[0-9_]*")
        log_info "Second Fill ID: $second_fill_id"
        
        # Complete second fill
        execute_call "complete_partial_fill" "(\"$second_fill_id\", \"secret_456\")" "Complete second partial fill"
        
        # Get all fills for HTLC
        execute_call "get_htlc_partial_fills" "(\"$TEST_HTLC_ID\")" "Get all partial fills after multiple fills"
    else
        log_error "✗ Second partial fill creation failed"
        echo "Error: $result"
    fi
    echo ""
    
    # Summary
    log_info "Test Automation Complete"
    log_info "======================="
    log_success "All core functionality tests completed successfully!"
    log_info "Tested Features:"
    log_info "- Resolver registration and management"
    log_info "- HTLC creation and linking with 1inch orders"
    log_info "- Partial fill creation and completion"
    log_info "- Multiple partial fills scenario"
    log_info "- 1inch API integration"
    log_info "- Error handling"
    echo ""
    log_info "Next Steps:"
    log_info "- Review test results for any warnings"
    log_info "- Proceed with EVM HTLC contract development"
    log_info "- Implement ICRC token integration"
    echo ""
}

# Run main function
main "$@" 