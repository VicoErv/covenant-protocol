// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../BuilderEngine.sol";

contract OptimisticResolver {
    address public builderEngine;
    uint256 public constant DISPUTE_WINDOW = 3 days;
    uint256 public constant BOND_AMOUNT = 0.5 ether;

    struct ResolutionRequest {
        address proposer;
        bool outcome;
        uint256 timestamp;
        bool disputed;
        address disputer;
        bool finalized;
    }

    mapping(uint256 => ResolutionRequest) public requests;

    event OutcomeProposed(uint256 indexed proposalId, address indexed proposer, bool outcome);
    event OutcomeDisputed(uint256 indexed proposalId, address indexed disputer);
    event OutcomeFinalized(uint256 indexed proposalId, bool outcome);

    constructor(address _builderEngine) {
        builderEngine = _builderEngine;
    }

    // Anyone can propose, must bond
    function proposeOutcome(uint256 proposalId, bool outcome) external payable {
        require(msg.value == BOND_AMOUNT, "IncorrectBond");
        ResolutionRequest storage req = requests[proposalId];
        require(req.proposer == address(0), "AlreadyProposed");
        
        req.proposer = msg.sender;
        req.outcome = outcome;
        req.timestamp = block.timestamp;
        
        emit OutcomeProposed(proposalId, msg.sender, outcome);
    }

    // Anyone can dispute, must bond
    function disputeOutcome(uint256 proposalId) external payable {
        require(msg.value == BOND_AMOUNT, "IncorrectBond");
        ResolutionRequest storage req = requests[proposalId];
        require(req.proposer != address(0), "NotProposed");
        require(!req.disputed, "AlreadyDisputed");
        require(block.timestamp < req.timestamp + DISPUTE_WINDOW, "DisputeWindowClosed");
        require(!req.finalized, "AlreadyFinalized");

        req.disputed = true;
        req.disputer = msg.sender;
        
        emit OutcomeDisputed(proposalId, msg.sender);
        
        // Escalation Logic (Phase 3 placeholder)
        // For Phase 2, we just mark disputed and maybe freeze or revert
        // The spec says: "If disputed -> escalates to arbitration"
        // And "Phase 3 becomes jury".
        // For Phase 2 MVP, "Liar loses bond" (requires knowing truth).
        // Since we don't have arbitration yet, we can't programmatically determine who lied unless we use Admin/Multisig as arbiter.
        // But prompt says "Remove trusted resolvers entirely".
        // I will implement a simpler version where dispute blocks finalization indefinitely until a `resolveDispute` is called (future upgrade).
        // OR: Phase 2 unit test P2.4 says "cannot finalize until arbitration".
    }

    function finalizeOutcome(uint256 proposalId) external {
        ResolutionRequest storage req = requests[proposalId];
        require(req.proposer != address(0), "NotProposed");
        require(!req.disputed, "Disputed");
        require(!req.finalized, "AlreadyFinalized");
        require(block.timestamp >= req.timestamp + DISPUTE_WINDOW, "WindowActive");

        req.finalized = true;
        
        // Return bond to proposer
        (bool sent, ) = req.proposer.call{value: BOND_AMOUNT}("");
        require(sent, "BondReturnFailed");

        // Execute on Engine
        BuilderEngine(payable(builderEngine)).resolveProposal(proposalId, req.outcome);
        
        emit OutcomeFinalized(proposalId, req.outcome);
    }
}
