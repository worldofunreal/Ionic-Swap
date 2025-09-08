#!/bin/bash

# Deploy backend canister with automatic Candid generation and testing
set -e

MAX_RETRIES=3
RETRY_COUNT=0

deploy_and_test() {
    echo "Building backend canister..."
    cargo build --release --target wasm32-unknown-unknown --package backend

    echo "Extracting Candid interface..."
    candid-extractor target/wasm32-unknown-unknown/release/backend.wasm > src/backend/backend.did

    echo "Generating declarations..."
    dfx generate backend

    echo "Deploying to playground..."
    dfx deploy backend --network playground

    CANISTER_ID=$(dfx canister id backend --network playground)
    echo "Deployment complete!"
    echo "Backend canister ID: $CANISTER_ID"
    echo "Candid UI: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=$CANISTER_ID"

    echo "Testing canister call..."
    if dfx canister call backend create_escrow_with_permit '(
      record {
        order_id = blob "12345678901234567890123456789012";
        amount = 100000000000 : nat64;
        expiry_timestamp = 1757425999053 : nat64;
        permit_signature = blob "1234567890123456789012345678901234567890123456789012345678901234";
        nonce = 245460 : nat64;
        deadline = 1757425999053 : nat64;
        user_pubkey = "8Tfg3vjV5Huk1YKpZ1FKCF9N6cz2jTYRPeH1vonNmXMG";
        token_mint = "DAkvQyQigUzc4cdnMUA8UxrFmyK9513JME4dAMD1tHCy"
      }
    )' --network playground; then
        echo "✅ Test call successful!"
        return 0
    else
        echo "❌ Test call failed!"
        return 1
    fi
}

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES"
    
    if deploy_and_test; then
        echo "🎉 Deployment and testing successful!"
        exit 0
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Retrying deployment in 5 seconds..."
            sleep 5
        fi
    fi
done

echo "💥 Failed to deploy and test after $MAX_RETRIES attempts!"
exit 1
