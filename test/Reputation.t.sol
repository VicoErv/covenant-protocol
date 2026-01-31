// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";

contract ReputationTest is BaseTest {
    function setUp() public override {
        super.setUp();
        vm.prank(alice);
        covenantJoin.joinCovenant{value: 0.01 ether}();
        
        vm.prank(alice);
        builderEngine.submitProposal("Job", 0.005 ether);

        // Fund & Deliver
        vm.prank(highRep1); builderEngine.approveProposal(0);
        vm.prank(alice); builderEngine.submitProof(0, "p");
    }

    function testReputationGainOnSuccess() public {
        uint256 startRep = reputationLedger.getReputation(alice);
        assertEq(startRep, 0);

        vm.prank(admin);
        builderEngine.resolveProposal(0, true);

        uint256 newRep = reputationLedger.getReputation(alice);
        assertEq(newRep, 5 ether);
    }

    function testNoRepGainOnFailure() public {
        vm.prank(admin);
        builderEngine.resolveProposal(0, false);

        uint256 newRep = reputationLedger.getReputation(alice);
        assertEq(newRep, 0);
    }
    
    function testReputationImmutableDirectly() public {
        vm.prank(alice);
        vm.expectRevert("Only BuilderEngine");
        reputationLedger.increaseReputation(alice, 100);
    }
}
