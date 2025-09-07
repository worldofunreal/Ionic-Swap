#!/bin/bash

# Test accounts
ALICE="8Tfg3vjV5Huk1YKpZ1FKCF9N6cz2jTYRPeH1vonNmXMG"
BOB="Eata7NcsFkN2TJDgoKNndAAax66eC3JDnZMa1fhdZTWT"
CHARLIE="E8YKCDVUb2ZjJGdanzQmSfbc9UH9tHw7hawBTipnyMtY"

# Token mints
SPIRAL_MINT="HSErF7xjoMowD4RoYzcigBRSoPv5CoZRRgxvxBAsTdWK"
STARDUST_MINT="A1wZAwvc5r8LPoKbbdTXHY25VU2ZkQrk7ikW5QgbzdtH"

# Amount to transfer (10 tokens with 8 decimals)
AMOUNT="1000000000"

echo "🚀 Transferring SPL Tokens to Test Accounts"
echo "==========================================="

echo "👥 Test Accounts:"
echo "   Alice: $ALICE"
echo "   Bob: $BOB"
echo "   Charlie: $CHARLIE"

echo ""
echo "💰 Transferring $AMOUNT tokens to each account..."

# Transfer Spiral tokens
echo ""
echo "🪙 Transferring Spiral tokens..."
echo "   Alice..."
spl-token transfer $SPIRAL_MINT $AMOUNT $ALICE --fund-recipient

echo "   Bob..."
spl-token transfer $SPIRAL_MINT $AMOUNT $BOB --fund-recipient

echo "   Charlie..."
spl-token transfer $SPIRAL_MINT $AMOUNT $CHARLIE --fund-recipient

# Transfer Stardust tokens
echo ""
echo "🪙 Transferring Stardust tokens..."
echo "   Alice..."
spl-token transfer $STARDUST_MINT $AMOUNT $ALICE --fund-recipient

echo "   Bob..."
spl-token transfer $STARDUST_MINT $AMOUNT $BOB --fund-recipient

echo "   Charlie..."
spl-token transfer $STARDUST_MINT $AMOUNT $CHARLIE --fund-recipient

echo ""
echo "✅ SPL token transfers completed!"
echo ""
echo "📊 Checking balances..."

# Check balances
echo ""
echo "👤 Alice ($ALICE):"
spl-token balance $SPIRAL_MINT --owner $ALICE
spl-token balance $STARDUST_MINT --owner $ALICE

echo ""
echo "👤 Bob ($BOB):"
spl-token balance $SPIRAL_MINT --owner $BOB
spl-token balance $STARDUST_MINT --owner $BOB

echo ""
echo "👤 Charlie ($CHARLIE):"
spl-token balance $SPIRAL_MINT --owner $CHARLIE
spl-token balance $STARDUST_MINT --owner $CHARLIE
