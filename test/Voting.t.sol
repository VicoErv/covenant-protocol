// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";

contract VotingTest is BaseTest {
    function setUp() public override {
        super.setUp();
        vm.prank(alice);
        covenantJoin.joinCovenant{value: 0.01 ether}();
        vm.prank(alice);
        builderEngine.submitProposal("Vote Me", 0.005 ether);
    }

    function testRevertLowRepApproval() public {
        // Bob joins but has 0 Rep
        vm.prank(bob);
        covenantJoin.joinCovenant{value: 0.01 ether}();

        vm.prank(bob);
        vm.expectRevert("InsufficientReputation");
        builderEngine.approveProposal(0);
    }

    function testHighRepApprovalCounts() public {
        vm.prank(highRep1);
        builderEngine.approveProposal(0);
        
        (,,,,,, uint256 approvalCount) = builderEngine.proposals(0);
        assertEq(approvalCount, 1);
        assertTrue(builderEngine.isApprovedBy(0, highRep1));
    }

    function testRevertDoubleVoting() public {
        vm.prank(highRep1);
        builderEngine.approveProposal(0);

        // Since QUORUM=1, it's now Status.Funded. Subsequent votes (even double) fail with NotPending.
        vm.prank(highRep1);
        vm.expectRevert("NotPending");
        builderEngine.approveProposal(0);
    }

    function testStatusChangeOnQuorum() public {
        // Need 1 vote (New Quorum)
        vm.prank(highRep1);
        builderEngine.approveProposal(0);
        
        // Status -> Funded immediately
        (,,,, BuilderEngine.Status status,,) = builderEngine.proposals(0);
        assertEq(uint(status), uint(BuilderEngine.Status.Funded));
    }
}
