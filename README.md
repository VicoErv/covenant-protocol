# Covenant Herd Mind Protocol (Builder Engine)

A decentralized "Covenant Herd Mind" protocol where reputation is the primary currency. The system enforces truth-seeking behavior through staking and reputation, operating on a "Builder Engine" loop.

## Overview
This protocol facilitates a trust-minimized workflow for funding and verifying work:
1.  **Covenant Membership**: Users join by depositing a bond (e.g., 0.01 ETH). Funds are forwarded to the Treasury.
2.  **Builder Engine**:
    *   **Propose**: Members submit ideas with a bounty request.
    *   **Sponsor**: High-Reputation members approve proposals (Quorum required).
    *   **Escrow**: Funds are locked upon quorum approval.
    *   **Deliver**: Builders submit proofs of work.
    *   **Resolve**: Resolution logic is modular (Admin -> Multisig -> Optimistic -> Jury). Verifies success to trigger payouts.

## Core Contracts
*   **`CovenantJoin.sol`**: Manages membership and forwards entry bonds to the Engine.
*   **`ReputationLedger.sol`**: Stores non-transferable reputation. Controlled by the Engine.
*   **`BuilderEngine.sol`**: The core logic handling the Proposal -> Escrow -> Resolution lifecycle. Supports modular `Resolver` contracts.
*   **Resolvers**:
    *   `MultisigResolver.sol`: N-of-M consensus resolution.
    *   `OptimisticResolver.sol`: Bonded proposals with dispute window.
    *   `JuryResolver.sol`: Reputation-weighted jury voting.

## Decentralized Resolution Roadmap
The protocol is designed to evolve its truth-seeking mechanism through 4 phases:
1.  **Phase 0 (Admin MVP)**: Bootstrapping with Admin resolution.
2.  **Phase 1 (Multisig)**: Reduced centralization via 3-of-5 signers.
3.  **Phase 2 (Optimistic)**: Open bonded proposals, disputes trigger arbitration.
4.  **Phase 3 (Jury)**: Full "Herd Mind" with high-reputation jurors resolving disputes.
5.  **Phase 4 (Governance)**: Governance controls the resolver upgrades.

## Development

### Prerequisites
*   [Foundry](https://book.getfoundry.sh/)
*   Node.js (v18+) for Frontend
*   Python 3.9+ for Backend

### Build Contracts
```bash
forge build
```

### Test Contracts
Run the full test suite, including End-to-End scenarios:
```bash
forge test
```

### Full Stack Setup
See [SETUP.md](./SETUP.md) for complete instructions on running:
- **Backend** (Python FastAPI + Event Indexer)
- **Frontend** (React/Vite + Wagmi)
- **Local Blockchain** (Anvil)

## Project Structure
```
├── src/                    # Smart contracts
│   ├── BuilderEngine.sol
│   ├── ReputationLedger.sol
│   ├── CovenantJoin.sol
│   └── resolvers/          # Modular resolution contracts
├── test/                   # Foundry tests
├── backend/                # Python API & Indexer
│   ├── main.py            # FastAPI server
│   ├── indexer.py         # Event listener
│   ├── database.py        # SQLAlchemy models
│   └── resolver_tool.py   # CLI for resolvers
└── frontend/               # React application
    └── src/
        ├── components/    # UI components
        └── abis/          # Contract ABIs
```

## Deployed Addresses
*   (Local/Testnet addresses would go here)
