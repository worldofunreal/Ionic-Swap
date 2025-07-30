#!/bin/bash

# Cross-Chain Orderbook Test Script
# This script tests the complete integration between the orderbook and token canisters

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ORDERBOOK_CANISTER="ucwa4-rx777-77774-qaada-cai"
TOKEN_CANISTER="ulvla-h7777-77774-qaacq-cai"
ALICE_PRINCIPAL="4sgyd-owy2w-hltyd-xupdz-sdcvu-njjdc-6tbtp-klj7a-po3va-gkk4g-zqe"
BIZKIT_PRINCIPAL="vam5o-bdiga-izgux-6cjaz-53tck-eezzo-fezki-t2sh6-xefok-dkdx7-pae"

# Test parameters
TEST_AMOUNT=50000000  # 0.5 tokens
TEST_APPROVAL_AMOUNT=100000000  # 1.0 tokens
TEST_HASHED_SECRET="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

echo -e "${BLUE}=== Cross-Chain Orderbook Integration Test ===${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if dfx is running
check_dfx() {
    print_status "Checking if dfx is running..."
    if ! dfx ping 2>/dev/null; then
        print_error "dfx is not running. Please start dfx with: dfx start --background"
        exit 1
    fi
    print_success "dfx is running"
}

# Function to get current identity
get_current_identity() {
    dfx identity get-principal
}

# Function to switch identity
switch_identity() {
    local identity=$1
    print_status "Switching to identity: $identity"
    dfx identity use "$identity"
    local current=$(get_current_identity)
    print_success "Current identity: $current"
}

# Function to check token balance
check_balance() {
    local principal=$1
    local identity=$2
    print_status "Checking balance for $identity ($principal)..."
    
    switch_identity "$identity"
    local balance=$(dfx canister call token icrc1_balance_of "(record { owner = principal \"$principal\"; subaccount = null })" | grep -o '[0-9_]\+' | head -1)
    echo -e "${GREEN}Balance: $balance tokens${NC}"
    echo $balance
}

# Function to mint tokens
mint_tokens() {
    local to_principal=$1
    local amount=$2
    local identity=$3
    
    print_status "Minting $amount tokens to $identity ($to_principal)..."
    switch_identity "$identity"
    
    local result=$(dfx canister call token mint "(record { to = record { owner = principal \"$to_principal\"; subaccount = null }; amount = $amount })")
    
    if echo "$result" | grep -q "Ok"; then
        print_success "Minted $amount tokens successfully"
    else
        print_error "Failed to mint tokens: $result"
        return 1
    fi
}

# Function to approve orderbook canister
approve_orderbook() {
    local amount=$1
    local identity=$2
    
    print_status "Approving orderbook canister to spend $amount tokens as $identity..."
    switch_identity "$identity"
    
    local result=$(dfx canister call token icrc2_approve "(record { spender = record { owner = principal \"$ORDERBOOK_CANISTER\"; subaccount = null }; amount = $amount })")
    
    if echo "$result" | grep -q "Ok"; then
        print_success "Approved $amount tokens for orderbook canister"
    else
        print_error "Failed to approve tokens: $result"
        return 1
    fi
}

# Function to check allowance
check_allowance() {
    local identity=$1
    
    print_status "Checking allowance for $identity..."
    switch_identity "$identity"
    
    local result=$(dfx canister call token icrc2_allowance "(record { account = record { owner = principal \"$ALICE_PRINCIPAL\"; subaccount = null }; spender = record { owner = principal \"$ORDERBOOK_CANISTER\"; subaccount = null } })")
    
    local allowance=$(echo "$result" | grep -o 'allowance = [0-9_]\+' | grep -o '[0-9_]\+')
    print_success "Allowance: $allowance tokens"
    echo $allowance
}

# Function to configure orderbook
configure_orderbook() {
    print_status "Configuring orderbook canister..."
    switch_identity "bizkit"
    
    local result=$(dfx canister call cross_chain_orderbook setTokenCanister "(principal \"$TOKEN_CANISTER\")")
    
    if echo "$result" | grep -q "ok"; then
        print_success "Orderbook canister configured"
    else
        print_error "Failed to configure orderbook: $result"
        return 1
    fi
}

# Function to verify orderbook configuration
verify_orderbook_config() {
    print_status "Verifying orderbook configuration..."
    
    local result=$(dfx canister call cross_chain_orderbook getTokenCanister)
    
    if echo "$result" | grep -q "$TOKEN_CANISTER"; then
        print_success "Orderbook configuration verified"
    else
        print_error "Orderbook configuration verification failed: $result"
        return 1
    fi
}

# Function to place order
place_order() {
    local token_sell=$1
    local amount_sell=$2
    local token_buy=$3
    local amount_buy=$4
    local hashed_secret=$5
    local identity=$6
    
    print_status "Placing order as $identity..."
    print_status "Selling: $amount_sell $token_sell"
    print_status "Buying: $amount_buy $token_buy"
    
    switch_identity "$identity"
    
    local result=$(dfx canister call cross_chain_orderbook placeIcpOrder "(\"$token_sell\", $amount_sell, \"$token_buy\", $amount_buy, \"$hashed_secret\")")
    
    if echo "$result" | grep -q "ok"; then
        local order_id=$(echo "$result" | grep -o 'order_[0-9]\+')
        print_success "Order placed successfully: $order_id"
        echo $order_id
    else
        print_error "Failed to place order: $result"
        return 1
    fi
}

# Function to get open orders
get_open_orders() {
    print_status "Getting open orders..."
    
    local result=$(dfx canister call cross_chain_orderbook getOpenOrders)
    
    local order_count=$(echo "$result" | grep -c "order_" || echo "0")
    print_success "Found $order_count open orders"
    
    echo "$result"
}

# Function to get user orders
get_user_orders() {
    local user_principal=$1
    local identity=$2
    
    print_status "Getting orders for $identity..."
    switch_identity "$identity"
    
    local result=$(dfx canister call cross_chain_orderbook getUserOrders "(principal \"$user_principal\")")
    
    local order_count=$(echo "$result" | grep -c "order_" || echo "0")
    print_success "Found $order_count orders for user"
    
    echo "$result"
}

# Function to test order cancellation
test_cancel_order() {
    local order_id=$1
    local identity=$2
    
    print_status "Testing order cancellation for $order_id as $identity..."
    switch_identity "$identity"
    
    local result=$(dfx canister call cross_chain_orderbook cancelOrder "(\"$order_id\")")
    
    if echo "$result" | grep -q "ok"; then
        print_success "Order cancelled successfully"
    else
        print_error "Failed to cancel order: $result"
        return 1
    fi
}

# Main test function
run_integration_test() {
    echo -e "${BLUE}=== Starting Integration Test ===${NC}"
    echo ""
    
    # Step 1: Check dfx
    check_dfx
    
    # Step 2: Configure orderbook
    configure_orderbook
    verify_orderbook_config
    
    # Step 3: Check initial balances
    print_status "Checking initial balances..."
    local alice_initial_balance=$(check_balance "$ALICE_PRINCIPAL" "alice")
    local orderbook_initial_balance=$(check_balance "$ORDERBOOK_CANISTER" "bizkit")
    
    # Step 4: Mint tokens to alice if needed
    if [ "$alice_initial_balance" -lt "$TEST_APPROVAL_AMOUNT" ]; then
        print_status "Alice needs more tokens, minting..."
        mint_tokens "$ALICE_PRINCIPAL" "$TEST_APPROVAL_AMOUNT" "bizkit"
        alice_initial_balance=$(check_balance "$ALICE_PRINCIPAL" "alice")
    fi
    
    # Step 5: Approve orderbook canister
    approve_orderbook "$TEST_APPROVAL_AMOUNT" "alice"
    
    # Step 6: Verify allowance
    local allowance=$(check_allowance "alice")
    if [ "$allowance" -lt "$TEST_AMOUNT" ]; then
        print_error "Insufficient allowance: $allowance < $TEST_AMOUNT"
        return 1
    fi
    
    # Step 7: Place order
    local order_id=$(place_order "SPIRAL" "$TEST_AMOUNT" "ETH" "500000000000000000" "$TEST_HASHED_SECRET" "alice")
    
    # Step 8: Verify order was created
    local open_orders=$(get_open_orders)
    if echo "$open_orders" | grep -q "$order_id"; then
        print_success "Order verified in open orders"
    else
        print_error "Order not found in open orders"
        return 1
    fi
    
    # Step 9: Check balance changes
    print_status "Checking balance changes..."
    local alice_final_balance=$(check_balance "$ALICE_PRINCIPAL" "alice")
    local orderbook_final_balance=$(check_balance "$ORDERBOOK_CANISTER" "bizkit")
    
    local alice_transferred=$((alice_initial_balance - alice_final_balance))
    local orderbook_received=$((orderbook_final_balance - orderbook_initial_balance))
    
    print_success "Alice transferred: $alice_transferred tokens"
    print_success "Orderbook received: $orderbook_received tokens"
    
    # Step 10: Get user orders
    get_user_orders "$ALICE_PRINCIPAL" "alice"
    
    echo ""
    echo -e "${GREEN}=== Integration Test Completed Successfully ===${NC}"
    echo -e "${GREEN}Order ID: $order_id${NC}"
    echo -e "${GREEN}Tokens Locked: $orderbook_received${NC}"
    echo ""
}

# Function to run cleanup test
run_cleanup_test() {
    echo -e "${BLUE}=== Running Cleanup Test ===${NC}"
    echo ""
    
    # Get open orders
    local open_orders=$(get_open_orders)
    local order_ids=$(echo "$open_orders" | grep -o 'order_[0-9]\+' || echo "")
    
    if [ -n "$order_ids" ]; then
        for order_id in $order_ids; do
            print_status "Cancelling order: $order_id"
            test_cancel_order "$order_id" "alice"
        done
    else
        print_status "No open orders to cancel"
    fi
    
    echo -e "${GREEN}=== Cleanup Test Completed ===${NC}"
    echo ""
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  test        Run the full integration test"
    echo "  cleanup     Run cleanup test (cancel all orders)"
    echo "  balance     Check balances for all identities"
    echo "  orders      Show all open orders"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 test      # Run full integration test"
    echo "  $0 cleanup   # Cancel all open orders"
    echo "  $0 balance   # Check all balances"
}

# Main script logic
case "${1:-test}" in
    "test")
        run_integration_test
        ;;
    "cleanup")
        run_cleanup_test
        ;;
    "balance")
        print_status "Checking balances for all identities..."
        echo ""
        check_balance "$ALICE_PRINCIPAL" "alice"
        echo ""
        check_balance "$ORDERBOOK_CANISTER" "bizkit"
        echo ""
        check_balance "$BIZKIT_PRINCIPAL" "bizkit"
        ;;
    "orders")
        get_open_orders
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac 