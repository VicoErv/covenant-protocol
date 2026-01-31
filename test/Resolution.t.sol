// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";

contract ResolutionTest is BaseTest {
    function setUp() public override {
        super.setUp();
        vm.prank(alice);
        covenantJoin.joinCovenant{value: 0.01 ether}();
        
        vm.prank(alice);
        builderEngine.submitProposal("Job", 0.005 ether);

        // Fast forward to Funded
        vm.prank(highRep1); builderEngine.approveProposal(0);
        vm.prank(highRep2); builderEngine.approveProposal(0);

        // Fast forward to Delivered
        vm.prank(alice);
        builderEngine.submitProof(0, "ipfs://proof");
    }

    function testRevertNonAdminResolve() public {
        vm.prank(bob);
        vm.expectRevert("OnlyAdmin");
        builderEngine.resolveProposal(0, true);
    }

    function testResolveSuccessPayoutAndUnlock() public {
        uint256 preBal = alice.balance;
        
        vm.prank(admin);
        builderEngine.resolveProposal(0, true);

        // Payout to Alice
        assertEq(alice.balance, preBal + 0.005 ether);
        
        // Lock released
        assertEq(builderEngine.lockedFunds(), 0);
        
        // Status Completed
        (,,,, BuilderEngine.Status status,,) = builderEngine.proposals(0);
        assertEq(uint(status), uint(BuilderEngine.Status.Completed));
    }

    function testResolveFailRefundAndUnlock() public {
        uint256 preBal = alice.balance;
        uint256 contractBal = address(builderEngine).balance;

        vm.prank(admin);
        builderEngine.resolveProposal(0, false); // Fail

        // No payout
        assertEq(alice.balance, preBal);
        
        // Contract keeps funds (released from lock)
        assertEq(address(builderEngine).balance, contractBal);
        assertEq(builderEngine.lockedFunds(), 0);

        // Status Failed
        (,,,, BuilderEngine.Status status,,) = builderEngine.proposals(0);
        assertEq(uint(status), uint(BuilderEngine.Status.Failed));
    }
}
