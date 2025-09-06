#!/bin/bash

# Deploy ICRC-1 tokens matching SpiralToken and StardustToken specifications
# This script automates the deployment of both tokens with ICRC-2 support enabled

set -e

echo "🚀 Starting ICRC-1 token deployment..."

# Check if dfx can connect to mainnet
if ! dfx ping ic > /dev/null 2>&1; then
    echo "❌ Cannot connect to mainnet ICP. Please check your internet connection and try again"
    exit 1
fi

# Use bizkit identity for everything (minter, archive controller, deployer)
export MINTER_ACCOUNT_ID=$(dfx identity get-principal)
export ARCHIVE_CONTROLLER=$(dfx identity get-principal)
export DEPLOY_ID=$(dfx identity get-principal)

echo "🔑 Using bizkit identity for all roles:"
echo "   Minter principal: $MINTER_ACCOUNT_ID"
echo "   Archive controller principal: $ARCHIVE_CONTROLLER"
echo "   Deployer principal: $DEPLOY_ID"

# Set archive options (recommended values)
export TRIGGER_THRESHOLD=2000
export NUM_OF_BLOCK_TO_ARCHIVE=1000
export CYCLE_FOR_ARCHIVE_CREATION=10000000000000

# Enable ICRC-2 support
export FEATURE_FLAGS=true

# Deploy Spiral Token (SPIRAL)
echo "🪙 Deploying Spiral Token (SPIRAL) to mainnet ICP..."

# Spiral Token configuration (matching SpiralToken.sol)
export TOKEN_NAME="Spiral"
export TOKEN_SYMBOL="SPIRAL"
export PRE_MINTED_TOKENS=100000000000000000  # 100 million tokens with 8 decimals
export TRANSFER_FEE=10000  # 0.0001 tokens with 8 decimals

echo "📊 Spiral Token Configuration:"
echo "   Name: $TOKEN_NAME"
echo "   Symbol: $TOKEN_SYMBOL"
echo "   Decimals: 8"
echo "   Initial Supply: $PRE_MINTED_TOKENS (100,000,000 tokens)"
echo "   Transfer Fee: $TRANSFER_FEE"
echo "   ICRC-2 Support: Enabled"

dfx deploy spiral_token --network ic --argument "(variant {Init =
record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${MINTER_ACCOUNT_ID}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal \"${DEPLOY_ID}\"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})"

echo "✅ Spiral Token deployed successfully!"

# Deploy Stardust Token (STD)
echo "🪙 Deploying Stardust Token (STD)..."

# Stardust Token configuration (matching StardustToken.sol)
export TOKEN_NAME="Stardust"
export TOKEN_SYMBOL="STD"
export PRE_MINTED_TOKENS=100000000000000000  # 100 million tokens with 8 decimals
export TRANSFER_FEE=10000  # 0.0001 tokens with 8 decimals

echo "📊 Stardust Token Configuration:"
echo "   Name: $TOKEN_NAME"
echo "   Symbol: $TOKEN_SYMBOL"
echo "   Decimals: 8"
echo "   Initial Supply: $PRE_MINTED_TOKENS (100,000,000 tokens)"
echo "   Transfer Fee: $TRANSFER_FEE"
echo "   ICRC-2 Support: Enabled"

dfx deploy stardust_token --network ic --argument "(variant {Init =
record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${MINTER_ACCOUNT_ID}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal \"${DEPLOY_ID}\"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})"

echo "✅ Stardust Token deployed successfully!"

# Display deployment summary
echo ""
echo "🎉 ICRC-1 Token Deployment Complete!"
echo "======================================"
echo ""
echo "📋 Deployment Summary:"
echo "   Minter Principal: $MINTER_ACCOUNT_ID"
echo "   Archive Controller: $ARCHIVE_CONTROLLER"
echo "   Deployer Principal: $DEPLOY_ID"
echo ""
echo "🪙 Spiral Token (SPIRAL):"
echo "   Canister ID: $(dfx canister id spiral_token --network ic)"
echo "   Initial Supply: 100,000,000 SPIRAL"
echo "   Decimals: 8"
echo "   ICRC-2: Enabled"
echo "   Network: Mainnet ICP"
echo ""
echo "🪙 Stardust Token (STD):"
echo "   Canister ID: $(dfx canister id stardust_token --network ic)"
echo "   Initial Supply: 100,000,000 STD"
echo "   Decimals: 8"
echo "   ICRC-2: Enabled"
echo "   Network: Mainnet ICP"
echo ""
echo "🔗 Mainnet Explorer URLs:"
echo "   Spiral Token: https://dashboard.internetcomputer.org/canister/$(dfx canister id spiral_token --network ic)"
echo "   Stardust Token: https://dashboard.internetcomputer.org/canister/$(dfx canister id stardust_token --network ic)"
echo ""
echo "📝 Next steps:"
echo "   1. Test token transfers using dfx canister call"
echo "   2. Test ICRC-2 approve/transfer_from functionality"
echo "   3. Integrate with your cross-chain swap application" 