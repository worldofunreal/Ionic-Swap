#!/bin/bash
# Token Distribution Script - Transfers 1M tokens to backend, alice, and bob

set -e

echo "🎯 Setting up token distribution..."

# Check if dfx is running
if ! dfx ping > /dev/null 2>&1; then
    echo "❌ dfx is not running. Please start dfx first with: dfx start --clean --background"
    exit 1
fi

# Create alice and bob identities if they don't exist
if ! dfx identity list | grep -q "alice"; then
    echo "📝 Creating alice identity..."
    dfx identity new alice --disable-encryption
fi

if ! dfx identity list | grep -q "bob"; then
    echo "📝 Creating bob identity..."
    dfx identity new bob --disable-encryption
fi

# Get principals
export ALICE_PRINCIPAL=$(dfx identity get-principal --identity alice)
export BOB_PRINCIPAL=$(dfx identity get-principal --identity bob)
export BACKEND_CANISTER_ID=$(dfx canister id backend)

echo "🔑 Principals:"
echo "   Alice: $ALICE_PRINCIPAL"
echo "   Bob: $BOB_PRINCIPAL"
echo "   Backend Canister: $BACKEND_CANISTER_ID"

# 1M tokens with 8 decimals (1000000 * 10^8)
AMOUNT=100000000000000

echo ""
echo "💰 Transferring 1M tokens to each recipient..."

# Switch to minter identity (which has all the tokens)
dfx identity use minter
export MINTER_PRINCIPAL=$(dfx identity get-principal)
echo "🔑 Using minter identity: $MINTER_PRINCIPAL"

echo ""
echo "🪙 Transferring Spiral tokens..."

# Transfer to Alice
echo "   → Alice: 1M SPIRAL"
dfx canister call spiral_token icrc1_transfer "(record {
    to = record { owner = principal \"$ALICE_PRINCIPAL\" };
    amount = $AMOUNT;
})"

# Transfer to Bob
echo "   → Bob: 1M SPIRAL"
dfx canister call spiral_token icrc1_transfer "(record {
    to = record { owner = principal \"$BOB_PRINCIPAL\" };
    amount = $AMOUNT;
})"

# Transfer to Backend canister
echo "   → Backend: 1M SPIRAL"
dfx canister call spiral_token icrc1_transfer "(record {
    to = record { owner = principal \"$BACKEND_CANISTER_ID\" };
    amount = $AMOUNT;
})"

echo ""
echo "✨ Transferring Stardust tokens..."

# Transfer to Alice
echo "   → Alice: 1M STD"
dfx canister call stardust_token icrc1_transfer "(record {
    to = record { owner = principal \"$ALICE_PRINCIPAL\" };
    amount = $AMOUNT;
})"

# Transfer to Bob
echo "   → Bob: 1M STD"
dfx canister call stardust_token icrc1_transfer "(record {
    to = record { owner = principal \"$BOB_PRINCIPAL\" };
    amount = $AMOUNT;
})"

# Transfer to Backend canister
echo "   → Backend: 1M STD"
dfx canister call stardust_token icrc1_transfer "(record {
    to = record { owner = principal \"$BACKEND_CANISTER_ID\" };
    amount = $AMOUNT;
})"

echo ""
echo "✅ Token distribution complete!"
echo ""
echo "📊 Final Balances:"
echo "   Alice SPIRAL: $(dfx canister call spiral_token icrc1_balance_of "(record {owner = principal \"$ALICE_PRINCIPAL\"})")"
echo "   Alice STD: $(dfx canister call stardust_token icrc1_balance_of "(record {owner = principal \"$ALICE_PRINCIPAL\"})")"
echo "   Bob SPIRAL: $(dfx canister call spiral_token icrc1_balance_of "(record {owner = principal \"$BOB_PRINCIPAL\"})")"
echo "   Bob STD: $(dfx canister call stardust_token icrc1_balance_of "(record {owner = principal \"$BOB_PRINCIPAL\"})")"
echo "   Backend SPIRAL: $(dfx canister call spiral_token icrc1_balance_of "(record {owner = principal \"$BACKEND_CANISTER_ID\"})")"
echo "   Backend STD: $(dfx canister call stardust_token icrc1_balance_of "(record {owner = principal \"$BACKEND_CANISTER_ID\"})")"
echo "   Minter SPIRAL: $(dfx canister call spiral_token icrc1_balance_of "(record {owner = principal \"$MINTER_PRINCIPAL\"})")"
echo "   Minter STD: $(dfx canister call stardust_token icrc1_balance_of "(record {owner = principal \"$MINTER_PRINCIPAL\"})")" 