#!/bin/bash

# Deploy Backend Canister Script
# This script builds the backend canister, extracts Candid interface, and deploys

set -e  # Exit on any error

echo "🚀 Starting backend canister deployment..."

# Check if candid-extractor is installed
if ! command -v candid-extractor &> /dev/null; then
    echo "❌ candid-extractor not found. Installing..."
    cargo install candid-extractor
fi

# Check if dfx is running
if ! dfx ping &> /dev/null; then
    echo "❌ dfx is not running. Please start dfx first with: dfx start"
    exit 1
fi

echo "📦 Building backend canister..."
cargo build --release --target wasm32-unknown-unknown --package backend

echo "🔍 Extracting Candid interface..."
candid-extractor target/wasm32-unknown-unknown/release/backend.wasm > src/backend/backend.did

echo "📋 Generated Candid interface:"
cat src/backend/backend.did

echo "🚀 Deploying backend canister..."
dfx deploy backend
dfx generate
echo "✅ Backend canister deployed successfully!"
echo "🌐 Candid UI: http://127.0.0.1:4943/?canisterId=$(dfx canister id backend)"

echo "Deployment complete!"