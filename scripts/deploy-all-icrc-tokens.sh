#!/bin/bash

# Deploy all ICRC-1 tokens for major cryptocurrencies
# This script automates the deployment of all tokens with ICRC-2 support enabled

set -e

echo "🚀 Starting All ICRC-1 Cryptocurrency Token Deployment..."
echo "========================================================="

# Check if dfx is running
if ! dfx ping > /dev/null 2>&1; then
    echo "❌ dfx is not running. Please start dfx first with: dfx start --clean --background"
    exit 1
fi

# Use current identity
export MINTER_ACCOUNT_ID=$(dfx identity get-principal)
export ARCHIVE_CONTROLLER=$(dfx identity get-principal)
export DEPLOY_ID=$(dfx identity get-principal)

echo "🔑 Using identity: $(dfx identity whoami)"
echo "🔑 Principal: $MINTER_ACCOUNT_ID"

# Set archive options (recommended values)
export TRIGGER_THRESHOLD=2000
export NUM_OF_BLOCK_TO_ARCHIVE=1000
export CYCLE_FOR_ARCHIVE_CREATION=10000000000000

# Enable ICRC-2 support
export FEATURE_FLAGS=true

# Define all tokens to deploy
declare -A TOKENS
TOKENS["bitcoin_token"]="Bitcoin:BTC:8:2100000000000000:10000"
TOKENS["ethereum_token"]="Ethereum:ETH:18:120000000000000000000000000:10000000000000000"
TOKENS["xrp_token"]="XRP:XRP:6:100000000000000000:10000"
TOKENS["tether_token"]="Tether:USDT:6:1000000000000000000:10000"
TOKENS["bnb_token"]="BNB:BNB:18:200000000000000000000000000:10000000000000000"
TOKENS["solana_token"]="Solana:SOL:9:1000000000000000000:100000000"
TOKENS["usdc_token"]="USD Coin:USDC:6:1000000000000000000:10000"
TOKENS["dogecoin_token"]="Dogecoin:DOGE:8:100000000000000000000:10000"
TOKENS["cardano_token"]="Cardano:ADA:6:45000000000000000:10000"
TOKENS["tron_token"]="TRON:TRX:6:1000000000000000000:10000"

# Function to deploy a token
deploy_token() {
    local canister_name=$1
    local token_info=$2
    
    IFS=':' read -r name symbol decimals supply fee <<< "$token_info"
    
    echo "🪙 Deploying $name ($symbol)..."
    echo "📊 Configuration:"
    echo "   Name: $name"
    echo "   Symbol: $symbol"
    echo "   Decimals: $decimals"
    echo "   Max Supply: $supply"
    echo "   Transfer Fee: $fee"
    echo "   ICRC-2 Support: Enabled"
    
    # Initial supply for testing (1000 tokens)
    local initial_supply=$((1000 * 10**$decimals))
    
    dfx deploy $canister_name --argument "(variant {Init =
record {
     token_symbol = \"${symbol}\";
     token_name = \"${name}\";
     minting_account = record { owner = principal \"${MINTER_ACCOUNT_ID}\" };
     transfer_fee = ${fee};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal \"${DEPLOY_ID}\"; }; ${initial_supply}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})"
    
    echo "✅ $symbol deployed successfully!"
    echo "   Canister ID: $(dfx canister id $canister_name)"
    echo ""
}

# Deploy all tokens
for canister_name in "${!TOKENS[@]}"; do
    deploy_token "$canister_name" "${TOKENS[$canister_name]}"
done

# Display deployment summary
echo ""
echo "🎉 All ICRC-1 Token Deployments Complete!"
echo "=========================================="
echo ""
echo "📋 Deployment Summary:"
echo "   Identity: $(dfx identity whoami)"
echo "   Principal: $MINTER_ACCOUNT_ID"
echo "   Archive Controller: $ARCHIVE_CONTROLLER"
echo "   Tokens Deployed: ${#TOKENS[@]}"
echo ""

echo "🪙 Token Canister IDs:"
for canister_name in "${!TOKENS[@]}"; do
    IFS=':' read -r name symbol decimals supply fee <<< "${TOKENS[$canister_name]}"
    echo "   $symbol: $(dfx canister id $canister_name)"
done

echo ""
echo "🔗 Candid UI URLs:"
for canister_name in "${!TOKENS[@]}"; do
    IFS=':' read -r name symbol decimals supply fee <<< "${TOKENS[$canister_name]}"
    echo "   $symbol: http://127.0.0.1:4943/?canisterId=$(dfx canister id __Candid_UI)&id=$(dfx canister id $canister_name)"
done

echo ""
echo "📝 Next steps:"
echo "   1. Update backend canister with these token addresses"
echo "   2. Test ICRC-2 approve/transfer_from functionality"
echo "   3. Integrate with cross-chain swap application"
echo "   4. Test gasless permit flows"
echo ""
echo "💡 To test a token, use:"
echo "   dfx canister call <token_canister> icrc1_balance_of '(record { owner = principal \"$MINTER_ACCOUNT_ID\"; subaccount = null })'"
