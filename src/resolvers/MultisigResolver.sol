// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../BuilderEngine.sol";

contract MultisigResolver {
    address public builderEngine;
    address[] public signers;
    mapping(address => bool) public isSigner;
    uint256 public threshold;
    uint256 public txCount;

    struct ResolutionTx {
        uint256 proposalId;
        bool outcome;
        uint256 approvals;
        bool executed;
        mapping(address => bool) hasConfirmed;
    }

    mapping(uint256 => ResolutionTx) public transactions;

    modifier onlySigner() {
        require(isSigner[msg.sender], "NotSigner");
        _;
    }

    constructor(address _builderEngine, address[] memory _signers, uint256 _threshold) {
        require(_signers.length >= _threshold, "InvalidThreshold");
        require(_threshold > 0, "ZeroThreshold");

        builderEngine = _builderEngine;
        signers = _signers;
        threshold = _threshold;

        for (uint256 i = 0; i < _signers.length; i++) {
            isSigner[_signers[i]] = true;
        }
    }

    function proposeResolution(uint256 proposalId, bool outcome) external onlySigner returns (uint256 txId) {
        txId = txCount++;
        ResolutionTx storage t = transactions[txId];
        t.proposalId = proposalId;
        t.outcome = outcome;
        t.approvals = 1;
        t.hasConfirmed[msg.sender] = true;
        t.executed = false;

        // Auto-execute if threshold is 1
        if (threshold == 1) {
            _executeResolution(txId);
        }
    }

    function confirmResolution(uint256 txId) external onlySigner {
        ResolutionTx storage t = transactions[txId];
        require(!t.executed, "AlreadyExecuted");
        require(!t.hasConfirmed[msg.sender], "AlreadyConfirmed");

        t.hasConfirmed[msg.sender] = true;
        t.approvals++;

        if (t.approvals >= threshold) {
            _executeResolution(txId);
        }
    }

    function _executeResolution(uint256 txId) internal {
        ResolutionTx storage t = transactions[txId];
        t.executed = true;
        BuilderEngine(payable(builderEngine)).resolveProposal(t.proposalId, t.outcome);
    }
}
