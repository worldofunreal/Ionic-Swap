#!/bin/bash

# 1inch API Communication Verification Script
# This script tests the 1inch API integration in the fusion_htlc_canister

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
CANISTER_NAME="fusion_htlc_canister"
TEST_MAKER_ADDRESS="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
TEST_ORDER_HASH="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

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

log_api() {
    echo -e "${CYAN}[1INCH API]${NC} $1"
}

# Function to execute dfx canister call and capture result
execute_call() {
    local method=$1
    local args=$2
    local description=$3
    
    log_api "Testing: $description"
    log_info "Command: dfx canister call $CANISTER_NAME $method '$args'"
    
    local result
    result=$(dfx canister call $CANISTER_NAME $method "$args" 2>&1)
    
    if [ $? -eq 0 ]; then
        log_success "✓ $description passed"
        echo "Response: $result"
        echo ""
        return 0
    else
        log_error "✗ $description failed"
        echo "Error: $result"
        echo ""
        return 1
    fi
}

# Function to check if dfx is running
check_dfx() {
    if ! dfx ping 2>/dev/null; then
        log_error "dfx is not running. Please start dfx first:"
        log_info "dfx start --clean --background"
        exit 1
    fi
}

# Function to check if canister is deployed
check_canister() {
    if ! dfx canister status $CANISTER_NAME 2>/dev/null; then
        log_error "Canister $CANISTER_NAME is not deployed. Please deploy first:"
        log_info "dfx deploy $CANISTER_NAME"
        exit 1
    fi
}

# Function to test basic connectivity
test_basic_connectivity() {
    log_info "Testing Basic Connectivity"
    log_info "========================="
    
    # Test greeting function
    execute_call "greet" "(\"1inch\")" "Basic canister connectivity test"
    
    # Test HTTP request capability
    execute_call "test_http_request" "()" "HTTP request capability test"
}

# Function to test 1inch API endpoints
test_1inch_endpoints() {
    log_info "Testing 1inch API Endpoints"
    log_info "============================"
    
    # Test 1: Basic 1inch API connectivity
    log_api "Test 1: Basic 1inch API Connectivity"
    log_info "------------------------------------"
    execute_call "test_1inch_api" "()" "Basic 1inch API connectivity (get_tokens for Ethereum)"
    
    # Test 2: Get active orders (basic)
    log_api "Test 2: Get Active Orders (Basic)"
    log_info "---------------------------------"
    execute_call "test_get_active_orders" "()" "Get first 10 active orders"
    
    # Test 3: Get tokens for Ethereum mainnet
    log_api "Test 3: Get Tokens for Ethereum"
    log_info "--------------------------------"
    execute_call "get_tokens" "(1)" "Get available tokens for Ethereum mainnet (chain_id=1)"
    
    # Test 4: Get tokens for Polygon
    log_api "Test 4: Get Tokens for Polygon"
    log_info "-------------------------------"
    execute_call "get_tokens" "(137)" "Get available tokens for Polygon (chain_id=137)"
    
    # Test 5: Get active orders with parameters
    log_api "Test 5: Get Active Orders with Parameters"
    log_info "----------------------------------------"
    execute_call "get_active_orders" "(opt 1, opt 5, opt 1, opt 137)" "Get 5 active orders from Ethereum to Polygon"
    
    # Test 6: Get orders by maker address
    log_api "Test 6: Get Orders by Maker Address"
    log_info "-----------------------------------"
    execute_call "get_orders_by_maker" "(\"$TEST_MAKER_ADDRESS\", opt 1, opt 5, opt 1, opt 137)" "Get orders by maker address"
    
    # Test 7: Get escrow factory address for Ethereum
    log_api "Test 7: Get Escrow Factory Address"
    log_info "----------------------------------"
    execute_call "get_escrow_factory_address" "(1)" "Get escrow factory address for Ethereum"
    
    # Test 8: Get escrow factory address for Polygon
    log_api "Test 8: Get Escrow Factory Address (Polygon)"
    log_info "--------------------------------------------"
    execute_call "get_escrow_factory_address" "(137)" "Get escrow factory address for Polygon"
}

# Function to test 1inch API with different chain combinations
test_chain_combinations() {
    log_info "Testing Different Chain Combinations"
    log_info "===================================="
    
    # Test Ethereum to Arbitrum
    log_api "Test: Ethereum to Arbitrum"
    log_info "--------------------------"
    execute_call "get_active_orders" "(opt 1, opt 3, opt 1, opt 42161)" "Get orders from Ethereum to Arbitrum"
    
    # Test Polygon to Ethereum
    log_api "Test: Polygon to Ethereum"
    log_info "-------------------------"
    execute_call "get_active_orders" "(opt 1, opt 3, opt 137, opt 1)" "Get orders from Polygon to Ethereum"
    
    # Test Base to Ethereum
    log_api "Test: Base to Ethereum"
    log_info "----------------------"
    execute_call "get_active_orders" "(opt 1, opt 3, opt 8453, opt 1)" "Get orders from Base to Ethereum"
    
    # Test Optimism to Ethereum
    log_api "Test: Optimism to Ethereum"
    log_info "-------------------------"
    execute_call "get_active_orders" "(opt 1, opt 3, opt 10, opt 1)" "Get orders from Optimism to Ethereum"
}

# Function to test order-specific endpoints
test_order_endpoints() {
    log_info "Testing Order-Specific Endpoints"
    log_info "================================="
    
    # Test get order secrets (with test order hash)
    log_api "Test: Get Order Secrets"
    log_info "-----------------------"
    execute_call "get_order_secrets" "(\"$TEST_ORDER_HASH\")" "Get secrets for test order"
    
    # Test parse order secrets for HTLC
    log_api "Test: Parse Order Secrets for HTLC"
    log_info "----------------------------------"
    execute_call "parse_order_secrets_for_htlc" "(\"$TEST_ORDER_HASH\")" "Parse order secrets for HTLC claim"
    
    # Test check if order is active
    log_api "Test: Check Order Active Status"
    log_info "-------------------------------"
    execute_call "is_order_active" "(\"$TEST_ORDER_HASH\")" "Check if test order is active"
}

# Function to test error handling
test_error_handling() {
    log_info "Testing Error Handling"
    log_info "======================"
    
    # Test invalid chain ID
    log_api "Test: Invalid Chain ID"
    log_info "----------------------"
    local result
    result=$(dfx canister call $CANISTER_NAME get_tokens "(999999)" 2>&1)
    if echo "$result" | grep -q "error\|Error\|failed\|Failed"; then
        log_success "✓ Invalid chain ID handled correctly"
        echo "Response: $result"
    else
        log_warning "⚠ Unexpected response for invalid chain ID: $result"
    fi
    echo ""
    
    # Test invalid maker address
    log_api "Test: Invalid Maker Address"
    log_info "---------------------------"
    result=$(dfx canister call $CANISTER_NAME get_orders_by_maker "(\"0xinvalid\", opt 1, opt 5, opt 1, opt 137)" 2>&1)
    if echo "$result" | grep -q "error\|Error\|failed\|Failed"; then
        log_success "✓ Invalid maker address handled correctly"
        echo "Response: $result"
    else
        log_warning "⚠ Unexpected response for invalid maker address: $result"
    fi
    echo ""
    
    # Test invalid order hash
    log_api "Test: Invalid Order Hash"
    log_info "------------------------"
    result=$(dfx canister call $CANISTER_NAME get_order_secrets "(\"0xinvalid\")" 2>&1)
    if echo "$result" | grep -q "error\|Error\|failed\|Failed"; then
        log_success "✓ Invalid order hash handled correctly"
        echo "Response: $result"
    else
        log_warning "⚠ Unexpected response for invalid order hash: $result"
    fi
    echo ""
}

# Function to test API key validation
test_api_key_validation() {
    log_info "Testing API Key Validation"
    log_info "=========================="
    
    # Note: The API key is hardcoded in the canister
    # We can test if the API key is working by checking responses
    log_api "API Key Status: CIIO5z3j5w1PvatqNxqunlzNE2hbHB6D"
    log_info "Testing if API key is valid..."
    
    # Test with a simple token request
    local result
    result=$(dfx canister call $CANISTER_NAME get_tokens "(1)" 2>&1)
    
    if echo "$result" | grep -q "error\|Error\|failed\|Failed\|unauthorized\|Unauthorized\|401\|403"; then
        log_error "✗ API key appears to be invalid or expired"
        echo "Response: $result"
    else
        log_success "✓ API key appears to be valid"
        echo "Response: $result"
    fi
    echo ""
}

# Function to test response parsing
test_response_parsing() {
    log_info "Testing Response Parsing"
    log_info "========================"
    
    # Test JSON parsing capability
    log_api "Test: JSON Response Parsing"
    log_info "---------------------------"
    local result
    result=$(dfx canister call $CANISTER_NAME get_tokens "(1)" 2>&1)
    
    if echo "$result" | grep -q "\\{.*\\}" || echo "$result" | grep -q "\\[.*\\]"; then
        log_success "✓ JSON response detected"
        echo "Response contains JSON structure"
    else
        log_warning "⚠ No JSON structure detected in response"
        echo "Response: $result"
    fi
    echo ""
}

# Function to test cycles consumption
test_cycles_consumption() {
    log_info "Testing Cycles Consumption"
    log_info "=========================="
    
    # Get initial cycles balance
    log_api "Test: Cycles Balance Check"
    log_info "--------------------------"
    local initial_balance
    initial_balance=$(dfx canister call $CANISTER_NAME get_cycles_balance 2>&1)
    log_info "Initial cycles balance: $initial_balance"
    
    # Make a few API calls
    log_info "Making test API calls..."
    dfx canister call $CANISTER_NAME get_tokens "(1)" >/dev/null 2>&1
    dfx canister call $CANISTER_NAME get_active_orders "(opt 1, opt 1, null, null)" >/dev/null 2>&1
    
    # Get final cycles balance
    local final_balance
    final_balance=$(dfx canister call $CANISTER_NAME get_cycles_balance 2>&1)
    log_info "Final cycles balance: $final_balance"
    
    log_success "✓ Cycles consumption test completed"
    echo ""
}

# Function to generate test report
generate_report() {
    log_info "Generating Test Report"
    log_info "======================"
    
    echo "1inch API Communication Test Report" > test_1inch_report.txt
    echo "===================================" >> test_1inch_report.txt
    echo "Date: $(date)" >> test_1inch_report.txt
    echo "Canister: $CANISTER_NAME" >> test_1inch_report.txt
    echo "" >> test_1inch_report.txt
    
    echo "Tested Endpoints:" >> test_1inch_report.txt
    echo "- get_tokens(chain_id)" >> test_1inch_report.txt
    echo "- get_active_orders(page, limit, src_chain, dst_chain)" >> test_1inch_report.txt
    echo "- get_orders_by_maker(maker_address, page, limit, src_chain_id, dst_chain_id)" >> test_1inch_report.txt
    echo "- get_order_secrets(order_hash)" >> test_1inch_report.txt
    echo "- get_escrow_factory_address(chain_id)" >> test_1inch_report.txt
    echo "" >> test_1inch_report.txt
    
    echo "Tested Chain IDs:" >> test_1inch_report.txt
    echo "- 1 (Ethereum Mainnet)" >> test_1inch_report.txt
    echo "- 137 (Polygon)" >> test_1inch_report.txt
    echo "- 42161 (Arbitrum)" >> test_1inch_report.txt
    echo "- 8453 (Base)" >> test_1inch_report.txt
    echo "- 10 (Optimism)" >> test_1inch_report.txt
    echo "" >> test_1inch_report.txt
    
    echo "API Key: CIIO5z3j5w1PvatqNxqunlzNE2hbHB6D" >> test_1inch_report.txt
    echo "" >> test_1inch_report.txt
    
    log_success "✓ Test report generated: test_1inch_report.txt"
}

# Main test execution
main() {
    log_info "1inch API Communication Verification"
    log_info "===================================="
    echo ""
    
    # Check prerequisites
    log_info "Checking prerequisites..."
    check_dfx
    check_canister
    log_success "✓ Prerequisites met"
    echo ""
    
    # Run all tests
    test_basic_connectivity
    test_1inch_endpoints
    test_chain_combinations
    test_order_endpoints
    test_error_handling
    test_api_key_validation
    test_response_parsing
    test_cycles_consumption
    
    # Generate report
    generate_report
    
    # Summary
    log_info "Test Summary"
    log_info "============"
    log_success "✓ 1inch API communication verification completed!"
    log_info ""
    log_info "Tested Features:"
    log_info "- Basic canister connectivity"
    log_info "- HTTP request capability"
    log_info "- 1inch API endpoints (tokens, orders, secrets, escrow)"
    log_info "- Multiple chain combinations"
    log_info "- Error handling"
    log_info "- API key validation"
    log_info "- Response parsing"
    log_info "- Cycles consumption"
    log_info ""
    log_info "Next Steps:"
    log_info "- Review test results for any errors"
    log_info "- Check test_1inch_report.txt for detailed report"
    log_info "- If API key is invalid, update it in main.mo"
    log_info "- If all tests pass, 1inch integration is working correctly"
    echo ""
}

# Run main function
main "$@"