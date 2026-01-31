#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Hybrid Covenant Stack..."

# 1. Start Anvil in background if not already running
if ! lsof -i:8545 > /dev/null; then
    echo "⛓️  Starting Anvil natively..."
    anvil --host 0.0.0.0 --block-time 2 --chain-id 31337 > anvil.log 2>&1 &
    ANVIL_PID=$!
    echo "Anvil started with PID $ANVIL_PID (logs in anvil.log)"
    # Give it a second to boot
    sleep 2
else
    echo "✅ Anvil is already running."
fi

# 2. Deploy Contracts
echo "📜 Deploying contracts natively..."
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
~/.foundry/bin/forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast

# 3. Extract Addresses and Update Environment
echo "📝 Syncing contract addresses..."
RUN_FILE="broadcast/Deploy.s.sol/31337/run-latest.json"
export COVENANT_JOIN_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "CovenantJoin") | .contractAddress' $RUN_FILE | head -n 1)
export REPUTATION_LEDGER_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "ReputationLedger") | .contractAddress' $RUN_FILE | head -n 1)
export BUILDER_ENGINE_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "BuilderEngine") | .contractAddress' $RUN_FILE | head -n 1)

# Create frontend .env for native dev as well
cat <<EOF > frontend/.env
VITE_API_URL=http://localhost:8000
VITE_BUILDER_ENGINE_ADDRESS=$BUILDER_ENGINE_ADDRESS
VITE_COVENANT_JOIN_ADDRESS=$COVENANT_JOIN_ADDRESS
VITE_REPUTATION_LEDGER_ADDRESS=$REPUTATION_LEDGER_ADDRESS
EOF

# 4. Start Docker Services
echo "🐳 Starting Docker services (Backend & Frontend)..."
# Wipe state for consistency on reset
rm -f backend/data/proposals.db
rm -rf backend/uploads/*
mkdir -p backend/uploads

docker compose up -d --build

echo "✨ All systems go!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"

if [ -n "$ANVIL_PID" ]; then
    echo "Note: Anvil is running in the background. Kill it with 'kill $ANVIL_PID' when done."
fi
