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
        // Treasury: 0.02 (High1+2 in setup) + 0.01 (Alice) = 0.03 ETH
        assertEq(address(builderEngine).balance, 0.03 ether);
        assertEq(builderEngine.lockedFunds(), 0);

        // Vote 1
        vm.prank(highRep1);
        builderEngine.approveProposal(0);

        // Vote 2 (Quorum) -> Trigger lock
        vm.prank(highRep2);
        builderEngine.approveProposal(0);

        // Check lock
        assertEq(builderEngine.lockedFunds(), 0.005 ether);
        (,,,, BuilderEngine.Status status,,) = builderEngine.proposals(0);
        assertEq(uint(status), uint(BuilderEngine.Status.Funded));
    }

    function testRevertInsufficientTreasury() public {
        // Panic submit idea requesting 100 ETH
        vm.prank(alice);
        builderEngine.submitProposal("Big Ask", 100 ether); // ID 1

        vm.prank(highRep1);
        builderEngine.approveProposal(1);

        vm.prank(highRep2);
        vm.expectRevert("InsufficientTreasury");
        builderEngine.approveProposal(1);
    }
}
