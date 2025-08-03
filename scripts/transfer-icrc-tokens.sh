#!/bin/bash
# ICRC Token Transfer Script - Handles both identity names and principals

set -e

echo "🔹 Available identities:"
dfx identity list
echo ""

read -p "Enter destination (identity name or principal): " DEST_INPUT

# Check if input is an identity name
if dfx identity use "$DEST_INPUT" >/dev/null 2>&1; then
    DEST_PRINCIPAL=$(dfx identity get-principal --identity "$DEST_INPUT")
    echo "🔑 Using identity '$DEST_INPUT' (principal: $DEST_PRINCIPAL)"
else
    DEST_PRINCIPAL="$DEST_INPUT"
    echo "🔑 Using principal directly"
fi

# 100k tokens with 8 decimals (100000 * 10^8)
AMOUNT=10000000000000

echo ""
echo "🔥 Transferring to $DEST_PRINCIPAL..."
echo ""

# Spiral Transfer
echo "🪙 Sending 100k Spiral..."
dfx canister call spiral_token icrc1_transfer "(record {
    to = record { owner = principal \"$DEST_PRINCIPAL\" };
    amount = $AMOUNT;
})"

# Stardust Transfer
echo "✨ Sending 100k Stardust..."
dfx canister call stardust_token icrc1_transfer "(record {
    to = record { owner = principal \"$DEST_PRINCIPAL\" };
    amount = $AMOUNT;
})"

echo ""
echo "✅ Transfers complete"
echo "💰 Balances:"
echo "   Spiral: $(dfx canister call spiral_token icrc1_balance_of "(record {owner = principal \"$DEST_PRINCIPAL\"})")"
echo "   Stardust: $(dfx canister call stardust_token icrc1_balance_of "(record {owner = principal \"$DEST_PRINCIPAL\"})")"