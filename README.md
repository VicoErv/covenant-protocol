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
    *   **Resolve**: Admin verifies success, triggering payouts and reputation rewards.

## Core Contracts
*   **`CovenantJoin.sol`**: Manages membership and forwards entry bonds to the Engine.
*   **`ReputationLedger.sol`**: Stores non-transferable reputation. Controlled by the Engine.
*   **`BuilderEngine.sol`**: The core logic handling the Proposal -> Escrow -> Resolution lifecycle.

## Development

### Prerequisites
*   [Foundry](https://book.getfoundry.sh/)

### Build
```bash
forge build
```

### Test
Run the full test suite, including End-to-End scenarios:
```bash
forge test
```

## Deployed Addresses
*   (Local/Testnet addresses would go here)
