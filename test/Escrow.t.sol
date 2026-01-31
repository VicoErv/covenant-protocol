// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";

contract EscrowTest is BaseTest {
    function setUp() public override {
        super.setUp();
        vm.prank(alice);
        covenantJoin.joinCovenant{value: 0.01 ether}();
        vm.prank(alice);
        builderEngine.submitProposal("Fund Me", 0.005 ether);
    }

    function testEscrowLocksFunds() public {
        // Treasury from BaseTest: 100 ETH + (Bob+Alice join fees)
        assertGe(address(builderEngine).balance, 100 ether);
        assertEq(builderEngine.lockedFunds(), 0);

        // Vote 1 (Quorum) -> Trigger lock
        vm.prank(highRep1);
        builderEngine.approveProposal(0);

        // Check lock
        assertEq(builderEngine.lockedFunds(), 0.005 ether);
        (,,,, BuilderEngine.Status status,,) = builderEngine.proposals(0);
        assertEq(uint(status), uint(BuilderEngine.Status.Funded));
    }

    function testRevertInsufficientTreasury() public {
        // Panic submit idea requesting 1000 ETH
        vm.prank(alice);
        builderEngine.submitProposal("Big Ask", 1000 ether); // ID 1

        // Vote 1 (Quorum) should fail due to treasury
        vm.prank(highRep1);
        vm.expectRevert("InsufficientTreasury");
        builderEngine.approveProposal(1);
    }
}
