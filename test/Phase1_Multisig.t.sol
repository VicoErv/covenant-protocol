// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";
import "../src/resolvers/MultisigResolver.sol";

contract Phase1_MultisigTest is BaseTest {
    MultisigResolver public multisig;
    address[] public signers;

    function setUp() public override {
        super.setUp();
        
        // Prepare signers
        signers.push(alice);
        signers.push(bob);
        signers.push(charlie); // 3 signers
        
        // Deploy MultisigResolver with 2-of-3 threshold
        vm.prank(admin);
        multisig = new MultisigResolver(address(builderEngine), signers, 2);
        
        // Update BuilderEngine resolver to be the multisig contract
        vm.prank(admin);
        builderEngine.setResolver(address(multisig));
    }

    function test_P1_1_SingleSignerCannotResolve() public {
        // Create proposal
        uint256 pid = _createDeliveredProposal(alice);
        
        // Alice proposes to resolve true
        vm.prank(alice);
        uint256 txId = multisig.proposeResolution(pid, true);
        
        // Check state
        (uint256 propId, bool outcome, uint256 approvals, bool executed) = _getTxInfo(txId);
        assertEq(executed, false);
        assertEq(approvals, 1);
        
        (, , , , BuilderEngine.Status status, , ) = builderEngine.proposals(pid);
        assertEq(uint(status), uint(BuilderEngine.Status.Delivered), "Status should be Delivered");
    }

    function test_P1_2_ThresholdResolves() public {
        uint256 pid = _createDeliveredProposal(alice);
        
        // Alice proposes
        vm.prank(alice);
        uint256 txId = multisig.proposeResolution(pid, true);
        
        // Bob confirms
        vm.prank(bob);
        multisig.confirmResolution(txId);
        
        // Should be executed now
         (,,, bool executed) = _getTxInfo(txId);
        assertTrue(executed, "Tx should be executed");
        
        (, , , , BuilderEngine.Status status, , ) = builderEngine.proposals(pid);
        assertEq(uint(status), uint(BuilderEngine.Status.Completed), "Status should be Completed");
    }

    function test_P1_3_NonSignerCannotConfirm() public {
        uint256 pid = _createDeliveredProposal(alice);
        
        vm.prank(alice);
        uint256 txId = multisig.proposeResolution(pid, true);
        
        vm.prank(highRep1); // Not a signer
        vm.expectRevert("NotSigner");
        multisig.confirmResolution(txId);
    }

    // Helper to create a proposal ready for resolution
    function _createDeliveredProposal(address submitter) internal returns (uint256) {
        if (!covenantJoin.isMember(submitter)) {
            vm.prank(submitter);
            covenantJoin.joinCovenant{value: 0.01 ether}();
        }

        vm.prank(submitter);
        builderEngine.submitProposal("task", 1 ether);
        uint256 pid = builderEngine.nextProposalId() - 1;
        
        // Fund
        vm.deal(address(builderEngine), 10 ether);
        vm.prank(highRep1); builderEngine.approveProposal(pid);
        
        // Deliver
        vm.prank(submitter);
        builderEngine.submitProof(pid, "proof");
        
        return pid;
    }

    function _getTxInfo(uint256 txId) internal view returns (uint256, bool, uint256, bool) {
        (uint256 p, bool o, uint256 a, bool e) = multisig.transactions(txId);
        // Note: struct return might need destructuring depending on solidity version and return packing
        // Actually `transactions` public getter returns (uint256, bool, uint256, bool)
        return (p, o, a, e);
    }
}
