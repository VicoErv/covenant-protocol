# Full Stack Setup Guide

This guide walks through running the complete Covenant Protocol stack locally.

## Prerequisites
- [Foundry](https://book.getfoundry.sh/)
- Node.js (v18+)
- Python 3.9+

## 1. Deploy Contracts (Local Anvil)

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy contracts
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Note the deployed addresses and update `.env` files.

## 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with deployed contract addresses

# Run API server
uvicorn main:app --reload --port 8000

# In another terminal, run indexer
python indexer.py
```

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with deployed contract addresses

# Run dev server
npm run dev
```

## 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Full User Flow

1. **Connect Wallet** (Use Anvil test accounts)
2. **Join Covenant** (0.01 ETH bond)
3. **Submit Idea** (Proposal with bounty request)
4. **High-Rep Users Approve** (Quorum triggers funding)
5. **Upload Proof** (File upload + on-chain submission)
6. **Admin Resolves** (Use resolver tool or direct contract call)
7. **View Leaderboard** (Reputation updates)

## Resolver Tool Usage

```bash
cd backend

# Multisig example
python resolver_tool.py multisig-propose 0 true

# Optimistic example
python resolver_tool.py optimistic-propose 0 true
```

## Troubleshooting

- **CORS errors**: Ensure backend is running on port 8000
- **Contract not found**: Verify addresses in `.env` files
- **Indexer not syncing**: Check RPC_URL and contract addresses
