#!/bin/bash

# Deploy backend canister with automatic Candid generation
set -e

echo "Building backend canister..."
if ! cargo build --release --target wasm32-unknown-unknown --package backend; then
    echo "❌ Compilation failed! Exiting immediately."
    exit 1
fi

echo "Extracting Candid interface..."
if ! candid-extractor target/wasm32-unknown-unknown/release/backend.wasm > src/backend/backend.did; then
    echo "❌ Candid extraction failed!"
    exit 1
fi

echo "Generating declarations..."
if ! dfx generate backend; then
    echo "❌ Declaration generation failed!"
    exit 1
fi

echo "Deploying to mainnet..."
if ! dfx deploy backend --network ic; then
    echo "❌ Deployment failed!"
    exit 1
fi

CANISTER_ID=$(dfx canister id backend --network ic)
echo "Deployment complete!"
echo "Backend canister ID: $CANISTER_ID"
echo "Candid UI: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=$CANISTER_ID"
echo ""
echo "Now test the call manually with:"
echo "dfx canister call backend create_escrow_with_permit --network ic '(record { order_id = blob \"12345678901234567890123456789012\"; amount = 100000000000 : nat64; expiry_timestamp = 1757425999053 : nat64; permit_signature = blob \"1234567890123456789012345678901234567890123456789012345678901234\"; nonce = 245460 : nat64; deadline = 1757425999053 : nat64; user_pubkey = \"8Tfg3vjV5Huk1YKpZ1FKCF9N6cz2jTYRPeH1vonNmXMG\"; token_mint = \"DAkvQyQigUzc4cdnMUA8UxrFmyK9513JME4dAMD1tHCy\" })'"
