#!/bin/bash

echo "🚀 Setting up EVM HTLC Frontend..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install dfx first."
    echo "Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/"
    exit 1
fi

# Start local replica if not running
echo "🔧 Starting local replica..."
dfx start --background --clean

# Wait for replica to be ready
echo "⏳ Waiting for replica to be ready..."
sleep 5

# Deploy canisters
echo "📦 Deploying canisters..."
dfx deploy

# Generate declarations
echo "📝 Generating declarations..."
dfx generate

# Copy environment variables
echo "🔑 Setting up environment variables..."
if [ -f ".env" ]; then
    cp .env src/frontend/.env
    echo "✅ Environment variables copied to frontend directory"
else
    echo "⚠️  No .env file found. Please run 'dfx deploy' first."
fi

echo "✅ Setup complete!"
echo ""
echo "To start the frontend:"
echo "  cd src/frontend"
echo "  npm run dev"
echo ""
echo "The frontend will be available at: http://localhost:3000" 