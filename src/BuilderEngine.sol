// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CovenantJoin.sol";
import "./ReputationLedger.sol";

contract BuilderEngine {
    enum Status { Pending, Funded, Delivered, Completed, Failed }

    struct Proposal {
        uint256 id;
        address submitter;
        string details;
        uint256 requestedAmount;
        Status status;
        string proof;
        uint256 approvalCount;
        mapping(address => bool) approvals;
    }

    CovenantJoin public covenantJoin;
    ReputationLedger public reputationLedger;
    address public owner;
    address public resolver;
    address public governance;
    uint256 public adminExpiryBlock;

    uint256 public nextProposalId;
    mapping(uint256 => Proposal) public proposals;
    
    // Config
    uint256 public constant MIN_REP_TO_VOTE = 10 ether; 
    uint256 public constant QUORUM = 2; // Need 2 votes to fund
    uint256 public constant REWARD_AMOUNT = 5 ether;

    uint256 public lockedFunds; // Funds reserved for Funded proposals

    event ProposalSubmitted(uint256 indexed id, address indexed submitter, uint256 amount);
    event ProposalApproved(uint256 indexed id, address indexed voter);
    event ProposalFunded(uint256 indexed id);
    event ProofSubmitted(uint256 indexed id, string proof);
    event ProposalResolved(uint256 indexed id, bool success);
    event ReceivedFunding(address sender, uint256 amount);

    constructor(address _covenantJoin, address _reputationLedger) {
        covenantJoin = CovenantJoin(_covenantJoin);
        reputationLedger = ReputationLedger(_reputationLedger);
        owner = msg.sender;
        resolver = msg.sender; // Initial resolver is admin
        adminExpiryBlock = block.number + 100000; // ~2 weeks @ 12s block time (example)
    }
    
    receive() external payable {
        emit ReceivedFunding(msg.sender, msg.value);
    }

    modifier onlyMember() {
        require(covenantJoin.isMember(msg.sender), "NotMember");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "OnlyAdmin");
        _;
    }

    modifier onlyResolver() {
        require(msg.sender == resolver, "NotResolver");
        _;
    }

    function setResolver(address _resolver) external {
        if (msg.sender == governance) {
            resolver = _resolver;
            return;
        }
        require(msg.sender == owner, "OnlyAdminOrGov");
        require(block.number < adminExpiryBlock, "AdminExpired");
        resolver = _resolver;
    }

    function setGovernance(address _governance) external onlyOwner {
         // Admin can set governance initially (before expiry)
         require(block.number < adminExpiryBlock, "AdminExpired");
         governance = _governance;
    }

    function submitProposal(string calldata details, uint256 requestedAmount) external onlyMember {
        uint256 id = nextProposalId++;
        Proposal storage p = proposals[id];
        p.id = id;
        p.submitter = msg.sender;
        p.details = details;
        p.requestedAmount = requestedAmount;
        p.status = Status.Pending;
        
        emit ProposalSubmitted(id, msg.sender, requestedAmount);
    }

    function approveProposal(uint256 proposalId) external onlyMember {
        Proposal storage p = proposals[proposalId];
        require(p.status == Status.Pending, "NotPending");
        require(p.submitter != msg.sender, "CannotVoteSelf");
        require(!p.approvals[msg.sender], "AlreadyVoted");
        
        uint256 rep = reputationLedger.getReputation(msg.sender);
        require(rep >= MIN_REP_TO_VOTE, "InsufficientReputation");

        p.approvals[msg.sender] = true;
        p.approvalCount++;
        
        emit ProposalApproved(proposalId, msg.sender);

        if (p.approvalCount >= QUORUM) {
             _fundProposal(proposalId);
        }
    }

    function _fundProposal(uint256 proposalId) internal {
        Proposal storage p = proposals[proposalId];
        require(address(this).balance >= lockedFunds + p.requestedAmount, "InsufficientTreasury");
        
        lockedFunds += p.requestedAmount;
        p.status = Status.Funded;
        
        emit ProposalFunded(proposalId);
    }
    
    function submitProof(uint256 proposalId, string calldata proof) external {
        Proposal storage p = proposals[proposalId];
        require(msg.sender == p.submitter, "NotSubmitter");
        require(p.status == Status.Funded, "NotFunded");
        
        p.proof = proof;
        p.status = Status.Delivered;
        
        emit ProofSubmitted(proposalId, proof);
    }
    
    function resolveProposal(uint256 proposalId, bool success) external onlyResolver {
        Proposal storage p = proposals[proposalId];
        require(p.status == Status.Delivered, "NotDelivered");
        
        if (success) {
            p.status = Status.Completed;
            lockedFunds -= p.requestedAmount; // Release lock
            
            // Payout
            (bool sent, ) = p.submitter.call{value: p.requestedAmount}("");
            require(sent, "PayoutFailed");
            
            // Rep Increase
            reputationLedger.increaseReputation(p.submitter, REWARD_AMOUNT);
            // TODO: Reward voters? For MVP keeping simple.
        } else {
            p.status = Status.Failed;
            lockedFunds -= p.requestedAmount; // Release lock back to free treasury
             // No payout. Funds remain in contract (free balance).
        }
        
        emit ProposalResolved(proposalId, success);
    }

    // Helper for View (approvals mapping not returned by default)
    function isApprovedBy(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].approvals[voter];
    }
}
