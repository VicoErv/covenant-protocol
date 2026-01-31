// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";
import "../src/resolvers/OptimisticResolver.sol";

contract Phase2_OptimisticTest is BaseTest {
    OptimisticResolver public optResolver;

    function setUp() public override {
        super.setUp();
        
        vm.prank(admin);
        optResolver = new OptimisticResolver(address(builderEngine));
        
        vm.prank(admin);
        builderEngine.setResolver(address(optResolver));
    }

    function test_P2_1_AnyoneCanPropose() public {
        uint256 pid = _createDeliveredProposal(alice);
        
        // Bob proposes (random user)
        vm.deal(bob, 1 ether);
        vm.prank(bob);
        optResolver.proposeOutcome{value: 0.5 ether}(pid, true);
        
        (address proposer, bool outcome, uint256 ts, bool disputed,,) = optResolver.requests(pid);
        assertEq(proposer, bob);
        assertEq(outcome, true);
        assertEq(ts, block.timestamp);
        assertEq(disputed, false);
    }

    function test_P2_2_CannotFinalizeEarly() public {
        uint256 pid = _createDeliveredProposal(alice);
        
        vm.deal(bob, 1 ether);
        vm.prank(bob);
        optResolver.proposeOutcome{value: 0.5 ether}(pid, true);
        
        vm.expectRevert("WindowActive");
        optResolver.finalizeOutcome(pid);
    }

    function test_P2_3_FinalizeAfterWindow() public {
        uint256 pid = _createDeliveredProposal(alice);
        
        vm.deal(bob, 1 ether);
        vm.prank(bob);
        optResolver.proposeOutcome{value: 0.5 ether}(pid, true);
        
        // Warping
        vm.warp(block.timestamp + 3 days + 1);
        
        uint256 balBefore = bob.balance;
        optResolver.finalizeOutcome(pid);
        uint256 balAfter = bob.balance;
        
        // Bond returned
        assertEq(balAfter, balBefore + 0.5 ether, "Bond should be returned");
        
        (, , , , BuilderEngine.Status status, , ) = builderEngine.proposals(pid);
        assertEq(uint(status), uint(BuilderEngine.Status.Completed), "Should be completed");
    }

    function test_P2_4_DisputeTriggersEscalation() public {
        uint256 pid = _createDeliveredProposal(alice);
        
        // Bob proposes
        vm.deal(bob, 1 ether);
        vm.prank(bob);
        optResolver.proposeOutcome{value: 0.5 ether}(pid, true);
        
        // Charlie disputes
        vm.deal(charlie, 1 ether);
        vm.prank(charlie);
        optResolver.disputeOutcome{value: 0.5 ether}(pid);
        
        (,,, bool disputed,,) = optResolver.requests(pid);
        assertTrue(disputed);
        
        // Warp and try finalize
        vm.warp(block.timestamp + 4 days);
        vm.expectRevert("Disputed");
        optResolver.finalizeOutcome(pid);
    }

    // Reuse helper
    function _createDeliveredProposal(address submitter) internal returns (uint256) {
        if (!covenantJoin.isMember(submitter)) {
            vm.prank(submitter);
            covenantJoin.joinCovenant{value: 0.01 ether}();
        }

        vm.prank(submitter);
        builderEngine.submitProposal("task", 1 ether);
        uint256 pid = builderEngine.nextProposalId() - 1;
        
        vm.deal(address(builderEngine), 10 ether); 
        vm.prank(highRep1); builderEngine.approveProposal(pid);
        vm.prank(highRep2); builderEngine.approveProposal(pid);
        
        vm.prank(submitter);
        builderEngine.submitProof(pid, "proof");
        
        return pid;
    }
}
