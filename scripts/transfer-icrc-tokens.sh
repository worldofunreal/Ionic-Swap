#!/bin/bash

# Transfer ICRC-1 tokens to current identity and backend canister
# This script demonstrates token transfers and ICRC-2 functionality

set -e

echo "🔄 Transferring ICRC-1 tokens..."

# Get current identity and backend canister ID
CURRENT_PRINCIPAL=$(dfx identity get-principal)
BACKEND_CANISTER=$(dfx canister id backend)
SPIRAL_CANISTER=$(dfx canister id spiral_token)
STARDUST_CANISTER=$(dfx canister id stardust_token)

echo "📋 Current Setup:"
echo "   Current Identity: $CURRENT_PRINCIPAL"
echo "   Backend Canister: $BACKEND_CANISTER"
echo "   Spiral Token: $SPIRAL_CANISTER"
echo "   Stardust Token: $STARDUST_CANISTER"

# Transfer Spiral tokens to current identity
echo ""
echo "🪙 Transferring 100,000 SPIRAL tokens to current identity..."
dfx canister call spiral_token icrc1_transfer "(record { 
    to = record { owner = principal \"$CURRENT_PRINCIPAL\" }; 
    amount = 100_000_000_000; 
})"

# Transfer Spiral tokens to backend canister
echo "🪙 Transferring 50,000 SPIRAL tokens to backend canister..."
dfx canister call spiral_token icrc1_transfer "(record { 
    to = record { owner = principal \"$BACKEND_CANISTER\" }; 
    amount = 50_000_000_000; 
})"

# Transfer Stardust tokens to current identity
echo "🪙 Transferring 200,000 STD tokens to current identity..."
dfx canister call stardust_token icrc1_transfer "(record { 
    to = record { owner = principal \"$CURRENT_PRINCIPAL\" }; 
    amount = 200_000_000_000; 
})"

# Transfer Stardust tokens to backend canister
echo "🪙 Transferring 75,000 STD tokens to backend canister..."
dfx canister call stardust_token icrc1_transfer "(record { 
    to = record { owner = principal \"$BACKEND_CANISTER\" }; 
    amount = 75_000_000_000; 
})"

echo ""
echo "✅ Token transfers completed!"
echo ""

# Check balances
echo "💰 Checking balances..."

echo "   Current Identity SPIRAL balance: $(dfx canister call spiral_token icrc1_balance_of "(record {owner = principal \"$CURRENT_PRINCIPAL\"})")"
echo "   Backend Canister SPIRAL balance: $(dfx canister call spiral_token icrc1_balance_of "(record {owner = principal \"$BACKEND_CANISTER\"})")"
echo "   Current Identity STD balance: $(dfx canister call stardust_token icrc1_balance_of "(record {owner = principal \"$CURRENT_PRINCIPAL\"})")"
echo "   Backend Canister STD balance: $(dfx canister call stardust_token icrc1_balance_of "(record {owner = principal \"$BACKEND_CANISTER\"})")"

echo ""
echo "🎉 Token transfers successful!"
echo "📝 You can now test cross-chain swaps with these tokens." 